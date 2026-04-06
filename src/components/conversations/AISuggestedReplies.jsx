import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AISuggestedReplies({ messages, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setSuggestions([]);

    const history = messages
      .slice(-10)
      .map(m => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content}`)
      .join('\n');

    const faqs = await base44.entities.FAQ.filter({ is_active: true });
    const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional customer support agent. Based on the conversation history below, suggest exactly 3 short, professional reply options the agent could send next. Each should be distinct in tone or approach (e.g. empathetic, direct, detailed).\n\nFAQ context:\n${faqContext}\n\nConversation:\n${history}\n\nReturn a JSON object with a "suggestions" array of 3 strings.`,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    setSuggestions(result?.suggestions || []);
    setLoading(false);
  };

  return (
    <div className="px-4 pb-2">
      {suggestions.length === 0 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={generate}
          disabled={loading}
          className="text-xs text-muted-foreground gap-1.5 h-7 px-2"
        >
          {loading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {loading ? 'Generating suggestions…' : 'Suggest replies'}
        </Button>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Suggestions
            </span>
            <Button variant="ghost" size="sm" onClick={generate} disabled={loading} className="h-5 px-1.5 text-[10px] text-muted-foreground">
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </Button>
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelect(s)}
              className="w-full text-left text-xs px-3 py-2 rounded-lg border bg-accent/40 hover:bg-accent transition-colors text-foreground line-clamp-2"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}