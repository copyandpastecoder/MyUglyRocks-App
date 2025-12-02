# Post Detail Wireframe

> **URL:** `/gallery/:postId`
> **Auth Required:** No (public), but voting/commenting requires auth
> **Priority:** P1 (MVP)

---

## 1. Overview

The Post Detail page shows a full gallery post with photos, cycle details, and comments. This is where the community engages with shared results.

### Key User Goals
- "See all the photos from this result"
- "Learn how they achieved this finish"
- "Give Ugly Rocks and leave a comment"
- "Ask questions about their process"

---

## 2. Post Detail Page

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Gallery > Amazing Lake Superior Agates!                                       │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │   Amazing Lake Superior Agates!                                          │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │                                                                   │  │  │
│   │   │                                                                   │  │  │
│   │   │                                                                   │  │  │
│   │   │                      [Main Photo]                                 │  │  │
│   │   │                        16:9                                       │  │  │
│   │   │                                                                   │  │  │
│   │   │                                                                   │  │  │
│   │   │                                                                   │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │  │
│   │   │[img] │  │[img] │  │[img] │  │[img] │  │[img] │  │[img] │  │[img] │ │  │  ← Photo thumbnails
│   │   │Before│  │After │  │After │  │After │  │Dur.. │  │Dur.. │  │Dur.. │ │  │
│   │   └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘ │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌──────────────────────────────────────┐  ┌────────────────────────────────┐ │
│   │                                      │  │                                 │ │
│   │  ┌────────────────────────────────┐ │  │  THE CYCLE                      │ │
│   │  │ 👤 rockfan42                   │ │  │                                 │ │
│   │  │ Posted January 28, 2025        │ │  │  Lake Superior Agates           │ │
│   │  │                                │ │  │  4 stages • 28 days total       │ │
│   │  │ [ Follow ]                     │ │  │                                 │ │
│   │  └────────────────────────────────┘ │  │  Specimens:                     │ │
│   │                                      │  │  Lake Superior Agate,           │ │
│   │  Beautiful red and orange banding   │  │  Banded Agate                   │ │
│   │  from Lake Superior. These came     │  │                                 │ │
│   │  out amazing after 4 stages! The    │  │  Final Quality: ★★★★★           │ │
│   │  mirror finish really shows off     │  │                                 │ │
│   │  the patterns.                      │  │  ┌───────────────────────────┐ │ │
│   │                                      │  │  │ Stage 1 - Coarse         │ │ │
│   │  Specimens:                          │  │  │ 7 days • Lortone 3A      │ │ │
│   │  [Lake Superior Agate] [Banded Agate]│  │  │ 60/90 Silicon Carbide    │ │ │
│   │                                      │  │  └───────────────────────────┘ │ │
│   │  Tags:                               │  │                                 │ │
│   │  🔵 Lake Superior  🟠 Agates         │  │  ┌───────────────────────────┐ │ │
│   │                                      │  │  │ Stage 2 - Medium          │ │ │
│   │  ────────────────────────────────── │  │  │ 7 days • Lortone 3A      │ │ │
│   │                                      │  │  │ 120/220 Silicon Carbide  │ │ │
│   │  ┌────────────────────────────────┐ │  │                                 │ │
│   │  │ 🪨 48 Ugly Rocks     💬 12     │ │  │  ┌───────────────────────────┐ │ │
│   │  │                                │ │  │  │ Stage 3 - Fine            │ │ │
│   │  │ [ 🪨 Give an Ugly Rock ]       │ │  │  │ 7 days • Lortone 3A      │ │ │
│   │  │                                │ │  │  │ 500 Silicon Carbide      │ │ │
│   │  └────────────────────────────────┘ │  │  └───────────────────────────┘ │ │
│   │                                      │  │                                 │ │
│   │                                      │  │  ┌───────────────────────────┐ │ │
│   └──────────────────────────────────────┘  │  │ Stage 4 - Polish          │ │ │
│                                              │  │ 7 days • Lortone 3A      │ │ │
│   ┌──────────────────────────────────────┐  │  │ Aluminum Oxide Polish    │ │ │
│   │  COMMENTS (12)                       │  │  └───────────────────────────┘ │ │
│   │                                      │  │                                 │ │
│   │  ┌────────────────────────────────┐ │  │  [ View Full Cycle ]           │ │
│   │  │ Add a comment...               │ │  │                                 │ │
│   │  │                                │ │  └────────────────────────────────┘ │
│   │  │                   [ Post ]     │ │                                     │
│   │  └────────────────────────────────┘ │                                     │
│   │                                      │                                     │
│   │  ┌────────────────────────────────┐ │                                     │
│   │  │ 👤 tumblequeen • 2 hours ago   │ │                                     │
│   │  │                                │ │                                     │
│   │  │ Stunning results! What beach   │ │                                     │
│   │  │ did you find these at?         │ │                                     │
│   │  │                                │ │                                     │
│   │  │ [ Reply ]                      │ │                                     │
│   │  │                                │ │                                     │
│   │  │   ↳ 👤 rockfan42 • 1 hour ago │ │                                     │
│   │  │     Brighton Beach in Duluth.  │ │                                     │
│   │  │     Great spot for agates!     │ │                                     │
│   │  │                                │ │                                     │
│   │  └────────────────────────────────┘ │                                     │
│   │                                      │                                     │
│   │  ┌────────────────────────────────┐ │                                     │
│   │  │ 👤 stonelover • 1 day ago      │ │                                     │
│   │  │                                │ │                                     │
│   │  │ Love the fortification pattern │ │                                     │
│   │  │ on that third one!             │ │                                     │
│   │  │                                │ │                                     │
│   │  │ [ Reply ]                      │ │                                     │
│   │  └────────────────────────────────┘ │                                     │
│   │                                      │                                     │
│   │  [ Load More Comments ]              │                                     │
│   │                                      │                                     │
│   └──────────────────────────────────────┘                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile Layout

```
┌─────────────────────────────────┐
│ ← Gallery                [•••] │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │       [Main Photo]          │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐  │
│ │img ││img ││img ││img ││img │  │  ← Horizontal scroll
│ └────┘└────┘└────┘└────┘└────┘  │
│ ← swipe for more →              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 rockfan42      [Follow]  │ │
│ │ Posted Jan 28, 2025         │ │
│ └─────────────────────────────┘ │
│                                 │
│ Amazing Lake Superior Agates!   │
│                                 │
│ Beautiful red and orange        │
│ banding from Lake Superior...   │
│ [Read more]                     │
│                                 │
│ [Lake Superior Agate]           │
│ [Banded Agate]                  │
│                                 │
│ Tags:                           │
│ 🔵 Lake Superior  🟠 Agates     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🪨 48        💬 12          │ │
│ │                             │ │
│ │ [ 🪨 Give an Ugly Rock ]    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ THE CYCLE                       │
│                                 │
│ Lake Superior Agates            │
│ 4 stages • 28 days • ★★★★★      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Stage 1 - Coarse            │ │
│ │ 7d • 60/90 SiC • Lortone 3A │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Stage 2 - Medium            │ │
│ │ 7d • 120/220 SiC            │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Stage 3 - Fine              │ │
│ │ 7d • 500 SiC                │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Stage 4 - Polish            │ │
│ │ 7d • Al Oxide Polish        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ COMMENTS (12)                   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Add a comment...            │ │
│ │                   [Post]    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 tumblequeen • 2h ago     │ │
│ │ Stunning results! What      │ │
│ │ beach did you find these?   │ │
│ │ [Reply]                     │ │
│ │   ↳ rockfan42 • 1h ago      │ │
│ │     Brighton Beach in       │ │
│ │     Duluth. Great spot!     │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Load More Comments]            │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### 2.3 Post Actions Menu (Mobile ••• or Owner)

**For Post Owner:**
```
┌─────────────────────────────────┐
│        Post Actions             │
├─────────────────────────────────┤
│ ✏️  Edit Post                   │
│ 📋  Copy Link                   │
├─────────────────────────────────┤
│ 🗑️  Delete Post                 │
├─────────────────────────────────┤
│        [ Cancel ]               │
└─────────────────────────────────┘
```

**For Other Users:**
```
┌─────────────────────────────────┐
│        Options                  │
├─────────────────────────────────┤
│ 📋  Copy Link                   │
│ 🚩  Report Post                 │
├─────────────────────────────────┤
│        [ Cancel ]               │
└─────────────────────────────────┘
```

---

## 3. Photo Gallery Component

### 3.1 Main Photo Display

The main photo is shown large with thumbnails below. Clicking a thumbnail or the main photo opens a lightbox.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                                                                              │
│                              [Main Photo]                                    │
│                              Click to view full size                         │
│                                                                              │
│                                                                              │
│                                                        Before ← Label badge  │
└──────────────────────────────────────────────────────────────────────────────┘

┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ [img]  │  │ [img]  │  │ [img]  │  │ [img]  │  │ [img]  │  │ [img]  │
│ Before │  │ After  │  │ After  │  │ After  │  │ During │  │ During │
│  ✓     │  │        │  │        │  │        │  │        │  │        │
└────────┘  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘
   ↑ Currently selected
```

### 3.2 Lightbox View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                   [ ✕ Close ]  │
│                                                                                 │
│  [ ← ]                                                              [ → ]      │
│                                                                                 │
│                                                                                 │
│                            [Full Size Photo]                                    │
│                                                                                 │
│                                                                                 │
│                                                                                 │
│                                                                                 │
│                                                                                 │
│                                                                                 │
│                                                                                 │
│                                3 / 7  •  After                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Lightbox Controls:**
- Arrow keys for navigation
- Escape to close
- Swipe on mobile
- Click outside to close
- Pinch to zoom on mobile

---

## 4. Vote Button Component

### 4.1 States

**Not Voted:**
```
┌────────────────────────────────────────┐
│  🪨 48 Ugly Rocks                      │
│                                        │
│  [ 🪨 Give an Ugly Rock ]              │  ← Primary button style
│                                        │
└────────────────────────────────────────┘
```

**Already Voted:**
```
┌────────────────────────────────────────┐
│  🪨 49 Ugly Rocks (You voted!)         │
│                                        │
│  [ ✓ Ugly Rock Given ]                 │  ← Success/green style
│                                        │
└────────────────────────────────────────┘
```

**Voting Animation:**
- Button shows brief animation (rock bouncing)
- Count increments optimistically
- Success toast: "Ugly Rock given!"

### 4.2 Vote Error

If vote fails:
```
Toast: "Couldn't save your vote. Please try again."
```
Count rolls back to previous value.

---

## 5. Comments Section

### 5.1 Comment Input

**Logged In:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Write a comment...                                          │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                              [ Post Comment ]   │
└─────────────────────────────────────────────────────────────────┘
```

**Logged Out:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [ Log in to comment ]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Comment Thread

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────┐                                                         │
│ │ 👤  │  tumblequeen • 2 hours ago                              │
│ └─────┘                                                         │
│                                                                 │
│ Stunning results! What beach did you find these at?             │
│                                                                 │
│ [ Reply ]  [ 🚩 ]                                               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ ┌───┐                                                    │  │
│   │ │👤 │  rockfan42 (author) • 1 hour ago                   │  │
│   │ └───┘                                                    │  │
│   │                                                          │  │
│   │ Brighton Beach in Duluth. Great spot for agates!         │  │
│   │                                                          │  │
│   │ [ Reply ]                                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ Reply to tumblequeen...                        [ Post ] │  │  ← Reply input
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Comment Actions

| Action | Who Can See | Behavior |
|--------|-------------|----------|
| Reply | Logged-in users | Opens reply input |
| Report | Logged-in users (not own comment) | Opens report dialog |
| Delete | Comment author or admin | Confirm, then soft delete |

### 5.4 Load More Comments

```
Showing 5 of 12 comments

[ Load More Comments ]
```

Uses "Load more" button pattern per architecture (not infinite scroll for comments).

---

## 6. Cycle Details Sidebar

Shows a summary of the cycle that was shared:

```
┌────────────────────────────────────────────────────────────┐
│  THE CYCLE                                                 │
│                                                            │
│  Lake Superior Agates                                      │
│  4 stages • 28 days total                                  │
│                                                            │
│  Specimens:                                                │
│  Lake Superior Agate, Banded Agate                         │
│                                                            │
│  Final Quality: ★★★★★                                      │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ✅ Stage 1 - Coarse                                  │ │
│  │ 7 days • Lortone 3A                                  │ │
│  │ Materials: 60/90 Silicon Carbide (2 tbsp)            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ✅ Stage 2 - Medium                                  │ │
│  │ 7 days • Lortone 3A                                  │ │
│  │ Materials: 120/220 Silicon Carbide (2 tbsp)          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ✅ Stage 3 - Fine                                    │ │
│  │ 7 days • Lortone 3A                                  │ │
│  │ Materials: 500 Silicon Carbide (2 tbsp)              │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ✅ Stage 4 - Polish                                  │ │
│  │ 7 days • Lortone 3A                                  │ │
│  │ Materials: Aluminum Oxide Polish (2 tbsp)            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [ View Full Cycle Details ]                              │  ← Only visible to author
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Note:** "View Full Cycle Details" link only appears for the post author (cycles are private).

---

## 7. Report Dialog

```
┌─────────────────────────────────────────────────────────────┐
│                    Report Post                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Why are you reporting this post?                           │
│                                                             │
│  ○ Spam or misleading                                       │
│  ○ Inappropriate content                                    │
│  ○ Harassment or hate speech                                │
│  ○ Not rock tumbling related                                │
│  ○ Other                                                    │
│                                                             │
│  Additional details (optional):                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Reports are reviewed by moderators. False reports may      │
│  result in account restrictions.                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              [ Cancel ]     [ Submit Report ]               │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Data Requirements

### 8.1 API Endpoints

| Action | Endpoint |
|--------|----------|
| Get post | `GET /api/posts/:postId` |
| Vote | `POST /api/posts/:postId/vote` |
| Remove vote | `DELETE /api/posts/:postId/vote` |
| Get comments | `GET /api/posts/:postId/comments?page=...` |
| Add comment | `POST /api/posts/:postId/comments` |
| Reply to comment | `POST /api/comments/:commentId/replies` |
| Delete comment | `DELETE /api/comments/:commentId` |
| Report post | `POST /api/posts/:postId/report` |
| Report comment | `POST /api/comments/:commentId/report` |

### 8.2 Data Shapes

**Post Detail:**
```typescript
interface PostDetail {
  postId: string;
  title: string;
  description?: string;
  photos: Array<{
    photoId: string;
    url: string;
    type: 'Before' | 'During' | 'After';
    caption?: string;
    blurHash?: string;
  }>;
  author: {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  specimens: string[];
  tags: Array<{
    tagId: string;
    name: string;
    colorHex: string;
  }>;
  cycle: {
    cycleId: string;
    name: string;
    totalDays: number;
    finalQuality?: number;
    stages: Array<{
      stageName: string;
      durationDays: number;
      tumblerName: string;
      materials: string[];
    }>;
  };
  uglyRocksCount: number;
  commentCount: number;
  hasVoted: boolean;
  isOwner: boolean;
  dateCreated: string;
}

interface Comment {
  commentId: string;
  content: string;
  author: {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isPostAuthor: boolean;
  };
  replies: Comment[];
  dateCreated: string;
  isDeleted: boolean;
}
```

---

## 9. Interactions

### 9.1 Photo Interactions

| Element | Action |
|---------|--------|
| Main photo | Open lightbox |
| Thumbnail | Set as main photo, or open lightbox |
| Lightbox arrows | Navigate photos |
| Lightbox close | Close lightbox |

### 9.2 Social Interactions

| Element | Action |
|---------|--------|
| Vote button | Toggle vote (optimistic) |
| Author name | Navigate to profile |
| Follow button | Toggle follow (future) |
| Post comment | Submit comment |
| Reply button | Show reply input |
| Report icon | Open report dialog |
| Delete (own comment) | Confirm, then delete |

---

## 10. States

### 10.1 Loading State

Skeleton matching layout structure.

### 10.2 Error State

```
┌─────────────────────────────────────────┐
│                                         │
│         [AlertCircle icon]              │
│                                         │
│       Couldn't load this post           │
│                                         │
│  The post may have been deleted or      │
│  you may not have permission to view it.│
│                                         │
│        [ Back to Gallery ]              │
│                                         │
└─────────────────────────────────────────┘
```

### 10.3 Deleted Post

If post was deleted:
```
┌─────────────────────────────────────────┐
│                                         │
│         [Trash icon]                    │
│                                         │
│         This post was removed           │
│                                         │
│  The author deleted this post.          │
│                                         │
│        [ Back to Gallery ]              │
│                                         │
└─────────────────────────────────────────┘
```

### 10.4 Comment Submission States

| State | UI |
|-------|-----|
| Idle | Normal input |
| Submitting | Input disabled, button shows spinner |
| Success | Input clears, comment appears |
| Error | Toast error, input re-enabled |

---

## 11. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 768px (md) | Single column, stacked sections |
| 768-1024px (lg) | Two columns (content left, cycle right) |
| > 1024px (xl) | Two columns, wider |

---

## 12. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Photo alt text | Type + caption (e.g., "After photo: Mirror finish") |
| Lightbox | Focus trapped, Escape to close |
| Vote button | `aria-pressed` for toggle state |
| Comments | Proper heading hierarchy |
| Reply threads | Nested list with `aria-label` |
| Time | `<time>` element with datetime attribute |

---

## 13. Implementation Notes

### 13.1 Component Files

```
app/(public)/gallery/[postId]/
├── page.tsx                    # Post detail page
├── loading.tsx                 # Skeleton
└── error.tsx                   # Error boundary

components/
├── PostDetail.tsx              # Main container
├── PostPhotoGallery.tsx        # Photo viewer + thumbnails
├── PostInfo.tsx                # Author, description, vote
├── PostCycleDetails.tsx        # Cycle sidebar
├── VoteButton.tsx              # Vote toggle
├── CommentsSection.tsx         # Comments container
├── CommentInput.tsx            # New comment form
├── CommentThread.tsx           # Comment + replies
├── PhotoLightbox.tsx           # Full-size viewer
└── ReportDialog.tsx            # Report form
```

### 13.2 SEO Metadata

```typescript
export async function generateMetadata({ params }: Props) {
  const post = await getPost(params.postId);
  return {
    title: `${post.title} | MyUglyRocks Gallery`,
    description: post.description || `${post.specimens.join(', ')} tumbling results`,
    openGraph: {
      images: [post.photos[0].url],
    },
  };
}
```

---

## 14. Related Documents

- [05-gallery.md](./05-gallery.md) - Gallery list page
- [07-profile.md](./07-profile.md) - Author profile page
- [04-DATA-MODEL.md](../04-DATA-MODEL.md) - Post, Comment entities
- [05-API-SPEC.md](../05-API-SPEC.md) - Posts, Comments API endpoints
