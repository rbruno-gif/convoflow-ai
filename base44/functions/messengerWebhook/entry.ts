import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    // Handle webhook verification (GET)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      const VERIFY_TOKEN = Deno.env.get('FACEBOOK_VERIFY_TOKEN') || 's201uog9d8';
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Facebook webhook verified successfully');
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
      return new Response(JSON.stringify({ response: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const base44 = createClientFromRequest(req);
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);

    // Extract data from Facebook's webhook format
    let facebookPageId = null;
    let from = null;
    let messageBody = null;
    let profileName = null;

    if (payload.entry && payload.entry[0]) {
      facebookPageId = payload.entry[0].id;
      const messaging = payload.entry[0].messaging?.[0];
      if (messaging) {
        from = messaging.sender?.id;
        messageBody = messaging.message?.text;
      }
    }

    console.log(`[Webhook] Page: ${facebookPageId}, From: ${from}, Body: ${messageBody}`);

    if (!from || !messageBody) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Look up brand_id from FacebookPage record
    let brandId = null;
    if (facebookPageId) {
      const pages = await base44.asServiceRole.entities.FacebookPage.filter({ page_id: facebookPageId });
      if (pages && pages.length > 0) {
        brandId = pages[0].brand_id;
      }
    }
    brandId = brandId || '69d5d0811141577dd21cc040';
    console.log(`[Webhook] Using brand_id: ${brandId}`);

    // Find or create customer profile
    const customers = await base44.asServiceRole.entities.CustomerProfile.filter({ brand_id: brandId, fb_id: from });
    let customer = customers[0];
    if (!customer) {
      customer = await base44.asServiceRole.entities.CustomerProfile.create({
        brand_id: brandId,
        name: profileName || 'Facebook User',
        fb_id: from,
        preferred_channel: 'facebook',
      });
    }

    // Find or create active conversation
    const conversations = await base44.asServiceRole.entities.Conversation.filter({
      customer_fb_id: from,
      brand_id: brandId,
      status: 'active',
    });
    let conversation = conversations[0];
    if (!conversation) {
      conversation = await base44.asServiceRole.entities.Conversation.create({
        brand_id: brandId,
        customer_fb_id: from,
        customer_name: profileName || 'Facebook User',
        fb_page_id: facebookPageId,
        channel: 'facebook',
        status: 'active',
        mode: 'ai',
      });
    } else if (!conversation.fb_page_id && facebookPageId) {
      await base44.asServiceRole.entities.Conversation.update(conversation.id, { fb_page_id: facebookPageId, channel: 'facebook' });
      conversation.fb_page_id = facebookPageId;
    }

    // Save incoming message
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      brand_id: brandId,
      sender_type: 'customer',
      sender_name: profileName || 'Facebook User',
      content: messageBody,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    });

    // If human mode, don't auto-respond
    if (conversation.mode === 'human') {
      console.log(`Conversation ${conversation.id} is in human mode — agent will respond`);
      return new Response(JSON.stringify({ success: true, mode: 'human' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Build AI response from KB + FAQs
    const fallbackFAQs = [
      { question: 'what plans do you offer', answer: 'U2C Mobile offers prepaid and postpaid plans starting from $25/month. Visit u2cmobile.com for details.' },
      { question: 'how do I cancel', answer: 'To cancel call 1-844-222-4127 or dial 611 from your device.' },
      { question: 'coverage', answer: 'Check coverage at u2cmobile.com/coverage' },
      { question: 'billing', answer: 'For billing questions call 1-844-222-4127' },
      { question: 'international roaming', answer: 'U2C Mobile offers roaming to Canada and Mexico included on select plans.' },
    ];

    let replyText = null;
    try {
      const [kbEntries, faqEntries] = await Promise.all([
        base44.asServiceRole.entities.KnowledgeDoc.filter({ brand_id: brandId, is_active: true }),
        base44.asServiceRole.entities.FAQ.filter({ brand_id: brandId, is_active: true }),
      ]);

      const faqsToUse = faqEntries?.length > 0 ? faqEntries : fallbackFAQs;
      const kbContext = (kbEntries || []).map(e => `# ${e.title}\n${e.content}`).join('\n\n');
      const faqContext = faqsToUse.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a helpful U2C Mobile customer support assistant. Based on the knowledge base and FAQs below, answer the customer's question directly and concisely.\n\nKNOWLEDGE BASE:\n${kbContext}\n\nFAQs:\n${faqContext}\n\nCUSTOMER QUESTION: ${messageBody}\n\nPROVIDE A DIRECT, HELPFUL ANSWER:`,
        model: 'gpt_5_mini',
      });
      replyText = typeof result === 'string' ? result : result?.data || result?.text || null;
    } catch (e) {
      console.error('LLM failed:', e.message);
      replyText = 'Thanks for reaching out! For immediate help, please call us at 1-844-222-4127.';
    }

    if (!replyText) replyText = 'Thanks for reaching out! For immediate help, please call us at 1-844-222-4127.';

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

    // Send reply via Meta API using page-specific token
    const USER_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    let pageToken = USER_TOKEN;
    if (facebookPageId && USER_TOKEN) {
      const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${USER_TOKEN}&fields=id,access_token&limit=100`);
      const accountsData = await accountsRes.json();
      if (accountsData.data) {
        const match = accountsData.data.find(p => p.id === facebookPageId);
        if (match) pageToken = match.access_token;
      }
    }
    if (pageToken && from) {
      const endpoint = facebookPageId
        ? `https://graph.facebook.com/v18.0/${facebookPageId}/messages`
        : 'https://graph.facebook.com/v18.0/me/messages';
      const fbRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: from },
          message: { text: replyText },
          access_token: pageToken,
        }),
      });
      const fbBody = await fbRes.json();
      console.log(`[Messenger] Meta API responded: ${fbRes.status}`, JSON.stringify(fbBody));
    }

    return new Response(JSON.stringify({ success: true, response: replyText, conversation_id: conversation.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('messengerWebhook error:', error);
    return new Response(JSON.stringify({ response: 'Thanks for your message! An agent will be with you shortly.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});