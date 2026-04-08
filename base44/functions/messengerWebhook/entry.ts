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
    
    // Step 1: Parse incoming payload from Facebook (or Zapier)
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);
    
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
        // Note: Facebook doesn't send profile_name in the webhook, we'll fetch it later if needed
      }
    } 
    // Handle Zapier/custom format
    else if (payload.from && payload.body) {
      from = payload.from;
      messageBody = payload.body;
      profileName = payload.profile_name;
    }
    
    console.log(`[Webhook] Incoming message - Page: ${facebookPageId}, From: ${from}, Body: ${messageBody}`);
    
    // Step 2: Look up brand_id using Facebook page ID
    let brandId = null;
    if (facebookPageId) {
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
    
    if (!brandId) {
      console.warn(`[Webhook] No brand_id found for page ${facebookPageId}, returning fallback`);
      return new Response(
        JSON.stringify({ response: 'Thanks for your message. We will be with you shortly.' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const { from: _, body, profile_name } = { from, body: messageBody, profile_name: profileName };

    if (!from || !body) {
      return new Response(JSON.stringify({ response: 'Thanks for your message.' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
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
        name: profile_name || 'Facebook User',
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
        customer_name: profile_name || 'Facebook User',
        status: 'active',
        mode: 'ai',
      });
    }

    // Step 5: Save incoming message
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      brand_id: brandId,
      sender_type: 'customer',
      sender_name: profile_name || 'Facebook User',
      content: body,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    });

    console.log(`Facebook message saved - Conversation: ${conversation.id}, From: ${from}`);

    // Step 6: Get AI response from knowledge base + FAQs using LLM
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

      if ((kbEntries && kbEntries.length > 0) || (faqEntries && faqEntries.length > 0)) {
        const kbContext = (kbEntries || [])
          .map((entry) => `# ${entry.title}\n${entry.content}`)
          .join('\n\n');
        
        const faqContext = (faqEntries || [])
          .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
          .join('\n\n');

        console.log(`Invoking LLM with KB + FAQ context...`);
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a helpful U2C Mobile customer support assistant. Based on the knowledge base and FAQs below, answer the customer's question directly and concisely. Be friendly and helpful.\n\nKNOWLEDGE BASE:\n${kbContext}\n\nFAQs:\n${faqContext}\n\nCUSTOMER QUESTION: ${body}\n\nPROVIDE A DIRECT, HELPFUL ANSWER:`,
          model: 'gpt_5_mini',
        });

        console.log(`LLM response received`);
        aiResponse = typeof result === 'string' ? result : result?.text || result?.message || null;
      } else {
        console.log(`No knowledge base entries found for brand ${brandId}`);
        aiResponse = 'Thanks for your message! An agent will get back to you shortly.';
      }
    } catch (e) {
      console.error('KB lookup or LLM failed:', e.message || e);
      aiResponse = 'Thanks for your message! An agent will assist you shortly.';
    }

    // Step 7: Determine final reply
    let replyText = aiResponse;
    if (!replyText) {
      replyText = 'Thanks for your message! An agent will be with you shortly.';
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