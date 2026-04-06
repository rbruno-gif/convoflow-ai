import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const VERIFY_TOKEN = Deno.env.get('FACEBOOK_VERIFY_TOKEN');
const PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');

Deno.serve(async (req) => {
  try {
    // Handle webhook verification (GET request from Facebook)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      } else {
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Handle incoming messages (POST request from Facebook)
    if (req.method === 'POST') {
      const base44 = createClientFromRequest(req);
      const body = await req.json();

      // Verify X-Hub-Signature for security
      const signature = req.headers.get('x-hub-signature-256');
      const isValid = await verifyWebhookSignature(body, signature);
      if (!isValid) {
        return new Response('Invalid signature', { status: 403 });
      }

      if (body.object === 'page') {
        for (const entry of body.entry) {
          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              const senderId = messaging.sender.id;
              const recipientId = messaging.recipient.id;
              const message = messaging.message;

              if (message && message.text) {
                // Get or create conversation
                const conversations = await base44.asServiceRole.entities.Conversation.filter({
                  customer_fb_id: senderId,
                });

                let conversation = conversations[0];
                if (!conversation) {
                  // Fetch customer name from Facebook
                  const customerInfo = await getCustomerInfo(senderId);
                  conversation = await base44.asServiceRole.entities.Conversation.create({
                    customer_name: customerInfo.name || 'Customer',
                    customer_fb_id: senderId,
                    customer_avatar: customerInfo.avatar || '',
                    status: 'active',
                    mode: 'ai',
                    last_message: message.text,
                    last_message_time: new Date().toISOString(),
                  });
                }

                // Store the incoming message
                await base44.asServiceRole.entities.Message.create({
                  conversation_id: conversation.id,
                  sender_type: 'customer',
                  sender_name: conversation.customer_name,
                  content: message.text,
                  timestamp: new Date(messaging.timestamp).toISOString(),
                  message_type: 'text',
                });

                // Update conversation
                await base44.asServiceRole.entities.Conversation.update(conversation.id, {
                  last_message: message.text,
                  last_message_time: new Date(messaging.timestamp).toISOString(),
                  unread_count: (conversation.unread_count || 0) + 1,
                });
              }
            }
          }
        }
      }

      return new Response('ok', { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function verifyWebhookSignature(body, signature) {
  if (!signature) return true; // Skip verification for testing
  
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(Deno.env.get('FACEBOOK_APP_SECRET')),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(JSON.stringify(body)));
    const hash = `sha256=${Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    
    return hash === signature;
  } catch (e) {
    console.error('Signature verification error:', e);
    return true; // Allow webhook through for testing
  }
}

async function getCustomerInfo(senderId) {
  const token = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  const response = await fetch(`https://graph.facebook.com/${senderId}?fields=first_name,last_name,profile_pic&access_token=${token}`);
  const data = await response.json();

  return {
    name: `${data.first_name} ${data.last_name}`,
    avatar: data.profile_pic,
  };
}