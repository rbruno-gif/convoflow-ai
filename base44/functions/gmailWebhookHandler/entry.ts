import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// This function handles real-time Gmail webhook events (triggered by the automation)
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const messageIds = body.data?.new_message_ids ?? [];
    if (messageIds.length === 0) return Response.json({ skipped: true });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    let synced = 0;

    for (const messageId of messageIds) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );
      if (!msgRes.ok) continue;
      const msg = await msgRes.json();

      const headers = msg.payload?.headers || [];
      const getHeader = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      const from = getHeader('From');
      const subject = getHeader('Subject');
      const date = getHeader('Date');

      let bodyText = '';
      const parts = msg.payload?.parts || [];
      const textPart = parts.find((p) => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        bodyText = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (msg.payload?.body?.data) {
        bodyText = atob(msg.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }

      const fromMatch = from.match(/^(.*?)\s*<(.+?)>/) || [];
      const senderName = fromMatch[1]?.trim() || from;
      const senderEmail = fromMatch[2] || from;

      const existing = await base44.asServiceRole.entities.Conversation.filter({
        customer_fb_id: `email:${senderEmail}`,
      });

      let convId;
      if (existing.length > 0) {
        convId = existing[0].id;
        await base44.asServiceRole.entities.Conversation.update(convId, {
          last_message: subject || bodyText.slice(0, 80),
          last_message_time: new Date(date || Date.now()).toISOString(),
          unread_count: (existing[0].unread_count || 0) + 1,
          status: 'active',
        });
      } else {
        const conv = await base44.asServiceRole.entities.Conversation.create({
          customer_name: senderName || senderEmail,
          customer_fb_id: `email:${senderEmail}`,
          status: 'active',
          mode: 'ai',
          last_message: subject || bodyText.slice(0, 80),
          last_message_time: new Date(date || Date.now()).toISOString(),
          unread_count: 1,
          tags: ['email'],
        });
        convId = conv.id;
      }

      await base44.asServiceRole.entities.Message.create({
        conversation_id: convId,
        sender_type: 'customer',
        sender_name: senderName || senderEmail,
        content: subject ? `📧 ${subject}\n\n${bodyText.slice(0, 1000)}` : bodyText.slice(0, 1000),
        timestamp: new Date(date || Date.now()).toISOString(),
        is_read: false,
        message_type: 'text',
      });

      synced++;
    }

    return Response.json({ synced });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});