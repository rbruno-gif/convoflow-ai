import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Calendar, Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MetricCard from '@/components/analytics/MetricCard';
import ConversationAnalytics from '@/components/analytics/ConversationAnalytics';
import TicketAnalytics from '@/components/analytics/TicketAnalytics';
import AgentPerformance from '@/components/analytics/AgentPerformance';
import AIAnalytics from '@/components/analytics/AIAnalytics';
import CSATAnalytics from '@/components/analytics/CSATAnalytics';
import ReportsExport from '@/components/analytics/ReportsExport';

export default function Analytics() {
  const [dateRange, setDateRange] = useState('30d');
  const { activeBrandId, activeBrand, isInitialized } = useBrand();

  // Only query when brand is initialized and available
  const { data: conversations = [], isLoading: convosLoading } = useQuery({
    queryKey: ['analytics-conversations', activeBrandId, dateRange],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-created_date', 1000)
      : [],
    enabled: !!activeBrandId && isInitialized,
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['analytics-tickets', activeBrandId, dateRange],
    queryFn: () => activeBrandId
      ? base44.entities.Ticket.filter({ brand_id: activeBrandId }, '-created_date', 1000)
      : [],
    enabled: !!activeBrandId && isInitialized,
  });

  // Calculate metrics
  const totalConversations = conversations.length;
  const resolvedConversations = conversations.filter(c => c.status === 'resolved').length;
  const resolutionRate = totalConversations > 0 ? Math.round((resolvedConversations / totalConversations) * 100) : 0;
  
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  
  const metrics = [
    { label: 'Total Conversations', value: totalConversations, change: '+12%' },
    { label: 'Total Tickets', value: totalTickets, change: '+8%' },
    { label: 'Resolution Rate', value: `${resolutionRate}%`, change: '+3%' },
    { label: 'Avg First Response', value: '2.3 min', change: '-15%' },
  ];

  if (!isInitialized || !activeBrandId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics & Reports</h1>
            <p className="text-muted-foreground mt-1">{activeBrand?.name} · Insights and metrics</p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metric Cards */}
        {convosLoading || ticketsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-white rounded-lg border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => (
              <MetricCard key={idx} {...metric} />
            ))}
          </div>
        )}

        {/* Analytics Sections */}
        <div className="space-y-6">
          <ConversationAnalytics conversations={conversations} />
          <TicketAnalytics tickets={tickets} />
          <AgentPerformance brand={activeBrandId} />
          <AIAnalytics brand={activeBrandId} />
          <CSATAnalytics conversations={conversations} />
          <ReportsExport brand={activeBrandId} />
        </div>
      </div>
    </div>
  );
}