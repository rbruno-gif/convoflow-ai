import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/lib/TenantContext';
import { useTenantData } from '@/hooks/useTenantData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function CompanyAdminDashboard() {
  const { currentCompany, isCompanyAdmin } = useTenant();

  const { data: conversations = [] } = useTenantData('CompanyConversation', {}, {
    queryKey: ['conversations'],
  });

  const { data: leads = [] } = useTenantData('CompanyLead', {}, {
    queryKey: ['leads'],
  });

  const { data: tickets = [] } = useTenantData('CompanyTicket', {}, {
    queryKey: ['tickets'],
  });

  const { data: analytics = [] } = useTenantData('CompanyAnalytics', {}, {
    queryKey: ['analytics'],
  });

  // Calculate metrics
  const activeConversations = conversations.filter((c) => c.status === 'active').length;
  const aiResolved = analytics.reduce((sum, a) => sum + (a.ai_resolved || 0), 0);
  const escalatedConversations = conversations.filter((c) => c.status === 'human_requested').length;
  const unresolvedTickets = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length;
  const newLeads = leads.filter((l) => l.status === 'new').length;

  const recentConversations = conversations
    .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time))
    .slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{currentCompany?.name}</h1>
        <p className="text-muted-foreground mt-1">
          {currentCompany?.industry ? `Industry: ${currentCompany.industry}` : 'Dashboard Overview'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Conversations</p>
                <p className="text-2xl font-bold mt-1">{activeConversations}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">AI Resolved</p>
                <p className="text-2xl font-bold mt-1">{aiResolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Escalations</p>
                <p className="text-2xl font-bold mt-1">{escalatedConversations}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Open Tickets</p>
                <p className="text-2xl font-bold mt-1">{unresolvedTickets}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">New Leads</p>
                <p className="text-2xl font-bold mt-1">{newLeads}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Recent Conversations</h2>
          <Link to="/conversations" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        {recentConversations.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
              No conversations yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentConversations.map((conv) => (
              <Link key={conv.id} to={`/conversations?id=${conv.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold truncate">{conv.customer_name}</p>
                          <Badge variant={conv.mode === 'ai' ? 'secondary' : 'default'}>
                            {conv.mode === 'ai' ? '🤖 AI' : '👤 Human'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                      </div>
                      <div className="text-right ml-4">
                        <Badge variant={
                          conv.status === 'resolved' ? 'default' :
                          conv.status === 'flagged' ? 'destructive' :
                          'secondary'
                        }>
                          {conv.status}
                        </Badge>
                        {conv.last_message_time && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {isCompanyAdmin() && (
        <div>
          <h2 className="text-lg font-bold mb-4">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/settings">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 pb-6">
                  <p className="font-semibold">AI Settings</p>
                  <p className="text-sm text-muted-foreground mt-1">Configure chatbot behavior</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/agents">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 pb-6">
                  <p className="font-semibold">Team Management</p>
                  <p className="text-sm text-muted-foreground mt-1">Manage agents and permissions</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/knowledge">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 pb-6">
                  <p className="font-semibold">Knowledge Base</p>
                  <p className="text-sm text-muted-foreground mt-1">Manage company documentation</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}