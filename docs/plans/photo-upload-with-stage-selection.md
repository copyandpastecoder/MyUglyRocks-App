# Photo Upload with Stage and Photo Type Selection

## Overview

Enhance the Cycle Photos upload flow to require users to select:
1. **Stage** (required) - Which stage the photo belongs to
2. **Photo Type** (required) - Before / During / After
3. **Caption** (optional) - Text description of the photo

## Current State

### Backend
- `Photo` entity exists with `StageRunId`, `PhotoType` enum (Before=0, During=1, After=2)
- No `Caption` field exists (needs to be added)
- API endpoint `POST /api/photos/stage/{stageRunId}` accepts `photoType` form field
- API works correctly, just needs Caption support

### Frontend
- `CyclePhotos` component auto-assigns photos to the "active" stage with type "during"
- No UI to select stage or photo type
- No caption input

## Proposed Changes

### Phase 1: Backend - Add Caption Field

1. **Add Caption to Photo entity** ([Photo.cs](src/api/MyUglyRocks.Core/Entities/Photo.cs))
   ```csharp
   public string? Caption { get; set; }
   ```

2. **Create database migration**
   - Add `caption` column (text, nullable) to `photos` table

3. **Update PhotoDto** ([CycleDtos.cs](src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs))
   ```csharp
   public record PhotoDto(
       Guid Id,
       string Url,
       string? FileName,
       string PhotoType,
       string? Caption,  // Add this
       int SortOrder,
       DateTime DateCreated
   );
   ```

4. **Update PhotosController** ([PhotosController.cs](src/api/MyUglyRocks.Api/Controllers/PhotosController.cs))
   - Add `caption` form field parameter to upload endpoint
   - Include caption in PhotoDto response

### Phase 2: Frontend - Photo Upload Modal

1. **Create `PhotoUploadModal` component**

   UI Layout (based on wireframe from [03-stage-run.md](docs/wireframes/03-stage-run.md)):
   ```
   ┌─────────────────────────────────────────────┐
   │ Upload Photo                            [×] │
   ├─────────────────────────────────────────────┤
   │                                             │
   │  ┌───────────────────────────────────────┐  │
   │  │                                       │  │
   │  │          [Photo Preview]              │  │
   │  │                                       │  │
   │  └───────────────────────────────────────┘  │
   │                                             │
   │  Stage *                                    │
   │  ┌─────────────────────────────────────┐   │
   │  │ Select stage...                   ▼ │   │
   │  └─────────────────────────────────────┘   │
   │    • Stage 1 - Coarse Grind (Active)       │
   │    • Stage 2 - Medium Grind (Pending)      │
   │    • Stage 3 - Pre-Polish (Pending)        │
   │    • Stage 4 - Polish (Pending)            │
   │                                             │
   │  Photo Type *                               │
   │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
   │  │ Before  │ │ During  │ │  After  │      │
   │  └─────────┘ └─────────┘ └─────────┘      │
   │                                             │
   │  Caption (optional)                         │
   │  ┌─────────────────────────────────────┐   │
   │  │                                     │   │
   │  └─────────────────────────────────────┘   │
   │                                             │
   │  ┌─────────┐              ┌────────────┐   │
   │  │ Cancel  │              │   Upload   │   │
   │  └─────────┘              └────────────┘   │
   └─────────────────────────────────────────────┘
   ```

   Component props:
   ```typescript
   interface PhotoUploadModalProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     stages: StageRunSummaryDto[];
     onUploadComplete: () => void;
     cycleId: string;
   }
   ```

2. **Modify `CyclePhotos` component** ([cycle-photos.tsx](src/web/src/components/cycle-photos.tsx))
   - Remove auto-assignment to active stage
   - Add "Add Photo" button that opens modal (regardless of active stage)
   - Clicking empty state area also opens modal
   - Only disable upload if NO stages exist

3. **Update TypeScript types** ([cycle.ts](src/web/src/types/cycle.ts))
   ```typescript
   export interface PhotoDto {
     id: string;
     url: string;
     fileName: string | null;
     photoType: string;
     caption: string | null;  // Add this
     sortOrder: number;
     dateCreated: string;
   }
   ```

4. **Update API client** ([api.ts](src/web/src/lib/api.ts))
   - Update `uploadStagePhoto` to accept caption parameter

### Phase 3: UI Polish

1. **Photo display enhancements**
   - Show caption on hover/tap
   - Display stage name and photo type badges on each photo

2. **Validation**
   - Require stage selection (show error if not selected)
   - Require photo type selection (show error if not selected)
   - Caption is optional

## Implementation Order

1. Backend: Add Caption field to Photo entity
2. Backend: Create migration
3. Backend: Update DTOs and controller
4. Backend: Deploy and test API
5. Frontend: Update TypeScript types
6. Frontend: Update API client
7. Frontend: Create PhotoUploadModal component
8. Frontend: Update CyclePhotos to use modal
9. Frontend: Build and deploy
10. Test end-to-end

## Files to Modify

### Backend
- `src/api/MyUglyRocks.Core/Entities/Photo.cs` - Add Caption property
- `src/api/MyUglyRocks.Abstractions/DTOs/CycleDtos.cs` - Update PhotoDto
- `src/api/MyUglyRocks.Abstractions/DTOs/PhotoDtos.cs` - Update UploadPhotoRequest
- `src/api/MyUglyRocks.Api/Controllers/PhotosController.cs` - Add caption parameter
- `src/api/MyUglyRocks.Core/Mappings/MappingConfig.cs` - Verify mapping includes Caption
- New migration file

### Frontend
- `src/web/src/types/cycle.ts` - Add caption to PhotoDto
- `src/web/src/lib/api.ts` - Update uploadStagePhoto function
- `src/web/src/components/cycle-photos.tsx` - Integrate modal, remove auto-assign
- New: `src/web/src/components/photo-upload-modal.tsx`

## Notes

- The Photo entity already has `StageRunId` (FK) and `PhotoType` enum - no schema changes needed for those
- Only Caption field needs to be added to the database
- Current behavior hardcodes "during" as photo type - this will be replaced by user selection
- Stage dropdown should show stage name + run number + status for clarity
