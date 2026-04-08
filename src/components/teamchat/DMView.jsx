import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Paperclip, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

function statusColor(s) {
  if (s === 'online') return '#22c55e';
  if (s === 'away') return '#f59e0b';
  if (s === 'dnd') return '#ef4444';
  return '#6b7280';
}

function statusLabel(s) {
  return s === 'online' ? 'Online' : s === 'away' ? 'Away' : s === 'dnd' ? 'Do Not Disturb' : 'Offline';
}

export default function DMView({ thread, user, allUsers, presences }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  const otherEmail = thread.participants?.find(e => e !== user?.email);
  const otherUser = allUsers.find(u => u.email === otherEmail);
  const presence = presences.find(p => p.agent_email === otherEmail);

  const { data: messages = [] } = useQuery({
    queryKey: ['dm-msgs', thread.id],
    queryFn: () => base44.entities.TeamMessage.filter({ dm_thread_id: thread.id }, 'created_date', 200),
    refetchInterval: 3000,
  });

  useEffect(() => {
    const unsub = base44.entities.TeamMessage.subscribe(event => {
      if (event.data?.dm_thread_id === thread.id) {
        qc.invalidateQueries({ queryKey: ['dm-msgs', thread.id] });
      }
    });
    return unsub;
  }, [thread.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    await base44.entities.TeamMessage.create({
      dm_thread_id: thread.id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content,
      type: 'text',
    });
    await base44.entities.DMThread.update(thread.id, {
      last_message: content,
      last_message_time: new Date().toISOString(),
    });
    qc.invalidateQueries({ queryKey: ['dm-msgs', thread.id] });
    qc.invalidateQueries({ queryKey: ['dm-threads', user?.email] });
    setSending(false);
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSending(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.TeamMessage.create({
      dm_thread_id: thread.id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content: `📎 ${file.name}`,
      type: 'file',
      file_url,
      file_name: file.name,
    });
    qc.invalidateQueries({ queryKey: ['dm-msgs', thread.id] });
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold text-sm">
            {(otherUser?.full_name || otherEmail || '?').charAt(0).toUpperCase()}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: statusColor(presence?.status) }} />
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">{otherUser?.full_name || otherEmail}</p>
          <p className="text-xs text-gray-400">{statusLabel(presence?.status)} · {otherUser?.role}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background: '#fafafa' }}>
        {messages.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm font-medium">Start a conversation</p>
            <p className="text-xs mt-1">Messages are private between you and {otherUser?.full_name || otherEmail}</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_email === user?.email;
          return (
            <div key={msg.id} className={cn('flex gap-2.5', isMine ? 'justify-end' : 'justify-start')}>
              {!isMine && (
                <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                  {(otherUser?.full_name || otherEmail || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className={cn('max-w-[70%]')}>
                <div className={cn('px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                  isMine ? 'text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                )} style={isMine ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  {msg.file_url && (
                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 mt-2 text-xs underline opacity-80 hover:opacity-100">
                      <Paperclip className="w-3 h-3" /> {msg.file_name}
                    </a>
                  )}
                </div>
                <p className={cn('text-[10px] text-gray-400 mt-1', isMine ? 'text-right' : 'text-left')}>
                  {msg.created_date ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true }) : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2 items-end shrink-0">
        <label className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer shrink-0">
          <Paperclip className="w-4 h-4 text-gray-500" />
          <input type="file" className="hidden" onChange={uploadFile} />
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={`Message ${otherUser?.full_name || otherEmail}…`}
          rows={2}
          className="flex-1 resize-none text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button onClick={sendMessage} disabled={sending || !input.trim()}
          className="p-2.5 rounded-xl text-white disabled:opacity-40 shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}