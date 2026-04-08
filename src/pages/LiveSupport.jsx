import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Bot, User, Radio, AlertTriangle, CheckCircle, PhoneIncoming, MessageSquare, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import LiveConversationPanel from '@/components/livesupport/LiveConversationPanel';
import HandoffNotifications from '@/components/livesupport/HandoffNotifications';

const TABS = [
  { key: 'handoff', label: 'Needs Handoff', icon: PhoneIncoming, color: 'text-orange-500' },
  { key: 'active', label: 'Active AI', icon: Bot, color: 'text-violet-500' },
  { key: 'human', label: 'Human Handled', icon: User, color: 'text-blue-500' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-green-500' },
];

export default function LiveSupport() {
  const [tab, setTab] = useState('handoff');
  const [selectedId, setSelectedId] = useState(null);
  const [user, setUser] = useState(null);
  const { activeBrandId, activeBrand } = useBrand();
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ['live-conversations', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-last_message_time', 200)
      : base44.entities.Conversation.list('-last_message_time', 200),
    refetchInterval: 5000,
  });

  const grouped = {
    handoff: conversations.filter(c => c.status === 'human_requested' || c.status === 'flagged'),
    active: conversations.filter(c => c.mode === 'ai' && c.status === 'active'),
    human: conversations.filter(c => c.mode === 'human' && c.status !== 'resolved'),
    resolved: conversations.filter(c => c.status === 'resolved'),
  };

  const current = grouped[tab] || [];
  const selectedConvo = conversations.find(c => c.id === selectedId);

  // Auto-select first in handoff tab
  useEffect(() => {
    if (tab === 'handoff' && grouped.handoff.length > 0 && !grouped.handoff.find(c => c.id === selectedId)) {
      setSelectedId(grouped.handoff[0]?.id || null);
    }
  }, [tab, conversations.length]);

  const stats = [
    { label: 'Needs Handoff', value: grouped.handoff.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: PhoneIncoming },
    { label: 'Active AI Chats', value: grouped.active.length, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: Bot },
    { label: 'Human Agents', value: grouped.human.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: User },
    { label: 'Resolved Today', value: grouped.resolved.length, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
          <Radio className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900">Live Support</h1>
          <p className="text-xs text-gray-400">{activeBrand?.name || 'All brands'} · Real-time agent dashboard</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
          </span>
          <HandoffNotifications
            conversations={grouped.handoff}
            onSelect={(id) => { setTab('handoff'); setSelectedId(id); }}
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-100 flex gap-4 shrink-0">
        {stats.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2.5 px-4 py-2 rounded-xl" style={{ background: bg }}>
            <Icon className="w-4 h-4 shrink-0" style={{ color }} />
            <span className="text-xl font-bold" style={{ color }}>{value}</span>
            <span className="text-xs font-medium text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: conversation list */}
        <div className="w-80 shrink-0 flex flex-col bg-white border-r border-gray-100">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-2 pt-2 gap-1 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon, color }) => (
              <button key={key} onClick={() => { setTab(key); setSelectedId(null); }}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2',
                  tab === key ? 'border-violet-500 text-violet-700 bg-violet-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}>
                <Icon className={cn('w-3.5 h-3.5', tab === key ? 'text-violet-500' : color)} />
                {label}
                {grouped[key]?.length > 0 && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5',
                    key === 'handoff' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  )}>{grouped[key].length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Conversation rows */}
          <div className="flex-1 overflow-y-auto">
            {current.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No conversations here</p>
              </div>
            ) : (
              current.map(c => (
                <ConvoRow
                  key={c.id}
                  convo={c}
                  selected={selectedId === c.id}
                  onSelect={() => setSelectedId(c.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: message panel */}
        <div className="flex-1 overflow-hidden">
          {selectedConvo ? (
            <LiveConversationPanel
              conversation={selectedConvo}
              user={user}
              onUpdate={() => qc.invalidateQueries({ queryKey: ['live-conversations', activeBrandId] })}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Radio className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Click any conversation to open it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConvoRow({ convo, selected, onSelect }) {
  const isUrgent = convo.status === 'human_requested' || convo.status === 'flagged';
  return (
    <div onClick={onSelect}
      className={cn('flex items-start gap-3 p-3.5 cursor-pointer border-b border-gray-50 transition-all',
        selected ? 'bg-violet-50 border-l-2 border-l-violet-500' : 'hover:bg-gray-50',
        isUrgent && !selected && 'border-l-2 border-l-orange-400'
      )}>
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: isUrgent ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {convo.customer_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        {isUrgent && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-white rounded-full animate-ping absolute" />
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </span>
        )}
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
          {convo.status === 'human_requested' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold flex items-center gap-0.5"><PhoneIncoming className="w-2.5 h-2.5" /> Handoff</span>}
          {convo.status === 'flagged' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Flagged</span>}
          {convo.mode === 'ai' && convo.status === 'active' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium flex items-center gap-0.5"><Bot className="w-2.5 h-2.5" /> AI Active</span>}
          {convo.mode === 'human' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> Agent</span>}
          {convo.status === 'resolved' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Resolved</span>}
          {convo.sentiment === 'negative' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">😞</span>}
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-1" />
    </div>
  );
}