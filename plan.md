# Plan: Separate Mobile Components for MyUglyRocks App

## Overview

Create dedicated mobile components for all major features. Desktop components remain **completely untouched**. Mobile detection determines which component to render.

**Target devices:**
- **Mobile UI**: Phones only (portrait AND landscape)
- **Desktop UI**: Tablets and desktop computers

---

## Architecture

### Directory Structure (Pattern C: Feature Folders)

```
src/web/src/
├── hooks/
│   └── use-is-mobile.ts                    # Phone detection hook
├── components/
│   ├── specimen-select/                    # Feature folder
│   │   ├── index.tsx                       # Smart export (handles detection)
│   │   ├── specimen-select.desktop.tsx     # Desktop version (current code)
│   │   ├── specimen-select.mobile.tsx      # Mobile version (new)
│   │   ├── use-specimen-select.ts          # Shared logic hook
│   │   └── types.ts                        # Shared types
│   ├── stage-form/
│   │   ├── index.tsx
│   │   ├── stage-form.desktop.tsx
│   │   ├── stage-form.mobile.tsx
│   │   └── use-stage-form.ts
│   └── ... (other feature folders)
```

### Mobile Detection Hook

Detects **phones only** by checking the smaller screen dimension. This ensures:
- Phone in portrait → Mobile UI
- Phone in landscape → Mobile UI (still a phone!)
- Tablet in any orientation → Desktop UI
- Desktop → Desktop UI

```tsx
// hooks/use-is-mobile.ts
'use client';

import { useState, useEffect } from 'react';

const PHONE_MAX_DIMENSION = 500; // Phones always have one dimension < 500px

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
      setIsMobile(smallerDimension < PHONE_MAX_DIMENSION);
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);

    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return isMobile;
}
```

### Smart Index Pattern

Each feature folder has an `index.tsx` that handles platform detection:

```tsx
// components/specimen-select/index.tsx
'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { SpecimenSelectDesktop } from './specimen-select.desktop';
import { SpecimenSelectMobile } from './specimen-select.mobile';
import type { SpecimenSelectProps } from './types';

export function SpecimenSelect(props: SpecimenSelectProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SpecimenSelectMobile {...props} />;
  }

  return <SpecimenSelectDesktop {...props} />;
}

// Re-export for consumers
export type { SpecimenSelectProps, SpecimenSelection } from './types';
```

### Consumer Usage

Pages and parent components simply import - they don't know about platform:

```tsx
// app/(protected)/cycles/new/page.tsx
import { SpecimenSelect } from '@/components/specimen-select';

// Just use it - platform detection is automatic
<SpecimenSelect
  selectedItems={items}
  onSelectionChange={setItems}
/>
```

---

## Component Inventory

### 1. TUMBLERS

| Feature Folder | Desktop File | Mobile File | Shared Logic |
|----------------|--------------|-------------|--------------|
| `tumbler-list/` | `tumbler-list.desktop.tsx` | `tumbler-list.mobile.tsx` | `use-tumbler-list.ts` |
| `tumbler-form/` | `tumbler-form.desktop.tsx` | `tumbler-form.mobile.tsx` | `use-tumbler-form.ts` |
| `barrel-manager/` | `barrel-manager.desktop.tsx` | `barrel-manager.mobile.tsx` | `use-barrel-manager.ts` |

**Mobile UX:**
- Full-screen forms with large touch targets
- Bottom sheet for barrel management
- Stacked form fields

---

### 2. CYCLES

| Feature Folder | Desktop File | Mobile File | Shared Logic |
|----------------|--------------|-------------|--------------|
| `cycle-list/` | `cycle-list.desktop.tsx` | `cycle-list.mobile.tsx` | `use-cycle-list.ts` |
| `cycle-form/` | `cycle-form.desktop.tsx` | `cycle-form.mobile.tsx` | `use-cycle-form.ts` |
| `specimen-select/` | `specimen-select.desktop.tsx` | `specimen-select.mobile.tsx` | `use-specimen-select.ts` |
| `cycle-complete/` | `cycle-complete.desktop.tsx` | `cycle-complete.mobile.tsx` | - |

**Mobile UX:**
- Specimen selection as full-screen sheet with large checkboxes
- Cycle list as stacked cards
- Full-screen forms

---

### 3. STAGE RUNS

| Feature Folder | Desktop File | Mobile File | Shared Logic |
|----------------|--------------|-------------|--------------|
| `stage-form/` | `stage-form.desktop.tsx` | `stage-form.mobile.tsx` | `use-stage-form.ts` |
| `stage-materials/` | `stage-materials.desktop.tsx` | `stage-materials.mobile.tsx` | - |
| `stage-complete/` | `stage-complete.desktop.tsx` | `stage-complete.mobile.tsx` | - |
| `cleaning-run/` | `cleaning-run.desktop.tsx` | `cleaning-run.mobile.tsx` | `use-cleaning-run.ts` |

**Mobile UX:**
- Full-screen sheet for stage creation/edit
- Large barrel checkboxes
- Touch-friendly duration picker
- Material selection as sub-sheet

---

### 4. INVENTORY

| Feature Folder | Desktop File | Mobile File | Shared Logic |
|----------------|--------------|-------------|--------------|
| `inventory-list/` | `inventory-list.desktop.tsx` | `inventory-list.mobile.tsx` | `use-inventory-list.ts` |
| `inventory-form/` | `inventory-form.desktop.tsx` | `inventory-form.mobile.tsx` | `use-inventory-form.ts` |
| `inventory-photos/` | `inventory-photos.desktop.tsx` | `inventory-photos.mobile.tsx` | - |
| `photo-upload/` | `photo-upload.desktop.tsx` | `photo-upload.mobile.tsx` | `use-photo-upload.ts` |
| `photo-edit/` | `photo-edit.desktop.tsx` | `photo-edit.mobile.tsx` | - |
| `source-picker/` | `source-picker.desktop.tsx` | `source-picker.mobile.tsx` | - |
| `specimen-rows/` | `specimen-rows.desktop.tsx` | `specimen-rows.mobile.tsx` | - |

**Mobile UX:**
- Single-column inventory list
- Collapsible filters drawer
- 2-column photo grid max
- Swipeable specimen row cards

---

### 5. PHOTO GALLERY

| Feature Folder | Desktop File | Mobile File | Shared Logic |
|----------------|--------------|-------------|--------------|
| `gallery-list/` | `gallery-list.desktop.tsx` | `gallery-list.mobile.tsx` | `use-gallery-list.ts` |
| `post-detail/` | `post-detail.desktop.tsx` | `post-detail.mobile.tsx` | - |
| `photo-lightbox/` | `photo-lightbox.desktop.tsx` | `photo-lightbox.mobile.tsx` | `use-photo-lightbox.ts` |
| `cycle-photos/` | `cycle-photos.desktop.tsx` | `cycle-photos.mobile.tsx` | - |

**Mobile UX:**
- Swipe gestures in lightbox
- Pinch-to-zoom
- Bottom toolbar for actions
- Single column post list

---

## Implementation Order

### Phase 1: Foundation
1. Create `use-is-mobile.ts` hook
2. Set up folder structure for first component
3. Create shared mobile UI primitives (optional)

### Phase 2: Cycles & Specimens (Original Issue)
1. `specimen-select/` - The dropdown that started this
2. `cycle-form/` - Create cycle page
3. `cycle-list/` - Cycles listing

### Phase 3: Stage Runs
1. `stage-form/` - Complex form, high value
2. `stage-materials/`
3. `stage-complete/`
4. `cleaning-run/`

### Phase 4: Inventory
1. `inventory-list/`
2. `inventory-form/`
3. `inventory-photos/`
4. `photo-upload/`, `photo-edit/`
5. `source-picker/`, `specimen-rows/`

### Phase 5: Tumblers
1. `tumbler-list/`
2. `tumbler-form/`
3. `barrel-manager/`

### Phase 6: Gallery & Polish
1. `gallery-list/`
2. `post-detail/`
3. `photo-lightbox/`
4. `cycle-photos/`

---

## Migration Strategy

For each component:

1. **Create feature folder** with `index.tsx`, `types.ts`
2. **Move existing code** to `.desktop.tsx` (rename, no changes)
3. **Extract shared logic** into `use-*.ts` hook
4. **Create `.mobile.tsx`** using shared hook
5. **Update imports** in consuming files to use new path
6. **Test both platforms**

Example for `specimen-multi-select.tsx`:

```
Before:
  components/specimen-multi-select.tsx

After:
  components/specimen-select/
  ├── index.tsx                       # Smart export
  ├── specimen-select.desktop.tsx     # Moved from specimen-multi-select.tsx
  ├── specimen-select.mobile.tsx      # New mobile version
  ├── use-specimen-select.ts          # Extracted logic
  └── types.ts                        # Shared types
```

---

## Device Detection Reference

| Device | Dimensions (Portrait) | Smaller Dim | Result |
|--------|----------------------|-------------|--------|
| iPhone SE | 375 × 667 | 375 | Mobile ✓ |
| iPhone 14 | 393 × 852 | 393 | Mobile ✓ |
| iPhone 14 Pro Max | 430 × 932 | 430 | Mobile ✓ |
| iPhone 14 Plus | 428 × 926 | 428 | Mobile ✓ |
| Pixel 7 | 412 × 915 | 412 | Mobile ✓ |
| Galaxy S23 | 360 × 780 | 360 | Mobile ✓ |
| iPad Mini | 768 × 1024 | 768 | Desktop ✓ |
| iPad Air | 820 × 1180 | 820 | Desktop ✓ |
| iPad Pro 11" | 834 × 1194 | 834 | Desktop ✓ |
| iPad Pro 12.9" | 1024 × 1366 | 1024 | Desktop ✓ |
| Desktop | 1920 × 1080 | 1080 | Desktop ✓ |

Threshold: `smallerDimension < 500` catches all phones, excludes all tablets.

---

## Testing Checklist

For each mobile component:
- [ ] iPhone SE (375px) - smallest phone
- [ ] iPhone 14 Pro Max (430px) - largest phone
- [ ] Portrait orientation
- [ ] Landscape orientation
- [ ] Touch targets ≥ 44px
- [ ] Forms usable with on-screen keyboard
- [ ] Scrolling works in sheets/modals
- [ ] Desktop version unchanged

---

## Estimated Component Count

| Feature | Folders | Files (Desktop + Mobile + Shared) |
|---------|---------|-----------------------------------|
| Hook | - | 1 |
| Tumblers | 3 | ~9 |
| Cycles | 4 | ~12 |
| Stages | 4 | ~12 |
| Inventory | 7 | ~21 |
| Gallery | 4 | ~12 |
| **Total** | **22** | **~67 files** |

---

## Ready to Proceed?

Phase 1 (Foundation) and Phase 2 (Cycles & Specimens) will address the original issue. Approve to begin implementation.
