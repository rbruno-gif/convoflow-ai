import { useState } from 'react';
import { Plus, Hash, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeamChatSidebar({
  channels,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onRefetchChannels,
}) {
  const [expanded, setExpanded] = useState(true);

  const publicChannels = channels.filter(c => c.type === 'public');
  const privateChannels = channels.filter(c => c.type === 'private');

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-xs font-bold text-sidebar-foreground uppercase tracking-wide">Channels</h2>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto">
        {/* Public Channels */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-sidebar-foreground uppercase opacity-70">Public</span>
            <button
              onClick={onCreateChannel}
              className="p-0.5 hover:bg-sidebar-accent rounded opacity-70 hover:opacity-100 transition-opacity"
              title="Create channel"
            >
              <Plus className="w-3.5 h-3.5 text-sidebar-foreground" />
            </button>
          </div>
          <div className="space-y-1">
            {publicChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  selectedChannelId === channel.id
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Hash className="w-4 h-4 shrink-0" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
            {publicChannels.length === 0 && (
              <p className="text-[11px] text-sidebar-foreground opacity-50 px-3 py-2">No channels</p>
            )}
          </div>
        </div>

        {/* Private Channels */}
        {privateChannels.length > 0 && (
          <div className="px-3 py-2 border-t border-sidebar-border">
            <span className="text-[11px] font-semibold text-sidebar-foreground uppercase opacity-70">Private</span>
            <div className="space-y-1 mt-2">
              {privateChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                    selectedChannelId === channel.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground opacity-50 text-center">
        {channels.length} channels
      </div>
    </div>
  );
}