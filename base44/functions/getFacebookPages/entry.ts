import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!PAGE_ACCESS_TOKEN) return Response.json({ error: 'FACEBOOK_PAGE_ACCESS_TOKEN not set' }, { status: 500 });

    // Fetch the list of pages this token has access to
    const res = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${PAGE_ACCESS_TOKEN}&fields=id,name,access_token`);
    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.error?.message || 'Facebook API error' }, { status: 400 });
    }

    return Response.json({ pages: data.data || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});