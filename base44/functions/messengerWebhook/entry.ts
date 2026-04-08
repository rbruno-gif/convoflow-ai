/* eslint-disable no-undef */
/// <reference lib="deno.window" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const brandSlug = url.searchParams.get('brand');
    const webhookToken = url.searchParams.get('token');

    if (!brandSlug || !webhookToken) {
      return Response.json({ response: 'Invalid request' }, { status: 200 });
    }

    const base44 = createClientFromRequest(req);

    // 1. Look up MessengerWebhook record
    const webhooks = await base44.asServiceRole.entities.MessengerWebhook.filter(
      { webhook_token: webhookToken, is_active: true },
      '-created_date',
      1
    );

    if (webhooks.length === 0) {
      return Response.json({ response: '' }, { status: 200 });
    }

    const webhook = webhooks[0];

    // Verify brand slug matches
    const brands = await base44.asServiceRole.entities.Brand.filter(
      { id: webhook.brand_id },
      '-created_date',
      1
    );

    if (brands.length === 0 || brands[0].slug !== brandSlug) {
      return Response.json({ response: '' }, { status: 200 });
    }

    const brand = brands[0];

    // 2. Parse payload
    const payload = await req.json();
    const { from, body, profile_name } = payload;

    if (!from || !body) {
      return Response.json({ response: '' }, { status: 200 });
    }

    // Check allowed sender IDs filter
    if (webhook.allowed_sender_ids && webhook.allowed_sender_ids.length > 0) {
      if (!webhook.allowed_sender_ids.includes(from)) {
        return Response.json({ response: '' }, { status: 200 });
      }
    }

    // 3. Find or create customer profile
    let customer = null;
    const customers = await base44.asServiceRole.entities.CustomerProfile.filter(
      { brand_id: brand.id, facebook_messenger_id: from },
      '-created_date',
      1
    );

    if (customers.length > 0) {
      customer = customers[0];
    } else {
      customer = await base44.asServiceRole.entities.CustomerProfile.create({
        brand_id: brand.id,
        name: profile_name || 'Facebook Customer',
        facebook_messenger_id: from,
        preferred_channel: 'facebook_messenger',
      });
    }

    // 4. Find or create conversation
    let conversations = await base44.asServiceRole.entities.Conversation.filter(
      {
        brand_id: brand.id,
        customer_id: customer.id,
        channel: 'messenger',
        status: 'open',
      },
      '-created_date',
      1
    );

    let conversation;
    if (conversations.length > 0) {
      conversation = conversations[0];
    } else {
      conversation = await base44.asServiceRole.entities.Conversation.create({
        brand_id: brand.id,
        customer_id: customer.id,
        channel: 'messenger',
        channel_id: from,
        department_id: webhook.department_id,
        status: 'open',
        priority: 'normal',
        customer_name: customer.name,
        customer_email: customer.email || `${from}@facebook.com`,
        unread_count: 1,
      });
    }

    // 5. Save incoming message
    await base44.asServiceRole.entities.Message.create({
      brand_id: brand.id,
      conversation_id: conversation.id,
      sender_type: 'customer',
      sender_id: from,
      sender_name: profile_name || 'Customer',
      content: body,
    });

    // 6. Generate AI response
    let aiResponse = webhook.auto_reply_message || 'Thanks for your message! An agent will be with you shortly.';

    try {
      const claudeResponse = await base44.functions.invoke('generateClaudeResponse', {
        brandId: brand.id,
        conversationId: conversation.id,
        customerMessage: body,
        previousMessages: [],
      });

      if (claudeResponse.data?.response) {
        aiResponse = claudeResponse.data.response;
      }
    } catch (aiError) {
      console.error('AI response generation failed:', aiError);
    }

    // 7. Save AI response message
    await base44.asServiceRole.entities.Message.create({
      brand_id: brand.id,
      conversation_id: conversation.id,
      sender_type: 'ai',
      sender_id: 'messenger-bot',
      sender_name: brand.ai_persona_name || 'Support Bot',
      content: aiResponse,
    });

    // 8. Update webhook stats
    await base44.asServiceRole.entities.MessengerWebhook.update(webhook.id, {
      last_triggered_at: new Date().toISOString(),
      total_messages_received: (webhook.total_messages_received || 0) + 1,
    });

    // 9. Return response
    return Response.json({ response: aiResponse }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ response: 'Thanks for your message. We will get back to you shortly.' }, { status: 200 });
  }
});