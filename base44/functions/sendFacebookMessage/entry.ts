import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, message, page_id } = await req.json();
    if (!to || !message) return Response.json({ error: 'Missing to or message' }, { status: 400 });

    const USER_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!USER_TOKEN) return Response.json({ error: 'FACEBOOK_PAGE_ACCESS_TOKEN not set' }, { status: 500 });

    // Get the correct page-specific token
    let pageToken = USER_TOKEN;
    let targetPageId = page_id;

    if (page_id) {
      // Try to get token from entity first
      const pages = await base44.asServiceRole.entities.FacebookPage.filter({ page_id });
      if (pages && pages[0]?.page_access_token) {
        pageToken = pages[0].page_access_token;
        console.log(`[sendFacebookMessage] Using entity token for page ${page_id}`);
      } else {
        // Fallback: fetch dynamically from /me/accounts
        const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${USER_TOKEN}&fields=id,access_token&limit=100`);
        const accountsData = await accountsRes.json();
        if (accountsData.data) {
          const match = accountsData.data.find(p => p.id === page_id);
          if (match) {
            pageToken = match.access_token;
            console.log(`[sendFacebookMessage] Using dynamic token for page ${page_id}`);
          }
        }
      }
    } else {
      // No page_id — try to infer from /me/accounts (use first page)
      console.warn('[sendFacebookMessage] No page_id provided — this may send from wrong page');
    }

    console.log(`[sendFacebookMessage] Sending to PSID: ${to} via page: ${targetPageId || 'me'}`);

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
    console.log(`[sendFacebookMessage] FB response: ${JSON.stringify(body)}`);

    if (!res.ok) {
      return Response.json({ error: body }, { status: res.status });
    }

    return Response.json({ success: true, result: body });
  } catch (error) {
    console.error('[sendFacebookMessage] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});