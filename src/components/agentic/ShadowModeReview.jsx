import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Eye, ThumbsUp, ThumbsDown, Bot, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

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

export default function ShadowModeReview({ brandId }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: actions = [] } = useQuery({
    queryKey: ['agentic-shadow-actions', brandId],
    queryFn: () => brandId
      ? base44.entities.AgenticAction.filter({ brand_id: brandId, shadow_mode: true }, '-created_date', 100)
      : base44.entities.AgenticAction.filter({ shadow_mode: true }, '-created_date', 100),
    refetchInterval: 15000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agentic-agents', brandId],
    queryFn: () => brandId
      ? base44.entities.AgenticAgent.filter({ brand_id: brandId })
      : base44.entities.AgenticAgent.list(),
  });

  const shadowAgents = agents.filter(a => a.mode === 'shadow');

  const pending = actions.filter(a => a.shadow_verdict === 'pending');
  const correct = actions.filter(a => a.shadow_verdict === 'correct').length;
  const incorrect = actions.filter(a => a.shadow_verdict === 'incorrect').length;
  const total = actions.filter(a => a.shadow_verdict !== 'pending').length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const markVerdict = async (actionId, verdict) => {
    try {
      await base44.entities.AgenticAction.update(actionId, { shadow_verdict: verdict, brand_id: brandId });
      qc.invalidateQueries({ queryKey: ['agentic-shadow-actions', brandId] });
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to update verdict', variant: 'destructive' });
    }
  };

  const goLive = async (agent) => {
    try {
      await base44.entities.AgenticAgent.update(agent.id, { mode: 'live', brand_id: brandId });
      qc.invalidateQueries({ queryKey: ['agentic-agents', brandId] });
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to switch to live mode', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100">
          <Eye className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Shadow Mode Review</h2>
          <p className="text-xs text-gray-400">Review proposed AI actions before going live — train the agent by marking correct/incorrect</p>
        </div>
      </div>

      {/* Shadow agents */}
      {shadowAgents.length > 0 && (
        <div className="mb-6 space-y-3">
          {shadowAgents.map(agent => (
            <div key={agent.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
              <Bot className="w-8 h-8 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  👁 Shadow Mode · Accuracy: {accuracy}% ({correct} correct, {incorrect} incorrect of {total} reviewed)
                </p>
              </div>
              <div className="shrink-0 text-right">
                {accuracy >= 80 ? (
                  <button onClick={() => goLive(agent)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Switch to Live
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="text-xs text-amber-600 font-medium">{accuracy}% accuracy</div>
                    <div className="text-[10px] text-gray-400">Need 80%+ to go live</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-violet-600">{pending.length}</p>
          <p className="text-xs text-gray-400 mt-1">Pending Review</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{correct}</p>
          <p className="text-xs text-gray-400 mt-1">Marked Correct</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold" style={{ color: accuracy >= 80 ? '#10b981' : '#f59e0b' }}>{accuracy}%</p>
          <p className="text-xs text-gray-400 mt-1">Accuracy Rate</p>
        </div>
      </div>

      {/* Accuracy progress */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex justify-between text-xs mb-2">
          <span className="font-medium text-gray-700">Shadow Mode Accuracy</span>
          <span className="font-bold" style={{ color: accuracy >= 80 ? '#10b981' : '#f59e0b' }}>{accuracy}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${accuracy}%`, background: accuracy >= 80 ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #7c3aed)' }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>0%</span><span className="text-amber-600">80% threshold to go live</span><span>100%</span>
        </div>
      </div>

      {/* Pending actions */}
      <h3 className="font-semibold text-sm text-gray-900 mb-3">
        Proposed Actions to Review ({pending.length})
      </h3>
      {pending.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm font-medium">No pending actions to review</p>
          <p className="text-xs mt-1">Shadow mode actions will appear here as the AI processes conversations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(action => (
            <div key={action.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-100">
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-gray-800">{action.agent_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
                      {TOOL_LABELS[action.tool_used] || action.tool_used || action.step}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {action.created_date ? formatDistanceToNow(new Date(action.created_date), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  {action.intent_classified && (
                    <p className="text-[10px] text-gray-400 mb-1">Intent: <span className="font-medium text-gray-600">{action.intent_classified}</span></p>
                  )}
                  {action.input_data && (
                    <div className="bg-gray-50 rounded-lg p-2.5 mb-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Input</p>
                      <p className="text-xs text-gray-700">{action.input_data}</p>
                    </div>
                  )}
                  {action.output_result && (
                    <div className="bg-violet-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-violet-400 uppercase tracking-wide mb-1">Proposed Action</p>
                      <p className="text-xs text-violet-800">{action.output_result}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => markVerdict(action.id, 'incorrect')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100 text-xs font-semibold hover:bg-red-100">
                  <ThumbsDown className="w-3.5 h-3.5" /> Incorrect
                </button>
                <button onClick={() => markVerdict(action.id, 'correct')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 text-xs font-semibold hover:bg-green-100">
                  <ThumbsUp className="w-3.5 h-3.5" /> Correct
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}