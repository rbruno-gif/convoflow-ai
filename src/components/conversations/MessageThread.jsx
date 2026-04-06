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
import ConversationContext from '@/components/conversations/ConversationContext';
import ConversationActions from '@/components/conversations/ConversationActions';
import FAQSuggestionForm from '@/components/faqs/FAQSuggestionForm';
import WhisperPanel from '@/components/conversations/WhisperPanel';

export default function MessageThread({ conversation }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showFAQSuggestion, setShowFAQSuggestion] = useState(null);
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversation.id }, 'timestamp', 200),
    refetchInterval: 3000,
  });

  // Filter whispers: only show to agent they're for and supervisors
  const messages = allMessages.filter(msg => {
    if (msg.is_whisper) {
      return user?.role === 'supervisor' || user?.email === msg.whisper_to_agent_email;
    }
    return true;
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

  const suggestFAQ = async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender_type === 'customer');
    const lastAIMsg = [...messages].reverse().find(m => m.sender_type === 'ai');
    
    if (!lastUserMsg || !lastAIMsg) return;

    // Use AI to extract a proper Q&A from the conversation
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract a clear, concise FAQ from this customer support exchange. Return a JSON object with "question" and "answer" fields.\n\nCustomer: ${lastUserMsg.content}\n\nAgent: ${lastAIMsg.content}`,
      response_json_schema: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
      },
    });

    setShowFAQSuggestion(result);
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
      prompt: `You are ShopBot AI, a professional customer support and sales assistant for a mobile wireless company. Your job is to help customers quickly, clearly, and confidently by answering questions, recommending the right plan, solving simple issues, collecting lead information, and escalating to a human agent when needed.

TONE: Always sound friendly, professional, confident, helpful, patient, concise, and human—not robotic or vague.

CORE BEHAVIORS:
1. If this is the start of a conversation (no previous messages), greet warmly and ask for their name
2. Understand customer intent first, then respond directly

2. IF ASKING ABOUT PLANS - Follow this product recommendation flow:
   a) Identify the need: Does customer want a new plan, upgrade, or exploring options?
   b) Ask smart qualifying questions ONE at a time:
      - "How much data do you typically use monthly? (Light user, moderate, or heavy?)"
      - "What's your budget? (Budget-friendly, mid-range, or premium?)"
      - "Which U2C brand appeals to you: Blue (our flagship), Pink (value-focused), or Red (premium)?"
      - "Are you bringing your current phone or need a new one?"
   c) Based on answers, recommend ONE specific plan:
      - State the plan name clearly
      - Explain 2-3 key benefits that match THEIR needs
      - Example: "Based on your heavy video streaming use, I'd recommend U2C Blue Unlimited. It gives you truly unlimited data, plus the fastest network priority on our T-Mobile backbone. You'll never hit a limit."
   d) Move toward activation and offer signup options:
      - Ask if they're ready to activate
      - Offer two options: "You can sign up directly in our app, or I can send you a link right here in chat to activate this plan"
      - If they choose app: Guide them to download/open the app
      - If they choose link: Send the personalized signup link via chat immediately

3. If asking about support: Answer clearly. If easy, solve it. If it needs account review, collect their details
4. If ready to buy: Move toward conversion with a clear recommendation, benefit explanation, and next step
5. If confused: Simplify and offer options
6. If upset: Acknowledge frustration, then move to resolution
7. Always keep replies SHORT but useful—1-2 sentences max, under 30 words
8. Never leave customer without a next step

LEAD CAPTURE - If interested but not ready to buy, collect: name, phone number, email, what they're interested in, preferred follow-up time

KNOWLEDGE BASE & FAQs:
${kbContext}

${faqContext}

CONVERSATION:
${recentHistory}

Now respond as ShopBot for U2C Mobile (U2C Blue, U2C Pink, U2C Red brands). Be proactive, helpful, and move the conversation forward. Every response should solve an issue, qualify the customer, recommend an option, or collect details. Do not act like a generic chatbot—act like a smart support rep helping customers make progress quickly.`,
      model: "gpt_5_mini",
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
      ai_resolution_attempted: true,
    });
    queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setSending(false);
    toast({ title: 'AI attempted to resolve' });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Context Panel */}
      <ConversationContext conversation={conversation} />

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

      {/* FAQ Suggestion Modal */}
      {showFAQSuggestion && (
        <div className="px-4 py-3 border-t bg-accent/20">
          <FAQSuggestionForm
            conversation={showFAQSuggestion}
            onClose={() => setShowFAQSuggestion(null)}
          />
        </div>
      )}

      {/* Whisper Panel for Supervisors */}
      <WhisperPanel conversation={conversation} currentUser={user} />

      {/* Actions */}
      <ConversationActions conversation={conversation} onSuggestFAQ={suggestFAQ} />

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
  const isSupervisor = message.sender_type === 'supervisor';
  const isWhisper = message.is_whisper;

  const renderContent = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:opacity-80 break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (isWhisper) {
    return (
      <div className="flex gap-2.5 justify-end my-3">
        <div className="max-w-[75%]">
          <div className="px-4 py-3 rounded-lg bg-purple-100 dark:bg-purple-900/50 border-l-4 border-l-purple-500 dark:border-l-purple-400">
            <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 mb-1.5 uppercase tracking-wide">
              🎓 Coaching Message (Private)
            </p>
            <p className="text-sm text-purple-900 dark:text-purple-100 leading-relaxed">
              {renderContent(message.content)}
            </p>
          </div>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1.5 text-right font-medium">
            {message.sender_name} • {message.timestamp && format(new Date(message.timestamp), 'h:mm a')}
          </p>
        </div>
      </div>
    );
  }

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
          {renderContent(message.content)}
        </div>
        <p className={cn('text-[10px] text-muted-foreground mt-1', isCustomer ? 'text-left' : 'text-right')}>
          {isAI ? '🤖 ShopBot' : isCustomer ? message.sender_name : '👤 Agent'}
          {message.timestamp && ` · ${format(new Date(message.timestamp), 'h:mm a')}`}
        </p>
      </div>
    </div>
  );
}