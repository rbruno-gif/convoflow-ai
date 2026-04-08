import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Hash, MessageSquare, Send, Smile } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TeamChatSidebar from './TeamChatSidebar';
import ChannelThread from './ChannelThread';
import CreateChannelPanel from './CreateChannelPanel';

export default function TeamChatLayout() {
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [selectedDMId, setSelectedDMId] = useState(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const { activeBrandId } = useBrand();
  const qc = useQueryClient();
  const [channelsInitialized, setChannelsInitialized] = useState(false);

  const { data: channels = [], refetch: refetchChannels } = useQuery({
    queryKey: ['channels', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Channel.filter({ brand_id: activeBrandId }, 'name', 100)
      : [],
  });

  // Auto-create default channels if none exist
  useEffect(() => {
    const initDefaultChannels = async () => {
      if (!activeBrandId || channelsInitialized || channels.length > 0) return;
      
      try {
        const defaultChannels = [
          { name: 'general', description: 'General team discussion' },
          { name: 'support', description: 'Support team coordination' },
          { name: 'escalations', description: 'High priority escalations' },
          { name: 'announcements', description: 'Team announcements' },
        ];
        
        for (const ch of defaultChannels) {
          await base44.entities.Channel.create({
            brand_id: activeBrandId,
            ...ch,
            is_default: true,
            members: [],
          });
        }
        
        refetchChannels();
      } catch (err) {
        console.error('Failed to create default channels:', err);
      } finally {
        setChannelsInitialized(true);
      }
    };
    
    initDefaultChannels();
  }, [activeBrandId, channels.length, channelsInitialized, refetchChannels]);

  const { data: messages = [] } = useQuery({
    queryKey: ['channel-messages', selectedChannelId],
    queryFn: () => selectedChannelId
      ? base44.entities.ChannelMessage.filter({ channel_id: selectedChannelId }, '-created_date', 200)
      : [],
    enabled: !!selectedChannelId,
    staleTime: 2000,
    refetchInterval: 5000,
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const canPost = !selectedChannel?.manager_post_only || isManager;

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannelId) return;

    try {
      await base44.entities.ChannelMessage.create({
        brand_id: activeBrandId,
        channel_id: selectedChannelId,
        sender_id: user.email,
        sender_name: user.full_name,
        content: messageInput,
        is_system: false,
      });

      setMessageInput('');
      qc.invalidateQueries({ queryKey: ['channel-messages', selectedChannelId] });
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Add toast notification for error feedback
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Sidebar - Channels & DMs */}
      <TeamChatSidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={(id) => {
          setSelectedChannelId(id);
          setSelectedDMId(null);
        }}
        onCreateChannel={() => setShowCreateChannel(true)}
        onRefetchChannels={refetchChannels}
      />

      {/* Center - Message Thread */}
      {selectedChannel ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-gray-400" />
              <div>
                <h2 className="font-bold text-gray-900">{selectedChannel?.name || 'Select a channel'}</h2>
                {selectedChannel?.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{selectedChannel.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MessageSquare className="w-4 h-4" />
              <span>{selectedChannel.members?.length || 0} members</span>
            </div>
          </div>

          {/* Messages */}
          <ChannelThread messages={messages} user={user} channel={selectedChannel} />

          {/* Composer */}
          <div className={`border-t border-gray-200 p-4 ${isInternalNote ? 'bg-yellow-50' : 'bg-white'}`}>
            {selectedChannel.manager_post_only && !isManager && (
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Only managers can post in #{selectedChannel.name}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder={canPost ? 'Type a message...' : 'Read-only channel'}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && canPost) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={!canPost}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!canPost || !messageInput.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
              <span>Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No channel selected</p>
            <p className="text-sm mt-1">Select a channel to start chatting</p>
          </div>
        </div>
      )}

      {/* Create Channel Panel */}
      {showCreateChannel && (
        <CreateChannelPanel
          brandId={activeBrandId}
          onClose={() => setShowCreateChannel(false)}
          onSuccess={() => {
            setShowCreateChannel(false);
            refetchChannels();
          }}
        />
      )}
    </div>
  );
}