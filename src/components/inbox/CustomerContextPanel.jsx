import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Mail, Phone, Heart } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function CustomerContextPanel({ conversation, onConversationUpdate }) {
  // Fetch customer profile
  const { data: customer } = useQuery({
    queryKey: ['customer', conversation.customer_id],
    queryFn: () => conversation.customer_id
      ? base44.entities.CustomerProfile.list().then(customers =>
          customers.find(c => c.id === conversation.customer_id)
        )
      : null,
  });

  // Fetch previous conversations
  const { data: previousConversations = [] } = useQuery({
    queryKey: ['previous-conversations', conversation.customer_id],
    queryFn: () => conversation.customer_id
      ? base44.entities.Conversation.filter(
          { customer_id: conversation.customer_id },
          '-created_date',
          5
        ).then(convs => convs.filter(c => c.id !== conversation.id))
      : [],
  });

  // Fetch open tickets
  const { data: openTickets = [] } = useQuery({
    queryKey: ['open-tickets', conversation.customer_id],
    queryFn: () => conversation.customer_id
      ? base44.entities.Ticket.filter({ customer_email: conversation.customer_email })
      : [],
  });

  return (
    <div className="p-4 space-y-6">
      {/* Customer Profile Card */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-bold text-sm mb-3">Customer Profile</h3>

        <div className="space-y-2 text-sm">
          {customer?.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${customer.email}`} className="text-blue-500 hover:underline">
                {customer.email}
              </a>
            </div>
          )}

          {customer?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a href={`tel:${customer.phone}`} className="text-blue-500 hover:underline">
                {customer.phone}
              </a>
            </div>
          )}

          <div className="pt-2 border-t space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Conversations</span>
              <span className="font-semibold">{customer?.total_conversations || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Open Tickets</span>
              <span className="font-semibold">{customer?.open_tickets || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Details */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-bold text-sm mb-3">Conversation Details</h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Started {format(new Date(conversation.created_date), 'MMM d, HH:mm')}
            </span>
          </div>

          {conversation.first_response_at && (
            <div>
              <span className="text-muted-foreground text-xs">First Response Time</span>
              <p className="text-sm">
                {formatDistanceToNow(
                  new Date(conversation.first_response_at),
                  new Date(conversation.created_date)
                )} after start
              </p>
            </div>
          )}

          {conversation.sla_first_response_due_at && (
            <div className="text-xs">
              <span className="text-muted-foreground">SLA First Response</span>
              <p className={conversation.sla_first_response_breached ? 'text-red-500 font-bold' : ''}>
                {format(new Date(conversation.sla_first_response_due_at), 'HH:mm')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Previous Conversations */}
      {previousConversations.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-bold text-sm mb-3">Previous Conversations</h3>

          <div className="space-y-2">
            {previousConversations.map(conv => (
              <button
                key={conv.id}
                className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-xs"
              >
                <div className="flex justify-between">
                  <span className="font-medium truncate">
                    {conv.channel}
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(conv.created_date), 'MMM d')}
                  </span>
                </div>
                <p className="text-muted-foreground truncate">
                  {conv.status}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Open Tickets */}
      {openTickets.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Open Tickets ({openTickets.length})
          </h3>

          <div className="space-y-2">
            {openTickets.map(ticket => (
              <div
                key={ticket.id}
                className="p-2 rounded border text-xs hover:bg-muted cursor-pointer transition-colors"
              >
                <p className="font-medium line-clamp-2">{ticket.title}</p>
                <p className="text-muted-foreground mt-1">{ticket.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Tags */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-bold text-sm mb-3">Tags</h3>

        <div className="flex flex-wrap gap-2">
          {conversation.tags?.map(tag => (
            <span key={tag} className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
              {tag}
            </span>
          )) || <p className="text-xs text-muted-foreground">No tags</p>}
        </div>
      </div>
    </div>
  );
}