import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { BarChart3, MessageSquare, Ticket, Bot, Star, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import DateRangeFilter from '@/components/reporting/DateRangeFilter';
import SuperAdminOverview from '@/components/reporting/SuperAdminOverview';
import ConversationAnalytics from '@/components/reporting/ConversationAnalytics';
import TicketAnalytics from '@/components/reporting/TicketAnalytics';
import AgentPerformance from '@/components/reporting/AgentPerformance';
import AIAnalytics from '@/components/reporting/AIAnalytics';
import CSATAnalytics from '@/components/reporting/CSATAnalytics';
import ReportsExport from '@/components/reporting/ReportsExport';

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'conversations', label: 'Conversations', icon: MessageSquare },
  { key: 'tickets', label: 'Tickets', icon: Ticket },
  { key: 'agents', label: 'Agent Performance', icon: Users },
  { key: 'ai', label: 'AI & Chatbot', icon: Bot },
  { key: 'csat', label: 'CSAT', icon: Star },
  { key: 'reports', label: 'Reports & Exports', icon: FileText },
];

export default function ReportingDashboard() {
  const [tab, setTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const { activeBrandId, activeBrand } = useBrand();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Reporting & Analytics</h1>
              <p className="text-xs text-gray-400">{activeBrand?.name || 'U2C Group'} · Data-driven insights</p>
            </div>
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                tab === key ? 'text-white' : 'text-gray-500 hover:bg-gray-100')}
              style={tab === key ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && <SuperAdminOverview brandId={activeBrandId} dateRange={dateRange} />}
        {tab === 'conversations' && <ConversationAnalytics brandId={activeBrandId} dateRange={dateRange} />}
        {tab === 'tickets' && <TicketAnalytics brandId={activeBrandId} dateRange={dateRange} />}
        {tab === 'agents' && <AgentPerformance brandId={activeBrandId} dateRange={dateRange} />}
        {tab === 'ai' && <AIAnalytics brandId={activeBrandId} dateRange={dateRange} />}
        {tab === 'csat' && <CSATAnalytics brandId={activeBrandId} dateRange={dateRange} />}
        {tab === 'reports' && <ReportsExport brandId={activeBrandId} dateRange={dateRange} />}
      </div>
    </div>
  );
}