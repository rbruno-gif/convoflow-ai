import { User, Phone, Mail, MapPin, Tag, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CustomerSidebar({ conversation }) {
  if (!conversation) return null;

  const info = [
    { icon: Phone, label: 'Phone', value: conversation.customer_fb_id || '—' },
    { icon: Mail, label: 'Channel', value: conversation.tags?.join(', ') || 'Website Chat' },
    { icon: MapPin, label: 'Location', value: '—' },
    { icon: Clock, label: 'Last seen', value: conversation.last_message_time ? formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true }) : '—' },
  ];

  return (
    <div className="w-64 shrink-0 border-l border-gray-100 bg-white flex flex-col overflow-y-auto">
      {/* Customer header */}
      <div className="p-5 border-b border-gray-100 text-center">
        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl mb-3"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {conversation.customer_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <p className="font-bold text-sm text-gray-900">{conversation.customer_name}</p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            conversation.status === 'active' ? 'bg-green-100 text-green-700' :
            conversation.status === 'resolved' ? 'bg-gray-100 text-gray-600' :
            conversation.status === 'flagged' ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {conversation.status?.replace('_', ' ')}
          </span>
          {conversation.mode === 'ai' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700">AI</span>
          )}
        </div>
      </div>

      {/* Info rows */}
      <div className="p-4 space-y-3 border-b border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Contact Info</p>
        {info.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400">{label}</p>
              <p className="text-xs font-medium text-gray-700 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {conversation.tags && conversation.tags.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {conversation.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Sentiment */}
      {conversation.sentiment && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Sentiment</p>
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
            conversation.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
            conversation.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {conversation.sentiment === 'positive' ? '😊 Positive' :
             conversation.sentiment === 'negative' ? '😞 Negative' : '😐 Neutral'}
          </span>
        </div>
      )}

      {/* Intent */}
      {conversation.intent && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Intent</p>
          <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
            {conversation.intent?.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* AI Summary */}
      {conversation.conversation_summary && (
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">AI Summary</p>
          <p className="text-xs text-gray-600 leading-relaxed">{conversation.conversation_summary}</p>
        </div>
      )}
    </div>
  );
}