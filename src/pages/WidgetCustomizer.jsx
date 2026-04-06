import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Palette, MessageSquare, Bot, Save, Eye, Code, AlignRight, AlignLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const defaultSettings = {
  primary_color: '#3b82f6',
  widget_position: 'bottom-right',
  greeting_message: 'Hi there! 👋 How can I help you today?',
  chatbot_name: 'ShopBot',
  show_branding: true,
  prechat_form_enabled: false,
  prechat_fields: ['name', 'email'],
  offline_message: "We're offline right now. Leave a message and we'll get back to you!",
};

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6366f1'];

export default function WidgetCustomizer() {
  const [form, setForm] = useState(defaultSettings);
  const [settingsId, setSettingsId] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings = [] } = useQuery({
    queryKey: ['widget-settings'],
    queryFn: () => base44.entities.WidgetSettings.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      setSettingsId(settings[0].id);
      setForm({ ...defaultSettings, ...settings[0] });
    }
  }, [settings]);

  const save = async () => {
    if (settingsId) {
      await base44.entities.WidgetSettings.update(settingsId, form);
    } else {
      const created = await base44.entities.WidgetSettings.create(form);
      setSettingsId(created.id);
    }
    qc.invalidateQueries({ queryKey: ['widget-settings'] });
    toast({ title: 'Widget settings saved' });
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const embedCode = `<!-- ShopBot Widget -->
<script>
  window.ShopBotConfig = {
    color: "${form.primary_color}",
    position: "${form.widget_position}",
    name: "${form.chatbot_name}",
    greeting: "${form.greeting_message}"
  };
</script>
<script src="https://cdn.shopbot.io/widget.js" async></script>`;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Widget Customizer</h1>
          <p className="text-sm text-muted-foreground">Customize your chat widget appearance and behavior</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCode(s => !s)} className="gap-2">
            <Code className="w-4 h-4" /> {showCode ? 'Hide' : 'Get'} Embed Code
          </Button>
          <Button onClick={save} className="gap-2">
            <Save className="w-4 h-4" /> Save
          </Button>
        </div>
      </div>

      {showCode && (
        <Card className="mb-6 border-primary/30 bg-accent/20">
          <CardContent className="p-5">
            <p className="text-sm font-semibold mb-2">Paste this code before &lt;/body&gt; on your website:</p>
            <pre className="bg-sidebar text-sidebar-foreground text-xs p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {embedCode}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Brand Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => set('primary_color', c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.primary_color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ background: c }}
                    />
                  ))}
                  <input type="color" value={form.primary_color} onChange={e => set('primary_color', e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border border-border" title="Custom color" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Widget Position</Label>
                <div className="flex gap-2">
                  {['bottom-right', 'bottom-left'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => set('widget_position', pos)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${form.widget_position === pos ? 'border-primary bg-accent text-primary' : 'border-border hover:bg-muted'}`}
                    >
                      {pos === 'bottom-right' ? <AlignRight className="w-4 h-4" /> : <AlignLeft className="w-4 h-4" />}
                      {pos === 'bottom-right' ? 'Bottom Right' : 'Bottom Left'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Show "Powered by ShopBot"</Label>
                  <p className="text-xs text-muted-foreground">Display branding in the widget</p>
                </div>
                <Switch checked={form.show_branding} onCheckedChange={v => set('show_branding', v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Chatbot Name</Label>
                <Input value={form.chatbot_name} onChange={e => set('chatbot_name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Greeting Message</Label>
                <Textarea value={form.greeting_message} onChange={e => set('greeting_message', e.target.value)} rows={2} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Offline Message</Label>
                <Textarea value={form.offline_message} onChange={e => set('offline_message', e.target.value)} rows={2} className="resize-none" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pre-Chat Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Enable pre-chat form</Label>
                  <p className="text-xs text-muted-foreground">Collect visitor info before chat starts</p>
                </div>
                <Switch checked={form.prechat_form_enabled} onCheckedChange={v => set('prechat_form_enabled', v)} />
              </div>
              {form.prechat_form_enabled && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Fields (comma-separated)</Label>
                  <Input
                    value={(form.prechat_fields || []).join(', ')}
                    onChange={e => set('prechat_fields', e.target.value.split(',').map(f => f.trim()).filter(Boolean))}
                    placeholder="name, email, phone"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div>
          <Card className="border-0 shadow-sm sticky top-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Eye className="w-4 h-4" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-80 overflow-hidden">
                <div className={`absolute bottom-4 ${form.widget_position === 'bottom-right' ? 'right-4' : 'left-4'} flex flex-col items-${form.widget_position === 'bottom-right' ? 'end' : 'start'} gap-2`}>
                  {/* Chat bubble */}
                  <div className="bg-white rounded-2xl shadow-xl p-3 w-56">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: form.primary_color }}>
                        {form.chatbot_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{form.chatbot_name}</p>
                        <p className="text-[9px] text-green-600">● Online</p>
                      </div>
                    </div>
                    <div className="bg-slate-100 rounded-xl rounded-tl-sm p-2 mb-2">
                      <p className="text-xs">{form.greeting_message}</p>
                    </div>
                    <div className="flex gap-1">
                      <input className="flex-1 text-xs border rounded-lg px-2 py-1" placeholder="Type a message..." readOnly />
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: form.primary_color }}>
                        <MessageSquare className="w-3 h-3" />
                      </div>
                    </div>
                    {form.show_branding && <p className="text-[8px] text-center text-muted-foreground mt-1">Powered by ShopBot</p>}
                  </div>
                  {/* Launcher button */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: form.primary_color }}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}