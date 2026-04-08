import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { X, Copy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function NewWebhookPanel({ onClose, onSuccess }) {
  const { activeBrandId, activeBrand } = useBrand();
  const [step, setStep] = useState('form'); // form, success
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageId, setPageId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [allowedSenders, setAllowedSenders] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyMessage, setAutoReplyMessage] = useState('Thanks for your message! An agent will be with you shortly.');
  const [error, setError] = useState('');

  // Fetch departments for the active brand
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Department.filter({ brand_id: activeBrandId }, 'name')
      : [],
    enabled: !!activeBrandId,
  });

  // Auto-set first department when departments load
  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  const handleCreate = async () => {
    setError('');
    
    if (!activeBrandId) {
      setError('Brand is required. Please select a brand from the brand switcher.');
      return;
    }

    if (!pageName.trim() || !pageId.trim()) {
      setError('Page name and page ID are required');
      return;
    }

    if (!departmentId) {
      setError('Department is required');
      return;
    }

    setLoading(true);
    try {
      const webhookToken = crypto.randomUUID();
      const productionDomain = 'https://caped-smart-chat-pulse.base44.app';
      const fullWebhookUrl = `${productionDomain}/api/functions/messengerWebhook?brand=${activeBrand.slug}&token=${webhookToken}`;

      const allowedSenderList = allowedSenders
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const departmentName = departments.find(d => d.id === departmentId)?.name || '';

      const webhook = await base44.entities.MessengerWebhook.create({
        brand_id: activeBrandId,
        webhook_token: webhookToken,
        webhook_url: fullWebhookUrl,
        facebook_page_id: pageId,
        facebook_page_name: pageName,
        department_id: departmentId,
        department_name: departmentName,
        allowed_sender_ids: allowedSenderList,
        auto_reply_enabled: autoReplyEnabled,
        auto_reply_message: autoReplyMessage,
        is_active: true,
        total_messages_received: 0,
      });

      setWebhookUrl(fullWebhookUrl);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
            <h2 className="text-xl font-bold">Webhook Created!</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Step 1: Webhook URL */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Step 1: Copy Your Webhook URL</h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border font-mono text-xs"
                />
                <Button
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    alert('Webhook URL copied to clipboard!');
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Keep this URL safe and secure. It acts as your API key.</p>
            </div>

            {/* Zapier Setup */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-foreground mb-4">Step 2: Set Up Your Zapier Zap</h3>
              <ol className="space-y-3 text-sm">
                <li><strong>Step 1:</strong> Create a new Zap in Zapier</li>
                <li><strong>Step 2:</strong> Trigger → Facebook Messenger → New Message → select your {pageName} page</li>
                <li><strong>Step 3 (Optional):</strong> Add Filter → "Sender ID" exactly matches your target sender ID (or skip to accept all messages)</li>
                <li>
                  <strong>Step 4:</strong> Action → Webhooks by Zapier → POST
                  <div className="mt-2 bg-white rounded p-3 font-mono text-xs space-y-2">
                    <div><strong>URL:</strong></div>
                    <div className="text-muted-foreground truncate">{webhookUrl}</div>
                    <div className="mt-2"><strong>Payload Type:</strong> JSON</div>
                    <div className="mt-2"><strong>Data:</strong></div>
                    <div className="text-muted-foreground">
                      from: {`{{sender_id}}`}<br/>
                      body: {`{{message_text}}`}<br/>
                      profile_name: {`{{sender_name}}`}
                    </div>
                  </div>
                </li>
                <li>
                  <strong>Step 5:</strong> Action → Facebook Messenger → Send Message
                  <div className="mt-2 space-y-1 text-xs">
                    <div><strong>Recipient:</strong> {`{{sender_id from Step 2}}`}</div>
                    <div><strong>Message:</strong> {`{{response from Step 4}}`}</div>
                  </div>
                </li>
                <li><strong>Step 6:</strong> Turn on your Zap</li>
              </ol>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button onClick={onClose} className="flex-1">Done</Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  alert('URL copied!');
                }}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy URL Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-card w-full max-w-md rounded-t-xl shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Add Facebook Messenger Connection</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form Fields */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Facebook Page Name</label>
          <Input
            placeholder="e.g. U2C Mobile"
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Facebook Page ID</label>
          <Input
            placeholder="e.g. 338980205971809"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Route Messages to Department</label>
          {departments.length === 0 ? (
            <div className="px-3 py-2 text-sm bg-muted rounded-lg border border-border text-muted-foreground">
              No departments found — create departments first in Settings
            </div>
          ) : (
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background rounded-lg border border-border"
            >
              <option value="">Select a department...</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Allowed Sender IDs (Optional)</label>
          <Input
            placeholder="Leave blank to accept all senders. Or enter comma-separated IDs: 123456,789012"
            value={allowedSenders}
            onChange={(e) => setAllowedSenders(e.target.value)}
            className="text-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">Leave empty to accept messages from all Facebook users.</p>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoReplyEnabled}
              onChange={(e) => setAutoReplyEnabled(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Enable auto-reply when AI cannot answer</span>
          </label>
        </div>

        {autoReplyEnabled && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Auto-Reply Message</label>
            <Textarea
              value={autoReplyMessage}
              onChange={(e) => setAutoReplyMessage(e.target.value)}
              placeholder="Message to send when AI cannot answer..."
              className="h-20 text-sm"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Generate Webhook'}
          </Button>
        </div>
      </div>
    </div>
  );
}