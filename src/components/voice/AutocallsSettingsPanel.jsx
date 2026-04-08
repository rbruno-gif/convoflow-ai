import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Phone, Settings, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

export default function AutocallsSettingsPanel({ brandId }) {
  const [form, setForm] = useState({
    api_key: '',
    ai_agent_name: '',
    voice_style: 'professional',
    language: 'en-US',
    max_concurrent_calls: 10,
    inbound_enabled: true,
    outbound_enabled: true,
    callback_enabled: true,
    campaign_enabled: true,
    followup_enabled: true,
    followup_hours: 24,
    phone_numbers: [],
  });
  const [newPhone, setNewPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['autocalls-settings', brandId],
    queryFn: () => base44.entities.AutocallsSettings.filter({ brand_id: brandId }),
  });

  useEffect(() => {
    if (settings.length > 0) {
      const s = settings[0];
      setForm({
        api_key: s.api_key || '',
        ai_agent_name: s.ai_agent_name || '',
        voice_style: s.voice_style || 'professional',
        language: s.language || 'en-US',
        max_concurrent_calls: s.max_concurrent_calls || 10,
        inbound_enabled: s.inbound_enabled !== false,
        outbound_enabled: s.outbound_enabled !== false,
        callback_enabled: s.callback_enabled !== false,
        campaign_enabled: s.campaign_enabled !== false,
        followup_enabled: s.followup_enabled !== false,
        followup_hours: s.followup_hours || 24,
        phone_numbers: s.phone_numbers || [],
      });
    }
  }, [settings]);

  const addPhone = () => {
    if (!newPhone.trim()) return;
    setForm(f => ({
      ...f,
      phone_numbers: [...f.phone_numbers, { number: newPhone.trim(), is_primary: f.phone_numbers.length === 0 }],
    }));
    setNewPhone('');
  };

  const removePhone = (index) => {
    setForm(f => ({
      ...f,
      phone_numbers: f.phone_numbers.filter((_, i) => i !== index),
    }));
  };

  const save = async () => {
    const payload = {
      is_enabled: form.api_key?.length > 0,
      ...form,
    };
    if (settings.length > 0) {
      await base44.entities.AutocallsSettings.update(settings[0].id, payload);
    } else {
      await base44.entities.AutocallsSettings.create({ brand_id: brandId, ...payload });
    }
    qc.invalidateQueries({ queryKey: ['autocalls-settings', brandId] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,184,0.1)' }}>
            <Phone className="w-5 h-5 text-teal-600" />
          </div>
          <h2 className="font-bold text-gray-900">Voice Settings</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">API Key</label>
            <input
              type="password"
              value={form.api_key}
              onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
              placeholder="sk_live_..."
              className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Agent Name</label>
            <input
              value={form.ai_agent_name}
              onChange={e => setForm(f => ({ ...f, ai_agent_name: e.target.value }))}
              placeholder="e.g. Victor"
              className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Voice Style</label>
            <select
              value={form.voice_style}
              onChange={e => setForm(f => ({ ...f, voice_style: e.target.value }))}
              className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Language</label>
            <select
              value={form.language}
              onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="en-US">English (US)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Max Concurrent Calls</label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.max_concurrent_calls}
              onChange={e => setForm(f => ({ ...f, max_concurrent_calls: parseInt(e.target.value) || 10 }))}
              className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Follow-up Hours</label>
            <input
              type="number"
              min="1"
              value={form.followup_hours}
              onChange={e => setForm(f => ({ ...f, followup_hours: parseInt(e.target.value) || 24 }))}
              className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        {/* Phone Numbers */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Phone Numbers</label>
          <div className="space-y-2 mb-3">
            {form.phone_numbers.map((phone, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-700">{phone.number}</span>
                {phone.is_primary && <span className="ml-auto text-[10px] bg-teal-100 text-teal-700 px-2 py-1 rounded">Primary</span>}
                <button onClick={() => removePhone(i)} className="p-1 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              onClick={addPhone}
              className="px-4 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-medium hover:bg-teal-100 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Feature toggles */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-gray-100">
          {[
            { field: 'inbound_enabled', label: 'Inbound Calls' },
            { field: 'outbound_enabled', label: 'Outbound Calls' },
            { field: 'callback_enabled', label: 'Queue Callbacks' },
            { field: 'campaign_enabled', label: 'Campaign Calls' },
            { field: 'followup_enabled', label: 'Follow-up Calls' },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-teal-600"
              />
              <span className="text-xs text-gray-600">{label}</span>
            </label>
          ))}
        </div>

        <button
          onClick={save}
          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #14b8a6, #0891b2)' }}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}