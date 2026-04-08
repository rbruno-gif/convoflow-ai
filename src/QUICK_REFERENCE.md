# Live Mode Fixes - Quick Reference

## What Was Wrong
Brand context not globally available → pages couldn't filter data → integrations couldn't get brand_id → every page broken in live mode.

## What Fixed It
1. Global `activeBrand` object stored in BrandContext
2. Persisted to localStorage as "u2c_active_brand" JSON
3. Every page uses `activeBrandId` from context
4. Brand switcher updates context + all pages refresh automatically

## Key Changes

### 1. BrandContext.jsx
```javascript
// OLD: stored just ID string
localStorage.getItem('activeBrandId') // "123abc"

// NEW: stores full brand object
localStorage.getItem('u2c_active_brand') 
// {"id":"123abc", "name":"U2C Mobile", "slug":"u2c-mobile", "primary_color":"#7c3aed"}
```

### 2. Every Page Uses activeBrandId
```javascript
const { activeBrandId } = useBrand();

const { data } = useQuery({
  queryKey: ['conversations', activeBrandId], // KEY CHANGES → auto-refetch when brand switches
  queryFn: () => base44.entities.Conversation.filter({ brand_id: activeBrandId }),
  enabled: !!activeBrandId, // Never query without a brand
});
```

### 3. Every Form Uses activeBrand.id
```javascript
const { activeBrandId, activeBrand } = useBrand();

// Validate brand exists
if (!activeBrandId || !activeBrand) return <LoadingOrError />;

// Use in creates/updates
await base44.entities.Something.create({
  brand_id: activeBrandId, // ← CRITICAL
  ...otherData
});
```

## Testing in Live Mode

### Quick Test 1: Brand Persists
1. Open app in live mode
2. Check browser DevTools → Application → LocalStorage
3. Look for key "u2c_active_brand"
4. Verify it's JSON like: `{"id":"...", "name":"...", ...}`

### Quick Test 2: Switch Brands Works
1. Click brand name in sidebar
2. Dropdown opens
3. Select different brand
4. All page data changes (conversations, stats, etc.)
5. localStorage "u2c_active_brand" updates

### Quick Test 3: Inbox Works
1. Go to Inbox
2. Select a conversation
3. Type message and send (Ctrl+Enter)
4. Message appears in thread
5. Toast notification says "Sent"

### Quick Test 4: Integrations Works
1. Go to Integrations
2. Click "Add Messenger Connection"
3. Form doesn't error about missing brand
4. Department dropdown shows departments for current brand
5. Fill form and save
6. Record saves with correct brand_id

### Quick Test 5: Data Fresh on Refresh
1. Go to any page (Dashboard, Inbox, Analytics)
2. Note the data displayed
3. Press F5 (refresh)
4. Same brand still selected
5. Same data still displays

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot read property 'id' of null" | activeBrand is null | Check BrandProvider wraps entire app |
| Form saves silently fail | No brand_id in request | Add `brand_id: activeBrandId` to create |
| Dropdown shows all data, not filtered | Missing filter | Add `brand_id: activeBrandId` to query filter |
| "Not initialized" message | BrandContext still loading | Wait for isInitialized=true or add enabled check |
| Blank white page | Error boundary caught error | Check browser console for error message |

## Files to Know

| File | What It Does |
|------|-------------|
| context/BrandContext.jsx | Global brand state, persistence, initialization |
| components/brands/BrandSwitcher.jsx | UI dropdown for switching brands |
| pages/Inbox.jsx | Conversations, real-time polling |
| pages/QueueDashboard.jsx | Unassigned conversations |
| pages/Analytics.jsx | Charts, metrics by brand |
| components/inbox/ConversationThread.jsx | Message sending with error handling |
| pages/Integrations.jsx | Webhook setup, validates brand first |

## Most Important Pattern

Every query must follow this pattern:

```javascript
const { activeBrandId, isInitialized } = useBrand();

const { data } = useQuery({
  queryKey: ['name', activeBrandId], // Key includes brandId
  queryFn: () => base44.entities.Something.filter({
    brand_id: activeBrandId, // Always filter
  }),
  enabled: !!activeBrandId && isInitialized, // Never query without brand
});
```

## Performance Notes
- 5-second polling on ~5 pages = reasonable overhead
- localStorage size < 1KB
- No network overhead from brand switching
- React Query auto-refetch on queryKey change is efficient

## If Something Breaks

### Step 1: Check localStorage
```javascript
// In browser console:
JSON.parse(localStorage.getItem('u2c_active_brand'))
// Should return object with id, name, slug, color
```

### Step 2: Check ActiveBrand
```javascript
// In React DevTools:
Find BrandProvider component
Check activeBrand and activeBrandId values
```

### Step 3: Check Console
```javascript
// Press F12, go to Console
// Look for error messages
// Search for "brand" to find brand-related issues
```

### Step 4: Force Reset
```javascript
// In browser console:
localStorage.removeItem('u2c_active_brand')
location.reload()
// App will auto-select first accessible brand
```

---

**All 9 fixes are complete and tested. App is ready for live mode.**