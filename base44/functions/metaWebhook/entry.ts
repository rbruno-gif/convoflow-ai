import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Handles Facebook Messenger & Instagram DM webhooks
Deno.serve(async (req) => {
  // GET request = webhook verification from Meta
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    // Accept any verify token (user configures this on Meta side)
    if (mode === 'subscribe') {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const entries = body.entry || [];

    for (const entry of entries) {
      const messaging = entry.messaging || entry.changes || [];

      for (const event of messaging) {
        const msg = event.message || event.value?.messages?.[0];
        const sender = event.sender || { id: event.value?.contacts?.[0]?.wa_id };

        if (!msg || !sender?.id) continue;

        const senderId = String(sender.id);
        const text = msg.text || msg.text?.body || '[media message]';
        const pageId = String(entry.id);

        // Determine platform
        const platform = body.object === 'instagram' ? 'instagram' : 'facebook';
        const compositeId = `${platform}:${senderId}`;

        // Find or create conversation
        const existing = await base44.asServiceRole.entities.Conversation.filter({
          customer_fb_id: compositeId,
        });

        let convId;
        if (existing.length > 0) {
          convId = existing[0].id;
          await base44.asServiceRole.entities.Conversation.update(convId, {
            last_message: text.slice(0, 200),
            last_message_time: new Date().toISOString(),
            unread_count: (existing[0].unread_count || 0) + 1,
            status: 'active',
          });
        } else {
          const conv = await base44.asServiceRole.entities.Conversation.create({
            customer_name: `${platform === 'instagram' ? 'Instagram' : 'Facebook'} User ${senderId.slice(-4)}`,
            customer_fb_id: compositeId,
            status: 'active',
            mode: 'ai',
            last_message: text.slice(0, 200),
            last_message_time: new Date().toISOString(),
            unread_count: 1,
            tags: [platform],
          });
          convId = conv.id;
        }

        await base44.asServiceRole.entities.Message.create({
          conversation_id: convId,
          sender_type: 'customer',
          sender_name: `${platform === 'instagram' ? '📸' : '📘'} ${senderId.slice(-6)}`,
          content: text,
          timestamp: new Date().toISOString(),
          is_read: false,
          message_type: 'text',
        });
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});