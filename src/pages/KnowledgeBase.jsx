import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, Plus, Search, Globe, FileText, Trash2, Edit2, Upload, Loader2, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import ImportFromWebsite from '@/components/faqs/ImportFromWebsite';

const sourceConfig = {
  manual: { icon: FileText, color: 'bg-blue-100 text-blue-600', label: 'Manual' },
  website: { icon: Globe, color: 'bg-green-100 text-green-600', label: 'Website' },
  pdf: { icon: Upload, color: 'bg-orange-100 text-orange-600', label: 'PDF' },
  doc: { icon: FileText, color: 'bg-purple-100 text-purple-600', label: 'Document' },
};

const emptyDoc = { title: '', content: '', source_type: 'manual', source_url: '', category: '', is_active: true };

export default function KnowledgeBase() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyDoc);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: docs = [] } = useQuery({
    queryKey: ['knowledge-docs'],
    queryFn: () => base44.entities.KnowledgeDoc.list('-created_date', 200),
  });

  const filtered = docs.filter(d =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.content?.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    if (!form.title || !form.content) return;
    if (editing) {
      await base44.entities.KnowledgeDoc.update(editing, form);
      toast({ title: 'Document updated' });
    } else {
      await base44.entities.KnowledgeDoc.create(form);
      toast({ title: 'Document added to knowledge base' });
    }
    qc.invalidateQueries({ queryKey: ['knowledge-docs'] });
    setShowForm(false); setEditing(null); setForm(emptyDoc);
  };

  const del = async (id) => {
    await base44.entities.KnowledgeDoc.delete(id);
    qc.invalidateQueries({ queryKey: ['knowledge-docs'] });
    toast({ title: 'Document removed' });
  };

  const toggleActive = async (doc) => {
    await base44.entities.KnowledgeDoc.update(doc.id, { is_active: !doc.is_active });
    qc.invalidateQueries({ queryKey: ['knowledge-docs'] });
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, category: { type: 'string' } } },
    });
    if (result.status === 'success' && result.output) {
      const data = Array.isArray(result.output) ? result.output[0] : result.output;
      setForm({ title: data.title || file.name, content: data.content || '', source_type: 'pdf', category: data.category || '', is_active: true });
      setShowForm(true);
    }
    setUploading(false);
    toast({ title: 'PDF content extracted — review and save' });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">{docs.length} documents · AI training source</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { setShowImport(s => !s); setShowForm(false); }} className="gap-2">
            <Globe className="w-4 h-4" /> Import from Website
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" className="gap-2" disabled={uploading} asChild>
              <span>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload PDF
              </span>
            </Button>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handlePDFUpload} />
          </label>
          <Button onClick={() => { setEditing(null); setForm(emptyDoc); setShowForm(s => !s); setShowImport(false); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Document
          </Button>
        </div>
      </div>

      {showImport && (
        <div className="mb-6 p-5 rounded-xl border bg-card shadow-sm">
          <h3 className="font-semibold text-sm mb-3">Import from Website</h3>
          <ImportFromWebsite onImported={() => { qc.invalidateQueries({ queryKey: ['knowledge-docs'] }); setShowImport(false); }} />
        </div>
      )}

      {showForm && (
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">{editing ? 'Edit Document' : 'New Document'}</h3>
            <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Content — paste your support article, policy, product info, etc." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} className="resize-none" />
            <div className="flex gap-3">
              <Input placeholder="Category (optional)" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="flex-1" />
              {form.source_type === 'website' && (
                <Input placeholder="Source URL" value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} className="flex-1" />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              <Button size="sm" onClick={save}>Save Document</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search knowledge base..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No documents yet. Add articles, policies, and FAQs to train your AI.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const cfg = sourceConfig[doc.source_type] || sourceConfig.manual;
            const Icon = cfg.icon;
            return (
              <Card key={doc.id} className={`border-0 shadow-sm transition-opacity ${doc.is_active ? '' : 'opacity-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-sm">{doc.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                        {doc.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{doc.category}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{doc.content}</p>
                      {doc.source_url && (
                        <a href={doc.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">{doc.source_url}</a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={doc.is_active} onCheckedChange={() => toggleActive(doc)} className="scale-75" />
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditing(doc.id); setForm({ ...doc }); setShowForm(true); }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => del(doc.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}