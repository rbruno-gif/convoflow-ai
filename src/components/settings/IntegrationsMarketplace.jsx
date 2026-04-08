import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const integrations = [
  { name: 'WhatsApp Business', status: 'disconnected', icon: '💬' },
  { name: 'Twilio SMS', status: 'connected', icon: '📱' },
  { name: 'Mailgun', status: 'disconnected', icon: '✉️' },
  { name: 'SendGrid', status: 'disconnected', icon: '✉️' },
  { name: 'Stripe', status: 'disconnected', icon: '💳' },
  { name: 'HubSpot', status: 'disconnected', icon: '🔗' },
  { name: 'Zapier', status: 'disconnected', icon: '⚡' },
  { name: 'Autocalls.ai', status: 'coming_soon', icon: '☎️' },
];

export default function IntegrationsMarketplace({ brandId }) {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Integrations Marketplace</h2>
        <p className="text-sm text-muted-foreground">Connect your favorite tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(integration => (
          <Card key={integration.name} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{integration.icon}</span>
                <div>
                  <h3 className="font-semibold">{integration.name}</h3>
                </div>
              </div>
              {integration.status === 'connected' && (
                <Badge className="bg-green-100 text-green-700">Connected</Badge>
              )}
              {integration.status === 'coming_soon' && (
                <Badge className="bg-gray-100 text-gray-700">Phase 5</Badge>
              )}
            </div>
            <Button
              variant={integration.status === 'connected' ? 'outline' : 'default'}
              className="w-full"
              disabled={integration.status === 'coming_soon'}
            >
              {integration.status === 'connected' ? 'Disconnect' : 'Configure'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}