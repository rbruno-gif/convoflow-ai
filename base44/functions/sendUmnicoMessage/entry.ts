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

    const contactId = conversation.customer_fb_id;
    if (!contactId) {
      return new Response(JSON.stringify({ error: 'No customer_fb_id on conversation' }), { status: 400 });
    }

    // Step 1: Find Umnico lead ID by searching with the Facebook contact ID
    console.log(`[sendUmnicoMessage] Looking up lead for contactId: ${contactId}`);
    const searchRes = await fetch(`https://api.umnico.com/v1.3/leads?search=${encodeURIComponent(contactId)}`, {
      headers: {
        'Authorization': `Bearer ${UMNICO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const searchBody = await searchRes.text();
    console.log(`[sendUmnicoMessage] Lead search — status: ${searchRes.status}`);
    console.log(`[sendUmnicoMessage] Lead search FULL RESPONSE: ${searchBody}`);

    if (!searchRes.ok) {
      return new Response(JSON.stringify({ error: `Lead search failed: ${searchRes.status}`, detail: searchBody }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const searchData = JSON.parse(searchBody);
    // Extract lead — try common response shapes
    const leads = searchData?.data || searchData?.leads || searchData?.items || searchData;
    const lead = Array.isArray(leads) ? leads[0] : searchData;
    const leadId = lead?.id;
    const source = lead?.saId || (lead?.sources && lead.sources[0]) || null;

    if (!leadId) {
      console.error(`[sendUmnicoMessage] No lead found for contactId: ${contactId}`, searchBody);
      return new Response(JSON.stringify({ error: 'No Umnico lead found for this contact', detail: searchBody }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    console.log(`[sendUmnicoMessage] Extracted lead object: ${JSON.stringify(lead)}`);
    console.log(`[sendUmnicoMessage] Found leadId: ${leadId}, source: ${source}, sending message: ${text}`);

    // Step 2: Send message via lead ID
    const sendPayload = {
      message: { text },
      userId: 1,
    };
    if (source) sendPayload.source = source;

    const sendRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/send`, {
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