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

### Select Components with Async Values

**IMPORTANT:** Radix UI Select (shadcn/ui) has a known issue where it doesn't properly display values that are set asynchronously after the component mounts.

**The Problem:**
When a Select's `value` prop changes after initial render (e.g., from API data loading), the displayed value may not update even though the internal value is correct.

**The Fix:**
Add `key={value}` to force React to remount the Select when the value changes:

```tsx
// BAD - value may not display after async load
<Select value={field.value} onValueChange={field.onChange}>

// GOOD - forces remount when value changes
<Select value={field.value} onValueChange={field.onChange} key={field.value}>
```

**When to apply this fix:**
- Form fields populated from API data (edit pages)
- Selects where value is set from async state
- Any Select that shows a placeholder when it should show a value

**When NOT needed:**
- Filter dropdowns with local state and default values
- Selects where value is set synchronously before mount

**Future improvement:** Create a `FormSelect` wrapper component that includes `key={value}` automatically. See existing Selects with this fix in:
- `tumblers/[id]/page.tsx`
- `tumblers/new/page.tsx`

## ESLint and React Compiler Rules

### Unescaped Entities in JSX

**ALWAYS** escape quotes and apostrophes in JSX text content:

```tsx
// BAD - ESLint error
<p>"Hello, I'm here"</p>

// GOOD - Use HTML entities
<p>&quot;Hello, I&apos;m here&quot;</p>
```

This applies to:
- Apostrophes in contractions: `don't` → `don&apos;t`
- Possessives: `tumblers'` → `tumblers&apos;`
- Quotation marks: `"text"` → `&quot;text&quot;`

**Note:** This only applies to JSX text content, not to string literals in props or JavaScript code.

### setState in useEffect (React Compiler)

The React Compiler flags `setState` calls inside `useEffect` as errors. For legitimate use cases, add an eslint-disable comment:

```tsx
// One-time initialization from async data
useEffect(() => {
  if (!hasInitialized.current && data) {
    hasInitialized.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time initialization
    setState(data.value);
  }
}, [data]);

// Resetting state when props change
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting on prop change
  setIsLoaded(false);
}, [src]);
```

**Legitimate use cases:**
- One-time initialization from async data (use a ref to track)
- Resetting state when a key prop changes (e.g., modal opening)
- Syncing state from external values
- Initializing from localStorage/settings

### Don't Define Components Inside Render

**NEVER** define components inside other components - the React Compiler flags this:

```tsx
// BAD - creates new component on every render
function Parent() {
  const ChildComponent = ({ value }) => <div>{value}</div>;
  return <ChildComponent value="test" />;
}

// GOOD - define outside or at module level
function ChildComponent({ value }) {
  return <div>{value}</div>;
}

function Parent() {
  return <ChildComponent value="test" />;
}
```

### Variable Declaration Order

With `const` arrow functions, define functions **before** they are called:

```tsx
// BAD - ESLint error: Cannot access before declaration
useEffect(() => {
  doSomething();
}, []);

const doSomething = async () => { /* ... */ };

// GOOD - define first, then use
const doSomething = async () => { /* ... */ };

useEffect(() => {
  doSomething();
}, []);
```

### CommonJS Scripts

Node.js utility scripts that use `require()` should use the `.cjs` extension:

```bash
# BAD - ESLint error for require() in .js files
scripts/lint-colors.js

# GOOD - .cjs indicates CommonJS module
scripts/lint-colors.cjs
```

The `.cjs` extension is excluded from ESLint in `eslint.config.mjs`.

### zodResolver Type Assertion

The `zodResolver` function has known type inference limitations with `react-hook-form`. Use an eslint-disable comment:

```tsx
const form = useForm<FormValues>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type inference limitation
  resolver: zodResolver(formSchema) as any,
  defaultValues: { /* ... */ },
});
```
