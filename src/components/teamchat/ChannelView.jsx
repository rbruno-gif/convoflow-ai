import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, Lock, Megaphone, Globe, Send, Paperclip, Bot, Pin, Smile, Link, AtSign } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const CHANNEL_ICONS = { public: Hash, private: Lock, announcements: Megaphone, 'cross-brand': Globe };
const EMOJIS = ['👍', '❤️', '😂', '🔥', '✅', '👀', '🎉', '💯'];

export default function ChannelView({ channel, user, allUsers, brandId }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(null);
  const bottomRef = useRef(null);
  const qc = useQueryClient();
  const isAnnouncements = channel.type === 'announcements';
  const canPost = !isAnnouncements || user?.role === 'admin';

  const { data: messages = [] } = useQuery({
    queryKey: ['team-msgs', channel.id],
    queryFn: () => base44.entities.TeamMessage.filter({ channel_id: channel.id }, 'created_date', 300),
    refetchInterval: 4000,
  });

  useEffect(() => {
    const unsub = base44.entities.TeamMessage.subscribe(event => {
      if (event.data?.channel_id === channel.id) {
        qc.invalidateQueries({ queryKey: ['team-msgs', channel.id] });
      }
    });
    return unsub;
  }, [channel.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const getUser = (email) => allUsers.find(u => u.email === email);

  const sendMessage = async (content, type = 'text') => {
    if (!content.trim() || sending) return;
    setSending(true);
    const payload = {
      channel_id: channel.id,
      brand_id: brandId || channel.brand_id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content: content.trim(),
      type,
      is_announcement: isAnnouncements,
    };

    // Extract mentions
    const mentionMatches = content.match(/@(\w+)/g) || [];
    const mentions = mentionMatches.map(m => {
      const name = m.slice(1).toLowerCase();
      return allUsers.find(u => u.full_name?.toLowerCase().startsWith(name) || u.email?.toLowerCase().startsWith(name))?.email;
    }).filter(Boolean);
    if (mentions.length) payload.mentions = mentions;

    if (content.startsWith('/ask ')) {
      // AI query — visible only to sender
      const question = content.slice(5);
      payload.content = question;
      payload.type = 'text';
      await base44.entities.TeamMessage.create(payload);

      // Generate AI response
      const [faqs, knowledgeDocs] = await Promise.all([
        brandId ? base44.entities.FAQ.filter({ brand_id: brandId, is_active: true }) : base44.entities.FAQ.filter({ is_active: true }),
        brandId ? base44.entities.KnowledgeDoc.filter({ brand_id: brandId, is_active: true }) : base44.entities.KnowledgeDoc.filter({ is_active: true }),
      ]);
      const context = [
        ...faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`),
        ...knowledgeDocs.map(d => `# ${d.title}\n${d.content}`),
      ].join('\n\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an internal AI assistant for support agents. Answer this agent's question using the knowledge base:\n\n${context}\n\nQuestion: ${question}\n\nBe concise and direct.`,
        model: 'gpt_4o_mini',
      });
      await base44.entities.TeamMessage.create({
        channel_id: channel.id,
        brand_id: brandId || channel.brand_id,
        sender_email: 'ai@system',
        sender_name: 'AI Assistant',
        content: typeof result === 'string' ? result : result?.text || 'No answer found.',
        type: 'ai_response',
        is_ai_response: true,
        visible_to: user.email,
      });
    } else {
      await base44.entities.TeamMessage.create(payload);
    }
    qc.invalidateQueries({ queryKey: ['team-msgs', channel.id] });
    setInput('');
    setSending(false);
  };

  const addReaction = async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    const reactions = { ...(msg.reactions || {}) };
    const list = reactions[emoji] || [];
    if (list.includes(user.email)) {
      reactions[emoji] = list.filter(e => e !== user.email);
    } else {
      reactions[emoji] = [...list, user.email];
    }
    await base44.entities.TeamMessage.update(msgId, { reactions });
    qc.invalidateQueries({ queryKey: ['team-msgs', channel.id] });
    setShowEmoji(null);
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSending(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.TeamMessage.create({
      channel_id: channel.id,
      brand_id: brandId || channel.brand_id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content: `📎 ${file.name}`,
      type: 'file',
      file_url,
      file_name: file.name,
    });
    qc.invalidateQueries({ queryKey: ['team-msgs', channel.id] });
    setSending(false);
  };

  const Icon = CHANNEL_ICONS[channel.type] || Hash;

  // Filter out AI responses not for this user
  const visibleMessages = messages.filter(m => !m.visible_to || m.visible_to === user?.email);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
        <div>
          <p className="font-semibold text-sm text-gray-900">{channel.name}</p>
          {channel.description && <p className="text-xs text-gray-400">{channel.description}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isAnnouncements && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold flex items-center gap-1">
              <Megaphone className="w-3 h-3" /> Announcements only
            </span>
          )}
          <span className="text-xs text-gray-400">{visibleMessages.length} messages</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1" style={{ background: '#fafafa' }}>
        {visibleMessages.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Icon className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Be the first to post in #{channel.name}</p>
          </div>
        )}
        {visibleMessages.map((msg, i) => {
          const isFirst = i === 0 || visibleMessages[i - 1]?.sender_email !== msg.sender_email;
          const isAI = msg.is_ai_response;
          const isAnnounce = msg.is_announcement;
          const sender = getUser(msg.sender_email);

          return (
            <div key={msg.id} className={cn('group relative', isFirst ? 'mt-4' : 'mt-0.5')}>
              {isFirst && (
                <div className="flex items-center gap-2.5 mb-1">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0',
                    isAI ? 'bg-violet-600' : '')}
                    style={!isAI ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
                    {isAI ? '🤖' : (sender?.full_name || msg.sender_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className={cn('text-xs font-semibold', isAI ? 'text-violet-700' : 'text-gray-800')}>
                    {isAI ? 'AI Assistant (private)' : sender?.full_name || msg.sender_name}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {msg.created_date ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true }) : ''}
                  </span>
                  {isAnnounce && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">📢 Announcement</span>}
                  {isAI && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">🔒 Only you</span>}
                </div>
              )}
              <div className="pl-9.5">
                <div className={cn('inline-block max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                  isAI ? 'bg-violet-50 border border-violet-200 text-violet-900' :
                  isAnnounce ? 'bg-orange-50 border border-orange-200 text-gray-800 w-full max-w-full' :
                  'text-gray-800'
                )} style={{ paddingLeft: isFirst ? undefined : '36px' }}>
                  <p className="whitespace-pre-wrap break-words">{renderContent(msg.content, allUsers)}</p>
                  {msg.file_url && (
                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 mt-2 text-xs text-violet-600 underline hover:text-violet-800">
                      <Paperclip className="w-3 h-3" /> {msg.file_name || 'Download file'}
                    </a>
                  )}
                </div>

                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 ml-0">
                    {Object.entries(msg.reactions).filter(([, list]) => list.length > 0).map(([emoji, list]) => (
                      <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                        className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border transition-all',
                          list.includes(user?.email) ? 'bg-violet-100 border-violet-300 text-violet-800' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200')}>
                        {emoji} {list.length}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover actions */}
              <div className="absolute right-2 top-0 hidden group-hover:flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm px-1.5 py-1">
                <button onClick={() => setShowEmoji(showEmoji === msg.id ? null : msg.id)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                  <Smile className="w-3.5 h-3.5" />
                </button>
                {showEmoji === msg.id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1 z-10">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => addReaction(msg.id, e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canPost ? (
        <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
          {isAnnouncements && (
            <p className="text-[10px] text-orange-600 mb-1.5 flex items-center gap-1">
              <Megaphone className="w-3 h-3" /> Posting as announcement — all agents will be notified
            </p>
          )}
          <p className="text-[10px] text-gray-400 mb-1">
            <span className="font-mono bg-gray-100 px-1 rounded">/ask [question]</span> to query AI ·
            <span className="font-mono bg-gray-100 px-1 rounded ml-1">@name</span> to mention ·
            <span className="text-violet-500 ml-1">Enter</span> to send
          </p>
          <div className="flex gap-2 items-end">
            <label className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <input type="file" className="hidden" onChange={uploadFile} />
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); setInput(''); } }}
              placeholder={`Message #${channel.name}${isAnnouncements ? ' (announcement)' : ''}`}
              rows={2}
              className="flex-1 resize-none text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button onClick={() => { sendMessage(input); setInput(''); }} disabled={sending || !input.trim()}
              className="p-2.5 rounded-xl text-white disabled:opacity-40 shrink-0 transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 bg-orange-50 border-t border-orange-100 text-xs text-orange-700 flex items-center gap-2">
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          Only managers and admins can post in #announcements. You can react with emoji.
        </div>
      )}
    </div>
  );
}

function renderContent(text, allUsers) {
  if (!text) return '';
  return text.split(/(@\w+)/g).map((part, i) => {
    if (part.startsWith('@')) {
      const name = part.slice(1).toLowerCase();
      const u = allUsers.find(u => u.full_name?.toLowerCase().startsWith(name) || u.email?.toLowerCase().startsWith(name));
      return <span key={i} className="bg-violet-100 text-violet-800 rounded px-1 font-semibold">{part}</span>;
    }
    return part;
  });
}