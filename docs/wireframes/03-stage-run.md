# Stage Run Wireframe

> **URLs:** `/stages/:stageRunId`, `/cycles/:cycleId/stages/new`, `/stages/:stageRunId/edit`
> **Auth Required:** Yes
> **Priority:** P0 (MVP)

---

## 1. Overview

Stage runs represent individual tumbling stages within a cycle (e.g., Coarse Grit, Medium Grit, Fine Grit, Polish). Each stage tracks the tumbler used, materials, duration, photos, and optional cleaning runs.

### Pages Covered
1. **Stage Detail** (`/stages/:stageRunId`) - View stage with all details
2. **Add Stage** (`/cycles/:cycleId/stages/new`) - Create new stage
3. **Edit Stage** (`/stages/:stageRunId/edit`) - Edit stage details
4. **Complete Stage** - Modal/flow for marking stage complete

### Key User Goals
- "Track exactly what I used for this stage"
- "Set a reminder so I don't forget to check it"
- "Document progress with photos"
- "Record cleaning between stages"

---

## 2. Stage Detail Page

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Dashboard > Cycles > Lake Superior Agates > Stage 2 - Medium Grit            │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │   Stage 2 - Medium Grit                               🔄 In Progress    │  │
│   │   Lake Superior Agates                                                   │  │
│   │                                                                          │  │
│   │   Started: January 22, 2025                                              │  │
│   │   Day 4 of 7 • 57% complete                                              │  │
│   │   ██████████████████░░░░░░░░░░░░░░                                       │  │
│   │                                                                          │  │
│   │   [ ✏️ Edit ]  [ 📋 Duplicate ]  [ ✓ Complete Stage ]  [ 🗑️ Delete ]    │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌────────────────────────────────────┐  ┌──────────────────────────────────┐ │
│   │  DETAILS                           │  │  📷 PHOTOS (8)      [+ Add Photo] │ │
│   │                                    │  │                                   │ │
│   │  Tumbler                           │  │  ┌──────┐ ┌──────┐ ┌──────┐      │ │
│   │  ┌────────────────────────────┐   │  │  │Before│ │Before│ │During│      │ │
│   │  │ 📦 Lortone 3A             │   │  │  │[img] │ │[img] │ │[img] │      │ │
│   │  │ Capacity: 3 lbs           │   │  │  └──────┘ └──────┘ └──────┘      │ │
│   │  │ RPM: 30 (estimated)       │   │  │                                   │ │
│   │  └────────────────────────────┘   │  │  ┌──────┐ ┌──────┐ ┌──────┐      │ │
│   │                                    │  │  │During│ │During│ │During│      │ │
│   │  Duration                          │  │  │[img] │ │[img] │ │[img] │      │ │
│   │  7 days (168 hours)                │  │  └──────┘ └──────┘ └──────┘      │ │
│   │                                    │  │                                   │ │
│   │  Load Weight                       │  │                                   │ │
│   │  Before: 2.5 oz → After: 2.3 oz    │  │                                   │ │
│   │  (Lost 0.2 oz / 8%)                │  │                                   │ │
│   │                                    │  │                                   │ │
│   │  Materials                         │  │                                   │ │
│   │  ┌────────────────────────────┐   │  │  ┌──────┐ ┌──────┐               │ │
│   │  │ 120/220 Silicon Carbide   │   │  │  │During│ │During│               │ │
│   │  │ 2 tbsp                    │   │  │  │[img] │ │[img] │               │ │
│   │  └────────────────────────────┘   │  │  └──────┘ └──────┘               │ │
│   │  ┌────────────────────────────┐   │  │                                   │ │
│   │  │ Ceramic Media (small)     │   │  │  ← Click to open lightbox        │ │
│   │  │ 1 cup                     │   │  │                                   │ │
│   │  └────────────────────────────┘   │  └──────────────────────────────────┘ │
│   │                                    │                                       │
│   │  Reminder                          │  ┌──────────────────────────────────┐ │
│   │  ┌────────────────────────────┐   │  │  🧹 CLEANING RUN                  │ │
│   │  │ 🔔 Check on Jan 29 at 2 PM│   │  │                                   │ │
│   │  │ [Edit] [Dismiss]          │   │  │  No cleaning run recorded.        │ │
│   │  └────────────────────────────┘   │  │                                   │ │
│   │                                    │  │  [ + Add Cleaning Run ]           │ │
│   │  Notes                             │  │                                   │ │
│   │  ┌────────────────────────────┐   │  └──────────────────────────────────┘ │
│   │  │ Rocks looking good so far.│   │                                       │
│   │  │ Might need to run an      │   │                                       │
│   │  │ extra day or two.         │   │                                       │
│   │  └────────────────────────────┘   │                                       │
│   │                                    │                                       │
│   └────────────────────────────────────┘                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile Layout

```
┌─────────────────────────────────┐
│ ← Stage 2 - Medium       [•••] │
├─────────────────────────────────┤
│                                 │
│ 🔄 In Progress                  │
│ Lake Superior Agates            │
│                                 │
│ Started: January 22, 2025       │
│ Day 4 of 7 • 57% complete       │
│ █████████████░░░░░░░░░░ 57%     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  [ ✓ Complete Stage ]       │ │
│ └─────────────────────────────┘ │
│                                 │
│ DETAILS                         │
│                                 │
│ Tumbler                         │
│ ┌─────────────────────────────┐ │
│ │ 📦 Lortone 3A               │ │
│ │ Capacity: 3 lbs             │ │
│ │ RPM: 30 (estimated)         │ │
│ └─────────────────────────────┘ │
│                                 │
│ Duration                        │
│ 7 days (168 hours)              │
│                                 │
│ Load Weight                     │
│ Before: 2.5 oz → After: 2.3 oz  │
│ (Lost 0.2 oz / 8%)              │
│                                 │
│ Materials                       │
│ ┌─────────────────────────────┐ │
│ │ 120/220 Silicon Carbide     │ │
│ │ 2 tbsp                      │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Ceramic Media (small)       │ │
│ │ 1 cup                       │ │
│ └─────────────────────────────┘ │
│                                 │
│ Reminder                        │
│ ┌─────────────────────────────┐ │
│ │ 🔔 Jan 29 at 2:00 PM        │ │
│ │ [Edit]  [Dismiss]           │ │
│ └─────────────────────────────┘ │
│                                 │
│ Notes                           │
│ Rocks looking good so far...    │
│                                 │
│ 📷 PHOTOS (8)         [+ Add]   │
│                                 │
│ ┌──────┐┌──────┐┌──────┐┌──────┐│
│ │[img] ││[img] ││[img] ││[img] ││
│ │Before││Before││During││During││
│ └──────┘└──────┘└──────┘└──────┘│
│ ← swipe for more →              │
│                                 │
│ 🧹 CLEANING RUN                 │
│ ┌─────────────────────────────┐ │
│ │ No cleaning run recorded.   │ │
│ │ [ + Add Cleaning Run ]      │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### 2.3 Stage Actions Menu (Mobile ••• Menu)

```
┌─────────────────────────────────┐
│       Stage Actions             │
├─────────────────────────────────┤
│ ✏️  Edit Stage                  │
│ 📋  Duplicate Stage             │
│ 📷  Add Photos                  │
│ 🧹  Add Cleaning Run            │
├─────────────────────────────────┤
│ 🗑️  Delete Stage                │ ← Destructive, red
├─────────────────────────────────┤
│        [ Cancel ]               │
└─────────────────────────────────┘
```

### 2.4 With Cleaning Run

When a cleaning run exists, show it expanded:

```
┌──────────────────────────────────────────────────────────────────┐
│  🧹 CLEANING RUN                                    [Edit] [🗑️]  │
│                                                                  │
│  Duration: 2 days (48 hours)                                     │
│  Status: ✅ Completed                                            │
│                                                                  │
│  Materials:                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │ Burnishing Soap            │  │ Ceramic Media (small)      │ │
│  │ 1 tsp                      │  │ 1 cup                      │ │
│  └────────────────────────────┘  └────────────────────────────┘ │
│                                                                  │
│  Notes: Extra rinse cycle to remove all grit.                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Add/Edit Stage Form

### 3.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Dashboard > Cycles > Lake Superior Agates > Add Stage                         │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │   Add New Stage                                                          │  │
│   │   Lake Superior Agates                                                   │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Stage Name *                                                      │  │  │
│   │   │ ┌──────────────────────────────────────────────────────────────┐ │  │  │
│   │   │ │ Stage 2 - Medium Grit                                        │ │  │  │
│   │   │ └──────────────────────────────────────────────────────────────┘ │  │  │
│   │   │                                                                   │  │  │
│   │   │ Quick select: [Coarse] [Medium] [Fine] [Pre-Polish] [Polish]     │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Tumbler *                                                         │  │  │
│   │   │ ┌──────────────────────────────────────────────────────────────┐ │  │  │
│   │   │ │ Lortone 3A                                                ▼  │ │  │  │
│   │   │ └──────────────────────────────────────────────────────────────┘ │  │  │
│   │   │                                                                   │  │  │
│   │   │ [ + Add New Tumbler ]                                             │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Load Weight (optional)                                           │  │  │
│   │   │                                                                   │  │  │
│   │   │  Before: [ 2.5 ] oz     After: [     ] oz                        │  │  │
│   │   │                                                                   │  │  │
│   │   │  ℹ️ Weight is stored in grams and displayed per your preference   │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Barrel RPM (optional, rotary only)                               │  │  │
│   │   │                                                                   │  │  │
│   │   │  RPM: [ 30 ]   [ ] Estimated (vs measured)                       │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Duration                                                          │  │  │
│   │   │                                                                   │  │  │
│   │   │  Days: [ 7 ]  Hours: [ 0 ]     OR    Total hours: [ 168 ]        │  │  │
│   │   │                                                                   │  │  │
│   │   │  Common durations: [3 days] [5 days] [7 days] [10 days] [14 days]│  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Fill Level & Water (optional)                                    │  │  │
│   │   │                                                                   │  │  │
│   │   │  Barrel fill: [ 75 ] %                                           │  │  │
│   │   │                                                                   │  │  │
│   │   │  Water level:  ○ Just covering  ○ Halfway  ○ 3/4 full  ○ Full   │  │  │
│   │   │                                                                   │  │  │
│   │   │  Precise amount (optional): [ 250 ] ml                           │  │  │
│   │   │  ℹ️ Stored in ml, displayed per your unit preference              │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Plastic Pellets (optional)                                       │  │  │
│   │   │                                                                   │  │  │
│   │   │  [ ] Using plastic pellets        Approx: [ 20 ] % of load       │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Materials                                                         │  │  │
│   │   │                                                                   │  │  │
│   │   │ ┌─────────────────────────┐  ┌─────────┐  ┌─────────┐  ┌───────┐│  │  │
│   │   │ │ Select material...   ▼ │  │ Amount  │  │ Unit  ▼ │  │  ✕   ││  │  │
│   │   │ │ 120/220 Silicon Carb.  │  │    2    │  │  tbsp   │  │       ││  │  │
│   │   │ └─────────────────────────┘  └─────────┘  └─────────┘  └───────┘│  │  │
│   │   │                                                                   │  │  │
│   │   │ ┌─────────────────────────┐  ┌─────────┐  ┌─────────┐  ┌───────┐│  │  │
│   │   │ │ Ceramic Media (small)  │  │    1    │  │  cup    │  │  ✕   ││  │  │
│   │   │ └─────────────────────────┘  └─────────┘  └─────────┘  └───────┘│  │  │
│   │   │                                                                   │  │  │
│   │   │ [ + Add Another Material ]                                        │  │  │
│   │   │                                                                   │  │  │
│   │   │ Suggested for Medium Grit:                                        │  │  │
│   │   │ [120/220 Silicon Carbide] [220 Aluminum Oxide] [Ceramic Media]   │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Reminder (optional)                                               │  │  │
│   │   │                                                                   │  │  │
│   │   │ [ ] Set a reminder to check this stage                            │  │  │
│   │   │                                                                   │  │  │
│   │   │     When:                                                         │  │  │
│   │   │     ○ Remind after [ 7 ] days from start                          │  │  │
│   │   │     ○ Remind at end of stage                                      │  │  │
│   │   │                                                                   │  │  │
│   │   │     Note: You'll receive an email reminder                        │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Notes (optional)                                                  │  │  │
│   │   │ ┌──────────────────────────────────────────────────────────────┐ │  │  │
│   │   │ │ Using slightly more grit than usual due to rough stones.    │ │  │  │
│   │   │ │                                                              │ │  │  │
│   │   │ └──────────────────────────────────────────────────────────────┘ │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│   │   │ Photos                                                            │  │  │
│   │   │                                                                   │  │  │
│   │   │ ┌──────────────────────────────────────────────────────────────┐ │  │  │
│   │   │ │                                                              │ │  │  │
│   │   │ │     📷 Drag photos here or click to upload                   │ │  │  │
│   │   │ │                                                              │ │  │  │
│   │   │ │          [ Browse Files ]                                    │ │  │  │
│   │   │ │                                                              │ │  │  │
│   │   │ │     Accepts: JPG, PNG, HEIC • Max 10MB each                  │ │  │  │
│   │   │ │                                                              │ │  │  │
│   │   │ └──────────────────────────────────────────────────────────────┘ │  │  │
│   │   │                                                                   │  │  │
│   │   │ Uploaded:                                                         │  │  │
│   │   │ ┌────────┐  ┌────────┐                                           │  │  │
│   │   │ │ [img]  │  │ [img]  │                                           │  │  │
│   │   │ │ Before │  │ Before │                                           │  │  │
│   │   │ │   ✕    │  │   ✕    │                                           │  │  │
│   │   │ └────────┘  └────────┘                                           │  │  │
│   │   └──────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                          │  │
│   │                              [ Cancel ]  [ Save Stage ]                  │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile Layout

```
┌─────────────────────────────────┐
│ ← Add Stage                    │
├─────────────────────────────────┤
│                                 │
│ Lake Superior Agates            │
│                                 │
│ Stage Name *                    │
│ ┌─────────────────────────────┐ │
│ │ Stage 2 - Medium Grit       │ │
│ └─────────────────────────────┘ │
│                                 │
│ Quick select:                   │
│ [Coarse] [Medium] [Fine]        │
│ [Pre-Polish] [Polish]           │
│                                 │
│ Tumbler *                       │
│ ┌─────────────────────────────┐ │
│ │ Lortone 3A                ▼ │ │
│ └─────────────────────────────┘ │
│ [ + Add New Tumbler ]           │
│                                 │
│ Load Weight (optional)          │
│ ┌────────────┐ ┌────────────┐   │
│ │ Before: 2.5│ │ After:     │   │
│ │        oz  │ │        oz  │   │
│ └────────────┘ └────────────┘   │
│                                 │
│ Barrel RPM (optional)           │
│ ┌──────────┐                    │
│ │ RPM: 30  │  [ ] Estimated     │
│ └──────────┘                    │
│                                 │
│ Duration                        │
│ ┌──────────┐  ┌──────────┐      │
│ │ Days: 7  │  │ Hours: 0 │      │
│ └──────────┘  └──────────┘      │
│ [3d] [5d] [7d] [10d] [14d]      │
│                                 │
│ Fill Level (optional)           │
│ ┌─────────────────────────────┐ │
│ │ Barrel fill: [ 75 ] %       │ │
│ └─────────────────────────────┘ │
│                                 │
│ Water Level                     │
│ ○ Just covering  ○ Halfway      │
│ ○ 3/4 full       ○ Full         │
│                                 │
│ Precise amount (optional)       │
│ ┌─────────────────────────────┐ │
│ │ [ 250 ] ml                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Plastic Pellets (optional)      │
│ ┌─────────────────────────────┐ │
│ │ [ ] Using plastic pellets   │ │
│ │ Approx: [ 20 ] % of load    │ │
│ └─────────────────────────────┘ │
│                                 │
│ Materials                       │
│ ┌─────────────────────────────┐ │
│ │ 120/220 Silicon Carbide     │ │
│ │ [ 2 ] [ tbsp ▼]        [✕] │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Ceramic Media (small)       │ │
│ │ [ 1 ] [ cup ▼]         [✕] │ │
│ └─────────────────────────────┘ │
│ [ + Add Material ]              │
│                                 │
│ Suggested:                      │
│ [120/220 SiC] [220 AlOx] [Media]│
│                                 │
│ Reminder                        │
│ ┌─────────────────────────────┐ │
│ │ [ ] Set reminder            │ │
│ │ ○ After [ 7 ] days          │ │
│ │ ○ At end of stage           │ │
│ └─────────────────────────────┘ │
│                                 │
│ Notes (optional)                │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Photos                          │
│ ┌─────────────────────────────┐ │
│ │   📷 Add Photos             │ │
│ │   [ Take Photo ]            │ │
│ │   [ Choose from Library ]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌──────┐ ┌──────┐               │
│ │[img] │ │[img] │               │
│ │  ✕   │ │  ✕   │               │
│ └──────┘ └──────┘               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │      [ Save Stage ]         │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### 3.3 Material Selector

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Search materials...                              │
├─────────────────────────────────────────────────────┤
│ ABRASIVES                                           │
│   60/90 Silicon Carbide (Coarse)                    │
│   120/220 Silicon Carbide (Medium)             ← ✓  │
│   500 Silicon Carbide (Fine)                        │
│   220 Aluminum Oxide                                │
│   500 Aluminum Oxide                                │
│                                                     │
│ POLISH                                              │
│   Cerium Oxide                                      │
│   Aluminum Oxide Polish                             │
│   Tin Oxide                                         │
│                                                     │
│ MEDIA                                               │
│   Ceramic Media (small)                        ← ✓  │
│   Ceramic Media (large)                             │
│   Plastic Pellets                                   │
│                                                     │
│ ADDITIVES                                           │
│   Burnishing Soap                                   │
│   Borax                                             │
│   Baking Soda                                       │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ + Add custom material                           │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.4 Unit Selector

```
┌────────────────┐
│ tbsp      ← ✓  │
│ tsp            │
│ cup            │
│ oz             │
│ g              │
│ ml             │
│ handful        │
└────────────────┘
```

---

## 4. Complete Stage Flow

### 4.1 Complete Stage Modal

```
┌─────────────────────────────────────────────────────────────┐
│                   Complete Stage?                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Mark "Stage 2 - Medium Grit" as complete?                  │
│                                                             │
│  End Date:                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ January 29, 2025                               [📅] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Weight After (optional):                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [ 2.3 ] oz        (Lost 0.2 oz / 8%)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  RESULTS                                                    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  How did this stage turn out? ★★★★☆                        │
│  [ ★ ] [ ★ ] [ ★ ] [ ★ ] [ ☆ ]  (4/5)                      │
│                                                             │
│  ▼ Advanced quality ratings (click to expand)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Shape/Rounding:   ●──────────────────────○ 75%      │   │
│  │ Scratch Level:    ●────────────────○────── 60%      │   │
│  │ Pitting/Chips:    ●──────────────────────○ 80%      │   │
│  │ Shine:            ●────────○────────────── 40%      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Any issues? (check all that apply)                        │
│  [ ] Scratches       [ ] Chips/Bruises                     │
│  [ ] Under-rounded   [✓] Grit contamination                │
│                                                             │
│  Lessons learned (optional):                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Need to run longer next time for softer rocks.      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  PHOTOS & NOTES                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Add "After" photos (optional):                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     📷 Drag photos here or click to upload          │   │
│  │              [ Browse Files ]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────┐  ┌──────┐                                        │
│  │[img] │  │[img] │                                        │
│  │After │  │After │                                        │
│  └──────┘  └──────┘                                        │
│                                                             │
│  Completion notes (optional):                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Rocks came out great! Ready for fine grit.          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  WHAT'S NEXT?                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ○ Advance to next stage (Stage 3 - Fine Grit)             │
│  ● Repeat this stage (create Stage 2 - Run #2)             │
│  ○ Stop here (abort / re-cut stones)                       │
│                                                             │
│  Then:                                                      │
│  ○ Add a cleaning run first                                │
│  ○ Start immediately                                       │
│  ● I'll decide later                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              [ Cancel ]     [ Complete Stage ]              │
└─────────────────────────────────────────────────────────────┘
```

**Notes:**
- Result rating (1-5 stars) is always shown
- Advanced quality sliders shown only if user's `TrackingMode = Advanced` or if they expand
- Issue checkboxes help track common problems for future analysis
- "What's Next?" maps directly to `NextAction` enum: Advance/Repeat/Abort

### 4.2 Post-Completion Options

After completing, show success with next actions:

```
┌─────────────────────────────────────────────────────────────┐
│                    ✅ Stage Complete!                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Stage 2 - Medium Grit has been marked as complete.         │
│                                                             │
│  What would you like to do next?                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🧹  Add Cleaning Run                                 │   │
│  │     Clean the barrel before starting the next stage  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ➡️  Start Next Stage                                 │   │
│  │     Begin Stage 3 - Fine Grit                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ↩️  Return to Cycle                                  │   │
│  │     Go back to Lake Superior Agates                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Add Cleaning Run Modal

```
┌─────────────────────────────────────────────────────────────┐
│                   Add Cleaning Run                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  For: Stage 2 - Medium Grit                                 │
│                                                             │
│  Duration                                                   │
│  ┌──────────┐  ┌──────────┐                                │
│  │ Days: 2  │  │ Hours: 0 │                                │
│  └──────────┘  └──────────┘                                │
│  Common: [1 day] [2 days] [4 hours]                        │
│                                                             │
│  Materials                                                  │
│  ┌─────────────────────────┐  ┌──────┐  ┌───────┐  ┌─────┐│
│  │ Burnishing Soap         │  │  1   │  │ tsp ▼ │  │  ✕  ││
│  └─────────────────────────┘  └──────┘  └───────┘  └─────┘│
│                                                             │
│  ┌─────────────────────────┐  ┌──────┐  ┌───────┐  ┌─────┐│
│  │ Ceramic Media (small)   │  │  1   │  │ cup ▼ │  │  ✕  ││
│  └─────────────────────────┘  └──────┘  └───────┘  └─────┘│
│                                                             │
│  [ + Add Another Material ]                                 │
│                                                             │
│  Notes (optional)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Extra rinse to remove all grit residue.             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              [ Cancel ]     [ Save Cleaning Run ]           │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Photo Upload Component

### 6.1 Upload Zone

```
Desktop:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│         ┌───────────────────────────────────────┐           │
│         │                                       │           │
│         │       📷                              │           │
│         │                                       │           │
│         │    Drag photos here or click to       │           │
│         │    upload                             │           │
│         │                                       │           │
│         │         [ Browse Files ]              │           │
│         │                                       │           │
│         │    Accepts: JPG, PNG, HEIC            │           │
│         │    Max 10MB each • Up to 20 photos    │           │
│         │                                       │           │
│         └───────────────────────────────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Mobile:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│         ┌───────────────────────────────────────┐           │
│         │       📷  Add Photos                  │           │
│         │                                       │           │
│         │  ┌────────────┐  ┌────────────────┐  │           │
│         │  │ Take Photo │  │ Choose Library │  │           │
│         │  └────────────┘  └────────────────┘  │           │
│         │                                       │           │
│         └───────────────────────────────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Photo with Type Selection

Each uploaded photo needs a type (Before/During/After):

```
┌────────────────────────┐
│                        │
│      [Photo Image]     │
│                        │
├────────────────────────┤
│ Type: [ Before ▼]      │
│           During       │
│           After        │
├────────────────────────┤
│ Caption (optional):    │
│ [                    ] │
├────────────────────────┤
│         [ ✕ Remove ]   │
└────────────────────────┘
```

### 6.3 Upload Progress

```
┌────────────────────────┐
│                        │
│      [Photo Image]     │
│       (dimmed)         │
├────────────────────────┤
│ Uploading...           │
│ ████████░░░░░░░ 65%    │
└────────────────────────┘
```

---

## 7. Data Requirements

### 7.1 API Endpoints

| Action | Endpoint |
|--------|----------|
| Get stage | `GET /api/stages/:stageRunId` |
| Create stage | `POST /api/cycles/:cycleId/stages` |
| Update stage | `PUT /api/stages/:stageRunId` |
| Delete stage | `DELETE /api/stages/:stageRunId` |
| Complete stage | `PUT /api/stages/:stageRunId/complete` |
| Duplicate stage | `POST /api/stages/:stageRunId/duplicate` |
| Add cleaning run | `POST /api/stages/:stageRunId/cleaning` |
| Update cleaning run | `PUT /api/cleaning/:cleaningRunId` |
| Upload photo | `POST /api/stages/:stageRunId/photos` |
| Delete photo | `DELETE /api/photos/:photoId` |

### 7.2 Data Shapes

**Stage Run Detail:**
```typescript
interface StageRunDetail {
  stageRunId: string;
  cycleId: string;
  cycleName: string;
  stageName: string;
  runNumber: number;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Skipped';
  tumbler: {
    tumblerId: string;
    name: string;
    capacity: string;
  };
  startDate?: string;
  endDate?: string;
  plannedDurationHours: number;
  actualDurationHours?: number;

  // Load weight (stored in grams, displayed per user preference)
  loadWeightBeforeGrams?: number;
  loadWeightAfterGrams?: number;
  displayWeightBefore?: number;  // Calculated: oz (Imperial) or g (Metric)
  displayWeightAfter?: number;
  displayWeightUnit: 'oz' | 'g';
  weightLostPercent?: number;    // Calculated: (before - after) / before * 100

  // RPM (rotary tumblers only)
  barrelRpm?: number;
  isRpmEstimated?: boolean;

  // Fill level & water
  fillLevelPercent?: number;     // 0-100, how full is barrel
  waterLevel?: 'JustCovering' | 'Halfway' | 'ThreeQuarters' | 'Full';
  waterAmountMl?: number;        // Precise water measurement (stored in ml)
  displayWaterAmount?: number;   // Calculated: ml (Metric) or fl oz (Imperial)
  displayWaterUnit: 'ml' | 'fl oz';

  // Plastic pellets
  plasticPelletsUsed?: boolean;
  plasticPelletsPercent?: number; // Approx % of load

  materials: Array<{
    materialId: string;
    name: string;
    displayAmount: number;
    displayUnit: string;
  }>;
  photos: Photo[];
  cleaningRun?: CleaningRun;

  // Reminder options (mutually exclusive)
  reminderEnabled: boolean;
  remindAfterDays?: number;      // Days after start to remind
  remindAtEndOfStage?: boolean;  // Remind at calculated end time
  dateReminderSent?: string;

  // Result tracking (filled at completion)
  resultRating?: number;          // 1-5 star rating
  resultShapeRounding?: number;   // 0-100 quality slider
  resultScratchLevel?: number;    // 0-100 quality slider
  resultPitting?: number;         // 0-100 quality slider
  resultShine?: number;           // 0-100 quality slider
  issueScratches?: boolean;
  issueChips?: boolean;
  issueUnderRounded?: boolean;
  issueContamination?: boolean;
  lessonsLearned?: string;
  nextAction?: 'Advance' | 'Repeat' | 'Abort';

  notes?: string;
  dateCreated: string;
  dateUpdated: string;
}
```

**Cleaning Run:**
```typescript
interface CleaningRun {
  cleaningRunId: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  purpose?: 'PostStageClean' | 'PrePolishClean' | 'FinalBurnish' | 'GritRemoval';
  durationHours: number;
  materials: Array<{
    materialId: string;
    name: string;
    displayAmount: number;
    displayUnit: string;
  }>;
  notes?: string;
  resultNotes?: string;  // Results: haze removal, contamination issues
}
```

---

## 8. Interactions

### 8.1 Stage Detail Interactions

| Element | Action |
|---------|--------|
| Edit button | Navigate to `/stages/{stageRunId}/edit` |
| Duplicate button | POST duplicate, navigate to new stage |
| Complete Stage button | Open complete stage modal |
| Delete button | Confirm dialog, then delete, navigate to cycle |
| Photo thumbnail | Open lightbox |
| Add Photo button | Open upload modal |
| Add Cleaning Run | Open cleaning run modal |
| Edit Reminder | Open reminder edit inline/modal |
| Dismiss Reminder | Confirm dismiss |

### 8.2 Form Interactions

| Element | Action |
|---------|--------|
| Stage name quick select | Populate stage name field |
| Tumbler dropdown | Select tumbler, or open "add new" modal; show/hide RPM based on tumbler type |
| Weight before/after inputs | Enter decimal, unit shows based on user preference (oz/g) |
| RPM input | Enter decimal, shown only for rotary tumblers |
| RPM estimated checkbox | Toggle estimated vs measured |
| Duration quick select | Populate days field |
| Fill level input | Enter 0-100 percentage |
| Water level radio buttons | Select one: Just covering, Halfway, 3/4 full, Full |
| Water amount input | Enter precise ml/fl oz amount, stored in ml |
| Plastic pellets checkbox | Enable pellets percentage input when checked |
| Plastic pellets percent | Enter 0-100, only visible when checkbox checked |
| Material add | Add new material row |
| Material remove | Remove material row |
| Material suggestion chips | Add that material |
| Reminder checkbox | Enable/disable reminder options |
| Reminder type radio | Select "after X days" or "at end of stage" |
| Photo upload | Open file picker or camera |
| Photo type dropdown | Set Before/During/After |
| Photo remove | Remove from upload queue |

### 8.3 Complete Stage Modal Interactions

| Element | Action |
|---------|--------|
| Weight after input | Calculate and display weight lost (before - after) and percentage |
| Star rating (1-5) | Click star to set rating, required for completion |
| Advanced sliders toggle | Expand/collapse quality sliders section |
| Quality sliders (0-100) | Drag to set shape, scratch, pitting, shine values |
| Issue checkboxes | Check all that apply: scratches, chips, under-rounded, contamination |
| Lessons learned textarea | Optional free text |
| What's next radio | Select: Advance to next stage, Repeat this stage, Stop here |
| Then radio | Select: Add cleaning run first, Start immediately, Decide later |
| Complete Stage button | Validate, save results, update status, show post-completion options |

---

## 9. States

### 9.1 Loading State

Skeleton for stage detail page matching layout structure.

### 9.2 Empty States

**No Materials:**
```
Materials
┌─────────────────────────────────────────┐
│ No materials recorded.                  │
│ [ + Add Materials ]                     │
└─────────────────────────────────────────┘
```

**No Photos:**
```
📷 PHOTOS
┌─────────────────────────────────────────┐
│ No photos yet.                          │
│                                         │
│ Document your progress by adding        │
│ before, during, and after photos.       │
│                                         │
│ [ + Add Photos ]                        │
└─────────────────────────────────────────┘
```

**No Reminder:**
```
Reminder
┌─────────────────────────────────────────┐
│ No reminder set.                        │
│ [ + Set Reminder ]                      │
└─────────────────────────────────────────┘
```

### 9.3 Delete Confirmation

```
┌─────────────────────────────────────────┐
│        Delete Stage?                    │
├─────────────────────────────────────────┤
│                                         │
│  Are you sure you want to delete        │
│  "Stage 2 - Medium Grit"?               │
│                                         │
│  This will also delete:                 │
│  • 8 photos                             │
│  • 1 cleaning run                       │
│                                         │
│  This action cannot be undone.          │
│                                         │
├─────────────────────────────────────────┤
│        [ Cancel ]  [ Delete ]           │
└─────────────────────────────────────────┘
```

### 9.4 Validation Errors

```
Stage Name *
┌─────────────────────────────────────────┐
│                                         │
└─────────────────────────────────────────┘
⚠️ Stage name is required

Tumbler *
┌─────────────────────────────────────────┐
│ Select a tumbler...                  ▼  │
└─────────────────────────────────────────┘
⚠️ Please select a tumbler
```

---

## 10. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (sm) | Single column, stacked sections |
| 640-1024px (md) | Single column, wider |
| > 1024px (lg) | Two-column (details left, photos/cleaning right) |

---

## 11. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Form labels | All inputs have associated labels |
| Error announcements | Validation errors announced to screen readers |
| Progress bar | Full ARIA attributes |
| Photo grid | Images have alt text (type + caption) |
| Modal focus | Focus trapped in modals, Escape to close |
| Button states | Disabled buttons have `aria-disabled` |

---

## 12. Implementation Notes

### 12.1 Component Files

```
app/(protected)/stages/
├── [stageRunId]/
│   ├── page.tsx                # Stage detail
│   ├── loading.tsx             # Skeleton
│   └── edit/
│       └── page.tsx            # Edit stage form
└── components/
    └── (shared with cycles)

app/(protected)/cycles/[cycleId]/stages/
└── new/
    └── page.tsx                # Add stage form

components/
├── StageForm.tsx               # Shared add/edit form
├── MaterialInput.tsx           # Material row component
├── MaterialSelector.tsx        # Material dropdown
├── DurationInput.tsx           # Days/hours input
├── ReminderInput.tsx           # Reminder settings
├── PhotoUpload.tsx             # Upload zone
├── PhotoGrid.tsx               # Photo thumbnails
├── CompleteStageModal.tsx      # Completion flow
├── CleaningRunModal.tsx        # Add/edit cleaning
└── DeleteStageDialog.tsx       # Delete confirmation
```

### 12.2 Auto-populated Defaults

When creating a new stage:
- **Stage name:** Auto-suggest next stage in sequence
- **Tumbler:** If user has only one tumbler, auto-select it
- **Duration:** Default to 7 days for grit stages, 14 days for polish
- **Materials:** Suggest based on stage name (e.g., "Coarse" suggests 60/90 SiC)

### 12.3 Easy vs Advanced Mode (TrackingMode)

The user's `TrackingMode` setting (from `UserSettings.TrackingMode`) controls which optional fields are shown. Users can also fine-tune visibility via `UserSettings.StageFieldVisibility` JSONB.

**Easy Mode (default):** Shows only essential fields

| Section | Fields Shown |
|---------|--------------|
| Stage Form | Stage Name, Barrel, Duration, Materials, Notes, Photos |
| Complete Stage | End Date, Weight After, Result Rating (stars), Next Action |

**Advanced Mode:** Shows all fields

| Section | Additional Fields |
|---------|-------------------|
| Stage Form | Load Weight (before/after), Barrel RPM, Fill Level %, Water Level, Water Amount (ml/fl oz), Plastic Pellets % |
| Complete Stage | Quality Sliders (shape, scratch, pitting, shine), Issue Checkboxes, Lessons Learned |

**Field Visibility Logic:**

```typescript
// Fields hidden in Easy mode by default (can be enabled via StageFieldVisibility)
const advancedOnlyFields = [
  'loadWeight',        // Load Weight Before/After
  'barrelRpm',         // Barrel RPM
  'fillLevel',         // Fill Level %
  'waterLevel',        // Water Level radio
  'waterAmount',       // Water Amount precise (ml/fl oz)
  'plasticPellets',    // Plastic Pellets checkbox + %
  'resultSliders',     // Quality sliders (shape, scratch, pitting, shine)
  'issueFlags',        // Issue checkboxes (scratches, chips, etc.)
  'lessonsLearned',    // Lessons learned textarea
];

// Check visibility
function isFieldVisible(fieldName: string, settings: UserSettings): boolean {
  // If user has custom StageFieldVisibility, use it
  if (settings.stageFieldVisibility?.[fieldName] !== undefined) {
    return settings.stageFieldVisibility[fieldName];
  }
  // Otherwise, show in Advanced mode only
  if (advancedOnlyFields.includes(fieldName)) {
    return settings.trackingMode === TrackingMode.Advanced;
  }
  return true; // Always show essential fields
}
```

**UI Hint (shown in Easy mode):**

When in Easy mode, show a subtle hint at the bottom of forms:

```
💡 Want more tracking options? Switch to Advanced mode in Settings.
   [Show advanced fields for this stage only]
```

Clicking "Show advanced fields" expands all fields for the current form without changing global settings.

---

## 13. Related Documents

- [02-cycles.md](./02-cycles.md) - Cycle detail shows stage timeline
- [04-tumblers.md](./04-tumblers.md) - Tumbler selection
- [04-DATA-MODEL.md](../04-DATA-MODEL.md) - StageRun, CleaningRun entities
- [05-API-SPEC.md](../05-API-SPEC.md) - Stage API endpoints
