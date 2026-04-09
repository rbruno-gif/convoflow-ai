import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log('[umnicoWebhook] Full payload received:', JSON.stringify(payload, null, 2));

    // Umnico sends messages in this structure
    const contactId = payload.contactId || payload.contact_id || payload.from;
    const contactName = payload.contactName || payload.contact_name || payload.name || `User ${contactId}`;
    const text = payload.text || payload.body || payload.message;
    const channel = payload.channel || payload.source || 'umnico';
    const timestamp = payload.timestamp || payload.created_at || new Date().toISOString();
    const brandId = payload.brand_id || null;

    if (!contactId || !text) {
      console.error('[umnicoWebhook] Missing contactId or text');
      return new Response(JSON.stringify({ error: 'Missing required fields: contactId, text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find or create conversation
    const filterParams = { customer_fb_id: contactId, channel };
    if (brandId) filterParams.brand_id = brandId;

    const conversations = await base44.asServiceRole.entities.Conversation.filter(filterParams);
    let conversation = conversations.find(c => c.status !== 'resolved');

    if (!conversation) {
      const createPayload = {
        customer_fb_id: contactId,
        customer_name: contactName,
        channel,
        last_message: text,
        last_message_time: new Date(timestamp).toISOString(),
        status: 'ai_handling',
        mode: 'ai',
      };
      if (brandId) createPayload.brand_id = brandId;
      conversation = await base44.asServiceRole.entities.Conversation.create(createPayload);
      console.log(`[umnicoWebhook] Created conversation: ${conversation.id}`);
    } else {
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        last_message: text,
        last_message_time: new Date(timestamp).toISOString(),
      });
      console.log(`[umnicoWebhook] Updated conversation: ${conversation.id}`);
    }

    // Save incoming message
    const msgPayload = {
      conversation_id: conversation.id,
      sender_type: 'customer',
      sender_name: contactName,
      content: text,
      timestamp: new Date(timestamp).toISOString(),
      message_type: 'text',
    };
    if (brandId) msgPayload.brand_id = brandId;
    await base44.asServiceRole.entities.Message.create(msgPayload);
    console.log(`[umnicoWebhook] Saved customer message for conversation ${conversation.id}`);

    // Trigger AI reply (fire and forget — only if in ai_handling mode)
    if (conversation.mode === 'ai' || conversation.status === 'ai_handling') {
      base44.asServiceRole.functions.invoke('aiReply', { conversationId: conversation.id })
        .catch(err => console.error('[umnicoWebhook] aiReply invoke error:', err.message));
    } else {
      console.log(`[umnicoWebhook] Conversation ${conversation.id} is in human mode — skipping AI reply`);
    }

    return new Response(JSON.stringify({ success: true, conversationId: conversation.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('[umnicoWebhook] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});