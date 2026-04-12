import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const pages = await base44.asServiceRole.entities.FacebookPage.filter({ is_active: true });

    if (!pages || pages.length === 0) {
      return Response.json({ error: 'No active Facebook pages found' }, { status: 400 });
    }

    const page = pages[0];
    const pageId = page.page_id;
    const token = page.page_access_token;

    const results = {};

    // pages_read_engagement + pages_show_list — GET /me/accounts
    const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
    results.me_accounts = { status: accountsRes.status, body: await accountsRes.json() };

    // pages_manage_metadata — GET /{page-id}?fields=id,name,about
    const metaRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=id,name,about,category&access_token=${token}`);
    results.page_metadata = { status: metaRes.status, body: await metaRes.json() };

    // pages_read_engagement — GET /{page-id}/feed
    const feedRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed?access_token=${token}&limit=1`);
    results.page_feed = { status: feedRes.status, body: await feedRes.json() };

    // pages_messaging — POST a test message (send to self via test PSID won't work in sandbox, but the API call counts)
    // Instead we read conversations which uses pages_messaging
    const convoRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/conversations?access_token=${token}&limit=1`);
    results.conversations = { status: convoRes.status, body: await convoRes.json() };

    // pages_utility_messaging — GET /{page-id}/messaging_feature_review
    const utilRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/messaging_feature_review?access_token=${token}`);
    results.messaging_feature_review = { status: utilRes.status, body: await utilRes.json() };

    // business_management — GET /me?fields=id,name
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${token}`);
    results.me = { status: meRes.status, body: await meRes.json() };

    // public_profile
    const profileRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${token}`);
    results.public_profile = { status: profileRes.status, body: await profileRes.json() };

    // Subscribe page to app (pages_manage_metadata)
    const subRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: 'messages,messaging_postbacks,message_deliveries,message_reads,messaging_optins',
        access_token: token,
      }),
    });
    results.subscribed_apps = { status: subRes.status, body: await subRes.json() };

    console.log('[metaPermissionTest] Results:', JSON.stringify(results, null, 2));

    return Response.json({ success: true, pageId, results });
  } catch (error) {
    console.error('[metaPermissionTest] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});