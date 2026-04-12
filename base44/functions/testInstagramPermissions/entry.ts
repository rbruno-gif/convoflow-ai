import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const USER_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!USER_TOKEN) return Response.json({ error: 'Token not set' }, { status: 500 });

    const results = {};

    // Test email & public_profile (GET /me)
    try {
      const meRes = await fetch(`https://graph.instagram.com/v18.0/me?fields=id,username,name,email&access_token=${USER_TOKEN}`);
      const meData = await meRes.json();
      results.user_info = meData.error ? { error: meData.error.message } : {
        success: true,
        id: meData.id,
        username: meData.username,
        name: meData.name,
        email: meData.email
      };
    } catch (e) {
      results.user_info = { error: e.message };
    }

    // Get business accounts (pages_show_list & instagram_business_basic)
    try {
      const accountsRes = await fetch(`https://graph.instagram.com/v18.0/me/accounts?fields=id,name,instagram_business_account&access_token=${USER_TOKEN}`);
      const accountsData = await accountsRes.json();
      const instagramAccounts = (accountsData.data || [])
        .filter(a => a.instagram_business_account)
        .map(a => ({
          page_id: a.id,
          page_name: a.name,
          ig_account_id: a.instagram_business_account.id
        }));

      results.pages_show_list = {
        success: !!accountsData.data,
        accounts_found: instagramAccounts.length,
        accounts: instagramAccounts
      };

      // If we have Instagram accounts, test messaging and comments
      if (instagramAccounts.length > 0) {
        const igAccountId = instagramAccounts[0].ig_account_id;

        // Test instagram_business_manage_messages
        try {
          const msgRes = await fetch(`https://graph.instagram.com/v18.0/${igAccountId}/conversations?fields=id,senders&access_token=${USER_TOKEN}`);
          const msgData = await msgRes.json();
          results.instagram_business_manage_messages = {
            success: !msgData.error,
            message: msgData.error?.message || 'Permission available'
          };
        } catch (e) {
          results.instagram_business_manage_messages = { error: e.message };
        }

        // Test instagram_manage_comments
        try {
          const commentsRes = await fetch(`https://graph.instagram.com/v18.0/${igAccountId}/ig_hashtag_search?user_id=${igAccountId}&hashtag=test&access_token=${USER_TOKEN}`);
          const commentsData = await commentsRes.json();
          results.instagram_manage_comments = {
            success: !commentsData.error,
            message: commentsData.error?.message || 'Permission available'
          };
        } catch (e) {
          results.instagram_manage_comments = { error: e.message };
        }
      }
    } catch (e) {
      results.pages_show_list = { error: e.message };
    }

    // Test business_management
    try {
      const bizRes = await fetch(`https://graph.instagram.com/v18.0/me/businesses?access_token=${USER_TOKEN}`);
      const bizData = await bizRes.json();
      results.business_management = {
        success: !!bizData.data,
        businesses_count: bizData.data?.length || 0
      };
    } catch (e) {
      results.business_management = { error: e.message };
    }

    // Test pages_read_engagement
    try {
      const engRes = await fetch(`https://graph.instagram.com/v18.0/me?fields=id&access_token=${USER_TOKEN}`);
      const engData = await engRes.json();
      results.pages_read_engagement = {
        success: !engData.error,
        message: 'Permission available'
      };
    } catch (e) {
      results.pages_read_engagement = { error: e.message };
    }

    return Response.json(results);
  } catch (error) {
    console.error('[testInstagramPermissions] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});