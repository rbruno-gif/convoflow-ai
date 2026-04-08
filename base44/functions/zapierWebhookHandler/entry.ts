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
    } catch (err) {
      console.error('Error processing Zapier webhook:', err);
    }

    // Acknowledge receipt
    return new Response(JSON.stringify({ success: true, received: true }), {
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