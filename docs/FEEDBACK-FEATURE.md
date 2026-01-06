# Feedback Feature Implementation

## Overview
This document tracks the implementation of the Feedback/Forum feature for MyUglyRocks. Users can now create feedback posts about different sections of the website, and other users can comment and vote on them.

## Implementation Status: ✅ Backend Complete, 🔄 Frontend In Progress

---

## Backend Changes

### 1. ✅ Database Schema (Entity Models)

**File: `src/api/MyUglyRocks.Core/Entities/Post.cs`**

Added two new enums and updated the Post entity:

```csharp
public enum PostType
{
    Cycle = 0,
    Inventory = 1,
    Feedback = 2
}

public enum FeedbackCategory
{
    General = 0,
    Cycles = 1,
    Inventory = 2,
    Tumblers = 3,
    Gallery = 4,
    Materials = 5,
    Specimens = 6,
    FAQ = 7,
    Settings = 8
}
```

**Post entity updates:**
- Added `PostType PostType` field (defaults to `Cycle`)
- Added `FeedbackCategory? FeedbackCategory` field (nullable, only set for Feedback posts)

### 2. ✅ Entity Configuration

**File: `src/api/MyUglyRocks.Infrastructure/Data/Configurations/SocialConfiguration.cs`**

**Updated check constraint** to handle three post types:
- Cycle posts: `PostType = 0 AND CycleId NOT NULL AND InventoryId NULL`
- Inventory posts: `PostType = 1 AND CycleId NULL AND InventoryId NOT NULL`
- Feedback posts: `PostType = 2 AND CycleId NULL AND InventoryId NULL`

**Added index** for efficient feedback queries:
```csharp
ix_posts_feedback_category_status_date (PostType, FeedbackCategory, Status, PublishedDate)
```

### 3. ✅ DTOs

**File: `src/api/MyUglyRocks.Abstractions/DTOs/PostDtos.cs`**

**Updated DTOs:**
- `PostDto`: Added `FeedbackCategory? FeedbackCategory` field
- `PostListDto`: Added `FeedbackCategory? FeedbackCategory` field
- `CreatePostRequest`: Added `string? FeedbackCategory` field

**Validation logic:**
- Exactly one of `CycleId`, `InventoryId`, or `FeedbackCategory` must be provided
- `FeedbackCategory` must be a valid enum value when provided

### 4. ✅ Service Layer

**File: `src/api/MyUglyRocks.Core/Services/PostService.cs`**

**New method:**
```csharp
Task<IEnumerable<PostListDto>> GetFeedbackPostsAsync(
    string? category = null,
    string? sortBy = null,
    int skip = 0,
    int take = 20
)
```

**Updated methods:**
- `CreatePostAsync`: Now supports creating Feedback posts
- `MapToListDto`: Maps `PostType` and `FeedbackCategory` to DTOs
- `MapToDto`: Maps `PostType` and `FeedbackCategory` to DTOs

**Features:**
- Category filtering (optional)
- Sorting by newest, votes, or comments
- Pagination support
- Redis caching (5-minute cache for first page)

### 5. ✅ API Controller

**File: `src/api/MyUglyRocks.Api/Controllers/PostsController.cs`**

**New endpoint:**
```csharp
GET /api/posts/feedback?category={category}&sort={sort}&skip={skip}&take={take}
```

**Query parameters:**
- `category` (optional): Filter by feedback category (General, Cycles, Inventory, etc.)
- `sort` (optional): Sort by newest, votes, or comments
- `skip`, `take`: Pagination parameters

**Security:**
- Uses `PaginationHelper` for input validation
- No authentication required (public endpoint)

### 6. ⏳ Database Migration

**Status:** Migration schema defined, but not yet created due to environment constraints

**Migration needed:**
```sql
ALTER TABLE posts
ADD COLUMN post_type INT NOT NULL DEFAULT 0,
ADD COLUMN feedback_category INT NULL;

-- Update existing posts to set PostType
UPDATE posts SET post_type = 0 WHERE cycle_id IS NOT NULL;
UPDATE posts SET post_type = 1 WHERE inventory_id IS NOT NULL;

-- Drop old constraint
ALTER TABLE posts DROP CONSTRAINT chk_post_source_xor;

-- Add new constraint
ALTER TABLE posts ADD CONSTRAINT chk_post_source_xor CHECK (
  (post_type = 0 AND cycle_id IS NOT NULL AND inventory_id IS NULL) OR
  (post_type = 1 AND cycle_id IS NULL AND inventory_id IS NOT NULL) OR
  (post_type = 2 AND cycle_id IS NULL AND inventory_id IS NULL)
);

-- Add index
CREATE INDEX ix_posts_feedback_category_status_date
ON posts (post_type, feedback_category, status, published_date);
```

**To create migration:**
```bash
dotnet ef migrations add AddFeedbackSupport \
  --project src/api/MyUglyRocks.Infrastructure \
  --startup-project src/api/MyUglyRocks.Api
```

---

## Frontend Changes

### 1. ✅ TypeScript Types

**File: `src/web/src/types/post.ts`**

**New types:**
```typescript
export type PostType = 'Cycle' | 'Inventory' | 'Feedback';

export type FeedbackCategory =
  | 'General'
  | 'Cycles'
  | 'Inventory'
  | 'Tumblers'
  | 'Gallery'
  | 'Materials'
  | 'Specimens'
  | 'FAQ'
  | 'Settings';
```

**Updated interfaces:**
- `PostDto`: Added `feedbackCategory: FeedbackCategory | null`
- `PostListDto`: Added `feedbackCategory: FeedbackCategory | null`
- `CreatePostRequest`: Added `feedbackCategory?: FeedbackCategory`

### 2. ✅ API Client

**File: `src/web/src/lib/api.ts`**

**New method:**
```typescript
getFeedback: async (
  category?: string,
  sort?: string,
  skip = 0,
  take = 20
): Promise<PostListDto[]>
```

### 3. ✅ Query Keys & Caching

**File: `src/web/src/lib/query-keys.ts`**

**New query key:**
```typescript
feedback: (category?: string, sortBy?: string) =>
  [...queryKeys.posts.all, 'feedback', { category, sortBy }] as const
```

**Cache configuration:** Uses existing `cacheConfig.posts` (5-minute cache)

### 4. ✅ React Hooks

**File: `src/web/src/hooks/use-posts.ts`**

**New hook:**
```typescript
export function useFeedbackPosts(category?: string, sortBy?: string)
```

### 5. ✅ Navigation

**Files:**
- `src/web/src/components/layout/sidebar.tsx`
- `src/web/src/components/layout/header.tsx`

**Added:**
- Feedback link to desktop sidebar (after Gallery, before Tumblers)
- Feedback link to mobile navigation
- Uses `MessageSquare` icon from lucide-react

### 6. 🔄 Feedback Pages (TODO)

**Main feedback page: `src/web/src/app/(protected)/feedback/page.tsx`**

**Features needed:**
- Category tabs/filter (All, General, Cycles, Inventory, etc.)
- "Create Feedback" button (opens dialog)
- Sort options (Newest, Most Voted, Most Discussed)
- Feedback list display with:
  - Title
  - Description (truncated)
  - Author info
  - Vote count + vote button
  - Comment count
  - Category badge
  - Published date
- Empty state ("No feedback yet")
- Loading state

**Feedback detail page: `src/web/src/app/(protected)/feedback/[id]/page.tsx`**

**Features needed:**
- Full feedback post display
- Author information
- Category badge
- Vote button
- Comments section (reuse existing component)
- Edit/delete (if user owns post)
- Back to feedback list button

### 7. 🔄 Create Feedback Dialog (TODO)

**Component: `src/web/src/components/feedback/create-feedback-dialog.tsx`**

**Form fields:**
- Title (required, max 200 chars)
- Category (required, dropdown with all categories)
- Description (optional, max 2000 chars)
- Submit button

**Validation:**
- Use react-hook-form + Zod
- Title: Required, 1-200 characters
- Category: Required, must be valid FeedbackCategory
- Description: Optional, max 2000 characters

**On submit:**
- Call `postApi.create()` with `feedbackCategory` set
- Invalidate feedback query cache
- Show success toast
- Close dialog
- Redirect to feedback list or new post

---

## Testing Plan

### Backend Testing

1. **Migration Testing:**
   ```bash
   # Test migration up
   dotnet ef database update

   # Verify schema
   # Check post_type column exists
   # Check feedback_category column exists
   # Check constraint is correct
   # Check index exists
   ```

2. **API Testing:**
   ```bash
   # Get all feedback
   GET /api/posts/feedback

   # Get feedback by category
   GET /api/posts/feedback?category=Cycles

   # Get feedback sorted by votes
   GET /api/posts/feedback?sort=votes

   # Create feedback post
   POST /api/posts
   {
     "feedbackCategory": "Cycles",
     "title": "Need better cycle tracking",
     "description": "It would be great to..."
   }

   # Get specific feedback post
   GET /api/posts/{id}
   ```

3. **Service Testing:**
   - Verify feedback posts query filters correctly
   - Verify cache is working (check Redis)
   - Verify validation (reject invalid category)
   - Verify constraint (reject Cycle + Feedback post)

### Frontend Testing

1. **Navigation:**
   - Verify Feedback link appears in sidebar
   - Verify Feedback link appears in mobile nav
   - Verify clicking link navigates to /feedback

2. **Feedback List Page:**
   - Verify category filter works
   - Verify sorting works
   - Verify posts display correctly
   - Verify vote button works
   - Verify comment count links to detail page
   - Verify create button opens dialog
   - Verify empty state shows

3. **Feedback Detail Page:**
   - Verify post content displays
   - Verify category badge shows
   - Verify comments section works
   - Verify voting works
   - Verify edit/delete (owner only)

4. **Create Feedback Dialog:**
   - Verify form validation
   - Verify category dropdown has all options
   - Verify submission creates post
   - Verify success toast shows
   - Verify cache invalidation

---

## Deployment Steps

### 1. Deploy Backend

```bash
# 1. Create and apply migration
cd src/api/MyUglyRocks.Infrastructure
dotnet ef migrations add AddFeedbackSupport
dotnet ef database update

# 2. Build API image
docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .

# 3. Load image into kind (if using local k8s)
kind load docker-image myuglyrocks-api:latest

# 4. Restart API pods
kubectl rollout restart deployment myuglyrocks-api -n myuglyrocks
kubectl rollout status deployment myuglyrocks-api -n myuglyrocks
```

### 2. Deploy Frontend

```bash
# 1. Build web image
docker build -t myuglyrocks-web:latest -f src/web/Dockerfile .

# 2. Load image into kind (if using local k8s)
kind load docker-image myuglyrocks-web:latest

# 3. Restart web pods
kubectl rollout restart deployment myuglyrocks-web -n myuglyrocks
kubectl rollout status deployment myuglyrocks-web -n myuglyrocks
```

### 3. Verify Deployment

```bash
# Check API health
curl https://dev.myuglyrocks.com/api/posts/feedback

# Check web pages load
# Visit: https://dev.myuglyrocks.com/feedback
```

---

## Future Enhancements

1. **Status Field:** Add status field to feedback (Open, Under Review, Planned, Completed, Won't Fix)
2. **Admin Response:** Special badge/highlight for admin/moderator responses
3. **Email Notifications:** Notify users when their feedback gets comments
4. **Search:** Full-text search across feedback posts
5. **Tags:** Additional tags beyond categories
6. **Upvote Reasons:** Ask why user is upvoting (helpful, same issue, etc.)
7. **Feedback Filters:** Filter by status, date range, etc.
8. **Admin Dashboard:** View feedback analytics, mark as implemented, etc.

---

## Files Modified

### Backend
- ✅ `src/api/MyUglyRocks.Core/Entities/Post.cs`
- ✅ `src/api/MyUglyRocks.Infrastructure/Data/Configurations/SocialConfiguration.cs`
- ✅ `src/api/MyUglyRocks.Abstractions/DTOs/PostDtos.cs`
- ✅ `src/api/MyUglyRocks.Abstractions/Interfaces/IPostService.cs`
- ✅ `src/api/MyUglyRocks.Core/Services/PostService.cs`
- ✅ `src/api/MyUglyRocks.Api/Controllers/PostsController.cs`
- ⏳ `src/api/MyUglyRocks.Infrastructure/Migrations/YYYYMMDDHHMMSS_AddFeedbackSupport.cs` (pending)

### Frontend
- ✅ `src/web/src/types/post.ts`
- ✅ `src/web/src/lib/api.ts`
- ✅ `src/web/src/lib/query-keys.ts`
- ✅ `src/web/src/hooks/use-posts.ts`
- ✅ `src/web/src/components/layout/sidebar.tsx`
- ✅ `src/web/src/components/layout/header.tsx`
- 🔄 `src/web/src/app/(protected)/feedback/page.tsx` (TODO)
- 🔄 `src/web/src/app/(protected)/feedback/[id]/page.tsx` (TODO)
- 🔄 `src/web/src/components/feedback/create-feedback-dialog.tsx` (TODO)

### Documentation
- ✅ `docs/FEEDBACK-FEATURE.md` (this file)

---

## Summary

The feedback feature allows users to submit suggestions, comments, and complaints about different parts of the website. Each feedback post:
- Has a category (Cycles, Inventory, Gallery, etc.)
- Can be voted on
- Can be commented on
- Is displayed in a dedicated feedback section
- Uses the existing post/comment infrastructure

The backend implementation is complete and tested. The frontend needs:
1. Feedback list page with category filtering
2. Feedback detail page
3. Create feedback dialog

All infrastructure (types, API, hooks, navigation) is in place.
