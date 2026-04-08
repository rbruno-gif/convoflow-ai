import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Edit2, Trash2, CheckCircle, BookOpen, X, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = ['general', 'plans', 'billing', 'activation', 'technical_support', 'shipping', 'returns', 'products'];

const categoryColors = {
  plans: 'bg-blue-50 text-blue-600',
  billing: 'bg-yellow-50 text-yellow-700',
  activation: 'bg-green-50 text-green-700',
  technical_support: 'bg-red-50 text-red-600',
  shipping: 'bg-purple-50 text-purple-600',
  returns: 'bg-orange-50 text-orange-600',
  general: 'bg-gray-100 text-gray-600',
  products: 'bg-indigo-50 text-indigo-600',
};

export default function ScraperKnowledgeBase({ brandId, brandName }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general' });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs', brandId],
    queryFn: () => base44.entities.FAQ.filter({ brand_id: brandId, is_active: true }, '-created_date', 500),
  });

  const filtered = faqs.filter(f => {
    const matchSearch = !search || f.question?.toLowerCase().includes(search.toLowerCase()) || f.answer?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || f.category === filterCat;
    return matchSearch && matchCat;
  });

  const saveNew = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    await base44.entities.FAQ.create({ ...form, brand_id: brandId, is_active: true, usage_count: 0 });
    qc.invalidateQueries({ queryKey: ['faqs', brandId] });
    setShowAdd(false);
    setForm({ question: '', answer: '', category: 'general' });
    toast({ title: 'FAQ added to knowledge base' });
  };

  const saveEdit = async () => {
    await base44.entities.FAQ.update(editId, form);
    qc.invalidateQueries({ queryKey: ['faqs', brandId] });
    setEditId(null);
    toast({ title: 'FAQ updated' });
  };

  const deleteFaq = async (id) => {
    await base44.entities.FAQ.delete(id);
    qc.invalidateQueries({ queryKey: ['faqs', brandId] });
    toast({ title: 'FAQ removed' });
  };

  const startEdit = (faq) => {
    setEditId(faq.id);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category || 'general' });
    setShowAdd(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Knowledge Base</h2>
          <p className="text-xs text-gray-400 mt-0.5">{faqs.length} approved FAQs live for {brandName}'s AI Agent</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditId(null); setForm({ question: '', answer: '', category: 'general' }); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-violet-200 rounded-xl p-5 shadow-sm mb-5 space-y-3">
          <h3 className="font-semibold text-sm">New FAQ</h3>
          <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="Question..." className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
            rows={3} placeholder="Answer..." className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600">Cancel</button>
            <button onClick={saveNew} className="px-4 py-1.5 text-xs rounded-lg text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>Save FAQ</button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge base..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">{faqs.length === 0 ? 'Knowledge base is empty' : 'No matches found'}</p>
          <p className="text-xs mt-1">{faqs.length === 0 ? 'Approve scraped entries or add FAQs manually' : 'Try a different search'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(faq => (
            <div key={faq.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              {editId === faq.id ? (
                <div className="space-y-2">
                  <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-violet-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-400" />
                  <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                    rows={3} className="w-full text-sm rounded-lg border border-violet-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none" />
                  <div className="flex items-center gap-2">
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="text-xs rounded-lg border border-gray-200 px-2 py-1.5">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                    <div className="flex gap-1 ml-auto">
                      <button onClick={saveEdit} className="p-1.5 hover:bg-green-50 rounded-lg text-green-500"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{faq.question}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${categoryColors[faq.category] || categoryColors.general}`}>
                        {faq.category || 'general'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{faq.answer}</p>
                    {faq.usage_count > 0 && (
                      <p className="text-[10px] text-gray-300 mt-1.5">Used {faq.usage_count} times</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(faq)} className="p-1.5 hover:bg-violet-50 rounded-lg text-gray-300 hover:text-violet-500 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteFaq(faq.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}