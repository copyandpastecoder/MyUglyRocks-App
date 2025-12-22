# Tumbler Numbering Feature Plan

## Overview

When a user has multiple tumblers of the same brand and model, we need to add a **Tumbler Number** to distinguish between them.

### Example

If a user has three 2-barrel tumblers of the same brand/model:
- **Tumbler #1**: Barrels 1, 2
- **Tumbler #2**: Barrels 1, 2
- **Tumbler #3**: Barrels 1, 2

Display example: "Lortone 3A #2 - Barrel 2" clearly identifies which tumbler and barrel.

---

## Current State

- `Tumbler` entity has: Brand, Model, TumblerType, but **no TumblerNumber**
- `Barrel.BarrelNumber` is user-provided (1-100), stored per barrel
- Barrel numbers are assigned by frontend when adding barrels (next sequential within that tumbler)
- No cross-tumbler barrel numbering exists

---

## Implementation Plan

### Phase 1: Database Changes

#### 1.1 Add TumblerNumber Column

**File:** New migration in `src/api/MyUglyRocks.Core/Migrations/`

```sql
-- Add tumbler_number column (nullable initially for migration)
ALTER TABLE tumblers ADD COLUMN tumbler_number integer NULL;

-- Create index for efficient lookups
CREATE INDEX ix_tumblers_user_brand_model_number
ON tumblers(user_id, brand, model, tumbler_number)
WHERE is_active = true;
```

**Tasks:**
- [ ] Create EF Core migration to add `TumblerNumber` column
- [ ] Add index for (UserId, Brand, Model, TumblerNumber) for efficient duplicate detection

#### 1.2 Update Tumbler Entity

**File:** `src/api/MyUglyRocks.Core/Entities/Tumbler.cs`

```csharp
// Add property
public int TumblerNumber { get; set; } = 1;
```

**Tasks:**
- [ ] Add `TumblerNumber` property to `Tumbler` entity
- [ ] Update EF Core configuration in `TumblerConfiguration.cs` if needed

#### 1.3 Backfill Existing Data

**Migration SQL to assign tumbler numbers to existing data:**

```sql
-- Assign tumbler numbers based on creation date within brand/model groups
WITH numbered AS (
  SELECT
    tumbler_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, LOWER(brand), LOWER(model)
      ORDER BY date_created
    ) as tumbler_num
  FROM tumblers
  WHERE is_active = true
)
UPDATE tumblers t
SET tumbler_number = n.tumbler_num
FROM numbered n
WHERE t.tumbler_id = n.tumbler_id;

-- Set default for any remaining nulls
UPDATE tumblers SET tumbler_number = 1 WHERE tumbler_number IS NULL;

-- Make column NOT NULL after backfill
ALTER TABLE tumblers ALTER COLUMN tumbler_number SET NOT NULL;
ALTER TABLE tumblers ALTER COLUMN tumbler_number SET DEFAULT 1;
```

**Tasks:**
- [ ] Add backfill logic to migration
- [ ] Make column NOT NULL after backfill
- [ ] Add verification query to confirm no nulls remain

---

### Phase 2: API Changes

#### 2.1 Update DTOs

**File:** `src/api/MyUglyRocks.Api/Dtos/TumblerDtos.cs`

```csharp
// TumblerDto - add TumblerNumber
public record TumblerDto(
    Guid TumblerId,
    string Brand,
    string? Model,
    TumblerType TumblerType,
    int TumblerNumber,        // NEW
    // ... rest of properties
);

// TumblerListDto - add TumblerNumber
public record TumblerListDto(
    Guid TumblerId,
    string Brand,
    string? Model,
    TumblerType TumblerType,
    int TumblerNumber,        // NEW
    // ... rest of properties
);

// CreateTumblerRequest - optionally allow specifying TumblerNumber
public record CreateTumblerRequest(
    // ... existing properties
    int? TumblerNumber        // NEW - optional, auto-assigned if not provided
);
```

**Tasks:**
- [ ] Add `TumblerNumber` to `TumblerDto`
- [ ] Add `TumblerNumber` to `TumblerListDto`
- [ ] Add optional `TumblerNumber` to `CreateTumblerRequest`
- [ ] Update `UpdateTumblerRequest` to allow changing TumblerNumber

#### 2.2 Update TumblerService

**File:** `src/api/MyUglyRocks.Api/Services/TumblerService.cs`

**Auto-assign TumblerNumber on creation:**
```csharp
public async Task<TumblerDto> CreateTumblerAsync(Guid userId, CreateTumblerRequest request)
{
    // Calculate next tumbler number for this brand/model
    var nextTumblerNumber = await _context.Tumblers
        .Where(t => t.UserId == userId
            && t.Brand.ToLower() == request.Brand.ToLower()
            && t.Model != null && request.Model != null
            && t.Model.ToLower() == request.Model.ToLower()
            && t.IsActive)
        .Select(t => t.TumblerNumber)
        .DefaultIfEmpty(0)
        .MaxAsync() + 1;

    // Use provided number or auto-assign
    var tumblerNumber = request.TumblerNumber ?? nextTumblerNumber;

    // Create tumbler with number
    var tumbler = new Tumbler
    {
        // ... existing properties
        TumblerNumber = tumblerNumber
    };
}
```

**Tasks:**
- [ ] Add auto-assignment logic for TumblerNumber on create
- [ ] Update mapping configuration to include TumblerNumber in DTOs
- [ ] Add validation to prevent duplicate TumblerNumbers for same brand/model

---

### Phase 3: Frontend Changes

#### 3.1 Update TypeScript Types

**File:** `src/web/src/types/tumbler.ts`

```typescript
export interface Tumbler {
  // ... existing properties
  tumblerNumber: number;           // NEW
  hasDuplicateBrandModel: boolean; // NEW: true if other tumblers share brand/model
}
```

**Tasks:**
- [ ] Add `tumblerNumber` to Tumbler interface
- [ ] Add `hasDuplicateBrandModel` to Tumbler interface (from API)

#### 3.2 Update Tumbler Display

**File:** `src/web/src/app/(protected)/tumblers/page.tsx`

Display tumbler number ONLY when there are multiple tumblers with the same brand AND model:

```tsx
// Count tumblers with same brand/model (case-insensitive)
const sameModelCount = tumblers.filter(t =>
  t.brand.toLowerCase() === tumbler.brand.toLowerCase() &&
  (t.model || '').toLowerCase() === (tumbler.model || '').toLowerCase()
).length;

// Only show tumbler number if there's more than one of this brand/model
const displayName = sameModelCount > 1
  ? `${tumbler.brand} ${tumbler.model || ''} #${tumbler.tumblerNumber}`
  : `${tumbler.brand} ${tumbler.model || ''}`;
```

**Tasks:**
- [ ] Update tumbler list to show tumbler number ONLY when duplicates exist (count > 1)
- [ ] Update tumbler detail page header to include number (only if duplicates)
- [ ] Add ability to edit tumbler number (with validation)
- [ ] API should return `hasDuplicates` or `sameModelCount` to avoid frontend recalculation

#### 3.3 Update Barrel Display

**File:** `src/web/src/app/(protected)/tumblers/[id]/page.tsx`

No changes needed - barrel numbers remain local to each tumbler. The tumbler number provides context when duplicates exist.

**Tasks:**
- [ ] No barrel display changes required (keep using local barrelNumber)

#### 3.4 Update Barrel Selector

**File:** `src/web/src/components/stage/barrel-selector.tsx`

```tsx
// Only include tumbler number if there are duplicates of this brand/model
// Example with duplicates: "Lortone 3A #2 - Barrel 2 (Blue Boulder)"
// Example without duplicates: "Lortone 3A - Barrel 2 (Blue Boulder)"
const tumblerLabel = tumbler.hasDuplicateBrandModel
  ? `${tumbler.brand} ${tumbler.model || ''} #${tumbler.tumblerNumber}`
  : `${tumbler.brand} ${tumbler.model || ''}`;

const displayText = `${tumblerLabel} - Barrel ${barrel.barrelNumber} (${barrel.nickname})`;
```

**Tasks:**
- [ ] Update barrel selector dropdown to include tumbler number when duplicates exist
- [ ] Group by tumbler, include tumbler number in group header ONLY if duplicates exist

#### 3.5 Update Cycle Card

**File:** `src/web/src/components/cycle-card/cycle-card.tsx`

The CycleListDto already includes `activeBarrelNumber` (local to tumbler - no change needed).
Add tumbler number display ONLY when there are duplicates.

**Tasks:**
- [ ] Add `activeTumblerNumber` and `hasDuplicateTumbler` to CycleListDto
- [ ] Update display to show tumbler number only when duplicates exist

---

### Phase 4: Validation & Edge Cases

#### 4.1 Validation Rules

- [ ] TumblerNumber must be ≥ 1
- [ ] TumblerNumber must be unique per (UserId, Brand, Model) combination
- [ ] Case-insensitive brand/model matching for uniqueness
- [ ] When deleting a tumbler, don't renumber remaining tumblers (gaps allowed)
- [ ] When updating brand/model, recalculate TumblerNumber if needed

#### 4.2 Edge Cases

- [ ] User creates tumbler with no model - treat as unique brand-only group
- [ ] User changes brand or model - reassign TumblerNumber
- [ ] Soft-deleted tumblers - exclude from numbering (WHERE is_active = true)
- [ ] Restoring soft-deleted tumbler - assign next available number

#### 4.3 Barrel Renumbering Considerations

**Important Decision:** Should we automatically renumber barrels when:
- A tumbler is deleted?
- A tumbler's brand/model is changed?
- A barrel is deleted from a tumbler?

**Recommendation:** Do NOT auto-renumber. This maintains stability and avoids confusion:
- Users can manually renumber if they want
- Historical references remain valid
- Simpler implementation

**Tasks:**
- [ ] Document that barrel numbers are stable (no auto-renumbering)
- [ ] Add UI option for manual barrel renumbering if requested

---

### Phase 5: Testing

#### 5.1 Unit Tests

- [ ] Test TumblerNumber auto-assignment for new tumblers
- [ ] Test TumblerNumber uniqueness validation
- [ ] Test GlobalBarrelNumber calculation
- [ ] Test edge cases (no model, case-insensitive matching)

#### 5.2 Integration Tests

- [ ] Test creating multiple tumblers of same brand/model
- [ ] Test barrel numbering across tumblers
- [ ] Test tumbler deletion doesn't break remaining numbering
- [ ] Test brand/model update recalculates tumbler number

#### 5.3 Manual Testing

- [ ] Create 3 identical tumblers, verify numbering
- [ ] Add barrels to each, verify global numbers
- [ ] Delete middle tumbler, verify remaining numbers unchanged
- [ ] Create new tumbler of same type, verify gets next number

---

## Implementation Order

1. **Phase 1.1-1.2**: Database schema + Entity changes
2. **Phase 1.3**: Backfill existing data
3. **Phase 2.1-2.2**: API DTOs and service changes
4. **Phase 2.3**: Global barrel number computation
5. **Phase 3.1**: Frontend type updates
6. **Phase 3.2-3.5**: UI component updates
7. **Phase 4**: Validation and edge case handling
8. **Phase 5**: Testing

---

## Files to Modify

### Backend (C#)
- `src/api/MyUglyRocks.Core/Entities/Tumbler.cs`
- `src/api/MyUglyRocks.Core/Configurations/TumblerConfiguration.cs`
- `src/api/MyUglyRocks.Api/Dtos/TumblerDtos.cs`
- `src/api/MyUglyRocks.Api/Services/TumblerService.cs`
- `src/api/MyUglyRocks.Api/Mapping/MappingConfig.cs`
- New migration file

### Frontend (TypeScript/React)
- `src/web/src/types/tumbler.ts`
- `src/web/src/app/(protected)/tumblers/page.tsx`
- `src/web/src/app/(protected)/tumblers/[id]/page.tsx`
- `src/web/src/components/stage/barrel-selector.tsx`
- `src/web/src/components/cycle-card/cycle-card.tsx`

---

## Design Decisions

### Tumbler Number Display Rule
**IMPORTANT:** Tumbler numbers should ONLY be displayed when there is more than one tumbler with the same brand AND model combination.

- If user has 1 "Lortone 3A" → Display as "Lortone 3A" (no number)
- If user has 2 "Lortone 3A" → Display as "Lortone 3A #1" and "Lortone 3A #2"
- The count is per (brand, model) pair, case-insensitive

This applies to:
- Tumbler list page
- Tumbler detail page header
- Barrel selector dropdowns
- Cycle cards
- Any other place tumblers are displayed

### No Global Barrel Numbering
**DECIDED:** We will NOT implement global barrel numbering across tumblers.

Instead of computing sequential barrel numbers across all tumblers of the same brand/model (e.g., Tumbler #1 has barrels 1,2; Tumbler #2 has barrels 3,4), we will simply display:
- Tumbler number (when duplicates exist)
- Local barrel number within that tumbler

Example display: "Lortone 3A #2 - Barrel 2" (NOT "Barrel 4")

**Rationale:**
- Simpler implementation
- No complex cross-tumbler calculations
- Less confusion if barrels are added/removed
- Barrel numbers stay stable

---

## Open Questions

1. **Should tumbler numbers auto-compact when one is deleted?**
   - Recommendation: No, allow gaps for stability

2. ~~**Should we show tumbler number when only one tumbler of that type exists?**~~
   - **DECIDED:** Only show when > 1 tumbler of same brand/model (see Design Decisions above)

3. ~~**Should global barrel numbers recalculate when a barrel is deleted?**~~
   - **DECIDED:** No global barrel numbering - barrels keep local numbers (see Design Decisions above)

4. **Do we need API endpoints to manually renumber tumblers?**
   - Can add later if users request it
