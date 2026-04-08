import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Phone, PhoneOff, TrendingUp, BarChart3, Clock, Users } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format } from 'date-fns';

export default function VoiceAnalyticsDashboard({ brandId }) {
  const { data: analytics = [] } = useQuery({
    queryKey: ['voice-analytics', brandId],
    queryFn: () => brandId ? base44.entities.VoiceAnalytics.filter({ brand_id: brandId }, '-date', 30) : [],
  });

  const { data: callLogs = [] } = useQuery({
    queryKey: ['voice-calls', brandId],
    queryFn: () => brandId ? base44.entities.VoiceCallLog.filter({ brand_id: brandId }, '-created_date', 100) : [],
  });

  // Today's metrics
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayData = analytics.find(a => a.date === today) || {};

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayData = analytics.find(a => a.date === dateStr) || {};
    return {
      day: format(d, 'EEE'),
      inbound: dayData.total_inbound_calls || 0,
      outbound: dayData.total_outbound_calls || 0
    };
  });

  // Call status breakdown
  const statusBreakdown = [
    { name: 'Completed', value: callLogs.filter(c => c.call_status === 'completed').length, color: '#10b981' },
    { name: 'Transferred', value: callLogs.filter(c => c.call_status === 'transferred').length, color: '#7c3aed' },
    { name: 'No Answer', value: callLogs.filter(c => c.call_status === 'no_answer').length, color: '#6b7280' },
    { name: 'Voicemail', value: callLogs.filter(c => c.call_status === 'voicemail').length, color: '#f59e0b' }
  ];

  // AI vs human
  const aiResolution = callLogs.filter(c => c.ai_resolution).length;
  const totalCalls = callLogs.length;
  const aiRate = totalCalls > 0 ? Math.round((aiResolution / totalCalls) * 100) : 0;

  const stats = [
    { label: 'Inbound Today', value: todayData.total_inbound_calls || 0, icon: Phone, color: '#14b8a6' },
    { label: 'Outbound Today', value: todayData.total_outbound_calls || 0, icon: PhoneOff, color: '#3b82f6' },
    { label: 'AI Resolution Rate', value: `${aiRate}%`, icon: TrendingUp, color: '#7c3aed' },
    { label: 'Avg Call Duration', value: todayData.avg_call_duration_seconds ? `${Math.floor(todayData.avg_call_duration_seconds / 60)}m` : 'N/A', icon: Clock, color: '#f59e0b' },
  ];

  return (
    <div className="p-8 max-w-7xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Voice Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Inbound, outbound, and workflow performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Call Volume */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Call Volume (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="inbound" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Inbound" />
              <Bar dataKey="outbound" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Outbound" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Call Status */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Call Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI vs Human */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">AI Resolution Performance</h3>
          <p className="text-sm text-gray-600 mt-1">Calls resolved without human intervention</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-purple-600">{aiRate}%</p>
          <p className="text-xs text-gray-500 mt-1">{aiResolution} of {totalCalls} calls</p>
        </div>
      </div>

      {/* Top Intents */}
      {todayData.top_intents && todayData.top_intents.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Top Call Intents (Today)</h3>
          <div className="space-y-2">
            {todayData.top_intents.slice(0, 5).map((intent, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{intent.name}</span>
                <span className="text-sm font-bold text-gray-900">{intent.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}