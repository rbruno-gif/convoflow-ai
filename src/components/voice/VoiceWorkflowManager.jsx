import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, CheckCircle, ToggleRight, ToggleLeft, Zap } from 'lucide-react';

const WORKFLOW_TEMPLATES = [
  { type: 'inbound_receptionist', label: '24/7 Inbound AI Receptionist', description: 'Answer all calls instantly with AI' },
  { type: 'smart_ivr', label: 'Smart IVR – Natural Language Routing', description: 'Route by spoken intent, not button presses' },
  { type: 'outbound_sales', label: 'Outbound Sales Dialer & Lead Qualification', description: 'Auto-call and qualify leads' },
  { type: 'payment_reminder', label: 'Payment Reminder & Collections', description: 'Call overdue invoices' },
  { type: 'outage_alert', label: 'Service Outage & Emergency Alerts', description: 'Bulk alert customers during outages' },
  { type: 'appointment_reminder', label: 'Appointment Reminder & Confirmation', description: 'Auto-remind before appointments' },
  { type: 'churn_prevention', label: 'Churn Prevention Calls', description: 'Offer retention when customer cancels' },
  { type: 'upsell_calls', label: 'Plan Upgrade & Upsell Calls', description: 'Proactive upgrade offers' },
  { type: 'csat_follow_up', label: 'Post-Resolution CSAT Calls', description: 'Follow up after support resolution' },
  { type: 'white_label', label: 'White Label Voice Reselling', description: 'Resell voice services to clients' }
];

export default function VoiceWorkflowManager({ brandId }) {
  const qc = useQueryClient();
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: workflows = [] } = useQuery({
    queryKey: ['voice-workflows', brandId],
    queryFn: () => brandId ? base44.entities.VoiceWorkflow.filter({ brand_id: brandId }) : [],
  });

  const handleToggle = async (workflow) => {
    await base44.entities.VoiceWorkflow.update(workflow.id, { is_enabled: !workflow.is_enabled });
    qc.invalidateQueries({ queryKey: ['voice-workflows', brandId] });
  };

  const handleDelete = async (workflowId) => {
    if (confirm('Delete this workflow?')) {
      await base44.entities.VoiceWorkflow.delete(workflowId);
      qc.invalidateQueries({ queryKey: ['voice-workflows', brandId] });
    }
  };

  const availableWorkflows = WORKFLOW_TEMPLATES.filter(
    template => !workflows.some(w => w.workflow_type === template.type)
  );

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voice Workflows</h2>
          <p className="text-sm text-gray-500 mt-1">Configure all 10 AI voice use cases</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingWorkflow(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
        >
          <Plus className="w-4 h-4" /> Add Workflow
        </button>
      </div>

      {/* Enabled Workflows */}
      {workflows.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Active Workflows</h3>
          {workflows.map(workflow => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              template={WORKFLOW_TEMPLATES.find(t => t.type === workflow.workflow_type)}
              onToggle={() => handleToggle(workflow)}
              onEdit={() => { setEditingWorkflow(workflow); setShowForm(true); }}
              onDelete={() => handleDelete(workflow.id)}
            />
          ))}
        </div>
      )}

      {/* Available Workflows */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Available Workflows</h3>
        <div className="grid gap-3">
          {availableWorkflows.map(template => (
            <button
              key={template.type}
              onClick={() => {
                setEditingWorkflow({ workflow_type: template.type, name: template.label });
                setShowForm(true);
              }}
              className="text-left bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-100 shrink-0 mt-0.5">
                <Zap className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{template.label}</p>
                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
              </div>
              <Plus className="w-5 h-5 text-teal-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <WorkflowFormModal
          workflow={editingWorkflow}
          brandId={brandId}
          onClose={() => { setShowForm(false); setEditingWorkflow(null); }}
          onCreate={() => {
            qc.invalidateQueries({ queryKey: ['voice-workflows', brandId] });
            setShowForm(false);
            setEditingWorkflow(null);
          }}
        />
      )}
    </div>
  );
}

function WorkflowCard({ workflow, template, onToggle, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
            workflow.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {workflow.is_enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{template?.description}</p>
        {workflow.performance_metrics && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div><p className="text-gray-500">Calls</p><p className="font-bold text-gray-900">{workflow.performance_metrics.call_count || 0}</p></div>
            <div><p className="text-gray-500">Success</p><p className="font-bold text-gray-900">{workflow.performance_metrics.success_rate || 0}%</p></div>
            <div><p className="text-gray-500">Avg Duration</p><p className="font-bold text-gray-900">{workflow.performance_metrics.avg_duration || 0}s</p></div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-lg">
          {workflow.is_enabled ? (
            <ToggleRight className="w-5 h-5 text-teal-500" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-gray-300" />
          )}
        </button>
        <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg">
          <Edit2 className="w-4 h-4 text-gray-400" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

function WorkflowFormModal({ workflow, brandId, onClose, onCreate }) {
  const [form, setForm] = useState(workflow || { workflow_type: '', name: '', is_enabled: true, configuration: {} });
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  const save = async () => {
    const payload = { ...form, brand_id: brandId };
    if (workflow?.id) {
      await base44.entities.VoiceWorkflow.update(workflow.id, payload);
    } else {
      await base44.entities.VoiceWorkflow.create(payload);
    }
    qc.invalidateQueries({ queryKey: ['voice-workflows', brandId] });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); onCreate(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{workflow ? 'Edit' : 'Create'} Workflow</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Workflow Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="e.g. Inbound Support Calls"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">AI Instructions</label>
            <textarea
              value={form.ai_instructions || ''}
              onChange={e => setForm(f => ({ ...f, ai_instructions: e.target.value }))}
              rows={4}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              placeholder="Special instructions for this workflow..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Fallback Action</label>
            <select
              value={form.fallback_action || 'transfer_to_agent'}
              onChange={e => setForm(f => ({ ...f, fallback_action: e.target.value }))}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="transfer_to_agent">Transfer to Agent</option>
              <option value="schedule_callback">Schedule Callback</option>
              <option value="voicemail">Voicemail</option>
              <option value="hang_up">Hang Up</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}