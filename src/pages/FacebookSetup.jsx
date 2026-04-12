import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Copy, Check, ExternalLink, CheckCircle, Circle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WEBHOOK_URL = 'https://caped-smart-chat-pulse.base44.app/api/functions/metaWebhook';

function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <span className={`flex-1 text-sm text-gray-800 break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
        <button onClick={copy} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
    </div>
  );
}

function Step({ number, title, children, done }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-violet-600 text-white'}`}>
          {done ? <CheckCircle className="w-4 h-4" /> : number}
        </div>
        <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
      </div>
      <div className="flex-1 pb-8">
        <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function FacebookSetup() {
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeResult, setSubscribeResult] = useState(null);

  const { data: pages = [] } = useQuery({
    queryKey: ['facebook-pages-setup'],
    queryFn: () => base44.entities.FacebookPage.filter({ is_active: true }),
  });

  const subscribePages = async () => {
    setSubscribing(true);
    try {
      const res = await base44.functions.invoke('subscribePageToApp', {});
      setSubscribeResult(res.data);
    } catch (e) {
      setSubscribeResult({ error: e.message });
    }
    setSubscribing(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Facebook Messenger Setup</h1>
        <p className="text-gray-500 mt-1">Follow these steps to connect your Facebook Page to the inbox.</p>
      </div>

      <div className="space-y-0">
        {/* Step 1 */}
        <Step number={1} title="Open Meta Developer Console">
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: '#1877F2' }}
          >
            <ExternalLink className="w-4 h-4" /> Open Meta for Developers
          </a>
          <p className="text-sm text-gray-500 mt-2">Select your app → go to <strong>Messenger → Settings</strong></p>
        </Step>

        {/* Step 2 */}
        <Step number={2} title="Configure the Webhook">
          <p className="text-sm text-gray-500 mb-3">
            Under <strong>Webhooks</strong>, click <strong>Add Callback URL</strong> and enter:
          </p>
          <div className="space-y-3">
            <CopyField label="Callback URL" value={WEBHOOK_URL} />
            {pages.length > 0 && (
              <CopyField label="Verify Token" value={pages[0].verify_token || 's201uog9d8'} />
            )}
            {pages.length === 0 && (
              <CopyField label="Verify Token" value="s201uog9d8" />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-3">Click <strong>Verify and Save</strong>.</p>
        </Step>

        {/* Step 3 */}
        <Step number={3} title="Subscribe to Webhook Fields">
          <p className="text-sm text-gray-500 mb-3">
            After verifying, click <strong>Add Subscriptions</strong> and check these fields:
          </p>
          <div className="flex flex-wrap gap-2">
            {['messages', 'messaging_postbacks', 'message_deliveries', 'message_reads'].map(f => (
              <div key={f} className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5 text-sm font-mono text-violet-700">
                <CheckCircle className="w-3.5 h-3.5" /> {f}
              </div>
            ))}
          </div>
        </Step>

        {/* Step 4 */}
        <Step number={4} title="Subscribe Your Pages to the App">
          <p className="text-sm text-gray-500 mb-3">
            Click the button below to subscribe your connected Facebook pages to start receiving messages.
          </p>

          {pages.length > 0 && (
            <div className="mb-3 space-y-2">
              {pages.map(page => (
                <div key={page.id} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {page.page_name?.[0] || 'P'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{page.page_name}</p>
                    <p className="text-xs text-gray-500 font-mono">ID: {page.page_id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={subscribePages} disabled={subscribing} className="gap-2">
            {subscribing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {subscribing ? 'Subscribing...' : 'Subscribe Pages to App'}
          </Button>

          {subscribeResult && (
            <div className={`mt-3 rounded-xl p-3 text-sm ${subscribeResult.error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              {subscribeResult.error ? (
                <p>❌ Error: {subscribeResult.error}</p>
              ) : (
                <div>
                  <p className="font-semibold mb-1">✅ Subscribed successfully!</p>
                  {(subscribeResult.results || []).map(r => (
                    <p key={r.page_id} className="text-xs">{r.page_name}: {r.body?.success ? '✓ Active' : JSON.stringify(r.body)}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </Step>

        {/* Step 5 */}
        <Step number={5} title="Test It!">
          <p className="text-sm text-gray-500 mb-3">
            Send a message to your Facebook page. It should appear in the inbox within seconds.
          </p>
          <a
            href="/inbox"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            Go to Inbox →
          </a>
        </Step>
      </div>
    </div>
  );
}