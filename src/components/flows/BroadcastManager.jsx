import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Plus, Send, X, CheckCircle, AlertTriangle, BarChart2, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = { draft: '#6b7280', scheduled: '#3b82f6', sending: '#f59e0b', sent: '#10b981', cancelled: '#ef4444' };
const CHANNEL_ICONS = { chat: '💬', whatsapp: '📱', sms: '📲', email: '📧' };

export default function BroadcastManager({ brandId }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [estimatedReach, setEstimatedReach] = useState(0);
  const qc = useQueryClient();

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['broadcasts', brandId],
    queryFn: () => brandId ? base44.entities.Broadcast.filter({ brand_id: brandId }, '-created_date', 100) : base44.entities.Broadcast.list('-created_date', 100),
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ['subscribers', brandId],
    queryFn: () => brandId ? base44.entities.Subscriber.filter({ brand_id: brandId }) : base44.entities.Subscriber.list(),
  });

  const openNew = () => {
    const reach = subscribers.filter(s => s.is_opted_in !== false).length;
    setEstimatedReach(reach);
    setForm({ name: '', message: '', message_type: 'text', channel: 'chat', status: 'draft', smart_send_time: false, segment_filters: {} });
  };

  const save = async (send = false) => {
    setSaving(true);
    const payload = {
      ...form,
      brand_id: brandId,
      estimated_reach: estimatedReach,
      status: send ? 'sent' : form.scheduled_at ? 'scheduled' : 'draft',
      sent_at: send ? new Date().toISOString() : undefined,
      delivered_count: send ? estimatedReach : 0,
    };
    await base44.entities.Broadcast.create(payload);
    qc.invalidateQueries({ queryKey: ['broadcasts', brandId] });
    setSaving(false); setForm(null);
  };

  const totalSent = broadcasts.reduce((s, b) => s + (b.delivered_count || 0), 0);
  const totalReplied = broadcasts.reduce((s, b) => s + (b.replied_count || 0), 0);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-gray-900">Broadcast Campaigns</h2>
          <p className="text-xs text-gray-400">{broadcasts.length} broadcasts · {totalSent.toLocaleString()} total delivered</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
          <Plus className="w-4 h-4" /> New Broadcast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Broadcasts', value: broadcasts.length, color: '#7c3aed' },
          { label: 'Messages Delivered', value: totalSent.toLocaleString(), color: '#10b981' },
          { label: 'Total Replies', value: totalReplied, color: '#3b82f6' },
          { label: 'Avg Reply Rate', value: totalSent > 0 ? `${Math.round((totalReplied / totalSent) * 100)}%` : '—', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {broadcasts.map(b => (
          <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: `${STATUS_COLORS[b.status] || '#6b7280'}15` }}>
                {CHANNEL_ICONS[b.channel] || '📢'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{b.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                    style={{ background: `${STATUS_COLORS[b.status] || '#6b7280'}15`, color: STATUS_COLORS[b.status] || '#6b7280' }}>
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mb-2">{b.message}</p>
                {b.status === 'sent' && (
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{b.delivered_count} delivered</span>
                    <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />{b.replied_count || 0} replied</span>
                    <span className="flex items-center gap-1"><Send className="w-3 h-3" />{b.clicked_count || 0} clicked</span>
                    {b.opted_out_count > 0 && <span className="text-red-400">{b.opted_out_count} opted out</span>}
                    {b.sent_at && <span>{formatDistanceToNow(new Date(b.sent_at), { addSuffix: true })}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {broadcasts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <Mail className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-semibold text-gray-500">No broadcasts yet</p>
            <p className="text-sm text-gray-400 mt-1">Send your first one-time broadcast message to a subscriber segment</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Broadcast</h2>
              <button onClick={() => setForm(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[{ label: 'Campaign Name', key: 'name', placeholder: 'e.g. Summer Plan Promotion' }].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">{f.label}</label>
                  <input value={form[f.key] || ''} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Channel</label>
                  <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {['chat', 'whatsapp', 'sms', 'email'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Message Type</label>
                  <select value={form.message_type} onChange={e => setForm(f => ({ ...f, message_type: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {['text', 'image', 'card'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
                  placeholder="Hi {first_name}! Here's a special offer just for you..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                <p className="text-[10px] text-gray-400 mt-1">Use {'{first_name}'}, {'{brand_name}'} as merge fields</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduled_at || ''} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex items-center gap-3">
                <Users className="w-4 h-4 text-violet-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-violet-700">Estimated Reach: {estimatedReach} subscribers</p>
                  <p className="text-[11px] text-violet-500">Only opted-in subscribers will receive this message</p>
                </div>
              </div>
              {form.channel === 'whatsapp' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700">WhatsApp broadcasts only reach subscribers who messaged within the last 24 hours unless using a pre-approved template.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => save(false)} disabled={saving || !form.name || !form.message}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 disabled:opacity-40">
                Save Draft
              </button>
              <button onClick={() => save(true)} disabled={saving || !form.name || !form.message}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                <Send className="w-4 h-4" /> Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}