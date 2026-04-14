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
import WhatsAppIntegration from '@/components/integrations/WhatsAppIntegration';
import InstagramManager from '@/components/integrations/InstagramManager';

export default function Integrations() {
  const { activeBrand } = useBrand();

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
        <InstagramManager brandId={activeBrand?.id} />
        <WhatsAppIntegration brandId={activeBrand?.id} />
      </div>
    </div>
  );
}