# Phase 3 - AI & Automation Complete ✅

## Entities (All brand-scoped with brand_id)
- **KnowledgeBase** - FAQ entries with manual/scraped/imported sources
- **ScraperSource** - URLs to scrape with status tracking
- **WidgetConfig** - Embeddable chatbot configuration per brand
- **AIAgent** - AI agent configuration with shadow/live modes
- **AgenticAction** - Autonomous action log with full step trace
- **Workflow** - Automation workflows with triggers and actions

## Module 1: Knowledge Base ✅
- **Page**: `/knowledge-base`
- Table of all entries with filters (status, source, search)
- Bulk actions: Approve All Drafts, Export CSV
- Form to add/edit entries with rich text
- Usage tracking and feedback counts

## Module 2: Website Scraper ✅
- **Page**: `/scraper`
- Add URL → Scrape Now workflow
- Status tracking: idle/scraping/completed/failed
- Real-time entry count updates
- Re-scrape with diff view (green new, gray unchanged, red removed)
- Brand-scoped: Brand A URLs never appear in Brand B KB

## Module 3: Embeddable Chatbot ✅
- **Page**: `/widget-builder`
- Split-screen: Settings (left) + Live Preview (right)
- Tabs: Appearance, Behavior, Advanced
- Real-time preview updates (light/dark mode toggle)
- Customizable: bot name, colors, position, greeting, confidence threshold
- Pre-chat form, GDPR consent, proactive messages, offline message
- Publish generates unique JS snippet

## Module 4: Agentic AI ✅
- **Page**: `/ai-agent`
- Configuration: role, tone, confidence threshold, mode (shadow/live)
- Toggle 8 tools: kb_lookup, customer_profile_lookup, ticket_creator, ticket_updater, auto_escalation, faq_gap_reporter, sentiment_monitor, internal_agent_assistant
- **Shadow Mode**: yellow background, proposed actions visible only to managers
- **Live Mode**: executes autonomously with approval gates for sensitive actions
- Mandatory shadow mode on first setup (50+ reviews at 85%+ correct to enable live)

## Module 5: AI Guidance for Agents ✅
- **Component**: `AIGuidancePanel` (right sidebar when conversation open)
- Sentiment indicator: 😤 Frustrated | 😐 Neutral | 😊 Satisfied
- Suggested reply card with Insert button
- Top 3 relevant KB articles with Send button
- Similar past conversations (clickable)
- All brand-scoped—only uses that brand's KB and history

## Module 6: Workflow Automation ✅
- **Page**: `/workflows`
- Visual canvas (drag-and-drop steps)
- 9 triggers: new_conversation, ticket_created, keyword_detected, customer_idle, sla_warning, sla_breached, agent_status_changed, conversation_resolved, tag_added
- 12 actions: send_message, assign_to_agent, assign_to_department, add_tag, remove_tag, set_priority, create_ticket, send_internal_note, send_email_notification, escalate_to_supervisor, trigger_autocalls_outbound, wait
- Test Workflow button (preview without executing)
- Templates: Welcome New Customer, SLA Breach Escalation, Idle Follow-up
- Duplicate workflow to another brand

## Acceptance Criteria ✅
- ✅ Chatbot answers using KB entries without human involvement
- ✅ Chatbot hands off to queue when confidence below threshold
- ✅ Scraper extracts Q&A pairs as draft KB entries (brand-scoped)
- ✅ Re-scrape shows diff view (new/unchanged/removed)
- ✅ Agentic AI in shadow mode proposes without executing
- ✅ Shadow mode panel shows proposed actions + correct/incorrect marking
- ✅ Live mode executes kb_lookup and ticket_creator autonomously
- ✅ Approval gates pause action and notify supervisor
- ✅ AI guidance shows suggested reply (updates on new message)
- ✅ Sentiment updates after each customer message
- ✅ Workflows fire on triggers (keyword, idle, SLA, etc)
- ✅ All KB entries have brand_id - entries never leak to other brands

## Routes Added
- `/knowledge-base` - KB management
- `/scraper` - Website scraper
- `/widget-builder` - Chatbot customization
- `/ai-agent` - Agentic AI config
- `/workflows` - Workflow automation

## Style Notes
- Widget builder: split-screen with live preview
- Agentic action log: expandable rows showing step-by-step trace
- Shadow mode: distinct yellow background (visual clarity)
- Workflow canvas: clean minimal node design
- AI guidance: subtle card styling distinct from profile panel
- Brand-scoped everywhere: no cross-brand data leaks

---
**Phases 1-3 Complete**: Platform has full multi-brand inbox, queue, business hours, SLA, agent capacity (Phase 2) + Knowledge Base, Web Scraper, Chatbot Widget, Agentic AI, AI Guidance, and Workflows (Phase 3). Ready for production deployment.