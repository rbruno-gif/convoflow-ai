/* eslint-disable no-undef */
/// <reference lib="deno.window" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    // Verify webhook token (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      const verifyToken = Deno.env.get('FACEBOOK_VERIFY_TOKEN');

      if (mode === 'subscribe' && token === verifyToken) {
        return new Response(challenge);
      }
      return new Response('Forbidden', { status: 403 });
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const body = await req.text();
      const signature = req.headers.get('x-hub-signature-256');
      const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');

      // Verify signature
      const hash = crypto
        .createHmac('sha256', appSecret)
        .update(body)
        .digest('hex');
      const expectedSignature = `sha256=${hash}`;

      if (signature !== expectedSignature) {
        return Response.json({ error: 'Invalid signature' }, { status: 403 });
      }

      const base44 = createClientFromRequest(req);
      const payload = JSON.parse(body);

      // Process webhook events
      if (payload.object === 'page') {
        for (const entry of payload.entry) {
          for (const messaging of entry.messaging) {
            if (messaging.message && !messaging.message.is_echo) {
              const senderId = messaging.sender.id;
              const pageId = entry.id;
              const messageText = messaging.message.text;
              const timestamp = messaging.timestamp;

              // Get or create conversation
              let conversation = await getOrCreateConversation(
                base44,
                senderId,
                pageId,
                'messenger'
              );

              if (conversation) {
                // Create message
                await base44.asServiceRole.entities.Message.create({
                  brand_id: conversation.brand_id,
                  conversation_id: conversation.id,
                  sender_type: 'customer',
                  sender_id: senderId,
                  sender_name: messaging.sender.name || 'Customer',
                  content: messageText,
                });

                // Update conversation last_message_at
                await base44.asServiceRole.entities.Conversation.update(
                  conversation.id,
                  { last_message_at: new Date(timestamp).toISOString() }
                );
              }
            }
          }
        }
      }

      return Response.json({ status: 'ok' });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getOrCreateConversation(base44, senderId, pageId, channel) {
  try {
    // Try to find existing conversation
    const existing = await base44.asServiceRole.entities.Conversation.filter(
      { channel_id: senderId, channel: channel },
      '-created_date',
      1
    );

    if (existing.length > 0) {
      return existing[0];
    }

    // Get brand by Facebook page ID
    const pages = await base44.asServiceRole.entities.FacebookPage.filter(
      { page_id: pageId },
      '-created_date',
      1
    );

    if (pages.length === 0) {
      console.error(`No Facebook page found for ${pageId}`);
      return null;
    }

    const page = pages[0];

    // Create new conversation
    const conversation = await base44.asServiceRole.entities.Conversation.create({
      brand_id: page.brand_id,
      department_id: '',
      customer_id: senderId,
      channel: channel,
      channel_id: senderId,
      status: 'open',
      priority: 'normal',
      customer_name: 'Facebook Customer',
      customer_email: `${senderId}@facebook.com`,
      unread_count: 1,
    });

    return conversation;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    return null;
  }
}