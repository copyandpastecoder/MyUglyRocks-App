# Plan: Fix Mobile Layout for Specimen Dropdown

## Problem Statement
The specimen dropdown (`specimen-multi-select.tsx`) displays correctly on desktop but has layout issues on mobile devices. The goal is to improve the mobile experience without affecting desktop behavior.

## Current Issues Identified

### 1. Fixed Height Constraints Too Large for Mobile
**File:** `src/web/src/components/specimen-multi-select.tsx`

Current fixed `max-h` values don't adapt to mobile viewports:
- Inventory groups: `max-h-[180px]`
- Your Specimens: `max-h-[120px]`
- Reference Specimens: `max-h-[200px]`

On mobile, these heights can take up too much screen real estate.

### 2. Inventory Mode Inline Options Are Cramped
When a specimen is selected in inventory mode (lines 522-571), the "Photos" and "Deplete" checkboxes are displayed inline, which becomes cramped on narrow mobile screens.

### 3. Badge Chips May Overflow
The selected specimen badges use `max-w-[150px]` which may cause overflow issues on very narrow screens.

### 4. Search Header Icons Cramped on Mobile
The search input area (lines 403-458) has multiple icons (search, inventory toggle, settings) that can feel cramped on mobile.

---

## Implementation Plan

### Step 1: Add Responsive Max-Heights for Dropdown Groups
**File:** `src/web/src/components/specimen-multi-select.tsx`

Change the fixed `max-h` classes to responsive values using Tailwind breakpoints:

| Section | Current | Mobile (< sm) | Desktop (sm+) |
|---------|---------|---------------|---------------|
| Inventory groups | `max-h-[180px]` | `max-h-[120px]` | `sm:max-h-[180px]` |
| Your Specimens | `max-h-[120px]` | `max-h-[100px]` | `sm:max-h-[120px]` |
| Reference Specimens | `max-h-[200px]` | `max-h-[140px]` | `sm:max-h-[200px]` |

### Step 2: Stack Inventory Options on Mobile
**File:** `src/web/src/components/specimen-multi-select.tsx`

The "Photos" and "Deplete" checkboxes should stack vertically on mobile:

```tsx
// Current (line ~523-571):
<div className="flex items-center gap-2" onClick={...}>

// Change to:
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2" onClick={...}>
```

### Step 3: Responsive Badge Max-Width
**File:** `src/web/src/components/specimen-multi-select.tsx`

Update badge truncation for smaller mobile screens:

```tsx
// Current (lines 683, 714):
<span className="truncate max-w-[150px]">

// Change to:
<span className="truncate max-w-[100px] sm:max-w-[150px]">
```

### Step 4: Improve Mobile Search Header Layout
**File:** `src/web/src/components/specimen-multi-select.tsx`

Ensure the search header area doesn't feel cramped on mobile by adjusting padding/margins:

```tsx
// Current (line 403):
<div className="flex items-center border-b px-3">

// Change to:
<div className="flex items-center border-b px-2 sm:px-3">
```

And ensure icon buttons have adequate touch targets on mobile.

---

## Files to Modify

1. **`src/web/src/components/specimen-multi-select.tsx`** - Primary changes
   - Lines ~493: Inventory group `max-h`
   - Lines ~631: Your Specimens group `max-h`
   - Lines ~641: Reference Specimens group `max-h`
   - Lines ~522-571: Inventory options inline layout
   - Lines ~683, ~714: Badge max-width
   - Line ~403: Search header padding

---

## Testing Plan

1. **Desktop Verification (no regression)**
   - Open the New Cycle page (`/cycles/new`)
   - Open the specimen dropdown
   - Verify all sections display correctly
   - Test inventory mode toggle
   - Select multiple specimens and verify badge chips display correctly

2. **Mobile Testing**
   - Test on viewport widths: 320px, 375px, 414px (common mobile sizes)
   - Verify dropdown fits within screen bounds
   - Verify "Photos" and "Deplete" options are readable
   - Verify badge chips don't overflow the container
   - Test scrolling within dropdown sections

3. **Tablet Testing**
   - Test at 768px breakpoint
   - Verify smooth transition between mobile and desktop layouts

---

## Risk Assessment

- **Low Risk**: Changes use Tailwind responsive utilities which are well-tested
- **No Breaking Changes**: Adding responsive classes preserves existing desktop behavior
- **Isolated Changes**: All changes are within a single component file
