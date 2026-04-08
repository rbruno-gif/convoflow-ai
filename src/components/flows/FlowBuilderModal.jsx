import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, Trash2, ArrowDown, MessageSquare, List, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const triggerOptions = [
  { value: 'new_visitor', label: 'New Visitor' },
  { value: 'page_visit', label: 'Specific Page Visit' },
  { value: 'time_on_site', label: 'Time on Site (seconds)' },
  { value: 'after_hours', label: 'After Hours' },
  { value: 'keyword', label: 'Keyword Match' },
  { value: 'cart_abandoned', label: 'Cart Abandoned' },
  { value: 'referral_source', label: 'Referral Source' },
  { value: 'manual', label: 'Manual Trigger' },
];

const stepTypes = [
  { value: 'message', label: '💬 Send Message', icon: MessageSquare },
  { value: 'options', label: '🔘 Show Options', icon: List },
  { value: 'wait', label: '⏱ Wait', icon: Clock },
];

const emptyStep = { type: 'message', message: '', delay_seconds: 0, options: [] };

export default function FlowBuilderModal({ flow, onClose, onSave, brandId }) {
  const { toast } = useToast();
  const [name, setName] = useState(flow?.name || '');
  const [description, setDescription] = useState(flow?.description || '');
  const [trigger, setTrigger] = useState(flow?.trigger || 'new_visitor');
  const [triggerValue, setTriggerValue] = useState(flow?.trigger_value || '');
  const [steps, setSteps] = useState(flow?.steps || [{ type: 'message', message: 'Hi there! 👋 How can I help you?', delay_seconds: 2, options: [] }]);

  const needsTriggerValue = ['page_visit', 'time_on_site', 'keyword', 'referral_source'].includes(trigger);

  const addStep = () => setSteps(s => [...s, { ...emptyStep }]);

  const updateStep = (i, data) => setSteps(s => s.map((step, idx) => idx === i ? { ...step, ...data } : step));

  const removeStep = (i) => setSteps(s => s.filter((_, idx) => idx !== i));

  const updateOptions = (i, val) => {
    const opts = val.split('\n').filter(Boolean);
    updateStep(i, { options: opts });
  };

  const save = async () => {
    if (!name) return;
    try {
      const data = { name, description, trigger, trigger_value: triggerValue, steps, is_active: true, brand_id: brandId };
      if (flow?.id) {
        await base44.entities.AutomationFlow.update(flow.id, data);
      } else {
        await base44.entities.AutomationFlow.create(data);
      }
      onSave();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to save flow', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">{flow ? 'Edit Flow' : 'New Automation Flow'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Flow Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Welcome Flow" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this flow do?" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Trigger</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {triggerOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {needsTriggerValue && (
              <div className="space-y-1.5">
                <Label className="text-sm">{trigger === 'time_on_site' ? 'Seconds on site' : trigger === 'keyword' ? 'Keyword' : trigger === 'page_visit' ? 'Page URL' : 'Referral URL'}</Label>
                <Input value={triggerValue} onChange={e => setTriggerValue(e.target.value)} placeholder={trigger === 'time_on_site' ? '30' : trigger === 'keyword' ? 'pricing, cost...' : '/pricing'} />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Flow Steps</Label>
              <Button size="sm" variant="outline" onClick={addStep} className="text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Step
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="relative">
                  {i > 0 && <div className="flex justify-center mb-2"><ArrowDown className="w-4 h-4 text-muted-foreground" /></div>}
                  <div className="border rounded-xl p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Select value={step.type} onValueChange={v => updateStep(i, { type: v })}>
                        <SelectTrigger className="w-40 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {stepTypes.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1 ml-auto">
                        <Label className="text-xs text-muted-foreground">Delay (s):</Label>
                        <Input
                          type="number"
                          className="w-16 h-7 text-xs"
                          value={step.delay_seconds || 0}
                          onChange={e => updateStep(i, { delay_seconds: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <button onClick={() => removeStep(i)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {step.type !== 'wait' && (
                      <Textarea
                        placeholder={step.type === 'message' ? 'Message to send...' : 'Button label text...'}
                        value={step.message}
                        onChange={e => updateStep(i, { message: e.target.value })}
                        rows={2}
                        className="resize-none text-xs mb-2"
                      />
                    )}

                    {step.type === 'options' && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Options (one per line)</Label>
                        <Textarea
                          value={(step.options || []).join('\n')}
                          onChange={e => updateOptions(i, e.target.value)}
                          rows={3}
                          className="resize-none text-xs mt-1"
                          placeholder={"Browse products\nTrack order\nGet support"}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save Flow</Button>
        </div>
      </div>
    </div>
  );
}