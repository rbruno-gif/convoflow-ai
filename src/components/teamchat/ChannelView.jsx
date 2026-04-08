import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export default function ChannelView({ messages, channel }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map(msg => (
          <div key={msg.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
              {msg.sender_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{msg.sender_name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm mt-1">{msg.content}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}