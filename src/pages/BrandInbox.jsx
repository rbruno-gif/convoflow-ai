import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { MessageSquare, Filter, Search, Bot, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';
import MessageThread from '@/components/inbox/MessageThread';
import CustomerSidebar from '@/components/inbox/CustomerSidebar';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'human_requested', label: 'Handoff' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'resolved', label: 'Resolved' },
];

export default function BrandInbox() {
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { activeBrandId, activeBrand, brands } = useBrand();

  const { data: conversations = [] } = useQuery({
    queryKey: ['inbox-conversations', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-last_message_time', 200)
      : base44.entities.Conversation.list('-last_message_time', 200),
    refetchInterval: 5000,
  });

  const filtered = conversations.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchBrand = brandFilter === 'all' || c.brand_id === brandFilter;
    const matchSearch = !search || c.customer_name?.toLowerCase().includes(search.toLowerCase()) || c.last_message?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchBrand && matchSearch;
  });

  const selected = conversations.find(c => c.id === selectedId);
  const activeBrandList = brands.filter(b => b.is_active && b.slug !== 'u2c-group');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar list */}
      <div className="w-80 shrink-0 flex flex-col bg-white border-r border-gray-100">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 mb-3">Inbox</h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          {/* Brand filter — only shown for super admin (no active brand) */}
          {!activeBrandId && (
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="all">All Brands</option>
              {activeBrandList.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={cn('px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all',
                  statusFilter === f.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No conversations</p>
            </div>
          ) : filtered.map(c => (
            <ConvoRow key={c.id} convo={c} selected={selectedId === c.id}
              onSelect={() => setSelectedId(c.id)} brands={activeBrandList} showBrand={!activeBrandId} />
          ))}
        </div>
      </div>

      {/* Main thread */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selected ? (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <MessageThread conversation={selected} />
            </div>
            <CustomerSidebar conversation={selected} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConvoRow({ convo, selected, onSelect, brands, showBrand }) {
  const brand = brands.find(b => b.id === convo.brand_id);
  const isUrgent = convo.status === 'human_requested' || convo.status === 'flagged';
  return (
    <div onClick={onSelect}
      className={cn('flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-50 transition-all',
        selected ? 'bg-violet-50 border-l-2 border-l-violet-500' : 'hover:bg-gray-50',
        isUrgent && !selected && 'border-l-2 border-l-orange-400')}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ background: isUrgent ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
        {convo.customer_name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs font-semibold text-gray-900 truncate">{convo.customer_name}</p>
          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
            {convo.last_message_time ? formatDistanceToNow(new Date(convo.last_message_time), { addSuffix: true }) : ''}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 truncate mb-1">{convo.last_message || 'No messages'}</p>
        <div className="flex items-center gap-1 flex-wrap">
          {showBrand && brand && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
              style={{ background: brand.primary_color || '#7c3aed' }}>
              {brand.name}
            </span>
          )}
          {convo.mode === 'ai' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-0.5"><Bot className="w-2.5 h-2.5" /> AI</span>}
          {convo.mode === 'human' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> Agent</span>}
          {isUrgent && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Urgent</span>}
          {convo.status === 'resolved' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" /> Done</span>}
          {convo.unread_count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">{convo.unread_count}</span>}
        </div>
      </div>
    </div>
  );
}