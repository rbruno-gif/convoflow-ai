import { useState } from 'react';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { IntegrationCard } from './GmailIntegration';

const STORAGE_KEY = 'shopbot_whatsapp_config';

export default function WhatsAppIntegration() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; } })();

  const [status, setStatus] = useState(saved ? 'connected' : 'idle');
  const [showForm, setShowForm] = useState(false);
  const [phoneId, setPhoneId] = useState(saved?.phoneId || '');
  const [token, setToken] = useState(saved?.token || '');
  const [verifyToken, setVerifyToken] = useState(saved?.verifyToken || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const webhookUrl = `${window.location.origin}/api/functions/whatsappWebhook`;

  const save = () => {
    if (!phoneId || !token || !verifyToken) {
      toast({ title: 'Fill in all fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phoneId, token, verifyToken }));
    setStatus('connected');
    setShowForm(false);
    toast({ title: 'WhatsApp connected!', description: 'Messages will now appear in your inbox.' });
    setSaving(false);
  };

  const disconnect = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStatus('idle');
    setPhoneId(''); setToken(''); setVerifyToken('');
    toast({ title: 'WhatsApp disconnected' });
  };

  return (
    <IntegrationCard
      icon={MessageCircle}
      iconBg="bg-green-100 text-green-600"
      title="WhatsApp Business"
      description="Receive WhatsApp Business messages directly in your inbox."
      status={status}
      connectedLabel="Webhook active — messages sync automatically"
      onConnect={() => setShowForm(true)}
      onDisconnect={disconnect}
      connectLabel="Connect WhatsApp"
      note="Requires a Meta Developer App with WhatsApp Business API."
    >
      {showForm && (
        <div className="space-y-3 pt-1">
          <div className="p-3 bg-accent/30 rounded-lg text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Setup Instructions</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Create a Meta Developer App at <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">developers.facebook.com</a></li>
              <li>Add the WhatsApp product and get your Phone Number ID & Access Token</li>
              <li>Configure the Webhook URL below with your Verify Token</li>
              <li>Subscribe to <code className="bg-muted px-1 rounded">messages</code> events</li>
            </ol>
            <p className="mt-2 font-medium text-foreground">Webhook URL to use in Meta:</p>
            <code className="bg-muted px-2 py-1 rounded block mt-1 break-all">{webhookUrl}</code>
            <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 mt-1">
              Full docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone Number ID</Label>
            <Input value={phoneId} onChange={e => setPhoneId(e.target.value)} placeholder="From Meta Developer Console" className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Access Token</Label>
            <Input value={token} onChange={e => setToken(e.target.value)} placeholder="WhatsApp Cloud API Access Token" className="text-xs" type="password" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Webhook Verify Token (you choose this)</Label>
            <Input value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="e.g. my_whatsapp_verify_token" className="text-xs" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving} className="text-xs">Save & Connect</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="text-xs">Cancel</Button>
          </div>
        </div>
      )}
      {!showForm && status === 'idle' && (
        <Button size="sm" variant="ghost" onClick={() => setShowForm(true)} className="text-xs text-primary px-0 h-auto">
          Show setup instructions →
        </Button>
      )}
    </IntegrationCard>
  );
}