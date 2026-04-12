import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Test function: send a Facebook message to a specific PSID
// Usage: pass { psid: "USER_PSID", page_id: "PAGE_ID", message: "Hello!" }
// page_id is optional — will auto-detect from first page if omitted

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { psid, page_id, message = 'Test message from ConvoFlow ✅' } = await req.json();
    if (!psid) return Response.json({ error: 'Missing psid' }, { status: 400 });

    const USER_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!USER_TOKEN) return Response.json({ error: 'FACEBOOK_PAGE_ACCESS_TOKEN not set' }, { status: 500 });

    // Get page-specific token
    const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${USER_TOKEN}&fields=id,name,access_token&limit=100`);
    const accountsData = await accountsRes.json();

    if (!accountsData.data || accountsData.data.length === 0) {
      return Response.json({ error: 'No pages found', debug: accountsData }, { status: 400 });
    }

    let targetPage = accountsData.data[0];
    if (page_id) {
      const match = accountsData.data.find(p => p.id === page_id);
      if (match) targetPage = match;
    }

    console.log(`[testSendFbMessage] Sending to PSID: ${psid} via page: ${targetPage.name} (${targetPage.id})`);

    const fbRes = await fetch(`https://graph.facebook.com/v18.0/${targetPage.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text: message },
        access_token: targetPage.access_token,
      }),
    });

    const fbBody = await fbRes.json();
    console.log(`[testSendFbMessage] FB response (${fbRes.status}):`, JSON.stringify(fbBody));

    return Response.json({
      success: fbRes.ok,
      page_used: { id: targetPage.id, name: targetPage.name },
      psid,
      message,
      fb_response: fbBody,
    });
  } catch (error) {
    console.error('[testSendFbMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});