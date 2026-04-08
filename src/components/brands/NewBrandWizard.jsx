import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, Check, Upload, ChevronRight, ChevronLeft, Sparkles, Users, Plug, Rocket } from 'lucide-react';
import { BrandAvatar } from './BrandSwitcher';

const DEFAULT_AI_INSTRUCTIONS = (personaName, brandName) =>
  `You are ${personaName || '[PERSONA_NAME]'}, a friendly customer support agent for ${brandName || '[BRAND_NAME]'}. You help customers with questions about our products and services. Always be warm, professional, and helpful. If you cannot resolve an issue after 2 attempts, escalate to a human agent.`;

const STEPS = [
  { label: 'Basics', icon: Sparkles },
  { label: 'AI Persona', icon: Rocket },
  { label: 'Agents', icon: Users },
  { label: 'Done', icon: Check },
];

export default function NewBrandWizard({ onClose, onCreate }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    primary_color: '#7c3aed',
    website_url: '',
    support_email: '',
    logo_url: '',
    ai_persona_name: 'Victor',
    ai_instructions: '',
    welcome_message: 'Hi! 👋 Welcome! I\'m here to help you. What can I assist you with today?',
    assigned_agents: [],
    is_active: true,
    is_archived: false,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleNameChange = (name) => {
    set('name', name);
    if (!form.slug || form.slug === autoSlug(form.name)) {
      set('slug', autoSlug(name));
    }
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('logo_url', file_url);
    setUploading(false);
  };

  const toggleAgent = (email) => {
    const current = form.assigned_agents || [];
    const updated = current.includes(email) ? current.filter(e => e !== email) : [...current, email];
    set('assigned_agents', updated);
  };

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.slug.trim();
    return true;
  };

  const handleCreate = async () => {
    setSaving(true);
    const data = {
      ...form,
      ai_instructions: form.ai_instructions || DEFAULT_AI_INSTRUCTIONS(form.ai_persona_name, form.name),
    };
    await onCreate(data);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Create New Brand</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center px-6 py-4 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all text-xs font-bold
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block ${active ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-100 mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="px-6 pb-4 space-y-4 min-h-[280px]">
          {step === 0 && (
            <>
              <p className="text-sm text-gray-500 mb-2">Set up your brand basics</p>
              <WizField label="Brand Name *" value={form.name} onChange={handleNameChange} placeholder="e.g. U2C Mobile" />
              <WizField label="Slug *" value={form.slug} onChange={v => set('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="e.g. u2cmobile" />
              <WizField label="Website URL" value={form.website_url} onChange={v => set('website_url', v)} placeholder="https://example.com" />
              <WizField label="Support Email" value={form.support_email} onChange={v => set('support_email', v)} placeholder="support@example.com" />
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primary_color}
                      onChange={e => set('primary_color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
                    <BrandAvatar brand={form} size={36} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Logo (optional)</label>
                  <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs text-gray-600 w-fit transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : form.logo_url ? 'Change' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                  </label>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-gray-500 mb-2">Configure your AI persona</p>
              <WizField label="AI Persona Name" value={form.ai_persona_name} onChange={v => set('ai_persona_name', v)} placeholder="e.g. Victor" />
              <WizField label="Welcome Message" value={form.welcome_message} onChange={v => set('welcome_message', v)} textarea rows={2} />
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">AI Instructions</label>
                <textarea
                  value={form.ai_instructions || DEFAULT_AI_INSTRUCTIONS(form.ai_persona_name, form.name)}
                  onChange={e => set('ai_instructions', e.target.value)}
                  rows={7}
                  className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">Pre-filled with default template. Customize as needed.</p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-gray-500 mb-2">Assign agents to this brand (optional)</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users.filter(u => u.role !== 'admin').map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input type="checkbox"
                      checked={form.assigned_agents.includes(u.email)}
                      onChange={() => toggleAgent(u.email)}
                      className="w-4 h-4 accent-violet-600"
                    />
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-xs">
                      {u.full_name?.charAt(0) || u.email?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || u.email}</p>
                      <p className="text-[11px] text-gray-400">{u.role}</p>
                    </div>
                  </label>
                ))}
                {users.filter(u => u.role !== 'admin').length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">No agents to assign yet. You can add them later.</p>
                )}
              </div>
              <p className="text-[11px] text-gray-400">Admins always have access to all brands.</p>
            </>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Ready to Launch!</h3>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-semibold text-gray-800">{form.name}</span> is configured and ready.
              </p>
              <p className="text-xs text-gray-400">All data will be isolated to this brand. You can edit settings anytime.</p>
              <div className="mt-4 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <BrandAvatar brand={form} size={32} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{form.name}</p>
                  <p className="text-xs text-gray-400">{form.slug} · AI: {form.ai_persona_name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {saving ? 'Creating...' : <><Check className="w-4 h-4" /> Create Brand</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WizField({ label, value, onChange, placeholder, textarea, rows = 3 }) {
  const cls = "w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400";
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className={`${cls} resize-none`} placeholder={placeholder} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />}
    </div>
  );
}