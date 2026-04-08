import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Copy, Eye, EyeOff, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import NewWebhookPanel from './NewWebhookPanel';

export default function FacebookMessengerWebhooks() {
  const { activeBrandId, activeBrand } = useBrand();
  const [showNewPanel, setShowNewPanel] = useState(false);
  const [expandedWebhook, setExpandedWebhook] = useState(null);
  const [revealedTokens, setRevealedTokens] = useState({});
  const qc = useQueryClient();

  const { data: webhooks = [] } = useQuery({
    queryKey: ['messenger-webhooks', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.MessengerWebhook.filter({ brand_id: activeBrandId }, '-created_date')
      : [],
    enabled: !!activeBrandId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Department.filter({ brand_id: activeBrandId }, 'name')
      : [],
    enabled: !!activeBrandId,
  });

  const handleToggleActive = async (webhook) => {
    await base44.entities.MessengerWebhook.update(webhook.id, {
      is_active: !webhook.is_active,
    });
    qc.invalidateQueries({ queryKey: ['messenger-webhooks', activeBrandId] });
  };

  const handleDelete = async (webhookId) => {
    if (!confirm('Delete this webhook? Messages from this Facebook page will no longer be received.')) return;
    await base44.entities.MessengerWebhook.delete(webhookId);
    qc.invalidateQueries({ queryKey: ['messenger-webhooks', activeBrandId] });
  };

  const handleRegenerateToken = async (webhook) => {
    if (!confirm('Regenerate token? You will need to update your Zapier workflow with the new URL.')) return;
    
    const newToken = crypto.randomUUID();
    const appDomain = window.location.origin;
    const newUrl = `${appDomain}/api/functions/messengerWebhookHandler?brand=${activeBrand.slug}&token=${newToken}`;
    
    await base44.entities.MessengerWebhook.update(webhook.id, {
      webhook_token: newToken,
      webhook_url: newUrl,
    });
    
    qc.invalidateQueries({ queryKey: ['messenger-webhooks', activeBrandId] });
    setRevealedTokens(prev => ({ ...prev, [webhook.id]: false }));
  };

  const getDepartmentName = (deptId) => {
    return departments.find(d => d.id === deptId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Facebook Messenger</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your Facebook Messenger pages to receive and reply to messages. Each connection generates a unique webhook URL for Zapier.
          </p>
        </div>
        <Button onClick={() => setShowNewPanel(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Connection
        </Button>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <p className="text-muted-foreground">No Facebook Messenger connections yet.</p>
            <Button onClick={() => setShowNewPanel(true)} variant="outline" className="mt-4">
              Create First Connection
            </Button>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Card Header */}
              <div className="p-4 bg-background flex items-start justify-between cursor-pointer hover:bg-muted/50" 
                onClick={() => setExpandedWebhook(expandedWebhook === webhook.id ? null : webhook.id)}>
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                    f
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{webhook.facebook_page_name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Page ID: {webhook.facebook_page_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    webhook.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {webhook.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedWebhook === webhook.id && (
                <div className="p-4 border-t border-border space-y-4">
                  {/* Webhook URL */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Webhook URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhook.webhook_url}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border font-mono text-xs"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(webhook.webhook_url);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Copy this URL to your Zapier webhook action.</p>
                  </div>

                  {/* Webhook Token */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Webhook Token</label>
                    <div className="flex gap-2">
                      <input
                        type={revealedTokens[webhook.id] ? 'text' : 'password'}
                        value={webhook.webhook_token}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border font-mono text-xs"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setRevealedTokens(prev => ({ ...prev, [webhook.id]: !prev[webhook.id] }))}
                      >
                        {revealedTokens[webhook.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Routed to Department</label>
                    <p className="text-sm text-foreground">{getDepartmentName(webhook.department_id)}</p>
                  </div>

                  {/* Allowed Senders */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Allowed Sender IDs</label>
                    <p className="text-sm text-foreground">
                      {webhook.allowed_sender_ids && webhook.allowed_sender_ids.length > 0
                        ? webhook.allowed_sender_ids.join(', ')
                        : 'All senders accepted'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Last Triggered</p>
                      <p className="text-sm font-medium text-foreground">
                        {webhook.last_triggered_at
                          ? formatDistanceToNow(new Date(webhook.last_triggered_at), { addSuffix: true })
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Messages</p>
                      <p className="text-sm font-medium text-foreground">{webhook.total_messages_received || 0}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant={webhook.is_active ? 'outline' : 'default'}
                      onClick={() => handleToggleActive(webhook)}
                      className="flex-1"
                    >
                      {webhook.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRegenerateToken(webhook)}
                      className="gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Regenerate Token
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Webhook Panel */}
      {showNewPanel && (
        <NewWebhookPanel
          brandId={activeBrandId}
          brandSlug={activeBrand?.slug}
          departments={departments}
          onClose={() => setShowNewPanel(false)}
          onSuccess={() => {
            setShowNewPanel(false);
            qc.invalidateQueries({ queryKey: ['messenger-webhooks', activeBrandId] });
          }}
        />
      )}
    </div>
  );
}