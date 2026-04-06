import { useState, useEffect } from 'react';
import { Mail, Check, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function GmailIntegration() {
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | error
  const [email, setEmail] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('gmailSync', { test: true });
      if (res.data?.connected) {
        setStatus('connected');
        setEmail(res.data.email);
      }
    } catch {
      setStatus('idle');
    }
    setSyncing(false);
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleConnect = async () => {
    setStatus('connecting');
    // Request OAuth — the user will be redirected and come back
    toast({
      title: 'Connecting Gmail…',
      description: 'You will be redirected to authorize your Gmail account.',
    });
    // Trigger OAuth via the base44 shared connector flow
    // This calls the platform's OAuth redirect for gmail
    window.location.href = `${window.location.origin}/api/connectors/gmail/authorize?redirect=${encodeURIComponent(window.location.href)}`;
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('gmailSync', {});
      toast({ title: `Synced ${res.data?.synced ?? 0} new email(s) to inbox` });
    } catch (e) {
      toast({ title: 'Sync failed', description: e.message, variant: 'destructive' });
    }
    setSyncing(false);
  };

  return (
    <IntegrationCard
      icon={Mail}
      iconBg="bg-red-100 text-red-600"
      title="Gmail / Email"
      description="Sync incoming emails as conversations in your inbox."
      status={status}
      connectedLabel={email ? `Connected: ${email}` : 'Connected'}
      onConnect={handleConnect}
      onSync={handleSync}
      syncing={syncing}
      connectLabel="Connect Gmail"
      connecting={status === 'connecting'}
      note="Uses OAuth — you'll authorize access to your Gmail inbox."
    />
  );
}

export function IntegrationCard({
  icon: Icon, iconBg, title, description, status, connectedLabel,
  onConnect, onDisconnect, onSync, syncing, connectLabel, connecting, note, children
}) {
  const connected = status === 'connected';
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-sm">{title}</p>
              {connected && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Connected
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            {connected && connectedLabel && (
              <p className="text-xs text-muted-foreground mt-1">{connectedLabel}</p>
            )}
            {note && !connected && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic">{note}</p>
            )}
            {children && <div className="mt-3">{children}</div>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {connected && onSync && (
              <Button variant="outline" size="sm" onClick={onSync} disabled={syncing} className="text-xs gap-1.5">
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Sync Now
              </Button>
            )}
            {!connected ? (
              <Button size="sm" onClick={onConnect} disabled={connecting} className="text-xs gap-1.5">
                {connecting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {connecting ? 'Connecting…' : connectLabel}
              </Button>
            ) : (
              onDisconnect && (
                <Button variant="outline" size="sm" onClick={onDisconnect} className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5">
                  Disconnect
                </Button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}