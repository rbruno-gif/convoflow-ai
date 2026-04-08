import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Bot, Send, Zap, BookOpen, Plus, Trash2, Edit2, CheckCircle, Cpu, Shield, Eye, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PersonaTester from '@/components/aiagent/PersonaTester';
import StyleGuideUploader from '@/components/aiagent/StyleGuideUploader';
import AgentConfigurator from '@/components/agentic/AgentConfigurator';
import AgenticDashboard from '@/components/agentic/AgenticDashboard';
import AgenticAuditLog from '@/components/agentic/AgenticAuditLog';
import ShadowModeReview from '@/components/agentic/ShadowModeReview';

export default function AIAgent() {
  const [tab, setTab] = useState('overview');
  const { activeBrandId, activeBrand } = useBrand();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900">AI Agent</h1>
          <p className="text-xs text-gray-400">{activeBrand?.name || 'All brands'} · Powered by ConvoFlow</p>
        </div>
        <div className="ml-auto flex gap-1 flex-wrap">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'knowledge', label: 'Knowledge' },
            { key: 'persona test', label: 'Persona Test' },
            { key: 'settings', label: 'Settings' },
            { key: 'agentic-agents', label: '⚡ Agents', highlight: true },
            { key: 'agentic-dashboard', label: '⚡ Dashboard', highlight: true },
            { key: 'shadow-review', label: '👁 Shadow Review', highlight: true },
            { key: 'agentic-audit', label: '🛡 Audit Log', highlight: true },
          ].map(({ key, label, highlight }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                tab === key ? 'text-white' : highlight ? 'text-violet-600 bg-violet-50 hover:bg-violet-100' : 'text-gray-500 hover:bg-gray-100'
              )}
              style={tab === key ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}
            >{label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && <AIOverview brandId={activeBrandId} />}
        {tab === 'knowledge' && <KnowledgeSection brandId={activeBrandId} />}
        {tab === 'persona test' && <PersonaTester brandId={activeBrandId} />}
        {tab === 'settings' && <AISettingsSection brandId={activeBrandId} />}
        {tab === 'agentic-agents' && <AgentConfigurator brandId={activeBrandId} />}
        {tab === 'agentic-dashboard' && <AgenticDashboard brandId={activeBrandId} />}
        {tab === 'shadow-review' && <ShadowModeReview brandId={activeBrandId} />}
        {tab === 'agentic-audit' && <AgenticAuditLog brandId={activeBrandId} />}
      </div>
    </div>
  );
}

function AIOverview({ brandId }) {
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', brandId],
    queryFn: () => brandId
      ? base44.entities.Conversation.filter({ brand_id: brandId }, '-created_date', 200)
      : base44.entities.Conversation.list('-created_date', 200),
  });
  const total = conversations.length;
  const aiHandled = conversations.filter(c => c.mode === 'ai').length;
  const aiResolved = conversations.filter(c => c.mode === 'ai' && c.status === 'resolved').length;
  const aiRate = total > 0 ? Math.round((aiHandled / total) * 100) : 0;
  const resolveRate = aiHandled > 0 ? Math.round((aiResolved / aiHandled) * 100) : 0;
  const stats = [
    { label: 'AI Resolution Rate', value: `${aiRate}%`, color: '#7c3aed' },
    { label: 'AI Conversations', value: aiHandled, color: '#4f46e5' },
    { label: 'Auto-Resolved', value: `${resolveRate}%`, color: '#10b981' },
    { label: 'Avg Response Time', value: '< 1s', color: '#f59e0b' },
  ];
  return (
    <div className="p-6 max-w-4xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
            <Zap className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">U2C AI Assistant is Active</p>
            <p className="text-xs text-gray-400">Handling conversations 24/7</p>
          </div>
          <span className="ml-auto text-[11px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" /> Live
          </span>
        </div>
        <p className="text-xs text-gray-500">Trained on U2C Mobile plans, activation, BYOD, international calling, billing, and support. Responds in English and Spanish.</p>
      </div>
    </div>
  );
}

function KnowledgeSection({ brandId }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general' });
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs', brandId],
    queryFn: () => brandId
      ? base44.entities.FAQ.filter({ brand_id: brandId })
      : base44.entities.FAQ.list(),
  });

  const save = async () => {
    const payload = brandId ? { ...form, brand_id: brandId, is_active: true } : { ...form, is_active: true };
    if (editItem) await base44.entities.FAQ.update(editItem.id, form);
    else await base44.entities.FAQ.create(payload);
    qc.invalidateQueries({ queryKey: ['faqs', brandId] });
    setShowForm(false); setEditItem(null); setForm({ question: '', answer: '', category: 'general' });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="font-bold text-gray-900">Knowledge Base</h2><p className="text-xs text-gray-400">{faqs.length} FAQs</p></div>
        <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ question: '', answer: '', category: 'general' }); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl p-5 border border-violet-200 shadow-sm mb-5 space-y-3">
          <h3 className="font-semibold text-sm">{editItem ? 'Edit FAQ' : 'New FAQ'}</h3>
          <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Question..." />
          <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
            rows={3} className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            placeholder="Answer..." />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600">Cancel</button>
            <button onClick={save} className="px-4 py-1.5 text-xs rounded-lg text-white font-semibold flex items-center gap-1.5"
              style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Saved!</> : 'Save'}
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {faqs.map(faq => (
          <div key={faq.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{faq.question}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{faq.answer}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditItem(faq); setForm({ question: faq.question, answer: faq.answer, category: faq.category }); setShowForm(true); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
              <button onClick={async () => { await base44.entities.FAQ.delete(faq.id); qc.invalidateQueries({ queryKey: ['faqs', brandId] }); }}
                className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
            </div>
          </div>
        ))}
        {faqs.length === 0 && <div className="text-center py-12 text-gray-400"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No FAQs yet.</p></div>}
      </div>
    </div>
  );
}

function AITestChat({ brandId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'customer', content: input.trim() };
    setMessages(p => [...p, userMsg]); setInput(''); setLoading(true);
    const faqFilter = brandId ? { is_active: true, brand_id: brandId } : { is_active: true };
    const kbFilter = brandId ? { is_active: true, brand_id: brandId } : { is_active: true };
    const [faqs, knowledgeDocs, settingsList] = await Promise.all([
      base44.entities.FAQ.filter(faqFilter),
      base44.entities.KnowledgeDoc.filter(kbFilter),
      brandId ? base44.entities.AgentSettings.filter({ brand_id: brandId }) : base44.entities.AgentSettings.list(),
    ]);
    const s = settingsList[0];
    const instructions = s?.ai_instructions || '';
    const persona = s?.ai_persona_name || 'U2C AI Assistant';
    const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const kbContext = knowledgeDocs.map(d => `# ${d.title}\n${d.content}`).join('\n\n');
    const history = [...messages, userMsg].map(m => `${m.role === 'customer' ? 'Customer' : persona}: ${m.content}`).join('\n');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${instructions}\n\nKNOWLEDGE:\n${kbContext}\n\nFAQs:\n${faqContext}\n\nCONVERSATION:\n${history}\n\nRespond as ${persona}.`,
      model: 'gpt_4o_mini',
    });
    const aiReply = typeof result === 'string' ? result : result?.text || "I'm here to help!";
    setMessages(p => [...p, { role: 'ai', content: aiReply }]); setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ height: '70vh' }}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
          <p className="text-white font-semibold text-sm">U2C AI Assistant</p>
          <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">● Online</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f9fafb' }}>
          {messages.length === 0 && <div className="text-center py-10 text-gray-400"><Bot className="w-10 h-10 mx-auto mb-2 opacity-20" /><p className="text-sm">Send a message to test the AI</p></div>}
          {messages.map((m, i) => (
            <div key={i} className={cn('flex gap-2', m.role === 'customer' ? 'justify-end' : 'justify-start')}>
              {m.role === 'ai' && <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}><Bot className="w-3.5 h-3.5 text-white" /></div>}
              <div className={cn('max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm', m.role === 'customer' ? 'text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm')}
                style={m.role === 'customer' ? { background: 'linear-gradient(135deg, #4f46e5, #3730a3)' } : {}}>{m.content}</div>
            </div>
          ))}
          {loading && <div className="flex gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}><Bot className="w-3.5 h-3.5 text-white" /></div><div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm flex gap-1">{[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div>}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Type a message..." className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <button onClick={send} disabled={loading || !input.trim()} className="px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

function AISettingsSection({ brandId }) {
  const [form, setForm] = useState({ store_name: '', ai_persona_name: '', welcome_message: '', ai_instructions: '', handoff_message: '', is_ai_active: true });
  const [settingsId, setSettingsId] = useState(null);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();
  const { data: settings = [] } = useQuery({
    queryKey: ['agent-settings', brandId],
    queryFn: () => brandId ? base44.entities.AgentSettings.filter({ brand_id: brandId }) : base44.entities.AgentSettings.list(),
  });
  useEffect(() => {
    setSettingsId(null);
    setForm({ store_name: '', ai_persona_name: '', welcome_message: '', ai_instructions: '', handoff_message: '', is_ai_active: true });
    if (settings.length > 0) { const s = settings[0]; setSettingsId(s.id); setForm({ store_name: s.store_name || '', ai_persona_name: s.ai_persona_name || '', welcome_message: s.welcome_message || '', ai_instructions: s.ai_instructions || '', handoff_message: s.handoff_message || '', is_ai_active: s.is_ai_active !== false }); }
  }, [settings]);
  const save = async () => {
    const payload = brandId ? { ...form, brand_id: brandId } : form;
    if (settingsId) await base44.entities.AgentSettings.update(settingsId, payload);
    else { const c = await base44.entities.AgentSettings.create(payload); setSettingsId(c.id); }
    qc.invalidateQueries({ queryKey: ['agent-settings', brandId] }); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleStyleGuideUpdate = async (mergedInstructions) => {
    const newForm = { ...form, ai_instructions: mergedInstructions };
    setForm(newForm);
    const payload = brandId ? { ...newForm, brand_id: brandId } : newForm;
    if (settingsId) await base44.entities.AgentSettings.update(settingsId, payload);
    else { const c = await base44.entities.AgentSettings.create(payload); setSettingsId(c.id); }
    qc.invalidateQueries({ queryKey: ['agent-settings', brandId] });
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">AI Settings</h2>
        <StyleGuideUploader
          brandId={brandId}
          currentInstructions={form.ai_instructions}
          onInstructionsUpdated={handleStyleGuideUpdate}
        />
        {[{ label: 'Store Name', field: 'store_name' }, { label: 'AI Persona Name', field: 'ai_persona_name' }, { label: 'Welcome Message', field: 'welcome_message', textarea: true, rows: 2 }, { label: 'AI Instructions', field: 'ai_instructions', textarea: true, rows: 8 }, { label: 'Handoff Message', field: 'handoff_message', textarea: true, rows: 2 }].map(({ label, field, textarea, rows }) => (
          <div key={field}>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
            {textarea ? <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} rows={rows} className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" /> : <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />}
          </div>
        ))}
        <button onClick={save} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}