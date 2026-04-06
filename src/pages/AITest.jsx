import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, User, Send, Trash2, RefreshCw, Zap, Lightbulb, Flag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AITest() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('general');
  const [intent, setIntent] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [summary, setSummary] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const bottomRef = useRef(null);

  const scenarios = [
    { id: 'general', label: 'General Support' },
    { id: 'order', label: 'Order Inquiry' },
    { id: 'angry', label: 'Angry Customer' },
    { id: 'return', label: 'Return Request' },
    { id: 'shipping', label: 'Shipping Question' },
  ];

  const starterMessages = {
    general: "Hi, I need some help!",
    order: "Where is my order? I placed it 5 days ago.",
    angry: "This is unacceptable! I've been waiting 2 weeks and nobody is helping me!",
    return: "I'd like to return a product I bought last week.",
    shipping: "Do you ship internationally? How long does it take?",
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const analyzeIntent = async () => {
    setAnalyzing(true);
    const history = messages.map(m => `${m.role === 'customer' ? 'Customer' : 'ShopBot'}: ${m.content}`).join('\n');
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the following customer support conversation and determine:
1. The primary intent/category
2. The overall sentiment (Positive, Neutral, or Negative)

Conversation:
${history}

Return a JSON object with "intent" and "sentiment" fields.`,
      response_json_schema: {
        type: 'object',
        properties: {
          intent: { type: 'string', enum: ['order_inquiry', 'product_support', 'billing_issue', 'complaint', 'feedback', 'returns_refunds', 'shipping', 'general_question', 'other'] },
          sentiment: { type: 'string', enum: ['Positive', 'Neutral', 'Negative'] },
        },
      },
    });

    setIntent(result?.intent || null);
    setSentiment(result?.sentiment || null);
    setAnalyzing(false);
  };

  const generateSummary = async () => {
    setAnalyzing(true);
    const history = messages.map(m => `${m.role === 'customer' ? 'Customer' : 'ShopBot'}: ${m.content}`).join('\n');
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Summarize the following customer support conversation in 2-3 sentences:

${history}`,
    });

    setSummary(typeof result === 'string' ? result : result?.text || null);
    setAnalyzing(false);
  };

  const sendMessage = async (content) => {
    const userMsg = { role: 'customer', content, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = [...messages, userMsg]
      .map(m => `${m.role === 'customer' ? 'Customer' : 'ShopBot'}: ${m.content}`)
      .join('\n');

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

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ShopBot AI, a professional customer support and sales assistant for a mobile wireless company. Your job is to help customers quickly, clearly, and confidently by answering questions, recommending the right plan, solving simple issues, collecting lead information, and escalating to a human agent when needed.

TONE: Always sound friendly, professional, confident, helpful, patient, concise, and human—not robotic or vague.

CORE BEHAVIORS:
1. Understand customer intent first, then respond directly

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
      - Offer two options: "You can sign up directly in our app, or I can send you a link to activate this plan"
      - If they choose app: Guide them to download/open the app
      - If they choose link: Offer to send them a personalized signup link with their plan details

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
${history}

Now respond as ShopBot for U2C Mobile (U2C Blue, U2C Pink, U2C Red brands). Be proactive, helpful, and move the conversation forward. Every response should solve an issue, qualify the customer, recommend an option, or collect details. Do not act like a generic chatbot—act like a smart support rep helping customers make progress quickly.`,
      model: "gpt_5_mini",
    });

    const aiReply = typeof result === 'string' ? result : result?.text || "I'm here to help! Could you provide more details?";
    setMessages(prev => [...prev, { role: 'ai', content: aiReply, time: new Date() }]);
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const loadScenario = () => {
    setMessages([]);
    setIntent(null);
    setSentiment(null);
    setSummary(null);
    setTimeout(() => sendMessage(starterMessages[scenario]), 100);
  };

  const intentColors = {
    order_inquiry: 'bg-blue-100 text-blue-700',
    product_support: 'bg-purple-100 text-purple-700',
    billing_issue: 'bg-orange-100 text-orange-700',
    complaint: 'bg-red-100 text-red-700',
    returns_refunds: 'bg-amber-100 text-amber-700',
    shipping: 'bg-cyan-100 text-cyan-700',
    general_question: 'bg-slate-100 text-slate-700',
    other: 'bg-gray-100 text-gray-700',
  };

  const sentimentColors = {
    Positive: 'bg-green-100 text-green-700',
    Neutral: 'bg-slate-100 text-slate-700',
    Negative: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col shrink-0 p-4 gap-4">
        <div>
          <h2 className="font-bold text-base mb-1">AI Chat Tester</h2>
          <p className="text-xs text-muted-foreground">Simulate customer conversations and see how the AI responds.</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Quick Scenarios</p>
          <div className="space-y-1">
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={cn(
                  'w-full text-left text-xs px-3 py-2 rounded-lg transition-colors',
                  scenario === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <Button size="sm" className="w-full mt-3 text-xs" onClick={loadScenario} disabled={loading}>
            <RefreshCw className="w-3 h-3 mr-1" /> Start Scenario
          </Button>
        </div>

        <div className="mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setMessages([])}
          >
            <Trash2 className="w-3 h-3 mr-1" /> Clear Chat
          </Button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Context Panel */}
        {(intent || sentiment || summary) && (
          <Card className="m-4 border-0 shadow-sm">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {intent && (
                  <>
                    <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
                    <Badge className={cn('text-[10px]', intentColors[intent] || intentColors.general_question)}>
                      {intent.replace(/_/g, ' ')}
                    </Badge>
                  </>
                )}
                {sentiment && (
                  <Badge className={cn('text-[10px]', sentimentColors[sentiment])}>
                    {sentiment}
                  </Badge>
                )}
              </div>
              {summary && (
                <div className="text-xs bg-background/50 p-2 rounded border border-border">
                  <p className="font-medium text-foreground mb-1">Summary</p>
                  <p className="text-muted-foreground">{summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="px-5 py-3 border-b bg-card flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Bot className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">ShopBot AI</p>
            <p className="text-xs text-muted-foreground">Test how the AI handles real conversations</p>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">● Live Test</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
              <Bot className="w-12 h-12 opacity-20" />
              <p className="text-sm">Pick a scenario or type a message to start testing the AI</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-2.5', msg.role === 'customer' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div className="max-w-[70%]">
                <div className={cn(
                  'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'customer'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-white border text-foreground rounded-tl-sm'
                )}>
                  {msg.content}
                </div>
                <p className={cn('text-[10px] text-muted-foreground mt-1', msg.role === 'customer' ? 'text-right' : 'text-left')}>
                  {msg.role === 'customer' ? '👤 You (Customer)' : '🤖 ShopBot'}
                  {' · '}{format(msg.time, 'h:mm a')}
                </p>
              </div>
              {msg.role === 'customer' && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="px-4 py-3 bg-white border rounded-2xl rounded-tl-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Actions */}
        {messages.length > 0 && (
          <div className="px-4 py-2 border-t bg-card flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={analyzeIntent}
              disabled={analyzing}
              className="gap-2 text-xs h-8"
            >
              <Zap className="w-3.5 h-3.5" /> Analyze Intent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={generateSummary}
              disabled={analyzing}
              className="gap-2 text-xs h-8"
            >
              <Lightbulb className="w-3.5 h-3.5" /> Summarize
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setIntent(null); setSentiment(null); setSummary(null); }}
              className="gap-2 text-xs h-8"
            >
              <Flag className="w-3.5 h-3.5" /> Clear
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t bg-card flex gap-2">
          <Input
            placeholder="Type as a customer..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="text-sm"
            disabled={loading}
          />
          <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}