import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Bell, Send, MessageSquare } from 'lucide-react';
import ConversationList from '@/components/inbox/ConversationList';
import ConversationThread from '@/components/inbox/ConversationThread';
import CustomerContextPanel from '@/components/inbox/CustomerContextPanel';
import NotificationPanel from '@/components/inbox/NotificationPanel';

export default function Inbox() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { activeBrand, activeBrandId } = useBrand();
  const qc = useQueryClient();

  // Fetch conversations for active brand - always poll for real-time updates
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-last_message_at', 100)
      : [],
    enabled: !!activeBrandId,
    staleTime: 1000,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  // Fetch messages for selected conversation - poll for real-time updates
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => selectedConversationId
      ? base44.entities.Message.filter({ conversation_id: selectedConversationId }, '-created_date', 200)
      : [],
    staleTime: 1000,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
    enabled: !!selectedConversationId,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Notification.filter({ brand_id: activeBrandId, is_read: false }, '-created_date', 50)
      : [],
    enabled: !!activeBrandId,
    staleTime: 3000,
    refetchInterval: 10000,
  });

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Column: Conversation List */}
      <div className="w-80 shrink-0 border-r flex flex-col overflow-hidden">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          isLoading={loadingConversations}
          notifications={notifications}
          notificationCount={notifications.length}
          onNotificationClick={() => setShowNotifications(!showNotifications)}
        />
      </div>

      {/* Center Column: Conversation Thread */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {loadingConversations ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Conversations will appear here when customers contact you.</p>
            </div>
          </div>
        ) : selectedConversation ? (
          <ConversationThread
            conversation={selectedConversation}
            messages={messages}
            onRefresh={() => qc.invalidateQueries({ queryKey: ['messages', selectedConversationId] })}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a conversation to begin</p>
          </div>
        )}
      </div>

      {/* Right Column: Context Panel */}
      {selectedConversation && (
        <div className="w-80 shrink-0 border-l overflow-y-auto">
          <CustomerContextPanel
            conversation={selectedConversation}
            onConversationUpdate={() => qc.invalidateQueries({ queryKey: ['conversations', activeBrandId] })}
          />
        </div>
      )}

      {/* Notification Panel Overlay */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}