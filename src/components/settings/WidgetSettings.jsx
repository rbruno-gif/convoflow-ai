import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function WidgetSettings({ brandId, onChangesMade }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Chat Widget Settings</h2>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Allowed Domains (whitelist)</label>
          <Input placeholder="yourdomain.com, app.yourdomain.com" onChange={() => onChangesMade()} />
          <p className="text-xs text-muted-foreground mt-1">Comma-separated list. Widget only loads on these domains</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rate Limit (messages per hour)</label>
          <Input type="number" placeholder="60" onChange={() => onChangesMade()} />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" onChange={() => onChangesMade()} /> Enable typing indicator
          </label>
        </div>

        <Button variant="outline">Go to Widget Builder</Button>
      </Card>
    </div>
  );
}