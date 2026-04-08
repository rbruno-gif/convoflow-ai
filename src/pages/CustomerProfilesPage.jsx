import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Search, Mail, Phone, Tag, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CustomerProfilesPage() {
  const { activeBrandId } = useBrand();
  const [search, setSearch] = useState('');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.CustomerProfile.filter({ brand_id: activeBrandId }, '-last_contact_date')
      : [],
  });

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage customer information</p>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <p className="text-sm text-gray-500">No customers found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Conversations</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Open Tickets</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Tags</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{customer.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {customer.email && (
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <Mail className="w-3 h-3" /> {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{customer.total_conversations || 0}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{customer.open_tickets || 0}</p>
                    </td>
                    <td className="px-6 py-4">
                      {customer.tags?.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {customer.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[11px] px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">
                              {tag}
                            </span>
                          ))}
                          {customer.tags.length > 2 && (
                            <span className="text-[11px] px-2 py-1 text-gray-500">+{customer.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 text-sm font-medium"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}