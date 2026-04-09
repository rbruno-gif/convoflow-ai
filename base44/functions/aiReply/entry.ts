import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { conversationId } = await req.json();

    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'Missing conversationId' }), { status: 400 });
    }

    console.log(`[aiReply] Processing conversation: ${conversationId}`);

    // Fetch conversation
    const conversation = await base44.asServiceRole.entities.Conversation.get(conversationId);

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
    }

    // Only reply if AI is handling
    if (conversation.mode !== 'ai' && conversation.status !== 'ai_handling') {
      console.log(`[aiReply] Skipping — conversation ${conversationId} is in human mode`);
      return new Response(JSON.stringify({ skipped: true, reason: 'human_mode' }), { status: 200 });
    }

    // Fetch conversation history (last 20 messages)
    const allMessages = await base44.asServiceRole.entities.Message.filter(
      { conversation_id: conversationId },
      'timestamp',
      20
    );

    // Fetch knowledge base & FAQs for context
    const filterParams = {};
    if (conversation.brand_id) filterParams.brand_id = conversation.brand_id;

    const [kbDocs, faqs, agentSettings] = await Promise.all([
      base44.asServiceRole.entities.KnowledgeDoc.filter({ ...filterParams, is_active: true }),
      base44.asServiceRole.entities.FAQ.filter({ ...filterParams, is_active: true }),
      base44.asServiceRole.entities.AgentSettings.list(),
    ]);

    const settings = agentSettings[0];
    const persona = settings?.ai_persona_name || 'Support Assistant';
    const instructions = settings?.ai_instructions || 'You are a helpful customer support assistant. Be concise and friendly.';

    const kbContext = (kbDocs || []).map(d => `# ${d.title}\n${d.content}`).join('\n\n');
    const faqContext = (faqs || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

    // Build message history for Claude
    const history = (allMessages || []).map(m => ({
      role: m.sender_type === 'customer' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Build system prompt
    let systemPrompt = `${instructions}\n\nYou are ${persona}.`;
    if (kbContext) systemPrompt += `\n\nKNOWLEDGE BASE:\n${kbContext}`;
    if (faqContext) systemPrompt += `\n\nFAQs:\n${faqContext}`;
    systemPrompt += '\n\nRespond concisely and helpfully. If you cannot answer, politely say a human agent will assist shortly.';

    console.log(`[aiReply] Calling Claude with ${history.length} messages`);

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 500,
      system: systemPrompt,
      messages: history.length > 0 ? history : [{ role: 'user', content: 'Hello' }],
    });

    const aiText = response.content[0]?.text || 'Thank you for reaching out! An agent will assist you shortly.';
    console.log(`[aiReply] Claude response: ${aiText}`);

    // Save AI reply as message
    const msgPayload = {
      conversation_id: conversationId,
      sender_type: 'ai',
      sender_name: persona,
      content: aiText,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    };
    if (conversation.brand_id) msgPayload.brand_id = conversation.brand_id;
    await base44.asServiceRole.entities.Message.create(msgPayload);

    // Update conversation last message
    await base44.asServiceRole.entities.Conversation.update(conversationId, {
      last_message: aiText,
      last_message_time: new Date().toISOString(),
      ai_resolution_attempted: true,
    });

    // Send reply back via Umnico API
    if (UMNICO_API_KEY && conversation.customer_fb_id) {
      try {
        console.log(`[aiReply] Sending reply to Umnico — contactId: ${conversation.customer_fb_id}, text: ${aiText}`);
        const umnicoRes = await fetch('https://api.umnico.com/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${UMNICO_API_KEY}`,
          },
          body: JSON.stringify({
            channelType: 'facebook',
            contactId: conversation.customer_fb_id,
            text: aiText,
          }),
        });
        const umnicoBody = await umnicoRes.text();
        if (umnicoRes.ok) {
          console.log(`[aiReply] Umnico SUCCESS — status: ${umnicoRes.status}, response: ${umnicoBody}`);
        } else {
          console.error(`[aiReply] Umnico FAILED — status: ${umnicoRes.status}, response: ${umnicoBody}`);
        }
      } catch (e) {
        console.error('[aiReply] Umnico send error:', e.message);
      }
    } else {
      console.warn(`[aiReply] Skipping Umnico send — UMNICO_API_KEY set: ${!!UMNICO_API_KEY}, customer_fb_id: ${conversation.customer_fb_id}`);
    }

    return new Response(JSON.stringify({ success: true, reply: aiText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[aiReply] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});