import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, Copy, CheckCircle, Eye, EyeOff, Key, GitBranch } from 'lucide-react';

const WEBHOOK_EVENTS = [
  'conversation_created', 'ticket_created', 'ticket_updated', 'ticket_resolved',
  'agent_assigned', 'sla_breached', 'call_ended', 'message_received', 'csat_submitted'
];

export default function APIWebhooks({ brandId, onChangesDetected }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState('api-keys');
  const [editingKey, setEditingKey] = useState(null);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState('');

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys', brandId],
    queryFn: () => brandId
      ? base44.entities.APIKey.filter({ brand_id: brandId })
      : base44.entities.APIKey.list(),
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks', brandId],
    queryFn: () => brandId
      ? base44.entities.Webhook.filter({ brand_id: brandId })
      : base44.entities.Webhook.list(),
  });

  const handleSaveAPIKey = async (keyData) => {
    const payload = { ...keyData, brand_id: brandId };
    if (editingKey) {
      await base44.entities.APIKey.update(editingKey.id, payload);
    } else {
      await base44.entities.APIKey.create(payload);
    }
    qc.invalidateQueries({ queryKey: ['api-keys', brandId] });
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowKeyForm(false); setEditingKey(null); }, 1500);
  };

  const handleSaveWebhook = async (webhookData) => {
    const payload = { ...webhookData, brand_id: brandId };
    if (editingWebhook) {
      await base44.entities.Webhook.update(editingWebhook.id, payload);
    } else {
      await base44.entities.Webhook.create(payload);
    }
    qc.invalidateQueries({ queryKey: ['webhooks', brandId] });
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowWebhookForm(false); setEditingWebhook(null); }, 1500);
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">API & Webhooks</h2>
        <p className="text-sm text-gray-500 mt-1">Manage API keys, webhooks, and third-party integrations</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setTab('api-keys')}
          className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
            tab === 'api-keys' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Key className="w-4 h-4" /> API Keys ({apiKeys.length})
        </button>
        <button
          onClick={() => setTab('webhooks')}
          className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm border-b-2 transition-colors ${
            tab === 'webhooks' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <GitBranch className="w-4 h-4" /> Webhooks ({webhooks.length})
        </button>
      </div>

      {/* API Keys Section */}
      {tab === 'api-keys' && (
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowKeyForm(true); setEditingKey(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              <Plus className="w-4 h-4" /> Generate API Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>No API keys yet. Generate your first one.</p>
            </div>
          ) : (
            apiKeys.map(key => (
              <APIKeyRow
                key={key.id}
                apiKey={key}
                onEdit={() => { setEditingKey(key); setShowKeyForm(true); }}
                onDelete={() => {
                  base44.entities.APIKey.delete(key.id);
                  qc.invalidateQueries({ queryKey: ['api-keys', brandId] });
                }}
                copied={copied}
                onCopy={(id) => {
                  navigator.clipboard.writeText(`sk_...${key.key_last_4}`);
                  setCopied(id);
                  setTimeout(() => setCopied(''), 2000);
                }}
              />
            ))
          )}

          {showKeyForm && (
            <APIKeyFormModal
              apiKey={editingKey}
              onSave={handleSaveAPIKey}
              onClose={() => { setShowKeyForm(false); setEditingKey(null); }}
              saved={saved}
            />
          )}
        </div>
      )}

      {/* Webhooks Section */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowWebhookForm(true); setEditingWebhook(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
            >
              <Plus className="w-4 h-4" /> Add Webhook
            </button>
          </div>

          {webhooks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>No webhooks configured. Add one to receive event notifications.</p>
            </div>
          ) : (
            webhooks.map(webhook => (
              <WebhookRow
                key={webhook.id}
                webhook={webhook}
                onEdit={() => { setEditingWebhook(webhook); setShowWebhookForm(true); }}
                onDelete={() => {
                  base44.entities.Webhook.delete(webhook.id);
                  qc.invalidateQueries({ queryKey: ['webhooks', brandId] });
                }}
              />
            ))
          )}

          {showWebhookForm && (
            <WebhookFormModal
              webhook={editingWebhook}
              onSave={handleSaveWebhook}
              onClose={() => { setShowWebhookForm(false); setEditingWebhook(null); }}
              saved={saved}
            />
          )}
        </div>
      )}
    </div>
  );
}

function APIKeyRow({ apiKey, onEdit, onDelete, copied, onCopy }) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
        <div className="flex items-center gap-3 mt-2">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
            {showSecret ? `sk_...${apiKey.key_last_4}` : `sk_••••••••${apiKey.key_last_4}`}
          </code>
          <button
            onClick={() => setShowSecret(!showSecret)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {showSecret ? <EyeOff className="w-3 h-3 text-gray-400" /> : <Eye className="w-3 h-3 text-gray-400" />}
          </button>
          <button
            onClick={() => onCopy(apiKey.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Copy className={`w-3 h-3 ${copied === apiKey.id ? 'text-green-500' : 'text-gray-400'}`} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Scope: <span className="font-semibold capitalize">{apiKey.scope}</span> • Created: {new Date(apiKey.created_date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg">
          <Edit2 className="w-4 h-4 text-gray-400" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

function APIKeyFormModal({ apiKey, onSave, onClose, saved }) {
  const [form, setForm] = useState(
    apiKey ? { name: apiKey.name, scope: apiKey.scope, rate_limit_per_minute: apiKey.rate_limit_per_minute }
      : { name: '', scope: 'read_only', rate_limit_per_minute: 60 }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{apiKey ? 'Edit' : 'Generate'} API Key</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Key Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Mobile App Integration"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Scope</label>
            <select
              value={form.scope}
              onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="read_only">Read Only</option>
              <option value="read_write">Read & Write</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Rate Limit (calls/minute)</label>
            <input
              type="number"
              value={form.rate_limit_per_minute}
              onChange={e => setForm(f => ({ ...f, rate_limit_per_minute: Number(e.target.value) }))}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save Key'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WebhookRow({ webhook, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600 mt-1 inline-block truncate">{webhook.url}</code>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg">
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {(webhook.events || []).map(event => (
          <span key={event} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
            {event.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}

function WebhookFormModal({ webhook, onSave, onClose, saved }) {
  const [form, setForm] = useState(
    webhook ? { name: webhook.name, url: webhook.url, secret: webhook.secret, events: webhook.events || [] }
      : { name: '', url: '', secret: '', events: [] }
  );

  const handleEventToggle = (event) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter(e => e !== event)
        : [...f.events, event]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{webhook ? 'Edit' : 'Add'} Webhook</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Webhook Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Ticket Sync Service"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Webhook URL</label>
            <input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://your-api.com/webhooks/tickets"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Secret (for HMAC signature verification)</label>
            <input
              value={form.secret}
              onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
              placeholder="Generate a random secret string"
              type="password"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-3">Events to Subscribe To</p>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map(event => (
                <label key={event} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.events.includes(event)}
                    onChange={() => handleEventToggle(event)}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <span className="text-xs text-gray-600 capitalize">{event.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save Webhook'}
          </button>
        </div>
      </div>
    </div>
  );
}