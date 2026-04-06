# Multi-Tenant SaaS AI Support Platform Architecture

## Overview

This is a production-ready multi-tenant support platform built on Base44 where each company has complete isolation of:
- Company profile & settings
- Conversations & messages
- Knowledge base & FAQs
- Leads & customers
- Support tickets
- Team members & permissions
- Analytics & reporting

## Core Principles

### Tenant Isolation
Every entity includes a `company_id` field that ensures:
- Users can only access data from their assigned company
- Database queries always filter by `company_id`
- Backend functions verify tenant access before processing

### Role-Based Access Control
Three user roles with different permissions:

1. **Super Admin** (`user.role === 'admin'`)
   - Manage all companies
   - View platform analytics
   - Manage billing & subscriptions
   - Access super-admin dashboard

2. **Company Admin** (`CompanyAgent.role === 'admin'`)
   - Full control of their company's chatbot
   - Manage team members
   - View analytics for their company
   - Configure AI settings & knowledge base

3. **Support Agent** (`CompanyAgent.role === 'agent'`)
   - View assigned conversations
   - Respond to customers
   - Take over from AI
   - Create & update tickets

## Data Model

### Core Entities

```
Company (tenants)
├── CompanySettings (configuration)
├── CompanyAgent (team members)
├── CompanyConversation (customer chats)
│   └── CompanyMessage (individual messages)
├── CompanyKnowledgeBase (FAQs & documentation)
├── CompanyLead (captured leads)
├── CompanyTicket (escalated support issues)
└── CompanyAnalytics (metrics & reporting)
```

### Key Design Patterns

1. **Company ID as Tenant Key**
   - Every record stores `company_id`
   - All queries filter by `company_id`
   - Prevents data leakage across tenants

2. **User Assignment to Companies**
   - Users are linked to companies via `CompanyAgent`
   - Email uniquely identifies a user
   - Role defines permissions within each company

3. **Audit Trail**
   - `created_date` and `updated_date` auto-populated by Base44
   - `created_by` stores email of creator

## Application Flow

### 1. Authentication → Tenant Selection
```
User Login → AuthProvider
          → TenantContext (fetches user's companies)
          → Select default company
          → Check user's role in that company
```

### 2. Company Onboarding
```
Super Admin → OnboardingModal
           → Create Company record
           → Create CompanySettings
           → Add owner as CompanyAgent (admin)
           → Generate widget embed code
```

### 3. AI Conversation Flow
```
Customer message → multiTenantAIResponse() function
               → Verify company access
               → Fetch company knowledge base
               → Fetch conversation history
               → Call LLM with company context
               → Save message + update conversation
               → (Optional) Trigger lead qualification
               → (Optional) Auto-escalate if needed
```

### 4. Lead Qualification
```
Conversation → analyzeLeadQualification() function
           → Analyze customer intent
           → Extract contact info
           → Create CompanyLead record
           → Tag with urgency/interest
```

### 5. Escalation to Ticket
```
AI can't resolve → escalateToTicket() function
               → Summarize conversation
               → Create CompanyTicket
               → Set priority & category
               → Notify assigned agent
               → Update conversation status
```

## Context Providers

### TenantContext (`lib/TenantContext.jsx`)
Manages:
- Current company selection
- User's assigned companies
- User role in current company
- Helper methods: `isSuperAdmin()`, `isCompanyAdmin()`, `isAgent()`

```javascript
const { currentCompany, userRole, companies, switchCompany } = useTenant();
```

### TenantRoute (`lib/TenantRoute.jsx`)
Protects routes and enforces RBAC:
```javascript
<TenantRoute requiredRole="admin">
  <AdminOnlyPage />
</TenantRoute>
```

### useTenantData Hook (`hooks/useTenantData.js`)
Automatically adds `company_id` to all queries:
```javascript
const { data: conversations } = useTenantData('CompanyConversation');
// Automatically filters by currentCompany.id
```

## Backend Functions (Agentic AI)

### multiTenantAIResponse()
- Handles customer messages
- Uses company-specific knowledge base
- Applies company tone & instructions
- Ensures responses stay within company context
- **Tenant Check**: Verifies user access to company

### analyzeLeadQualification()
- Evaluates if conversation is a sales opportunity
- Extracts customer interest & urgency
- Creates lead records with confidence scores
- **Tenant Check**: Ensures lead belongs to correct company

### escalateToTicket()
- Creates support tickets from unresolved conversations
- Auto-categorizes based on issue type
- Adds conversation transcript
- Routes to available agents
- **Tenant Check**: Prevents cross-company escalations

## Layout & Navigation

### CompanyAdminLayout (`components/CompanyAdminLayout.jsx`)
Main dashboard layout with:
- Sidebar navigation (dynamic based on role)
- Company switcher dropdown (if user has multiple companies)
- Top bar with user info
- Logout button
- Responsive collapse

### Routes Structure
```
/                          → CompanyAdminDashboard
/conversations             → Conversations (filtered by company)
/leads                     → Leads (filtered by company)
/tickets                   → Tickets (filtered by company)
/knowledge                 → Knowledge Base (company-specific)
/faqs                      → FAQs (company-specific)
/analytics                 → Analytics (company-specific)
/agents                    → Team Management (admin only)
/settings                  → AI Settings (admin only)
/widget                    → Widget Customizer (admin only)

/super-admin/...           → Super Admin Dashboard (super admin only)
```

## Security Checklist

- [x] Tenant isolation: Every query filters by `company_id`
- [x] Role verification: Backend functions check `CompanyAgent` table
- [x] Auth enforcement: `TenantRoute` wraps protected pages
- [x] Data ownership: Users can only access assigned companies
- [x] Function access: Backend functions verify user email + company_id
- [x] RBAC: Different features visible based on user.role

## Widget Embed Flow

Each company gets a unique embed script:

```html
<script>
  window.__COMPANY_WIDGET_CONFIG__ = {
    companyId: "...",
    apiEndpoint: "...",
    colors: { primary: "...", secondary: "..." }
  };
</script>
<script src="https://app.com/widget.js"></script>
```

The widget:
1. Stores `companyId` in localStorage
2. All API calls include `company_id`
3. Backend verifies ownership before responding
4. Chat data stored under that company's ID

## Analytics & Reporting

Each company sees:
- Conversations (active, resolved, escalated)
- AI resolution rate
- Lead capture metrics
- Agent performance
- Common questions & gaps

Super admin sees:
- Cross-company metrics
- Platform usage trends
- Company health scores
- Revenue tracking

## Scaling Considerations

1. **Database Indexing**: Add indexes on:
   - `company_id` (for filtering)
   - `(company_id, status)` (for status queries)
   - `(company_id, created_date)` (for time-based queries)

2. **Caching**: Cache company settings & knowledge base per company

3. **Rate Limiting**: Per-company rate limits on API calls

4. **Data Retention**: Configurable retention policies per company/plan

## Future Enhancements

- [ ] Multi-company message templates
- [ ] AI model selection per company
- [ ] Custom integrations per company
- [ ] Webhook notifications
- [ ] API for external tools
- [ ] Advanced reporting & BI
- [ ] Custom branding packages