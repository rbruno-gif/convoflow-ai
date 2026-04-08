import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bot, User, AlertTriangle, Search, MessageSquare, Facebook, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'ai', label: 'AI' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'resolved', label: 'Resolved' },
];

function ChannelIcon({ tags }) {
  if (tags?.includes('facebook')) return <Facebook className="w-3 h-3 text-blue-500" />;
  if (tags?.includes('whatsapp')) return <Phone className="w-3 h-3 text-green-500" />;
  if (tags?.includes('email')) return <Mail className="w-3 h-3 text-orange-500" />;
  return <MessageSquare className="w-3 h-3 text-violet-500" />;
}

export default function ConversationList({ conversations, selectedId, onSelect, filter, onFilterChange }) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    if (search) {
      return c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.last_message?.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full" style={{ background: '#fff', borderRight: '1px solid #e5e7eb' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm text-gray-900">Inbox</h2>
          {conversations.filter(c => c.unread_count > 0).length > 0 && (
            <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
              {conversations.filter(c => c.unread_count > 0).length} unread
            </span>
          )}
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
        </div>
        {/* Filters */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={cn(
                'flex-shrink-0 text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors',
                filter === f.key
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
              style={filter === f.key ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-xs text-gray-400">No conversations</p>
          </div>
        ) : (
          filtered.map(c => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                'flex items-start gap-3 p-3.5 cursor-pointer transition-colors border-b border-gray-50',
                selectedId === c.id ? 'bg-violet-50 border-l-2 border-l-violet-500' : 'hover:bg-gray-50',
                c.is_urgent && selectedId !== c.id && 'border-l-2 border-l-red-400'
              )}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 relative"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {c.customer_name?.charAt(0)?.toUpperCase() || '?'}
                {c.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {c.unread_count > 9 ? '9+' : c.unread_count}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs font-semibold text-gray-900 truncate">{c.customer_name}</p>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                    {c.last_message_time ? formatDistanceToNow(new Date(c.last_message_time), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 truncate mb-1.5">{c.last_message || 'No messages yet'}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ChannelIcon tags={c.tags} />
                  {c.mode === 'ai' ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full font-medium">
                      <Bot className="w-2.5 h-2.5" /> AI
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">
                      <User className="w-2.5 h-2.5" /> Agent
                    </span>
                  )}
                  {(c.status === 'flagged' || c.status === 'human_requested') && (
                    <span className="flex items-center gap-0.5 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full font-medium">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {c.status === 'flagged' ? 'Flagged' : 'Human req.'}
                    </span>
                  )}
                  {c.status === 'resolved' && (
                    <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">Resolved</span>
                  )}
                  {c.is_urgent && (
                    <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full font-bold">URGENT</span>
                  )}
                  {c.sentiment === 'negative' && (
                    <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full font-medium">😞 Negative</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}