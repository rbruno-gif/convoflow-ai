import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    // Parse form-encoded body from Twilio
    const text = await req.text();
    console.log('RAW Twilio body:', text);

    const parsed = JSON.parse(text);
    console.log('Parsed JSON body:', parsed);

    const from = parsed.from;
    const body = parsed.body;
    const profileName = parsed['profile name'] || 'Customer';

    console.log('Incoming Twilio Messenger webhook:', { from, body, profileName });

    if (!from || !body) {
      return new Response('OK', { status: 200 });
    }

    const base44 = createClientFromRequest(req);

    // Get or create conversation
    const existing = await base44.asServiceRole.entities.Conversation.filter({
      customer_fb_id: from,
    });

    let conversation;
    if (existing.length > 0) {
      conversation = existing[0];
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        last_message: body.slice(0, 200),
        last_message_time: new Date().toISOString(),
        unread_count: (conversation.unread_count || 0) + 1,
        status: 'active',
      });
    } else {
      conversation = await base44.asServiceRole.entities.Conversation.create({
        customer_name: profileName,
        customer_fb_id: from,
        status: 'active',
        mode: 'ai',
        last_message: body.slice(0, 200),
        last_message_time: new Date().toISOString(),
        unread_count: 1,
        tags: ['facebook', 'twilio'],
      });
    }

    // Save incoming customer message
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      sender_type: 'customer',
      sender_name: profileName,
      content: body,
      timestamp: new Date().toISOString(),
      is_read: false,
      message_type: 'text',
    });

    // Only AI-mode conversations get auto-replies
    if (conversation.mode !== 'human') {
      // Fetch AI context
      const [settingsList, faqs, knowledgeDocs] = await Promise.all([
        base44.asServiceRole.entities.AgentSettings.list(),
        base44.asServiceRole.entities.FAQ.filter({ is_active: true }),
        base44.asServiceRole.entities.KnowledgeDoc.filter({ is_active: true }),
      ]);

      const settings = settingsList[0];
      const instructions = settings?.ai_instructions || 'You are a helpful customer support assistant. Be concise and friendly.';
      const persona = settings?.ai_persona_name || 'AI Assistant';

      const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      const kbContext = knowledgeDocs.map(d => `# ${d.title}\n${d.content}`).join('\n\n');

      // Fetch recent conversation history
      const recentMessages = await base44.asServiceRole.entities.Message.filter(
        { conversation_id: conversation.id },
        'timestamp',
        10
      );
      const history = recentMessages
        .map(m => `${m.sender_type === 'customer' ? 'Customer' : persona}: ${m.content}`)
        .join('\n');

      const prompt = `${instructions}

KNOWLEDGE BASE:
${kbContext}

FAQs:
${faqContext}

CONVERSATION HISTORY:
${history}

Customer: ${body}

Respond as ${persona}. Be concise, warm, and helpful. Do not repeat the customer's message.`;

      const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        model: 'gpt_5_mini',
      });

      const aiReply = typeof aiResponse === 'string' ? aiResponse : aiResponse?.text || "I'm here to help! Let me connect you with a team member.";

      // Save AI reply as message
      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversation.id,
        sender_type: 'ai',
        sender_name: persona,
        content: aiReply,
        timestamp: new Date().toISOString(),
        is_read: true,
        message_type: 'text',
      });

      // Update conversation with AI reply
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        last_message: aiReply.slice(0, 200),
        last_message_time: new Date().toISOString(),
        ai_resolution_attempted: true,
      });

      console.log('AI reply generated for', from);

      return new Response(aiReply, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('messengerWebhook error:', error);
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
});