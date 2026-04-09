import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const base44 = createClientFromRequest(req);
  const { conversationId, text } = await req.json();

  if (!conversationId || !text) return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });

  const conversation = await base44.asServiceRole.entities.Conversation.get(conversationId);
  if (!conversation) return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });

  let leadId = conversation.umnico_lead_id;
  let source = conversation.umnico_source_id;

  if (!leadId) {
    const searchRes = await fetch(`https://api.umnico.com/v1.3/leads?search=${conversation.customer_fb_id}`, {
      headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` }
    });
    const searchData = await searchRes.json();
    console.log('[search result]', JSON.stringify(searchData));
    leadId = searchData?.data?.[0]?.id || searchData?.[0]?.id;
    source = searchData?.data?.[0]?.saId || searchData?.[0]?.saId;
  }

  if (!leadId) return new Response(JSON.stringify({ error: 'No lead ID found' }), { status: 404 });

  console.log('[sending] leadId:', leadId, 'source:', source, 'text:', text);

  const res = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/send`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { text }, source: String(source), userId: 1 })
  });

  const result = await res.json();
  console.log('[umnico response]', JSON.stringify(result));

  if (!res.ok) return new Response(JSON.stringify({ error: result }), { status: res.status });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});