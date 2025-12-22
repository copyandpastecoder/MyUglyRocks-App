# Tumbler Numbering Feature Plan

## Status: ✅ IMPLEMENTED

**Implemented:** December 22, 2024
**Commit:** `9ec54b3` - feat: add tumbler numbering to distinguish same brand/model tumblers

---

## Overview

When a user has multiple tumblers of the same brand and model, we add a **Tumbler Number** to distinguish between them.

### Example

If a user has three 2-barrel tumblers of the same brand/model:
- **Tumbler #1**: Barrels 1, 2
- **Tumbler #2**: Barrels 1, 2
- **Tumbler #3**: Barrels 1, 2

Display example: "Lortone 3A #2 - Barrel 2" clearly identifies which tumbler and barrel.

---

## Design Decisions

### Tumbler Number Display Rule
**IMPORTANT:** Tumbler numbers are ONLY displayed when there is more than one tumbler with the same brand AND model combination.

- If user has 1 "Lortone 3A" → Display as "Lortone 3A" (no number)
- If user has 2 "Lortone 3A" → Display as "Lortone 3A #1" and "Lortone 3A #2"
- The count is per (brand, model) pair, case-insensitive

This applies to:
- Tumbler list page
- Tumbler detail page header
- Barrel selector dropdowns
- Cycle cards

### No Global Barrel Numbering
**DECIDED:** We do NOT implement global barrel numbering across tumblers.

Each tumbler keeps its own barrel numbers (1, 2, etc.). Display format: "Lortone 3A #2 - Barrel 2"

**Rationale:**
- Simpler implementation
- No complex cross-tumbler calculations
- Less confusion if barrels are added/removed
- Barrel numbers stay stable

---

## Implementation Summary

### Phase 1: Database Changes ✅

#### 1.1 Added TumblerNumber Column
- [x] Created EF Core migration `20251222000000_AddTumblerNumber.cs`
- [x] Added index for (UserId, Brand, Model, TumblerNumber) with filter on is_active

#### 1.2 Updated Tumbler Entity
**File:** `src/api/MyUglyRocks.Core/Entities/Tumbler.cs`
- [x] Added `TumblerNumber` property (int, default 1)

#### 1.3 Backfill Existing Data
- [x] Migration includes SQL to assign tumbler numbers based on creation date within brand/model groups
- [x] Made column NOT NULL with default value of 1

---

### Phase 2: API Changes ✅

#### 2.1 Updated DTOs
**File:** `src/api/MyUglyRocks.Abstractions/DTOs/TumblerDtos.cs`
- [x] Added `TumblerNumber` to `TumblerDto`
- [x] Added `HasDuplicateBrandModel` to `TumblerDto`
- [x] Added `TumblerNumber` to `TumblerListDto`
- [x] Added `HasDuplicateBrandModel` to `TumblerListDto`

**File:** `src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs`
- [x] Added `ActiveTumblerNumber` to `CycleListDto`
- [x] Added `HasDuplicateTumbler` to `CycleListDto`

#### 2.2 Updated TumblerService
**File:** `src/api/MyUglyRocks.Core/Services/TumblerService.cs`
- [x] Auto-assigns next TumblerNumber on create (based on existing same brand/model)
- [x] Recalculates TumblerNumber when brand/model changes on update
- [x] Computes `HasDuplicateBrandModel` flag in list and detail queries

#### 2.3 Updated CycleService
**File:** `src/api/MyUglyRocks.Core/Services/CycleService.cs`
- [x] Added Tumblers DbSet for duplicate detection
- [x] Computes `HasDuplicateTumbler` flag for cycle list

---

### Phase 3: Frontend Changes ✅

#### 3.1 Updated TypeScript Types
**File:** `src/web/src/types/tumbler.ts`
- [x] Added `tumblerNumber` to `TumblerDto`
- [x] Added `hasDuplicateBrandModel` to `TumblerDto`
- [x] Added `tumblerNumber` to `TumblerListDto`
- [x] Added `hasDuplicateBrandModel` to `TumblerListDto`

**File:** `src/web/src/types/cycle.ts`
- [x] Added `activeTumblerNumber` to `CycleListDto`
- [x] Added `hasDuplicateTumbler` to `CycleListDto`

#### 3.2 Updated Tumbler Display
**File:** `src/web/src/app/(protected)/tumblers/page.tsx`
- [x] Added `getTumblerDisplayName()` helper that includes number only when duplicates exist

**File:** `src/web/src/app/(protected)/tumblers/[id]/page.tsx`
- [x] Added same helper for detail page header

#### 3.3 Updated Barrel Selector
**File:** `src/web/src/app/(protected)/cycles/[id]/page.tsx`
- [x] Updated barrel selector to show tumbler number when duplicates exist

#### 3.4 Updated Cycle Card
**File:** `src/web/src/components/cycle-card/cycle-card.tsx`
- [x] Added `tumblerDisplay` that includes number only when `hasDuplicateTumbler` is true

---

### Phase 4: Validation & Edge Cases ✅

- [x] TumblerNumber must be ≥ 1 (enforced by default value)
- [x] Case-insensitive brand/model matching using `.ToLower()`
- [x] Soft-deleted tumblers excluded from numbering (WHERE is_active = true in index)
- [x] When deleting a tumbler, remaining tumblers keep their numbers (gaps allowed)
- [x] When updating brand/model, recalculates TumblerNumber

---

## Files Modified

### Backend (C#)
- `src/api/MyUglyRocks.Core/Entities/Tumbler.cs`
- `src/api/MyUglyRocks.Infrastructure/Data/Configurations/TumblerConfiguration.cs`
- `src/api/MyUglyRocks.Infrastructure/Migrations/20251222000000_AddTumblerNumber.cs`
- `src/api/MyUglyRocks.Infrastructure/Migrations/20251222000000_AddTumblerNumber.Designer.cs`
- `src/api/MyUglyRocks.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`
- `src/api/MyUglyRocks.Abstractions/DTOs/TumblerDtos.cs`
- `src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs`
- `src/api/MyUglyRocks.Core/Services/TumblerService.cs`
- `src/api/MyUglyRocks.Core/Services/CycleService.cs`

### Frontend (TypeScript/React)
- `src/web/src/types/tumbler.ts`
- `src/web/src/types/cycle.ts`
- `src/web/src/app/(protected)/tumblers/page.tsx`
- `src/web/src/app/(protected)/tumblers/[id]/page.tsx`
- `src/web/src/app/(protected)/cycles/[id]/page.tsx`
- `src/web/src/components/cycle-card/cycle-card.tsx`

---

## Open Questions (Resolved)

1. **Should tumbler numbers auto-compact when one is deleted?**
   - **Answer:** No, allow gaps for stability ✅

2. **Should we show tumbler number when only one tumbler of that type exists?**
   - **Answer:** No, only show when > 1 tumbler of same brand/model ✅

3. **Should global barrel numbers recalculate when a barrel is deleted?**
   - **Answer:** No global barrel numbering implemented - barrels keep local numbers ✅

4. **Do we need API endpoints to manually renumber tumblers?**
   - **Answer:** Not implemented - can add later if users request it
