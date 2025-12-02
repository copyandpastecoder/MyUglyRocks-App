# Wireframe: Onboarding & First-Time User Experience

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [01-dashboard.md](./01-dashboard.md), [04-tumblers.md](./04-tumblers.md), [02-cycles.md](./02-cycles.md) |

---

## 1. Overview

This document defines the first-time user experience, including:
- Post-registration welcome flow
- Required setup steps (settings, first tumbler)
- Empty state guidance
- Contextual help (tooltips)
- Progress indicators

### Key Principle
**Tumblers are required before creating cycles.** The onboarding flow must ensure users add at least one tumbler before they can start tracking.

---

## 2. Post-Registration Flow

### 2.1 Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Registration  │────>│ Email Verified  │────>│  Welcome Modal  │
│      Form       │     │    Success      │     │   (Step 1/3)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Dashboard    │<────│  Add Tumbler    │<────│ Quick Settings  │
│  (with prompts) │     │   (Step 3/3)    │     │   (Step 2/3)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2.2 Email Verification Success

After clicking the verification link:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]                                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                                                                                 │
│                              ┌─────────────────────┐                            │
│                              │                     │                            │
│                              │         ✅          │                            │
│                              │                     │                            │
│                              └─────────────────────┘                            │
│                                                                                 │
│                          Email Verified!                                        │
│                                                                                 │
│                  Your account is ready. Let's get you set up.                   │
│                                                                                 │
│                          [ Get Started → ]                                      │
│                                                                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Welcome Wizard (3 Steps)

### 3.1 Step 1: Welcome Modal

Shown immediately after first login:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                          │   │
│   │                          Welcome to MyUglyRocks! 🪨                      │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │   Let's get you set up in just a few steps:                              │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                                                                  │   │   │
│   │   │   ① Set your preferences                                        │   │   │
│   │   │      Units, date format, timezone                                │   │   │
│   │   │                                                                  │   │   │
│   │   │   ② Add your first tumbler                                      │   │   │
│   │   │      You'll need at least one to start tracking                  │   │   │
│   │   │                                                                  │   │   │
│   │   │   ③ Create your first cycle                                     │   │   │
│   │   │      Start tracking your rocks!                                  │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   This takes about 2 minutes.                                            │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │                              [ Let's Go! → ]                             │   │
│   │                                                                          │   │
│   │                         Skip for now (not recommended)                   │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**If user skips:** They go to empty dashboard with persistent prompts.

---

### 3.2 Step 2: Quick Settings

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                          │   │
│   │   Quick Settings                                          Step 1 of 3   │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │   These help us display information correctly for you.                   │   │
│   │   You can change these anytime in Settings.                              │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                                                                  │   │   │
│   │   │   Measurement System                                             │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  ○ Imperial (lbs, oz, tbsp)                              │  │   │   │
│   │   │   │  ● Metric (kg, g, mL)                                    │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Date Format                                                    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  MM/DD/YYYY                                          ▼   │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Timezone                                                       │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  America/New_York (detected)                         ▼   │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Tracking Mode                                           ⓘ     │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  ● Easy Mode - Just the essentials                       │  │   │   │
│   │   │   │  ○ Advanced Mode - All tracking options                  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │                    [ ← Back ]              [ Continue → ]                │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Tracking Mode Tooltip (ⓘ):**
> **Easy Mode:** Shows only essential fields for each stage (tumbler, duration, materials).
> **Advanced Mode:** Includes weight tracking, RPM, fill level, result sliders, and more.
> You can switch modes anytime.

---

### 3.3 Step 3: Add First Tumbler

**Initial State - Brand/Model Selection:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                          │   │
│   │   Add Your First Tumbler                                  Step 2 of 3   │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │   You'll need at least one tumbler to start tracking cycles.             │   │
│   │   Don't worry - you can add more later!                                  │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                                                                  │   │   │
│   │   │   Brand *                                                  ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  Lortone                                              ▼  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Model *                                                  ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  Select model...                                      ▼  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   💡 Don't see your tumbler? Select "Generic" or "Other" at the         │   │
│   │      bottom of the brand list to enter details manually.                 │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │                    [ ← Back ]              [ Continue → ]                │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**After Model Selection (Known Model - Single Barrel):**

When user selects a known model like "Lortone 3A", capacity and type auto-fill:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                                                                  │   │   │
│   │   │   Brand *                                                  ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  Lortone                                              ▼  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Model *                                                  ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  3A                                                   ▼  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │   │   │
│   │   │   Auto-detected from model:                                      │   │   │
│   │   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │   │   │
│   │   │                                                                  │   │   │
│   │   │   Type: Rotary                                                   │   │   │
│   │   │   Capacity: 3 lbs                                                │   │   │
│   │   │   Barrels: 1                                                     │   │   │
│   │   │                                            [ Edit manually ]     │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**After Model Selection (Multi-Barrel Tumbler - e.g., QT6):**

When user selects a multi-barrel model, show barrel naming section:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                                                                  │   │   │
│   │   │   Brand *                                                  ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  Lortone                                              ▼  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Model *                                                  ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  QT6 (Dual Barrel)                                    ▼  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │   │   │
│   │   │   Auto-detected from model:                                      │   │   │
│   │   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │   │   │
│   │   │                                                                  │   │   │
│   │   │   Type: Rotary                                                   │   │   │
│   │   │   Capacity: 3 lbs per barrel                                     │   │   │
│   │   │   Barrels: 2                                                     │   │   │
│   │   │                                            [ Edit manually ]     │   │   │
│   │   │                                                                  │   │   │
│   │   │   ─────────────────────────────────────────────────────────────  │   │   │
│   │   │                                                                  │   │   │
│   │   │   NAME YOUR BARRELS                                        ⓘ    │   │   │
│   │   │   Give each barrel a name so you can tell them apart             │   │   │
│   │   │                                                                  │   │   │
│   │   │   Barrel 1                                                       │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  Chompy                            [🎲 Suggest name]     │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Barrel 2                                                       │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  Gritty                            [🎲 Suggest name]     │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   💡 Barrel names help you track which barrel you used for each stage.  │   │
│   │      Click 🎲 to get a fun random name suggestion!                      │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │                    [ ← Back ]              [ Add Tumbler → ]             │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Generic/Custom Entry:**

When user selects "Generic" or "Other", show manual entry fields:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                                                                  │   │   │
│   │   │   Brand *                                                  ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  Generic                                              ▼  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Model *                                                  ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  Rotary - Custom                                      ▼  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   ─────────────────────────────────────────────────────────────  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Tumbler Type *                                           ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  ● Rotary    ○ Vibratory                                 │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Barrel Capacity *                                        ⓘ    │   │   │
│   │   │   ┌────────────────────────────┐  ┌──────────────────────────┐  │   │   │
│   │   │   │  3                         │  │  lbs                 ▼   │  │   │   │
│   │   │   └────────────────────────────┘  └──────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   │   Number of Barrels                                        ⓘ    │   │   │
│   │   │   ┌──────────────────────────────────────────────────────────┐  │   │   │
│   │   │   │  1                                                    ▼  │  │   │   │
│   │   │   └──────────────────────────────────────────────────────────┘  │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   💡 Not sure about capacity? Check the label on your tumbler or        │   │
│   │      search "[brand name] tumbler capacity" online.                      │   │
│   │                                                                          │   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Field Tooltips:**

| Field | Tooltip |
|-------|---------|
| Brand | Select your tumbler brand. **Can't find yours?** Select "Generic" or "Other" at the bottom to enter details manually. |
| Model | Select your specific model. Capacity and barrel count will auto-fill for known models. |
| Tumbler Type | **Rotary:** Barrel rotates slowly (most common). **Vibratory:** Barrel vibrates rapidly (faster, but different results). |
| Barrel Capacity | How much rock weight your barrel can safely hold. Usually printed on the tumbler or box. |
| Number of Barrels | How many separate barrels does your tumbler have? Most have 1, some have 2 or more. |
| Barrel Names | Give each barrel a nickname so you can tell them apart. Click 🎲 for a fun random suggestion from our list! |

**Auto-fill Behavior:**

| Selection | Type | Capacity | Barrels | Manual Entry |
|-----------|------|----------|---------|--------------|
| Known model (e.g., Lortone 3A) | Auto-filled | Auto-filled | Auto-filled | Optional edit |
| Generic/DIY/Other | User selects | Required | Required | All manual |

**Barrel Name Auto-Suggestions:**
When user clicks 🎲, a random name is suggested from the `BarrelNickname` seed table (e.g., "Chompy", "Gritty", "Rocky", "Tumbles", "Crusher").

---

### 3.4 Step 3b: Setup Complete

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                          │   │
│   │                              You're All Set! 🎉                          │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                                                                  │   │   │
│   │   │   ✅  Settings configured                                        │   │   │
│   │   │   ✅  Tumbler added: Lortone 3A                                  │   │   │
│   │   │                                                                  │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │   What's Next?                                                           │   │
│   │                                                                          │   │
│   │   A **Cycle** tracks one batch of rocks through all tumbling stages.     │   │
│   │   Each cycle has multiple **Stages** (like Coarse, Medium, Polish).      │   │
│   │                                                                          │   │
│   │   Most tumblers run for 7-10 days per stage. You'll add materials        │   │
│   │   (grit, polish) and track your progress with photos.                    │   │
│   │                                                                          │   │
│   │   ─────────────────────────────────────────────────────────────────────  │   │
│   │                                                                          │   │
│   │        [ Start My First Cycle → ]                                        │   │
│   │                                                                          │   │
│   │                      or explore the dashboard first                      │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Empty States

### 4.1 Empty Dashboard (No Tumblers)

If user skipped setup or hasn't added a tumbler:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Welcome, rockfan42!                                                           │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │                                                                  │   │  │
│   │   │                            📦                                    │   │  │
│   │   │                                                                  │   │  │
│   │   │                  Let's set up your tumbler                       │   │  │
│   │   │                                                                  │   │  │
│   │   │   Before you can start tracking cycles, you need to add          │   │  │
│   │   │   at least one tumbler to your equipment list.                   │   │  │
│   │   │                                                                  │   │  │
│   │   │                    [ Add Your First Tumbler ]                    │   │  │
│   │   │                                                                  │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ─────────────────────────────────────────────────────────────────────────────│
│                                                                                 │
│   While you're here, explore what MyUglyRocks can do:                          │
│                                                                                 │
│   ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────┐  │
│   │ 📚 Browse Specimens   │  │ 🧪 View Materials     │  │ 🖼️ Explore Gallery │  │
│   │                       │  │                       │  │                   │  │
│   │ Learn about rock      │  │ See grits, polishes,  │  │ See what others   │  │
│   │ types and hardness    │  │ and additives         │  │ have created      │  │
│   └───────────────────────┘  └───────────────────────┘  └───────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Empty Dashboard (Has Tumbler, No Cycles)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Welcome, rockfan42!                                                           │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │                    Ready to start tumbling?                              │  │
│   │                                                                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │                                                                  │   │  │
│   │   │                            🪨                                    │   │  │
│   │   │                                                                  │   │  │
│   │   │                   Create your first cycle                        │   │  │
│   │   │                                                                  │   │  │
│   │   │   A cycle tracks one batch of rocks from rough to polished.      │   │  │
│   │   │   Add stages as you progress through each grit level.            │   │  │
│   │   │                                                                  │   │  │
│   │   │                     [ Start Your First Cycle ]                   │   │  │
│   │   │                                                                  │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ─────────────────────────────────────────────────────────────────────────────│
│                                                                                 │
│   Your Equipment                                                                │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  📦 Lortone 3A                                    Rotary • 3 lbs        │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│                                              [ + Add Another Tumbler ]         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Empty Tumblers Page

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   My Tumblers                                                                   │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │                              📦                                          │  │
│   │                                                                          │  │
│   │                      No tumblers yet                                     │  │
│   │                                                                          │  │
│   │   Add your rock tumbler to start tracking cycles. You'll select         │  │
│   │   which tumbler to use each time you create a new stage.                │  │
│   │                                                                          │  │
│   │   Don't have a tumbler yet? Check out our                               │  │
│   │   [beginner's guide to rock tumbling →]                                 │  │
│   │                                                                          │  │
│   │                      [ + Add Your First Tumbler ]                        │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Empty Cycles Page

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   My Cycles                                                         [+ New Cycle]
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │                              🪨                                          │  │
│   │                                                                          │  │
│   │                       No cycles yet                                      │  │
│   │                                                                          │  │
│   │   A cycle tracks one batch of rocks through all tumbling stages.         │  │
│   │                                                                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │                                                                  │   │  │
│   │   │   How cycles work:                                               │   │  │
│   │   │                                                                  │   │  │
│   │   │   1. Create a cycle and name your batch                          │   │  │
│   │   │   2. Add stages as you progress (Coarse → Medium → Polish)       │   │  │
│   │   │   3. Track time, materials, and take photos                      │   │  │
│   │   │   4. Mark complete and share your results!                       │   │  │
│   │   │                                                                  │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                          │  │
│   │                       [ Start Your First Cycle ]                         │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Note:** If user has no tumblers, the "Start Your First Cycle" button should redirect to add tumbler first with a message.

---

## 5. First Cycle Wizard

### 5.1 Enhanced Create Cycle Form

When creating the first cycle (or any cycle), show contextual help:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Dashboard > Cycles > New Cycle                                                │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────┬──────────────────┐  │
│   │                                                       │                  │  │
│   │   New Cycle                                           │  💡 Quick Tips   │  │
│   │                                                       │                  │  │
│   │   ┌─────────────────────────────────────────────┐    │  A cycle is one  │  │
│   │   │ Cycle Name *                            ⓘ  │    │  batch of rocks  │  │
│   │   │ ┌─────────────────────────────────────────┐│    │  from start to   │  │
│   │   │ │ Lake Superior Agates - Batch 1          ││    │  finish.         │  │
│   │   │ └─────────────────────────────────────────┘│    │                  │  │
│   │   │ Give it a memorable name                   │    │  Most cycles     │  │
│   │   └─────────────────────────────────────────────┘    │  take 4-6 weeks  │  │
│   │                                                       │  with 4 stages.  │  │
│   │   ┌─────────────────────────────────────────────┐    │                  │  │
│   │   │ Start Date *                            ⓘ  │    │  Don't worry     │  │
│   │   │ ┌─────────────────────────────────────────┐│    │  about getting   │  │
│   │   │ │ 01/15/2025                          📅  ││    │  it perfect -    │  │
│   │   │ └─────────────────────────────────────────┘│    │  you can edit    │  │
│   │   │ When you're starting this batch            │    │  everything      │  │
│   │   └─────────────────────────────────────────────┘    │  later!          │  │
│   │                                                       │                  │  │
│   │   ┌─────────────────────────────────────────────┐    │                  │  │
│   │   │ Specimens (What's in the barrel?)       ⓘ  │    │                  │  │
│   │   │ ┌─────────────────────────────────────────┐│    │                  │  │
│   │   │ │ [Lake Superior Agate ×] [Jasper ×]   ▼  ││    │                  │  │
│   │   │ └─────────────────────────────────────────┘│    │                  │  │
│   │   │ Select rock types or add custom           │    │                  │  │
│   │   └─────────────────────────────────────────────┘    │                  │  │
│   │                                                       │                  │  │
│   │   ┌─────────────────────────────────────────────┐    │                  │  │
│   │   │ Additional Specimens (optional)         ⓘ  │    │                  │  │
│   │   │ ┌─────────────────────────────────────────┐│    │                  │  │
│   │   │ │ Some beach pebbles, unknown quartz     ││    │                  │  │
│   │   │ └─────────────────────────────────────────┘│    │                  │  │
│   │   │ Describe anything not in the database     │    │                  │  │
│   │   └─────────────────────────────────────────────┘    │                  │  │
│   │                                                       │                  │  │
│   │                                                       │                  │  │
│   │         [ Cancel ]              [ Create Cycle ]      │                  │  │
│   │                                                       │                  │  │
│   └──────────────────────────────────────────────────────┴──────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 First Stage Creation with Guidance

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Add First Stage                                                               │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────┬──────────────────┐  │
│   │                                                       │                  │  │
│   │   ┌─────────────────────────────────────────────┐    │  💡 First Stage  │  │
│   │   │ Stage Name *                            ⓘ  │    │                  │  │
│   │   │ ┌─────────────────────────────────────────┐│    │  For most rocks, │  │
│   │   │ │ Stage 1 - Coarse                    ▼   ││    │  start with      │  │
│   │   │ └─────────────────────────────────────────┘│    │  "Coarse" using  │  │
│   │   │ Common: Coarse, Medium, Fine, Pre-Polish,  │    │  60/90 grit.     │  │
│   │   │ Polish                                     │    │                  │  │
│   │   └─────────────────────────────────────────────┘    │  Run for 7-10    │  │
│   │                                                       │  days. Check     │  │
│   │   ┌─────────────────────────────────────────────┐    │  every few days  │  │
│   │   │ Tumbler *                               ⓘ  │    │  to make sure    │  │
│   │   │ ┌─────────────────────────────────────────┐│    │  it's running    │  │
│   │   │ │ Lortone 3A                          ▼   ││    │  smoothly.       │  │
│   │   │ └─────────────────────────────────────────┘│    │                  │  │
│   │   │ Which tumbler are you using for this stage?│    │                  │  │
│   │   └─────────────────────────────────────────────┘    │                  │  │
│   │                                                       │  Need help       │  │
│   │   ┌─────────────────────────────────────────────┐    │  choosing grit?  │  │
│   │   │ Duration                                ⓘ  │    │  [View Guide →]  │  │
│   │   │ ┌────────────────┐  ┌────────────────────┐ │    │                  │  │
│   │   │ │ 7              │  │ 0                  │ │    │                  │  │
│   │   │ │ days           │  │ hours              │ │    │                  │  │
│   │   │ └────────────────┘  └────────────────────┘ │    │                  │  │
│   │   │ How long will you run this stage?          │    │                  │  │
│   │   └─────────────────────────────────────────────┘    │                  │  │
│   │                                                       │                  │  │
│   │   ┌─────────────────────────────────────────────┐    │                  │  │
│   │   │ Materials                               ⓘ  │    │                  │  │
│   │   │                                             │    │                  │  │
│   │   │ ┌──────────────────────────────────────┐   │    │                  │  │
│   │   │ │ 60/90 Silicon Carbide          ▼     │   │    │                  │  │
│   │   │ └──────────────────────────────────────┘   │    │                  │  │
│   │   │ ┌────────────┐  ┌──────────────────────┐   │    │                  │  │
│   │   │ │ 2          │  │ tbsp             ▼   │   │    │                  │  │
│   │   │ └────────────┘  └──────────────────────┘   │    │                  │  │
│   │   │                        [ + Add Material ]  │    │                  │  │
│   │   └─────────────────────────────────────────────┘    │                  │  │
│   │                                                       │                  │  │
│   │         [ Cancel ]              [ Add Stage → ]       │                  │  │
│   │                                                       │                  │  │
│   └──────────────────────────────────────────────────────┴──────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Contextual Tooltips

### 6.1 Tooltip Design Pattern

Tooltips appear on hover (desktop) or tap (mobile) next to the ⓘ icon:

```
┌─────────────────────────────────────────┐
│ Duration                            ⓘ  │
│ ┌────────────────────────────────────┐  │
│ │ 7 days                             │  │     ┌─────────────────────────────┐
│ └────────────────────────────────────┘  │     │ How long to run this stage. │
└─────────────────────────────────────────┘     │                             │
         ▲                                       │ • Coarse: 7-10 days         │
         │                                       │ • Medium: 7-10 days         │
         └───────────────────────────────────────│ • Polish: 5-7 days          │
                                                 │                             │
                                                 │ Tip: Check your tumbler     │
                                                 │ every few days!             │
                                                 └─────────────────────────────┘
```

### 6.2 Tooltip Content Library

| Field | Tooltip Content |
|-------|----------------|
| **Cycle Name** | Give your batch a memorable name. Examples: "Lake Superior Agates - Batch 1", "Beach Stones June 2025" |
| **Specimens** | Select the rock types in your barrel. This helps us warn you about hardness mismatches and suggest appropriate materials. |
| **Additional Specimens** | Describe any rocks not in our database. "Unknown pebbles from beach", "Grandma's rock collection" |
| **Stage Name** | Most tumblers follow: Coarse → Medium → Fine → Polish. Some skip Fine, others add Pre-Polish. |
| **Tumbler** | Which tumbler are you using? Different tumblers may perform differently. |
| **Duration** | Typical durations: Coarse (7-10 days), Medium (7-10 days), Fine (5-7 days), Polish (5-7 days). Softer rocks may need less time. |
| **Materials** | Add the grit, polish, or additives you're using. Amount is typically 1-2 tbsp per pound of rocks. |
| **Cleaning Run** | A short run with soap/burnishing compound between stages. Removes residual grit to prevent contamination. |
| **Fill Level** | How full is your barrel? Optimal is 2/3 to 3/4 full. Too empty = rocks break, too full = poor tumbling action. |
| **RPM** | Barrel rotation speed. Most rotary tumblers run at 25-35 RPM. Check your manual or estimate. |
| **Result Rating** | How happy are you with this stage's results? 1 = Poor, 5 = Excellent |
| **Issue Flags** | Mark any problems: scratches, chips, under-rounded, contamination. Helps you learn for next time. |
| **Lessons Learned** | Notes for your future self. "Should have run 2 more days", "Too much ceramic media" |

---

## 7. Progress Indicators

### 7.1 Getting Started Checklist (Dashboard Widget)

Shows until all items complete:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Getting Started                                                      [Hide]  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │   ✅  Create your account                                                │  │
│   │   ✅  Set your preferences                                               │  │
│   │   ✅  Add your first tumbler                                             │  │
│   │   ⬜  Start your first cycle                              [ Do This → ]  │  │
│   │   ⬜  Complete a stage                                                   │  │
│   │   ⬜  Upload your first photo                                            │  │
│   │   ⬜  Complete your first cycle                                          │  │
│   │   ⬜  Share to the gallery                                               │  │
│   │                                                                          │  │
│   │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  37% complete │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Profile Completeness (Settings)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Profile Completeness                                                          │
│                                                                                 │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  75% complete  │
│                                                                                 │
│   ✅  Display name                                                              │
│   ✅  Avatar                                                                    │
│   ⬜  Bio                                                  [ Add Bio → ]        │
│   ✅  Timezone                                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Cycle Progress Indicator

Shows on cycle detail:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Cycle Progress                                                                │
│                                                                                 │
│   [●]─────────[●]─────────[●]─────────[○]─────────[○]                          │
│   Coarse      Medium      Fine        Pre-Polish  Polish                        │
│   ✓ Done      ✓ Done      ✓ Done      In Progress                              │
│                                                                                 │
│   3 of 5 stages complete • ~14 days remaining                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Mobile Onboarding

### 8.1 Mobile Welcome Wizard

```
┌─────────────────────────────────┐
│         MyUglyRocks             │
├─────────────────────────────────┤
│                                 │
│                                 │
│         Welcome! 🪨             │
│                                 │
│   Let's get you set up          │
│   in just a few steps:          │
│                                 │
│   ┌─────────────────────────┐   │
│   │ ① Set preferences       │   │
│   │ ② Add your tumbler      │   │
│   │ ③ Start tumbling!       │   │
│   └─────────────────────────┘   │
│                                 │
│   This takes about 2 minutes.   │
│                                 │
│   ┌─────────────────────────┐   │
│   │      [ Let's Go! ]      │   │
│   └─────────────────────────┘   │
│                                 │
│      Skip for now               │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

### 8.2 Mobile Empty Dashboard

```
┌─────────────────────────────────┐
│ ☰ Dashboard                 👤  │
├─────────────────────────────────┤
│                                 │
│   Welcome, rockfan42!           │
│                                 │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   │          📦             │   │
│   │                         │   │
│   │  Add your first tumbler │   │
│   │                         │   │
│   │  You need a tumbler     │   │
│   │  before you can start   │   │
│   │  tracking cycles.       │   │
│   │                         │   │
│   │  [ Add Tumbler ]        │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│   ─────────────────────────────│
│                                 │
│   Explore while you wait:       │
│                                 │
│   📚 Specimens    🧪 Materials  │
│                                 │
│   🖼️ Gallery                    │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

---

## 9. Data Requirements

### 9.1 User Onboarding State

Track in `User` or `UserSettings` table:

```typescript
interface UserOnboardingState {
  onboardingCompleted: boolean;      // Has completed the wizard
  onboardingSkippedAt: Date | null;  // If they skipped, when
  firstCycleCreated: boolean;
  firstStageCompleted: boolean;
  firstPhotoUploaded: boolean;
  firstCycleCompleted: boolean;
  firstPostShared: boolean;
  checklistDismissed: boolean;       // User hid the checklist
}
```

### 9.2 API Endpoints

| Action | Endpoint |
|--------|----------|
| Complete onboarding step | `POST /api/users/me/onboarding/complete` |
| Skip onboarding | `POST /api/users/me/onboarding/skip` |
| Dismiss checklist | `POST /api/users/me/onboarding/dismiss-checklist` |
| Get onboarding state | `GET /api/users/me` (included in user response) |

---

## 10. Implementation Notes

### 10.1 Component Structure

```
components/
├── onboarding/
│   ├── WelcomeWizard.tsx          # 3-step wizard container
│   ├── WizardStepSettings.tsx     # Step 1: Quick settings
│   ├── WizardStepTumbler.tsx      # Step 2: Add tumbler
│   ├── WizardStepComplete.tsx     # Step 3: Success + next steps
│   ├── GettingStartedChecklist.tsx # Dashboard widget
│   └── EmptyState.tsx             # Reusable empty state
│
├── shared/
│   ├── Tooltip.tsx                # Info tooltip component
│   ├── HelpSidebar.tsx           # Contextual tips sidebar
│   └── ProgressBar.tsx           # Progress indicator
```

### 10.2 Show/Hide Logic

| Condition | Show |
|-----------|------|
| First login after email verification | Welcome wizard |
| No tumblers + any protected page | Tumbler prompt banner |
| Has tumbler + no cycles + dashboard | "Start your first cycle" CTA |
| Onboarding not complete + dashboard | Getting Started checklist |
| User dismissed checklist | Nothing (respect preference) |

### 10.3 Tooltip Implementation

Use Radix UI Tooltip (via shadcn/ui):
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <InfoIcon className="h-4 w-4" />
    </TooltipTrigger>
    <TooltipContent>
      <p>{tooltipContent}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 11. Related Documents

- [01-dashboard.md](./01-dashboard.md) - Dashboard layouts
- [04-tumblers.md](./04-tumblers.md) - Tumbler management
- [02-cycles.md](./02-cycles.md) - Cycle creation flow
- [03-stage-run.md](./03-stage-run.md) - Stage forms
- [08-settings.md](./08-settings.md) - User settings
