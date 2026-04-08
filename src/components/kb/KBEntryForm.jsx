import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function KBEntryForm({ brandId, entry, onClose, onSave }) {
  const [form, setForm] = useState({
    question: '',
    answer: '',
    status: 'draft',
    tags: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setForm(entry);
    }
  }, [entry]);

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);

    try {
      const payload = {
        ...form,
        brand_id: brandId,
        created_by: 'current-user', // TODO: Get from auth
      };

      if (entry?.id) {
        await base44.entities.KnowledgeBase.update(entry.id, payload);
      } else {
        await base44.entities.KnowledgeBase.create(payload);
      }

      onSave();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              {entry ? 'Edit KB Entry' : 'New KB Entry'}
            </h2>
            <button onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Question *</label>
            <Input
              placeholder="What is your question?"
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Answer *</label>
            <Textarea
              placeholder="Provide a detailed answer..."
              value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Tags</label>
              <Input
                placeholder="Comma-separated tags"
                value={form.tags?.join(', ') || ''}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(t => t.trim()) }))}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!form.question.trim() || !form.answer.trim() || saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}