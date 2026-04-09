import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    
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

    const umnicoLeadId = conversation.umnico_lead_id;
    const source = conversation.umnico_source_id || null;

    let resolvedLeadId = umnicoLeadId;
    let resolvedSource = source;

    if (!resolvedLeadId) {
      console.log(`[sendUmnicoMessage] No umnico_lead_id on conversation — falling back to lead search for contactId: ${conversation.customer_fb_id}`);
      const searchRes = await fetch(`https://api.umnico.com/v1.3/leads?search=${encodeURIComponent(conversation.customer_fb_id)}`, {
        headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}`, 'Content-Type': 'application/json' },
      });
      const searchBody = await searchRes.text();
      console.log(`[sendUmnicoMessage] Lead search fallback — status: ${searchRes.status}`);
      console.log(`[sendUmnicoMessage] Lead search fallback FULL RESPONSE: ${searchBody}`);
      const searchData = JSON.parse(searchBody);
      const leads = searchData?.data || searchData?.leads || searchData?.items || (Array.isArray(searchData) ? searchData : null);
      const lead = Array.isArray(leads) ? leads[0] : null;
      resolvedLeadId = lead?.id;
      resolvedSource = lead?.saId || null;
      if (!resolvedLeadId) {
        console.error(`[sendUmnicoMessage] No lead found in fallback search`);
        return new Response(JSON.stringify({ error: 'No umnico_lead_id on conversation and lead search returned no results' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      console.log(`[sendUmnicoMessage] Fallback found leadId: ${resolvedLeadId}, source: ${resolvedSource}`);
    }

    console.log(`[sendUmnicoMessage] Sending to leadId: ${resolvedLeadId}, source: ${resolvedSource}, text: ${text}`);

    const sendPayload = {
      message: { text },
      userId: 1,
    };
    if (resolvedSource) sendPayload.source = resolvedSource;

    const sendRes = await fetch(`https://api.umnico.com/v1.3/messaging/${resolvedLeadId}/send`, {
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
      return new Response(JSON.stringify({ success: true, leadId: resolvedLeadId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ error: `Umnico send failed: ${sendRes.status}`, detail: sendBody }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});