import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { useQueryClient } from '@tanstack/react-query';
import { Send, MoreVertical, Archive, CheckCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TransferPanel from '@/components/inbox/TransferPanel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ConversationThread({ conversation, messages, onRefresh }) {
  const [messageContent, setMessageContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const { activeBrandId } = useBrand();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!messageContent.trim() || !activeBrandId) return;
    setSending(true);
    setSendError(null);

    try {
      await base44.entities.Message.create({
        brand_id: activeBrandId,
        conversation_id: conversation.id,
        sender_type: 'agent',
        sender_id: 'current-user',
        sender_name: 'Agent',
        content: messageContent,
        is_internal_note: isInternalNote,
      });

      // Update conversation metadata
      await base44.entities.Conversation.update(conversation.id, {
        last_message_at: new Date().toISOString(),
        first_response_at: conversation.first_response_at || new Date().toISOString(),
        unread_count: 0,
      });

      setMessageContent('');
      setIsInternalNote(false);
      toast({
        title: 'Message sent',
        description: isInternalNote ? 'Internal note added' : 'Reply sent to customer',
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to send message:', error);
      setSendError(error.message || 'Failed to send message. Please try again.');
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    await base44.entities.Conversation.update(conversation.id, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    });
    onRefresh();
  };

  const handleReopen = async () => {
    await base44.entities.Conversation.update(conversation.id, {
      status: 'open',
      resolved_at: null,
    });
    onRefresh();
  };

  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const qc = useQueryClient();

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {showTransferPanel && (
        <TransferPanel
          conversation={conversation}
          onClose={() => setShowTransferPanel(false)}
          onTransfer={() => {
            setShowTransferPanel(false);
            onRefresh();
          }}
        />
      )}

      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{conversation.customer_name}</h3>
          <p className="text-xs text-muted-foreground">
            {conversation.channel} · {conversation.department_id}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {conversation.status === 'resolved' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReopen}
                className="gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Reopen
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResolve}
                className="gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Resolve
              </Button>
            )}
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-card border rounded-lg shadow-lg z-10">
                <button 
                  onClick={() => setShowTransferPanel(true)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                >
                  Transfer to Agent
                </button>
                <button 
                  onClick={() => setShowTransferPanel(true)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                >
                  Transfer to Department
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                message.sender_type === 'customer' ? 'justify-start' : 'justify-end'
              )}
            >
              {message.sender_type === 'customer' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold">
                  {message.sender_name?.charAt(0)}
                </div>
              )}

              <div
                className={cn(
                  'max-w-md px-4 py-2 rounded-lg',
                  message.is_internal_note
                    ? 'bg-yellow-100 border border-yellow-300'
                    : message.sender_type === 'customer'
                      ? 'bg-muted'
                      : 'bg-primary text-primary-foreground'
                )}
              >
                {message.is_internal_note && (
                  <p className="text-xs font-semibold text-yellow-900 mb-1">
                    🔒 Internal Note
                  </p>
                )}
                <p className="text-sm break-words">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {format(new Date(message.created_date), 'HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      {conversation.status !== 'resolved' && (
        <div className={`border-t p-4 space-y-3 ${isInternalNote ? 'bg-yellow-50' : ''}`}>
          {sendError && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{sendError}</p>
            </div>
          )}
          <Textarea
            value={messageContent}
            onChange={e => setMessageContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message... (Shift+Enter for newline)"
            className="min-h-20"
          />
          <div className="flex items-center gap-3 justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternalNote}
                onChange={e => setIsInternalNote(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs font-medium">🔒 Internal Note (not sent to customer)</span>
            </label>
            <Button
              onClick={sendMessage}
              disabled={!messageContent.trim() || sending || !activeBrandId}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}