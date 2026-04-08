import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Hash, Lock, Globe } from 'lucide-react';

export default function NewChannelModal({ brandId, isAdmin, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('public');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.TeamChannel.create({
      brand_id: type === 'cross-brand' ? null : brandId,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      type,
      is_default: false,
    });
    onCreate();
    onClose();
  };

  const types = [
    { value: 'public', label: 'Public', icon: Hash, desc: 'All brand agents can see and join' },
    { value: 'private', label: 'Private', icon: Lock, desc: 'Invite-only channel' },
    ...(isAdmin ? [{ value: 'cross-brand', label: 'Cross-Brand', icon: Globe, desc: 'Super-admins and managers only' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Create Channel</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Channel Name</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-violet-400">
              <Hash className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. q4-sales-team"
                className="flex-1 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What's this channel for?"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Channel Type</label>
            <div className="space-y-2">
              {types.map(t => {
                const Icon = t.icon;
                return (
                  <label key={t.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${type === t.value ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} className="hidden" />
                    <Icon className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.label}</p>
                      <p className="text-[11px] text-gray-400">{t.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving || !name.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            {saving ? 'Creating…' : 'Create Channel'}
          </button>
        </div>
      </div>
    </div>
  );
}