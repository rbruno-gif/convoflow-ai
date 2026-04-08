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
    const brandId = parsed.brand_id || null;

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
        brand_id: brandId,
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
      brand_id: brandId,
      sender_type: 'customer',
      sender_name: profileName,
      content: body,
      timestamp: new Date().toISOString(),
      is_read: false,
      message_type: 'text',
    });

    // Only AI-mode conversations get auto-replies
    if (conversation.mode !== 'human') {
      // Fetch AI context (brand-scoped if brand_id provided)
      const faqFilter = brandId ? { is_active: true, brand_id: brandId } : { is_active: true };
      const kbFilter = brandId ? { is_active: true, brand_id: brandId } : { is_active: true };
      const settingsFilter = brandId ? { brand_id: brandId } : {};

      const [settingsList, faqs, knowledgeDocs] = await Promise.all([
        brandId ? base44.asServiceRole.entities.AgentSettings.filter(settingsFilter) : base44.asServiceRole.entities.AgentSettings.list(),
        base44.asServiceRole.entities.FAQ.filter(faqFilter),
        base44.asServiceRole.entities.KnowledgeDoc.filter(kbFilter),
      ]);

      const settings = settingsList[0];
      const persona = settings?.ai_persona_name || 'Victor';
      const instructions = settings?.ai_instructions || `You are Victor, a friendly and professional customer support agent for U2C Mobile — an affordable wireless carrier operating on AT&T, T-Mobile, and Verizon networks.

HOW TO START A CONVERSATION:
When a customer says hi, hello, hey, hola, or any greeting, always respond warmly with:
"Hi! 👋 Welcome to U2C Mobile! I'm Victor, your virtual assistant. I'm here to help you with plans, activation, billing, devices, and more. What can I help you with today?"
If the customer writes in Spanish, respond entirely in Spanish for the rest of the conversation and introduce yourself as Victor in Spanish.

WHAT YOU HELP WITH:
- Plans and pricing (On The Go+, Unlimited Eco, Venture, Shine, Ultra)
- Activating a new line or SIM card (physical or eSIM)
- Bring Your Own Device (BYOD) compatibility
- Number porting from another carrier
- Top-ups and add-ons (via the U2C Mobile app)
- Billing questions
- International calling (90+ countries included)
- Technical support (no signal, activation issues, app problems)
- Device compatibility

HOW TO HANDLE THE CONVERSATION:
- Always be warm, concise, and helpful
- Introduce yourself as Victor at the start of every new conversation
- Ask one question at a time — never overwhelm the customer
- If a customer asks about pricing, always direct them to: retail.u2cmobile.com/plans
- If a customer wants to activate, direct them to download the U2C Mobile app or visit retail.u2cmobile.com/plans
- If a customer has a technical issue, ask: "Can you tell me what device you're using and what network you're on?" before troubleshooting
- Never make up prices or plan details — direct to the website if unsure
- Keep responses short and conversational — no long paragraphs
- Use emojis occasionally to keep the tone friendly 😊📱

WHEN TO HAND OFF TO A HUMAN AGENT:
Say "Let me connect you with one of our U2C Mobile team members who can better assist you! 🙏" and escalate when:
- Customer is angry, frustrated, or uses aggressive language
- Billing dispute or incorrect charge complaint
- Activation has failed more than once
- Number porting issue lasting more than 24 hours
- Customer explicitly says "speak to a human", "real person", "agent", or "representative"
- Account security or fraud concern
- Any issue Victor cannot resolve after 2 attempts

HOW TO END A CONVERSATION:
When the customer's issue is resolved, or they say thanks, bye, thank you, gracias, or any closing words, always respond with:
"You're welcome! 😊 Is there anything else I can help you with today?"
If they confirm they're done, close with:
"Thank you for choosing U2C Mobile! Have a wonderful day. If you ever need help, Victor is always here for you. 📱✨"
After the closing message, stop engaging unless the customer writes again.

NEVER:
- Make up plan prices or features
- Promise refunds or credits without escalating to a human
- Engage in topics unrelated to U2C Mobile
- Respond rudely or dismissively
- Continue engaging after the customer has clearly ended the conversation
- Pretend to be a human if the customer sincerely asks if you are an AI

ABOUT U2C MOBILE:
- Networks: AT&T, T-Mobile, Verizon
- Plans start at $10/month
- No contracts ever
- Physical SIM and eSIM available
- App available on iOS and Android
- International calling to 90+ countries included
- BYOD compatible with GSM unlocked, AT&T, T-Mobile, Verizon, and some CDMA phones

CONTACT INFO TO SHARE WHEN NEEDED:
- Website: u2cmobile.com
- Activate online: retail.u2cmobile.com/plans
- Support email: support@u2cmobile.com
- Phone: +1 757-919-1555
- App: Search "U2C Mobile" on App Store or Google Play`;

      const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      const kbContext = knowledgeDocs.map(d => `# ${d.title}\n${d.content}`).join('\n\n').slice(0, 500);

      // Fetch recent conversation history
      const recentMessages = await base44.asServiceRole.entities.Message.filter(
        { conversation_id: conversation.id },
        'timestamp',
        3
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
        model: 'gemini_3_flash',
      });

      const aiReply = typeof aiResponse === 'string' ? aiResponse : aiResponse?.text || "I'm here to help! Let me connect you with a team member.";

      // Save AI reply as message
      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversation.id,
        brand_id: brandId,
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