import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings as SettingsIcon, Save, Upload, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [form, setForm] = useState({
    primary_color: '#3b82f6',
    widget_position: 'bottom-right',
    greeting_message: '',
    chatbot_name: 'ShopBot',
    show_branding: true,
    privacy_policy_url: '',
    terms_of_service_url: '',
    data_deletion_url: '',
  });
  const [settingsId, setSettingsId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['widget-settings'],
    queryFn: () => base44.entities.WidgetSettings.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      const s = settings[0];
      setSettingsId(s.id);
      setForm(prev => ({ ...prev, ...s }));
    }
  }, [settings]);

  const save = async () => {
    if (settingsId) await base44.entities.WidgetSettings.update(settingsId, form);
    else { const c = await base44.entities.WidgetSettings.create(form); setSettingsId(c.id); }
    qc.invalidateQueries({ queryKey: ['widget-settings'] });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, app_icon_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
          <SettingsIcon className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-400">Widget and app configuration</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Widget */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-sm text-gray-800">Widget Settings</h2>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Chatbot Name</label>
            <input value={form.chatbot_name} onChange={e => setForm(f => ({ ...f, chatbot_name: e.target.value }))}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Greeting Message</label>
            <textarea value={form.greeting_message} onChange={e => setForm(f => ({ ...f, greeting_message: e.target.value }))}
              rows={2} className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
                <span className="text-xs text-gray-500">{form.primary_color}</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Widget Position</label>
              <select value={form.widget_position} onChange={e => setForm(f => ({ ...f, widget_position: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none">
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">App Icon</label>
            <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs text-gray-600">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : form.app_icon_url ? 'Change Icon' : 'Upload Icon'}
              <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
            </label>
            {form.app_icon_url && <img src={form.app_icon_url} alt="App icon" className="w-12 h-12 rounded-xl mt-2 border border-gray-100" />}
          </div>
        </div>

        {/* Legal URLs */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-sm text-gray-800">Legal URLs</h2>
          {[
            { label: 'Privacy Policy URL', field: 'privacy_policy_url' },
            { label: 'Terms of Service URL', field: 'terms_of_service_url' },
            { label: 'Data Deletion URL', field: 'data_deletion_url' },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
              <input value={form[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder="https://..." className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          ))}
        </div>

        <button onClick={save} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}