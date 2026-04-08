/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import crypto from 'crypto';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const payload = JSON.parse(body);

    // Extract brand_id from webhook payload
    const brandId = payload.brand_id;
    if (!brandId) {
      console.error('No brand_id in webhook payload');
      return Response.json({ error: 'Missing brand_id' }, { status: 400 });
    }

    // Validate webhook secret
    const voiceSettings = await base44.asServiceRole.entities.VoiceSettings.filter({ brand_id: brandId });
    if (voiceSettings.length === 0) {
      console.error(`Voice settings not found for brand ${brandId}`);
      return Response.json({ error: 'Voice settings not found' }, { status: 404 });
    }

    const settings = voiceSettings[0];
    const signature = req.headers.get('x-autocalls-signature');
    if (settings.webhook_secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', settings.webhook_secret)
        .update(body)
        .digest('hex');
      if (signature !== expectedSignature) {
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const eventType = payload.event;
    const callData = payload.data || {};

    // Create or update voice call log
    let callLog = null;
    const existingLogs = await base44.asServiceRole.entities.VoiceCallLog.filter({
      brand_id: brandId,
      autocalls_id: callData.call_id
    });

    if (existingLogs.length > 0) {
      callLog = existingLogs[0];
      await base44.asServiceRole.entities.VoiceCallLog.update(callLog.id, {
        call_status: mapCallStatus(eventType),
        duration_seconds: callData.duration || 0,
        transcript: callData.transcript || '',
        recording_url: callData.recording_url || '',
        intent_detected: callData.intent || '',
        intent_confidence: callData.intent_confidence || 0,
        outcome: callData.outcome || '',
        ai_resolution: callData.resolved_by_ai || false,
        webhook_payload: payload
      });
    } else {
      const newLog = await base44.asServiceRole.entities.VoiceCallLog.create({
        brand_id: brandId,
        customer_phone: callData.caller_phone || callData.customer_phone || '',
        customer_name: callData.caller_name || callData.customer_name || '',
        call_direction: callData.direction || 'inbound',
        call_status: mapCallStatus(eventType),
        duration_seconds: callData.duration || 0,
        transcript: callData.transcript || '',
        recording_url: callData.recording_url || '',
        intent_detected: callData.intent || '',
        intent_confidence: callData.intent_confidence || 0,
        outcome: callData.outcome || '',
        ai_resolution: callData.resolved_by_ai || false,
        workflow_id: callData.workflow_id || '',
        campaign_id: callData.campaign_id || '',
        autocalls_id: callData.call_id || '',
        webhook_payload: payload
      });
      callLog = newLog;
    }

    // Handle call.ended event - create ticket if needed
    if (eventType === 'call.ended' && !callData.resolved_by_ai && callData.issue_summary) {
      const customer = await findOrCreateCustomer(base44, brandId, callData.caller_phone, callData.caller_name);

      // Determine correct department based on intent
      const departments = await base44.asServiceRole.entities.Department.filter({ brand_id: brandId });
      let targetDepartment = departments[0]; // Default to first dept

      if (callData.intent) {
        targetDepartment = departments.find(d => 
          d.routing_keywords?.some(kw => callData.intent.toLowerCase().includes(kw.toLowerCase()))
        ) || departments[0];
      }

      // Create support ticket
      await base44.asServiceRole.entities.Ticket.create({
        brand_id: brandId,
        customer_id: customer.id,
        subject: `Voice: ${callData.issue_summary || 'Call escalation'}`,
        description: `Call transcript: ${callData.transcript || 'N/A'}\nRecording: ${callData.recording_url || 'N/A'}`,
        status: 'open',
        priority: 'medium',
        channel: 'voice',
        voice_call_id: callLog.id,
        department_id: targetDepartment?.id
      });

      // Create or update conversation for omnichannel view
      await base44.asServiceRole.entities.Conversation.create({
        brand_id: brandId,
        customer_id: customer.id,
        customer_phone: callData.caller_phone,
        customer_name: callData.caller_name,
        channel: 'voice',
        status: 'active',
        mode: 'human',
        last_message: callData.issue_summary || 'Voice call received',
        last_message_time: new Date().toISOString(),
        voice_call_id: callLog.id
      });
    }

    // Handle transferred calls
    if (eventType === 'call.transferred') {
      await base44.asServiceRole.entities.VoiceCallLog.update(callLog.id, {
        call_status: 'transferred',
        transferred_to_agent: callData.transferred_to || ''
      });
    }

    // Update daily analytics
    const today = new Date().toISOString().split('T')[0];
    const analytics = await base44.asServiceRole.entities.VoiceAnalytics.filter({
      brand_id: brandId,
      date: today
    });

    if (analytics.length > 0) {
      const current = analytics[0];
      const updates = {
        total_inbound_calls: (current.total_inbound_calls || 0) + (callData.direction === 'inbound' ? 1 : 0),
        total_outbound_calls: (current.total_outbound_calls || 0) + (callData.direction === 'outbound' ? 1 : 0),
        inbound_answered: (current.inbound_answered || 0) + (callData.direction === 'inbound' && callData.answered ? 1 : 0),
        outbound_answered: (current.outbound_answered || 0) + (callData.direction === 'outbound' && callData.answered ? 1 : 0)
      };
      await base44.asServiceRole.entities.VoiceAnalytics.update(analytics[0].id, updates);
    } else {
      await base44.asServiceRole.entities.VoiceAnalytics.create({
        brand_id: brandId,
        date: today,
        total_inbound_calls: callData.direction === 'inbound' ? 1 : 0,
        total_outbound_calls: callData.direction === 'outbound' ? 1 : 0,
        inbound_answered: callData.direction === 'inbound' && callData.answered ? 1 : 0,
        outbound_answered: callData.direction === 'outbound' && callData.answered ? 1 : 0
      });
    }

    return Response.json({ success: true, call_log_id: callLog.id }, { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function mapCallStatus(eventType) {
  const statusMap = {
    'call.started': 'in_progress',
    'call.ended': 'completed',
    'call.ringing': 'ringing',
    'call.transferred': 'transferred',
    'call.voicemail': 'voicemail',
    'call.no_answer': 'no_answer'
  };
  return statusMap[eventType] || 'pending';
}

async function findOrCreateCustomer(base44, brandId, phone, name) {
  const existing = await base44.asServiceRole.entities.CustomerProfile.filter({
    brand_id: brandId,
    phone
  });

  if (existing.length > 0) {
    return existing[0];
  }

  return await base44.asServiceRole.entities.CustomerProfile.create({
    brand_id: brandId,
    name: name || 'Unknown',
    phone,
    email: ''
  });
}