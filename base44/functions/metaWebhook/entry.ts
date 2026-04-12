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
      console.log('Facebook webhook verified');
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

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const fbPages = await base44.asServiceRole.entities.FacebookPage.filter({ is_active: true });
    const pageMap = {};
    fbPages.forEach(p => { pageMap[p.page_id] = p; });

    const entries = payload.entry || [];

    for (const entry of entries) {
      const pageId = String(entry.id);
      const registeredPage = pageMap[pageId];
      const brandId = registeredPage?.brand_id || '69d5d0811141577dd21cc040';
      const pageAccessToken = registeredPage?.page_access_token || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');

      const messaging = entry.messaging || [];
      for (const event of messaging) {
        const msg = event.message;
        const senderId = event.sender?.id;

        if (!msg || !senderId || msg.is_echo) continue;

        const text = msg.text;
        if (!text) continue;

        console.log(`[metaWebhook] Page: ${pageId}, From: ${senderId}, Msg: ${text}`);

        // Find or create conversation
        const existing = await base44.asServiceRole.entities.Conversation.filter({
          customer_fb_id: senderId,
          brand_id: brandId,
          status: 'active',
        });

        let conversation = existing[0];
        if (!conversation) {
          conversation = await base44.asServiceRole.entities.Conversation.create({
            brand_id: brandId,
            customer_fb_id: senderId,
            customer_name: 'Facebook User',
            status: 'active',
            mode: 'ai',
            channel: 'facebook',
          });
        }

        // Save customer message
        await base44.asServiceRole.entities.Message.create({
          conversation_id: conversation.id,
          brand_id: brandId,
          sender_type: 'customer',
          sender_name: 'Facebook User',
          content: text,
          timestamp: new Date().toISOString(),
          message_type: 'text',
        });

        await base44.asServiceRole.entities.Conversation.update(conversation.id, {
          last_message: text,
          last_message_time: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1,
        });

        // Skip AI reply if in human mode
        if (conversation.mode === 'human') {
          console.log(`[metaWebhook] Human mode — skipping AI reply`);
          continue;
        }

        // Build AI reply
        let replyText = null;
        try {
          const [kbEntries, faqEntries, brandSettings] = await Promise.all([
            base44.asServiceRole.entities.KnowledgeDoc.filter({ brand_id: brandId, is_active: true }),
            base44.asServiceRole.entities.FAQ.filter({ brand_id: brandId, is_active: true }),
            base44.asServiceRole.entities.AgentSettings.filter({ brand_id: brandId }),
          ]);

          const brand = await base44.asServiceRole.entities.Brand.filter({ id: brandId }).then(r => r[0]).catch(() => null);
          const persona = brand?.ai_persona_name || 'Victor';
          const instructions = brand?.ai_instructions || brandSettings[0]?.ai_instructions || 'You are a helpful customer support assistant.';

          const kbContext = (kbEntries || []).map(e => `# ${e.title}\n${e.content}`).join('\n\n');
          const faqContext = (faqEntries || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `${instructions}\n\nKNOWLEDGE BASE:\n${kbContext}\n\nFAQs:\n${faqContext}\n\nCUSTOMER MESSAGE: ${text}\n\nRespond as ${persona}. Be concise, warm, and helpful.`,
          });
          replyText = typeof result === 'string' ? result : result?.data || result?.text || null;
        } catch (e) {
          console.error('[metaWebhook] LLM failed:', e.message);
          replyText = 'Thanks for reaching out! An agent will be with you shortly.';
        }

        if (!replyText) replyText = 'Thanks for reaching out! An agent will be with you shortly.';

        // Save AI reply to inbox
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

        // Send reply via Facebook Messenger API
        if (pageAccessToken) {
          const fbRes = await fetch('https://graph.facebook.com/v18.0/me/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: senderId },
              message: { text: replyText },
              access_token: pageAccessToken,
            }),
          });
          const fbBody = await fbRes.json();
          console.log(`[metaWebhook] Sent reply to ${senderId}, status: ${fbRes.status}`, JSON.stringify(fbBody));
        } else {
          console.warn('[metaWebhook] No page access token — reply not sent');
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[metaWebhook] Error:', error.message);
    return Response.json({ error: error.message }, { status: 200 });
  }
});