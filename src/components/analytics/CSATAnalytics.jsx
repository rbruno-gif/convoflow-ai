import { Card } from '@/components/ui/card';

export default function CSATAnalytics({ conversations }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">CSAT & Customer Satisfaction</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">
          Overall CSAT score with trend, distribution by stars, CSAT by agent table, CSAT by channel, response rate, and recent negative reviews list
        </p>
        <p className="text-xs text-gray-400 mt-2">Charts and lists to be implemented</p>
      </Card>
    </div>
  );
}