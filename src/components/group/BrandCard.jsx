import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useBrand } from '@/context/BrandContext';
import { MessageSquare, Users, AlertCircle, CheckCircle, Archive } from 'lucide-react';

export default function BrandCard({ brand, onRefresh }) {
  const { switchBrand } = useBrand();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', brand.id],
    queryFn: () => base44.entities.Conversation.filter({ brand_id: brand.id }),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', brand.id],
    queryFn: () => base44.entities.Agent.filter({ brand_id: brand.id }),
  });

  const openConversations = conversations.filter(c => c.status !== 'resolved').length;
  const totalConversations = conversations.length;

  const statusIcon = brand.is_archived ? (
    <Archive className="w-3 h-3 text-gray-400" />
  ) : brand.is_active ? (
    <CheckCircle className="w-3 h-3 text-green-500" />
  ) : (
    <AlertCircle className="w-3 h-3 text-yellow-500" />
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
          style={{ background: brand.primary_color || '#7c3aed' }}
        >
          {brand.name?.slice(0, 2)?.toUpperCase() || '??'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{brand.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            {statusIcon}
            <p className="text-[11px] text-gray-500">
              {brand.is_archived ? 'Archived' : brand.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <MessageSquare className="w-3 h-3 text-blue-500" />
            <p className="text-[10px] text-gray-500">Conversations</p>
          </div>
          <p className="text-sm font-bold text-gray-900">{totalConversations}</p>
          <p className="text-[10px] text-gray-400">{openConversations} open</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <Users className="w-3 h-3 text-purple-500" />
            <p className="text-[10px] text-gray-500">Agents</p>
          </div>
          <p className="text-sm font-bold text-gray-900">{agents.length}</p>
        </div>
      </div>

      {/* Website */}
      {brand.website_url && (
        <p className="text-[11px] text-gray-500 mb-4 truncate">{brand.website_url}</p>
      )}

      {/* Action */}
      <button
        onClick={() => switchBrand(brand.id)}
        className="w-full py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Enter Brand
      </button>
    </div>
  );
}