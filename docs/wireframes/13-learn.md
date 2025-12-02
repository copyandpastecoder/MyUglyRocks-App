# Wireframe: Learn Section (Specimens & Materials)

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [03-SITEMAP.md](../03-SITEMAP.md), [04-DATA-MODEL.md](../04-DATA-MODEL.md) |

---

## Overview

The Learn section provides reference information about rock specimens and tumbling materials. These are public pages optimized for SEO and designed to help both beginners and experienced tumblers.

### Pages Covered
1. Specimens List (`/specimens`)
2. Specimen Detail (`/specimens/:specimenId`)
3. Materials List (`/materials`)
4. Material Detail (`/materials/:materialId`)

---

## 1. Specimens List

### 1.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo]    Gallery   Specimens   Materials   [Login]  [Register]            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Specimens                                                              ?   │
│  Browse rocks and minerals for tumbling                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 Search specimens...                                    [Search] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Filter by Type:  [All] [Rock] [Mineral] [Glass] [Fossil] [Other]    │  │
│  │                                                                      │  │
│  │ Sort by:  [A-Z ▼]    Difficulty:  [All ▼]    Hardness:  [All ▼]     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Showing 156 specimens                                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────│   │
│  │ │                     │  │                     │  │                 │   │
│  │ │   🪨 Agate          │  │   🪨 Jasper         │  │   🪨 Tiger Eye  │   │
│  │ │                     │  │                     │  │                 │   │
│  │ │   Hardness: 6.5-7   │  │   Hardness: 6.5-7   │  │   Hardness: 7   │   │
│  │ │   ●●●○○ Medium      │  │   ●●○○○ Easy        │  │   ●●●○○ Medium  │   │
│  │ │                     │  │                     │  │                 │   │
│  │ │   Chalcedony family │  │   Chalcedony family │  │   Quartz family │   │
│  │ │                     │  │                     │  │                 │   │
│  │ └─────────────────────┘  └─────────────────────┘  └─────────────────│   │
│  │                                                                      │   │
│  │ ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────│   │
│  │ │                     │  │                     │  │                 │   │
│  │ │   🪨 Obsidian       │  │   🪨 Amethyst       │  │   🪨 Rose Quartz│   │
│  │ │                     │  │                     │  │                 │   │
│  │ │   Hardness: 5-5.5   │  │   Hardness: 7       │  │   Hardness: 7   │   │
│  │ │   ●●●●○ Hard        │  │   ●●○○○ Easy        │  │   ●●○○○ Easy    │   │
│  │ │                     │  │                     │  │                 │   │
│  │ │   Volcanic glass    │  │   Quartz family     │  │   Quartz family │   │
│  │ │                     │  │                     │  │                 │   │
│  │ └─────────────────────┘  └─────────────────────┘  └─────────────────│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              [1]  [2]  [3]  ...  [12]  [Next →]                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Can't find a specimen?                                                     │
│  [Suggest a Specimen] → Opens suggestion form (auth required)               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Specimen Card Component

```
┌───────────────────────────────┐
│                               │
│   🪨 Agate                    │  ← CommonName (clickable)
│                               │
│   Hardness: 6.5 - 7.0         │  ← MohsHardnessMin/Max
│   ●●●○○ Medium                │  ← TumblingDifficulty (visual + text)
│                               │
│   Chalcedony family           │  ← RockFamily (if available)
│   Mineral                     │  ← MaterialType badge
│                               │
└───────────────────────────────┘
```

**Difficulty Indicators:**
- ●○○○○ Easy (green)
- ●●○○○ Easy-Medium (green-yellow)
- ●●●○○ Medium (yellow)
- ●●●●○ Medium-Hard (orange)
- ●●●●● Hard (red)

### 1.3 Mobile Layout

```
┌─────────────────────────────────────┐
│ ≡  Specimens                    🔍  │
├─────────────────────────────────────┤
│                                     │
│  Browse rocks and minerals          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔍 Search...               │   │
│  └─────────────────────────────┘   │
│                                     │
│  [All] [Rock] [Mineral] [More ▼]   │
│                                     │
│  Sort: [A-Z ▼]   Filter: [All ▼]   │
│                                     │
│  156 specimens                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🪨 Agate                   │   │
│  │  Hardness: 6.5-7 | Medium   │   │
│  │  Chalcedony family          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🪨 Jasper                  │   │
│  │  Hardness: 6.5-7 | Easy     │   │
│  │  Chalcedony family          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🪨 Tiger Eye               │   │
│  │  Hardness: 7 | Medium       │   │
│  │  Quartz family              │   │
│  └─────────────────────────────┘   │
│                                     │
│         [Load More]                 │
│                                     │
├─────────────────────────────────────┤
│ [Gallery] [Specimens] [Materials]   │
└─────────────────────────────────────┘
```

### 1.4 Empty/No Results State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │                           🔍                                         │   │
│  │                                                                      │   │
│  │           No specimens found for "purple agatee"                     │   │
│  │                                                                      │   │
│  │           • Check your spelling                                      │   │
│  │           • Try a different search term                              │   │
│  │           • Browse all specimens                                     │   │
│  │                                                                      │   │
│  │                    [Clear Search]                                    │   │
│  │                                                                      │   │
│  │     ─────────────────────────────────────────────────────────────    │   │
│  │                                                                      │   │
│  │     Can't find what you're looking for?                              │   │
│  │     [Suggest a Specimen]                                             │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Specimen Detail

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo]    Gallery   Specimens   Materials   [Login]  [Register]            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Specimens > Agate                                                          │
│                                                                             │
│  ┌────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │                                │  │                                  │  │
│  │   🪨 Agate                     │  │  QUICK FACTS                     │  │
│  │                                │  │                                  │  │
│  │   ───────────────────────────  │  │  ┌────────────────────────────┐ │  │
│  │                                │  │  │ Mohs Hardness              │ │  │
│  │   Also known as:               │  │  │ 6.5 - 7.0                  │ │  │
│  │   Banded Agate, Lace Agate     │  │  │ ████████████████░░░░       │ │  │
│  │                                │  │  └────────────────────────────┘ │  │
│  │   Family: Chalcedony           │  │                                  │  │
│  │   Type: Mineral                │  │  ┌────────────────────────────┐ │  │
│  │                                │  │  │ Tumbling Difficulty        │ │  │
│  │   Scientific Name:             │  │  │ ●●●○○ Medium               │ │  │
│  │   Silicon Dioxide (SiO₂)       │  │  └────────────────────────────┘ │  │
│  │                                │  │                                  │  │
│  └────────────────────────────────┘  │  ┌────────────────────────────┐ │  │
│                                      │  │ Compatible With            │ │  │
│  ┌────────────────────────────────┐  │  │ Jasper, Petrified Wood,    │ │  │
│  │                                │  │  │ Tiger Eye, Carnelian       │ │  │
│  │   RECOMMENDED GRIT SEQUENCE    │  │  └────────────────────────────┘ │  │
│  │                                │  │                                  │  │
│  │   Stage 1: 60/90 Coarse        │  └──────────────────────────────────┘  │
│  │   └─ 7 days typical            │                                        │
│  │                                │                                        │
│  │   Stage 2: 120/220 Medium      │                                        │
│  │   └─ 7 days typical            │                                        │
│  │                                │                                        │
│  │   Stage 3: 500 Pre-Polish      │                                        │
│  │   └─ 5-7 days                  │                                        │
│  │                                │                                        │
│  │   Stage 4: Polish              │                                        │
│  │   └─ 7 days, aluminum oxide    │                                        │
│  │                                │                                        │
│  └────────────────────────────────┘                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   SPECIAL CONSIDERATIONS                                             │   │
│  │                                                                      │   │
│  │   • Avoid tumbling with softer stones (hardness difference > 1)      │   │
│  │   • Some agates have druzy pockets - check before tumbling           │   │
│  │   • Lake Superior agates may need extra time in coarse stage         │   │
│  │   • Banded varieties polish to a higher shine than moss agates       │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   NOTES                                                              │   │
│  │                                                                      │   │
│  │   Agates are one of the most popular rocks for tumbling due to       │   │
│  │   their hardness, variety of colors, and beautiful banding patterns. │   │
│  │   They take a high polish and are forgiving for beginners.           │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ← Back to Specimens                                                        │
│                                                                             │
│  See something wrong? [Suggest an Edit]                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Hardness Compatibility Warning

When viewing a specimen, show compatibility with other specimens based on hardness:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ⚠️ HARDNESS COMPATIBILITY                                                  │
│                                                                             │
│  Agate (6.5-7) tumbles well with:                                           │
│                                                                             │
│  ✅ Compatible (within 1 Mohs)                                              │
│  • Jasper (6.5-7)                                                           │
│  • Tiger Eye (7)                                                            │
│  • Petrified Wood (6-7)                                                     │
│  • Carnelian (6.5-7)                                                        │
│                                                                             │
│  ⚠️ Caution (1-2 Mohs difference)                                           │
│  • Obsidian (5-5.5) - may scratch softer stone                              │
│                                                                             │
│  ❌ Avoid (>2 Mohs difference)                                              │
│  • Fluorite (4)                                                             │
│  • Calcite (3)                                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Mobile Layout

```
┌─────────────────────────────────────┐
│ ←  Agate                            │
├─────────────────────────────────────┤
│                                     │
│   🪨 Agate                          │
│   Mineral • Chalcedony family       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Hardness     │ 6.5 - 7.0    │   │
│  ├──────────────┼──────────────┤   │
│  │ Difficulty   │ ●●●○○ Medium │   │
│  ├──────────────┼──────────────┤   │
│  │ Also Known   │ Banded Agate,│   │
│  │              │ Lace Agate   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Recommended Grit Sequence          │
│  ───────────────────────────────   │
│                                     │
│  Stage 1: 60/90 Coarse              │
│  7 days typical                     │
│                                     │
│  Stage 2: 120/220 Medium            │
│  7 days typical                     │
│                                     │
│  Stage 3: 500 Pre-Polish            │
│  5-7 days                           │
│                                     │
│  Stage 4: Polish                    │
│  7 days, aluminum oxide             │
│                                     │
│  Special Considerations             │
│  ───────────────────────────────   │
│                                     │
│  • Avoid tumbling with softer       │
│    stones (hardness diff > 1)       │
│  • Check for druzy pockets          │
│  • Lake Superior agates need        │
│    extra coarse time                │
│                                     │
│  Compatible With                    │
│  ───────────────────────────────   │
│  Jasper, Petrified Wood,            │
│  Tiger Eye, Carnelian               │
│                                     │
│  [See something wrong?]             │
│                                     │
├─────────────────────────────────────┤
│ [Gallery] [Specimens] [Materials]   │
└─────────────────────────────────────┘
```

---

## 3. Materials List

### 3.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo]    Gallery   Specimens   Materials   [Login]  [Register]            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Materials                                                              ?   │
│  Grits, polishes, and additives for tumbling                                │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Category:  [All] [Abrasives] [Additives] [Media] [Cleaning]          │  │
│  │                                                                      │  │
│  │ Usage:     [All ▼]    Sort by:  [Stage Order ▼]                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ── ABRASIVES ─────────────────────────────────────────────────────────────│
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────│
│  │                       │  │                       │  │                   │
│  │  60/90 Silicon        │  │  120/220 Silicon      │  │  500 Aluminum     │
│  │  Carbide              │  │  Carbide              │  │  Oxide            │
│  │                       │  │                       │  │                   │
│  │  ┌─────────────────┐  │  │  ┌─────────────────┐  │  │  ┌───────────────│
│  │  │  COARSE         │  │  │  │  MEDIUM         │  │  │  │  PRE-POLISH   │
│  │  └─────────────────┘  │  │  └─────────────────┘  │  │  └───────────────│
│  │                       │  │                       │  │                   │
│  │  Stage 1 grinding     │  │  Stage 2 smoothing    │  │  Stage 3 prep     │
│  │  Mesh: 60-90          │  │  Mesh: 120-220        │  │  Mesh: 500        │
│  │                       │  │                       │  │                   │
│  └───────────────────────┘  └───────────────────────┘  └───────────────────│
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐                      │
│  │                       │  │                       │                      │
│  │  Aluminum Oxide       │  │  Cerium Oxide         │                      │
│  │  Polish               │  │                       │                      │
│  │                       │  │  ┌─────────────────┐  │                      │
│  │  ┌─────────────────┐  │  │  │  POLISH         │  │                      │
│  │  │  POLISH         │  │  │  └─────────────────┘  │                      │
│  │  └─────────────────┘  │  │                       │                      │
│  │                       │  │  Alternative polish   │                      │
│  │  Stage 4 final shine  │  │  for glass, obsidian  │                      │
│  │                       │  │                       │                      │
│  └───────────────────────┘  └───────────────────────┘                      │
│                                                                             │
│  ── ADDITIVES ─────────────────────────────────────────────────────────────│
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────│
│  │                       │  │                       │  │                   │
│  │  Plastic Pellets      │  │  Ceramic Media        │  │  Ivory Soap       │
│  │                       │  │                       │  │  Flakes           │
│  │  ┌─────────────────┐  │  │  ┌─────────────────┐  │  │  ┌───────────────│
│  │  │  MEDIA          │  │  │  │  MEDIA          │  │  │  │  ADDITIVE     │
│  │  └─────────────────┘  │  │  └─────────────────┘  │  │  └───────────────│
│  │                       │  │                       │  │                   │
│  │  Cushioning, fill     │  │  Polishing action     │  │  Cleaning agent   │
│  │                       │  │                       │  │                   │
│  └───────────────────────┘  └───────────────────────┘  └───────────────────│
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Can't find a material?                                                     │
│  [Suggest a Material] → Opens suggestion form (auth required)               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Material Card Component

```
┌───────────────────────────────┐
│                               │
│   60/90 Silicon Carbide       │  ← CommonName (clickable)
│                               │
│   ┌─────────────────────┐     │  ← UsageType badge (color-coded)
│   │  COARSE             │     │
│   └─────────────────────┘     │
│                               │
│   Stage 1 grinding            │  ← Brief description
│   Mesh: 60-90                 │  ← MeshSize
│                               │
└───────────────────────────────┘
```

**Usage Type Colors:**
- COARSE: Red/orange
- MEDIUM: Yellow
- PRE-POLISH: Blue
- POLISH: Green
- CLEANING: Gray

### 3.3 Mobile Layout

```
┌─────────────────────────────────────┐
│ ≡  Materials                    🔍  │
├─────────────────────────────────────┤
│                                     │
│  Grits, polishes, and additives     │
│                                     │
│  [All] [Abrasives] [Additives] [▼]  │
│                                     │
│  Sort: [Stage Order ▼]              │
│                                     │
│  ── ABRASIVES ────────────────────  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  60/90 Silicon Carbide      │   │
│  │  COARSE | Mesh 60-90        │   │
│  │  Stage 1 grinding           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  120/220 Silicon Carbide    │   │
│  │  MEDIUM | Mesh 120-220      │   │
│  │  Stage 2 smoothing          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  500 Aluminum Oxide         │   │
│  │  PRE-POLISH | Mesh 500      │   │
│  │  Stage 3 prep               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ── ADDITIVES ───────────────────  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Plastic Pellets            │   │
│  │  MEDIA                      │   │
│  │  Cushioning and fill        │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│ [Gallery] [Specimens] [Materials]   │
└─────────────────────────────────────┘
```

---

## 4. Material Detail

### 4.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo]    Gallery   Specimens   Materials   [Login]  [Register]            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Materials > 60/90 Silicon Carbide                                          │
│                                                                             │
│  ┌────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │                                │  │                                  │  │
│  │   60/90 Silicon Carbide        │  │  QUICK FACTS                     │  │
│  │                                │  │                                  │  │
│  │   ───────────────────────────  │  │  ┌────────────────────────────┐ │  │
│  │                                │  │  │ Category                   │ │  │
│  │   ┌─────────────────────┐     │  │  │ Abrasive                   │ │  │
│  │   │      COARSE         │     │  │  └────────────────────────────┘ │  │
│  │   └─────────────────────┘     │  │                                  │  │
│  │                                │  │  ┌────────────────────────────┐ │  │
│  │   Material: Silicon Carbide    │  │  │ Mesh Size                  │ │  │
│  │   Size: 60/90                  │  │  │ 60 - 90                    │ │  │
│  │   Mesh: 60-90                  │  │  └────────────────────────────┘ │  │
│  │                                │  │                                  │  │
│  └────────────────────────────────┘  │  ┌────────────────────────────┐ │  │
│                                      │  │ Typical Stage              │ │  │
│                                      │  │ Stage 1 - Coarse Grind     │ │  │
│  ┌────────────────────────────────┐  │  └────────────────────────────┘ │  │
│  │                                │  │                                  │  │
│  │   DESCRIPTION                  │  │  ┌────────────────────────────┐ │  │
│  │                                │  │  │ Also Good For              │ │  │
│  │   Silicon carbide is the most  │  │  │ • Cleaning runs            │ │  │
│  │   popular abrasive for rock    │  │  │ • Shaping rough rocks      │ │  │
│  │   tumbling. The 60/90 grit is  │  │  └────────────────────────────┘ │  │
│  │   used in the first stage to   │  │                                  │  │
│  │   shape and round the rocks.   │  └──────────────────────────────────┘  │
│  │                                │                                        │
│  │   It's a very hard abrasive    │                                        │
│  │   (9.5 Mohs) that cuts         │                                        │
│  │   efficiently through most     │                                        │
│  │   rocks and minerals.          │                                        │
│  │                                │                                        │
│  └────────────────────────────────┘                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   USAGE TIPS                                                         │   │
│  │                                                                      │   │
│  │   • Use approximately 2 tablespoons per pound of rock                │   │
│  │   • Run for 7 days for most hard rocks                               │   │
│  │   • Add water to just cover the rocks                                │   │
│  │   • Replace grit if rocks aren't rounding after 7 days               │   │
│  │   • Clean rocks thoroughly before next stage to prevent              │   │
│  │     contamination                                                    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ← Back to Materials                                                        │
│                                                                             │
│  See something wrong? [Suggest an Edit]                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Mobile Layout

```
┌─────────────────────────────────────┐
│ ←  60/90 Silicon Carbide            │
├─────────────────────────────────────┤
│                                     │
│   60/90 Silicon Carbide             │
│                                     │
│   ┌───────────────────────────┐    │
│   │        COARSE             │    │
│   └───────────────────────────┘    │
│                                     │
│   Abrasive                          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Material   │ Silicon Carbide│   │
│  ├────────────┼────────────────┤   │
│  │ Size       │ 60/90          │   │
│  ├────────────┼────────────────┤   │
│  │ Mesh       │ 60 - 90        │   │
│  ├────────────┼────────────────┤   │
│  │ Stage      │ 1 - Coarse     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Description                        │
│  ───────────────────────────────   │
│                                     │
│  Silicon carbide is the most        │
│  popular abrasive for rock          │
│  tumbling. The 60/90 grit is        │
│  used in the first stage to         │
│  shape and round the rocks.         │
│                                     │
│  Usage Tips                         │
│  ───────────────────────────────   │
│                                     │
│  • 2 tbsp per pound of rock         │
│  • Run for 7 days for hard rocks    │
│  • Add water to just cover rocks    │
│  • Replace if not rounding          │
│                                     │
│  [See something wrong?]             │
│                                     │
├─────────────────────────────────────┤
│ [Gallery] [Specimens] [Materials]   │
└─────────────────────────────────────┘
```

---

## 5. Suggest Specimen/Material Forms

### 5.1 Suggestion Modal (Authenticated Users Only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                                                               ✕   │    │
│   │                                                                   │    │
│   │   Suggest a Specimen                                              │    │
│   │                                                                   │    │
│   │   Help us expand our database! Suggestions are reviewed by       │    │
│   │   our team before being added.                                    │    │
│   │                                                                   │    │
│   │   ┌─────────────────────────────────────────────────────────┐    │    │
│   │   │ Common Name *                                           │    │    │
│   │   │ Tiger Iron                                              │    │    │
│   │   └─────────────────────────────────────────────────────────┘    │    │
│   │                                                                   │    │
│   │   ┌─────────────────────────────────────────────────────────┐    │    │
│   │   │ Details (optional)                                      │    │    │
│   │   │                                                         │    │    │
│   │   │ Found in Western Australia. Contains layers of          │    │    │
│   │   │ tiger eye, jasper, and hematite. Hardness around 7.     │    │    │
│   │   │                                                         │    │    │
│   │   └─────────────────────────────────────────────────────────┘    │    │
│   │                                                                   │    │
│   │                         [Cancel]  [Submit Suggestion]             │    │
│   │                                                                   │    │
│   └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Success State

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│                            ✓                                      │
│                                                                   │
│   Thank you for your suggestion!                                  │
│                                                                   │
│   Our team will review "Tiger Iron" and add it to                 │
│   the database if approved.                                       │
│                                                                   │
│                          [Done]                                   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 6. Loading States

### 6.1 List Loading Skeleton

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────│   │
│  │ │ ░░░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░│   │
│  │ │ ░░░░░░░░░░░        │  │ ░░░░░░░░░░░        │  │ ░░░░░░░░░░░    │   │
│  │ │ ░░░░░░░            │  │ ░░░░░░░            │  │ ░░░░░░░        │   │
│  │ │ ░░░░░░░░░░░░       │  │ ░░░░░░░░░░░░       │  │ ░░░░░░░░░░░░   │   │
│  │ └─────────────────────┘  └─────────────────────┘  └─────────────────│   │
│  │                                                                      │   │
│  │ ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────│   │
│  │ │ ░░░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░│   │
│  │ │ ░░░░░░░░░░░        │  │ ░░░░░░░░░░░        │  │ ░░░░░░░░░░░    │   │
│  │ │ ░░░░░░░            │  │ ░░░░░░░            │  │ ░░░░░░░        │   │
│  │ │ ░░░░░░░░░░░░       │  │ ░░░░░░░░░░░░       │  │ ░░░░░░░░░░░░   │   │
│  │ └─────────────────────┘  └─────────────────────┘  └─────────────────│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. SEO Considerations

### 7.1 Page Titles

| Page | Title Format |
|------|--------------|
| Specimens List | "Rock & Mineral Specimens for Tumbling - MyUglyRocks" |
| Specimen Detail | "[CommonName] Tumbling Guide - Hardness, Grit Sequence - MyUglyRocks" |
| Materials List | "Tumbling Grits, Polishes & Media - MyUglyRocks" |
| Material Detail | "[MaterialName] for Rock Tumbling - MyUglyRocks" |

### 7.2 Meta Descriptions

| Page | Description |
|------|-------------|
| Specimens List | "Browse our database of 150+ rocks and minerals suitable for tumbling. Find hardness ratings, difficulty levels, and recommended grit sequences." |
| Specimen Detail | "[CommonName]: Mohs hardness [X-Y], [Difficulty] difficulty. Complete tumbling guide with recommended grit sequence and special considerations." |
| Materials List | "Find the right grits, polishes, and additives for your rock tumbler. From coarse silicon carbide to final polish compounds." |
| Material Detail | "[MaterialName]: [Category] for [UsageType] stage. Usage tips, recommended amounts, and tumbling guidance." |

### 7.3 Structured Data (JSON-LD)

Include schema.org markup for specimens and materials to improve search visibility:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "name": "Agate Tumbling Guide",
  "description": "Complete guide to tumbling agate including hardness, grit sequence, and tips",
  "author": {
    "@type": "Organization",
    "name": "MyUglyRocks"
  }
}
```

---

## 8. Interactions

### 8.1 Search Behavior
- Debounced search (300ms delay)
- Highlight matching text in results
- Show "No results" state when empty
- Preserve search on navigation (URL params)

### 8.2 Filter Behavior
- Filters update URL parameters
- Multiple filters combine (AND)
- Clear individual filters or all at once
- Show count of results after filtering

### 8.3 Card Hover States
- Subtle elevation/shadow on hover
- Cursor pointer
- Slight scale transform (1.02)

---

## 9. Data Requirements

### 9.1 API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /specimens` | List with search, filter, pagination |
| `GET /specimens/:id` | Single specimen details |
| `GET /materials` | List with category filter |
| `GET /materials/:id` | Single material details |
| `POST /specimens/suggest` | Submit specimen suggestion |
| `POST /materials/suggest` | Submit material suggestion |

### 9.2 Caching Strategy

| Data | Cache Duration | Invalidation |
|------|----------------|--------------|
| Specimens list | 1 hour | Admin update |
| Specimen detail | 1 hour | Admin update |
| Materials list | 1 hour | Admin update |
| Material detail | 1 hour | Admin update |

---

## 10. Accessibility Requirements

- Keyboard navigation through cards and filters
- ARIA labels for filter controls
- Screen reader announcements for search results count
- Focus management when modal opens/closes
- Color is not the only indicator (use icons + text for difficulty)
- Sufficient color contrast for badges and text
