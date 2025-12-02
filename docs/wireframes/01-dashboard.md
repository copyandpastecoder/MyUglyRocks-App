# Dashboard Wireframe

> **URL:** `/dashboard`
> **Auth Required:** Yes
> **Priority:** P0 (MVP)

---

## 1. Overview

The dashboard is the authenticated user's home page. It provides a quick overview of their tumbling activity and easy access to common actions.

### Purpose
- Show current tumbling status at a glance
- Provide quick access to active cycles
- Display recent activity
- Encourage engagement with the gallery

### Key User Goals
- "What's running right now?"
- "What needs my attention?"
- "Start a new cycle quickly"

---

## 2. Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Welcome back, {displayName}!                          [ + Start New Cycle ]  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  📊 YOUR STATS                                                          │  │
│   │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────┐│  │
│   │  │ Active Cycles │  │   Completed   │  │  Total Photos │  │ Ugly Rocks││  │
│   │  │      3        │  │      12       │  │      156      │  │   received││  │
│   │  │               │  │               │  │               │  │     48    ││  │
│   │  └───────────────┘  └───────────────┘  └───────────────┘  └───────────┘│  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────┐  ┌─────────────────────────────────┐│
│   │  🔄 ACTIVE CYCLES (3)        [View All] │  │  🕐 RECENT ACTIVITY              ││
│   │                                       │  │                                   ││
│   │  ┌─────────────────────────────────┐ │  │  • Completed Stage 2 - Medium     ││
│   │  │ Lake Superior Agates            │ │  │    Lake Superior Agates           ││
│   │  │ Stage 2 - Medium (Day 4/7)      │ │  │    2 hours ago                    ││
│   │  │ ████████░░░░░░░ 57%             │ │  │                                   ││
│   │  │ 🔔 Reminder: Check tomorrow     │ │  │  • Added 3 photos to Stage 1     ││
│   │  └─────────────────────────────────┘ │  │    Jasper Batch                   ││
│   │                                       │  │    Yesterday                      ││
│   │  ┌─────────────────────────────────┐ │  │                                   ││
│   │  │ Beach Pebbles Batch 2           │ │  │  • Started new cycle              ││
│   │  │ Stage 1 - Coarse (Day 2/7)      │ │  │    Beach Pebbles Batch 2          ││
│   │  │ ███░░░░░░░░░░░░ 28%             │ │  │    2 days ago                     ││
│   │  └─────────────────────────────────┘ │  │                                   ││
│   │                                       │  │  • Received 5 Ugly Rocks          ││
│   │  ┌─────────────────────────────────┐ │  │    "Amazing Agate Results!"        ││
│   │  │ Tiger Eye Collection            │ │  │    3 days ago                     ││
│   │  │ Cleaning Run (Day 1/2)          │ │  │                                   ││
│   │  │ █████████░░░░░░ 50%             │ │  │  [View All Activity →]            ││
│   │  └─────────────────────────────────┘ │  │                                   ││
│   │                                       │  │                                   ││
│   └─────────────────────────────────────┘  └─────────────────────────────────┘│
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🌟 FROM THE GALLERY                                      [Browse All →] │  │
│   │                                                                          │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│   │  │    [img]     │  │    [img]     │  │    [img]     │  │    [img]     │ │  │
│   │  │              │  │              │  │              │  │              │ │  │
│   │  │ Amazing Agate│  │ Beach Glass  │  │ Jasper Magic │  │ Obsidian Set │ │  │
│   │  │ @rockfan42   │  │ @tumblequeen │  │ @stonelover  │  │ @gemhunter   │ │  │
│   │  │ 🪨 48  💬 12 │  │ 🪨 35  💬 8  │  │ 🪨 29  💬 5  │  │ 🪨 24  💬 3  │ │  │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Desktop Grid
- **Main Container:** max-w-7xl (1280px), centered with px-6 padding
- **Stats Section:** 4-column grid, equal widths
- **Middle Section:** 2-column grid (cycles 60%, activity 40%)
- **Gallery Section:** 4-column grid for post cards

---

## 3. Mobile Layout

```
┌─────────────────────────────────┐
│ MyUglyRocks           [👤]     │
├─────────────────────────────────┤
│                                 │
│ Welcome back, {name}!           │
│                                 │
│ [ + Start New Cycle ]           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📊 YOUR STATS               │ │
│ │ ┌─────────┐ ┌─────────┐     │ │
│ │ │Active  3│ │Complete12│    │ │
│ │ └─────────┘ └─────────┘     │ │
│ │ ┌─────────┐ ┌─────────┐     │ │
│ │ │Photos156│ │Rocks  48│     │ │
│ │ └─────────┘ └─────────┘     │ │
│ └─────────────────────────────┘ │
│                                 │
│ 🔄 ACTIVE CYCLES        [All →] │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Lake Superior Agates        │ │
│ │ Stage 2 - Medium (Day 4/7)  │ │
│ │ ████████░░░░ 57%            │ │
│ │ 🔔 Check tomorrow           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Beach Pebbles Batch 2       │ │
│ │ Stage 1 - Coarse (Day 2/7)  │ │
│ │ ███░░░░░░░░ 28%             │ │
│ └─────────────────────────────┘ │
│                                 │
│ 🕐 RECENT ACTIVITY      [All →] │
│                                 │
│ • Completed Stage 2 - Medium    │
│   Lake Superior Agates          │
│   2 hours ago                   │
│                                 │
│ • Added 3 photos                │
│   Jasper Batch · Yesterday      │
│                                 │
│ 🌟 FROM THE GALLERY    [Browse] │
│                                 │
│ ┌────────────┐ ┌────────────┐   │
│ │   [img]    │ │   [img]    │   │
│ │Amazing Aga.│ │Beach Glass │   │
│ │ 🪨48  💬12 │ │ 🪨35  💬8  │   │
│ └────────────┘ └────────────┘   │
│                                 │
│ ← swipe for more →              │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### Mobile Layout Notes
- **Stats:** 2x2 grid instead of 4 columns
- **Cycles:** Stacked vertically, show max 2-3 with "View All" link
- **Activity:** Collapsed to 2-3 items
- **Gallery:** Horizontal scroll carousel (2 visible, swipeable)
- **Bottom Nav:** Fixed at bottom

---

## 4. Component Breakdown

### 4.1 Stats Cards

```
┌─────────────────────────┐
│  [Icon]                 │
│  Active Cycles          │  ← Label (text-sm text-slate-500)
│  3                      │  ← Value (text-3xl font-bold)
└─────────────────────────┘
```

| Stat | Icon | Color |
|------|------|-------|
| Active Cycles | `Layers` | Primary (amber) |
| Completed | `CheckCircle` | Success (green) |
| Total Photos | `Camera` | Info (blue) |
| Ugly Rocks Received | `Rock` (custom) | Primary (amber) |

**Styles:**
- Background: `bg-white border border-slate-200 rounded-lg`
- Padding: `p-4` (mobile), `p-6` (desktop)
- Shadow: `shadow-sm`

### 4.2 Active Cycle Card

```
┌─────────────────────────────────────────────────┐
│ Lake Superior Agates                    [→]    │  ← Cycle name + link arrow
│ Stage 2 - Medium                               │  ← Current stage
│ Day 4 of 7                                     │  ← Progress text
│ ████████████░░░░░░░░░░░░ 57%                   │  ← Progress bar
│                                                │
│ 🔔 Reminder: Check tomorrow at 2:00 PM         │  ← Optional reminder badge
└─────────────────────────────────────────────────┘
```

**Progress Bar Colors:**
| Progress | Color |
|----------|-------|
| 0-25% | `bg-slate-300` |
| 26-50% | `bg-amber-400` |
| 51-75% | `bg-amber-500` |
| 76-99% | `bg-amber-600` |
| 100% | `bg-success` |

**Card Styles:**
- Background: `bg-white border border-slate-200 rounded-lg`
- Hover: `hover:border-primary hover:shadow-md transition-all`
- Clickable: Entire card links to cycle detail

### 4.3 Activity Item

```
┌─────────────────────────────────────────────────┐
│ [●] Completed Stage 2 - Medium                 │
│     Lake Superior Agates                       │
│     2 hours ago                                │
└─────────────────────────────────────────────────┘
```

**Activity Types & Icons:**
| Type | Icon | Color |
|------|------|-------|
| `stage_completed` | `CheckCircle` | Success |
| `cycle_started` | `Play` | Primary |
| `cycle_completed` | `Trophy` | Success |
| `photo_added` | `Camera` | Info |
| `post_created` | `Share` | Primary |
| `received_uglyrocks` | `Rock` | Primary |
| `received_comment` | `MessageSquare` | Info |

### 4.4 Gallery Post Card (Thumbnail)

```
┌──────────────────────────┐
│                          │
│        [Photo]           │  ← 1:1 aspect ratio
│                          │
├──────────────────────────┤
│ Amazing Agate Results!   │  ← Title (truncate)
│ @rockfan42               │  ← Username
│ 🪨 48  💬 12             │  ← Stats
└──────────────────────────┘
```

**Styles:**
- Image: `aspect-square object-cover rounded-t-lg`
- Card: `bg-white border border-slate-200 rounded-lg overflow-hidden`
- Hover: `hover:shadow-lg transition-shadow`

---

## 5. Data Requirements

### 5.1 API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/users/me` | User profile, display name |
| `GET /api/users/me/stats` | Stats cards data |
| `GET /api/cycles?status=active&limit=3` | Active cycles list |
| `GET /api/activity?limit=5` | Recent activity feed |
| `GET /api/posts?sort=uglyrocks&limit=4` | Popular gallery posts |

### 5.2 Data Shapes

**User Stats:**
```typescript
interface DashboardStats {
  activeCycles: number;
  completedCycles: number;
  totalPhotos: number;
  uglyRocksReceived: number;
}
```

**Active Cycle Summary:**
```typescript
interface ActiveCycleSummary {
  cycleId: string;
  name: string;
  currentStage: {
    stageRunId: string;
    stageName: string;
    dayNumber: number;
    totalDays: number;
    percentComplete: number;
  } | null;
  nextReminder: {
    message: string;
    dateTime: string;
  } | null;
}
```

---

## 6. Interactions

### 6.1 Click/Tap Targets

| Element | Action |
|---------|--------|
| "Start New Cycle" button | Navigate to `/cycles/new` |
| Stat card | No action (informational) |
| Active cycle card | Navigate to `/cycles/{cycleId}` |
| "View All" (cycles) | Navigate to `/cycles?status=active` |
| Activity item | Navigate to relevant page (cycle/post) |
| "View All Activity" | Navigate to `/activity` (or modal) |
| Gallery post card | Navigate to `/gallery/{postId}` |
| "Browse All" (gallery) | Navigate to `/gallery` |

### 6.2 Hover States

- **Cycle cards:** Border changes to primary color, subtle shadow
- **Gallery cards:** Elevated shadow
- **Links:** Underline or primary color

### 6.3 Keyboard Navigation

- Tab through all interactive elements
- Enter/Space to activate buttons and links
- Focus visible ring on all interactive elements

---

## 7. States

### 7.1 Loading State

Show skeleton screens matching layout structure:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Welcome back, ████████!                               [░░░░░░░░░░░░░░░░░]    │
│                                                                                 │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│   │ ░░░░░░░░░░░   │  │ ░░░░░░░░░░░   │  │ ░░░░░░░░░░░   │  │ ░░░░░░░░░░░   │   │
│   │ ████████      │  │ ████████      │  │ ████████      │  │ ████████      │   │
│   └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                                                 │
│   ┌─────────────────────────────────┐  ┌─────────────────────────────────────┐ │
│   │ ░░░░░░░░░░░░░░░░░░░             │  │ ░░░░░░░░░░░░░░░░░░░░░░░░           │ │
│   │ ████████████░░░░░░░░░░░         │  │ ████░░░░░░░░░░░░░░░░░░░░           │ │
│   │ ░░░░░░░░░░░░░░░                 │  │ ░░░░░░░                             │ │
│   └─────────────────────────────────┘  │                                     │ │
│                                         │ ████░░░░░░░░░░░░░░░░░░░░           │ │
│   ┌─────────────────────────────────┐  │ ░░░░░░░                             │ │
│   │ ░░░░░░░░░░░░░░░░░░░             │  └─────────────────────────────────────┘ │
│   │ ████████████░░░░░░░░░░░         │                                          │
│   └─────────────────────────────────┘                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Use shimmer animation from design system (see `00-design-system.md` Section 11.1).

### 7.2 Empty States

**No Active Cycles:**
```
┌─────────────────────────────────────────┐
│           [Layers icon]                 │
│                                         │
│       No active cycles                  │
│                                         │
│  Start your first cycle to track        │
│  your rock tumbling progress.           │
│                                         │
│       [ + Start New Cycle ]             │
└─────────────────────────────────────────┘
```

**No Recent Activity:**
```
┌─────────────────────────────────────────┐
│         [Clock icon]                    │
│                                         │
│      No recent activity                 │
│                                         │
│  Activity will appear here as you       │
│  work on your cycles.                   │
└─────────────────────────────────────────┘
```

**New User (No Stats):**
- Show all stats as "0"
- Emphasize "Start New Cycle" CTA
- Consider showing onboarding tips

### 7.3 Error State

If dashboard data fails to load:

```
┌─────────────────────────────────────────┐
│         [AlertCircle icon]              │
│                                         │
│    Couldn't load your dashboard         │
│                                         │
│  There was a problem loading your       │
│  data. Please try again.                │
│                                         │
│           [ Retry ]                     │
└─────────────────────────────────────────┘
```

---

## 8. Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|----------------|
| < 640px (sm) | Mobile layout, 2x2 stats grid, stacked sections |
| 640-768px (md) | Stats 4-column, cycles/activity still stacked |
| 768-1024px (lg) | Two-column layout for cycles/activity |
| > 1024px (xl) | Full desktop layout |

---

## 9. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Heading hierarchy | h1: "Welcome back", h2: section titles |
| Skip link | Skip to main content (targets dashboard container) |
| ARIA labels | Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Focus management | Visible focus ring on all interactive elements |
| Color contrast | All text meets WCAG AA (4.5:1 for normal text) |
| Screen reader | Stats announced as "3 active cycles", not just "3" |

### Progress Bar ARIA

```html
<div
  role="progressbar"
  aria-valuenow="57"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Stage progress: 57% complete, day 4 of 7"
>
  <div class="h-2 bg-amber-500 rounded" style="width: 57%"></div>
</div>
```

---

## 10. Implementation Notes

### 10.1 Component Files

```
app/(protected)/dashboard/
├── page.tsx                    # Server component, fetches initial data
├── loading.tsx                 # Skeleton loading state
├── error.tsx                   # Error boundary
└── components/
    ├── DashboardStats.tsx      # Stats cards grid
    ├── ActiveCyclesList.tsx    # Active cycles section
    ├── ActiveCycleCard.tsx     # Individual cycle card
    ├── RecentActivity.tsx      # Activity feed
    ├── ActivityItem.tsx        # Individual activity item
    ├── GalleryPreview.tsx      # Gallery cards section
    └── GalleryPostCard.tsx     # Individual post thumbnail
```

### 10.2 Data Fetching Strategy

1. **Initial load:** Server Component fetches all dashboard data in parallel
2. **Subsequent visits:** React Query with `staleTime: 30000` (30 seconds)
3. **Real-time updates:** Consider WebSocket for activity feed (post-MVP)

### 10.3 Performance Considerations

- Lazy load gallery images below the fold
- Use `priority` on first 2 gallery images if visible
- Skeleton screens prevent layout shift
- Cache dashboard data with short TTL

---

## 11. Future Enhancements (Post-MVP)

- [ ] Customizable dashboard widgets (drag-and-drop)
- [ ] Quick actions dropdown (duplicate cycle, share results)
- [ ] Weather integration for outdoor tumbling
- [ ] Achievement badges display
- [ ] Tumbler status indicators (running/idle)
- [ ] "Needs Attention" section for overdue stages

---

## 12. Related Documents

- [00-design-system.md](./00-design-system.md) - Component styles, colors, typography
- [03-SITEMAP.md](../03-SITEMAP.md) - Navigation structure
- [05-API-SPEC.md](../05-API-SPEC.md) - API endpoint details
- [04-DATA-MODEL.md](../04-DATA-MODEL.md) - Data structures
