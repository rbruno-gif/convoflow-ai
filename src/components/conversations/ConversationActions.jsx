import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Flag, CheckCircle, Zap, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConversationActions({ conversation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const flag = async () => {
    setLoading(true);
    await base44.entities.Conversation.update(conversation.id, { status: 'flagged' });
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['flagged'] });
    const t = toast({ title: 'Conversation flagged' });
    setTimeout(() => t.dismiss(), 4000);
    setLoading(false);
  };

  const resolve = async () => {
    setLoading(true);
    await base44.entities.Conversation.update(conversation.id, {
      status: 'resolved',
      resolution_status: 'resolved',
      mode: 'ai',
    });
    qc.invalidateQueries({ queryKey: ['conversations'] });
    const t = toast({ title: 'Marked as resolved' });
    setTimeout(() => t.dismiss(), 4000);
    setLoading(false);
  };

  const handoffToAgent = async () => {
    setLoading(true);
    await base44.entities.Conversation.update(conversation.id, {
      status: 'human_requested',
      mode: 'human',
      assigned_agent: user?.email,
      ai_resolution_attempted: true,
    });
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['agent-inbox'] });
    const t = toast({ title: 'Handed off to human agent' });
    setTimeout(() => t.dismiss(), 4000);
    setLoading(false);
  };

  const summarizeNow = async () => {
    setLoading(true);
    await base44.functions.invoke('generateConversationSummary', {
      conversation_id: conversation.id,
    });
    qc.invalidateQueries({ queryKey: ['conversations'] });
    const t = toast({ title: 'Summary generated' });
    setTimeout(() => t.dismiss(), 4000);
    setLoading(false);
  };

  const analyzeIntentNow = async () => {
    setLoading(true);
    await base44.functions.invoke('analyzeConversationIntent', {
      conversation_id: conversation.id,
    });
    qc.invalidateQueries({ queryKey: ['conversations'] });
    const t = toast({ title: 'Intent analyzed' });
    setTimeout(() => t.dismiss(), 4000);
    setLoading(false);
  };

  return (
    <div className="px-5 py-3 border-t bg-card flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={conversation.status === 'flagged' ? 'default' : 'outline'}
        onClick={flag}
        disabled={loading}
        className="gap-2 text-xs"
      >
        <Flag className="w-3.5 h-3.5" /> Flag
      </Button>

      <Button
        size="sm"
        variant={conversation.mode === 'human' ? 'default' : 'outline'}
        onClick={handoffToAgent}
        disabled={loading || conversation.mode === 'human'}
        className="gap-2 text-xs"
      >
        <User className="w-3.5 h-3.5" /> Handoff to Agent
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={summarizeNow}
        disabled={loading}
        className="gap-2 text-xs"
      >
        <Bot className="w-3.5 h-3.5" /> Summarize
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={analyzeIntentNow}
        disabled={loading}
        className="gap-2 text-xs"
      >
        <Zap className="w-3.5 h-3.5" /> Analyze Intent
      </Button>

      <Button
        size="sm"
        variant={conversation.status === 'resolved' ? 'default' : 'outline'}
        onClick={resolve}
        disabled={loading}
        className="gap-2 text-xs ml-auto"
      >
        <CheckCircle className="w-3.5 h-3.5" /> Resolve
      </Button>
    </div>
  );
}