import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Layers, CheckCircle, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const METHODS = [
  { value: 'round_robin', label: 'Round Robin', icon: '🔄', desc: 'Conversations assigned evenly across all available agents in rotation. At-capacity or offline agents are skipped.' },
  { value: 'least_busy', label: 'Least Busy', icon: '📉', desc: 'Each new conversation goes to the agent with the fewest active chats right now.' },
  { value: 'skills_based', label: 'Skills Based', icon: '🎯', desc: 'Match conversations to agents based on required skill tags (e.g. Spanish speaker, billing expert).' },
  { value: 'manual', label: 'Manual', icon: '✋', desc: 'Conversations wait unassigned. Agents pick them up or managers assign from the queue dashboard.' },
  { value: 'sticky_agent', label: 'Sticky Agent', icon: '📌', desc: 'Returning customers are routed back to their last agent if available. Falls back to the selected fallback method.' },
];

const FALLBACKS = [
  { value: 'least_busy', label: 'Least Busy' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'manual', label: 'Manual' },
];

const FLOW_STEPS = [
  {
    step: 1, title: 'Customer Enters Queue', color: '#7c3aed',
    items: ['Queue position message is sent', 'Wait time timer starts', 'Priority lane is checked', 'Assignment method is applied'],
  },
  {
    step: 2, title: 'While Waiting', color: '#3b82f6',
    items: ['Position updates sent every X minutes', 'If wait exceeds threshold → offer options', 'Customer can choose: wait / callback / AI help / schedule'],
  },
  {
    step: 3, title: 'Agent Becomes Available', color: '#f59e0b',
    items: ['Conversation assigned per method', 'Agent notified with sound alert + badge', 'Agent sees wait time and customer profile', 'Agent has configurable seconds to accept'],
  },
  {
    step: 4, title: 'Agent Accepts', color: '#10b981',
    items: ['Customer receives "Connected with {agent}" message', 'Queue position removed', 'Timer resets to response tracking'],
  },
  {
    step: 5, title: 'Conversation Resolved', color: '#6b7280',
    items: ['Agent marks resolved', 'CSAT survey sent (if enabled)', 'Moves to resolved inbox', 'Agent capacity decreases → triggers next assignment'],
  },
];

export default function AssignmentFlowPanel({ brandId }) {
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [form, setForm] = useState({ assignment_method: 'least_busy', assignment_fallback: 'least_busy' });
  const [settingsId, setSettingsId] = useState(null);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', brandId],
    queryFn: () => brandId ? base44.entities.Department.filter({ brand_id: brandId }) : base44.entities.Department.list(),
  });

  const { data: allSettings = [] } = useQuery({
    queryKey: ['queue-settings', brandId],
    queryFn: () => brandId ? base44.entities.QueueSettings.filter({ brand_id: brandId }) : base44.entities.QueueSettings.list(),
  });

  useEffect(() => {
    const match = allSettings.find(s => (s.department_id || '') === selectedDeptId);
    if (match) { setSettingsId(match.id); setForm({ assignment_method: match.assignment_method || 'least_busy', assignment_fallback: match.assignment_fallback || 'least_busy' }); }
    else { setSettingsId(null); setForm({ assignment_method: 'least_busy', assignment_fallback: 'least_busy' }); }
  }, [selectedDeptId, allSettings]);

  const save = async () => {
    try {
      const payload = { ...form, brand_id: brandId, department_id: selectedDeptId || null };
      if (settingsId) await base44.entities.QueueSettings.update(settingsId, payload);
      else {
        const existing = allSettings.find(s => (s.department_id || '') === selectedDeptId);
        if (existing) await base44.entities.QueueSettings.update(existing.id, payload);
        else await base44.entities.QueueSettings.create(payload);
      }
      qc.invalidateQueries({ queryKey: ['queue-settings', brandId] });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to save assignment settings', variant: 'destructive' });
    }
  };

  const selected = form.assignment_method;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h2 className="font-bold text-gray-900 flex items-center gap-2"><Layers className="w-5 h-5 text-violet-600" /> Assignment Flow Control</h2>
        <p className="text-xs text-gray-400 mt-0.5">Choose how conversations are assigned to agents per department</p>
      </div>

      {/* Department selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-5">
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Configure for</label>
        <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
          <option value="">Brand Default</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Method selection */}
        <div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-semibold text-sm text-gray-800 mb-4">Assignment Method</h3>
            <div className="space-y-2">
              {METHODS.map(m => (
                <label key={m.value}
                  onClick={() => setForm(f => ({ ...f, assignment_method: m.value }))}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected === m.value ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" checked={selected === m.value} readOnly className="mt-0.5 accent-violet-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.icon} {m.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Fallback method */}
          {selected === 'sticky_agent' && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
              <h3 className="font-semibold text-sm text-gray-800 mb-3">Fallback Method</h3>
              <p className="text-xs text-gray-400 mb-3">Used when sticky agent is unavailable</p>
              <div className="space-y-2">
                {FALLBACKS.map(f => (
                  <label key={f.value}
                    onClick={() => setForm(fm => ({ ...fm, assignment_fallback: f.value }))}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${form.assignment_fallback === f.value ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" checked={form.assignment_fallback === f.value} readOnly className="accent-violet-600" />
                    <span className="text-sm text-gray-700">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button onClick={save}
            className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Assignment Method'}
          </button>
        </div>

        {/* Flow steps diagram */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-800">Queue Flow Steps</h3>
          {FLOW_STEPS.map((step, i) => (
            <div key={step.step} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: step.color }}>
                  {step.step}
                </div>
                <p className="font-semibold text-sm text-gray-800">{step.title}</p>
              </div>
              <ul className="space-y-1 pl-10">
                {step.items.map((item, j) => (
                  <li key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}