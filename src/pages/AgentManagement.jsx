import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Mail, CheckCircle, AlertCircle, Trash2, Send } from 'lucide-react';
import AgentInviteModal from '@/components/agents/AgentInviteModal';
import { formatDistanceToNow } from 'date-fns';

export default function AgentManagement() {
  const { activeBrandId } = useBrand();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const qc = useQueryClient();

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Agent.filter({ brand_id: activeBrandId }, '-created_date')
      : [],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Department.filter({ brand_id: activeBrandId })
      : [],
  });

  const getDeptNames = (deptIds) => {
    if (!deptIds) return [];
    return deptIds
      .map(id => departments.find(d => d.id === id)?.name)
      .filter(Boolean);
  };

  const activeAgents = agents.filter(a => a.status !== 'offline').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
            <p className="text-sm text-gray-500 mt-1">Manage team members and their permissions</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Plus className="w-4 h-4" /> Invite Agent
          </button>
        </div>
        <div className="flex gap-4">
          <div className="bg-gray-50 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-500">Total Agents</p>
            <p className="text-lg font-bold text-gray-900">{agents.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-500">Online Now</p>
            <p className="text-lg font-bold text-green-600">{activeAgents}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {agents.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-600 mb-4">No agents yet</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Invite First Agent
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Departments</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Last Active</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {getDeptNames(agent.department_ids).map(name => (
                          <span key={name} className="text-[11px] px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: agent.status === 'available' ? '#10b981' : agent.status === 'busy' ? '#f59e0b' : '#6b7280',
                          }}
                        />
                        <span className="text-sm font-medium text-gray-900 capitalize">{agent.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">
                        {agent.last_activity
                          ? formatDistanceToNow(new Date(agent.last_activity), { addSuffix: true })
                          : 'Never'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-red-500 text-sm font-medium">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showInviteModal && (
        <AgentInviteModal
          brandId={activeBrandId}
          departments={departments}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['agents', activeBrandId] });
            setShowInviteModal(false);
          }}
        />
      )}
    </div>
  );
}