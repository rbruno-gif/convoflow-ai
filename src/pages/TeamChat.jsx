import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Hash, Lock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TeamChatSidebar from '@/components/teamchat/TeamChatSidebar';
import ChannelView from '@/components/teamchat/ChannelView';
import DMView from '@/components/teamchat/DMView';

export default function TeamChat() {
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [selectedDMId, setSelectedDMId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const { activeBrandId } = useBrand();

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Channel.filter({ brand_id: activeBrandId })
      : [],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['channel-messages', selectedChannelId],
    queryFn: () => selectedChannelId
      ? base44.entities.ChannelMessage.filter({ channel_id: selectedChannelId }, '-created_date', 200)
      : [],
    enabled: !!selectedChannelId,
  });

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  const handleSendMessage = async (content) => {
    if (!content.trim() || !selectedChannelId) return;

    const user = await base44.auth.me();
    await base44.entities.ChannelMessage.create({
      brand_id: activeBrandId,
      channel_id: selectedChannelId,
      sender_id: user.email,
      sender_name: user.full_name,
      content,
    });

    setMessageInput('');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <TeamChatSidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
      />

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {selectedChannelId && selectedChannel ? (
          <>
            {/* Header */}
            <div className="bg-white border-b p-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-bold text-lg">{selectedChannel.name}</h2>
              {selectedChannel.type === 'private' && (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            {/* Messages */}
            <ChannelView messages={messages} channel={selectedChannel} />

            {/* Input */}
            <div className="bg-white border-t p-4 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(messageInput);
                  }
                }}
              />
              <Button onClick={() => handleSendMessage(messageInput)}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a channel to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}