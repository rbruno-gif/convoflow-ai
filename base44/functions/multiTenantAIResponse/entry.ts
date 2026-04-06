import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Agentic AI response handler for multi-tenant system
 * Ensures tenant isolation and uses company-specific knowledge base
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, conversation_id, customer_message } = await req.json();

    if (!company_id || !conversation_id || !customer_message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has access to this company
    const userCompanies = await base44.asServiceRole.entities.CompanyAgent.filter({
      email: user.email,
      company_id,
      status: 'active',
    });

    if (userCompanies.length === 0) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch company data
    const companies = await base44.asServiceRole.entities.Company.filter({ id: company_id });
    const company = companies[0];

    if (!company) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Fetch company settings
    const settingsList = await base44.asServiceRole.entities.CompanySettings.filter({ company_id });
    const settings = settingsList[0] || {};

    // Fetch company knowledge base (only for this company)
    const knowledgeBase = await base44.asServiceRole.entities.CompanyKnowledgeBase.filter({
      company_id,
      is_active: true,
    });

    // Fetch recent conversation history (only for this company)
    const messages = await base44.asServiceRole.entities.CompanyMessage.filter({
      company_id,
      conversation_id,
    }, 'timestamp', 20);

    // Format knowledge base for context
    const kbContext = knowledgeBase.map((item) => 
      `# ${item.title}\n${item.content}`
    ).join('\n\n');

    // Format conversation history
    const conversationHistory = messages.map((m) =>
      `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content}`
    ).join('\n');

    // Get AI instructions
    const aiInstructions = settings.ai_instructions || 'You are a helpful support agent.';
    const chatbotName = settings.chatbot_name || 'ShopBot';
    const tone = settings.tone_of_voice || 'professional';

    // Call LLM with company context
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ${chatbotName}, the official support agent for ${company.name}.

Company Details:
- Website: ${company.website}
- Industry: ${company.industry}
- Support: ${company.support_email}

Tone: ${tone}

Additional Instructions:
${aiInstructions}

Knowledge Base:
${kbContext || 'No knowledge base articles available.'}

Recent Conversation:
${conversationHistory}

Customer Message: ${customer_message}

Based on the company's knowledge base and your instructions, provide a helpful response. If you cannot answer the question based on the knowledge base, offer to escalate to a human agent.`,
      model: 'claude_opus_4_6',
    });

    const aiResponse = typeof response === 'string' ? response : response?.text || 'I need to connect you with a human agent for this.';

    // Create message record (server-side to ensure tenant isolation)
    const message = await base44.asServiceRole.entities.CompanyMessage.create({
      company_id,
      conversation_id,
      sender_type: 'ai',
      sender_name: chatbotName,
      content: aiResponse,
      timestamp: new Date().toISOString(),
      message_type: 'text',
    });

    // Update conversation
    await base44.asServiceRole.entities.CompanyConversation.update(conversation_id, {
      last_message: aiResponse,
      last_message_time: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: aiResponse,
      message_id: message.id,
    });
  } catch (error) {
    console.error('Error in multiTenantAIResponse:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});