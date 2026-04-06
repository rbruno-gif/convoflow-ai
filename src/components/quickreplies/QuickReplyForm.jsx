import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function QuickReplyForm({ template, onClose, categories }) {
  const [form, setForm] = useState({
    name: '',
    content: '',
    category: 'support',
    notes: '',
  });

  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name,
        content: template.content,
        category: template.category,
        notes: template.notes || '',
      });
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (template) {
        return base44.entities.QuickReply.update(template.id, data);
      }
      return base44.entities.QuickReply.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quick-replies'] });
      toast({ title: template ? 'Template updated' : 'Template created' });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <Card className="border-0 shadow-sm mb-8">
      <CardHeader className="pb-3 border-b flex items-center justify-between">
        <CardTitle>{template ? 'Edit Template' : 'Create New Template'}</CardTitle>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Template Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Order Confirmation"
              className="w-full px-3 py-2 rounded-lg border border-input text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">For internal use only</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Hi {customer_name}, your order #{order_number} has been confirmed..."
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-input text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Supports placeholders: {'{customer_name}'}, {'{order_number}'}, {'{date}'}, {'{time}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input text-sm"
            >
              {Object.entries(categories).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Internal Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g., Use for transactional updates only"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="gap-2">
              <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}