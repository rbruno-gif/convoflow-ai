import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Edit2, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Toggle } from '@/components/ui/toggle';

export default function CannedResponses() {
  const [search, setSearch] = useState('');
  const [editingResponse, setEditingResponse] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ shortcut: '', title: '', content: '', is_shared: false });
  const { activeBrandId } = useBrand();
  const qc = useQueryClient();

  const { data: responses = [] } = useQuery({
    queryKey: ['canned-responses', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.CannedResponse.filter({ brand_id: activeBrandId })
      : [],
  });

  const filtered = responses.filter(r =>
    r.shortcut.toLowerCase().includes(search.toLowerCase()) ||
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const saveResponse = async () => {
    const payload = { ...form, brand_id: activeBrandId, is_shared: form.is_shared };
    if (editingResponse) {
      await base44.entities.CannedResponse.update(editingResponse.id, payload);
    } else {
      await base44.entities.CannedResponse.create(payload);
    }
    qc.invalidateQueries({ queryKey: ['canned-responses', activeBrandId] });
    setShowForm(false);
    setEditingResponse(null);
    setForm({ shortcut: '', title: '', content: '', is_shared: false });
  };

  const deleteResponse = async (id) => {
    await base44.entities.CannedResponse.delete(id);
    qc.invalidateQueries({ queryKey: ['canned-responses', activeBrandId] });
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Canned Responses</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingResponse(null); setForm({ shortcut: '', title: '', content: '', is_shared: false }); }} className="gap-2">
              <Plus className="w-4 h-4" />
              New Response
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingResponse ? 'Edit' : 'New'} Canned Response</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Shortcut</label>
                <Input
                  placeholder="e.g., refund, thanks"
                  value={form.shortcut}
                  onChange={e => setForm(f => ({ ...f, shortcut: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  placeholder="e.g., Refund Request"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Content</label>
                <Textarea
                  placeholder="Use {customer_name}, {brand_name}, {agent_name} for merge fields"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={6}
                />
              </div>
              <div className="flex items-center gap-2">
                <Toggle
                  pressed={form.is_shared}
                  onPressedChange={v => setForm(f => ({ ...f, is_shared: v }))}
                >
                  {form.is_shared ? 'Shared' : 'Personal'}
                </Toggle>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={saveResponse}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search shortcuts or titles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No canned responses yet</p>
          </div>
        ) : (
          filtered.map(response => (
            <div key={response.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      /{response.shortcut}
                    </code>
                    <span className="text-sm font-medium">{response.title}</span>
                    {response.is_shared && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Shared
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{response.content}</p>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingResponse(response);
                      setForm(response);
                      setShowForm(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteResponse(response.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Used {response.usage_count} times {response.last_used_at && `· Last used ${new Date(response.last_used_at).toLocaleDateString()}`}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}