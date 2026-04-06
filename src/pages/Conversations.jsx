import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, User, AlertTriangle, CheckCircle, MessageSquare, Send, Flag, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import ConversationList from '@/components/conversations/ConversationList';
import MessageThread from '@/components/conversations/MessageThread';
import ConversationActions from '@/components/conversations/ConversationActions';

export default function Conversations() {
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_time', 100),
  });

  const filtered = conversations.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'ai') return c.mode === 'ai';
    if (filter === 'human') return c.mode === 'human';
    if (filter === 'flagged') return c.status === 'flagged' || c.status === 'human_requested';
    return true;
  });

  const selected = conversations.find(c => c.id === selectedId);

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar list - narrower */}
      <div className="w-80 border-r bg-card flex flex-col min-h-0">
        <ConversationList
          conversations={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      {/* Main thread area - expanded */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {selected ? (
          <MessageThread conversation={selected} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-base font-medium">Select a conversation to start</p>
              <p className="text-xs text-muted-foreground mt-1">Choose from the list to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}