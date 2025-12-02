# Templates Wireframe

> **URL:** `/templates`
> **Auth Required:** Yes
> **Priority:** P1 (MVP)

---

## 1. Overview

Templates are saved "recipes" that allow users to save and reuse their successful tumbling processes. Users can create templates from completed cycles or build them from scratch, then apply them when starting new cycles.

### Key User Goals
- "Save my successful process to use again"
- "Apply a proven recipe to a new batch"
- "Start with a beginner template and learn"
- "Share my process with the community" (future)

---

## 2. Templates List Page

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   My Templates                                            [ + Create Template ] │
│                                                                                 │
│   Save your successful processes as templates to reuse on future batches.       │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  [My Templates]  [System Templates]                                      │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  📋  Standard 4-Stage Agate                                        │ │  │
│   │  │                                                                     │ │  │
│   │  │  My go-to process for Lake Superior agates. Works great!            │ │  │
│   │  │                                                                     │ │  │
│   │  │  Stages: 4 • Specimens: Agate                                       │ │  │
│   │  │  Stage 1 (7d) → Stage 2 (7d) → Pre-Polish (7d) → Polish (7d)       │ │  │
│   │  │                                                                     │ │  │
│   │  │  Used 8 times • Last used: Jan 15, 2025                            │ │  │
│   │  │                                                                     │ │  │
│   │  │         [ 👁️ View ]  [ ✏️ Edit ]  [ 🚀 Use ]  [ 🗑️ Delete ]       │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  📋  Jasper Extended Process                                       │ │  │
│   │  │                                                                     │ │  │
│   │  │  Extra time in coarse stage for harder jasper pieces.               │ │  │
│   │  │                                                                     │ │  │
│   │  │  Stages: 4 • Specimens: Jasper                                      │ │  │
│   │  │  Stage 1 (10d) → Stage 2 (7d) → Pre-Polish (7d) → Polish (7d)      │ │  │
│   │  │                                                                     │ │  │
│   │  │  Used 3 times • Last used: Dec 28, 2024                            │ │  │
│   │  │                                                                     │ │  │
│   │  │         [ 👁️ View ]  [ ✏️ Edit ]  [ 🚀 Use ]  [ 🗑️ Delete ]       │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  📋  Quick Polish (Soft Stones)                                    │ │  │
│   │  │                                                                     │ │  │
│   │  │  Shorter process for softer specimens like obsidian.                │ │  │
│   │  │                                                                     │ │  │
│   │  │  Stages: 3 • Specimens: Obsidian, Fluorite                          │ │  │
│   │  │  Stage 1 (5d) → Stage 2 (5d) → Polish (5d)                          │ │  │
│   │  │                                                                     │ │  │
│   │  │  Used 2 times • Last used: Jan 5, 2025                             │ │  │
│   │  │                                                                     │ │  │
│   │  │         [ 👁️ View ]  [ ✏️ Edit ]  [ 🚀 Use ]  [ 🗑️ Delete ]       │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 System Templates Tab

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   My Templates                                            [ + Create Template ] │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  [My Templates]  [System Templates]                                      │  │  ← Active tab
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   Pre-made templates to help you get started.                                   │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  ⭐  Beginner 4-Stage Standard                              System │ │  │
│   │  │                                                                     │ │  │
│   │  │  The classic 4-stage process. Great starting point for most        │ │  │
│   │  │  rocks with hardness 6-7.                                           │ │  │
│   │  │                                                                     │ │  │
│   │  │  Stages: 4                                                          │ │  │
│   │  │  Stage 1 - Coarse (7d) → Stage 2 - Medium (7d) →                   │ │  │
│   │  │  Stage 3 - Pre-Polish (7d) → Stage 4 - Polish (7d)                 │ │  │
│   │  │                                                                     │ │  │
│   │  │                             [ 👁️ View ]  [ 📋 Copy ]  [ 🚀 Use ]   │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  ⭐  Soft Stone 3-Stage                                     System │ │  │
│   │  │                                                                     │ │  │
│   │  │  Shorter process for softer stones (hardness 4-5.5).                │ │  │
│   │  │  Skips coarse stage to prevent over-grinding.                       │ │  │
│   │  │                                                                     │ │  │
│   │  │  Stages: 3                                                          │ │  │
│   │  │  Stage 2 - Medium (5d) → Stage 3 - Pre-Polish (5d) →               │ │  │
│   │  │  Stage 4 - Polish (5d)                                              │ │  │
│   │  │                                                                     │ │  │
│   │  │                             [ 👁️ View ]  [ 📋 Copy ]  [ 🚀 Use ]   │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                                                                     │ │  │
│   │  │  ⭐  Hard Stone Extended                                    System │ │  │
│   │  │                                                                     │ │  │
│   │  │  Extended coarse stage for very hard stones (hardness 7+).          │ │  │
│   │  │                                                                     │ │  │
│   │  │  Stages: 4                                                          │ │  │
│   │  │  Stage 1 - Coarse (10d) → Stage 2 - Medium (7d) →                  │ │  │
│   │  │  Stage 3 - Pre-Polish (7d) → Stage 4 - Polish (7d)                 │ │  │
│   │  │                                                                     │ │  │
│   │  │                             [ 👁️ View ]  [ 📋 Copy ]  [ 🚀 Use ]   │ │  │
│   │  │                                                                     │ │  │
│   │  └────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Mobile Layout

```
┌─────────────────────────────────┐
│ ← Templates             [ + ]   │
├─────────────────────────────────┤
│                                 │
│ [My Templates] [System]         │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📋 Standard 4-Stage Agate   │ │
│ │                             │ │
│ │ My go-to process for Lake   │ │
│ │ Superior agates.            │ │
│ │                             │ │
│ │ 4 stages • Agate            │ │
│ │ Used 8 times                │ │
│ │                             │ │
│ │ [View] [Edit] [Use] [...]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📋 Jasper Extended Process  │ │
│ │                             │ │
│ │ Extra time in coarse stage  │ │
│ │ for harder jasper.          │ │
│ │                             │ │
│ │ 4 stages • Jasper           │ │
│ │ Used 3 times                │ │
│ │                             │ │
│ │ [View] [Edit] [Use] [...]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📋 Quick Polish (Soft)      │ │
│ │                             │ │
│ │ Shorter process for softer  │ │
│ │ specimens.                  │ │
│ │                             │ │
│ │ 3 stages • Obsidian         │ │
│ │ Used 2 times                │ │
│ │                             │ │
│ │ [View] [Edit] [Use] [...]   │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

---

## 3. Template Detail View

### 3.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ← Back to Templates                                                           │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  Standard 4-Stage Agate                                                  │  │
│   │                                                                          │  │
│   │  My go-to process for Lake Superior agates. Works great for most         │  │
│   │  banded agates with similar hardness.                                    │  │
│   │                                                                          │  │
│   │  Specimens: [Lake Superior Agate]                                        │  │
│   │                                                                          │  │
│   │  Used 8 times • Created: Dec 1, 2024 • Last modified: Jan 10, 2025      │  │
│   │                                                                          │  │
│   │  [ ✏️ Edit Template ]    [ 🚀 Use Template ]    [ 📋 Duplicate ]         │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   Stages (4 total • ~28 days)                                                   │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  1️⃣  Stage 1 - Coarse                                          7 days  │  │
│   │  ─────────────────────────────────────────────────────────────────────  │  │
│   │  Materials:                                                              │  │
│   │    • 60/90 Silicon Carbide - 2 tbsp                                     │  │
│   │                                                                          │  │
│   │  2️⃣  Stage 2 - Medium                                          7 days  │  │
│   │  ─────────────────────────────────────────────────────────────────────  │  │
│   │  Materials:                                                              │  │
│   │    • 120/220 Silicon Carbide - 2 tbsp                                   │  │
│   │                                                                          │  │
│   │  3️⃣  Stage 3 - Pre-Polish                                      7 days  │  │
│   │  ─────────────────────────────────────────────────────────────────────  │  │
│   │  Materials:                                                              │  │
│   │    • 500 Aluminum Oxide - 2 tbsp                                        │  │
│   │                                                                          │  │
│   │  4️⃣  Stage 4 - Polish                                          7 days  │  │
│   │  ─────────────────────────────────────────────────────────────────────  │  │
│   │  Materials:                                                              │  │
│   │    • Aluminum Oxide Polish - 1 tbsp                                     │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile Layout

```
┌─────────────────────────────────┐
│ ← Template                      │
├─────────────────────────────────┤
│                                 │
│ Standard 4-Stage Agate          │
│                                 │
│ My go-to process for Lake       │
│ Superior agates. Works great!   │
│                                 │
│ [Lake Superior Agate]           │
│                                 │
│ Used 8 times                    │
│ Created: Dec 1, 2024            │
│                                 │
│ [ 🚀 Use Template ]             │
│                                 │
│ [Edit]  [Duplicate]  [Delete]   │
│                                 │
├─────────────────────────────────┤
│                                 │
│ Stages (4 • ~28 days)           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 1️⃣ Stage 1 - Coarse  7 days │ │
│ │                             │ │
│ │ • 60/90 Silicon Carbide     │ │
│ │   2 tbsp                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 2️⃣ Stage 2 - Medium  7 days │ │
│ │                             │ │
│ │ • 120/220 Silicon Carbide   │ │
│ │   2 tbsp                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 3️⃣ Stage 3 - Pre-Polish    │ │
│ │                      7 days │ │
│ │ • 500 Aluminum Oxide        │ │
│ │   2 tbsp                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 4️⃣ Stage 4 - Polish  7 days │ │
│ │                             │ │
│ │ • Aluminum Oxide Polish     │ │
│ │   1 tbsp                    │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

---

## 4. Create/Edit Template

### 4.1 Create Template Modal (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Create New Template                              [✕]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Template Name *                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ My New Template                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Description                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Describe when to use this template...                                    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Recommended Specimens (optional)                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Search specimens...                                                   ▼  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  [Agate ✕] [Jasper ✕]                                                          │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Stages                                                            [ + Add Stage ]
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Stage 1                                                          [≡] [🗑️] │   │
│  │                                                                          │   │
│  │ Name: [ Stage 1 - Coarse               ▼]                                │   │
│  │                                                                          │   │
│  │ Duration:  [7] days  [0] hours                                           │   │
│  │                                                                          │   │
│  │ Materials:                                              [ + Add Material ]│   │
│  │   • [60/90 Silicon Carbide    ▼]  Amount: [2] [tbsp ▼]       [🗑️]       │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Stage 2                                                          [≡] [🗑️] │   │
│  │                                                                          │   │
│  │ Name: [ Stage 2 - Medium               ▼]                                │   │
│  │                                                                          │   │
│  │ Duration:  [7] days  [0] hours                                           │   │
│  │                                                                          │   │
│  │ Materials:                                              [ + Add Material ]│   │
│  │   • [120/220 Silicon Carbide  ▼]  Amount: [2] [tbsp ▼]       [🗑️]       │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [ + Add Stage ]                                                                │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              [ Cancel ]        [ Save Template ]                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Create from Cycle

When user clicks "Save as Template" from a completed cycle:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Save Cycle as Template                              [✕]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Save "Lake Superior Agates" as a reusable template.                            │
│                                                                                 │
│  Template Name *                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Standard 4-Stage Agate                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Description                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ My go-to process for Lake Superior agates.                               │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Stages to include:                                                             │
│                                                                                 │
│  ☑️ Stage 1 - Coarse (7 days)                                                   │
│     • 60/90 Silicon Carbide - 2 tbsp                                           │
│                                                                                 │
│  ☑️ Stage 2 - Medium (7 days)                                                   │
│     • 120/220 Silicon Carbide - 2 tbsp                                         │
│                                                                                 │
│  ☑️ Stage 3 - Pre-Polish (7 days)                                               │
│     • 500 Aluminum Oxide - 2 tbsp                                              │
│                                                                                 │
│  ☑️ Stage 4 - Polish (7 days)                                                   │
│     • Aluminum Oxide Polish - 1 tbsp                                           │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ℹ️ Tumbler assignments and photos will not be saved to the template.    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              [ Cancel ]        [ Save Template ]                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Use Template Flow

### 5.1 Use Template Modal

When user clicks "Use Template":

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Create Cycle from Template                          [✕]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Using: Standard 4-Stage Agate                                                  │
│  4 stages • ~28 days                                                            │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Cycle Name *                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Lake Superior Batch 3                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Start Date *                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 📅  January 25, 2025                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Tumbler *                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Select tumbler...                                                     ▼  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Specimens                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Search specimens...                                                   ▼  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Recommended: [Lake Superior Agate]  (from template)                            │
│                                                                                 │
│  Additional Specimens (free text)                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Some rough agates from the beach                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Goal (optional)                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ High polish for display                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Stages Preview                                                                 │
│                                                                                 │
│  1️⃣ Stage 1 - Coarse (7 days) • 60/90 Silicon Carbide                         │
│  2️⃣ Stage 2 - Medium (7 days) • 120/220 Silicon Carbide                       │
│  3️⃣ Stage 3 - Pre-Polish (7 days) • 500 Aluminum Oxide                        │
│  4️⃣ Stage 4 - Polish (7 days) • Aluminum Oxide Polish                         │
│                                                                                 │
│  ⏱️ Estimated completion: February 22, 2025                                     │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              [ Cancel ]        [ Create Cycle ]                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Success State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              🎉 Cycle Created!                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  "Lake Superior Batch 3" has been created with 4 stages from your template.     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      [ View Cycle ]                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      [ Start First Stage ]                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Requirements

### 6.1 API Endpoints

| Action | Endpoint |
|--------|----------|
| List templates | `GET /api/templates?includeSystem=true` |
| Get template | `GET /api/templates/:templateId` |
| Create template | `POST /api/templates` |
| Update template | `PATCH /api/templates/:templateId` |
| Delete template | `DELETE /api/templates/:templateId` |
| Duplicate template | `POST /api/templates/:templateId/duplicate` |
| Create cycle from template | `POST /api/cycles/from-template` |

### 6.2 Data Shapes

**Template List Item:**
```typescript
interface TemplateListItem {
  templateId: string;
  name: string;
  description?: string;
  isSystem: boolean;
  specimenNames: string[];
  stageCount: number;
  totalDurationDays: number;
  usageCount: number;
  dateCreated: string;
  dateUpdated: string;
}
```

**Template Detail:**
```typescript
interface TemplateDetail {
  templateId: string;
  name: string;
  description?: string;
  isSystem: boolean;
  specimens: {
    specimenId: string;
    commonName: string;
  }[];
  stageData: {
    stageName: string;
    durationDays: number;
    durationHours: number;
    materials: {
      materialId: string;
      commonName: string;
      displayAmount: number;
      displayUnit: string;
    }[];
  }[];
  usageCount: number;
  dateCreated: string;
  dateUpdated: string;
}
```

---

## 7. Interactions

### 7.1 List Page Interactions

| Element | Action |
|---------|--------|
| Create Template button | Open create modal |
| Tab (My/System) | Switch template list |
| View button | Navigate to template detail |
| Edit button | Open edit modal |
| Use button | Open use template modal |
| Delete button | Confirm and delete |
| Copy button (system) | Duplicate to user templates |

### 7.2 Detail Page Interactions

| Element | Action |
|---------|--------|
| Edit Template | Open edit modal |
| Use Template | Open use template modal |
| Duplicate | Create copy with "(Copy)" suffix |
| Delete | Confirm and delete |
| Back | Return to templates list |

### 7.3 Create/Edit Modal Interactions

| Element | Action |
|---------|--------|
| Add Stage | Add new stage to bottom |
| Drag handle (≡) | Reorder stages |
| Delete stage (🗑️) | Remove stage |
| Add Material | Add material to stage |
| Delete material | Remove material from stage |
| Save | Validate and save template |
| Cancel | Discard changes |

---

## 8. States

### 8.1 Empty State (No Templates)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                              [Template icon]                                    │
│                                                                                 │
│                         No templates yet                                        │
│                                                                                 │
│              Save your successful processes as templates to                     │
│              reuse them on future batches.                                      │
│                                                                                 │
│                       [ + Create Your First Template ]                          │
│                                                                                 │
│              Or check out our [System Templates] to get started!                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Loading State

```
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░ │
│ ████████░░░░░░░░░ │  │ ████████░░░░░░░░░ │  │ ████████░░░░░░░░░ │
│ ██░░░░░░░░░░░░░░░ │  │ ██░░░░░░░░░░░░░░░ │  │ ██░░░░░░░░░░░░░░░ │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

### 8.3 Delete Confirmation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Delete Template?                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Are you sure you want to delete "Standard 4-Stage Agate"?                      │
│                                                                                 │
│  This action cannot be undone. Existing cycles created from this                │
│  template will not be affected.                                                 │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              [ Cancel ]        [ Delete ]                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Validation Error

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Template Name *                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                 ⚠️      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Template name is required                                                      │
│                                                                                 │
│  Stages                                                            [ + Add Stage ]
│  ─────────────────────────────────────────────────────────────────────────────  │
│  ⚠️ At least one stage is required                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Validation Rules

| Field | Rule |
|-------|------|
| Template name | Required, 1-100 characters |
| Description | Optional, max 500 characters |
| Stages | At least 1 stage required |
| Stage name | Required for each stage |
| Stage duration | At least 1 hour total |
| Materials | Optional per stage |
| Material amount | Required if material selected |
| Max templates | 20 per user (soft limit with warning) |

---

## 10. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (sm) | Single column, stacked cards |
| 640-1024px (md) | Single column, wider cards |
| > 1024px (lg) | Full layout with sidebar |

---

## 11. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Template navigation | Cards are focusable, Enter to view |
| Drag reorder | Keyboard alternative with up/down buttons |
| Form labels | All inputs have associated labels |
| Error announcements | Validation errors announced to screen readers |
| Delete confirmation | Focus trap in modal |

---

## 12. Implementation Notes

### 12.1 Component Files

```
app/(protected)/templates/
├── page.tsx                    # Templates list page
├── [templateId]/
│   └── page.tsx                # Template detail page
├── loading.tsx                 # Skeleton
└── error.tsx                   # Error boundary

components/
├── TemplateCard.tsx            # Individual template card
├── TemplateList.tsx            # Template grid/list
├── CreateTemplateModal.tsx     # Create/edit modal
├── UseTemplateModal.tsx        # Create cycle from template
├── SaveAsTemplateModal.tsx     # Save cycle as template
├── TemplateStageEditor.tsx     # Stage editing component
└── TemplateMaterialEditor.tsx  # Material editing within stage
```

### 12.2 State Management

- Template list cached with React Query
- Optimistic updates for delete
- Form state managed with React Hook Form
- Drag-and-drop with @dnd-kit/core

### 12.3 Stage Name Presets

Common stage names for dropdown:
- Stage 1 - Coarse
- Stage 2 - Medium
- Stage 3 - Pre-Polish
- Stage 4 - Polish
- Custom (free text input)

---

## 13. Related Documents

- [02-cycles.md](./02-cycles.md) - Cycle creation (uses templates)
- [03-stage-run.md](./03-stage-run.md) - Stage configuration reference
- [05-API-SPEC.md](../05-API-SPEC.md) - Templates API endpoints
- [04-DATA-MODEL.md](../04-DATA-MODEL.md) - Template entity schema
