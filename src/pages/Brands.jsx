import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Building2, CheckCircle, Upload, Globe, Bot, Users, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';

export default function Brands() {
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const { data: brands = [], refetch } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('-created_date', 100),
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Brand List */}
      <div className="w-72 shrink-0 border-r border-gray-100 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-sm">Brands</h1>
            <p className="text-[11px] text-gray-400">{brands.length} brand{brands.length !== 1 ? 's' : ''}</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { setShowNew(true); setSelected(null); }}>
            <Plus className="w-3.5 h-3.5" /> New
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {brands.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No brands yet</p>
            </div>
          ) : (
            brands.map(brand => (
              <BrandListItem
                key={brand.id}
                brand={brand}
                selected={selected?.id === brand.id}
                onClick={() => { setSelected(brand); setShowNew(false); }}
                onToggle={async () => {
                  await base44.entities.Brand.update(brand.id, { is_active: !brand.is_active });
                  refetch();
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Right: Brand Detail / New Form */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {showNew ? (
          <BrandForm onSave={async (data) => { await base44.entities.Brand.create(data); refetch(); setShowNew(false); }} onCancel={() => setShowNew(false)} />
        ) : selected ? (
          <BrandDetail key={selected.id} brand={selected} onSave={async (data) => { await base44.entities.Brand.update(selected.id, data); refetch(); setSelected({ ...selected, ...data }); }} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a brand to edit or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BrandListItem({ brand, selected, onClick, onToggle }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${selected ? 'bg-violet-50 border-l-2 border-l-violet-500' : 'hover:bg-gray-50'}`}
    >
      <BrandAvatar brand={brand} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{brand.name}</p>
        <p className="text-[11px] text-gray-400 truncate">{brand.slug}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="shrink-0"
      >
        {brand.is_active
          ? <ToggleRight className="w-5 h-5 text-violet-500" />
          : <ToggleLeft className="w-5 h-5 text-gray-300" />}
      </button>
    </div>
  );
}

function BrandDetail({ brand, onSave }) {
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({ ...brand });
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const tabs = [
    { key: 'general', label: 'General', icon: Globe },
    { key: 'ai', label: 'AI Settings', icon: Bot },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <BrandAvatar brand={form} size={44} />
        <div>
          <h2 className="text-xl font-bold text-gray-900">{brand.name}</h2>
          <p className="text-xs text-gray-400">{brand.slug}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-sm text-gray-800">Brand Settings</h3>
          <Field label="Brand Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Field label="Slug (unique identifier)" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} />
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color || '#7c3aed'} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
              <span className="text-xs text-gray-500">{form.primary_color}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Logo</label>
            <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs text-gray-600">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : form.logo_url ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
            </label>
            {form.logo_url && <img src={form.logo_url} alt="logo" className="w-16 h-16 rounded-xl mt-2 border object-contain" />}
          </div>
          <Field label="Welcome Message" value={form.welcome_message || ''} onChange={v => setForm(f => ({ ...f, welcome_message: v }))} textarea rows={2} />
        </div>
      )}

      {tab === 'ai' && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-sm text-gray-800">AI Configuration</h3>
          <Field label="AI Persona Name" value={form.ai_persona_name || ''} onChange={v => setForm(f => ({ ...f, ai_persona_name: v }))} />
          <Field label="AI Instructions" value={form.ai_instructions || ''} onChange={v => setForm(f => ({ ...f, ai_instructions: v }))} textarea rows={10} />
        </div>
      )}

      <button onClick={save} className="mt-5 w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
        {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Changes'}
      </button>
    </div>
  );
}

function BrandForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', slug: '', primary_color: '#7c3aed', ai_persona_name: 'Victor', is_active: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.slug) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">New Brand</h2>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
        <Field label="Brand Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <Field label="Slug * (e.g. u2cmobile)" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v.toLowerCase().replace(/\s+/g, '-') }))} />
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Primary Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
            <span className="text-xs text-gray-500">{form.primary_color}</span>
          </div>
        </div>
        <Field label="AI Persona Name" value={form.ai_persona_name} onChange={v => setForm(f => ({ ...f, ai_persona_name: v }))} />
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={save} disabled={saving || !form.name || !form.slug}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {saving ? 'Creating...' : 'Create Brand'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, rows = 3 }) {
  const cls = "w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400";
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className={`${cls} resize-none`} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls} />}
    </div>
  );
}