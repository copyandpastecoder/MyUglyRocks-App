# Implementation Plan: Individual Specimen Weights in Inventory

## Overview

Allow users to add multiple specimens to inventory with individual weights for each specimen, rather than a single batch weight.

## Design Decisions

### Recommended Approach
- **Support both modes**: Batch weight (existing) OR individual specimen weights (new)
- **Auto-calculate total**: When individual weights are provided, sum them for the total
- **Single unit**: All specimens in an inventory use the same display unit (simpler UX)
- **UI pattern**: Inline editable table with quick-add functionality

---

## Phase 1: Database Schema Changes

### 1.1 Update InventorySpecimen Entity

**File:** `src/api/MyUglyRocks.Core/Entities/InventorySpecimen.cs`

Add new field:
```csharp
public decimal? WeightGrams { get; set; }  // Individual specimen weight (nullable for backwards compatibility)
```

### 1.2 Create EF Core Migration

```bash
cd src/api/MyUglyRocks.Api
dotnet ef migrations add AddSpecimenWeight --project ../MyUglyRocks.Core
dotnet ef database update
```

**Migration should:**
- Add `WeightGrams` column to `InventorySpecimen` table
- Allow NULL (existing records won't have individual weights)

---

## Phase 2: Backend API Changes

### 2.1 Update DTOs

**File:** `src/api/MyUglyRocks.Abstractions/DTOs/InventoryDtos.cs`

Update `InventorySpecimenDto`:
```csharp
public record InventorySpecimenDto(
    Guid InventorySpecimenId,
    Guid? SpecimenId,
    Guid? UserSpecimenId,
    string SpecimenName,
    string? ScientificName,
    string? MaterialType,
    decimal? MohsHardnessMin,
    decimal? MohsHardnessMax,
    int? EstimatedPercentage,
    decimal? WeightGrams,        // NEW
    string? Notes
);
```

Update `CreateInventorySpecimenRequest`:
```csharp
public record CreateInventorySpecimenRequest(
    Guid? SpecimenId,
    Guid? UserSpecimenId,
    int? EstimatedPercentage,
    decimal? WeightGrams,        // NEW
    string? Notes
);
```

Update `UpdateInventorySpecimenRequest` (if exists, or create):
```csharp
public record UpdateInventorySpecimenRequest(
    Guid? SpecimenId,
    Guid? UserSpecimenId,
    int? EstimatedPercentage,
    decimal? WeightGrams,        // NEW
    string? Notes
);
```

### 2.2 Update InventoryService

**File:** `src/api/MyUglyRocks.Core/Services/InventoryService.cs`

**In `CreateAsync` method:**
- Map `WeightGrams` from request to entity
- If any specimens have individual weights, calculate and set `TotalWeightGrams` as sum

**In `UpdateAsync` method:**
- Same logic for weight calculation

**In `UpdateSpecimensAsync` method:**
- Map `WeightGrams` when creating/updating junction records
- Recalculate `TotalWeightGrams` if individual weights provided

**Add helper method:**
```csharp
private void RecalculateTotalWeight(Inventory inventory)
{
    var specimenWeights = inventory.InventorySpecimens
        .Where(s => s.WeightGrams.HasValue)
        .Sum(s => s.WeightGrams!.Value);

    if (specimenWeights > 0)
    {
        inventory.TotalWeightGrams = specimenWeights;
    }
}
```

### 2.3 Update Mapster Mappings (if used)

Ensure `InventorySpecimen` -> `InventorySpecimenDto` mapping includes `WeightGrams`.

---

## Phase 3: Frontend Type Changes

### 3.1 Update TypeScript Types

**File:** `src/web/src/types/inventory.ts`

Update `InventorySpecimenDto`:
```typescript
export interface InventorySpecimenDto {
  inventorySpecimenId: string;
  specimenId: string | null;
  userSpecimenId: string | null;
  specimenName: string;
  scientificName: string | null;
  materialType: string | null;
  mohsHardnessMin: number | null;
  mohsHardnessMax: number | null;
  estimatedPercentage: number | null;
  weightGrams: number | null;        // NEW
  notes: string | null;
}
```

Update `CreateInventorySpecimenRequest`:
```typescript
export interface CreateInventorySpecimenRequest {
  specimenId?: string;
  userSpecimenId?: string;
  estimatedPercentage?: number;
  weightGrams?: number;              // NEW
  notes?: string;
}
```

---

## Phase 4: Frontend UI Changes

### 4.1 Create SpecimenWeightTable Component

**New File:** `src/web/src/components/specimen-weight-table.tsx`

Features:
- Display specimens in a table with editable weight column
- Add specimen button (opens specimen selector)
- Remove specimen button per row
- Weight input with unit conversion (uses inventory's displayUnit)
- Auto-calculate and display total weight
- Hardness mismatch warning (existing logic)

```typescript
interface SpecimenWeightTableProps {
  specimens: SpecimenWithWeight[];
  onSpecimensChange: (specimens: SpecimenWithWeight[]) => void;
  displayUnit: string;  // 'g', 'lb', 'oz', 'kg'
}

interface SpecimenWithWeight {
  specimenId?: string;
  userSpecimenId?: string;
  specimenName: string;
  weightGrams: number | null;
  notes?: string;
}
```

**Table columns:**
| Specimen | Weight | Actions |
|----------|--------|---------|
| Agate (dropdown/display) | [input] lbs | [X] remove |
| Jasper | [input] lbs | [X] remove |
| **Total** | **2.5 lbs** | [+ Add] |

### 4.2 Update New Inventory Page

**File:** `src/web/src/app/(protected)/inventory/new/page.tsx`

**Option A: Replace current specimen selector**
- Remove multi-select dropdown
- Add SpecimenWeightTable component
- Weight inputs per specimen replace single batch weight

**Option B: Toggle between modes (recommended)**
- Add toggle: "Track weight per specimen" checkbox
- If OFF: Show existing batch weight + specimen multi-select
- If ON: Show SpecimenWeightTable with individual weights

```tsx
const [trackIndividualWeights, setTrackIndividualWeights] = useState(false);

{trackIndividualWeights ? (
  <SpecimenWeightTable
    specimens={specimensWithWeights}
    onSpecimensChange={setSpecimensWithWeights}
    displayUnit={displayUnit}
  />
) : (
  <>
    <WeightInput ... />  {/* Existing batch weight */}
    <SpecimenMultiSelect ... />  {/* Existing multi-select */}
  </>
)}
```

### 4.3 Update Edit Inventory Page

**File:** `src/web/src/app/(protected)/inventory/[id]/edit/page.tsx`

- Same changes as new page
- Load existing specimen weights from API
- Determine mode based on whether specimens have individual weights

### 4.4 Update Inventory Detail View

**File:** `src/web/src/app/(protected)/inventory/[id]/page.tsx`

- Display individual weights in specimen list if available
- Show weight next to each specimen name

---

## Phase 5: Weight Calculation Logic

### 5.1 Frontend Auto-Calculation

When individual weights change:
```typescript
const totalWeightGrams = specimensWithWeights
  .filter(s => s.weightGrams != null)
  .reduce((sum, s) => sum + s.weightGrams!, 0);
```

Display calculated total but don't allow manual override when in individual mode.

### 5.2 Backend Validation

In `InventoryService`:
- If `TotalWeightGrams` is provided AND individual weights are provided, prefer individual weights sum
- Validate: individual weights should be positive numbers
- Validate: sum shouldn't exceed reasonable maximum (e.g., 100,000 grams)

---

## Phase 6: Testing

### 6.1 Test Cases

1. **Create inventory with individual weights**
   - Add 3 specimens with weights: 100g, 200g, 150g
   - Verify total shows 450g
   - Verify saved correctly to database

2. **Create inventory with batch weight (backwards compatibility)**
   - Add specimens without individual weights
   - Set batch weight manually
   - Verify existing flow still works

3. **Edit inventory - add individual weights**
   - Open existing batch-weight inventory
   - Switch to individual weights mode
   - Add weights to each specimen
   - Verify total recalculates

4. **Edit inventory - change specimen weights**
   - Modify individual weights
   - Verify total updates
   - Verify changes persist

5. **Remove specimen with weight**
   - Remove a specimen from the list
   - Verify total recalculates

6. **Mixed scenarios**
   - Some specimens with weight, some without
   - Verify partial totals work correctly

---

## Implementation Order

| Step | Task | Estimated Time |
|------|------|----------------|
| 1 | Database migration (add WeightGrams) | 15 min |
| 2 | Update backend DTOs | 20 min |
| 3 | Update InventoryService | 45 min |
| 4 | Update frontend types | 10 min |
| 5 | Create SpecimenWeightTable component | 1.5 hours |
| 6 | Update new inventory page | 45 min |
| 7 | Update edit inventory page | 30 min |
| 8 | Update inventory detail view | 20 min |
| 9 | Testing & bug fixes | 1 hour |
| **Total** | | **~5-6 hours** |

---

## Future Enhancements (Out of Scope)

- Bulk import from CSV with individual weights
- Weight history/tracking over time
- Weight loss calculations per specimen after tumbling
- Default weights based on specimen type

---

## Questions to Resolve Before Implementation

1. **Should we remove the batch weight option entirely?** Or keep both modes?
2. **What happens to existing inventory?** They'll have no individual weights - display as "batch" mode
3. **Required or optional?** Should weight be required for each specimen, or optional?
4. **RemainingWeightGrams per specimen?** Track consumption at specimen level too?
