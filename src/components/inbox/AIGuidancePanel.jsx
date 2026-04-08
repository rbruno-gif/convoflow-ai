import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, Zap, BookOpen, MessageSquare, ChevronDown, ChevronUp, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AIGuidancePanel({ conversation, onInsertReply }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [similarConvos, setSimilarConvos] = useState([]);
  const [relevantFAQs, setRelevantFAQs] = useState([]);
  const [expanded, setExpanded] = useState({ suggestion: true, faqs: true, similar: false });

  const sentimentConfig = {
    positive: { label: 'Satisfied', color: '#10b981', bg: '#f0fdf4', emoji: '😊' },
    neutral: { label: 'Neutral', color: '#6b7280', bg: '#f9fafb', emoji: '😐' },
    negative: { label: 'Frustrated', color: '#ef4444', bg: '#fef2f2', emoji: '😞' },
  };
  const sentiment = sentimentConfig[conversation?.sentiment || 'neutral'];

  useEffect(() => {
    if (!conversation?.last_message) return;
    generateGuidance();
  }, [conversation?.id, conversation?.last_message]);

  const generateGuidance = async () => {
    if (!conversation?.last_message) return;
    setLoading(true);
    setSuggestion('');

    const brandId = conversation.brand_id;
    const [faqs, knowledgeDocs, messages] = await Promise.all([
      brandId ? base44.entities.FAQ.filter({ brand_id: brandId, is_active: true }) : base44.entities.FAQ.filter({ is_active: true }),
      brandId ? base44.entities.KnowledgeDoc.filter({ brand_id: brandId, is_active: true }) : base44.entities.KnowledgeDoc.filter({ is_active: true }),
      base44.entities.Message.filter({ conversation_id: conversation.id }, 'timestamp', 20),
    ]);

    // Find relevant FAQs
    const lastMsg = conversation.last_message?.toLowerCase() || '';
    const relevant = faqs.filter(f =>
      f.question?.toLowerCase().split(' ').some(w => w.length > 4 && lastMsg.includes(w)) ||
      f.keywords?.some(k => lastMsg.includes(k.toLowerCase()))
    ).slice(0, 3);
    setRelevantFAQs(relevant);

    // Similar resolved conversations
    const resolved = await (brandId
      ? base44.entities.Conversation.filter({ brand_id: brandId, status: 'resolved' }, '-created_date', 50)
      : base44.entities.Conversation.filter({ status: 'resolved' }, '-created_date', 50));
    const similar = resolved.filter(c => c.id !== conversation.id && c.intent === conversation.intent).slice(0, 3);
    setSimilarConvos(similar);

    // Generate AI suggestion
    const faqContext = faqs.slice(0, 20).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const kbContext = knowledgeDocs.slice(0, 5).map(d => `${d.title}: ${d.content?.substring(0, 300)}`).join('\n\n');
    const history = messages.slice(-6).map(m => `${m.sender_type}: ${m.content}`).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI assistant helping a customer support agent reply to a customer message.

KNOWLEDGE BASE:
${kbContext}

FAQS:
${faqContext}

CONVERSATION HISTORY:
${history}

CUSTOMER'S LATEST MESSAGE: "${conversation.last_message}"

Write a helpful, professional suggested reply for the agent to send. Be concise (2-4 sentences max). Do not include a greeting or sign-off.`,
    });

    setSuggestion(typeof result === 'string' ? result : result?.text || '');
    setLoading(false);
  };

  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  return (
    <div className="w-72 shrink-0 border-l border-gray-100 bg-white flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
          <Bot className="w-4 h-4 text-violet-600" />
        </div>
        <p className="text-xs font-bold text-gray-800">AI Guidance</p>
        <button onClick={generateGuidance} disabled={loading}
          className="ml-auto p-1 hover:bg-gray-100 rounded-lg disabled:opacity-50">
          {loading ? <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-violet-500" />}
        </button>
      </div>

      {/* Sentiment */}
      <div className="px-4 py-2.5 border-b border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Customer Sentiment</p>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: sentiment.bg }}>
          <span className="text-base">{sentiment.emoji}</span>
          <span className="text-xs font-semibold" style={{ color: sentiment.color }}>{sentiment.label}</span>
        </div>
      </div>

      {/* Suggested reply */}
      <div className="border-b border-gray-100">
        <button onClick={() => toggle('suggestion')}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Suggested Reply</span>
          {expanded.suggestion ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </button>
        {expanded.suggestion && (
          <div className="px-4 pb-3">
            {loading ? (
              <div className="flex items-center gap-2 py-3 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Generating suggestion...</span>
              </div>
            ) : suggestion ? (
              <div>
                <p className="text-xs text-gray-700 leading-relaxed bg-violet-50 rounded-xl p-3 border border-violet-100 mb-2">{suggestion}</p>
                <button onClick={() => onInsertReply?.(suggestion)}
                  className="w-full py-1.5 text-xs font-semibold rounded-lg text-white transition-colors"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  Insert Reply
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-2">No suggestion available</p>
            )}
          </div>
        )}
      </div>

      {/* Relevant FAQs */}
      <div className="border-b border-gray-100">
        <button onClick={() => toggle('faqs')}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Relevant FAQs ({relevantFAQs.length})</span>
          {expanded.faqs ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </button>
        {expanded.faqs && (
          <div className="px-4 pb-3 space-y-2">
            {relevantFAQs.length === 0 ? (
              <p className="text-xs text-gray-400">No relevant FAQs found</p>
            ) : relevantFAQs.map(faq => (
              <div key={faq.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-800 mb-1">{faq.question}</p>
                <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">{faq.answer}</p>
                <button onClick={() => onInsertReply?.(faq.answer)}
                  className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Use this answer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Similar conversations */}
      <div>
        <button onClick={() => toggle('similar')}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Similar Resolved ({similarConvos.length})</span>
          {expanded.similar ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </button>
        {expanded.similar && (
          <div className="px-4 pb-3 space-y-2">
            {similarConvos.length === 0 ? (
              <p className="text-xs text-gray-400">No similar conversations</p>
            ) : similarConvos.map(c => (
              <div key={c.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-800">{c.customer_name}</p>
                <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{c.conversation_summary || c.last_message}</p>
                <span className="text-[10px] text-green-600 mt-1 block">✓ Resolved</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}