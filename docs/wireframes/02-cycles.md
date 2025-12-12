# Cycles Wireframe

> **URLs:** `/cycles`, `/cycles/:cycleId`, `/cycles/new`, `/cycles/:cycleId/edit`
> **Auth Required:** Yes
> **Priority:** P0 (MVP)

---

## 1. Overview

The Cycles section is the core of the application. Users create cycles to track batches of rocks through the tumbling process, from coarse grit to polish.

### Pages Covered
1. **Cycles List** (`/cycles`) - View all cycles with filtering
2. **Cycle Detail** (`/cycles/:cycleId`) - View a single cycle with stages
3. **New Cycle** (`/cycles/new`) - Create a new cycle
4. **Edit Cycle** (`/cycles/:cycleId/edit`) - Edit cycle details

### Key User Goals
- "See all my tumbling projects at a glance"
- "Track the progress of a specific batch"
- "Start a new cycle quickly"
- "Find cycles by status or specimen type"

---

## 2. Cycles List Page

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Dashboard > Cycles                                                            │
│                                                                                 │
│   My Cycles                                               [ + New Cycle ]       │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  Status: [All ▼]  [Active]  [Completed]               Sort: [Recent ▼] │  │
│   │                                                                          │  │
│   │  🔍 Search cycles...                         Filter by specimen: [All ▼] │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   Showing 12 cycles                                                             │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🟢 Lake Superior Agates                               Started Jan 15   │  │
│   │  ────────────────────────────────────────────────────────────────────── │  │
│   │  Stage 2 - Medium Grit (Day 4/7)                                        │  │
│   │  ████████████░░░░░░░░░░ 57%                                             │  │
│   │                                                                          │  │
│   │  Specimens: Lake Superior Agate, Banded Agate                           │  │
│   │  Tumbler: Lortone 3A                                                    │  │
│   │  📷 12 photos                                                           │  │
│   │                                                          [View →]       │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🟢 Beach Pebbles Batch 2                              Started Jan 12   │  │
│   │  ────────────────────────────────────────────────────────────────────── │  │
│   │  Stage 1 - Coarse Grit (Day 2/7)                                        │  │
│   │  ███░░░░░░░░░░░░░░░░░░ 28%                                              │  │
│   │                                                                          │  │
│   │  Specimens: Beach Pebbles (mixed)                                       │  │
│   │  Tumbler: Harbor Freight 3lb                                            │  │
│   │  📷 4 photos                                                            │  │
│   │                                                          [View →]       │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  ✅ Tiger Eye Collection                               Completed Jan 8  │  │
│   │  ────────────────────────────────────────────────────────────────────── │  │
│   │  Completed in 28 days • Quality: ★★★★★                                  │  │
│   │                                                                          │  │
│   │  Specimens: Tiger Eye, Hawks Eye                                        │  │
│   │  📷 24 photos  •  🌐 Shared to Gallery                                  │  │
│   │                                                          [View →]       │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌────────────────────────────────────────────────────────────────────────┐   │
│   │              [← Prev]   Page 1 of 3   [Next →]                         │   │
│   └────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile Layout

```
┌─────────────────────────────────┐
│ ← Cycles              [ + ]    │
├─────────────────────────────────┤
│                                 │
│ [Active▼] [Recent▼] [🔍]       │
│                                 │
│ 12 cycles                       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🟢 Lake Superior Agates     │ │
│ │ Stage 2 - Medium (Day 4/7)  │ │
│ │ ████████████░░░░░░░ 57%     │ │
│ │                             │ │
│ │ Lake Superior Agate, +1     │ │
│ │ 📷 12  •  Lortone 3A        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🟢 Beach Pebbles Batch 2    │ │
│ │ Stage 1 - Coarse (Day 2/7)  │ │
│ │ ███░░░░░░░░░░░░░░░ 28%      │ │
│ │                             │ │
│ │ Beach Pebbles (mixed)       │ │
│ │ 📷 4  •  Harbor Freight 3lb │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✅ Tiger Eye Collection     │ │
│ │ Completed Jan 8 • ★★★★★     │ │
│ │                             │ │
│ │ Tiger Eye, Hawks Eye        │ │
│ │ 📷 24  •  🌐 Shared         │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Load More]                     │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### 2.3 Filter Bar Component

```
Desktop:
┌──────────────────────────────────────────────────────────────────────────────┐
│ Status: [All ▼]  [Active]  [Completed]                  Sort: [Recent ▼]    │
│                                                                              │
│ 🔍 Search by name...                            Filter by specimen: [All ▼] │
└──────────────────────────────────────────────────────────────────────────────┘

Mobile (collapsed):
┌─────────────────────────────────┐
│ [Active ▼]  [Recent ▼]  [🔍]   │  ← Tap 🔍 to expand search
└─────────────────────────────────┘

Mobile (search expanded):
┌─────────────────────────────────┐
│ [🔍 Search cycles...        ✕] │
└─────────────────────────────────┘
```

**Filter Options:**

| Filter | Options |
|--------|---------|
| Status | All, Active, Completed |
| Sort | Recent (default), Oldest, Name A-Z, Name Z-A |
| Specimen | All, or specific specimen from user's history |
| Tags | Multi-select from user's tags (shown as chips) |

---

## 3. Cycle Detail Page

### 3.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Dashboard > Cycles > Lake Superior Agates                                     │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │   Lake Superior Agates                               🟢 Active           │  │
│   │   Started January 15, 2025                                               │  │
│   │                                                                          │  │
│   │   Goal: Nice polish for cabochon display                                 │  │
│   │   Tags: [beach finds] [agates] [summer 2024]                             │  │
│   │                                                                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │ Specimens: Lake Superior Agate, Banded Agate      [Edit →]     │   │  │
│   │   │ Notes: Beautiful red and orange banding, found at...            │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   │   [ ✏️ Edit ]  [ 📋 Duplicate ]  [ 📄 Save as Template ]  [ 🗑️ Delete ]  │  │
│   │                                                       [ 🌐 Share to Gallery ]  │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  STAGE TIMELINE                                        [ + Add Stage ]  │  │
│   │                                                                          │  │
│   │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│   │  │ ✅ Stage 1 - Coarse Grit                           Jan 15-22     │   │  │
│   │  │    Completed • 7 days • Lortone 3A                               │   │  │
│   │  │    Materials: 60/90 Silicon Carbide (2 tbsp)                     │   │  │
│   │  │    📷 4 photos                                         [View →]  │   │  │
│   │  │    └── 🧹 Cleaning Run: Completed (2 days)                       │   │  │
│   │  └──────────────────────────────────────────────────────────────────┘   │  │
│   │        │                                                                 │  │
│   │        ▼                                                                 │  │
│   │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│   │  │ 🔄 Stage 2 - Medium Grit                           Jan 22-??     │   │  │
│   │  │    In Progress • Day 4 of 7 • Lortone 3A                         │   │  │
│   │  │    Materials: 120/220 Silicon Carbide (2 tbsp)                   │   │  │
│   │  │    📷 8 photos                                         [View →]  │   │  │
│   │  │    ████████████████░░░░░░░░░░ 57%                                │   │  │
│   │  │    🔔 Reminder: Check tomorrow at 2:00 PM                        │   │  │
│   │  │    [ Complete Stage ]  [ Add Cleaning Run ]  [ + Add Photo ]     │   │  │
│   │  └──────────────────────────────────────────────────────────────────┘   │  │
│   │        │                                                                 │  │
│   │        ▼                                                                 │  │
│   │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│   │  │ ⏳ Stage 3 - Fine Grit                              Pending      │   │  │
│   │  │    Not started                                                   │   │  │
│   │  └──────────────────────────────────────────────────────────────────┘   │  │
│   │        │                                                                 │  │
│   │        ▼                                                                 │  │
│   │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│   │  │ ⏳ Stage 4 - Polish                                 Pending      │   │  │
│   │  │    Not started                                                   │   │  │
│   │  └──────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  📷 ALL PHOTOS (12)                                                     │  │
│   │                                                                          │  │
│   │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │  │
│   │  │ Before │  │ Before │  │ During │  │ During │  │ During │  │ During │ │  │
│   │  │ [img]  │  │ [img]  │  │ [img]  │  │ [img]  │  │ [img]  │  │ [img]  │ │  │
│   │  │ S1     │  │ S1     │  │ S1     │  │ S1     │  │ S2     │  │ S2     │ │  │
│   │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘ │  │
│   │                                                                          │  │
│   │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │  │
│   │  │ During │  │ During │  │ During │  │ During │  │ During │  │ During │ │  │
│   │  │ [img]  │  │ [img]  │  │ [img]  │  │ [img]  │  │ [img]  │  │ [img]  │ │  │
│   │  │ S2     │  │ S2     │  │ S2     │  │ S2     │  │ S2     │  │ S2     │ │  │
│   │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘ │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile Layout

```
┌─────────────────────────────────┐
│ ← Lake Superior Agates  [•••]  │
├─────────────────────────────────┤
│                                 │
│ 🟢 Active                       │
│ Started January 15, 2025        │
│                                 │
│ Goal: Nice polish               │
│ [beach finds] [agates]          │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Specimens                   │ │
│ │ Lake Superior Agate,        │ │
│ │ Banded Agate                │ │
│ │                    [Edit →] │ │
│ └─────────────────────────────┘ │
│                                 │
│ STAGE TIMELINE       [ + Add ] │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✅ Stage 1 - Coarse Grit    │ │
│ │ Completed • 7 days          │ │
│ │ Lortone 3A                  │ │
│ │ 📷 4 photos       [View →]  │ │
│ │ └── 🧹 Cleaning: Done       │ │
│ └─────────────────────────────┘ │
│        │                        │
│        ▼                        │
│ ┌─────────────────────────────┐ │
│ │ 🔄 Stage 2 - Medium Grit    │ │
│ │ In Progress • Day 4/7       │ │
│ │ Lortone 3A                  │ │
│ │ ██████████░░░░░░░░ 57%      │ │
│ │ 📷 8 photos       [View →]  │ │
│ │                             │ │
│ │ 🔔 Check tomorrow 2:00 PM   │ │
│ │                             │ │
│ │ [Complete] [Cleaning] [📷]  │ │
│ └─────────────────────────────┘ │
│        │                        │
│        ▼                        │
│ ┌─────────────────────────────┐ │
│ │ ⏳ Stage 3 - Fine Grit      │ │
│ │ Pending                     │ │
│ └─────────────────────────────┘ │
│        │                        │
│        ▼                        │
│ ┌─────────────────────────────┐ │
│ │ ⏳ Stage 4 - Polish         │ │
│ │ Pending                     │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📷 ALL PHOTOS (12)              │
│                                 │
│ ┌──────┐┌──────┐┌──────┐┌──────┐│
│ │[img] ││[img] ││[img] ││[img] ││
│ └──────┘└──────┘└──────┘└──────┘│
│ ← swipe for more →              │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### 3.3 Cycle Actions Menu (Mobile ••• Menu)

```
┌─────────────────────────────────┐
│        Cycle Actions            │
├─────────────────────────────────┤
│ ✏️  Edit Cycle                  │
│ 📋  Duplicate Cycle             │
│ 📄  Save as Template            │   ← Only for completed cycles
│ 📤  Export Cycle                │
│ 🌐  Share to Gallery            │
├─────────────────────────────────┤
│ 🗑️  Delete Cycle                │   ← Destructive, red
├─────────────────────────────────┤
│        [ Cancel ]               │
└─────────────────────────────────┘
```

---

## 4. Stage Timeline Component

### 4.1 Stage Card States

**Completed Stage:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ ✅ Stage 1 - Coarse Grit                                 Jan 15-22   │
│    Completed • 7 days • Lortone 3A                                   │
│    Materials: 60/90 Silicon Carbide (2 tbsp)                         │
│    📷 4 photos                                           [View →]    │
│    └── 🧹 Cleaning Run: Completed (2 days)                           │
└──────────────────────────────────────────────────────────────────────┘
```

**In Progress Stage:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ 🔄 Stage 2 - Medium Grit                                 Jan 22-??   │
│    In Progress • Day 4 of 7 • Lortone 3A                             │
│    Materials: 120/220 Silicon Carbide (2 tbsp)                       │
│    📷 8 photos                                           [View →]    │
│    ████████████████░░░░░░░░░░ 57%                                    │
│    🔔 Reminder: Check tomorrow at 2:00 PM                            │
│                                                                       │
│    [ Complete Stage ]  [ Add Cleaning Run ]  [ + Add Photo ]         │
└──────────────────────────────────────────────────────────────────────┘
```

**Pending Stage:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ ⏳ Stage 3 - Fine Grit                                    Pending    │
│    Not started                                                       │
│                                                                       │
│    [ Start Stage ]                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Stage Status Icons

| Status | Icon | Color |
|--------|------|-------|
| Pending | `Clock` | `text-slate-400` |
| In Progress | `RefreshCw` | `text-amber-500` (animated spin) |
| Completed | `CheckCircle` | `text-success` |
| Skipped | `SkipForward` | `text-slate-400` |

### 4.3 Timeline Connector

```css
/* Vertical line connecting stages */
.timeline-connector {
  position: absolute;
  left: 20px;
  top: 100%;
  width: 2px;
  height: 24px;
  background: theme('colors.slate.200');
}

/* Arrow indicator */
.timeline-arrow {
  /* Chevron down icon or simple triangle */
}
```

---

## 5. New/Edit Cycle Form

### 5.1 Start Options (New Cycle Only)

When creating a new cycle, users can start from scratch or use a template.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Dashboard > Cycles > New Cycle                                                │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │   New Cycle                                                              │  │
│   │                                                                          │  │
│   │   How would you like to start?                                           │  │
│   │                                                                          │  │
│   │   ┌────────────────────────────────┐  ┌────────────────────────────────┐ │  │
│   │   │                                │  │                                │ │  │
│   │   │     ✨                         │  │     📄                         │ │  │
│   │   │                                │  │                                │ │  │
│   │   │   Start from Scratch           │  │   Use a Template               │ │  │
│   │   │                                │  │                                │ │  │
│   │   │   Create a new cycle with      │  │   Pre-fill stages from one     │ │  │
│   │   │   blank settings               │  │   of your saved recipes        │ │  │
│   │   │                                │  │                                │ │  │
│   │   │        [ Select ]              │  │        [ Select ]              │ │  │
│   │   │                                │  │                                │ │  │
│   │   └────────────────────────────────┘  └────────────────────────────────┘ │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Mobile Start Options:**
```
┌─────────────────────────────────┐
│ ← New Cycle                    │
├─────────────────────────────────┤
│                                 │
│ How would you like to start?    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │        ✨                   │ │
│ │   Start from Scratch        │ │
│ │   Create a new cycle with   │ │
│ │   blank settings            │ │
│ │                             │ │
│ │       [ Select ]            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │        📄                   │ │
│ │   Use a Template            │ │
│ │   Pre-fill stages from a    │ │
│ │   saved recipe              │ │
│ │                             │ │
│ │       [ Select ]            │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### 5.2 Template Selector (if "Use a Template" selected)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Select a Template                                         [ ← Back ]          │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🔍 Search templates...                                                  │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   YOUR TEMPLATES                                                                │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  Standard 4-Stage Agate Polish                                          │  │
│   │  ───────────────────────────────────────────────────────────────────── │  │
│   │  4 stages • ~28 days                                                    │  │
│   │  Coarse → Medium → Fine → Polish                                        │  │
│   │  Used 5 times                                                           │  │
│   │                                                           [ Use This ]  │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  Quick 3-Stage Polish                                                   │  │
│   │  ───────────────────────────────────────────────────────────────────── │  │
│   │  3 stages • ~21 days                                                    │  │
│   │  Coarse → Medium → Polish                                               │  │
│   │  Used 2 times                                                           │  │
│   │                                                           [ Use This ]  │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  Soft Stone 5-Stage                                                     │  │
│   │  ───────────────────────────────────────────────────────────────────── │  │
│   │  5 stages • ~35 days                                                    │  │
│   │  Very Fine Coarse → Coarse → Medium → Fine → Polish                     │  │
│   │  Used 1 time                                                            │  │
│   │                                                           [ Use This ]  │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**No Templates Empty State:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Select a Template                                         [ ← Back ]          │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │                              📄                                          │  │
│   │                                                                          │  │
│   │                     No templates yet                                     │  │
│   │                                                                          │  │
│   │   Create your first template by completing a cycle,                      │  │
│   │   then using "Save as Template" from the cycle detail page.              │  │
│   │                                                                          │  │
│   │                    [ Start from Scratch Instead ]                        │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Desktop Layout (Cycle Form)

**Field Order:** Start Date → Rocks/Specimens → Other Specimens → Cycle Name → Notes

**Validation:** At least one of Rocks/Specimens or Other Specimens must have a value.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Dashboard > Cycles > New Cycle                                                │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │   Start New Cycle                                                        │  │
│   │   Begin tracking a new tumbling cycle                                    │  │
│   │                                                                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │ Start Date *                                               ⓘ    │   │  │
│   │   │ ┌─────────────────────────────────────────────────────────────┐ │   │  │
│   │   │ │ January 15, 2025                                       [📅] │ │   │  │
│   │   │ └─────────────────────────────────────────────────────────────┘ │   │  │
│   │   │ The date your first tumbling stage begins                        │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │ Rocks/Specimens *                                          ⓘ    │   │  │
│   │   │ ┌─────────────────────────────────────────────────────────────┐ │   │  │
│   │   │ │ Select specimens from the list...                        ▼  │ │   │  │
│   │   │ └─────────────────────────────────────────────────────────────┘ │   │  │
│   │   │                                                                  │   │  │
│   │   │ ┌────────────────────────┐  ┌────────────────────────┐          │   │  │
│   │   │ │ Lake Superior Agate (7)✕│  │ Banded Agate (7)     ✕│          │   │  │
│   │   │ └────────────────────────┘  └────────────────────────┘          │   │  │
│   │   │                                                                  │   │  │
│   │   │ Select the types of rocks you're tumbling. Search by name,       │   │  │
│   │   │ alias, variety, or family.                                       │   │  │
│   │   │                                                                  │   │  │
│   │   │ ⚠️ Hardness Warning: Selected specimens have a hardness          │   │  │
│   │   │    difference of 2 (range: 5 - 7). Tumbling rocks with more      │   │  │
│   │   │    than 1 point difference may damage softer specimens.          │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │ Other Specimens *                                                │   │  │
│   │   │ ┌─────────────────────────────────────────────────────────────┐ │   │  │
│   │   │ │ Any specimens not in the list above...                      │ │   │  │
│   │   │ │                                                             │ │   │  │
│   │   │ └─────────────────────────────────────────────────────────────┘ │   │  │
│   │   │ Add any additional rocks not found in the dropdown               │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │ Cycle Name *                                               ⓘ    │   │  │
│   │   │ ┌─────────────────────────────────────────────────────────────┐ │   │  │
│   │   │ │ Lake Superior Agate, Banded Agate - 01/15/2025             │ │   │  │
│   │   │ └─────────────────────────────────────────────────────────────┘ │   │  │
│   │   │ A descriptive name to identify this batch                        │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │ Notes (optional)                                                 │   │  │
│   │   │ ┌─────────────────────────────────────────────────────────────┐ │   │  │
│   │   │ │ Beautiful red and orange banding. Found at Brighton        │ │   │  │
│   │   │ │ Beach last summer. Some have nice fortification patterns.  │ │   │  │
│   │   │ │                                                             │ │   │  │
│   │   │ └─────────────────────────────────────────────────────────────┘ │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   │                              [ Cancel ]  [ Start Cycle ]                 │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Field Tooltips:**

| Field | Tooltip |
|-------|---------|
| Start Date | The date Stage 1 begins. This should be when you first loaded the tumbler for this batch. |
| Rocks/Specimens | Select the rock types you're tumbling. Search by common name, alias, variety, or family. |
| Other Specimens | Add any rocks not found in the dropdown list. |
| Cycle Name | Auto-generated from your specimens and start date. Feel free to customize! |

**Cycle Name Auto-Generation:**
- Format: `{Specimen1}, {Specimen2} - {StartDate}`
- Date uses user's `DateFormat` preference from settings
- If >3 specimens: `{Specimen1}, {Specimen2}, {Specimen3} +N more - {Date}`
- User can edit after auto-generation
- Re-generates if specimens or date change

**Specimen Chips:**
- Display with theme-aware colors (`bg-primary/25`, `border-primary/50`)
- Show hardness in parentheses: `Lake Superior Agate (7)`
- X button to remove

### 5.4 Mobile Layout

```
┌─────────────────────────────────┐
│ ← New Cycle                    │
├─────────────────────────────────┤
│                                 │
│ Specimens *                ⓘ    │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search by name...     ▼  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌────────────────┐ ┌──────────┐ │
│ │Lake Superior  ✕│ │Banded   ✕│ │
│ │Agate          │ │Agate     │ │
│ │Mohs: 6.5-7    │ │Mohs: 6.5-7│ │
│ └────────────────┘ └──────────┘ │
│                                 │
│ Start Date *               ⓘ    │
│ ┌─────────────────────────────┐ │
│ │ January 15, 2025       [📅] │ │
│ └─────────────────────────────┘ │
│                                 │
│ Cycle Name *               ⓘ    │
│ ┌─────────────────────────────┐ │
│ │ Lake Superior Agate,       │ │
│ │ Banded Agate - 01/15/2025  │ │
│ └─────────────────────────────┘ │
│ ✨ Auto-generated. Edit to      │
│    customize.                   │
│                                 │
│ Goal (optional)                 │
│ ┌─────────────────────────────┐ │
│ │ Nice polish...              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Tags (optional)                 │
│ ┌─────────────────────────────┐ │
│ │ Type to add tags...         │ │
│ └─────────────────────────────┘ │
│ [beach finds ✕] [agates ✕]      │
│                                 │
│ Notes (optional)                │
│ ┌─────────────────────────────┐ │
│ │ Beautiful red and orange    │ │
│ │ banding...                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │      [ Create Cycle ]       │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### 5.5 Specimen Selector (Enhanced Multi-select)

**Search:** Matches on `CommonName`, `Alias`, `Species`, and `Variety` fields.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search specimens...                                        [⚙️ Columns]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ RECENT / POPULAR                                                             │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ☐ Lake Superior Agate       Chalcedony    Mohs: 6.5-7    Easy           │ │
│ │ ☑ Banded Agate              Chalcedony    Mohs: 6.5-7    Easy           │ │
│ │ ☐ Jasper                    Chalcedony    Mohs: 6.5-7    Easy           │ │
│ │ ☐ Tiger Eye                 Quartz        Mohs: 7        Medium         │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ALL SPECIMENS (A-Z)                                                          │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ☐ Amazonite                 Feldspar      Mohs: 6-6.5    Medium         │ │
│ │ ☐ Amethyst                  Quartz        Mohs: 7        Easy           │ │
│ │ ☐ Apache Tears              Obsidian      Mohs: 5-5.5    Hard           │ │
│ │ ☐ Aventurine                Quartz        Mohs: 7        Easy           │ │
│ │ ... (scrollable)                                                        │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ + Add custom specimen                                                    │ │
│ │   Can't find your rock? Enter it manually.                              │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                         [ Done (2 selected) ]                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Column Settings Popover (⚙️ Columns):**

```
┌─────────────────────────────────┐
│ Visible Columns                 │
├─────────────────────────────────┤
│ ☑ Common Name      (always on)  │
│ ☑ Rock Family                   │
│ ☐ Species                       │
│ ☐ Variety                       │
│ ☐ Alias                         │
│ ☑ Max Hardness (Mohs)           │
│ ☑ Tumbling Difficulty           │
├─────────────────────────────────┤
│ [ Reset to Default ]            │
└─────────────────────────────────┘
```

**Default visible columns:** CommonName, RockFamily, MohsHardnessMax, TumblingDifficulty

### 5.6 Add Custom Specimen Modal

When user clicks "+ Add custom specimen":

```
┌─────────────────────────────────────────────────────────────────┐
│                    Add Custom Specimen                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Can't find your rock in our database? Add it here.             │
│  You can suggest it be added to the global list later.          │
│                                                                 │
│  Common Name *                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Petoskey Stone                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Rock Family (optional)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Fossil                                               ▼  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Mohs Hardness (optional)                                       │
│  ┌────────────┐  to  ┌────────────┐                            │
│  │ Min: 3     │      │ Max: 4     │                            │
│  └────────────┘      └────────────┘                            │
│                                                                 │
│  Tumbling Difficulty                                            │
│  ○ Easy   ● Medium   ○ Hard   ○ Unknown                        │
│                                                                 │
│  Notes (optional)                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Michigan state stone, fossilized coral                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ☐ Suggest this specimen be added to the global database        │
│    (Helps other users find it!)                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│              [ Cancel ]        [ Add to Cycle ]                 │
└─────────────────────────────────────────────────────────────────┘
```

**Custom Specimen Behavior:**
- Saved to user's `Specimen` table with `IsUserCreated = true`
- Available for future cycles (shows in "Your Custom Specimens" section)
- If "Suggest" checkbox is checked, creates `SpecimenSuggestion` for admin review

---

## 6. Data Requirements

### 6.1 API Endpoints

| Page | Endpoint |
|------|----------|
| Cycles List | `GET /api/cycles?status=...&sort=...&page=...` |
| Cycle Detail | `GET /api/cycles/:cycleId` |
| Create Cycle | `POST /api/cycles` |
| Update Cycle | `PUT /api/cycles/:cycleId` |
| Delete Cycle | `DELETE /api/cycles/:cycleId` |
| Duplicate Cycle | `POST /api/cycles/:cycleId/duplicate` |
| Save as Template | `POST /api/templates` (with cycleId in body) |
| List Templates | `GET /api/templates` |
| Create from Template | `POST /api/cycles/from-template` |
| Cycle Photos | `GET /api/cycles/:cycleId/photos` |

### 6.2 Data Shapes

**Cycle List Item:**
```typescript
interface CycleListItem {
  cycleId: string;
  name: string;
  status: 'Active' | 'Completed';
  startDate: string;
  endDate?: string;
  goal?: string;                  // "Nice polish", "Shaping only", etc.
  tags: Array<{ tagId: string; name: string; color?: string }>;
  currentStage?: {
    stageName: string;
    dayNumber: number;
    totalDays: number;
    percentComplete: number;
  };
  specimens: Array<{ name: string }>;
  tumbler?: { name: string };
  photoCount: number;
  isSharedToGallery: boolean;
  finalQuality?: number;          // 1-5 stars
  difficultyRating?: number;      // 1-5 difficulty (user set or auto)
}
```

**Cycle Detail:**
```typescript
interface CycleDetail {
  cycleId: string;
  name: string;
  status: 'Active' | 'Completed';
  startDate: string;
  endDate?: string;
  goal?: string;                  // User's objective for this cycle
  difficultyRating?: number;      // 1-5 difficulty
  notes?: string;
  finalQuality?: number;
  tags: Array<{
    tagId: string;
    name: string;
    color?: string;
  }>;
  specimens: Array<{
    specimenId: string;
    name: string;
    mohsHardnessMin: number;
    mohsHardnessMax: number;
  }>;
  stages: StageRun[];
  photos: Photo[];
  post?: { postId: string }; // If shared to gallery
}
```

---

## 7. Interactions

### 7.1 Cycle List Interactions

| Element | Action |
|---------|--------|
| Cycle card | Navigate to `/cycles/{cycleId}` |
| "+ New Cycle" button | Navigate to `/cycles/new` |
| Status filter buttons | Filter list, update URL params |
| Sort dropdown | Re-sort list, update URL params |
| Search input | Debounce 300ms, filter list |
| Pagination | Navigate pages, scroll to top |

### 7.2 Cycle Detail Interactions

| Element | Action |
|---------|--------|
| Edit button | Navigate to `/cycles/{cycleId}/edit` |
| Duplicate button | POST duplicate, navigate to new cycle |
| Save as Template | Open template modal (completed cycles only) |
| Delete button | Confirm dialog, then delete |
| Share to Gallery | Open share modal |
| Stage "View" | Navigate to `/stages/{stageRunId}` |
| Stage "Complete" | Confirm dialog, complete stage |
| Stage "Start" | Navigate to add stage form |
| "+ Add Stage" | Navigate to `/cycles/{cycleId}/stages/new` |
| "+ Add Photo" | Open photo upload modal |
| Photo thumbnail | Open lightbox |

### 7.3 Form Interactions

| Element | Action |
|---------|--------|
| Cancel button | Navigate back (with unsaved changes warning) |
| Submit button | Validate, submit, navigate to new/updated cycle |
| Goal input | Free text, max 255 characters |
| Tags input | Type to search/create tags, suggestions shown below |
| Tag chip remove (✕) | Remove tag from cycle |
| Tag suggestion click | Add that tag |
| Specimen selector | Open multi-select dropdown |
| Date picker | Open calendar component |

---

## 8. States

### 8.1 Loading States

**Cycles List Loading:**
```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 8.2 Empty States

**No Cycles:**
```
┌─────────────────────────────────────────┐
│           [Layers icon]                 │
│                                         │
│        No cycles yet                    │
│                                         │
│  Start tracking your first rock         │
│  tumbling cycle.                        │
│                                         │
│       [ + Start New Cycle ]             │
└─────────────────────────────────────────┘
```

**No Results (with filters):**
```
┌─────────────────────────────────────────┐
│           [Search icon]                 │
│                                         │
│       No matching cycles                │
│                                         │
│  Try adjusting your filters or          │
│  search terms.                          │
│                                         │
│        [ Clear Filters ]                │
└─────────────────────────────────────────┘
```

### 8.3 Delete Confirmation Dialog

```
┌─────────────────────────────────────────┐
│        Delete Cycle?                    │
├─────────────────────────────────────────┤
│                                         │
│  Are you sure you want to delete        │
│  "Lake Superior Agates"?                │
│                                         │
│  This will also delete:                 │
│  • 4 stage runs                         │
│  • 12 photos                            │
│                                         │
│  This action cannot be undone.          │
│                                         │
├─────────────────────────────────────────┤
│        [ Cancel ]  [ Delete ]           │
└─────────────────────────────────────────┘
```

### 8.4 Hardness Warning

When specimens with very different hardness are selected:

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Hardness Mismatch                                            │
│                                                                 │
│ You've selected specimens with different hardness levels:       │
│ • Obsidian (Mohs 5-5.5)                                         │
│ • Jasper (Mohs 6.5-7)                                           │
│                                                                 │
│ Softer stones may get damaged when tumbled with harder stones.  │
│ Consider separating them into different cycles.                 │
│                                                                 │
│ [ Continue Anyway ]  [ Remove Obsidian ]                        │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 Save as Template Modal

Only available for completed cycles. Creates a reusable template from the cycle's stage configuration.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Save as Template                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Create a reusable template from this cycle's stages.           │
│                                                                 │
│  Template Name *                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Standard 4-Stage Agate Polish                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Description (optional)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ My tried-and-true process for agates. Works great       │   │
│  │ for any Mohs 6.5-7 material.                            │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  STAGES TO INCLUDE                                              │
│                                                                 │
│  ☑ Stage 1 - Coarse Grit                                        │
│    7 days • 60/90 Silicon Carbide                               │
│                                                                 │
│  ☑ Stage 2 - Medium Grit                                        │
│    7 days • 120/220 Silicon Carbide                             │
│                                                                 │
│  ☑ Stage 3 - Fine Grit                                          │
│    7 days • 500 Silicon Carbide                                 │
│                                                                 │
│  ☑ Stage 4 - Polish                                             │
│    7 days • Aluminum Oxide Polish                               │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ℹ️ Templates save stage configuration (duration, materials,    │
│     tumbler settings). Actual dates and photos are not saved.   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│              [ Cancel ]        [ Save Template ]                │
└─────────────────────────────────────────────────────────────────┘
```

**Mobile version** is a bottom sheet with the same fields in a scrollable format.

---

## 9. Responsive Breakpoints

| Breakpoint | List Layout | Detail Layout | Form Layout |
|------------|-------------|---------------|-------------|
| < 640px (sm) | Single column, cards stacked | Single column | Single column |
| 640-1024px (md) | Single column, wider cards | Single column | Single column, wider |
| > 1024px (lg) | Single column, max-width 4xl | Two columns (timeline + photos) | Centered form, max-width 2xl |

---

## 10. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Filter state | Announce filter changes to screen readers |
| List count | "Showing 12 cycles" announced on filter change |
| Stage status | Status icons have `aria-label` describing state |
| Progress bars | Full ARIA attributes (see dashboard wireframe) |
| Delete confirmation | Focus trapped in dialog, Escape to close |
| Form validation | Errors announced, focus moves to first error |

---

## 11. Implementation Notes

### 11.1 Component Files

```
app/(protected)/cycles/
├── page.tsx                    # Cycles list page
├── loading.tsx                 # List loading skeleton
├── error.tsx                   # Error boundary
├── new/
│   └── page.tsx               # New cycle form
├── [cycleId]/
│   ├── page.tsx               # Cycle detail
│   ├── loading.tsx            # Detail loading skeleton
│   └── edit/
│       └── page.tsx           # Edit cycle form
└── components/
    ├── CycleList.tsx          # List with filters
    ├── CycleCard.tsx          # List item card
    ├── CycleFilters.tsx       # Filter bar
    ├── CycleDetail.tsx        # Detail view container
    ├── CycleHeader.tsx        # Title, status, actions
    ├── CycleForm.tsx          # Create/edit form
    ├── StageTimeline.tsx      # Stage timeline container
    ├── StageCard.tsx          # Individual stage card
    ├── SpecimenSelector.tsx   # Multi-select specimen picker
    ├── TagInput.tsx           # Tag chips with autocomplete
    ├── HardnessWarning.tsx    # Hardness mismatch alert
    ├── DeleteCycleDialog.tsx  # Delete confirmation
    ├── ShareToGalleryModal.tsx # Share flow
    ├── SaveAsTemplateModal.tsx # Save cycle as template
    ├── StartOptionSelector.tsx # Scratch vs Template choice
    └── TemplateSelector.tsx    # Template list for new cycle
```

### 11.2 URL State Management

Filters are stored in URL query params for shareability and browser history:

```
/cycles?status=active&sort=recent&specimen=agate&page=1
```

Use `useSearchParams` from Next.js to sync with URL.

---

## 12. Related Documents

- [01-dashboard.md](./01-dashboard.md) - Dashboard uses cycle data
- [03-stage-run.md](./03-stage-run.md) - Stage detail pages
- [04-DATA-MODEL.md](../04-DATA-MODEL.md) - Cycle and StageRun entities
- [05-API-SPEC.md](../05-API-SPEC.md) - Cycle API endpoints
