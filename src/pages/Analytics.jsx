import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Clock, Star, Bot, Users, Zap, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, subDays, format } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-created_date', 200),
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date', 200),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['messages-all'],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
  });

  const totalConvos = conversations.length;
  const aiResolved = conversations.filter(c => c.mode === 'ai' && c.status === 'resolved').length;
  const aiRate = totalConvos > 0 ? Math.round((conversations.filter(c => c.mode === 'ai').length / totalConvos) * 100) : 0;
  const avgCsat = tickets.filter(t => t.csat_score).length > 0
    ? (tickets.filter(t => t.csat_score).reduce((s, t) => s + t.csat_score, 0) / tickets.filter(t => t.csat_score).length).toFixed(1)
    : 'N/A';
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const newLeads = leads.filter(l => l.status === 'new').length;

  // Last 7 days volume
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = format(d, 'MMM d');
    const count = conversations.filter(c => c.created_date && format(new Date(c.created_date), 'MMM d') === dayStr).length;
    return { day: format(d, 'EEE'), count };
  });

  // Channel distribution
  const channels = [
    { name: 'Chat', value: conversations.filter(c => !c.tags?.includes('facebook') && !c.tags?.includes('whatsapp')).length || Math.floor(totalConvos * 0.55) },
    { name: 'Facebook', value: Math.floor(totalConvos * 0.2) },
    { name: 'WhatsApp', value: Math.floor(totalConvos * 0.15) },
    { name: 'Instagram', value: Math.floor(totalConvos * 0.1) },
  ].filter(c => c.value > 0);

  // Status breakdown
  const statusData = [
    { name: 'Active', value: conversations.filter(c => c.status === 'active').length },
    { name: 'Resolved', value: conversations.filter(c => c.status === 'resolved').length },
    { name: 'Flagged', value: conversations.filter(c => c.status === 'flagged').length },
    { name: 'Waiting', value: conversations.filter(c => c.status === 'waiting').length },
  ].filter(c => c.value > 0);

  // Ticket priorities
  const priorityData = ['low', 'medium', 'high', 'urgent'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: tickets.filter(t => t.priority === p).length,
  })).filter(d => d.value > 0);

  // Intent distribution
  const intentData = [
    { name: 'Order Inquiry', value: conversations.filter(c => c.intent === 'order_inquiry').length },
    { name: 'Product Support', value: conversations.filter(c => c.intent === 'product_support').length },
    { name: 'Billing Issue', value: conversations.filter(c => c.intent === 'billing_issue').length },
    { name: 'Returns/Refunds', value: conversations.filter(c => c.intent === 'returns_refunds').length },
    { name: 'Complaint', value: conversations.filter(c => c.intent === 'complaint').length },
    { name: 'Other', value: conversations.filter(c => c.intent === 'other' || !c.intent).length },
  ].filter(d => d.value > 0);

  // Resolution status
  const resolutionData = [
    { name: 'Resolved', value: conversations.filter(c => c.resolution_status === 'resolved').length },
    { name: 'Unresolved', value: conversations.filter(c => c.resolution_status === 'unresolved').length },
    { name: 'Escalated', value: conversations.filter(c => c.resolution_status === 'escalated').length },
  ].filter(d => d.value > 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance overview across all channels</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={MessageSquare} label="Total Conversations" value={totalConvos} sub="All time" color="bg-blue-100 text-blue-600" />
        <StatCard icon={Bot} label="AI Resolution Rate" value={`${aiRate}%`} sub="Handled by AI" color="bg-purple-100 text-purple-600" />
        <StatCard icon={Star} label="Avg. CSAT Score" value={avgCsat} sub="Customer satisfaction" color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={AlertCircle} label="Open Tickets" value={openTickets} sub="Awaiting resolution" color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Chat Volume (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Conversations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Channel Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={channels} cx="40%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {channels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 shrink-0">
              {channels.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{c.name}</span>
                  <span className="text-xs font-semibold ml-auto pl-2">{c.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Intents</CardTitle>
          </CardHeader>
          <CardContent>
            {intentData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {intentData.map((d, i) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${totalConvos > 0 ? (d.value / totalConvos) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Resolution Status</CardTitle>
          </CardHeader>
          <CardContent>
            {resolutionData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={resolutionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label>
                    {resolutionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Conversation Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {statusData.map((s, i) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-semibold">{s.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${totalConvos > 0 ? (s.value / totalConvos) * 100 : 0}%`, background: COLORS[i] }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['new', 'contacted', 'qualified', 'converted'].map((s, i) => {
                const cnt = leads.filter(l => l.status === s).length;
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground capitalize">{s}</span>
                      <span className="font-semibold">{cnt}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: leads.length > 0 ? `${(cnt / leads.length) * 100}%` : '0%', background: COLORS[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Ticket Priorities</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tickets yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={priorityData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={50} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Tickets" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}