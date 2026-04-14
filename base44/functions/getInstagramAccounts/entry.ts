import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Fetches Facebook Pages and their linked Instagram Business Accounts
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const USER_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!USER_TOKEN) return Response.json({ error: 'FACEBOOK_PAGE_ACCESS_TOKEN not set' }, { status: 500 });

    // Get all pages with their Instagram business accounts
    const accountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&limit=100&access_token=${USER_TOKEN}`
    );
    const accountsData = await accountsRes.json();

    if (!accountsData.data) {
      return Response.json({ accounts: [], error: accountsData.error?.message });
    }

    // Filter only pages that have an Instagram Business Account linked
    const igAccounts = accountsData.data
      .filter(p => p.instagram_business_account)
      .map(p => ({
        fb_page_id: p.id,
        fb_page_name: p.name,
        page_access_token: p.access_token,
        ig_account_id: p.instagram_business_account.id,
        ig_username: p.instagram_business_account.username || p.instagram_business_account.name,
        profile_picture_url: p.instagram_business_account.profile_picture_url,
      }));

    return Response.json({ accounts: igAccounts });
  } catch (error) {
    console.error('[getInstagramAccounts] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});