import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TRIGGERS = [
  'new_conversation_started',
  'ticket_created',
  'keyword_detected',
  'customer_idle',
  'sla_warning',
  'sla_breached',
  'agent_status_changed',
  'conversation_resolved',
  'tag_added',
];

const ACTIONS = [
  'send_message',
  'assign_to_agent',
  'assign_to_department',
  'add_tag',
  'remove_tag',
  'set_priority',
  'create_ticket',
  'send_internal_note',
  'send_email_notification',
  'escalate_to_supervisor',
  'trigger_autocalls_outbound',
  'wait',
];

export default function WorkflowBuilder({ workflow, brandId, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
    trigger_type: 'new_conversation_started',
    trigger_config: {},
    steps: [],
    ...workflow,
  });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const handleAddStep = () => {
    setForm(f => ({
      ...f,
      steps: [
        ...(f.steps || []),
        {
          step_id: `step_${Date.now()}`,
          action_type: 'send_message',
          action_config: {},
          order: (f.steps?.length || 0) + 1,
        },
      ],
    }));
  };

  const handleDeleteStep = (stepId) => {
    setForm(f => ({
      ...f,
      steps: f.steps.filter(s => s.step_id !== stepId),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      const payload = {
        ...form,
        brand_id: brandId,
      };

      if (workflow?.id) {
        await base44.entities.Workflow.update(workflow.id, payload);
      } else {
        await base44.entities.Workflow.create(payload);
      }

      onSave();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {workflow?.id ? 'Edit Workflow' : 'Create Workflow'}
        </h1>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Workflow Name *</label>
            <Input
              placeholder="e.g., Welcome new customers"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              placeholder="What does this workflow do?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>
        </div>

        {/* Trigger */}
        <div className="border-t pt-6">
          <h2 className="font-semibold mb-3">Trigger</h2>
          <Select value={form.trigger_type} onValueChange={v => setForm(f => ({ ...f, trigger_type: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIGGERS.map(t => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Steps */}
        <div className="border-t pt-6">
          <h2 className="font-semibold mb-3">Actions</h2>

          {form.steps?.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-3">No actions yet</p>
          ) : (
            <div className="space-y-3 mb-3">
              {form.steps.map((step, idx) => (
                <div key={step.step_id} className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Step {idx + 1}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStep(step.step_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Select
                    value={step.action_type}
                    onValueChange={v => {
                      const newSteps = [...form.steps];
                      newSteps[idx].action_type = v;
                      setForm(f => ({ ...f, steps: newSteps }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIONS.map(a => (
                        <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {step.action_type === 'send_message' && (
                    <Textarea
                      placeholder="Message to send..."
                      rows={2}
                      onChange={e => {
                        const newSteps = [...form.steps];
                        newSteps[idx].action_config.message = e.target.value;
                        setForm(f => ({ ...f, steps: newSteps }));
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleAddStep}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Action
          </Button>
        </div>

        {/* Save */}
        <div className="border-t pt-6 flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.name.trim() || saving || form.steps?.length === 0}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Workflow'}
          </Button>
        </div>
      </div>
    </div>
  );
}