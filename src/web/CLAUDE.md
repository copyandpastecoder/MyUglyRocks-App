# Coding Standards for MyUglyRocks Frontend

## Theme and Colors

### CRITICAL: No Hardcoded Tailwind Colors

**NEVER** use hardcoded color classes like:
- `bg-gray-*`, `text-gray-*`, `border-gray-*`
- `bg-white`, `text-white`, `bg-black`, `text-black`
- `bg-slate-*`, `bg-zinc-*`, `bg-neutral-*`, `bg-stone-*`
- `hover:bg-gray-*`, `dark:bg-gray-*`

**ALWAYS** use theme CSS variables instead:

| Instead of | Use |
|------------|-----|
| `bg-white`, `bg-gray-50` | `bg-background` |
| `bg-gray-100`, `bg-gray-200` | `bg-muted` |
| `bg-gray-800`, `bg-gray-900` | `bg-card` or `bg-sidebar` |
| `text-white` | `text-foreground` or `text-sidebar-foreground` |
| `text-gray-400`, `text-gray-500` | `text-muted-foreground` |
| `text-gray-900`, `text-black` | `text-foreground` |
| `border-gray-*` | `border-border` |
| `hover:bg-gray-50`, `hover:bg-gray-100` | `hover:bg-muted` |
| `hover:bg-gray-800` | `hover:bg-sidebar-accent` or `hover:bg-accent` |

### Available Theme Variables

From `globals.css`, these CSS variables are available as Tailwind classes:

**Backgrounds:**
- `bg-background` - Main page background
- `bg-card` - Card/panel backgrounds
- `bg-popover` - Popover/dropdown backgrounds
- `bg-muted` - Muted/subtle backgrounds
- `bg-accent` - Accent backgrounds (hover states)
- `bg-sidebar` - Sidebar background
- `bg-sidebar-accent` - Sidebar hover/active states

**Text:**
- `text-foreground` - Primary text
- `text-card-foreground` - Text on cards
- `text-muted-foreground` - Secondary/muted text
- `text-accent-foreground` - Text on accent backgrounds
- `text-sidebar-foreground` - Sidebar text

**Borders:**
- `border-border` - Standard borders
- `border-input` - Input field borders

**Colors with intent:**
- `text-primary`, `bg-primary` - Brand/action color
- `text-destructive`, `bg-destructive` - Error/danger states

### Exceptions: Semantic Status Colors

These hardcoded colors ARE acceptable for semantic status indicators:
- `text-green-*`, `bg-green-*` - Success, easy difficulty
- `text-yellow-*`, `bg-yellow-*` - Warning, medium difficulty
- `text-orange-*`, `bg-orange-*` - Caution, hard difficulty
- `text-red-*`, `bg-red-*` - Error, danger, expert difficulty
- `text-blue-*`, `bg-blue-*` - Info, primary actions

These communicate meaning through color and should remain consistent regardless of theme.

## Component Guidelines

### Use shadcn/ui Components

Always prefer shadcn/ui components over custom implementations:
- `Button`, `Card`, `Input`, `Select`, `Dialog`, etc.
- These automatically use theme variables

### Form Handling

Use `react-hook-form` with `zod` for validation.

### Data Fetching

Use `@tanstack/react-query` hooks in `src/hooks/`.
