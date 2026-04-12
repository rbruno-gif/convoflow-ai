import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!PAGE_ACCESS_TOKEN) return Response.json({ error: 'FACEBOOK_PAGE_ACCESS_TOKEN not set' }, { status: 500 });

    // Try /me/accounts (works for User Access Tokens)
    const res = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${PAGE_ACCESS_TOKEN}&fields=id,name,access_token`);
    const data = await res.json();

    if (res.ok && data.data && data.data.length > 0) {
      return Response.json({ pages: data.data });
    }

    // Fallback: token might be a Page Access Token — get page info directly via /me
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${PAGE_ACCESS_TOKEN}&fields=id,name`);
    const meData = await meRes.json();

    if (meRes.ok && meData.id) {
      return Response.json({ pages: [{ id: meData.id, name: meData.name, access_token: PAGE_ACCESS_TOKEN }] });
    }

    return Response.json({ pages: [], debug: data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});