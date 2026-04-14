import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const TOKEN = body.user_access_token || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!TOKEN) return Response.json({ error: 'No token provided' }, { status: 500 });

    const results = {};

    // 1. instagram_basic — get linked IG accounts via FB pages
    let igAccountId = null;
    let pageAccessToken = TOKEN;
    let fbPageId = null;

    try {
      const accountsRes = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&limit=100&access_token=${TOKEN}`
      );
      const accountsData = await accountsRes.json();
      const pages = (accountsData.data || []).filter(p => p.instagram_business_account);

      results.instagram_basic = {
        success: pages.length > 0,
        ig_accounts_found: pages.length,
        accounts: pages.map(p => ({
          fb_page_id: p.id,
          fb_page_name: p.name,
          ig_id: p.instagram_business_account.id,
          ig_username: p.instagram_business_account.username,
        })),
        error: pages.length === 0 ? (accountsData.error?.message || 'No IG accounts linked to your pages') : null,
      };

      if (pages.length > 0) {
        igAccountId = pages[0].instagram_business_account.id;
        pageAccessToken = pages[0].access_token || TOKEN;
        fbPageId = pages[0].id;
      }
    } catch (e) {
      results.instagram_basic = { success: false, error: e.message };
    }

    // 2. instagram_manage_messages — fetch conversations
    try {
      const convRes = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId || 'me'}/conversations?platform=instagram&fields=id,participants&access_token=${pageAccessToken}`
      );
      const convData = await convRes.json();
      results.instagram_manage_messages = {
        success: !convData.error,
        conversations_found: convData.data?.length || 0,
        error: convData.error?.message || null,
      };
    } catch (e) {
      results.instagram_manage_messages = { success: false, error: e.message };
    }

    // 3. instagram_manage_comments — fetch recent media comments
    try {
      const mediaRes = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId || 'me'}/media?fields=id,timestamp,comments_count&limit=5&access_token=${pageAccessToken}`
      );
      const mediaData = await mediaRes.json();
      results.instagram_manage_comments = {
        success: !mediaData.error,
        media_found: mediaData.data?.length || 0,
        error: mediaData.error?.message || null,
      };
    } catch (e) {
      results.instagram_manage_comments = { success: false, error: e.message };
    }

    // 4. pages_show_list — list pages
    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category&access_token=${TOKEN}`
      );
      const pagesData = await pagesRes.json();
      results.pages_show_list = {
        success: !!pagesData.data,
        pages_count: pagesData.data?.length || 0,
        pages: (pagesData.data || []).slice(0, 5).map(p => ({ id: p.id, name: p.name, category: p.category })),
        error: pagesData.error?.message || null,
      };
    } catch (e) {
      results.pages_show_list = { success: false, error: e.message };
    }

    // 5. business_management — fetch businesses
    try {
      const bizRes = await fetch(
        `https://graph.facebook.com/v18.0/me/businesses?access_token=${TOKEN}`
      );
      const bizData = await bizRes.json();
      results.business_management = {
        success: !bizData.error,
        businesses_count: bizData.data?.length || 0,
        businesses: (bizData.data || []).map(b => ({ id: b.id, name: b.name })),
        error: bizData.error?.message || null,
      };
    } catch (e) {
      results.business_management = { success: false, error: e.message };
    }

    // 6. pages_read_engagement — fetch page engagement insights
    try {
      const engRes = await fetch(
        `https://graph.facebook.com/v18.0/${fbPageId || 'me'}/insights?metric=page_impressions&period=day&access_token=${pageAccessToken}`
      );
      const engData = await engRes.json();
      results.pages_read_engagement = {
        success: !engData.error,
        error: engData.error?.message || null,
      };
    } catch (e) {
      results.pages_read_engagement = { success: false, error: e.message };
    }

    return Response.json({ ok: true, ig_account_id: igAccountId, fb_page_id: fbPageId, results });
  } catch (error) {
    console.error('[testInstagramPermissions] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});