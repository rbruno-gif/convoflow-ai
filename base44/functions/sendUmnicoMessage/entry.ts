import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const base44 = createClientFromRequest(req);
    const { conversationId, text } = await req.json();

    if (!conversationId || !text) {
      return Response.json({ error: 'Missing conversationId or text' }, { status: 400 });
    }

    const conversation = await base44.asServiceRole.entities.Conversation.get(conversationId);
    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    console.log('[sendUmnicoMessage] umnico_lead_id:', conversation.umnico_lead_id, 'umnico_source_id:', conversation.umnico_source_id);

    const leadId = conversation.umnico_lead_id;
    if (!leadId) {
      console.error('[sendUmnicoMessage] No umnico_lead_id on conversation — cannot send.');
      return Response.json({ error: 'No umnico_lead_id on conversation. An incoming Umnico message must arrive first to populate the lead ID.' }, { status: 400 });
    }

    // Fetch all message channels for this lead to get the correct realId
    const sourcesRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/sources`, {
      headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` }
    });
    const sourcesRaw = await sourcesRes.text();
    console.log('[sendUmnicoMessage] Sources response status:', sourcesRes.status, 'body:', sourcesRaw);

    if (!sourcesRes.ok) {
      return Response.json({ error: `Umnico sources failed: ${sourcesRaw}` }, { status: 502 });
    }

    const sources = JSON.parse(sourcesRaw);
    // Prefer fb_messenger channel of type 'message', fallback to first
    const fbSource = Array.isArray(sources)
      ? (sources.find(s => s.type === 'message') || sources[0])
      : null;

    const realId = fbSource?.realId;
    const saId = fbSource?.saId ?? (conversation.umnico_source_id ? Number(conversation.umnico_source_id) : undefined);

    console.log('[sendUmnicoMessage] Using realId:', realId, 'saId:', saId);

    const sendBody = { message: { text }, userId: 1 };
    if (realId != null) sendBody.source = String(realId);
    if (saId != null) sendBody.saId = Number(saId);

    console.log('[sendUmnicoMessage] Sending to leadId:', leadId, 'body:', JSON.stringify(sendBody));

    const sendRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(sendBody)
    });

    const sendResult = await sendRes.text();
    console.log('[sendUmnicoMessage] Umnico send status:', sendRes.status, 'body:', sendResult);

    if (!sendRes.ok) {
      return Response.json({ error: sendResult }, { status: sendRes.status });
    }

    return Response.json({ success: true, response: sendResult });

  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});