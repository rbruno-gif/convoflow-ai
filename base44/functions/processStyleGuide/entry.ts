import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { file_url, brand_id, current_instructions } = await req.json();
    if (!file_url) return Response.json({ error: 'Missing file_url' }, { status: 400 });

    // Extract text content from the uploaded file
    const extracted = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: 'object',
        properties: {
          raw_text: { type: 'string', description: 'All text content from the document' },
        }
      }
    });

    const docText = extracted?.output?.raw_text || extracted?.output || '';
    if (!docText || (typeof docText === 'string' && docText.length < 20)) {
      return Response.json({ error: 'Could not extract readable text from document' }, { status: 422 });
    }

    const textContent = typeof docText === 'string' ? docText : JSON.stringify(docText);

    // Use LLM to extract tone rules and merge with existing instructions
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an AI prompt engineer helping configure a customer support AI agent for a telecom brand.

A brand style guide or tone-of-voice document has been uploaded. Your job is to:
1. Identify the key tone and communication rules from the document
2. Summarize them clearly in 3-8 bullet points
3. Merge these tone rules into the existing AI system instructions to produce updated instructions

STYLE GUIDE DOCUMENT:
${textContent.slice(0, 8000)}

EXISTING AI INSTRUCTIONS:
${current_instructions || '(none - start fresh)'}

Return:
- "summary": A concise bullet-point summary of the extracted tone rules (plain text, use • for bullets)
- "merged": The complete updated AI system instructions with the tone rules integrated naturally. Keep all existing factual/product info. Add/update the tone guidance section.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          merged: { type: 'string' },
        }
      }
    });

    return Response.json({ summary: result.summary, merged: result.merged });
  } catch (error) {
    console.error('processStyleGuide error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});