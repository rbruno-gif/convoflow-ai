import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SecurityCompliance({ brandId, onChangesDetected }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [initialForm, setInitialForm] = useState({});

  const { data: settings = [] } = useQuery({
    queryKey: ['brand-settings', brandId],
    queryFn: () => brandId
      ? base44.entities.BrandSettings.filter({ brand_id: brandId })
      : base44.entities.BrandSettings.list(),
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
        <p className="text-sm text-gray-500 mt-1">Configure authentication, data protection, and compliance settings</p>
      </div>

      <div className="space-y-8">
        {/* Authentication */}
        <Section title="Authentication">
          <SelectField
            label="Two-Factor Authentication"
            value={form.two_factor_authentication || 'optional'}
            options={[
              { value: 'disabled', label: 'Disabled' },
              { value: 'optional', label: 'Optional' },
              { value: 'required', label: 'Required for All' },
              { value: 'roles_only', label: 'Required for Specific Roles' },
            ]}
            onChange={(value) => setForm(f => ({ ...f, two_factor_authentication: value }))}
          />
          <InputField
            label="Session Timeout (minutes)"
            type="number"
            value={form.session_timeout_minutes || 60}
            onChange={(value) => setForm(f => ({ ...f, session_timeout_minutes: Number(value) }))}
          />
          <ToggleField
            label="Enable Single Sign-On (SSO)"
            value={form.sso_enabled || false}
            onChange={(value) => setForm(f => ({ ...f, sso_enabled: value }))}
            helperText="Configure SAML or OAuth provider"
          />
          {form.sso_enabled && (
            <SelectField
              label="SSO Provider"
              value={form.sso_provider || ''}
              options={[
                { value: 'saml', label: 'SAML' },
                { value: 'oauth_google', label: 'Google Workspace' },
                { value: 'oauth_microsoft', label: 'Microsoft Entra' },
                { value: 'oauth_okta', label: 'Okta' },
              ]}
              onChange={(value) => setForm(f => ({ ...f, sso_provider: value }))}
            />
          )}
        </Section>

        {/* Password Policy */}
        <Section title="Password Policy">
          <InputField
            label="Minimum Length"
            type="number"
            value={form.password_min_length || 8}
            onChange={(value) => setForm(f => ({ ...f, password_min_length: Number(value) }))}
          />
          <ToggleField
            label="Require Uppercase Letters"
            value={form.password_require_uppercase || true}
            onChange={(value) => setForm(f => ({ ...f, password_require_uppercase: value }))}
          />
          <ToggleField
            label="Require Numbers"
            value={form.password_require_numbers || true}
            onChange={(value) => setForm(f => ({ ...f, password_require_numbers: value }))}
          />
          <ToggleField
            label="Require Special Characters"
            value={form.password_require_special_chars || false}
            onChange={(value) => setForm(f => ({ ...f, password_require_special_chars: value }))}
          />
          <InputField
            label="Password Expiry (days, blank = no expiry)"
            type="number"
            value={form.password_expiry_days || ''}
            onChange={(value) => setForm(f => ({ ...f, password_expiry_days: value ? Number(value) : null }))}
          />
          <InputField
            label="Prevent Reuse of Last N Passwords"
            type="number"
            value={form.password_prevent_reuse || 3}
            onChange={(value) => setForm(f => ({ ...f, password_prevent_reuse: Number(value) }))}
          />
        </Section>

        {/* Login Attempt Limits */}
        <Section title="Login Security">
          <InputField
            label="Failed Login Attempts Before Lockout"
            type="number"
            value={form.login_attempt_limit || 5}
            onChange={(value) => setForm(f => ({ ...f, login_attempt_limit: Number(value) }))}
          />
          <InputField
            label="Lockout Duration (minutes)"
            type="number"
            value={form.login_lockout_duration_minutes || 30}
            onChange={(value) => setForm(f => ({ ...f, login_lockout_duration_minutes: Number(value) }))}
          />
        </Section>

        {/* IP Restrictions */}
        <Section title="IP Restrictions">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Allowed IP Ranges (CIDR notation)</label>
            <textarea
              value={(form.allowed_ip_ranges || []).join('\n')}
              onChange={e => setForm(f => ({ ...f, allowed_ip_ranges: e.target.value.split('\n').filter(Boolean) }))}
              placeholder="192.168.1.0/24&#10;10.0.0.0/8"
              rows={3}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty to allow all IPs</p>
          </div>
        </Section>

        {/* Data & Compliance */}
        <Section title="Data Retention & Compliance">
          <InputField
            label="Auto-delete Conversations After (days, blank = keep forever)"
            type="number"
            value={form.data_retention_days || ''}
            onChange={(value) => setForm(f => ({ ...f, data_retention_days: value ? Number(value) : null }))}
          />
          <InputField
            label="Auto-anonymize PII After (days)"
            type="number"
            value={form.data_anonymize_after_days || ''}
            onChange={(value) => setForm(f => ({ ...f, data_anonymize_after_days: value ? Number(value) : null }))}
          />
          <SelectField
            label="Data Residency"
            value={form.data_residency || 'us'}
            options={[
              { value: 'us', label: 'United States' },
              { value: 'eu', label: 'European Union' },
              { value: 'uk', label: 'United Kingdom' },
            ]}
            onChange={(value) => setForm(f => ({ ...f, data_residency: value }))}
          />
        </Section>

        {/* Redaction & Privacy */}
        <Section title="Data Protection">
          <ToggleField
            label="Conversation Redaction"
            value={form.conversation_redaction_enabled || true}
            onChange={(value) => setForm(f => ({ ...f, conversation_redaction_enabled: value }))}
            helperText="Automatically redact credit cards, SSNs, and other PII patterns"
          />
          <ToggleField
            label="HIPAA Mode (Enterprise)"
            value={form.hipaa_mode_enabled || false}
            onChange={(value) => setForm(f => ({ ...f, hipaa_mode_enabled: value }))}
            helperText="Enhanced encryption and access controls for healthcare compliance"
          />
        </Section>

        {/* Compliance Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
          <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Compliance Features</p>
            <p className="text-xs text-blue-700">
              All changes are logged in the compliance audit trail. Enable data export and right-to-erasure tools for GDPR compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-12 flex justify-end gap-3">
        <button
          onClick={save}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save Security Settings'}
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
        className={cn('w-12 h-7 rounded-full transition-colors shrink-0 mt-0.5', value ? 'bg-green-500' : 'bg-gray-300')}
      >
        <div className={cn('w-5 h-5 rounded-full bg-white transition-transform', value ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  );
}