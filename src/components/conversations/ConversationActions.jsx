import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Flag, UserCheck, CheckCircle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function ConversationActions({ conversation }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const update = async (data) => {
    await base44.entities.Conversation.update(conversation.id, data);
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['agent-inbox'] });
  };

  const flagConvo = () => {
    update({ status: 'flagged', flagged_reason: 'Manually flagged by agent' });
    toast({ title: 'Conversation flagged' });
  };

  const takeOver = () => {
    update({ mode: 'human', status: 'active', assigned_agent: currentUser?.email || '' });
    toast({ title: 'Switched to human mode' });
  };

  const handBack = () => {
    update({ mode: 'ai', status: 'active', assigned_agent: '' });
    toast({ title: 'Handed back to AI' });
  };

  const resolve = () => {
    update({ status: 'resolved' });
    toast({ title: 'Conversation resolved' });
  };

  return (
    <div className="px-4 py-3 border-t bg-card flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground mr-1">Actions:</span>
      {conversation.status !== 'flagged' && (
        <Button variant="outline" size="sm" onClick={flagConvo} className="text-xs h-7 text-orange-600 border-orange-200 hover:bg-orange-50">
          <Flag className="w-3 h-3 mr-1" /> Flag
        </Button>
      )}
      {conversation.mode === 'ai' ? (
        <Button variant="outline" size="sm" onClick={takeOver} className="text-xs h-7 text-blue-600 border-blue-200 hover:bg-blue-50">
          <UserCheck className="w-3 h-3 mr-1" /> Take Over
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={handBack} className="text-xs h-7 text-purple-600 border-purple-200 hover:bg-purple-50">
          <Bot className="w-3 h-3 mr-1" /> Hand to AI
        </Button>
      )}
      {conversation.status !== 'resolved' && (
        <Button variant="outline" size="sm" onClick={resolve} className="text-xs h-7 text-green-600 border-green-200 hover:bg-green-50">
          <CheckCircle className="w-3 h-3 mr-1" /> Resolve
        </Button>
      )}
    </div>
  );
}