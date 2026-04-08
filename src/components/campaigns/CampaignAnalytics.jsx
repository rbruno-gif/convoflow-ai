import { Card } from '@/components/ui/card';

export default function CampaignAnalytics({ campaign }) {
  const deliveryRate = campaign.sent_count > 0 ? Math.round((campaign.delivered_count / campaign.sent_count) * 100) : 0;
  const replyRate = campaign.sent_count > 0 ? Math.round((campaign.replied_count / campaign.sent_count) * 100) : 0;

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-lg font-bold">Campaign Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Sent</p>
          <p className="text-2xl font-bold">{campaign.sent_count}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Delivered</p>
          <p className="text-2xl font-bold">{deliveryRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Replied</p>
          <p className="text-2xl font-bold">{replyRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Opt-outs</p>
          <p className="text-2xl font-bold">{campaign.opt_out_count}</p>
        </Card>
      </div>
    </div>
  );
}