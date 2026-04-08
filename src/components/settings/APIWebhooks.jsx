import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Copy, Eye, EyeOff } from 'lucide-react';

export default function APIWebhooks({ brandId }) {
  const [showKey, setShowKey] = useState(false);
  const mockKey = 'sk_live_abc123...xxxx';

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">API & Webhooks</h2>
      </div>

      {/* API Keys */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">API Keys</h3>
          <Button size="sm" className="gap-1">
            <Plus className="w-3 h-3" /> Create Key
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Production Key</p>
              <p className="text-sm text-muted-foreground">Created 2024-01-15</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="gap-1"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
          </div>
          {showKey && (
            <p className="mt-3 font-mono text-sm bg-gray-100 p-2 rounded">
              {mockKey}
            </p>
          )}
        </Card>
      </div>

      {/* Webhooks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Webhooks</h3>
          <Button size="sm" className="gap-1">
            <Plus className="w-3 h-3" /> Add Webhook
          </Button>
        </div>

        <Card className="p-6">
          <p className="text-muted-foreground">
            Configure webhook endpoints for events: new_conversation, ticket_created, message_received, csat_submitted, etc.
          </p>
          <p className="text-xs text-gray-400 mt-2">Webhook management to be fully implemented</p>
        </Card>
      </div>
    </div>
  );
}