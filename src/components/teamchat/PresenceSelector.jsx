import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown } from 'lucide-react';

const STATUSES = [
  { value: 'online', label: 'Online', color: '#22c55e' },
  { value: 'away', label: 'Away', color: '#f59e0b' },
  { value: 'dnd', label: 'Do Not Disturb', color: '#ef4444' },
  { value: 'offline', label: 'Offline', color: '#6b7280' },
];

export default function PresenceSelector({ user, presences }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('online');
  const ref = useRef(null);

  useEffect(() => {
    const p = presences.find(p => p.agent_email === user?.email);
    if (p) setCurrent(p.status);
  }, [presences, user]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const setStatus = async (status) => {
    setCurrent(status);
    setOpen(false);
    const existing = presences.find(p => p.agent_email === user?.email);
    if (existing) {
      await base44.entities.AgentPresence.update(existing.id, { status, last_seen: new Date().toISOString() });
    } else {
      await base44.entities.AgentPresence.create({ agent_email: user.email, status, last_seen: new Date().toISOString() });
    }
  };

  const s = STATUSES.find(s => s.value === current) || STATUSES[0];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
          style={{ background: '#252836' }}>
          {STATUSES.map(st => (
            <button key={st.value} onClick={() => setStatus(st.value)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-white/10 transition-colors text-left">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: st.color }} />
              <span className={current === st.value ? 'text-white font-semibold' : 'text-gray-300'}>{st.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}