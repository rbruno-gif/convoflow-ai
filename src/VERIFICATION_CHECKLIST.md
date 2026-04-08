# Brand Context Implementation - Verification Checklist

Use this checklist to verify the fix works correctly in your environment.

## Initial Setup ✓
- [x] BrandContext provides global activeBrand state
- [x] BrandProvider wraps the entire app
- [x] useBrand() hook is available to all components
- [x] localStorage is used for persistence

## Part 1: Brand Initialization

### Test: Default Brand Selection
- [ ] Start the app fresh (or clear localStorage)
- [ ] Confirm a brand is selected by default
- [ ] Confirm sidebar shows that brand's name
- [ ] Open DevTools → Application → LocalStorage
- [ ] Confirm key `activeBrandId` exists with a UUID value

**Expected Result**: One brand is selected, localStorage contains its ID

### Test: Multiple Accessible Brands
- [ ] Log in with an admin account
- [ ] Confirm multiple brands appear in the switcher dropdown
- [ ] Regular user account should see fewer brands
- [ ] Admin account should see all brands

**Expected Result**: Brand list matches user's role and assignments

## Part 2: Brand Switcher Functionality

### Test: Dropdown Opens/Closes
- [ ] Click on the brand name in sidebar (the button with dropdown arrow)
- [ ] Dropdown opens with animation
- [ ] Click outside dropdown
- [ ] Dropdown closes
- [ ] Click brand name again
- [ ] Dropdown opens again

**Expected Result**: Dropdown opens on click, closes on outside click or selection

### Test: Selecting a Brand
- [ ] Open brand switcher dropdown
- [ ] Click on a different brand
- [ ] Dropdown closes immediately
- [ ] Sidebar header updates to show new brand name
- [ ] Wait 1-2 seconds for data to load

**Expected Result**: Brand changes, UI updates, data refreshes

### Test: Visual Feedback
- [ ] Open dropdown
- [ ] Current active brand shows a checkmark (✓)
- [ ] Other brands don't show checkmark
- [ ] Hover over a brand
- [ ] Hover effect appears

**Expected Result**: Clear visual indication of active brand

## Part 3: localStorage Persistence

### Test: Persistence Across Refresh
- [ ] Select Brand B in the switcher
- [ ] Open DevTools → Application → LocalStorage
- [ ] Confirm `activeBrandId` is set to Brand B's ID
- [ ] Press F5 to refresh the page
- [ ] Confirm Brand B is still selected
- [ ] Confirm all data shows Brand B

**Expected Result**: Brand selection survives page refresh

### Test: Persistence Across Sessions
- [ ] Select Brand C
- [ ] Close the browser completely
- [ ] Reopen the app
- [ ] Confirm Brand C is selected

**Expected Result**: Brand choice persists across sessions

### Test: Invalid Brand Removal
- [ ] Select Brand A
- [ ] Manually edit localStorage to set invalid brand ID
- [ ] Refresh page
- [ ] Confirm valid first brand is selected instead
- [ ] Confirm no errors in console

**Expected Result**: App handles invalid brand gracefully

## Part 4: Cross-App Data Scoping

### Test: Dashboard Data Changes
- [ ] Go to Dashboard
- [ ] Note the stats (total conversations, AI rate, etc.)
- [ ] Switch to different brand
- [ ] Wait for data to load
- [ ] Confirm stats changed for new brand
- [ ] Switch back to original brand
- [ ] Confirm stats match original values

**Expected Result**: Dashboard shows correct data for each brand

### Test: Inbox Data Changes
- [ ] Go to Inbox
- [ ] Note the conversations list
- [ ] Switch to different brand
- [ ] Confirm conversation list changed
- [ ] All conversations belong to new brand

**Expected Result**: Inbox filters conversations by brand

### Test: Analytics Data Changes
- [ ] Go to Analytics
- [ ] Note metric values
- [ ] Switch to different brand
- [ ] Confirm metrics changed
- [ ] Compare with a few more brands

**Expected Result**: Analytics shows metrics for selected brand only

### Test: Queue Data Changes
- [ ] Go to Queue
- [ ] Note departments and queue sizes
- [ ] Switch to different brand
- [ ] Confirm departments changed
- [ ] Confirm queue data is for new brand

**Expected Result**: Queue shows data for selected brand

## Part 5: Integrations Form

### Test: Facebook Messenger Webhook
- [ ] Go to Integrations
- [ ] Confirm page header shows current brand name
- [ ] Click "Add Facebook Messenger Connection"
- [ ] Dialog opens
- [ ] Confirm dialog doesn't show error about missing brand
- [ ] Department dropdown loads departments
- [ ] Confirm departments are for current brand (not all brands)
- [ ] Fill in form with test data
- [ ] Create webhook
- [ ] Confirm webhook is created with correct brand_id

**Expected Result**: Form works without errors, webhook saves correct brand_id

### Test: Webhook Form with Brand Switch
- [ ] Open "Add Messenger Connection" dialog
- [ ] Note the departments shown
- [ ] Close dialog (or stay in it if you're brave)
- [ ] Switch to different brand
- [ ] Open "Add Messenger Connection" dialog again
- [ ] Confirm departments changed for new brand

**Expected Result**: Department dropdown reflects current brand selection

## Part 6: Admin Features

### Test: Brand Selector Grid
- [ ] Log in as admin
- [ ] Go to Dashboard
- [ ] Scroll down
- [ ] Confirm "Switch Brand" grid appears (shows brand cards)
- [ ] Log out and log back in as regular agent
- [ ] Go to Dashboard
- [ ] Confirm "Switch Brand" grid does NOT appear

**Expected Result**: Brand grid only visible to admin users

### Test: Brand Grid Switching
- [ ] As admin, go to Dashboard
- [ ] Find the brand grid
- [ ] Click on a brand card
- [ ] Confirm brand switches
- [ ] Confirm card shows a checkmark for active brand
- [ ] Click another brand
- [ ] Confirm it becomes active

**Expected Result**: Brand cards are clickable and switch brands

## Part 7: Layout/Sidebar

### Test: Sidebar Brand Name
- [ ] Check sidebar header
- [ ] Confirm it shows current brand name
- [ ] Switch brands
- [ ] Confirm sidebar header updates
- [ ] Sidebar should show the new brand name

**Expected Result**: Sidebar always shows active brand name

### Test: Brand Status Indicator
- [ ] Check sidebar switcher
- [ ] Confirm colored dot next to brand name
- [ ] Green dot = active brand
- [ ] Gray dot = inactive brand
- [ ] Switch to inactive brand (if you have one)
- [ ] Confirm dot color changes to gray

**Expected Result**: Status indicator reflects brand's active status

## Part 8: Mobile Responsiveness

### Test: Mobile Viewport
- [ ] Open DevTools
- [ ] Switch to mobile view (iPhone size)
- [ ] Confirm sidebar is visible
- [ ] Click brand name
- [ ] Confirm dropdown opens
- [ ] Confirm dropdown fits on screen
- [ ] Select a brand
- [ ] Confirm data updates on mobile view

**Expected Result**: Brand switching works on mobile devices

## Part 9: Live Mode / Published App

### Test: Published App
- [ ] Publish the app
- [ ] Open the live/published URL
- [ ] Confirm brand switcher is visible
- [ ] Click brand name
- [ ] Confirm dropdown opens
- [ ] Select different brand
- [ ] Confirm data changes
- [ ] Refresh page (F5)
- [ ] Confirm brand selection persists in live mode

**Expected Result**: All features work identically in live/published mode

## Part 10: Error Handling

### Test: Missing Brand Context
- [ ] Open browser console
- [ ] Look for any errors about "useBrand must be used within BrandProvider"
- [ ] Check that no critical errors appear

**Expected Result**: No context-related errors in console

### Test: Database Issues
- [ ] If no departments exist for a brand:
  - [ ] Integrations form should show helpful message
  - [ ] No cryptic errors should appear

**Expected Result**: App handles missing data gracefully

### Test: Slow Network
- [ ] Open DevTools → Network → Slow 3G
- [ ] Switch brands
- [ ] Confirm "Loading..." state appears if needed
- [ ] Confirm data eventually loads
- [ ] No crashes or errors

**Expected Result**: App handles slow network gracefully

## Part 11: Specific User Scenarios

### Scenario 1: Agent with Single Brand
- [ ] Log in as agent with access to 1 brand
- [ ] Confirm that brand is selected
- [ ] Check localStorage
- [ ] Confirm brand ID is saved
- [ ] Confirm no brand switcher issues

**Expected Result**: Single-brand agents work fine

### Scenario 2: Admin with All Brands
- [ ] Log in as admin with access to all brands
- [ ] Confirm all brands appear in switcher
- [ ] Confirm brand grid appears on Dashboard
- [ ] Switch between several brands
- [ ] Confirm data changes each time

**Expected Result**: Admin can switch between all brands smoothly

### Scenario 3: Agent Reassigned
- [ ] Have a test user assigned to Brand A
- [ ] Reassign user to Brand B
- [ ] User logs out and back in
- [ ] Confirm Brand B is selected (not Brand A)
- [ ] Confirm old brand no longer appears in switcher

**Expected Result**: Brand assignment changes work correctly

## Final Verification

Run this complete checklist:

```javascript
// In browser console, check:
console.log('ActiveBrandId:', localStorage.getItem('activeBrandId'));
console.log('ActiveBrand should be stored above');

// Confirm context is available
import { useBrand } from '@/context/BrandContext'; // Should work
const { activeBrand, activeBrandId } = useBrand(); // Should work
```

## Sign-Off

- [ ] All sections completed successfully
- [ ] No console errors
- [ ] No data inconsistencies
- [ ] Brand switching works in preview
- [ ] Brand switching works in live mode
- [ ] localStorage persists selections
- [ ] Admin features work
- [ ] Regular agent features work
- [ ] Mobile responsive
- [ ] Ready for production deployment

**Verified by**: ________________  
**Date**: ________________  
**Notes**: ________________________________________________

---

## Rollback Plan

If issues occur:

1. **Revert BrandContext.jsx** - go back to previous version
2. **Clear localStorage** - remove 'activeBrandId' key
3. **Hard refresh browser** - Ctrl+Shift+R or Cmd+Shift+R
4. **Check browser cache** - may need to clear browser cache

The changes are non-breaking, so reverting should restore functionality immediately.