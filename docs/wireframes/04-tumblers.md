# Tumblers Wireframe

> **URL:** `/tumblers`
> **Auth Required:** Yes
> **Priority:** P0 (MVP)

---

## 1. Overview

The Tumblers page allows users to manage their rock tumbler inventory. Users add their tumblers once, then select from this list when creating stage runs.

### Key User Goals
- "Keep track of all my tumblers"
- "Quickly select the right tumbler for a stage"
- "Know which tumbler is currently in use"

---

## 2. Tumblers List Page

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   My Tumblers                                              [ + Add Tumbler ]    │
│                                                                                 │
│   Manage your rock tumbler collection. Select a tumbler when starting          │
│   a new stage run.                                                              │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  📦  Lortone 3A                                        🟢 Active   │ │  │
│   │  │                                                                     │ │  │
│   │  │  Capacity: 3 lbs • Type: Rotary                                     │ │  │
│   │  │  🎯 Dedicated: Polish only                                          │ │  │
│   │  │  🧹 Last deep clean: Jan 10, 2025 (19 days ago)                     │ │  │
│   │  │                                                                     │ │  │
│   │  │  Currently running: Lake Superior Agates - Stage 2                  │ │  │
│   │  │                                                                     │ │  │
│   │  │  Total cycles: 8 • Completed: 6                                     │ │  │
│   │  │                                                                     │ │  │
│   │  │                                        [ ✏️ Edit ]  [ 🗑️ Delete ]  │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  📦  Harbor Freight 3lb                                🟢 Active   │ │  │
│   │  │                                                                     │ │  │
│   │  │  Capacity: 3 lbs                                                    │ │  │
│   │  │  Barrel Size: 3 lbs                                                 │ │  │
│   │  │  Type: Rotary                                                       │ │  │
│   │  │                                                                     │ │  │
│   │  │  Currently running: Beach Pebbles Batch 2 - Stage 1                 │ │  │
│   │  │                                                                     │ │  │
│   │  │  Total cycles: 12 • Completed: 10                                   │ │  │
│   │  │                                                                     │ │  │
│   │  │                                        [ ✏️ Edit ]  [ 🗑️ Delete ]  │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  📦  Lortone QT6 (Double Barrel)                       🔵 Idle     │ │  │
│   │  │                                                                     │ │  │
│   │  │  Capacity: 6 lbs (2x 3lb barrels)                                   │ │  │
│   │  │  Barrel Size: 6 lbs                                                 │ │  │
│   │  │  Type: Rotary                                                       │ │  │
│   │  │                                                                     │ │  │
│   │  │  Not currently in use                                               │ │  │
│   │  │                                                                     │ │  │
│   │  │  Total cycles: 3 • Completed: 3                                     │ │  │
│   │  │                                                                     │ │  │
│   │  │                                        [ ✏️ Edit ]  [ 🗑️ Delete ]  │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  📦  Old Rotary (Garage)                               ⚫ Inactive │ │  │
│   │  │                                                                     │ │  │
│   │  │  Capacity: 1.5 lbs                                                  │ │  │
│   │  │  Barrel Size: 1.5 lbs                                               │ │  │
│   │  │  Type: Rotary                                                       │ │  │
│   │  │                                                                     │ │  │
│   │  │  Marked as inactive • Total cycles: 2                               │ │  │
│   │  │                                                                     │ │  │
│   │  │                                  [ Reactivate ]  [ 🗑️ Delete ]     │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile Layout

```
┌─────────────────────────────────┐
│ ← Tumblers             [ + ]   │
├─────────────────────────────────┤
│                                 │
│ Manage your rock tumblers.      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📦 Lortone 3A      🟢 Active│ │
│ │                             │ │
│ │ Capacity: 3 lbs             │ │
│ │ Type: Rotary                │ │
│ │                             │ │
│ │ Running: Lake Superior      │ │
│ │ Agates - Stage 2            │ │
│ │                             │ │
│ │ 8 cycles • 6 completed      │ │
│ │                             │ │
│ │ [Edit]         [Delete]     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📦 Harbor Freight  🟢 Active│ │
│ │ 3lb                         │ │
│ │                             │ │
│ │ Capacity: 3 lbs             │ │
│ │ Type: Rotary                │ │
│ │                             │ │
│ │ Running: Beach Pebbles      │ │
│ │ Batch 2 - Stage 1           │ │
│ │                             │ │
│ │ 12 cycles • 10 completed    │ │
│ │                             │ │
│ │ [Edit]         [Delete]     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📦 Lortone QT6     🔵 Idle  │ │
│ │                             │ │
│ │ Capacity: 6 lbs             │ │
│ │ Not in use                  │ │
│ │                             │ │
│ │ 3 cycles • 3 completed      │ │
│ │                             │ │
│ │ [Edit]         [Delete]     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📦 Old Rotary    ⚫ Inactive│ │
│ │                             │ │
│ │ Capacity: 1.5 lbs           │ │
│ │ Marked as inactive          │ │
│ │                             │ │
│ │ [Reactivate]    [Delete]    │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

---

## 3. Add/Edit Tumbler Modal

Using a modal instead of a separate page since the form is simple.

### 3.1 Desktop Modal - Brand/Model Selection

```
┌─────────────────────────────────────────────────────────────┐
│                    Add New Tumbler                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Brand *                                                ⓘ   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Lortone                                          ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Model *                                                ⓘ   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3A                                               ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  Auto-detected from model:                                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                             │
│  Type: Rotary                                               │
│  Capacity: 3 lbs                                            │
│  Barrels: 1                                                 │
│                                          [ Edit manually ]  │
│                                                             │
│  Notes (optional)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Bought in 2022. Has some wear on the belt.          │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  BARREL SETTINGS                                            │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Barrel 1 Name                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Chompy                          [🎲 Suggest name]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ ] Dedicated barrel (reserved for specific stages)       │
│                                                             │
│  Dedicated to:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Polish only                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  e.g., "Polish only", "Coarse only"                         │
│                                                             │
│  Last deep clean:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ January 10, 2025                               [📅] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Contamination notes (optional):                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Some 60 grit residue in barrel grooves.             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Status                                                     │
│  ○ Active - Available for new cycles                       │
│  ○ Inactive - Not currently in use                         │
│                                                             │
│  💡 Don't see your tumbler? Select "Generic" or "Other"     │
│     from the brand list to enter details manually.          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              [ Cancel ]     [ Save Tumbler ]                │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Desktop Modal - Multi-Barrel Tumbler (e.g., QT6)

```
┌─────────────────────────────────────────────────────────────┐
│                    Add New Tumbler                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Brand *                                                ⓘ   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Lortone                                          ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Model *                                                ⓘ   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ QT6 (Dual Barrel)                                ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  Auto-detected from model:                                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                             │
│  Type: Rotary                                               │
│  Capacity: 3 lbs per barrel                                 │
│  Barrels: 2                                                 │
│                                          [ Edit manually ]  │
│                                                             │
│  Notes (optional)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  NAME YOUR BARRELS                                     ⓘ    │
│  Give each barrel a name to tell them apart                 │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Barrel 1                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Chompy                          [🎲 Suggest name]   │   │
│  └─────────────────────────────────────────────────────┘   │
│  [ ] Dedicated       Dedicated to: [Polish only      ]     │
│                                                             │
│  Barrel 2                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Gritty                          [🎲 Suggest name]   │   │
│  └─────────────────────────────────────────────────────┘   │
│  [ ] Dedicated       Dedicated to: [                 ]     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Status                                                     │
│  ○ Active   ○ Inactive                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              [ Cancel ]     [ Save Tumbler ]                │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Desktop Modal - Generic/Custom Entry

When user selects "Generic", "DIY", or "Other" brand:

```
┌─────────────────────────────────────────────────────────────┐
│                    Add New Tumbler                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Brand *                                                ⓘ   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Generic                                          ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Model *                                                ⓘ   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Rotary - Custom                                  ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Tumbler Type *                                        ⓘ   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ● Rotary    ○ Vibratory                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Barrel Capacity *                                     ⓘ   │
│  ┌───────────────────┐  ┌─────────────────────────────┐    │
│  │ 3                 │  │ lbs                      ▼  │    │
│  └───────────────────┘  └─────────────────────────────┘    │
│                                                             │
│  Number of Barrels                                     ⓘ   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1                                                ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Notes (optional)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ DIY build with PVC barrel                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  BARREL SETTINGS                                            │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Barrel 1 Name                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Old Reliable                    [🎲 Suggest name]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ ] Dedicated barrel                                       │
│  Last deep clean: [                               📅]       │
│  Contamination notes: [                               ]     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Status                                                     │
│  ○ Active   ○ Inactive                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              [ Cancel ]     [ Save Tumbler ]                │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Mobile (Full-screen sheet)

```
┌─────────────────────────────────┐
│ Add Tumbler              [ ✕ ] │
├─────────────────────────────────┤
│                                 │
│ Brand *                         │
│ ┌─────────────────────────────┐ │
│ │ Lortone                  ▼  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Model *                         │
│ ┌─────────────────────────────┐ │
│ │ 3A                       ▼  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Auto-detected:                  │
│ Type: Rotary • 3 lbs • 1 barrel │
│                  [Edit manually]│
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                 │
│ Notes (optional)                │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│ BARREL SETTINGS                 │
│ ─────────────────────────────── │
│                                 │
│ Barrel 1 Name                   │
│ ┌─────────────────────────────┐ │
│ │ Chompy              [🎲]    │ │
│ └─────────────────────────────┘ │
│                                 │
│ [ ] Dedicated barrel            │
│ Dedicated to: [Polish only    ] │
│                                 │
│ Last deep clean                 │
│ ┌─────────────────────────────┐ │
│ │ January 10, 2025       [📅] │ │
│ └─────────────────────────────┘ │
│                                 │
│ Contamination notes             │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ Status                          │
│ ○ Active   ○ Inactive           │
│                                 │
│ 💡 Can't find your tumbler?     │
│    Select "Generic" or "Other"  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │     [ Save Tumbler ]        │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Component Breakdown

### 4.1 Tumbler Card

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  📦  Lortone 3A                                        🟢 Active   │
│                                                                     │
│  Capacity: 3 lbs                                                    │
│  Barrel Size: 3 lbs                                                 │
│  Type: Rotary                                                       │
│                                                                     │
│  Currently running: Lake Superior Agates - Stage 2                  │  ← Only if in use
│                                                                     │
│  Total cycles: 8 • Completed: 6                                     │
│                                                                     │
│                                        [ ✏️ Edit ]  [ 🗑️ Delete ]  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 4.2 Status Badges

| Status | Badge | Color | Description |
|--------|-------|-------|-------------|
| Active (in use) | 🟢 Active | `bg-success/10 text-success` | Currently used in a running stage |
| Active (idle) | 🔵 Idle | `bg-info/10 text-info` | Available but not currently in use |
| Inactive | ⚫ Inactive | `bg-slate-100 text-slate-500` | Marked as not in use |

### 4.3 Card Actions

**Active Tumbler:**
- Edit - Opens edit modal
- Delete - Confirmation dialog

**Inactive Tumbler:**
- Reactivate - Changes status to active
- Delete - Confirmation dialog

---

## 5. Data Requirements

### 5.1 API Endpoints

| Action | Endpoint |
|--------|----------|
| List tumblers | `GET /api/tumblers` |
| Get tumbler | `GET /api/tumblers/:tumblerId` |
| Create tumbler | `POST /api/tumblers` |
| Update tumbler | `PUT /api/tumblers/:tumblerId` |
| Delete tumbler | `DELETE /api/tumblers/:tumblerId` |

### 5.2 API Endpoints (New)

| Action | Endpoint |
|--------|----------|
| List tumbler models | `GET /api/tumbler-models` |
| Get models by brand | `GET /api/tumbler-models?brand=Lortone` |
| Suggest barrel nickname | `GET /api/barrel-nicknames/random` |

### 5.3 Data Shapes

**TumblerModel (Seed Data):**
```typescript
interface TumblerModel {
  tumblerModelId: string;
  brand: string;                           // "Lortone", "Generic", etc.
  model: string;                           // "3A", "QT6", "Rotary - Custom"
  tumblerType: 'Rotary' | 'Vibratory';
  defaultCapacityLbs?: number;             // null for custom entries
  defaultBarrelCount: number;              // 1, 2, 4, etc.
  isCustomEntry: boolean;                  // true for Generic/DIY/Other
  sortOrder: number;
}
```

**Tumbler:**
```typescript
interface Tumbler {
  tumblerId: string;
  tumblerModelId?: string;                 // FK to TumblerModel (null for legacy)
  brand: string;                           // e.g., "Lortone" (from model or manual)
  model?: string;                          // e.g., "3A" (from model or manual)
  tumblerType: 'Rotary' | 'Vibratory';
  isActive: boolean;
  notes?: string;

  // Barrels (1:N relationship)
  barrels: Barrel[];

  // Computed/joined
  currentCycle?: {
    cycleId: string;
    cycleName: string;
    currentStageName: string;
  };
  stats: {
    totalCycles: number;
    completedCycles: number;
  };

  dateCreated: string;
  dateUpdated: string;
}
```

**Barrel:**
```typescript
interface Barrel {
  barrelId: string;
  tumblerId: string;
  barrelNumber: number;                    // 1, 2, 3...
  nickname?: string;                       // e.g., "Chompy", "Gritty"
  capacity?: number;                       // Capacity value
  isCapacityMetric: boolean;               // false = lbs, true = kg

  // Barrel maintenance
  isDedicated: boolean;                    // "Polish-only" barrel flag
  dedicatedStages?: string[];              // ['polish', 'burnish']
  dateLastDeepClean?: string;              // ISO date
  contaminationNotes?: string;             // Contamination history

  isActive: boolean;
  dateCreated: string;
  dateUpdated: string;
}
```

---

## 6. Interactions

### 6.1 List Interactions

| Element | Action |
|---------|--------|
| "+ Add Tumbler" button | Open add tumbler modal |
| Edit button | Open edit tumbler modal |
| Delete button | Open delete confirmation |
| Reactivate button | Toggle `isActive` to true |
| "Currently running" link | Navigate to cycle |

### 6.2 Form Interactions

| Element | Action |
|---------|--------|
| Cancel button | Close modal without saving |
| Save button | Validate, save, close modal, show toast |
| Dedicated barrel checkbox | Enable/show purpose field when checked |
| Dedicated purpose input | Free text, max 100 characters |
| Last deep clean date picker | Open calendar component |
| Contamination notes textarea | Free text |
| Status toggle | Switch between Active/Inactive |

---

## 7. States

### 7.1 Loading State

Skeleton cards matching the card layout.

### 7.2 Empty State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [Box icon]                               │
│                                                             │
│              No tumblers added yet                          │
│                                                             │
│   Add your first tumbler to start tracking your             │
│   rock tumbling cycles.                                     │
│                                                             │
│                 [ + Add Tumbler ]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Delete Confirmation

**Can delete (no active cycles):**
```
┌─────────────────────────────────────────────────────────────┐
│                    Delete Tumbler?                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Are you sure you want to delete "Lortone 3A"?              │
│                                                             │
│  This tumbler has been used in 8 cycles.                    │
│  The cycles will remain, but won't show this tumbler.       │
│                                                             │
│  This action cannot be undone.                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              [ Cancel ]     [ Delete ]                      │
└─────────────────────────────────────────────────────────────┘
```

**Cannot delete (has active cycle):**
```
┌─────────────────────────────────────────────────────────────┐
│                    Cannot Delete Tumbler                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  "Lortone 3A" cannot be deleted because it's currently      │
│  being used in:                                             │
│                                                             │
│  • Lake Superior Agates - Stage 2                           │
│                                                             │
│  Complete or remove the tumbler from active stages first.   │
│                                                             │
│  Alternatively, you can mark this tumbler as inactive.      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│        [ Mark Inactive ]     [ Close ]                      │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Validation Errors

```
Name *
┌─────────────────────────────────────────────────────────────┐
│                                                             │
└─────────────────────────────────────────────────────────────┘
⚠️ Tumbler name is required

Capacity *
┌──────────┐  ┌─────────────────────────────────┐
│ 0        │  │ lbs                          ▼  │
└──────────┘  └─────────────────────────────────┘
⚠️ Capacity must be greater than 0
```

---

## 8. Tumbler Selection in Stage Form

When selecting a tumbler in the stage form, show the user's tumblers:

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search tumblers...                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ AVAILABLE                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📦 Lortone 3A                         🟢 Running       │ │
│ │    3 lbs • Rotary                                       │ │
│ │    Currently: Lake Superior Agates - Stage 2            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📦 Harbor Freight 3lb                 🟢 Running       │ │
│ │    3 lbs • Rotary                                       │ │
│ │    Currently: Beach Pebbles - Stage 1                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📦 Lortone QT6                        🔵 Idle          │ │
│ │    6 lbs • Rotary                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ INACTIVE                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📦 Old Rotary (Garage)                ⚫ Inactive       │ │  ← Disabled/dimmed
│ │    1.5 lbs • Rotary                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ + Add New Tumbler                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Notes:**
- Inactive tumblers shown but not selectable
- "Running" tumblers can still be selected (same tumbler can run multiple stages if user has multiple barrels or wants to track it that way)
- Quick add option at bottom

---

## 9. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (sm) | Single column, stacked cards |
| 640-1024px (md) | Single column, wider cards |
| > 1024px (lg) | Two-column grid |

---

## 10. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Card as region | Cards have `role="article"` or semantic structure |
| Status announced | Status badges have `aria-label` (e.g., "Status: Active") |
| Modal focus | Focus trapped in modal, close on Escape |
| Form labels | All inputs have associated labels |
| Delete confirmation | Destructive action requires confirmation |

---

## 11. Implementation Notes

### 11.1 Component Files

```
app/(protected)/tumblers/
├── page.tsx                    # Tumblers list page
├── loading.tsx                 # Skeleton
└── components/
    ├── TumblerList.tsx         # List container
    ├── TumblerCard.tsx         # Individual tumbler card
    ├── TumblerFormModal.tsx    # Add/edit modal
    ├── DeleteTumblerDialog.tsx # Delete confirmation
    └── TumblerSelector.tsx     # Dropdown for stage form
```

### 11.2 Auto-selection Logic

When creating a new stage:
- If user has exactly 1 active tumbler → auto-select it
- If user has 0 tumblers → prompt to add one first
- If user has multiple → show selector

---

## 12. Related Documents

- [03-stage-run.md](./03-stage-run.md) - Tumbler selection in stage form
- [04-DATA-MODEL.md](../04-DATA-MODEL.md) - Tumbler entity
- [05-API-SPEC.md](../05-API-SPEC.md) - Tumbler API endpoints
