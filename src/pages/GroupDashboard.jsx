import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { MessageSquare, Ticket, Users, ArrowRight, Zap, Bot, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';
import { format } from 'date-fns';

export default function GroupDashboard() {
  const { brands, switchBrand } = useBrand();

  // Only show child brands (non-group)
  const childBrands = brands.filter(b => b.slug !== 'u2c-group' && !b.is_archived);

  const { data: allConversations = [] } = useQuery({
    queryKey: ['conversations-group'],
    queryFn: () => base44.entities.Conversation.list('-last_message_time', 500),
    refetchInterval: 30000,
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ['tickets-group'],
    queryFn: () => base44.entities.Ticket.list('-created_date', 500),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const todayStr = format(new Date(), 'MMM d');

  const getBrandMetrics = (brand) => {
    const convos = allConversations.filter(c => c.brand_id === brand.id);
    const tickets = allTickets.filter(t => t.brand_id === brand.id);
    const today = convos.filter(c => c.created_date && format(new Date(c.created_date), 'MMM d') === todayStr);
    const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
    const flagged = convos.filter(c => c.status === 'flagged' || c.status === 'human_requested');
    const agents = allUsers.filter(u =>
      (brand.assigned_agents || []).includes(u.email) || u.role === 'admin'
    );
    return { convos, today, openTickets, flagged, agents };
  };

  // Group-wide totals
  const totalConvosToday = allConversations.filter(c =>
    c.created_date && format(new Date(c.created_date), 'MMM d') === todayStr
  ).length;
  const totalOpenTickets = allTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const totalFlagged = allConversations.filter(c => c.status === 'flagged' || c.status === 'human_requested').length;
  const totalAgents = allUsers.filter(u => u.role !== 'admin').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            UG
          </div>
          <h1 className="text-2xl font-bold text-gray-900">U2C Group</h1>
          <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2.5 py-1 rounded-full">Super Admin</span>
        </div>
        <p className="text-sm text-gray-400 ml-11">Parent workspace · {childBrands.length} active brands</p>
      </div>

      {/* Group-wide KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: MessageSquare, label: 'Conversations Today', value: totalConvosToday, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
          { icon: Ticket, label: 'Open Tickets', value: totalOpenTickets, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { icon: AlertTriangle, label: 'Flagged / Escalated', value: totalFlagged, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { icon: Users, label: 'Total Agents', value: totalAgents, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-Brand Cards */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Brand Overview</h2>
      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        {childBrands.map(brand => {
          const { today, openTickets, flagged, agents } = getBrandMetrics(brand);
          return (
            <div key={brand.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Brand Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <BrandAvatar brand={brand} size={36} />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{brand.name}</p>
                    <p className="text-[11px] text-gray-400">{brand.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${brand.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={`text-[11px] font-medium ${brand.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 divide-x divide-gray-50 px-5 py-4">
                <MetricCell label="Convos Today" value={today.length} color="#7c3aed" />
                <MetricCell label="Open Tickets" value={openTickets.length} color="#ef4444" />
                <MetricCell label="Agents" value={agents.length} color="#10b981" />
              </div>

              {/* Flags + CTA */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
                {flagged.length > 0 ? (
                  <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {flagged.length} need attention
                  </span>
                ) : (
                  <span className="text-xs text-green-600 font-medium">✓ No escalations</span>
                )}
                <button
                  onClick={() => switchBrand(brand.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                >
                  Switch to brand <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-sm text-gray-800">Agent Assignments</h2>
          <Link to="/agents" className="text-xs text-violet-600 hover:underline flex items-center gap-1">
            Manage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {allUsers.filter(u => u.role !== 'admin').slice(0, 8).map(u => {
            const assignedTo = childBrands.filter(b => (b.assigned_agents || []).includes(u.email));
            return (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-xs shrink-0">
                  {u.full_name?.charAt(0) || u.email?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || u.email}</p>
                  <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {assignedTo.length === 0 ? (
                    <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Unassigned</span>
                  ) : assignedTo.map(b => (
                    <span key={b.id} className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ background: b.primary_color || '#7c3aed' }}>
                      {b.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {allUsers.filter(u => u.role !== 'admin').length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No agents yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCell({ label, value, color }) {
  return (
    <div className="text-center px-2">
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}