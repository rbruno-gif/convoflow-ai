import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle } from 'lucide-react';

export default function BrandingSettings({ brandId, onChangesDetected }) {
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
    const payload = { ...form };
    if (settings.length > 0) {
      await base44.entities.BrandSettings.update(settings[0].id, payload);
    } else {
      await base44.entities.BrandSettings.create({ ...payload, brand_id: brandId });
    }
    qc.invalidateQueries({ queryKey: ['brand-settings', brandId] });
    setInitialForm(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Branding & White Label</h2>
        <p className="text-sm text-gray-500 mt-1">Customize brand appearance across the platform</p>
      </div>

      <div className="space-y-8">
        <Section title="Brand Colors">
          <div className="grid grid-cols-3 gap-4">
            <ColorField
              label="Primary Color"
              value={form.primary_color || '#7c3aed'}
              onChange={(value) => setForm(f => ({ ...f, primary_color: value }))}
            />
            <ColorField
              label="Secondary Color"
              value={form.secondary_color || '#4f46e5'}
              onChange={(value) => setForm(f => ({ ...f, secondary_color: value }))}
            />
            <ColorField
              label="Accent Color"
              value={form.accent_color || '#ec4899'}
              onChange={(value) => setForm(f => ({ ...f, accent_color: value }))}
            />
          </div>
        </Section>

        <Section title="Email Branding">
          <div className="space-y-4">
            <InputField
              label="Email Sender Name"
              value={form.email_sender_name || ''}
              onChange={(value) => setForm(f => ({ ...f, email_sender_name: value }))}
              placeholder="e.g. U2C Mobile Support"
            />
            <InputField
              label="Email From Address"
              value={form.email_from_address || ''}
              onChange={(value) => setForm(f => ({ ...f, email_from_address: value }))}
              placeholder="e.g. support@yourbrand.com"
              type="email"
            />
          </div>
        </Section>

        <Section title="White Label Mode">
          <ToggleField
            label="Hide 'Powered by' references"
            value={form.white_label_mode || false}
            onChange={(value) => setForm(f => ({ ...f, white_label_mode: value }))}
            helperText="Remove all branding from customer-facing surfaces"
          />
        </Section>
      </div>

      <div className="mt-12 flex justify-end gap-3">
        <button
          onClick={save}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">{title}</h3>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>
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