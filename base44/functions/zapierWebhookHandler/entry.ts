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
    const body = await req.text();
    const data = JSON.parse(body);

    // Extract brand ID from query params or URL path
    const url = new URL(req.url);
    let brandId = url.searchParams.get('brand_id');
    
    if (!brandId) {
      const urlParts = url.pathname.split('/');
      brandId = urlParts[urlParts.length - 1];
    }

    // Process Zapier webhook payload
    // Zapier sends event data (conversation created, updated, etc.)
    if (data.event === 'conversation_created') {
      const conversationData = {
        brand_id: brandId,
        customer_id: data.customer_id,
        customer_name: data.customer_name || 'Unknown',
        channel: data.channel || 'chat',
        mode: 'ai',
        status: 'active',
        last_message: data.message || '',
        last_message_time: new Date().toISOString(),
      };

      try {
        await base44.asServiceRole.entities.Conversation.create(conversationData);
      } catch (err) {
        console.error('Error creating conversation from Zapier:', err);
      }
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