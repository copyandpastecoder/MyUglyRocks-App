# Plan: Separate Mobile Components for MyUglyRocks App

## Overview

Create dedicated mobile components/pages for all major features. Desktop components remain **completely untouched**. Mobile detection determines which component tree to render.

## Architecture

```
src/web/src/
├── hooks/
│   └── use-is-mobile.ts          # New: viewport detection hook
├── components/
│   ├── [existing desktop components]
│   └── mobile/                    # New: all mobile components
│       ├── tumblers/
│       ├── cycles/
│       ├── stages/
│       ├── inventory/
│       └── gallery/
```

### Mobile Detection Hook

```tsx
// hooks/use-is-mobile.ts
export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}
```

### Usage Pattern

```tsx
// In parent component or page
const isMobile = useIsMobile();

return isMobile
  ? <MobileTumblerForm {...props} />
  : <TumblerForm {...props} />;
```

---

## Component Inventory

### 1. TUMBLERS

| Desktop Component | Mobile Component | Type |
|-------------------|------------------|------|
| `tumblers/page.tsx` | `mobile/tumblers/tumbler-list-mobile.tsx` | Page content |
| `tumblers/new/page.tsx` | `mobile/tumblers/tumbler-form-mobile.tsx` | Full-page form |
| Barrel management dialog | `mobile/tumblers/barrel-sheet-mobile.tsx` | Bottom sheet |

**Mobile UX:**
- Full-page forms instead of inline cards
- Bottom sheets for barrel management
- Larger touch targets
- Stacked form fields

---

### 2. CYCLES

| Desktop Component | Mobile Component | Type |
|-------------------|------------------|------|
| `cycles/page.tsx` | `mobile/cycles/cycle-list-mobile.tsx` | Page content |
| `cycles/new/page.tsx` | `mobile/cycles/cycle-form-mobile.tsx` | Full-page form |
| `cycle-form-dialog.tsx` | `mobile/cycles/cycle-edit-sheet-mobile.tsx` | Bottom sheet |
| `specimen-multi-select.tsx` | `mobile/cycles/specimen-select-sheet-mobile.tsx` | Full-screen sheet |
| Cycle completion UI | `mobile/cycles/cycle-complete-sheet-mobile.tsx` | Bottom sheet |

**Mobile UX:**
- Specimen selection as full-screen sheet with large checkboxes
- Cycle list as stacked cards
- Bottom sheet for edit/complete actions

---

### 3. STAGE RUNS

| Desktop Component | Mobile Component | Type |
|-------------------|------------------|------|
| `stage/stage-form-modal.tsx` | `mobile/stages/stage-form-sheet-mobile.tsx` | Full-screen sheet |
| `stage/stage-materials-section.tsx` | `mobile/stages/stage-materials-mobile.tsx` | Inline section |
| `stage/cleaning-run-section.tsx` | `mobile/stages/cleaning-run-mobile.tsx` | Expandable section |
| `cleaning-run-modal.tsx` | `mobile/stages/cleaning-run-sheet-mobile.tsx` | Bottom sheet |
| Stage completion UI | `mobile/stages/stage-complete-sheet-mobile.tsx` | Bottom sheet |

**Mobile UX:**
- Full-screen sheet for stage creation/edit (lots of fields)
- Barrel selection as scrollable list with large checkboxes
- Duration picker optimized for touch
- Material selection as separate sub-sheet

---

### 4. INVENTORY

| Desktop Component | Mobile Component | Type |
|-------------------|------------------|------|
| `inventory/page.tsx` | `mobile/inventory/inventory-list-mobile.tsx` | Page content |
| `inventory/new/page.tsx` | `mobile/inventory/inventory-form-mobile.tsx` | Full-page form |
| `inventory-photos.tsx` | `mobile/inventory/inventory-photos-mobile.tsx` | Photo grid |
| `inventory-photo-upload-modal.tsx` | `mobile/inventory/photo-upload-sheet-mobile.tsx` | Bottom sheet |
| `inventory-photo-edit-dialog.tsx` | `mobile/inventory/photo-edit-sheet-mobile.tsx` | Bottom sheet |
| `inventory-source-picker.tsx` | `mobile/inventory/source-picker-sheet-mobile.tsx` | Bottom sheet |
| `specimen-row-list.tsx` | `mobile/inventory/specimen-rows-mobile.tsx` | Stacked cards |

**Mobile UX:**
- Single-column inventory list with larger thumbnails
- Filters as collapsible drawer
- Photo grid 2 columns max
- Specimen rows as individual cards with swipe actions

---

### 5. PHOTO GALLERY

| Desktop Component | Mobile Component | Type |
|-------------------|------------------|------|
| `gallery/page.tsx` | `mobile/gallery/gallery-list-mobile.tsx` | Page content |
| `gallery/[id]/page.tsx` | `mobile/gallery/post-detail-mobile.tsx` | Page content |
| `photo-lightbox.tsx` | `mobile/gallery/photo-lightbox-mobile.tsx` | Full-screen |
| `cycle-photos.tsx` | `mobile/cycles/cycle-photos-mobile.tsx` | Photo grid |
| `photo-upload-modal.tsx` | `mobile/cycles/photo-upload-sheet-mobile.tsx` | Bottom sheet |

**Mobile UX:**
- Swipe gestures in lightbox
- Pinch-to-zoom support
- Bottom toolbar for actions
- Single column post list

---

## Implementation Order

### Phase 1: Foundation
1. Create `use-is-mobile.ts` hook
2. Create `src/web/src/components/mobile/` directory structure
3. Create base mobile Sheet component (if not using shadcn Sheet)

### Phase 2: Most Used Features (Cycles & Stages)
1. `specimen-select-sheet-mobile.tsx` - Most impactful fix
2. `stage-form-sheet-mobile.tsx` - Complex form
3. `cycle-form-mobile.tsx` - Create cycle
4. `cycle-list-mobile.tsx` - Cycle listing

### Phase 3: Inventory
1. `inventory-list-mobile.tsx`
2. `inventory-form-mobile.tsx`
3. `inventory-photos-mobile.tsx`
4. Photo upload/edit sheets

### Phase 4: Tumblers
1. `tumbler-list-mobile.tsx`
2. `tumbler-form-mobile.tsx`
3. `barrel-sheet-mobile.tsx`

### Phase 5: Gallery & Polish
1. `gallery-list-mobile.tsx`
2. `photo-lightbox-mobile.tsx`
3. Final testing and refinements

---

## Shared Mobile Components

These will be reused across features:

```
mobile/shared/
├── mobile-sheet.tsx          # Base full-screen/bottom sheet
├── mobile-form-field.tsx     # Larger inputs for touch
├── mobile-select-sheet.tsx   # Generic selection sheet
├── mobile-photo-grid.tsx     # 2-column photo grid
├── mobile-action-bar.tsx     # Bottom fixed action buttons
```

---

## File Naming Convention

- `*-mobile.tsx` - Mobile-specific component
- `*-sheet-mobile.tsx` - Mobile bottom/full-screen sheet

---

## Testing Checklist

For each mobile component:
- [ ] Works on 320px viewport (iPhone SE)
- [ ] Works on 375px viewport (iPhone 12/13)
- [ ] Works on 414px viewport (iPhone Plus sizes)
- [ ] Touch targets are at least 44px
- [ ] Forms are usable with on-screen keyboard
- [ ] Scrolling works correctly in sheets
- [ ] Desktop components remain unchanged

---

## Estimated Component Count

| Feature | New Mobile Components |
|---------|----------------------|
| Shared | 5 |
| Tumblers | 3 |
| Cycles | 5 |
| Stages | 5 |
| Inventory | 7 |
| Gallery | 4 |
| **Total** | **~29 components** |

---

## Questions for User

1. **Breakpoint**: Use 640px (Tailwind `sm`) as the mobile cutoff?
2. **Priority**: Start with Cycles/Stages (Phase 2) since that's where the specimen dropdown issue is?
3. **Sheet style**: Full-screen sheets that slide up, or partial bottom sheets?
