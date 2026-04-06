import { useState } from 'react';
import { Mail, Facebook, Instagram, MessageCircle, Check, Loader2, ExternalLink, AlertCircle, Plug, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import GmailIntegration from '@/components/integrations/GmailIntegration';
import MetaIntegration from '@/components/integrations/MetaIntegration';
import WhatsAppIntegration from '@/components/integrations/WhatsAppIntegration';

export default function Integrations() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your messaging channels. New messages sync automatically into the Conversations inbox.
        </p>
      </div>

      <div className="space-y-5">
        <GmailIntegration />
        <MetaIntegration platform="facebook" />
        <MetaIntegration platform="instagram" />
        <WhatsAppIntegration />
      </div>
    </div>
  );
}