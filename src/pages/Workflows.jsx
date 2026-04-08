import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Edit2, Trash2, PlayCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WorkflowBuilder from '@/components/workflows/WorkflowBuilder';

const TEMPLATES = [
  {
    name: 'Welcome New Customer',
    description: 'Send greeting when conversation starts',
    trigger: 'new_conversation_started',
  },
  {
    name: 'SLA Breach Escalation',
    description: 'Escalate to supervisor when SLA breaches',
    trigger: 'sla_breached',
  },
  {
    name: 'Idle Customer Follow-up',
    description: 'Send follow-up after customer goes idle for 30 min',
    trigger: 'customer_idle',
  },
];

export default function Workflows() {
  const [editing, setEditing] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const { activeBrandId } = useBrand();
  const qc = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Workflow.filter({ brand_id: activeBrandId })
      : [],
  });

  const handleDelete = async (id) => {
    if (confirm('Delete this workflow?')) {
      await base44.entities.Workflow.delete(id);
      qc.invalidateQueries({ queryKey: ['workflows', activeBrandId] });
    }
  };

  if (showBuilder) {
    return (
      <WorkflowBuilder
        workflow={editing}
        brandId={activeBrandId}
        onSave={() => {
          qc.invalidateQueries({ queryKey: ['workflows', activeBrandId] });
          setShowBuilder(false);
          setEditing(null);
        }}
        onCancel={() => {
          setShowBuilder(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Workflow Automation</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setShowBuilder(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Workflow
        </Button>
      </div>

      {/* Existing Workflows */}
      {workflows.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-3">Your Workflows</h2>
          <div className="space-y-2">
            {workflows.map(workflow => (
              <div key={workflow.id} className="bg-card border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{workflow.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Trigger: {workflow.trigger_type} · {workflow.steps?.length || 0} steps
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditing(workflow); setShowBuilder(true); }}
                    className="gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(workflow.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates */}
      <h2 className="font-semibold mb-3">Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEMPLATES.map(template => (
          <div key={template.name} className="bg-card border rounded-lg p-4 space-y-3">
            <div>
              <h3 className="font-semibold">{template.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                setEditing({ trigger_type: template.trigger, steps: [] });
                setShowBuilder(true);
              }}
            >
              <Copy className="w-4 h-4" />
              Use Template
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}