import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Activity, Users, MessageSquare, Phone, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandCard from '@/components/group/BrandCard';
import ActivityFeed from '@/components/group/ActivityFeed';
import NewBrandModal from '@/components/group/NewBrandModal';

export default function GroupDashboard() {
  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const qc = useQueryClient();

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('-created_date'),
    refetchInterval: 30000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['all-conversations'],
    queryFn: () => base44.entities.Conversation.list('-created_date', 1000),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100),
  });

  // Compute stats
  const activeBrands = brands.filter(b => b.is_active && !b.is_archived).length;
  const inactiveBrands = brands.filter(b => !b.is_active && !b.is_archived).length;
  const archivedBrands = brands.filter(b => b.is_archived).length;
  const totalAgents = brands.length * 5; // Placeholder: actual count from agents table

  const today = new Date().toISOString().split('T')[0];
  const conversationsToday = conversations.filter(c => c.created_date?.startsWith(today)).length;

  const stats = [
    { label: 'Active Brands', value: activeBrands, icon: TrendingUp, color: '#10b981' },
    { label: 'Conversations Today', value: conversationsToday, icon: MessageSquare, color: '#3b82f6' },
    { label: 'Total Agents Online', value: totalAgents, icon: Users, color: '#7c3aed' },
    { label: 'Open Tickets', value: conversations.filter(c => c.status !== 'resolved').length, icon: Activity, color: '#f59e0b' },
  ];

  const recentActivity = auditLogs.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">U2C Group</h1>
            <p className="text-sm text-gray-500 mt-1">Super-admin dashboard · Manage all brands</p>
          </div>
          <button
            onClick={() => setShowNewBrandModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Plus className="w-4 h-4" /> Create Brand
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs font-medium text-gray-600 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Brands Grid */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">All Brands</h2>
          <span className="text-xs text-gray-500 font-medium">{brands.length} brands</span>
        </div>
        {brands.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No brands yet</p>
            <button
              onClick={() => setShowNewBrandModal(true)}
              className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Create First Brand
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map(brand => (
              <BrandCard key={brand.id} brand={brand} onRefresh={() => qc.invalidateQueries({ queryKey: ['brands'] })} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          <Link to="/audit-log" className="text-xs text-violet-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <ActivityFeed activities={recentActivity} />
      </div>

      {showNewBrandModal && (
        <NewBrandModal
          onClose={() => setShowNewBrandModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['brands'] });
            setShowNewBrandModal(false);
          }}
        />
      )}
    </div>
  );
}