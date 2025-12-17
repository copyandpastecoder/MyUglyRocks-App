# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-12-17

### Added

#### AI-Powered Specimen Lookup
- **Feature**: Users can look up rock/mineral specimens using Google Gemini AI when creating custom specimens
- **AI Model**: Uses `gemini-2.5-flash` with structured JSON schema output
- **Confidence Score**: AI provides a 0-100% confidence score and indicates if it's a "known specimen" in its database
- **Data Persistence**: Confidence score and known specimen flag are saved to the UserSpecimen table for later viewing
- **Backend Files**:
  - [IGeminiService.cs](../src/api/MyUglyRocks.Abstractions/Interfaces/IGeminiService.cs) - Service interface
  - [GeminiService.cs](../src/api/MyUglyRocks.Infrastructure/Services/GeminiService.cs) - Gemini API integration with structured prompts
  - [GeminiConfiguration.cs](../src/api/MyUglyRocks.Infrastructure/Configuration/GeminiConfiguration.cs) - Configuration model
  - [UserSpecimen.cs](../src/api/MyUglyRocks.Core/Entities/UserSpecimen.cs) - Added `AiConfidenceScore` and `AiIsKnownSpecimen` fields
  - [UserSpecimenDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/UserSpecimenDtos.cs) - Added AI fields to all DTOs
  - [UserSpecimenService.cs](../src/api/MyUglyRocks.Core/Services/UserSpecimenService.cs) - Updated to handle AI fields
- **Frontend Files**:
  - [user-specimen.ts](../src/web/src/types/user-specimen.ts) - Added TypeScript types for AI fields
  - [add-custom-specimen-dialog.tsx](../src/web/src/components/add-custom-specimen-dialog.tsx) - AI lookup UI with collapsible source info section
  - [admin/specimens/page.tsx](../src/web/src/app/(protected)/admin/specimens/page.tsx) - Added AI lookup to admin specimen creation
- **Database Migration**: `20251217_AddUserSpecimenAiFields` adds nullable columns for AI metadata
- **API Endpoints**:
  - `POST /api/user-specimens/lookup` - AI-powered specimen lookup
- **UI Flow**:
  1. User enters specimen name and optionally source info (URL, name, description)
  2. Clicks "Lookup with AI" button
  3. AI returns populated form fields with confidence indicator
  4. User reviews, adjusts if needed, and saves
  5. Confidence score is persisted and visible on user's specimens list

#### Shared AddCustomSpecimenDialog Component
- **Feature**: Consolidated duplicate "Add Custom Specimen" dialog code into a single reusable component
- **File**: [add-custom-specimen-dialog.tsx](../src/web/src/components/add-custom-specimen-dialog.tsx)
- **Usage**: Used by both `/settings/specimens` and `/cycles/new` pages
- **Benefits**:
  - Single source of truth for specimen creation UI
  - AI lookup functionality available everywhere specimens can be created
  - Consistent form validation and user experience

#### Specimen Removal from Cycles
- **Feature**: Users can now remove specimens from a cycle when editing (clicking X on specimen badges)
- **Problem Solved**: Previously, removing a specimen in the Edit Cycle dialog didn't persist - the specimen would reappear when reopening the dialog
- **Backend Files**:
  - [CycleDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs) - Added `RemovedSpecimenIds`, `RemovedUserSpecimenIds`, `RemovedInventorySpecimenIds` to `UpdateCycleRequest`
  - [CycleDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs) - Added `InventorySpecimenId` to `SpecimenDto` for tracking inventory-linked specimens
  - [CycleService.cs](../src/api/MyUglyRocks.Core/Services/CycleService.cs) - Added removal logic in `UpdateCycleAsync` to remove CycleSpecimens and restore InventorySpecimen status to Available
- **Frontend Files**:
  - [cycle.ts](../src/web/src/types/cycle.ts) - Added `removedSpecimenIds`, `removedUserSpecimenIds`, `removedInventorySpecimenIds` to `UpdateCycleRequest`, added `inventorySpecimenId` to `SpecimenDto`
  - [cycle-form-dialog.tsx](../src/web/src/components/cycle-form-dialog.tsx) - Added `originalSpecimenItems` state to track original specimens on dialog open, calculates removed specimens by comparing original vs current selection
- **Behavior**:
  - Tracks original specimen selection when opening edit dialog
  - Compares current selection to original to identify removed specimens
  - Sends removed specimen IDs to API categorized by type (system, user, inventory)
  - When inventory specimens are removed, their status is restored to "Available" if it was "InUse"

### Fixed

#### Inventory Specimen Filter Shows InUse Specimens
- **Problem**: When selecting specimens from inventory in cycle creation/edit, only specimens with status "Available" were shown. Specimens with status "InUse" (already used in other cycles) were hidden.
- **Expected Behavior**: Show both "Available" and "InUse" specimens, only hide "Depleted" specimens
- **Fix**: Changed filter from `s.status === 'Available'` to `s.status !== 'Depleted'`
- **File**: [use-available-inventory-specimens.ts](../src/web/src/hooks/use-available-inventory-specimens.ts)
  - Line 42: Changed `inv.availableCount > 0` to `(inv.availableCount + inv.inUseCount) > 0`
  - Line 60: Changed `s.status === 'Available'` to `s.status !== 'Depleted'`
- **Updated**: Empty state message changed from "Only specimens with 'Available' status are shown." to "Depleted specimens are hidden."

#### Hardness Warning Now Informational
- **Problem**: The hardness difference warning in specimen selection was styled as a destructive/error alert (red), implying the user couldn't save
- **Fix**: Changed `variant="destructive"` to `variant="warning"` (yellow) to indicate it's informational, not blocking
- **File**: [specimen-multi-select.tsx](../src/web/src/components/specimen-multi-select.tsx) - Line 747

---

## [Unreleased] - 2025-12-16

### Added

#### Inventory Specimen Selection for Cycles
- **Feature**: When creating a new cycle, users can now select specimens directly from their inventory
- **Toggle**: Package icon (📦) in the specimen picker toggles between "All Specimens" and "My Inventory" modes
- **Inventory Mode**:
  - Shows only specimens with "Available" status grouped by inventory item
  - Each specimen displays its weight in grams
  - "Mark depleted" checkbox per specimen - if checked, specimen status becomes "Depleted" when cycle completes
- **Status Management**:
  - When cycle is created: Selected inventory specimens change from "Available" to "InUse"
  - When cycle completes (default): Specimens return to "Available" (unless used in other active cycles)
  - When cycle completes (with "Mark depleted" checked): Specimen status becomes "Depleted"
- **Backend Files**:
  - [CycleSpecimen.cs](../src/api/MyUglyRocks.Core/Entities/CycleSpecimen.cs) - Added `InventorySpecimenId` and `MarkDepletedOnComplete` fields
  - [CycleDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs) - Added `InventorySpecimenInput` record
  - [CycleService.cs](../src/api/MyUglyRocks.Core/Services/CycleService.cs) - Updated `CreateCycleAsync` and `CompleteCycleAsync`
  - [MaterialConfiguration.cs](../src/api/MyUglyRocks.Infrastructure/Data/Configurations/MaterialConfiguration.cs) - EF configuration for new FK
- **Frontend Files**:
  - [specimen-multi-select.tsx](../src/web/src/components/specimen-multi-select.tsx) - Added inventory mode toggle and UI
  - [use-available-inventory-specimens.ts](../src/web/src/hooks/use-available-inventory-specimens.ts) - New hook for fetching available specimens
  - [cycles/new/page.tsx](../src/web/src/app/(protected)/cycles/new/page.tsx) - Enabled inventory mode, passes `inventorySpecimens` to API
  - [cycle.ts](../src/web/src/types/cycle.ts) - Added `InventorySpecimenInput` interface
- **Database Migration**: `20251216203204_AddInventorySpecimenToCycleSpecimen`

#### InventorySpecimen Per-Specimen Fields
- **Feature**: Each specimen in an inventory can now have its own Status, Storage Location, URL, and Notes
- **Backend** (already implemented in previous migration):
  - `InventorySpecimen.Status` - Available, InUse, Depleted, Partial
  - `InventorySpecimen.StorageLocation` - Where this specific specimen is stored
  - `InventorySpecimen.Url` - Specific listing URL for this specimen (e.g., eBay listing)
  - `InventorySpecimen.Notes` - Notes about this specific specimen
- **Frontend Files**:
  - [specimen-row-list.tsx](../src/web/src/components/specimen-row-list.tsx) - Added Status dropdown, Storage Location input, URL input in expanded row
  - [inventory/new/page.tsx](../src/web/src/app/(protected)/inventory/new/page.tsx) - `specimensPayload` includes all new fields
  - [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx) - Loads and saves all new fields
- **UI**: New "Row 3" section in specimen row with Status, Storage Location, and URL fields

#### Inventory Source Filter on List Page
- **Feature**: Inventory list page now has a dropdown to filter by InventorySource
- **File**: [inventory/page.tsx](../src/web/src/app/(protected)/inventory/page.tsx)
- **Details**:
  - New "Filter by source" dropdown in filters bar
  - Lists all active sources for the user
  - Client-side filtering (API filtering can be added later)
  - Shows "No items from this source" message when filter yields no results

### Changed

#### Theme Refresh - Modern Dark Themes
- **Change**: Updated all dark themes with improved contrast, readability, and modern styling
- **File**: [globals.css](../src/web/src/app/globals.css)
- **Themes Updated**:
  - **Malachite**: Near-neutral backgrounds with vibrant emerald accents
  - **Rose Quartz**: Subtle pink undertones with bright rose accents
  - **Tiger's Eye**: Shifted from harsh orange to elegant bronze/gold tones
  - **Amethyst** (NEW): Replaced Bumblebee Jasper with a rich purple/violet theme
- **Improvements**:
  - Better card/background contrast for visibility
  - Brighter text (0.95 lightness) for readability
  - Visible colored borders instead of pure white alpha
  - More saturated, vibrant accent colors for buttons
  - Reduced background color saturation for easier viewing

#### Complete Stage Modal Radio Button Styling
- **Change**: "What's Next?" section now displayed in a prominent card with header
- **File**: [cycles/[id]/page.tsx](../src/web/src/app/(protected)/cycles/[id]/page.tsx)
- **Details**:
  - Removed "What's next?" label
  - Radio buttons now in a card with primary-colored border and background
  - Header reads "Please Choose *required" with asterisk in red
  - Card has shadow and border to stand out from surrounding content

#### Inventory List Page - Removed Favorites
- **Change**: Removed the yellow favorite star icon from inventory list items
- **File**: [inventory/page.tsx](../src/web/src/app/(protected)/inventory/page.tsx)
- **Rationale**: Favorites feature deprecated as part of InventorySource refactor (per plan line 724)

#### Inventory Detail Page - Clickable Source Name
- **Change**: Source name in "Acquired from [source]" text is now a link to /inventory/sources
- **File**: [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx)
- **Details**: Uses primary color and underline on hover

### Fixed

#### InventorySource Delete with Soft-Deleted Inventory
- **Problem**: Deleting an InventorySource failed with FK constraint violation when soft-deleted inventory items were linked to it
- **Root Cause**: `Inventory` entity has a global query filter for `!IsDeleted`, so the service couldn't find soft-deleted items to nullify their FK before deleting the source
- **Fix**: Added `IgnoreQueryFilters()` when querying for soft-deleted inventory items in `DeleteSourceAsync`
- **File**: [InventorySourceService.cs](../src/api/MyUglyRocks.Core/Services/InventorySourceService.cs)

#### Specimen Notes Not Saving
- **Problem**: Notes field was visible in the specimen row UI but was not being sent to the API when creating/updating inventory
- **Fix**: Added `notes: row.notes || undefined` to `specimensPayload` in both new and edit pages
- **Files**: [inventory/new/page.tsx](../src/web/src/app/(protected)/inventory/new/page.tsx), [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx)

#### Specimen Notes Not Loading on Edit
- **Problem**: When editing an inventory item, specimen notes weren't being loaded into the form
- **Fix**: Added `notes: s.notes ?? undefined` when initializing specimen rows from inventory data
- **File**: [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx)

#### Inventory Source Management System
- **Feature**: Complete source tracking system for managing where you acquire rock specimens
- **Backend Files**:
  - [InventorySource.cs](../src/api/MyUglyRocks.Core/Entities/InventorySource.cs) - **New** entity with SourceType enum (Store, Online, Found, Contact, GemShow, Other)
  - [IInventorySourceService.cs](../src/api/MyUglyRocks.Abstractions/Interfaces/IInventorySourceService.cs) - **New** service interface
  - [InventorySourceService.cs](../src/api/MyUglyRocks.Core/Services/InventorySourceService.cs) - **New** service implementation with filtering, pagination, sorting
  - [InventorySourcesController.cs](../src/api/MyUglyRocks.Api/Controllers/InventorySourcesController.cs) - **New** REST API controller
  - [InventorySourceDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/InventorySourceDtos.cs) - **New** DTOs for list, detail, create, update operations
  - [InventoryConfiguration.cs](../src/api/MyUglyRocks.Infrastructure/Data/Configurations/InventoryConfiguration.cs) - EF Core configuration with case-insensitive unique constraint
- **Frontend Files**:
  - [inventory/sources/page.tsx](../src/web/src/app/(protected)/inventory/sources/page.tsx) - **New** source management page with tabs, search, sorting
  - [inventory-source-picker.tsx](../src/web/src/components/inventory-source-picker.tsx) - **New** dropdown component for selecting sources in forms
  - [inventory-source-form-dialog.tsx](../src/web/src/components/inventory-source-form-dialog.tsx) - **New** create/edit dialog with type-specific fields
  - [url-input.tsx](../src/web/src/components/url-input.tsx) - **New** URL input with validation and external link button
  - [use-inventory-sources.ts](../src/web/src/hooks/use-inventory-sources.ts) - **New** React Query hooks for CRUD operations
  - [inventory-source.ts](../src/web/src/types/inventory-source.ts) - **New** TypeScript types and display name mappings
  - [hooks/index.ts](../src/web/src/hooks/index.ts) - Export new hooks
- **Source Types**:
  - **Store**: Physical rock shops, gift shops (fields: name, location, phone, URL, notes)
  - **Online**: E-commerce sites, eBay, Etsy (fields: name, URL, notes)
  - **Found**: Field-collected specimens (fields: name, location, notes)
  - **Contact**: Friends, club members, trades (fields: name, contact name, phone, notes)
  - **Gem Show**: Gem & mineral shows (fields: name, location, notes)
  - **Other**: Catch-all category
- **Features**:
  - Tabbed view to filter by source type
  - Full-text search across name and location
  - Sort by name, total purchases, or last purchase date
  - Shows purchase count and last purchase date per source
  - Sources are user-scoped (each user has their own sources)
  - Soft delete support (isActive flag)
  - Sources with purchases cannot be deleted (Delete button disabled)
- **Integration**:
  - Updated `/inventory/new` and `/inventory/[id]` pages with InventorySourcePicker
  - Added "Manage sources" link in source picker dropdown
  - Added "Add New Source" option in picker for inline creation
  - Inventory records now link to InventorySource via `inventorySourceId` FK

#### Migration with Data Normalization
- **Migration**: [20251216171612_InventorySourceRefactor.cs](../src/api/MyUglyRocks.Infrastructure/Migrations/20251216171612_InventorySourceRefactor.cs)
- **Schema Changes**:
  - New `inventory_sources` table with all source fields
  - Added `inventory_source_id` FK on `inventory` table
  - Added `status`, `storage_location`, `url` columns to `inventory_specimens` table
  - Indexes for user/active filtering and case-insensitive unique name constraint
- **Data Migration**:
  - Phase 1: Creates unique InventorySource records from existing inventory data
  - Phase 2: Links existing inventory records to their normalized sources
  - Phase 3: Copies status from Inventory to InventorySpecimen
  - Handles Gift/Trade → Contact type consolidation with migration notes
  - Uses ROW_NUMBER() for PostgreSQL portability

### Fixed

#### ESLint Warning Fixes
- **`form.watch()` incompatibility warning** in `inventory-source-form-dialog.tsx`
  - Changed from `const selectedSourceType = form.watch('sourceType')` to using `field.value` inside the render prop
  - File: [inventory-source-form-dialog.tsx](../src/web/src/components/inventory-source-form-dialog.tsx)
- **`completedPhotos` dependency warnings** in share pages
  - Wrapped `completedPhotos` filter in `useMemo` to stabilize reference
  - Files: [cycles/[id]/share/page.tsx](../src/web/src/app/(protected)/cycles/[id]/share/page.tsx), [inventory/[id]/share/page.tsx](../src/web/src/app/(protected)/inventory/[id]/share/page.tsx)
  - Added `useMemo` to imports

### Fixed

#### Code Cleanup - Unused Parameters and State
- **CardSkeleton unused height parameter**: Removed unused `height` parameter from `CardSkeleton` component and its eslint-disable comment
  - File: [skeletons/index.tsx](../src/web/src/components/skeletons/index.tsx)
- **Unused isAddingBarrel state**: Removed entirely unused `isAddingBarrel` useState from tumbler edit page - the setter was being called but no code ever read the state value
  - File: [tumblers/[id]/page.tsx](../src/web/src/app/(protected)/tumblers/[id]/page.tsx)

### Added

#### Animated Vote Counter in Gallery
- **Feature**: Vote counts in the gallery now animate smoothly when users vote
- **File**: [gallery/page.tsx](../src/web/src/app/(protected)/gallery/page.tsx)
- **Details**:
  - Uses existing `AnimatedCounter` component from `components/ui/animated-counter.tsx`
  - Vote count animates up/down with spring physics when clicking the heart button
  - Local state tracks optimistic vote count for immediate feedback

#### Confetti Celebration on Cycle Completion
- **Feature**: Completing a tumbling cycle now triggers a celebratory confetti animation
- **File**: [cycles/[id]/page.tsx](../src/web/src/app/(protected)/cycles/[id]/page.tsx)
- **Details**:
  - Uses existing `useConfetti` hook from `components/ui/confetti.tsx`
  - Confetti fires automatically when `completeCycleMutation` succeeds
  - Canvas-based particle animation with colorful shapes (squares, circles, rectangles)
  - Animation runs for 3 seconds with gravity and air resistance physics

### Fixed

#### Inventory Search Focus Loss
- **Problem**: Typing in the inventory search box caused the cursor to leave the input after each character, requiring re-clicking to continue typing
- **Root Cause**: Each keystroke triggered an immediate API call, which caused react-query to refetch. The `isLoading` state toggled true, causing the full page skeleton to render and unmount the input.
- **Solution**: Three-part fix:
  1. **Debouncing**: Created `useDebouncedValue` hook (300ms delay) so API calls only fire after user stops typing
  2. **Keep previous data**: Added `placeholderData: keepPreviousData` to `useInventory` hook so old results stay visible during refetch
  3. **Smarter loading state**: Full page skeleton only shows on initial load, not during search refetches
- **Files**:
  - [use-debounce.ts](../src/web/src/hooks/use-debounce.ts) - **New** reusable debounce hook
  - [use-inventory.ts](../src/web/src/hooks/use-inventory.ts) - Added `keepPreviousData` import and usage
  - [inventory/page.tsx](../src/web/src/app/(protected)/inventory/page.tsx) - Added debounced search, loading spinner, `hasLoadedOnce` ref
  - [hooks/index.ts](../src/web/src/hooks/index.ts) - Export `useDebouncedValue`
- **UX Improvements**:
  - Loading spinner appears in search input while fetching
  - Placeholder text changed to "Search by name..." to clarify what's being searched
  - Results update smoothly after typing stops

---

## [Unreleased] - 2025-12-15

### Fixed

#### Hangfire Database Bloat (Production Outage Fix)
- **Problem**: Production PostgreSQL database grew to 500MB and ran out of disk space, crashing the database
- **Root Cause**: Hangfire jobs were receiving `byte[] imageData` parameters (entire photo files ~5-10MB each). Hangfire serializes job arguments to JSON and stores them in PostgreSQL's `hangfire.job` table. Every photo upload stored the image twice (thumbnail job + large variants job).
- **Solution**: Changed to R2 temp storage pattern - images are uploaded to R2 first, and only a small string key is passed to Hangfire jobs
- **Files**:
  - [IStorageService.cs](../src/api/MyUglyRocks.Abstractions/Interfaces/IStorageService.cs) - Added `GetStreamAsync()` method
  - [R2StorageService.cs](../src/api/MyUglyRocks.Infrastructure/Services/R2StorageService.cs) - Implemented `GetStreamAsync()`
  - [PhotoProcessingJob.cs](../src/api/MyUglyRocks.Infrastructure/Jobs/PhotoProcessingJob.cs) - Changed from `byte[] imageData` to `string tempStorageKey`, fetches from R2
  - [InventoryPhotoProcessingJob.cs](../src/api/MyUglyRocks.Infrastructure/Jobs/InventoryPhotoProcessingJob.cs) - Same change
  - [PhotosController.cs](../src/api/MyUglyRocks.Api/Controllers/PhotosController.cs) - Uploads to R2 temp folder before queueing jobs
- **New Flow**:
  1. Controller uploads image to `temp/{photoId}.{ext}` in R2
  2. Controller queues Hangfire job with just the temp key string (~50 bytes)
  3. Job fetches image from R2, processes it, uploads variants
  4. Job deletes temp file after processing
- **Cleanup Handling**: Temp files are cleaned up in all failure scenarios:
  - Photo record not found: thumbnail job cleans up before returning
  - Temp file not found (GetStreamAsync returns null): cleans up in case file exists but read failed
  - Processing exception: thumbnail job cleans up before re-throwing (prevents continuation)
  - Large variants success/failure: always cleans up in `finally` block
- **Resource Management**: S3 GetObjectResponse is properly disposed with `using` statement
- **Impact**: Hangfire job table stays tiny (KB instead of hundreds of MB), database won't fill up

#### Admin Specimen Creation 500 Error
- **Problem**: Creating a new specimen via Admin > Specimens returned HTTP 500 error
- **Root Cause**: `Specimen` entity extends `UserAuditedEntity` which requires `UserCreated` and `UserUpdated` (non-nullable Guids), but `CreateSpecimenAsync` and `UpdateSpecimenAsync` weren't setting these fields
- **Fix**:
  - Updated `IReferenceDataService` interface to accept `Guid userId` parameter for create/update
  - Updated `ReferenceDataService.CreateSpecimenAsync` to set `UserCreated` and `UserUpdated`
  - Updated `ReferenceDataService.UpdateSpecimenAsync` to set `UserUpdated`
  - Updated `AdminController` to pass current user ID from JWT claims
- **Files**:
  - [IReferenceDataService.cs](../src/api/MyUglyRocks.Abstractions/Interfaces/IReferenceDataService.cs)
  - [ReferenceDataService.cs](../src/api/MyUglyRocks.Core/Services/ReferenceDataService.cs)
  - [AdminController.cs](../src/api/MyUglyRocks.Api/Controllers/AdminController.cs)

#### Missing Species/Variety Fields in Admin Specimen Form
- **Problem**: Admin specimen create/edit form was missing Species and Variety input fields
- **Fix**: Added Species and Variety input fields to the form dialog
- **File**: [admin/specimens/page.tsx](../src/web/src/app/(protected)/admin/specimens/page.tsx)

#### Railway Proxy Script Command Injection
- **Problem**: Environment variables in docker run command weren't properly quoted, allowing potential command injection
- **Fix**: Quoted `-e` parameters: `-e "PGHOST=$env:PGHOST"` instead of `-e PGHOST=$env:PGHOST`
- **File**: [start-proxy.ps1](../tools/railway-proxy/start-proxy.ps1)

### Improved

#### Photo Upload Performance Optimization
- **Improvement**: Photo uploads now show thumbnails in ~4 seconds instead of ~15 seconds
- **Approach**: Two-phase background processing
  - Phase 1: Thumbnail generated and uploaded immediately, status marked "Completed"
  - Phase 2: Large variants (1600px + original) processed silently in background
- **Files**:
  - [IImageProcessingService.cs](../src/api/MyUglyRocks.Abstractions/Interfaces/IImageProcessingService.cs) - Added `ProcessThumbnailAsync` and `ProcessLargeVariantsAsync` methods
  - [ImageProcessingService.cs](../src/api/MyUglyRocks.Infrastructure/Services/ImageProcessingService.cs) - Two-phase processing implementation
  - [InventoryPhotoProcessingJob.cs](../src/api/MyUglyRocks.Infrastructure/Jobs/InventoryPhotoProcessingJob.cs) - Split into thumbnail + large variant jobs
  - [PhotoProcessingJob.cs](../src/api/MyUglyRocks.Infrastructure/Jobs/PhotoProcessingJob.cs) - Split into thumbnail + large variant jobs
  - [PhotosController.cs](../src/api/MyUglyRocks.Api/Controllers/PhotosController.cs) - Uses Hangfire `ContinueJobWith` for chained processing
- **Additional optimizations**:
  - Hangfire queue poll interval reduced from 15s to 1s
  - Removed medium (800px) variant - only thumbnail, large, and original
  - WebP quality reduced to 70 (thumbnail) and 80 (others) for faster encoding
  - Parallel variant processing within each phase

#### Landing Page Updates
- **Change**: Updated public landing page to highlight inventory tracking feature
- **File**: [page.tsx](../src/web/src/app/page.tsx)
- **Details**:
  - Added new problem card: "I have boxes of rough rocks but can't remember what any of them are or where they came from"
  - Added "Inventory Tracking" feature card with Package icon
  - Removed "Multiple Tumblers" feature card (redundant with existing features)

### Added

#### Inventory Photo Specimen Tagging
- **Feature**: Inventory photos can now be tagged/linked to a specific specimen when uploading
- **Files**:
  - [InventoryPhoto.cs](../src/api/MyUglyRocks.Core/Entities/InventoryPhoto.cs) - Added `InventorySpecimenId` nullable FK
  - [InventoryConfiguration.cs](../src/api/MyUglyRocks.Infrastructure/Data/Configurations/InventoryConfiguration.cs) - EF config with SetNull on delete
  - [InventoryDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/InventoryDtos.cs) - Added `InventorySpecimenId` and `SpecimenName` to DTO
  - [PhotosController.cs](../src/api/MyUglyRocks.Api/Controllers/PhotosController.cs) - Added `inventorySpecimenId` param to upload endpoint
  - [inventory-photo-upload-modal.tsx](../src/web/src/components/inventory-photo-upload-modal.tsx) - **New** modal with specimen picker
  - [inventory-photos.tsx](../src/web/src/components/inventory-photos.tsx) - Uses modal, shows specimen badge on photos
  - [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx) - Passes specimens to photos component
- **UX**: Click "Add Photo" opens modal with file picker, optional specimen dropdown, and optional caption
- **Display**: Photos show a small badge in the corner with the linked specimen name
- **Migration**: `AddInventoryPhotoSpecimenLink` adds column and index

#### Specimen Dropdown Column Visibility Toggle
- **Feature**: Specimen dropdowns in Inventory pages now have show/hide columns like in Cycles
- **File**: [specimen-row-list.tsx](../src/web/src/components/specimen-row-list.tsx)
- **Details**:
  - Added Settings2 (gear) icon button in search bar
  - Toggle visibility of: Scientific Name, Alias, Hardness, Tumbling Difficulty, Material Type
  - Column preferences saved to localStorage (shared key `specimen-dropdown-columns`)
  - Same UI pattern as existing `SpecimenMultiSelect` component

#### Celebratory Completed Cycle Styling
- **Feature**: Completed cycles now have a distinct celebratory appearance to clearly differentiate from active cycles
- **File**: [cycles/[id]/page.tsx](../src/web/src/app/(protected)/cycles/[id]/page.tsx)
- **Visual Changes**:
  - Green border and subtle green gradient background on the cycle card
  - Green "Completed" badge with trophy icon (replaces plain gray badge)
  - Party popper icon next to the cycle name
  - Golden star rating display for final quality score
- **Icons Added**: `Trophy`, `PartyPopper` from lucide-react

#### StageNextAction "Complete" Option
- **Feature**: Added "Cycle Complete" option to the "What's Next?" selection in Complete Stage modal
- **File**: [StageRun.cs](../src/api/MyUglyRocks.Core/Entities/StageRun.cs)
- **Change**: Added `Complete = 3` to `StageNextAction` enum
- **Use Case**: When finishing the final stage, users can select "Cycle Complete (No more ugly rocks!)" to mark the entire cycle as finished

### Fixed

#### Custom Specimen Creation Not Auto-Selecting
- **Problem**: When creating a custom specimen via "Add Custom Specimen" dialog in `/inventory/new` or `/inventory/[id]`, the dialog closed but the specimen dropdown remained blank. Saving did nothing.
- **Root Cause**: The `handleCustomSpecimenCreated` callback was empty - it didn't add the new specimen to the form state
- **Fix**:
  - Updated `AddCustomSpecimenDialog` to pass full specimen data (id, commonName, scientificName, tumblingDifficulty, materialType) to `onSuccess` callback
  - Updated all three consuming pages to create a pre-populated specimen row when custom specimen is created
- **Files**:
  - [add-custom-specimen-dialog.tsx](../src/web/src/components/add-custom-specimen-dialog.tsx) - Export `CustomSpecimenCreatedData` interface, pass full data
  - [inventory/new/page.tsx](../src/web/src/app/(protected)/inventory/new/page.tsx) - Create row with specimen pre-selected
  - [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx) - Create row with specimen pre-selected
  - [cycles/new/page.tsx](../src/web/src/app/(protected)/cycles/new/page.tsx) - Add specimen to selection list

#### Select Component Empty Value Error
- **Problem**: Radix UI Select threw error "A <Select.Item /> must have a value prop that is not an empty string"
- **Location**: `inventory-photo-upload-modal.tsx` used `<SelectItem value="">` for "None" option
- **Fix**: Changed to use `value="__none__"` sentinel value and handle conversion in upload logic
- **File**: [inventory-photo-upload-modal.tsx](../src/web/src/components/inventory-photo-upload-modal.tsx)

#### Complete Stage Modal Errors
- **Problem 1**: "Uncaught RangeError: invalid date" in browser console when opening Complete Stage modal
- **Root Cause**: `toISOString()` called on Date object created from empty/invalid `completeStageStartDateTime`
- **Fix**: Added guard `if (isNaN(startDate.getTime())) return null;` before calling `toISOString()`

- **Problem 2**: HTTP 400 error when submitting Complete Stage form with "Advance to next stage" selected
- **Root Causes**:
  1. `resultRating` defaulted to 0, which violated `[Range(1, 5)]` validation
  2. Advanced quality ratings (ResultShapeRounding, ResultScratchLevel, ResultPitting, ResultShine) use 0-100 percentages in UI but backend DTO had `[Range(1, 5)]` validation
- **Fixes**:
  - Frontend: Send `undefined` instead of `0` for unrated `resultRating`
  - Backend: Changed validation from `[Range(1, 5)]` to `[Range(0, 100)]` for percentage-based quality metrics
- **Files**:
  - [cycles/[id]/page.tsx](../src/web/src/app/(protected)/cycles/[id]/page.tsx) - Invalid date guards + resultRating fix
  - [CycleDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs) - Fixed `CompleteStageRunRequest` validation ranges

### Changed

#### Inventory Specimen Data Model Refactor
- **Change**: Moved Cost, Condition, Quality Rating, Size Categories from inventory table to inventory_specimens table
- **Rationale**: Each specimen in an inventory can have different cost, condition, quality, and sizes
- **Files**:
  - [Inventory.cs](../src/api/MyUglyRocks.Core/Entities/Inventory.cs) - Removed fields
  - [InventorySpecimen.cs](../src/api/MyUglyRocks.Core/Entities/InventorySpecimen.cs) - Added fields
  - [InventoryDtos.cs](../src/api/MyUglyRocks.Abstractions/DTOs/InventoryDtos.cs) - Moved fields to specimen DTOs
  - [InventoryService.cs](../src/api/MyUglyRocks.Core/Services/InventoryService.cs) - Updated create/update logic
  - [specimen-row-list.tsx](../src/web/src/components/specimen-row-list.tsx) - Full row editing with all fields
  - [inventory/new/page.tsx](../src/web/src/app/(protected)/inventory/new/page.tsx) - Updated form
  - [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx) - Updated form
- **Migrations**:
  - `AddWeightGramsToInventorySpecimen`
  - `RemoveEstimatedPercentageFromInventorySpecimen`
  - `MoveFieldsToInventorySpecimen`
  - `RemoveWaterLevelAndFillLevelPercent`

#### Timezone-Aware Date Handling
- **Feature**: All date displays throughout the app now use the user's timezone preference from Settings > Preferences
- **New Utilities** in `src/web/src/lib/date-utils.ts`:
  - `utcToUserTimezone()` - Convert UTC API dates to user's timezone
  - `userTimezoneToUtc()` - Convert local dates to UTC for API submission
  - `getNowInTimezone()` - Get current time in user's timezone
  - `formatInTimezone()` - Format UTC dates for display in user's timezone
  - `isDateTodayInTimezone()` - Check if UTC date is "today" in user's timezone
  - `formatUtcForDateTimeLocalInput()` - Format UTC for datetime-local inputs
  - `parseDateTimeLocalToUtc()` - Parse datetime-local input to UTC
- **New Hook** `useTimezone()` in `src/web/src/hooks/use-user.ts`:
  - Provides timezone-aware utilities bound to user's settings
  - Returns `formatDate`, `toUserTz`, `toUtc`, `now`, `isToday`, `formatForInput`, `parseFromInput`
  - Falls back to UTC when settings not loaded
- **Dependency**: Added `date-fns-tz` package for timezone conversions
- **Pages Updated**:
  - [cycles/[id]/page.tsx](../src/web/src/app/(protected)/cycles/[id]/page.tsx) - Cycle info, stage cards, Complete Stage modal
  - [gallery/[id]/page.tsx](../src/web/src/app/(protected)/gallery/[id]/page.tsx) - Post dates, cycle/inventory dates, comments
  - [inventory/[id]/page.tsx](../src/web/src/app/(protected)/inventory/[id]/page.tsx) - Acquired date
  - [inventory/[id]/share/page.tsx](../src/web/src/app/(protected)/inventory/[id]/share/page.tsx) - Acquired date
  - [cycles/[id]/share/page.tsx](../src/web/src/app/(protected)/cycles/[id]/share/page.tsx) - Cycle start date
  - [settings/profile/page.tsx](../src/web/src/app/(protected)/settings/profile/page.tsx) - Member since date
  - [stage-form-modal.tsx](../src/web/src/components/stage/stage-form-modal.tsx) - Start datetime handling
- **Complete Stage Modal Fix**: "End date is today" check now uses user's timezone instead of browser local time

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

#### Cleaning Run in Complete Stage Modal
- **Feature**: Complete Stage modal now includes an editable Cleaning Run section
- **File**: [cycles/[id]/page.tsx](../src/web/src/app/(protected)/cycles/[id]/page.tsx)
- **Details**:
  - Added collapsible CleaningRunSection component under Duration
  - If stage has existing cleaning run, pre-populates form with that data
  - If no cleaning run exists, allows user to add one before completing
  - New cleaning runs are created automatically when stage is completed
  - Uses the shared `CleaningRunSection` component for consistent UI

#### Timezone Setting in Preferences
- **Feature**: Added timezone dropdown to Settings > Preferences > Regional section
- **File**: [preferences/page.tsx](../src/web/src/app/(protected)/settings/preferences/page.tsx)
- **Details**:
  - 24 common IANA timezones covering major regions worldwide
  - Displayed with friendly names and UTC offsets (e.g., "Pacific Time (UTC-8)")
  - Saves automatically when changed (consistent with other settings)
  - Used for stage reminders and date/time display

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

### Improved

#### Complete Stage Validation with Visual Feedback
- **Improvement**: Enhanced validation for "What's Next?" field in Complete Stage modal
- **File**: [cycles/[id]/page.tsx](../src/web/src/app/(protected)/cycles/[id]/page.tsx)
- **Details**:
  - Red border with pulse animation when validation fails
  - Label turns red to highlight the required field
  - Error message appears below the field
  - Toast duration increased from 1 second to 5 seconds
  - Error state auto-clears when user selects an option
  - Form state properly resets when opening modal

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

#### Copilot Code Review Fixes
Several issues identified by GitHub Copilot code review have been addressed:

- **Unreachable null check in route.ts**: Removed defensive null check that was logically unreachable due to preceding conditional logic
  - File: [route.ts](../src/web/src/app/config/route.ts)

- **InventoryService weight comparison bug**: Fixed logic that compared `RemainingWeightGrams` against the new total instead of the old total when recalculating aggregate weights
  - File: [InventoryService.cs](../src/api/MyUglyRocks.Core/Services/InventoryService.cs)
  - Fix: Capture `oldTotalWeight` before updating `TotalWeightGrams`

- **Unused imports in mobile-nav.tsx**: Removed unused `ReactNode` and `BookOpen` imports
  - File: [mobile-nav.tsx](../src/web/src/components/ui/mobile-nav.tsx)

- **UpdateStageRun not saving materials/cleaning run**: Backend API accepted `Materials` and `CleaningRun` in update request but didn't process them
  - File: [CycleService.cs](../src/api/MyUglyRocks.Core/Services/CycleService.cs)
  - Fix: Added logic to update/replace materials and update/create cleaning runs in `UpdateStageRunAsync`

- **Water unit not using user settings when editing stage**: When loading existing stage data for editing, water amount displayed in ml regardless of user's measurement preference
  - File: [stage-form-modal.tsx](../src/web/src/components/stage/stage-form-modal.tsx)
  - Fix: Convert stored ml value to user's preferred unit (ml or fl oz) based on settings

- **Custom stage name input accessibility**: Added `aria-label` attribute for screen reader support
  - File: [stage-form-modal.tsx](../src/web/src/components/stage/stage-form-modal.tsx)

#### ESLint Error Fixes
Fixed all 3 lint errors (reduced warnings from 74 to 41):

- **`openAddStageModal` accessed before declaration** (cycles/[id]/page.tsx:215)
  - Changed `hasHandledAddStage` from `useState` to `useRef` since it doesn't trigger re-renders
  - Inlined the modal open logic directly in the useEffect
  - File: [cycles/[id]/page.tsx](../src/web/src/app/(protected)/cycles/[id]/page.tsx)

- **setState in effect errors** (weight-input.tsx)
  - Refactored to use `useMemo` for deriving display values from props
  - Added `effectiveIsMetric` computed value that chains: sessionStorage > initialDisplayUnit > settings > fallback
  - Removed useEffect that synced props to local state (caused cascading renders)
  - File: [weight-input.tsx](../src/web/src/components/weight-input.tsx)

- **Unused imports/variables** (33+ fixes across 12+ files)
  - Removed unused Select components, types, functions from imports
  - Prefixed intentionally unused variables with `_` (e.g., `_router`, `_currentDay`, `_cleaningRunId`)
  - Removed unused `ModalConfig` type definition
  - Files affected: cycles/[id]/page.tsx, gallery/[id]/page.tsx, inventory/[id]/share/page.tsx, learn/faq/[topic]/page.tsx, learn/materials/page.tsx, settings/preferences/page.tsx, tumblers/[id]/page.tsx, stage-form-modal.tsx, command-palette.tsx, floating-action-button.tsx, mobile-nav.tsx, skeletons/index.tsx, specimen-multi-select.tsx, confetti.tsx, photo-upload-placeholder.tsx, use-crud-mutation.ts, use-inventory.ts, use-modal-state.ts

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

### Timezone Handling Strategy

**Architecture:**
- Database stores all DateTimes in UTC
- API returns/accepts UTC ISO strings
- Frontend converts UTC to user's timezone for display
- Frontend converts user input back to UTC before sending to API

**Key Files:**
- `src/web/src/lib/date-utils.ts` - Core timezone conversion utilities
- `src/web/src/hooks/use-user.ts` - `useTimezone()` hook for React components
- User timezone preference stored in `UserSettings.Timezone` field

**Usage Pattern:**
```tsx
const { formatDate, toUserTz, toUtc, now, isToday, formatForInput, parseFromInput } = useTimezone();

// Display a UTC date from API
const displayDate = formatDate(stage.startDateTime, 'MMM d, yyyy h:mm a');

// Check if a date is today in user's timezone
if (isToday(stage.endDateTime)) { /* ... */ }

// For datetime-local inputs
const inputValue = formatForInput(stage.startDateTime);  // Pre-populate
const utcValue = parseFromInput(inputValue);              // Submit to API
```

**Library:** Uses `date-fns-tz` for IANA timezone support (e.g., "America/New_York")
