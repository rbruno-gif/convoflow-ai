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

  const isSupervisor = currentUser?.role === 'supervisor';
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
    <div className="px-4 py-3 border-t bg-purple-50 dark:bg-purple-950/30 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
        <Eye className="w-3.5 h-3.5" /> Coaching for {agentEmail}
      </div>
      <Textarea
        placeholder="Send private coaching to the agent..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="resize-none text-sm h-16"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="gap-2"
        >
          <Send className="w-3.5 h-3.5" /> Send to Agent
        </Button>
      </div>
    </div>
  );
}