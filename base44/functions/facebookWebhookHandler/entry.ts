import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    // Only accept POST requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const body = await req.text();
    const data = JSON.parse(body);

    // Verify Facebook webhook (if verification token is provided)
    const verifyToken = Deno.env.get('FACEBOOK_VERIFY_TOKEN');
    const hubVerifyToken = url.searchParams.get('hub.verify_token');
    const hubChallenge = url.searchParams.get('hub.challenge');

    // Handle Facebook's webhook verification
    if (hubVerifyToken && hubChallenge) {
      if (hubVerifyToken === verifyToken) {
        return new Response(hubChallenge);
      } else {
        return new Response(JSON.stringify({ error: 'Invalid verify token' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const base44 = createClientFromRequest(req);

    // Extract brand ID from query params or URL path
    let brandId = url.searchParams.get('brand_id');
    
    if (!brandId) {
      const urlParts = url.pathname.split('/');
      brandId = urlParts[urlParts.length - 1];
    }

    // Process incoming messages from Facebook
    if (data.entry) {
      for (const entry of data.entry) {
        for (const msg of entry.messaging || []) {
          if (msg.message) {
            // Store the message as a conversation/message in the system
            const conversationData = {
              brand_id: brandId,
              customer_id: msg.sender.id,
              customer_name: msg.sender.id,
              channel: 'facebook',
              mode: 'ai',
              status: 'active',
              last_message: msg.message.text || '[Attachment]',
              last_message_time: new Date().toISOString(),
            };

            try {
              const existing = await base44.asServiceRole.entities.Conversation.filter({
                brand_id: brandId,
                customer_id: msg.sender.id,
              });

              if (existing.length > 0) {
                await base44.asServiceRole.entities.Conversation.update(existing[0].id, conversationData);
              } else {
                await base44.asServiceRole.entities.Conversation.create(conversationData);
              }
            } catch (err) {
              console.error('Error storing conversation:', err);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});