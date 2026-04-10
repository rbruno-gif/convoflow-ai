import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const { to, message } = await req.json();
  const res = await fetch('https://hooks.zapier.com/hooks/catch/10829424/u7ru89d/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: to, text: message })
  });
  const result = await res.text();
  return new Response(JSON.stringify({ ok: res.ok, result }), { status: 200 });
});