import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Users, Clock, AlertTriangle } from 'lucide-react';

export default function QueueDashboard() {
  const { activeBrandId, activeBrand } = useBrand();

  // Get unassigned conversations for queue
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['queue-conversations', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ 
          brand_id: activeBrandId,
          status: 'open',
          assigned_agent_id: null,
        }, 'created_date', 100)
      : [],
    enabled: !!activeBrandId,
    refetchInterval: 5000, // Poll for real-time queue updates
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Department.filter({ brand_id: activeBrandId })
      : [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Agent.filter({ brand_id: activeBrandId })
      : [],
  });

  // Calculate stats per department
  const deptStats = departments.map(dept => {
    const deptConvs = conversations.filter(c => c.department_id === dept.id);
    const queued = deptConvs.filter(c => c.queue_position !== null);
    const deptAgents = agents.filter(a => a.department_ids?.includes(dept.id));
    const availableAgents = deptAgents.filter(a => a.status === 'available');

    const longestWait = queued.length
      ? Math.max(...queued.map(c => c.wait_time_seconds || 0))
      : 0;

    const queueHealth = queued.length > 20 ? 'critical' : queued.length > 15 ? 'warning' : 'healthy';

    return {
      dept,
      queued: queued.length,
      longestWait,
      agentsOnline: availableAgents.length,
      totalAgents: deptAgents.length,
      queueHealth,
    };
  });

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Live Queue Dashboard</h1>
        <p className="text-muted-foreground">Real-time queue monitoring by department</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptStats.map(stat => (
          <div
            key={stat.dept.id}
            className={`bg-card border rounded-lg p-5 ${
              stat.queueHealth === 'critical'
                ? 'border-red-500'
                : stat.queueHealth === 'warning'
                  ? 'border-amber-500'
                  : 'border-green-500'
            }`}
          >
            <h3 className="font-bold mb-3">{stat.dept.name}</h3>

            <div className="space-y-3">
              {/* Queue Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">In Queue</span>
                <span
                  className={`text-2xl font-bold ${
                    stat.queueHealth === 'critical'
                      ? 'text-red-500'
                      : stat.queueHealth === 'warning'
                        ? 'text-amber-500'
                        : 'text-green-500'
                  }`}
                >
                  {stat.queued}
                </span>
              </div>

              {/* Longest Wait */}
              {stat.longestWait > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">
                    Longest wait: {Math.floor(stat.longestWait / 60)}m
                  </span>
                </div>
              )}

              {/* Agents Status */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  {stat.agentsOnline}/{stat.totalAgents} agents available
                </span>
              </div>

              {/* Health Indicator */}
              {stat.queueHealth === 'critical' && (
                <div className="flex items-center gap-2 bg-red-50 p-2 rounded">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-700">Queue at capacity</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}