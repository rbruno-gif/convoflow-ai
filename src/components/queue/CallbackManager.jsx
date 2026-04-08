import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PhoneCall, Clock, CheckCircle, AlertCircle, Plus, X, Phone, User, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = { pending: '#f59e0b', scheduled: '#3b82f6', completed: '#10b981', missed: '#ef4444' };
const STATUS_ICONS = { pending: Clock, scheduled: Calendar, completed: CheckCircle, missed: AlertCircle };

export default function CallbackManager({ brandId }) {
  const [filter, setFilter] = useState('pending');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: callbacks = [] } = useQuery({
    queryKey: ['callbacks', brandId],
    queryFn: () => brandId
      ? base44.entities.CallbackRequest.filter({ brand_id: brandId }, '-created_date', 200)
      : base44.entities.CallbackRequest.list('-created_date', 200),
    refetchInterval: 15000,
  });

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', brandId],
    queryFn: () => brandId ? base44.entities.Department.filter({ brand_id: brandId }) : base44.entities.Department.list(),
  });

  const filtered = callbacks.filter(c => filter === 'all' || c.status === filter);

  const updateStatus = async (id, status) => {
    await base44.entities.CallbackRequest.update(id, { status });
    qc.invalidateQueries({ queryKey: ['callbacks', brandId] });
  };

  const save = async () => {
    setSaving(true);
    const payload = { ...form, brand_id: brandId };
    await base44.entities.CallbackRequest.create(payload);
    qc.invalidateQueries({ queryKey: ['callbacks', brandId] });
    setForm(null); setSaving(false);
  };

  const pending = callbacks.filter(c => c.status === 'pending').length;
  const scheduled = callbacks.filter(c => c.status === 'scheduled').length;
  const missed = callbacks.filter(c => c.status === 'missed').length;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><PhoneCall className="w-5 h-5 text-violet-600" /> Callback Manager</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage callback requests from overflow and wait threshold triggers</p>
        </div>
        <button onClick={() => setForm({ customer_name: '', customer_phone: '', status: 'pending', source: 'overflow', notes: '' })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-3.5 h-3.5" /> New Callback
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Pending', value: pending, color: '#f59e0b' },
          { label: 'Scheduled', value: scheduled, color: '#3b82f6' },
          { label: 'Missed', value: missed, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {['pending', 'scheduled', 'completed', 'missed', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-white shadow-sm text-violet-700 font-semibold' : 'text-gray-500'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-100">
            <PhoneCall className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-500">No {filter} callbacks</p>
          </div>
        )}
        {filtered.map(cb => {
          const Icon = STATUS_ICONS[cb.status] || Clock;
          const color = STATUS_COLORS[cb.status] || '#6b7280';
          const dept = departments.find(d => d.id === cb.department_id);
          return (
            <div key={cb.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-gray-900">{cb.customer_name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                    style={{ background: `${color}15`, color }}>{cb.status}</span>
                  {dept && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{dept.name}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{cb.customer_phone || 'No phone'}</span>
                  {cb.assigned_agent_email && <span className="flex items-center gap-1"><User className="w-3 h-3" />{cb.assigned_agent_email}</span>}
                  {cb.scheduled_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(cb.scheduled_at), 'MMM d, HH:mm')}</span>}
                  <span>{cb.created_date ? formatDistanceToNow(new Date(cb.created_date), { addSuffix: true }) : ''}</span>
                </div>
                {cb.notes && <p className="text-xs text-gray-500 mt-1 italic">"{cb.notes}"</p>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {cb.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(cb.id, 'scheduled')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200">Schedule</button>
                    <button onClick={() => updateStatus(cb.id, 'completed')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200">Done</button>
                    <button onClick={() => updateStatus(cb.id, 'missed')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200">Missed</button>
                  </>
                )}
                {cb.status === 'scheduled' && (
                  <button onClick={() => updateStatus(cb.id, 'completed')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200">Mark Done</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual create modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Callback Request</h2>
              <button onClick={() => setForm(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[{ label: 'Customer Name', field: 'customer_name', placeholder: 'John Doe' }, { label: 'Phone Number', field: 'customer_phone', placeholder: '+1 555-000-0000' }].map(f => (
                <div key={f.field}>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">{f.label}</label>
                  <input value={form[f.field] || ''} onChange={e => setForm(fm => ({ ...fm, [f.field]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Assign Agent</label>
                <select value={form.assigned_agent_email || ''} onChange={e => setForm(f => ({ ...f, assigned_agent_email: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="">Unassigned</option>
                  {users.filter(u => u.role !== 'readonly').map(u => <option key={u.id} value={u.email}>{u.full_name || u.email}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Schedule Time (optional)</label>
                <input type="datetime-local" value={form.scheduled_at || ''} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value, status: e.target.value ? 'scheduled' : 'pending' }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.customer_name?.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {saving ? 'Saving…' : 'Create Callback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}