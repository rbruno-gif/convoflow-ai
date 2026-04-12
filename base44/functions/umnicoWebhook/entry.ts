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

    // Only process incoming messages
    if (payload.type !== 'message.incoming') {
      console.log(`[umnicoWebhook] Skipping event type: ${payload.type}`);
      return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Parse Umnico's actual payload structure
    const msg = payload.message;
    const contactId = msg?.sender?.socialId || msg?.source?.sender;
    const contactName = msg?.sender?.login || `User ${contactId}`;
    const text = msg?.message?.text;
    const channel = msg?.sa?.type || 'fb_messenger';
    const timestamp = msg?.datetime || new Date().toISOString();
    const brandId = payload.brand_id || null;
    const leadId = String(payload.lead?.id || payload.leadId || '');
    const sourceId = String(msg?.sa?.id || msg?.source?.saId || '');
    const contactUserId = String(msg?.sender?.id || '');

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
        umnico_lead_id: leadId || undefined,
        umnico_source_id: sourceId || undefined,
        umnico_contact_id: contactUserId || undefined,
      };
      if (brandId) createPayload.brand_id = brandId;
      conversation = await base44.asServiceRole.entities.Conversation.create(createPayload);
      console.log(`[umnicoWebhook] Created conversation: ${conversation.id}`);
    } else {
      const updatePayload = {
        last_message: text,
        last_message_time: new Date(timestamp).toISOString(),
      };
      if (leadId) updatePayload.umnico_lead_id = leadId;
      if (sourceId) updatePayload.umnico_source_id = sourceId;
      if (contactUserId) updatePayload.umnico_contact_id = contactUserId;
      await base44.asServiceRole.entities.Conversation.update(conversation.id, updatePayload);
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