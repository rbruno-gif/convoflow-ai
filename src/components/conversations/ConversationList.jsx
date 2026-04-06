import { formatDistanceToNow } from 'date-fns';
import { Bot, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'ai', label: 'AI' },
  { key: 'human', label: 'Human' },
  { key: 'flagged', label: 'Flagged' },
];

export default function ConversationList({ conversations, selectedId, onSelect, filter, onFilterChange }) {
  return (
    <div className="w-80 border-r flex flex-col bg-card shrink-0 h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-base mb-3">Conversations</h2>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md font-medium transition-colors',
                filter === f.key ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No conversations</p>
        ) : (
          conversations.map(c => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                'flex items-start gap-3 p-4 border-b cursor-pointer hover:bg-muted/40 transition-colors',
                selectedId === c.id && 'bg-accent'
              )}
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {c.customer_name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-medium truncate">{c.customer_name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                    {c.last_message_time ? formatDistanceToNow(new Date(c.last_message_time), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.last_message || 'No messages yet'}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {c.mode === 'ai' ? (
                    <span className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium">
                      <Bot className="w-2.5 h-2.5" /> AI
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">
                      <User className="w-2.5 h-2.5" /> Agent
                    </span>
                  )}
                  {(c.status === 'flagged' || c.status === 'human_requested') && (
                    <span className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full font-medium">
                      <AlertTriangle className="w-2.5 h-2.5" /> {c.status === 'flagged' ? 'Flagged' : 'Human req.'}
                    </span>
                  )}
                  {c.unread_count > 0 && (
                    <span className="ml-auto text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-medium">
                      {c.unread_count}
                    </span>
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