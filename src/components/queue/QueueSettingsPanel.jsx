import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, CheckCircle, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const OVERFLOW_OPTIONS = [
  { value: 'ai_takeover', label: '🤖 AI Chatbot Takeover', desc: 'AI handles the conversation using the knowledge base' },
  { value: 'callback_request', label: '📞 Callback Request', desc: 'Ask customer for phone number and promise callback' },
  { value: 'voicemail_ticket', label: '🎙️ Voicemail to Ticket', desc: 'Convert message to high-priority support ticket' },
  { value: 'redirect_department', label: '↔️ Redirect to Department', desc: 'Transfer to another department with capacity' },
  { value: 'schedule_callback', label: '📅 Schedule Callback', desc: 'Customer picks an available callback time slot' },
];

const DEFAULTS = {
  max_queue_size: 20,
  max_wait_minutes: 10,
  assignment_method: 'least_busy',
  assignment_fallback: 'least_busy',
  send_position_updates: true,
  position_message_template: "Hi {customer_name}! You are currently #{{position}} in the {department_name} queue. Estimated wait: {estimated_wait} minutes.",
  update_interval_minutes: 2,
  agent_accept_timeout_seconds: 60,
  overflow_actions: ['ai_takeover'],
  grace_period_minutes: 5,
  csat_enabled: true,
  priority_lanes_enabled: false,
  wait_threshold_message: "You've been waiting for a while. Would you like to: (a) Continue waiting, (b) Leave a message for callback, (c) Get instant AI help?",
};

export default function QueueSettingsPanel({ brandId }) {
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [form, setForm] = useState({ ...DEFAULTS });
  const [settingsId, setSettingsId] = useState(null);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

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
    if (match) { setSettingsId(match.id); setForm({ ...DEFAULTS, ...match }); }
    else { setSettingsId(null); setForm({ ...DEFAULTS }); }
  }, [selectedDeptId, allSettings]);

  const save = async () => {
    const payload = { ...form, brand_id: brandId, department_id: selectedDeptId || null };
    if (settingsId) await base44.entities.QueueSettings.update(settingsId, payload);
    else { const c = await base44.entities.QueueSettings.create(payload); setSettingsId(c.id); }
    qc.invalidateQueries({ queryKey: ['queue-settings', brandId] });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const toggleOverflow = (val) => {
    const current = form.overflow_actions || [];
    setForm(f => ({ ...f, overflow_actions: current.includes(val) ? current.filter(x => x !== val) : [...current, val] }));
  };

  const copyFrom = async (sourceDeptId) => {
    const source = allSettings.find(s => (s.department_id || '') === sourceDeptId);
    if (!source) return;
    setForm({ ...DEFAULTS, ...source, department_id: selectedDeptId });
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Settings className="w-5 h-5 text-violet-600" />Queue Settings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Configure per brand and department independently</p>
        </div>
      </div>

      {/* Department selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-5 flex items-center gap-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Configure settings for</label>
          <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
            <option value="">Brand Default (all departments)</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        {departments.length > 1 && (
          <div className="shrink-0">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Copy from</label>
            <select onChange={e => e.target.value && copyFrom(e.target.value)} defaultValue=""
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">Select source…</option>
              {departments.filter(d => d.id !== selectedDeptId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Capacity */}
        <Section title="Queue Capacity">
          <div className="grid grid-cols-2 gap-4">
            <NumField label="Max Queue Size" value={form.max_queue_size} onChange={v => setForm(f => ({ ...f, max_queue_size: v }))} min={1} max={500} />
            <NumField label="Max Wait Time (minutes)" value={form.max_wait_minutes} onChange={v => setForm(f => ({ ...f, max_wait_minutes: v }))} min={1} max={120} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <NumField label="Agent Accept Timeout (seconds)" value={form.agent_accept_timeout_seconds} onChange={v => setForm(f => ({ ...f, agent_accept_timeout_seconds: v }))} min={10} max={300} />
            <NumField label="Grace Period (minutes)" value={form.grace_period_minutes} onChange={v => setForm(f => ({ ...f, grace_period_minutes: v }))} min={1} max={30} />
          </div>
        </Section>

        {/* Position updates */}
        <Section title="Position Messaging">
          <Toggle label="Send position updates to customers" checked={form.send_position_updates} onChange={v => setForm(f => ({ ...f, send_position_updates: v }))} />
          {form.send_position_updates && (
            <>
              <NumField label="Update interval (minutes)" value={form.update_interval_minutes} onChange={v => setForm(f => ({ ...f, update_interval_minutes: v }))} min={1} max={60} />
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Position Message Template</label>
                <p className="text-[11px] text-gray-400 mb-1.5">Use: {'{position}'}, {'{estimated_wait}'}, {'{brand_name}'}, {'{department_name}'}, {'{customer_name}'}</p>
                <textarea value={form.position_message_template} onChange={e => setForm(f => ({ ...f, position_message_template: e.target.value }))}
                  rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
              </div>
            </>
          )}
        </Section>

        {/* Wait threshold */}
        <Section title="Wait Threshold Message">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Message sent when wait exceeds threshold</label>
          <textarea value={form.wait_threshold_message} onChange={e => setForm(f => ({ ...f, wait_threshold_message: e.target.value }))}
            rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
        </Section>

        {/* Options */}
        <Section title="Features">
          <div className="space-y-2">
            <Toggle label="Priority lanes (VIP / Standard / Low)" checked={form.priority_lanes_enabled} onChange={v => setForm(f => ({ ...f, priority_lanes_enabled: v }))} />
            <Toggle label="CSAT survey after resolution" checked={form.csat_enabled} onChange={v => setForm(f => ({ ...f, csat_enabled: v }))} />
          </div>
        </Section>

        {/* Overflow */}
        <Section title="Overflow Actions (when queue is full or agents offline)">
          <p className="text-xs text-gray-400 mb-3">Select one or more. Customers are offered these options in order.</p>
          <div className="space-y-2">
            {OVERFLOW_OPTIONS.map(opt => {
              const selected = (form.overflow_actions || []).includes(opt.value);
              return (
                <label key={opt.value} onClick={() => toggleOverflow(opt.value)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={selected} readOnly className="mt-0.5 accent-violet-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-[11px] text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {(form.overflow_actions || []).includes('redirect_department') && (
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Redirect to Department</label>
              <select value={form.overflow_department_id || ''} onChange={e => setForm(f => ({ ...f, overflow_department_id: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                <option value="">Select department…</option>
                {departments.filter(d => d.id !== selectedDeptId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
        </Section>

        <button onClick={save}
          className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-sm text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function NumField({ label, value, onChange, min = 0, max = 9999 }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
      <input type="number" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value) || min)}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${checked ? 'bg-violet-600' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}