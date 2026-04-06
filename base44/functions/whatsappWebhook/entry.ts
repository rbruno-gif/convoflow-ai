import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Handles WhatsApp Cloud API webhooks
Deno.serve(async (req) => {
  // GET = webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const challenge = url.searchParams.get('hub.challenge');
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
      const changes = entry.changes || [];
      for (const change of changes) {
        const messages = change.value?.messages || [];
        const contacts = change.value?.contacts || [];

        for (const msg of messages) {
          const senderId = msg.from; // phone number
          const text = msg.text?.body || msg.type || '[media message]';
          const senderName = contacts.find((c) => c.wa_id === senderId)?.profile?.name || `WhatsApp +${senderId}`;

          const compositeId = `whatsapp:${senderId}`;

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
              customer_name: senderName,
              customer_fb_id: compositeId,
              status: 'active',
              mode: 'ai',
              last_message: text.slice(0, 200),
              last_message_time: new Date().toISOString(),
              unread_count: 1,
              tags: ['whatsapp'],
            });
            convId = conv.id;
          }

          await base44.asServiceRole.entities.Message.create({
            conversation_id: convId,
            sender_type: 'customer',
            sender_name: `📱 ${senderName}`,
            content: text,
            timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
            is_read: false,
            message_type: 'text',
          });
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});