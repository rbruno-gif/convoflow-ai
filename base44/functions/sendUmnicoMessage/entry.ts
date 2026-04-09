import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { conversationId, text } = await req.json();

    const conversation = await base44.asServiceRole.entities.Conversation.get(conversationId);
    console.log(`[sendUmnicoMessage] umnico_lead_id: ${conversation.umnico_lead_id}, customer_fb_id: ${conversation.customer_fb_id}`);

    const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');

    let leadId = conversation.umnico_lead_id;
    let source = conversation.umnico_source_id || null;

    if (!leadId) {
      console.log(`[sendUmnicoMessage] No umnico_lead_id — searching by customer_fb_id: ${conversation.customer_fb_id}`);
      const searchRes = await fetch(`https://api.umnico.com/v1.3/leads?search=${encodeURIComponent(conversation.customer_fb_id)}`, {
        headers: { 'Authorization': `Bearer ${UMNICO_API_KEY}` },
      });
      const searchRaw = await searchRes.text();
      console.log(`[sendUmnicoMessage] Lead search FULL RESPONSE: ${searchRaw}`);
      const searchData = JSON.parse(searchRaw);
      const leads = searchData?.data || searchData?.leads || searchData?.items || (Array.isArray(searchData) ? searchData : []);
      const lead = Array.isArray(leads) ? leads[0] : null;
      leadId = lead?.id;
      source = lead?.saId || null;
    }

    const sendBody = { message: { text }, userId: 1 };
    if (source) sendBody.source = source;

    console.log(`[sendUmnicoMessage] Sending to leadId: ${leadId}, payload: ${JSON.stringify(sendBody)}`);

    const sendRes = await fetch(`https://api.umnico.com/v1.3/messaging/${leadId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UMNICO_API_KEY}`,
      },
      body: JSON.stringify(sendBody),
    });

    const sendRaw = await sendRes.text();
    console.log(`[sendUmnicoMessage] Send response status: ${sendRes.status}, FULL RESPONSE: ${sendRaw}`);

    return Response.json({ success: sendRes.ok, status: sendRes.status, response: sendRaw });
  } catch (error) {
    console.error('[sendUmnicoMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});