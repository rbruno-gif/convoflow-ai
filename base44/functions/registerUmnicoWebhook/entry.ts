import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const UMNICO_API_KEY = Deno.env.get('UMNICO_API_KEY');
    if (!UMNICO_API_KEY) {
      return Response.json({ error: 'UMNICO_API_KEY not set' }, { status: 500 });
    }

    console.log('[registerUmnicoWebhook] Registering webhook URL with Umnico...');

    const res = await fetch('https://api.umnico.com/v1.3/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UMNICO_API_KEY}`,
      },
      body: JSON.stringify({
        url: 'https://caped-smart-chat-pulse.base44.app/functions/umnicoWebhook',
      }),
    });

    const body = await res.text();
    if (res.ok) {
      console.log(`[registerUmnicoWebhook] SUCCESS — status: ${res.status}, response: ${body}`);
    } else {
      console.error(`[registerUmnicoWebhook] FAILED — status: ${res.status}, response: ${body}`);
    }

    return Response.json({ status: res.status, response: body });
  } catch (error) {
    console.error('[registerUmnicoWebhook] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});