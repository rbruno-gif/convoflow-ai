import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, CheckCircle, AlertCircle } from 'lucide-react';

const BUILT_IN_ROLES = ['Super Admin', 'Brand Manager', 'Supervisor', 'Agent', 'Read Only'];

const PERMISSION_CATEGORIES = {
  inbox: ['view_conversations', 'reply_conversations', 'assign_conversations', 'transfer_conversations', 'delete_conversations', 'view_all_agents_conversations', 'export_history'],
  tickets: ['create_tickets', 'edit_tickets', 'delete_tickets', 'reassign_tickets', 'close_tickets', 'view_all_tickets', 'export_tickets'],
  knowledge_base: ['view_faqs', 'add_faqs', 'edit_faqs', 'delete_faqs', 'approve_scraped_content', 'trigger_rescrape'],
  ai_agent: ['view_settings', 'edit_config', 'enable_disable_tools', 'view_agentic_log', 'approve_actions'],
  analytics: ['view_own_stats', 'view_team_stats', 'view_brand_stats', 'export_reports', 'schedule_reports'],
  settings: ['view_settings', 'edit_brand_settings', 'manage_agents', 'manage_roles', 'manage_departments', 'manage_integrations', 'manage_billing'],
  queue: ['view_queue', 'manage_queue_order', 'override_assignment', 'view_all_depts_queues'],
  workflows: ['view_workflows', 'create_workflows', 'edit_workflows', 'delete_workflows', 'enable_disable_workflows'],
  customers: ['view_profiles', 'edit_profiles', 'delete_profiles', 'export_data'],
  outbound: ['view_campaigns', 'create_campaigns', 'send_campaigns', 'view_analytics'],
};

const DEFAULT_PERMISSIONS = {
  'Super Admin': Object.keys(PERMISSION_CATEGORIES).reduce((acc, cat) => ({
    ...acc,
    [cat]: PERMISSION_CATEGORIES[cat].reduce((p, perm) => ({ ...p, [perm]: true }), {})
  }), {}),
  'Brand Manager': {
    inbox: { view_conversations: true, reply_conversations: true, assign_conversations: true, view_all_agents_conversations: true },
    tickets: { create_tickets: true, edit_tickets: true, view_all_tickets: true },
    ai_agent: { view_settings: true, edit_config: true },
    analytics: { view_brand_stats: true, export_reports: true },
    settings: { view_settings: true, edit_brand_settings: true, manage_agents: true },
  },
  'Supervisor': {
    inbox: { view_conversations: true, reply_conversations: true, assign_conversations: true, view_all_agents_conversations: true },
    tickets: { create_tickets: true, edit_tickets: true, view_all_tickets: true },
    queue: { view_queue: true, manage_queue_order: true },
    analytics: { view_team_stats: true },
  },
  'Agent': {
    inbox: { view_conversations: true, reply_conversations: true, assign_conversations: false },
    tickets: { create_tickets: true, edit_tickets: true },
    queue: { view_queue: true },
    analytics: { view_own_stats: true },
  },
  'Read Only': {
    inbox: { view_conversations: true },
    tickets: { view_all_tickets: true },
    analytics: { view_brand_stats: true },
  },
};

export default function RoleManagement({ brandId, onChangesDetected }) {
  const qc = useQueryClient();
  const [editingRole, setEditingRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', brandId],
    queryFn: () => brandId
      ? base44.entities.Role.filter({ brand_id: brandId })
      : base44.entities.Role.list(),
  });

  const handleSaveRole = async (roleData) => {
    if (editingRole) {
      await base44.entities.Role.update(editingRole.id, roleData);
    } else {
      await base44.entities.Role.create({ ...roleData, brand_id: brandId });
    }
    qc.invalidateQueries({ queryKey: ['roles', brandId] });
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditingRole(null); }, 1500);
  };

  const handleDeleteRole = async (roleId, roleName) => {
    const role = roles.find(r => r.id === roleId);
    if (role.is_built_in || BUILT_IN_ROLES.includes(roleName)) {
      alert('Built-in roles cannot be deleted');
      return;
    }
    await base44.entities.Role.delete(roleId);
    qc.invalidateQueries({ queryKey: ['roles', brandId] });
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">Manage role-based access control for this brand</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingRole(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          <Plus className="w-4 h-4" /> New Custom Role
        </button>
      </div>

      <div className="space-y-4">
        {roles.map(role => (
          <RoleCard
            key={role.id}
            role={role}
            isBuiltIn={BUILT_IN_ROLES.includes(role.name)}
            onEdit={() => { setEditingRole(role); setShowForm(true); }}
            onDelete={() => handleDeleteRole(role.id, role.name)}
          />
        ))}
        {roles.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>No roles configured yet</p>
          </div>
        )}
      </div>

      {showForm && (
        <RoleFormModal
          role={editingRole}
          onSave={handleSaveRole}
          onClose={() => { setShowForm(false); setEditingRole(null); }}
          saved={saved}
        />
      )}
    </div>
  );
}

function RoleCard({ role, isBuiltIn, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">{role.name}</h3>
            {isBuiltIn && <span className="text-[10px] px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-semibold">Built-in</span>}
          </div>
          {role.description && <p className="text-xs text-gray-500 mt-1">{role.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg">
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
          {!isBuiltIn && (
            <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500 mb-1">Assigned Agents</p>
          <p className="font-semibold text-gray-900">{role.assigned_count || 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500 mb-1">Permissions Enabled</p>
          <p className="font-semibold text-gray-900">
            {Object.values(role.permissions || {}).reduce((sum, cat) => sum + Object.values(cat).filter(Boolean).length, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleFormModal({ role, onSave, onClose, saved }) {
  const [form, setForm] = useState(
    role ? { name: role.name, description: role.description || '', permissions: role.permissions || {} }
      : { name: '', description: '', permissions: DEFAULT_PERMISSIONS['Agent'] }
  );

  const handlePermissionToggle = (category, permission) => {
    setForm(f => ({
      ...f,
      permissions: {
        ...f.permissions,
        [category]: {
          ...(f.permissions[category] || {}),
          [permission]: !(f.permissions[category]?.[permission] || false),
        }
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{role ? 'Edit Role' : 'Create New Role'}</h2>
        </div>

        <div className="p-8 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Role Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Custom Support Manager"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe this role's purpose..."
              rows={2}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>

          {/* Permissions Grid */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-4">Permissions</p>
            <div className="space-y-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                <div key={category} className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 capitalize">{category.replace(/_/g, ' ')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(perm => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.permissions[category]?.[perm] || false}
                          onChange={() => handlePermissionToggle(category, perm)}
                          className="w-4 h-4 accent-violet-600"
                        />
                        <span className="text-xs text-gray-600 capitalize">{perm.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  );
}