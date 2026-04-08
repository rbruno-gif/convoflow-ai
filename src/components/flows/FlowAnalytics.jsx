import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart2, TrendingUp, Users, Zap, Target, BarChart } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#7c3aed', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function FlowAnalytics({ brandId }) {
  const { data: flows = [] } = useQuery({
    queryKey: ['flows', brandId],
    queryFn: () => brandId ? base44.entities.Flow.filter({ brand_id: brandId }) : base44.entities.Flow.list('-created_date', 100),
  });

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['broadcasts', brandId],
    queryFn: () => brandId ? base44.entities.Broadcast.filter({ brand_id: brandId }) : base44.entities.Broadcast.list('-created_date', 100),
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ['subscribers', brandId],
    queryFn: () => brandId ? base44.entities.Subscriber.filter({ brand_id: brandId }) : base44.entities.Subscriber.list(),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords', brandId],
    queryFn: () => brandId ? base44.entities.KeywordTrigger.filter({ brand_id: brandId }) : base44.entities.KeywordTrigger.list(),
  });

  const totalEntered = flows.reduce((s, f) => s + (f.total_entered || 0), 0);
  const totalCompleted = flows.reduce((s, f) => s + (f.total_completed || 0), 0);
  const totalConversions = flows.reduce((s, f) => s + (f.conversion_count || 0), 0);
  const optedIn = subscribers.filter(s => s.is_opted_in !== false).length;

  const flowBarData = flows.slice(0, 8).map(f => ({
    name: f.name.length > 16 ? f.name.slice(0, 16) + '…' : f.name,
    entered: f.total_entered || 0,
    completed: f.total_completed || 0,
  }));

  const channelData = ['chat', 'whatsapp', 'sms', 'email', 'facebook', 'instagram'].map(ch => ({
    name: ch, value: subscribers.filter(s => s.channel === ch).length,
  })).filter(d => d.value > 0);

  const broadcastPerf = broadcasts.filter(b => b.status === 'sent').slice(0, 6).map(b => ({
    name: b.name?.slice(0, 14) || 'Broadcast',
    delivered: b.delivered_count || 0,
    replied: b.replied_count || 0,
    clicked: b.clicked_count || 0,
  }));

  const topKeywords = keywords.sort((a, b) => (b.triggered_count || 0) - (a.triggered_count || 0)).slice(0, 5);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h2 className="font-bold text-gray-900">Automation Analytics</h2>
        <p className="text-xs text-gray-400">Performance across all flows, broadcasts, and subscribers</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Subscribers', value: subscribers.length, sub: `${optedIn} opted in`, color: '#7c3aed', icon: Users },
          { label: 'Flow Entries', value: totalEntered, sub: `${totalCompleted} completed`, color: '#3b82f6', icon: Zap },
          { label: 'Completion Rate', value: totalEntered > 0 ? `${Math.round((totalCompleted / totalEntered) * 100)}%` : '—', sub: 'across all flows', color: '#10b981', icon: TrendingUp },
          { label: 'Conversions', value: totalConversions, sub: 'goal completions', color: '#f59e0b', icon: Target },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Flow performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Flow Performance</h3>
          {flowBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <ReBarChart data={flowBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="entered" name="Entered" fill="#7c3aed" radius={[0, 3, 3, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[0, 3, 3, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center"><BarChart className="w-8 h-8 mx-auto mb-2 opacity-20" /><p className="text-sm">No flow data yet</p></div>
            </div>
          )}
        </div>

        {/* Subscriber channels */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Subscribers by Channel</h3>
          {channelData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {channelData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs capitalize text-gray-600 flex-1">{d.name}</span>
                    <span className="text-xs font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center"><Users className="w-8 h-8 mx-auto mb-2 opacity-20" /><p className="text-sm">No subscriber data yet</p></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Broadcast performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Broadcast Performance</h3>
          {broadcastPerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <ReBarChart data={broadcastPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                <Bar dataKey="delivered" name="Delivered" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                <Bar dataKey="replied" name="Replied" fill="#10b981" radius={[3, 3, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 text-gray-400">
              <div className="text-center"><BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-20" /><p className="text-sm">No sent broadcasts yet</p></div>
            </div>
          )}
        </div>

        {/* Top keywords */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Top Keyword Triggers</h3>
          {topKeywords.length > 0 ? (
            <div className="space-y-3">
              {topKeywords.map((kw, i) => {
                const max = topKeywords[0]?.triggered_count || 1;
                const pct = ((kw.triggered_count || 0) / max) * 100;
                return (
                  <div key={kw.id} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-400 w-4">{i + 1}</span>
                    <span className="font-mono text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded w-20 truncate">"{kw.keyword}"</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{kw.triggered_count || 0}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-44 text-gray-400">
              <div className="text-center"><Zap className="w-8 h-8 mx-auto mb-2 opacity-20" /><p className="text-sm">No keyword triggers yet</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}