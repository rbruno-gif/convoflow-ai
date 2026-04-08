import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Shield, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';

const PRIORITY_COLORS = { low: '#6b7280', normal: '#3b82f6', high: '#f59e0b', urgent: '#ef4444' };
const BLANK = { name: '', first_response_minutes: 120, resolution_hours: 24, priority: 'normal', escalate_to_email: '', is_active: true };

export default function SLARules() {
  const { activeBrandId, activeBrand } = useBrand();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['sla-rules', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.SLARule.filter({ brand_id: activeBrandId }) : base44.entities.SLARule.list(),
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ['convos-sla', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.Conversation.filter({ brand_id: activeBrandId, status: 'active' }, '-created_date', 200) : base44.entities.Conversation.list('-created_date', 200),
    refetchInterval: 30000,
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.Department.filter({ brand_id: activeBrandId }) : base44.entities.Department.list(),
  });

  const save = async () => {
    setSaving(true);
    const payload = { ...form, brand_id: activeBrandId };
    if (form.id) await base44.entities.SLARule.update(form.id, payload);
    else await base44.entities.SLARule.create(payload);
    qc.invalidateQueries({ queryKey: ['sla-rules', activeBrandId] });
    setForm(null); setSaving(false);
  };

  // SLA breach analysis
  const activeConvos = conversations.filter(c => c.status === 'active');
  const defaultSLA = rules.find(r => r.priority === 'normal') || { first_response_minutes: 120 };

  const getSLAStatus = (convo) => {
    const minutesOpen = convo.created_date ? differenceInMinutes(new Date(), new Date(convo.created_date)) : 0;
    const limit = defaultSLA.first_response_minutes || 120;
    if (minutesOpen > limit) return 'breached';
    if (minutesOpen > limit * 0.8) return 'warning';
    return 'ok';
  };

  const breached = activeConvos.filter(c => getSLAStatus(c) === 'breached').length;
  const warning = activeConvos.filter(c => getSLAStatus(c) === 'warning').length;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-violet-600" /> SLA Rules</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeBrand?.name || 'All brands'}</p>
        </div>
        <button onClick={() => setForm({ ...BLANK })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-3.5 h-3.5" /> New SLA Rule
        </button>
      </div>

      {/* Live SLA status */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-700">{activeConvos.length - breached - warning}</p>
          <p className="text-xs text-green-600 font-medium">Within SLA</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-700">{warning}</p>
          <p className="text-xs text-amber-600 font-medium">Approaching Breach</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-700">{breached}</p>
          <p className="text-xs text-red-600 font-medium">SLA Breached</p>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-3 mb-6">
        {rules.length === 0 && (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-100">
            <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-500">No SLA rules yet</p>
            <p className="text-sm text-gray-400 mt-1">Create rules to automatically track response and resolution times</p>
          </div>
        )}
        {rules.map(rule => {
          const dept = departments.find(d => d.id === rule.department_id);
          return (
            <div key={rule.id} className="bg-white rounded-xl border p-5 shadow-sm flex items-center gap-4">
              <div className="w-2 h-10 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[rule.priority] || '#6b7280' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900">{rule.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                    style={{ background: `${PRIORITY_COLORS[rule.priority]}20`, color: PRIORITY_COLORS[rule.priority] }}>
                    {rule.priority}
                  </span>
                  {dept && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{dept.name}</span>}
                </div>
                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                  <span>First response: <strong className="text-gray-700">{rule.first_response_minutes}m</strong></span>
                  <span>Resolution: <strong className="text-gray-700">{rule.resolution_hours}h</strong></span>
                  {rule.escalate_to_email && <span>Escalates to: <strong className="text-gray-700">{rule.escalate_to_email}</strong></span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setForm(rule)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                <button onClick={async () => { await base44.entities.SLARule.delete(rule.id); qc.invalidateQueries({ queryKey: ['sla-rules', activeBrandId] }); }}
                  className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Breached conversations */}
      {breached > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-sm text-red-800">SLA Breached Conversations</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {activeConvos.filter(c => getSLAStatus(c) === 'breached').slice(0, 10).map(c => {
              const mins = differenceInMinutes(new Date(), new Date(c.created_date));
              return (
                <a key={c.id} href={`/conversations?id=${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{c.customer_name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.last_message}</p>
                  </div>
                  <span className="text-xs text-red-600 font-semibold shrink-0">{Math.floor(mins / 60)}h {mins % 60}m over SLA</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Form modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{form.id ? 'Edit' : 'New'} SLA Rule</h2>
              <button onClick={() => setForm(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <FormField label="Rule Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Standard Response SLA" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">First Response (minutes)</label>
                  <input type="number" value={form.first_response_minutes} onChange={e => setForm(f => ({ ...f, first_response_minutes: parseInt(e.target.value) || 0 }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Resolution (hours)</label>
                  <input type="number" value={form.resolution_hours} onChange={e => setForm(f => ({ ...f, resolution_hours: parseInt(e.target.value) || 0 }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Department (optional)</label>
                <select value={form.department_id || ''} onChange={e => setForm(f => ({ ...f, department_id: e.target.value || null }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="">All departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <FormField label="Escalate to Email (on breach)" value={form.escalate_to_email || ''} onChange={v => setForm(f => ({ ...f, escalate_to_email: v }))} placeholder="manager@company.com" />
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.name?.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {saving ? 'Saving…' : 'Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
      <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
    </div>
  );
}