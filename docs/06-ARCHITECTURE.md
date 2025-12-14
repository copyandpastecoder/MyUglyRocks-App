# MyUglyRocks - System Architecture

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [04-DATA-MODEL.md](04-DATA-MODEL.md), [05-API-SPEC.md](05-API-SPEC.md) |

---

## 1. Overview

### 1.1 Architecture Style
- **Pattern:** Monolithic application (modular monolith)
- **API Style:** RESTful JSON API
- **Frontend:** Server-side rendered with client hydration (Next.js App Router)
- **Rationale:** Monolith is simpler to deploy, debug, and maintain for a small team. Can be decomposed later if needed.

### 1.2 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │   Browser    │  │   Mobile     │  │   Future     │                       │
│  │   (Next.js)  │  │   Browser    │  │   Mobile App │                       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                       │
└─────────┼─────────────────┼─────────────────┼───────────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDGE / CDN                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Cloudflare                                      │    │
│  │   • CDN for static assets                                           │    │
│  │   • DDoS protection                                                 │    │
│  │   • SSL termination                                                 │    │
│  │   • Edge caching                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                    │
│                                                                             │
│  ┌────────────────────────────┐    ┌────────────────────────────┐          │
│  │      FRONTEND (Railway)    │    │      BACKEND (Railway)     │          │
│  │  ┌──────────────────────┐  │    │  ┌──────────────────────┐  │          │
│  │  │     Next.js 14+      │  │    │  │   ASP.NET Core 8     │  │          │
│  │  │   (App Router, RSC)  │  │────│  │   (Web API)          │  │          │
│  │  └──────────────────────┘  │    │  └──────────────────────┘  │          │
│  │  • React Server Components │    │  • RESTful API             │          │
│  │  • TypeScript              │    │  • JWT Authentication      │          │
│  │  • Tailwind CSS            │    │  • Entity Framework Core   │          │
│  │  • shadcn/ui               │    │  • FluentValidation        │          │
│  └────────────────────────────┘    └────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                    │
          │                                    ▼
          │         ┌─────────────────────────────────────────────────────────┐
          │         │                    DATA LAYER                            │
          │         │                                                         │
          │         │  ┌─────────────────┐  ┌─────────────────┐              │
          │         │  │   PostgreSQL    │  │     Redis       │              │
          │         │  │   (Railway)     │  │   (Upstash)     │              │
          │         │  │                 │  │                 │              │
          │         │  │  • Primary DB   │  │  • Session cache│              │
          │         │  │  • Full-text    │  │  • Rate limiting│              │
          │         │  │    search       │  │  • Job queues   │              │
          │         │  └─────────────────┘  └─────────────────┘              │
          │         └─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │ Cloudflare R2 │  │    Resend     │  │   Sightengine │                   │
│  │               │  │               │  │   (Optional)  │                   │
│  │ • Photo       │  │ • Transac-    │  │               │                   │
│  │   storage     │  │   tional      │  │ • NSFW        │                   │
│  │ • CDN-backed  │  │   emails      │  │   detection   │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Development Philosophy

These guiding principles apply to **all code** across frontend and backend:

| Principle | Description |
|-----------|-------------|
| **Industry Standards First** | Always prefer industry standards and established patterns over "simpler" or custom approaches. Standard solutions have been battle-tested and are easier for new team members to understand. |
| **Scalability & Maintainability** | Prioritize scalability and maintainability over short-term convenience. The initial setup may take longer, but it pays dividends as the application grows. |
| **Proper Separation of Concerns** | Choose proper separation of concerns even if it requires more initial setup. Mixing responsibilities creates technical debt that compounds over time. |
| **Long-Term Thinking** | Always ask: "What's the correct way that scales as the app grows?" Don't optimize for today's simplicity at the expense of tomorrow's complexity. |
| **Clarity Over Cleverness** | Code should be obvious, not clever. If a solution requires extensive comments to explain, it's probably too clever. Prefer readable, explicit code that any developer can understand quickly. |
| **Avoid Premature Abstraction** | Duplicate code until patterns emerge naturally. Only abstract when you've seen the same pattern 3+ times and understand all the use cases. Wrong abstractions are worse than duplication. |
| **No Dead Code** | Never generate unused variables, unused imports, or commented-out code. If it's not used, delete it. Version control is your backup. |
| **Strict Type Safety** | Maintain strict TypeScript settings (`strict: true`, `noImplicitAny: true`). Never use `any` type unless absolutely unavoidable, and document why. |
| **Convention Adherence** | Follow project folder conventions and naming patterns automatically. Consistency across the codebase reduces cognitive load and prevents "where does this go?" debates. |

#### Practical Application

```
❌ AVOID                                    ✅ PREFER
─────────────────────────────────────────────────────────────────────────────
"Let's just put it here for now"     →     "Where does this belong long-term?"
"We can refactor this later"         →     "Let's do it right the first time"
"This is simpler/faster"             →     "What's the industry standard?"
"I'll create a clever helper"        →     "Is this pattern established?"
"// TODO: fix this later"            →     Fix it now or create an issue
Custom auth implementation           →     Industry-standard JWT + OAuth
Inline SQL strings                   →     Repository pattern + EF Core
any type for quick fix               →     Proper type definition
```

---

## 2. Technology Stack

### 2.1 Frontend

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| Framework | Next.js | 14+ | App Router, React Server Components |
| Language | TypeScript | 5.x | Strict mode enabled |
| Styling | Tailwind CSS | 3.x | With custom theme config |
| Components | shadcn/ui | Latest | Radix-based, customizable |
| Forms | React Hook Form | 7.x | With Zod validation |
| State | React Query (TanStack) | 5.x | Server state management |
| Icons | Lucide React | Latest | Consistent icon set |
| Date/Time | date-fns | 3.x | Lightweight date handling |
| Photo Lightbox | yet-another-react-lightbox | Latest | Gallery viewing |
| Toasts | Sonner | Latest | Toast notifications |

### 2.2 Backend

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| Framework | ASP.NET Core | 8.x | Minimal APIs or Controllers |
| Language | C# | 12 | With nullable reference types |
| ORM | Entity Framework Core | 8.x | Code-first migrations |
| Validation | FluentValidation | 11.x | Request validation |
| Auth | ASP.NET Identity + JWT | - | Cookie-based JWT |
| Background Jobs | Hangfire | 1.8.x | Email, reminders, cleanup |
| Logging | Serilog | 3.x | Structured logging |
| API Docs | Scalar (OpenAPI) | Latest | Interactive API documentation |

### 2.3 Database

| Category | Technology | Notes |
|----------|------------|-------|
| Primary DB | PostgreSQL 16 | Hosted on Railway |
| Caching | Redis (Upstash) | Serverless Redis |
| Search | PostgreSQL Full-Text | Built-in, no extra service |

### 2.4 Infrastructure

| Category | Technology | Notes |
|----------|------------|-------|
| Frontend Hosting | Railway | Single platform, Next.js support (Vercel as backup) |
| Backend Hosting | Railway | Easy .NET deployment |
| Database Hosting | Railway | Managed PostgreSQL |
| File Storage | Cloudflare R2 | S3-compatible, no egress fees |
| CDN | Cloudflare | Free tier sufficient |
| Email | Resend | Developer-friendly, good deliverability |
| Monitoring | Railway Logs + Sentry | Error tracking |
| DNS | Cloudflare | DNS management |

---

## 3. Frontend Architecture

### 3.1 Project Structure

The frontend uses a **hybrid organization pattern**: shared components live in a global `components/` folder, while complex features can co-locate their own components, hooks, and utilities inside the route folder.

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/[token]/
│   ├── (public)/                 # Public pages route group
│   │   ├── page.tsx              # Landing page (/)
│   │   ├── gallery/
│   │   ├── specimens/
│   │   ├── materials/
│   │   └── faq/
│   ├── (protected)/              # Auth-required route group
│   │   ├── layout.tsx            # Auth check wrapper
│   │   ├── dashboard/
│   │   ├── cycles/               # Complex feature - see 3.1.1
│   │   │   ├── page.tsx
│   │   │   ├── [cycleId]/
│   │   │   ├── components/       # Feature-specific components
│   │   │   ├── hooks/            # Feature-specific hooks
│   │   │   └── utils/            # Feature-specific utils
│   │   ├── stages/
│   │   ├── tumblers/
│   │   └── settings/
│   ├── (admin)/                  # Admin route group
│   │   ├── layout.tsx            # Admin role check
│   │   └── admin/
│   ├── user/[username]/          # Public profiles
│   ├── api/                      # API routes (if needed)
│   ├── layout.tsx                # Root layout
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # 404 page
│   ├── globals.css               # Global styles + theme vars
│   └── providers.tsx             # React Query + Theme providers
│
├── components/                   # SHARED UI components only
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── icons/                    # Custom SVG icon components
│   ├── layout/                   # Layout components
│   │   ├── header.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── footer.tsx
│   │   └── breadcrumbs.tsx
│   └── shared/                   # Reusable domain components
│       ├── loading-skeleton.tsx
│       ├── empty-state.tsx
│       ├── error-fallback.tsx
│       ├── page-header.tsx
│       └── ...
│
├── lib/                          # Core utilities
│   ├── api/                      # Centralized API clients (see note below)
│   │   ├── client.ts             # Axios/fetch wrapper with auth
│   │   ├── cycles.ts             # Cycle API calls
│   │   ├── stages.ts
│   │   ├── photos.ts
│   │   └── ...
│   ├── hooks/                    # Shared custom hooks
│   │   ├── use-auth.ts
│   │   └── ...
│   ├── utils/                    # Utility functions
│   │   ├── dates.ts
│   │   ├── format.ts
│   │   └── cn.ts                 # classnames helper
│   ├── query-keys.ts             # React Query key factories
│   └── types.ts                  # Shared TypeScript types
│
│   # NOTE: API integration is centralized in lib/api/ (not per-feature)
│   # This provides:
│   # - Shared axios config with withCredentials: true
│   # - Consistent error handling across all API calls
│   # - Single source of truth for API endpoints
│   # - Easy to update base URL or interceptors globally
│
├── shared/                       # Shared resources
│   └── schemas/                  # Zod validation schemas
│       ├── cycle.ts
│       ├── stage.ts
│       ├── user.ts
│       └── ...
│
├── providers/
│   ├── auth-provider.tsx         # Auth context
│   ├── theme-provider.tsx        # Theme context
│   ├── query-provider.tsx        # React Query
│   └── toast-provider.tsx        # Toast notifications
│
├── types/                        # Global type definitions
│   ├── api.ts                    # API response types
│   ├── cycle.ts                  # Domain types
│   ├── user.ts
│   └── ...
│
└── config/
    ├── site.ts                   # Site metadata
    └── navigation.ts             # Nav structure
```

### 3.1.1 Feature-Level Structure (Co-location)

For **complex features** with multiple components and business logic, co-locate files inside the route folder:

```
app/(protected)/cycles/
├── page.tsx                      # Main route (50-150 lines max)
│                                 # - Minimal logic, mostly composition
│                                 # - Imports and assembles child components
│
├── [cycleId]/
│   ├── page.tsx                  # Cycle detail page
│   └── edit/
│       └── page.tsx              # Edit cycle page
│
├── components/                   # Feature-specific UI
│   ├── CycleList.tsx            # Display list of cycles
│   ├── CycleCard.tsx            # Individual cycle card
│   ├── CycleForm.tsx            # Add/edit form
│   ├── CycleTimeline.tsx        # Stage timeline view
│   └── CycleFilters.tsx         # Filter controls
│
├── hooks/                        # Feature-specific hooks
│   ├── useCycles.ts             # CRUD operations + React Query
│   ├── useCycleForm.ts          # Form state management
│   └── useCycleFilters.ts       # Filter state
│
├── utils/                        # Feature-specific utilities
│   ├── calculations.ts          # Duration, progress calculations
│   └── formatting.ts            # Display formatting
│
└── types/                        # Feature-specific types (if needed)
    └── index.ts
```

**When to co-locate vs. use shared folders:**
- **Co-locate** when: Component/hook is only used in this feature
- **Use shared** when: Component/hook is used across 2+ features

### 3.1.2 File Size Guidelines

| File Type | Target Lines | Max Lines | Notes |
|-----------|--------------|-----------|-------|
| Page components | 50-150 | 200 | Mostly imports and JSX composition |
| UI components | 50-200 | 300 | Single responsibility |
| Hooks | 50-150 | 200 | One primary purpose |
| Utils | 20-100 | 150 | Pure functions, easily testable |
| Types | - | - | Group related interfaces together |

**If a file exceeds max lines, split it into smaller files.**

### 3.2 Data Fetching Strategy

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| Server Components | Initial page data | `fetch()` in RSC with caching |
| React Query | Interactive data | `useQuery` for mutations, refetching |
| Route Handlers | BFF patterns | Next.js API routes if needed |

**Example: Cycle List Page**
```tsx
// app/(protected)/cycles/page.tsx
import { getCycles } from '@/lib/api/cycles';
import { CyclesList } from './components/CycleList';

export default async function CyclesPage({
  searchParams,
}: {
  searchParams: { status?: string; sort?: string };
}) {
  // Server Component - fetch on server
  const cycles = await getCycles({
    status: searchParams.status,
    sort: searchParams.sort,
  });

  return <CyclesList initialData={cycles} />;
}
```

### 3.3 Query Keys Factory

Use a centralized query keys factory for consistent cache management with React Query:

```typescript
// lib/query-keys.ts
export const cycleKeys = {
  all: ['cycles'] as const,
  lists: () => [...cycleKeys.all, 'list'] as const,
  list: (filters: { status?: string; sort?: string }) =>
    [...cycleKeys.lists(), filters] as const,
  details: () => [...cycleKeys.all, 'detail'] as const,
  detail: (id: string) => [...cycleKeys.details(), id] as const,
};

export const stageKeys = {
  all: ['stages'] as const,
  byCycle: (cycleId: string) => [...stageKeys.all, 'cycle', cycleId] as const,
  detail: (id: string) => [...stageKeys.all, 'detail', id] as const,
};

export const tumblerKeys = {
  all: ['tumblers'] as const,
  list: () => [...tumblerKeys.all, 'list'] as const,
  detail: (id: string) => [...tumblerKeys.all, 'detail', id] as const,
};

export const specimenKeys = {
  all: ['specimens'] as const,
  list: (filters?: { search?: string; materialType?: string }) =>
    [...specimenKeys.all, 'list', filters] as const,
  detail: (id: string) => [...specimenKeys.all, 'detail', id] as const,
};

export const materialKeys = {
  all: ['materials'] as const,
  list: (filters?: { category?: string }) =>
    [...materialKeys.all, 'list', filters] as const,
  detail: (id: string) => [...materialKeys.all, 'detail', id] as const,
};

export const galleryKeys = {
  all: ['posts'] as const,
  list: (filters?: { sort?: string }) =>
    [...galleryKeys.all, 'list', filters] as const,
  detail: (id: string) => [...galleryKeys.all, 'detail', id] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
};

export const activityKeys = {
  all: ['activity'] as const,
  list: (page?: number) => [...activityKeys.all, 'list', page] as const,
};
```

**Usage in hooks:**
```typescript
// app/(protected)/cycles/hooks/useCycles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleKeys } from '@/lib/query-keys';
import { getCycles, createCycle, deleteCycle } from '@/lib/api/cycles';

export function useCycles(filters: { status?: string; sort?: string }) {
  return useQuery({
    queryKey: cycleKeys.list(filters),
    queryFn: () => getCycles(filters),
  });
}

export function useCreateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCycle,
    onSuccess: () => {
      // Invalidate all cycle lists to refetch
      queryClient.invalidateQueries({ queryKey: cycleKeys.lists() });
    },
  });
}

export function useDeleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.lists() });
    },
  });
}
```

### 3.4 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND AUTH FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN
   User submits credentials
         │
         ▼
   POST /api/v1/auth/login
         │
         ▼
   Backend validates, returns user data
   Sets httpOnly cookies: access_token, refresh_token
         │
         ▼
   Frontend stores user in AuthContext
   Redirects to /dashboard

2. PROTECTED PAGE ACCESS
   User navigates to /cycles
         │
         ▼
   Middleware checks for access_token cookie
         │
         ├─── Token present ──▶ Allow access
         │
         └─── No token ──▶ Redirect to /login?redirect=/cycles

3. API REQUEST
   Frontend makes API call (cookies auto-included)
         │
         ▼
   Backend validates JWT from cookie
         │
         ├─── Valid ──▶ Process request
         │
         ├─── Expired ──▶ Return 401
         │         │
         │         ▼
         │    Frontend calls POST /auth/refresh
         │         │
         │         ├─── Success ──▶ Retry original request
         │         │
         │         └─── Failure ──▶ Redirect to login
         │
         └─── Invalid ──▶ Return 401, redirect to login

4. LOGOUT
   User clicks logout
         │
         ▼
   POST /api/v1/auth/logout
         │
         ▼
   Backend clears cookies, revokes refresh token
         │
         ▼
   Frontend clears AuthContext
   Redirects to /
```

### 3.5 State Management

| State Type | Solution | Example |
|------------|----------|---------|
| Server State | React Query | Cycles, stages, posts |
| Auth State | React Context | Current user, login status |
| UI State | React useState | Modals, form state |
| URL State | Next.js searchParams | Filters, pagination |
| Theme | React Context + CSS vars | Theme preference |

### 3.6 Key Principles

#### Separation of Concerns
- **UI Components**: Only render JSX and handle user interactions
- **Hooks**: Manage state, side effects, and business logic
- **Utils**: Pure functions with no side effects or React dependencies
- **Types**: Shared type definitions used across the feature

#### Single Responsibility
- Each file should have one clear purpose
- Components should do one thing well
- Functions should be small and focused

#### Reusability
- Components can be reused in other features
- Hooks can be shared across components
- Utils are pure and easily testable

#### React Performance Rules

| Rule | Rationale |
|------|-----------|
| **Avoid unnecessary `useEffect`** | Most effects can be replaced with event handlers, derived state, or server-side logic. Effects are for synchronizing with external systems, not for state updates |
| **Compute derived values in render** | Instead of storing computed values in state, calculate them directly from existing state/props. React re-renders are cheap |
| **Only memoize when profiling suggests** | `useMemo`, `useCallback`, and `React.memo` add complexity. Profile first, then optimize only proven bottlenecks |
| **httpOnly cookies for auth tokens** | Never store tokens in localStorage or non-httpOnly cookies. This prevents XSS attacks from stealing credentials |

**Examples:**
```tsx
// ❌ AVOID: useEffect for derived state
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ PREFER: Compute in render
const fullName = `${firstName} ${lastName}`;
```

```tsx
// ❌ AVOID: useEffect to respond to user action
useEffect(() => {
  if (submitted) {
    submitForm(data);
  }
}, [submitted]);

// ✅ PREFER: Handle in event handler
const handleSubmit = () => {
  submitForm(data);
};
```

### 3.7 Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| **God Components** | 500+ line components doing everything | Split into smaller components, extract hooks |
| **Prop Drilling** | Passing props through 5+ levels | Use React Context or component composition |
| **Mixed Concerns** | API calls inside UI components | Move to custom hooks, keep components presentational |
| **Duplicate Logic** | Same calculation in multiple places | Extract to utils or custom hooks |
| **No TypeScript** | Missing type definitions | Add interfaces for all props and data |
| **Inline Everything** | Complex logic inside JSX | Extract to functions, use early returns |
| **No Separation** | All code in one file | Follow feature-level structure (3.1.1) |

### 3.8 Next.js Specific Patterns

- Use `'use client'` directive **only** in components that need client-side interactivity
- Keep Server Components when possible for better performance
- Leverage Next.js caching and revalidation features
- Use `loading.tsx` for route-level loading states
- Use `error.tsx` for route-level error boundaries

### 3.9 Error Handling Strategy

#### Error Boundary Hierarchy

| Level | File | Catches | Recovery |
|-------|------|---------|----------|
| **Root** | `app/error.tsx` | Unhandled errors across the app | "Something went wrong" + retry button |
| **Route Group** | `app/(protected)/error.tsx` | Errors in protected routes | Redirect to login if auth error |
| **Feature** | `app/(protected)/cycles/error.tsx` | Feature-specific errors | Feature-specific recovery UI |
| **Component** | React Error Boundary wrapper | Individual component crashes | Fallback UI, don't break whole page |

#### API Error Handling

```typescript
// lib/api/client.ts
import { toast } from 'sonner';

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();

    // Handle specific error codes
    if (response.status === 401) {
      // Trigger token refresh or redirect to login
      window.location.href = '/login';
    }

    throw new ApiError(
      response.status,
      error.error?.code ?? 'UNKNOWN_ERROR',
      error.error?.message ?? 'An error occurred',
      error.error?.details
    );
  }

  return response.json();
}
```

#### React Query Error Handling

```typescript
// providers/query-provider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof ApiError && error.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handler
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error('An unexpected error occurred');
        }
      },
    },
  },
});
```

### 3.10 Optimistic Updates

Use optimistic updates for actions where immediate feedback improves UX:

| Action | Use Optimistic? | Rationale |
|--------|-----------------|-----------|
| Like/vote on post | Yes | Instant feedback, easy rollback |
| Add comment | Yes | Shows immediately, can mark as "sending" |
| Delete item | Yes | Remove from UI, restore on failure |
| Create cycle | No | Need server-generated ID for navigation |
| Upload photo | No | Need to wait for upload completion |
| Edit profile | No | Validation may fail server-side |

**Example: Optimistic Vote**
```typescript
// hooks/useVote.ts
export function useVote(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => voteForPost(postId),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: galleryKeys.detail(postId) });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData(galleryKeys.detail(postId));

      // Optimistically update
      queryClient.setQueryData(galleryKeys.detail(postId), (old: Post) => ({
        ...old,
        uglyRocksCount: old.uglyRocksCount + 1,
        hasVoted: true,
      }));

      return { previousPost };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(galleryKeys.detail(postId), context?.previousPost);
      toast.error('Failed to vote. Please try again.');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: galleryKeys.detail(postId) });
    },
  });
}
```

### 3.11 Suspense & Loading Strategy

#### Suspense Boundary Placement

| Location | Implementation | Shows |
|----------|----------------|-------|
| **Route level** | `loading.tsx` | Full page skeleton |
| **Layout level** | `<Suspense>` in layout | Shared loading for child routes |
| **Component level** | `<Suspense>` wrapper | Component-specific skeleton |
| **Data fetching** | React Query `isLoading` | Inline loading states |

**Guidelines:**
- Use `loading.tsx` for initial page loads (shows skeleton immediately)
- Use component-level `<Suspense>` for lazy-loaded components
- Use React Query's `isLoading` for data that refreshes after initial load
- Never show a blank screen - always have a loading state

```tsx
// Route-level loading (app/(protected)/cycles/loading.tsx)
export default function CyclesLoading() {
  return <CycleListSkeleton />;
}

// Component-level suspense
<Suspense fallback={<StageTimelineSkeleton />}>
  <StageTimeline cycleId={cycleId} />
</Suspense>
```

### 3.12 Image Optimization

All images use Next.js `<Image>` component for automatic optimization:

| Rule | Implementation |
|------|----------------|
| **Always use `<Image>`** | Never use `<img>` tags directly |
| **Specify dimensions** | Always provide `width` and `height` or use `fill` |
| **Priority loading** | Add `priority` to above-the-fold images (hero, first gallery row) |
| **Blur placeholder** | Use `placeholder="blur"` with `blurDataURL` for photos |
| **Sizes attribute** | Specify `sizes` for responsive images to prevent oversized downloads |

**Photo Display Patterns:**
```tsx
// Gallery grid image
<Image
  src={photo.url}
  alt={photo.caption || 'Tumbled rock photo'}
  width={400}
  height={400}
  className="object-cover"
  sizes="(max-width: 768px) 33vw, 25vw"
  placeholder="blur"
  blurDataURL={photo.blurHash}
/>

// Hero/featured image
<Image
  src={post.featuredPhoto.url}
  alt={post.title}
  fill
  className="object-cover"
  priority
  sizes="100vw"
/>

// User avatar
<Image
  src={user.avatarUrl || '/default-avatar.png'}
  alt={user.displayName}
  width={40}
  height={40}
  className="rounded-full"
/>
```

**Cloudflare R2 Integration:**
- Images served via Cloudflare CDN for edge caching
- Generate blur hashes on upload (server-side)
- Store multiple sizes: thumbnail (200px), medium (800px), full (2000px)

### 3.13 Form Patterns

#### Submission States

All forms must handle these states:

| State | UI | Button |
|-------|-----|--------|
| **Idle** | Normal form | "Save" / "Submit" |
| **Submitting** | Form disabled | Spinner + "Saving..." |
| **Success** | Toast notification | Reset or navigate away |
| **Error** | Inline field errors | Re-enable form |

**Implementation with react-hook-form:**
```tsx
const { handleSubmit, formState: { isSubmitting } } = useForm();

<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Spinner className="w-4 h-4 mr-2" />
      Saving...
    </>
  ) : (
    'Save Changes'
  )}
</Button>
```

#### Double-Submit Prevention
- Disable submit button during submission
- Use React Query mutation's `isPending` state
- Debounce rapid clicks (300ms)

### 3.14 Keyboard & Focus Management

| Scenario | Behavior |
|----------|----------|
| **Modal opens** | Focus trapped inside modal, first focusable element receives focus |
| **Modal closes** | Return focus to trigger element |
| **Form submission error** | Focus moves to first field with error |
| **Toast appears** | Does NOT steal focus (announcer for screen readers) |
| **Dropdown opens** | Focus moves to first menu item |
| **Page navigation** | Focus moves to main content (skip link target) |

**Implementation:**
```tsx
// Use Radix UI primitives (via shadcn/ui) - focus management built-in
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

// For custom focus management
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';
```

### 3.15 Environment Variables

#### Naming Convention

| Prefix | Access | Example |
|--------|--------|---------|
| `NEXT_PUBLIC_` | Client + Server | `NEXT_PUBLIC_API_URL` |
| No prefix | Server only | `DATABASE_URL`, `JWT_SECRET` |

#### Required Variables

```env
# .env.example

# Public (exposed to browser)
# Empty = use relative URLs through ingress (recommended for K8s)
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=https://images.myuglyrocks.com

# Server-only (never exposed to client)
# These would be in the backend, not frontend
```

**Security Rules:**
- Never prefix secrets with `NEXT_PUBLIC_`
- API keys for external services stay server-side
- Use Next.js API routes or server actions if client needs to call external APIs

### 3.16 Performance Patterns

#### Debounce & Throttle

| Use Case | Pattern | Delay |
|----------|---------|-------|
| Search input | Debounce | 300ms |
| Filter changes | Debounce | 150ms |
| Window resize | Throttle | 100ms |
| Scroll handlers | Throttle | 16ms (60fps) |
| Auto-save | Debounce | 1000ms |

```typescript
// lib/hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in search
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

#### Infinite Scroll vs Pagination

| Page | Pattern | Rationale |
|------|---------|-----------|
| Gallery feed | Infinite scroll | Discovery/browsing experience |
| Cycles list | Pagination | Manageable data, need to find specific items |
| Activity feed | Infinite scroll | Chronological stream |
| Search results | Pagination | Need to jump to specific pages |
| Admin tables | Pagination | Data management, precise navigation |
| Comments | Load more button | User controls when to load more |

#### Prefetching Strategy

```tsx
// Hover prefetch for navigation
import Link from 'next/link';

// Next.js automatically prefetches <Link> on hover (default behavior)
<Link href={`/cycles/${cycle.id}`}>View Cycle</Link>

// React Query prefetch for data
const queryClient = useQueryClient();

const prefetchCycle = (cycleId: string) => {
  queryClient.prefetchQuery({
    queryKey: cycleKeys.detail(cycleId),
    queryFn: () => getCycle(cycleId),
    staleTime: 60 * 1000, // Consider fresh for 1 minute
  });
};

<CycleCard
  onMouseEnter={() => prefetchCycle(cycle.id)}
  ...
/>
```

---

## 4. Backend Architecture

### 4.0 Design Principles

The backend follows **SOLID principles** and **DRY (Don't Repeat Yourself)** patterns:

#### SOLID Principles

| Principle | Application |
|-----------|-------------|
| **S - Single Responsibility** | Each class has one reason to change. Controllers only handle HTTP; services contain business logic; repositories handle data access |
| **O - Open/Closed** | Classes are open for extension, closed for modification. Use interfaces and inheritance for extensibility |
| **L - Liskov Substitution** | Subtypes must be substitutable for their base types. Interface implementations must honor contracts |
| **I - Interface Segregation** | Many specific interfaces are better than one general-purpose interface. `ICycleRepository` not `IRepository<T>` for complex operations |
| **D - Dependency Inversion** | Depend on abstractions, not concretions. All services receive interfaces via constructor injection |

#### DRY (Don't Repeat Yourself)

- Extract shared logic into base classes or extension methods
- Use generic repositories for common CRUD operations
- Centralize validation rules in FluentValidation validators
- Create shared DTOs for common response patterns
- Use Mapster for object mapping (simpler, faster than AutoMapper)

#### Additional C# Best Practices

| Practice | Implementation |
|----------|----------------|
| **Nullable Reference Types** | Enable `<Nullable>enable</Nullable>` to catch null issues at compile time |
| **Async/Await Throughout** | All I/O operations are async; avoid `.Result` and `.Wait()` |
| **Immutable DTOs** | Use `record` types for DTOs: `public record CycleResponse(...)` |
| **Expression-Bodied Members** | Use `=>` for single-expression methods and properties |
| **Pattern Matching** | Use `switch` expressions and `is` patterns for cleaner code |
| **Collection Expressions** | Use `[]` syntax for collections (C# 12) |
| **Primary Constructors** | Use primary constructors for DI (C# 12) |
| **Guard Clauses** | Fail fast with argument validation at method entry |
| **Cancellation Tokens** | Pass `CancellationToken` through async call chains |
| **IAsyncEnumerable** | Use for streaming large datasets |

#### Example: Clean Service Implementation

```csharp
// Application/Services/CycleService.cs
public class CycleService(
    ICycleRepository cycleRepository,
    IMapper mapper,
    ILogger<CycleService> logger) : ICycleService
{
    public async Task<CycleResponse> GetByIdAsync(Guid cycleId, Guid userId, CancellationToken ct = default)
    {
        var cycle = await cycleRepository.GetByIdWithDetailsAsync(cycleId, ct)
            ?? throw new NotFoundException($"Cycle {cycleId} not found");

        if (cycle.UserId != userId)
            throw new ForbiddenException("You don't have access to this cycle");

        return mapper.Map<CycleResponse>(cycle);
    }

    public async Task<CycleResponse> CreateAsync(CreateCycleRequest request, Guid userId, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var cycle = new Cycle
        {
            CycleId = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            StartDate = request.StartDate,
            Status = CycleStatus.Active,
            DateCreated = DateTime.UtcNow,
            DateUpdated = DateTime.UtcNow
        };

        await cycleRepository.AddAsync(cycle, ct);
        logger.LogInformation("Created cycle {CycleId} for user {UserId}", cycle.CycleId, userId);

        return mapper.Map<CycleResponse>(cycle);
    }
}
```

#### Layer Responsibilities

| Layer | Responsibility | Contains |
|-------|----------------|----------|
| **API** | HTTP handling, routing, auth | Controllers, Middleware, Filters |
| **Core** | Business logic, orchestration, domain model | Entities, Services, DTOs, Validators, Exceptions, Mappings |
| **Abstractions** | Shared contracts (zero dependencies) | Interfaces, Enums, Constants, Base interfaces |
| **Infrastructure** | External concerns | Repositories, DB Context, External Services |

#### Dependency Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPENDENCY DIRECTION                          │
└─────────────────────────────────────────────────────────────────┘

  ┌─────────────────┐
  │   Api           │  ← Entry point, references Core + Infrastructure
  └────────┬────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌──────────────┐
│  Core   │  │Infrastructure│  ← Both reference Abstractions
└────┬────┘  └──────┬───────┘
     │              │
     └──────┬───────┘
            ▼
    ┌───────────────┐
    │ Abstractions  │  ← Zero dependencies (foundational)
    └───────────────┘
```

**Key Benefits:**
- Abstractions can be shared without pulling in business logic
- Infrastructure depends only on contracts, not implementations
- Easy to swap implementations (e.g., different email provider)
- Clean separation enables parallel development

### 4.1 Project Structure

```
src/
├── MyUglyRocks.Api/                  # Web API project (entry point)
│   ├── Controllers/                  # API endpoints
│   │   ├── AuthController.cs
│   │   ├── CyclesController.cs
│   │   ├── StagesController.cs
│   │   ├── PhotosController.cs
│   │   ├── GalleryController.cs
│   │   └── AdminController.cs
│   ├── Middleware/
│   │   ├── ExceptionMiddleware.cs
│   │   ├── RequestLoggingMiddleware.cs
│   │   └── RateLimitingMiddleware.cs
│   ├── Filters/
│   │   └── ValidationFilter.cs
│   ├── Extensions/
│   │   ├── ServiceCollectionExtensions.cs
│   │   └── ApplicationBuilderExtensions.cs
│   ├── Program.cs
│   └── appsettings.json
│
├── MyUglyRocks.Abstractions/         # Shared contracts (zero dependencies)
│   ├── Enums/                        # All application enums
│   │   └── Enums.cs                  # Auto-generated from enums.json
│   ├── Constants/                    # Shared constants
│   │   └── Limits.cs
│   ├── Interfaces/                   # All interfaces
│   │   ├── Repositories/             # Repository contracts
│   │   │   ├── ICycleRepository.cs
│   │   │   ├── IStageRepository.cs
│   │   │   ├── IPhotoRepository.cs
│   │   │   └── ...
│   │   ├── Services/                 # Service contracts
│   │   │   ├── ICycleService.cs
│   │   │   ├── IAuthService.cs
│   │   │   ├── IFileStorageService.cs
│   │   │   ├── IEmailService.cs
│   │   │   ├── ICacheService.cs
│   │   │   └── ...
│   │   └── Base/                     # Base/marker interfaces
│   │       ├── IEntity.cs            # IEntity<TId>
│   │       ├── IAuditable.cs         # DateCreated, DateUpdated
│   │       ├── ISoftDeletable.cs     # IsDeleted, DateDeleted
│   │       └── IUserOwned.cs         # UserId property
│   └── Results/                      # Result pattern types
│       ├── Result.cs                 # Result<T> for service returns
│       └── Error.cs                  # Structured error type
│
├── MyUglyRocks.Core/                 # Domain & Business Logic
│   ├── Entities/                     # Domain entities
│   │   ├── User.cs
│   │   ├── Cycle.cs
│   │   ├── StageRun.cs
│   │   ├── Photo.cs
│   │   └── ...
│   ├── Services/                     # Business logic implementations
│   │   ├── CycleService.cs
│   │   ├── StageService.cs
│   │   ├── PhotoService.cs
│   │   ├── AuthService.cs
│   │   └── ...
│   ├── DTOs/                         # Data transfer objects
│   │   ├── Requests/
│   │   │   ├── CreateCycleRequest.cs
│   │   │   ├── UpdateCycleRequest.cs
│   │   │   └── ...
│   │   └── Responses/
│   │       ├── CycleResponse.cs
│   │       ├── CycleListResponse.cs
│   │       └── ...
│   ├── Validators/                   # FluentValidation validators
│   │   ├── CreateCycleValidator.cs
│   │   ├── UpdateCycleValidator.cs
│   │   └── ...
│   ├── Mappings/                     # Mapster configuration
│   │   └── MappingConfig.cs
│   └── Exceptions/                   # Domain exceptions
│       ├── NotFoundException.cs
│       ├── ForbiddenException.cs
│       └── ValidationException.cs
│
├── MyUglyRocks.Infrastructure/       # External concerns
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   ├── Configurations/           # EF Core entity configs
│   │   │   ├── UserConfiguration.cs
│   │   │   ├── CycleConfiguration.cs
│   │   │   └── ...
│   │   └── Migrations/
│   ├── Repositories/                 # Repository implementations
│   │   ├── CycleRepository.cs
│   │   ├── StageRepository.cs
│   │   ├── PhotoRepository.cs
│   │   └── ...
│   ├── Services/                     # External service implementations
│   │   ├── R2FileStorageService.cs   # Cloudflare R2 integration
│   │   ├── ResendEmailService.cs     # Resend integration
│   │   ├── RedisCacheService.cs      # Redis wrapper
│   │   └── ContentModerationService.cs
│   └── Jobs/                         # Background jobs
│       ├── StageReminderJob.cs
│       ├── CleanupDeletedPhotosJob.cs
│       └── ...
│
└── tests/                            # Test projects
    ├── MyUglyRocks.UnitTests/
    ├── MyUglyRocks.IntegrationTests/
    └── MyUglyRocks.ArchitectureTests/
```

### 4.1.1 Project References

```
MyUglyRocks.Api.csproj
├── MyUglyRocks.Core
└── MyUglyRocks.Infrastructure

MyUglyRocks.Core.csproj
└── MyUglyRocks.Abstractions

MyUglyRocks.Infrastructure.csproj
└── MyUglyRocks.Abstractions

MyUglyRocks.Abstractions.csproj
└── (no project references)
```

### 4.2 Request Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASP.NET CORE REQUEST PIPELINE                 │
└─────────────────────────────────────────────────────────────────┘

Incoming Request
      │
      ▼
┌─────────────────┐
│   Cloudflare    │  ← SSL termination, CDN, DDoS protection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Exception       │  ← Global error handling
│ Middleware      │     Logs errors, returns consistent error response
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request Logging │  ← Logs request details (method, path, duration)
│ Middleware      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rate Limiting   │  ← Enforces rate limits per user/IP
│ Middleware      │     Returns 429 if exceeded
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Authentication  │  ← Validates JWT from cookie
│ Middleware      │     Sets HttpContext.User
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Authorization   │  ← Checks [Authorize] attributes
│ Middleware      │     Role-based access
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validation      │  ← FluentValidation on request DTOs
│ Filter          │     Returns 400 with field errors
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Controller    │  ← Handles request
│   Action        │     Calls service layer
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Service       │  ← Business logic
│   Layer         │     Orchestrates operations
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Repository     │  ← Data access via EF Core
│  Layer          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
└─────────────────┘
```

### 4.3 Dependency Injection Setup

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Redis Cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});

// Identity
builder.Services.AddIdentity<User, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["access_token"];
                return Task.CompletedTask;
            }
        };
    });

// Repositories
builder.Services.AddScoped<ICycleRepository, CycleRepository>();
builder.Services.AddScoped<IStageRepository, StageRepository>();
builder.Services.AddScoped<IPhotoRepository, PhotoRepository>();
// ... other repositories

// Services
builder.Services.AddScoped<ICycleService, CycleService>();
builder.Services.AddScoped<IStageService, StageService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddScoped<IAuthService, AuthService>();
// ... other services

// Infrastructure Services
builder.Services.AddSingleton<IFileStorageService, R2FileStorageService>();
builder.Services.AddScoped<IEmailService, ResendEmailService>();
builder.Services.AddScoped<ICacheService, RedisCacheService>();

// Hangfire
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddHangfireServer();

// Validation
builder.Services.AddValidatorsFromAssemblyContaining<CreateCycleValidator>();

// Mapster
TypeAdapterConfig.GlobalSettings.Scan(typeof(MappingConfig).Assembly);

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter() }
});

app.MapControllers();
app.Run();
```

### 4.4 Error Handling

```csharp
// Middleware/ExceptionMiddleware.cs
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, errorCode) = exception switch
        {
            NotFoundException => (404, "NOT_FOUND"),
            ForbiddenException => (403, "FORBIDDEN"),
            ValidationException => (400, "VALIDATION_ERROR"),
            UnauthorizedAccessException => (401, "UNAUTHORIZED"),
            _ => (500, "INTERNAL_ERROR")
        };

        _logger.LogError(exception, "Error processing request: {Message}", exception.Message);

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = new
        {
            error = new
            {
                code = errorCode,
                message = statusCode == 500
                    ? "An unexpected error occurred"
                    : exception.Message,
                details = exception is ValidationException ve
                    ? ve.Errors
                    : null
            }
        };

        await context.Response.WriteAsJsonAsync(response);
    }
}
```

---

## 5. Database Architecture

### 5.1 Connection Strategy

| Environment | Strategy |
|-------------|----------|
| Development | Direct connection, no pooling |
| Production | PgBouncer connection pooling (via Railway) |

```csharp
// Connection string with pooling
"Host=railway;Database=myuglyrocks;Username=postgres;Password=xxx;Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100"
```

### 5.2 Migration Strategy

```bash
# Development
dotnet ef migrations add AddCycleTable -p src/MyUglyRocks.Infrastructure -s src/MyUglyRocks.Api
dotnet ef database update -p src/MyUglyRocks.Infrastructure -s src/MyUglyRocks.Api

# Production
# Migrations run on startup in Program.cs (or via deployment script)
```

```csharp
// Program.cs - Auto-migrate on startup (simple approach)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}
```

### 5.3 Performance Considerations

| Technique | Implementation |
|-----------|----------------|
| Indexes | Defined in EF Core configurations |
| Query Optimization | Use `.AsNoTracking()` for read-only queries |
| Eager Loading | Use `.Include()` strategically, avoid N+1 |
| Pagination | Cursor-based for large lists (or offset for MVP) |
| Caching | Redis for frequently accessed data (specimens, materials) |

```csharp
// Example: Optimized query
public async Task<PagedResult<CycleListDto>> GetUserCyclesAsync(
    Guid userId,
    CycleStatus? status,
    int page,
    int limit)
{
    var query = _context.Cycles
        .AsNoTracking()
        .Where(c => c.UserId == userId && !c.IsDeleted)
        .Include(c => c.CycleSpecimens)
            .ThenInclude(cs => cs.Specimen)
        .Include(c => c.StageRuns.Where(sr => !sr.IsDeleted).OrderByDescending(sr => sr.DateCreated).Take(1))
        .OrderByDescending(c => c.DateCreated);

    if (status.HasValue)
        query = query.Where(c => c.Status == status.Value);

    var totalCount = await query.CountAsync();
    var items = await query
        .Skip((page - 1) * limit)
        .Take(limit)
        .ToListAsync();

    return new PagedResult<CycleListDto>(
        items.Select(c => _mapper.Map<CycleListDto>(c)),
        page, limit, totalCount
    );
}
```

---

## 6. File Storage Architecture

### 6.1 Cloudflare R2 Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE R2 STORAGE                         │
└─────────────────────────────────────────────────────────────────┘

Bucket: myuglyrocks-media
├── avatars/
│   └── {userId}/
│       └── avatar.{ext}                  # Single avatar per user
│
├── cycles/
│   └── {cycleId}/
│       └── stages/
│           └── {stageRunId}/
│               ├── {photoId}_original.{ext}
│               ├── {photoId}_large.jpg    # 1200px max
│               ├── {photoId}_medium.jpg   # 600px max
│               └── {photoId}_thumb.jpg    # 200px thumbnail
│
└── posts/
    └── {postId}/
        └── {photoId}.jpg                  # References stage photos

Custom Domain: media.myuglyrocks.com (via Cloudflare)
```

### 6.2 Image Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                   IMAGE UPLOAD PIPELINE                          │
└─────────────────────────────────────────────────────────────────┘

User uploads photo(s)
        │
        ▼
┌───────────────────┐
│ Validate file     │
│ • Type: jpg/png   │
│ • Size: ≤ 20MB    │
│ • Dimensions      │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Upload original   │  ← Immediate, user sees success
│ to R2             │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Queue background  │  ← Hangfire job
│ processing        │
└────────┬──────────┘
         │
         ▼ (async)
┌───────────────────┐
│ Generate sizes    │
│ • Large: 1200px   │
│ • Medium: 600px   │
│ • Thumb: 200px    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Extract metadata  │
│ • Width/Height    │
│ • Orientation     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Update DB record  │
│ • Dimensions      │
│ • ProcessedAt     │
└─────────────────────┘
```

### 6.3 File Storage Service

```csharp
// Infrastructure/Services/R2FileStorageService.cs
public class R2FileStorageService : IFileStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _cdnBaseUrl;

    public async Task<string> UploadAsync(
        Stream stream,
        string path,
        string contentType,
        CancellationToken ct = default)
    {
        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = path,
            InputStream = stream,
            ContentType = contentType,
            CannedACL = S3CannedACL.PublicRead
        };

        await _s3Client.PutObjectAsync(request, ct);
        return $"{_cdnBaseUrl}/{path}";
    }

    public async Task DeleteAsync(string path, CancellationToken ct = default)
    {
        await _s3Client.DeleteObjectAsync(_bucketName, path, ct);
    }

    public string GetPublicUrl(string path) => $"{_cdnBaseUrl}/{path}";
}
```

---

## 7. Caching Strategy

### 7.1 Cache Layers

| Layer | Tool | Use Case | TTL |
|-------|------|----------|-----|
| HTTP | Cloudflare CDN | Static assets, images | 1 year |
| Application | Redis (Upstash) | Session, rate limits, reference data | Varies |
| Database | PostgreSQL | Query plan caching | Automatic |

### 7.2 Redis Usage

```csharp
// Cache keys and TTLs
public static class CacheKeys
{
    // Reference data (rarely changes)
    public const string Specimens = "specimens:all";           // 1 hour
    public const string Materials = "materials:all";           // 1 hour

    // User-specific (moderate TTL)
    public const string UserSettings = "user:{userId}:settings";  // 15 min
    public const string Dashboard = "user:{userId}:dashboard";    // 5 min

    // Rate limiting (short TTL)
    public const string RateLimit = "ratelimit:{ip}:{endpoint}";  // 1 min

    // Sessions
    public const string RefreshToken = "refresh:{tokenId}";       // 7 days
}
```

```csharp
// Example: Cached specimens list
public async Task<List<SpecimenDto>> GetAllSpecimensAsync()
{
    var cacheKey = CacheKeys.Specimens;

    var cached = await _cache.GetAsync<List<SpecimenDto>>(cacheKey);
    if (cached != null)
        return cached;

    var specimens = await _specimenRepository
        .GetAll()
        .Where(s => s.IsActive)
        .OrderBy(s => s.CommonName)
        .Select(s => _mapper.Map<SpecimenDto>(s))
        .ToListAsync();

    await _cache.SetAsync(cacheKey, specimens, TimeSpan.FromHours(1));
    return specimens;
}
```

---

## 8. Background Jobs

### 8.1 Job Types

| Job | Trigger | Description |
|-----|---------|-------------|
| `StageReminderJob` | Scheduled (hourly) | Check for stages ending soon, send notifications |
| `ProcessPhotoJob` | On upload | Generate image sizes, extract metadata |
| `CleanupDeletedPhotosJob` | Scheduled (daily) | Permanently delete old soft-deleted photos from R2 |
| `SendEmailJob` | On demand | Async email delivery |
| `RefreshTokenCleanupJob` | Scheduled (daily) | Remove expired refresh tokens |

### 8.2 Hangfire Configuration

```csharp
// Jobs/StageReminderJob.cs
public class StageReminderJob
{
    private readonly IStageRepository _stageRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<StageReminderJob> _logger;

    [AutomaticRetry(Attempts = 3)]
    public async Task CheckRemindersAsync()
    {
        var now = DateTime.UtcNow;
        var reminderWindow = now.AddHours(24);

        var stages = await _stageRepository.GetStagesEndingSoonAsync(now, reminderWindow);

        foreach (var stage in stages)
        {
            if (stage.ReminderEnabled && stage.ReminderSentAt == null)
            {
                await _emailService.SendStageReminderAsync(stage);
                await _stageRepository.MarkReminderSentAsync(stage.StageRunId, now);
                _logger.LogInformation("Sent reminder for stage {StageRunId}", stage.StageRunId);
            }
        }
    }
}

// Scheduled in Program.cs
RecurringJob.AddOrUpdate<StageReminderJob>(
    "stage-reminders",
    job => job.CheckRemindersAsync(),
    Cron.Hourly);
```

---

## 9. Security

### 9.1 Authentication

| Mechanism | Implementation |
|-----------|----------------|
| Password Hashing | ASP.NET Identity (bcrypt) |
| JWT Tokens | HS256, 15 min access, 7 day refresh |
| Token Storage | httpOnly, Secure, SameSite=Lax cookies |
| Refresh Tokens | Stored in Redis, revocable |

### 9.2 Authorization

```csharp
// Role-based access
[Authorize(Roles = "Admin,Moderator")]
public class AdminController : ControllerBase { }

// Resource-based access
public async Task<IActionResult> UpdateCycle(Guid cycleId, UpdateCycleRequest request)
{
    var cycle = await _cycleService.GetByIdAsync(cycleId);
    if (cycle.UserId != User.GetUserId())
        throw new ForbiddenException("You don't have access to this cycle");

    // ...
}
```

### 9.3 Input Validation

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend | Zod | Client-side validation, type inference |
| Backend | FluentValidation | Server-side validation, business rules |
| Database | Constraints | Data integrity (CHECK, FK, UNIQUE) |

### 9.4 Security Headers

```csharp
// Applied via middleware or Cloudflare
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Add("Content-Security-Policy",
        "default-src 'self'; img-src 'self' https://media.myuglyrocks.com data:; ...");
    await next();
});
```

### 9.5 Rate Limiting

```csharp
// Rate limiting configuration
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.PermitLimit = 10;
    });

    options.AddFixedWindowLimiter("uploads", limiter =>
    {
        limiter.Window = TimeSpan.FromHours(1);
        limiter.PermitLimit = 30;
    });

    options.AddFixedWindowLimiter("general", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.PermitLimit = 100;
    });
});
```

### 9.6 Brute-Force Protection (Account Lockout)

Protects against password guessing attacks by locking accounts after repeated failed login attempts.

**Configuration:**

| Setting | Value |
|---------|-------|
| Max failed attempts | 5 |
| Lockout type | Email verification required |
| Counter reset | On successful login |

**Database Fields (User entity):**

| Field | Type | Purpose |
|-------|------|---------|
| `FailedLoginAttempts` | int | Counter for consecutive failures |
| `LockoutEndTime` | timestamptz? | Set to "forever" until email unlock |
| `UnlockToken` | string? | Token sent via email to unlock |
| `UnlockTokenExpiry` | timestamptz? | Token valid for 24 hours |

**Login Flow:**

```
POST /api/auth/login
│
├─► Check if account is locked (LockoutEndTime != null)
│   └─► YES → Return 423 Locked "Account locked. Check email to unlock."
│
├─► Validate credentials
│   │
│   ├─► INVALID:
│   │   ├─► Increment FailedLoginAttempts
│   │   ├─► If FailedLoginAttempts >= 5:
│   │   │   ├─► Set LockoutEndTime = DateTime.MaxValue (locked until email verify)
│   │   │   ├─► Generate UnlockToken (secure random, 64 chars)
│   │   │   ├─► Set UnlockTokenExpiry = now + 24 hours
│   │   │   ├─► Send unlock email with link
│   │   │   └─► Return 423 Locked "Too many attempts. Check email to unlock."
│   │   └─► Return 401 Unauthorized "Invalid credentials"
│   │
│   └─► VALID:
│       ├─► Reset FailedLoginAttempts = 0
│       ├─► Clear LockoutEndTime = null
│       ├─► Clear UnlockToken = null
│       └─► Issue JWT tokens
```

**Unlock Flow:**

```
GET /api/auth/unlock-account?token={token}
│
├─► Find user by UnlockToken
│   └─► NOT FOUND → Return 400 "Invalid or expired token"
│
├─► Check UnlockTokenExpiry > now
│   └─► EXPIRED → Return 400 "Token expired. Try logging in again."
│
└─► VALID:
    ├─► Reset FailedLoginAttempts = 0
    ├─► Clear LockoutEndTime = null
    ├─► Clear UnlockToken = null
    ├─► Clear UnlockTokenExpiry = null
    └─► Return 200 "Account unlocked. You may now login."
```

**Security Considerations:**

- Don't reveal whether email exists (same error for invalid email vs password)
- Unlock token is single-use and expires after 24 hours
- Rate limit the login endpoint (10/min) to slow automated attacks
- Log all lockout events for security monitoring
- Consider CAPTCHA after 3 failed attempts (future enhancement)

```csharp
// Account lockout service
public class AccountLockoutService : IAccountLockoutService
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan UnlockTokenValidity = TimeSpan.FromHours(24);

    public async Task<LoginResult> ProcessLoginAttemptAsync(User user, bool credentialsValid)
    {
        if (user.LockoutEndTime.HasValue && user.LockoutEndTime > DateTime.UtcNow)
        {
            return LoginResult.AccountLocked();
        }

        if (!credentialsValid)
        {
            user.FailedLoginAttempts++;

            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.LockoutEndTime = DateTime.MaxValue;
                user.UnlockToken = TokenGenerator.GenerateSecureToken(64);
                user.UnlockTokenExpiry = DateTime.UtcNow.Add(UnlockTokenValidity);

                await _emailService.SendAccountLockedEmailAsync(user);

                _logger.LogWarning("Account locked due to too many failed attempts: {Email}", user.Email);

                return LoginResult.AccountLockedNewly();
            }

            return LoginResult.InvalidCredentials(user.FailedLoginAttempts);
        }

        // Successful login - reset counters
        user.FailedLoginAttempts = 0;
        user.LockoutEndTime = null;
        user.UnlockToken = null;
        user.UnlockTokenExpiry = null;

        return LoginResult.Success();
    }
}
```

---

## 10. Monitoring & Observability

### 10.1 Logging

| Level | Use Case |
|-------|----------|
| Debug | Development only |
| Information | Request/response summaries, job completions |
| Warning | Validation failures, rate limit hits |
| Error | Exceptions, failed jobs |

```csharp
// Serilog configuration
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(new JsonFormatter())
    .WriteTo.Seq(builder.Configuration["Seq:ServerUrl"]) // Optional
    .CreateLogger();
```

### 10.2 Error Tracking

```csharp
// Sentry integration
builder.WebHost.UseSentry(options =>
{
    options.Dsn = builder.Configuration["Sentry:Dsn"];
    options.Environment = builder.Environment.EnvironmentName;
    options.TracesSampleRate = 0.1; // 10% of transactions
});
```

### 10.3 Health Checks

```csharp
// Health check endpoints
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Default")!)
    .AddRedis(builder.Configuration.GetConnectionString("Redis")!)
    .AddUrlGroup(new Uri("https://api.resend.com"), "resend");

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

---

## 11. Deployment

### 11.1 Environment Configuration

| Variable | Development | Production |
|----------|-------------|------------|
| `ASPNETCORE_ENVIRONMENT` | Development | Production |
| `ConnectionStrings__Default` | Local PostgreSQL | Railway PostgreSQL |
| `ConnectionStrings__Redis` | Local Redis | Upstash Redis |
| `Jwt__Key` | Development key | Secret (Railway) |
| `R2__AccessKeyId` | Dev credentials | Production credentials |
| `Resend__ApiKey` | Test key | Production key |

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Build
        run: dotnet build --configuration Release

      - name: Test
        run: dotnet test --no-build --configuration Release

      - name: Deploy to Railway
        uses: railwayapp/railway-github-action@v1
        with:
          service: myuglyrocks-api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: railwayapp/railway-github-action@v1
        with:
          service: myuglyrocks-web
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 11.3 Database Migrations

```yaml
# Migrations run as part of deployment
# Option 1: Run on app startup (simple)
# Option 2: Run as separate Railway job before deploy

# Railway service config
[deploy]
  startCommand = "dotnet MyUglyRocks.Api.dll"
  healthcheckPath = "/health"
  healthcheckTimeout = 300
```

---

## 12. Scaling Considerations

### 12.1 Current Architecture Limits

| Component | Limit | When to Scale |
|-----------|-------|---------------|
| Railway API | 1 instance | 10K+ daily active users |
| PostgreSQL | 1 instance | Heavy query load, need read replicas |
| Redis | Upstash free tier | Need dedicated instance for high throughput |
| R2 Storage | Unlimited | N/A (pay per use) |

### 12.2 Future Scaling Options

| Challenge | Solution |
|-----------|----------|
| API load | Add Railway instances, load balancer |
| Database reads | Read replicas for queries |
| Search | Move to dedicated search (Meilisearch, Typesense) |
| Background jobs | Separate Hangfire server |
| Real-time features | Add WebSocket service (SignalR) |

### 12.3 Cost Projections

| Tier | Users | Estimated Monthly Cost |
|------|-------|------------------------|
| MVP | 0-100 | ~$10 (Railway Hobby - both services) |
| Growth | 100-1K | ~$40 (Railway Pro - both services) |
| Scale | 1K-10K | ~$120 (Dedicated resources) |

---

## 13. Development Workflow

### 13.1 Local Development

```bash
# Backend
cd src/MyUglyRocks.Api
dotnet watch run

# Frontend
cd frontend
pnpm dev

# Database (Docker)
docker-compose up -d postgres redis

# Migrations
dotnet ef database update
```

### 13.2 Testing Strategy

| Type | Tool | Coverage Goal |
|------|------|---------------|
| Unit Tests | xUnit, Moq | Core business logic |
| Integration Tests | WebApplicationFactory | API endpoints |
| E2E Tests | Playwright (future) | Critical user flows |

### 13.3 Code Quality

| Tool | Purpose |
|------|---------|
| ESLint + Prettier | Frontend linting/formatting |
| dotnet format | Backend formatting |
| Husky | Pre-commit hooks |
| SonarCloud (future) | Static analysis |

---

## 14. Disaster Recovery

### 14.1 Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| PostgreSQL | Daily | 7 days | Railway automated |
| R2 Photos | N/A | Durable by design | Cloudflare |
| Redis | N/A | Ephemeral cache | Rebuild on failure |

### 14.2 Recovery Procedures

| Scenario | Recovery |
|----------|----------|
| Database corruption | Restore from Railway backup |
| R2 bucket deleted | Contact Cloudflare support |
| API crash | Railway auto-restarts |
| Secrets leaked | Rotate all credentials, revoke tokens |

---

## 15. API Versioning Strategy

### 15.1 Current Approach

- URL prefix: `/api/v1/`
- No breaking changes within v1
- Additive changes only (new fields, endpoints)

### 15.2 Future Versioning

```
/api/v1/ ← Current (maintain indefinitely)
/api/v2/ ← Future major version (breaking changes)
```

Deprecation policy:
1. Announce deprecation 6 months in advance
2. Add `Deprecation` header to responses
3. Maintain old version for 12 months after new version

---

## 16. Testing Strategy

### 16.1 Testing Philosophy

| Principle | Description |
|-----------|-------------|
| **Test Pyramid** | More unit tests, fewer integration tests, minimal E2E tests |
| **Test What Matters** | Focus on business logic and user-facing behavior |
| **Fast Feedback** | Tests should run quickly; slow tests discourage testing |
| **Isolation** | Unit tests should not depend on external services |
| **CI Integration** | All tests run on every PR before merge |

### 16.2 Backend Testing (.NET)

#### 16.2.1 Test Frameworks

| Framework | Purpose |
|-----------|---------|
| **xUnit** | Test runner and assertions |
| **Moq** | Mocking dependencies |
| **FluentAssertions** | Readable assertion syntax |
| **Bogus** | Test data generation |
| **Respawn** | Database cleanup between tests |
| **WebApplicationFactory** | Integration test hosting |

#### 16.2.2 Test Project Structure

```
tests/
├── MyUglyRocks.UnitTests/
│   ├── Services/
│   │   ├── CycleServiceTests.cs
│   │   ├── StageRunServiceTests.cs
│   │   └── AuthServiceTests.cs
│   ├── Validators/
│   │   ├── CycleValidatorTests.cs
│   │   └── UserValidatorTests.cs
│   └── Helpers/
│       └── HardnessCalculatorTests.cs
│
├── MyUglyRocks.IntegrationTests/
│   ├── Api/
│   │   ├── CyclesApiTests.cs
│   │   ├── AuthApiTests.cs
│   │   └── PhotosApiTests.cs
│   ├── Fixtures/
│   │   ├── DatabaseFixture.cs
│   │   └── TestWebApplicationFactory.cs
│   └── Helpers/
│       └── AuthHelper.cs
│
└── MyUglyRocks.ArchitectureTests/
    └── ArchitectureTests.cs
```

#### 16.2.3 Unit Test Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| Services (business logic) | 80% | High |
| Validators | 90% | High |
| Helpers/Utilities | 90% | Medium |
| Controllers | 50% | Low (covered by integration tests) |
| EF Configurations | N/A | Tested via integration |

#### 16.2.4 Unit Test Example

```csharp
public class CycleServiceTests
{
    private readonly Mock<ICycleRepository> _cycleRepoMock;
    private readonly Mock<ISpecimenRepository> _specimenRepoMock;
    private readonly CycleService _sut;

    public CycleServiceTests()
    {
        _cycleRepoMock = new Mock<ICycleRepository>();
        _specimenRepoMock = new Mock<ISpecimenRepository>();
        _sut = new CycleService(_cycleRepoMock.Object, _specimenRepoMock.Object);
    }

    [Fact]
    public async Task CreateCycle_WithValidData_ReturnsCreatedCycle()
    {
        // Arrange
        var request = new CreateCycleRequest { Name = "Test Cycle", StartDate = DateOnly.FromDateTime(DateTime.Today) };
        var userId = Guid.NewGuid();

        // Act
        var result = await _sut.CreateCycleAsync(request, userId);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Test Cycle");
        _cycleRepoMock.Verify(r => r.AddAsync(It.IsAny<Cycle>()), Times.Once);
    }

    [Fact]
    public async Task CreateCycle_WithHardnessMismatch_ReturnsWarning()
    {
        // Arrange - specimens with >1 Mohs difference
        var specimens = new List<Specimen>
        {
            new() { SpecimenId = Guid.NewGuid(), MohsHardnessMin = 7 },
            new() { SpecimenId = Guid.NewGuid(), MohsHardnessMin = 4 }
        };
        _specimenRepoMock.Setup(r => r.GetByIdsAsync(It.IsAny<List<Guid>>()))
            .ReturnsAsync(specimens);

        // Act
        var result = await _sut.CreateCycleAsync(request, userId, specimenIds);

        // Assert
        result.Warnings.Should().Contain(w => w.Contains("hardness"));
    }
}
```

#### 16.2.5 Integration Test Example

```csharp
public class CyclesApiTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public CyclesApiTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetCycles_Authenticated_ReturnsUserCycles()
    {
        // Arrange
        await _factory.AuthenticateAs(_client, "testuser@example.com");

        // Act
        var response = await _client.GetAsync("/api/v1/cycles");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadFromJsonAsync<CyclesResponse>();
        content.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task GetCycles_Unauthenticated_Returns401()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/cycles");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
```

### 16.3 Frontend Testing (Next.js)

#### 16.3.1 Test Frameworks

| Framework | Purpose |
|-----------|---------|
| **Vitest** | Test runner (fast, Vite-native) |
| **React Testing Library** | Component testing |
| **MSW** | API mocking |
| **Playwright** | E2E testing (future) |

#### 16.3.2 Test File Structure

```
src/
├── app/
│   └── (protected)/
│       └── cycles/
│           ├── components/
│           │   ├── CycleCard.tsx
│           │   └── CycleCard.test.tsx    ← Co-located tests
│           └── hooks/
│               ├── useCycles.ts
│               └── useCycles.test.ts
├── lib/
│   └── utils/
│       ├── dates.ts
│       └── dates.test.ts
└── __tests__/                           ← Integration/E2E tests
    ├── setup.ts
    └── mocks/
        └── handlers.ts
```

#### 16.3.3 Frontend Test Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| Utility functions | 90% | High |
| Custom hooks | 80% | High |
| Form validation | 90% | High |
| UI components | 60% | Medium |
| Page components | 30% | Low (covered by E2E) |

#### 16.3.4 Component Test Example

```typescript
// CycleCard.test.tsx
import { render, screen } from '@testing-library/react';
import { CycleCard } from './CycleCard';

const mockCycle = {
  cycleId: '123',
  name: 'Test Cycle',
  status: 'Active',
  startDate: '2025-01-15',
  stageCount: 3,
};

describe('CycleCard', () => {
  it('renders cycle name', () => {
    render(<CycleCard cycle={mockCycle} />);
    expect(screen.getByText('Test Cycle')).toBeInTheDocument();
  });

  it('shows active badge when status is Active', () => {
    render(<CycleCard cycle={mockCycle} />);
    expect(screen.getByText('Active')).toHaveClass('bg-green-100');
  });

  it('displays stage count', () => {
    render(<CycleCard cycle={mockCycle} />);
    expect(screen.getByText('3 stages')).toBeInTheDocument();
  });
});
```

#### 16.3.5 Hook Test Example

```typescript
// useCycles.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCycles } from './useCycles';
import { server } from '@/__tests__/mocks/server';
import { http, HttpResponse } from 'msw';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useCycles', () => {
  it('fetches cycles successfully', async () => {
    server.use(
      http.get('/api/v1/cycles', () => {
        return HttpResponse.json({
          data: [{ cycleId: '1', name: 'Test' }],
          pagination: { page: 1, totalItems: 1 },
        });
      })
    );

    const { result } = renderHook(() => useCycles({}), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
  });
});
```

### 16.4 E2E Testing (Playwright - Future)

#### 16.4.1 Critical User Flows to Cover

| Flow | Priority | Complexity |
|------|----------|------------|
| User registration → Email verification → Login | P0 | Medium |
| Create cycle → Add stage → Upload photo → Complete | P0 | High |
| Share to gallery → Receive vote | P1 | Medium |
| Password reset flow | P1 | Low |
| Settings update | P2 | Low |

#### 16.4.2 E2E Test Example (Future)

```typescript
// e2e/cycle-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cycle Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestP@ss123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('user can create a new cycle', async ({ page }) => {
    await page.click('text=Start New Cycle');
    await expect(page).toHaveURL('/cycles/new');

    await page.fill('[name="name"]', 'My Test Cycle');
    await page.click('[data-testid="specimen-picker"]');
    await page.click('text=Agate');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/cycles\/[a-z0-9-]+/);
    await expect(page.locator('h1')).toContainText('My Test Cycle');
  });
});
```

### 16.5 Test Environment Configuration

#### 16.5.1 Backend Test Environment

```json
// appsettings.Testing.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres;Database=myuglyrocks_test;..."
  },
  "Jwt": {
    "Secret": "test-secret-key-for-testing-only-32-chars"
  },
  "R2": {
    "UseLocalEmulator": true
  }
}
```

#### 16.5.2 Frontend Test Environment

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
    },
  },
});
```

### 16.6 CI/CD Test Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: myuglyrocks_test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet restore
      - run: dotnet build --no-restore
      - run: dotnet test --no-build --verbosity normal --collect:"XPlat Code Coverage"
      - uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### 16.7 Test Data Management

#### 16.7.1 Seed Data for Tests

```csharp
public static class TestData
{
    public static User CreateUser(string email = "test@example.com") => new()
    {
        UserId = Guid.NewGuid(),
        Email = email,
        Username = email.Split('@')[0],
        PasswordHash = "hashed",
        EmailVerified = true,
        DateCreated = DateTime.UtcNow,
    };

    public static Cycle CreateCycle(Guid userId) => new()
    {
        CycleId = Guid.NewGuid(),
        UserId = userId,
        Name = "Test Cycle",
        StartDate = DateOnly.FromDateTime(DateTime.Today),
        Status = CycleStatus.Active,
        DateCreated = DateTime.UtcNow,
    };
}
```

#### 16.7.2 Faker for Randomized Tests

```csharp
var faker = new Faker<Cycle>()
    .RuleFor(c => c.CycleId, f => Guid.NewGuid())
    .RuleFor(c => c.Name, f => f.Lorem.Sentence(3))
    .RuleFor(c => c.StartDate, f => DateOnly.FromDateTime(f.Date.Past()))
    .RuleFor(c => c.Status, f => f.PickRandom<CycleStatus>());

var testCycle = faker.Generate();
```

---

## Next Steps

1. Set up development environment
2. Initialize frontend and backend projects
3. Implement authentication
4. Build core cycle tracking features
5. Add photo upload functionality
6. Implement gallery and social features
7. Deploy MVP
