import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function NewBrandModal({ onClose, onSuccess }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    slug: '',
    website_url: '',
    support_email: '',
    support_phone: '',
    primary_color: '#7c3aed',
  });
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const brand = await base44.entities.Brand.create(data);

      // Create default settings
      await base44.entities.BrandSettings.create({
        brand_id: brand.id,
        primary_color: data.primary_color,
      });

      // Create default departments
      const deptNames = ['General Enquiries', 'Technical Support', 'Billing', 'Sales'];
      for (const name of deptNames) {
        await base44.entities.Department.create({
          brand_id: brand.id,
          name,
          color: data.primary_color,
        });
      }

      // Create default business hours
      await base44.entities.BusinessHours.create({
        brand_id: brand.id,
        timezone: 'America/New_York',
      });

      // Log audit
      const me = await base44.auth.me();
      await base44.entities.AuditLog.create({
        action_type: 'BRAND_CREATED',
        actor_email: me.email,
        actor_name: me.full_name,
        target_type: 'Brand',
        target_id: brand.id,
        target_name: data.name,
        brand_id: brand.id,
      });

      return brand;
    },
    onSuccess: () => {
      setSaved(true);
      toast({ title: 'Brand created successfully' });
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['brands'] });
        onSuccess();
      }, 1000);
    },
    onError: (err) => {
      toast({
        title: 'Error creating brand',
        description: err.message || 'Failed to create brand',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    mutation.mutate(form);
  };

  // Auto-generate slug
  const handleNameChange = (name) => {
    setForm(f => ({
      ...f,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create New Brand</h2>
          <p className="text-xs text-gray-500 mt-1">Instantly provision a fully isolated workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Brand Name</label>
            <input
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g., U2C Mobile"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Slug (URL-safe)</label>
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Website URL</label>
            <input
              type="url"
              value={form.website_url}
              onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
              placeholder="https://u2cmobile.com"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Support Email</label>
            <input
              type="email"
              value={form.support_email}
              onChange={e => setForm(f => ({ ...f, support_email: e.target.value }))}
              placeholder="support@u2cmobile.com"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.primary_color}
                onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.slug || mutation.isPending}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" /> Created
              </>
            ) : (
              'Create Brand'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}