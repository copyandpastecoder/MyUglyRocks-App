# MyUglyRocks - Planning Roadmap

This document outlines the steps to properly plan MyUglyRocks before writing any code.
Each phase builds on the previous one to create a comprehensive, well-structured plan.

---

## Overview

### Current State
- Single monolithic spec file (`MyUglyRocks-Spec.md`) containing everything
- Needs to be broken into focused, maintainable documents

### Target Structure
```
MyUglyRocks-PlanningAndSpecs/
├── ROADMAP.md                 # This file - planning guide
├── 01-PRD.md                  # Product Requirements Document
├── 02-USER-STORIES.md         # User stories by feature area
├── 03-SITEMAP.md              # Information architecture & navigation
├── 04-DATA-MODEL.md           # ERD and database schema
├── 05-API-SPEC.md             # REST API specification
├── 06-ARCHITECTURE.md         # Technical architecture & infrastructure
├── 07-SEQUENCE-DIAGRAMS.md    # Complex flow diagrams
├── 08-EMAIL-TEMPLATES.md      # Transactional email content
├── 09-DEV-ROADMAP.md          # Development milestones and tasks
├── wireframes/                # UI mockups
│   ├── 00-design-system.md    # Colors, typography, components
│   ├── 01-dashboard.md
│   ├── 02-cycles.md
│   ├── 03-stage-run.md
│   ├── 04-tumblers.md
│   ├── 05-gallery.md
│   ├── 06-post-detail.md
│   ├── 07-profile.md
│   ├── 08-settings.md
│   ├── 09-admin.md
│   ├── 10-auth.md
│   ├── 11-learn.md
│   └── 12-onboarding.md
├── decisions/                 # Architecture Decision Records
│   ├── ADR-001-database.md
│   ├── ADR-002-auth-strategy.md
│   ├── ADR-003-image-storage.md
│   └── ...
├── shared/                    # Code generation (enums & constants)
│   ├── enums.json             # Single source of truth
│   ├── generate.js            # Generator script
│   ├── Enums.cs               # Generated → copy to backend
│   └── constants.ts           # Generated → copy to frontend
├── seed-data/                 # Database seed data
│   ├── tumblers-seed.csv      # Tumbler & barrel definitions
│   ├── barrel-nicknames-seed.csv  # Fun barrel nicknames
│   ├── specimens-seed.csv     # Rock/mineral reference data
│   └── materials-seed.csv     # Grits, polishes, media
└── archive/
    └── MyUglyRocks-Spec.md    # Original combined spec (reference)
```

---

## Phase 1: Product Definition ✅ COMPLETE

### 1.1 Create Product Requirements Document (PRD) ✅
**File:** `01-PRD.md`

Extract and expand from current spec:
- [x] Product vision and mission statement
- [x] Target audience / user personas
  - Beginner rock tumbler
  - Experienced hobbyist
  - Community contributor
- [x] Problem statement (what pain points does this solve?)
- [x] Core value propositions
- [x] Feature list with priorities (Must Have / Should Have / Nice to Have)
- [x] MVP scope definition
- [x] Success metrics (how do we know it's working?)
- [x] Out of scope for v1

**Source sections from spec:** Section 1 (High-Level Goals)

---

### 1.2 Write User Stories ✅
**File:** `02-USER-STORIES.md`

Organize by epic/feature area:

- [x] **Epic: Authentication**
  - Register with email
  - Login/logout
  - Password reset
  - Email verification

- [x] **Epic: Cycle Management**
  - Create a new cycle
  - Add specimens to cycle
  - View cycle list
  - Filter/sort cycles
  - Complete/archive cycle
  - Delete cycle

- [x] **Epic: Stage Runs**
  - Add stage run to cycle
  - Select tumbler for stage
  - Add materials to stage
  - Set duration and reminders
  - Upload photos
  - Complete stage run

- [x] **Epic: Cleaning Runs**
  - Add cleaning run to stage
  - Add cleaning materials
  - Set duration

- [x] **Epic: My Tumblers**
  - Add tumbler
  - Edit tumbler
  - Delete/deactivate tumbler

- [x] **Epic: Gallery & Social**
  - Create public post from cycle
  - Browse gallery
  - Give "Ugly Rocks" (upvote)
  - Comment on posts
  - Reply to comments
  - Report inappropriate content

- [x] **Epic: User Profile**
  - View own profile
  - View others' profiles
  - Edit profile settings

- [x] **Epic: Settings**
  - Change units (imperial/metric)
  - Set date/time preferences
  - Manage notifications
  - Account management

- [x] **Epic: Admin/Moderation**
  - Review specimen suggestions
  - Moderate comments
  - Manage users

- [x] **Epic: Learn Section**
  - Browse specimens
  - Browse materials
  - FAQ

**Source sections from spec:** Sections 3-15

---

## Phase 2: Information Architecture ✅ COMPLETE

### 2.1 Create Sitemap & Navigation ✅
**File:** `03-SITEMAP.md`

- [x] Complete page inventory
- [x] Navigation hierarchy (desktop)
- [x] Navigation hierarchy (mobile)
- [x] Page-to-page flows
- [x] URL structure

**Source sections from spec:** Section 14 (Navigation & Dashboard)

---

## Phase 3: Data Design ✅ COMPLETE

### 3.1 Create Data Model Document ✅
**File:** `04-DATA-MODEL.md`

- [x] Entity list with descriptions
- [x] Entity Relationship Diagram (visual or Mermaid)
- [x] Complete field definitions for each entity:
  - User
  - Cycle
  - CycleSpecimen
  - StageRun
  - CleaningRun
  - StageMaterial
  - CleaningMaterial
  - Tumbler
  - Specimen
  - Material
  - Photo
  - Post
  - PostPhoto
  - Comment
  - CommentReport
  - Vote
  - UserSettings
  - AuditLog
- [x] Indexes and constraints
- [x] Soft delete strategy
- [x] Audit fields strategy

**Source sections from spec:** Sections 3-7, 9-10, 12, 17

---

### 3.2 Create API Specification ✅
**File:** `05-API-SPEC.md`

For each endpoint group, define:
- [x] Endpoint path and method
- [x] Request body schema
- [x] Response schema
- [x] Error responses
- [x] Authentication requirements
- [x] Rate limiting (if applicable)

Endpoint groups:
- [x] Auth (`/api/auth/*`)
- [x] Users (`/api/users/*`)
- [x] Cycles (`/api/cycles/*`)
- [x] Stage Runs (`/api/stages/*`)
- [x] Cleaning Runs (`/api/cleaning/*`)
- [x] Tumblers (`/api/tumblers/*`)
- [x] Materials (`/api/materials/*`)
- [x] Specimens (`/api/specimens/*`)
- [x] Photos (`/api/photos/*`)
- [x] Posts (`/api/posts/*`)
- [x] Comments (`/api/comments/*`)
- [x] Votes (`/api/votes/*`)
- [x] Admin (`/api/admin/*`)
- [x] Export (`/api/export/*`)

**Source sections from spec:** Section 16

---

## Phase 4: Technical Architecture ✅ COMPLETE

### 4.1 Create Architecture Document ✅
**File:** `06-ARCHITECTURE.md`

- [x] System architecture diagram
- [x] Tech stack with rationale
  - Backend: C# / ASP.NET Core
  - Frontend: Next.js / TypeScript / Tailwind
  - Database: PostgreSQL
  - Cache: Redis
  - Storage: Cloudflare R2
  - Email: Resend
  - Jobs: Hangfire
- [x] Project structure (backend)
- [x] Project structure (frontend)
- [x] Third-party integrations
- [x] Caching strategy
- [x] Background job definitions
- [x] Logging and monitoring approach
- [x] Error handling patterns
- [x] Development philosophy & guiding principles
- [x] SOLID & DRY principles (backend)
- [x] React best practices (frontend)
- [x] Performance patterns (debounce, prefetching, infinite scroll)
- [x] Image optimization strategy
- [x] Form patterns & submission states
- [x] Keyboard & focus management

**Source sections from spec:** Section 2

**Note:** Security and deployment are covered within 06-ARCHITECTURE.md (Sections 6-12)

---

### 4.2 Create Security Document
**File:** Covered in `06-ARCHITECTURE.md` Section 6

- [x] Authentication flow (JWT in httpOnly cookies)
- [x] Authorization (roles: User, Moderator, Admin)
- [x] Password requirements and hashing
- [x] Rate limiting strategy
- [x] Input validation approach
- [x] CORS configuration
- [x] Data privacy (what's public vs private)
- [x] GDPR / data export considerations

**Source sections from spec:** Sections 2.1, 10, 11, 12, 15

---

### 4.3 Create Deployment Document
**File:** Covered in `06-ARCHITECTURE.md` Sections 11-14

- [x] Environment strategy (local, staging, production)
- [x] Docker configuration
- [x] Database hosting
- [x] Redis hosting
- [x] Cloudflare R2 setup
- [x] Domain and SSL
- [x] CI/CD pipeline
- [x] Backup strategy
- [x] Monitoring and alerting

**Source sections from spec:** Section 2.3

---

## Phase 5: UI/UX Design ✅ COMPLETE

### 5.1 Design System ✅
**File:** `wireframes/00-design-system.md`

- [x] Color palette
- [x] Typography
- [x] Spacing system
- [x] Component library choice (shadcn/ui or custom)
- [x] Icon set
- [x] Responsive breakpoints
- [x] Accessibility requirements

---

### 5.2 Wireframes ✅
**Folder:** `wireframes/`

All wireframes include: Desktop layout, Mobile layout, Key interactions, Empty states, Loading states, Error states

- [x] `wireframes/01-dashboard.md` - Dashboard layout and components
- [x] `wireframes/02-cycles.md` - Cycle list and cycle detail views
- [x] `wireframes/03-stage-run.md` - Stage run form and detail
- [x] `wireframes/04-tumblers.md` - My Tumblers list and form
- [x] `wireframes/05-gallery.md` - Public gallery grid/list
- [x] `wireframes/06-post-detail.md` - Post detail with comments
- [x] `wireframes/07-profile.md` - User profile page
- [x] `wireframes/08-settings.md` - Settings pages
- [x] `wireframes/09-admin.md` - Admin dashboard and queues
- [x] `wireframes/10-auth.md` - Login, register, password reset

**Source sections from spec:** Sections 3-15

---

## Phase 6: Architecture Decisions ✅ COMPLETE

### 6.1 Document Key Decisions
**Folder:** `decisions/`

Create ADRs for significant choices:

- [x] `ADR-001-database.md` - Why PostgreSQL over alternatives
- [x] `ADR-002-auth-strategy.md` - JWT in httpOnly cookies approach
- [x] `ADR-003-image-storage.md` - Cloudflare R2 choice and strategy
- [x] `ADR-004-frontend-framework.md` - Next.js App Router decision
- [x] `ADR-005-hosting-strategy.md` - Railway as primary platform (Vercel backup)
- [ ] `ADR-006-caching.md` - Redis caching strategy (optional)
- [ ] `ADR-007-email-provider.md` - Why Resend (optional)
- [ ] `ADR-008-background-jobs.md` - Hangfire vs alternatives (optional)
- [ ] `ADR-009-api-style.md` - REST vs GraphQL decision (optional)

ADR Template:
```markdown
# ADR-XXX: Title

## Status
Proposed / Accepted / Deprecated / Superseded

## Context
What is the issue we're addressing?

## Decision
What is the change we're making?

## Consequences
What are the trade-offs?
```

---

## Phase 7: Development Roadmap ✅ COMPLETE

### 7.1 Define MVP Milestones ✅
**File:** `09-DEV-ROADMAP.md`

Detailed breakdown with tasks, dependencies, and definitions of done:

- [x] **Milestone 1: Foundation** - Project setup, database, auth, email
- [x] **Milestone 2: Core Tracking** - Cycles, stages, tumblers, photos
- [x] **Milestone 3: Reference Data** - Specimens, materials, Learn section
- [x] **Milestone 4: Social Features** - Posts, gallery, voting, comments
- [x] **Milestone 5: Polish** - Settings, notifications, export, admin
- [x] **Milestone 6: Launch Prep** - Performance, security, deployment

---

## Phase 8: Pre-Development Setup ✅ COMPLETE

### 8.1 Code Generation Setup ✅
**Folder:** `shared/`

Single source of truth for all enums and constants used by both backend and frontend.

- [x] **`enums.json`** - Master definition file containing:
  - All 29 enums with numeric values (match database smallint)
  - Display labels for UI rendering
  - XML comments for C# documentation
  - Region groupings for organization
  - Constants: units, conversions, stage presets, limits

- [x] **`generate.js`** - Node.js script that generates:
  - `Enums.cs` - C# enums with regions, XML docs, and comments
  - `constants.ts` - TypeScript const objects, types, labels, and helpers

**Workflow for adding/changing enums:**
1. Edit `shared/enums.json` (the single source of truth)
2. Run `node shared/generate.js` to regenerate files
3. Copy `Enums.cs` to backend: `src/MyUglyRocks.Core/Enums/`
4. Copy `constants.ts` to frontend: `src/lib/constants.ts`

**Enums included (29 total):**

| Region | Enums |
|--------|-------|
| User & Auth | UserRole |
| User Settings | MeasurementSystem, DateFormat, TimeFormat, FirstDayOfWeek, TrackingMode, FontSize, Density, DefaultHomeSection, DigestFrequency, PhotoUploadQuality, PostVisibility |
| Cycle & Stage | CycleStatus, StageRunStatus, WaterLevel, StageNextAction, CleaningRunStatus, CleaningPurpose |
| Specimen | MaterialType, TumblingDifficulty |
| Material | MaterialCategory, UsageType |
| Tumbler | TumblerType |
| Photo | PhotoType |
| Social | PostStatus, ReportStatus, SuggestionStatus |
| Reminders | ReminderType, ReminderStatus |

---

### 8.2 Seed Data Preparation ✅
**Folder:** `seed-data/`

CSV files with reference data for database seeding. Each file includes:
- Header row with field names matching entity properties
- Comment row explaining field mappings and enum values
- Data rows ready for import

- [x] **`tumblers-seed.csv`** - System tumbler definitions
  - Popular tumbler models (Lortone, National Geographic, Harbor Freight, etc.)
  - Barrel configurations with capacities
  - IsSystem=true (read-only reference data)

- [x] **`barrel-nicknames-seed.csv`** - Fun barrel nickname options
  - Whimsical names users can assign to their barrels
  - Rock/geology themed (Boulder, Pebble, Granite, etc.)

- [x] **`specimens-seed.csv`** - Rock and mineral reference library
  - Common tumbling specimens with Mohs hardness
  - MaterialType enum values (Rock, Mineral, Glass, etc.)
  - TumblingDifficulty ratings
  - Descriptions and tips

- [x] **`materials-seed.csv`** - Tumbling supplies catalog
  - Grits (Silicon Carbide 60/90, 120/220, 500, etc.)
  - Polishes (Aluminum Oxide, Cerium Oxide, etc.)
  - Additives (Borax, dish soap, etc.)
  - Media (Ceramic pellets, plastic pellets, etc.)
  - MaterialCategory and UsageType enum values
  - Suggested amounts per pound of rock

**Seeder implementation notes:**
- Parse CSV with header row as property names
- Skip comment rows (start with `#`)
- Map enum string values to numeric values using constants
- Set IsSystem=true and audit fields (CreatedAt, CreatedBy="system")

---

### 8.3 Development Kickoff Checklist
**When starting development, complete these steps:**

**Backend Setup:**
- [ ] Create solution structure per `06-ARCHITECTURE.md`
- [ ] Copy `shared/Enums.cs` to `src/MyUglyRocks.Core/Enums/`
- [ ] Run EF Core migrations to create database schema per `04-DATA-MODEL.md`
- [ ] Implement seeders using `seed-data/*.csv` files
- [ ] Configure authentication per `decisions/ADR-002-auth-strategy.md`

**Frontend Setup:**
- [ ] Create Next.js project structure per `06-ARCHITECTURE.md`
- [ ] Copy `shared/constants.ts` to `src/lib/constants.ts`
- [ ] Set up Tailwind and shadcn/ui per `wireframes/00-design-system.md`
- [ ] Configure API client with auth interceptors

**Verification:**
- [ ] Enum values match between C#, TypeScript, and database
- [ ] Seed data imports successfully
- [ ] Basic auth flow works end-to-end

---

## Execution Checklist

### Recommended Order
1. [x] **Phase 1.1** - PRD (defines what we're building)
2. [x] **Phase 1.2** - User Stories (detailed requirements)
3. [x] **Phase 2.1** - Sitemap (structure the app)
4. [x] **Phase 5.1** - Design System (visual foundation)
5. [x] **Phase 5.2** - Wireframes (visualize before building)
6. [x] **Phase 3.1** - Data Model (design the database)
7. [x] **Phase 3.2** - API Spec (design the interface)
8. [x] **Phase 4.1** - Architecture (technical design)
9. [x] **Phase 4.2** - Security (protect the system)
10. [x] **Phase 4.3** - Deployment (how to ship it)
11. [x] **Phase 6.1** - ADRs (document decisions as you go)
12. [x] **Phase 7.1** - Dev Roadmap (plan the build)
13. [x] **Phase 8.1** - Code Generation (enums & constants)
14. [x] **Phase 8.2** - Seed Data (reference data CSVs)
15. [ ] **Phase 8.3** - Development Kickoff (when starting to code)

---

## Notes

- Each document should be self-contained but reference others where appropriate
- Keep the original `MyUglyRocks-Spec.md` in `archive/` for reference
- Update documents as decisions change
- Consider using a tool like Notion, Confluence, or GitHub Projects for tracking progress
- Wireframes can be created with Figma, Excalidraw, or even ASCII diagrams in markdown

---

## Planning Complete!

All planning phases are now complete. The specification includes:

| Document | Purpose |
|----------|---------|
| `01-PRD.md` | Product vision, personas, features, MVP scope |
| `02-USER-STORIES.md` | Detailed user stories by epic |
| `03-SITEMAP.md` | Information architecture, navigation, URLs |
| `04-DATA-MODEL.md` | Database schema, entities, relationships |
| `05-API-SPEC.md` | REST API endpoints, request/response schemas |
| `06-ARCHITECTURE.md` | Tech stack, infrastructure, security, testing |
| `07-SEQUENCE-DIAGRAMS.md` | Complex flow diagrams |
| `08-EMAIL-TEMPLATES.md` | Transactional email content |
| `09-DEV-ROADMAP.md` | Development milestones and task breakdown |
| `wireframes/` | UI wireframes for all pages |
| `decisions/` | Architecture Decision Records |
| `shared/` | Code generation: enums.json → Enums.cs + constants.ts |
| `seed-data/` | Reference data CSVs for database seeding |

**Next step:** Begin development with Milestone 1: Foundation (see `09-DEV-ROADMAP.md`).

When starting development:
1. Run `node shared/generate.js` to ensure generated files are current
2. Copy `shared/Enums.cs` to backend project
3. Copy `shared/constants.ts` to frontend project
4. Implement seeders using `seed-data/*.csv` files
