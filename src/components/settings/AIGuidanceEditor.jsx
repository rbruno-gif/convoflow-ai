import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Save, Lightbulb, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GUIDANCE_TEMPLATES = {
  sales: {
    title: 'Sales-Focused',
    description: 'Prioritize converting customers to paid plans',
    content: `Guide the AI to:
1. Identify customer needs and pain points quickly
2. Ask qualifying questions about budget and data usage
3. Recommend the most suitable U2C plan (Blue, Pink, or Red)
4. Highlight benefits that directly address their stated needs
5. Use scarcity and urgency when appropriate ("Limited time offer")
6. Move toward checkout with clear next steps`,
  },
  support: {
    title: 'Support-Focused',
    description: 'Prioritize resolving customer issues',
    content: `Guide the AI to:
1. Listen and acknowledge customer frustration
2. Ask specific clarifying questions about their issue
3. Provide step-by-step solutions when possible
4. Offer alternatives if the first solution doesn't work
5. Escalate to human agent for complex technical issues
6. Always provide a follow-up or confirmation`,
  },
  retention: {
    title: 'Retention-Focused',
    description: 'Keep existing customers happy and prevent churn',
    content: `Guide the AI to:
1. Thank customers for their loyalty
2. Offer loyalty rewards and exclusive perks
3. Suggest plan upgrades if they're nearing data limits
4. Provide VIP support and priority assistance
5. Proactively identify at-risk customers
6. Create personalized retention offers`,
  },
  balanced: {
    title: 'Balanced Approach',
    description: 'Balance sales, support, and customer satisfaction',
    content: `Guide the AI to:
1. Assess customer intent first (support vs. sales)
2. Provide genuine help without pushy sales tactics
3. Mention relevant plans only when contextually appropriate
4. Build trust through authentic, helpful interactions
5. Know when to escalate to human agents
6. Measure success by customer satisfaction, not just conversions`,
  },
};

export default function AIGuidanceEditor() {
  const [guidance, setGuidance] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGuidance();
  }, []);

  const loadGuidance = async () => {
    try {
      const settings = await base44.entities.AgentSettings.list();
      if (settings.length > 0) {
        setGuidance(settings[0].ai_instructions || '');
      }
    } catch (error) {
      console.error('Error loading guidance:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGuidance = async () => {
    setSaving(true);
    try {
      const settings = await base44.entities.AgentSettings.list();
      if (settings.length > 0) {
        await base44.entities.AgentSettings.update(settings[0].id, {
          ai_instructions: guidance,
        });
      } else {
        await base44.entities.AgentSettings.create({
          store_name: 'U2CMobile',
          ai_instructions: guidance,
        });
      }
      toast({
        title: 'Guidance saved',
        description: 'AI will use these instructions for future conversations',
        open: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving guidance',
        description: error.message,
        open: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (templateKey) => {
    const template = GUIDANCE_TEMPLATES[templateKey];
    setGuidance(template.content);
    setSelectedTemplate(templateKey);
    toast({
      title: 'Template applied',
      description: `${template.title} guidance loaded. You can customize it further.`,
      open: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="custom" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custom">Custom Guidance</TabsTrigger>
          <TabsTrigger value="templates">Quick Templates</TabsTrigger>
        </TabsList>

        {/* Custom Guidance Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Interaction Guidance</CardTitle>
              <CardDescription>
                Provide detailed instructions on how the AI should interact with customers. Include tone, approach, priorities, and specific behaviors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your AI guidance here... Include instructions on tone, approach, priorities, and specific behaviors you want the AI to follow when interacting with customers."
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                rows={12}
                className="font-mono text-sm resize-none"
              />

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={loadGuidance}
                  disabled={saving}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </Button>
                <Button
                  onClick={saveGuidance}
                  disabled={saving || !guidance.trim()}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" /> Save Guidance
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Current Guidance Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {guidance || 'No guidance set yet. Start by writing custom guidance or selecting a template.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guidance Templates</CardTitle>
              <CardDescription>
                Choose a pre-built template as a starting point, then customize it for your needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(GUIDANCE_TEMPLATES).map(([key, template]) => (
                <div
                  key={key}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold">{template.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground bg-background p-3 rounded border whitespace-pre-wrap max-h-20 overflow-hidden">
                    {template.content}
                  </div>
                  <Button
                    size="sm"
                    variant={selectedTemplate === key ? 'default' : 'outline'}
                    onClick={() => applyTemplate(key)}
                    className="w-full"
                  >
                    {selectedTemplate === key ? '✓ Applied' : 'Use This Template'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Card className="bg-accent/30 border-accent">
        <CardHeader>
          <CardTitle className="text-base">Tips for Effective Guidance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✓ Be specific about tone (friendly, professional, casual, etc.)</p>
          <p>✓ Include step-by-step interaction flows for common scenarios</p>
          <p>✓ Define priorities (e.g., sales first vs. customer satisfaction first)</p>
          <p>✓ Specify when to escalate to human agents</p>
          <p>✓ Include examples of good responses for different situations</p>
          <p>✓ Update guidance based on conversation quality feedback</p>
        </CardContent>
      </Card>
    </div>
  );
}