import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Create support ticket from conversation when AI cannot resolve
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, conversation_id, reason, priority } = await req.json();

    if (!company_id || !conversation_id || !reason) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify access
    const userCompanies = await base44.asServiceRole.entities.CompanyAgent.filter({
      email: user.email,
      company_id,
      status: 'active',
    });

    if (userCompanies.length === 0) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get conversation
    const convs = await base44.asServiceRole.entities.CompanyConversation.filter({
      company_id,
      id: conversation_id,
    });

    if (convs.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = convs[0];

    // Get conversation summary using AI
    const messages = await base44.asServiceRole.entities.CompanyMessage.filter({
      company_id,
      conversation_id,
    }, 'timestamp', 100);

    const conversationText = messages.map((m) =>
      `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content}`
    ).join('\n');

    const summary = await base44.integrations.Core.InvokeLLM({
      prompt: `Summarize this customer support conversation in 2-3 sentences for a support ticket:

${conversationText}`,
    });

    // Create ticket
    const ticket = await base44.asServiceRole.entities.CompanyTicket.create({
      company_id,
      conversation_id,
      customer_name: conversation.customer_name,
      customer_email: conversation.customer_email,
      title: `[Escalated] ${conversation.customer_name} - ${reason}`,
      description: summary || conversationText.slice(0, 500),
      status: 'open',
      priority: priority || 'medium',
      category: extractCategory(reason),
      internal_notes: `Escalated from AI conversation. Reason: ${reason}`,
    });

    // Update conversation to reflect ticket creation
    await base44.asServiceRole.entities.CompanyConversation.update(conversation_id, {
      status: 'human_requested',
      mode: 'human',
    });

    return Response.json({
      success: true,
      ticket_id: ticket.id,
      ticket_number: ticket.id.slice(-6).toUpperCase(),
    });
  } catch (error) {
    console.error('Error in escalateToTicket:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractCategory(reason) {
  const reason_lower = reason.toLowerCase();
  if (reason_lower.includes('billing') || reason_lower.includes('payment')) return 'billing';
  if (reason_lower.includes('complaint')) return 'complaint';
  if (reason_lower.includes('refund')) return 'refund';
  if (reason_lower.includes('account')) return 'account';
  if (reason_lower.includes('technical')) return 'technical';
  return 'other';
}