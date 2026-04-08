import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Search } from 'lucide-react';

function statusColor(s) {
  if (s === 'online') return '#22c55e';
  if (s === 'away') return '#f59e0b';
  if (s === 'dnd') return '#ef4444';
  return '#6b7280';
}

export default function NewDMModal({ user, allUsers, presences, onClose, onStart }) {
  const [search, setSearch] = useState('');
  const [starting, setStarting] = useState(false);

  const others = allUsers.filter(u => u.email !== user?.email &&
    (!search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const startDM = async (targetUser) => {
    setStarting(true);
    // Check for existing thread
    const existing = await base44.entities.DMThread.list('-created_date', 100);
    const found = existing.find(t =>
      t.participants?.includes(user.email) && t.participants?.includes(targetUser.email)
    );
    if (found) { onStart(found); onClose(); return; }

    const thread = await base44.entities.DMThread.create({
      participants: [user.email, targetUser.email],
      last_message_time: new Date().toISOString(),
    });
    onStart(thread);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">New Direct Message</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="px-5 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search people…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {others.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No users found</p>}
            {others.map(u => {
              const presence = presences.find(p => p.agent_email === u.email);
              return (
                <button key={u.id} onClick={() => startDM(u)} disabled={starting}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold text-xs">
                      {u.full_name?.charAt(0) || u.email?.charAt(0)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: statusColor(presence?.status) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.full_name || u.email}</p>
                    <p className="text-[11px] text-gray-400">{u.role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}