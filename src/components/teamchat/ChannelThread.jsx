import { useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Smile } from 'lucide-react';

export default function ChannelThread({ messages, user, channel }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-sm font-medium">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.is_system ? (
            <div className="text-center text-xs text-gray-400 italic py-2">
              {msg.content}
            </div>
          ) : (
            <div className={`flex gap-3 ${msg.sender_id === user?.email ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                {msg.sender_name?.charAt(0) || '?'}
              </div>
              <div className={`flex-1 max-w-sm ${msg.sender_id === user?.email ? 'text-right' : ''}`}>
                <div className="flex items-baseline gap-2" style={{ justifyContent: msg.sender_id === user?.email ? 'flex-end' : 'flex-start' }}>
                  <span className="text-xs font-semibold text-gray-900">{msg.sender_name}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                  </span>
                </div>
                <p className={`text-sm text-gray-900 mt-0.5 break-words ${msg.sender_id === user?.email ? 'bg-purple-100 text-gray-900' : 'bg-gray-100'} px-3 py-2 rounded-lg inline-block`}>
                  {msg.content}
                </p>
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap" style={{ justifyContent: msg.sender_id === user?.email ? 'flex-end' : 'flex-start' }}>
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <button key={emoji} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1 transition-colors">
                        <span>{emoji}</span>
                        <span className="text-gray-500">{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}