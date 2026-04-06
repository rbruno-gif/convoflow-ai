import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, AlertTriangle, ShoppingBag, Bot, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

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

export default function Dashboard() {
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_time', 50),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 50),
  });

  const active = conversations.filter(c => c.status === 'active').length;
  const flagged = conversations.filter(c => c.status === 'flagged' || c.status === 'human_requested').length;
  const aiHandled = conversations.filter(c => c.mode === 'ai').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const recent = [...conversations].sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)).slice(0, 6);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your AI chat agent performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={MessageSquare} label="Active Chats" value={active} sub="Right now" color="bg-blue-100 text-blue-600" />
        <StatCard icon={AlertTriangle} label="Need Attention" value={flagged} sub="Flagged + human req." color="bg-orange-100 text-orange-600" />
        <StatCard icon={Bot} label="AI Handled" value={aiHandled} sub="Total conversations" color="bg-purple-100 text-purple-600" />
        <StatCard icon={ShoppingBag} label="Pending Orders" value={pendingOrders} sub="Awaiting confirmation" color="bg-green-100 text-green-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Conversations</CardTitle>
              <Link to="/conversations" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {recent.map(c => (
                  <Link key={c.id} to={`/conversations?id=${c.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {c.customer_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.customer_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={c.status} />
                        {c.last_message_time && (
                          <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.last_message_time), { addSuffix: true })}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
              <Link to="/orders" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 6).map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.items?.length || 0} item(s) · ${o.total_amount || 0}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: 'bg-blue-100 text-blue-700',
    flagged: 'bg-orange-100 text-orange-700',
    human_requested: 'bg-red-100 text-red-700',
    resolved: 'bg-green-100 text-green-700',
    waiting: 'bg-yellow-100 text-yellow-700',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-muted text-muted-foreground'}`}>{status?.replace('_', ' ')}</span>;
}

function OrderStatusBadge({ status }) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-muted text-muted-foreground'}`}>{status}</span>;
}