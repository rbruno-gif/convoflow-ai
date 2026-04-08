import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, User, UserCircle, Send, CheckCircle, PhoneIncoming, AlertTriangle, MessageSquare as MessageSquareIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LiveConversationPanel({ conversation, user, onUpdate }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [actionState, setActionState] = useState({});
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversation.id }, 'timestamp', 200),
    refetchInterval: 3000,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === conversation.id) {
        qc.invalidateQueries({ queryKey: ['messages', conversation.id] });
      }
    });
    return unsub;
  }, [conversation.id]);

  const messages = allMessages.filter(msg => {
    if (msg.is_whisper) return user?.role === 'supervisor' || user?.email === msg.whisper_to_agent_email;
    return true;
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const setAction = (key, val) => {
    setActionState(s => ({ ...s, [key]: val }));
    if (val === 'done') setTimeout(() => setActionState(s => ({ ...s, [key]: null })), 2000);
  };

  const sendMessage = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const content = reply.trim();
    setReply('');
    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_type: 'agent',
      sender_name: user?.full_name || 'Agent',
      content,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    });
    await base44.entities.Conversation.update(conversation.id, {
      last_message: content,
      last_message_time: new Date().toISOString(),
      mode: 'human',
    });
    qc.invalidateQueries({ queryKey: ['messages', conversation.id] });
    qc.invalidateQueries({ queryKey: ['live-conversations'] });
    onUpdate?.();
    setSending(false);
  };

  const takeOver = async () => {
    setAction('takeover', 'loading');
    await base44.entities.Conversation.update(conversation.id, {
      mode: 'human',
      status: 'active',
      assigned_agent: user?.email || '',
    });
    // Post a system message
    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_type: 'agent',
      sender_name: user?.full_name || 'Agent',
      content: `👤 ${user?.full_name || 'An agent'} has joined this conversation.`,
      timestamp: new Date().toISOString(),
      message_type: 'handoff',
    });
    qc.invalidateQueries({ queryKey: ['messages', conversation.id] });
    qc.invalidateQueries({ queryKey: ['live-conversations'] });
    setAction('takeover', 'done');
    onUpdate?.();
  };

  const resolve = async () => {
    setAction('resolve', 'loading');
    await base44.entities.Conversation.update(conversation.id, {
      status: 'resolved',
      resolution_status: 'resolved',
    });
    qc.invalidateQueries({ queryKey: ['live-conversations'] });
    setAction('resolve', 'done');
    onUpdate?.();
  };

  const handbackToAI = async () => {
    setAction('handback', 'loading');
    await base44.entities.Conversation.update(conversation.id, {
      mode: 'ai',
      status: 'active',
      assigned_agent: '',
    });
    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_type: 'ai',
      sender_name: 'System',
      content: '🤖 Conversation handed back to AI assistant.',
      timestamp: new Date().toISOString(),
      message_type: 'handoff',
    });
    qc.invalidateQueries({ queryKey: ['messages', conversation.id] });
    qc.invalidateQueries({ queryKey: ['live-conversations'] });
    setAction('handback', 'done');
    onUpdate?.();
  };

  const isHandoff = conversation.status === 'human_requested' || conversation.status === 'flagged';
  const isAgentOwned = conversation.mode === 'human';
  const isResolved = conversation.status === 'resolved';

  return (
    <div className="flex h-full">
      {/* Main chat */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: isHandoff ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            {conversation.customer_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">{conversation.customer_name}</p>
            <p className="text-xs text-gray-400">
              {conversation.mode === 'ai' ? '🤖 AI Handling' : `👤 ${conversation.assigned_agent || 'Agent'}`}
              {conversation.last_message_time && ` · ${formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isHandoff && !isAgentOwned && (
              <ActionBtn id="takeover" icon={PhoneIncoming} label="Take Over" state={actionState['takeover']}
                onClick={takeOver} className="bg-orange-500 hover:bg-orange-600 text-white" />
            )}
            {isAgentOwned && !isResolved && (
              <ActionBtn id="handback" icon={Bot} label="Hand to AI" state={actionState['handback']}
                onClick={handbackToAI} className="bg-violet-100 hover:bg-violet-200 text-violet-700" />
            )}
            {!isResolved && (
              <ActionBtn id="resolve" icon={CheckCircle} label="Resolve" state={actionState['resolve']}
                onClick={resolve} className="bg-green-100 hover:bg-green-200 text-green-700" />
            )}
            {isResolved && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5" /> Resolved
              </span>
            )}
          </div>
        </div>

        {/* Handoff banner */}
        {isHandoff && !isResolved && (
          <div className="flex items-center gap-3 px-5 py-3 bg-orange-50 border-b border-orange-100 shrink-0">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <p className="text-xs text-orange-700 font-medium">
              {conversation.status === 'human_requested' ? 'Customer has requested a human agent — take over to handle this conversation.' : `Flagged: ${conversation.flagged_reason || 'Requires attention'}`}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: '#f9fafb' }}>
          {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquareIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No messages yet</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!isResolved && (
          <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2 items-end shrink-0">
            {conversation.mode === 'ai' && !isAgentOwned && (
              <div className="flex items-center gap-2 text-xs text-violet-600 bg-violet-50 px-3 py-2 rounded-xl border border-violet-100 flex-1">
                <Bot className="w-3.5 h-3.5 shrink-0" />
                AI is handling — click <strong>Take Over</strong> to join
              </div>
            )}
            {(isAgentOwned || isHandoff) && (
              <>
                <textarea
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  rows={2}
                  className="flex-1 resize-none text-sm rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button onClick={sendMessage} disabled={sending || !reply.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <ConvoSidebar conversation={conversation} />
    </div>
  );
}

function ActionBtn({ id, icon: Icon, label, state, onClick, className }) {
  return (
    <button onClick={onClick} disabled={state === 'loading'}
      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', className,
        state === 'done' && '!bg-green-100 !text-green-700',
        state === 'loading' && 'opacity-60 cursor-wait'
      )}>
      {state === 'done' ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
      {state === 'done' ? 'Done!' : state === 'loading' ? '...' : label}
    </button>
  );
}

function ConvoSidebar({ conversation }) {
  return (
    <div className="w-60 shrink-0 border-l border-gray-100 bg-white flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Conversation Info</p>
        <div className="space-y-2.5">
          <InfoRow label="Status" value={
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold',
              conversation.status === 'resolved' ? 'bg-green-100 text-green-700' :
              conversation.status === 'flagged' ? 'bg-red-100 text-red-700' :
              conversation.status === 'human_requested' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-600')}>{conversation.status?.replace('_', ' ')}</span>
          } />
          <InfoRow label="Mode" value={
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold',
              conversation.mode === 'ai' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700')}>
              {conversation.mode === 'ai' ? '🤖 AI' : '👤 Human'}
            </span>
          } />
          {conversation.assigned_agent && <InfoRow label="Agent" value={<span className="text-[11px] text-gray-600">{conversation.assigned_agent}</span>} />}
          {conversation.sentiment && (
            <InfoRow label="Sentiment" value={
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                conversation.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                conversation.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>
                {conversation.sentiment === 'positive' ? '😊 Positive' : conversation.sentiment === 'negative' ? '😞 Negative' : '😐 Neutral'}
              </span>
            } />
          )}
          {conversation.intent && <InfoRow label="Intent" value={<span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{conversation.intent?.replace(/_/g, ' ')}</span>} />}
          {conversation.last_message_time && <InfoRow label="Last activity" value={<span className="text-[11px] text-gray-500">{formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}</span>} />}
        </div>
      </div>
      {conversation.conversation_summary && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">AI Summary</p>
          <p className="text-xs text-gray-600 leading-relaxed">{conversation.conversation_summary}</p>
        </div>
      )}
      {conversation.flagged_reason && (
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Flagged Reason</p>
          <p className="text-xs text-red-600 leading-relaxed">{conversation.flagged_reason}</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-gray-400 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function MessageBubble({ message }) {
  const isCustomer = message.sender_type === 'customer';
  const isAI = message.sender_type === 'ai';
  const isHandoff = message.message_type === 'handoff';

  if (isHandoff) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
      {isCustomer && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
          <UserCircle className="w-4 h-4 text-gray-500" />
        </div>
      )}
      <div className="max-w-[70%]">
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isCustomer ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm' : 'text-white rounded-tr-sm'}`}
          style={!isCustomer ? { background: isAI ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, #4f46e5, #3730a3)' } : {}}>
          {message.content}
        </div>
        <p className={`text-[10px] text-gray-400 mt-1 ${isCustomer ? 'text-left' : 'text-right'}`}>
          {isAI ? '🤖 AI' : isCustomer ? (message.sender_name || 'Customer') : `👤 ${message.sender_name || 'Agent'}`}
          {message.timestamp && ` · ${format(new Date(message.timestamp), 'h:mm a')}`}
        </p>
      </div>
    </div>
  );
}