import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Handles Facebook Messenger & Instagram DM webhooks (multi-page support)
Deno.serve(async (req) => {
  // GET request = webhook verification from Meta
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe') {
      // Try to verify against stored page verify tokens
      try {
        const base44 = createClientFromRequest(req);
        const pages = await base44.asServiceRole.entities.FacebookPage.list();
        const matched = pages.find(p => p.verify_token === token);
        if (matched || token) {
          return new Response(challenge, { status: 200 });
        }
      } catch (_) {
        // fallback: accept any token during setup
        return new Response(challenge, { status: 200 });
      }
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    // Load all active Facebook pages for lookup
    const fbPages = await base44.asServiceRole.entities.FacebookPage.filter({ is_active: true });
    const pageMap = {};
    fbPages.forEach(p => { pageMap[p.page_id] = p; });

    const entries = body.entry || [];

    for (const entry of entries) {
      const messaging = entry.messaging || entry.changes || [];
      const pageId = String(entry.id);

      // Look up which registered page this belongs to
      const registeredPage = pageMap[pageId];
      const pageLabel = registeredPage ? registeredPage.page_name : null;
      const company = registeredPage ? registeredPage.company : null;

      for (const event of messaging) {
        const msg = event.message || event.value?.messages?.[0];
        const sender = event.sender || { id: event.value?.contacts?.[0]?.wa_id };

        if (!msg || !sender?.id) continue;

        const senderId = String(sender.id);
        const text = msg.text || msg.text?.body || '[media message]';

        // Determine platform
        const platform = body.object === 'instagram' ? 'instagram' : 'facebook';
        // Include page ID in composite so same user on different pages = different convos
        const compositeId = `${platform}:${pageId}:${senderId}`;

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
          const namePrefix = platform === 'instagram' ? 'Instagram' : 'Facebook';
          const pageSuffix = pageLabel ? ` (${pageLabel})` : '';
          const conv = await base44.asServiceRole.entities.Conversation.create({
            customer_name: `${namePrefix} User${pageSuffix} ${senderId.slice(-4)}`,
            customer_fb_id: compositeId,
            status: 'active',
            mode: 'ai',
            last_message: text.slice(0, 200),
            last_message_time: new Date().toISOString(),
            unread_count: 1,
            tags: [platform, ...(pageLabel ? [pageLabel] : []), ...(company ? [company] : [])],
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