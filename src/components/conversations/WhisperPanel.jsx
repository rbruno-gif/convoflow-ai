import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send, Eye } from 'lucide-react';

export default function WhisperPanel({ conversation, currentUser }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const isSupervisor = currentUser?.role === 'supervisor' || currentUser?.role === 'admin';
  const agentEmail = conversation?.assigned_agent;

  if (!isSupervisor || !agentEmail) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);

    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_type: 'supervisor',
      sender_name: currentUser.full_name,
      content: message.trim(),
      timestamp: new Date().toISOString(),
      message_type: 'whisper',
      is_whisper: true,
      whisper_to_agent_email: agentEmail,
      is_read: false,
    });

    qc.invalidateQueries({ queryKey: ['messages', conversation.id] });
    toast({ title: 'Coaching sent', open: true });
    setMessage('');
    setSending(false);
  };

  return (
    <div className="px-4 py-3 border-t-2 border-t-purple-300 bg-purple-50/80 dark:bg-purple-950/40 space-y-3">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <span className="font-semibold text-sm text-purple-900 dark:text-purple-200">
          💬 Private Coaching
        </span>
        <span className="text-xs text-purple-700 dark:text-purple-300 ml-auto">
          Only visible to {agentEmail}
        </span>
      </div>
      <Textarea
        placeholder="Send coaching tips to guide the agent..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="resize-none text-sm h-14 bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setMessage('')}
          disabled={sending || !message.trim()}
          className="text-xs"
        >
          Clear
        </Button>
        <Button
          size="sm"
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Send className="w-3.5 h-3.5" /> Send Coaching
        </Button>
      </div>
    </div>
  );
}