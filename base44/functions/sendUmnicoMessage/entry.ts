import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');
const FB_PAGE_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');

// Cache the userId so we don't fetch managers on every call
let cachedUserId = null;

async function getUmnicoUserId() {
  if (cachedUserId) return cachedUserId;
  const res = await fetch('https://api.umnico.com/v1.3/managers', {
    headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` }
  });
  const managers = await res.json();
  const owner = managers.find(m => m.role === 'owner') || managers[0];
  cachedUserId = owner?.id;
  return cachedUserId;
}

async function sendViaUmnico(leadId, contactId, text) {
  const userId = await getUmnicoUserId();

  const sourcesRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/sources`, {
    headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` }
  });
  const sources = await sourcesRes.json();
  const src = Array.isArray(sources) ? (sources.find(s => s.type === 'message') || sources[0]) : null;

  const sendBody = { message: { text } };
  if (userId) sendBody.userId = userId;
  if (src?.realId) sendBody.source = String(src.realId);
  if (src?.saId) sendBody.saId = Number(src.saId);

  console.log('[sendUmnicoMessage] Sending via Umnico, leadId:', leadId, 'body:', JSON.stringify(sendBody));

  const sendRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/send`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(sendBody)
  });

  const result = await sendRes.text();
  console.log('[sendUmnicoMessage] Umnico send status:', sendRes.status, 'body:', result);
  if (!sendRes.ok) throw new Error(`Umnico send failed: ${result}`);
  return result;
}

async function sendViaFacebook(recipientId, text) {
  console.log('[sendUmnicoMessage] Sending via Facebook Graph API, recipientId:', recipientId);
  const fbRes = await fetch('https://graph.facebook.com/v18.0/me/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      access_token: FB_PAGE_TOKEN,
    }),
  });
  const result = await fbRes.text();
  console.log('[sendUmnicoMessage] Facebook send status:', fbRes.status, 'body:', result);
  if (!fbRes.ok) throw new Error(`Facebook send failed: ${result}`);
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

    const leadId = conversation.umnico_lead_id;
    const contactId = conversation.customer_fb_id;

    // Try Umnico first (if we have a leadId), else fall back to Facebook Graph API
    if (leadId && UMNICO_API_KEY) {
      const result = await sendViaUmnico(leadId, contactId, text);
      return Response.json({ success: true, method: 'umnico', response: result });
    } else if (contactId && FB_PAGE_TOKEN) {
      const result = await sendViaFacebook(contactId, text);
      return Response.json({ success: true, method: 'facebook', response: result });
    } else {
      return Response.json({ error: 'No delivery method available: missing leadId and Facebook token' }, { status: 400 });
    }

  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});