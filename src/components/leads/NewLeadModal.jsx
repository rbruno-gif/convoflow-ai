import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function NewLeadModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: 'chat', status: 'new', notes: '', location: '' });

  const save = async () => {
    if (!form.name) return;
    await base44.entities.Lead.create(form);
    onCreate();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">Add Lead</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Company</Label>
              <Input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Inc." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Phone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 8900" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Source</Label>
              <Select value={form.source} onValueChange={v => set('source', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['chat', 'popup', 'form', 'facebook', 'instagram', 'whatsapp', 'other'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Location</Label>
              <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="New York, US" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="resize-none" placeholder="Any additional notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Add Lead</Button>
        </div>
      </div>
    </div>
  );
}