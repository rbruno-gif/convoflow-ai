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

    const leadId = conversation.umnico_lead_id;
    const sourceId = conversation.umnico_source_id;
    const contactId = conversation.customer_fb_id;

    console.log('[sendUmnicoMessage] leadId:', leadId, 'sourceId:', sourceId, 'contactId:', contactId);

    // Path 1: Use v1.3 lead-based send if we have a leadId
    if (leadId) {
      // Fetch sources to get the correct realId for the channel
      const sourcesRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/sources`, {
        headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` }
      });
      const sourcesRaw = await sourcesRes.text();
      console.log('[sendUmnicoMessage] Sources status:', sourcesRes.status, 'body:', sourcesRaw);

      let realId = null;
      let saId = sourceId ? Number(sourceId) : null;

      if (sourcesRes.ok) {
        const sources = JSON.parse(sourcesRaw);
        const src = Array.isArray(sources)
          ? (sources.find(s => s.type === 'message') || sources[0])
          : null;
        realId = src?.realId ?? null;
        saId = src?.saId ?? saId;
      }

      const sendBody = { message: { text }, userId: 1 };
      if (realId != null) sendBody.source = String(realId);
      if (saId != null) sendBody.saId = Number(saId);

      console.log('[sendUmnicoMessage] Sending via v1.3 leadId:', leadId, 'body:', JSON.stringify(sendBody));

      const sendRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(sendBody)
      });
      const sendResult = await sendRes.text();
      console.log('[sendUmnicoMessage] v1.3 send status:', sendRes.status, 'body:', sendResult);

      if (sendRes.ok) {
        return Response.json({ success: true, method: 'v1.3', response: sendResult });
      }
      console.warn('[sendUmnicoMessage] v1.3 send failed, falling back to contactId method...');
    }

    // Path 2: Fallback — send via contactId directly (same method aiReply uses, known to work)
    if (!contactId) {
      return Response.json({ error: 'No leadId or contactId available to send message.' }, { status: 400 });
    }

    console.log('[sendUmnicoMessage] Sending via contactId:', contactId);
    const res = await fetch('https://api.umnico.com/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${UMNICO_API_KEY}` },
      body: JSON.stringify({ channelType: 'facebook', contactId, text })
    });
    const body = await res.text();
    console.log('[sendUmnicoMessage] contactId send status:', res.status, 'body:', body);

    if (!res.ok) return Response.json({ error: body }, { status: res.status });
    return Response.json({ success: true, method: 'contactId', response: body });

  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});