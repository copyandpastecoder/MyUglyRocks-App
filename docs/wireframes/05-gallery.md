# Gallery Wireframe

> **URL:** `/gallery`
> **Auth Required:** No (public), but voting/commenting requires auth
> **Priority:** P1 (MVP)

---

## 1. Overview

The Gallery is the public-facing community area where users can browse posts shared by other rock tumblers. Users share their completed cycles as posts, and the community can give "Ugly Rocks" (upvotes) and comments.

### Key User Goals
- "See what others are tumbling"
- "Get inspiration for my next project"
- "Show off my finished results"
- "Connect with other rock tumblers"

---

## 2. Gallery Page

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Gallery                                                                       │
│   Browse amazing results from the rock tumbling community                       │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  Sort: [🔥 Trending]  [⭐ Top]  [🕐 New]  [💬 Most Discussed]           │  │
│   │                                                                          │  │
│   │  Filter: [All Specimens ▼]  [All Tags ▼]  [All Time ▼]                   │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐          │
│   │                   │  │                   │  │                   │          │
│   │                   │  │                   │  │                   │          │
│   │     [Photo]       │  │     [Photo]       │  │     [Photo]       │          │
│   │                   │  │                   │  │                   │          │
│   │                   │  │                   │  │                   │          │
│   ├───────────────────┤  ├───────────────────┤  ├───────────────────┤          │
│   │ Amazing Lake      │  │ Tiger Eye Polish  │  │ Beach Glass       │          │
│   │ Superior Agates!  │  │ Results           │  │ Batch #5          │          │
│   │                   │  │                   │  │                   │          │
│   │ Lake Superior     │  │ Tiger Eye         │  │ Sea Glass         │          │
│   │ Agate             │  │                   │  │                   │          │
│   │                   │  │                   │  │                   │          │
│   │ by @rockfan42    │  │ by @tumblequeen   │  │ by @beachcomber   │          │
│   │                   │  │                   │  │                   │          │
│   │ 🪨 48  💬 12      │  │ 🪨 35  💬 8       │  │ 🪨 29  💬 5       │          │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘          │
│                                                                                 │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐          │
│   │                   │  │                   │  │                   │          │
│   │     [Photo]       │  │     [Photo]       │  │     [Photo]       │          │
│   │                   │  │                   │  │                   │          │
│   ├───────────────────┤  ├───────────────────┤  ├───────────────────┤          │
│   │ Jasper Journey    │  │ My First Batch!   │  │ Obsidian Magic    │          │
│   │                   │  │                   │  │                   │          │
│   │ Jasper, Agate     │  │ Mixed             │  │ Obsidian          │          │
│   │                   │  │                   │  │                   │          │
│   │ by @stonelover    │  │ by @newbie2025    │  │ by @darkrock      │          │
│   │                   │  │                   │  │                   │          │
│   │ 🪨 24  💬 3       │  │ 🪨 18  💬 15      │  │ 🪨 21  💬 2       │          │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘          │
│                                                                                 │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐          │
│   │                   │  │                   │  │                   │          │
│   │     [Photo]       │  │     [Photo]       │  │     [Photo]       │          │
│   │                   │  │                   │  │                   │          │
│   ├───────────────────┤  ├───────────────────┤  ├───────────────────┤          │
│   │ ...               │  │ ...               │  │ ...               │          │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘          │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                     Loading more posts...                                │  │  ← Infinite scroll
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile Layout

```
┌─────────────────────────────────┐
│ MyUglyRocks             [👤]   │
├─────────────────────────────────┤
│                                 │
│ Gallery                         │
│                                 │
│ [🔥 Trending ▼]  [Filter ▼]    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │                             │ │
│ │         [Photo]             │ │
│ │                             │ │
│ │                             │ │
│ ├─────────────────────────────┤ │
│ │ Amazing Lake Superior       │ │
│ │ Agates!                     │ │
│ │                             │ │
│ │ Lake Superior Agate         │ │
│ │                             │ │
│ │ by @rockfan42               │ │
│ │                             │ │
│ │ 🪨 48  💬 12                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │         [Photo]             │ │
│ │                             │ │
│ ├─────────────────────────────┤ │
│ │ Tiger Eye Polish Results    │ │
│ │                             │ │
│ │ Tiger Eye                   │ │
│ │                             │ │
│ │ by @tumblequeen             │ │
│ │                             │ │
│ │ 🪨 35  💬 8                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │         [Photo]             │ │
│ │ ...                         │ │
│ └─────────────────────────────┘ │
│                                 │
│ Loading more...                 │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### 2.3 Filter/Sort Options

**Sort Options:**
| Option | Description | Icon |
|--------|-------------|------|
| Trending | Recent posts with high engagement | 🔥 |
| Top | Most Ugly Rocks all time | ⭐ |
| New | Newest first | 🕐 |
| Most Discussed | Most comments | 💬 |

**Filter Options:**
- **Specimen:** All, or filter by specific specimen type
- **Tags:** All, or filter by user-created tags (only shows tags used in posts)
- **Time:** All Time, This Week, This Month, This Year

**Mobile Filter Sheet:**
```
┌─────────────────────────────────┐
│ Filters                    [✕] │
├─────────────────────────────────┤
│                                 │
│ Sort by                         │
│ ○ 🔥 Trending                   │
│ ● ⭐ Top                        │
│ ○ 🕐 New                        │
│ ○ 💬 Most Discussed             │
│                                 │
│ Specimen                        │
│ ┌─────────────────────────────┐ │
│ │ All Specimens            ▼  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Tags                            │
│ ┌─────────────────────────────┐ │
│ │ All Tags                 ▼  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Time Period                     │
│ ┌─────────────────────────────┐ │
│ │ All Time                 ▼  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │       [ Apply Filters ]     │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## 3. Gallery Post Card

### 3.1 Card Structure

```
┌───────────────────────────────────────┐
│                                       │
│                                       │
│              [Photo]                  │  ← Featured photo (click for post)
│            (16:9 or 1:1)              │
│                                       │
│                                       │
├───────────────────────────────────────┤
│                                       │
│ Amazing Lake Superior Agates!         │  ← Title (truncate after 2 lines)
│                                       │
│ Lake Superior Agate, Banded Agate     │  ← Specimens (truncate)
│                                       │
│ [Lake Superior] [2025 Collection]     │  ← Tags (colored pills, max 3 shown)
│                                       │
│ by @rockfan42                         │  ← Author (link to profile)
│                                       │
│ 🪨 48  💬 12                          │  ← Stats
│                                       │
└───────────────────────────────────────┘
```

**Tag Display Notes:**
- Tags shown as small colored pills with their assigned color
- Maximum 3 tags shown on card, "+N more" if more exist
- Tags are clickable and filter gallery by that tag

### 3.2 Card Hover State (Desktop)

```
┌───────────────────────────────────────┐
│                                       │
│              [Photo]                  │
│                                       │
│   ┌─────────────────────────────┐    │
│   │       View Post  →          │    │  ← Overlay on hover
│   └─────────────────────────────┘    │
│                                       │
├───────────────────────────────────────┤
│                                       │
│ Amazing Lake Superior Agates!         │
│ ...                                   │
│                                       │
└───────────────────────────────────────┘
```

### 3.3 Multi-Photo Indicator

When post has multiple photos, show indicator:

```
┌───────────────────────────────────────┐
│                              [1/5]    │  ← Photo count badge
│                                       │
│              [Photo]                  │
│                                       │
│                                       │
│ ○ ○ ● ○ ○                            │  ← Optional: dot indicators
│                                       │
├───────────────────────────────────────┤
│ ...                                   │
└───────────────────────────────────────┘
```

---

## 4. Logged-Out vs Logged-In Experience

### 4.1 Logged-Out

- Can browse all posts
- Can view post details
- **Cannot** vote (show login prompt on click)
- **Cannot** comment (show login prompt)
- Show "Join the community" CTA

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]                          [Gallery]  [Specimens]  [Login]  [Register]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Gallery                                                                       │
│   Browse amazing results from the rock tumbling community                       │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🪨 Join the community to vote for your favorites and share your own!    │  │
│   │                                    [ Sign Up Free ]                      │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ... (posts grid)                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Logged-In

- Full voting functionality
- Can comment
- Can share their own cycles
- See personalized recommendations (future)

---

## 5. Share to Gallery Flow

When a user wants to share their completed cycle to the gallery:

### 5.1 Share Modal (from Cycle Detail)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Share to Gallery                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Share "Lake Superior Agates" with the community!                               │
│                                                                                 │
│  Title *                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Amazing Lake Superior Agates!                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Give your post a catchy title                                                  │
│                                                                                 │
│  Description                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Beautiful red and orange banding from Lake Superior. These came out     │   │
│  │ amazing after 4 stages! The mirror finish really shows off the          │   │
│  │ patterns.                                                               │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Tell people about your results                                                 │
│                                                                                 │
│  Select Photos *                                                                │
│  Choose which photos to share (select at least 1):                              │
│                                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ [Photo]  │  │ [Photo]  │  │ [Photo]  │  │ [Photo]  │  │ [Photo]  │         │
│  │ ✓ Before │  │ ✓ After  │  │ ✓ After  │  │   During │  │   During │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                                      │
│  │ [Photo]  │  │ [Photo]  │  │ [Photo]  │   Selected: 3 of 12                  │
│  │   During │  │   During │  │ ✓ After  │                                      │
│  └──────────┘  └──────────┘  └──────────┘                                      │
│                                                                                 │
│  Featured Photo                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Select which photo appears as the thumbnail: [ Photo 2 - After ▼]       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Specimens                                                                      │
│  [Lake Superior Agate] [Banded Agate]  (auto-populated from cycle)             │
│                                                                                 │
│  Tags (optional)                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [Lake Superior ✕] [2025 Collection ✕]                     [+ Add Tag]   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Help others find your post by adding tags                                      │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ℹ️ Your cycle details (stages, materials, tumblers) will be visible     │   │
│  │     to help others learn from your process.                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                     [ Cancel ]        [ Share to Gallery ]                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Share Success

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              🎉 Posted!                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Your results have been shared to the gallery!                                  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │     [ View Your Post ]                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │     [ Back to Cycle ]                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Requirements

### 6.1 API Endpoints

| Action | Endpoint |
|--------|----------|
| List posts | `GET /api/posts?sort=...&specimen=...&period=...` |
| Get post | `GET /api/posts/:postId` |
| Create post | `POST /api/posts` |
| Delete post | `DELETE /api/posts/:postId` |
| Vote | `POST /api/posts/:postId/vote` |
| Remove vote | `DELETE /api/posts/:postId/vote` |

### 6.2 Data Shapes

**Post List Item:**
```typescript
interface PostListItem {
  postId: string;
  title: string;
  description?: string;
  featuredPhoto: {
    photoId: string;
    url: string;
    blurHash?: string;
  };
  photoCount: number;
  specimens: string[];
  tags: {
    tagId: string;
    name: string;
    colorHex: string;
  }[];
  author: {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  uglyRocksCount: number;
  commentCount: number;
  hasVoted: boolean; // For logged-in user
  dateCreated: string;
}
```

---

## 7. Interactions

### 7.1 Gallery Interactions

| Element | Action |
|---------|--------|
| Post card (click) | Navigate to `/gallery/{postId}` |
| Author name (click) | Navigate to `/user/{username}` |
| Tag pill (click) | Filter gallery by tag |
| Sort tabs | Re-fetch with new sort |
| Filter dropdowns | Re-fetch with new filters |
| Infinite scroll | Load more posts when near bottom |
| Vote button (logged in) | Toggle vote (optimistic update) |
| Vote button (logged out) | Show login prompt |

### 7.2 Share Flow Interactions

| Element | Action |
|---------|--------|
| Photo checkbox | Toggle photo selection |
| Featured photo dropdown | Set thumbnail |
| Add Tag button | Show tag picker dropdown |
| Tag X button | Remove tag from selection |
| Cancel | Close modal |
| Share | Validate, POST, show success |

---

## 8. States

### 8.1 Loading State

**Initial load:** Full skeleton grid
**Loading more:** "Loading more..." indicator at bottom

```
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │
├───────────────────┤  ├───────────────────┤  ├───────────────────┤
│ ████████░░░░░░░░░ │  │ ████████░░░░░░░░░ │  │ ████████░░░░░░░░░ │
│ ████░░░░░░░░░░░░░ │  │ ████░░░░░░░░░░░░░ │  │ ████░░░░░░░░░░░░░ │
│ ██░░░░░░░░░░░░░░░ │  │ ██░░░░░░░░░░░░░░░ │  │ ██░░░░░░░░░░░░░░░ │
│ ██░░░░░░░░░░░░░░░ │  │ ██░░░░░░░░░░░░░░░ │  │ ██░░░░░░░░░░░░░░░ │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

### 8.2 Empty States

**No posts (general):**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                              [Image/Camera icon]                                │
│                                                                                 │
│                          No posts yet                                           │
│                                                                                 │
│              Be the first to share your tumbling results!                       │
│                                                                                 │
│                        [ Share Your First Post ]                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**No results with filters:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                              [Search icon]                                      │
│                                                                                 │
│                       No posts match your filters                               │
│                                                                                 │
│             Try adjusting your filters to see more results.                     │
│                                                                                 │
│                          [ Clear Filters ]                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Error State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           [AlertCircle icon]                                    │
│                                                                                 │
│                       Couldn't load the gallery                                 │
│                                                                                 │
│              There was a problem loading posts. Please try again.               │
│                                                                                 │
│                              [ Retry ]                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Login Prompt (for voting)

When a logged-out user clicks vote:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Join the Community                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Sign up or log in to vote for posts and share your own results!                │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         [ Sign Up Free ]                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│                Already have an account? [ Log In ]                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Responsive Breakpoints

| Breakpoint | Grid Columns | Card Aspect |
|------------|--------------|-------------|
| < 640px (sm) | 1 column | Full width, larger photos |
| 640-1024px (md) | 2 columns | 16:9 photos |
| > 1024px (lg) | 3 columns | Square or 16:9 photos |
| > 1280px (xl) | 4 columns | Square photos |

---

## 10. Infinite Scroll Implementation

### 10.1 Scroll Behavior

```typescript
// Use Intersection Observer to trigger load
const loadMoreRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    },
    { rootMargin: '200px' } // Preload before reaching bottom
  );

  if (loadMoreRef.current) {
    observer.observe(loadMoreRef.current);
  }

  return () => observer.disconnect();
}, [hasNextPage, fetchNextPage]);
```

### 10.2 Loading Indicator

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                          ● ● ●  Loading more...                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 End of Feed

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                   You've reached the end! 🪨                                    │
│                                                                                 │
│              Check back later for more amazing results.                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Grid navigation | Cards are focusable, Enter to activate |
| Filter announcements | Filter changes announced to screen readers |
| Vote button | `aria-pressed` for toggle state |
| Loading state | "Loading more posts" announced |
| Image alt text | Post title used as alt for featured photo |

---

## 12. Implementation Notes

### 12.1 Component Files

```
app/(public)/gallery/
├── page.tsx                    # Gallery page
├── loading.tsx                 # Skeleton
└── error.tsx                   # Error boundary

components/
├── GalleryGrid.tsx             # Post grid container
├── GalleryPostCard.tsx         # Individual post card
├── GalleryFilters.tsx          # Sort/filter controls
├── GallerySortTabs.tsx         # Sort tab buttons
├── ShareToGalleryModal.tsx     # Share flow (reused from cycles)
├── LoginPromptModal.tsx        # Auth prompt for voting
└── InfiniteScrollTrigger.tsx   # Intersection observer trigger
```

### 12.2 URL State

Filters are stored in URL for shareability:
```
/gallery?sort=trending&specimen=agate&tag=lake-superior&period=month
```

### 12.3 Image Optimization

- Use blur placeholders while loading
- Lazy load images below the fold
- `sizes` attribute for responsive images:
  ```tsx
  <Image
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
  ```

---

## 13. Related Documents

- [06-post-detail.md](./06-post-detail.md) - Individual post view
- [07-profile.md](./07-profile.md) - User profiles (linked from author)
- [02-cycles.md](./02-cycles.md) - Share to Gallery action
- [05-API-SPEC.md](../05-API-SPEC.md) - Posts API endpoints
