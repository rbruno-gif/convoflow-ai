import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { url, brand_id, scraped_url_id } = await req.json();
    if (!url || !brand_id) return Response.json({ error: 'Missing url or brand_id' }, { status: 400 });

    // Mark as scraping
    if (scraped_url_id) {
      await base44.asServiceRole.entities.ScrapedURL.update(scraped_url_id, { status: 'scraping' });
    }

    // Fetch the page content
    let pageText = '';
    try {
      console.log(`[Scraper] Starting fetch: ${url}`);

      // Browser-like headers to avoid being blocked
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      };

      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(20000), // 20s timeout
        redirect: 'follow'
      });

      console.log(`[Scraper] HTTP ${res.status} from ${url}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const html = await res.text();
      console.log(`[Scraper] Downloaded ${html.length} bytes from ${url}`);
      // Strip HTML tags, scripts, styles
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 12000); // Limit context
    } catch (fetchErr) {
      if (scraped_url_id) {
        await base44.asServiceRole.entities.ScrapedURL.update(scraped_url_id, {
          status: 'error',
          error_message: `Could not fetch URL: ${fetchErr.message}`
        });
      }
      return Response.json({ error: `Could not fetch URL: ${fetchErr.message}` }, { status: 422 });
    }

    if (!pageText || pageText.length < 50) {
      if (scraped_url_id) {
        await base44.asServiceRole.entities.ScrapedURL.update(scraped_url_id, {
          status: 'error',
          error_message: 'Page returned no readable content'
        });
      }
      return Response.json({ error: 'Page returned no readable content' }, { status: 422 });
    }

    // Use AI to extract Q&A pairs
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a knowledge base builder for a telecom company. Extract all useful question-and-answer pairs from the following webpage content. Focus on FAQs, plans, pricing, features, support topics, and policies. Each Q&A should be self-contained and helpful.

Return a JSON object with a "faqs" array. Each item should have:
- "question": a clear, natural question a customer might ask
- "answer": a complete, accurate answer based on the page content
- "category": one of: "plans", "billing", "activation", "technical_support", "shipping", "returns", "general", "products"

Extract as many useful pairs as possible (aim for 5-20). Only include information that is actually present on the page.

PAGE CONTENT:
${pageText}`,
      response_json_schema: {
        type: 'object',
        properties: {
          faqs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                answer: { type: 'string' },
                category: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const faqs = result?.faqs || [];

    // Save each FAQ as a pending entry (status = pending review)
    const created = [];
    for (const faq of faqs) {
      if (faq.question && faq.answer) {
        const record = await base44.asServiceRole.entities.FAQ.create({
          brand_id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category || 'general',
          is_active: false, // pending review
          source_url: url,
          keywords: [],
          usage_count: 0,
        });
        created.push(record);
      }
    }

    // Update scraped URL record
    if (scraped_url_id) {
      await base44.asServiceRole.entities.ScrapedURL.update(scraped_url_id, {
        status: 'done',
        last_scraped_at: new Date().toISOString(),
        faqs_extracted: created.length,
        error_message: ''
      });
    }

    return Response.json({ success: true, faqs_extracted: created.length, faqs: created });
  } catch (error) {
    console.error('scrapeWebsite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});