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
    
    // Step 2: Extract brand_id from query params
    const brandId = url.searchParams.get('brand_id');
    if (!brandId) {
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

    // Step 4: Parse incoming payload from Zapier
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);
    const { from, body, profile_name } = payload;

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

    // Step 6: Get AI response from knowledge base using LLM
    let aiResponse = null;
    try {
      const kbEntries = await base44.asServiceRole.entities.KnowledgeDoc.filter({
        brand_id: brandId,
        is_active: true,
      });

      if (kbEntries && kbEntries.length > 0) {
        const kbContext = kbEntries
          .map((entry) => `# ${entry.title}\n${entry.content}`)
          .join('\n\n');

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a helpful customer support assistant. Based on the knowledge base below, answer the customer's question directly and concisely. If the answer is not in the knowledge base, say "I don't have that information available."\n\nKNOWLEDGE BASE:\n${kbContext}\n\nCUSTOMER QUESTION: ${body}\n\nPROVIDE A DIRECT ANSWER:`,
          model: 'gpt_5_mini',
        });

        aiResponse = typeof result === 'string' ? result : result?.text || null;
      }
    } catch (e) {
      console.error('KB lookup failed:', e);
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

    return new Response(JSON.stringify({ response: replyText }), {
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