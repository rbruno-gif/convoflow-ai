import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  running: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function CampaignList({ campaigns, onEdit, onAnalytics }) {
  if (campaigns.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <p>No campaigns yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {campaigns.map(campaign => (
        <Card key={campaign.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{campaign.name}</h3>
              <p className="text-sm text-muted-foreground">{campaign.channel} • {campaign.message_content.slice(0, 50)}...</p>
              {campaign.scheduled_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled: {format(new Date(campaign.scheduled_at), 'MMM d, HH:mm')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge className={statusColors[campaign.status]}>
                {campaign.status}
              </Badge>
              <div className="flex gap-2">
                {campaign.status === 'draft' && (
                  <Button variant="outline" size="sm" onClick={() => onEdit?.(campaign)} className="gap-1">
                    <Edit2 className="w-3 h-3" /> Edit
                  </Button>
                )}
                {campaign.status === 'completed' && (
                  <Button variant="outline" size="sm" onClick={() => onAnalytics?.(campaign)} className="gap-1">
                    <BarChart3 className="w-3 h-3" /> Analytics
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}