import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { MessageSquare } from 'lucide-react';
import ConversationList from '@/components/inbox/ConversationList';
import MessageThread from '@/components/inbox/MessageThread';
import CustomerSidebar from '@/components/inbox/CustomerSidebar';
import AIGuidancePanel from '@/components/inbox/AIGuidancePanel';
import VoiceCallThread from '@/components/voice/VoiceCallThread';

export default function Conversations() {
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [insertReply, setInsertReply] = useState('');

  const { activeBrandId } = useBrand();

  const { data: conversations = [], refetch } = useQuery({
    queryKey: ['conversations', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-last_message_time', 100)
      : base44.entities.Conversation.list('-last_message_time', 100),
    refetchInterval: 30000,
  });

  const { data: voiceCalls = [] } = useQuery({
    queryKey: ['voice-calls', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.VoiceCallLog.filter({ brand_id: activeBrandId }, '-created_date', 50)
      : base44.entities.VoiceCallLog.list('-created_date', 50),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) setSelectedId(id);
  }, []);

  const filtered = conversations.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'open') return c.status === 'active' || c.status === 'waiting';
    if (filter === 'ai') return c.mode === 'ai';
    if (filter === 'flagged') return c.status === 'flagged' || c.status === 'human_requested';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

  const selected = conversations.find(c => c.id === selectedId);

  return (
    <div className="flex" style={{ height: '100vh' }}>
      <div className="w-72 shrink-0 flex flex-col" style={{ minHeight: 0 }}>
        <ConversationList
          conversations={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0" style={{ minHeight: 0 }}>
        {selected ? (
          <div className="overflow-y-auto p-6">
            {selected.channel === 'voice' ? (
              <VoiceCallThread callLog={voiceCalls.find(v => v.id === selected.voice_call_id)} />
            ) : (
              <MessageThread conversation={selected} onUpdate={refetch} externalReply={insertReply} />
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.1)' }}>
                <MessageSquare className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Select a conversation</p>
              <p className="text-xs text-gray-400 mt-1">Choose from the list to view messages</p>
            </div>
          </div>
        )}
      </div>

      {selected && <CustomerSidebar conversation={selected} />}
      {selected && <AIGuidancePanel conversation={selected} onInsertReply={setInsertReply} />}
    </div>
  );
}