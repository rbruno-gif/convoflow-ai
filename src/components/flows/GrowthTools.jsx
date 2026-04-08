import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Link, QrCode, Globe, MessageCircle, Phone, Copy, CheckCircle } from 'lucide-react';

export default function GrowthTools({ brandId }) {
  const [copied, setCopied] = useState('');
  const [activeTab, setActiveTab] = useState('refurl');

  const { data: flows = [] } = useQuery({
    queryKey: ['flows', brandId],
    queryFn: () => brandId ? base44.entities.Flow.filter({ brand_id: brandId }) : base44.entities.Flow.list(),
  });

  const baseUrl = `https://chat.u2cmobile.com`;
  const brandSlug = brandId || 'brand';

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(''), 2000);
  };

  const CopyBtn = ({ text, id }) => (
    <button onClick={() => copy(text, id)}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied === id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {copied === id ? <><CheckCircle className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
    </button>
  );

  const TOOLS = [
    { key: 'refurl', label: 'Ref URLs', icon: Link },
    { key: 'qr', label: 'QR Codes', icon: QrCode },
    { key: 'landing', label: 'Landing Pages', icon: Globe },
    { key: 'comment', label: 'Comment-to-DM', icon: MessageCircle },
    { key: 'sms', label: 'SMS Opt-in', icon: Phone },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="font-bold text-gray-900">Growth Tools</h2>
        <p className="text-xs text-gray-400">Grow your subscriber list and drive conversations</p>
      </div>

      {/* Tool tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TOOLS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === key ? 'bg-white shadow-sm text-violet-700 font-semibold' : 'text-gray-500'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'refurl' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-sm text-gray-800 mb-1">Trackable Ref URLs</h3>
            <p className="text-xs text-gray-400 mb-4">Share these links in ads, emails, or social posts. Each link tracks which source drove the subscriber.</p>
            <div className="space-y-3">
              {flows.slice(0, 5).map(flow => {
                const url = `${baseUrl}/ref/${brandSlug}/${flow.id}`;
                return (
                  <div key={flow.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800">{flow.name}</p>
                      <p className="text-[10px] text-violet-600 font-mono truncate">{url}</p>
                    </div>
                    <CopyBtn text={url} id={`ref_${flow.id}`} />
                  </div>
                );
              })}
              {flows.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Create flows to generate ref URLs</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-sm text-gray-800 mb-1">QR Code Generator</h3>
            <p className="text-xs text-gray-400 mb-4">Customer scans → instantly subscribed and enters the linked flow. Perfect for in-store, events, and flyers.</p>
            <div className="grid grid-cols-2 gap-4">
              {flows.slice(0, 4).map(flow => {
                const url = `${baseUrl}/qr/${brandSlug}/${flow.id}`;
                return (
                  <div key={flow.id} className="border border-gray-200 rounded-xl p-4 text-center">
                    {/* QR placeholder */}
                    <div className="w-28 h-28 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-violet-600 opacity-40" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mb-1">{flow.name}</p>
                    <CopyBtn text={url} id={`qr_${flow.id}`} />
                  </div>
                );
              })}
              {flows.length === 0 && <p className="text-sm text-gray-400 col-span-2 text-center py-6">Create flows to generate QR codes</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'landing' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-sm text-gray-800 mb-1">Opt-in Landing Pages</h3>
          <p className="text-xs text-gray-400 mb-4">No-code landing pages that collect subscriber info and trigger a welcome flow automatically.</p>
          <div className="space-y-3">
            {flows.slice(0, 3).map(flow => {
              const url = `${baseUrl}/subscribe/${brandSlug}/${flow.id}`;
              return (
                <div key={flow.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{flow.name}</p>
                    <p className="text-[10px] text-violet-600 font-mono truncate">{url}</p>
                  </div>
                  <CopyBtn text={url} id={`lp_${flow.id}`} />
                </div>
              );
            })}
            {flows.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Create flows to generate landing page URLs</p>}
          </div>
        </div>
      )}

      {activeTab === 'comment' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-sm text-gray-800 mb-1">Comment-to-DM Automation</h3>
          <p className="text-xs text-gray-400 mb-4">When someone comments on a Facebook or Instagram post with a specific keyword, they receive an automatic DM and are added as a subscriber.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-amber-700 font-semibold">⚠️ Requires Facebook/Instagram page connected in Integrations</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Trigger Keyword', placeholder: 'e.g. INFO, OFFER, YES' }, { label: 'Post URL (optional)', placeholder: 'https://facebook.com/post/...' }].map(f => (
              <div key={f.label}>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">{f.label}</label>
                <input placeholder={f.placeholder} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Trigger Flow</label>
            <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">Select flow…</option>
              {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {activeTab === 'sms' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-sm text-gray-800 mb-1">SMS Opt-in Keywords</h3>
          <p className="text-xs text-gray-400 mb-4">Customer texts a keyword to your number → subscribed and entered into a welcome flow automatically.</p>
          <div className="space-y-3">
            {[
              { keyword: 'JOIN', desc: 'General opt-in' },
              { keyword: 'U2C', desc: 'Brand-specific opt-in' },
              { keyword: 'DEAL', desc: 'Promo opt-in' },
            ].map(ex => (
              <div key={ex.keyword} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="font-mono font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-lg text-sm">{ex.keyword}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">{ex.desc}</p>
                  <p className="text-[10px] text-gray-400">Text to: +1 (555) 000-0000</p>
                </div>
                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1">
                  <option>Select flow…</option>
                  {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}