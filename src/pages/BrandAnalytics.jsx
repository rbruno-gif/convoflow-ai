import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, MessageSquare, Bot, Clock, Star, Users, GitCompare } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';

const COLORS = ['#7c3aed', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function BrandAnalytics() {
  const { activeBrandId, activeBrand, brands } = useBrand();
  const [compareMode, setCompareMode] = useState(false);
  const [compareBrandId, setCompareBrandId] = useState('');

  const { data: allConversations = [] } = useQuery({
    queryKey: ['analytics-convos'],
    queryFn: () => base44.entities.Conversation.list('-created_date', 500),
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ['analytics-tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date', 200),
  });

  const { data: allFAQs = [] } = useQuery({
    queryKey: ['analytics-faqs'],
    queryFn: () => base44.entities.FAQ.list(),
  });

  const activeBrandList = brands.filter(b => b.is_active && b.slug !== 'u2c-group');

  const getStats = (brandId) => {
    const convos = brandId ? allConversations.filter(c => c.brand_id === brandId) : allConversations;
    const tickets = brandId ? allTickets.filter(t => t.brand_id === brandId) : allTickets;
    const faqs = brandId ? allFAQs.filter(f => f.brand_id === brandId) : allFAQs;
    const total = convos.length;
    const aiHandled = convos.filter(c => c.mode === 'ai').length;
    const resolved = convos.filter(c => c.status === 'resolved').length;
    return {
      total,
      aiRate: total > 0 ? Math.round((aiHandled / total) * 100) : 0,
      resolveRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      openTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
      avgCsat: tickets.filter(t => t.csat_score).length > 0
        ? (tickets.reduce((s, t) => s + (t.csat_score || 0), 0) / tickets.filter(t => t.csat_score).length).toFixed(1)
        : 'N/A',
      faqCount: faqs.length,
      last7: Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dayStr = format(d, 'MMM d');
        return {
          day: format(d, 'EEE'),
          count: convos.filter(c => c.created_date && format(new Date(c.created_date), 'MMM d') === dayStr).length,
        };
      }),
    };
  };

  const primaryStats = getStats(activeBrandId);
  const compareStats = compareMode && compareBrandId ? getStats(compareBrandId) : null;
  const compareBrand = activeBrandList.find(b => b.id === compareBrandId);

  const statCards = [
    { label: 'Total Conversations', value: primaryStats.total, icon: MessageSquare, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { label: 'AI Resolution Rate', value: `${primaryStats.aiRate}%`, icon: Bot, color: '#4f46e5', bg: 'rgba(79,70,229,0.1)' },
    { label: 'Resolution Rate', value: `${primaryStats.resolveRate}%`, icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Open Tickets', value: primaryStats.openTickets, icon: Clock, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'CSAT Score', value: primaryStats.avgCsat, icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'FAQ Articles', value: primaryStats.faqCount, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  ];

  return (
    <div className="p-6 max-w-7xl overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">{activeBrand?.name || 'All brands'}</p>
        </div>
        <div className="flex items-center gap-3">
          {compareMode && (
            <select value={compareBrandId} onChange={e => setCompareBrandId(e.target.value)}
              className="text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">Select brand to compare</option>
              {activeBrandList.filter(b => b.id !== activeBrandId).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <button onClick={() => { setCompareMode(c => !c); setCompareBrandId(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${compareMode ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 hover:border-violet-300'}`}>
            <GitCompare className="w-3.5 h-3.5" /> Compare Brands
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {compareStats && (
              <p className="text-xs font-bold mt-0.5" style={{ color: '#4f46e5' }}>
                vs {label === 'Total Conversations' ? compareStats.total : label === 'AI Resolution Rate' ? `${compareStats.aiRate}%` : label === 'Resolution Rate' ? `${compareStats.resolveRate}%` : label === 'Open Tickets' ? compareStats.openTickets : label === 'CSAT Score' ? compareStats.avgCsat : compareStats.faqCount}
              </p>
            )}
            <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">
            Conversation Volume (7 Days)
            {compareStats && compareBrand && <span className="ml-2 text-xs text-violet-500">vs {compareBrand.name}</span>}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={primaryStats.last7.map((d, i) => ({ ...d, compare: compareStats?.last7[i]?.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name={activeBrand?.name || 'Brand'} />
              {compareStats && <Bar dataKey="compare" fill="#4f46e5" radius={[4, 4, 0, 0]} name={compareBrand?.name || 'Compare'} opacity={0.6} />}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">AI vs Human Handled</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={[
                  { name: 'AI', value: Math.max(1, allConversations.filter(c => (!activeBrandId || c.brand_id === activeBrandId) && c.mode === 'ai').length) },
                  { name: 'Human', value: Math.max(1, allConversations.filter(c => (!activeBrandId || c.brand_id === activeBrandId) && c.mode !== 'ai').length) },
                ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  <Cell fill="#7c3aed" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {[{ label: 'AI Handled', color: '#7c3aed' }, { label: 'Human Handled', color: '#e5e7eb' }].map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-gray-500">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Brand comparison table */}
      {!activeBrandId && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Brand Performance Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Brand</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Conversations</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">AI Rate</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Resolution</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Open Tickets</th>
                </tr>
              </thead>
              <tbody>
                {activeBrandList.map(brand => {
                  const s = getStats(brand.id);
                  return (
                    <tr key={brand.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <BrandAvatar brand={brand} size={20} />
                        <span className="font-medium text-gray-800">{brand.name}</span>
                      </td>
                      <td className="text-right py-2.5 px-3 text-gray-600">{s.total}</td>
                      <td className="text-right py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium">{s.aiRate}%</span>
                      </td>
                      <td className="text-right py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{s.resolveRate}%</span>
                      </td>
                      <td className="text-right py-2.5 px-3 text-gray-600">{s.openTickets}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}