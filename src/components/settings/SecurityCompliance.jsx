import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function SecurityCompliance({ brandId, onChangesDetected }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [initialForm, setInitialForm] = useState({});

  const { data: settings = [] } = useQuery({
    queryKey: ['brand-settings', brandId],
    queryFn: () => brandId ? base44.entities.BrandSettings.filter({ brand_id: brandId }) : base44.entities.BrandSettings.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      setInitialForm(settings[0]);
      setForm(settings[0]);
    }
  }, [settings]);

  useEffect(() => {
    onChangesDetected(JSON.stringify(form) !== JSON.stringify(initialForm));
  }, [form]);

  const save = async () => {
    if (settings.length > 0) {
      await base44.entities.BrandSettings.update(settings[0].id, form);
    } else {
      await base44.entities.BrandSettings.create({ ...form, brand_id: brandId });
    }
    qc.invalidateQueries({ queryKey: ['brand-settings', brandId] });
    setInitialForm(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Security & Compliance</h2>
        <p className="text-sm text-gray-500 mt-1">Configure authentication and data protection</p>
      </div>

      <div className="space-y-8">
        <Section title="Authentication">
          <SelectField
            label="Two-Factor Authentication"
            value={form.two_factor_authentication || 'optional'}
            options={[
              { value: 'disabled', label: 'Disabled' },
              { value: 'optional', label: 'Optional' },
              { value: 'required', label: 'Required' },
            ]}
            onChange={(value) => setForm(f => ({ ...f, two_factor_authentication: value }))}
          />
          <InputField
            label="Session Timeout (minutes)"
            type="number"
            value={form.session_timeout_minutes || 60}
            onChange={(value) => setForm(f => ({ ...f, session_timeout_minutes: Number(value) }))}
          />
        </Section>

        <Section title="Password Policy">
          <InputField
            label="Minimum Length"
            type="number"
            value={form.password_min_length || 8}
            onChange={(value) => setForm(f => ({ ...f, password_min_length: Number(value) }))}
          />
          <ToggleField
            label="Require Uppercase"
            value={form.password_require_uppercase !== false}
            onChange={(value) => setForm(f => ({ ...f, password_require_uppercase: value }))}
          />
          <ToggleField
            label="Require Numbers"
            value={form.password_require_numbers !== false}
            onChange={(value) => setForm(f => ({ ...f, password_require_numbers: value }))}
          />
        </Section>

        <Section title="Data Protection">
          <SelectField
            label="Data Residency"
            value={form.data_residency || 'us'}
            options={[
              { value: 'us', label: 'United States' },
              { value: 'eu', label: 'European Union' },
            ]}
            onChange={(value) => setForm(f => ({ ...f, data_residency: value }))}
          />
          <ToggleField
            label="PII Redaction"
            value={form.conversation_redaction_enabled !== false}
            onChange={(value) => setForm(f => ({ ...f, conversation_redaction_enabled: value }))}
            helperText="Automatically redact sensitive data"
          />
        </Section>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
          <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Compliance</p>
            <p className="text-xs text-blue-700">All changes are logged for compliance tracking.</p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-end gap-3">
        <button
          onClick={save}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save'}
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

function InputField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
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
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
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
        className={`w-12 h-7 rounded-full transition-colors shrink-0 mt-0.5 ${value ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}