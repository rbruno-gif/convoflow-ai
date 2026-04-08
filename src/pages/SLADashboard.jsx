import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Clock, AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SLADashboard() {
  const { activeBrandId } = useBrand();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId })
      : [],
    refetchInterval: 5000,
  });

  const { data: slaRules = [] } = useQuery({
    queryKey: ['sla-rules', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.SLARule.filter({ brand_id: activeBrandId })
      : [],
  });

  // Conversations with SLA warnings/breaches
  const slaIssues = conversations.filter(
    c => c.sla_first_response_breached || c.sla_resolution_breached
  );

  const slaWarnings = conversations.filter(c => {
    if (c.status === 'resolved') return false;
    const now = new Date();
    if (c.sla_first_response_due_at && !c.first_response_at) {
      const timeUntilBreach =
        (new Date(c.sla_first_response_due_at) - now) / 1000 / 60;
      return timeUntilBreach < 20; // Under 20% time remaining
    }
    return false;
  });

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">SLA Management</h1>
        <p className="text-muted-foreground">Monitor SLA compliance and breach alerts</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Open Convos</p>
          <p className="text-2xl font-bold">
            {conversations.filter(c => c.status !== 'resolved').length}
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">SLA Healthy</p>
          <p className="text-2xl font-bold text-green-500">
            {conversations.filter(
              c =>
                c.status !== 'resolved' &&
                !c.sla_first_response_breached &&
                !c.sla_resolution_breached
            ).length}
          </p>
        </div>

        <div className="bg-card border border-amber-500 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">SLA Warning</p>
          <p className="text-2xl font-bold text-amber-500">{slaWarnings.length}</p>
        </div>

        <div className="bg-card border border-red-500 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">SLA Breached</p>
          <p className="text-2xl font-bold text-red-500">{slaIssues.length}</p>
        </div>
      </div>

      {/* Breached Conversations */}
      {slaIssues.length > 0 && (
        <div className="bg-card border border-red-500 rounded-lg p-6 mb-6">
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            SLA Breached ({slaIssues.length})
          </h2>

          <div className="space-y-3">
            {slaIssues.map(conv => (
              <div key={conv.id} className="flex items-start justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                <div>
                  <p className="font-medium text-sm">{conv.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {conv.sla_first_response_breached && 'First Response SLA Breached'}
                    {conv.sla_resolution_breached && ' · Resolution SLA Breached'}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLA Rules */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="font-bold mb-4">Active SLA Rules</h2>

        {slaRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No SLA rules configured</p>
        ) : (
          <div className="space-y-3">
            {slaRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{rule.sla_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rule.priority_level} · {rule.first_response_minutes}m first response · {rule.resolution_minutes}m resolution
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    rule.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {rule.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}