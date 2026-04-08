import { Plus, Hash, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function TeamChatSidebar({ channels, selectedChannelId, onSelectChannel }) {
  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-bold">Team Chat</h3>
        <Button variant="ghost" size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2 space-y-1">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                selectedChannelId === channel.id
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-white/50'
              )}
            >
              {channel.type === 'private' ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Hash className="w-4 h-4" />
              )}
              <span>{channel.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}