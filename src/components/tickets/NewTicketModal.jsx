import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function NewTicketModal({ brandId, onClose, onCreate }) {
  const [form, setForm] = useState({ customer_name: '', customer_email: '', title: '', description: '', priority: 'medium', channel: 'chat', status: 'open' });

  const save = async () => {
    if (!form.customer_name || !form.title || !brandId) return;
    const due = new Date(); due.setHours(due.getHours() + (form.priority === 'urgent' ? 4 : form.priority === 'high' ? 8 : 24));
    await base44.entities.Ticket.create({ ...form, brand_id: brandId, sla_due_at: due.toISOString() });
    onCreate();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">New Ticket</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Customer Name *</Label>
              <Input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input value={form.customer_email} onChange={e => set('customer_email', e.target.value)} placeholder="john@example.com" type="email" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Issue Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief description of the issue" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="resize-none" placeholder="Detailed description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Priority</Label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['low', 'medium', 'high', 'urgent'].map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Channel</Label>
              <Select value={form.channel} onValueChange={v => set('channel', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['chat', 'email', 'facebook', 'instagram', 'whatsapp'].map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Create Ticket</Button>
        </div>
      </div>
    </div>
  );
}