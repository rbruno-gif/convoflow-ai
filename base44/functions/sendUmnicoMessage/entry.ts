import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { conversationId, text } = await req.json();
    if (!conversationId || !text) {
      return new Response(JSON.stringify({ error: 'Missing conversationId or text' }), { status: 400 });
    }

    if (!UMNICO_API_KEY) {
      return new Response(JSON.stringify({ error: 'UMNICO_API_KEY not configured' }), { status: 500 });
    }

    const conversation = await base44.asServiceRole.entities.Conversation.get(conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
    }

    const umnicoLeadId = conversation.umnico_lead_id;
    const source = conversation.umnico_source_id || null;

    if (!umnicoLeadId) {
      console.error(`[sendUmnicoMessage] No umnico_lead_id on conversation ${conversationId}`);
      return new Response(JSON.stringify({ error: 'No umnico_lead_id on conversation — webhook must fire first to populate it' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.log(`[sendUmnicoMessage] Sending to leadId: ${umnicoLeadId}, source: ${source}, text: ${text}`);

    const sendPayload = {
      message: { text },
      userId: 1,
    };
    if (source) sendPayload.source = source;

    const sendRes = await fetch(`https://api.umnico.com/v1.3/messaging/${umnicoLeadId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UMNICO_API_KEY}`,
      },
      body: JSON.stringify(sendPayload),
    });

    const sendBody = await sendRes.text();
    console.log(`[sendUmnicoMessage] Send — status: ${sendRes.status}`);
    console.log(`[sendUmnicoMessage] Send FULL RESPONSE: ${sendBody}`);
    if (sendRes.ok) {
      return new Response(JSON.stringify({ success: true, leadId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ error: `Umnico send failed: ${sendRes.status}`, detail: sendBody }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});