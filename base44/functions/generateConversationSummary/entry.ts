import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { conversation_id } = await req.json();

    if (!conversation_id) {
      return Response.json({ error: 'conversation_id required' }, { status: 400 });
    }

    const [messages, conversation] = await Promise.all([
      base44.entities.Message.filter({ conversation_id }, 'timestamp', 100),
      base44.entities.Conversation.filter({ id: conversation_id }),
    ]);

    if (messages.length === 0) {
      return Response.json({ summary: 'No messages yet' });
    }

    const conv = conversation[0];
    const messageText = messages
      .map(m => `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content}`)
      .join('\n');

    const summary = await base44.integrations.Core.InvokeLLM({
      prompt: `Summarize this customer support conversation in 2-3 sentences. Focus on the main issue, customer request, and current status.

Customer: ${conv?.customer_name || 'Unknown'}
Sentiment: ${conv?.sentiment || 'neutral'}
Intent: ${conv?.intent || 'general'}

Messages:
${messageText}

Provide a concise, professional summary.`,
      model: 'claude_opus_4_6',
    });

    const summaryText = typeof summary === 'string' ? summary : summary?.text || 'No summary available';

    await base44.entities.Conversation.update(conversation_id, {
      conversation_summary: summaryText,
    });

    return Response.json({ summary: summaryText });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});