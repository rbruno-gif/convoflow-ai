/// <reference lib="deno.window" />
/// <reference lib="deno.window" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DEFAULT_CHANNELS = [
  { name: 'general', type: 'public', description: 'General team discussion' },
  { name: 'support', type: 'public', description: 'Support team coordination' },
  { name: 'escalations', type: 'public', description: 'Escalated conversations requiring attention' },
  { name: 'announcements', type: 'public', description: 'Team announcements from managers', manager_post_only: true },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { brandId } = await req.json();

    if (!brandId) {
      return Response.json({ error: 'Missing brandId' }, { status: 400 });
    }

    // Check existing channels
    const existingChannels = await base44.asServiceRole.entities.Channel.filter({ brand_id: brandId });
    const existingNames = existingChannels.map(c => c.name);

    // Create missing default channels
    const created = [];
    for (const defaultChannel of DEFAULT_CHANNELS) {
      if (!existingNames.includes(defaultChannel.name)) {
        const channel = await base44.asServiceRole.entities.Channel.create({
          brand_id: brandId,
          name: defaultChannel.name,
          type: defaultChannel.type,
          description: defaultChannel.description,
          is_default: true,
          manager_post_only: defaultChannel.manager_post_only || false,
          created_by: user.email,
        });

        // Create welcome system message
        await base44.asServiceRole.entities.ChannelMessage.create({
          brand_id: brandId,
          channel_id: channel.id,
          sender_id: 'system',
          sender_name: 'System',
          content: `Welcome to #${defaultChannel.name}! This channel was auto-created.`,
          is_system: true,
        });

        created.push(channel);
      }
    }

    return Response.json({ created: created.length, channels: created });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});