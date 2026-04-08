import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AgentPerformance({ brand }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Agent Performance Leaderboard</h2>
        <Button variant="outline" size="sm">Export CSV</Button>
      </div>
      <Card className="p-6">
        <p className="text-muted-foreground">
          Sortable leaderboard table: agent name, brand, department, tickets resolved, first response time, resolution time, CSAT, SLA compliance, escalations
        </p>
        <p className="text-xs text-gray-400 mt-2">Table and detail panels to be implemented</p>
      </Card>
    </div>
  );
}