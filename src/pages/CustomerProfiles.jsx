import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { User, MessageSquare, Ticket, Clock, Search, Phone, Mail, Tag, X, Save, Plus } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function CustomerProfiles() {
  const { activeBrandId, activeBrand } = useBrand();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['customer-profiles', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.CustomerProfile.filter({ brand_id: activeBrandId }, '-last_contact_date', 200) : base44.entities.CustomerProfile.list('-last_contact_date', 200),
  });
  const { data: allConvos = [] } = useQuery({
    queryKey: ['convos-prof', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-created_date', 500) : base44.entities.Conversation.list('-created_date', 500),
  });
  const { data: allTickets = [] } = useQuery({
    queryKey: ['tickets-prof', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.Ticket.filter({ brand_id: activeBrandId }, '-created_date', 200) : base44.entities.Ticket.list('-created_date', 200),
  });

  const filtered = profiles.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  );

  const selectedProfile = profiles.find(p => p.id === selected);
  const profileConvos = selectedProfile ? allConvos.filter(c => c.customer_name === selectedProfile.name || (selectedProfile.fb_id && c.customer_fb_id === selectedProfile.fb_id)) : [];
  const profileTickets = selectedProfile ? allTickets.filter(t => t.customer_name === selectedProfile.name) : [];

  const saveNote = async () => {
    if (!selectedProfile) return;
    setSaving(true);
    await base44.entities.CustomerProfile.update(selectedProfile.id, { notes: editNote });
    qc.invalidateQueries({ queryKey: ['customer-profiles', activeBrandId] });
    setSaving(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* List */}
      <div className={`${selectedProfile ? 'w-80 shrink-0' : 'flex-1'} flex flex-col bg-gray-50 border-r border-gray-100`}>
        <div className="p-4 bg-white border-b border-gray-100">
          <h1 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-violet-600" /> Customer Profiles</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{filtered.length} profiles · {activeBrand?.name || 'All brands'}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No customer profiles yet</p>
            </div>
          )}
          {filtered.map(p => (
            <div key={p.id} onClick={() => { setSelected(p.id); setEditNote(p.notes || ''); }}
              className={`flex items-center gap-3 p-3.5 cursor-pointer border-b border-gray-100 hover:bg-white transition-colors ${selected === p.id ? 'bg-white border-l-2 border-l-violet-500' : ''}`}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {p.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{p.email || p.phone || p.preferred_channel}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{p.total_conversations || 0}</span>
                  {p.last_contact_date && <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(p.last_contact_date), { addSuffix: true })}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile detail */}
      {selectedProfile && (
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              {selectedProfile.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{selectedProfile.name}</h2>
              <div className="flex items-center gap-4 mt-1">
                {selectedProfile.email && <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{selectedProfile.email}</span>}
                {selectedProfile.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{selectedProfile.phone}</span>}
                <span className="text-xs text-gray-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{selectedProfile.preferred_channel || 'chat'}</span>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
          </div>

          <div className="p-6 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Conversations', value: profileConvos.length, color: '#7c3aed' },
                { label: 'Open Tickets', value: profileTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length, color: '#ef4444' },
                { label: 'Last Contact', value: selectedProfile.last_contact_date ? formatDistanceToNow(new Date(selectedProfile.last_contact_date), { addSuffix: true }) : 'Never', color: '#10b981', small: true },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className={`${s.small ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">Agent Notes</h3>
                <button onClick={saveNote} disabled={saving} className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
                  <Save className="w-3 h-3" />{saving ? 'Saving…' : 'Save'}
                </button>
              </div>
              <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={3}
                placeholder="Add private notes about this customer…"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
            </div>

            {/* Conversation history */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Conversation History</h3>
              {profileConvos.length === 0 ? (
                <p className="text-sm text-gray-400">No conversations yet</p>
              ) : (
                <div className="space-y-2">
                  {profileConvos.slice(0, 10).map(c => (
                    <a key={c.id} href={`/conversations?id=${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'resolved' ? 'bg-green-500' : c.status === 'flagged' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{c.last_message || 'No message'}</p>
                        <p className="text-[10px] text-gray-400">{c.status} · {c.created_date ? format(new Date(c.created_date), 'MMM d, yyyy') : ''}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.mode === 'ai' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                        {c.mode === 'ai' ? 'AI' : 'Agent'}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            {selectedProfile.tags?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.tags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}