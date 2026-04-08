import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle } from 'lucide-react';

export default function AgentInviteModal({ brandId, departments, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', department_ids: [], max_concurrent: 5 });
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const agent = await base44.entities.Agent.create({
        ...data,
        brand_id: brandId,
        status: 'invited',
      });

      // Log audit
      await base44.entities.AuditLog.create({
        action_type: 'AGENT_INVITED',
        actor_email: (await base44.auth.me()).email,
        actor_name: (await base44.auth.me()).full_name,
        target_type: 'Agent',
        target_id: agent.id,
        target_name: data.email,
        brand_id: brandId,
      });
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => onSuccess(), 1000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const toggleDept = (deptId) => {
    setForm(f => ({
      ...f,
      department_ids: f.department_ids.includes(deptId)
        ? f.department_ids.filter(id => id !== deptId)
        : [...f.department_ids, deptId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Invite Agent</h2>
          <p className="text-xs text-gray-500 mt-1">Send invitation email to join</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Full Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., John Smith"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="john@example.com"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Assign to Departments</label>
            <div className="space-y-2">
              {departments.map(dept => (
                <label key={dept.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.department_ids.includes(dept.id)}
                    onChange={() => toggleDept(dept.id)}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <span className="text-sm text-gray-700">{dept.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Max Concurrent Conversations</label>
            <input
              type="number"
              value={form.max_concurrent}
              onChange={e => setForm(f => ({ ...f, max_concurrent: Number(e.target.value) }))}
              min={1}
              max={20}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.email || mutation.isPending}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Invited</> : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}