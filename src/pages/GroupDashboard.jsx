import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Building2, MessageSquare, Users, TrendingUp, Plus, ArrowRight, Activity } from 'lucide-react';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';

export default function GroupDashboard() {
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.filter({ is_archived: false }),
    refetchInterval: 30000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', 'all'],
    queryFn: () => base44.entities.Conversation.list('-created_date', 500),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets', 'all'],
    queryFn: () => base44.entities.Ticket.list('-created_date', 200),
  });

  const activeBrands = brands.filter(b => b.is_active && b.slug !== 'u2c-group');
  const totalConvos = conversations.length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const aiHandled = conversations.filter(c => c.mode === 'ai').length;
  const aiRate = totalConvos > 0 ? Math.round((aiHandled / totalConvos) * 100) : 0;

  const getBrandStats = (brandId) => ({
    conversations: conversations.filter(c => c.brand_id === brandId).length,
    active: conversations.filter(c => c.brand_id === brandId && c.status === 'active').length,
    flagged: conversations.filter(c => c.brand_id === brandId && (c.status === 'flagged' || c.status === 'human_requested')).length,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">U2C Group Command Center</h1>
          <p className="text-sm text-gray-400 mt-1">Super admin overview · All brands</p>
        </div>
        <Link to="/brands"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-4 h-4" /> Add Brand
        </Link>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Brands', value: activeBrands.length, icon: Building2, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
          { label: 'Total Conversations', value: totalConvos, icon: MessageSquare, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Open Tickets', value: openTickets, icon: Activity, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'AI Resolution Rate', value: `${aiRate}%`, icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Brand grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-gray-900">All Brands</h2>
        <Link to="/brands" className="text-xs text-violet-600 hover:underline flex items-center gap-1">
          Manage brands <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeBrands.map(brand => {
          const stats = getBrandStats(brand.id);
          return (
            <div key={brand.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <BrandAvatar brand={brand} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{brand.name}</p>
                  <p className="text-xs text-gray-400 truncate">{brand.website_url || brand.slug}</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: brand.is_active ? '#22c55e' : '#6b7280' }} />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Total', value: stats.conversations, color: '#6366f1' },
                  { label: 'Active', value: stats.active, color: '#10b981' },
                  { label: 'Flagged', value: stats.flagged, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="text-center py-2 rounded-lg" style={{ background: `${s.color}10` }}>
                    <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Link to={`/conversations?brand=${brand.id}`}
                  className="flex-1 text-center py-1.5 text-xs font-medium rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors">
                  Inbox
                </Link>
                <Link to={`/analytics?brand=${brand.id}`}
                  className="flex-1 text-center py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                  Analytics
                </Link>
              </div>
            </div>
          );
        })}

        {/* Add new brand card */}
        <Link to="/brands"
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-3 hover:border-violet-300 hover:bg-violet-50 transition-all group min-h-[180px]">
          <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-gray-400 group-hover:text-violet-500 transition-colors" />
          </div>
          <p className="text-sm font-medium text-gray-400 group-hover:text-violet-600 transition-colors">Add New Brand</p>
        </Link>
      </div>
    </div>
  );
}