import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');

// Cache the userId so we don't fetch managers on every call
let cachedUserId = null;

async function getUmnicoUserId() {
  if (cachedUserId) return cachedUserId;
  const res = await fetch('https://api.umnico.com/v1.3/managers', {
    headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` }
  });
  const managers = await res.json();
  console.log('[sendUmnicoMessage] managers:', JSON.stringify(managers));
  // Use the owner, or first manager
  const owner = managers.find(m => m.role === 'owner') || managers[0];
  cachedUserId = owner?.id;
  return cachedUserId;
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

    const leadId = conversation.umnico_lead_id;
    if (!leadId) {
      return Response.json({ error: 'No umnico_lead_id on conversation.' }, { status: 400 });
    }

    // Get the real userId for this Umnico account
    const userId = await getUmnicoUserId();
    console.log('[sendUmnicoMessage] using userId:', userId, 'leadId:', leadId);

    // Fetch channel sources to get the correct realId
    const sourcesRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/sources`, {
      headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` }
    });
    const sources = await sourcesRes.json();
    console.log('[sendUmnicoMessage] sources:', JSON.stringify(sources));

    const src = Array.isArray(sources)
      ? (sources.find(s => s.type === 'message') || sources[0])
      : null;

    const sendBody = { message: { text } };
    if (userId) sendBody.userId = userId;
    if (src?.realId) sendBody.source = String(src.realId);
    if (src?.saId) sendBody.saId = Number(src.saId);

    console.log('[sendUmnicoMessage] sending body:', JSON.stringify(sendBody));

    const sendRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(sendBody)
    });

    const result = await sendRes.text();
    console.log('[sendUmnicoMessage] send status:', sendRes.status, 'body:', result);

    if (!sendRes.ok) return Response.json({ error: result }, { status: sendRes.status });
    return Response.json({ success: true, response: result });

  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});