import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, User, UserCircle, Send, Flag, UserCheck, CheckCircle, Zap, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function MessageThread({ conversation, onUpdate, onInsertReply, externalReply }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [actionState, setActionState] = useState({});
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (externalReply) setReply(externalReply);
  }, [externalReply]);
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversation.id }, 'timestamp', 200),
    refetchInterval: 3000,
  });

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
    if (!reply.trim()) return;
    setSending(true);
    const content = reply.trim();
    setReply('');
    try {
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
      });
      qc.invalidateQueries({ queryKey: ['messages', conversation.id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to send message', variant: 'destructive' });
      setReply(content);
    } finally {
      setSending(false);
    }
  };

  const handleAIReply = async () => {
    setSending(true);
    setAction('ai', 'loading');
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.sender_type === 'customer');
      if (!lastUserMsg) { setSending(false); setAction('ai', null); return; }

      const [faqs, knowledgeDocs, settingsList] = await Promise.all([
        base44.entities.FAQ.filter({ is_active: true }),
        base44.entities.KnowledgeDoc.filter({ is_active: true }),
        base44.entities.AgentSettings.list(),
      ]);

      const s = settingsList[0];
      const instructions = s?.ai_instructions || '';
      const persona = s?.ai_persona_name || 'U2C AI Assistant';
      const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      const kbContext = knowledgeDocs.map(d => `# ${d.title}\n${d.content}`).join('\n\n');
      const recentHistory = messages.slice(-10).map(m =>
        `${m.sender_type === 'customer' ? 'Customer' : persona}: ${m.content}`
      ).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${instructions}\n\nKNOWLEDGE BASE:\n${kbContext}\n\nFAQs:\n${faqContext}\n\nCONVERSATION:\n${recentHistory}\n\nRespond as ${persona}. Be concise, warm, and helpful.`,
        model: 'gpt_5_mini',
      });

      const aiReply = typeof response === 'string' ? response : response?.text || 'Let me connect you with a human agent.';
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_type: 'ai',
        sender_name: persona,
        content: aiReply,
        timestamp: new Date().toISOString(),
        message_type: 'text',
      });
      await base44.entities.Conversation.update(conversation.id, {
        last_message: aiReply,
        last_message_time: new Date().toISOString(),
        ai_resolution_attempted: true,
      });
      qc.invalidateQueries({ queryKey: ['messages', conversation.id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setAction('ai', 'done');
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'AI reply failed', variant: 'destructive' });
      setAction('ai', null);
    } finally {
      setSending(false);
    }
  };

  const flagConversation = async () => {
    setAction('flag', 'loading');
    try {
      await base44.entities.Conversation.update(conversation.id, { status: 'flagged' });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setAction('flag', 'done');
      onUpdate?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to flag', variant: 'destructive' });
      setAction('flag', null);
    }
  };

  const handoffToAgent = async () => {
    setAction('handoff', 'loading');
    try {
      await base44.entities.Conversation.update(conversation.id, { mode: 'human', status: 'human_requested' });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setAction('handoff', 'done');
      onUpdate?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to handoff', variant: 'destructive' });
      setAction('handoff', null);
    }
  };

  const resolveConversation = async () => {
    setAction('resolve', 'loading');
    try {
      await base44.entities.Conversation.update(conversation.id, { status: 'resolved', resolution_status: 'resolved' });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setAction('resolve', 'done');
      onUpdate?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to resolve', variant: 'destructive' });
      setAction('resolve', null);
    }
  };

  const ActionBtn = ({ id, icon: Icon, label, onClick, color = 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' }) => {
    const state = actionState[id];
    return (
      <button
        onClick={onClick}
        disabled={state === 'loading'}
        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', color,
          state === 'done' && '!text-green-600 !bg-green-50',
          state === 'loading' && 'opacity-60 cursor-wait'
        )}
      >
        {state === 'done' ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
        {state === 'done' ? 'Done!' : state === 'loading' ? '...' : label}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {conversation.customer_name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{conversation.customer_name}</p>
          <p className="text-xs text-gray-400">
            {conversation.mode === 'ai' ? '🤖 AI Handled' : '👤 Agent Handled'}
            {conversation.assigned_agent && ` · ${conversation.assigned_agent}`}
          </p>
        </div>
        {/* Action bar */}
        <div className="flex items-center gap-1">
          <ActionBtn id="flag" icon={Flag} label="Flag" onClick={flagConversation}
            color="text-orange-500 hover:text-orange-700 hover:bg-orange-50" />
          <ActionBtn id="handoff" icon={UserCheck} label="Handoff" onClick={handoffToAgent}
            color="text-blue-500 hover:text-blue-700 hover:bg-blue-50" />
          <ActionBtn id="resolve" icon={CheckCircle} label="Resolve" onClick={resolveConversation}
            color="text-green-500 hover:text-green-700 hover:bg-green-50" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: '#f9fafb' }}>
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* AI Suggested quick reply hint */}
      <div className="px-4 pt-2 bg-white border-t border-gray-100">
        <p className="text-[10px] text-gray-400 mb-1">Type <span className="font-mono bg-gray-100 px-1 rounded">/</span> for quick replies · <span className="text-violet-500">Enter</span> to send</p>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 bg-white flex gap-2 items-end">
        <textarea
          placeholder="Type a reply..."
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          rows={2}
          className="flex-1 resize-none text-sm rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleAIReply}
            disabled={sending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-violet-600 border border-violet-200 hover:bg-violet-50 transition-colors disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" /> AI
          </button>
          <button
            onClick={sendMessage}
            disabled={sending || !reply.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isCustomer = message.sender_type === 'customer';
  const isAI = message.sender_type === 'ai';
  const isWhisper = message.is_whisper;

  const renderContent = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="underline font-semibold hover:opacity-80 break-all">{part}</a>
      ) : part
    );
  };

  if (isWhisper) {
    return (
      <div className="flex gap-2.5 justify-end my-3">
        <div className="max-w-[75%] px-4 py-3 rounded-xl bg-purple-50 border border-purple-200">
          <p className="text-[10px] font-bold text-purple-600 mb-1 uppercase tracking-wide">🎓 Coaching (Private)</p>
          <p className="text-sm text-purple-900">{renderContent(message.content)}</p>
          <p className="text-[10px] text-purple-400 mt-1">{message.sender_name} · {message.timestamp && format(new Date(message.timestamp), 'h:mm a')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2.5', isCustomer ? 'justify-start' : 'justify-end')}>
      {isCustomer && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
          <UserCircle className="w-4 h-4 text-gray-500" />
        </div>
      )}
      <div className="max-w-[70%]">
        <div className={cn(
          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
          isCustomer
            ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
            : isAI
              ? 'text-white rounded-tr-sm'
              : 'text-white rounded-tr-sm',
        )}
          style={!isCustomer ? { background: isAI ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, #4f46e5, #3730a3)' } : {}}
        >
          {renderContent(message.content)}
        </div>
        <p className={cn('text-[10px] text-gray-400 mt-1', isCustomer ? 'text-left' : 'text-right')}>
          {isAI ? '🤖 AI' : isCustomer ? message.sender_name : '👤 Agent'}
          {message.timestamp && ` · ${format(new Date(message.timestamp), 'h:mm a')}`}
        </p>
      </div>
    </div>
  );
}