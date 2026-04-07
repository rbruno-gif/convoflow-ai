import { useState, useEffect } from 'react';
import { Eye, Globe, Clock, MapPin, MessageSquare, Monitor } from 'lucide-react';

const MOCK_VISITORS = [
  { id: 1, name: 'Anonymous Visitor', page: '/plans', time: 142, location: '🇺🇸 New York, US', device: 'Desktop', color: '#7c3aed' },
  { id: 2, name: 'Anonymous Visitor', page: '/activate', time: 67, location: '🇲🇽 Mexico City, MX', device: 'Mobile', color: '#4f46e5' },
  { id: 3, name: 'John D.', page: '/bring-your-own-device', time: 310, location: '🇺🇸 Miami, US', device: 'Mobile', color: '#10b981' },
  { id: 4, name: 'Anonymous Visitor', page: '/faqs', time: 28, location: '🇨🇴 Bogotá, CO', device: 'Desktop', color: '#f59e0b' },
  { id: 5, name: 'Maria G.', page: '/plans', time: 195, location: '🇩🇴 Santo Domingo, DO', device: 'Mobile', color: '#ef4444' },
];

export default function Visitors() {
  const [visitors, setVisitors] = useState(MOCK_VISITORS);
  const [invited, setInvited] = useState({});
  const [inviting, setInviting] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setVisitors(prev => prev.map(v => ({ ...v, time: v.time + 5 }))), 5000);
    return () => clearInterval(interval);
  }, []);

  const startChat = (id) => {
    setInviting(id);
    setTimeout(() => { setInvited(p => ({ ...p, [id]: true })); setInviting(null); }, 1500);
  };

  const fmt = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
          <Eye className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Visitors</h1>
          <p className="text-xs text-gray-400">Real-time active visitors on your website</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-700">{visitors.length} live</span>
        </div>
      </div>

      <div className="space-y-3">
        {visitors.map(v => (
          <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: v.color }}>
              {v.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-500"><Globe className="w-3 h-3" /> {v.page}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" /> {fmt(v.time)}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" /> {v.location}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500"><Monitor className="w-3 h-3" /> {v.device}</span>
              </div>
            </div>
            {invited[v.id] ? (
              <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg font-medium">✓ Chat Sent</span>
            ) : (
              <button onClick={() => startChat(v.id)} disabled={inviting === v.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60 shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                <MessageSquare className="w-3.5 h-3.5" />
                {inviting === v.id ? 'Sending...' : 'Start Chat'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}