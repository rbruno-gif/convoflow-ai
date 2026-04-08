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
    const { brandId, userId } = await req.json();

    if (!brandId || !userId) {
      return Response.json({ error: 'Missing brandId or userId' }, { status: 400 });
    }

    const created = [];
    for (const defaultChannel of DEFAULT_CHANNELS) {
      const channel = await base44.asServiceRole.entities.Channel.create({
        brand_id: brandId,
        name: defaultChannel.name,
        type: defaultChannel.type,
        description: defaultChannel.description,
        is_default: true,
        manager_post_only: defaultChannel.manager_post_only || false,
        created_by: userId,
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

    return Response.json({ success: true, channels: created });
  } catch (error) {
    console.error('Provision error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});