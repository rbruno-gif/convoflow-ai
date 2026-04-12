import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const USER_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!USER_TOKEN) return Response.json({ error: 'Token not set' }, { status: 500 });

    const results = {};

    // Get user info (email, public_profile)
    try {
      const meRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${USER_TOKEN}`);
      results.user_info = await meRes.json();
    } catch (e) {
      results.user_info = { error: e.message };
    }

    // Get pages (pages_show_list)
    try {
      const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${USER_TOKEN}`);
      const accountsData = await accountsRes.json();
      results.pages_show_list = { 
        success: !!accountsData.data,
        pages_count: accountsData.data?.length || 0,
        pages: accountsData.data?.map(p => ({ id: p.id, name: p.name })) || []
      };

      // If we have pages, test messaging permissions
      if (accountsData.data && accountsData.data.length > 0) {
        const pageId = accountsData.data[0].id;
        const pageToken = accountsData.data[0].access_token;

        // Test pages_messaging
        try {
          const msgRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: '123456789' },
              message: { text: 'permission test' },
              access_token: pageToken,
            }),
          });
          const msgData = await msgRes.json();
          results.pages_messaging = { 
            status: msgRes.status,
            success: !msgData.error || msgData.error.code === 100, // 100 = invalid user
            message: msgData.error?.message || 'Test message sent'
          };
        } catch (e) {
          results.pages_messaging = { error: e.message };
        }

        // Test pages_utility_messaging
        try {
          const utilRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: '123456789' },
              message: { text: 'utility test' },
              messaging_type: 'MESSAGE_TAG',
              tag: 'ACCOUNT_UPDATE',
              access_token: pageToken,
            }),
          });
          const utilData = await utilRes.json();
          results.pages_utility_messaging = {
            status: utilRes.status,
            success: !utilData.error || utilData.error.code === 100,
            message: utilData.error?.message || 'Utility message test passed'
          };
        } catch (e) {
          results.pages_utility_messaging = { error: e.message };
        }

        // Test pages_manage_metadata
        try {
          const metaRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/subscribed_apps?access_token=${pageToken}`);
          const metaData = await metaRes.json();
          results.pages_manage_metadata = {
            status: metaRes.status,
            success: !!metaData.data,
            message: 'Metadata access test passed'
          };
        } catch (e) {
          results.pages_manage_metadata = { error: e.message };
        }
      }
    } catch (e) {
      results.pages_show_list = { error: e.message };
    }

    // Test business_management
    try {
      const bizRes = await fetch(`https://graph.facebook.com/v18.0/me/businesses?access_token=${USER_TOKEN}`);
      const bizData = await bizRes.json();
      results.business_management = {
        success: !!bizData.data,
        businesses_count: bizData.data?.length || 0
      };
    } catch (e) {
      results.business_management = { error: e.message };
    }

    return Response.json(results);
  } catch (error) {
    console.error('[testFacebookPermissions] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});