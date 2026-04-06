import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, UserCheck, Bot, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import MessageThread from '@/components/conversations/MessageThread';
import ConversationActions from '@/components/conversations/ConversationActions';
import { useToast } from '@/components/ui/use-toast';

const sentimentCache = {};

function useSentiment(conversationId, lastMessageTime) {
  const [sentiment, setSentiment] = useState(null);
  const prevKey = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    const cacheKey = `${conversationId}__${lastMessageTime}`;
    if (sentimentCache[cacheKey]) { setSentiment(sentimentCache[cacheKey]); return; }
    if (prevKey.current === cacheKey) return;
    prevKey.current = cacheKey;
    let cancelled = false;
    (async () => {
      const messages = await base44.entities.Message.filter({ conversation_id: conversationId }, 'timestamp', 50);
      const customerMsgs = messages.filter(m => m.sender_type === 'customer').slice(-5).map(m => m.content);
      if (customerMsgs.length === 0) { if (!cancelled) setSentiment('Neutral'); return; }
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the sentiment of the following customer messages and classify as Positive, Neutral, or Negative.\n\n${customerMsgs.map((m, i) => `${i + 1}. ${m}`).join('\n')}`,
        response_json_schema: { type: 'object', properties: { sentiment: { type: 'string', enum: ['Positive', 'Neutral', 'Negative'] } } },
      });
      const score = result?.sentiment || 'Neutral';
      sentimentCache[cacheKey] = score;
      if (!cancelled) setSentiment(score);
    })();
    return () => { cancelled = true; };
  }, [conversationId, lastMessageTime]);

  return sentiment;
}

export default function AgentInbox() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Conversations needing human: human_requested, flagged, or mode=human
  const { data: conversations = [] } = useQuery({
    queryKey: ['agent-inbox'],
    queryFn: () => base44.entities.Conversation.list('-last_message_time', 200),
    refetchInterval: 5000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents-list'],
    queryFn: () => base44.entities.User.list(),
  });

  const needsHuman = conversations.filter(c =>
    c.status === 'human_requested' || c.status === 'flagged' || c.mode === 'human'
  );
  const myChats = needsHuman.filter(c => c.assigned_agent === user?.email);
  const unassigned = needsHuman.filter(c => !c.assigned_agent || c.assigned_agent === '');
  const aiChats = conversations.filter(c => c.mode === 'ai' && c.status !== 'resolved');

  const selectedConv = conversations.find(c => c.id === selected);

  const assignConversation = async (conv, agentEmail) => {
    await base44.entities.Conversation.update(conv.id, {
      assigned_agent: agentEmail,
      mode: 'human',
      status: 'active',
    });
    qc.invalidateQueries({ queryKey: ['agent-inbox'] });
    setSelected(conv.id);
    toast({ title: `Assigned to ${agentEmail}` });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="w-80 border-r flex flex-col shrink-0 bg-card">
        <div className="p-4 border-b">
          <h2 className="font-bold text-base">Agent Inbox</h2>
          {user && <p className="text-xs text-muted-foreground mt-0.5">Logged in as {user.email}</p>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* My active chats */}
          {myChats.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-1">My Chats ({myChats.length})</p>
              {myChats.map(conv => (
                <ConvRow key={conv.id} conv={conv} selected={selected} onSelect={setSelected} agents={agents} />
              ))}
            </div>
          )}

          {/* Unassigned queue */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-1">
              Queue ({unassigned.length})
            </p>
            {unassigned.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No chats waiting 🎉</p>
            ) : (
              unassigned.map(conv => (
                 <ConvRow
                   key={conv.id}
                   conv={conv}
                   selected={selected}
                   onSelect={setSelected}
                   agents={agents}
                   onAssign={(email) => assignConversation(conv, email)}
                 />
               ))
            )}
          </div>

          {/* AI ongoing conversations */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-1 flex items-center gap-1">
              <Bot className="w-3 h-3" /> AI Active ({aiChats.length})
            </p>
            {aiChats.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No AI conversations</p>
            ) : (
              aiChats.map(conv => (
                <ConvRow
                  key={conv.id}
                  conv={conv}
                  selected={selected}
                  onSelect={setSelected}
                  agents={agents}
                  onAssign={(email) => assignConversation(conv, email)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: message thread */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedConv ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 overflow-hidden">
              <MessageThread conversation={selectedConv} />
            </div>
            <ConversationActions conversation={selectedConv} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-3">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

const sentimentStyles = {
  Positive: 'bg-green-100 text-green-700',
  Neutral: 'bg-slate-100 text-slate-600',
  Negative: 'bg-red-100 text-red-700',
};

function ConvRow({ conv, selected, onSelect, agents, onAssign }) {
  const statusColor = {
    flagged: 'bg-orange-100 text-orange-700',
    human_requested: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
  };

  const sentiment = useSentiment(conv.id, conv.last_message_time);

  return (
    <div
      onClick={() => onSelect(conv.id)}
      className={cn(
        'px-4 py-3 cursor-pointer hover:bg-muted/50 border-b transition-colors',
        selected === conv.id && 'bg-accent',
        conv.is_urgent && 'border-l-2 border-l-destructive bg-destructive/5'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-medium truncate">{conv.customer_name}</p>
            {sentiment && (
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0', sentimentStyles[sentiment])}>
                {sentiment}
              </span>
            )}
            {conv.unread_count > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center shrink-0">
                {conv.unread_count}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', statusColor[conv.status] || 'bg-muted text-muted-foreground')}>
              {conv.status?.replace('_', ' ')}
            </span>
            {conv.is_urgent && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-destructive/10 text-destructive">
                URGENT
              </span>
            )}
            {conv.last_message_time && (
              <span className="text-[9px] text-muted-foreground">
                {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        {!conv.assigned_agent && agents && (
          <Select onValueChange={(email) => { onAssign(email); }}>
            <SelectTrigger className="w-32 h-8 text-[10px]" onClick={e => e.stopPropagation()}>
              <SelectValue placeholder="Assign..." />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.email}>
                  {agent.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}