import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Upload, X, Trash2, Globe, Bot, Users, Plug, BarChart3 } from 'lucide-react';
import { BrandAvatar } from './BrandSwitcher';
import { useQuery } from '@tanstack/react-query';

const TABS = [
  { key: 'general', label: 'General', icon: Globe },
  { key: 'ai', label: 'AI Agent', icon: Bot },
  { key: 'agents', label: 'Agents', icon: Users },
];

export default function BrandSettingsPanel({ brand, onClose, onSave, onArchive }) {
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({ ...brand });
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);

  useEffect(() => { setForm({ ...brand }); }, [brand.id]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const save = async () => {
    await onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, logo_url: file_url }));
    setUploading(false);
  };

  const toggleAgent = (email) => {
    const current = form.assigned_agents || [];
    const updated = current.includes(email)
      ? current.filter(e => e !== email)
      : [...current, email];
    setForm(f => ({ ...f, assigned_agents: updated }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <BrandAvatar brand={form} size={40} />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-base truncate">{brand.name}</h2>
          <p className="text-xs text-gray-400">{brand.slug}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 pb-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === key ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {tab === 'general' && (
          <>
            <Field label="Brand Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Field label="Slug (unique identifier)" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} />
            <Field label="Website URL" value={form.website_url || ''} onChange={v => setForm(f => ({ ...f, website_url: v }))} placeholder="https://example.com" />
            <Field label="Support Email" value={form.support_email || ''} onChange={v => setForm(f => ({ ...f, support_email: v }))} />
            <Field label="Support Phone" value={form.support_phone || ''} onChange={v => setForm(f => ({ ...f, support_phone: v }))} />
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Primary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primary_color || '#7c3aed'}
                  onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
                <span className="text-xs text-gray-500 font-mono">{form.primary_color}</span>
                <BrandAvatar brand={form} size={36} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Logo</label>
              <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs text-gray-600 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Uploading...' : form.logo_url ? 'Change Logo' : 'Upload Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
              </label>
              {form.logo_url && <img src={form.logo_url} alt="logo" className="w-16 h-16 rounded-xl mt-2 border object-contain" />}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Status</label>
              <button
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  form.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                {form.is_active ? 'Active' : 'Inactive'} — click to toggle
              </button>
            </div>
          </>
        )}

        {tab === 'ai' && (
          <>
            <Field label="AI Persona Name" value={form.ai_persona_name || ''} onChange={v => setForm(f => ({ ...f, ai_persona_name: v }))} />
            <Field label="Welcome Message" value={form.welcome_message || ''} onChange={v => setForm(f => ({ ...f, welcome_message: v }))} textarea rows={2} />
            <Field label="AI Instructions" value={form.ai_instructions || ''} onChange={v => setForm(f => ({ ...f, ai_instructions: v }))} textarea rows={12} />
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-700 mb-1">Webhook URL for this brand</p>
              <code className="text-[11px] text-blue-600 break-all">
                /api/functions/messengerWebhook (POST with brand_id: "{brand.id}")
              </code>
              <p className="text-[10px] text-blue-500 mt-1">Include brand_id in your Twilio/webhook POST body</p>
            </div>
          </>
        )}

        {tab === 'agents' && (
          <div>
            <p className="text-xs text-gray-500 mb-3">Select agents who can access this brand</p>
            <div className="space-y-2">
              {users.filter(u => u.role !== 'admin').map(u => (
                <label key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={(form.assigned_agents || []).includes(u.email)}
                    onChange={() => toggleAgent(u.email)}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-xs">
                    {u.full_name?.charAt(0) || u.email?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || u.email}</p>
                    <p className="text-[11px] text-gray-400 truncate">{u.email} · {u.role}</p>
                  </div>
                </label>
              ))}
              {users.filter(u => u.role !== 'admin').length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No non-admin agents found</p>
              )}
              <p className="text-[11px] text-gray-400 mt-2">Admin users always have access to all brands.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 pt-3 border-t border-gray-100 space-y-2">
        <button onClick={save}
          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Changes'}
        </button>
        {!showConfirmArchive ? (
          <button onClick={() => setShowConfirmArchive(true)}
            className="w-full py-2 rounded-xl text-xs text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Archive Brand
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setShowConfirmArchive(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50">Cancel</button>
            <button onClick={onArchive} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700">Confirm Archive</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, rows = 3, placeholder }) {
  const cls = "w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white";
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className={`${cls} resize-none`} placeholder={placeholder} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />}
    </div>
  );
}