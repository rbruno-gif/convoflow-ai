import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Phone, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function VoiceSettingsPanel({ brandId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [initialForm, setInitialForm] = useState({});

  const { data: settings = [] } = useQuery({
    queryKey: ['voice-settings', brandId],
    queryFn: () => brandId ? base44.entities.VoiceSettings.filter({ brand_id: brandId }) : [],
  });

  useEffect(() => {
    if (settings.length > 0) {
      setInitialForm(settings[0]);
      setForm(settings[0]);
    } else {
      setForm({ brand_id: brandId, is_enabled: false, phone_numbers: [] });
    }
  }, [settings]);

  const save = async () => {
    if (settings.length > 0) {
      await base44.entities.VoiceSettings.update(settings[0].id, form);
    } else {
      await base44.entities.VoiceSettings.create(form);
    }
    qc.invalidateQueries({ queryKey: ['voice-settings', brandId] });
    setInitialForm(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Voice Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure Autocalls.ai integration and AI voice agent</p>
      </div>

      <Section title="Enable Voice Module">
        <ToggleField
          label="Voice Calling Enabled"
          value={form.is_enabled || false}
          onChange={(v) => setForm(f => ({ ...f, is_enabled: v }))}
          helperText="Enable inbound, outbound, and all voice workflows for this brand"
        />
      </Section>

      {form.is_enabled && (
        <>
          <Section title="Autocalls API Configuration">
            <InputField
              label="API Key"
              type="password"
              value={form.autocalls_api_key || ''}
              onChange={(v) => setForm(f => ({ ...f, autocalls_api_key: v }))}
              placeholder="sk_live_xxxxx"
            />
            <InputField
              label="Webhook URL"
              type="url"
              value={form.webhook_url || ''}
              onChange={(v) => setForm(f => ({ ...f, webhook_url: v }))}
              placeholder="https://your-app.com/webhooks/autocalls"
            />
          </Section>

          <Section title="AI Voice Agent Configuration">
            <InputField
              label="Agent Name"
              value={form.ai_agent_name || ''}
              onChange={(v) => setForm(f => ({ ...f, ai_agent_name: v }))}
              placeholder="e.g. Sarah, Alex"
            />
            <SelectField
              label="Voice Style"
              value={form.ai_voice_style || 'professional'}
              options={[
                { value: 'professional', label: 'Professional' },
                { value: 'friendly', label: 'Friendly' },
                { value: 'formal', label: 'Formal' }
              ]}
              onChange={(v) => setForm(f => ({ ...f, ai_voice_style: v }))}
            />
            <SelectField
              label="Language & Accent"
              value={form.ai_language || 'en-US'}
              options={[
                { value: 'en-US', label: 'English (US)' },
                { value: 'en-GB', label: 'English (UK)' },
                { value: 'es-ES', label: 'Spanish' },
                { value: 'fr-FR', label: 'French' }
              ]}
              onChange={(v) => setForm(f => ({ ...f, ai_language: v }))}
            />
            <TextareaField
              label="Custom Instructions"
              value={form.ai_instructions || ''}
              onChange={(v) => setForm(f => ({ ...f, ai_instructions: v }))}
              rows={4}
              placeholder="e.g. Always be polite and professional. Ask clarifying questions..."
            />
          </Section>

          <Section title="Phone Numbers">
            <div className="space-y-3">
              {(form.phone_numbers || []).map((phone, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="tel"
                    value={phone.number}
                    onChange={(e) => {
                      const updated = [...(form.phone_numbers || [])];
                      updated[idx].number = e.target.value;
                      setForm(f => ({ ...f, phone_numbers: updated }));
                    }}
                    className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2.5"
                    placeholder="+1 (555) 123-4567"
                  />
                  <button
                    onClick={() => {
                      const updated = (form.phone_numbers || []).filter((_, i) => i !== idx);
                      setForm(f => ({ ...f, phone_numbers: updated }));
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setForm(f => ({ ...f, phone_numbers: [...(f.phone_numbers || []), { number: '' }] }))}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" /> Add Phone Number
              </button>
            </div>
          </Section>

          <Section title="Calling Hours & Compliance">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Calling Hours Start"
                type="time"
                value={form.calling_hours_start || '09:00'}
                onChange={(v) => setForm(f => ({ ...f, calling_hours_start: v }))}
              />
              <InputField
                label="Calling Hours End"
                type="time"
                value={form.calling_hours_end || '21:00'}
                onChange={(v) => setForm(f => ({ ...f, calling_hours_end: v }))}
              />
            </div>
            <ToggleField
              label="TCPA Compliance (US)"
              value={form.tcpa_compliance_enabled !== false}
              onChange={(v) => setForm(f => ({ ...f, tcpa_compliance_enabled: v }))}
              helperText="Restrict outbound calls to 8am-9pm local time"
            />
            <InputField
              label="Max Concurrent Calls"
              type="number"
              value={form.max_concurrent_calls || 10}
              onChange={(v) => setForm(f => ({ ...f, max_concurrent_calls: Number(v) }))}
            />
          </Section>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Webhook Security</p>
              <p className="text-blue-700 mt-1">Ensure your webhook endpoint validates the <code className="bg-white px-1 rounded">X-Autocalls-Signature</code> header.</p>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={save}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3, placeholder = '' }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
      />
    </div>
  );
}

function ToggleField({ label, value, onChange, helperText }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full transition-colors shrink-0 mt-0.5 ${value ? 'bg-teal-500' : 'bg-gray-300'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}