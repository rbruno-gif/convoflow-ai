import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Clock, Users, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, RefreshCw, Bell, Layers } from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

const LANE_COLORS = { vip: '#f59e0b', standard: '#7c3aed', low: '#6b7280' };
const LANE_LABELS = { vip: '⭐ VIP', standard: 'Standard', low: 'Low Priority' };

export default function QueueDashboard({ brandId }) {
  const { brands } = useBrand();
  const qc = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['queue-entries', brandId],
    queryFn: () => brandId
      ? base44.entities.QueueEntry.filter({ brand_id: brandId }, 'position', 200)
      : base44.entities.QueueEntry.list('position', 200),
    refetchInterval: 5000,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', brandId],
    queryFn: () => brandId
      ? base44.entities.Department.filter({ brand_id: brandId })
      : base44.entities.Department.list(),
  });

  const { data: capacities = [] } = useQuery({
    queryKey: ['capacities', brandId],
    queryFn: () => brandId
      ? base44.entities.AgentCapacity.filter({ brand_id: brandId })
      : base44.entities.AgentCapacity.list(),
    refetchInterval: 10000,
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['queue-settings', brandId],
    queryFn: () => brandId
      ? base44.entities.QueueSettings.filter({ brand_id: brandId })
      : base44.entities.QueueSettings.list(),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['convos-queue', brandId],
    queryFn: () => brandId
      ? base44.entities.Conversation.filter({ brand_id: brandId, status: 'waiting' }, '-created_date', 200)
      : base44.entities.Conversation.filter({ status: 'waiting' }, '-created_date', 200),
    refetchInterval: 5000,
  });

  const waiting = entries.filter(e => e.status === 'waiting');
  const abandoned = entries.filter(e => e.status === 'abandoned');
  const overflow = entries.filter(e => e.status === 'overflow');
  const available = capacities.filter(c => c.availability === 'available');
  const atCap = capacities.filter(c => c.availability === 'busy');
  const offline = capacities.filter(c => c.availability === 'away');

  const longestWait = waiting.reduce((max, e) => {
    const mins = e.entered_at ? differenceInMinutes(new Date(), new Date(e.entered_at)) : 0;
    return Math.max(max, mins);
  }, 0);

  const globalSettings = settings[0];
  const maxQ = globalSettings?.max_queue_size || 20;
  const queuePct = maxQ > 0 ? (waiting.length / maxQ) * 100 : 0;
  const queueColor = queuePct >= 100 ? '#ef4444' : queuePct >= 75 ? '#f59e0b' : '#10b981';
  const queueLabel = queuePct >= 100 ? 'FULL' : queuePct >= 75 ? 'Filling Up' : 'Healthy';

  const moveEntry = async (entry, direction) => {
    const newPos = entry.position + direction;
    if (newPos < 1) return;
    await base44.entities.QueueEntry.update(entry.id, { position: newPos });
    qc.invalidateQueries({ queryKey: ['queue-entries', brandId] });
  };

  const assignEntry = async (entry) => {
    const bestAgent = capacities
      .filter(c => c.availability === 'available')
      .sort((a, b) => (a.current_conversations || 0) - (b.current_conversations || 0))[0];
    if (!bestAgent) return;
    await base44.entities.QueueEntry.update(entry.id, {
      status: 'assigned',
      assigned_agent_email: bestAgent.agent_email,
      assigned_at: new Date().toISOString(),
    });
    await base44.entities.Conversation.update(entry.conversation_id, {
      assigned_agent: bestAgent.agent_email,
      status: 'active',
    });
    qc.invalidateQueries({ queryKey: ['queue-entries', brandId] });
  };

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || 'General';

  return (
    <div className="p-6 max-w-7xl">
      {/* Status banner */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl mb-6 border"
        style={{ background: `${queueColor}10`, borderColor: `${queueColor}40` }}>
        <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: queueColor }} />
        <span className="font-semibold text-sm" style={{ color: queueColor }}>Queue Status: {queueLabel}</span>
        <span className="text-sm text-gray-500 ml-2">{waiting.length} / {maxQ} slots used</span>
        <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, queuePct)}%`, background: queueColor }} />
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['queue-entries', brandId] })}
          className="p-1.5 hover:bg-white/50 rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'In Queue', value: waiting.length, color: '#7c3aed', icon: Users },
          { label: 'Longest Wait', value: `${longestWait}m`, color: longestWait > 10 ? '#ef4444' : '#10b981', icon: Clock },
          { label: 'Available Agents', value: available.length, color: '#10b981', icon: CheckCircle },
          { label: 'At Capacity', value: atCap.length, color: '#f59e0b', icon: AlertTriangle },
          { label: 'Abandoned Today', value: abandoned.length, color: '#ef4444', icon: AlertTriangle },
          { label: 'Overflow Events', value: overflow.length, color: '#6b7280', icon: RefreshCw },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-department queues */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {departments.map(dept => {
          const deptWaiting = waiting.filter(e => e.department_id === dept.id);
          const deptSettings = settings.find(s => s.department_id === dept.id) || settings.find(s => !s.department_id);
          const deptMax = deptSettings?.max_queue_size || 20;
          const deptPct = deptMax > 0 ? (deptWaiting.length / deptMax) * 100 : 0;
          const deptColor = deptPct >= 100 ? '#ef4444' : deptPct >= 75 ? '#f59e0b' : '#10b981';

          return (
            <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: dept.color || '#7c3aed' }} />
                <span className="font-semibold text-sm text-gray-800">{dept.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{deptWaiting.length}/{deptMax} in queue</span>
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, deptPct)}%`, background: deptColor }} />
                </div>
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {deptWaiting.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No conversations in queue</p>
                ) : (
                  deptWaiting.sort((a, b) => a.position - b.position).map(entry => {
                    const waitMins = entry.entered_at ? differenceInMinutes(new Date(), new Date(entry.entered_at)) : 0;
                    const isLong = waitMins > (deptSettings?.max_wait_minutes || 10);
                    return (
                      <div key={entry.id} className={cn('flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50', isLong && 'bg-red-50/50')}>
                        <span className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 text-white"
                          style={{ background: LANE_COLORS[entry.priority_lane] || '#7c3aed' }}>
                          {entry.position}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{entry.customer_name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{LANE_LABELS[entry.priority_lane]}</span>
                            <span className={cn('text-[10px] font-medium flex items-center gap-0.5', isLong ? 'text-red-500' : 'text-gray-400')}>
                              <Clock className="w-2.5 h-2.5" />{waitMins}m
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => moveEntry(entry, -1)} className="p-1 hover:bg-gray-100 rounded">
                            <ArrowUp className="w-3 h-3 text-gray-400" />
                          </button>
                          <button onClick={() => moveEntry(entry, 1)} className="p-1 hover:bg-gray-100 rounded">
                            <ArrowDown className="w-3 h-3 text-gray-400" />
                          </button>
                          <button onClick={() => assignEntry(entry)}
                            className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white ml-1"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                            Assign
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        {departments.length === 0 && (
          <div className="col-span-2 text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No departments configured yet</p>
            <p className="text-xs mt-1">Go to Departments to set up your team structure</p>
          </div>
        )}
      </div>

      {/* Global queue (no department) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-800">Unrouted Queue (No Department)</h3>
          <span className="text-xs text-gray-400">{waiting.filter(e => !e.department_id).length} conversations</span>
        </div>
        <div className="divide-y divide-gray-50">
          {waiting.filter(e => !e.department_id).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">All conversations are routed to a department</p>
          ) : (
            waiting.filter(e => !e.department_id).map(entry => {
              const waitMins = entry.entered_at ? differenceInMinutes(new Date(), new Date(entry.entered_at)) : 0;
              return (
                <div key={entry.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                  <span className="text-sm font-bold text-violet-600 w-8">#{entry.position}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{entry.customer_name}</p>
                    <p className="text-xs text-gray-400">{waitMins}m waiting · {entry.priority_lane} priority</p>
                  </div>
                  <button onClick={() => assignEntry(entry)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    Assign Now
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}