import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    // Step 1: Handle preflight and method check
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    
    // Step 1: Try to get brand_id from query params first (Zapier format)
    let brandId = url.searchParams.get('brand_id');
    console.log(`[Webhook] brand_id from query params: ${brandId}`);
    
    // Step 2: Parse incoming payload
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);
    
    // If not in query params, try to read from request body
    brandId = brandId || payload.brand_id;
    console.log(`[Webhook] brand_id after body check: ${brandId}`);
    
    // Extract Facebook page ID from payload (Facebook sends this)
    let facebookPageId = null;
    let from = null;
    let messageBody = null;
    let profileName = null;
    
    // Handle Facebook's webhook format (nested under messaging array)
    if (payload.entry && payload.entry[0]) {
      facebookPageId = payload.entry[0].id;
      const messaging = payload.entry[0].messaging[0];
      if (messaging) {
        from = messaging.sender.id;
        messageBody = messaging.message?.text;
      }
    } 
    // Handle Zapier/custom format
    else if (payload.from && payload.body) {
      from = payload.from;
      messageBody = payload.body;
      profileName = payload.profile_name;
    }
    
    console.log(`[Webhook] Incoming message - Page: ${facebookPageId}, From: ${from}, Body: ${messageBody}`);
    
    // Step 3: If no query param brand_id, look it up using Facebook page ID
    if (!brandId && facebookPageId) {
      try {
        const webhooks = await base44.asServiceRole.entities.MessengerWebhook.filter({ 
          facebook_page_id: facebookPageId 
        });
        console.log(`[Webhook] MessengerWebhook lookup returned ${webhooks?.length || 0} results`);
        if (webhooks && webhooks.length > 0) {
          brandId = webhooks[0].brand_id;
          console.log(`[Webhook] Found brand_id: ${brandId} for page: ${facebookPageId}`);
        }
      } catch (e) {
        console.error(`[Webhook] Error looking up MessengerWebhook: ${e.message}`);
      }
    }
    
    // Use hardcoded default for testing if still no brand_id
    brandId = brandId || '69d5d0811141577dd21cc040';
    console.log(`[Webhook] Using brand_id: ${brandId}`);

    const body = messageBody;
    
    if (!body) {
      console.error('[Webhook] No message body extracted, cannot proceed');
      return new Response(JSON.stringify({ 
        success: true,
        response: 'Thanks for your message!',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Step 3: Find or create customer profile
    let customers = await base44.asServiceRole.entities.CustomerProfile.filter({
      brand_id: brandId,
      fb_id: from,
    });

    let customer = customers[0];
    if (!customer) {
      customer = await base44.asServiceRole.entities.CustomerProfile.create({
        brand_id: brandId,
        name: profileName || 'Facebook User',
        fb_id: from,
        preferred_channel: 'facebook',
      });
    }

    // Step 4: Find or create open conversation
    let conversations = await base44.asServiceRole.entities.Conversation.filter({
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
        status: 'active',
        mode: 'ai',
      });
    }

    // Step 5: Save incoming message
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      brand_id: brandId,
      sender_type: 'customer',
      sender_name: profileName || 'Facebook User',
      content: body,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    });

    console.log(`Facebook message saved - Conversation: ${conversation.id}, From: ${from}`);

    // Step 5.5: Check if conversation is in human mode — if so, don't respond, let agent handle
    if (conversation.mode === 'human') {
      console.log(`Conversation ${conversation.id} is in human mode — agent will respond manually`);
      return new Response(JSON.stringify({ 
        success: true,
        response: '',
        mode: 'human'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Step 6: Get AI response from knowledge base + FAQs using LLM
    // Fallback FAQs for U2C Mobile
    const fallbackFAQs = [
      { question: 'what plans do you offer', answer: 'U2C Mobile offers prepaid and postpaid plans starting from $25/month. Visit u2cmobile.com for details.' },
      { question: 'how do I cancel', answer: 'To cancel call 1-844-222-4127 or dial 611 from your device.' },
      { question: 'coverage', answer: 'Check coverage at u2cmobile.com/coverage' },
      { question: 'billing', answer: 'For billing questions call 1-844-222-4127' },
      { question: 'international roaming', answer: 'U2C Mobile offers roaming to Canada and Mexico included on select plans.' },
    ];
    
    let aiResponse = null;
    try {
      const [kbEntries, faqEntries] = await Promise.all([
        base44.asServiceRole.entities.KnowledgeDoc.filter({
          brand_id: brandId,
          is_active: true,
        }),
        base44.asServiceRole.entities.FAQ.filter({
          brand_id: brandId,
          is_active: true,
        }),
      ]);

      console.log(`Found ${kbEntries?.length || 0} KB docs and ${faqEntries?.length || 0} FAQs for brand ${brandId}`);

      // Use database FAQs if available, otherwise use fallback FAQs
      const faqsToUse = (faqEntries && faqEntries.length > 0) ? faqEntries : fallbackFAQs;
      
      const kbContext = (kbEntries || [])
        .map((entry) => `# ${entry.title}\n${entry.content}`)
        .join('\n\n');
      
      const faqContext = faqsToUse
        .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
        .join('\n\n');

      console.log(`Invoking LLM with KB + FAQ context (using ${faqsToUse.length} FAQs)...`);
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a helpful U2C Mobile customer support assistant. Based on the knowledge base and FAQs below, answer the customer's question directly and concisely. Be friendly and helpful.\n\nKNOWLEDGE BASE:\n${kbContext}\n\nFAQs:\n${faqContext}\n\nCUSTOMER QUESTION: ${body}\n\nPROVIDE A DIRECT, HELPFUL ANSWER:`,
        model: 'gpt_5_mini',
      });

      console.log(`LLM response received:`, JSON.stringify(result));
      aiResponse = typeof result === 'string' ? result : result?.data || result?.text || result?.message || result || null;
      console.log(`aiResponse extracted:`, aiResponse);
    } catch (e) {
      console.error('KB lookup or LLM failed:', e.message || e);
      // Fallback: still try LLM with general U2C prompt
      try {
        const fallbackResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a helpful U2C Mobile customer support assistant. Answer this customer question helpfully and concisely. If unsure say to call 1-844-222-4127.\n\nCustomer question: ${body}`,
          model: 'gpt_5_mini',
        });
        console.log(`Fallback LLM response:`, JSON.stringify(fallbackResult));
        aiResponse = typeof fallbackResult === 'string' ? fallbackResult : fallbackResult?.data || fallbackResult?.text || fallbackResult || null;
        console.log(`Fallback aiResponse:`, aiResponse);
      } catch (e2) {
        console.error('Fallback LLM also failed:', e2.message || e2);
        aiResponse = 'Thanks for reaching out! For immediate help, please call us at 1-844-222-4127.';
      }
    }

    // Step 7: Determine final reply
    let replyText = aiResponse;
    if (!replyText) {
      replyText = 'Thanks for reaching out! For immediate help, please call us at 1-844-222-4127.';
    }

    // Step 8: Save AI reply as message
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      brand_id: brandId,
      sender_type: 'ai',
      sender_name: 'AI Assistant',
      content: replyText,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    });

    // Update conversation with latest message
    await base44.asServiceRole.entities.Conversation.update(conversation.id, {
      last_message: replyText,
      last_message_time: new Date().toISOString(),
    });

    console.log(`[Messenger] Prepared reply: ${replyText}`);

    // Step 9: Send reply back to Facebook Messenger
    try {
      const pageAccessToken = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
      if (pageAccessToken) {
        console.log(`[Messenger] Sending to Facebook for user ${from}`);
        const fbRes = await fetch('https://graph.facebook.com/v18.0/me/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: { id: from },
            message: { text: replyText },
            access_token: pageAccessToken,
          }),
        });
        console.log(`[Messenger] Facebook responded with status ${fbRes.status}`);
      } else {
        console.warn('[Messenger] No FACEBOOK_PAGE_ACCESS_TOKEN set');
      }
    } catch (e) {
      console.error('Failed to send message back to Facebook:', e);
    }

    return new Response(JSON.stringify({ 
      success: true,
      response: replyText,
      conversation_id: conversation?.id,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('messengerWebhook error:', error);
    return new Response(
      JSON.stringify({
        response: 'Thanks for your message! An agent will be with you shortly.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});