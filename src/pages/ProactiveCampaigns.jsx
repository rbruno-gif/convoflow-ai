import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Megaphone, Plus, Send, Calendar, Users, TrendingUp, X, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const BLANK = { name: '', message: '', channel: 'email', status: 'draft', scheduled_at: '', audience_filters: {} };
const STATUS_COLORS = { draft: '#6b7280', scheduled: '#f59e0b', sent: '#10b981', cancelled: '#ef4444' };
const CHANNEL_LABELS = { chat: '💬 Chat', email: '📧 Email', whatsapp: '📱 WhatsApp' };

export default function ProactiveCampaigns() {
  const { activeBrandId, activeBrand } = useBrand();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns-promo', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.ProactiveCampaign.filter({ brand_id: activeBrandId }, '-created_date', 100) : base44.entities.ProactiveCampaign.list('-created_date', 100),
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ['customer-profiles', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.CustomerProfile.filter({ brand_id: activeBrandId }) : base44.entities.CustomerProfile.list(),
  });

  const save = async () => {
    setSaving(true);
    const payload = { ...form, brand_id: activeBrandId };
    if (form.id) await base44.entities.ProactiveCampaign.update(form.id, payload);
    else await base44.entities.ProactiveCampaign.create(payload);
    qc.invalidateQueries({ queryKey: ['campaigns-promo', activeBrandId] });
    setForm(null); setSaving(false);
  };

  const sendNow = async (campaign) => {
    const audience = profiles.filter(p => !p.is_opted_out);
    if (campaign.channel === 'email') {
      for (const profile of audience.slice(0, 50)) {
        if (!profile.email) continue;
        await base44.integrations.Core.SendEmail({
          to: profile.email,
          subject: campaign.name,
          body: campaign.message.replace('{customer_name}', profile.name || 'Customer').replace('{brand_name}', activeBrand?.name || ''),
        });
      }
    }
    await base44.entities.ProactiveCampaign.update(campaign.id, { status: 'sent', sent_count: audience.length });
    qc.invalidateQueries({ queryKey: ['campaigns-promo', activeBrandId] });
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Megaphone className="w-5 h-5 text-violet-600" /> Proactive Campaigns</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeBrand?.name || 'All brands'} · {profiles.filter(p => !p.is_opted_out).length} reachable customers</p>
        </div>
        <button onClick={() => setForm({ ...BLANK })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Campaigns', value: campaigns.length, color: '#7c3aed' },
          { label: 'Sent', value: campaigns.filter(c => c.status === 'sent').length, color: '#10b981' },
          { label: 'Total Sent', value: campaigns.reduce((s, c) => s + (c.sent_count || 0), 0), color: '#3b82f6' },
          { label: 'Opt-Outs', value: profiles.filter(p => p.is_opted_out).length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-500">No campaigns yet</p>
            <p className="text-sm text-gray-400">Create your first proactive outbound campaign</p>
          </div>
        )}
        {campaigns.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${STATUS_COLORS[c.status]}15` }}>
                  <Megaphone className="w-4 h-4" style={{ color: STATUS_COLORS[c.status] }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{CHANNEL_LABELS[c.channel]}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: `${STATUS_COLORS[c.status]}15`, color: STATUS_COLORS[c.status] }}>{c.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.status === 'draft' && (
                  <button onClick={() => sendNow(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <Send className="w-3 h-3" /> Send Now
                  </button>
                )}
                <button onClick={() => setForm(c)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                <button onClick={async () => { await base44.entities.ProactiveCampaign.delete(c.id); qc.invalidateQueries({ queryKey: ['campaigns-promo', activeBrandId] }); }}
                  className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{c.message}</p>
            {c.status === 'sent' && (
              <div className="flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Send className="w-3 h-3 text-blue-500" />{c.sent_count || 0} sent</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" />{c.reply_count || 0} replies</span>
              </div>
            )}
            {c.scheduled_at && c.status === 'scheduled' && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" />Scheduled: {format(new Date(c.scheduled_at), 'MMM d, yyyy HH:mm')}</p>
            )}
          </div>
        ))}
      </div>

      {/* Form modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{form.id ? 'Edit' : 'New'} Campaign</h2>
              <button onClick={() => setForm(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Campaign Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="e.g. April Service Alert" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Channel</label>
                <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="email">Email</option>
                  <option value="chat">Chat</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Message</label>
                <p className="text-[11px] text-gray-400 mb-1">Use: {'{customer_name}'}, {'{brand_name}'}</p>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                  placeholder="Hi {customer_name}, we wanted to let you know..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduled_at || ''} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value, status: e.target.value ? 'scheduled' : 'draft' }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                <p className="font-medium mb-1">Audience: {profiles.filter(p => !p.is_opted_out).length} reachable customers</p>
                <p className="text-gray-400">Customers who have replied STOP are automatically excluded</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={save} disabled={saving || !form.name?.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {saving ? 'Saving…' : 'Save Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}