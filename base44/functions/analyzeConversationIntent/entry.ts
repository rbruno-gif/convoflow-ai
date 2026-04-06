import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { conversation_id } = await req.json();

    if (!conversation_id) {
      return Response.json({ error: 'conversation_id required' }, { status: 400 });
    }

    const messages = await base44.entities.Message.filter(
      { conversation_id },
      'timestamp',
      50
    );

    if (messages.length === 0) {
      return Response.json({ intent: 'general_question', topics: [] });
    }

    const messageText = messages.map(m => m.content).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this customer support conversation and extract:
1. PRIMARY INTENT (order_inquiry, product_support, billing_issue, complaint, feedback, general_question, returns_refunds, shipping, technical_support, or other)
2. KEY TOPICS (3-5 relevant keywords/topics)

Conversation:
${messageText}

Respond ONLY with valid JSON: {"intent": "...", "topics": ["topic1", "topic2", ...]}`,
      response_json_schema: {
        type: 'object',
        properties: {
          intent: { type: 'string' },
          topics: { type: 'array', items: { type: 'string' } },
        },
      },
      model: 'claude_opus_4_6',
    });

    const validIntents = [
      'order_inquiry', 'product_support', 'billing_issue', 'complaint', 'feedback',
      'general_question', 'returns_refunds', 'shipping', 'technical_support', 'other'
    ];

    const intent = validIntents.includes(result?.intent) ? result.intent : 'general_question';
    const topics = Array.isArray(result?.topics) ? result.topics.slice(0, 5) : [];

    await base44.entities.Conversation.update(conversation_id, {
      intent,
      key_topics: topics,
    });

    return Response.json({ intent, topics });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});