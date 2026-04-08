import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, Plus, Trash2, X, CheckCircle, Zap, Bot } from 'lucide-react';

export default function KeywordManager({ brandId }) {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords', brandId],
    queryFn: () => brandId ? base44.entities.KeywordTrigger.filter({ brand_id: brandId }) : base44.entities.KeywordTrigger.list(),
  });

  const { data: flows = [] } = useQuery({
    queryKey: ['flows', brandId],
    queryFn: () => brandId ? base44.entities.Flow.filter({ brand_id: brandId }) : base44.entities.Flow.list(),
  });

  const save = async () => {
    const payload = { ...form, brand_id: brandId };
    if (form.id) await base44.entities.KeywordTrigger.update(form.id, payload);
    else await base44.entities.KeywordTrigger.create(payload);
    qc.invalidateQueries({ queryKey: ['keywords', brandId] });
    setSaved(true); setTimeout(() => { setSaved(false); setForm(null); }, 1500);
  };

  const toggleActive = async (kw) => {
    await base44.entities.KeywordTrigger.update(kw.id, { is_active: !kw.is_active });
    qc.invalidateQueries({ queryKey: ['keywords', brandId] });
  };

  const del = async (id) => {
    await base44.entities.KeywordTrigger.delete(id);
    qc.invalidateQueries({ queryKey: ['keywords', brandId] });
  };

  const EXAMPLES = [
    { keyword: 'cancel', flow: 'Cancellation Retention Flow', color: '#ef4444' },
    { keyword: 'upgrade', flow: 'Plan Upgrade Upsell Flow', color: '#10b981' },
    { keyword: 'help', flow: 'Support Menu Flow', color: '#3b82f6' },
    { keyword: 'JOIN', flow: 'SMS Opt-in Welcome Flow', color: '#f59e0b' },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-gray-900">Keyword Triggers & Intent Detection</h2>
          <p className="text-xs text-gray-400">{keywords.length} triggers · {keywords.filter(k => k.is_active).length} active</p>
        </div>
        <button onClick={() => setForm({ keyword: '', match_type: 'contains', is_active: true, intent_confidence_threshold: 0.75 })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-4 h-4" /> Add Keyword
        </button>
      </div>

      {keywords.length === 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-violet-700 mb-3">💡 Example keyword triggers for telecom:</p>
          <div className="grid grid-cols-2 gap-2">
            {EXAMPLES.map(ex => (
              <div key={ex.keyword} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-violet-100">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ background: `${ex.color}15`, color: ex.color }}>"{ex.keyword}"</span>
                <span className="text-xs text-gray-500">→ {ex.flow}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {keywords.map(kw => {
          const flow = flows.find(f => f.id === kw.flow_id);
          return (
            <div key={kw.id} className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 ${!kw.is_active ? 'opacity-60' : ''}`}
              style={{ borderColor: kw.is_active ? '#e5e7eb' : '#f3f4f6' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded text-sm">"{kw.keyword}"</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{kw.match_type}</span>
                  {kw.match_type === 'intent' && (
                    <span className="text-[10px] flex items-center gap-0.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded"><Bot className="w-2.5 h-2.5" /> AI Intent</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {flow && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />→ {flow.name}</span>}
                  <span>{kw.triggered_count || 0} triggered</span>
                  {kw.match_type === 'intent' && <span>confidence ≥ {Math.round((kw.intent_confidence_threshold || 0.75) * 100)}%</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(kw)}
                  className={`w-9 h-5 rounded-full relative transition-all ${kw.is_active ? 'bg-violet-600' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${kw.is_active ? 'left-4' : 'left-0.5'}`} />
                </button>
                <button onClick={() => setForm({ ...kw })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 text-xs">Edit</button>
                <button onClick={() => del(kw.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-sm text-gray-800 mb-2">Default Reply</h3>
        <p className="text-xs text-gray-400 mb-3">Sent when no keyword or intent matches</p>
        <textarea rows={3}
          placeholder={"Hi! I didn't understand that. Here's what I can help you with:\n• Type 'upgrade' for plan options\n• Type 'cancel' to manage your account\n• Type 'help' for support"}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{form.id ? 'Edit Keyword' : 'New Keyword Trigger'}</h2>
              <button onClick={() => setForm(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Keyword or Phrase</label>
                <input value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))} placeholder="e.g. cancel, upgrade, help"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Match Type</label>
                <select value={form.match_type} onChange={e => setForm(f => ({ ...f, match_type: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="exact">Exact match</option>
                  <option value="contains">Contains</option>
                  <option value="intent">AI Intent Detection</option>
                </select>
              </div>
              {form.match_type === 'intent' && (
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Min Confidence Score: {Math.round((form.intent_confidence_threshold || 0.75) * 100)}%</label>
                  <input type="range" min="50" max="99" value={(form.intent_confidence_threshold || 0.75) * 100}
                    onChange={e => setForm(f => ({ ...f, intent_confidence_threshold: parseInt(e.target.value) / 100 }))}
                    className="w-full accent-violet-600" />
                  <p className="text-[10px] text-gray-400 mt-1">Below threshold → routed to human agent</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Trigger Flow</label>
                <select value={form.flow_id || ''} onChange={e => setForm(f => ({ ...f, flow_id: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="">Select a flow…</option>
                  {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Description (optional)</label>
                <input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Triggers cancellation retention flow"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={save} disabled={!form.keyword?.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Keyword'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}