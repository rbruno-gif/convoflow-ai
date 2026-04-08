import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, Filter, Tag, Plus, X, Download, UserCheck, UserX } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const CHANNEL_COLORS = { chat: '#7c3aed', whatsapp: '#10b981', sms: '#3b82f6', email: '#f59e0b', facebook: '#1877f2', instagram: '#e1306c' };
const CHANNEL_ICONS = { chat: '💬', whatsapp: '📱', sms: '📲', email: '📧', facebook: '👥', instagram: '📸' };

export default function SubscriberManager({ brandId }) {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [addTag, setAddTag] = useState('');
  const qc = useQueryClient();

  const { data: subscribers = [] } = useQuery({
    queryKey: ['subscribers', brandId],
    queryFn: () => brandId ? base44.entities.Subscriber.filter({ brand_id: brandId }, '-last_interaction', 300) : base44.entities.Subscriber.list('-last_interaction', 300),
    refetchInterval: 30000,
  });

  const { data: customFields = [] } = useQuery({
    queryKey: ['custom-fields', brandId],
    queryFn: () => brandId ? base44.entities.CustomField.filter({ brand_id: brandId }) : base44.entities.CustomField.list(),
  });

  const filtered = subscribers.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search);
    const matchChannel = channelFilter === 'all' || s.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  const optedIn = subscribers.filter(s => s.is_opted_in !== false).length;
  const optedOut = subscribers.filter(s => s.is_opted_in === false).length;

  const applyTag = async (sub, tag) => {
    const tags = [...(sub.tags || [])];
    if (!tags.includes(tag)) {
      await base44.entities.Subscriber.update(sub.id, { tags: [...tags, tag] });
      qc.invalidateQueries({ queryKey: ['subscribers', brandId] });
      setSelected(s => s ? { ...s, tags: [...(s.tags || []), tag] } : s);
    }
  };

  const removeTag = async (sub, tag) => {
    await base44.entities.Subscriber.update(sub.id, { tags: (sub.tags || []).filter(t => t !== tag) });
    qc.invalidateQueries({ queryKey: ['subscribers', brandId] });
    setSelected(s => s ? { ...s, tags: (s.tags || []).filter(t => t !== tag) } : s);
  };

  const optOut = async (sub) => {
    await base44.entities.Subscriber.update(sub.id, { is_opted_in: false, opted_out_at: new Date().toISOString() });
    qc.invalidateQueries({ queryKey: ['subscribers', brandId] });
    setSelected(null);
  };

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Phone', 'Channel', 'Tags', 'Opted In', 'Last Interaction']];
    filtered.forEach(s => rows.push([s.name, s.email, s.phone, s.channel, (s.tags || []).join(';'), s.is_opted_in ? 'Yes' : 'No', s.last_interaction || '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`; a.download = 'subscribers.csv'; a.click();
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900">Subscribers</h2>
              <p className="text-xs text-gray-400">{optedIn} opted in · {optedOut} opted out · {subscribers.length} total</p>
            </div>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone…"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="all">All Channels</option>
              {['chat', 'whatsapp', 'sms', 'email', 'facebook', 'instagram'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
              <tr>
                {['Subscriber', 'Channel', 'Tags', 'Opt-in', 'Last Active', ''].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => (
                <tr key={s.id} onClick={() => setSelected(s)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: `linear-gradient(135deg, ${CHANNEL_COLORS[s.channel] || '#7c3aed'}, #4f46e5)` }}>
                        {s.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.email || s.phone || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs">{CHANNEL_ICONS[s.channel]} {s.channel}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {(s.tags || []).slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">{t}</span>
                      ))}
                      {(s.tags || []).length > 3 && <span className="text-[10px] text-gray-400">+{(s.tags || []).length - 3}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.is_opted_in !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.is_opted_in !== false ? 'Opted In' : 'Opted Out'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-gray-400">
                      {s.last_interaction ? formatDistanceToNow(new Date(s.last_interaction), { addSuffix: true }) : '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[10px] text-violet-600 hover:underline">View →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No subscribers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Subscriber detail */}
      {selected && (
        <div className="w-72 shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-sm text-gray-900">Subscriber Profile</p>
            <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold mb-2"
                style={{ background: `linear-gradient(135deg, ${CHANNEL_COLORS[selected.channel] || '#7c3aed'}, #4f46e5)` }}>
                {selected.name?.charAt(0)?.toUpperCase()}
              </div>
              <p className="font-bold text-gray-900">{selected.name}</p>
              <p className="text-xs text-gray-400">{selected.email || selected.phone}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{CHANNEL_ICONS[selected.channel]} {selected.channel}</span>
            </div>

            <div className="space-y-2 text-xs">
              {[['Opted In', selected.is_opted_in !== false ? 'Yes ✓' : 'No ✗'], ['Source', selected.source || '—'], ['Joined', selected.created_date ? format(new Date(selected.created_date), 'MMM d, yyyy') : '—'], ['Last Active', selected.last_interaction ? formatDistanceToNow(new Date(selected.last_interaction), { addSuffix: true }) : '—']].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-gray-700">{v}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(selected.tags || []).map(t => (
                  <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                    {t}
                    <button onClick={() => removeTag(selected, t)}><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={addTag} onChange={e => setAddTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && addTag.trim()) { applyTag(selected, addTag.trim()); setAddTag(''); } }}
                  placeholder="Add tag…" className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                <button onClick={() => { if (addTag.trim()) { applyTag(selected, addTag.trim()); setAddTag(''); } }}
                  className="p-1.5 bg-violet-600 text-white rounded-lg"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Custom fields */}
            {customFields.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Custom Fields</p>
                <div className="space-y-1.5">
                  {customFields.map(cf => (
                    <div key={cf.id} className="flex justify-between text-xs">
                      <span className="text-gray-400">{cf.name}</span>
                      <span className="font-medium text-gray-700">{selected.custom_fields?.[cf.key] || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flow history */}
            {(selected.flow_history || []).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Flow History</p>
                <div className="space-y-2">
                  {(selected.flow_history || []).slice(-5).map((h, i) => (
                    <div key={i} className="text-[11px] text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                      {h.flow_name || h.flow_id}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.is_opted_in !== false && (
              <button onClick={() => optOut(selected)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5">
                <UserX className="w-3.5 h-3.5" /> Opt Out Subscriber
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}