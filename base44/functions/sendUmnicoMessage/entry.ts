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

    const conversation = await base44.asServiceRole.entities.Conversation.get(conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
    }

    const leadId = conversation.umnico_lead_id;
    if (!leadId) {
      return new Response(JSON.stringify({ error: 'No Umnico lead ID on conversation' }), { status: 400 });
    }

    if (!UMNICO_API_KEY) {
      return new Response(JSON.stringify({ error: 'UMNICO_API_KEY not configured' }), { status: 500 });
    }

    console.log(`[sendUmnicoMessage] Sending to leadId: ${leadId}, text: ${text}`);

    const res = await fetch(`https://api.umnico.com/v1.3/leads/${leadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UMNICO_API_KEY}`,
      },
      body: JSON.stringify({ text }),
    });

    const body = await res.text();
    if (res.ok) {
      console.log(`[sendUmnicoMessage] SUCCESS — status: ${res.status}, response: ${body}`);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      console.error(`[sendUmnicoMessage] FAILED — status: ${res.status}, response: ${body}`);
      return new Response(JSON.stringify({ error: `Umnico API error: ${res.status}`, detail: body }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});