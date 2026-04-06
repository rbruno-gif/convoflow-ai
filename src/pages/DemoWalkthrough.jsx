import { useState } from 'react';
import { ArrowRight, MessageSquare, CheckCircle, User, Zap, Settings, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    id: 1,
    title: 'Connect Facebook Page',
    description: 'Link your Facebook Page to ChatPulse',
    details: [
      'Admin navigates to Integrations → Facebook Pages',
      'Clicks "Connect Facebook Page"',
      'Authorizes ChatPulse to access page messaging',
      'Selects the Facebook Page to connect',
      'System verifies webhook and webhook token',
    ],
    icon: Settings,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 2,
    title: 'Customer Sends Message on Facebook',
    description: 'Customer initiates conversation via Facebook Messenger',
    details: [
      'Customer visits your Facebook Page',
      'Opens Messenger and sends a message',
      'Message is encrypted and sent to Facebook servers',
      'Facebook webhook delivers message to ChatPulse',
      'System stores message with customer info (name, ID, avatar)',
    ],
    icon: MessageSquare,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 3,
    title: 'Message Appears in ChatPulse',
    description: 'Message is processed and displayed in the dashboard',
    details: [
      'Message appears in Conversations list',
      'AI analyzes sentiment, intent, and flags urgency',
      'Customer profile auto-populated (name, avatar, history)',
      'Agent Inbox shows new unread message',
      'Notification badge updates in real-time',
    ],
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    id: 4,
    title: 'AI or Agent Responds',
    description: 'Response is generated and sent back to customer',
    details: [
      'AI automatically responds (if enabled)',
      'Agent can view AI response and approve/edit',
      'Agent selects conversation and types reply',
      'Agent sends message directly from ChatPulse',
      'Message is forwarded to Facebook Messenger',
    ],
    icon: User,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 5,
    title: 'Customer Receives Reply',
    description: 'Customer sees the response on Facebook',
    details: [
      'Reply appears in customer\'s Messenger chat',
      'Customer sees message sent from your Page',
      'Conversation continues naturally',
      'All messages synced bidirectionally',
      'Chat history maintained in ChatPulse',
    ],
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-600',
  },
];

export default function DemoWalkthrough() {
  const [expandedStep, setExpandedStep] = useState(null);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Video className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Facebook Integration Demo Walkthrough</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Step-by-step guide showing how ChatPulse processes Facebook Messenger conversations
          </p>
          <Badge className="mt-4 bg-primary/10 text-primary">Use this as a reference for your screen recording</Badge>
        </div>

        {/* Main Walkthrough */}
        <div className="space-y-4 mb-12">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
            >
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-6">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg ${step.color} flex items-center justify-center font-bold text-lg`}>
                      {step.id}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <ArrowRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedStep === step.id ? 'rotate-90' : ''}`} />
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStep === step.id && (
                  <div className="px-6 pb-6 bg-muted/30 border-t space-y-3">
                    <h4 className="font-semibold text-sm">What happens in this step:</h4>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Features to Highlight */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Key Features to Demonstrate in Recording</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Feature
                title="Bidirectional Messaging"
                description="Messages flow seamlessly between Facebook and ChatPulse in real-time"
                items={['Incoming messages appear instantly', 'Outgoing replies sent to Messenger', 'Conversation synced both ways']}
              />
              <Feature
                title="Customer Context"
                description="Full customer information automatically captured from Facebook"
                items={['Customer name and profile picture', 'Conversation history preserved', 'Customer ID linked for tracking']}
              />
              <Feature
                title="AI & Agent Collaboration"
                description="AI assists agents with intelligent responses and insights"
                items={['Sentiment analysis on messages', 'Intent detection and flagging', 'Suggested replies from AI']}
              />
              <Feature
                title="Real-time Updates"
                description="Dashboard reflects all activity instantly"
                items={['New messages appear immediately', 'Status badges update in real-time', 'Unread counts accurate']}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recording Tips */}
        <Card className="border-0 shadow-sm bg-blue-50 border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">📹 Screen Recording Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Before Recording:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Set up a test Facebook account or use a test page</li>
                <li>Have sample customer messages ready to send</li>
                <li>Open both Facebook Messenger and ChatPulse side-by-side</li>
                <li>Clear browser cache and set appropriate zoom level</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">During Recording:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Follow the 5-step flow above in sequence</li>
                <li>Narrate what you're doing clearly</li>
                <li>Show the actual message sending/receiving (not just UI)</li>
                <li>Highlight how customer data is preserved</li>
                <li>Demonstrate both AI and agent responses</li>
                <li>Show multiple messages to prove two-way sync</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">After Recording:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Ensure audio is clear and easy to understand</li>
                <li>Video duration: aim for 2-3 minutes</li>
                <li>Format: MP4, H.264 codec, 1280x720 or higher</li>
                <li>Upload to Facebook's form with detailed description</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Explained */}
        <Card className="border-0 shadow-sm mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Permissions Used</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PermissionItem
              permission="pages_messaging"
              description="Receive and send messages in Page inbox"
              usage="Used to read customer messages and send replies"
            />
            <PermissionItem
              permission="manage_pages"
              description="Manage your Facebook Pages"
              usage="Used to verify page ownership and access page information"
            />
            <PermissionItem
              permission="page_events_subscriptions"
              description="Subscribe to Page events like new messages"
              usage="Used to receive real-time webhook notifications of new messages"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Feature({ title, description, items }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="w-1 h-1 bg-primary rounded-full" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PermissionItem({ permission, description, usage }) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-primary">{permission}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="bg-background/50 rounded p-2 text-xs text-muted-foreground">
        <strong>Used for:</strong> {usage}
      </div>
    </div>
  );
}