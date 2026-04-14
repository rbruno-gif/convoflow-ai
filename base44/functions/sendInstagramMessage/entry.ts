import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Send a message to an Instagram user via the Messenger API
// Uses the Facebook Page Access Token linked to the Instagram account

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, message, fb_page_id } = await req.json();
    if (!to || !message) return Response.json({ error: 'Missing to or message' }, { status: 400 });

    const USER_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!USER_TOKEN) return Response.json({ error: 'FACEBOOK_PAGE_ACCESS_TOKEN not set' }, { status: 500 });

    let pageToken = USER_TOKEN;
    let targetPageId = fb_page_id;

    if (fb_page_id) {
      // Try to get token from InstagramAccount entity
      const igAccounts = await base44.asServiceRole.entities.InstagramAccount.filter({ fb_page_id });
      if (igAccounts && igAccounts[0]?.page_access_token) {
        pageToken = igAccounts[0].page_access_token;
        console.log(`[sendInstagramMessage] Using entity token for page ${fb_page_id}`);
      } else {
        // Fallback: fetch from /me/accounts
        const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${USER_TOKEN}&fields=id,access_token&limit=100`);
        const accountsData = await accountsRes.json();
        if (accountsData.data) {
          const match = accountsData.data.find(p => p.id === fb_page_id);
          if (match) pageToken = match.access_token;
        }
      }
    }

    console.log(`[sendInstagramMessage] Sending to PSID: ${to} via page: ${targetPageId}`);

    const endpoint = targetPageId
      ? `https://graph.facebook.com/v18.0/${targetPageId}/messages`
      : 'https://graph.facebook.com/v18.0/me/messages';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: to },
        message: { text: message },
        access_token: pageToken,
      }),
    });

    const body = await res.json();
    console.log(`[sendInstagramMessage] FB response: ${JSON.stringify(body)}`);

    if (!res.ok) return Response.json({ error: body }, { status: res.status });

    return Response.json({ success: true, result: body });
  } catch (error) {
    console.error('[sendInstagramMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});