import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * AI-powered lead qualification and capture
 * Creates leads from conversations based on customer intent
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, conversation_id } = await req.json();

    if (!company_id || !conversation_id) {
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

    // Get conversation and messages
    const convs = await base44.asServiceRole.entities.CompanyConversation.filter({
      company_id,
      id: conversation_id,
    });

    if (convs.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = convs[0];

    const messages = await base44.asServiceRole.entities.CompanyMessage.filter({
      company_id,
      conversation_id,
    }, 'timestamp', 50);

    const conversationText = messages.map((m) =>
      `${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content}`
    ).join('\n');

    // Analyze for lead qualification
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this customer support conversation and determine if this should be captured as a sales lead.

Conversation:
${conversationText}

Return a JSON object with:
- should_capture (boolean): whether this should be a lead
- urgency (low/medium/high/urgent): how urgent is their need
- interest (string): what service/product are they interested in
- confidence (0-100): how confident are you this is a genuine lead
- notes (string): brief notes about the customer

Only return JSON, no other text.`,
      response_json_schema: {
        type: 'object',
        properties: {
          should_capture: { type: 'boolean' },
          urgency: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          interest: { type: 'string' },
          confidence: { type: 'number' },
          notes: { type: 'string' },
        },
      },
    });

    // If should capture, create lead record
    if (analysis?.should_capture) {
      const lead = await base44.asServiceRole.entities.CompanyLead.create({
        company_id,
        name: conversation.customer_name,
        email: conversation.customer_email || '',
        phone: conversation.customer_phone || '',
        conversation_id,
        interest: analysis.interest,
        urgency: analysis.urgency,
        status: 'new',
        source: 'chat',
        notes: analysis.notes,
      });

      return Response.json({
        success: true,
        lead_created: true,
        lead_id: lead.id,
        confidence: analysis.confidence,
      });
    }

    return Response.json({
      success: true,
      lead_created: false,
      reason: 'Did not meet lead qualification criteria',
    });
  } catch (error) {
    console.error('Error in analyzeLeadQualification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});