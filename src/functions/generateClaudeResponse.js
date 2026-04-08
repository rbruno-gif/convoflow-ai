/* eslint-disable no-undef */
/// <reference lib="deno.window" />
import Anthropic from 'npm:@anthropic-ai/sdk@0.24.3';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const client = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId, conversationId, customerMessage, previousMessages = [] } = await req.json();

    if (!brandId || !customerMessage) {
      return Response.json({ error: 'Missing brandId or customerMessage' }, { status: 400 });
    }

    // Fetch brand AI settings
    const brands = await base44.asServiceRole.entities.Brand.filter({ id: brandId });
    const brand = brands[0];

    if (!brand) {
      return Response.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Fetch knowledge base entries for context
    const kbEntries = await base44.asServiceRole.entities.KnowledgeBase.filter(
      { brand_id: brandId, status: 'approved' },
      '-helpful_count',
      20
    );

    // Build system prompt
    const systemPrompt = `You are ${brand.ai_persona_name || 'Victor'}, a helpful customer support assistant for ${brand.name}.

${brand.ai_instructions ? `Instructions: ${brand.ai_instructions}` : ''}

${brand.welcome_message ? `Brand message: ${brand.welcome_message}` : ''}

${kbEntries.length > 0 ? `Knowledge Base:\n${kbEntries.map(kb => `Q: ${kb.question}\nA: ${kb.answer}`).join('\n\n')}` : ''}

Be professional, helpful, and concise. If you don't know something, offer to escalate to a human agent.`;

    // Build conversation history
    const messages = [
      ...previousMessages.map(msg => ({
        role: msg.sender_type === 'customer' ? 'user' : 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: customerMessage,
      },
    ];

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save AI message to database if conversationId provided
    if (conversationId) {
      await base44.asServiceRole.entities.Message.create({
        brand_id: brandId,
        conversation_id: conversationId,
        sender_type: 'ai',
        sender_id: 'claude-ai',
        sender_name: brand.ai_persona_name || 'Victor',
        content: aiResponse,
      });
    }

    return Response.json({
      response: aiResponse,
      model: 'claude-3-5-sonnet-20241022',
      tokensUsed: response.usage,
    });
  } catch (error) {
    console.error('Claude API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});