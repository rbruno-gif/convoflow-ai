import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/10829424/u7ru89d/';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, message } = await req.json();
    if (!to || !message) return Response.json({ error: 'Missing to or message' }, { status: 400 });

    console.log(`[sendToZapier] Sending to: ${to}, message: ${message}`);

    const res = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });

    const body = await res.text();
    console.log(`[sendToZapier] Zapier response: ${res.status} ${body}`);

    return Response.json({ success: true, status: res.status, body });
  } catch (error) {
    console.error('[sendToZapier] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});