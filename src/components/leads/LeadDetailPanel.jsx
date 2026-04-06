import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Mail, Phone, MapPin, Globe, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  qualified: 'bg-green-100 text-green-700',
  disqualified: 'bg-red-100 text-red-700',
  converted: 'bg-emerald-100 text-emerald-700',
};

export default function LeadDetailPanel({ lead, onClose, onUpdate }) {
  const [notes, setNotes] = useState(lead.notes || '');

  const update = async (data) => {
    await base44.entities.Lead.update(lead.id, data);
    onUpdate();
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Lead Details</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {lead.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold">{lead.name}</p>
            {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] || 'bg-muted'}`}>{lead.status}</span>
          </div>
        </div>

        <div className="space-y-2">
          {lead.email && <div className="flex items-center gap-2 text-xs"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span>{lead.email}</span></div>}
          {lead.phone && <div className="flex items-center gap-2 text-xs"><Phone className="w-3.5 h-3.5 text-muted-foreground" /><span>{lead.phone}</span></div>}
          {lead.location && <div className="flex items-center gap-2 text-xs"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /><span>{lead.location}</span></div>}
          {lead.device && <div className="flex items-center gap-2 text-xs"><Smartphone className="w-3.5 h-3.5 text-muted-foreground" /><span>{lead.device}</span></div>}
        </div>

        {lead.pages_visited?.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Pages Visited</Label>
            <div className="space-y-1">
              {lead.pages_visited.map((p, i) => (
                <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" /> {p}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
          <Select value={lead.status} onValueChange={v => update({ status: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['new', 'contacted', 'qualified', 'disqualified', 'converted'].map(s => (
                <SelectItem key={s} value={s} className="text-xs">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Notes</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="resize-none text-xs" placeholder="Notes about this lead..." />
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => update({ notes })}>Save Notes</Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">CRM Sync</Label>
          <Button
            size="sm"
            variant={lead.crm_synced ? 'outline' : 'default'}
            className="w-full text-xs"
            onClick={() => update({ crm_synced: !lead.crm_synced })}
          >
            {lead.crm_synced ? '✓ Synced to CRM' : 'Sync to CRM'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Source: {lead.source}</p>
          <p>Added: {lead.created_date ? format(new Date(lead.created_date), 'MMM d, yyyy') : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}