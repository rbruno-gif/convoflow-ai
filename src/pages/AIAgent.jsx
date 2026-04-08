import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Bot, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AgenticActionLog from '@/components/agentic/AgenticActionLog';
import ShadowModePanel from '@/components/agentic/ShadowModePanel';

export default function AIAgent() {
  const [editingAgent, setEditingAgent] = useState(null);
  const [form, setForm] = useState({
    name: '',
    role: 'customer_facing',
    personality_tone: 'professional',
    confidence_threshold: 70,
    mode: 'shadow',
    enabled_tools: [],
  });
  const { activeBrandId } = useBrand();
  const qc = useQueryClient();

  const { data: agents = [] } = useQuery({
    queryKey: ['ai-agents', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.AIAgent.filter({ brand_id: activeBrandId })
      : [],
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['agentic-actions', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.AgenticAction.filter({ brand_id: activeBrandId }, '-created_date', 100)
      : [],
    refetchInterval: 5000,
  });

  const primaryAgent = agents[0];

  const saveAgent = async () => {
    if (!form.name.trim()) return;

    const payload = {
      ...form,
      brand_id: activeBrandId,
    };

    if (editingAgent?.id) {
      await base44.entities.AIAgent.update(editingAgent.id, payload);
    } else {
      await base44.entities.AIAgent.create(payload);
    }

    qc.invalidateQueries({ queryKey: ['ai-agents', activeBrandId] });
    setEditingAgent(null);
    setForm({
      name: '',
      role: 'customer_facing',
      personality_tone: 'professional',
      confidence_threshold: 70,
      mode: 'shadow',
      enabled_tools: [],
    });
  };

  const shadowActions = actions.filter(a => a.status === 'proposed');
  const executedActions = actions.filter(a => a.status === 'executed' || a.status === 'approved');

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6" />
          Agentic AI
        </h1>
        <p className="text-muted-foreground">Configure AI agents and monitor autonomous actions</p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="shadow">Shadow Mode ({shadowActions.length})</TabsTrigger>
          <TabsTrigger value="actions">Action Log ({executedActions.length})</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          {primaryAgent ? (
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">{primaryAgent.name}</h2>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    primaryAgent.mode === 'live'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {primaryAgent.mode.toUpperCase()} MODE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Role</label>
                  <Select value={primaryAgent.role} onValueChange={v => {/* update */}}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_facing">Customer Facing</SelectItem>
                      <SelectItem value="internal_assistant">Internal Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Tone</label>
                  <Select value={primaryAgent.personality_tone} onValueChange={v => {/* update */}}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Confidence Threshold (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={primaryAgent.confidence_threshold}
                    onChange={e => {/* update */}}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Mode</label>
                  <Select value={primaryAgent.mode} onValueChange={v => {/* update */}}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shadow">Shadow (Proposed)</SelectItem>
                      <SelectItem value="live">Live (Autonomous)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Enabled Tools */}
              <div>
                <label className="text-sm font-medium mb-2 block">Enabled Tools</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'kb_lookup',
                    'customer_profile_lookup',
                    'ticket_creator',
                    'ticket_updater',
                    'auto_escalation',
                    'faq_gap_reporter',
                    'sentiment_monitor',
                    'internal_agent_assistant',
                  ].map(tool => (
                    <label key={tool} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={primaryAgent.enabled_tools?.includes(tool) || false}
                        onChange={e => {/* update */}}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{tool.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Shadow Mode Info */}
              {primaryAgent.mode === 'shadow' && (
                <div className="bg-amber-50 border border-amber-200 rounded p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-1">🟡 Shadow Mode Active</p>
                  <p className="text-xs text-amber-800">
                    AI proposes actions without executing them. Review in Shadow Mode tab.
                    ({primaryAgent.shadow_mode_review_count} reviewed)
                  </p>
                </div>
              )}

              {primaryAgent.mode === 'shadow' &&
                primaryAgent.shadow_mode_review_count >= 50 &&
                primaryAgent.shadow_mode_correct_rate >= 85 && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {/* switch to live */}}
                  >
                    ✅ Enable Live Mode
                  </Button>
                )}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border text-muted-foreground">
              <p>No AI agent configured. Create one to get started.</p>
            </div>
          )}
        </TabsContent>

        {/* Shadow Mode Tab */}
        <TabsContent value="shadow">
          {shadowActions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border text-muted-foreground">
              <p>No proposed actions awaiting review</p>
            </div>
          ) : (
            <ShadowModePanel actions={shadowActions} />
          )}
        </TabsContent>

        {/* Action Log Tab */}
        <TabsContent value="actions">
          <AgenticActionLog actions={executedActions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}