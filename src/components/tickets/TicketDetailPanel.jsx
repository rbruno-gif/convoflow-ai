import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Star, User, Clock, Tag, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

const statusColors = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-muted text-muted-foreground',
};

export default function TicketDetailPanel({ ticket, onClose, onUpdate }) {
  const [notes, setNotes] = useState(ticket.internal_notes || '');
  const [saving, setSaving] = useState(false);

  const update = async (data) => {
    setSaving(true);
    await base44.entities.Ticket.update(ticket.id, data);
    onUpdate();
    setSaving(false);
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Ticket Details</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4 space-y-5">
        <div>
          <p className="font-semibold">{ticket.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{ticket.description}</p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{ticket.customer_name}</p>
            {ticket.customer_email && <p className="text-xs text-muted-foreground">{ticket.customer_email}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
          <Select value={ticket.status} onValueChange={v => update({ status: v, ...(v === 'resolved' ? { resolved_at: new Date().toISOString() } : {}) })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['open', 'in_progress', 'pending', 'resolved', 'closed'].map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</Label>
          <Select value={ticket.priority} onValueChange={v => update({ priority: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['low', 'medium', 'high', 'urgent'].map(p => <SelectItem key={p} value={p} className="text-xs">{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Assigned Agent</Label>
          <Input
            className="h-8 text-xs"
            placeholder="agent@email.com"
            defaultValue={ticket.assigned_agent || ''}
            onBlur={e => update({ assigned_agent: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">CSAT Score (1-5)</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => update({ csat_score: n })}
                className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${ticket.csat_score === n ? 'bg-yellow-400 text-white' : 'bg-muted text-muted-foreground hover:bg-yellow-100'}`}
              >{n}</button>
            ))}
          </div>
        </div>

        {ticket.sla_due_at && (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">SLA Due</p>
              <p className={`font-medium ${new Date(ticket.sla_due_at) < new Date() && ticket.status !== 'resolved' ? 'text-red-600' : ''}`}>
                {format(new Date(ticket.sla_due_at), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Internal Notes</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="resize-none text-xs"
            placeholder="Team notes (not visible to customer)..."
          />
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => update({ internal_notes: notes })} disabled={saving}>
            Save Notes
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Created: {ticket.created_date ? format(new Date(ticket.created_date), 'MMM d, yyyy h:mm a') : 'N/A'}</p>
          {ticket.resolved_at && <p>Resolved: {format(new Date(ticket.resolved_at), 'MMM d, yyyy h:mm a')}</p>}
        </div>
      </div>
    </div>
  );
}