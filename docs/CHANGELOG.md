# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-12-15

### Added

#### Full Edit Stage Modal
- **Feature**: Edit Stage modal now has all the same fields as Create Stage modal
- **New Shared Components** in `src/web/src/components/stage/`:
  - `StageNameSelector` - Stage name buttons with custom name input
  - `BarrelSelector` - Barrel selection checkboxes
  - `StageMaterialsSection` - Materials management with add/remove
  - `CleaningRunSection` - Cleaning run config with duration, purpose, materials
  - `StageAdvancedOptions` - Weight before, fill level, water amount
  - `ReminderSettings` - Reminder checkbox with afterDays/atEnd options
- **Edit Stage Modal now includes**:
  - Barrel selection (change which barrels the stage uses)
  - Start date/time editing
  - Materials section (add/remove/edit materials)
  - Reminder settings
  - Cleaning run configuration
  - Advanced options (weight before, fill level, water)
  - Plus existing quality/results fields (rating, issues, weight after, etc.)

#### Individual Specimen Weights in Inventory
- **Feature**: Inventory items can now track individual weights per specimen instead of just batch weight
- **Files**:
  - [SpecimenWeightTable.tsx](../src/web/src/components/specimen-weight-table.tsx) - New component for managing specimen weights
  - [inventory/new/page.tsx](../src/web/src/app/(protected)/inventory/new/page.tsx) - Toggle for individual weight tracking mode
  - [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx) - Edit page support for individual weights
  - [inventory.ts](../src/web/src/types/inventory.ts) - Added `weightGrams` to `InventorySpecimenDto`
- **UX**: Toggle switch "Track weight per specimen" enables table view with weight inputs
- **Calculation**: Total weight auto-calculates from individual specimen weights
- **Unit conversion**: Weights stored in grams, displayed in user's preferred unit (lbs/kg)

### Fixed

#### Mobile Bottom Navigation Missing Inventory
- **Problem**: Inventory was not accessible from the mobile bottom navigation bar, only from the desktop sidebar
- **Fix**: Added Inventory to the default navigation items in mobile-nav.tsx
- **File**: [mobile-nav.tsx](../src/web/src/components/ui/mobile-nav.tsx) - Added `{ label: 'Inventory', href: '/inventory', icon: Package }`

#### Cycle Creation Failing with Custom Specimens Only
- **Problem**: Creating a new cycle with only custom/user specimens (no system specimens) failed with a 400 error
- **Root Cause**: All specimen IDs were being sent to the `specimenIds` field, but user specimens must use the separate `userSpecimenIds` field
- **Fix**: Separated specimen IDs by source type (`item.source === 'system'` vs `'user'`) before sending to API
- **File**: [cycles/new/page.tsx](../src/web/src/app/(protected)/cycles/new/page.tsx)
- **Related**: Updated to use `useSpecimenSearch` hook for cycle name generation to include user specimens

#### recharts Formatter Type Compatibility
- **Problem**: TypeScript build failed after npm dependency update - recharts `Formatter` type changed to expect `value: number | undefined`
- **Fix**: Updated formatters in cycle-stats-chart.tsx to handle undefined values using `value ?? 0` or `Number(value) || 0`
- **File**: [cycle-stats-chart.tsx](../src/web/src/components/ui/cycle-stats-chart.tsx)

---

## [Unreleased] - 2025-12-14

### Added

#### Share Inventory to Gallery
- **Feature**: Inventory items can now be shared to the gallery, similar to cycles
- **Files**:
  - [Post.cs](../src/api/MyUglyRocks.Core/Entities/Post.cs) - Added nullable `InventoryId` with XOR constraint (CycleId OR InventoryId)
  - [PostDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/PostDtos.cs) - Added `InventoryPreviewDto`, `postType` field
  - [PostService.cs](../src/api/MyUglyRocks.Core/Services/PostService.cs) - Handle inventory posts, map inventory photos
  - [SocialConfiguration.cs](../src/api/MyUglyRocks.Infrastructure/Data/Configurations/SocialConfiguration.cs) - FK and constraint
  - [inventory/[id]/share/page.tsx](../src/web/src/app/(protected)/inventory/[id]/share/page.tsx) - New share page
  - [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx) - Added "Share to Gallery" button
  - [gallery/page.tsx](../src/web/src/app/(protected)/gallery/page.tsx) - Handle both post types
  - [gallery/[id]/page.tsx](../src/web/src/app/(protected)/gallery/[id]/page.tsx) - Display inventory info
- **Display**: Gallery inventory cards show Name, Source Type, Specimens, and Size

### Changed

#### Inventory Size Categories Updated
- **Change**: Replaced old size categories with new inch-based ranges
- **Old Values**: Mini, Small, Medium, Large, ExtraLarge, Fist, DoubleFist, Mixed, Assorted
- **New Values**: 0-1", 1"-2", 2"-3", 3"-4", 4"-5", Greater than 5", Assorted
- **Files**:
  - [Inventory.cs](../src/api/MyUglyRocks.Core/Entities/Inventory.cs) - Backend enum
  - [inventory.ts](../src/web/src/types/inventory.ts) - Frontend type
  - [inventory/new/page.tsx](../src/web/src/app/(protected)/inventory/new/page.tsx) - New form options
  - [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx) - Edit form options
  - [utils.ts](../src/web/src/lib/utils.ts) - Added `formatSizeCategories()` helper for display
  - [gallery/page.tsx](../src/web/src/app/(protected)/gallery/page.tsx) - Use display helper
  - [gallery/[id]/page.tsx](../src/web/src/app/(protected)/gallery/[id]/page.tsx) - Use display helper
- **Migration**: [20251214035413_UpdateSizeCategories.cs](../src/api/MyUglyRocks.Infrastructure/Migrations/20251214035413_UpdateSizeCategories.cs) - Updates existing data

### Fixed

#### Cycle Creation 400 Error
- **Problem**: Creating a new cycle at `/cycles/new` returned HTTP 400 error, but the cycle was actually created (visible on refresh)
- **Root Cause**: `CreatedAtAction` in CyclesController used `id` instead of the correct route parameter names. ASP.NET threw "No route matches the supplied values" when generating the Location header.
- **Fix**: Updated all `CreatedAtAction` calls in CyclesController to use correct route parameter names:
  - `CreateCycle`: `id` → `cycleId`
  - `AddStageRun`: `id` → `stageRunId`
  - `AddCleaningRun`: `id` → `stageRunId`
  - `AddStageMaterial`: `id` → `stageRunId`
- **File**: [CyclesController.cs](../src/api/MyUglyRocks.Api/Controllers/CyclesController.cs) - Lines 58, 126, 201, 247

#### Tumbler Creation 400 Error
- **Problem**: Creating a new tumbler returned HTTP 400 error, but the tumbler was actually created (visible on refresh)
- **Root Cause**: `CreatedAtAction` in TumblersController used `id` instead of `tumblerId` for the route parameter
- **Fix**: Changed `new { id = tumbler.TumblerId }` to `new { tumblerId = tumbler.TumblerId }`
- **File**: [TumblersController.cs](../src/api/MyUglyRocks.Api/Controllers/TumblersController.cs) - Lines 58, 103

#### BlurHash Validation Error in Gallery
- **Problem**: Gallery threw "blurhash length mismatch" error when viewing inventory posts
- **Root Cause**: Some inventory photos had base64 data URIs stored in the blurHash field instead of proper blurhash strings
- **Fix**: Added validation to detect and handle both formats
- **File**: [enhanced-image.tsx](../src/web/src/components/ui/enhanced-image.tsx)
  - Added `isValidBlurhash()` function to detect proper blurhash vs data URI
  - Renders `<Blurhash>` component for valid blurhash strings
  - Renders blurred `<img>` for data URIs
  - Falls back to animated pulse placeholder when neither is available

#### Inventory Photos Not Showing in Gallery
- **Problem**: Inventory posts in gallery showed no photos even when inventory had photos
- **Root Cause**: PostService was looking for photos in `PostPhoto` table (which links to cycle `Photo`) instead of `InventoryPhoto`
- **Fix**: Modified `MapToListDto` and `MapToDto` in PostService to use `Inventory.InventoryPhotos` when post is an inventory type
- **File**: [PostService.cs](../src/api/MyUglyRocks.Core/Services/PostService.cs)

#### Share Button Condition
- **Problem**: "Share to Gallery" button only appeared when inventory had completed photos
- **Fix**: Changed condition from `photos.some(p => p.processingStatus === 'Completed')` to `photos.length > 0`
- **File**: [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx)

---

## [Unreleased] - 2025-12-12

### Fixed

#### Stage Runs Ordering
- **Problem**: Stage runs on cycle detail pages were ordered by `DateCreated` (database record creation time) instead of `StartDateTime` (when the stage actually started). This caused stages to appear out of order if they were created in the database in a different order than they were started.
- **Fix**: Changed all stage run ordering in [CycleService.cs](../src/api/MyUglyRocks.Core/Services/CycleService.cs) from `.OrderBy(s => s.DateCreated)` to `.OrderBy(s => s.StartDateTime)`:
  - Stage run summaries (line 113)
  - Run number calculation (lines 88, 94)
  - Weight loss calculation - first/last stage lookups (lines 155, 158)
  - Most recent stage lookup (line 177)

#### Share Page Photos Not Showing
- **Problem**: The share page at `/cycles/{id}/share` showed "No Photos Available" even when photos existed. The frontend filters photos by `processingStatus === 'Completed'`, but this field was missing from the API response.
- **Fix**: Added `ProcessingStatus` field to `CyclePhotoDto` in [CycleDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs:366-385) and updated the mapping in [CycleService.cs](../src/api/MyUglyRocks.Core/Services/CycleService.cs) to include `p.ProcessingStatus.ToString()`.

#### Stage Status Bug (EF Core Default Value Issue)
- **Problem**: Stage runs in the database all had `status=1` (Active) even when they should be Planned or Completed. The UI showed all stages as "Active" regardless of their actual dates.
- **Root Cause**: EF Core's `.HasDefaultValue(StageRunStatus.Active)` in entity configuration caused issues. When seeding data with `Status = StageRunStatus.Planned` (enum value 0, which is the CLR default), EF Core interpreted it as "use database default" and skipped including the value in the INSERT statement.
- **Fix**: Removed `.HasDefaultValue()` from status properties in [CycleConfiguration.cs](../src/api/MyUglyRocks.Infrastructure/Data/Configurations/CycleConfiguration.cs) for:
  - `Cycle.Status`
  - `StageRun.Status`
  - `CleaningRun.Status`
- **Migration**: Fresh migration created after deleting existing migrations. Database dropped and recreated.

#### Rate Limiting (429 Errors)
- **Problem**: Users were hitting 429 Too Many Requests errors during normal app usage. A single cycle detail page makes ~20 requests (one per stage for photos, plus other data).
- **Fix**: Increased rate limits in [Program.cs](../src/api/MyUglyRocks.Api/Program.cs):
  - General API: 100/min → **600/min** per user
  - Intensive operations: 10/min → **30/min** per user
- **Note**: Rate limiter was also reordered to run AFTER authentication so it partitions by user ID, not IP.

### Optimized

#### Photo Loading (N+1 Request Problem)
- **Problem**: `cycle-photos.tsx` made N separate API requests (one per stage) to fetch photos, causing excessive network traffic and potential rate limit issues.
- **Solution**: Changed to use the existing `/api/cycles/{cycleId}/photos` endpoint which returns ALL photos for a cycle in a single request.
- **Files Changed**: [cycle-photos.tsx](../src/web/src/components/cycle-photos.tsx)
  - Import changed from `photosApi` to `cycleApi`
  - Query now calls `cycleApi.getPhotos(cycleId)` instead of mapping over stages
  - Type changed from `PhotoDto` to `CyclePhotoDto` (which includes stage context)
- **Impact**: For a cycle with 10 stages, reduces photo requests from 10 to 1.

### Changed

#### Tumbler Settings Expanded by Default
- **Change**: The "Tumbler Settings" collapsible section on the tumbler detail page (`/tumblers/{id}`) now opens expanded by default.
- **File**: [tumblers/[id]/page.tsx](../src/web/src/app/(protected)/tumblers/[id]/page.tsx)
- **Rationale**: Users visiting the tumbler page typically want to see or edit settings, so expanding by default reduces clicks.

#### Mobile Cycle Detail Card Layout
- **Change**: Made the cycle detail card header on `/cycles/[id]` more compact on mobile
- **File**: [cycles/[id]/page.tsx](../src/web/src/app/(protected)/cycles/[id]/page.tsx)
- **Details**:
  - Changed from vertical stacked layout to single horizontal row
  - Reduced padding to `py-3 px-4`
  - Title is `text-base` on mobile, stats are `text-xs`
  - Title truncates instead of wrapping on long names
  - Edit button changed to ghost icon-only style
  - Chevron moved to end after action buttons

#### Dashboard Cycles Match /cycles Page
- **Change**: The "Active Cycles" section on Dashboard now matches the `/cycles` page behavior
- **Files**: [dashboard/page.tsx](../src/web/src/app/(protected)/dashboard/page.tsx)
- **Details**:
  - Same hover effects (`hover:shadow-sm hover:-translate-y-0.5`)
  - Name truncation with `truncate` class
  - Dropdown menu with View/Edit, Complete Cycle, and Delete options
  - Stage progress text showing "X days overdue", "Day X of Y", or "Due Today"
  - Shows total stage count instead of just active stages
  - Delete confirmation dialog

### Added

#### Gallery Cycle Card with Full Details
- **Feature**: Gallery post detail page now shows a collapsible cycle card with full cycle information
- **Files**:
  - [gallery/[id]/page.tsx](../src/web/src/app/(protected)/gallery/[id]/page.tsx) - Frontend component
  - [PostService.cs](../src/api/MyUglyRocks.Core/Services/PostService.cs) - Extended query and mapping
  - [PostDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/PostDtos.cs) - Extended `CyclePreviewDto`
  - [post.ts](../src/web/src/types/post.ts) - TypeScript types
- **Details**:
  - Extended `CyclePreviewDto` with new fields: `elapsedDays`, `totalRuntimeHours`, `photoCount`, `tumblerName`, `barrelName`, `specimenNames`
  - Card shows: Started/Completed dates, Total Runtime, Specimens, Difficulty, Photos count, Equipment, Gallery likes
  - Collapsible card starts collapsed by default
  - Header shows status badge, cycle name, day count, stage count, and quality rating

#### Tumbler/Barrel Info on Cycle Cards
- **Feature**: Cycle cards on `/cycles` and `/dashboard` now show the active tumbler and barrel
- **Files**:
  - [CycleDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs) - Added `ActiveTumblerName`, `ActiveBarrelNumber`, `ActiveBarrelNickname` to `CycleListDto`
  - [CycleService.cs](../src/api/MyUglyRocks.Core/Services/CycleService.cs) - New `MapToCycleListDto` method with barrel/tumbler lookup
  - [cycle.ts](../src/web/src/types/cycle.ts) - TypeScript types
  - [cycles/page.tsx](../src/web/src/app/(protected)/cycles/page.tsx) - Display logic
  - [dashboard/page.tsx](../src/web/src/app/(protected)/dashboard/page.tsx) - Display logic
- **Display Format**: `{TumblerBrand} {TumblerModel} · #{BarrelNumber} {BarrelNickname}`
- **Logic**: Shows tumbler/barrel from most recent active stage, or most recent completed stage if no active stages

#### Demo Photo Seeding Script (Wrangler)
- **File**: [scripts/seed-photos-wrangler.ps1](../scripts/seed-photos-wrangler.ps1)
- **Purpose**: Upload demo photos to R2 storage and insert corresponding database records for the demo user
- **Features**:
  - Uses `wrangler r2 object put` for R2 uploads (no API credentials needed, uses OAuth)
  - Connects to PostgreSQL via `kubectl exec` (no port-forward needed)
  - Seeds 1-2 photos per eligible stage run (~200+ photos total)
  - Photo types: "Before" for Coarse stages, "During" for Fine stages, "After" for Polish stages
  - Deterministic randomization (seed=42) for reproducibility
  - Cleanup-only mode: `-CleanupPhotosOnly`
- **Prerequisites**:
  - `wrangler login` (OAuth authentication)
  - Photo folders at `D:\DemoRockPhotos\Before` and `D:\DemoRockPhotos\After`
  - Postgres pod running in K8s
- **Usage**:
  ```powershell
  .\scripts\seed-photos-wrangler.ps1              # Full seed (cleanup + upload)
  .\scripts\seed-photos-wrangler.ps1 -CleanupPhotosOnly  # Just delete existing demo photos
  ```

#### Quick Restart Script
- **File**: [scripts/restart-apps.ps1](../scripts/restart-apps.ps1)
- **Purpose**: Quickly restart API and Web deployments in Kubernetes
- **Features**:
  - Scales down deployments to 0, then back up to 1
  - Optionally rebuilds Docker images (`-RebuildImages`)
  - Starts PostgreSQL port-forward for DataGrip access (`localhost:5432`)
  - Skip options: `-SkipApi`, `-SkipWeb`, `-NoPortForward`
- **Usage**:
  ```powershell
  .\scripts\restart-apps.ps1                    # Restart both, start DB port-forward
  .\scripts\restart-apps.ps1 -SkipWeb          # Restart only API
  .\scripts\restart-apps.ps1 -RebuildImages    # Rebuild images first
  .\scripts\restart-apps.ps1 -NoPortForward    # Don't start DB port-forward
  ```

### Documentation

#### CLAUDE.md Updates
- Added "Quick Restart Script" section documenting the new restart script and its options

---

## Technical Notes

### EF Core Enum Default Value Behavior

When using `.HasDefaultValue()` with enums in EF Core, be aware:
- If the C# default value for an enum (value 0) matches what you're trying to set, EF Core may skip it
- EF Core uses "sentinel values" to detect when to apply database defaults
- For enums where you need to explicitly set the 0 value (like `Planned = 0`), don't use `.HasDefaultValue()`
- Instead, set defaults in the entity class itself

### Rate Limiting Best Practices

Current configuration:
- Sliding window rate limiter (smoother than fixed window)
- 600 requests/minute for general API (10 requests/second burst OK)
- 30 requests/minute for intensive operations (uploads, exports)
- Partitioned by authenticated user ID (falls back to IP for anonymous)
- 6 segments per window (10-second resolution)

### Cloudflare R2 Free Tier (Reference)

| Resource | Free Monthly Limit |
|----------|-------------------|
| Storage | 10 GB |
| Class A (writes) | 1 million |
| Class B (reads) | 10 million |
| Egress | Unlimited (free) |
