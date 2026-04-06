import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, User, Send, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AITest() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('general');
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
      prompt: `You are ${persona}, the official AI support agent for ${storeName}. You represent ${storeName} and speak on their behalf at all times.\n\n${instructions ? `Additional instructions: ${instructions}\n\n` : ''}Use the knowledge base and FAQs below to answer customer questions accurately.\n\n=== KNOWLEDGE BASE ===\n${kbContext}\n\n=== FAQs ===\n${faqContext}\n\n=== CONVERSATION ===\n${history}\n\nRespond as ${persona} representing ${storeName}. Be helpful, professional, and accurate. Only use information from the knowledge base and FAQs. If you cannot find the answer, apologize and offer to connect the customer with a human agent.`,
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
    setTimeout(() => sendMessage(starterMessages[scenario]), 100);
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