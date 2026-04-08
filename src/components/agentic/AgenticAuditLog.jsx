import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, CheckCircle, XCircle, Clock, Bot, Filter } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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

const STATUS_CONFIG = {
  success: { label: 'Success', color: 'text-green-700 bg-green-100', icon: CheckCircle },
  failed: { label: 'Failed', color: 'text-red-700 bg-red-100', icon: XCircle },
  pending_approval: { label: 'Pending Approval', color: 'text-amber-700 bg-amber-100', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-700 bg-green-100', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-700 bg-red-100', icon: XCircle },
  skipped: { label: 'Skipped', color: 'text-gray-600 bg-gray-100', icon: Clock },
};

export default function AgenticAuditLog({ brandId }) {
  const [stepFilter, setStepFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: actions = [] } = useQuery({
    queryKey: ['agentic-actions', brandId],
    queryFn: () => brandId
      ? base44.entities.AgenticAction.filter({ brand_id: brandId }, '-created_date', 300)
      : base44.entities.AgenticAction.list('-created_date', 300),
  });

  const filtered = actions.filter(a => {
    const matchStep = stepFilter === 'all' || a.step === stepFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchSearch = !search ||
      a.agent_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.tool_used?.toLowerCase().includes(search.toLowerCase()) ||
      a.input_data?.toLowerCase().includes(search.toLowerCase()) ||
      a.output_result?.toLowerCase().includes(search.toLowerCase());
    return matchStep && matchStatus && matchSearch;
  });

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Agentic Audit Log</h2>
          <p className="text-xs text-gray-400">{filtered.length} of {actions.length} actions · Full trail of every AI decision</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search agent, tool, input..."
          className="text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 w-52" />
        <select value={stepFilter} onChange={e => setStepFilter(e.target.value)}
          className="text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
          <option value="all">All Steps</option>
          {['understand', 'plan', 'execute', 'verify', 'respond', 'log'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Agent</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Step</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Tool Used</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Input</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Output</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>No audit records found</p>
                  </td>
                </tr>
              ) : filtered.map(action => {
                const statusConf = STATUS_CONFIG[action.status] || STATUS_CONFIG.success;
                const StatusIcon = statusConf.icon;
                return (
                  <tr key={action.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                      {action.created_date
                        ? format(new Date(action.created_date), 'MMM d, HH:mm:ss')
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Bot className="w-3 h-3 text-violet-400 shrink-0" />
                        <span className="font-medium text-gray-700 truncate max-w-28">{action.agent_name || '—'}</span>
                        {action.shadow_mode && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">shadow</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-white font-medium text-[10px]"
                        style={{ background: STEP_COLORS[action.step] || '#6b7280' }}>
                        {action.step}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {action.tool_used ? (
                        <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium text-[10px]">
                          {TOOL_LABELS[action.tool_used] || action.tool_used}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 max-w-40">
                      <p className="truncate text-gray-600" title={action.input_data}>{action.input_data || '—'}</p>
                    </td>
                    <td className="py-3 px-4 max-w-48">
                      <p className="truncate text-gray-600" title={action.output_result}>{action.output_result || '—'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[10px] w-fit', statusConf.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {action.autonomous
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">Autonomous</span>
                        : <span className="text-[10px]">{action.approved_by || '—'}</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}