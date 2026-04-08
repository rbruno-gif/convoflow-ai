import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Layout, Plus, Trash2, X, CheckCircle, GripVertical, Clock } from 'lucide-react';

export default function SequenceManager({ brandId }) {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  const { data: sequences = [] } = useQuery({
    queryKey: ['sequences', brandId],
    queryFn: () => brandId ? base44.entities.Sequence.filter({ brand_id: brandId }, '-created_date', 100) : base44.entities.Sequence.list('-created_date', 100),
  });

  const createNew = () => {
    setForm({
      name: '', description: '', status: 'draft',
      steps: [
        { day: 0, message: 'Welcome! Thanks for joining {brand_name}.', message_type: 'text', delay_hours: 0 },
        { day: 1, message: 'Here are some tips to get started...', message_type: 'text', delay_hours: 24 },
        { day: 7, message: 'How are you enjoying our service?', message_type: 'text', delay_hours: 168 },
      ],
    });
    setSelected(null);
  };

  const save = async () => {
    const payload = { ...form, brand_id: brandId };
    if (selected) await base44.entities.Sequence.update(selected.id, payload);
    else await base44.entities.Sequence.create(payload);
    qc.invalidateQueries({ queryKey: ['sequences', brandId] });
    setSaved(true); setTimeout(() => { setSaved(false); setForm(null); setSelected(null); }, 1500);
  };

  const editSeq = (seq) => { setSelected(seq); setForm({ ...seq }); };

  const addStep = () => {
    const steps = [...(form.steps || [])];
    const lastDay = steps.length > 0 ? steps[steps.length - 1].day : 0;
    steps.push({ day: lastDay + 7, message: 'Follow-up message...', message_type: 'text', delay_hours: (lastDay + 7) * 24 });
    setForm(f => ({ ...f, steps }));
  };

  const updateStep = (i, patch) => {
    const steps = [...(form.steps || [])];
    steps[i] = { ...steps[i], ...patch };
    setForm(f => ({ ...f, steps }));
  };

  const removeStep = (i) => {
    setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }));
  };

  const STATUS_COLORS = { active: '#10b981', paused: '#f59e0b', draft: '#6b7280' };

  return (
    <div className="flex h-full">
      {/* Sequence list */}
      <div className="w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <button onClick={createNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Plus className="w-4 h-4" /> New Sequence
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {sequences.map(seq => (
            <button key={seq.id} onClick={() => editSeq(seq)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 ${selected?.id === seq.id ? 'bg-violet-50' : ''}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[seq.status] || '#6b7280' }} />
                <p className="text-xs font-semibold text-gray-800 truncate flex-1">{seq.name}</p>
              </div>
              <p className="text-[10px] text-gray-400 pl-4">{(seq.steps || []).length} steps · {seq.subscriber_count || 0} subscribers</p>
            </button>
          ))}
          {sequences.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Layout className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No sequences yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {form ? (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <h3 className="font-bold text-gray-900 mb-4">{selected ? 'Edit Sequence' : 'New Sequence'}</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. New Customer Onboarding"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {['draft', 'active', 'paused'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Description</label>
                <input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe this sequence…"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-4">
              {(form.steps || []).map((step, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>{i + 1}</div>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500 text-xs">Day</span>
                        <input type="number" min="0" value={step.day}
                          onChange={e => updateStep(i, { day: parseInt(e.target.value) || 0 })}
                          className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                      </div>
                      <select value={step.message_type || 'text'} onChange={e => updateStep(i, { message_type: e.target.value })}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400">
                        {['text', 'image', 'card'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeStep(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <textarea value={step.message} onChange={e => updateStep(i, { message: e.target.value })}
                    rows={3} placeholder="Message content… Use {first_name}, {brand_name}"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                </div>
              ))}
              <button onClick={addStep}
                className="w-full py-3 rounded-xl border-2 border-dashed border-violet-200 text-violet-600 text-sm font-semibold hover:border-violet-400 hover:bg-violet-50 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Step
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setForm(null); setSelected(null); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={save}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Sequence'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <Layout className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">Select or create a sequence</p>
            <p className="text-sm mt-1">Drip messages to nurture subscribers over time</p>
          </div>
        )}
      </div>
    </div>
  );
}