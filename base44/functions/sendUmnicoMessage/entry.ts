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
  const owner = managers.find(m => m.role === 'owner') || managers[0];
  cachedUserId = owner?.id;
  return cachedUserId;
}

// Look up Umnico leadId by contactId (socialId)
async function findLeadIdByContactId(contactId) {
  console.log('[sendUmnicoMessage] Looking up leadId for contactId:', contactId);
  const res = await fetch(`https://api.umnico.com/v1.3/leads?limit=50`, {
    headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` }
  });
  const data = await res.json();
  const leads = Array.isArray(data) ? data : (data.leads || data.items || []);
  
  for (const lead of leads) {
    // Check if any source matches our contactId
    const sources = lead.sources || lead.contacts || [];
    for (const src of sources) {
      if (String(src.socialId) === String(contactId) || String(src.sender) === String(contactId) || String(src.id) === String(contactId)) {
        console.log('[sendUmnicoMessage] Found leadId:', lead.id, 'for contactId:', contactId);
        return String(lead.id);
      }
    }
  }
  console.log('[sendUmnicoMessage] Could not find leadId for contactId:', contactId);
  return null;
}

async function sendViaUmnico(leadId, text) {
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
  if (!sendRes.ok) throw new Error(`Umnico send failed (${sendRes.status}): ${result}`);
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

    let leadId = conversation.umnico_lead_id;
    const contactId = conversation.customer_fb_id;

    // If no leadId stored, try to look it up from Umnico by contactId
    if (!leadId && contactId && UMNICO_API_KEY) {
      leadId = await findLeadIdByContactId(contactId);
      // Save it back so we don't have to look it up every time
      if (leadId) {
        await base44.asServiceRole.entities.Conversation.update(conversationId, { umnico_lead_id: leadId });
        console.log('[sendUmnicoMessage] Saved leadId', leadId, 'to conversation', conversationId);
      }
    }

    if (!leadId) {
      return Response.json({ error: 'Could not find Umnico lead for this conversation' }, { status: 400 });
    }

    const result = await sendViaUmnico(leadId, text);
    return Response.json({ success: true, response: result });

  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});