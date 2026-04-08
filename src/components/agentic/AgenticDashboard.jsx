import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, Zap, CheckCircle, AlertTriangle, Clock, TrendingUp, Users, Activity, ThumbsUp, ThumbsDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const TOOL_LABELS = {
  knowledge_lookup: 'KB Lookup',
  customer_profile: 'Profile Lookup',
  ticket_creator: 'Ticket Creator',
  ticket_updater: 'Ticket Updater',
  auto_escalation: 'Auto Escalation',
  callback_scheduler: 'Callback Scheduler',
  faq_gap_reporter: 'FAQ Gap Reporter',
  sentiment_monitor: 'Sentiment Monitor',
  proactive_followup: 'Proactive Follow-Up',
  agent_assistant: 'Agent Assistant',
};

const STEP_COLORS = {
  understand: '#6366f1',
  plan: '#8b5cf6',
  execute: '#f59e0b',
  verify: '#3b82f6',
  respond: '#10b981',
  log: '#6b7280',
};

export default function AgenticDashboard({ brandId }) {
  const qc = useQueryClient();

  const { data: actions = [] } = useQuery({
    queryKey: ['agentic-actions', brandId],
    queryFn: () => brandId
      ? base44.entities.AgenticAction.filter({ brand_id: brandId }, '-created_date', 200)
      : base44.entities.AgenticAction.list('-created_date', 200),
    refetchInterval: 10000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agentic-agents', brandId],
    queryFn: () => brandId
      ? base44.entities.AgenticAgent.filter({ brand_id: brandId })
      : base44.entities.AgenticAgent.list(),
  });

  // Stats
  const today = new Date().toDateString();
  const todayActions = actions.filter(a => new Date(a.created_date).toDateString() === today);
  const pendingApprovals = actions.filter(a => a.status === 'pending_approval');
  const autonomousCount = todayActions.filter(a => a.autonomous && a.status === 'success').length;
  const handoffCount = todayActions.filter(a => a.tool_used === 'auto_escalation').length;
  const resolvedSessions = new Set(todayActions.filter(a => a.step === 'respond' && a.status === 'success').map(a => a.session_id)).size;
  const totalSessions = new Set(todayActions.map(a => a.session_id)).size;
  const containmentRate = totalSessions > 0 ? Math.round((resolvedSessions / totalSessions) * 100) : 0;

  // Tool usage frequency
  const toolCounts = todayActions.reduce((acc, a) => {
    if (a.tool_used) acc[a.tool_used] = (acc[a.tool_used] || 0) + 1;
    return acc;
  }, {});
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Steps per session
  const sessionSteps = {};
  todayActions.forEach(a => {
    if (!sessionSteps[a.session_id]) sessionSteps[a.session_id] = 0;
    sessionSteps[a.session_id]++;
  });
  const avgSteps = Object.values(sessionSteps).length > 0
    ? (Object.values(sessionSteps).reduce((s, v) => s + v, 0) / Object.values(sessionSteps).length).toFixed(1)
    : '0';

  const handleApprove = async (action, approved) => {
    await base44.entities.AgenticAction.update(action.id, {
      status: approved ? 'approved' : 'rejected',
      autonomous: false,
    });
    qc.invalidateQueries({ queryKey: ['agentic-actions', brandId] });
  };

  // Live feed — most recent unique sessions
  const liveSessions = {};
  actions.slice(0, 50).forEach(a => {
    if (!liveSessions[a.session_id]) liveSessions[a.session_id] = [];
    liveSessions[a.session_id].push(a);
  });
  const recentSessions = Object.entries(liveSessions).slice(0, 8);

  const stats = [
    { label: 'Autonomous Today', value: autonomousCount, icon: Zap, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { label: 'Containment Rate', value: `${containmentRate}%`, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Avg Steps/Resolution', value: avgSteps, icon: Activity, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Pending Approvals', value: pendingApprovals.length, icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Handoff Count', value: handoffCount, icon: Users, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Active Agents', value: agents.filter(a => a.is_active).length, icon: Bot, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  ];

  return (
    <div className="p-6 max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending Approvals — highlighted banner */}
      {pendingApprovals.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="font-semibold text-amber-800 text-sm">{pendingApprovals.length} Action{pendingApprovals.length > 1 ? 's' : ''} Awaiting Approval</p>
          </div>
          <div className="space-y-2">
            {pendingApprovals.map(action => (
              <div key={action.id} className="bg-white rounded-xl border border-amber-200 p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-amber-700">{action.agent_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{TOOL_LABELS[action.tool_used] || action.tool_used}</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium mb-0.5">{action.input_data}</p>
                  <p className="text-[11px] text-gray-400">{action.output_result}</p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    {action.created_date ? formatDistanceToNow(new Date(action.created_date), { addSuffix: true }) : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApprove(action, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => handleApprove(action, false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors">
                    <ThumbsDown className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Live feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="font-semibold text-sm text-gray-900">Live Agentic Sessions</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {recentSessions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No agentic sessions yet</p>
              </div>
            ) : recentSessions.map(([sessionId, sessionActions]) => {
              const latest = sessionActions[0];
              const allSteps = [...new Set(sessionActions.map(a => a.step))];
              const hasApprovalPending = sessionActions.some(a => a.status === 'pending_approval');
              return (
                <div key={sessionId} className="px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-700">{latest?.agent_name || 'Agent'}</span>
                    {hasApprovalPending && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Awaiting Approval</span>
                    )}
                    <span className="ml-auto text-[10px] text-gray-400">
                      {latest?.created_date ? formatDistanceToNow(new Date(latest.created_date), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  {/* Step trace */}
                  <div className="flex items-center gap-1 flex-wrap mb-1.5">
                    {allSteps.map((step, i) => (
                      <span key={step} className="flex items-center gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ background: STEP_COLORS[step] || '#6b7280' }}>
                          {step}
                        </span>
                        {i < allSteps.length - 1 && <span className="text-gray-300 text-xs">→</span>}
                      </span>
                    ))}
                  </div>
                  {/* Tool chips */}
                  <div className="flex gap-1 flex-wrap">
                    {sessionActions.filter(a => a.tool_used).slice(0, 4).map((a, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium">
                        🔧 {TOOL_LABELS[a.tool_used] || a.tool_used}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top tools + agents */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-semibold text-sm text-gray-900 mb-4">Top Tools Used Today</p>
            {topTools.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No tool usage today</p>
            ) : topTools.map(([tool, count]) => (
              <div key={tool} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{TOOL_LABELS[tool] || tool}</span>
                  <span className="font-semibold text-gray-800">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (count / Math.max(...Object.values(toolCounts))) * 100)}%`, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-semibold text-sm text-gray-900 mb-3">Agent Status</p>
            {agents.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No agents configured</p>
            ) : agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{agent.name}</p>
                  <p className="text-[10px] text-gray-400">{agent.enabled_tools?.length || 0} tools</p>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold',
                  agent.mode === 'live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                  {agent.mode === 'live' ? '⚡ Live' : '👁 Shadow'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}