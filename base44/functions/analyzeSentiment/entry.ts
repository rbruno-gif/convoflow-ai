import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const URGENT_KEYWORDS = ['angry', 'furious', 'upset', 'frustrated', 'help', 'urgent', 'asap', 'immediately', 'now', 'problem', 'broken', 'terrible', 'worst', 'unacceptable', 'disgusted', 'scam', 'fraud', 'refund', 'return immediately'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { conversation_id } = await req.json();

    if (!conversation_id) {
      return Response.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    // Get recent messages
    const messages = await base44.entities.Message.filter({ conversation_id }, '-timestamp', 20);
    const customerMessages = messages.filter(m => m.sender_type === 'customer').slice(-5);

    if (customerMessages.length === 0) {
      return Response.json({ sentiment: 'neutral', is_urgent: false });
    }

    const recentContent = customerMessages.map(m => m.content).join('\n');

    // Analyze sentiment using Claude
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the sentiment of these customer messages and classify as Positive, Neutral, or Negative. Only respond with one word: Positive, Neutral, or Negative.\n\n${recentContent}`,
      model: "claude_opus_4_6",
    });

    const sentiment = result?.toLowerCase().includes('positive') ? 'positive' : result?.toLowerCase().includes('negative') ? 'negative' : 'neutral';

    // Check for urgent keywords
    const hasUrgentKeywords = URGENT_KEYWORDS.some(keyword => recentContent.toLowerCase().includes(keyword));
    const is_urgent = sentiment === 'negative' && hasUrgentKeywords;

    // Update conversation
    const conversation = await base44.entities.Conversation.get(conversation_id);
    const tags = conversation.tags || [];
    
    // Remove urgent tag if no longer urgent
    const updatedTags = is_urgent ? (tags.includes('urgent') ? tags : [...tags, 'urgent']) : tags.filter(t => t !== 'urgent');

    await base44.entities.Conversation.update(conversation_id, {
      sentiment,
      is_urgent,
      tags: updatedTags,
      sentiment_updated_at: new Date().toISOString(),
    });

    return Response.json({ sentiment, is_urgent, tags: updatedTags });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});