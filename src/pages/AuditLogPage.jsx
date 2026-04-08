import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Search, Download, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const actionColors = {
  BRAND_CREATED: '#10b981',
  AGENT_INVITED: '#3b82f6',
  SETTINGS_UPDATED: '#f59e0b',
  DATA_EXPORTED: '#8b5cf6',
  CUSTOMER_DELETED: '#ef4444',
};

export default function AuditLogPage() {
  const { activeBrandId } = useBrand();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.AuditLog.filter({ brand_id: activeBrandId }, '-created_date', 500)
      : base44.entities.AuditLog.list('-created_date', 500),
  });

  const filtered = logs.filter(l =>
    l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.action_type?.toLowerCase().includes(search.toLowerCase()) ||
    l.target_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500 mt-1">Complete record of all actions taken in this brand</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by actor, action, or target..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <p className="text-sm text-gray-500">No audit records found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: actionColors[log.action_type] || '#6b7280' }}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{log.actor_name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {log.action_type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      {log.target_name && (
                        <p className="text-sm text-gray-600">{log.target_name}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedId === log.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedId === log.id && (
                  <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 text-xs font-mono text-gray-600 max-h-96 overflow-auto">
                    <p className="mb-3"><strong>Action:</strong> {log.action_type}</p>
                    <p className="mb-3"><strong>Actor:</strong> {log.actor_email}</p>
                    <p className="mb-3"><strong>IP:</strong> {log.ip_address}</p>
                    {log.before_value && (
                      <div className="mb-3">
                        <p className="font-semibold mb-1">Before:</p>
                        <pre className="bg-white p-2 rounded overflow-auto">
                          {JSON.stringify(log.before_value, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after_value && (
                      <div>
                        <p className="font-semibold mb-1">After:</p>
                        <pre className="bg-white p-2 rounded overflow-auto">
                          {JSON.stringify(log.after_value, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}