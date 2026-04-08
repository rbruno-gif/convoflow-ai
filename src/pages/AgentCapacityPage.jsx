import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Users, Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';

const STATUS_COLORS = { available: '#10b981', busy: '#f59e0b', away: '#6b7280' };
const STATUS_LABELS = { available: 'Available', busy: 'Busy', away: 'Away' };

export default function AgentCapacityPage() {
  const { activeBrandId, activeBrand } = useBrand();
  const [saving, setSaving] = useState({});
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });
  const { data: capacities = [] } = useQuery({
    queryKey: ['capacities', activeBrandId],
    queryFn: () => activeBrandId ? base44.entities.AgentCapacity.filter({ brand_id: activeBrandId }) : base44.entities.AgentCapacity.list(),
    refetchInterval: 15000,
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ['convos-cap', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-created_date', 500)
      : base44.entities.Conversation.list('-created_date', 500),
    refetchInterval: 15000,
  });

  const agents = users.filter(u => u.role !== 'readonly');
  const openConvos = conversations.filter(c => c.status === 'active' || c.status === 'waiting');
  const queuedConvos = conversations.filter(c => c.status === 'waiting' && !c.assigned_agent);

  const getCapacity = (email) => capacities.find(c => c.agent_email === email) || { max_conversations: 5, current_conversations: 0, availability: 'available' };

  const getAgentLoad = (email) => openConvos.filter(c => c.assigned_agent === email).length;

  const updateCapacity = async (agentEmail, field, value) => {
    setSaving(s => ({ ...s, [agentEmail]: true }));
    const existing = capacities.find(c => c.agent_email === agentEmail);
    if (existing) {
      await base44.entities.AgentCapacity.update(existing.id, { [field]: value });
    } else {
      await base44.entities.AgentCapacity.create({ brand_id: activeBrandId, agent_email: agentEmail, [field]: value });
    }
    qc.invalidateQueries({ queryKey: ['capacities', activeBrandId] });
    setSaving(s => ({ ...s, [agentEmail]: false }));
  };

  const atCapacity = agents.filter(u => {
    const cap = getCapacity(u.email);
    return getAgentLoad(u.email) >= (cap.max_conversations || 5);
  }).length;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-violet-600" /> Agent Capacity</h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeBrand?.name || 'All brands'}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Agents', value: agents.length, color: '#7c3aed', icon: Users },
          { label: 'At Capacity', value: atCapacity, color: '#ef4444', icon: AlertCircle },
          { label: 'Queued', value: queuedConvos.length, color: '#f59e0b', icon: Clock },
          { label: 'Active Conversations', value: openConvos.length, color: '#10b981', icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Queue alert */}
      {queuedConvos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{queuedConvos.length} conversation{queuedConvos.length > 1 ? 's' : ''} waiting in queue</p>
            <p className="text-xs text-amber-600">Estimated wait: ~{Math.ceil(queuedConvos.length * 3)} minutes based on current load</p>
          </div>
        </div>
      )}

      {/* Agent table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800">Agent Workload & Capacity Settings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Agent', 'Status', 'Active / Max', 'Capacity Bar', 'Max Conversations', 'Availability'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => {
                const cap = getCapacity(agent.email);
                const load = getAgentLoad(agent.email);
                const max = cap.max_conversations || 5;
                const pct = Math.min(100, Math.round((load / max) * 100));
                const isAtCap = load >= max;
                return (
                  <tr key={agent.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isAtCap ? 'bg-red-50/30' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">
                          {agent.full_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-xs">{agent.full_name || agent.email}</p>
                          <p className="text-[10px] text-gray-400">{agent.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[cap.availability] || '#6b7280' }} />
                        {STATUS_LABELS[cap.availability] || 'Available'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold ${isAtCap ? 'text-red-600' : 'text-gray-700'}`}>{load} / {max}</span>
                      {isAtCap && <span className="ml-1 text-[10px] text-red-500">● At limit</span>}
                    </td>
                    <td className="py-3 px-4 min-w-[120px]">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: isAtCap ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981' }} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input type="number" min={1} max={50} defaultValue={max}
                        className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400"
                        onBlur={e => updateCapacity(agent.email, 'max_conversations', parseInt(e.target.value) || 5)} />
                    </td>
                    <td className="py-3 px-4">
                      <select value={cap.availability || 'available'}
                        onChange={e => updateCapacity(agent.email, 'availability', e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400">
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="away">Away</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}