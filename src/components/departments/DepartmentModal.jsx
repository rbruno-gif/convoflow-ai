import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle } from 'lucide-react';

export default function DepartmentModal({ brandId, dept, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#7c3aed', is_active: true });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (dept) {
      setForm({ name: dept.name, description: dept.description || '', color: dept.color, is_active: dept.is_active });
    }
  }, [dept]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (dept) {
        await base44.entities.Department.update(dept.id, data);
      } else {
        await base44.entities.Department.create({ ...data, brand_id: brandId });
      }
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => { onSuccess(); }, 1000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{dept ? 'Edit' : 'Create'} Department</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Department Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Technical Support"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this department for?"
              rows={2}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Color Label</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
              />
              <input
                type="text"
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || mutation.isPending}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Created</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}