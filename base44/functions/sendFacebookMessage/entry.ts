import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, message } = await req.json();
    if (!to || !message) return Response.json({ error: 'Missing to or message' }, { status: 400 });

    const PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!PAGE_ACCESS_TOKEN) return Response.json({ error: 'FACEBOOK_PAGE_ACCESS_TOKEN not set' }, { status: 500 });

    console.log(`[sendFacebookMessage] Sending to PSID: ${to}, message: ${message}`);

    const res = await fetch('https://graph.facebook.com/v18.0/me/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: to },
        message: { text: message },
        access_token: PAGE_ACCESS_TOKEN,
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