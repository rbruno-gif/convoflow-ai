import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { filterByDateRange } from './DateRangeFilter';
import MetricCard from './MetricCard';

const STAR_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#84cc16', 5: '#10b981' };

export default function CSATAnalytics({ brandId, dateRange }) {
  const { data: allTickets = [] } = useQuery({
    queryKey: ['rep-tickets', brandId],
    queryFn: () => brandId
      ? base44.entities.Ticket.filter({ brand_id: brandId }, '-created_date', 500)
      : base44.entities.Ticket.list('-created_date', 500),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const tickets = filterByDateRange(allTickets, 'created_date', dateRange);
  const rated = tickets.filter(t => t.csat_score);
  const avgCsat = rated.length > 0 ? (rated.reduce((s, t) => s + t.csat_score, 0) / rated.length).toFixed(1) : null;
  const responseRate = tickets.length > 0 ? Math.round((rated.length / tickets.length) * 100) : 0;
  const negativeReviews = rated.filter(t => t.csat_score <= 2).sort((a, b) => a.csat_score - b.csat_score);

  // Distribution
  const distribution = [1, 2, 3, 4, 5].map(star => ({
    star: `${star}★`,
    count: rated.filter(t => t.csat_score === star).length,
    fill: STAR_COLORS[star],
  }));

  // By agent
  const agents = users.filter(u => u.role === 'user' || u.role === 'agent');
  const agentCSAT = agents.map(u => {
    const agentRated = rated.filter(t => t.assigned_agent === u.email);
    return {
      name: u.full_name?.split(' ')[0] || u.email?.split('@')[0],
      csat: agentRated.length > 0 ? parseFloat((agentRated.reduce((s, t) => s + t.csat_score, 0) / agentRated.length).toFixed(1)) : null,
      count: agentRated.length,
    };
  }).filter(a => a.csat !== null);

  // By channel
  const channels = ['chat', 'email', 'whatsapp', 'facebook'];
  const channelCSAT = channels.map(ch => {
    const chRated = rated.filter(t => t.channel === ch);
    return {
      name: ch,
      csat: chRated.length > 0 ? parseFloat((chRated.reduce((s, t) => s + t.csat_score, 0) / chRated.length).toFixed(1)) : null,
      count: chRated.length,
    };
  }).filter(c => c.csat !== null);

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall CSAT</span>
          </div>
          <p className="text-5xl font-bold text-gray-900">{avgCsat || '—'}</p>
          <p className="text-sm text-gray-400 mt-1">out of 5.0 · {rated.length} responses</p>
        </div>
        <MetricCard label="Response Rate" value={`${responseRate}%`} icon={TrendingUp} color="#0891b2" bg="rgba(8,145,178,0.1)" sub={`${rated.length}/${tickets.length} responded`} />
        <MetricCard label="5-Star Reviews" value={rated.filter(t => t.csat_score === 5).length} icon={Star} color="#10b981" bg="rgba(16,185,129,0.1)" sub="Excellent ratings" />
        <MetricCard label="Negative Reviews" value={negativeReviews.length} icon={TrendingUp} color="#ef4444" bg="rgba(239,68,68,0.1)" sub="1-2 star ratings" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Distribution */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="star" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
              <Bar dataKey="count" name="Responses" radius={[4, 4, 0, 0]}>
                {distribution.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By agent */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">CSAT by Agent</h3>
          {agentCSAT.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No rated agent tickets</p>
          ) : (
            <div className="space-y-3">
              {agentCSAT.sort((a, b) => b.csat - a.csat).map(a => (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-20 truncate">{a.name}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(a.csat / 5) * 100}%`, background: a.csat >= 4 ? '#10b981' : a.csat >= 3 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-800 w-8 text-right">{a.csat}</span>
                  <span className="text-[10px] text-gray-400 w-12 text-right">({a.count})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Negative reviews */}
      {negativeReviews.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-1">Recent Negative Reviews (1-2★)</h3>
          <p className="text-xs text-gray-400 mb-4">Follow up with these customers to improve satisfaction</p>
          <div className="space-y-2">
            {negativeReviews.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < t.csat_score ? 'text-red-400 fill-red-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{t.customer_name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{t.title}</p>
                  {t.internal_notes && <p className="text-[11px] text-gray-400 italic mt-0.5">"{t.internal_notes}"</p>}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{t.channel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}