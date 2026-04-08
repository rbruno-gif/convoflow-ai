import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, brandId, payload } = await req.json();

    // Fetch brand settings
    const settingsList = await base44.asServiceRole.entities.AutocallsSettings.filter({ brand_id: brandId });
    if (settingsList.length === 0) {
      return Response.json({ error: 'Autocalls not configured for this brand' }, { status: 400 });
    }

    const settings = settingsList[0];
    const apiKey = settings.api_key;

    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 400 });
    }

    const autocallsBaseUrl = 'https://api.autocalls.ai/v1';
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    let response;

    // Outbound callback call
    if (action === 'initiate_callback') {
      const { customer_phone, callback_message } = payload;
      response = await fetch(`${autocallsBaseUrl}/calls/outbound`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone_number: customer_phone,
          agent_name: settings.ai_agent_name,
          voice_style: settings.voice_style,
          language: settings.language,
          script: callback_message || `Hello! You requested a callback from ${settings.ai_agent_name}. How can we help you today?`,
          metadata: {
            brand_id: brandId,
            call_type: 'outbound_callback',
          },
        }),
      });
    }
    // Campaign call
    else if (action === 'initiate_campaign_calls') {
      const { customer_phones, campaign_script } = payload;
      response = await fetch(`${autocallsBaseUrl}/campaigns`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone_numbers: customer_phones,
          agent_name: settings.ai_agent_name,
          voice_style: settings.voice_style,
          language: settings.language,
          script: campaign_script,
          metadata: {
            brand_id: brandId,
            call_type: 'outbound_campaign',
          },
        }),
      });
    }
    // Follow-up call
    else if (action === 'initiate_followup_call') {
      const { customer_phone, previous_issue } = payload;
      response = await fetch(`${autocallsBaseUrl}/calls/outbound`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone_number: customer_phone,
          agent_name: settings.ai_agent_name,
          voice_style: settings.voice_style,
          language: settings.language,
          script: `Hi! I'm following up from ${settings.ai_agent_name}. We previously helped you with: ${previous_issue || 'your support request'}. Is everything working perfectly now?`,
          metadata: {
            brand_id: brandId,
            call_type: 'outbound_followup',
          },
        }),
      });
    }
    // Get call status
    else if (action === 'get_call_status') {
      const { call_id } = payload;
      response = await fetch(`${autocallsBaseUrl}/calls/${call_id}`, {
        method: 'GET',
        headers,
      });
    }
    else {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ error: result.message || 'Autocalls API error' }, { status: response.status });
    }

    return Response.json(result);
  } catch (error) {
    console.error('callAutocallsAPI error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});