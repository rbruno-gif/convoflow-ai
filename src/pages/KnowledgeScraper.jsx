import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Globe, Plus, Trash2, RefreshCw, CheckCircle, Clock, AlertCircle, Search, Edit2, Check, X, BookOpen, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import ScraperURLPanel from '@/components/scraper/ScraperURLPanel';
import ScraperReviewTable from '@/components/scraper/ScraperReviewTable';
import ScraperKnowledgeBase from '@/components/scraper/ScraperKnowledgeBase';

export default function KnowledgeScraper() {
  const [tab, setTab] = useState('scraper');
  const { activeBrand, activeBrandId } = useBrand();

  const tabs = [
    { id: 'scraper', label: 'URL Scraper' },
    { id: 'review', label: 'Review Queue' },
    { id: 'knowledge', label: 'Knowledge Base' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900">Knowledge Base Scraper</h1>
          <p className="text-xs text-gray-400">{activeBrand?.name || 'Select a brand'} · AI Training Data</p>
        </div>
        <div className="ml-auto flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              style={tab === t.id ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!activeBrandId ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Select a brand from the sidebar to get started</p>
            </div>
          </div>
        ) : (
          <>
            {tab === 'scraper' && <ScraperURLPanel brandId={activeBrandId} brandName={activeBrand?.name} />}
            {tab === 'review' && <ScraperReviewTable brandId={activeBrandId} brandName={activeBrand?.name} />}
            {tab === 'knowledge' && <ScraperKnowledgeBase brandId={activeBrandId} brandName={activeBrand?.name} />}
          </>
        )}
      </div>
    </div>
  );
}