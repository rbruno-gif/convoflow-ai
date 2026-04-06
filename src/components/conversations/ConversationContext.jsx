import { Badge } from '@/components/ui/badge';
import { Zap, Lightbulb, Tag, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const intentColors = {
  order_inquiry: 'bg-blue-100 text-blue-700',
  product_support: 'bg-purple-100 text-purple-700',
  billing_issue: 'bg-orange-100 text-orange-700',
  complaint: 'bg-red-100 text-red-700',
  feedback: 'bg-green-100 text-green-700',
  returns_refunds: 'bg-amber-100 text-amber-700',
  shipping: 'bg-cyan-100 text-cyan-700',
  technical_support: 'bg-indigo-100 text-indigo-700',
  general_question: 'bg-slate-100 text-slate-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function ConversationContext({ conversation }) {
  if (!conversation) return null;

  return (
    <div className="px-5 py-3 border-b bg-accent/30 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {conversation.intent && (
          <>
            <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', intentColors[conversation.intent] || intentColors.general_question)}>
              {conversation.intent.replace(/_/g, ' ')}
            </span>
          </>
        )}

        {conversation.sentiment === 'negative' && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[10px] text-destructive font-semibold">Negative Sentiment</span>
          </div>
        )}

        {conversation.is_urgent && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-destructive/10 text-destructive">
            URGENT
          </span>
        )}
      </div>

      {conversation.conversation_summary && (
        <div className="text-xs bg-background/50 p-2 rounded border border-border">
          <p className="font-medium text-foreground mb-1">Summary</p>
          <p className="text-muted-foreground">{conversation.conversation_summary}</p>
        </div>
      )}

      {conversation.key_topics && conversation.key_topics.length > 0 && (
        <div className="flex items-start gap-2">
          <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {conversation.key_topics.map((topic, i) => (
              <span key={i} className="text-[9px] bg-background px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}