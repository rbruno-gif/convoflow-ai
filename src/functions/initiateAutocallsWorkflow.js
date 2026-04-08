/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId, workflowType, recipientPhone, campaignData } = await req.json();

    // Fetch voice settings for the brand
    const voiceSettings = await base44.asServiceRole.entities.VoiceSettings.filter({ brand_id: brandId });
    if (voiceSettings.length === 0 || !voiceSettings[0].autocalls_api_key) {
      return Response.json({ error: 'Voice not configured for this brand' }, { status: 400 });
    }

    const settings = voiceSettings[0];

    // Check TCPA compliance for outbound
    if (workflowType !== 'inbound_receptionist' && settings.tcpa_compliance_enabled) {
      const isWithinCallingHours = checkCallingHours(settings);
      if (!isWithinCallingHours) {
        return Response.json({ error: 'Outside calling hours (TCPA compliance)' }, { status: 400 });
      }

      // Check opt-out list
      if (settings.opt_out_list?.includes(recipientPhone)) {
        return Response.json({ error: 'Customer has opted out (TCPA)' }, { status: 400 });
      }
    }

    // Get workflow configuration
    const workflows = await base44.asServiceRole.entities.VoiceWorkflow.filter({
      brand_id: brandId,
      workflow_type: workflowType,
      is_enabled: true
    });

    if (workflows.length === 0) {
      return Response.json({ error: 'Workflow not enabled' }, { status: 400 });
    }

    const workflow = workflows[0];

    // Build Autocalls API request
    const autocallsPayload = {
      api_key: settings.autocalls_api_key,
      brand_id: brandId,
      workflow_id: workflow.id,
      call_type: workflowType,
      recipient_phone: recipientPhone,
      ai_agent_name: settings.ai_agent_name || 'Assistant',
      voice_style: settings.ai_voice_style || 'professional',
      language: settings.ai_language || 'en-US',
      ai_instructions: workflow.ai_instructions || settings.ai_instructions || '',
      max_retries: 2,
      fallback_action: workflow.fallback_action || 'transfer_to_agent',
      webhook_url: settings.webhook_url,
      campaign_id: campaignData?.campaign_id,
      custom_data: {
        workflow_type: workflowType,
        ...campaignData
      }
    };

    // Call Autocalls API
    const autocallsResponse = await fetch('https://api.autocalls.ai/v1/calls/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.autocalls_api_key}`
      },
      body: JSON.stringify(autocallsPayload)
    });

    if (!autocallsResponse.ok) {
      const errorData = await autocallsResponse.json();
      console.error('Autocalls API error:', errorData);
      return Response.json({ error: 'Failed to initiate call', details: errorData }, { status: 500 });
    }

    const autocallsResult = await autocallsResponse.json();

    // Log the call initiation
    const callLog = await base44.asServiceRole.entities.VoiceCallLog.create({
      brand_id: brandId,
      workflow_id: workflow.id,
      customer_phone: recipientPhone,
      call_direction: 'outbound',
      call_status: 'pending',
      autocalls_id: autocallsResult.call_id,
      campaign_id: campaignData?.campaign_id
    });

    return Response.json({
      success: true,
      call_id: autocallsResult.call_id,
      call_log_id: callLog.id,
      status: 'pending'
    }, { status: 200 });
  } catch (error) {
    console.error('Workflow initiation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function checkCallingHours(settings) {
  const now = new Date();
  const hour = now.getHours();
  const start = parseInt(settings.calling_hours_start?.split(':')[0] || '9');
  const end = parseInt(settings.calling_hours_end?.split(':')[0] || '21');
  return hour >= start && hour < end;
}