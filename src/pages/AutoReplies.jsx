import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Zap, Plus, Edit2, Trash2, ToggleRight, ToggleLeft, X, MessageSquare } from 'lucide-react';

const TRIGGERS = [
  { value: 'outside_hours', label: 'Outside Business Hours', desc: 'Auto-sends when customer messages outside operating hours' },
  { value: 'first_message', label: 'First Message', desc: 'Sends on the very first message from a new customer' },
  { value: 'keyword', label: 'Keyword Detected', desc: 'Triggers when a specific word is found in the message' },
  { value: 'channel', label: 'Specific Channel', desc: 'Triggers for messages from a specific channel' },
  { value: 'no_agent', label: 'No Agent Available', desc: 'Sends when all agents are busy or offline' },
];

const MERGE_FIELDS = ['{customer_name}', '{brand_name}', '{business_hours}', '{agent_name}'];

const BLANK = { name: '', trigger: 'outside_hours', trigger_value: '', message: '', is_active: true };

export default function AutoReplies() {
  const { activeBrandId, activeBrand } = useBrand();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: replies = [] } = useQuery({
    queryKey: ['auto-replies', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.AutoReply.filter({ brand_id: activeBrandId }) : base44.entities.AutoReply.list(),
  });

  const { data: cannedResponses = [] } = useQuery({
    queryKey: ['canned', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.CannedResponse.filter({ brand_id: activeBrandId }) : base44.entities.CannedResponse.list(),
  });

  const save = async () => {
    setSaving(true);
    const payload = { ...form, brand_id: activeBrandId };
    if (form.id) await base44.entities.AutoReply.update(form.id, payload);
    else await base44.entities.AutoReply.create(payload);
    qc.invalidateQueries({ queryKey: ['auto-replies', activeBrandId] });
    setForm(null); setSaving(false);
  };

  const del = async (id) => { await base44.entities.AutoReply.delete(id); qc.invalidateQueries({ queryKey: ['auto-replies', activeBrandId] }); };
  const toggle = async (r) => { await base44.entities.AutoReply.update(r.id, { is_active: !r.is_active }); qc.invalidateQueries({ queryKey: ['auto-replies', activeBrandId] }); };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Auto-Replies & Templates</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeBrand?.name || 'All brands'}</p>
        </div>
        <button onClick={() => setForm({ ...BLANK })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-3.5 h-3.5" /> New Auto-Reply
        </button>
      </div>

      {/* Merge fields hint */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-5">
        <p className="text-xs font-semibold text-violet-800 mb-2">Available Merge Fields</p>
        <div className="flex flex-wrap gap-2">
          {MERGE_FIELDS.map(f => (
            <code key={f} className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded font-mono">{f}</code>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {replies.length === 0 && (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-100">
            <Zap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-500">No auto-replies yet</p>
          </div>
        )}
        {replies.map(r => {
          const trigger = TRIGGERS.find(t => t.value === r.trigger);
          return (
            <div key={r.id} className={`bg-white rounded-xl border p-4 shadow-sm flex items-start gap-4 ${!r.is_active ? 'opacity-60' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-yellow-500" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-gray-900">{r.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{trigger?.label}</span>
                  {!r.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{r.message}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setForm(r)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                <button onClick={() => toggle(r)}>{r.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}</button>
                <button onClick={() => del(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canned Responses */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-violet-600" /> Canned Responses</h2>
        <button onClick={() => setForm({ type: 'canned', shortcut: '', title: '', content: '', is_shared: true, brand_id: activeBrandId })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {cannedResponses.map(cr => (
          <div key={cr.id} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 shadow-sm">
            <code className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded font-mono shrink-0">{cr.shortcut}</code>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">{cr.title}</p>
              <p className="text-[11px] text-gray-400 truncate">{cr.content}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${cr.is_shared ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {cr.is_shared ? 'Team' : 'Personal'}
            </span>
            <button onClick={async () => { await base44.entities.CannedResponse.delete(cr.id); qc.invalidateQueries({ queryKey: ['canned', activeBrandId] }); }}
              className="p-1.5 hover:bg-red-50 rounded-lg shrink-0"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{form.type === 'canned' ? 'New Canned Response' : (form.id ? 'Edit' : 'New') + ' Auto-Reply'}</h2>
              <button onClick={() => setForm(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {form.type === 'canned' ? (
                <>
                  <Field label="Shortcut (e.g. /refund)" value={form.shortcut || ''} onChange={v => setForm(f => ({ ...f, shortcut: v }))} placeholder="/shortcut" />
                  <Field label="Title" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Response title" />
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Content</label>
                    <textarea value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_shared} onChange={e => setForm(f => ({ ...f, is_shared: e.target.checked }))} className="accent-violet-600" />
                    <span className="text-sm text-gray-700">Shared with whole team</span>
                  </label>
                </>
              ) : (
                <>
                  <Field label="Name" value={form.name || ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. After Hours Reply" />
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Trigger</label>
                    <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                      {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  {(form.trigger === 'keyword' || form.trigger === 'channel') && (
                    <Field label={form.trigger === 'keyword' ? 'Keyword' : 'Channel'} value={form.trigger_value || ''} onChange={v => setForm(f => ({ ...f, trigger_value: v }))} placeholder={form.trigger === 'keyword' ? 'e.g. refund' : 'e.g. email'} />
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Message</label>
                    <textarea value={form.message || ''} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                      placeholder="Hi {customer_name}, thanks for reaching out to {brand_name}..." />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={async () => {
                setSaving(true);
                if (form.type === 'canned') {
                  const payload = { shortcut: form.shortcut, title: form.title, content: form.content, is_shared: form.is_shared, brand_id: activeBrandId };
                  await base44.entities.CannedResponse.create(payload);
                  qc.invalidateQueries({ queryKey: ['canned', activeBrandId] });
                } else { await save(); }
                setForm(null); setSaving(false);
              }} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
    </div>
  );
}