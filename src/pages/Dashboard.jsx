import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import GroupDashboard from '@/pages/GroupDashboard';
import { MessageSquare, AlertTriangle, Bot, Users, Ticket, Zap, ArrowRight, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, subDays, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { activeBrandId, activeBrand } = useBrand();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-last_message_time', 100)
      : base44.entities.Conversation.list('-last_message_time', 100),
    refetchInterval: 30000,
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Ticket.filter({ brand_id: activeBrandId }, '-created_date', 50)
      : base44.entities.Ticket.list('-created_date', 50),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ['leads', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Lead.filter({ brand_id: activeBrandId }, '-created_date', 50)
      : base44.entities.Lead.list('-created_date', 50),
  });
  const { data: voiceCalls = [] } = useQuery({
    queryKey: ['voice-calls', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.VoiceCall.filter({ brand_id: activeBrandId }, '-created_date', 20)
      : base44.entities.VoiceCall.list('-created_date', 20),
  });

  const active = conversations.filter(c => c.status === 'active').length;
  const flagged = conversations.filter(c => c.status === 'flagged' || c.status === 'human_requested').length;
  const aiHandled = conversations.filter(c => c.mode === 'ai').length;
  const aiRate = conversations.length > 0 ? Math.round((aiHandled / conversations.length) * 100) : 0;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const inboundCalls = voiceCalls.filter(c => c.direction === 'inbound').length;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const startOfDay = d.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay).setHours(23, 59, 59, 999);
    
    const convCount = conversations.filter(c => {
      const cDate = new Date(c.created_date).getTime();
      return cDate >= startOfDay && cDate <= endOfDay;
    }).length;
    
    const callCount = voiceCalls.filter(c => {
      const cDate = new Date(c.created_date).getTime();
      return cDate >= startOfDay && cDate <= endOfDay;
    }).length;
    
    return { day: format(d, 'EEE'), chats: convCount, calls: callCount };
  });

  const stats = [
    { icon: MessageSquare, label: 'Active Chats', value: active, sub: 'Right now', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { icon: Bot, label: 'AI Resolution', value: `${aiRate}%`, sub: 'Handled by AI', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { icon: AlertTriangle, label: 'Need Attention', value: flagged, sub: 'Flagged + human req.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: Ticket, label: 'Open Tickets', value: openTickets, sub: 'Awaiting resolution', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { icon: Users, label: 'New Leads', value: newLeads, sub: 'Uncontacted', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: Phone, label: 'Inbound Calls', value: inboundCalls, sub: 'Voice today', color: '#14b8a6', bg: 'rgba(20,184,184,0.1)' },
  ];

  const recent = conversations.slice(0, 5);

  // If the active brand is U2C Group, show the group-level hub
  if (activeBrand?.slug === 'u2c-group') {
    return <GroupDashboard />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{activeBrand?.name || 'ConvoFlow'} · Overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-sm mb-4">Chat & Voice Volume (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="chats" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Chats" />
              <Bar dataKey="calls" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Calls" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent Conversations</h2>
            <Link to="/conversations" className="text-xs text-violet-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
          ) : (
            <div className="space-y-3">
              {recent.map(c => (
                <Link key={c.id} to={`/conversations?id=${c.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                      {c.customer_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.customer_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{c.last_message || 'No messages'}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{
                      background: c.status === 'active' ? '#10b981' : c.status === 'flagged' ? '#f59e0b' : '#6b7280'
                    }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}