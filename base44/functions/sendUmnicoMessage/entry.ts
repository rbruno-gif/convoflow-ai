import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const base44 = createClientFromRequest(req);
  const { conversationId, text } = await req.json();

  if (!conversationId || !text) return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });

  const conversation = await base44.asServiceRole.entities.Conversation.get(conversationId);
  if (!conversation) return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });

  console.log('[sendUmnicoMessage] umnico_lead_id:', conversation.umnico_lead_id, 'umnico_source_id:', conversation.umnico_source_id, 'customer_fb_id:', conversation.customer_fb_id);

  const leadId = conversation.umnico_lead_id;
  if (!leadId) {
    console.error('[sendUmnicoMessage] No umnico_lead_id on conversation — cannot send. The webhook must fire first.');
    return new Response(JSON.stringify({ error: 'No umnico_lead_id on conversation. Wait for an incoming message to populate it.' }), { status: 400 });
  }

  // Get the correct source realId for this lead's fb_messenger channel
  const sourcesRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/sources`, {
    headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` }
  });
  const sourcesRaw = await sourcesRes.text();
  console.log('[sendUmnicoMessage] Sources response:', sourcesRaw);

  const sources = JSON.parse(sourcesRaw);
  // Find the fb_messenger message channel
  const fbSource = Array.isArray(sources)
    ? (sources.find(s => s.type === 'message') || sources[0])
    : null;

  const realId = fbSource?.realId;
  const saId = fbSource?.saId || conversation.umnico_source_id;

  console.log('[sendUmnicoMessage] Using realId:', realId, 'saId:', saId);

  const sendBody = { message: { text }, userId: 1 };
  if (realId) sendBody.source = String(realId);
  if (saId) sendBody.saId = Number(saId);

  console.log('[sendUmnicoMessage] Sending to leadId:', leadId, 'body:', JSON.stringify(sendBody));

  const res = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/send`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(sendBody)
  });

  const result = await res.text();
  console.log('[sendUmnicoMessage] Umnico send response status:', res.status, 'body:', result);

  if (!res.ok) return new Response(JSON.stringify({ error: result }), { status: res.status });
  return new Response(JSON.stringify({ success: true, response: result }), { status: 200 });
});