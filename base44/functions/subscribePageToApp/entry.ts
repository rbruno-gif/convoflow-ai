import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active Facebook pages
    const pages = await base44.asServiceRole.entities.FacebookPage.filter({ is_active: true });

    const results = [];
    for (const page of pages) {
      const { page_id, page_access_token, page_name } = page.data || page;
      if (!page_id || !page_access_token) continue;

      // Subscribe this page to the app (enables webhooks for this page)
      const res = await fetch(`https://graph.facebook.com/v18.0/${page_id}/subscribed_apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribed_fields: 'messages,messaging_postbacks,message_deliveries,message_reads',
          access_token: page_access_token,
        }),
      });
      const body = await res.json();
      console.log(`[subscribePageToApp] Page: ${page_name} (${page_id}), status: ${res.status}`, JSON.stringify(body));
      results.push({ page_id, page_name, status: res.status, body });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('[subscribePageToApp] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});