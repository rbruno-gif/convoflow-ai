import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
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
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const base44 = createClientFromRequest(req);
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);

    // Extract brand ID from query params
    const url = new URL(req.url);
    const brandId = url.searchParams.get('brand_id');
    
    if (!brandId) {
      return new Response(JSON.stringify({ error: 'Missing brand_id parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Extract fields from Zapier payload
    const { from, body, profile_name } = payload;
    
    if (!from || !body) {
      return new Response(JSON.stringify({ success: true, received: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    try {
      // Find or create customer profile
      const customers = await base44.asServiceRole.entities.CustomerProfile.filter({
        brand_id: brandId,
        fb_id: from,
      });

      let customer = customers[0];
      if (!customer) {
        customer = await base44.asServiceRole.entities.CustomerProfile.create({
          brand_id: brandId,
          name: profile_name || 'User',
          fb_id: from,
          preferred_channel: 'zapier',
        });
      }

      // Find or create conversation
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
          customer_name: profile_name || 'User',
          status: 'active',
          mode: 'ai',
        });
      }

      // Save incoming message
      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversation.id,
        brand_id: brandId,
        sender_type: 'customer',
        sender_name: profile_name || 'User',
        content: body,
        timestamp: new Date().toISOString(),
        message_type: 'text',
      });

      console.log(`Zapier message saved - Conversation: ${conversation.id}, From: ${from}`);

      // Get AI response from knowledge base + FAQs
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

      // Save AI response if generated
      if (aiResponse) {
        await base44.asServiceRole.entities.Message.create({
          conversation_id: conversation.id,
          brand_id: brandId,
          sender_type: 'ai',
          sender_name: 'AI Assistant',
          content: aiResponse,
          timestamp: new Date().toISOString(),
          message_type: 'text',
        });

        await base44.asServiceRole.entities.Conversation.update(conversation.id, {
          last_message: aiResponse,
          last_message_time: new Date().toISOString(),
        });

        console.log(`AI response saved for conversation ${conversation.id}`);
        console.log(`Returning AI response to Zapier: ${aiResponse}`);
      }
    } catch (err) {
      console.error('Error processing Zapier webhook:', err);
      aiResponse = 'An error occurred processing your message. An agent will assist you shortly.';
    }

    // Return the AI response to Zapier so it can relay back to customer/Facebook
    return new Response(JSON.stringify({ 
      success: true, 
      received: true,
      response: aiResponse || 'Thanks for your message! An agent will assist you shortly.',
      conversation_id: conversation?.id,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Zapier webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});