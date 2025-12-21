# Tumbler Numbering Feature Plan

## Overview

When a user has multiple tumblers of the same brand and model, we need to:
1. Add a **Tumbler Number** to distinguish between them
2. Make barrel numbers **sequential across all tumblers** of the same brand/model

### Example

If a user has three 2-barrel tumblers of the same brand/model:
- **Tumbler #1**: Barrels 1, 2
- **Tumbler #2**: Barrels 3, 4
- **Tumbler #3**: Barrels 5, 6

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

#### 2.3 Add Computed Barrel Display Number

This is a **display-only calculation** - the actual `BarrelNumber` in the database remains the same (local to each tumbler), but we compute a **global barrel number** for display across tumblers of the same brand/model.

**Option A: Compute in API (Recommended)**

Add a computed property to BarrelDto:

```csharp
public record BarrelDto(
    // ... existing properties
    int BarrelNumber,           // Local number (1, 2, etc.)
    int GlobalBarrelNumber      // NEW: Computed across tumblers (1, 2, 3, 4, 5, 6...)
);
```

**Calculation logic:**
```csharp
// In mapping or service layer
public int CalculateGlobalBarrelNumber(Barrel barrel, Tumbler tumbler, List<Tumbler> sameBrandModelTumblers)
{
    // Get all tumblers of same brand/model with lower TumblerNumber
    var precedingTumblers = sameBrandModelTumblers
        .Where(t => t.TumblerNumber < tumbler.TumblerNumber)
        .OrderBy(t => t.TumblerNumber);

    // Sum all barrels from preceding tumblers
    var precedingBarrelCount = precedingTumblers
        .Sum(t => t.Barrels.Count(b => b.IsActive));

    return precedingBarrelCount + barrel.BarrelNumber;
}
```

**Tasks:**
- [ ] Add `GlobalBarrelNumber` computed property to BarrelDto
- [ ] Implement calculation in TumblerService or mapping
- [ ] Ensure barrels are sorted by GlobalBarrelNumber in responses

---

### Phase 3: Frontend Changes

#### 3.1 Update TypeScript Types

**File:** `src/web/src/types/tumbler.ts`

```typescript
export interface Tumbler {
  // ... existing properties
  tumblerNumber: number;       // NEW
}

export interface Barrel {
  // ... existing properties
  barrelNumber: number;        // Local number
  globalBarrelNumber: number;  // NEW: Display number across tumblers
}
```

**Tasks:**
- [ ] Add `tumblerNumber` to Tumbler interface
- [ ] Add `globalBarrelNumber` to Barrel interface

#### 3.2 Update Tumbler Display

**File:** `src/web/src/app/(protected)/tumblers/page.tsx`

Display tumbler number when there are multiple of same brand/model:

```tsx
// Show: "Lortone 3A #2" instead of just "Lortone 3A"
const displayName = tumbler.tumblerNumber > 1 || hasDuplicateBrandModel
  ? `${tumbler.brand} ${tumbler.model || ''} #${tumbler.tumblerNumber}`
  : `${tumbler.brand} ${tumbler.model || ''}`;
```

**Tasks:**
- [ ] Update tumbler list to show tumbler number when duplicates exist
- [ ] Update tumbler detail page header to include number
- [ ] Add ability to edit tumbler number (with validation)

#### 3.3 Update Barrel Display

**File:** `src/web/src/app/(protected)/tumblers/[id]/page.tsx`

Use global barrel number for display:

```tsx
// Display global barrel number instead of local
<Badge>{barrel.globalBarrelNumber}</Badge>
```

**Tasks:**
- [ ] Update barrel badges to show globalBarrelNumber
- [ ] Update barrel tooltips/labels

#### 3.4 Update Barrel Selector

**File:** `src/web/src/components/stage/barrel-selector.tsx`

```tsx
// Update display to use global barrel number
// "Lortone 3A #2 - 3 lbs #4 (Blue Boulder)"
const displayText = `${tumblerName} #${tumbler.tumblerNumber} - ${barrel.capacityLbs} lbs #${barrel.globalBarrelNumber} (${barrel.nickname})`;
```

**Tasks:**
- [ ] Update barrel selector dropdown to show global barrel numbers
- [ ] Group by tumbler with tumbler number in group header

#### 3.5 Update Cycle Card

**File:** `src/web/src/components/cycle-card/cycle-card.tsx`

The CycleListDto already includes `activeBarrelNumber` - may need to update to use global number.

**Tasks:**
- [ ] Verify CycleListDto returns correct (global) barrel number
- [ ] Update display logic if needed

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

## Open Questions

1. **Should tumbler numbers auto-compact when one is deleted?**
   - Recommendation: No, allow gaps for stability

2. **Should we show tumbler number when only one tumbler of that type exists?**
   - Recommendation: Only show when > 1 tumbler of same brand/model

3. **Should global barrel numbers recalculate when a barrel is deleted?**
   - Recommendation: No, keep stable for consistency

4. **Do we need API endpoints to manually renumber tumblers/barrels?**
   - Can add later if users request it
