import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');

    // Get all pages from user token
    const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${PAGE_ACCESS_TOKEN}&fields=id,name,access_token,tasks`);
    const accountsData = await accountsRes.json();
    console.log('[metaPermissionTestAll] me/accounts:', JSON.stringify(accountsData));

    if (!accountsData.data) {
      return Response.json({ error: 'Could not fetch pages', debug: accountsData });
    }

    const results = [];

    for (const page of accountsData.data) {
      const pageId = page.id;
      const token = page.access_token;
      const pageName = page.name;
      const pageResult = { pageId, pageName, calls: {} };

      // pages_manage_metadata + pages_read_engagement: GET page info
      const metaRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=id,name,about,category,fan_count&access_token=${token}`);
      pageResult.calls.page_metadata = { status: metaRes.status, body: await metaRes.json() };

      // pages_messaging: GET conversations
      const convoRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/conversations?access_token=${token}&limit=1`);
      pageResult.calls.conversations = { status: convoRes.status, body: await convoRes.json() };

      // pages_messaging + pages_utility_messaging: GET messaging feature review
      const featRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/messaging_feature_review?access_token=${token}`);
      pageResult.calls.messaging_feature_review = { status: featRes.status, body: await featRes.json() };

      // pages_show_list: already done via me/accounts above

      // business_management: GET /{page-id}?fields=business
      const bizRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=id,name,business&access_token=${token}`);
      pageResult.calls.business = { status: bizRes.status, body: await bizRes.json() };

      // Subscribe page to app (pages_manage_metadata)
      const subRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribed_fields: 'messages,messaging_postbacks,message_deliveries,message_reads',
          access_token: token,
        }),
      });
      pageResult.calls.subscribed_apps = { status: subRes.status, body: await subRes.json() };

      // pages_utility_messaging: send a typing indicator (non-destructive API call)
      // We do a GET on page messaging settings
      const msgSettingsRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=messaging_feature_status&access_token=${token}`);
      pageResult.calls.messaging_settings = { status: msgSettingsRes.status, body: await msgSettingsRes.json() };

      console.log(`[metaPermissionTestAll] ${pageName} (${pageId}):`, JSON.stringify(pageResult.calls));
      results.push(pageResult);
    }

    return Response.json({ success: true, total: results.length, results });
  } catch (error) {
    console.error('[metaPermissionTestAll] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});