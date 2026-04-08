import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import ChatSidebar from '@/components/teamchat/ChatSidebar';
import ChannelView from '@/components/teamchat/ChannelView';
import DMView from '@/components/teamchat/DMView';
import { MessageSquare } from 'lucide-react';

export default function TeamChat() {
  const [view, setView] = useState(null); // { type: 'channel'|'dm', id }
  const [user, setUser] = useState(null);
  const { activeBrandId, activeBrand, brands } = useBrand();
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Set presence online
      base44.entities.AgentPresence.filter({ agent_email: u.email }).then(list => {
        if (list.length > 0) {
          base44.entities.AgentPresence.update(list[0].id, { status: 'online', last_seen: new Date().toISOString() });
        } else {
          base44.entities.AgentPresence.create({ agent_email: u.email, status: 'online', last_seen: new Date().toISOString() });
        }
      });
    }).catch(() => {});
  }, []);

  // Auto-create default channels for active brand if missing
  const { data: channels = [] } = useQuery({
    queryKey: ['team-channels', activeBrandId],
    queryFn: async () => {
      const filter = activeBrandId ? { brand_id: activeBrandId } : {};
      const existing = await base44.entities.TeamChannel.filter(filter);
      if (activeBrandId && existing.length === 0) {
        const defaults = ['general', 'support', 'escalations', 'announcements'];
        for (const name of defaults) {
          await base44.entities.TeamChannel.create({
            brand_id: activeBrandId,
            name,
            type: name === 'announcements' ? 'announcements' : 'public',
            is_default: true,
          });
        }
        return base44.entities.TeamChannel.filter({ brand_id: activeBrandId });
      }
      return existing;
    },
    enabled: true,
  });

  const { data: dmThreads = [] } = useQuery({
    queryKey: ['dm-threads', user?.email],
    queryFn: () => base44.entities.DMThread.list('-last_message_time', 50),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: presences = [] } = useQuery({
    queryKey: ['presences'],
    queryFn: () => base44.entities.AgentPresence.list(),
    refetchInterval: 30000,
  });

  const myDMs = dmThreads.filter(t => t.participants?.includes(user?.email));

  const activeView = view?.type === 'channel'
    ? channels.find(c => c.id === view.id)
    : view?.type === 'dm'
    ? myDMs.find(t => t.id === view.id)
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <ChatSidebar
        channels={channels}
        dmThreads={myDMs}
        user={user}
        allUsers={allUsers}
        presences={presences}
        brands={brands}
        activeBrandId={activeBrandId}
        activeView={view}
        onSelect={setView}
        onChannelCreated={() => qc.invalidateQueries({ queryKey: ['team-channels', activeBrandId] })}
        onDMCreated={(thread) => { qc.invalidateQueries({ queryKey: ['dm-threads', user?.email] }); setView({ type: 'dm', id: thread.id }); }}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {view?.type === 'channel' && activeView && (
          <ChannelView channel={activeView} user={user} allUsers={allUsers} brandId={activeBrandId} />
        )}
        {view?.type === 'dm' && activeView && (
          <DMView thread={activeView} user={user} allUsers={allUsers} presences={presences} />
        )}
        {!view && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed22, #4f46e522)' }}>
                <MessageSquare className="w-8 h-8 text-violet-400" />
              </div>
              <p className="font-semibold text-gray-700">Welcome to Team Chat</p>
              <p className="text-sm text-gray-400 mt-1">Select a channel or DM to start messaging</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}