import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, Plus, Trash2, Edit2, CheckCircle, Shield, Wrench, Eye, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const ALL_TOOLS = [
  { key: 'knowledge_lookup', label: 'Knowledge Base Lookup', desc: 'Search FAQs and knowledge base' },
  { key: 'customer_profile', label: 'Customer Profile Lookup', desc: 'Fetch account details and history' },
  { key: 'ticket_creator', label: 'Ticket Creator', desc: 'Autonomously create support tickets' },
  { key: 'ticket_updater', label: 'Ticket Updater', desc: 'Update status, priority, or notes on tickets' },
  { key: 'auto_escalation', label: 'Auto Escalation', desc: 'Escalate to human when needed' },
  { key: 'callback_scheduler', label: 'Callback Scheduler', desc: 'Book callback appointments autonomously' },
  { key: 'faq_gap_reporter', label: 'FAQ Gap Reporter', desc: 'Log unanswerable questions for admin review' },
  { key: 'sentiment_monitor', label: 'Sentiment Monitor', desc: 'Monitor tone and notify supervisor if frustrated' },
  { key: 'proactive_followup', label: 'Proactive Follow-Up', desc: 'Follow up after ticket resolution' },
  { key: 'agent_assistant', label: 'Internal Agent Assistant', desc: 'Draft replies and summaries for human agents' },
];

const DEFAULT_FORM = {
  name: '',
  role: 'customer_facing',
  personality_tone: 'professional',
  confidence_threshold: 70,
  mode: 'shadow',
  is_active: true,
  enabled_tools: ['knowledge_lookup', 'auto_escalation', 'sentiment_monitor'],
  guardrails: ['Never process refunds over $100 without approval', 'Never share account passwords'],
  approval_gates: ['refund_request', 'account_deletion', 'payment_change'],
};

export default function AgentConfigurator({ brandId }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [newGuardrail, setNewGuardrail] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: agents = [] } = useQuery({
    queryKey: ['agentic-agents', brandId],
    queryFn: () => brandId
      ? base44.entities.AgenticAgent.filter({ brand_id: brandId })
      : base44.entities.AgenticAgent.list(),
  });

  const openNew = () => {
    setEditing('new');
    setForm({ ...DEFAULT_FORM, brand_id: brandId });
  };

  const openEdit = (agent) => {
    setEditing(agent.id);
    setForm({
      name: agent.name || '',
      role: agent.role || 'customer_facing',
      personality_tone: agent.personality_tone || 'professional',
      confidence_threshold: agent.confidence_threshold ?? 70,
      mode: agent.mode || 'shadow',
      is_active: agent.is_active !== false,
      enabled_tools: agent.enabled_tools || [],
      guardrails: agent.guardrails || [],
      approval_gates: agent.approval_gates || [],
    });
  };

  const save = async () => {
    try {
      const payload = { ...form, brand_id: brandId };
      if (editing === 'new') await base44.entities.AgenticAgent.create(payload);
      else await base44.entities.AgenticAgent.update(editing, payload);
      qc.invalidateQueries({ queryKey: ['agentic-agents', brandId] });
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditing(null); }, 1200);
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to save agent', variant: 'destructive' });
    }
  };

  const deleteAgent = async (id) => {
    try {
      await base44.entities.AgenticAgent.delete(id);
      qc.invalidateQueries({ queryKey: ['agentic-agents', brandId] });
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to delete agent', variant: 'destructive' });
    }
  };

  const toggleMode = async (agent) => {
    try {
      const newMode = agent.mode === 'live' ? 'shadow' : 'live';
      await base44.entities.AgenticAgent.update(agent.id, { mode: newMode, brand_id: brandId });
      qc.invalidateQueries({ queryKey: ['agentic-agents', brandId] });
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to toggle agent mode', variant: 'destructive' });
    }
  };

  const toggleTool = (key) => {
    setForm(f => ({
      ...f,
      enabled_tools: f.enabled_tools.includes(key)
        ? f.enabled_tools.filter(t => t !== key)
        : [...f.enabled_tools, key],
    }));
  };

  const addGuardrail = () => {
    if (!newGuardrail.trim()) return;
    setForm(f => ({ ...f, guardrails: [...f.guardrails, newGuardrail.trim()] }));
    setNewGuardrail('');
  };

  if (editing) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
          <h2 className="font-bold text-gray-900">{editing === 'new' ? 'New Agentic AI' : 'Edit Agentic AI'}</h2>
        </div>

        <div className="space-y-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Agent Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Max – U2C Mobile Assistant"
                className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                <option value="customer_facing">Customer-Facing</option>
                <option value="internal_assistant">Internal Agent Assistant</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Personality Tone</label>
              <select value={form.personality_tone} onChange={e => setForm(f => ({ ...f, personality_tone: e.target.value }))}
                className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Confidence Threshold (%)</label>
              <input type="number" min={0} max={100} value={form.confidence_threshold}
                onChange={e => setForm(f => ({ ...f, confidence_threshold: Number(e.target.value) }))}
                className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              <p className="text-[10px] text-gray-400 mt-1">Below this % → hands off to human automatically</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {form.mode === 'shadow' ? '👁 Shadow Mode' : '⚡ Live Mode'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {form.mode === 'shadow' ? 'AI proposes actions silently — managers review before going live' : 'AI executes autonomously within guardrails'}
              </p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, mode: f.mode === 'shadow' ? 'live' : 'shadow' }))}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all',
                form.mode === 'live' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700')}>
              {form.mode === 'live' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {form.mode === 'live' ? 'Live' : 'Shadow'}
            </button>
          </div>

          {/* Tools */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-violet-500" /> Enabled Tools
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_TOOLS.map(tool => (
                <button key={tool.key} onClick={() => toggleTool(tool.key)}
                  className={cn('text-left p-3 rounded-xl border text-xs transition-all',
                    form.enabled_tools.includes(tool.key)
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-gray-100 hover:border-gray-200 bg-white')}>
                  <p className={cn('font-semibold', form.enabled_tools.includes(tool.key) ? 'text-violet-700' : 'text-gray-700')}>
                    {form.enabled_tools.includes(tool.key) ? '✓ ' : ''}{tool.label}
                  </p>
                  <p className="text-gray-400 mt-0.5 text-[10px]">{tool.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Guardrails */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-red-500" /> Guardrails (Hard Limits)
            </p>
            <div className="space-y-1.5 mb-3">
              {form.guardrails.map((g, i) => (
                <div key={i} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <span className="text-xs text-red-700 flex-1">{g}</span>
                  <button onClick={() => setForm(f => ({ ...f, guardrails: f.guardrails.filter((_, idx) => idx !== i) }))}
                    className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newGuardrail} onChange={e => setNewGuardrail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGuardrail()}
                placeholder="Add a guardrail rule..."
                className="flex-1 text-xs rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300" />
              <button onClick={addGuardrail} className="px-3 py-2 text-xs rounded-lg bg-red-50 text-red-700 border border-red-100 font-medium hover:bg-red-100">Add</button>
            </div>
          </div>

          <button onClick={save}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Agent'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-gray-900">Agentic AI Agents</h2>
          <p className="text-xs text-gray-400 mt-0.5">{agents.length} agent{agents.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Plus className="w-3.5 h-3.5" /> New Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-sm">No agentic AI agents yet</p>
          <p className="text-xs mt-1">Create your first agent to enable autonomous AI actions</p>
          <button onClick={openNew} className="mt-4 px-5 py-2 rounded-xl text-white text-xs font-semibold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            Create First Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900">{agent.name}</p>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      agent.mode === 'live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                      {agent.mode === 'live' ? '⚡ Live' : '👁 Shadow'}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      {agent.role === 'customer_facing' ? 'Customer-Facing' : 'Internal Assistant'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Tone: {agent.personality_tone} · Confidence threshold: {agent.confidence_threshold ?? 70}% · {agent.enabled_tools?.length || 0} tools enabled
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(agent.enabled_tools || []).map(t => {
                      const tool = ALL_TOOLS.find(x => x.key === t);
                      return (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium">
                          {tool?.label || t}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleMode(agent)}
                    className="px-3 py-1.5 text-[11px] rounded-lg border font-medium transition-all hover:bg-gray-50"
                    title={agent.mode === 'shadow' ? 'Switch to Live' : 'Switch to Shadow'}>
                    {agent.mode === 'shadow' ? '→ Go Live' : '→ Shadow'}
                  </button>
                  <button onClick={() => openEdit(agent)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => deleteAgent(agent.id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}