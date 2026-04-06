import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Ticket, Plus, Search, Filter, Clock, User, Tag, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import NewTicketModal from '@/components/tickets/NewTicketModal';
import TicketDetailPanel from '@/components/tickets/TicketDetailPanel';

const statusColors = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-muted text-muted-foreground',
};

const priorityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function Tickets() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date', 200),
  });

  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.customer_name?.toLowerCase().includes(search.toLowerCase()) || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const selectedTicket = tickets.find(t => t.id === selected);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Help Desk</h1>
              <p className="text-sm text-muted-foreground">{filtered.length} tickets</p>
            </div>
            <Button onClick={() => setShowNew(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Ticket
            </Button>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {['open', 'in_progress', 'pending', 'resolved', 'closed'].map(s => (
                  <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {['low', 'medium', 'high', 'urgent'].map(p => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tickets found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(ticket => (
                <Card
                  key={ticket.id}
                  onClick={() => setSelected(ticket.id)}
                  className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selected === ticket.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[ticket.status] || ''}`}>
                            {ticket.status?.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[ticket.priority] || ''}`}>
                            {ticket.priority}
                          </span>
                          {ticket.channel && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{ticket.channel}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{ticket.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" /> {ticket.customer_name}
                          </span>
                          {ticket.assigned_agent && (
                            <span className="text-xs text-muted-foreground">→ {ticket.assigned_agent}</span>
                          )}
                          {ticket.csat_score && (
                            <span className="text-xs text-yellow-600 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-500" /> {ticket.csat_score}/5
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">
                          {ticket.created_date ? format(new Date(ticket.created_date), 'MMM d') : ''}
                        </p>
                        {ticket.sla_due_at && new Date(ticket.sla_due_at) < new Date() && ticket.status !== 'resolved' && (
                          <span className="text-[10px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> SLA breached
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onClose={() => setSelected(null)}
          onUpdate={() => qc.invalidateQueries({ queryKey: ['tickets'] })}
        />
      )}

      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreate={() => { qc.invalidateQueries({ queryKey: ['tickets'] }); setShowNew(false); }}
        />
      )}
    </div>
  );
}