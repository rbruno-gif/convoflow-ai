import { useState } from 'react';
import { Bell, PhoneIncoming, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function HandoffNotifications({ conversations = [], onSelect }) {
  const [open, setOpen] = useState(false);
  const count = conversations.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Handoff Requests</p>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {count === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No pending handoffs</p>
                </div>
              ) : (
                conversations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { onSelect(c.id); setOpen(false); }}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-50 text-left"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                      {c.customer_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{c.customer_name}</p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{c.last_message || 'No message'}</p>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block',
                        c.status === 'human_requested' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      )}>
                        <PhoneIncoming className="w-2.5 h-2.5 inline mr-0.5" />
                        {c.status === 'human_requested' ? 'Human Requested' : 'Flagged'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {c.last_message_time ? formatDistanceToNow(new Date(c.last_message_time), { addSuffix: true }) : ''}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}