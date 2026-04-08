import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Users, Star, Target, Trophy, AlertCircle, X, ChevronUp, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format } from 'date-fns';
import { filterByDateRange } from './DateRangeFilter';
import MetricCard from './MetricCard';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';

export default function AgentPerformance({ brandId, dateRange }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [targets, setTargets] = useState({});
  const [editTarget, setEditTarget] = useState(null);
  const { brands } = useBrand();
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });
  const { data: allTickets = [] } = useQuery({
    queryKey: ['rep-tickets', brandId],
    queryFn: () => brandId
      ? base44.entities.Ticket.filter({ brand_id: brandId }, '-created_date', 500)
      : base44.entities.Ticket.list('-created_date', 500),
  });
  const { data: allConvos = [] } = useQuery({
    queryKey: ['rep-convos', brandId],
    queryFn: () => brandId
      ? base44.entities.Conversation.filter({ brand_id: brandId }, '-created_date', 500)
      : base44.entities.Conversation.list('-created_date', 500),
  });

  const tickets = filterByDateRange(allTickets, 'created_date', dateRange);
  const agents = users.filter(u => u.role === 'user' || u.role === 'agent');

  const getAgentStats = (email) => {
    const agentTickets = tickets.filter(t => t.assigned_agent === email);
    const resolved = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    const escalated = agentTickets.filter(t => t.priority === 'urgent');
    const csatTickets = agentTickets.filter(t => t.csat_score);
    const avgCsat = csatTickets.length > 0
      ? (csatTickets.reduce((s, t) => s + t.csat_score, 0) / csatTickets.length).toFixed(1)
      : null;
    return {
      total: agentTickets.length,
      resolved: resolved.length,
      escalated: escalated.length,
      avgCsat,
    };
  };

  const agentData = agents.map(u => ({
    ...u,
    stats: getAgentStats(u.email),
    brand: brands.find(b => b.assigned_agents?.includes(u.email)),
  })).sort((a, b) => b.stats.resolved - a.stats.resolved);

  const topPerformer = agentData[0];

  // Agent trend (30 days)
  const getAgentTrend = (email) => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const dayStr = format(d, 'MMM d');
      const count = allTickets.filter(t =>
        t.assigned_agent === email &&
        t.resolved_at &&
        format(new Date(t.resolved_at), 'MMM d') === dayStr
      ).length;
      return { day: format(d, 'M/d'), resolved: count };
    });
  };

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Agents" value={agents.length} icon={Users} color="#7c3aed" bg="rgba(124,58,237,0.1)" sub="Active accounts" />
        <MetricCard label="Tickets Resolved" value={tickets.filter(t => t.status === 'resolved').length} icon={Target} color="#10b981" bg="rgba(16,185,129,0.1)" sub={`${dateRange}-day period`} />
        <MetricCard label="Top Performer" value={topPerformer?.full_name?.split(' ')[0] || 'N/A'} icon={Trophy} color="#f59e0b" bg="rgba(245,158,11,0.1)" sub={topPerformer ? `${topPerformer.stats.resolved} resolved` : ''} />
        <MetricCard label="Avg CSAT" value={(() => {
          const t = tickets.filter(tk => tk.csat_score);
          return t.length > 0 ? (t.reduce((s, tk) => s + tk.csat_score, 0) / t.length).toFixed(1) : 'N/A';
        })()} icon={Star} color="#0891b2" bg="rgba(8,145,178,0.1)" sub="Team average" />
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-800">Agent Leaderboard</h3>
          <span className="text-xs text-gray-400">{dateRange}-day period</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Rank', 'Agent', 'Brand', 'Resolved', 'CSAT', 'Escalations', 'Target Progress', 'Actions'].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agentData.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No agent data available</td></tr>
              ) : agentData.map((agent, i) => {
                const target = targets[agent.email] || 10;
                const progress = Math.min(100, Math.round((agent.stats.resolved / target) * 100));
                const isBelowTarget = agent.stats.resolved < target * 0.5;
                const isTop = i === 0 && agent.stats.resolved > 0;
                return (
                  <tr key={agent.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isBelowTarget ? 'bg-red-50/30' : ''}`}>
                    <td className="py-3 px-4">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${isTop ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs shrink-0">
                          {agent.full_name?.charAt(0) || agent.email?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 flex items-center gap-1">
                            {agent.full_name || agent.email}
                            {isTop && <Trophy className="w-3 h-3 text-yellow-500" />}
                            {isBelowTarget && <AlertCircle className="w-3 h-3 text-red-500" />}
                          </p>
                          <p className="text-[10px] text-gray-400">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {agent.brand ? <BrandAvatar brand={agent.brand} size={18} /> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{agent.stats.resolved}</td>
                    <td className="py-3 px-4">
                      {agent.stats.avgCsat
                        ? <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{agent.stats.avgCsat}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {agent.stats.escalated > 0
                        ? <span className="text-orange-600 font-medium">{agent.stats.escalated}</span>
                        : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, background: isBelowTarget ? '#ef4444' : progress >= 100 ? '#10b981' : '#7c3aed' }} />
                        </div>
                        <span className={`text-[10px] font-semibold shrink-0 ${isBelowTarget ? 'text-red-500' : 'text-gray-500'}`}>{progress}%</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{agent.stats.resolved}/{target} target</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => setSelectedAgent(agent)}
                          className="px-2 py-1 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-medium hover:bg-violet-100 transition-colors">
                          View
                        </button>
                        <button onClick={() => setEditTarget(agent.email === editTarget ? null : agent.email)}
                          className="px-2 py-1 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-medium hover:bg-gray-100 transition-colors">
                          Target
                        </button>
                      </div>
                      {editTarget === agent.email && (
                        <div className="flex items-center gap-1 mt-1">
                          <input type="number" defaultValue={target} min={1} max={200}
                            className="w-14 text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
                            onBlur={e => { setTargets(t => ({ ...t, [agent.email]: parseInt(e.target.value) || 10 })); setEditTarget(null); }} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent detail modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAgent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
                  {selectedAgent.full_name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedAgent.full_name || selectedAgent.email}</p>
                  <p className="text-xs text-gray-400">{selectedAgent.email} · {selectedAgent.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Resolved', value: selectedAgent.stats.resolved, color: '#10b981' },
                { label: 'CSAT', value: selectedAgent.stats.avgCsat || 'N/A', color: '#f59e0b' },
                { label: 'Escalations', value: selectedAgent.stats.escalated, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} className="text-center py-3 rounded-xl" style={{ background: `${s.color}10` }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">30-Day Resolved Trend</h4>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={getAgentTrend(selectedAgent.email)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                <Line type="monotone" dataKey="resolved" stroke="#7c3aed" strokeWidth={2} dot={false} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}