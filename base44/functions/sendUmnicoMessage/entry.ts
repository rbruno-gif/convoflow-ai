import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';



async function sendViaZapier(to, text) {
  const zapierUrl = 'https://hooks.zapier.com/hooks/catch/10829424/u7ru89d/';
  const payload = { to, message: text };
  
  console.log('[sendUmnicoMessage] Sending via Zapier:', JSON.stringify(payload));
  
  const res = await fetch(zapierUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const result = await res.text();
  console.log('[sendUmnicoMessage] Zapier response status:', res.status, 'body:', result);
  if (!res.ok) throw new Error(`Zapier send failed (${res.status}): ${result}`);
  return result;
}

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

    const to = conversation.customer_fb_id;
    if (!to) {
      return Response.json({ error: 'No customer_fb_id on conversation' }, { status: 400 });
    }

    const result = await sendViaZapier(to, text);
    return Response.json({ success: true, response: result });

  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});