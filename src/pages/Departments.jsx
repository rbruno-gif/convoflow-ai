import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Building2, Plus, Users, MessageSquare, Edit2, ToggleRight, ToggleLeft, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#7c3aed', '#0891b2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
const DEFAULT_DEPTS = [
  { name: 'Sales', color: '#10b981' },
  { name: 'Technical Support', color: '#0891b2' },
  { name: 'Billing', color: '#f59e0b' },
  { name: 'Retention', color: '#7c3aed' },
  { name: 'General Enquiries', color: '#6b7280' },
];

export default function Departments() {
  const { activeBrandId, activeBrand } = useBrand();
  const [form, setForm] = useState(null); // null | dept object
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Department.filter({ brand_id: activeBrandId }, 'name', 100)
      : base44.entities.Department.list('name', 100),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['convos-dept', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-created_date', 500)
      : base44.entities.Conversation.list('-created_date', 500),
  });

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  const openConvos = conversations.filter(c => c.status === 'active' || c.status === 'waiting');

  const getDeptWorkload = (dept) => openConvos.filter(c => c.department_id === dept.id).length;

  const seedDefaults = async () => {
    if (!activeBrandId) return;
    for (const d of DEFAULT_DEPTS) {
      await base44.entities.Department.create({ ...d, brand_id: activeBrandId, is_active: true });
    }
    qc.invalidateQueries({ queryKey: ['departments', activeBrandId] });
  };

  const save = async () => {
    setSaving(true);
    const payload = { ...form, brand_id: activeBrandId };
    if (form.id) await base44.entities.Department.update(form.id, payload);
    else await base44.entities.Department.create(payload);
    qc.invalidateQueries({ queryKey: ['departments', activeBrandId] });
    setForm(null);
    setSaving(false);
  };

  const toggle = async (dept) => {
    await base44.entities.Department.update(dept.id, { is_active: !dept.is_active });
    qc.invalidateQueries({ queryKey: ['departments', activeBrandId] });
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeBrand?.name || 'All brands'} · {departments.length} departments</p>
        </div>
        <div className="flex gap-2">
          {departments.length === 0 && activeBrandId && (
            <Button variant="outline" size="sm" onClick={seedDefaults}>Seed Defaults</Button>
          )}
          <Button size="sm" onClick={() => setForm({ name: '', color: '#7c3aed', description: '', assigned_agents: [], routing_keywords: [], is_active: true })}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Department
          </Button>
        </div>
      </div>

      {/* Workload overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Departments', value: departments.filter(d => d.is_active).length, color: '#7c3aed' },
          { label: 'Open Conversations', value: openConvos.length, color: '#3b82f6' },
          { label: 'Routed', value: openConvos.filter(c => c.department_id).length, color: '#10b981' },
          { label: 'Unrouted', value: openConvos.filter(c => !c.department_id).length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Department cards */}
      <div className="space-y-3">
        {departments.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-600">No departments yet</p>
            <p className="text-sm text-gray-400 mt-1">Create departments to route conversations automatically</p>
          </div>
        )}
        {departments.map(dept => {
          const workload = getDeptWorkload(dept);
          const agents = users.filter(u => dept.assigned_agents?.includes(u.email));
          return (
            <div key={dept.id} className={`bg-white rounded-xl border p-5 shadow-sm flex items-center gap-4 ${!dept.is_active ? 'opacity-50' : ''}`}>
              <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ background: dept.color || '#7c3aed' }}>
                {dept.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900">{dept.name}</p>
                  {!dept.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                </div>
                {dept.description && <p className="text-xs text-gray-400 truncate">{dept.description}</p>}
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="flex items-center gap-1 text-[11px] text-gray-500"><Users className="w-3 h-3" />{agents.length} agents</span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-500"><MessageSquare className="w-3 h-3" />{workload} open</span>
                  {dept.routing_keywords?.length > 0 && (
                    <span className="flex gap-1 flex-wrap">
                      {dept.routing_keywords.slice(0, 3).map(k => (
                        <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">/{k}</span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              {/* Real-time workload bar */}
              <div className="w-24 shrink-0">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>Load</span><span>{workload}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, workload * 10)}%`, background: workload > 8 ? '#ef4444' : workload > 5 ? '#f59e0b' : dept.color }} />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setForm(dept)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={() => toggle(dept)}>
                  {dept.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{form.id ? 'Edit' : 'New'} Department</h2>
              <button onClick={() => setForm(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="e.g. Technical Support" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
                <input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="Optional description" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Color Label</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{ background: c, borderColor: form.color === c ? '#1f2937' : 'transparent' }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Routing Keywords (comma separated)</label>
                <input
                  value={(form.routing_keywords || []).join(', ')}
                  onChange={e => setForm(f => ({ ...f, routing_keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="billing, invoice, payment" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Assign Agents</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {users.filter(u => u.role !== 'admin').map(u => (
                    <label key={u.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox"
                        checked={(form.assigned_agents || []).includes(u.email)}
                        onChange={e => setForm(f => ({
                          ...f,
                          assigned_agents: e.target.checked
                            ? [...(f.assigned_agents || []), u.email]
                            : (f.assigned_agents || []).filter(x => x !== u.email)
                        }))}
                        className="accent-violet-600" />
                      <span className="text-sm text-gray-700">{u.full_name || u.email}</span>
                      <span className="text-[10px] text-gray-400">{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">Cancel</button>
              <button onClick={save} disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {saving ? 'Saving…' : 'Save Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}