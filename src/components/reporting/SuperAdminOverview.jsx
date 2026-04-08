import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { MessageSquare, Ticket, Users, TrendingUp, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { subDays, format, isToday } from 'date-fns';
import { filterByDateRange } from './DateRangeFilter';
import MetricCard from './MetricCard';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';

export default function SuperAdminOverview({ brandId, dateRange }) {
  const { brands } = useBrand();
  const activeBrandList = brands.filter(b => b.is_active && b.slug !== 'u2c-group');

  const { data: conversations = [] } = useQuery({
    queryKey: ['rep-convos-all'],
    queryFn: () => base44.entities.Conversation.list('-created_date', 1000),
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ['rep-tickets-all'],
    queryFn: () => base44.entities.Ticket.list('-created_date', 500),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const filtered = filterByDateRange(conversations, 'created_date', dateRange);
  const filteredTickets = filterByDateRange(tickets, 'created_date', dateRange);

  const scope = brandId ? filtered.filter(c => c.brand_id === brandId) : filtered;
  const scopeTickets = brandId ? filteredTickets.filter(t => t.brand_id === brandId) : filteredTickets;

  const todayConvos = conversations.filter(c => c.created_date && isToday(new Date(c.created_date)));
  const openTickets = scopeTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolved = scope.filter(c => c.status === 'resolved').length;
  const resolutionRate = scope.length > 0 ? Math.round((resolved / scope.length) * 100) : 0;
  const agentCount = users.filter(u => u.role === 'user').length;

  // Brand comparison data
  const brandComparisonData = activeBrandList.map(brand => {
    const bc = filtered.filter(c => c.brand_id === brand.id);
    const bt = filteredTickets.filter(t => t.brand_id === brand.id);
    const bResolved = bc.filter(c => c.status === 'resolved').length;
    return {
      name: brand.name.length > 12 ? brand.name.slice(0, 12) + '…' : brand.name,
      conversations: bc.length,
      resolutionRate: bc.length > 0 ? Math.round((bResolved / bc.length) * 100) : 0,
      tickets: bt.length,
      color: brand.primary_color || '#7c3aed',
    };
  });

  return (
    <div className="p-6 max-w-7xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Conversations Today" value={todayConvos.length} icon={MessageSquare} color="#7c3aed" bg="rgba(124,58,237,0.1)" sub="Across all brands" />
        <MetricCard label="Open Tickets" value={openTickets} icon={Ticket} color="#ef4444" bg="rgba(239,68,68,0.1)" sub="Awaiting resolution" />
        <MetricCard label="Total Agents" value={agentCount} icon={Users} color="#10b981" bg="rgba(16,185,129,0.1)" sub="Active accounts" />
        <MetricCard label="Resolution Rate" value={`${resolutionRate}%`} icon={TrendingUp} color="#0891b2" bg="rgba(8,145,178,0.1)" sub={`${dateRange}-day period`} />
      </div>

      {/* Brand comparison chart */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Conversation Volume by Brand</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brandComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="conversations" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Conversations" />
              <Bar dataKey="tickets" fill="#0891b2" radius={[4, 4, 0, 0]} name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Resolution Rate by Brand</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brandComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={v => `${v}%`} />
              <Bar dataKey="resolutionRate" fill="#10b981" radius={[0, 4, 4, 0]} name="Resolution %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Brand stats table */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-sm text-gray-800 mb-4">Brand Summary ({dateRange}-day period)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {['Brand', 'Conversations', 'Open Tickets', 'Resolution Rate', 'AI Handled', 'Agents'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeBrandList.map(brand => {
                const bc = filtered.filter(c => c.brand_id === brand.id);
                const bt = filteredTickets.filter(t => t.brand_id === brand.id);
                const bAI = bc.filter(c => c.mode === 'ai').length;
                const bResolved = bc.filter(c => c.status === 'resolved').length;
                const bRate = bc.length > 0 ? Math.round((bResolved / bc.length) * 100) : 0;
                return (
                  <tr key={brand.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <BrandAvatar brand={brand} size={20} />
                        <span className="font-medium text-gray-800">{brand.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 font-semibold">{bc.length}</td>
                    <td className="py-2.5 px-3 text-gray-600">{bt.filter(t => t.status === 'open' || t.status === 'in_progress').length}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${bRate >= 70 ? 'bg-green-50 text-green-700' : bRate >= 40 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                        {bRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold">
                        {bc.length > 0 ? Math.round((bAI / bc.length) * 100) : 0}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{brand.assigned_agents?.length || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}