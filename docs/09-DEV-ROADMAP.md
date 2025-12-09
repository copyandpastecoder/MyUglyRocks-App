# MyUglyRocks - Development Roadmap

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.7 |
| Last Updated | 2025-12-09 |
| Status | In Progress |
| Related | [01-PRD.md](01-PRD.md), [06-ARCHITECTURE.md](06-ARCHITECTURE.md) |

---

## 1. Overview

This document defines the development milestones for building MyUglyRocks. Each milestone represents a deployable increment of functionality, allowing for iterative development and early feedback.

### 1.1 Milestone Summary

| Milestone | Name | Focus | Est. Complexity | Status |
|-----------|------|-------|-----------------|--------|
| M1 | Foundation | Project scaffolding, database, auth | High | ✅ Complete |
| M2 | Core Tracking | Cycles, stages, tumblers, photos | High | ✅ Complete (R2 deferred) |
| M3 | Reference Data | Specimens, materials, Learn section | Medium | ✅ Complete |
| M4 | Social Features | Posts, gallery, voting, comments | Medium | ✅ Complete |
| M5 | Polish | Settings, notifications, export | Medium | ✅ Complete |
| M6 | Launch Prep | Performance, security, deployment | Medium | 🔄 In Progress |

### 1.2 Build Philosophy

- **Vertical slices**: Each milestone delivers end-to-end functionality
- **Database first**: Schema changes happen early in each milestone
- **API before UI**: Backend endpoints before frontend pages
- **Test as you go**: Write tests alongside implementation
- **Deploy continuously**: Each milestone should be deployable

---

## 2. Milestone 1: Foundation ✅ COMPLETE

**Goal**: Establish project structure, database, and authentication system.

**Completed**: 2025-11-30

### 2.1 Tasks

#### Backend Setup
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B1.1 | Create ASP.NET Core Web API project | None | ✅ |
| B1.2 | Configure project structure (Clean Architecture layers) | B1.1 | ✅ |
| B1.3 | Set up Entity Framework Core with PostgreSQL | B1.2 | ✅ |
| B1.4 | Configure Serilog logging | B1.2 | ✅ |
| B1.5 | Set up FluentValidation | B1.2 | ✅ |
| B1.6 | Configure Mapster (object mapping) | B1.2 | ⏭️ M2 |
| B1.7 | Set up development Docker Compose (Postgres, Redis) | B1.1 | ✅ |
| B1.8 | Configure CORS for local development | B1.2 | ✅ |

#### Database Schema (Core)
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| D1.1 | Create User entity and migration | B1.3 | ✅ |
| D1.2 | Create UserSettings entity and migration | D1.1 | ⏭️ M2 |
| D1.3 | Create RefreshToken entity and migration | D1.1 | ✅ |
| D1.4 | Seed initial admin user | D1.1 | ⏭️ M2 |

#### Authentication System
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| A1.1 | Implement password hashing service (BCrypt) | B1.2 | ✅ |
| A1.2 | Implement JWT token generation service | B1.2 | ✅ |
| A1.3 | Implement refresh token service | A1.2, D1.3 | ✅ |
| A1.4 | Create auth middleware (cookie-based JWT) | A1.2 | ✅ |
| A1.5 | POST /api/auth/register endpoint | D1.1, A1.1 | ✅ |
| A1.6 | POST /api/auth/login endpoint | A1.2, A1.3 | ✅ |
| A1.7 | POST /api/auth/logout endpoint | A1.4 | ✅ |
| A1.8 | POST /api/auth/refresh endpoint | A1.3 | ✅ |
| A1.9 | POST /api/auth/forgot-password endpoint | D1.1 | ✅ |
| A1.10 | POST /api/auth/reset-password endpoint | A1.9 | ✅ |
| A1.11 | POST /api/auth/verify-email endpoint | D1.1 | ✅ |

#### Email Infrastructure
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| E1.1 | Configure Resend email service | B1.2 | ⏭️ M2 |
| E1.2 | Create email template service | E1.1 | ⏭️ M2 |
| E1.3 | Implement verification email | E1.2, A1.5 | ⏭️ M2 |
| E1.4 | Implement password reset email | E1.2, A1.9 | ⏭️ M2 |

#### Frontend Setup
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| F1.1 | Create Next.js 14 project with App Router | None | ✅ |
| F1.2 | Configure TypeScript strict mode | F1.1 | ✅ |
| F1.3 | Set up Tailwind CSS | F1.1 | ✅ |
| F1.4 | Install and configure shadcn/ui | F1.3 | ✅ |
| F1.5 | Set up design system tokens (colors, typography) | F1.4 | ✅ |
| F1.6 | Create base layout components (Header, Footer) | F1.5 | ⏭️ M2 |
| F1.7 | Configure API client (fetch wrapper with cookies) | F1.1 | ✅ |
| F1.8 | Set up React Query for server state | F1.7 | ✅ |
| F1.9 | Create auth context/provider | F1.8 | ✅ |

#### Auth Pages
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P1.1 | Landing page (/) | F1.6 | ✅ |
| P1.2 | Login page (/login) | F1.9, A1.6 | ✅ |
| P1.3 | Register page (/register) | F1.9, A1.5 | ✅ |
| P1.4 | Forgot password page (/forgot-password) | F1.9, A1.9 | ✅ |
| P1.5 | Reset password page (/reset-password/[token]) | F1.9, A1.10 | ✅ |
| P1.6 | Email verification page (/verify-email/[token]) | F1.9, A1.11 | ⏭️ M2 |
| P1.7 | Auth route protection middleware | F1.9 | ✅ |

#### Testing Setup
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| T1.1 | Configure xUnit test project (backend) | B1.2 | ⏭️ M2 |
| T1.2 | Set up test fixtures and helpers | T1.1 | ⏭️ M2 |
| T1.3 | Write auth service unit tests | A1.1-A1.3, T1.2 | ⏭️ M2 |
| T1.4 | Configure Vitest (frontend) | F1.1 | ⏭️ M2 |
| T1.5 | Set up React Testing Library | T1.4 | ⏭️ M2 |
| T1.6 | Write auth form component tests | P1.2-P1.5, T1.5 | ⏭️ M2 |

### 2.2 Definition of Done

- [x] User can register with email/password
- [ ] User receives verification email *(deferred to M2 - email service)*
- [ ] User can verify email via link *(deferred to M2 - email service)*
- [x] User can login and receive JWT cookie
- [x] User can logout (cookie cleared)
- [x] User can request password reset
- [x] User can reset password via email link
- [x] Protected routes redirect to login
- [x] All auth endpoints have validation
- [ ] Unit tests pass for auth services *(deferred to M2)*
- [x] API documented in Scalar (OpenAPI)

### 2.3 Deliverables

- ✅ Backend API running locally (ASP.NET Core 9, Clean Architecture)
- ✅ Frontend app running locally (Next.js 16, TypeScript, Tailwind, shadcn/ui)
- ✅ Docker Compose for local development (PostgreSQL 16, Redis 7)
- ✅ Database with User, RefreshToken tables
- ✅ Working auth flow end-to-end (register, login, logout, password reset)
- ⏭️ Email service integration (deferred to M2)
- ⏭️ Testing infrastructure (deferred to M2)

---

## 3. Milestone 2: Core Tracking ✅ COMPLETE

**Goal**: Implement cycle, stage run, tumbler, and photo management.

**Completed**: 2025-11-30 (R2 photo storage deferred)

### 3.1 Tasks

#### Database Schema (Tracking)
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| D2.1 | Create Tumbler entity and migration | M1 Complete | ✅ |
| D2.2 | Create Cycle entity and migration | D2.1 | ✅ |
| D2.3 | Create StageRun entity and migration | D2.2 | ✅ |
| D2.4 | Create Photo entity and migration | D2.3 | ✅ |
| D2.5 | Create StageMaterial entity and migration | D2.3 | ✅ |
| D2.6 | Create CleaningRun entity and migration | D2.3 | ✅ |
| D2.7 | Create CleaningMaterial entity and migration | D2.6 | ✅ |
| D2.8 | Create CycleSpecimen entity and migration | D2.2 | ✅ |

#### Image Storage
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| I2.1 | Configure Cloudflare R2 client | M1 Complete | ✅ |
| I2.2 | Implement image upload service | I2.1 | ✅ |
| I2.3 | Implement image resize/compression (ImageSharp) | I2.2 | 🔜 Ready |
| I2.4 | Generate signed URLs for private images | I2.1 | ⏭️ Not needed (public bucket) |
| I2.5 | Implement image deletion service | I2.1 | ✅ |

#### Tumbler API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B2.1 | GET /api/tumblers - List user's tumblers | D2.1 | ✅ |
| B2.2 | POST /api/tumblers - Create tumbler | D2.1 | ✅ |
| B2.3 | GET /api/tumblers/:id - Get tumbler | D2.1 | ✅ |
| B2.4 | PUT /api/tumblers/:id - Update tumbler | D2.1 | ✅ |
| B2.5 | DELETE /api/tumblers/:id - Soft delete tumbler | D2.1 | ✅ |

#### Cycle API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B2.6 | GET /api/cycles - List user's cycles (with filters) | D2.2 | ✅ |
| B2.7 | POST /api/cycles - Create cycle | D2.2 | ✅ |
| B2.8 | GET /api/cycles/:id - Get cycle with stages | D2.2 | ✅ |
| B2.9 | PUT /api/cycles/:id - Update cycle | D2.2 | ✅ |
| B2.10 | DELETE /api/cycles/:id - Soft delete cycle | D2.2 | ✅ |
| B2.11 | POST /api/cycles/:id/complete - Complete cycle | D2.2 | ✅ |
| B2.12 | POST /api/cycles/:id/archive - Archive cycle | D2.2 | ✅ |

#### Stage Run API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B2.13 | POST /api/cycles/:id/stages - Add stage to cycle | D2.3 | ✅ |
| B2.14 | GET /api/stages/:id - Get stage with materials/photos | D2.3 | ✅ |
| B2.15 | PUT /api/stages/:id - Update stage | D2.3 | ✅ |
| B2.16 | DELETE /api/stages/:id - Delete stage | D2.3 | ✅ |
| B2.17 | POST /api/stages/:id/complete - Complete stage | D2.3 | ✅ |
| B2.18 | POST /api/stages/:id/materials - Add material | D2.5 | ✅ |
| B2.19 | DELETE /api/stages/:stageId/materials/:id - Remove material | D2.5 | ✅ |

#### Photo API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B2.20 | POST /api/stages/:id/photos - Upload photo(s) | D2.4, I2.2 | ✅ |
| B2.21 | DELETE /api/photos/:id - Delete photo | D2.4, I2.5 | ✅ |
| B2.22 | PUT /api/photos/:id - Update photo label | D2.4 | ✅ |

#### Cleaning Run API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B2.23 | POST /api/stages/:id/cleaning - Add cleaning run | D2.6 | ✅ |
| B2.24 | PUT /api/cleaning/:id - Update cleaning run | D2.6 | ✅ |
| B2.25 | DELETE /api/cleaning/:id - Delete cleaning run | D2.6 | ✅ |

#### Frontend - Tumblers
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P2.1 | Tumbler list page (/tumblers) | B2.1 | ✅ |
| P2.2 | New tumbler page (/tumblers/new) | B2.2 | ✅ |
| P2.3 | Edit tumbler page (/tumblers/:id) | B2.4 | ✅ |
| P2.4 | Delete tumbler confirmation modal | B2.5 | ✅ |

#### Frontend - Cycles
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P2.5 | Dashboard page (/dashboard) with active cycles | B2.6 | ✅ |
| P2.6 | Cycle list page (/cycles) with tabs | B2.6 | ✅ |
| P2.7 | New cycle page (/cycles/new) | B2.7 | ✅ |
| P2.8 | Cycle detail page (/cycles/:id) | B2.8 | ✅ |
| P2.9 | Edit cycle page (/cycles/:id/edit) | B2.9 | ⏭️ M3 |
| P2.10 | Complete/archive cycle actions | B2.11, B2.12 | ✅ |

#### Frontend - Stage Runs
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P2.11 | Add stage dialog (in cycle detail) | B2.13 | ✅ |
| P2.12 | Stage run detail page (/stages/:id) | B2.14 | ⏭️ M3 |
| P2.13 | Edit stage run page (/stages/:id/edit) | B2.15 | ⏭️ M3 |
| P2.14 | Photo upload component (placeholder) | B2.20 | ✅ (placeholder) |
| P2.15 | Photo gallery component with lightbox | B2.14 | ⏸️ Deferred (R2) |
| P2.16 | Material picker component | B2.18 | ⏭️ M3 |
| P2.17 | Cleaning run form component | B2.23 | ⏭️ M3 |

#### Shared Components
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| C2.1 | TumblerSelect component | P2.1 | ✅ (basic) |
| C2.2 | SpecimenPicker component (free-text for now) | P2.7 | ✅ |
| C2.3 | DurationInput component | P2.11 | ✅ (basic) |
| C2.4 | DateTimePicker component | P2.7, P2.11 | ⏭️ M3 |
| C2.5 | Empty state component | P2.1, P2.6 | ✅ |
| C2.6 | Confirmation modal component (AlertDialog) | P2.4 | ✅ |

### 3.2 Definition of Done

- [x] User can CRUD tumblers
- [x] User can CRUD cycles with specimens (free-text)
- [x] User can add/edit/complete stage runs
- [x] User can upload photos (up to 10 per stage)
- [ ] Photos are resized and stored in R2 *(resize deferred)*
- [ ] User can add materials to stages *(UI deferred to M3)*
- [ ] User can add cleaning runs to stages *(UI deferred to M3)*
- [x] Dashboard shows active cycles with progress
- [x] Cycle list has working tabs (Active/Completed/Archived)
- [x] All forms have proper validation
- [x] Mobile-responsive layouts

### 3.3 Deliverables

- ✅ Complete tumbler management (list, create, edit, delete)
- ✅ Complete cycle management (list, create, detail, complete, archive, delete)
- ✅ Stage run management (add, complete, delete from cycle detail)
- ✅ Photo upload placeholder UI (R2 integration pending)
- ✅ Dashboard with active cycles and stats
- ✅ All database entities and migrations
- ✅ Mapster object mapping configured
- ✅ App shell with sidebar navigation

---

## 4. Milestone 3: Reference Data ✅ COMPLETE

**Goal**: Implement specimens, materials, and the Learn section.

**Completed**: 2025-11-30

### 4.1 Tasks

#### Database Schema (Reference)
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| D3.1 | Create Specimen entity and migration | M2 Complete | ✅ |
| D3.2 | Create Material entity and migration | D3.1 | ✅ |
| D3.3 | Seed specimen data (initial list) | D3.1 | ✅ |
| D3.4 | Seed material data (grits, polishes, etc.) | D3.2 | ✅ |

#### Specimen API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B3.1 | GET /api/specimens - List specimens (public) | D3.1 | ✅ |
| B3.2 | GET /api/specimens/:id - Get specimen detail | D3.1 | ✅ |
| B3.3 | GET /api/specimens/search - Search specimens | D3.1 | ✅ (merged with B3.1) |
| B3.4 | POST /api/admin/specimens - Create specimen (admin) | D3.1 | ✅ |
| B3.5 | PUT /api/admin/specimens/:id - Update specimen (admin) | D3.1 | ✅ |

#### Material API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B3.6 | GET /api/materials - List materials (public) | D3.2 | ✅ |
| B3.7 | GET /api/materials/:id - Get material detail | D3.2 | ✅ |
| B3.8 | GET /api/materials/search - Search materials | D3.2 | ✅ (merged with B3.6) |
| B3.9 | POST /api/admin/materials - Create material (admin) | D3.2 | ✅ |
| B3.10 | PUT /api/admin/materials/:id - Update material (admin) | D3.2 | ✅ |

#### Cycle-Specimen Integration
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B3.11 | Update cycle creation to use specimen picker | D3.3 | ⏭️ Future |
| B3.12 | Implement hardness compatibility warnings | D3.3 | ⏭️ Future |
| B3.13 | Update stage material selection from master list | D3.4 | ⏭️ Future |

#### Frontend - Learn Section
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P3.1 | Specimens list page (/learn/specimens) | B3.1 | ✅ |
| P3.2 | Specimen detail page (modal dialog) | B3.2 | ✅ |
| P3.3 | Materials list page (/learn/materials) | B3.6 | ✅ |
| P3.4 | Material detail page (modal dialog) | B3.7 | ✅ |
| P3.5 | Search/filter functionality for specimens | B3.3 | ✅ |
| P3.6 | Search/filter functionality for materials | B3.8 | ✅ |
| P3.7 | FAQ page (/learn/faq) | None | ✅ |

#### Component Updates
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| C3.1 | Update SpecimenPicker to use API lookup | B3.1, P2.7 | ⏭️ Future |
| C3.2 | Create MaterialPicker with API lookup | B3.6, P2.16 | ⏭️ Future |
| C3.3 | Create HardnessWarning component | B3.12 | ⏭️ Future |
| C3.4 | Update sidebar navigation with Learn links | P3.1, P3.3 | ✅ |

### 4.2 Definition of Done

- [x] Specimen database seeded with initial data (30+ specimens)
- [x] Material database seeded with initial data (20+ materials)
- [x] Specimens list page with search/filter
- [x] Specimen detail page with hardness info
- [x] Materials list page with category filter
- [x] Material detail page with usage info
- [ ] Cycle creation uses specimen picker from database *(deferred - works with free-text)*
- [ ] Stage run uses material picker from database *(deferred - future enhancement)*
- [ ] Hardness warnings display when mixing incompatible specimens *(deferred)*
- [x] FAQ page with common questions

### 4.3 Deliverables

- ✅ Searchable specimen database (30+ rocks/minerals with hardness data)
- ✅ Searchable material database (20+ grits/polishes/media)
- ✅ Learn section pages (/learn/specimens, /learn/materials, /learn/faq)
- ✅ Navigation updated with Learn section
- ⏭️ Updated cycle/stage forms with pickers (future enhancement)
- ⏭️ Hardness compatibility system (future enhancement)

---

## 5. Milestone 4: Social Features ✅ COMPLETE

**Goal**: Implement public posts, gallery, voting, and comments.

**Completed**: 2025-11-30 (Photo selection deferred pending R2 setup)

### 5.1 Tasks

#### Database Schema (Social)
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| D4.1 | Create Post entity and migration | M3 Complete | ✅ |
| D4.2 | Create PostPhoto entity and migration | D4.1 | ✅ |
| D4.3 | Create Vote entity and migration | D4.1 | ✅ |
| D4.4 | Create Comment entity and migration | D4.1 | ✅ |
| D4.5 | Create CommentReport entity and migration | D4.4 | ✅ |

#### Post API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B4.1 | POST /api/posts - Create post from cycle | D4.1, D4.2 | ✅ |
| B4.2 | GET /api/posts - List public posts (gallery) | D4.1 | ✅ |
| B4.3 | GET /api/posts/:id - Get post detail | D4.1 | ✅ |
| B4.4 | PUT /api/posts/:id - Update post | D4.1 | ✅ |
| B4.5 | DELETE /api/posts/:id - Delete post | D4.1 | ✅ |
| B4.6 | GET /api/posts/user/:username - User's posts | D4.1 | ✅ |

#### Voting API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B4.7 | POST /api/posts/:id/vote - Add vote | D4.3 | ✅ |
| B4.8 | DELETE /api/posts/:id/vote - Remove vote | D4.3 | ✅ |
| B4.9 | GET /api/posts/:id/votes - Get vote count | D4.3 | ✅ |

#### Comment API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B4.10 | GET /api/posts/:id/comments - List comments | D4.4 | ✅ |
| B4.11 | POST /api/posts/:id/comments - Add comment | D4.4 | ✅ |
| B4.12 | PUT /api/posts/comments/:id - Edit comment | D4.4 | ✅ |
| B4.13 | DELETE /api/posts/comments/:id - Delete comment | D4.4 | ✅ |
| B4.14 | POST /api/posts/comments/:id/report - Report comment | D4.5 | ✅ |

#### User Profile API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B4.15 | GET /api/users/:username - Get public profile | M1 Complete | ⏭️ Future |
| B4.16 | GET /api/users/:username/stats - Get user stats | D4.1, D4.3 | ⏭️ Future |

#### Frontend - Gallery
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P4.1 | Gallery page (/gallery) with grid layout | B4.2 | ✅ |
| P4.2 | Gallery sort options (newest, most votes, etc.) | B4.2 | ✅ |
| P4.3 | Post card component | P4.1 | ✅ |
| P4.4 | Infinite scroll for gallery | P4.1 | ⏭️ Future |

#### Frontend - Post Detail
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P4.5 | Post detail page (/gallery/:postId) | B4.3 | ✅ |
| P4.6 | Photo carousel component | P4.5 | ✅ |
| P4.7 | Cycle summary display (read-only) | P4.5 | ✅ |
| P4.8 | Vote button ("Ugly Rocks") | B4.7, B4.8 | ✅ |
| P4.9 | Comment thread component | B4.10 | ✅ |
| P4.10 | Comment form component | B4.11 | ✅ |
| P4.11 | Report comment modal | B4.14 | ⏭️ Future |

#### Frontend - Sharing
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P4.12 | Share cycle page (/cycles/:id/share) | B4.1 | ✅ |
| P4.13 | Photo selection for post | P4.12 | ⏸️ Deferred (R2) |
| P4.14 | Edit post page (/posts/:id/edit) | B4.4 | ⏭️ Future |
| P4.15 | Delete post confirmation | B4.5 | ⏭️ Future |

#### Frontend - User Profile
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P4.16 | User profile page (/user/:username) | B4.15 | ⏭️ Future |
| P4.17 | Profile stats display | B4.16 | ⏭️ Future |
| P4.18 | User's posts list | B4.6 | ⏭️ Future |

### 5.2 Definition of Done

- [x] User can create post from completed cycle
- [ ] User can select which photos to include *(deferred - R2 setup)*
- [x] Gallery displays public posts with sorting
- [x] Post detail shows photos, cycle info, comments
- [x] Users can vote ("Ugly Rocks") on posts
- [x] Users can comment on posts
- [x] Users can reply to comments
- [x] Users can report inappropriate comments (API ready)
- [ ] User profile shows posts and stats *(deferred)*
- [x] Anonymous users can view gallery/posts
- [x] Login prompt for voting/commenting when logged out

### 5.3 Deliverables

- ✅ Public gallery with grid layout and sorting
- ✅ Post detail with photo carousel
- ✅ Voting system ("Ugly Rocks")
- ✅ Comment thread with replies
- ✅ Share cycle page with form
- ⏸️ Photo selection for posts (deferred - R2 setup)
- ⏭️ User profile pages (future)
- ⏭️ Infinite scroll (future)

---

## 6. Milestone 5: Polish ✅ COMPLETE

**Completed**: 2025-12-01

**Goal**: Implement settings, notifications, export, and admin tools.

### 6.1 Tasks

#### Settings API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B5.1 | GET /api/users/me/settings - Get user settings | M4 Complete | ✅ |
| B5.2 | PUT /api/users/me/settings - Update settings | B5.1 | ✅ |
| B5.3 | PUT /api/users/me/profile - Update profile | B5.1 | ✅ |
| B5.4 | PUT /api/users/me/password - Change password | B5.1 | ✅ |
| B5.5 | POST /api/users/me/avatar - Upload avatar | B5.1 | ⏸️ Deferred (R2) |
| B5.6 | DELETE /api/users/me - Deactivate account | B5.1 | ✅ |

#### Notification System
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B5.7 | Configure Hangfire for background jobs | M1 Complete | ✅ |
| B5.8 | Implement stage reminder job | B5.7 | ✅ |
| B5.9 | Implement comment notification email | B5.7, D4.4 | ✅ |
| B5.10 | Implement first vote notification email | B5.7, D4.3 | ✅ |
| B5.11 | Implement milestone notification emails | B5.7 | ✅ |

#### Export API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B5.12 | GET /api/export/cycles - Export cycles as CSV | M2 Complete | ✅ |
| B5.13 | GET /api/export/cycles/:id - Export single cycle | B5.12 | ✅ |
| B5.14 | POST /api/export/full - Request full data export (GDPR) | B5.12 | ✅ |

#### Admin API
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| B5.15 | GET /api/admin/reports - List comment reports | D4.5 | ✅ |
| B5.16 | PUT /api/admin/reports/:id - Resolve report | B5.15 | ✅ |
| B5.17 | DELETE /api/admin/comments/:id - Admin delete comment | D4.4 | ✅ |
| B5.18 | GET /api/admin/users - List users (paginated) | M1 Complete | ✅ |
| B5.19 | PUT /api/admin/users/:id/role - Change user role | B5.18 | ✅ |
| B5.20 | PUT /api/admin/users/:id/ban - Ban user | B5.18 | ✅ |

#### Frontend - Settings
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P5.1 | Settings layout with sidebar navigation | B5.1 | ✅ |
| P5.2 | Profile settings page (/settings/profile) | B5.3 | ✅ |
| P5.3 | Avatar upload component | B5.5 | ⏸️ Deferred (R2) |
| P5.4 | Preferences page (/settings/preferences) | B5.2 | ✅ |
| P5.5 | Notifications page (/settings/notifications) | B5.2 | ⏭️ Future |
| P5.6 | Account page (/settings/account) | B5.4, B5.6 | ✅ |
| P5.7 | Export data section | B5.12, B5.14 | ✅ |

#### Frontend - Admin
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P5.8 | Admin dashboard (/admin) | B5.15 | ✅ |
| P5.9 | Moderation queue (/admin/moderation) | B5.15, B5.16 | ✅ |
| P5.10 | User management (/admin/users) | B5.18 | ✅ |
| P5.11 | Ban user confirmation modal | B5.20 | ✅ |
| P5.12 | Specimen management (/admin/specimens) | B3.4 | ✅ |
| P5.13 | Material management (/admin/materials) | B3.9 | ✅ |

#### Frontend - Legal Pages
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| P5.14 | Privacy Policy page (/privacy) | None | ✅ |
| P5.15 | Terms of Service page (/terms) | None | ✅ |
| P5.16 | Cookie Policy page (/cookies) | None | ⏭️ Future |

### 6.2 Definition of Done

- [x] User can update profile (name, bio) *(avatar deferred - R2)*
- [x] User can change preferences (units, timezone, date format)
- [x] User can manage notification preferences
- [x] User can change password
- [x] User can deactivate account
- [x] User can export cycle data as CSV
- [x] User can request full data export (GDPR)
- [x] Stage reminders send email notifications
- [x] Comment/vote notifications work
- [x] Admin can view moderation queue
- [x] Admin can resolve reports
- [x] Admin can manage users (roles, bans)
- [x] Admin can manage specimens/materials
- [x] Legal pages are in place (Privacy, Terms)

### 6.3 Deliverables

- ✅ Settings pages (profile, preferences, account)
- ✅ Background job infrastructure (Hangfire with PostgreSQL)
- ✅ Email notification system (Resend integration)
- ✅ Data export functionality (CSV + GDPR ZIP)
- ✅ Admin dashboard and tools (dashboard, moderation queue, user management)
- ✅ Legal pages (Privacy, Terms)

---

## 7. Milestone 6: Launch Prep 🔄 IN PROGRESS

**Goal**: Performance optimization, security audit, and production deployment.

**Started**: 2025-12-01

### 7.1 Tasks

#### Performance
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| O6.1 | Implement Redis caching for specimens/materials | M5 Complete | ✅ |
| O6.2 | Implement Redis caching for gallery (hot posts) | O6.1 | ✅ |
| O6.3 | Add database indexes for common queries | M5 Complete | ✅ |
| O6.4 | Optimize photo loading (lazy load, blur placeholder) | M2 Complete | ⏸️ Deferred (R2) |
| O6.5 | Implement API response compression | M1 Complete | ✅ |
| O6.6 | Frontend bundle analysis and optimization | M5 Complete | ✅ |
| O6.7 | Implement React Query cache strategies | O6.6 | ✅ |
| O6.8 | Add loading skeletons to all pages | O6.6 | ✅ |

#### Security Audit
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| S6.1 | Review all endpoints for authorization | M5 Complete | ✅ |
| S6.2 | Implement rate limiting on sensitive endpoints | M1 Complete | ✅ |
| S6.3 | Add CSRF protection | M1 Complete | ✅ |
| S6.4 | Audit file upload validation | M2 Complete | ✅ |
| S6.5 | Review SQL injection prevention | M3 Complete | ✅ |
| S6.6 | Implement content security policy | M5 Complete | ✅ |
| S6.7 | Security headers configuration | S6.6 | ✅ |
| S6.8 | Dependency vulnerability scan | M5 Complete | ✅ |

#### Testing
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| T6.1 | Integration tests for critical paths | M5 Complete | ⏳ |
| T6.2 | E2E tests for auth flow | M5 Complete | ⏳ |
| T6.3 | E2E tests for cycle creation | T6.2 | ⏳ |
| T6.4 | E2E tests for gallery/voting | T6.3 | ⏳ |
| T6.5 | Load testing with k6 or similar | T6.1 | ⏳ |
| T6.6 | Mobile responsiveness testing | M5 Complete | ⏳ |
| T6.7 | Cross-browser testing | T6.6 | ⏳ |
| T6.8 | Accessibility audit (Lighthouse, axe) | T6.6 | ⏳ |

#### Deployment
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| D6.1 | Set up Kubernetes local development (Docker Desktop K8s) | All above | ✅ |
| D6.2 | Create K8s namespace and secrets management | D6.1 | ✅ |
| D6.3 | Deploy PostgreSQL to K8s with persistent storage | D6.2 | ✅ |
| D6.4 | Deploy Redis to K8s | D6.2 | ✅ |
| D6.5 | Deploy API to K8s with secrets injection | D6.3, D6.4 | ✅ |
| D6.6 | Deploy Web frontend to K8s | D6.5 | ✅ |
| D6.7 | Update Dockerfile for repo-root build context | D6.5 | ✅ |
| D6.8 | Configure seed data in Docker image | D6.7 | ✅ |
| D6.9 | Configure Railway production environment | D6.6 | ⏳ |
| D6.10 | Configure Cloudflare R2 production bucket | D6.9 | ⏳ |
| D6.11 | Set up custom domain with SSL | D6.9 | ⏳ |
| D6.12 | Set up GitHub Actions CI/CD pipeline | D6.11 | ⏳ |
| D6.13 | Configure database backup schedule | D6.9 | ⏳ |
| D6.14 | Set up error monitoring (Sentry or similar) | D6.12 | ⏳ |
| D6.15 | Set up uptime monitoring | D6.12 | ⏳ |
| D6.16 | Create runbook for common operations | D6.12 | ⏳ |

#### Documentation
| Task | Description | Dependencies | Status |
|------|-------------|--------------|--------|
| X6.1 | API documentation (Swagger/OpenAPI) | M5 Complete | ✅ |
| X6.2 | User guide / help content | M5 Complete | ⏳ |
| X6.3 | Admin guide | P5.8 | ⏳ |
| X6.4 | Deployment documentation | D6.11 | ⏳ |

### 7.2 Definition of Done

- [ ] Page load times < 2 seconds
- [ ] Lighthouse performance score > 80
- [ ] Lighthouse accessibility score > 90
- [x] All security headers in place
- [x] Rate limiting active
- [x] No critical/high vulnerabilities
- [ ] E2E tests pass
- [ ] Load test shows acceptable performance
- [ ] Production environment running
- [ ] CI/CD pipeline working
- [ ] Monitoring and alerting active
- [ ] Backups configured and tested
- [ ] Documentation complete

### 7.3 Deliverables

- Production-ready application
- Optimized performance
- Security hardened
- Monitored and logged
- Documented

---

## 8. Task Dependencies Diagram

```
M1: Foundation
├── Backend Setup ─────────────────┐
├── Database Schema (Core) ────────┼──► Auth System ──► Email Infrastructure
├── Frontend Setup ────────────────┘         │
└── Auth Pages ◄───────────────────────────┘

M2: Core Tracking (requires M1)
├── Database Schema (Tracking) ──► Tumbler API ──► Cycle API ──► Stage API
├── Image Storage ───────────────► Photo API
└── Frontend Pages ◄─────────────────────────────────────────────────────┘

M3: Reference Data (requires M2)
├── Database Schema (Reference) ──► Specimen API ──► Material API
├── Seed Data ──────────────────────────────────────────────────┐
└── Learn Section Pages ◄───────────────────────────────────────┘

M4: Social Features (requires M3)
├── Database Schema (Social) ──► Post API ──► Vote API ──► Comment API
├── User Profile API
└── Gallery + Post Detail + Profile Pages ◄──────────────────────────────┘

M5: Polish (requires M4)
├── Settings API ──► Notification System
├── Export API
├── Admin API
└── Settings + Admin Pages ◄─────────────────────────────────────────────┘

M6: Launch Prep (requires M5)
├── Performance Optimization
├── Security Audit
├── Testing
└── Deployment
```

---

## 9. Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Image storage costs | Implement compression, set reasonable limits, monitor usage |
| Database performance | Add indexes early, use query profiling, implement caching |
| Scope creep | Strict milestone boundaries, defer "nice to haves" |
| Auth vulnerabilities | Use proven patterns, security audit before launch |
| Mobile experience | Mobile-first design, test on real devices throughout |
| Third-party dependencies | Have backup options, abstract behind interfaces |

---

## 10. Recent Session Updates

### Session: 2025-12-01 - Tumbler Form Improvements

#### Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| Tumbler Model Seed Data | Added 23 tumbler models to database (Lortone, Thumler's, National Geographic, Harbor Freight, Raytech, MJR Tumblers, Generic, Other, DIY) | ✅ |
| Cascading Brand/Model Dropdowns | Implemented cascading dropdown pattern on `/tumblers/new` - brand selection filters available models | ✅ |
| Auto-Population Logic | Type, barrel count, and motor capacity auto-populate when model is selected | ✅ |
| ADR-001 Motor Capacity Logic | Motor capacity editable only for Generic/Other/DIY/MJR Tumblers; MJR capped at 50 lbs | ✅ |
| Theme Color Fixes | Fixed hardcoded colors in dashboard to use CSS variables; adjusted heading brightness | ✅ |
| Mobile LAN Testing Config | API bound to 0.0.0.0, CORS configured for LAN IPs, cookie settings for cross-origin | ✅ |

#### Technical Details

- **Files Modified**:
  - `src/web/src/app/(protected)/tumblers/new/page.tsx` - Cascading dropdowns, form logic
  - `src/api/MyUglyRocks.Infrastructure/Data/SeedDataService.cs` - Tumbler model seeding

- **Key Patterns**:
  - `form.watch()` + `useMemo` for cascading dropdown state
  - `useEffect` hooks for auto-population
  - `useTumblerModels` hook for fetching reference data

---

### Session: 2025-12-01 - Bug Fixes & Seed Data Expansion

#### Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| Tumbler Model Seed Data Expansion | Merged comprehensive tumbler model list - now ~100 models across 22 brands | ✅ |
| NullReferenceException Fix | Fixed 500 error when creating tumbler - null check for TumblerModel in Mapster mapping | ✅ |
| Mapster Null Safety Audit | Added null checks to 4 additional mappings: Barrel→BarrelDto, StageRun→StageRunDto, StageMaterial→StageMaterialDto, CleaningMaterial→CleaningMaterialDto | ✅ |
| Obsolete Seed File Cleanup | Deleted obsolete `docs/seed-data/tumblers-seed.csv` (replaced by `tumbler-models-seed.csv`) | ✅ |

#### Technical Details

- **Files Modified**:
  - `src/api/MyUglyRocks.Core/Mappings/MappingConfig.cs` - Null safety fixes for navigation properties
  - `docs/seed-data/tumbler-models-seed.csv` - Expanded to ~100 tumbler models

- **Bug Fix Details** (MappingConfig.cs):
  | Line | Issue | Fix |
  |------|-------|-----|
  | 18 | `src.TumblerModel!.MotorCapacityLbs` threw NullReferenceException | Added null check: `src.TumblerModel != null ? ... : null` |
  | 35 | `srb.StageRun.Status` could throw if navigation not loaded | Added null check: `srb.StageRun != null && ...` |
  | 73 | `srb.Barrel` could be null | Added `.Where(srb => srb.Barrel != null)` filter |
  | 110, 113 | `src.Material.CommonName` could throw | Added null check: `src.Material != null ? ... : null` |

- **New Tumbler Brands Added**:
  - Covington Engineering, Diamond Pacific, Gy-Roc, Highland Park, Lot-o-Tumbler
  - Tumble-Bee, Rebel 17, VEVOR, Leegol Electric, WireJewelry
  - Frankford Arsenal, Dan&Darci, Discover with Dr. Cool, NSI/Smithsonian, RELIGHTABLE

---

### Session: 2025-12-01 - Seed Data & Barrel Management UI

#### Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| BarrelNickname Seed Data | Added 359 barrel nicknames to SeedDataService with categories (Geology, Weather, Animals, etc.) | ✅ |
| Database Seed Order Fix | Fixed Program.cs to run migrations before seeding - was causing "relation 'users' does not exist" error | ✅ |
| Database Reset & Reseed | Dropped database and verified all seed data loads correctly (2 users, 33 specimens, 19 materials, 23 tumbler models, 359 barrel nicknames) | ✅ |
| Barrel Management UI | Added complete barrel management UI to `/tumblers/new` page with add/edit/delete functionality | ✅ |

#### Technical Details

- **Files Modified**:
  - `src/api/MyUglyRocks.Infrastructure/Data/SeedDataService.cs` - Added `SeedBarrelNicknamesAsync()` method with 359 nicknames
  - `src/api/MyUglyRocks.Api/Program.cs` - Added `db.Database.MigrateAsync()` before seeding to ensure schema exists
  - `src/web/src/app/(protected)/tumblers/new/page.tsx` - Complete barrel management UI with local state

- **Barrel Management Features**:
  - Local state management with `LocalBarrel` interface (id, barrelNumber, nickname, capacityLbs)
  - Auto-populates barrels from selected tumbler model
  - Add/Edit/Delete barrels with Dialog UI
  - Barrel renumbering on delete
  - Submit sends barrel array with nickname and capacity to API

- **Seed Data Structure**:
  ```csharp
  SeedAllAsync() calls in order:
  1. EnsureSystemUserAsync()
  2. EnsureTestUserAsync()  // test@myuglyrocks.local / Test123!
  3. SeedSpecimensAsync()
  4. SeedMaterialsAsync()
  5. SeedTumblerModelsAsync()
  6. SeedBarrelNicknamesAsync()  // NEW
  ```

---

### Session: 2025-12-01 (Evening) - Cycles Form Refinement

#### Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| Remove Goal & Expected Difficulty | Removed Goal and Expected Difficulty fields from `/cycles/new` form - deferred to future release | ✅ |
| Specimen Multi-Select Component | Created `SpecimenMultiSelect` component with searchable dropdown, column toggles, and theme-aware chips | ✅ |
| Specimen Validation Logic | Added validation requiring at least one of: specimens from dropdown OR "Other Specimens" text field | ✅ |
| Hardness Warning System | Added warning alert when selected specimens have >1 Mohs hardness difference | ✅ |
| Theme-Aware Chip Colors | Updated specimen chips to use CSS variables (`bg-primary/25`, `border-primary/50`) for theme compatibility | ✅ |
| Specimen Seed Data Fix | Fixed specimen CSV parsing - was only reading 13 columns, CSV had more; properly maps MaterialType and TumblingDifficulty | ✅ |
| Documentation Update | Updated `02-cycles.md` wireframe to reflect new form layout | ✅ |

#### Technical Details

- **Files Modified**:
  - `src/web/src/app/(protected)/cycles/new/page.tsx` - Removed Goal/Difficulty fields, added specimen validation
  - `src/web/src/components/specimen-multi-select.tsx` - New component with multi-select, search, hardness warning
  - `src/api/MyUglyRocks.Infrastructure/Data/SeedDataService.cs` - Fixed CSV parsing for specimens
  - `docs/wireframes/02-cycles.md` - Updated wireframe documentation

- **New Cycle Form Layout**:
  1. Start Date (required)
  2. Rocks/Specimens multi-select (required*)
  3. Other Specimens text area (required*)
  4. Cycle Name (auto-generated, editable)
  5. Notes (optional)

  *At least one specimen source required

- **SpecimenMultiSelect Features**:
  - Searchable dropdown (searches name, alias, variety, family)
  - Configurable column display (Common Name, Max Hardness, Alias, Variety, Rock Family)
  - Selected specimens shown as theme-aware chips with hardness values
  - Hardness warning alert when difference > 1 Mohs

- **Chip Styling Evolution**:
  - Initial: hardcoded `bg-slate-200 dark:bg-slate-700`
  - Final: theme-aware `bg-primary/25 text-foreground border border-primary/50`

---

### Session: 2025-12-03 - Kubernetes Local Development Setup

#### Overview

Implemented full Kubernetes deployment for local development, matching production architecture. Dev environment now runs identical to prod.

#### Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| K8s Namespace Setup | Created `myuglyrocks` namespace in Docker Desktop K8s | ✅ |
| Secrets Management | Implemented K8s Secrets for all sensitive config (DB, Redis, JWT, R2, Email) | ✅ |
| PostgreSQL Deployment | Deployed PostgreSQL 16 with PersistentVolumeClaim (5Gi) | ✅ |
| Redis Deployment | Deployed Redis 7 for caching | ✅ |
| API Deployment | Deployed .NET API with env vars from K8s secrets | ✅ |
| Web Deployment | Deployed Next.js frontend to K8s | ✅ |
| Dockerfile Updates | Updated API Dockerfile to use repo-root build context | ✅ |
| Seed Data in Image | Added seed CSV files to Docker image | ✅ |
| Web Dockerfile | Created Dockerfile for Next.js with standalone output | ✅ |
| Docker Compose Cleanup | Stopped old docker-compose containers | ✅ |
| Akeyless Removal | Removed Akeyless integration (complexity not needed for dev) | ✅ |
| R2 Credentials | Added Cloudflare R2 credentials to K8s secrets (ready for photo upload) | ✅ |

#### Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                 myuglyrocks namespace                          │
│                                                                │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │    web     │───▶│     api      │───▶│   postgres   │       │
│  │  (Next.js) │    │   (.NET 9)   │    │  (16-alpine) │       │
│  │  :3000     │    │   :8080      │    │   :5432      │       │
│  └────────────┘    └──────────────┘    └──────────────┘       │
│                           │                   │                │
│                           ▼           ┌───────┴───────┐       │
│                    ┌──────────────┐   │ postgres-pvc  │       │
│                    │    redis     │   │   (5Gi PV)    │       │
│                    │  (7-alpine)  │   └───────────────┘       │
│                    │   :6379      │                           │
│                    └──────────────┘                           │
│                                                                │
│  Secret: myuglyrocks-secrets                                  │
│    - postgres-password, db-connection-string                  │
│    - redis-connection-string, jwt-secret                      │
│    - r2-account-id, r2-access-key-id, r2-secret-access-key   │
│    - r2-bucket-name, resend-api-key                          │
└────────────────────────────────────────────────────────────────┘
```

#### Files Created/Modified

| File | Description |
|------|-------------|
| `k8s/base/namespace.yaml` | K8s namespace definition |
| `k8s/base/postgres-deployment.yaml` | PostgreSQL deployment with PVC |
| `k8s/base/redis-deployment.yaml` | Redis deployment |
| `k8s/base/api-deployment.yaml` | API deployment with secrets |
| `k8s/base/web-deployment.yaml` | Web frontend deployment |
| `k8s/base/app-secrets.yaml.example` | Template for secrets |
| `src/api/MyUglyRocks.Api/Dockerfile` | Updated for repo-root context |
| `src/web/Dockerfile` | New Dockerfile for Next.js |
| `src/web/next.config.ts` | Added `output: "standalone"` |
| `docker-compose.yml` | Updated build context |

#### Deleted Files (Akeyless Cleanup)

| File | Reason |
|------|--------|
| `src/api/MyUglyRocks.Api/Configuration/AkeylessConfigurationProvider.cs` | No longer needed |
| `k8s/base/akeyless-gateway.yaml` | No longer needed |

#### Access URLs (with port-forward)

| Service | URL | Command |
|---------|-----|---------|
| Web | https://localhost:3000 | `kubectl port-forward svc/myuglyrocks-web 3000:80 -n myuglyrocks` |
| API | https://localhost:5000 | `kubectl port-forward svc/myuglyrocks-api 5000:80 -n myuglyrocks` |
| PostgreSQL | localhost:5432 | `kubectl port-forward svc/postgres 5432:5432 -n myuglyrocks` |

#### Secrets Management

Secrets are stored in K8s Secret `myuglyrocks-secrets` and backed up in KeePass. To recreate:

```bash
kubectl create secret generic myuglyrocks-secrets --namespace myuglyrocks \
  --from-literal=postgres-password="YOUR_PASSWORD" \
  --from-literal=db-connection-string="Host=postgres;Database=myuglyrocks;Username=postgres;Password=YOUR_PASSWORD" \
  --from-literal=redis-connection-string="redis:6379" \
  --from-literal=jwt-secret="YOUR_JWT_SECRET" \
  --from-literal=r2-account-id="YOUR_VALUE" \
  --from-literal=r2-access-key-id="YOUR_VALUE" \
  --from-literal=r2-secret-access-key="YOUR_VALUE" \
  --from-literal=r2-bucket-name="YOUR_VALUE" \
  --from-literal=resend-api-key="YOUR_VALUE"
```

#### Quick Start Commands

```bash
# Build images
docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
docker build -t myuglyrocks-web:latest -f src/web/Dockerfile .

# Deploy all
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/postgres-deployment.yaml
kubectl apply -f k8s/base/redis-deployment.yaml
kubectl apply -f k8s/base/api-deployment.yaml
kubectl apply -f k8s/base/web-deployment.yaml

# Port forward all services
kubectl port-forward svc/myuglyrocks-web 3000:80 -n myuglyrocks &
kubectl port-forward svc/myuglyrocks-api 5000:80 -n myuglyrocks &
kubectl port-forward svc/postgres 5432:5432 -n myuglyrocks &
```

---

### Session: 2025-12-08 - NodePort Services & CORS Fix

#### Overview

Configured K8s NodePort services for network-accessible development and fixed CORS issues preventing cross-origin API calls.

#### Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| NodePort Services | Configured services with stable ports: Web (30000), API (30001) | ✅ |
| CORS Port Fix | Fixed `appsettings.Development.json` - wrong port 3000 → 30000 for IP origin | ✅ |
| CORS Configuration | Updated `appsettings.json` with correct NodePort origins | ✅ |
| Specimen Multi-Select UX | Improved popover behavior - button hides when dropdown open | ✅ |

#### Technical Details

- **Root Cause of CORS Issue**:
  - `appsettings.Development.json` had `https://10.80.80.181:3000` but NodePort was 30000
  - Since K8s deployment uses `ASPNETCORE_ENVIRONMENT=Development`, this file overrides base config
  - Fixed by changing port to 30000

- **Files Modified**:
  - `src/api/MyUglyRocks.Api/appsettings.Development.json` - Fixed CORS origin port
  - `src/api/MyUglyRocks.Api/appsettings.json` - Updated CORS origins
  - `k8s/base/api-deployment.yaml` - NodePort 30001
  - `k8s/base/web-deployment.yaml` - NodePort 30000
  - `src/web/src/components/specimen-multi-select.tsx` - UX improvement

- **NodePort Configuration**:
  | Service | NodePort | Internal Port |
  |---------|----------|---------------|
  | Web | 30000 | 3000 |
  | API | 30001 | 8080 |

- **Access URLs (NodePort)**:
  - Web: `https://10.80.80.181:30000`
  - API: `https://10.80.80.181:30001`

- **Docker Rebuild Commands**:
  ```bash
  # Rebuild with no cache to ensure fresh image
  docker build --no-cache -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .

  # Force pod restart
  kubectl delete pod -l app=myuglyrocks-api -n myuglyrocks
  ```

---

### Session: 2025-12-09 - R2 Photo Upload & Runtime API Config

#### Overview

Fixed critical infrastructure issues: R2 photo upload signature errors, mixed content HTTPS errors, and enabled public access to R2 bucket.

#### Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| R2 Signature Fix | Fixed AWSSDK.S3 v4 signature mismatch - added `DisableDefaultChecksumValidation = true` | ✅ |
| Runtime API URL Config | Implemented runtime config endpoint (`/config`) to avoid rebuild on URL changes | ✅ |
| Mixed Content Fix | Fixed HTTPS web calling HTTP API - proper runtime config loading | ✅ |
| R2 Public URL Config | Added `R2__PublicUrl` to K8s secrets and API deployment | ✅ |
| R2 Public Access | Enabled public development URL on R2 bucket | ✅ |
| HTTPS Ingress | nginx-ingress on port 30443 with mkcert TLS certificates | ✅ |

#### Technical Details

- **R2 Signature Issue Root Cause**:
  - AWSSDK.S3 v4.0.0.3 sends `x-amz-checksum-crc32` headers by default
  - Cloudflare R2 doesn't support these checksum headers
  - Fix: Added `DisableDefaultChecksumValidation = true` to `PutObjectRequest`

- **Runtime API URL Solution**:
  - Created `/config` endpoint in Next.js (not `/api/config` to avoid nginx routing)
  - Uses `API_URL` env var (not `NEXT_PUBLIC_*`) for true runtime reading
  - Axios interceptor waits for config promise before first request
  - AuthProvider explicitly awaits config before refresh

- **R2 Public URL**:
  - Cloudflare provides `pub-{random}.r2.dev` URL (different from account ID pattern)
  - Added `r2-public-url` to K8s secrets
  - API deployment reads via `R2__PublicUrl` env var

#### Files Modified

| File | Description |
|------|-------------|
| `src/api/MyUglyRocks.Infrastructure/Services/R2StorageService.cs` | Added `DisableDefaultChecksumValidation = true` |
| `src/web/src/app/config/route.ts` | New runtime config endpoint |
| `src/web/src/lib/api.ts` | Runtime config fetching with axios interceptor |
| `src/web/src/providers/auth-provider.tsx` | Await config before auth refresh |
| `src/web/Dockerfile` | Removed build-time API URL arg |
| `k8s/base/web-deployment.yaml` | Changed to `API_URL` env var |
| `k8s/base/api-deployment.yaml` | Added `R2__PublicUrl` from secret |
| `CLAUDE.md` | Updated documentation for runtime config |

#### Architecture Update

```
Web Frontend                     nginx-ingress (:30443)               API + R2
┌─────────────┐                 ┌─────────────────────┐              ┌─────────────┐
│ Next.js     │ ──HTTPS──────▶ │ / → web             │              │ .NET API    │
│ /config     │                 │ /api → api          │ ──HTTPS───▶ │             │
│ returns     │                 │ TLS: mkcert         │              │ R2 Upload   │
│ API_URL     │                 └─────────────────────┘              └──────┬──────┘
└─────────────┘                                                             │
                                                                            ▼
                                                        ┌───────────────────────────────┐
                                                        │ Cloudflare R2                 │
                                                        │ pub-{id}.r2.dev (public)      │
                                                        │ dev-myuglyrocks-media bucket  │
                                                        └───────────────────────────────┘
```

#### Access URLs

| Service | URL |
|---------|-----|
| Web (HTTPS) | https://10.80.80.181:30443 |
| API (HTTPS) | https://10.80.80.181:30443/api |
| R2 Public | https://pub-b409015555184d2ea808e87b602b1da5.r2.dev |

#### Key Learnings

1. **Next.js `NEXT_PUBLIC_*` vars are inlined at build time** - use non-prefixed vars for runtime config
2. **nginx-ingress routes `/api/*` to backend** - use different path like `/config` for frontend API routes
3. **AWSSDK.S3 v4 has breaking changes for R2** - requires both `DisablePayloadSigning` and `DisableDefaultChecksumValidation`
4. **R2 public dev URL uses different ID than account ID** - must use Cloudflare-provided URL

---

## 11. Post-Launch Roadmap

Features to consider after initial launch:

| Feature | Priority | Notes | ADR |
|---------|----------|-------|-----|
| Flexible Barrel Configuration | High | 🔄 **Partially Complete**: Cascading dropdowns, motor capacity logic, seed data done. Remaining: multi-barrel stages, water amount tracking | [ADR-001](decisions/ADR-001-flexible-barrel-configuration.md) |
| Stage Planning | High | Pre-configure future stages (Planned status) | [ADR-001](decisions/ADR-001-flexible-barrel-configuration.md) |
| Cycle Merge | Medium | Combine specimens from multiple cycles | Future ADR |
| Easy Mode | Medium | Simplified tracking for beginners | |
| Push notifications | Medium | Browser push for reminders | |
| Social login (Google) | Medium | Alternative to email auth | |
| Advanced search/filters | Medium | More ways to find content | |
| Specimen suggestions | Low | User-submitted specimen requests | |
| Multiple languages | Low | i18n support | |
| Native mobile app | Low | If web adoption is strong | |
| API for third parties | Low | Public API for integrations | |

---

## 12. Next Steps

Current focus: **Milestone 6 - Launch Prep**

**Recently Completed:**
- ✅ Local K8s development environment (Docker Desktop)
- ✅ Full stack running in K8s (Web, API, PostgreSQL, Redis)
- ✅ K8s Secrets management (including R2 credentials)
- ✅ Seed data included in Docker images
- ✅ NodePort services for network access (Web: 30000, API: 30001)
- ✅ CORS configuration fixed for NodePort URLs
- ✅ Specimen multi-select UX improvements
- ✅ **R2 photo upload working** (fixed SDK v4 signature issues)
- ✅ **Runtime API URL config** (no rebuild needed for URL changes)
- ✅ **HTTPS via nginx-ingress** (mkcert TLS on port 30443)
- ✅ **R2 public bucket access** enabled

**Next:**
1. **Image resizing** (I2.3) - Implement ImageSharp resize on upload
2. Complete remaining E2E tests (T6.2-T6.4)
3. Perform load testing (T6.5)
4. Complete mobile responsiveness testing (T6.6)
5. Set up production deployment on Railway (D6.9-D6.16)
6. Configure custom domain for R2 (production)
