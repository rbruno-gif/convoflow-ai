import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WidgetCustomization({ brandId, onChangesDetected }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [initialForm, setInitialForm] = useState({});
  const [previewMode, setPreviewMode] = useState(false);

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
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Widget Customization</h2>
          <p className="text-sm text-gray-500 mt-1">Customize the chat widget appearance and behavior</p>
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium"
        >
          {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {previewMode ? 'Hide' : 'Show'} Preview
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <SettingsSection title="Widget Launcher">
            <SelectField
              label="Style"
              value={form.widget_launcher_style || 'circle'}
              options={[{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }, { value: 'custom', label: 'Custom Icon' }]}
              onChange={(value) => setForm(f => ({ ...f, widget_launcher_style: value }))}
            />
            <SelectField
              label="Size"
              value={form.widget_launcher_size || 'medium'}
              options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
              onChange={(value) => setForm(f => ({ ...f, widget_launcher_size: value }))}
            />
            <SelectField
              label="Position"
              value={form.widget_position || 'bottom-right'}
              options={[{ value: 'bottom-left', label: 'Bottom Left' }, { value: 'bottom-right', label: 'Bottom Right' }]}
              onChange={(value) => setForm(f => ({ ...f, widget_position: value }))}
            />
            <InputField
              label="Position Offset (pixels)"
              type="number"
              value={form.widget_position_offset || 20}
              onChange={(value) => setForm(f => ({ ...f, widget_position_offset: Number(value) }))}
            />
          </SettingsSection>

          <SettingsSection title="Colors & Appearance">
            <ColorField
              label="Primary Color"
              value={form.widget_primary_color}
              onChange={(value) => setForm(f => ({ ...f, widget_primary_color: value }))}
            />
            <ColorField
              label="Header Color"
              value={form.widget_header_color}
              onChange={(value) => setForm(f => ({ ...f, widget_header_color: value }))}
            />
            <ColorField
              label="Background Color"
              value={form.widget_bg_color}
              onChange={(value) => setForm(f => ({ ...f, widget_bg_color: value }))}
            />
            <ColorField
              label="Text Color"
              value={form.widget_text_color}
              onChange={(value) => setForm(f => ({ ...f, widget_text_color: value }))}
            />
            <ColorField
              label="Button Color"
              value={form.widget_button_color}
              onChange={(value) => setForm(f => ({ ...f, widget_button_color: value }))}
            />
          </SettingsSection>

          <SettingsSection title="Chatbot Branding">
            <InputField
              label="Chatbot Name"
              value={form.chatbot_name || 'Assistant'}
              onChange={(value) => setForm(f => ({ ...f, chatbot_name: value }))}
            />
            <InputField
              label="Welcome Headline"
              value={form.widget_welcome_headline || ''}
              onChange={(value) => setForm(f => ({ ...f, widget_welcome_headline: value }))}
            />
            <InputField
              label="Welcome Subtext"
              value={form.widget_welcome_subtext || ''}
              onChange={(value) => setForm(f => ({ ...f, widget_welcome_subtext: value }))}
            />
          </SettingsSection>

          <SettingsSection title="Advanced Settings">
            <ToggleField
              label="Full Screen on Mobile"
              value={form.widget_mobile_fullscreen || true}
              onChange={(value) => setForm(f => ({ ...f, widget_mobile_fullscreen: value }))}
            />
            <ToggleField
              label="Sound Notifications"
              value={form.widget_sound_enabled || true}
              onChange={(value) => setForm(f => ({ ...f, widget_sound_enabled: value }))}
            />
          </SettingsSection>
        </div>

        {previewMode && (
          <div className="lg:col-span-1 sticky top-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="bg-gray-100 p-8 min-h-96 flex items-center justify-center">
                <WidgetPreview settings={form} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-end gap-3">
        <button
          onClick={save}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save Widget Settings'}
        </button>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }) {
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

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#7c3aed'}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>
    </div>
  );
}

function ToggleField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={cn('w-12 h-7 rounded-full transition-colors', value ? 'bg-green-500' : 'bg-gray-300')}
      >
        <div className={cn('w-5 h-5 rounded-full bg-white transition-transform', value ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  );
}

function WidgetPreview({ settings }) {
  const primaryColor = settings.widget_primary_color || '#7c3aed';
  return (
    <div className="w-72">
      <div
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ background: settings.widget_bg_color || '#ffffff' }}
      >
        <div
          className="px-4 py-3 text-white text-sm font-semibold flex items-center justify-between"
          style={{ background: settings.widget_header_color || primaryColor }}
        >
          <span>{settings.chatbot_name || 'Assistant'}</span>
          <span className="text-xs opacity-70">● Online</span>
        </div>
        <div className="p-4 min-h-40 bg-gray-50 space-y-3">
          <div className="text-xs text-gray-600 text-center">
            {settings.widget_welcome_headline && (
              <p className="font-semibold">{settings.widget_welcome_headline}</p>
            )}
            {settings.widget_welcome_subtext && (
              <p className="text-gray-400 mt-1">{settings.widget_welcome_subtext}</p>
            )}
          </div>
        </div>
        <div className="p-3 border-t border-gray-200 flex gap-2">
          <input
            type="text"
            placeholder="Message..."
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5"
          />
          <button
            style={{ background: primaryColor }}
            className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}