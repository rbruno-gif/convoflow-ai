import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, Lock, Megaphone, Plus, MessageCircle, Search, ChevronDown, ChevronRight, Globe, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';
import NewChannelModal from './NewChannelModal';
import NewDMModal from './NewDMModal';
import PresenceSelector from './PresenceSelector';

const CHANNEL_ICONS = {
  public: Hash,
  private: Lock,
  announcements: Megaphone,
  'cross-brand': Globe,
};

function statusColor(status) {
  if (status === 'online') return '#22c55e';
  if (status === 'away') return '#f59e0b';
  if (status === 'dnd') return '#ef4444';
  return '#6b7280';
}

export default function ChatSidebar({ channels, dmThreads, user, allUsers, presences, brands, activeBrandId, activeView, onSelect, onChannelCreated, onDMCreated }) {
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const qc = useQueryClient();

  const isAdmin = user?.role === 'admin';

  // Group channels by brand
  const brandChannels = brands
    .filter(b => b.slug !== 'u2c-group')
    .map(brand => ({
      brand,
      channels: channels.filter(c => c.brand_id === brand.id && !c.is_archived),
    }))
    .filter(g => g.channels.length > 0 || (isAdmin && g.brand.id === activeBrandId));

  const crossBrandChannels = channels.filter(c => c.type === 'cross-brand' && !c.is_archived);

  const getPresence = (email) => presences.find(p => p.agent_email === email);
  const getUser = (email) => allUsers.find(u => u.email === email);

  const filteredDMs = dmThreads.filter(t => {
    const other = t.participants?.find(p => p !== user?.email);
    const otherUser = getUser(other);
    return !search || otherUser?.full_name?.toLowerCase().includes(search.toLowerCase()) || other?.toLowerCase().includes(search.toLowerCase());
  });

  const toggleGroup = (key) => setCollapsedGroups(g => ({ ...g, [key]: !g[key] }));

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full overflow-hidden" style={{ background: '#1a1d27', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-violet-400" />
            <span className="text-white font-bold text-sm">Team Chat</span>
          </div>
          {user && <PresenceSelector user={user} presences={presences} />}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#e5e7eb', caretColor: '#a78bfa' }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Cross-brand channels (admin only) */}
        {isAdmin && crossBrandChannels.length > 0 && (
          <ChannelGroup
            label="Cross-Brand"
            color="#7c3aed"
            channels={crossBrandChannels}
            activeView={activeView}
            onSelect={onSelect}
            collapsed={collapsedGroups['cross']}
            onToggle={() => toggleGroup('cross')}
          />
        )}

        {/* Brand channel groups */}
        {brandChannels.map(({ brand, channels: bChannels }) => (
          <ChannelGroup
            key={brand.id}
            label={brand.name}
            color={brand.primary_color || '#7c3aed'}
            brand={brand}
            channels={bChannels}
            activeView={activeView}
            onSelect={onSelect}
            collapsed={collapsedGroups[brand.id]}
            onToggle={() => toggleGroup(brand.id)}
            onAdd={isAdmin ? () => setShowNewChannel(true) : null}
          />
        ))}

        {/* DMs */}
        <div className="px-3 mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Direct Messages</span>
            <button onClick={() => setShowNewDM(true)} className="p-0.5 rounded hover:bg-white/10 transition-colors">
              <Plus className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
            </button>
          </div>
          {filteredDMs.map(thread => {
            const otherEmail = thread.participants?.find(p => p !== user?.email);
            const otherUser = getUser(otherEmail);
            const presence = getPresence(otherEmail);
            const unread = thread.unread_by?.[user?.email] || 0;
            const active = activeView?.type === 'dm' && activeView?.id === thread.id;
            return (
              <button key={thread.id} onClick={() => onSelect({ type: 'dm', id: thread.id })}
                className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 text-left transition-all', active ? 'bg-violet-600/30' : 'hover:bg-white/08')}
                style={active ? {} : {}}>
                <div className="relative shrink-0">
                  <div className="w-6 h-6 rounded-full bg-violet-800 flex items-center justify-center text-[10px] font-bold text-white">
                    {(otherUser?.full_name || otherEmail || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 shrink-0"
                    style={{ background: statusColor(presence?.status), borderColor: '#1a1d27' }} />
                </div>
                <span className={cn('flex-1 text-xs truncate', active ? 'text-white font-medium' : 'text-gray-400')}>
                  {otherUser?.full_name || otherEmail}
                </span>
                {unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{unread}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User footer */}
      {user && (
        <div className="px-3 py-3 border-t flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user.full_name?.charAt(0) || user.email?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.full_name || user.email}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.role}</p>
          </div>
        </div>
      )}

      {showNewChannel && (
        <NewChannelModal
          brandId={activeBrandId}
          isAdmin={isAdmin}
          onClose={() => setShowNewChannel(false)}
          onCreate={onChannelCreated}
        />
      )}
      {showNewDM && (
        <NewDMModal
          user={user}
          allUsers={allUsers}
          presences={presences}
          onClose={() => setShowNewDM(false)}
          onStart={onDMCreated}
        />
      )}
    </aside>
  );
}

function ChannelGroup({ label, color, brand, channels, activeView, onSelect, collapsed, onToggle, onAdd }) {
  return (
    <div className="px-3 mb-2">
      <button onClick={onToggle} className="w-full flex items-center gap-1.5 mb-1 group">
        {brand ? <BrandAvatar brand={brand} size={14} /> : <div className="w-3.5 h-3.5 rounded-sm" style={{ background: color }} />}
        <span className="text-[10px] font-semibold uppercase tracking-wider flex-1 text-left truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />}
        {onAdd && (
          <button onClick={e => { e.stopPropagation(); onAdd(); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all">
            <Plus className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </button>
      {!collapsed && channels.map(ch => {
        const Icon = CHANNEL_ICONS[ch.type] || Hash;
        const active = activeView?.type === 'channel' && activeView?.id === ch.id;
        return (
          <button key={ch.id} onClick={() => onSelect({ type: 'channel', id: ch.id })}
            className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 text-left transition-all', active ? 'bg-violet-600/30 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200')}>
            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? color : undefined }} />
            <span className="text-xs truncate flex-1">{ch.name}</span>
            {ch.type === 'announcements' && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}