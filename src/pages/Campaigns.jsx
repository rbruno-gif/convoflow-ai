import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Send, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CampaignList from '@/components/campaigns/CampaignList';
import CampaignBuilder from '@/components/campaigns/CampaignBuilder';
import CampaignAnalytics from '@/components/campaigns/CampaignAnalytics';

export default function Campaigns() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const { activeBrandId } = useBrand();
  const qc = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Campaign.filter({ brand_id: activeBrandId }, '-created_date', 100)
      : [],
  });

  if (showBuilder) {
    return (
      <CampaignBuilder
        brandId={activeBrandId}
        campaign={selectedCampaign}
        onClose={() => { setShowBuilder(false); setSelectedCampaign(null); }}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['campaigns', activeBrandId] });
          setShowBuilder(false);
          setSelectedCampaign(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Proactive messaging to customers</p>
        </div>
        <Button onClick={() => setShowBuilder(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled" className="flex gap-2">
            <Clock className="w-4 h-4" /> Scheduled
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex gap-2">
            <CheckCircle className="w-4 h-4" /> Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CampaignList
            campaigns={campaigns}
            onEdit={c => { setSelectedCampaign(c); setShowBuilder(true); }}
            onAnalytics={setSelectedCampaign}
          />
        </TabsContent>

        <TabsContent value="scheduled">
          <CampaignList
            campaigns={campaigns.filter(c => c.status === 'scheduled')}
            onEdit={c => { setSelectedCampaign(c); setShowBuilder(true); }}
          />
        </TabsContent>

        <TabsContent value="completed">
          <CampaignList
            campaigns={campaigns.filter(c => c.status === 'completed')}
            onAnalytics={setSelectedCampaign}
          />
        </TabsContent>
      </Tabs>

      {selectedCampaign && selectedCampaign.status === 'completed' && (
        <CampaignAnalytics campaign={selectedCampaign} />
      )}
    </div>
  );
}