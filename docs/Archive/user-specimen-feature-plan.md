# User Specimen Feature Plan

## Implementation Status

> **Status: Code Complete - Migration Required**
>
> Last Updated: 2024-12-13

### Completed
- [x] Backend entity: `UserSpecimen` with soft delete support
- [x] EF Core configuration with indexes and query filters
- [x] DTOs: `UserSpecimenDto`, `UserSpecimenListDto`, `CreateUserSpecimenRequest`, `UpdateUserSpecimenRequest`
- [x] `IUserSpecimenService` interface and `UserSpecimenService` implementation
- [x] `UserSpecimensController` with all endpoints
- [x] Service registration in `Program.cs`
- [x] Updated `CycleSpecimen` entity to support both system and user specimens (XOR)
- [x] Updated `InventorySpecimen` entity to support both system and user specimens (XOR)
- [x] Updated `CycleService` to handle both specimen types in `CreateCycleAsync` and `GetCycleAsync`
- [x] Updated `CycleDtos` with `UserSpecimenIds` in request and `Source`/`UserId` in `SpecimenDto`
- [x] Frontend TypeScript types (`src/web/src/types/user-specimen.ts`)
- [x] API client functions (`userSpecimenApi` in `api.ts`)
- [x] Query keys and React Query hooks (`use-user-specimens.ts`)
- [x] Updated `specimen-multi-select.tsx` with grouped sections (Your Specimens / Reference Specimens)
- [x] My Specimens settings page (`/settings/specimens`)
- [x] Navigation link in settings layout (Gem icon)
- [x] Frontend `CreateCycleRequest` updated with `userSpecimenIds`

### TODO - Required Before Running
1. **Create EF Core Migration**:
   ```bash
   cd src/api/MyUglyRocks.Infrastructure
   dotnet ef migrations add AddInventoryAndUserSpecimen --startup-project ../MyUglyRocks.Api
   dotnet ef database update --startup-project ../MyUglyRocks.Api
   ```

   The migration will:
   - Create `user_specimens` table
   - Create `inventory`, `inventory_specimens`, `inventory_photos` tables
   - Add `cycle_specimen_id` column to `cycle_specimens` (new primary key)
   - Make `specimen_id` nullable in `cycle_specimens`
   - Add `user_specimen_id` column to `cycle_specimens`
   - Add XOR check constraints

### TODO - Future Enhancements (Not Critical)
- [ ] Quick add modal for inline specimen creation during cycle/inventory creation
- [ ] "Start from existing" feature to copy fields from system specimen
- [ ] Duplicate warning UX (warn if name matches system specimen)
- [ ] Combined search endpoint on `/api/specimens/search` (currently on `/api/user-specimens/search`)
- [ ] Seed data for demo user
- [ ] Update cycles/new page to use new specimen picker with user specimens

### Breaking Changes
- `CycleSpecimen` now uses `CycleSpecimenId` as primary key instead of composite key (`CycleId`, `SpecimenId`)
- `SpecimenId` in `CycleSpecimen` and `InventorySpecimen` is now nullable
- Existing cycle specimens will need the new `cycle_specimen_id` populated during migration

---

## Overview

Add a `UserSpecimen` table that mirrors the system `Specimen` table, allowing users to create their own custom specimen entries when the rock/mineral they have isn't in the reference data.

---

## Problem Statement

The current `Specimen` table is system-managed reference data (seeded from CSV). Users cannot add their own entries if:
- A rock type doesn't exist in the system
- They want to track a custom/local name
- They have a unique or rare specimen
- They prefer their own naming conventions

---

## Database Schema

### UserSpecimen Table

Mirrors the `Specimen` table structure with user ownership.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `user_specimen_id` | UUID | No | Primary key |
| `user_id` | UUID | No | FK to Users - owner of this specimen |
| `common_name` | VARCHAR(100) | No | User's name for this specimen |
| `scientific_name` | VARCHAR(100) | Yes | Scientific/geological name |
| `alias` | VARCHAR(255) | Yes | Alternative names, comma-separated |
| `rock_family` | VARCHAR(100) | Yes | Igneous, Sedimentary, Metamorphic, etc. |
| `species` | VARCHAR(100) | Yes | Mineral species |
| `variety` | VARCHAR(100) | Yes | Variety within species |
| `material_type` | ENUM | No | `Rock`, `Mineral`, `Glass`, `Fossil`, `Other` |
| `mohs_hardness_min` | DECIMAL(3,1) | Yes | Minimum Mohs hardness |
| `mohs_hardness_max` | DECIMAL(3,1) | Yes | Maximum Mohs hardness |
| `tumbling_difficulty` | ENUM | Yes | `Easy`, `Medium`, `Hard` |
| `recommended_grit_sequence` | VARCHAR(255) | Yes | Suggested grit progression |
| `special_considerations` | TEXT | Yes | Special handling notes |
| `notes` | TEXT | Yes | User's personal notes |
| `is_public` | BOOLEAN | No | Allow others to see this? (default: false) |
| `based_on_specimen_id` | UUID | Yes | FK to Specimens - if derived from system specimen |
| `is_deleted` | BOOLEAN | No | Soft delete flag (default: false) |
| `date_deleted` | TIMESTAMP | Yes | When soft deleted |
| `date_created` | TIMESTAMP | No | Audit field |
| `date_updated` | TIMESTAMP | No | Audit field |

**Notes:**
- `based_on_specimen_id` allows users to start from a system specimen and customize. Useful for regional variants or personal notes.
- Soft delete prevents orphaned references in CycleSpecimen and InventorySpecimen.

---

## Design Decisions

### 1. Separate Table vs. Adding `user_id` to Specimen

**Chosen: Separate Table**

| Approach | Pros | Cons |
|----------|------|------|
| Separate `UserSpecimen` table | Clean separation, system data stays pristine, easy permissions | Two tables to query |
| Add `user_id` to `Specimen` (null = system) | Single table, simpler queries | Mixes concerns, migration risk |

### 2. Union View for Querying

Create a database view or service-level union to query both tables together:

```sql
CREATE VIEW all_specimens AS
SELECT 
    specimen_id,
    NULL as user_id,
    common_name,
    scientific_name,
    -- ... other fields
    'system' as source
FROM specimens
UNION ALL
SELECT 
    user_specimen_id as specimen_id,
    user_id,
    common_name,
    scientific_name,
    -- ... other fields
    'user' as source
FROM user_specimens
WHERE user_id = :current_user_id OR is_public = true;
```

---

## Integration Points

### 1. Cycle Creation
When selecting specimens for a cycle, show:
- System specimens (from `Specimen` table)
- User's custom specimens (from `UserSpecimen` table)
- Optionally: Other users' public specimens

### 2. Inventory
When adding inventory, allow selecting from both system and user specimens.

### 3. CycleSpecimen Junction Table
Currently references `specimen_id`. Options:
- **Option A**: Add `user_specimen_id` column (nullable, one or the other)
- **Option B**: Create polymorphic reference with `specimen_type` enum
- **Option C**: Use the union view and store IDs with a type prefix

**Recommended: Option A** - Add nullable `user_specimen_id` with check constraint.

```sql
ALTER TABLE cycle_specimens
ADD COLUMN user_specimen_id UUID REFERENCES user_specimens(user_specimen_id);

-- Ensure exactly one is set
ALTER TABLE cycle_specimens
ADD CONSTRAINT chk_specimen_reference
CHECK (
    (specimen_id IS NOT NULL AND user_specimen_id IS NULL) OR
    (specimen_id IS NULL AND user_specimen_id IS NOT NULL)
);
```

### 4. InventorySpecimen Junction Table
Same treatment as CycleSpecimen - needs `user_specimen_id` column:

```sql
ALTER TABLE inventory_specimens
ADD COLUMN user_specimen_id UUID REFERENCES user_specimens(user_specimen_id);

-- Make specimen_id nullable
ALTER TABLE inventory_specimens
ALTER COLUMN specimen_id DROP NOT NULL;

-- Ensure exactly one is set
ALTER TABLE inventory_specimens
ADD CONSTRAINT chk_inventory_specimen_reference
CHECK (
    (specimen_id IS NOT NULL AND user_specimen_id IS NULL) OR
    (specimen_id IS NULL AND user_specimen_id IS NOT NULL)
);
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user-specimens` | List current user's custom specimens (paginated) |
| GET | `/api/user-specimens/:id` | Get single user specimen |
| POST | `/api/user-specimens` | Create custom specimen |
| PUT | `/api/user-specimens/:id` | Update custom specimen |
| DELETE | `/api/user-specimens/:id` | Soft delete custom specimen |
| GET | `/api/specimens/search` | Combined search (system + user's + public) |

**Query Parameters for GET `/api/user-specimens`:**
- `search` - Search by common_name (case-insensitive contains)
- `materialType` - Filter by material type
- `sortBy` - Sort field (commonName, dateCreated)
- `sortOrder` - asc/desc
- `skip` / `take` - Pagination (default: 0, 20)

**Query Parameters for GET `/api/specimens/search`:**
- `search` - Search term (searches common_name, scientific_name, alias)
- `includePublic` - Include other users' public specimens (default: true)
- `skip` / `take` - Pagination (default: 0, 50)

---

## DTOs

```csharp
public record UserSpecimenDto(
    Guid UserSpecimenId,
    Guid UserId,
    string CommonName,
    string? ScientificName,
    string? Alias,
    string? RockFamily,
    string? Species,
    string? Variety,
    string MaterialType,
    decimal? MohsHardnessMin,
    decimal? MohsHardnessMax,
    string? TumblingDifficulty,
    string? RecommendedGritSequence,
    string? SpecialConsiderations,
    string? Notes,
    bool IsPublic,
    DateTime DateCreated
);

public record CreateUserSpecimenRequest(
    [Required] string CommonName,
    string? ScientificName,
    string? Alias,
    string? RockFamily,
    string? Species,
    string? Variety,
    string MaterialType = "Rock",
    decimal? MohsHardnessMin,
    decimal? MohsHardnessMax,
    string? TumblingDifficulty,
    string? RecommendedGritSequence,
    string? SpecialConsiderations,
    string? Notes,
    bool IsPublic = false
);

// Combined DTO for UI dropdowns/pickers
public record SpecimenOptionDto(
    Guid Id,
    string CommonName,
    string? ScientificName,
    string? TumblingDifficulty,
    string Source,  // "system" or "user"
    bool IsOwned,   // true if user created it
    Guid? BasedOnSpecimenId  // if derived from system specimen
);
```

---

## UI Changes

### 1. Specimen Picker Component (Used in Cycle Create, Inventory)
Update the specimen picker used in `/cycles/new` and `/inventory/new` to:
- Show grouped sections: "Your Specimens" (if any) and "Reference Specimens"
- Add "+ Add Custom Specimen" button at top of dropdown
- Display source indicator badge (system vs custom)
- Show tumbling difficulty in picker for quick reference
- Search searches both system and user specimens

### 2. New Page: My Specimens (`/settings/specimens`)
- List user's custom specimens with search/filter
- Add/Edit/Delete actions
- Toggle public visibility switch
- Show "Based on" link if derived from system specimen
- Empty state with "Create your first custom specimen" CTA

### 3. Quick Add Modal (Inline Creation)
When creating a cycle/inventory and specimen not found:
- "Can't find your rock? Add it" link below search
- Opens modal to quickly create UserSpecimen
- Optional: "Start from existing" dropdown to copy fields from system specimen
- Returns to picker with new specimen auto-selected
- Minimal fields: common_name (required), material_type, mohs range, difficulty

### 4. Cycle Create Page (`/cycles/new`)
- Specimen picker shows combined list (system + user specimens)
- User specimens appear first with "Custom" badge
- "Add custom specimen" link inline if search returns no results
- Selected specimens show source indicator

---

## Future Enhancements

1. **Submit to System**: Allow users to request their specimen be added to the system reference data
2. **Merge Duplicates**: Admin tool to merge user specimens into system when appropriate
3. **Community Specimens**: Browse and copy other users' public specimens
4. **AI Identification**: Upload a photo, get suggested specimen match

---

## Implementation Order

### Phase 1: Backend Foundation
1. Database migration (UserSpecimen table with soft delete)
2. Entity class and EF Core configuration
3. DTOs (UserSpecimenDto, CreateUserSpecimenRequest, SpecimenOptionDto)
4. UserSpecimenService with CRUD operations
5. UserSpecimenController with endpoints
6. Update SpecimenService to include combined search endpoint

### Phase 2: Junction Table Updates
7. Migration: Add `user_specimen_id` to CycleSpecimen with XOR constraint
8. Migration: Add `user_specimen_id` to InventorySpecimen with XOR constraint
9. Update CycleSpecimen entity and service to handle both specimen types
10. Update InventorySpecimen entity and service to handle both specimen types

### Phase 3: Frontend - Specimen Picker
11. TypeScript types for UserSpecimen
12. API client functions (`userSpecimenApi.ts`)
13. React Query hooks (`useUserSpecimens`, `useCreateUserSpecimen`, etc.)
14. Update specimen picker component with grouped sections
15. Quick add modal for inline specimen creation

### Phase 4: Frontend - Management Page
16. My Specimens page (`/settings/specimens`)
17. Add/Edit specimen forms
18. Navigation link in settings

### Phase 5: Integration & Polish
19. Update cycle creation to use new picker
20. Update inventory creation to use new picker
21. Duplicate warning UX (warn if name matches system specimen)
22. Seed data for demo user

---

## Validation Rules

| Field | Rule |
|-------|------|
| `common_name` | Required, 1-100 chars, unique per user (case-insensitive) |
| `scientific_name` | Optional, 1-100 chars |
| `material_type` | Required, valid enum value |
| `mohs_hardness_min` | Optional, 1.0-10.0 |
| `mohs_hardness_max` | Optional, 1.0-10.0, must be >= min if both set |
| `tumbling_difficulty` | Optional, valid enum (Easy, Medium, Hard) |

**Duplicate Warning**: When creating, check if `common_name` matches a system specimen. If so, show warning: "A specimen named '{name}' already exists in the reference data. Are you sure you want to create a custom version?" Allow but warn.

---

## Migration SQL Preview

```sql
-- Create UserSpecimen table
CREATE TABLE user_specimens (
    user_specimen_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    common_name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(100),
    alias VARCHAR(255),
    rock_family VARCHAR(100),
    species VARCHAR(100),
    variety VARCHAR(100),
    material_type INTEGER NOT NULL DEFAULT 0,
    mohs_hardness_min DECIMAL(3,1),
    mohs_hardness_max DECIMAL(3,1),
    tumbling_difficulty INTEGER,
    recommended_grit_sequence VARCHAR(255),
    special_considerations TEXT,
    notes TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    based_on_specimen_id UUID REFERENCES specimens(specimen_id),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    date_deleted TIMESTAMP,
    date_created TIMESTAMP NOT NULL DEFAULT now(),
    date_updated TIMESTAMP NOT NULL DEFAULT now()
);

-- Index for user lookup (excludes deleted)
CREATE INDEX idx_user_specimens_user_id ON user_specimens(user_id) WHERE is_deleted = false;

-- Index for public specimens (excludes deleted)
CREATE INDEX idx_user_specimens_public ON user_specimens(is_public) WHERE is_public = true AND is_deleted = false;

-- Index for name search
CREATE INDEX idx_user_specimens_common_name ON user_specimens(user_id, lower(common_name)) WHERE is_deleted = false;

-- Update CycleSpecimen to allow user specimens
ALTER TABLE cycle_specimens
ADD COLUMN user_specimen_id UUID REFERENCES user_specimens(user_specimen_id);

-- Make specimen_id nullable
ALTER TABLE cycle_specimens
ALTER COLUMN specimen_id DROP NOT NULL;

-- Add constraint: exactly one must be set
ALTER TABLE cycle_specimens
ADD CONSTRAINT chk_specimen_xor_user_specimen
CHECK (
    (specimen_id IS NOT NULL AND user_specimen_id IS NULL) OR
    (specimen_id IS NULL AND user_specimen_id IS NOT NULL)
);

-- Update InventorySpecimen to allow user specimens (when Inventory feature is built)
ALTER TABLE inventory_specimens
ADD COLUMN user_specimen_id UUID REFERENCES user_specimens(user_specimen_id);

ALTER TABLE inventory_specimens
ALTER COLUMN specimen_id DROP NOT NULL;

ALTER TABLE inventory_specimens
ADD CONSTRAINT chk_inventory_specimen_xor_user_specimen
CHECK (
    (specimen_id IS NOT NULL AND user_specimen_id IS NULL) OR
    (specimen_id IS NULL AND user_specimen_id IS NOT NULL)
);
```
