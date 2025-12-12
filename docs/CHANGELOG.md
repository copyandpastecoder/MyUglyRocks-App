# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-12-12

### Fixed

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

### Added

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
