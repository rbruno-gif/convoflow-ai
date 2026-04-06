import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, User, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AISuggestedReplies from '@/components/conversations/AISuggestedReplies';

export default function MessageThread({ conversation }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversation.id }, 'timestamp', 200),
    refetchInterval: 3000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!reply.trim()) return;
    setSending(true);
    const content = reply.trim();
    setReply('');
    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_type: 'agent',
      sender_name: 'Agent',
      content,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    });
    await base44.entities.Conversation.update(conversation.id, {
      last_message: content,
      last_message_time: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setSending(false);
  };

  const handleAIReply = async () => {
    setSending(true);
    const lastUserMsg = [...messages].reverse().find(m => m.sender_type === 'customer');
    if (!lastUserMsg) { setSending(false); return; }

    const [faqs, knowledgeDocs, settingsList] = await Promise.all([
      base44.entities.FAQ.filter({ is_active: true }),
      base44.entities.KnowledgeDoc.filter({ is_active: true }),
      base44.entities.AgentSettings.list(),
    ]);

    const s = settingsList[0];
    const storeName = s?.store_name || 'U2CMobile';
    const persona = s?.ai_persona_name || 'ShopBot';
    const instructions = s?.ai_instructions || '';

    const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const kbContext = knowledgeDocs.map(d => `# ${d.title}\n${d.content}`).join('\n\n');

    const recentHistory = messages.slice(-10).map(m =>
      `${m.sender_type === 'customer' ? 'Customer' : persona}: ${m.content}`
    ).join('\n');

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ${persona}, the official AI support agent for ${storeName}. You represent ${storeName} and speak on their behalf at all times.\n\n${instructions ? `Additional instructions: ${instructions}\n\n` : ''}Use the knowledge base and FAQs below to answer customer questions accurately.\n\n=== KNOWLEDGE BASE ===\n${kbContext}\n\n=== FAQs ===\n${faqContext}\n\n=== CONVERSATION ===\n${recentHistory}\n\nRespond as ${persona} representing ${storeName}. Be helpful, professional, and accurate. Only use information from the knowledge base and FAQs. If you cannot find the answer, apologize and offer to connect the customer with a human agent.`,
      model: "claude_opus_4_6",
    });

    const aiReply = typeof response === 'string' ? response : response?.text || 'Let me connect you to a human agent for this.';
    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_type: 'ai',
      sender_name: 'ShopBot',
      content: aiReply,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    });
    await base44.entities.Conversation.update(conversation.id, {
      last_message: aiReply,
      last_message_time: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setSending(false);
    toast({ title: 'AI replied' });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-5 py-3 border-b bg-card flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
          {conversation.customer_name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm">{conversation.customer_name}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.mode === 'ai' ? '🤖 Handled by AI' : '👤 Handled by Agent'}
            {conversation.assigned_agent && ` · ${conversation.assigned_agent}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-background/50">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* AI Suggested Replies */}
      <div className="border-t bg-card pt-2">
        <AISuggestedReplies messages={messages} onSelect={s => setReply(s)} />
      </div>

      {/* Reply box */}
      <div className="px-4 pb-4 bg-card">
        <Textarea
          placeholder="Type a reply..."
          value={reply}
          onChange={e => setReply(e.target.value)}
          className="resize-none text-sm mb-2"
          rows={2}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        />
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={handleAIReply} disabled={sending} className="text-xs">
            <Bot className="w-3.5 h-3.5 mr-1.5" /> Generate AI Reply
          </Button>
          <Button size="sm" onClick={sendMessage} disabled={sending || !reply.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isCustomer = message.sender_type === 'customer';
  const isAI = message.sender_type === 'ai';

  return (
    <div className={cn('flex gap-2.5', isCustomer ? 'justify-start' : 'justify-end')}>
      {isCustomer && (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <UserCircle className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className={cn('max-w-[70%]')}>
        <div className={cn(
          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
          isCustomer ? 'bg-white border text-foreground rounded-tl-sm' : isAI ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-primary text-primary-foreground rounded-tr-sm'
        )}>
          {message.content}
        </div>
        <p className={cn('text-[10px] text-muted-foreground mt-1', isCustomer ? 'text-left' : 'text-right')}>
          {isAI ? '🤖 ShopBot' : isCustomer ? message.sender_name : '👤 Agent'}
          {message.timestamp && ` · ${format(new Date(message.timestamp), 'h:mm a')}`}
        </p>
      </div>
    </div>
  );
}