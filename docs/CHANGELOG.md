# Changelog

All notable changes to this project will be documented in this file.

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
