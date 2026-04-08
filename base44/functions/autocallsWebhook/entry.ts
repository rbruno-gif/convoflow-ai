import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.text();
    const signature = req.headers.get('x-autocalls-signature') || '';
    const brandId = req.headers.get('x-brand-id') || '';

    // Validate brand_id
    if (!brandId) {
      return Response.json({ error: 'Missing brand_id' }, { status: 400 });
    }

    // Validate webhook signature
    const base44 = createClientFromRequest(req);
    const settingsList = await base44.asServiceRole.entities.AutocallsSettings.filter({ brand_id: brandId });
    if (settingsList.length === 0) {
      return Response.json({ error: 'Brand settings not found' }, { status: 404 });
    }

    const settings = settingsList[0];
    const secret = settings.webhook_secret || '';
    
    if (secret) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(body);
      const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signature_bytes = await crypto.subtle.sign('HMAC', key, messageData);
      const hash = Array.from(new Uint8Array(signature_bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (signature !== hash) {
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    const eventType = data.event_type || '';
    const callData = data.call || {};

    // Route to handler based on event type
    if (eventType === 'call.ended') {
      return await handleCallEnded(base44, brandId, callData);
    } else if (eventType === 'call.transferred') {
      return await handleCallTransferred(base44, brandId, callData);
    } else if (eventType === 'call.voicemail') {
      return await handleVoicemail(base44, brandId, callData);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Autocalls webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleCallEnded(base44, brandId, callData) {
  try {
    const {
      call_id,
      direction,
      call_type,
      customer_phone,
      customer_name,
      issue_summary,
      transcript,
      recording_url,
      duration_seconds,
      resolved_by_ai,
    } = callData;

    // Create VoiceCall record
    const voiceCall = await base44.asServiceRole.entities.VoiceCall.create({
      brand_id: brandId,
      customer_phone,
      customer_name: customer_name || 'Unknown',
      direction,
      call_type,
      status: 'completed',
      duration_seconds,
      transcript,
      recording_url,
      issue_summary,
      resolved_by_ai,
      autocalls_id: call_id,
    });

    // For inbound support calls: create ticket and conversation
    if (direction === 'inbound' && call_type === 'inbound_support') {
      // Create conversation in inbox
      const conversation = await base44.asServiceRole.entities.Conversation.create({
        brand_id: brandId,
        customer_name: customer_name || 'Unknown',
        customer_phone,
        channel: 'voice',
        mode: resolved_by_ai ? 'ai' : 'human',
        status: resolved_by_ai ? 'resolved' : 'active',
        last_message: issue_summary || 'Voice call',
        last_message_time: new Date().toISOString(),
      });

      // Create support ticket
      const ticket = await base44.asServiceRole.entities.Ticket.create({
        brand_id: brandId,
        conversation_id: conversation.id,
        subject: issue_summary || 'Inbound Voice Call',
        description: `Voice call from ${customer_name || 'Unknown'}\nPhone: ${customer_phone}\n\nTranscript:\n${transcript || '(No transcript available)'}`,
        status: resolved_by_ai ? 'resolved' : 'open',
        priority: 'normal',
        channel: 'voice',
        call_recording_url: recording_url,
        call_transcript: transcript,
      });

      // Link voice call to conversation and ticket
      await base44.asServiceRole.entities.VoiceCall.update(voiceCall.id, {
        conversation_id: conversation.id,
        ticket_id: ticket.id,
      });
    }

    // For campaign and followup calls: log outcome
    if (call_type === 'outbound_campaign' || call_type === 'outbound_followup') {
      const outcome = callData.campaign_outcome || 'answered';
      await base44.asServiceRole.entities.VoiceCall.update(voiceCall.id, {
        campaign_outcome: outcome,
      });

      // If followup call and not satisfied: reopen ticket
      if (call_type === 'outbound_followup' && callData.followup_response === 'not_satisfied') {
        if (voiceCall.ticket_id) {
          await base44.asServiceRole.entities.Ticket.update(voiceCall.ticket_id, {
            status: 'open',
            priority: 'high',
          });
        }
      }
    }

    return Response.json({ success: true, call_id: voiceCall.id });
  } catch (error) {
    console.error('handleCallEnded error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleCallTransferred(base44, brandId, callData) {
  try {
    const { call_id, agent_email } = callData;
    const calls = await base44.asServiceRole.entities.VoiceCall.filter({ autocalls_id: call_id });
    if (calls.length > 0) {
      await base44.asServiceRole.entities.VoiceCall.update(calls[0].id, {
        transferred_to_agent: true,
        transfer_agent_email: agent_email,
        status: 'in_progress',
      });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('handleCallTransferred error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleVoicemail(base44, brandId, callData) {
  try {
    const { call_id, transcript, recording_url } = callData;
    const calls = await base44.asServiceRole.entities.VoiceCall.filter({ autocalls_id: call_id });
    if (calls.length > 0) {
      await base44.asServiceRole.entities.VoiceCall.update(calls[0].id, {
        status: 'voicemail',
        transcript,
        recording_url,
      });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('handleVoicemail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}