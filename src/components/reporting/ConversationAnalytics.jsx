import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Clock, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { subDays, format, startOfDay, getHours, getDay } from 'date-fns';
import { filterByDateRange } from './DateRangeFilter';
import MetricCard from './MetricCard';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const CHANNEL_COLORS = { chat: '#7c3aed', email: '#0891b2', whatsapp: '#10b981', facebook: '#3b82f6', sms: '#f59e0b', other: '#6b7280' };

export default function ConversationAnalytics({ brandId, dateRange }) {
  const { data: allConvos = [] } = useQuery({
    queryKey: ['rep-convos', brandId],
    queryFn: () => brandId
      ? base44.entities.Conversation.filter({ brand_id: brandId }, '-created_date', 1000)
      : base44.entities.Conversation.list('-created_date', 1000),
  });

  const convos = filterByDateRange(allConvos, 'created_date', dateRange);
  const prevConvos = allConvos.filter(c => {
    const d = c.created_date ? new Date(c.created_date) : null;
    const start = subDays(new Date(), parseInt(dateRange) * 2);
    const end = subDays(new Date(), parseInt(dateRange));
    return d && d >= start && d <= end;
  });

  const change = prevConvos.length > 0 ? Math.round(((convos.length - prevConvos.length) / prevConvos.length) * 100) : 0;
  const aiHandled = convos.filter(c => c.mode === 'ai').length;
  const resolved = convos.filter(c => c.status === 'resolved').length;
  const resRate = convos.length > 0 ? Math.round((resolved / convos.length) * 100) : 0;

  // Daily trend
  const days = parseInt(dateRange);
  const dailyData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = subDays(new Date(), Math.min(days, 30) - 1 - i);
    const dayStr = format(d, 'MMM d');
    const count = convos.filter(c => c.created_date && format(new Date(c.created_date), 'MMM d') === dayStr).length;
    return { day: format(d, days <= 7 ? 'EEE' : 'MMM d'), count };
  });

  // Channel breakdown
  const channelMap = convos.reduce((acc, c) => {
    const ch = (c.channel || 'chat').toLowerCase();
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});
  const channelData = Object.entries(channelMap).map(([name, value]) => ({ name, value }));

  // Heatmap
  const heatmap = {};
  convos.forEach(c => {
    if (!c.created_date) return;
    const d = new Date(c.created_date);
    const key = `${getDay(d)}-${getHours(d)}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  });
  const maxHeat = Math.max(...Object.values(heatmap), 1);

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Conversations" value={convos.length} change={change} icon={MessageSquare} color="#7c3aed" bg="rgba(124,58,237,0.1)" sub={`vs prev ${dateRange}d`} />
        <MetricCard label="AI Handled" value={`${convos.length > 0 ? Math.round((aiHandled / convos.length) * 100) : 0}%`} icon={TrendingUp} color="#0891b2" bg="rgba(8,145,178,0.1)" sub={`${aiHandled} conversations`} />
        <MetricCard label="Resolution Rate" value={`${resRate}%`} icon={TrendingUp} color="#10b981" bg="rgba(16,185,129,0.1)" sub={`${resolved} resolved`} />
        <MetricCard label="Avg Response" value="< 1s" icon={Clock} color="#f59e0b" bg="rgba(245,158,11,0.1)" sub="AI-powered" />
      </div>

      {/* Line chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-800">Daily Conversation Volume</h3>
          <div className={`flex items-center gap-1 text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change >= 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            {Math.abs(change)}% vs previous period
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Conversations" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Channel breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Channel Breakdown</h3>
          {channelData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data for this period</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {channelData.map((entry, i) => (
                      <Cell key={i} fill={CHANNEL_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {channelData.map(c => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHANNEL_COLORS[c.name] || '#6b7280' }} />
                      <span className="text-xs text-gray-600 capitalize">{c.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Peak hours heatmap */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Peak Hours Heatmap</h3>
          <div className="overflow-x-auto">
            <div className="flex gap-1 mb-1">
              <div className="w-8 shrink-0" />
              {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
                <div key={h} className="flex-1 text-[10px] text-gray-400 text-center">{h}h</div>
              ))}
            </div>
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center gap-1 mb-0.5">
                <div className="w-8 text-[10px] text-gray-400 shrink-0">{day}</div>
                {Array.from({ length: 24 }, (_, h) => {
                  const val = heatmap[`${dayIdx}-${h}`] || 0;
                  const intensity = val / maxHeat;
                  return (
                    <div key={h} className="flex-1 h-5 rounded-sm"
                      style={{ background: intensity > 0 ? `rgba(124,58,237,${Math.max(0.1, intensity)})` : '#f3f4f6' }}
                      title={`${day} ${h}:00 — ${val} conversations`} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}