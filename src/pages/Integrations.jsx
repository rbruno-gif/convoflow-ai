import { useState } from 'react';
import { Mail, Facebook, Instagram, MessageCircle, Check, Loader2, ExternalLink, AlertCircle, Plug, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useBrand } from '@/context/BrandContext';
import GmailIntegration from '@/components/integrations/GmailIntegration';
import MetaIntegration from '@/components/integrations/MetaIntegration';
import FacebookPagesManager from '@/components/integrations/FacebookPagesManager';
import FacebookMessengerWebhooks from '@/components/integrations/FacebookMessengerWebhooks';
import WhatsAppIntegration from '@/components/integrations/WhatsAppIntegration';

export default function Integrations() {
  const { activeBrand, activeBrandId, isInitialized } = useBrand();

  if (!isInitialized) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeBrandId || !activeBrand) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-xs">
            <Plug className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">Brand not selected</p>
            <p className="text-xs text-muted-foreground mt-1">Please select a brand from the sidebar to manage integrations.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeBrand?.name || 'All brands'} · Connect your messaging channels. New messages sync automatically into the Conversations inbox.
        </p>
      </div>

      <div className="space-y-5">
        <GmailIntegration brandId={activeBrand?.id} />
        <FacebookPagesManager brandId={activeBrand?.id} />
        <FacebookMessengerWebhooks />
        <MetaIntegration platform="instagram" brandId={activeBrand?.id} />
        <WhatsAppIntegration brandId={activeBrand?.id} />
      </div>
    </div>
  );
}