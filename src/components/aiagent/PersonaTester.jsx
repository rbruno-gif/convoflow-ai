import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, Send, RotateCcw, User, ChevronDown, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const PERSONAS = [
  { id: 'default', label: 'Default (System)', description: 'Uses the saved AI instructions' },
  { id: 'friendly', label: 'Friendly & Casual', description: 'Warm, emoji-heavy, conversational tone' },
  { id: 'professional', label: 'Professional', description: 'Formal, concise, business-like' },
  { id: 'technical', label: 'Technical Expert', description: 'Detailed, precise, jargon-aware' },
  { id: 'empathetic', label: 'Empathetic', description: 'Warm, patient, emotionally intelligent' },
];

const PERSONA_OVERRIDES = {
  friendly: 'You are a super friendly, warm customer support agent. Use a casual, conversational tone. Use emojis naturally. Keep responses short and punchy. Always end with an encouraging note.',
  professional: 'You are a professional customer support representative. Use formal language, complete sentences, and avoid emojis. Be concise, accurate, and solution-focused.',
  technical: 'You are a technical support specialist. Provide detailed, accurate technical information. Use precise terminology. Break down complex topics step by step.',
  empathetic: 'You are an empathetic support agent. Always acknowledge the customer\'s feelings first before solving their problem. Use validating language. Be patient and thorough.',
};

const SCENARIO_PROMPTS = [
  'Hi, I want to know about your plans',
  'My phone isn\'t connecting to the network',
  'I was charged twice this month, this is unacceptable',
  'How do I port my number from AT&T?',
  'Do you support eSIM?',
  'I need to cancel my account',
];

export default function PersonaTester({ brandId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('default');
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [scores, setScores] = useState([]);
  const bottomRef = useRef(null);
  const personaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const handler = (e) => { if (personaRef.current && !personaRef.current.contains(e.target)) setShowPersonaMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: settingsList = [] } = useQuery({
    queryKey: ['agent-settings', brandId],
    queryFn: () => brandId ? base44.entities.AgentSettings.filter({ brand_id: brandId }) : base44.entities.AgentSettings.list(),
  });

  const send = async (overrideInput) => {
    const text = overrideInput || input.trim();
    if (!text || loading) return;
    const userMsg = { role: 'customer', content: text };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);

    const faqFilter = brandId ? { is_active: true, brand_id: brandId } : { is_active: true };
    const [faqs, knowledgeDocs] = await Promise.all([
      base44.entities.FAQ.filter(faqFilter),
      base44.entities.KnowledgeDoc.filter(brandId ? { is_active: true, brand_id: brandId } : { is_active: true }),
    ]);

    const s = settingsList[0];
    const baseInstructions = s?.ai_instructions || '';
    const persona = s?.ai_persona_name || 'AI Assistant';
    const personaOverride = selectedPersona !== 'default' ? PERSONA_OVERRIDES[selectedPersona] : null;
    const instructions = personaOverride
      ? `${personaOverride}\n\nBrand context:\n${baseInstructions}`
      : baseInstructions;

    const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const kbContext = knowledgeDocs.map(d => `# ${d.title}\n${d.content}`).join('\n\n');
    const history = [...messages, userMsg].map(m => `${m.role === 'customer' ? 'Customer' : persona}: ${m.content}`).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${instructions}\n\nKNOWLEDGE:\n${kbContext}\n\nFAQs:\n${faqContext}\n\nCONVERSATION:\n${history}\n\nRespond as ${persona}.`,
      model: 'gpt_5_mini',
    });
    const aiReply = typeof result === 'string' ? result : result?.text || "I'm here to help!";

    // Score the response
    const scoreResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are evaluating a customer support AI response for persona adherence.

Persona being tested: "${PERSONAS.find(p => p.id === selectedPersona)?.label || 'Default'}"
Customer message: "${text}"
AI response: "${aiReply}"

Rate the response on these 3 criteria (1-5 each):
- tone_match: Does the tone match the expected persona?
- helpfulness: How helpful and complete is the answer?
- clarity: How clear and easy to understand is the response?

Also write a one-sentence feedback string.`,
      response_json_schema: {
        type: 'object',
        properties: {
          tone_match: { type: 'number' },
          helpfulness: { type: 'number' },
          clarity: { type: 'number' },
          feedback: { type: 'string' },
        }
      }
    });

    setMessages(p => [...p, { role: 'ai', content: aiReply }]);
    if (scoreResult?.tone_match) {
      setScores(prev => [...prev, { msgIndex: messages.length + 1, ...scoreResult }]);
    }
    setLoading(false);
  };

  const reset = () => { setMessages([]); setScores([]); };
  const currentPersona = PERSONAS.find(p => p.id === selectedPersona);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, r) => s + (r.tone_match + r.helpfulness + r.clarity) / 3, 0) / scores.length * 10) / 10
    : null;
  const lastScore = scores[scores.length - 1];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">Persona Tester</h2>
          <p className="text-xs text-gray-400 mt-0.5">Test how your AI agent responds with different tones and score its performance in real-time</p>
        </div>
        {avgScore && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold text-violet-600">{avgScore}<span className="text-sm">/5</span></p>
            <p className="text-[10px] text-violet-500 font-medium">Avg Score</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: controls */}
        <div className="space-y-4">
          {/* Persona selector */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-violet-500" /> Select Persona</p>
            <div className="space-y-1.5">
              {PERSONAS.map(p => (
                <button key={p.id} onClick={() => setSelectedPersona(p.id)}
                  className={cn('w-full text-left px-3 py-2.5 rounded-lg border transition-all text-xs', selectedPersona === p.id ? 'border-violet-300 bg-violet-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50')}>
                  <p className={cn('font-semibold', selectedPersona === p.id ? 'text-violet-700' : 'text-gray-700')}>{p.label}</p>
                  <p className="text-gray-400 mt-0.5 text-[10px]">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick scenarios */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-blue-500" /> Quick Scenarios</p>
            <div className="space-y-1.5">
              {SCENARIO_PROMPTS.map(s => (
                <button key={s} onClick={() => send(s)} disabled={loading}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-100 hover:border-violet-200 hover:bg-violet-50 text-[11px] text-gray-600 hover:text-violet-700 transition-all disabled:opacity-40">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Last score card */}
          {lastScore && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">Last Response Score</p>
              {[['Tone Match', lastScore.tone_match], ['Helpfulness', lastScore.helpfulness], ['Clarity', lastScore.clarity]].map(([label, val]) => (
                <div key={label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-700">{val}/5</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(val / 5) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />
                  </div>
                </div>
              ))}
              {lastScore.feedback && <p className="text-[10px] text-gray-500 italic mt-2 border-t pt-2">{lastScore.feedback}</p>}
            </div>
          )}
        </div>

        {/* Right: chat */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ height: '72vh' }}>
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white" /></div>
              <div>
                <p className="text-white font-semibold text-sm">AI Agent · Persona Test</p>
                <p className="text-white/60 text-[10px]">{currentPersona?.label}</p>
              </div>
              <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-white/70 hover:text-white text-[11px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f9fafb' }}>
              {messages.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Bot className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Select a persona and start chatting</p>
                  <p className="text-xs mt-1">Or pick a quick scenario from the left</p>
                </div>
              )}
              {messages.map((m, i) => {
                const score = m.role === 'ai' ? scores.find(s => s.msgIndex === i) : null;
                return (
                  <div key={i}>
                    <div className={cn('flex gap-2', m.role === 'customer' ? 'justify-end' : 'justify-start')}>
                      {m.role === 'ai' && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className={cn('max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm', m.role === 'customer' ? 'text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm')}
                        style={m.role === 'customer' ? { background: 'linear-gradient(135deg, #4f46e5, #3730a3)' } : {}}>
                        {m.content}
                      </div>
                      {m.role === 'customer' && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    {score && (
                      <div className="ml-9 mt-1 flex items-center gap-2">
                        {[['T', score.tone_match], ['H', score.helpfulness], ['C', score.clarity]].map(([key, val]) => (
                          <span key={key} className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ background: val >= 4 ? 'rgba(16,185,129,0.1)' : val >= 3 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: val >= 4 ? '#059669' : val >= 3 ? '#d97706' : '#dc2626' }}>
                            {key}:{val}
                          </span>
                        ))}
                        {score.feedback && <span className="text-[10px] text-gray-400 italic">{score.feedback}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}><Bot className="w-3.5 h-3.5 text-white" /></div>
                  <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm flex gap-1">
                    {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Type a test message..." className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              <button onClick={() => send()} disabled={loading || !input.trim()} className="px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}