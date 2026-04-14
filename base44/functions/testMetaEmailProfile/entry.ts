import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// This function tests the 'email' and 'public_profile' permissions
// by calling the Graph API /me endpoint with those fields.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const USER_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!USER_TOKEN) return Response.json({ error: 'FACEBOOK_PAGE_ACCESS_TOKEN not set' }, { status: 500 });

    const results = {};

    // Test public_profile permission
    try {
      const profileRes = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,first_name,last_name,picture&access_token=${USER_TOKEN}`
      );
      const profileData = await profileRes.json();
      results.public_profile = {
        success: !profileData.error,
        data: profileData.error ? null : {
          id: profileData.id,
          name: profileData.name,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          has_picture: !!profileData.picture,
        },
        error: profileData.error?.message || null,
      };
    } catch (e) {
      results.public_profile = { success: false, error: e.message };
    }

    // Test email permission
    try {
      const emailRes = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${USER_TOKEN}`
      );
      const emailData = await emailRes.json();
      results.email = {
        success: !emailData.error,
        data: emailData.error ? null : {
          id: emailData.id,
          name: emailData.name,
          email: emailData.email || '(not returned — user may not have granted email)',
        },
        error: emailData.error?.message || null,
      };
    } catch (e) {
      results.email = { success: false, error: e.message };
    }

    // Also fetch pages to make additional profile-related calls
    try {
      const accountsRes = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,fan_count&access_token=${USER_TOKEN}`
      );
      const accountsData = await accountsRes.json();
      results.pages_profiles = {
        success: !!accountsData.data,
        pages_count: accountsData.data?.length || 0,
        pages: (accountsData.data || []).map(p => ({ id: p.id, name: p.name, category: p.category })),
      };
    } catch (e) {
      results.pages_profiles = { success: false, error: e.message };
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    console.error('[testMetaEmailProfile] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});