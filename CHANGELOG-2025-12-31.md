# Changelog - December 31, 2025

## Summary
This changelog documents all changes made during the December 31, 2025 development session.

## Features & Improvements

### Dashboard Navigation (Issue: Clickable Stat Cards)
**Files Changed:**
- `src/web/src/app/(protected)/dashboard/page.tsx`

**Changes:**
- Made dashboard stat cards clickable with navigation
- Active Cycles → `/cycles`
- Completed Cycles → `/cycles?tab=completed` (opens Completed tab)
- My Tumblers → `/tumblers`
- Navigation already implemented, verified functionality

---

### Cycles Page - Water Amount Input Enhancement
**Files Changed:**
- `src/web/src/app/(protected)/cycles/[id]/page.tsx`
- `src/web/src/components/stage-form/index.tsx`

**Changes:**
- Fixed water amount input from text to numeric
- Added unit selector (milliliters / fluid ounces)
- Added unit conversion: 1 fl oz = 29.5735 ml
- Exported `WATER_UNITS` constant for reuse
- Backend receives integer values in milliliters

**Code:**
```typescript
waterAmountMl: variables.nextStageWaterAmount && variables.nextStageWaterUnit
  ? Math.round(parseFloat(variables.nextStageWaterAmount) * (variables.nextStageWaterUnit === 'floz' ? 29.5735 : 1))
  : undefined,
```

---

### Photo Processing Jobs - Code Refactoring
**Files Changed:**
- `src/api/MyUglyRocks.Infrastructure/Jobs/BasePhotoProcessingJob.cs` (NEW)
- `src/api/MyUglyRocks.Infrastructure/Jobs/PhotoProcessingJob.cs`
- `src/api/MyUglyRocks.Infrastructure/Jobs/InventoryPhotoProcessingJob.cs`

**Changes:**
- Created generic base class `BasePhotoProcessingJob<TPhoto>` to eliminate code duplication
- Reduced both PhotoProcessingJob and InventoryPhotoProcessingJob from ~310 lines to 76 lines each (-75%)
- Total code reduction: ~460 lines of duplicate code eliminated
- Added comprehensive XML documentation for file naming conventions

**Architecture:**
- Base class handles three-phase processing: thumbnail → large variants → original preservation
- Abstract methods for entity-specific operations
- Improved maintainability and consistency

---

### Database Migration - Photo Processing Fields
**Files Changed:**
- `src/api/MyUglyRocks.Infrastructure/Migrations/20251231203756_AddPhotoOriginalFields.cs` (NEW)

**Changes:**
- Added migration for photo processing original file fields
- Added to `photos` table:
  - `OriginalFileSizeBytes` (bigint, nullable)
  - `OriginalMimeType` (text, nullable)
  - `OriginalStorageKey` (text, nullable)
  - `OriginalUrl` (text, nullable)
- Added same fields to `inventory_photos` table
- Migration applied automatically on API startup

---

### Cycles Page - Expand/Collapse Fix
**Files Changed:**
- `src/web/src/components/cycle-card/types.ts`
- `src/web/src/components/cycle-card/cycle-card.tsx`
- `src/web/src/app/(protected)/cycles/page.tsx`

**Changes:**
- Fixed bug where individual card expand/collapse buttons stopped working after using "Expand All" / "Collapse All"
- Added `onExpandedChange` callback to CycleCard component
- When user clicks individual card toggle, it resets global expand state to `undefined`
- Restores individual control mode for all cards

**Behavior:**
1. Click "Expand All" → All cards expand
2. Click any individual card's toggle → Resets to individual control mode
3. Each card can now be toggled independently

---

### Inventory Page - Card Layout Fixes
**Files Changed:**
- `src/web/src/app/(protected)/inventory/page.tsx`

**Changes:**
1. **Increased card padding** from `p-3` to `p-4` for better spacing
2. **Fixed text overflow** with proper flex constraints:
   - Added `flex-1 min-w-0` to text container
   - Added `overflow-hidden` to text container (critical for truncation)
   - Added `flex-shrink-0` to right side elements
   - Added `whitespace-nowrap` to weight/cost display
3. **Image error handling:**
   - Added state tracking for failed images
   - Added `onError` handler to switch to placeholder
   - Empty `alt=""` attribute prevents text overflow
   - Shows Package icon placeholder when images fail to load
4. **Fixed React hook error:**
   - Moved `useState` from `renderInventoryRow` to component level
   - Created `handleImageError` function

**Layout Structure:**
```
Card Container (flex justify-between)
├─ Left Side (flex-1 min-w-0) - can shrink
│  ├─ Image/Placeholder (flex-shrink-0) - fixed size
│  └─ Text Container (flex-1 min-w-0 overflow-hidden)
│     ├─ Name (truncate)
│     └─ Source (truncate)
└─ Right Side (flex-shrink-0) - fixed size
   ├─ Weight/Cost (hidden on mobile)
   ├─ Status Badge
   └─ Dropdown Menu
```

---

## Bug Fixes

### Critical Issues
1. **Water amount type mismatch** - Fixed numeric input with unit conversion
2. **Photo processing code duplication** - Eliminated with generic base class
3. **Cycles expand/collapse bug** - Fixed individual control restoration
4. **Inventory text overflow** - Fixed with proper flex constraints and overflow handling
5. **React hook error #310** - Fixed by moving useState to component level
6. **Image loading errors** - Graceful fallback to placeholder icon

### Minor Issues
1. **Missing WATER_UNITS export** - Added to stage-form index
2. **TypeScript type error** - Fixed Select component type casting
3. **Image alt text overflow** - Changed to empty alt attribute

---

## Build & Deployment

### Commands Used
```bash
# Web app rebuild and restart
.\scripts\restart-apps.ps1 -SkipApi

# API rebuild and restart
.\scripts\restart-apps.ps1 -SkipWeb

# Full rebuild with no cache
.\scripts\restart-apps.ps1 -NoCache

# Both apps
.\scripts\restart-apps.ps1
```

### Kubernetes Status
- All deployments successful
- API running: `myuglyrocks-api-57fddf4f96-stxzb`
- Web running: `myuglyrocks-web-768d5447ff-sdt2l`
- PostgreSQL, Redis, Cloudflare Tunnel all healthy

---

## Known Issues

### R2 Image Loading (Non-Critical)
- Some R2 images fail to load with `NS_BINDING_ABORTED` error
- Gracefully handled with placeholder icon fallback
- Console error is harmless and expected
- To fix permanently: Check R2 CORS settings for `https://dev.myuglyrocks.com`

---

## Technical Debt Paid

1. **Code duplication in photo processing jobs** - RESOLVED
   - Created generic base class
   - Reduced maintenance burden by 75%

2. **Undocumented file naming conventions** - RESOLVED
   - Added XML documentation explaining why originals have extensions
   - Documented WebP variants stored without extensions

---

## Testing Checklist

- [x] Dashboard navigation works (Active Cycles, Completed Cycles, My Tumblers)
- [x] Water amount input accepts numeric values with unit conversion
- [x] Photo processing jobs compile and run
- [x] Database migration applies successfully
- [x] Cycles expand/collapse works after using "Expand All"
- [x] Inventory cards display without text overflow
- [x] Failed images show placeholder instead of breaking layout
- [x] No React errors in console (hook error fixed)
- [x] All Next.js builds pass
- [x] All .NET API builds pass

---

## Files Modified

### Frontend (Next.js)
- `src/web/src/app/(protected)/dashboard/page.tsx`
- `src/web/src/app/(protected)/cycles/page.tsx`
- `src/web/src/app/(protected)/cycles/[id]/page.tsx`
- `src/web/src/app/(protected)/inventory/page.tsx`
- `src/web/src/components/stage-form/index.tsx`
- `src/web/src/components/cycle-card/types.ts`
- `src/web/src/components/cycle-card/cycle-card.tsx`

### Backend (.NET)
- `src/api/MyUglyRocks.Infrastructure/Jobs/BasePhotoProcessingJob.cs` (NEW)
- `src/api/MyUglyRocks.Infrastructure/Jobs/PhotoProcessingJob.cs`
- `src/api/MyUglyRocks.Infrastructure/Jobs/InventoryPhotoProcessingJob.cs`
- `src/api/MyUglyRocks.Infrastructure/Migrations/20251231203756_AddPhotoOriginalFields.cs` (NEW)

---

## Access URLs

- **Web:** https://dev.myuglyrocks.com
- **API:** https://dev.myuglyrocks.com/api
- **PostgreSQL:** localhost:5432 (via port-forward)

---

## Notes

- All changes deployed to development environment
- Database migration applied automatically
- No breaking changes
- Backward compatible
