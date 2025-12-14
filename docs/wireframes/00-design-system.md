# MyUglyRocks - Design System

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [03-SITEMAP.md](../03-SITEMAP.md) |

---

## 1. Design Philosophy

### 1.1 Core Principles
- **Approachable** - Friendly and welcoming to beginners, not intimidating
- **Functional** - Clear hierarchy, easy to scan, action-oriented
- **Earthy** - Colors inspired by rocks, minerals, and nature
- **Clean** - Minimal clutter, generous whitespace, focused content

### 1.2 Brand Personality
- Playful but not childish (the "Ugly Rocks" name sets a fun tone)
- Helpful and educational
- Community-focused
- Practical and tool-oriented

### 1.3 Single Source of Truth Principle

**All styles must be controlled from a single location.** Changing a color, font, or component pattern in one place should update it everywhere across the site.

| What | Where to Change | Effect |
|------|-----------------|--------|
| Colors | `tailwind.config.js` → `theme.extend.colors` | All usages of that color update |
| Fonts | `tailwind.config.js` → `theme.extend.fontFamily` | All text updates |
| Spacing | `tailwind.config.js` → `theme.extend.spacing` | All margins/padding update |
| Components | `components/ui/*.tsx` | All instances of that component update |
| Form patterns | `components/ui/input.tsx`, `select.tsx`, etc. | All forms update |
| Layout patterns | `components/layout/*.tsx` | All pages using that layout update |

**Implementation approach:**
1. Define design tokens in Tailwind config (colors, fonts, spacing)
2. Build reusable UI components using those tokens
3. Never use raw hex codes or magic numbers in page code
4. Always import and use the component library

```tsx
// ❌ BAD - hardcoded, can't change globally
<button className="bg-[#F59E0B] hover:bg-[#D97706]">Save</button>

// ✅ GOOD - uses design token
<button className="bg-primary hover:bg-primary-hover">Save</button>

// ✅ BEST - uses component (encapsulates all styling)
<Button variant="primary">Save</Button>
```

---

## 2. Color Palette

### 2.1 Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Stone** | `#1E293B` | Primary text, headers |
| **Slate** | `#475569` | Secondary text, labels |
| **Rock** | `#64748B` | Tertiary text, placeholders |

### 2.2 Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Amber** | `#F59E0B` | Primary accent, CTAs, links |
| **Amber Dark** | `#D97706` | Hover states |
| **Amber Light** | `#FCD34D` | Highlights, badges |

### 2.3 Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#22C55E` | Completed stages, confirmations |
| **Warning** | `#EAB308` | Reminders, cautions |
| **Error** | `#EF4444` | Errors, destructive actions |
| **Info** | `#3B82F6` | Informational notices |

### 2.4 Background Colors

| Name | Hex | Usage |
|------|-----|-------|
| **White** | `#FFFFFF` | Cards, modals |
| **Gray 50** | `#F8FAFC` | Page background |
| **Gray 100** | `#F1F5F9` | Alternate rows, subtle sections |
| **Gray 200** | `#E2E8F0` | Borders, dividers |

### 2.5 Stage Status Colors

| Stage | Color | Hex |
|-------|-------|-----|
| **Coarse** | Red-brown | `#B45309` |
| **Medium** | Orange | `#EA580C` |
| **Fine** | Yellow | `#CA8A04` |
| **Pre-Polish** | Teal | `#0D9488` |
| **Polish** | Emerald | `#059669` |
| **Burnish** | Blue | `#2563EB` |

### 2.6 Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // ========================================
        // SEMANTIC TOKENS (use these in components)
        // Change these to retheme the entire site
        // ========================================
        primary: {
          DEFAULT: '#F59E0B',  // Main accent (buttons, links, CTAs)
          hover: '#D97706',    // Hover state
          light: '#FCD34D',    // Badges, highlights
          dark: '#B45309',     // Active/pressed state
          foreground: '#78350F', // Text on primary background
        },

        // Semantic status colors
        success: '#22C55E',
        warning: '#EAB308',
        error: '#EF4444',
        info: '#3B82F6',

        // Stage colors (for tumbling stages)
        stage: {
          coarse: '#B45309',
          medium: '#EA580C',
          fine: '#CA8A04',
          prepolish: '#0D9488',
          polish: '#059669',
          burnish: '#2563EB',
        },

        // ========================================
        // RAW COLOR SCALES (for reference)
        // Prefer semantic tokens above
        // ========================================
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Use Tailwind's default slate for grays
      },
    },
  },
}
```

### 2.7 Themes (Specimen-Inspired)

MyUglyRocks uses specimen-inspired theme names. **Obsidian (dark)** is the default theme.

#### Available Themes

| Theme Name | Type | Primary Accent | Inspiration |
|------------|------|----------------|-------------|
| **Obsidian** (default) | Dark | Amber `#F59E0B` | Volcanic glass - deep black |
| **Lapis Lazuli** | Dark | Blue `#3B82F6` | Deep blue metamorphic rock |
| **Bumblebee Jasper** | Dark | Yellow `#FACC15` | Yellow-banded jasper |
| **Malachite** | Dark | Green `#22C55E` | Green copper carbonate |
| **Rose Quartz** | Dark | Pink `#F472B6` | Pink quartz crystal |
| **Tiger's Eye** | Dark | Orange `#F97316` | Chatoyant golden-brown |
| **Snowflake Obsidian** | Light | Slate `#475569` | Black obsidian with white cristobalite |

#### Theme Color Tokens

Each theme defines these CSS custom properties:

```css
:root {
  /* Obsidian (Default Dark Theme) */
  --background: #0F172A;           /* Deep slate background */
  --background-secondary: #1E293B; /* Card backgrounds */
  --background-tertiary: #334155;  /* Elevated surfaces */
  --foreground: #F8FAFC;           /* Primary text */
  --foreground-muted: #94A3B8;     /* Secondary text */
  --border: #334155;               /* Borders, dividers */
  --accent: #F59E0B;               /* Primary accent (amber) */
  --accent-hover: #D97706;         /* Accent hover state */
  --accent-foreground: #78350F;    /* Text on accent background */
}

[data-theme="lapis-lazuli"] {
  --background: #0C1222;
  --background-secondary: #1E293B;
  --background-tertiary: #2D3A52;
  --foreground: #F8FAFC;
  --foreground-muted: #94A3B8;
  --border: #2D3A52;
  --accent: #3B82F6;
  --accent-hover: #2563EB;
  --accent-foreground: #FFFFFF;
}

[data-theme="bumblebee-jasper"] {
  --background: #18120A;
  --background-secondary: #292115;
  --background-tertiary: #3D3220;
  --foreground: #FEF9C3;
  --foreground-muted: #A3A084;
  --border: #3D3220;
  --accent: #FACC15;
  --accent-hover: #EAB308;
  --accent-foreground: #422006;
}

[data-theme="malachite"] {
  --background: #052E16;
  --background-secondary: #14532D;
  --background-tertiary: #166534;
  --foreground: #F0FDF4;
  --foreground-muted: #86EFAC;
  --border: #166534;
  --accent: #22C55E;
  --accent-hover: #16A34A;
  --accent-foreground: #052E16;
}

[data-theme="rose-quartz"] {
  --background: #1F0A1A;
  --background-secondary: #2E1527;
  --background-tertiary: #4A2040;
  --foreground: #FDF2F8;
  --foreground-muted: #F9A8D4;
  --border: #4A2040;
  --accent: #F472B6;
  --accent-hover: #EC4899;
  --accent-foreground: #500724;
}

[data-theme="tigers-eye"] {
  --background: #1A1006;
  --background-secondary: #2D1D0E;
  --background-tertiary: #422A14;
  --foreground: #FFF7ED;
  --foreground-muted: #FDBA74;
  --border: #422A14;
  --accent: #F97316;
  --accent-hover: #EA580C;
  --accent-foreground: #431407;
}

[data-theme="snowflake-obsidian"] {
  /* Light theme */
  --background: #FFFFFF;
  --background-secondary: #F8FAFC;
  --background-tertiary: #F1F5F9;
  --foreground: #0F172A;
  --foreground-muted: #64748B;
  --border: #E2E8F0;
  --accent: #475569;
  --accent-hover: #334155;
  --accent-foreground: #FFFFFF;
}
```

#### Tailwind Integration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--background)',
          secondary: 'var(--background-secondary)',
          tertiary: 'var(--background-tertiary)',
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          muted: 'var(--foreground-muted)',
        },
        border: 'var(--border)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          foreground: 'var(--accent-foreground)',
        },
      },
    },
  },
}
```

#### Theme Switching

```tsx
// components/ThemeSwitcher.tsx
const themes = [
  { id: 'obsidian', name: 'Obsidian', icon: '🖤' },
  { id: 'lapis-lazuli', name: 'Lapis Lazuli', icon: '💙' },
  { id: 'bumblebee-jasper', name: 'Bumblebee Jasper', icon: '💛' },
  { id: 'malachite', name: 'Malachite', icon: '💚' },
  { id: 'rose-quartz', name: 'Rose Quartz', icon: '🩷' },
  { id: 'tigers-eye', name: "Tiger's Eye", icon: '🧡' },
  { id: 'snowflake-obsidian', name: 'Snowflake Obsidian', icon: '🤍' },
];

function ThemeSwitcher() {
  const [theme, setTheme] = useState('obsidian');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <Select value={theme} onValueChange={setTheme}>
      {themes.map((t) => (
        <SelectItem key={t.id} value={t.id}>
          {t.icon} {t.name}
        </SelectItem>
      ))}
    </Select>
  );
}
```

#### User Preference Storage

Theme preference stored in `UserSettings.Theme` field:

| Column | Type | Default |
|--------|------|---------|
| `Theme` | varchar(50) | `'obsidian'` |

---

## 3. Typography

### 3.1 Font Stack

| Purpose | Font | Fallback |
|---------|------|----------|
| **Headings** | Inter | system-ui, sans-serif |
| **Body** | Inter | system-ui, sans-serif |
| **Mono** | JetBrains Mono | ui-monospace, monospace |

### 3.2 Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display** | 36px / 2.25rem | 700 | 1.2 | Hero headlines |
| **H1** | 30px / 1.875rem | 700 | 1.3 | Page titles |
| **H2** | 24px / 1.5rem | 600 | 1.35 | Section headers |
| **H3** | 20px / 1.25rem | 600 | 1.4 | Card titles, subsections |
| **H4** | 18px / 1.125rem | 600 | 1.4 | Small headers |
| **Body** | 16px / 1rem | 400 | 1.5 | Default text |
| **Body SM** | 14px / 0.875rem | 400 | 1.5 | Secondary text, labels |
| **Caption** | 12px / 0.75rem | 400 | 1.4 | Timestamps, meta |

### 3.3 Tailwind Classes
```html
<!-- Headings -->
<h1 class="text-3xl font-bold text-slate-900">Page Title</h1>
<h2 class="text-2xl font-semibold text-slate-900">Section</h2>
<h3 class="text-xl font-semibold text-slate-800">Card Title</h3>

<!-- Body -->
<p class="text-base text-slate-700">Body text</p>
<p class="text-sm text-slate-600">Secondary text</p>
<span class="text-xs text-slate-500">Caption</span>
```

---

## 4. Spacing System

### 4.1 Base Unit
Base unit: **4px** (0.25rem)

### 4.2 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps (icon + text) |
| `space-2` | 8px | Compact spacing |
| `space-3` | 12px | Default gap |
| `space-4` | 16px | Section padding |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section margins |
| `space-8` | 32px | Major sections |
| `space-10` | 40px | Page sections |
| `space-12` | 48px | Hero spacing |
| `space-16` | 64px | Large gaps |

### 4.3 Common Patterns
```html
<!-- Card padding -->
<div class="p-5">...</div>

<!-- Section gap -->
<section class="space-y-6">...</section>

<!-- Form field gap -->
<div class="space-y-4">...</div>

<!-- Inline gap -->
<div class="flex items-center gap-2">...</div>
```

---

## 5. Layout

### 5.1 Responsive Breakpoints

| Name | Min Width | Tailwind |
|------|-----------|----------|
| **Mobile** | 0px | (default) |
| **SM** | 640px | `sm:` |
| **MD** | 768px | `md:` |
| **LG** | 1024px | `lg:` |
| **XL** | 1280px | `xl:` |
| **2XL** | 1536px | `2xl:` |

### 5.2 Container Widths

| Breakpoint | Max Width |
|------------|-----------|
| SM | 640px |
| MD | 768px |
| LG | 1024px |
| XL | 1280px |
| 2XL | 1400px |

### 5.3 Grid System
```html
<!-- 12-column grid -->
<div class="grid grid-cols-12 gap-6">
  <div class="col-span-12 md:col-span-8">Main</div>
  <div class="col-span-12 md:col-span-4">Sidebar</div>
</div>

<!-- Card grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Card</div>
</div>
```

### 5.4 Page Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header (fixed, h-16)                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Container (max-w-7xl mx-auto px-4)                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Breadcrumbs (if applicable)                     │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ Page Header (title + actions)                   │    │
│  ├─────────────────────────────────────────────────┤    │
│  │                                                 │    │
│  │ Main Content                                    │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Footer                                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Components

### 6.1 Component Library
**Recommended:** [shadcn/ui](https://ui.shadcn.com/)
- Accessible, customizable components
- Tailwind-based styling
- Copy-paste, own your code
- Great TypeScript support

### 6.2 Buttons

#### Primary Button
```html
<button class="bg-amber-500 hover:bg-amber-600 text-white font-medium
               px-4 py-2 rounded-lg transition-colors">
  Save Cycle
</button>
```

#### Secondary Button
```html
<button class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium
               px-4 py-2 rounded-lg transition-colors">
  Cancel
</button>
```

#### Outline Button
```html
<button class="border border-slate-300 hover:bg-slate-50 text-slate-700
               font-medium px-4 py-2 rounded-lg transition-colors">
  View Details
</button>
```

#### Ghost Button
```html
<button class="hover:bg-slate-100 text-slate-700 font-medium
               px-4 py-2 rounded-lg transition-colors">
  Edit
</button>
```

#### Destructive Button
```html
<button class="bg-red-500 hover:bg-red-600 text-white font-medium
               px-4 py-2 rounded-lg transition-colors">
  Delete
</button>
```

#### Button Sizes
| Size | Padding | Font Size |
|------|---------|-----------|
| **SM** | px-3 py-1.5 | text-sm |
| **MD** | px-4 py-2 | text-base |
| **LG** | px-6 py-3 | text-lg |

### 6.3 Cards

#### Basic Card
```html
<div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
  <h3 class="text-lg font-semibold text-slate-900">Card Title</h3>
  <p class="text-slate-600 mt-2">Card content goes here.</p>
</div>
```

#### Cycle Card
```html
<div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm
            hover:shadow-md transition-shadow cursor-pointer">
  <div class="flex items-start justify-between">
    <div>
      <h3 class="text-lg font-semibold text-slate-900">Lake Superior Agates</h3>
      <p class="text-sm text-slate-500 mt-1">Started Jan 15, 2025</p>
    </div>
    <span class="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
      Active
    </span>
  </div>
  <div class="mt-4 flex items-center gap-4 text-sm text-slate-600">
    <span>Stage 2 of 4</span>
    <span>3 specimens</span>
  </div>
</div>
```

### 6.4 Form Elements

#### Text Input
```html
<div class="space-y-1.5">
  <label class="text-sm font-medium text-slate-700">Cycle Name</label>
  <input type="text"
         class="w-full px-3 py-2 border border-slate-300 rounded-lg
                focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                placeholder:text-slate-400"
         placeholder="Enter cycle name">
</div>
```

#### Select
```html
<div class="space-y-1.5">
  <label class="text-sm font-medium text-slate-700">Tumbler</label>
  <select class="w-full px-3 py-2 border border-slate-300 rounded-lg
                 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
    <option>Select tumbler...</option>
    <option>Lortone 3A</option>
  </select>
</div>
```

#### Textarea
```html
<div class="space-y-1.5">
  <label class="text-sm font-medium text-slate-700">Notes</label>
  <textarea class="w-full px-3 py-2 border border-slate-300 rounded-lg
                   focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                   resize-none"
            rows="4"
            placeholder="Add any notes..."></textarea>
</div>
```

#### Checkbox
```html
<label class="flex items-center gap-2 cursor-pointer">
  <input type="checkbox"
         class="w-4 h-4 rounded border-slate-300 text-amber-500
                focus:ring-amber-500">
  <span class="text-sm text-slate-700">Enable reminder</span>
</label>
```

### 6.5 Badges / Pills

#### Status Badges
```html
<!-- Active -->
<span class="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
  Active
</span>

<!-- Completed -->
<span class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
  Completed
</span>
```

#### Count Badge
```html
<span class="inline-flex items-center justify-center w-5 h-5
             bg-amber-500 text-white text-xs font-medium rounded-full">
  3
</span>
```

### 6.6 Alerts / Notices

```html
<!-- Info -->
<div class="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <InfoIcon class="w-5 h-5 text-blue-500 flex-shrink-0" />
  <p class="text-sm text-blue-700">Your stage is about to complete.</p>
</div>

<!-- Success -->
<div class="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
  <p class="text-sm text-green-700">Cycle saved successfully!</p>
</div>

<!-- Warning -->
<div class="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
  <AlertIcon class="w-5 h-5 text-yellow-500 flex-shrink-0" />
  <p class="text-sm text-yellow-700">Mixing specimens with hardness difference > 1.0</p>
</div>

<!-- Error -->
<div class="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
  <XIcon class="w-5 h-5 text-red-500 flex-shrink-0" />
  <p class="text-sm text-red-700">Failed to upload photo. Please try again.</p>
</div>
```

### 6.7 Navigation

#### Header (Desktop)
```html
<header class="h-16 bg-white border-b border-slate-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2">
      <img src="/logo.svg" alt="MyUglyRocks" class="h-8 w-8" />
      <span class="font-bold text-xl text-slate-900">MyUglyRocks</span>
    </a>

    <!-- Nav Links -->
    <nav class="hidden md:flex items-center gap-6">
      <a href="/dashboard" class="text-slate-600 hover:text-amber-600">Dashboard</a>
      <a href="/cycles" class="text-slate-600 hover:text-amber-600">Cycles</a>
      <a href="/tumblers" class="text-slate-600 hover:text-amber-600">Tumblers</a>
      <a href="/gallery" class="text-slate-600 hover:text-amber-600">Gallery</a>
    </nav>

    <!-- User Menu -->
    <div class="flex items-center gap-4">
      <button class="w-9 h-9 rounded-full bg-slate-200"></button>
    </div>
  </div>
</header>
```

#### Breadcrumbs
```html
<nav class="flex items-center gap-2 text-sm text-slate-500">
  <a href="/cycles" class="hover:text-amber-600">Cycles</a>
  <ChevronRightIcon class="w-4 h-4" />
  <span class="text-slate-900">Lake Superior Agates</span>
</nav>
```

#### Mobile Bottom Nav
```html
<nav class="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200
            flex items-center justify-around md:hidden z-50">
  <a href="/dashboard" class="flex flex-col items-center gap-1 text-amber-600">
    <HomeIcon class="w-5 h-5" />
    <span class="text-xs">Dashboard</span>
  </a>
  <a href="/cycles" class="flex flex-col items-center gap-1 text-slate-500">
    <LayersIcon class="w-5 h-5" />
    <span class="text-xs">Cycles</span>
  </a>
  <!-- ... more items ... -->
</nav>
```

### 6.8 Photo Gallery

```html
<div class="grid grid-cols-3 gap-2">
  <div class="aspect-square rounded-lg overflow-hidden bg-slate-100">
    <img src="..." alt="Before" class="w-full h-full object-cover" />
  </div>
  <!-- Add button -->
  <button class="aspect-square rounded-lg border-2 border-dashed border-slate-300
                 flex items-center justify-center hover:border-amber-500
                 hover:bg-amber-50 transition-colors">
    <PlusIcon class="w-6 h-6 text-slate-400" />
  </button>
</div>
```

### 6.9 Modals / Dialogs

```html
<!-- Overlay -->
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <!-- Modal -->
  <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
    <h2 class="text-xl font-semibold text-slate-900">Delete Cycle?</h2>
    <p class="text-slate-600 mt-2">
      This action cannot be undone. All stages and photos will be deleted.
    </p>
    <div class="flex justify-end gap-3 mt-6">
      <button class="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">
        Cancel
      </button>
      <button class="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg">
        Delete
      </button>
    </div>
  </div>
</div>
```

---

## 7. Icons

### 7.1 Icon Library

**Primary:** [lucide-react](https://lucide.dev/) v0.454.0+
- Open source, MIT license
- Consistent 24x24 grid, 2px stroke
- Tree-shakeable (only imports what you use)
- First-class React/TypeScript support

**Secondary:** Custom SVG components for domain-specific icons

```bash
npm install lucide-react
```

### 7.2 Usage Pattern

```tsx
// components/icons/index.ts
// Re-export Lucide icons with consistent naming
export {
  Home,
  Layers,
  Box,
  Image,
  BookOpen,
  Beaker,
  Settings,
  User,
  Plus,
  Edit2 as Edit,
  Trash2 as Trash,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Bell,
  Clock,
  Camera,
  Heart,
  MessageCircle,
  Search,
  Filter,
  Download,
  Upload,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Calendar,
  Star,
} from 'lucide-react';

// Custom domain-specific icons
export { RockIcon } from './RockIcon';
export { TumblerIcon } from './TumblerIcon';
export { GritIcon } from './GritIcon';
export { UglyRockIcon } from './UglyRockIcon';
export { BarrelIcon } from './BarrelIcon';
```

```tsx
// Usage in components
import { Home, Settings, RockIcon } from '@/components/icons';

<Home className="w-5 h-5" />
<RockIcon className="w-6 h-6 text-accent" />
```

### 7.3 Common Icons Mapping

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Dashboard | `Home` | Dashboard nav |
| Cycles | `Layers` | Cycle list |
| Tumblers | `Box` | Tumbler management |
| Gallery | `Image` | Photo gallery |
| Learn | `BookOpen` | Specimens/Materials |
| Materials | `Beaker` | Materials list |
| Settings | `Settings` | User settings |
| Profile | `User` | User profile |
| Add | `Plus` | Create actions |
| Edit | `Edit2` | Edit actions |
| Delete | `Trash2` | Delete actions |
| Complete | `Check` | Success/complete |
| Close | `X` | Close/cancel |
| Expand | `ChevronRight` | Breadcrumb/expand |
| Notifications | `Bell` | Alerts |
| Duration | `Clock` | Time/reminders |
| Photo | `Camera` | Upload photo |
| Vote | `Heart` | Ugly Rocks vote |
| Comment | `MessageCircle` | Comments |
| Loading | `Loader2` | Spinner (animate-spin) |
| Warning | `AlertTriangle` | Warnings |
| Error | `XCircle` | Errors |
| Success | `CheckCircle` | Success messages |

### 7.4 Custom Domain Icons

These icons need to be created as custom SVG components:

| Icon | File | Usage | Description |
|------|------|-------|-------------|
| **RockIcon** | `RockIcon.tsx` | Specimens, cycles | Stylized rock shape |
| **TumblerIcon** | `TumblerIcon.tsx` | Tumbler management | Rotary tumbler barrel |
| **GritIcon** | `GritIcon.tsx` | Materials, stages | Grit particles |
| **UglyRockIcon** | `UglyRockIcon.tsx` | Voting button | Rock with character (the mascot) |
| **BarrelIcon** | `BarrelIcon.tsx` | Stage selection | Single barrel |
| **PolishIcon** | `PolishIcon.tsx` | Polish stage | Shiny/sparkle effect |

```tsx
// components/icons/RockIcon.tsx
import { SVGProps } from 'react';

export function RockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Custom rock path - to be designed */}
      <path d="M12 2L4 8l2 12h12l2-12L12 2z" />
      <path d="M8 10l4 2 4-2" />
    </svg>
  );
}
```

### 7.5 Icon Sizing

| Size | Class | Pixels | Usage |
|------|-------|--------|-------|
| **XS** | `w-4 h-4` | 16px | Inline with small text, badges |
| **SM** | `w-5 h-5` | 20px | Buttons, nav items, table cells |
| **MD** | `w-6 h-6` | 24px | Default, cards, headers |
| **LG** | `w-8 h-8` | 32px | Empty states, feature highlights |
| **XL** | `w-12 h-12` | 48px | Hero sections, onboarding |
| **2XL** | `w-16 h-16` | 64px | Large empty states |

### 7.6 Icon Component Wrapper

```tsx
// components/ui/Icon.tsx
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
}

const sizeClasses: Record<IconSize, string> = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
};

export function Icon({ icon: IconComponent, size = 'md', className }: IconProps) {
  return <IconComponent className={cn(sizeClasses[size], className)} />;
}

// Usage
<Icon icon={Home} size="sm" />
<Icon icon={Settings} size="lg" className="text-accent" />
```

### 7.7 Animated Icons

```tsx
// Loading spinner
<Loader2 className="w-5 h-5 animate-spin" />

// Notification bell with pulse
<div className="relative">
  <Bell className="w-5 h-5" />
  <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full animate-pulse" />
</div>

// Success checkmark with scale
<CheckCircle className="w-6 h-6 text-success animate-in zoom-in duration-200" />
```

---

## 8. Motion & Animation

### 8.1 Timing
| Purpose | Duration | Easing |
|---------|----------|--------|
| **Micro** | 100ms | ease-out |
| **Fast** | 150ms | ease-out |
| **Normal** | 200ms | ease-in-out |
| **Slow** | 300ms | ease-in-out |

### 8.2 Common Animations
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scale in (for modals) */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

### 8.3 Tailwind Transitions
```html
<!-- Hover color change -->
<button class="transition-colors duration-150">...</button>

<!-- Shadow on hover -->
<div class="transition-shadow duration-200 hover:shadow-md">...</div>

<!-- Transform -->
<div class="transition-transform duration-200 hover:scale-105">...</div>
```

---

## 9. Accessibility

### 9.1 Requirements
- **WCAG 2.1 AA** compliance target
- Color contrast ratio: minimum 4.5:1 for text
- Focus states visible on all interactive elements
- Screen reader friendly (proper ARIA labels)
- Keyboard navigable

### 9.2 Focus States
```html
<button class="focus:outline-none focus:ring-2 focus:ring-amber-500
               focus:ring-offset-2">
  ...
</button>
```

### 9.3 Color Contrast Check
| Combination | Contrast | Pass? |
|-------------|----------|-------|
| Stone (#1E293B) on White | 12.6:1 | ✅ AAA |
| Slate (#475569) on White | 7.0:1 | ✅ AAA |
| Amber (#F59E0B) on White | 2.4:1 | ❌ (use for accents only) |
| White on Amber (#F59E0B) | 2.4:1 | ❌ (use #78350F text) |
| Amber-900 (#78350F) on Amber-100 | 7.1:1 | ✅ AAA |

### 9.4 Skip Links
```html
<a href="#main-content"
   class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
          bg-amber-500 text-white px-4 py-2 rounded-lg z-50">
  Skip to main content
</a>
```

---

## 10. Theme System

Users can select from multiple pre-defined themes. Each theme defines a cohesive color palette with an accent color and font pairing.

### 10.1 Available Themes

| Theme ID | Name | Accent Color | Description |
|----------|------|--------------|-------------|
| `amber` | **Amber Glow** (Default) | Amber/Gold | Warm, earthy tones inspired by polished agates |
| `teal` | **Ocean Stone** | Teal | Cool, calming palette like tumbled sea glass |
| `terracotta` | **Desert Rock** | Terracotta/Rust | Warm southwestern desert vibes |
| `emerald` | **Forest Jade** | Emerald | Rich, natural green inspired by jade and malachite |
| `slate` | **Mountain Granite** | Indigo | Cool, professional, subtle accent |
| `blue` | **Lapis Lazuli** | Blue | Classic blue inspired by the prized lapis stone |

### 10.2 Theme Definitions

#### Amber Glow (Default)
```javascript
// Primary accent
primary: {
  DEFAULT: '#F59E0B',  // Amber-500
  hover: '#D97706',    // Amber-600
  light: '#FCD34D',    // Amber-300
  dark: '#B45309',     // Amber-700
  foreground: '#78350F', // Amber-900
}
```
| Color Role | Hex | Sample |
|------------|-----|--------|
| Primary | `#F59E0B` | Buttons, links, CTAs |
| Primary Hover | `#D97706` | Hover states |
| Primary Light | `#FCD34D` | Badges, highlights |

#### Ocean Stone
```javascript
primary: {
  DEFAULT: '#14B8A6',  // Teal-500
  hover: '#0D9488',    // Teal-600
  light: '#5EEAD4',    // Teal-300
  dark: '#0F766E',     // Teal-700
  foreground: '#134E4A', // Teal-900
}
```
| Color Role | Hex | Sample |
|------------|-----|--------|
| Primary | `#14B8A6` | Buttons, links, CTAs |
| Primary Hover | `#0D9488` | Hover states |
| Primary Light | `#5EEAD4` | Badges, highlights |

#### Desert Rock
```javascript
primary: {
  DEFAULT: '#EA580C',  // Orange-600
  hover: '#C2410C',    // Orange-700
  light: '#FB923C',    // Orange-400
  dark: '#9A3412',     // Orange-800
  foreground: '#7C2D12', // Orange-900
}
```
| Color Role | Hex | Sample |
|------------|-----|--------|
| Primary | `#EA580C` | Buttons, links, CTAs |
| Primary Hover | `#C2410C` | Hover states |
| Primary Light | `#FB923C` | Badges, highlights |

#### Forest Jade
```javascript
primary: {
  DEFAULT: '#10B981',  // Emerald-500
  hover: '#059669',    // Emerald-600
  light: '#6EE7B7',    // Emerald-300
  dark: '#047857',     // Emerald-700
  foreground: '#064E3B', // Emerald-900
}
```
| Color Role | Hex | Sample |
|------------|-----|--------|
| Primary | `#10B981` | Buttons, links, CTAs |
| Primary Hover | `#059669` | Hover states |
| Primary Light | `#6EE7B7` | Badges, highlights |

#### Mountain Granite
```javascript
primary: {
  DEFAULT: '#6366F1',  // Indigo-500
  hover: '#4F46E5',    // Indigo-600
  light: '#A5B4FC',    // Indigo-300
  dark: '#4338CA',     // Indigo-700
  foreground: '#312E81', // Indigo-900
}
```
| Color Role | Hex | Sample |
|------------|-----|--------|
| Primary | `#6366F1` | Buttons, links, CTAs |
| Primary Hover | `#4F46E5` | Hover states |
| Primary Light | `#A5B4FC` | Badges, highlights |

#### Lapis Lazuli
```javascript
primary: {
  DEFAULT: '#3B82F6',  // Blue-500
  hover: '#2563EB',    // Blue-600
  light: '#93C5FD',    // Blue-300
  dark: '#1D4ED8',     // Blue-700
  foreground: '#1E3A8A', // Blue-900
}
```
| Color Role | Hex | Sample |
|------------|-----|--------|
| Primary | `#3B82F6` | Buttons, links, CTAs |
| Primary Hover | `#2563EB` | Hover states |
| Primary Light | `#93C5FD` | Badges, highlights |

### 10.3 Implementation with CSS Variables

Themes are implemented using CSS custom properties (variables). The active theme sets CSS variables on the `:root` element.

```css
/* globals.css */
:root {
  /* Default theme (Amber Glow) */
  --primary: 245 158 11;        /* #F59E0B */
  --primary-hover: 217 119 6;   /* #D97706 */
  --primary-light: 252 211 77;  /* #FCD34D */
  --primary-dark: 180 83 9;     /* #B45309 */
  --primary-foreground: 120 53 15; /* #78350F */
}

[data-theme="teal"] {
  --primary: 20 184 166;        /* #14B8A6 */
  --primary-hover: 13 148 136;  /* #0D9488 */
  --primary-light: 94 234 212;  /* #5EEAD4 */
  --primary-dark: 15 118 110;   /* #0F766E */
  --primary-foreground: 19 78 74; /* #134E4A */
}

[data-theme="terracotta"] {
  --primary: 234 88 12;         /* #EA580C */
  --primary-hover: 194 65 12;   /* #C2410C */
  --primary-light: 251 146 60;  /* #FB923C */
  --primary-dark: 154 52 18;    /* #9A3412 */
  --primary-foreground: 124 45 18; /* #7C2D12 */
}

[data-theme="emerald"] {
  --primary: 16 185 129;        /* #10B981 */
  --primary-hover: 5 150 105;   /* #059669 */
  --primary-light: 110 231 183; /* #6EE7B7 */
  --primary-dark: 4 120 87;     /* #047857 */
  --primary-foreground: 6 78 59; /* #064E3B */
}

[data-theme="slate"] {
  --primary: 99 102 241;        /* #6366F1 */
  --primary-hover: 79 70 229;   /* #4F46E5 */
  --primary-light: 165 180 252; /* #A5B4FC */
  --primary-dark: 67 56 202;    /* #4338CA */
  --primary-foreground: 49 46 129; /* #312E81 */
}

[data-theme="blue"] {
  --primary: 59 130 246;        /* #3B82F6 */
  --primary-hover: 37 99 235;   /* #2563EB */
  --primary-light: 147 197 253; /* #93C5FD */
  --primary-dark: 29 78 216;    /* #1D4ED8 */
  --primary-foreground: 30 58 138; /* #1E3A8A */
}
```

### 10.4 Tailwind Config for Themes

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          hover: 'rgb(var(--primary-hover) / <alpha-value>)',
          light: 'rgb(var(--primary-light) / <alpha-value>)',
          dark: 'rgb(var(--primary-dark) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        // ... other colors remain the same
      },
    },
  },
}
```

### 10.5 Theme Switching in React

```tsx
// components/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'amber' | 'teal' | 'terracotta' | 'emerald' | 'slate' | 'blue';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('amber');

  useEffect(() => {
    // Load theme from user settings or localStorage
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### 10.6 Theme Selector Component

```tsx
// components/ThemeSelector.tsx
const themes = [
  { id: 'amber', name: 'Amber Glow', color: '#F59E0B' },
  { id: 'teal', name: 'Ocean Stone', color: '#14B8A6' },
  { id: 'terracotta', name: 'Desert Rock', color: '#EA580C' },
  { id: 'emerald', name: 'Forest Jade', color: '#10B981' },
  { id: 'slate', name: 'Mountain Granite', color: '#6366F1' },
  { id: 'blue', name: 'Lapis Lazuli', color: '#3B82F6' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">Theme</label>
      <div className="flex gap-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`w-10 h-10 rounded-full border-2 transition-all ${
              theme === t.id
                ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-400'
                : 'border-transparent hover:border-slate-300'
            }`}
            style={{ backgroundColor: t.color }}
            title={t.name}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 11. UX Patterns

### 11.1 Loading States

Use **skeleton screens** with a subtle shimmer effect instead of spinners. This provides a better user experience by showing the page structure immediately, reducing perceived wait time.

```html
<!-- Skeleton card -->
<div class="animate-pulse">
  <div class="h-48 bg-slate-200 rounded-lg"></div>
  <div class="space-y-3 mt-4">
    <div class="h-4 bg-slate-200 rounded w-3/4"></div>
    <div class="h-4 bg-slate-200 rounded w-1/2"></div>
  </div>
</div>
```

**Shimmer animation (add to globals.css):**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #e2e8f0 25%,
    #f1f5f9 50%,
    #e2e8f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

**When to use spinners:** Only for small inline actions (e.g., button loading state, submitting a form).

### 11.2 Toast Notifications

**Position:**
- **Desktop:** Top-right corner
- **Mobile:** Bottom-center (above bottom nav)

**Behavior:**
- Auto-dismiss after **5 seconds**
- Pause timer on hover
- Stack up to 3 toasts, oldest on top
- Swipe to dismiss on mobile

```html
<!-- Toast structure -->
<div class="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-auto md:top-4 md:right-4 md:left-auto md:translate-x-0
            flex flex-col gap-2 z-50">
  <!-- Success toast -->
  <div class="flex items-center gap-3 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 min-w-[300px]">
    <CheckCircleIcon class="w-5 h-5 text-success flex-shrink-0" />
    <p class="text-sm text-slate-700 flex-1">Cycle saved successfully!</p>
    <button class="text-slate-400 hover:text-slate-600">
      <XIcon class="w-4 h-4" />
    </button>
  </div>
</div>
```

**Toast types:**
| Type | Icon | Border Color |
|------|------|--------------|
| Success | `CheckCircle` | `border-l-4 border-l-success` |
| Error | `XCircle` | `border-l-4 border-l-error` |
| Warning | `AlertTriangle` | `border-l-4 border-l-warning` |
| Info | `Info` | `border-l-4 border-l-info` |

### 11.3 Empty States

Use **simple icon + text** with a primary CTA button. Keep it lightweight for MVP.

```html
<div class="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
    <LayersIcon class="w-8 h-8 text-slate-400" />
  </div>
  <h3 class="text-lg font-semibold text-slate-900 mb-2">No cycles yet</h3>
  <p class="text-slate-500 mb-6 max-w-sm">
    Start tracking your first rock tumbling cycle to see it here.
  </p>
  <Button variant="primary">
    <PlusIcon class="w-4 h-4 mr-2" />
    Start New Cycle
  </Button>
</div>
```

**Empty state messages:**
| Page | Icon | Heading | Subtext |
|------|------|---------|---------|
| Cycles | `Layers` | No cycles yet | Start tracking your first rock tumbling cycle |
| Tumblers | `Box` | No tumblers added | Add your tumbler to get started |
| Photos | `Camera` | No photos yet | Upload before/during/after photos |
| Gallery | `Image` | No posts to show | Check back later or adjust your filters |
| Search | `Search` | No results found | Try different keywords or filters |

### 11.4 Error Pages

Custom 404 and 500 pages with rock-themed messaging to match brand personality.

**404 - Not Found:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🪨  404                                  │
│                                                             │
│           "This rock tumbled away..."                       │
│                                                             │
│   The page you're looking for doesn't exist or was moved.  │
│                                                             │
│              [Go to Dashboard]  [Go Home]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**500 - Server Error:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ⚙️  500                                  │
│                                                             │
│         "Something got stuck in the barrel..."              │
│                                                             │
│     We're working on it. Please try again in a moment.     │
│                                                             │
│                    [Try Again]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.5 Photo Lightbox

Use a lightbox component for viewing photos at full size. Recommended library: `yet-another-react-lightbox`.

**Features:**
- Keyboard navigation (←/→ arrows, Escape to close)
- Swipe gestures on mobile
- Zoom on click/pinch
- Photo counter ("3 of 12")
- Before/During/After label overlay

```html
<!-- Photo grid with lightbox trigger -->
<div class="grid grid-cols-3 gap-2">
  <button
    class="aspect-square rounded-lg overflow-hidden bg-slate-100
           hover:ring-2 hover:ring-primary focus:ring-2 focus:ring-primary"
    onClick={() => openLightbox(index)}
  >
    <img src="..." alt="Before" class="w-full h-full object-cover" />
    <span class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60
                 text-white text-xs rounded">Before</span>
  </button>
</div>
```

### 11.6 Form Validation

Use **inline errors** with **real-time validation after first blur** (touched pattern).

**Validation timing:**
1. Field is pristine → no validation shown
2. User blurs field (touches it) → validate and show error if invalid
3. User types in touched field → revalidate in real-time
4. On submit → validate all fields, focus first error

```html
<!-- Input with error state -->
<div class="space-y-1.5">
  <label class="text-sm font-medium text-slate-700">Email</label>
  <input
    type="email"
    class="w-full px-3 py-2 border rounded-lg
           border-error focus:ring-2 focus:ring-error/20 focus:border-error"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" class="text-sm text-error flex items-center gap-1">
    <AlertCircleIcon class="w-4 h-4" />
    Please enter a valid email address
  </p>
</div>
```

**Validation styles:**
| State | Border | Ring | Message |
|-------|--------|------|---------|
| Default | `border-slate-300` | `ring-primary` | none |
| Error | `border-error` | `ring-error/20` | Red text below |
| Success | `border-success` | `ring-success/20` | Optional checkmark |

**Error message placement:** Directly below the field, not in a summary at top.

---

## 12. Dark Mode (Future)

Reserved for future implementation. Key considerations:
- Invert background colors (dark slate instead of white)
- Adjust accent colors for contrast (each theme would have dark mode variants)
- Photos should remain unaltered
- Respect system preference via `prefers-color-scheme`
- Can be combined with themes: "Amber Glow Dark", "Ocean Stone Dark", etc.

---

## 13. Asset Guidelines

### 13.1 Logo
- Primary: Full logo with text (horizontal)
- Icon: Rock/gem icon only (for favicon, mobile)
- Minimum size: 32px height
- Clear space: 1x logo height on all sides

### 13.2 Photo Thumbnails
- Aspect ratio: 1:1 (square) for grids
- Aspect ratio: 16:9 for hero/featured
- Border radius: `rounded-lg` (8px)
- Placeholder: Light slate background with subtle rock pattern

### 13.3 Empty States
Include friendly illustrations for:
- No cycles yet
- No photos in stage
- No search results
- No posts in gallery

---

## 14. Component Checklist

### MVP Components Needed
- [ ] Header (desktop)
- [ ] Mobile bottom nav
- [ ] Breadcrumbs
- [ ] Button (all variants)
- [ ] Input (text, select, textarea, checkbox)
- [ ] Card (basic, cycle, stage)
- [ ] Badge (status, count)
- [ ] Alert (info, success, warning, error)
- [ ] Modal / Dialog
- [ ] Photo upload / gallery grid
- [ ] Empty state
- [ ] Loading spinner / skeleton
- [ ] Dropdown menu
- [ ] Tabs
- [ ] Tooltip

### MVP+ Components
- [ ] Comment / reply thread
- [ ] Vote button (Ugly Rocks)
- [ ] User avatar
- [ ] Specimen card
- [ ] Material pill/tag
- [ ] Timeline (cycle stages)

---

## 15. Resolved Questions

| Question | Decision |
|----------|----------|
| **Logo design** | Need to create/commission logo artwork (pending) |
| **Illustrations** | Simple icon + text for MVP (see 11.3). Can upgrade to library like undraw.co later |
| **Photo placeholders** | Light slate background (`bg-slate-100`) with no pattern for simplicity |
| **Loading states** | Skeleton screens with shimmer effect (see 11.1) |
| **Toast notifications** | Top-right desktop, bottom-center mobile, 5s auto-dismiss (see 11.2) |
| **Error pages** | Custom 404/500 with rock puns (see 11.4) |
| **Photo viewing** | Lightbox with keyboard/swipe nav (see 11.5) |
| **Form validation** | Inline errors, real-time after blur (see 11.6) |

---

## 16. Next Steps

1. Set up Tailwind config with custom colors
2. Install and configure shadcn/ui
3. Build core components
4. Proceed to wireframes for individual pages
