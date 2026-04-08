import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Ticket, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { subDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { filterByDateRange } from './DateRangeFilter';
import MetricCard from './MetricCard';

export default function TicketAnalytics({ brandId, dateRange }) {
  const { data: allTickets = [] } = useQuery({
    queryKey: ['rep-tickets', brandId],
    queryFn: () => brandId
      ? base44.entities.Ticket.filter({ brand_id: brandId }, '-created_date', 500)
      : base44.entities.Ticket.list('-created_date', 500),
  });

  const tickets = filterByDateRange(allTickets, 'created_date', dateRange);
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const escalated = tickets.filter(t => t.priority === 'urgent');
  const escalationRate = tickets.length > 0 ? Math.round((escalated.length / tickets.length) * 100) : 0;

  // Weekly created vs resolved
  const weeks = Math.min(Math.ceil(parseInt(dateRange) / 7), 8);
  const weeklyData = Array.from({ length: weeks }, (_, i) => {
    const weekStart = subDays(new Date(), (weeks - 1 - i) * 7 + 6);
    const weekEnd = subDays(new Date(), (weeks - 1 - i) * 7);
    const created = tickets.filter(t => {
      const d = t.created_date ? new Date(t.created_date) : null;
      return d && d >= weekStart && d <= weekEnd;
    }).length;
    const res = tickets.filter(t => {
      const d = t.resolved_at ? new Date(t.resolved_at) : null;
      return d && d >= weekStart && d <= weekEnd;
    }).length;
    return { week: `W${i + 1}`, created, resolved: res };
  });

  // Topic keywords extraction
  const topicMap = {};
  tickets.forEach(t => {
    const words = (t.title + ' ' + (t.description || '')).toLowerCase().split(/\W+/);
    words.filter(w => w.length > 4).forEach(w => { topicMap[w] = (topicMap[w] || 0) + 1; });
  });
  const stopWords = new Set(['about', 'there', 'their', 'would', 'could', 'should', 'which', 'after', 'before', 'other', 'issue', 'problem', 'please', 'thank', 'hello', 'customer']);
  const topTopics = Object.entries(topicMap)
    .filter(([w]) => !stopWords.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Backlog trend
  const backlogData = Array.from({ length: Math.min(parseInt(dateRange), 14) }, (_, i) => {
    const d = subDays(new Date(), Math.min(parseInt(dateRange), 14) - 1 - i);
    const dayStr = format(d, 'MMM d');
    const backlog = allTickets.filter(t => {
      const created = t.created_date ? new Date(t.created_date) : null;
      const resolvedAt = t.resolved_at ? new Date(t.resolved_at) : null;
      return created && created <= d && (!resolvedAt || resolvedAt > d);
    }).length;
    return { day: format(d, 'MMM d'), backlog };
  });

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Tickets" value={tickets.length} icon={Ticket} color="#7c3aed" bg="rgba(124,58,237,0.1)" sub={`${dateRange}-day period`} />
        <MetricCard label="Resolved" value={resolved.length} icon={Ticket} color="#10b981" bg="rgba(16,185,129,0.1)" sub={`${tickets.length > 0 ? Math.round((resolved.length / tickets.length) * 100) : 0}% resolution rate`} />
        <MetricCard label="Open Backlog" value={open.length} icon={AlertTriangle} color="#ef4444" bg="rgba(239,68,68,0.1)" sub="Awaiting resolution" />
        <MetricCard label="Escalation Rate" value={`${escalationRate}%`} icon={TrendingDown} color="#f59e0b" bg="rgba(245,158,11,0.1)" sub={`${escalated.length} urgent tickets`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Created vs Resolved */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Created vs Resolved (Weekly)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="created" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Created" />
              <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Backlog trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Ticket Backlog Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={backlogData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="backlog" stroke="#ef4444" strokeWidth={2.5} dot={false} name="Open Tickets" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top topics */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-sm text-gray-800 mb-4">Top 10 Ticket Topics</h3>
        {topTopics.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No ticket data yet</p>
        ) : (
          <div className="space-y-2">
            {topTopics.map(([word, count], i) => {
              const maxCount = topTopics[0][1];
              return (
                <div key={word} className="flex items-center gap-3">
                  <span className="w-5 text-[11px] text-gray-400 font-medium text-right shrink-0">#{i + 1}</span>
                  <span className="w-28 text-xs font-medium text-gray-700 truncate capitalize">{word}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #0891b2)' }} />
                  </div>
                  <span className="w-8 text-[11px] text-gray-500 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}