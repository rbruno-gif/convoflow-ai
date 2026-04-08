import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Phone, PhoneIncoming, PhoneOutgoing, Users, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

export default function VoiceAnalytics({ brandId }) {
  const { data: calls = [] } = useQuery({
    queryKey: ['voice-calls', brandId],
    queryFn: () => brandId
      ? base44.entities.VoiceCall.filter({ brand_id: brandId }, '-created_date', 500)
      : base44.entities.VoiceCall.list('-created_date', 500),
  });

  // Calculate metrics
  const inbound = calls.filter(c => c.direction === 'inbound').length;
  const outbound = calls.filter(c => c.direction === 'outbound').length;
  const answered = calls.filter(c => c.status === 'completed').length;
  const answerRate = calls.length > 0 ? Math.round((answered / calls.length) * 100) : 0;
  const avgDuration = calls.length > 0
    ? Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / calls.length / 60)
    : 0;
  const aiResolved = calls.filter(c => c.resolved_by_ai).length;
  const transferred = calls.filter(c => c.transferred_to_agent).length;
  const voiceToTicket = calls.filter(c => c.ticket_id).length;
  const callbackCompletion = calls.filter(c => c.call_type === 'outbound_callback' && c.status === 'completed').length;

  // Last 7 days chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = format(d, 'MMM d');
    const count = calls.filter(c => c.created_date && format(new Date(c.created_date), 'MMM d') === dayStr).length;
    return { day: format(d, 'EEE'), count };
  });

  // Call type distribution
  const callTypes = [
    { name: 'Inbound Support', value: calls.filter(c => c.call_type === 'inbound_support').length },
    { name: 'Outbound Callback', value: calls.filter(c => c.call_type === 'outbound_callback').length },
    { name: 'Campaign', value: calls.filter(c => c.call_type === 'outbound_campaign').length },
    { name: 'Follow-up', value: calls.filter(c => c.call_type === 'outbound_followup').length },
  ].filter(x => x.value > 0);

  const COLORS = ['#14b8a6', '#0891b2', '#06b6d4', '#0ea5e9'];

  // Top reasons (from issue_summary keywords)
  const reasonCounts = {};
  calls.forEach(c => {
    if (c.issue_summary) {
      reasonCounts[c.issue_summary] = (reasonCounts[c.issue_summary] || 0) + 1;
    }
  });
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const stats = [
    { label: 'Total Inbound', value: inbound, icon: PhoneIncoming, color: '#14b8a6' },
    { label: 'Total Outbound', value: outbound, icon: PhoneOutgoing, color: '#0891b2' },
    { label: 'Answer Rate', value: `${answerRate}%`, icon: BarChart3, color: '#06b6d4' },
    { label: 'Avg Duration', value: `${avgDuration}m`, icon: Clock, color: '#0ea5e9' },
    { label: 'AI Resolved', value: aiResolved, icon: Phone, color: '#14b8a6' },
    { label: 'Transferred', value: transferred, icon: Users, color: '#0891b2' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}15` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className="text-[10px] font-medium text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Call Volume Trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm mb-4">Call Volume (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Call Type Distribution */}
        {callTypes.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-sm mb-4">Call Type Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={callTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {callTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {callTypes.map((type, i) => (
                <div key={type.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-gray-600">{type.name}</span>
                  <span className="ml-auto font-semibold text-gray-900">{type.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Reasons */}
      {topReasons.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm mb-4">Top Call Reasons</h3>
          <div className="space-y-3">
            {topReasons.map((reason, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-xs text-gray-600 truncate">{reason.name}</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(reason.value / topReasons[0].value) * 100}%`, background: '#14b8a6' }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 min-w-[30px] text-right">{reason.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs font-medium text-green-700 mb-1">Call-to-Ticket Conversion</p>
          <p className="text-2xl font-bold text-green-900">{calls.length > 0 ? Math.round((voiceToTicket / calls.length) * 100) : 0}%</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700 mb-1">AI Resolution Rate</p>
          <p className="text-2xl font-bold text-blue-900">{calls.length > 0 ? Math.round((aiResolved / inbound) * 100) : 0}%</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-medium text-purple-700 mb-1">Callback Completion</p>
          <p className="text-2xl font-bold text-purple-900">{callbackCompletion}</p>
        </div>
      </div>
    </div>
  );
}