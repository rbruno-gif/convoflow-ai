import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BrandingSettings({ brandId, onChangesDetected }) {
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
      const s = settings[0];
      setInitialForm(s);
      setForm(s);
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

  const handleColorChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleFileUpload = async (field, file) => {
    const url = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, [field]: url.file_url }));
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Branding & White Label</h2>
        <p className="text-sm text-gray-500 mt-1">Customize the brand appearance across the platform</p>
      </div>

      <div className="space-y-8">
        {/* Logo Section */}
        <Section title="Logo & Favicon">
          <div className="grid grid-cols-2 gap-6">
            <FileUploadField
              label="Logo (Light)"
              value={form.logo_light_url}
              onUpload={(file) => handleFileUpload('logo_light_url', file)}
              previewUrl={form.logo_light_url}
            />
            <FileUploadField
              label="Logo (Dark)"
              value={form.logo_dark_url}
              onUpload={(file) => handleFileUpload('logo_dark_url', file)}
              previewUrl={form.logo_dark_url}
            />
          </div>
          <div className="mt-4">
            <FileUploadField
              label="Favicon"
              value={form.favicon_url}
              onUpload={(file) => handleFileUpload('favicon_url', file)}
              previewUrl={form.favicon_url}
            />
          </div>
        </Section>

        {/* Colors Section */}
        <Section title="Brand Colors">
          <div className="grid grid-cols-3 gap-4">
            <ColorPicker
              label="Primary Color"
              value={form.primary_color || '#7c3aed'}
              onChange={(value) => handleColorChange('primary_color', value)}
            />
            <ColorPicker
              label="Secondary Color"
              value={form.secondary_color || '#4f46e5'}
              onChange={(value) => handleColorChange('secondary_color', value)}
            />
            <ColorPicker
              label="Accent Color"
              value={form.accent_color || '#ec4899'}
              onChange={(value) => handleColorChange('accent_color', value)}
            />
          </div>
        </Section>

        {/* Custom Domain */}
        <Section title="Custom Domain">
          <InputField
            label="Custom Domain"
            value={form.custom_domain || ''}
            onChange={(value) => setForm(f => ({ ...f, custom_domain: value }))}
            placeholder="e.g. support.yourbrand.com"
            helperText="Configure DNS records as shown in your domain provider"
          />
        </Section>

        {/* Email Branding */}
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
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Email Footer Text</label>
              <textarea
                value={form.email_footer_text || ''}
                onChange={(e) => setForm(f => ({ ...f, email_footer_text: e.target.value }))}
                rows={3}
                className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              />
            </div>
          </div>
        </Section>

        {/* Login Page */}
        <Section title="Login Page">
          <div className="space-y-4">
            <FileUploadField
              label="Login Page Logo"
              value={form.login_page_logo_url}
              onUpload={(file) => handleFileUpload('login_page_logo_url', file)}
              previewUrl={form.login_page_logo_url}
            />
            <ColorPicker
              label="Login Background Color"
              value={form.login_page_bg_color || '#ffffff'}
              onChange={(value) => setForm(f => ({ ...f, login_page_bg_color: value }))}
            />
            <InputField
              label="Welcome Message"
              value={form.login_page_welcome_message || ''}
              onChange={(value) => setForm(f => ({ ...f, login_page_welcome_message: value }))}
              placeholder="Welcome to your support portal"
            />
            <InputField
              label="Support Contact"
              value={form.login_page_support_contact || ''}
              onChange={(value) => setForm(f => ({ ...f, login_page_support_contact: value }))}
              placeholder="support@yourbrand.com"
            />
          </div>
        </Section>

        {/* White Label */}
        <Section title="White Label Mode">
          <ToggleField
            label="Hide 'Powered by' references"
            value={form.white_label_mode || false}
            onChange={(value) => setForm(f => ({ ...f, white_label_mode: value }))}
            helperText="Remove all U2C branding from customer-facing surfaces"
          />
        </Section>

        {/* Browser Tab */}
        <Section title="Browser Settings">
          <InputField
            label="Browser Tab Title"
            value={form.browser_tab_title || ''}
            onChange={(value) => setForm(f => ({ ...f, browser_tab_title: value }))}
            placeholder="My Brand Support"
          />
        </Section>
      </div>

      {/* Save Button */}
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

function InputField({ label, value, onChange, placeholder, helperText, type = 'text' }) {
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
      {helperText && <p className="text-xs text-gray-400 mt-1">{helperText}</p>}
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
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

function FileUploadField({ label, value, onUpload, previewUrl }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">{label}</label>
      <div className="flex flex-col gap-3">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-24 h-24 rounded-lg object-contain border border-gray-200"
          />
        )}
        <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-violet-400 transition-colors">
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600">Upload {label.toLowerCase()}</span>
          <input
            type="file"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            className="hidden"
          />
        </label>
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
        className={cn('w-12 h-7 rounded-full transition-colors shrink-0 mt-0.5', value ? 'bg-green-500' : 'bg-gray-300')}
      >
        <div className={cn('w-5 h-5 rounded-full bg-white transition-transform', value ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  );
}