import { useState } from 'react';
import { Facebook, Instagram, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { IntegrationCard } from './GmailIntegration';

const platformConfig = {
  facebook: {
    icon: Facebook,
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'Facebook Messenger',
    description: 'Receive Facebook Messenger messages directly in your inbox.',
    connectLabel: 'Connect Facebook',
    docsUrl: 'https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup',
    tokenPlaceholder: 'Page Access Token from Meta Developer Console',
    verifyTokenLabel: 'Webhook Verify Token (you choose this)',
  },
  instagram: {
    icon: Instagram,
    iconBg: 'bg-pink-100 text-pink-600',
    title: 'Instagram DMs',
    description: 'Receive Instagram Direct Messages directly in your inbox.',
    connectLabel: 'Connect Instagram',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api/guides/messaging',
    tokenPlaceholder: 'Instagram Page Access Token from Meta',
    verifyTokenLabel: 'Webhook Verify Token (you choose this)',
  },
};

const STORAGE_KEY = (p) => `shopbot_${p}_config`;

export default function MetaIntegration({ platform }) {
  const cfg = platformConfig[platform];
  const Icon = cfg.icon;
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY(platform)) || 'null'); } catch { return null; } })();

  const [status, setStatus] = useState(saved ? 'connected' : 'idle');
  const [showForm, setShowForm] = useState(false);
  const [pageToken, setPageToken] = useState(saved?.pageToken || '');
  const [verifyToken, setVerifyToken] = useState(saved?.verifyToken || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const webhookUrl = `${window.location.origin}/api/functions/metaWebhook`;

  const save = async () => {
    if (!pageToken || !verifyToken) {
      toast({ title: 'Fill in all fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    localStorage.setItem(STORAGE_KEY(platform), JSON.stringify({ pageToken, verifyToken, platform }));
    setStatus('connected');
    setShowForm(false);
    toast({ title: `${cfg.title} connected!`, description: 'New messages will now appear in your inbox.' });
    setSaving(false);
  };

  const disconnect = () => {
    localStorage.removeItem(STORAGE_KEY(platform));
    setStatus('idle');
    setPageToken('');
    setVerifyToken('');
    toast({ title: `${cfg.title} disconnected` });
  };

  return (
    <IntegrationCard
      icon={Icon}
      iconBg={cfg.iconBg}
      title={cfg.title}
      description={cfg.description}
      status={status}
      connectedLabel="Webhook active — messages sync automatically"
      onConnect={() => setShowForm(true)}
      onDisconnect={disconnect}
      connectLabel={cfg.connectLabel}
      note="Requires a Meta Developer App with Webhook configured."
    >
      {(showForm || status === 'idle' && false) && (
        <div className="space-y-3 pt-1">
          <div className="p-3 bg-accent/30 rounded-lg text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Setup Instructions</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Create a Meta Developer App at <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">developers.facebook.com</a></li>
              <li>Add the Messenger/Instagram product and get a Page Access Token</li>
              <li>Configure the Webhook URL below and your chosen Verify Token</li>
              <li>Subscribe to <code className="bg-muted px-1 rounded">messages</code> events</li>
            </ol>
            <p className="mt-2 font-medium text-foreground">Webhook URL to use in Meta:</p>
            <code className="bg-muted px-2 py-1 rounded block mt-1 break-all">{webhookUrl}</code>
            <a href={cfg.docsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 mt-1">
              Full docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Page Access Token</Label>
            <Input value={pageToken} onChange={e => setPageToken(e.target.value)} placeholder={cfg.tokenPlaceholder} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{cfg.verifyTokenLabel}</Label>
            <Input value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="e.g. my_secret_verify_token_123" className="text-xs" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving} className="text-xs">Save & Connect</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="text-xs">Cancel</Button>
          </div>
        </div>
      )}
      {showForm === false && status === 'idle' && (
        <Button size="sm" variant="ghost" onClick={() => setShowForm(true)} className="text-xs text-primary px-0 h-auto">
          Show setup instructions →
        </Button>
      )}
    </IntegrationCard>
  );
}