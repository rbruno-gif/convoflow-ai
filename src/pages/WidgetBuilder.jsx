import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Copy, Send, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WidgetPreview from '@/components/widget/WidgetPreview';

export default function WidgetBuilder() {
  const [config, setConfig] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { activeBrandId } = useBrand();
  const qc = useQueryClient();

  const { data: widgetConfigs } = useQuery({
    queryKey: ['widget-config', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.WidgetConfig.filter({ brand_id: activeBrandId }).then(c => c[0])
      : null,
  });

  useEffect(() => {
    if (widgetConfigs) {
      setConfig(widgetConfigs);
    } else if (!config) {
      setConfig({
        brand_id: activeBrandId,
        bot_name: 'Support Bot',
        greeting_message: 'Hi! How can we help?',
        primary_color: '#7c3aed',
        header_color: '#7c3aed',
        background_color: '#ffffff',
        text_color: '#000000',
        position: 'bottom_right',
        offset_x_px: 20,
        offset_y_px: 20,
        is_published: false,
        ai_confidence_threshold: 70,
      });
    }
  }, [widgetConfigs, activeBrandId]);

  const save = async () => {
    if (!config) return;
    setSaving(true);

    try {
      if (config.id) {
        await base44.entities.WidgetConfig.update(config.id, config);
      } else {
        await base44.entities.WidgetConfig.create(config);
      }
      qc.invalidateQueries({ queryKey: ['widget-config', activeBrandId] });
      setSaving(false);
    } catch (error) {
      console.error('Save failed:', error);
      setSaving(false);
    }
  };

  if (!config) return <div>Loading...</div>;

  const updateConfig = (key, value) => {
    setConfig(c => ({ ...c, [key]: value }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Settings Panel */}
      <div className="w-96 border-r overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Widget Builder</h1>
          <p className="text-sm text-muted-foreground">Customize your chatbot</p>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Bot Name</label>
              <Input
                value={config.bot_name}
                onChange={e => updateConfig('bot_name', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Greeting Message</label>
              <Input
                value={config.greeting_message}
                onChange={e => updateConfig('greeting_message', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.primary_color}
                  onChange={e => updateConfig('primary_color', e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input value={config.primary_color} readOnly className="flex-1" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Position</label>
              <Select value={config.position} onValueChange={v => updateConfig('position', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom_left">Bottom Left</SelectItem>
                  <SelectItem value="bottom_right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Offset X (px)</label>
                <Input
                  type="number"
                  value={config.offset_x_px}
                  onChange={e => updateConfig('offset_x_px', parseInt(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Offset Y (px)</label>
                <Input
                  type="number"
                  value={config.offset_y_px}
                  onChange={e => updateConfig('offset_y_px', parseInt(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">AI Confidence Threshold</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.ai_confidence_threshold}
                onChange={e => updateConfig('ai_confidence_threshold', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Answers above this % are sent automatically. Below = proposed to agent.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Toggle
                pressed={config.sound_enabled}
                onPressedChange={v => updateConfig('sound_enabled', v)}
              >
                Sound Enabled
              </Toggle>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Offline Message</label>
              <Input
                value={config.offline_message}
                onChange={e => updateConfig('offline_message', e.target.value)}
              />
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Toggle
                pressed={config.pre_chat_form_enabled}
                onPressedChange={v => updateConfig('pre_chat_form_enabled', v)}
              >
                Pre-chat Form
              </Toggle>
            </div>

            <div className="flex items-center gap-2">
              <Toggle
                pressed={config.gdpr_consent_enabled}
                onPressedChange={v => updateConfig('gdpr_consent_enabled', v)}
              >
                GDPR Consent
              </Toggle>
            </div>

            <div className="flex items-center gap-2">
              <Toggle
                pressed={config.proactive_message_enabled}
                onPressedChange={v => updateConfig('proactive_message_enabled', v)}
              >
                Proactive Message
              </Toggle>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="space-y-2 border-t pt-6">
          <Button onClick={save} className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>

          {config.is_published && (
            <Button variant="outline" className="w-full gap-2">
              <Copy className="w-4 h-4" />
              Copy Embed Code
            </Button>
          )}

          {!config.is_published && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => updateConfig('is_published', true)}
            >
              <Send className="w-4 h-4" />
              Publish Widget
            </Button>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="font-semibold">Live Preview</h2>
          <Toggle pressed={darkMode} onPressedChange={setDarkMode}>
            {darkMode ? '🌙 Dark' : '☀️ Light'}
          </Toggle>
        </div>

        <div className={`flex-1 p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <WidgetPreview config={config} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}