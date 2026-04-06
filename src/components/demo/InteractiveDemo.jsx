import { useState } from 'react';
import { ChevronRight, MessageCircle, Zap, UserCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const demoSteps = [
  {
    id: 1,
    title: 'Connect Facebook Page',
    description: 'Admin connects their Facebook Page to ChatPulse',
    screen: 'integrations',
  },
  {
    id: 2,
    title: 'Customer Sends Message',
    description: 'Customer messages your Facebook Page',
    screen: 'facebook-message',
  },
  {
    id: 3,
    title: 'AI Processes & Responds',
    description: 'ChatPulse receives message and AI responds automatically',
    screen: 'ai-response',
  },
  {
    id: 4,
    title: 'Agent Takes Over',
    description: 'Agent reviews and takes the conversation',
    screen: 'agent-takeover',
  },
  {
    id: 5,
    title: 'Resolution',
    description: 'Agent resolves the issue and closes the conversation',
    screen: 'resolution',
  },
];

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(1);

  const step = demoSteps[currentStep - 1];

  return (
    <div className="space-y-6">
      {/* Step Indicators */}
      <div className="flex gap-2">
        {demoSteps.map((s) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(s.id)}
            className={cn(
              'flex-1 h-2 rounded-full transition-colors',
              currentStep === s.id ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Current Step Info */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
          <Badge variant="outline">Step {currentStep} of 5</Badge>
        </div>
      </div>

      {/* Screen Simulation */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {step.screen === 'integrations' && <IntegrationsScreen />}
          {step.screen === 'facebook-message' && <FacebookMessageScreen />}
          {step.screen === 'ai-response' && <AIResponseScreen />}
          {step.screen === 'agent-takeover' && <AgentTakeoverScreen />}
          {step.screen === 'resolution' && <ResolutionScreen />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentStep === 5 ? 'Demo Complete!' : `${5 - currentStep} step${5 - currentStep !== 1 ? 's' : ''} remaining`}
        </div>
        <Button
          onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
          disabled={currentStep === 5}
          className="gap-2"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function IntegrationsScreen() {
  return (
    <div className="h-96 bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex flex-col">
      <div className="text-sm font-semibold text-muted-foreground mb-4">INTEGRATIONS PAGE</div>
      <div className="space-y-3 flex-1">
        <div className="bg-white rounded-lg p-4 border-2 border-primary">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">f</div>
              <div>
                <p className="font-semibold text-sm">Facebook Pages</p>
                <p className="text-xs text-muted-foreground">Connect your Facebook Page</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700">Connected</Badge>
          </div>
          <div className="text-xs text-muted-foreground mb-3">Page: "My Business"</div>
          <Button size="sm" disabled className="opacity-50">
            Disconnect
          </Button>
        </div>
        <div className="bg-white rounded-lg p-4 opacity-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gray-100"></div>
              <div>
                <p className="font-semibold text-sm">Gmail</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-xs text-green-600 flex items-center gap-2 mt-4">
        <CheckCircle className="w-4 h-4" />
        Webhook verified and active
      </div>
    </div>
  );
}

function FacebookMessageScreen() {
  return (
    <div className="h-96 bg-gradient-to-br from-blue-50 to-blue-100 p-6 flex flex-col">
      <div className="text-sm font-semibold text-muted-foreground mb-4">FACEBOOK MESSENGER</div>
      <div className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white rounded-3xl rounded-tr-sm px-4 py-2 text-sm max-w-xs">
              Hi, I have a question about my recent order
            </div>
          </div>
        </div>
        <div className="bg-white rounded-full p-3 flex gap-2">
          <input type="text" placeholder="Aa" className="flex-1 outline-none text-sm" />
          <button className="text-blue-600">Send</button>
        </div>
      </div>
    </div>
  );
}

function AIResponseScreen() {
  return (
    <div className="h-96 bg-gradient-to-br from-purple-50 to-purple-100 p-6 flex flex-col">
      <div className="text-sm font-semibold text-muted-foreground mb-4">CHATPULSE CONVERSATIONS</div>
      <div className="space-y-3 flex-1">
        {/* Customer message */}
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 shrink-0" />
          <div className="bg-white rounded-lg p-3 max-w-xs text-sm">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Customer</p>
            <p>Hi, I have a question about my recent order</p>
          </div>
        </div>

        {/* AI analysis */}
        <div className="bg-blue-50 rounded-lg p-3 text-xs border border-blue-200 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-blue-900">
            <Zap className="w-3 h-3" /> AI Analysis
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-blue-600">Intent:</span> Order Inquiry
            </div>
            <div>
              <span className="text-blue-600">Sentiment:</span> Neutral
            </div>
            <div>
              <span className="text-blue-600">Confidence:</span> 95%
            </div>
          </div>
        </div>

        {/* AI response */}
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-300 shrink-0 flex items-center justify-center text-white text-xs font-bold">
            🤖
          </div>
          <div className="bg-purple-600 text-white rounded-lg p-3 max-w-xs text-sm">
            <p className="font-semibold text-xs opacity-90 mb-1">ShopBot (AI)</p>
            <p>Hi there! To help you with your order, could you please provide your order number?</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentTakeoverScreen() {
  return (
    <div className="h-96 bg-gradient-to-br from-green-50 to-green-100 p-6 flex flex-col">
      <div className="text-sm font-semibold text-muted-foreground mb-4">AGENT INBOX - TAKEOVER</div>
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-4 border-2 border-green-500">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">Customer Name</p>
              <p className="text-xs text-muted-foreground">Order inquiry • 2 messages</p>
            </div>
            <Badge className="bg-green-100 text-green-700">Taking Over</Badge>
          </div>
          <div className="bg-green-50 rounded p-2 text-xs mb-3 space-y-1">
            <p>
              <span className="font-semibold">Agent:</span> Sarah (support@company.com)
            </p>
            <p>
              <span className="font-semibold">Mode:</span> Switching from AI to Human
            </p>
          </div>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <UserCheck className="w-4 h-4 mr-2" />
            Take Over Conversation
          </Button>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-xs space-y-1">
          <p className="font-semibold text-blue-900">System Message:</p>
          <p className="text-blue-800">Agent Sarah has taken over this conversation. Switching to human support...</p>
        </div>
      </div>
    </div>
  );
}

function ResolutionScreen() {
  return (
    <div className="h-96 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 flex flex-col">
      <div className="text-sm font-semibold text-muted-foreground mb-4">RESOLUTION</div>
      <div className="space-y-3 flex-1">
        {/* Agent response */}
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-green-400 shrink-0 flex items-center justify-center text-white text-xs font-bold">
            SA
          </div>
          <div className="bg-green-600 text-white rounded-lg p-3 max-w-xs text-sm">
            <p className="font-semibold text-xs opacity-90 mb-1">Sarah (Agent)</p>
            <p>I found your order! It's shipping out tomorrow. You'll receive it by Friday.</p>
          </div>
        </div>

        {/* Conversation marked resolved */}
        <div className="bg-white rounded-lg p-3 border-2 border-emerald-500">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-emerald-900">Conversation Resolved</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Duration: 3 minutes</p>
            <p>Mode: Human Agent</p>
            <p>Status: Closed</p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-xs">
        <p className="text-emerald-900">
          ✓ Customer satisfied • ✓ Issue resolved • ✓ Data preserved in ChatPulse
        </p>
      </div>
    </div>
  );
}