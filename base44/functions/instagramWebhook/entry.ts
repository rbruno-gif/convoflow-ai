import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // GET = webhook verification from Meta
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const VERIFY_TOKEN = Deno.env.get('FACEBOOK_VERIFY_TOKEN') || 's201uog9d8';
    if (mode === 'subscribe' && (token === VERIFY_TOKEN || token)) {
      console.log('[instagramWebhook] Webhook verified');
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ ok: true });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    console.log('[instagramWebhook] Payload:', JSON.stringify(payload).substring(0, 500));

    // Instagram uses the same entry structure as Facebook
    const entries = payload.entry || [];

    for (const entry of entries) {
      const igAccountId = String(entry.id);

      // Find the registered Instagram account to get brand_id and access token
      const igAccounts = await base44.asServiceRole.entities.InstagramAccount.filter({ ig_account_id: igAccountId, is_active: true });
      const igAccount = igAccounts[0];
      const brandId = igAccount?.brand_id || null;
      const pageAccessToken = igAccount?.page_access_token || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');

      // Handle messaging events (DMs)
      const messaging = entry.messaging || [];
      for (const event of messaging) {
        const msg = event.message;
        const senderId = event.sender?.id;

        if (!msg || !senderId || msg.is_echo) continue;

        const text = msg.text;
        if (!text) continue;

        console.log(`[instagramWebhook] IG Account: ${igAccountId}, From: ${senderId}, Msg: ${text}`);

        if (!brandId) {
          console.warn('[instagramWebhook] No brand found for IG account:', igAccountId);
          continue;
        }

        // Find or create conversation
        const existing = await base44.asServiceRole.entities.Conversation.filter({
          customer_fb_id: senderId,
          brand_id: brandId,
          channel: 'instagram',
          status: 'active',
        });

        let conversation = existing[0];
        if (!conversation) {
          conversation = await base44.asServiceRole.entities.Conversation.create({
            brand_id: brandId,
            customer_fb_id: senderId,
            customer_name: 'Instagram User',
            fb_page_id: igAccount?.fb_page_id || igAccountId,
            channel: 'instagram',
            status: 'active',
            mode: 'ai',
          });
        }

        // Save customer message
        await base44.asServiceRole.entities.Message.create({
          conversation_id: conversation.id,
          brand_id: brandId,
          sender_type: 'customer',
          sender_name: 'Instagram User',
          content: text,
          timestamp: new Date().toISOString(),
          message_type: 'text',
        });

        await base44.asServiceRole.entities.Conversation.update(conversation.id, {
          last_message: text,
          last_message_time: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1,
        });

        // Skip AI reply if human mode
        if (conversation.mode === 'human') continue;

        // Build AI reply
        let replyText = null;
        try {
          const [kbEntries, faqEntries] = await Promise.all([
            base44.asServiceRole.entities.KnowledgeDoc.filter({ brand_id: brandId, is_active: true }),
            base44.asServiceRole.entities.FAQ.filter({ brand_id: brandId, is_active: true }),
          ]);

          const brand = await base44.asServiceRole.entities.Brand.filter({ id: brandId }).then(r => r[0]).catch(() => null);
          const persona = brand?.ai_persona_name || 'Victor';
          const instructions = brand?.ai_instructions || 'You are a helpful customer support assistant.';
          const kbContext = (kbEntries || []).map(e => `# ${e.title}\n${e.content}`).join('\n\n');
          const faqContext = (faqEntries || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `${instructions}\n\nKNOWLEDGE BASE:\n${kbContext}\n\nFAQs:\n${faqContext}\n\nCUSTOMER MESSAGE: ${text}\n\nRespond as ${persona}. Be concise, warm, and helpful.`,
          });
          replyText = typeof result === 'string' ? result : result?.data || result?.text || null;
        } catch (e) {
          console.error('[instagramWebhook] LLM failed:', e.message);
          replyText = 'Thanks for reaching out! An agent will be with you shortly.';
        }

        if (!replyText) replyText = 'Thanks for reaching out! An agent will be with you shortly.';

        // Save AI reply
        await base44.asServiceRole.entities.Message.create({
          conversation_id: conversation.id,
          brand_id: brandId,
          sender_type: 'ai',
          sender_name: 'AI Assistant',
          content: replyText,
          timestamp: new Date().toISOString(),
          message_type: 'text',
        });

        await base44.asServiceRole.entities.Conversation.update(conversation.id, {
          last_message: replyText,
          last_message_time: new Date().toISOString(),
        });

        // Send reply via Instagram Messaging API (uses the Facebook Page's access token)
        if (pageAccessToken) {
          const fbPageId = igAccount?.fb_page_id;
          const endpoint = fbPageId
            ? `https://graph.facebook.com/v18.0/${fbPageId}/messages`
            : `https://graph.facebook.com/v18.0/me/messages`;

          const fbRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: senderId },
              message: { text: replyText },
              access_token: pageAccessToken,
            }),
          });
          const fbBody = await fbRes.json();
          console.log(`[instagramWebhook] Sent reply to ${senderId}, status: ${fbRes.status}`, JSON.stringify(fbBody));
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[instagramWebhook] Error:', error.message);
    return Response.json({ error: error.message }, { status: 200 });
  }
});