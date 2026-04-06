import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Plus, Play, Pause, Trash2, Edit2, ChevronRight, MessageSquare, Clock, Globe, ShoppingCart, Users, PhoneCall, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import FlowBuilderModal from '@/components/flows/FlowBuilderModal';

const triggerConfig = {
  new_visitor: { label: 'New Visitor', icon: Users, color: 'bg-blue-100 text-blue-600' },
  page_visit: { label: 'Page Visit', icon: Globe, color: 'bg-purple-100 text-purple-600' },
  time_on_site: { label: 'Time on Site', icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
  after_hours: { label: 'After Hours', icon: Clock, color: 'bg-slate-100 text-slate-600' },
  keyword: { label: 'Keyword Match', icon: MessageSquare, color: 'bg-green-100 text-green-600' },
  cart_abandoned: { label: 'Cart Abandoned', icon: ShoppingCart, color: 'bg-orange-100 text-orange-600' },
  referral_source: { label: 'Referral Source', icon: Star, color: 'bg-pink-100 text-pink-600' },
  manual: { label: 'Manual Trigger', icon: PhoneCall, color: 'bg-muted text-muted-foreground' },
};

const templates = [
  { name: 'Welcome Message', trigger: 'new_visitor', description: 'Greet new visitors automatically', steps: [{ type: 'message', message: 'Hi there! 👋 Welcome! How can I help you today?', delay_seconds: 2 }, { type: 'options', message: 'What brings you here?', options: ['Browse products', 'Track an order', 'Get support'] }] },
  { name: 'After Hours Reply', trigger: 'after_hours', description: 'Auto-reply when your team is offline', steps: [{ type: 'message', message: "We're currently offline but we'll get back to you soon! 🌙", delay_seconds: 1 }, { type: 'message', message: 'Leave your email and we\'ll follow up first thing tomorrow.', delay_seconds: 0 }] },
  { name: 'Abandoned Cart Recovery', trigger: 'cart_abandoned', description: 'Re-engage customers who left items in cart', steps: [{ type: 'message', message: 'Hey! You left something behind 🛒', delay_seconds: 3 }, { type: 'options', message: 'Want to complete your purchase? I can help!', options: ['Complete purchase', 'See my cart', 'Get a discount'] }] },
  { name: 'Lead Qualification', trigger: 'new_visitor', description: 'Qualify leads before connecting to sales', steps: [{ type: 'message', message: 'Hi! I can help connect you with our team.', delay_seconds: 2 }, { type: 'options', message: 'What best describes you?', options: ['Individual', 'Small business', 'Enterprise'] }] },
];

export default function Flows() {
  const [editingFlow, setEditingFlow] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: flows = [] } = useQuery({
    queryKey: ['flows'],
    queryFn: () => base44.entities.AutomationFlow.list('-created_date', 100),
  });

  const toggleActive = async (flow) => {
    await base44.entities.AutomationFlow.update(flow.id, { is_active: !flow.is_active });
    qc.invalidateQueries({ queryKey: ['flows'] });
    toast({ title: flow.is_active ? 'Flow paused' : 'Flow activated' });
  };

  const deleteFlow = async (id) => {
    await base44.entities.AutomationFlow.delete(id);
    qc.invalidateQueries({ queryKey: ['flows'] });
    toast({ title: 'Flow deleted' });
  };

  const createFromTemplate = async (tpl) => {
    await base44.entities.AutomationFlow.create({ ...tpl, is_active: true });
    qc.invalidateQueries({ queryKey: ['flows'] });
    toast({ title: `"${tpl.name}" flow created!` });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation Flows</h1>
          <p className="text-sm text-muted-foreground">Build automated chatbot workflows</p>
        </div>
        <Button onClick={() => { setEditingFlow(null); setShowBuilder(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Flow
        </Button>
      </div>

      {flows.length === 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Start Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {templates.map((tpl, i) => {
              const cfg = triggerConfig[tpl.trigger];
              const Icon = cfg?.icon || Zap;
              return (
                <Card key={i} className="border border-dashed border-border shadow-none hover:border-primary hover:shadow-sm transition-all cursor-pointer group" onClick={() => createFromTemplate(tpl)}>
                  <CardContent className="p-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${cfg?.color || 'bg-muted'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="font-semibold text-sm">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
                    <p className="text-xs text-primary mt-3 font-medium group-hover:underline">Use template →</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {flows.map(flow => {
          const cfg = triggerConfig[flow.trigger] || triggerConfig.manual;
          const Icon = cfg.icon;
          return (
            <Card key={flow.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{flow.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${flow.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {flow.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{flow.description || cfg.label + ' trigger'}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">Trigger: {cfg.label}</span>
                      {flow.trigger_value && <span className="text-[10px] text-muted-foreground">"{flow.trigger_value}"</span>}
                      <span className="text-[10px] text-muted-foreground">{flow.steps?.length || 0} steps</span>
                      {flow.stats_triggered > 0 && <span className="text-[10px] text-muted-foreground">{flow.stats_triggered} triggered</span>}
                    </div>
                  </div>

                  {/* Steps preview */}
                  <div className="hidden lg:flex items-center gap-1 shrink-0">
                    {(flow.steps || []).slice(0, 4).map((s, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground max-w-[80px] truncate">
                          {s.type === 'message' ? '💬 Msg' : s.type === 'options' ? '🔘 Options' : '⏱ Wait'}
                        </div>
                        {i < (flow.steps?.length || 0) - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    ))}
                    {(flow.steps?.length || 0) > 4 && <span className="text-xs text-muted-foreground">+{flow.steps.length - 4}</span>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={flow.is_active} onCheckedChange={() => toggleActive(flow)} />
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setEditingFlow(flow); setShowBuilder(true); }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => deleteFlow(flow.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {flows.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No flows yet. Start from a template above or create your own.</p>
          </div>
        )}
      </div>

      {showBuilder && (
        <FlowBuilderModal
          flow={editingFlow}
          onClose={() => setShowBuilder(false)}
          onSave={() => { qc.invalidateQueries({ queryKey: ['flows'] }); setShowBuilder(false); }}
        />
      )}
    </div>
  );
}