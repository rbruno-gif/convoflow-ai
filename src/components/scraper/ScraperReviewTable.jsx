import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, X, Edit2, Trash2, Search, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ScraperReviewTable({ brandId, brandName }) {
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ question: '', answer: '' });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: pending = [] } = useQuery({
    queryKey: ['faqs-pending', brandId],
    queryFn: () => base44.entities.FAQ.filter({ brand_id: brandId, is_active: false }, '-created_date', 200),
  });

  const filtered = pending.filter(f =>
    !search ||
    f.question?.toLowerCase().includes(search.toLowerCase()) ||
    f.answer?.toLowerCase().includes(search.toLowerCase())
  );

  const approve = async (faq) => {
    await base44.entities.FAQ.update(faq.id, { is_active: true });
    qc.invalidateQueries({ queryKey: ['faqs-pending', brandId] });
    qc.invalidateQueries({ queryKey: ['faqs', brandId] });
    toast({ title: 'FAQ approved and published to knowledge base' });
  };

  const reject = async (faq) => {
    await base44.entities.FAQ.delete(faq.id);
    qc.invalidateQueries({ queryKey: ['faqs-pending', brandId] });
    toast({ title: 'Entry removed' });
  };

  const approveAll = async () => {
    await Promise.all(filtered.map(f => base44.entities.FAQ.update(f.id, { is_active: true })));
    qc.invalidateQueries({ queryKey: ['faqs-pending', brandId] });
    qc.invalidateQueries({ queryKey: ['faqs', brandId] });
    toast({ title: `${filtered.length} FAQs approved and published!` });
  };

  const startEdit = (faq) => {
    setEditId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer });
  };

  const saveEdit = async () => {
    await base44.entities.FAQ.update(editId, editForm);
    qc.invalidateQueries({ queryKey: ['faqs-pending', brandId] });
    setEditId(null);
    toast({ title: 'Entry updated' });
  };

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Review Queue</h2>
          <p className="text-xs text-gray-400 mt-0.5">{pending.length} entries pending review for {brandName}</p>
        </div>
        {filtered.length > 0 && (
          <button onClick={approveAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <CheckCircle className="w-3.5 h-3.5" /> Approve All ({filtered.length})
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">{pending.length === 0 ? 'No pending entries' : 'No matches found'}</p>
          <p className="text-xs mt-1">{pending.length === 0 ? 'Scrape a URL to see extracted Q&As here' : 'Try a different search term'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 w-5/12">Question</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 w-5/12">Answer</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 w-1/12">Category</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3 w-1/12">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(faq => (
                <tr key={faq.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  {editId === faq.id ? (
                    <>
                      <td className="px-4 py-3" colSpan={2}>
                        <div className="space-y-2">
                          <input value={editForm.question} onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))}
                            className="w-full text-xs rounded-lg border border-violet-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400" />
                          <textarea value={editForm.answer} onChange={e => setEditForm(f => ({ ...f, answer: e.target.value }))}
                            rows={3} className="w-full text-xs rounded-lg border border-violet-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[faq.category] || categoryColors.general}`}>
                          {faq.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={saveEdit} className="p-1.5 hover:bg-green-50 rounded-lg text-green-500"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 align-top">
                        <p className="text-xs font-medium text-gray-900 leading-relaxed">{faq.question}</p>
                        {faq.source_url && (
                          <a href={faq.source_url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-gray-300 hover:text-violet-400 flex items-center gap-0.5 mt-1">
                            <ExternalLink className="w-2.5 h-2.5" /> Source
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{faq.answer}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${categoryColors[faq.category] || categoryColors.general}`}>
                          {faq.category || 'general'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => approve(faq)} title="Approve" className="p-1.5 hover:bg-green-50 rounded-lg text-gray-300 hover:text-green-500 transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => startEdit(faq)} title="Edit" className="p-1.5 hover:bg-violet-50 rounded-lg text-gray-300 hover:text-violet-500 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => reject(faq)} title="Delete" className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}