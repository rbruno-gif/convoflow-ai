import { Card } from '@/components/ui/card';

export default function AIAnalytics({ brand }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">AI & Chatbot Analytics</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">
          Chatbot containment rate gauge, top 10 answered questions, top 10 unanswered questions (FAQ gap report with Add to KB buttons), confidence distribution, handoff rate trend, KB coverage score
        </p>
        <p className="text-xs text-gray-400 mt-2">Gauges, charts, and FAQ gap functionality to be implemented</p>
      </Card>
    </div>
  );
}