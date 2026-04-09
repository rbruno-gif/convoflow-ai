import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Copy, Check, Plus, Trash2, ToggleRight, ToggleLeft, X, Webhook, Facebook, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WEBHOOK_TYPES = [
  { value: 'facebook', label: 'Facebook Messenger', icon: Facebook, desc: 'Sync messages from Facebook pages' },
];

export default function Webhooks() {
  const { activeBrandId, activeBrand } = useBrand();
  const [form, setForm] = useState(null);
  const [copied, setCopied] = useState(null);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Webhook?.filter?.({ brand_id: activeBrandId }) ?? []
      : base44.entities.Webhook?.list?.() ?? [],
  });

  const { data: facebookPages = [] } = useQuery({
    queryKey: ['facebook-pages', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.FacebookPage?.filter?.({ brand_id: activeBrandId }) ?? []
      : [],
  });

  const { data: messengerWebhooks = [] } = useQuery({
    queryKey: ['messenger-webhooks', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.MessengerWebhook?.filter?.({ brand_id: activeBrandId }) ?? []
      : [],
  });

  const generateWebhookUrl = (type) => {
    const token = crypto.randomUUID();
    const baseUrl = window.location.origin;
    
    if (type === 'facebook') {
      return {
        url: `${baseUrl}/functions/messengerWebhook?token=${token}`,
        token,
      };
    }
    return {
      url: `${baseUrl}/functions/messengerWebhook?token=${token}`,
      token,
    };
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const save = async () => {
    if (!form.type || !form.name.trim()) return;
    setSaving(true);
    const { url, token } = generateWebhookUrl(form.type);
    const payload = {
      brand_id: activeBrandId,
      name: form.name,
      type: form.type,
      webhook_url: url,
      webhook_token: token,
      facebook_page_id: form.facebook_page_id || null,
      agent_reply_zapier_url: form.agent_reply_zapier_url || '',
      is_active: true,
    };
    
    if (form.id) {
      await base44.entities.Webhook?.update?.(form.id, payload);
    } else {
      await base44.entities.Webhook?.create?.(payload);
    }
    qc.invalidateQueries({ queryKey: ['webhooks', activeBrandId] });
    setForm(null);
    setSaving(false);
  };

  const saveMessengerConfig = async () => {
    if (!form.messenger_id) return;
    setSaving(true);
    const payload = {
      agent_reply_zapier_url: form.agent_reply_zapier_url || '',
    };
    await base44.entities.MessengerWebhook?.update?.(form.messenger_id, payload);
    qc.invalidateQueries({ queryKey: ['messenger-webhooks', activeBrandId] });
    setForm(null);
    setSaving(false);
  };

  const del = async (id) => {
    await base44.entities.Webhook?.delete?.(id);
    qc.invalidateQueries({ queryKey: ['webhooks', activeBrandId] });
  };

  const toggle = async (webhook) => {
    await base44.entities.Webhook?.update?.(webhook.id, { is_active: !webhook.is_active });
    qc.invalidateQueries({ queryKey: ['webhooks', activeBrandId] });
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-violet-600" /> Webhooks
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeBrand?.name || 'All brands'} · Integrate with external services</p>
        </div>
        <Button size="sm" onClick={() => setForm({ name: '', type: '', facebook_page_id: '', agent_reply_zapier_url: '' })}>
          <Plus className="w-3.5 h-3.5 mr-1" /> New Webhook
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">Facebook Messenger</p>
          <p className="text-xs text-blue-700">Automatically receive messages from your connected Facebook pages.</p>
        </div>
      </div>

      {/* Facebook Messenger Webhooks */}
      {activeBrandId && messengerWebhooks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Facebook Messenger Configuration</h2>
          <div className="space-y-3">
            {messengerWebhooks.map(webhook => (
              <div key={webhook.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{webhook.facebook_page_name || 'Facebook Page'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Page ID: {webhook.facebook_page_id}</p>
                    {webhook.agent_reply_zapier_url && (
                      <p className="text-xs text-green-700 mt-1.5 bg-green-50 px-2 py-1 rounded inline-block">✓ Zapier URL configured</p>
                    )}
                    {!webhook.agent_reply_zapier_url && (
                      <p className="text-xs text-orange-700 mt-1.5 bg-orange-50 px-2 py-1 rounded inline-block">⚠ Zapier URL not configured</p>
                    )}
                  </div>
                  <button
                    onClick={() => setForm({
                      messenger_id: webhook.id,
                      page_name: webhook.facebook_page_name,
                      webhook_url: `${window.location.origin}/functions/messengerWebhook`,
                      agent_reply_zapier_url: webhook.agent_reply_zapier_url || '',
                    })}
                    className="p-2 hover:bg-gray-100 rounded-lg shrink-0"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="space-y-3">
        {webhooks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Webhook className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-500">No webhooks configured</p>
            <p className="text-sm text-gray-400 mt-1">Create your first webhook to enable integrations</p>
          </div>
        )}
        {webhooks.map(webhook => {
          const typeConfig = WEBHOOK_TYPES.find(t => t.value === webhook.type);
          const Icon = typeConfig?.icon;
          return (
            <div key={webhook.id} className={`bg-white rounded-xl border p-4 shadow-sm flex items-start gap-4 ${!webhook.is_active ? 'opacity-60' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                {Icon && <Icon className="w-4 h-4 text-violet-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-gray-900">{webhook.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                    {typeConfig?.label}
                  </span>
                  {!webhook.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono truncate flex-1">
                    {webhook.webhook_url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(webhook.webhook_url, webhook.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg shrink-0"
                  >
                    {copied === webhook.id ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggle(webhook)}>
                  {webhook.is_active ? (
                    <ToggleRight className="w-6 h-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-300" />
                  )}
                </button>
                <button onClick={() => del(webhook.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Webhook Form Modal */}
      {form && !form.messenger_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Webhook</h2>
              <button onClick={() => setForm(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Webhook Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="">Select a type...</option>
                  {WEBHOOK_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Main Facebook Page" 
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              {form.type === 'facebook' && facebookPages.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Facebook Page</label>
                  <select value={form.facebook_page_id || ''} onChange={e => setForm(f => ({ ...f, facebook_page_id: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                    <option value="">Select a page...</option>
                    {facebookPages.map(page => (
                      <option key={page.id} value={page.id}>{page.page_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.type && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Webhook URL (copy to external service):</p>
                  <code className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 block font-mono break-all">
                    {generateWebhookUrl(form.type).url}
                  </code>
                </div>
              )}


            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">
                Cancel
              </button>
              <button onClick={save} disabled={saving || !form.type || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {saving ? 'Creating…' : 'Create Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Messenger Edit Modal */}
      {form?.messenger_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Edit Facebook Messenger</h2>
              <button onClick={() => setForm(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Page Name</label>
                <input value={form.page_name || ''} disabled
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-600" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Webhook URL (read-only)</label>
                <code className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 block font-mono break-all text-gray-600">
                  {form.webhook_url}
                </code>
              </div>

            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setForm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">
                Cancel
              </button>
              <button onClick={saveMessengerConfig} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}