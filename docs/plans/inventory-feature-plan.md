# Inventory Feature Plan

## Overview

Add an Inventory system to allow users to track their rock/specimen collection, including where they acquired items, when, cost, and current status.

---

## Database Schema

### Inventory Table

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `inventory_id` | UUID | No | Primary key |
| `user_id` | UUID | No | FK to Users |
| `name` | VARCHAR(255) | No | User-friendly name for this inventory item/batch |
| `acquired_date` | DATE | No | When the specimens were acquired |
| `source_type` | ENUM | No | How acquired: `Store`, `Online`, `Found`, `Gift`, `Trade`, `Other` |
| `source_name` | VARCHAR(255) | Yes | Store name, website, location found, person's name, etc. |
| `source_location` | VARCHAR(255) | Yes | City/State or general area (e.g., "Lake Superior Shore", "Tucson Gem Show") |
| `source_url` | VARCHAR(500) | Yes | Link to online store/listing if applicable |
| `total_weight_grams` | DECIMAL(10,2) | Yes | Total weight (always stored in grams, UI handles unit display) |
| `remaining_weight_grams` | DECIMAL(10,2) | Yes | How much is left (updated as used in cycles) |
| `display_unit` | VARCHAR(10) | No | User's preferred display unit: `g`, `oz`, `lb` (default: 'g') |
| `cost` | DECIMAL(10,2) | Yes | What they paid (total, assumed USD) |
| `condition` | ENUM | No | `Raw`, `PreShaped`, `Tumbled`, `Polished`, `Mixed` |
| `size_category` | ENUM | Yes | `Small`, `Medium`, `Large`, `Mixed`, `Assorted` |
| `quality_rating` | INT | Yes | 1-5 user rating of material quality |
| `status` | ENUM | No | `Available`, `InUse`, `Depleted`, `Partial` |
| `storage_location` | VARCHAR(255) | Yes | Where they keep it: "Garage shelf 2", "Bucket A", etc. |
| `notes` | TEXT | Yes | General notes about the acquisition |
| `is_favorite` | BOOLEAN | No | Quick filter for favorites (default: false) |
| `is_deleted` | BOOLEAN | No | Soft delete flag (default: false) |
| `date_deleted` | TIMESTAMP | Yes | When soft deleted |
| `date_created` | TIMESTAMP | No | Audit field |
| `date_updated` | TIMESTAMP | No | Audit field |

**Weight Handling**: Store weight in grams only. UI converts to/from user's preferred `display_unit`. This matches how Materials work in stage cards.

### InventorySpecimen Table (Junction)

Links inventory items to specimens (many-to-many).

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `inventory_specimen_id` | UUID | No | Primary key |
| `inventory_id` | UUID | No | FK to Inventory |
| `specimen_id` | UUID | No | FK to Specimens |
| `estimated_percentage` | INT | Yes | Approx % of this specimen in the mix (0-100) |
| `notes` | TEXT | Yes | Notes specific to this specimen in the batch |
| `date_created` | TIMESTAMP | No | Audit field |
| `date_updated` | TIMESTAMP | No | Audit field |

### InventoryPhoto Table

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `inventory_photo_id` | UUID | No | Primary key |
| `inventory_id` | UUID | No | FK to Inventory |
| `photo_id` | UUID | No | FK to Photos (reuse existing photo system) |
| `is_cover` | BOOLEAN | No | Is this the cover/thumbnail photo |
| `sort_order` | INT | No | Display order |
| `date_created` | TIMESTAMP | No | Audit field |

---

## Optional Fields for Future Consideration

These are NOT included in v1 but could be added later:

| Field | Type | Rationale |
|-------|------|-----------|
| `batch_number` | VARCHAR | User's own batch/lot numbering system |
| `purchase_reference` | VARCHAR | Order number, receipt number, etc. |
| `source_country` | VARCHAR | Specimen provenance (especially for "Found" items) |
| `times_used` | INT | Counter for how many cycles have used from this inventory |
| `last_used_date` | DATE | When was this last used in a cycle |

### Future Enhancement - Link to Cycles (v2)

**CycleInventory** junction table - Track which cycles used specimens from which inventory items. NOT building in v1 to avoid complexity. Users can manually update `remaining_weight_grams` for now.

---

## Enums

```csharp
public enum SourceType
{
    Store,      // Physical retail store
    Online,     // Online purchase
    Found,      // Collected in the wild
    Gift,       // Received as gift
    Trade,      // Traded with another collector
    Other       // Other source
}

public enum InventoryCondition
{
    Raw,        // Unprocessed, as found/purchased
    PreShaped,  // Pre-shaped but not tumbled
    Tumbled,    // Already tumbled (buying finished rocks)
    Polished,   // Fully polished
    Mixed       // Mix of conditions
}

public enum InventoryStatus
{
    Available,  // Ready to use
    InUse,      // Currently being used in active cycle(s)
    Depleted,   // All used up
    Partial     // Some used, some available
}

public enum SizeCategory
{
    Small,      // < 0.5 inch
    Medium,     // 0.5 - 1.5 inch
    Large,      // > 1.5 inch
    Mixed,      // Various sizes
    Assorted    // Deliberately mixed sizes
}
```

---

## UI Pages

### 1. Inventory List Page (`/inventory`)
- Grid or list view of all inventory items (default: list view for v1)
- Filter by: Status, Source Type, Specimen, Favorites
- Sort by: Acquired Date (default), Name, Weight, Cost
- Quick stats bar: Total items, total weight (in user's preferred unit), total invested
- Search by name
- Pagination (20 items per page)

### 2. Add Inventory Page (`/inventory/new`)
- Form with all fields
- Multi-select specimen picker (with search/filter)
- Weight input with unit selector (converts to grams on save)
- Photo upload (reuse existing photo upload component)
- Validation: name required, acquired_date required, at least one specimen recommended

### 3. Inventory Detail Page (`/inventory/:id`)
- Full details view with weight displayed in user's preferred unit
- Photo gallery (reuse existing gallery component)
- Edit/Delete actions (soft delete)
- Link to associated specimens
- Quick "Mark as Depleted" action

### 4. Edit Inventory Page (`/inventory/:id/edit`)
- Same as add, pre-populated
- Show original vs remaining weight

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List user's inventory (paginated, with filters) |
| GET | `/api/inventory/:id` | Get single inventory item with specimens & photos |
| POST | `/api/inventory` | Create new inventory item |
| PUT | `/api/inventory/:id` | Update inventory item |
| DELETE | `/api/inventory/:id` | Soft delete inventory item |
| PATCH | `/api/inventory/:id/status` | Quick status update (e.g., mark depleted) |
| POST | `/api/inventory/:id/photos` | Upload photos (reuse existing photo upload) |
| DELETE | `/api/inventory/:id/photos/:photoId` | Remove photo |
| PUT | `/api/inventory/:id/specimens` | Update specimen associations |

**Query Parameters for GET `/api/inventory`:**
- `status` - Filter by status (Available, InUse, Depleted, Partial)
- `sourceType` - Filter by source type
- `specimenId` - Filter by specimen
- `favorites` - Filter favorites only (true/false)
- `search` - Search by name (case-insensitive contains)
- `sortBy` - Sort field (acquiredDate, name, weight, cost)
- `sortOrder` - asc/desc
- `skip` / `take` - Pagination (default: 0, 20)

---

## Design Decisions (Resolved)

1. **Weight Units**: Store grams only. UI converts to/from user's `display_unit` preference. Same pattern as Materials in stage cards.

2. **Link to Cycles**: NOT in v1. Users manually update `remaining_weight_grams`. Future v2 could add `CycleInventory` junction table for automatic tracking.

3. **Specimen Relationship**: Many-to-many. Users often buy mixed bags (e.g., "10 lb Brazilian Mix" with multiple specimen types). `estimated_percentage` allows rough tracking.

4. **Photo Limit**: 10 photos per inventory item (same as cycles). Enforced in API.

5. **Currency**: Assume USD for v1. Store as decimal, display with $ prefix. Future enhancement could add currency field.

---

## Implementation Order

### Phase 1: Backend Foundation
1. Create enums (`SourceType`, `InventoryCondition`, `InventoryStatus`, `SizeCategory`)
2. Database migration (Inventory, InventorySpecimen, InventoryPhoto tables)
3. Entity classes and EF Core configurations
4. DTOs (CreateInventoryRequest, UpdateInventoryRequest, InventoryDto, InventoryListDto)
5. InventoryService with CRUD operations
6. InventoryController with endpoints

### Phase 2: Frontend List & CRUD
7. TypeScript types matching DTOs
8. API client functions (`inventoryApi.ts`)
9. React Query hooks (`useInventory`, `useInventories`, `useCreateInventory`, etc.)
10. Inventory list page (`/inventory`) with filtering and sorting
11. Add inventory page (`/inventory/new`)
12. Edit inventory page (`/inventory/:id/edit`)

### Phase 3: Detail Page & Photos
13. Inventory detail page (`/inventory/:id`)
14. Photo upload integration (reuse existing photo upload component)
15. Navigation links (add to sidebar, link from specimens page)

### Phase 4: Polish
16. Empty states and loading skeletons
17. Mobile responsiveness
18. Seed data for demo user

---

## Weight Conversion Utilities

Reuse existing weight conversion pattern from Materials:

```typescript
// lib/weight-utils.ts
export const GRAMS_PER_OZ = 28.3495;
export const GRAMS_PER_LB = 453.592;

export function toGrams(value: number, unit: 'g' | 'oz' | 'lb'): number {
  switch (unit) {
    case 'oz': return value * GRAMS_PER_OZ;
    case 'lb': return value * GRAMS_PER_LB;
    default: return value;
  }
}

export function fromGrams(grams: number, unit: 'g' | 'oz' | 'lb'): number {
  switch (unit) {
    case 'oz': return grams / GRAMS_PER_OZ;
    case 'lb': return grams / GRAMS_PER_LB;
    default: return grams;
  }
}

export function formatWeight(grams: number, unit: 'g' | 'oz' | 'lb'): string {
  const value = fromGrams(grams, unit);
  return `${value.toFixed(1)} ${unit}`;
}
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `name` | Required, 1-255 chars |
| `acquired_date` | Required, not in future |
| `source_type` | Required, valid enum value |
| `total_weight_grams` | Optional, must be >= 0 |
| `remaining_weight_grams` | Optional, must be >= 0 and <= total_weight_grams |
| `cost` | Optional, must be >= 0 |
| `quality_rating` | Optional, 1-5 |
| `estimated_percentage` | Optional, 0-100 |

---

## Wireframe Reference

See: `docs/wireframes/XX-inventory.md` (to be created)
