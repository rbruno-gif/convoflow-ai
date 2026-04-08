import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle } from 'lucide-react';

export default function WidgetCustomization({ brandId, onChangesDetected }) {
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
        <h2 className="text-2xl font-bold text-gray-900">Widget Customization</h2>
        <p className="text-sm text-gray-500 mt-1">Customize the chat widget appearance and behavior</p>
      </div>

      <div className="space-y-8">
        <Section title="Widget Launcher">
          <SelectField
            label="Style"
            value={form.widget_launcher_style || 'circle'}
            options={[{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }]}
            onChange={(value) => setForm(f => ({ ...f, widget_launcher_style: value }))}
          />
          <SelectField
            label="Size"
            value={form.widget_launcher_size || 'medium'}
            options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
            onChange={(value) => setForm(f => ({ ...f, widget_launcher_size: value }))}
          />
        </Section>

        <Section title="Chatbot Branding">
          <InputField
            label="Chatbot Name"
            value={form.chatbot_name || 'Assistant'}
            onChange={(value) => setForm(f => ({ ...f, chatbot_name: value }))}
          />
          <InputField
            label="Welcome Message"
            value={form.widget_welcome_headline || ''}
            onChange={(value) => setForm(f => ({ ...f, widget_welcome_headline: value }))}
            placeholder="Welcome to support"
          />
        </Section>

        <Section title="Colors">
          <ColorField
            label="Primary Color"
            value={form.widget_primary_color || '#7c3aed'}
            onChange={(value) => setForm(f => ({ ...f, widget_primary_color: value }))}
          />
          <ColorField
            label="Header Color"
            value={form.widget_header_color || '#4f46e5'}
            onChange={(value) => setForm(f => ({ ...f, widget_header_color: value }))}
          />
        </Section>

        <Section title="Features">
          <ToggleField
            label="Full Screen on Mobile"
            value={form.widget_mobile_fullscreen !== false}
            onChange={(value) => setForm(f => ({ ...f, widget_mobile_fullscreen: value }))}
          />
          <ToggleField
            label="Sound Notifications"
            value={form.widget_sound_enabled !== false}
            onChange={(value) => setForm(f => ({ ...f, widget_sound_enabled: value }))}
          />
        </Section>
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

function Section({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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

function ToggleField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}