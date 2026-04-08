import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Zap, Play, Pause, Archive, Edit2, Copy, Users, BarChart2, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const TRIGGER_LABELS = {
  keyword: '💬 Keyword', subscribe: '👋 Subscribe', button_click: '🖱️ Button Click',
  tag_added: '🏷️ Tag Added', field_updated: '📝 Field Updated', schedule: '⏰ Schedule',
  webhook: '🔗 Webhook', page_visit: '🌐 Page Visit', comment: '💭 Comment',
};

const STATUS_COLORS = { active: '#10b981', paused: '#f59e0b', draft: '#6b7280', archived: '#ef4444' };

const TEMPLATES = [
  { id: 'welcome', name: '👋 Welcome New Customer', desc: 'Onboard new subscribers with a warm greeting flow', trigger: 'subscribe' },
  { id: 'upgrade', name: '⬆️ Plan Upgrade Offer', desc: 'Upsell existing customers to higher plans', trigger: 'keyword' },
  { id: 'payment', name: '💳 Payment Reminder', desc: 'Remind customers of upcoming payments', trigger: 'schedule' },
  { id: 'outage', name: '🔧 Service Outage', desc: 'Proactively notify customers of service issues', trigger: 'webhook' },
  { id: 'retention', name: '🛡️ Cancellation Retention', desc: 'Win back customers trying to cancel', trigger: 'keyword' },
  { id: 'referral', name: '🎁 Referral Program', desc: 'Incentivize customers to refer friends', trigger: 'button_click' },
  { id: 'survey', name: '⭐ Satisfaction Survey', desc: 'Collect CSAT feedback automatically', trigger: 'subscribe' },
  { id: 'reengagement', name: '🔄 Re-engagement', desc: 'Win back inactive subscribers', trigger: 'schedule' },
];

export default function FlowList({ brandId, onEdit }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: flows = [] } = useQuery({
    queryKey: ['flows', brandId],
    queryFn: () => brandId ? base44.entities.Flow.filter({ brand_id: brandId }, '-created_date', 200) : base44.entities.Flow.list('-created_date', 200),
  });

  const filtered = flows.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  const createFlow = async (template = null) => {
    const payload = {
      brand_id: brandId,
      name: template ? template.name : 'New Flow',
      status: 'draft',
      trigger_type: template?.trigger || 'keyword',
      nodes: template ? getTemplateNodes(template.id) : [
        { id: 'start', type: 'trigger', x: 100, y: 100, data: { label: 'Trigger', trigger_type: 'keyword', keyword: '' } },
        { id: 'msg1', type: 'message', x: 100, y: 220, data: { label: 'Message', content: 'Hello {first_name}! Welcome.' } },
      ],
      edges: template ? [] : [{ id: 'e1', source: 'start', target: 'msg1' }],
    };
    const created = await base44.entities.Flow.create(payload);
    qc.invalidateQueries({ queryKey: ['flows', brandId] });
    onEdit(created);
    setShowTemplates(false);
  };

  const toggleStatus = async (flow) => {
    const next = flow.status === 'active' ? 'paused' : 'active';
    await base44.entities.Flow.update(flow.id, { status: next });
    qc.invalidateQueries({ queryKey: ['flows', brandId] });
  };

  const duplicate = async (flow) => {
    await base44.entities.Flow.create({ ...flow, id: undefined, name: `${flow.name} (Copy)`, status: 'draft', total_entered: 0, total_completed: 0 });
    qc.invalidateQueries({ queryKey: ['flows', brandId] });
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col" style={{ minHeight: 0 }}>
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => setShowTemplates(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
            <Plus className="w-4 h-4" /> New Flow
          </button>
        </div>
        <div className="p-3 border-b border-gray-100">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search flows…"
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.map(flow => (
            <button key={flow.id} onClick={() => onEdit(flow)}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors group">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[flow.status] || '#6b7280' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{flow.name}</p>
                <p className="text-[10px] text-gray-400">{TRIGGER_LABELS[flow.trigger_type] || flow.trigger_type}</p>
              </div>
              <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Zap className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No flows yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-900">Conversation Flows</h2>
              <p className="text-xs text-gray-400 mt-0.5">{flows.length} flows · {flows.filter(f => f.status === 'active').length} active</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Active Flows', value: flows.filter(f => f.status === 'active').length, color: '#10b981' },
              { label: 'Total Subscribers Reached', value: flows.reduce((s, f) => s + (f.total_entered || 0), 0), color: '#7c3aed' },
              { label: 'Avg Completion Rate', value: (() => { const entered = flows.reduce((s, f) => s + (f.total_entered || 0), 0); const completed = flows.reduce((s, f) => s + (f.total_completed || 0), 0); return entered > 0 ? `${Math.round((completed / entered) * 100)}%` : '—'; })(), color: '#3b82f6' },
              { label: 'Total Conversions', value: flows.reduce((s, f) => s + (f.conversion_count || 0), 0), color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Flow cards */}
          <div className="grid gap-3">
            {filtered.map(flow => (
              <div key={flow.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${STATUS_COLORS[flow.status] || '#6b7280'}15` }}>
                  <Zap className="w-5 h-5" style={{ color: STATUS_COLORS[flow.status] || '#6b7280' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900">{flow.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: `${STATUS_COLORS[flow.status] || '#6b7280'}15`, color: STATUS_COLORS[flow.status] || '#6b7280' }}>
                      {flow.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{TRIGGER_LABELS[flow.trigger_type]}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{flow.total_entered || 0} entered</span>
                    <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />{flow.total_entered > 0 ? Math.round((flow.total_completed / flow.total_entered) * 100) : 0}% completed</span>
                    {flow.created_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(flow.created_date), { addSuffix: true })}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleStatus(flow)}
                    className={cn('p-2 rounded-lg transition-colors', flow.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50')}>
                    {flow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => duplicate(flow)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEdit(flow)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    <Edit2 className="w-3.5 h-3.5" /> Edit Flow
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && !search && (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <Zap className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-gray-500 mb-1">No flows yet</p>
                <p className="text-sm text-gray-400 mb-4">Build your first automated conversation flow</p>
                <button onClick={() => setShowTemplates(true)}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                  + Create from Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template picker modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Choose a Starting Point</h2>
                <p className="text-xs text-gray-400">Start from a template or blank canvas</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <button onClick={() => createFlow(null)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-violet-300 hover:border-violet-500 hover:bg-violet-50 transition-all mb-4">
                <Plus className="w-8 h-8 text-violet-400" />
                <div className="text-left">
                  <p className="font-semibold text-violet-700">Blank Canvas</p>
                  <p className="text-xs text-gray-400">Start from scratch with a fresh flow</p>
                </div>
              </button>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Templates</p>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => createFlow(t)}
                    className="text-left p-4 rounded-xl border border-gray-200 hover:border-violet-400 hover:bg-violet-50 transition-all">
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{t.desc}</p>
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{TRIGGER_LABELS[t.trigger]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTemplateNodes(templateId) {
  const templates = {
    welcome: [
      { id: 'start', type: 'trigger', x: 200, y: 50, data: { label: 'Subscribe Trigger', trigger_type: 'subscribe' } },
      { id: 'msg1', type: 'message', x: 200, y: 170, data: { label: 'Welcome Message', content: 'Welcome to {brand_name}, {first_name}! 🎉 We\'re thrilled to have you.' } },
      { id: 'delay1', type: 'delay', x: 200, y: 290, data: { label: 'Wait 1 Day', delay_value: 1, delay_unit: 'days' } },
      { id: 'msg2', type: 'message', x: 200, y: 410, data: { label: 'Tips Message', content: 'Here are some tips to get the most from your {brand_name} plan...' } },
    ],
    retention: [
      { id: 'start', type: 'trigger', x: 200, y: 50, data: { label: 'Keyword: cancel', trigger_type: 'keyword', keyword: 'cancel' } },
      { id: 'msg1', type: 'message', x: 200, y: 170, data: { label: 'Retention Offer', content: 'We\'d hate to see you go! Before you cancel, can we offer you a special discount?' } },
      { id: 'qr1', type: 'quick_reply', x: 200, y: 290, data: { label: 'Options', buttons: ['Yes, show me!', 'No, cancel anyway'] } },
    ],
  };
  return templates[templateId] || templates.welcome;
}