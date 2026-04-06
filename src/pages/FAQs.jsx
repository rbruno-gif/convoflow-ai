import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, HelpCircle, Globe, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImportFromWebsite from '@/components/faqs/ImportFromWebsite';
import FAQSuggestionForm from '@/components/faqs/FAQSuggestionForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = ['shipping', 'returns', 'payment', 'products', 'orders', 'general'];

const emptyFaq = { question: '', answer: '', category: 'general', is_active: true, keywords: [] };

export default function FAQs() {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyFaq);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => base44.entities.FAQ.list('-created_date', 100),
  });

  const openNew = () => { setEditing(null); setForm(emptyFaq); setShowForm(true); };
  const openEdit = (faq) => { setEditing(faq.id); setForm({ ...faq }); setShowForm(true); };
  const cancel = () => { setShowForm(false); setEditing(null); };

  const save = async () => {
    if (!form.question || !form.answer) {
      toast({ title: 'Please fill in both question and answer', variant: 'destructive' });
      return;
    }
    if (editing) {
      await base44.entities.FAQ.update(editing, form);
      toast({ title: 'FAQ updated' });
    } else {
      await base44.entities.FAQ.create(form);
      toast({ title: 'FAQ created' });
    }
    qc.invalidateQueries({ queryKey: ['faqs'] });
    cancel();
  };

  const deleteFaq = async (id) => {
    await base44.entities.FAQ.delete(id);
    qc.invalidateQueries({ queryKey: ['faqs'] });
    toast({ title: 'FAQ deleted' });
  };

  const toggleActive = async (faq) => {
    await base44.entities.FAQ.update(faq.id, { is_active: !faq.is_active });
    qc.invalidateQueries({ queryKey: ['faqs'] });
  };

  const catColor = {
    shipping: 'bg-blue-100 text-blue-700',
    returns: 'bg-orange-100 text-orange-700',
    payment: 'bg-green-100 text-green-700',
    products: 'bg-purple-100 text-purple-700',
    orders: 'bg-indigo-100 text-indigo-700',
    general: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FAQ Manager</h1>
          <p className="text-sm text-muted-foreground">Manage the knowledge base your AI uses to answer questions</p>
        </div>
        <div className="flex gap-2">
           <FAQSuggestionForm />
           <Button variant="outline" onClick={() => { setShowImport(s => !s); setShowForm(false); }} className="gap-2">
             <Globe className="w-4 h-4" /> Import from Website
           </Button>
           <Link to="/faq-approvals">
             <Button variant="outline" className="gap-2">
               <Lightbulb className="w-4 h-4" /> Approvals
             </Button>
           </Link>
           <Button onClick={openNew} className="gap-2">
             <Plus className="w-4 h-4" /> Add FAQ
           </Button>
         </div>
      </div>

      {showImport && (
        <div className="mb-6 p-5 rounded-xl border bg-card shadow-sm">
          <h3 className="font-semibold text-sm mb-3">Import Knowledge Base from Website</h3>
          <ImportFromWebsite onImported={() => { qc.invalidateQueries({ queryKey: ['faqs'] }); setShowImport(false); }} />
        </div>
      )}

      {showForm && (
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">{editing ? 'Edit FAQ' : 'New FAQ'}</h3>
            <Input
              placeholder="Question"
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            />
            <Textarea
              placeholder="Answer"
              value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-3">
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>
              <Button size="sm" onClick={save}>Save FAQ</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {faqs.length === 0 && !showForm ? (
        <div className="text-center py-20 text-muted-foreground">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No FAQs yet. Add some to power your AI agent.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map(faq => (
            <Card key={faq.id} className={`border-0 shadow-sm transition-opacity ${faq.is_active ? '' : 'opacity-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catColor[faq.category] || catColor.general}`}>
                        {faq.category}
                      </span>
                      {!faq.is_active && <span className="text-[10px] text-muted-foreground">inactive</span>}
                    </div>
                    <p className="text-sm font-medium">{faq.question}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={faq.is_active}
                      onCheckedChange={() => toggleActive(faq)}
                      className="scale-75"
                    />
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(faq)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deleteFaq(faq.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}