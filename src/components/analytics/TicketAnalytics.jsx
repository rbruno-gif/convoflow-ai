import { Card } from '@/components/ui/card';

export default function TicketAnalytics({ tickets }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Ticket & Resolution Analytics</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">
          Tickets created vs resolved, avg resolution time trend, backlog, escalation rate, and ticket age distribution
        </p>
        <p className="text-xs text-gray-400 mt-2">Charts to be implemented with Recharts</p>
      </Card>
    </div>
  );
}