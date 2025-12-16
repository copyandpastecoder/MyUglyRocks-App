# Plan: Inventory Refactor

## Overview

Refactor the Inventory system to introduce a new `InventorySource` table that represents WHERE specimens are acquired from (eBay, rock shops, beaches, etc.). This separates the "source/vendor" concept from the "purchase" concept, allowing better organization and filtering.

## Data Model Changes

### Current Structure
```
Inventory (purchase + source info combined)
    +-- InventorySpecimen (individual rocks)
```

### New Structure
```
InventorySource (WHERE you get specimens from)
    +-- Inventory (a purchase/acquisition event)
            +-- InventorySpecimen (individual rocks)
```

---

## New Table: InventorySource

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| InventorySourceId | Guid | Yes | Primary key |
| UserId | Guid | Yes | FK to User |
| SourceType | enum | Yes | Online, Found, Store, Contact, GemShow, Other |
| Name | string | Yes | e.g., "eBay", "Tucson Gem Show 2024", "Local Beach" |
| Location | string | No | City/state or general area |
| Phone | string | No | Contact phone |
| Url | string | No | Store/location URL |
| ContactName | string | No | Contact person name |
| Notes | string | No | Additional notes |
| IsActive | bool | Yes | Default true, hide inactive sources |
| CreatedAt | DateTime | Yes | Auto |
| UpdatedAt | DateTime | Yes | Auto |

**Constraints:**
- **Unique index**: `(UserId, SourceType, LOWER(TRIM(Name)))` - prevents duplicate sources per user
- **CHECK constraint**: `CHECK (TRIM(name) <> '')` - enforces non-blank names at DB layer
- Name is case-insensitive unique (e.g., "eBay" and "EBAY" are the same source)
- **Business rule**: Same name allowed across different SourceTypes (e.g., "Bob's Rocks" as Store and "Bob's Rocks" as Contact are separate sources)
- **Note on location**: Location is NOT part of the unique key by design. If a user wants two "Rock Shop" entries in different towns, they should use distinct names like "Rock Shop - Denver" and "Rock Shop - Boulder". This keeps the UI picker simple (no duplicates shown).

**Computed properties (not stored):**
- `LastPurchaseDate` - Most recent Inventory.AcquiredDate for this source
- `TotalPurchases` - Count of Inventory records for this source

---

## SourceType Enum

**New enum values:** `Online, Found, Store, Contact, GemShow, Other`

**Migration mapping:**
| Current | New |
|---------|-----|
| Store | Store |
| Online | Online |
| Found | Found |
| Gift | Contact |
| Trade | Contact |
| *(new)* | GemShow |
| Other | Other |

---

## Modified Table: Inventory

### Add
| Field | Type | Description |
|-------|------|-------------|
| InventorySourceId | Guid? | FK to InventorySource (nullable for migration) |

### Remove
| Field | Reason |
|-------|--------|
| SourceType | Moved to InventorySource |
| SourceName | Moved to InventorySource.Name |
| SourceLocation | Moved to InventorySource.Location |
| SourceUrl | Moved to InventorySource.Url |
| IsFavorite | Removing feature |
| Status | Moving to InventorySpecimen |

### Keep (unchanged)
- InventoryId, UserId, **Name (required)**, AcquiredDate, Cost
- TotalWeightGrams, RemainingWeightGrams, DisplayUnit
- SizeCategories, QualityRating, StorageLocation, Notes
- CreatedAt, UpdatedAt, IsDeleted, DeletedAt

**Note:** Inventory.Name remains required. It represents the purchase/acquisition name (e.g., "December eBay haul", "Beach trip 2024").

---

## Modified Table: InventorySpecimen

### Add
| Field | Type | Description |
|-------|------|-------------|
| Status | enum | Available, InUse, Depleted, Partial (moved from Inventory) |
| StorageLocation | string? | Where this specimen is stored |
| Url | string? | Specific listing URL for this specimen |

**Status field details:**
- **Default:** `Available` (0) for new specimens
- **NOT NULL** constraint after migration backfill
- Migration copies Status from parent Inventory; specimens without a parent status default to `Available`

### Keep (unchanged)
- InventorySpecimenId, InventoryId, SpecimenId, UserSpecimenId
- WeightGrams, Cost, Condition, QualityRating, SizeCategories, Notes

### UI Addition
- Expose existing `Notes` field in UI (already in DB, not shown)

---

## URL Input Component

Create a reusable URL input component with:
- Plain text input (accept with or without protocol)
- Copy button
- Forgiving validation
- Used everywhere URLs are entered (InventorySource, Inventory, InventorySpecimen)

---

## Data Migration Strategy

**Prerequisites:**
```sql
-- Ensure gen_random_uuid() is available (Railway PostgreSQL has this by default)
-- Run this if you get "function gen_random_uuid() does not exist" error:
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Phase 1: Create InventorySource records from existing data

```sql
-- Create unique InventorySource records from existing Inventory data
-- IMPORTANT: Unique key is (user_id, source_type, LOWER(TRIM(name))) - location/url are NOT part of key
-- Uses DISTINCT ON to pick one representative row when same name has different locations/urls
-- Preserves original SourceType for Gift/Trade in Notes field
INSERT INTO inventory_sources (inventory_source_id, user_id, source_type, name, location, url, notes, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    user_id,
    mapped_source_type,
    normalized_name,
    -- Pick location/url from the most recent inventory with this name
    NULLIF(TRIM(source_location), ''),
    NULLIF(TRIM(source_url), ''),
    migration_note,
    true,
    NOW(),
    NOW()
FROM (
    SELECT DISTINCT ON (user_id, mapped_source_type, LOWER(TRIM(normalized_name)))
        user_id,
        CASE source_type
            WHEN 3 THEN 3  -- Gift -> Contact (value 3)
            WHEN 4 THEN 3  -- Trade -> Contact (value 3)
            ELSE source_type
        END AS mapped_source_type,
        -- Normalize name: trim whitespace, use default if empty
        COALESCE(NULLIF(TRIM(source_name), ''),
            CASE source_type
                WHEN 0 THEN 'Store'
                WHEN 1 THEN 'Online'
                WHEN 2 THEN 'Found'
                WHEN 3 THEN 'Contact (Gift)'
                WHEN 4 THEN 'Contact (Trade)'
                ELSE 'Other'
            END
        ) AS normalized_name,
        source_location,
        source_url,
        -- Preserve original source type for Gift/Trade
        CASE
            WHEN source_type = 3 THEN 'Migrated from: Gift'
            WHEN source_type = 4 THEN 'Migrated from: Trade'
            ELSE NULL
        END AS migration_note
    FROM inventory
    -- Pick the best row when there are duplicates:
    -- 1. Prefer rows with filled location (non-null first)
    -- 2. Prefer rows with filled url (non-null first)
    -- 3. Then by most recent acquired_date
    -- This ensures we keep a filled-out address even if the latest entry is blank
    ORDER BY user_id, mapped_source_type, LOWER(TRIM(normalized_name)),
             (source_location IS NULL OR TRIM(source_location) = ''),  -- false (has value) sorts before true
             (source_url IS NULL OR TRIM(source_url) = ''),            -- false (has value) sorts before true
             acquired_date DESC NULLS LAST
) AS deduped;
```

**Note:** When the same normalized name appears with different locations/urls, we prefer rows with filled-in data over blank entries, then fall back to most recent by `acquired_date`. This prevents losing good address data when a later entry was created without it.

**PostgreSQL-specific:** `DISTINCT ON` is a PostgreSQL extension not available in other databases. This is fine for Railway (which uses PostgreSQL), but if you ever need to port this migration to EF Core operations or another database, you'll need to rewrite using `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)` or equivalent LINQ with `.GroupBy().Select(g => g.OrderBy(...).First())`.

<details>
<summary>Portable ROW_NUMBER() alternative (click to expand)</summary>

```sql
-- Same logic using ROW_NUMBER() - works on all SQL databases
INSERT INTO inventory_sources (inventory_source_id, user_id, source_type, name, location, url, notes, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    user_id,
    mapped_source_type,
    normalized_name,
    NULLIF(TRIM(source_location), ''),
    NULLIF(TRIM(source_url), ''),
    migration_note,
    true,
    NOW(),
    NOW()
FROM (
    SELECT
        user_id,
        mapped_source_type,
        normalized_name,
        source_location,
        source_url,
        migration_note,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, mapped_source_type, LOWER(TRIM(normalized_name))
            ORDER BY
                (source_location IS NULL OR TRIM(source_location) = ''),
                (source_url IS NULL OR TRIM(source_url) = ''),
                acquired_date DESC NULLS LAST
        ) AS rn
    FROM (
        SELECT
            user_id,
            CASE source_type WHEN 3 THEN 3 WHEN 4 THEN 3 ELSE source_type END AS mapped_source_type,
            COALESCE(NULLIF(TRIM(source_name), ''),
                CASE source_type
                    WHEN 0 THEN 'Store' WHEN 1 THEN 'Online' WHEN 2 THEN 'Found'
                    WHEN 3 THEN 'Contact (Gift)' WHEN 4 THEN 'Contact (Trade)' ELSE 'Other'
                END
            ) AS normalized_name,
            source_location,
            source_url,
            acquired_date,
            CASE WHEN source_type IN (3, 4) THEN 'Migrated from: ' ||
                CASE source_type WHEN 3 THEN 'Gift' WHEN 4 THEN 'Trade' END
            END AS migration_note
        FROM inventory
    ) AS normalized
) AS ranked
WHERE rn = 1;
```
</details>

### Phase 2: Link Inventory to InventorySource

```sql
-- Update Inventory records with their InventorySourceId
-- IMPORTANT: Phase 1 defaulted blank source_name to "Store"/"Online"/etc. based on source_type.
-- We must apply the SAME defaulting logic here, or blank inventory.source_name won't match.

-- First pass: exact match on name + location + url (handles filled-in records)
UPDATE inventory i
SET inventory_source_id = s.inventory_source_id
FROM inventory_sources s
WHERE i.user_id = s.user_id
  AND s.source_type = (CASE i.source_type WHEN 3 THEN 3 WHEN 4 THEN 3 ELSE i.source_type END)
  AND LOWER(TRIM(COALESCE(i.source_name, ''))) = LOWER(TRIM(s.name))
  AND LOWER(TRIM(COALESCE(i.source_location, ''))) = LOWER(TRIM(COALESCE(s.location, '')))
  AND LOWER(TRIM(COALESCE(i.source_url, ''))) = LOWER(TRIM(COALESCE(s.url, '')))
  AND NULLIF(TRIM(i.source_name), '') IS NOT NULL;  -- Only non-blank names

-- Second pass: match blank/null source_name using same default logic as Phase 1
-- This matches inventory rows where source_name was blank to the "Store"/"Online"/etc. source
UPDATE inventory i
SET inventory_source_id = s.inventory_source_id
FROM inventory_sources s
WHERE i.inventory_source_id IS NULL
  AND i.user_id = s.user_id
  AND s.source_type = (CASE i.source_type WHEN 3 THEN 3 WHEN 4 THEN 3 ELSE i.source_type END)
  AND LOWER(TRIM(s.name)) = LOWER(TRIM(
      CASE i.source_type
          WHEN 0 THEN 'Store'
          WHEN 1 THEN 'Online'
          WHEN 2 THEN 'Found'
          WHEN 3 THEN 'Contact (Gift)'
          WHEN 4 THEN 'Contact (Trade)'
          ELSE 'Other'
      END
  ))
  AND (NULLIF(TRIM(i.source_name), '') IS NULL);  -- Only blank/null names

-- Third pass: fallback for any remaining - match by normalized name only (ignoring location/url)
UPDATE inventory i
SET inventory_source_id = s.inventory_source_id
FROM inventory_sources s
WHERE i.inventory_source_id IS NULL
  AND i.user_id = s.user_id
  AND s.source_type = (CASE i.source_type WHEN 3 THEN 3 WHEN 4 THEN 3 ELSE i.source_type END)
  AND LOWER(TRIM(COALESCE(NULLIF(TRIM(i.source_name), ''),
      CASE i.source_type
          WHEN 0 THEN 'Store'
          WHEN 1 THEN 'Online'
          WHEN 2 THEN 'Found'
          WHEN 3 THEN 'Contact (Gift)'
          WHEN 4 THEN 'Contact (Trade)'
          ELSE 'Other'
      END
  ))) = LOWER(TRIM(s.name));

-- Report any remaining unlinked Inventory records (should be 0)
-- Run this query manually to verify before proceeding:
-- SELECT inventory_id, user_id, source_type, source_name, source_location, source_url
-- FROM inventory WHERE inventory_source_id IS NULL;
```

### Phase 3: Migrate Status to InventorySpecimen

**IMPORTANT: Enum Backing Value Check**

Before running this migration, verify that the C# enum values match the SQL defaults:

```csharp
// In InventoryStatus.cs - verify these backing values match the migration:
public enum InventoryStatus
{
    Available = 0,   // <-- DEFAULT 0 in migration
    InUse = 1,
    Depleted = 2,
    Partial = 3
}
```

If the enum order changes in code, the migration's `DEFAULT 0` will create mismatched data. Add a unit test or startup check:

```csharp
// Startup validation (Program.cs or a health check)
Debug.Assert((int)InventoryStatus.Available == 0,
    "InventoryStatus.Available must be 0 to match migration default");
```

```sql
-- Add Status column with default (allows NOT NULL constraint)
-- DEFAULT 0 corresponds to InventoryStatus.Available in C# enum
ALTER TABLE inventory_specimens
ADD COLUMN status integer NOT NULL DEFAULT 0;  -- 0 = Available

-- Copy Status from parent Inventory to all its InventorySpecimens
UPDATE inventory_specimens sp
SET status = i.status
FROM inventory i
WHERE sp.inventory_id = i.inventory_id;

-- Specimens without an inventory parent (orphans) keep the default Available status
```

**Optional: Drop DEFAULT after backfill**

After verifying the migration is complete, consider dropping the DEFAULT to prevent future schema drift. With only NOT NULL (no default), missing values will cause explicit errors rather than silently defaulting:

```sql
-- Run AFTER Phase 5 (drop old columns) is complete
-- This ensures code/tests must explicitly set status
ALTER TABLE inventory_specimens
ALTER COLUMN status DROP DEFAULT;
```

Leave the DEFAULT in place if you prefer implicit `Available` for new specimens created without explicit status.

**EF Core Configuration Warning:**

If you drop the DEFAULT, ensure EF Core doesn't re-introduce it on the next migration. Add explicit configuration:

```csharp
// InventorySpecimenConfiguration.cs
public void Configure(EntityTypeBuilder<InventorySpecimen> builder)
{
    // ... other config ...

    // Explicitly configure NO default value - prevents EF from re-adding it
    // This ensures code must always set Status explicitly
    builder.Property(e => e.Status)
        .IsRequired()
        .HasConversion<int>();  // No .HasDefaultValue()!

    // If EF tries to add a default in a future migration, review and remove it
}
```

Also add a test to catch accidental reintroduction:

```csharp
[Fact]
public void InventorySpecimen_Status_HasNoDefaultValue()
{
    // Ensure the model doesn't have a default configured
    var entityType = _context.Model.FindEntityType(typeof(InventorySpecimen));
    var statusProperty = entityType!.FindProperty(nameof(InventorySpecimen.Status));

    Assert.Null(statusProperty!.GetDefaultValue());
    Assert.Null(statusProperty.GetDefaultValueSql());
}
```

### Phase 4: Post-migration verification

```sql
-- Run these queries to verify migration success before dropping columns:

-- 1. Check for unlinked Inventory records (should be 0)
SELECT COUNT(*) as unlinked_inventory FROM inventory WHERE inventory_source_id IS NULL;

-- 1b. If count > 0, list the unlinked records to investigate:
SELECT inventory_id, user_id, name, source_type, source_name, source_location, source_url, acquired_date
FROM inventory
WHERE inventory_source_id IS NULL
ORDER BY user_id, source_type, source_name;
-- Use this to understand WHY they didn't match and fix the linking logic if needed

-- 2. Check for InventorySpecimen status distribution
SELECT status, COUNT(*) FROM inventory_specimens GROUP BY status;

-- 3. Check for duplicate InventorySource names per user (should match unique constraint)
SELECT user_id, source_type, LOWER(TRIM(name)), COUNT(*)
FROM inventory_sources
GROUP BY user_id, source_type, LOWER(TRIM(name))
HAVING COUNT(*) > 1;
```

### Phase 5: Drop old columns (after verification)

```sql
-- Only run after verification queries pass!
ALTER TABLE inventory
DROP COLUMN source_type,
DROP COLUMN source_name,
DROP COLUMN source_location,
DROP COLUMN source_url,
DROP COLUMN is_favorite,
DROP COLUMN status;
```

### Phase 6: Enforce constraints (after app deployment)

Run this phase after the new code is deployed and working:

```sql
-- 1. Verify no orphan Inventory rows exist
SELECT COUNT(*) FROM inventory WHERE inventory_source_id IS NULL;
-- Must be 0 before proceeding!

-- 2. Make inventory_source_id NOT NULL with ON DELETE RESTRICT
-- (prevents detaching from source or deleting sources with linked inventory)
ALTER TABLE inventory
ALTER COLUMN inventory_source_id SET NOT NULL;

-- Drop any existing FK first (in case initial migration added one with different options)
-- This prevents "constraint already exists" errors
ALTER TABLE inventory
DROP CONSTRAINT IF EXISTS fk_inventory_source;

ALTER TABLE inventory
ADD CONSTRAINT fk_inventory_source
FOREIGN KEY (inventory_source_id)
REFERENCES inventory_sources(inventory_source_id)
ON DELETE RESTRICT;

-- 2b. Re-verify no orphans after constraint changes
-- (catches any concurrent writes that slipped in during deployment)
SELECT COUNT(*) FROM inventory WHERE inventory_source_id IS NULL;
-- MUST still be 0! If not, list and fix before proceeding:
-- SELECT inventory_id, user_id, name, acquired_date FROM inventory WHERE inventory_source_id IS NULL;

-- 3. Verify/backfill any empty Inventory.Name values before enforcing NOT NULL
-- (Name should already be required, but check for legacy data)

-- First, count how many need fixing (for logging/verification):
SELECT COUNT(*) AS empty_name_count FROM inventory WHERE name IS NULL OR TRIM(name) = '';
-- Expected: 0 (if not, log this count before and after backfill)

-- If any rows returned, backfill with a default:
UPDATE inventory
SET name = 'Inventory ' || TO_CHAR(acquired_date, 'YYYY-MM-DD')
WHERE name IS NULL OR TRIM(name) = '';

-- Verify backfill worked (should now be 0):
SELECT COUNT(*) AS remaining_empty FROM inventory WHERE name IS NULL OR TRIM(name) = '';
-- MUST be 0 before proceeding
```

---

## Database Indexes

Add indexes and constraints for efficient querying and data integrity.

**Note:** These should be added in the EF Core migration (Phase 1), not run separately. The SQL below is for reference - EF Core will generate equivalent statements.

```sql
-- InventorySource constraints (add in migration, not separately)
-- Use "IF NOT EXISTS" pattern or let EF handle idempotency
ALTER TABLE inventory_sources
ADD CONSTRAINT chk_inventory_sources_name_not_blank
CHECK (TRIM(name) <> '');

-- InventorySource indexes
CREATE UNIQUE INDEX IF NOT EXISTS ix_inventory_sources_user_type_name
ON inventory_sources (user_id, source_type, LOWER(TRIM(name)));

CREATE INDEX ix_inventory_sources_user_active
ON inventory_sources (user_id, is_active);

-- Inventory indexes for source filtering
CREATE INDEX ix_inventory_source_id
ON inventory (inventory_source_id);

CREATE INDEX ix_inventory_acquired_date
ON inventory (acquired_date DESC);

-- InventorySpecimen indexes for status filtering
CREATE INDEX ix_inventory_specimens_status
ON inventory_specimens (status);

CREATE INDEX ix_inventory_specimens_inventory_status
ON inventory_specimens (inventory_id, status);
```

**N+1 Query Prevention:**

For Inventory list queries, use projection instead of `.Include(i => i.InventorySpecimens)` to avoid fetching heavy specimen data:

```csharp
// InventoryService.cs - GetAllAsync
// BAD: .Include(i => i.InventorySpecimens) fetches ALL specimen data
// GOOD: Project only the fields/counts needed for the list view

var inventories = await _context.Inventory
    .Include(i => i.InventorySource)  // Eager load source (small, always needed)
    .Where(i => i.UserId == userId && !i.IsDeleted)
    .Select(i => new InventoryListDto
    {
        InventoryId = i.InventoryId,
        Name = i.Name,
        AcquiredDate = i.AcquiredDate,
        Cost = i.Cost,
        // Source info (eager loaded)
        SourceName = i.InventorySource != null ? i.InventorySource.Name : null,
        SourceType = i.InventorySource != null ? i.InventorySource.SourceType : null,
        // Computed counts instead of full specimen list
        SpecimenCount = i.InventorySpecimens.Count,
        AvailableCount = i.InventorySpecimens.Count(s => s.Status == InventoryStatus.Available),
        // Cover photo - use Select to get URL directly, avoiding double enumeration
        // (FirstOrDefault + First would enumerate twice and throw if no cover)
        CoverPhotoUrl = i.InventoryPhotos
            .Where(p => p.IsCover)
            .Select(p => p.Url)
            .FirstOrDefault()
    })
    .ToListAsync();
```

For Inventory detail view (single item), Include is fine since you need the full data:

```csharp
// InventoryService.cs - GetByIdAsync (detail view)
var inventory = await _context.Inventory
    .Include(i => i.InventorySource)
    .Include(i => i.InventorySpecimens)
    .Include(i => i.InventoryPhotos)
    .FirstOrDefaultAsync(i => i.InventoryId == id && i.UserId == userId);
```

For InventorySource list with computed properties (TotalPurchases, LastPurchaseDate), use a projection:

```csharp
// InventorySourceService.cs - GetAllAsync
var sources = await _context.InventorySources
    .Where(s => s.UserId == userId && s.IsActive)
    .Select(s => new InventorySourceDto
    {
        InventorySourceId = s.InventorySourceId,
        Name = s.Name,
        SourceType = s.SourceType,
        // ... other fields
        TotalPurchases = s.Inventories.Count(i => !i.IsDeleted),
        LastPurchaseDate = s.Inventories
            .Where(i => !i.IsDeleted)
            .Max(i => (DateOnly?)i.AcquiredDate)
    })
    .ToListAsync();
```

---

## Implementation Phases

### Phase 1: Backend Schema & Migration (API)
**Estimated: 4-6 hours**

1. Create `InventorySource` entity
   - `src/api/MyUglyRocks.Core/Entities/InventorySource.cs`

2. Update `SourceType` enum
   - Modify `src/api/MyUglyRocks.Core/Entities/Inventory.cs`
   - New values: Online, Found, Store, Contact, GemShow, Other

3. Update `InventorySpecimen` entity
   - Add Status, StorageLocation, Url fields

4. Update `Inventory` entity
   - Add InventorySourceId FK
   - Mark old fields for removal (keep temporarily for migration)

5. Create EF Core configuration
   - `src/api/MyUglyRocks.Infrastructure/Data/Configurations/InventorySourceConfiguration.cs`

6. Create migration
   - `dotnet ef migrations add InventorySourceRefactor`

7. Write data migration SQL
   - Create InventorySource records
   - Link Inventory to InventorySource
   - Copy Status to InventorySpecimen

### Phase 2: Backend Services & API (API)
**Estimated: 6-8 hours**

1. Create InventorySource DTOs
   - `src/api/MyUglyRocks.Abstractions/DTOs/InventorySourceDtos.cs`

2. Create InventorySource service
   - `src/api/MyUglyRocks.Infrastructure/Services/InventorySourceService.cs`
   - CRUD operations
   - List with filters (by SourceType, search, isActive)
   - Computed properties (LastPurchaseDate, TotalPurchases)
   - **Unique name validation**: Check for existing source with same (UserId, SourceType, LOWER(TRIM(Name))) before create/update
   - Return 409 Conflict if duplicate name exists

3. Create InventorySource controller
   - `src/api/MyUglyRocks.Api/Controllers/InventorySourceController.cs`
   - GET /api/inventory-sources
   - GET /api/inventory-sources/{id}
   - POST /api/inventory-sources
   - PUT /api/inventory-sources/{id}
   - DELETE /api/inventory-sources/{id}

4. Update Inventory DTOs
   - Add InventorySourceId
   - Include InventorySource details in responses
   - Remove old source fields from request DTOs

5. Update InventorySpecimen DTOs
   - Add Status, StorageLocation, Url
   - Include Notes in responses (already in DB)

6. Update Inventory service
   - Handle InventorySourceId
   - Update queries to include source info

7. Update existing endpoints
   - Inventory list should include source info
   - Inventory detail should include full source

### Phase 3: Frontend - URL Component & Types (Web)
**Estimated: 2-3 hours**

1. Create URL input component
   - `src/web/src/components/ui/url-input.tsx`
   - Plain text input
   - Copy button
   - Forgiving validation
   - Reusable across all URL fields

2. Update TypeScript types
   - `src/web/src/types/inventory.ts`
   - Add InventorySource types
   - Update Inventory types (add inventorySourceId)
   - Update InventorySpecimen types (add status, storageLocation, url)

3. Update API client
   - `src/web/src/lib/api.ts`
   - Add inventorySourceApi methods

### Phase 4: Frontend - InventorySource Management (Web)
**Estimated: 4-6 hours**

1. Create InventorySource hooks
   - `src/web/src/hooks/use-inventory-sources.ts`
   - useInventorySources (list)
   - useInventorySource (detail)
   - useCreateInventorySource
   - useUpdateInventorySource
   - useDeleteInventorySource

2. Create InventorySource list page
   - `src/web/src/app/(protected)/inventory/sources/page.tsx`
   - List all sources
   - Filter by SourceType, search
   - Show computed stats (TotalPurchases, LastPurchaseDate)

3. Create InventorySource form
   - `src/web/src/components/inventory/inventory-source-form.tsx`
   - Create/Edit source
   - All fields with URL component
   - **Frontend validation**: Show error if name already exists for this SourceType (check on blur or submit)

4. Create InventorySource picker
   - `src/web/src/components/inventory/inventory-source-picker.tsx`
   - Dropdown/combobox for selecting source
   - Quick-create option
   - Used in Inventory forms

### Phase 5: Frontend - Update Inventory UI (Web)
**Estimated: 6-8 hours**

1. Update Inventory list page
   - `src/web/src/app/(protected)/inventory/page.tsx`
   - Show InventorySource info on cards
   - Filter by InventorySource
   - Remove Favorite functionality

2. Update Inventory detail page
   - Show full InventorySource details
   - Link to source

3. Update Inventory forms
   - Replace source fields with InventorySource picker
   - Remove Status field (moved to specimen)

4. Update InventorySpecimen forms
   - Add Status dropdown
   - Add StorageLocation field
   - Add Url field with URL component
   - Add Notes textarea (expose existing field)

5. Update InventorySpecimen display
   - Show Status, StorageLocation, Url, Notes

6. Update query keys
   - `src/web/src/lib/query-keys.ts`
   - Add inventorySources keys

### Phase 6: Cleanup & Testing
**Estimated: 3-4 hours**

1. Create second migration to drop old columns
   - After verifying data migration success
   - Remove SourceType, SourceName, SourceLocation, SourceUrl, IsFavorite, Status from Inventory

2. Remove old code
   - Old DTOs, form fields, display components for removed fields

3. Update tests
   - Add InventorySource tests
   - Update Inventory tests

4. Manual testing
   - Test all CRUD operations
   - Test data migration
   - Test filters and search
   - Test on existing production data (dev copy)

---

## Files to Create

| File | Description |
|------|-------------|
| `src/api/MyUglyRocks.Core/Entities/InventorySource.cs` | New entity |
| `src/api/MyUglyRocks.Infrastructure/Data/Configurations/InventorySourceConfiguration.cs` | EF config |
| `src/api/MyUglyRocks.Abstractions/DTOs/InventorySourceDtos.cs` | DTOs |
| `src/api/MyUglyRocks.Infrastructure/Services/InventorySourceService.cs` | Service |
| `src/api/MyUglyRocks.Api/Controllers/InventorySourceController.cs` | API endpoints |
| `src/web/src/components/ui/url-input.tsx` | Reusable URL input |
| `src/web/src/hooks/use-inventory-sources.ts` | React Query hooks |
| `src/web/src/app/(protected)/inventory/sources/page.tsx` | Sources list page |
| `src/web/src/components/inventory/inventory-source-form.tsx` | Source form |
| `src/web/src/components/inventory/inventory-source-picker.tsx` | Source picker |

## Files to Modify

| File | Changes |
|------|---------|
| `src/api/MyUglyRocks.Core/Entities/Inventory.cs` | Update SourceType enum, add InventorySourceId, remove old fields |
| `src/api/MyUglyRocks.Core/Entities/InventorySpecimen.cs` | Add Status, StorageLocation, Url |
| `src/api/MyUglyRocks.Infrastructure/Data/Configurations/InventoryConfiguration.cs` | Update config |
| `src/api/MyUglyRocks.Abstractions/DTOs/InventoryDtos.cs` | Update DTOs |
| `src/api/MyUglyRocks.Infrastructure/Services/InventoryService.cs` | Update service |
| `src/api/MyUglyRocks.Api/Controllers/InventoryController.cs` | Update endpoints |
| `src/web/src/types/inventory.ts` | Update types |
| `src/web/src/lib/api.ts` | Add inventorySourceApi |
| `src/web/src/lib/query-keys.ts` | Add inventorySources keys |
| `src/web/src/hooks/use-inventory.ts` | Update for new fields |
| `src/web/src/app/(protected)/inventory/page.tsx` | Update list page |
| `src/web/src/app/(protected)/inventory/[id]/page.tsx` | Update detail page |
| `src/web/src/components/inventory/*` | Update forms and displays |

---

## Estimated Total Effort

| Phase | Hours |
|-------|-------|
| Phase 1: Backend Schema & Migration | 4-6 |
| Phase 2: Backend Services & API | 6-8 |
| Phase 3: Frontend - URL Component & Types | 2-3 |
| Phase 4: Frontend - InventorySource Management | 4-6 |
| Phase 5: Frontend - Update Inventory UI | 6-8 |
| Phase 6: Cleanup & Testing | 3-4 |
| **Total** | **25-35 hours** |

---

## Rollout Plan

1. **Development**
   - Implement all phases
   - Test with local data
   - Verify migration on copy of production data

2. **Staging/Pre-production**
   - Deploy to staging
   - Run migration
   - Verify all data migrated correctly
   - Test all functionality

3. **Production**
   - Take backup before deployment
   - Deploy during low-traffic period
   - Run migration
   - Verify data
   - Monitor for issues

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Backup before migration, keep old columns until verified |
| Breaking existing functionality | Phased approach, extensive testing |
| InventorySourceId null for old data | Make FK nullable initially, require for new records |
| Gift/Trade → Contact loses meaning | Add note during migration indicating original type |
