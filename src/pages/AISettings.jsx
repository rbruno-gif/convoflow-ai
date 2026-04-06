import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, Bot, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import AIGuidanceEditor from '@/components/settings/AIGuidanceEditor';

const defaultSettings = {
  store_name: 'My Store',
  ai_persona_name: 'ShopBot',
  welcome_message: 'Hi! Welcome to our store. How can I help you today? 😊',
  ai_instructions: 'You are a helpful and friendly e-commerce assistant. Help customers with product questions, orders, shipping, and returns. Be concise and friendly.',
  auto_flag_keywords: ['angry', 'refund', 'complaint', 'lawsuit', 'scam'],
  handoff_message: 'I\'ll connect you to a human agent right away. Please hold on!',
  business_hours: 'Monday–Friday, 9am–6pm',
  is_ai_active: true,
};

export default function AISettings() {
  const [form, setForm] = useState(defaultSettings);
  const [keywordsInput, setKeywordsInput] = useState('');
  const [settingsId, setSettingsId] = useState(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings = [] } = useQuery({
    queryKey: ['agent-settings'],
    queryFn: () => base44.entities.AgentSettings.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      const s = settings[0];
      setSettingsId(s.id);
      setForm({ ...defaultSettings, ...s });
      setKeywordsInput((s.auto_flag_keywords || []).join(', '));
    }
  }, [settings]);

  const save = async () => {
    const data = {
      ...form,
      auto_flag_keywords: keywordsInput.split(',').map(k => k.trim()).filter(Boolean),
    };
    if (settingsId) {
      await base44.entities.AgentSettings.update(settingsId, data);
    } else {
      const created = await base44.entities.AgentSettings.create(data);
      setSettingsId(created.id);
    }
    qc.invalidateQueries({ queryKey: ['agent-settings'] });
    toast({ title: 'Settings saved' });
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
          <Bot className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Agent Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your AI chat agent's behavior and interaction guidance</p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Basic Settings</TabsTrigger>
          <TabsTrigger value="guidance">Interaction Guidance</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">AI Agent Active</Label>
                <p className="text-xs text-muted-foreground">Enable or pause the AI agent</p>
              </div>
              <Switch checked={form.is_ai_active} onCheckedChange={v => set('is_ai_active', v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Store Name</Label>
              <Input value={form.store_name} onChange={e => set('store_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">AI Persona Name</Label>
              <Input value={form.ai_persona_name} onChange={e => set('ai_persona_name', e.target.value)} placeholder="ShopBot" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Business Hours</Label>
              <Input value={form.business_hours} onChange={e => set('business_hours', e.target.value)} placeholder="Mon–Fri, 9am–6pm" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Welcome Message</Label>
              <Textarea value={form.welcome_message} onChange={e => set('welcome_message', e.target.value)} rows={2} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Human Handoff Message</Label>
              <Textarea value={form.handoff_message} onChange={e => set('handoff_message', e.target.value)} rows={2} className="resize-none" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">AI Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">AI Instructions</Label>
              <p className="text-xs text-muted-foreground">Tell the AI how to behave and what to focus on</p>
              <Textarea value={form.ai_instructions} onChange={e => set('ai_instructions', e.target.value)} rows={4} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Auto-Flag Keywords</Label>
              <p className="text-xs text-muted-foreground">Comma-separated words that trigger auto-flagging (e.g. refund, angry)</p>
              <Input value={keywordsInput} onChange={e => setKeywordsInput(e.target.value)} placeholder="refund, angry, complaint" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={save} className="gap-2 w-full">
          <Save className="w-4 h-4" /> Save Settings
        </Button>
        </TabsContent>

        {/* Guidance Tab */}
        <TabsContent value="guidance" className="pt-6">
          <AIGuidanceEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}