import { Card } from '@/components/ui/card';

export default function ConversationAnalytics({ conversations }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Conversation Analytics</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">
          Conversation volume line chart, peak hours heatmap, channel breakdown, and new vs returning customers chart
        </p>
        <p className="text-xs text-gray-400 mt-2">Charts to be implemented with Recharts</p>
      </Card>
    </div>
  );
}