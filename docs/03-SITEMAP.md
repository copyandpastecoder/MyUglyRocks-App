# MyUglyRocks - Sitemap & Information Architecture

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [01-PRD.md](01-PRD.md), [02-USER-STORIES.md](02-USER-STORIES.md) |

---

## 1. Site Structure Overview

```
MyUglyRocks
│
├── Public Pages (No Auth Required)
│   ├── Landing Page (/)
│   ├── Gallery (/gallery)
│   ├── Post Detail (/gallery/:postId)
│   ├── User Profile (/user/:username)
│   ├── Specimens (/specimens)
│   ├── Specimen Detail (/specimens/:specimenId)
│   ├── Materials (/materials)
│   ├── Material Detail (/materials/:materialId)
│   ├── FAQ (/faq)
│   ├── Login (/login)
│   ├── Register (/register)
│   ├── Forgot Password (/forgot-password)
│   ├── Reset Password (/reset-password/:token)
│   ├── Privacy Policy (/privacy)
│   ├── Terms of Service (/terms)
│   └── Cookie Policy (/cookies)
│
├── Protected Pages (Auth Required)
│   ├── Dashboard (/dashboard)
│   ├── Cycles
│   │   ├── Cycle List (/cycles)
│   │   ├── Cycle Detail (/cycles/:cycleId)
│   │   ├── New Cycle (/cycles/new)
│   │   └── Edit Cycle (/cycles/:cycleId/edit)
│   ├── Stage Runs
│   │   ├── New Stage Run (/cycles/:cycleId/stages/new)
│   │   ├── Stage Run Detail (/stages/:stageRunId)
│   │   └── Edit Stage Run (/stages/:stageRunId/edit)
│   ├── My Tumblers
│   │   ├── Tumbler List (/tumblers)
│   │   ├── New Tumbler (/tumblers/new)
│   │   └── Edit Tumbler (/tumblers/:tumblerId/edit)
│   ├── Create Post (/cycles/:cycleId/share)
│   ├── Edit Post (/posts/:postId/edit)
│   ├── Settings
│   │   ├── Settings Overview (/settings)
│   │   ├── Profile (/settings/profile)
│   │   ├── Preferences (/settings/preferences)
│   │   ├── Notifications (/settings/notifications)
│   │   └── Account (/settings/account)
│   └── Help & Support (/help)
│
└── Admin Pages (Admin/Mod Auth Required)
    ├── Admin Dashboard (/admin)
    ├── Moderation Queue (/admin/moderation)
    ├── User Management (/admin/users)
    ├── Specimen Management (/admin/specimens)
    └── Material Management (/admin/materials)
```

---

## 2. Page Inventory

### 2.1 Public Pages

| Page | URL | Description | Priority |
|------|-----|-------------|----------|
| Landing Page | `/` | Marketing/intro page for logged-out users | P0 |
| Gallery | `/gallery` | Browse public posts | P1 |
| Post Detail | `/gallery/:postId` | View single post with photos, comments | P1 |
| User Profile | `/user/:username` | Public profile with posts and stats | P1 |
| Specimens List | `/specimens` | Browse specimen reference data | P0 |
| Specimen Detail | `/specimens/:specimenId` | View specimen details | P0 |
| Materials List | `/materials` | Browse materials reference data | P0 |
| Material Detail | `/materials/:materialId` | View material details | P0 |
| FAQ | `/faq` | Frequently asked questions | P2 |
| Login | `/login` | User login form | P0 |
| Register | `/register` | User registration form | P0 |
| Forgot Password | `/forgot-password` | Request password reset | P0 |
| Reset Password | `/reset-password/:token` | Set new password | P0 |
| Verify Email | `/verify-email/:token` | Email verification landing | P0 |
| Privacy Policy | `/privacy` | Privacy policy | P1 |
| Terms of Service | `/terms` | Terms of service | P1 |
| Cookie Policy | `/cookies` | Cookie usage policy | P2 |

### 2.2 Protected Pages (Authenticated Users)

| Page | URL | Description | Priority |
|------|-----|-------------|----------|
| Dashboard | `/dashboard` | User home with active cycles, stats | P0 |
| Cycle List | `/cycles` | All user's cycles | P0 |
| Cycle Detail | `/cycles/:cycleId` | Single cycle with all stages | P0 |
| New Cycle | `/cycles/new` | Create cycle form | P0 |
| Edit Cycle | `/cycles/:cycleId/edit` | Edit cycle form | P0 |
| New Stage Run | `/cycles/:cycleId/stages/new` | Add stage to cycle | P0 |
| Stage Run Detail | `/stages/:stageRunId` | View stage run details | P0 |
| Edit Stage Run | `/stages/:stageRunId/edit` | Edit stage run form | P0 |
| Tumbler List | `/tumblers` | User's tumblers | P0 |
| New Tumbler | `/tumblers/new` | Add tumbler form | P0 |
| Edit Tumbler | `/tumblers/:tumblerId/edit` | Edit tumbler form | P0 |
| Create Post | `/cycles/:cycleId/share` | Share cycle to gallery | P1 |
| Edit Post | `/posts/:postId/edit` | Edit public post | P1 |
| Settings | `/settings` | Settings overview/redirect | P0 |
| Profile Settings | `/settings/profile` | Edit display name, bio, avatar | P1 |
| Preferences | `/settings/preferences` | Units, date format, timezone | P0 |
| Notifications | `/settings/notifications` | Email notification toggles | P1 |
| Account | `/settings/account` | Password, email, deactivate | P0 |
| Help & Support | `/help` | Help resources, contact | P2 |

### 2.3 Admin Pages

| Page | URL | Description | Priority |
|------|-----|-------------|----------|
| Admin Dashboard | `/admin` | Admin overview | P2 |
| Moderation Queue | `/admin/moderation` | Reported content review | P2 |
| User Management | `/admin/users` | View/manage users | P2 |
| Specimen Management | `/admin/specimens` | CRUD specimens | P2 |
| Material Management | `/admin/materials` | CRUD materials | P2 |

---

## 3. Navigation Structure

### 3.1 Desktop Navigation (Header)

**Logged Out:**
```
[Logo: MyUglyRocks]    [Gallery]  [Specimens]  [Materials]  [Login]  [Register]
```

**Logged In:**
```
[Logo: MyUglyRocks]    [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [Materials]  [Avatar ▼]
                                                                                                 ├── Profile
                                                                                                 ├── Settings
                                                                                                 └── Logout
```

**Admin (additional):**
```
[Avatar ▼]
├── Profile
├── Settings
├── Admin Dashboard    ← Only visible to admins/mods
└── Logout
```

### 3.2 Mobile Navigation (Bottom Tab Bar)

**Logged Out:**
```
┌─────────────────────────────────────────────────┐
│  [Gallery]   [Specimens]   [Materials]   [Login] │
└─────────────────────────────────────────────────┘
```

**Logged In:**
```
┌─────────────────────────────────────────────────┐
│  [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [More] │
└─────────────────────────────────────────────────┘

[More] opens drawer/sheet with:
├── Specimens
├── Materials
├── FAQ
├── Settings
├── Help
└── Logout

Note: Tap avatar in header to access Profile.
```

### 3.3 Breadcrumbs

Enable breadcrumb navigation on nested pages:

| Page | Breadcrumb |
|------|------------|
| Cycle Detail | Dashboard > Cycles > [Cycle Name] |
| Stage Run Detail | Dashboard > Cycles > [Cycle Name] > [Stage Name] |
| Edit Stage Run | Dashboard > Cycles > [Cycle Name] > [Stage Name] > Edit |
| New Stage Run | Dashboard > Cycles > [Cycle Name] > Add Stage |
| Specimen Detail | Specimens > [Specimen Name] |
| Material Detail | Materials > [Material Name] |
| Post Detail | Gallery > [Post Title] |
| Settings Pages | Settings > [Section Name] |
| Admin Pages | Admin > [Section Name] |

---

## 4. URL Structure

### 4.1 URL Patterns

| Pattern | Example | Notes |
|---------|---------|-------|
| `/` | `/` | Landing page |
| `/login` | `/login` | Static auth pages |
| `/gallery` | `/gallery` | Public list |
| `/gallery/:postId` | `/gallery/abc123` | Post detail by ID |
| `/user/:username` | `/user/rockfan42` | Profile by username |
| `/specimens` | `/specimens` | Specimens list |
| `/specimens/:id` | `/specimens/xyz789` | Specimen detail |
| `/materials` | `/materials` | Materials list |
| `/materials/:id` | `/materials/abc123` | Material detail |
| `/cycles` | `/cycles` | User's cycles list |
| `/cycles/:cycleId` | `/cycles/def456` | Cycle detail |
| `/cycles/:cycleId/edit` | `/cycles/def456/edit` | Edit form |
| `/cycles/:cycleId/stages/new` | `/cycles/def456/stages/new` | Add stage |
| `/stages/:stageRunId` | `/stages/ghi012` | Stage detail |
| `/tumblers` | `/tumblers` | User's tumblers |
| `/settings/profile` | `/settings/profile` | Settings subsection |
| `/admin/moderation` | `/admin/moderation` | Admin subsection |

### 4.2 URL Conventions

- Use lowercase with hyphens for multi-word paths: `/forgot-password`
- Use IDs (GUIDs) for dynamic segments: `/cycles/:cycleId`
- Use usernames for profiles: `/user/:username`
- Keep URLs shallow where possible (max 3-4 segments)
- Use query params for filters/sorting: `/cycles?status=active&sort=recent`

### 4.3 Query Parameters

| Page | Parameter | Values | Default |
|------|-----------|--------|---------|
| `/cycles` | `status` | `active`, `completed`, `all` | `all` |
| `/cycles` | `sort` | `recent`, `oldest`, `name` | `recent` |
| `/cycles` | `specimen` | `{specimenId}` | none |
| `/gallery` | `sort` | `newest`, `uglyrocks`, `comments` | `newest` |
| `/specimens` | `search` | text | none |
| `/materials` | `category` | `abrasive`, `additive`, `media`, `cleaning` | none |

---

## 5. Page Flows

### 5.1 New User Registration Flow

```
Landing Page (/)
    │
    ├── Click "Register"
    ▼
Register (/register)
    │
    ├── Submit form
    ▼
Email Sent Confirmation (message on page)
    │
    ├── User checks email, clicks link
    ▼
Verify Email (/verify-email/:token)
    │
    ├── Success
    ▼
Login (/login)
    │
    ├── Submit credentials
    ▼
Dashboard (/dashboard)
```

### 5.2 Create Cycle Flow

```
Dashboard (/dashboard)
    │
    ├── Click "Start New Cycle"
    ▼
New Cycle (/cycles/new)
    │
    ├── Fill form, submit
    ▼
Cycle Detail (/cycles/:cycleId)
    │
    ├── Click "Add Stage"
    ▼
New Stage Run (/cycles/:cycleId/stages/new)
    │
    ├── Fill form (tumbler, materials, photos), submit
    ▼
Cycle Detail (/cycles/:cycleId)
    │
    ├── (Repeat adding stages as needed)
    │
    ├── Click "Complete Cycle"
    ▼
Cycle Detail (status: Completed)
```

### 5.3 Share to Gallery Flow

```
Cycle Detail (/cycles/:cycleId) [Completed]
    │
    ├── Click "Share to Gallery"
    ▼
Create Post (/cycles/:cycleId/share)
    │
    ├── Enter title, commentary
    ├── Select/deselect photos
    ├── Submit
    ▼
Post Detail (/gallery/:postId)
```

### 5.4 Password Reset Flow

```
Login (/login)
    │
    ├── Click "Forgot Password"
    ▼
Forgot Password (/forgot-password)
    │
    ├── Enter email, submit
    ▼
Email Sent Confirmation (message)
    │
    ├── User clicks link in email
    ▼
Reset Password (/reset-password/:token)
    │
    ├── Enter new password, submit
    ▼
Login (/login) [with success message]
```

### 5.5 Voting & Commenting Flow

```
Gallery (/gallery)
    │
    ├── Click post card
    ▼
Post Detail (/gallery/:postId)
    │
    ├── Click "Ugly Rock" button
    │   ├── If logged in: vote recorded
    │   └── If logged out: redirect to Login, return after
    │
    ├── Enter comment, submit
    │   ├── If logged in: comment posted
    │   └── If logged out: redirect to Login, return after
    ▼
Post Detail (updated with vote/comment)
```

---

## 6. Page Components

### 6.1 Global Components

| Component | Location | Description |
|-----------|----------|-------------|
| Header | All pages | Logo, navigation, user menu |
| Footer | All pages | Links, copyright |
| Mobile Nav | All pages (mobile) | Bottom tab bar |
| Toast/Notification | Global | Success/error messages |
| Loading Spinner | Global | Page/section loading state |
| Modal Container | Global | For dialogs |

### 6.2 Page-Specific Components

| Page | Key Components |
|------|----------------|
| Dashboard | ActiveCycleCard, StatsWidget, QuickActions |
| Cycle List | CycleCard, FilterBar, EmptyState |
| Cycle Detail | CycleHeader, StageRunList, StageRunCard, PhotoGallery |
| New/Edit Cycle | CycleForm, SpecimenPicker, DatePicker |
| Stage Run Detail | StageHeader, MaterialList, PhotoGrid, CleaningRunCard |
| New/Edit Stage | StageForm, TumblerSelect, MaterialPicker, PhotoUploader |
| Tumbler List | TumblerCard, EmptyState |
| New/Edit Tumbler | TumblerForm |
| Gallery | PostCard, SortSelect, InfiniteScroll |
| Post Detail | PostHeader, PhotoCarousel, CycleSummary, CommentThread, VoteButton |
| User Profile | ProfileHeader, PostList, StatsDisplay |
| Specimens List | SpecimenCard, SearchBar, FilterBar |
| Specimen Detail | SpecimenInfo, HardnessDisplay, GritRecommendation |
| Settings | SettingsNav, FormSection |
| Admin | AdminNav, DataTable, ActionButtons |

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| `xs` | < 640px | Small phones |
| `sm` | ≥ 640px | Large phones |
| `md` | ≥ 768px | Tablets |
| `lg` | ≥ 1024px | Laptops |
| `xl` | ≥ 1280px | Desktops |
| `2xl` | ≥ 1536px | Large screens |

### Layout Changes by Breakpoint

| Component | Mobile (< 768px) | Desktop (≥ 768px) |
|-----------|------------------|-------------------|
| Navigation | Bottom tab bar | Header nav |
| Cycle List | Single column cards | Table or grid |
| Gallery | Single column | 2-4 column grid |
| Stage Run Detail | Stacked sections | Side-by-side panels |
| Settings | Full-width forms | Left nav + content |
| Modals | Full-screen sheets | Centered dialogs |

---

## 8. Empty States

Each list page should handle empty states gracefully:

| Page | Empty State Message | Action |
|------|---------------------|--------|
| Cycle List | "No cycles yet. Start your first tumbling cycle!" | "Start New Cycle" button |
| Tumbler List | "No tumblers added. Add your first tumbler to get started." | "Add Tumbler" button |
| Stage Runs (in cycle) | "No stages yet. Add your first stage run." | "Add Stage" button |
| Gallery | "No posts yet. Be the first to share!" | "View My Cycles" button |
| User Posts (profile) | "No public posts yet." | (no action for others' profiles) |
| Search Results | "No results found for '[query]'." | "Clear search" link |

---

## 9. Error Pages

| Status | URL | Message |
|--------|-----|---------|
| 404 | `/404` | "Page not found. The page you're looking for doesn't exist." |
| 403 | `/403` | "Access denied. You don't have permission to view this page." |
| 500 | `/500` | "Something went wrong. Please try again later." |

All error pages should include:
- Clear message
- "Go to Dashboard" or "Go Home" button
- Link to Help/Support

---

## 10. SEO Considerations

### 10.1 Page Titles

| Page | Title Format |
|------|--------------|
| Landing | "MyUglyRocks - Track Your Rock Tumbling Journey" |
| Gallery | "Gallery - MyUglyRocks" |
| Post Detail | "[Post Title] by [Username] - MyUglyRocks" |
| User Profile | "[Username]'s Profile - MyUglyRocks" |
| Specimen Detail | "[Specimen Name] - Tumbling Guide - MyUglyRocks" |
| Dashboard | "Dashboard - MyUglyRocks" |
| Cycles | "My Cycles - MyUglyRocks" |

### 10.2 Meta Descriptions

- Landing: "Track your rock tumbling cycles, share your polished results, and learn from the community. Free rock tumbling app for hobbyists."
- Gallery: "Browse beautiful tumbled rocks from the MyUglyRocks community. Get inspired and learn tumbling recipes."
- Specimen pages: "[Specimen Name]: Mohs hardness [X-Y], tumbling difficulty [Easy/Medium/Hard]. Learn how to tumble [specimen] with recommended grit sequences."

### 10.3 Public vs Private Pages

| Public (Indexable) | Private (No Index) |
|--------------------|--------------------|
| Landing, Gallery, Post Detail | Dashboard, Cycles, Stages |
| User Profiles | Settings, Admin |
| Specimens, Materials, FAQ | Create/Edit forms |
| Auth pages (Login, Register) | |
| Legal pages (Privacy, Terms, Cookies) | |

---

## 11. Sitemap XML

Public pages to include in `sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://myuglyrocks.com/</loc></url>
  <url><loc>https://myuglyrocks.com/gallery</loc></url>
  <url><loc>https://myuglyrocks.com/specimens</loc></url>
  <url><loc>https://myuglyrocks.com/materials</loc></url>
  <url><loc>https://myuglyrocks.com/faq</loc></url>
  <url><loc>https://myuglyrocks.com/login</loc></url>
  <url><loc>https://myuglyrocks.com/register</loc></url>
  <!-- Dynamic: individual posts, profiles, specimens, materials -->
</urlset>
```

---

## Next Steps

1. Review sitemap for completeness
2. Proceed to Data Model (`04-DATA-MODEL.md`)
3. Or proceed to Wireframes (`wireframes/`)
