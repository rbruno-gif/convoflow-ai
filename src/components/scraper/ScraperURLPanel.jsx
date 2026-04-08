import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, Clock, ExternalLink, Loader2, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function ScraperURLPanel({ brandId, brandName }) {
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [scraping, setScraping] = useState({});
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: urls = [] } = useQuery({
    queryKey: ['scraped-urls', brandId],
    queryFn: () => base44.entities.ScrapedURL.filter({ brand_id: brandId }, '-created_date', 50),
  });

  const addUrl = async () => {
    if (!newUrl.trim()) return;
    let urlStr = newUrl.trim();
    if (!urlStr.startsWith('http')) urlStr = 'https://' + urlStr;
    await base44.entities.ScrapedURL.create({
      brand_id: brandId,
      url: urlStr,
      label: newLabel.trim() || urlStr,
      status: 'pending',
      faqs_extracted: 0,
    });
    qc.invalidateQueries({ queryKey: ['scraped-urls', brandId] });
    setNewUrl(''); setNewLabel(''); setShowAdd(false);
    toast({ title: 'URL added. Click Scrape to extract content.' });
  };

  const deleteUrl = async (id) => {
    await base44.entities.ScrapedURL.delete(id);
    qc.invalidateQueries({ queryKey: ['scraped-urls', brandId] });
    toast({ title: 'URL removed' });
  };

  const scrapeUrl = async (urlRecord) => {
    setScraping(s => ({ ...s, [urlRecord.id]: true }));
    await base44.entities.ScrapedURL.update(urlRecord.id, { status: 'scraping' });
    qc.invalidateQueries({ queryKey: ['scraped-urls', brandId] });
    try {
      const res = await base44.functions.invoke('scrapeWebsite', {
        url: urlRecord.url,
        brand_id: brandId,
        scraped_url_id: urlRecord.id,
      });
      const count = res.data?.faqs_extracted || 0;
      toast({ title: `Scraped! ${count} Q&A pairs extracted. Review them in the Review Queue.` });
      qc.invalidateQueries({ queryKey: ['scraped-urls', brandId] });
      qc.invalidateQueries({ queryKey: ['faqs-pending', brandId] });
    } catch (err) {
      toast({ title: 'Scraping failed', description: err.message, variant: 'destructive' });
      await base44.entities.ScrapedURL.update(urlRecord.id, { status: 'error', error_message: err.message });
      qc.invalidateQueries({ queryKey: ['scraped-urls', brandId] });
    }
    setScraping(s => ({ ...s, [urlRecord.id]: false }));
  };

  const statusInfo = (s) => {
    if (s === 'done') return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Synced' };
    if (s === 'scraping') return { icon: Loader2, color: 'text-violet-600', bg: 'bg-violet-50', label: 'Scraping...' };
    if (s === 'error') return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Error' };
    return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Pending' };
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Website URLs</h2>
          <p className="text-xs text-gray-400 mt-0.5">Add pages to scrape for {brandName}'s AI knowledge base</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-3.5 h-3.5" /> Add URL
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-violet-200 rounded-xl p-5 shadow-sm mb-5 space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Add Website URL</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">URL *</label>
            <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
              placeholder="https://u2cmobile.com/faq"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Label (optional)</label>
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. FAQ Page, Plans Page"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowAdd(false); setNewUrl(''); setNewLabel(''); }}
              className="px-4 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600">Cancel</button>
            <button onClick={addUrl}
              className="px-4 py-1.5 text-xs rounded-lg text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>Add URL</button>
          </div>
        </div>
      )}

      {urls.length === 0 && !showAdd ? (
        <div className="text-center py-20 text-gray-400">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No URLs added yet</p>
          <p className="text-xs mt-1">Add a website URL to start extracting knowledge</p>
        </div>
      ) : (
        <div className="space-y-3">
          {urls.map(u => {
            const { icon: Icon, color, bg, label } = statusInfo(u.status);
            const isLoading = scraping[u.id] || u.status === 'scraping';
            return (
              <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                    <Globe className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900">{u.label || u.url}</p>
                      <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-500">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.url}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`flex items-center gap-1 text-[11px] font-medium ${color}`}>
                        <Icon className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> {label}
                      </span>
                      {u.last_scraped_at && (
                        <span className="text-[11px] text-gray-400">
                          Last scraped {formatDistanceToNow(new Date(u.last_scraped_at), { addSuffix: true })}
                        </span>
                      )}
                      {u.faqs_extracted > 0 && (
                        <span className="text-[11px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                          {u.faqs_extracted} Q&As extracted
                        </span>
                      )}
                    </div>
                    {u.status === 'error' && u.error_message && (
                      <p className="text-[11px] text-red-500 mt-1">{u.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => scrapeUrl(u)} disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-200 text-violet-600 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      {u.status === 'pending' ? 'Scrape' : 'Re-scrape'}
                    </button>
                    <button onClick={() => deleteUrl(u.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}