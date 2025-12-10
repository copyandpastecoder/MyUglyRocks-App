# Refactor: Rename `Id` to `{TableName}Id`

| Field | Value |
|-------|-------|
| Status | 📋 Planned |
| Created | 2025-12-09 |
| Related | [04-DATA-MODEL.md](../04-DATA-MODEL.md) |

## Overview

This plan documents the refactoring of all entity primary keys from `Id` to `{TableName}Id` to match the naming conventions defined in `04-DATA-MODEL.md`.

**Convention (from Data Model section 3.1):**
- **Primary Keys:** `{TableName}Id` (GUID) - e.g., `UserId`, `CycleId`, `PostId`
- **Foreign Keys:** `{ReferencedTable}Id` - same as PK of referenced table
- **Association Tables:** Composite PK of FKs, no separate `Id` column

**Approach:** Full rename throughout codebase. Database will be dropped and reseeded.

---

## Phase 1: Backend Entities

### 1.1 Base Entity Changes

**File:** `src/api/MyUglyRocks.Core/Entities/BaseEntity.cs`

| Current | Target | Notes |
|---------|--------|-------|
| `BaseEntity.Id` | REMOVE | Each entity defines its own `{TableName}Id` |
| `SoftDeletableEntity` inherits `Id` | REMOVE | Same - each entity defines own PK |
| `UserAuditedEntity` inherits `Id` | REMOVE | Same - each entity defines own PK |

**New approach:** Base classes provide audit fields only (`DateCreated`, `DateUpdated`), NOT the primary key. Each entity explicitly declares its own `{TableName}Id`.

### 1.2 Regular Entities (with their own PK)

| Entity | Current PK | Target PK | File |
|--------|------------|-----------|------|
| `User` | `Id` | `UserId` | `User.cs` |
| `UserSettings` | `Id` | `UserId` (1:1 with User) | `UserSettings.cs` |
| `UserSession` | `Id` | `UserSessionId` | `UserSession.cs` |
| `Cycle` | `Id` | `CycleId` | `Cycle.cs` |
| `StageRun` | `Id` | `StageRunId` | `StageRun.cs` |
| `CleaningRun` | `Id` | `CleaningRunId` | `CleaningRun.cs` |
| `Photo` | `Id` | `PhotoId` | `Photo.cs` |
| `Specimen` | `Id` | `SpecimenId` | `Specimen.cs` |
| `Material` | `Id` | `MaterialId` | `Material.cs` |
| `StageMaterial` | `Id` | `StageMaterialId` | `StageMaterial.cs` |
| `CleaningMaterial` | `Id` | `CleaningMaterialId` | `CleaningMaterial.cs` |
| `TumblerModel` | `Id` | `TumblerModelId` | `TumblerModel.cs` |
| `Tumbler` | `Id` | `TumblerId` | `Tumbler.cs` |
| `Barrel` | `Id` | `BarrelId` | `Barrel.cs` |
| `BarrelNickname` | `Id` | `BarrelNicknameId` | `BarrelNickname.cs` |
| `Post` | `Id` | `PostId` | `Post.cs` |
| `Comment` | `Id` | `CommentId` | `Comment.cs` |
| `CommentReport` | `Id` | `CommentReportId` | `CommentReport.cs` |
| `Vote` | `Id` | `VoteId` | `Vote.cs` |
| `RefreshToken` | `Id` | `RefreshTokenId` | `RefreshToken.cs` |
| `WaitlistEntry` | `Id` | `WaitlistEntryId` | `WaitlistEntry.cs` |

### 1.3 Association Tables (Composite PK, NO Id column)

These tables should NOT inherit from `BaseEntity` and should NOT have an `Id` column.

| Entity | Current | Target PK | File |
|--------|---------|-----------|------|
| `PostPhoto` | Has `Id` from BaseEntity | Composite: `PostId + PhotoId` | `PostPhoto.cs` |
| `CycleSpecimen` | Has `Id` from BaseEntity | Composite: `CycleId + SpecimenId` | `CycleSpecimen.cs` |
| `StageRunBarrel` | Has `Id` from BaseEntity | Composite: `StageRunId + BarrelId` | `StageRunBarrel.cs` |

**Changes for association tables:**
1. Remove inheritance from `BaseEntity`
2. Remove `Id` property
3. Keep `DateCreated` and `DateUpdated` as explicit properties
4. Configure composite PK in DbContext

---

## Phase 2: Backend DTOs

### 2.1 DTO Files to Update

**File:** `src/api/MyUglyRocks.Abstractions/DTOs/`

| DTO | Current PK | Target PK |
|-----|------------|-----------|
| `UserDto` | `Id` | `UserId` |
| `UserProfileDto` | `Id` | `UserId` |
| `CycleDto` | `Id` | `CycleId` |
| `CycleListDto` | `Id` | `CycleId` |
| `StageRunDto` | `Id` | `StageRunId` |
| `StageRunSummaryDto` | `Id` | `StageRunId` |
| `CleaningRunDto` | `Id` | `CleaningRunId` |
| `PhotoDto` | `Id` | `PhotoId` |
| `CyclePhotoDto` | `Id` | `PhotoId` |
| `SpecimenDto` | `Id` | `SpecimenId` |
| `MaterialDto` | `Id` | `MaterialId` |
| `StageMaterialDto` | `Id` | `StageMaterialId` |
| `CleaningMaterialDto` | `Id` | `CleaningMaterialId` |
| `TumblerDto` | `Id` | `TumblerId` |
| `TumblerListDto` | `Id` | `TumblerId` |
| `TumblerModelDto` | `Id` | `TumblerModelId` |
| `BarrelDto` | `Id` | `BarrelId` |
| `PostDto` | `Id` | `PostId` |
| `PostListDto` | `Id` | `PostId` |
| `PostAuthorDto` | `Id` | `UserId` |
| `PostPhotoDto` | `Id` | REMOVE - use `PostId` + `PhotoId` only |
| `CommentDto` | `Id` | `CommentId` |
| `CommentAuthorDto` | `Id` | `UserId` |
| `VoteDto` | `Id` | `VoteId` |
| `VoteCountDto` | `PostId` | No change (already correct) |
| `UserSettingsDto` | `Id` | `UserId` |
| `RefreshTokenDto` | `Id` | `RefreshTokenId` |

### 2.2 Request/Response DTOs

Check all Request DTOs - most should already use `{TableName}Id` for FKs but verify.

---

## Phase 3: EF Core Configuration

### 3.1 DbContext Model Configuration

**File:** `src/api/MyUglyRocks.Infrastructure/Data/AppDbContext.cs`

Update entity configurations:

```csharp
// Regular entities - configure new PK name
modelBuilder.Entity<User>().HasKey(u => u.UserId);
modelBuilder.Entity<Cycle>().HasKey(c => c.CycleId);
modelBuilder.Entity<Post>().HasKey(p => p.PostId);
// ... etc for all entities

// Association tables - configure composite PK
modelBuilder.Entity<PostPhoto>().HasKey(pp => new { pp.PostId, pp.PhotoId });
modelBuilder.Entity<CycleSpecimen>().HasKey(cs => new { cs.CycleId, cs.SpecimenId });
modelBuilder.Entity<StageRunBarrel>().HasKey(srb => new { srb.StageRunId, srb.BarrelId });
```

### 3.2 Relationship Configurations

Update any `.HasForeignKey()` calls if they reference `.Id`:
```csharp
// Before
.HasForeignKey(x => x.Post.Id)
// After
.HasForeignKey(x => x.PostId)
```

---

## Phase 4: Backend Services

### 4.1 Service Files to Update

All services that reference `.Id` on entities need updating.

| Service | File |
|---------|------|
| `AuthService` | `AuthService.cs` |
| `UserService` | `UserService.cs` |
| `CycleService` | `CycleService.cs` |
| `PostService` | `PostService.cs` |
| `TumblerService` | `TumblerService.cs` |
| `PhotoService` | `PhotoService.cs` |
| `MaterialService` | `MaterialService.cs` |
| `SpecimenService` | `SpecimenService.cs` |
| `NotificationService` | `NotificationService.cs` |
| `SettingsService` | `SettingsService.cs` |
| `CacheService` | `CacheService.cs` |
| `AdminService` | `AdminService.cs` |

**Pattern to find/replace in each service:**
- `entity.Id` → `entity.{EntityName}Id`
- `x => x.Id` → `x => x.{EntityName}Id`
- `new { id = entity.Id }` → `new { id = entity.{EntityName}Id }`

### 4.2 Mapping Configurations

**File:** `src/api/MyUglyRocks.Core/Mappings/MappingConfig.cs`

Update Mapster configurations if any explicitly map `Id`:
```csharp
// Before
.Map(dest => dest.Id, src => src.Id)
// After
.Map(dest => dest.PostId, src => src.PostId)
```

---

## Phase 5: Backend Controllers

### 5.1 Controller Files to Update

| Controller | File |
|------------|------|
| `AuthController` | `AuthController.cs` |
| `UsersController` | `UsersController.cs` |
| `CyclesController` | `CyclesController.cs` |
| `PostsController` | `PostsController.cs` |
| `TumblersController` | `TumblersController.cs` |
| `PhotosController` | `PhotosController.cs` |
| `MaterialsController` | `MaterialsController.cs` |
| `SpecimensController` | `SpecimensController.cs` |
| `AdminController` | `AdminController.cs` |

**Patterns to update:**
- Route parameters: `[HttpGet("{id:guid}")]` - keep as `id` in URL, but update internal references
- `CreatedAtAction(nameof(Get), new { id = entity.Id }, ...)` → `new { id = entity.{EntityName}Id }`
- Method parameters can stay as `Guid id` for brevity

---

## Phase 6: Frontend TypeScript Types

### 6.1 Type Definition Files

**Directory:** `src/web/src/types/`

| File | Types to Update |
|------|-----------------|
| `user.ts` | `UserDto.id` → `userId`, `UserProfileDto.id` → `userId` |
| `cycle.ts` | `CycleDto.id` → `cycleId`, `CycleListDto.id` → `cycleId`, `StageRunDto.id` → `stageRunId`, etc. |
| `post.ts` | `PostDto.id` → `postId`, `PostListDto.id` → `postId`, `CommentDto.id` → `commentId`, etc. |
| `tumbler.ts` | `TumblerDto.id` → `tumblerId`, `BarrelDto.id` → `barrelId`, etc. |
| `material.ts` | `MaterialDto.id` → `materialId` |
| `specimen.ts` | `SpecimenDto.id` → `specimenId` |
| `settings.ts` | `UserSettingsDto.id` → `userId` |

### 6.2 Pattern for Each Type

```typescript
// Before
export interface PostDto {
  id: string;
  userId: string;
  cycleId: string;
  // ...
}

// After
export interface PostDto {
  postId: string;
  userId: string;
  cycleId: string;
  // ...
}
```

---

## Phase 7: Frontend Components & Pages

### 7.1 Files to Update

Every file that accesses `.id` on a DTO needs updating. Use search to find all occurrences.

**Search patterns:**
- `\.id\b` - find all `.id` property accesses
- `\.id,` - find `.id` in destructuring or object literals
- `\.id}` - find `.id` in JSX expressions
- `\.id)` - find `.id` in function calls

**Common locations:**
- `src/web/src/app/**/*.tsx` - all page components
- `src/web/src/components/**/*.tsx` - all shared components
- `src/web/src/lib/api.ts` - API client functions
- `src/web/src/hooks/*.ts` - custom hooks

### 7.2 Example Changes

```tsx
// Before
{posts.map(post => (
  <PostCard key={post.id} post={post} />
))}

// After
{posts.map(post => (
  <PostCard key={post.postId} post={post} />
))}
```

```tsx
// Before
const handleClick = () => router.push(`/posts/${post.id}`);

// After
const handleClick = () => router.push(`/posts/${post.postId}`);
```

---

## Phase 8: Seed Data

### 8.1 Seed Data Files

**Directory:** `docs/seed-data/`

Update any JSON/CSV seed files that reference `Id` columns.

| File | Changes |
|------|---------|
| `specimens.json` | `id` → `specimenId` |
| `materials.json` | `id` → `materialId` |
| `tumbler-models.json` | `id` → `tumblerModelId` |
| `barrel-nicknames.json` | `id` → `barrelNicknameId` |

### 8.2 Seed Service

**File:** `src/api/MyUglyRocks.Infrastructure/Data/SeedDataService.cs`

Update entity creation to use new PK names.

---

## Execution Order

1. **Phase 1:** Update backend entities (start with `BaseEntity.cs`)
2. **Phase 2:** Update DTOs
3. **Phase 3:** Update DbContext configuration
4. **Phase 4:** Update services
5. **Phase 5:** Update controllers
6. **Phase 6:** Update frontend types
7. **Phase 7:** Update frontend components
8. **Phase 8:** Update seed data
9. **Build & Test:** Run `dotnet build` and `npm run build`
10. **Database:** Drop database and run migrations fresh
11. **Seed:** Re-seed data
12. **Verify:** Test application end-to-end

---

## Verification Checklist

- [ ] All entities have `{TableName}Id` as PK
- [ ] Association tables have composite PKs, no `Id` column
- [ ] All DTOs use `{TableName}Id` for their PK
- [ ] All services compile without errors
- [ ] All controllers compile without errors
- [ ] Frontend types match backend DTOs
- [ ] Frontend builds without errors
- [ ] Database can be created with new schema
- [ ] Seed data loads correctly
- [ ] Application runs end-to-end

---

## Notes

- URL route parameters can stay as `{id}` for REST convention - only internal code changes
- This is a breaking change - all API responses will use new property names
- Since DB is being dropped, no migration needed - just fresh schema
