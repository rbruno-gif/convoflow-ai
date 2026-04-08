import { useState } from 'react';
import { Search, Clock, AlertCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const channelIcons = {
  chat: '💬',
  email: '📧',
  whatsapp: '📱',
  sms: '📲',
  voice: '☎️',
};

const priorityColors = {
  low: 'text-gray-500',
  normal: 'text-blue-500',
  high: 'text-amber-500',
  urgent: 'text-red-500',
};

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  notifications,
  notificationCount,
  onNotificationClick,
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');

  const filtered = conversations.filter(c => {
    const matchSearch = !search || c.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchChannel = filterChannel === 'all' || c.channel === filterChannel;
    return matchSearch && matchStatus && matchChannel;
  });

  const sorted = [...filtered].sort((a, b) => {
    // Unresolved conversations first, by last message time
    if (a.status === 'resolved' && b.status !== 'resolved') return 1;
    if (a.status !== 'resolved' && b.status === 'resolved') return -1;
    return new Date(b.last_message_at) - new Date(a.last_message_at);
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Inbox</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNotificationClick}
            className="relative"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {Math.min(notificationCount, 9)}
              </span>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'open', 'pending', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                filterStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Channel filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'chat', 'email', 'whatsapp', 'sms', 'voice'].map(channel => (
            <button
              key={channel}
              onClick={() => setFilterChannel(channel)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                filterChannel === channel
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {channel === 'all' ? 'All' : channelIcons[channel]}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No conversations found
          </div>
        ) : (
          <div className="divide-y">
            {sorted.map(conversation => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className={cn(
                  'w-full text-left p-3 hover:bg-muted transition-colors border-l-4',
                  selectedId === conversation.id
                    ? 'bg-primary/10 border-l-primary'
                    : 'border-l-transparent',
                  conversation.unread_count > 0 && 'font-bold'
                )}
              >
                <div className="flex items-start gap-2">
                  {/* Brand color dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                    style={{
                      backgroundColor: conversation.brand_color || '#7c3aed',
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate">
                        {conversation.customer_name}
                      </span>
                      <span className="text-xs">
                        {channelIcons[conversation.channel]}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conversation.last_message || 'No messages yet'}
                    </p>

                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.last_message_at), {
                          addSuffix: true,
                        })}
                      </span>

                      {conversation.sla_first_response_breached && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}

                      {conversation.priority === 'urgent' && (
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </div>
                  </div>

                  {conversation.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center shrink-0">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}