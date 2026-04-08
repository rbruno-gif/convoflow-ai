import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Shield, Search, Filter, Download } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const ACTION_COLORS = {
  transfer_conversation: '#3b82f6',
  delete_faq: '#ef4444',
  export_report: '#10b981',
  login: '#6b7280',
  update_settings: '#f59e0b',
  create_brand: '#7c3aed',
  update_role: '#8b5cf6',
  resolve_conversation: '#10b981',
};

const ACTION_ICONS = {
  transfer_conversation: '↔️',
  delete_faq: '🗑️',
  export_report: '📤',
  login: '🔐',
  update_settings: '⚙️',
  create_brand: '🏢',
  update_role: '👤',
  resolve_conversation: '✅',
};

export default function AuditLogPage() {
  const { activeBrandId, activeBrand } = useBrand();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.AuditLog.filter({ brand_id: activeBrandId }, '-created_date', 500)
      : base44.entities.AuditLog.list('-created_date', 500),
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.actor_email?.toLowerCase().includes(search.toLowerCase()) || l.actor_name?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !filterAction || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const exportCSV = () => {
    const rows = [
      ['Date', 'Actor', 'Action', 'Target', 'Details', 'Brand'],
      ...filtered.map(l => [l.created_date ? format(new Date(l.created_date), 'yyyy-MM-dd HH:mm') : '', l.actor_email, l.action, l.target_type || '', l.details || '', l.brand_id || '']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-log.csv'; a.click();
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-violet-600" /> Audit Log</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeBrand?.name || 'All brands'} · {filtered.length} entries</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actor, action, details…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Time', 'Actor', 'Action', 'Target', 'Details'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No audit log entries yet</td></tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-700">{log.created_date ? format(new Date(log.created_date), 'MMM d, HH:mm') : '—'}</p>
                      <p className="text-gray-400">{log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : ''}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{log.actor_name || log.actor_email}</p>
                    <p className="text-gray-400">{log.actor_email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit font-semibold"
                      style={{ background: `${ACTION_COLORS[log.action] || '#6b7280'}15`, color: ACTION_COLORS[log.action] || '#6b7280' }}>
                      <span>{ACTION_ICONS[log.action] || '📋'}</span>
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{log.target_type || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}