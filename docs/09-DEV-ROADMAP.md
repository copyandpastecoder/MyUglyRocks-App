# MyUglyRocks - Development Roadmap

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-01-XX |
| Status | Draft |
| Related | [01-PRD.md](01-PRD.md), [06-ARCHITECTURE.md](06-ARCHITECTURE.md) |

---

## 1. Overview

This document defines the development milestones for building MyUglyRocks. Each milestone represents a deployable increment of functionality, allowing for iterative development and early feedback.

### 1.1 Milestone Summary

| Milestone | Name | Focus | Est. Complexity |
|-----------|------|-------|-----------------|
| M1 | Foundation | Project scaffolding, database, auth | High |
| M2 | Core Tracking | Cycles, stages, tumblers, photos | High |
| M3 | Reference Data | Specimens, materials, Learn section | Medium |
| M4 | Social Features | Posts, gallery, voting, comments | Medium |
| M5 | Polish | Settings, notifications, export | Medium |
| M6 | Launch Prep | Performance, security, deployment | Medium |

### 1.2 Build Philosophy

- **Vertical slices**: Each milestone delivers end-to-end functionality
- **Database first**: Schema changes happen early in each milestone
- **API before UI**: Backend endpoints before frontend pages
- **Test as you go**: Write tests alongside implementation
- **Deploy continuously**: Each milestone should be deployable

---

## 2. Milestone 1: Foundation

**Goal**: Establish project structure, database, and authentication system.

### 2.1 Tasks

#### Backend Setup
| Task | Description | Dependencies |
|------|-------------|--------------|
| B1.1 | Create ASP.NET Core Web API project | None |
| B1.2 | Configure project structure (Clean Architecture layers) | B1.1 |
| B1.3 | Set up Entity Framework Core with PostgreSQL | B1.2 |
| B1.4 | Configure Serilog logging | B1.2 |
| B1.5 | Set up FluentValidation | B1.2 |
| B1.6 | Configure AutoMapper | B1.2 |
| B1.7 | Set up development Docker Compose (Postgres, Redis) | B1.1 |
| B1.8 | Configure CORS for local development | B1.2 |

#### Database Schema (Core)
| Task | Description | Dependencies |
|------|-------------|--------------|
| D1.1 | Create User entity and migration | B1.3 |
| D1.2 | Create UserSettings entity and migration | D1.1 |
| D1.3 | Create RefreshToken entity and migration | D1.1 |
| D1.4 | Seed initial admin user | D1.1 |

#### Authentication System
| Task | Description | Dependencies |
|------|-------------|--------------|
| A1.1 | Implement password hashing service (BCrypt) | B1.2 |
| A1.2 | Implement JWT token generation service | B1.2 |
| A1.3 | Implement refresh token service | A1.2, D1.3 |
| A1.4 | Create auth middleware (cookie-based JWT) | A1.2 |
| A1.5 | POST /api/auth/register endpoint | D1.1, A1.1 |
| A1.6 | POST /api/auth/login endpoint | A1.2, A1.3 |
| A1.7 | POST /api/auth/logout endpoint | A1.4 |
| A1.8 | POST /api/auth/refresh endpoint | A1.3 |
| A1.9 | POST /api/auth/forgot-password endpoint | D1.1 |
| A1.10 | POST /api/auth/reset-password endpoint | A1.9 |
| A1.11 | GET /api/auth/verify-email endpoint | D1.1 |

#### Email Infrastructure
| Task | Description | Dependencies |
|------|-------------|--------------|
| E1.1 | Configure Resend email service | B1.2 |
| E1.2 | Create email template service | E1.1 |
| E1.3 | Implement verification email | E1.2, A1.5 |
| E1.4 | Implement password reset email | E1.2, A1.9 |

#### Frontend Setup
| Task | Description | Dependencies |
|------|-------------|--------------|
| F1.1 | Create Next.js 14 project with App Router | None |
| F1.2 | Configure TypeScript strict mode | F1.1 |
| F1.3 | Set up Tailwind CSS | F1.1 |
| F1.4 | Install and configure shadcn/ui | F1.3 |
| F1.5 | Set up design system tokens (colors, typography) | F1.4 |
| F1.6 | Create base layout components (Header, Footer) | F1.5 |
| F1.7 | Configure API client (fetch wrapper with cookies) | F1.1 |
| F1.8 | Set up React Query for server state | F1.7 |
| F1.9 | Create auth context/provider | F1.8 |

#### Auth Pages
| Task | Description | Dependencies |
|------|-------------|--------------|
| P1.1 | Landing page (/) | F1.6 |
| P1.2 | Login page (/login) | F1.9, A1.6 |
| P1.3 | Register page (/register) | F1.9, A1.5 |
| P1.4 | Forgot password page (/forgot-password) | F1.9, A1.9 |
| P1.5 | Reset password page (/reset-password/[token]) | F1.9, A1.10 |
| P1.6 | Email verification page (/verify-email/[token]) | F1.9, A1.11 |
| P1.7 | Auth route protection middleware | F1.9 |

#### Testing Setup
| Task | Description | Dependencies |
|------|-------------|--------------|
| T1.1 | Configure xUnit test project (backend) | B1.2 |
| T1.2 | Set up test fixtures and helpers | T1.1 |
| T1.3 | Write auth service unit tests | A1.1-A1.3, T1.2 |
| T1.4 | Configure Vitest (frontend) | F1.1 |
| T1.5 | Set up React Testing Library | T1.4 |
| T1.6 | Write auth form component tests | P1.2-P1.5, T1.5 |

### 2.2 Definition of Done

- [ ] User can register with email/password
- [ ] User receives verification email
- [ ] User can verify email via link
- [ ] User can login and receive JWT cookie
- [ ] User can logout (cookie cleared)
- [ ] User can request password reset
- [ ] User can reset password via email link
- [ ] Protected routes redirect to login
- [ ] All auth endpoints have validation
- [ ] Unit tests pass for auth services
- [ ] API documented in Swagger

### 2.3 Deliverables

- Backend API running locally
- Frontend app running locally
- Docker Compose for local development
- Database with User, UserSettings, RefreshToken tables
- Working auth flow end-to-end

---

## 3. Milestone 2: Core Tracking

**Goal**: Implement cycle, stage run, tumbler, and photo management.

### 3.1 Tasks

#### Database Schema (Tracking)
| Task | Description | Dependencies |
|------|-------------|--------------|
| D2.1 | Create Tumbler entity and migration | M1 Complete |
| D2.2 | Create Cycle entity and migration | D2.1 |
| D2.3 | Create StageRun entity and migration | D2.2 |
| D2.4 | Create Photo entity and migration | D2.3 |
| D2.5 | Create StageMaterial entity and migration | D2.3 |
| D2.6 | Create CleaningRun entity and migration | D2.3 |
| D2.7 | Create CleaningMaterial entity and migration | D2.6 |
| D2.8 | Create CycleSpecimen entity and migration | D2.2 |

#### Image Storage
| Task | Description | Dependencies |
|------|-------------|--------------|
| I2.1 | Configure Cloudflare R2 client | M1 Complete |
| I2.2 | Implement image upload service | I2.1 |
| I2.3 | Implement image resize/compression (ImageSharp) | I2.2 |
| I2.4 | Generate signed URLs for private images | I2.1 |
| I2.5 | Implement image deletion service | I2.1 |

#### Tumbler API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B2.1 | GET /api/tumblers - List user's tumblers | D2.1 |
| B2.2 | POST /api/tumblers - Create tumbler | D2.1 |
| B2.3 | GET /api/tumblers/:id - Get tumbler | D2.1 |
| B2.4 | PUT /api/tumblers/:id - Update tumbler | D2.1 |
| B2.5 | DELETE /api/tumblers/:id - Soft delete tumbler | D2.1 |

#### Cycle API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B2.6 | GET /api/cycles - List user's cycles (with filters) | D2.2 |
| B2.7 | POST /api/cycles - Create cycle | D2.2 |
| B2.8 | GET /api/cycles/:id - Get cycle with stages | D2.2 |
| B2.9 | PUT /api/cycles/:id - Update cycle | D2.2 |
| B2.10 | DELETE /api/cycles/:id - Soft delete cycle | D2.2 |
| B2.11 | POST /api/cycles/:id/complete - Complete cycle | D2.2 |
| B2.12 | POST /api/cycles/:id/archive - Archive cycle | D2.2 |

#### Stage Run API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B2.13 | POST /api/cycles/:id/stages - Add stage to cycle | D2.3 |
| B2.14 | GET /api/stages/:id - Get stage with materials/photos | D2.3 |
| B2.15 | PUT /api/stages/:id - Update stage | D2.3 |
| B2.16 | DELETE /api/stages/:id - Delete stage | D2.3 |
| B2.17 | POST /api/stages/:id/complete - Complete stage | D2.3 |
| B2.18 | POST /api/stages/:id/materials - Add material | D2.5 |
| B2.19 | DELETE /api/stages/:stageId/materials/:id - Remove material | D2.5 |

#### Photo API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B2.20 | POST /api/stages/:id/photos - Upload photo(s) | D2.4, I2.2 |
| B2.21 | DELETE /api/photos/:id - Delete photo | D2.4, I2.5 |
| B2.22 | PUT /api/photos/:id - Update photo label | D2.4 |

#### Cleaning Run API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B2.23 | POST /api/stages/:id/cleaning - Add cleaning run | D2.6 |
| B2.24 | PUT /api/cleaning/:id - Update cleaning run | D2.6 |
| B2.25 | DELETE /api/cleaning/:id - Delete cleaning run | D2.6 |

#### Frontend - Tumblers
| Task | Description | Dependencies |
|------|-------------|--------------|
| P2.1 | Tumbler list page (/tumblers) | B2.1 |
| P2.2 | New tumbler page (/tumblers/new) | B2.2 |
| P2.3 | Edit tumbler page (/tumblers/:id/edit) | B2.4 |
| P2.4 | Delete tumbler confirmation modal | B2.5 |

#### Frontend - Cycles
| Task | Description | Dependencies |
|------|-------------|--------------|
| P2.5 | Dashboard page (/dashboard) with active cycles | B2.6 |
| P2.6 | Cycle list page (/cycles) with filters | B2.6 |
| P2.7 | New cycle page (/cycles/new) | B2.7 |
| P2.8 | Cycle detail page (/cycles/:id) | B2.8 |
| P2.9 | Edit cycle page (/cycles/:id/edit) | B2.9 |
| P2.10 | Complete/archive cycle actions | B2.11, B2.12 |

#### Frontend - Stage Runs
| Task | Description | Dependencies |
|------|-------------|--------------|
| P2.11 | New stage run page (/cycles/:id/stages/new) | B2.13 |
| P2.12 | Stage run detail page (/stages/:id) | B2.14 |
| P2.13 | Edit stage run page (/stages/:id/edit) | B2.15 |
| P2.14 | Photo upload component with drag-drop | B2.20 |
| P2.15 | Photo gallery component with lightbox | B2.14 |
| P2.16 | Material picker component | B2.18 |
| P2.17 | Cleaning run form component | B2.23 |

#### Shared Components
| Task | Description | Dependencies |
|------|-------------|--------------|
| C2.1 | TumblerSelect component | P2.1 |
| C2.2 | SpecimenPicker component (free-text for now) | P2.7 |
| C2.3 | DurationInput component | P2.11 |
| C2.4 | DateTimePicker component | P2.7, P2.11 |
| C2.5 | Empty state component | P2.1, P2.6 |
| C2.6 | Confirmation modal component | P2.4 |

### 3.2 Definition of Done

- [ ] User can CRUD tumblers
- [ ] User can CRUD cycles with specimens
- [ ] User can add/edit/complete stage runs
- [ ] User can upload photos (up to 10 per stage)
- [ ] Photos are resized and stored in R2
- [ ] User can add materials to stages
- [ ] User can add cleaning runs to stages
- [ ] Dashboard shows active cycles with progress
- [ ] Cycle list has working filters
- [ ] All forms have proper validation
- [ ] Mobile-responsive layouts

### 3.3 Deliverables

- Complete tumbler management
- Complete cycle management
- Complete stage run management
- Photo upload and display
- Dashboard with active cycles
- All related database tables

---

## 4. Milestone 3: Reference Data

**Goal**: Implement specimens, materials, and the Learn section.

### 4.1 Tasks

#### Database Schema (Reference)
| Task | Description | Dependencies |
|------|-------------|--------------|
| D3.1 | Create Specimen entity and migration | M2 Complete |
| D3.2 | Create Material entity and migration | D3.1 |
| D3.3 | Seed specimen data (initial list) | D3.1 |
| D3.4 | Seed material data (grits, polishes, etc.) | D3.2 |

#### Specimen API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B3.1 | GET /api/specimens - List specimens (public) | D3.1 |
| B3.2 | GET /api/specimens/:id - Get specimen detail | D3.1 |
| B3.3 | GET /api/specimens/search - Search specimens | D3.1 |
| B3.4 | POST /api/admin/specimens - Create specimen (admin) | D3.1 |
| B3.5 | PUT /api/admin/specimens/:id - Update specimen (admin) | D3.1 |

#### Material API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B3.6 | GET /api/materials - List materials (public) | D3.2 |
| B3.7 | GET /api/materials/:id - Get material detail | D3.2 |
| B3.8 | GET /api/materials/search - Search materials | D3.2 |
| B3.9 | POST /api/admin/materials - Create material (admin) | D3.2 |
| B3.10 | PUT /api/admin/materials/:id - Update material (admin) | D3.2 |

#### Cycle-Specimen Integration
| Task | Description | Dependencies |
|------|-------------|--------------|
| B3.11 | Update cycle creation to use specimen picker | D3.3 |
| B3.12 | Implement hardness compatibility warnings | D3.3 |
| B3.13 | Update stage material selection from master list | D3.4 |

#### Frontend - Learn Section
| Task | Description | Dependencies |
|------|-------------|--------------|
| P3.1 | Specimens list page (/specimens) | B3.1 |
| P3.2 | Specimen detail page (/specimens/:id) | B3.2 |
| P3.3 | Materials list page (/materials) | B3.6 |
| P3.4 | Material detail page (/materials/:id) | B3.7 |
| P3.5 | Search/filter functionality for specimens | B3.3 |
| P3.6 | Search/filter functionality for materials | B3.8 |
| P3.7 | FAQ page (/faq) | None |

#### Component Updates
| Task | Description | Dependencies |
|------|-------------|--------------|
| C3.1 | Update SpecimenPicker to use API lookup | B3.1, P2.7 |
| C3.2 | Create MaterialPicker with API lookup | B3.6, P2.16 |
| C3.3 | Create HardnessWarning component | B3.12 |
| C3.4 | Update header navigation with Learn links | P3.1, P3.3 |

### 4.2 Definition of Done

- [ ] Specimen database seeded with initial data
- [ ] Material database seeded with initial data
- [ ] Specimens list page with search/filter
- [ ] Specimen detail page with hardness info
- [ ] Materials list page with category filter
- [ ] Material detail page with usage info
- [ ] Cycle creation uses specimen picker from database
- [ ] Stage run uses material picker from database
- [ ] Hardness warnings display when mixing incompatible specimens
- [ ] FAQ page with common questions

### 4.3 Deliverables

- Searchable specimen database
- Searchable material database
- Learn section (public pages)
- Updated cycle/stage forms with pickers
- Hardness compatibility system

---

## 5. Milestone 4: Social Features

**Goal**: Implement public posts, gallery, voting, and comments.

### 5.1 Tasks

#### Database Schema (Social)
| Task | Description | Dependencies |
|------|-------------|--------------|
| D4.1 | Create Post entity and migration | M3 Complete |
| D4.2 | Create PostPhoto entity and migration | D4.1 |
| D4.3 | Create Vote entity and migration | D4.1 |
| D4.4 | Create Comment entity and migration | D4.1 |
| D4.5 | Create CommentReport entity and migration | D4.4 |

#### Post API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B4.1 | POST /api/cycles/:id/share - Create post from cycle | D4.1, D4.2 |
| B4.2 | GET /api/posts - List public posts (gallery) | D4.1 |
| B4.3 | GET /api/posts/:id - Get post detail | D4.1 |
| B4.4 | PUT /api/posts/:id - Update post | D4.1 |
| B4.5 | DELETE /api/posts/:id - Delete post | D4.1 |
| B4.6 | GET /api/users/:username/posts - User's posts | D4.1 |

#### Voting API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B4.7 | POST /api/posts/:id/vote - Add vote | D4.3 |
| B4.8 | DELETE /api/posts/:id/vote - Remove vote | D4.3 |
| B4.9 | GET /api/posts/:id/votes - Get vote count | D4.3 |

#### Comment API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B4.10 | GET /api/posts/:id/comments - List comments | D4.4 |
| B4.11 | POST /api/posts/:id/comments - Add comment | D4.4 |
| B4.12 | PUT /api/comments/:id - Edit comment | D4.4 |
| B4.13 | DELETE /api/comments/:id - Delete comment | D4.4 |
| B4.14 | POST /api/comments/:id/report - Report comment | D4.5 |

#### User Profile API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B4.15 | GET /api/users/:username - Get public profile | M1 Complete |
| B4.16 | GET /api/users/:username/stats - Get user stats | D4.1, D4.3 |

#### Frontend - Gallery
| Task | Description | Dependencies |
|------|-------------|--------------|
| P4.1 | Gallery page (/gallery) with grid layout | B4.2 |
| P4.2 | Gallery sort options (newest, most votes, etc.) | B4.2 |
| P4.3 | Post card component | P4.1 |
| P4.4 | Infinite scroll for gallery | P4.1 |

#### Frontend - Post Detail
| Task | Description | Dependencies |
|------|-------------|--------------|
| P4.5 | Post detail page (/gallery/:postId) | B4.3 |
| P4.6 | Photo carousel component | P4.5 |
| P4.7 | Cycle summary display (read-only) | P4.5 |
| P4.8 | Vote button ("Ugly Rocks") | B4.7, B4.8 |
| P4.9 | Comment thread component | B4.10 |
| P4.10 | Comment form component | B4.11 |
| P4.11 | Report comment modal | B4.14 |

#### Frontend - Sharing
| Task | Description | Dependencies |
|------|-------------|--------------|
| P4.12 | Create post page (/cycles/:id/share) | B4.1 |
| P4.13 | Photo selection for post | P4.12 |
| P4.14 | Edit post page (/posts/:id/edit) | B4.4 |
| P4.15 | Delete post confirmation | B4.5 |

#### Frontend - User Profile
| Task | Description | Dependencies |
|------|-------------|--------------|
| P4.16 | User profile page (/user/:username) | B4.15 |
| P4.17 | Profile stats display | B4.16 |
| P4.18 | User's posts list | B4.6 |

### 5.2 Definition of Done

- [ ] User can create post from completed cycle
- [ ] User can select which photos to include
- [ ] Gallery displays public posts with sorting
- [ ] Post detail shows photos, cycle info, comments
- [ ] Users can vote ("Ugly Rocks") on posts
- [ ] Users can comment on posts
- [ ] Users can reply to comments
- [ ] Users can report inappropriate comments
- [ ] User profile shows posts and stats
- [ ] Anonymous users can view gallery/posts
- [ ] Login prompt for voting/commenting when logged out

### 5.3 Deliverables

- Public gallery with infinite scroll
- Post detail with photo carousel
- Voting system ("Ugly Rocks")
- Comment thread with replies
- User profile pages
- Share cycle flow

---

## 6. Milestone 5: Polish

**Goal**: Implement settings, notifications, export, and admin tools.

### 6.1 Tasks

#### Settings API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B5.1 | GET /api/users/me/settings - Get user settings | M4 Complete |
| B5.2 | PUT /api/users/me/settings - Update settings | B5.1 |
| B5.3 | PUT /api/users/me/profile - Update profile | B5.1 |
| B5.4 | PUT /api/users/me/password - Change password | B5.1 |
| B5.5 | POST /api/users/me/avatar - Upload avatar | B5.1 |
| B5.6 | DELETE /api/users/me - Deactivate account | B5.1 |

#### Notification System
| Task | Description | Dependencies |
|------|-------------|--------------|
| B5.7 | Configure Hangfire for background jobs | M1 Complete |
| B5.8 | Implement stage reminder job | B5.7 |
| B5.9 | Implement comment notification email | B5.7, D4.4 |
| B5.10 | Implement first vote notification email | B5.7, D4.3 |
| B5.11 | Implement milestone notification emails | B5.7 |

#### Export API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B5.12 | GET /api/export/cycles - Export cycles as CSV | M2 Complete |
| B5.13 | GET /api/export/cycles/:id - Export single cycle | B5.12 |
| B5.14 | POST /api/export/full - Request full data export (GDPR) | B5.12 |

#### Admin API
| Task | Description | Dependencies |
|------|-------------|--------------|
| B5.15 | GET /api/admin/reports - List comment reports | D4.5 |
| B5.16 | PUT /api/admin/reports/:id - Resolve report | B5.15 |
| B5.17 | DELETE /api/admin/comments/:id - Admin delete comment | D4.4 |
| B5.18 | GET /api/admin/users - List users (paginated) | M1 Complete |
| B5.19 | PUT /api/admin/users/:id/role - Change user role | B5.18 |
| B5.20 | PUT /api/admin/users/:id/ban - Ban user | B5.18 |

#### Frontend - Settings
| Task | Description | Dependencies |
|------|-------------|--------------|
| P5.1 | Settings layout with sidebar navigation | B5.1 |
| P5.2 | Profile settings page (/settings/profile) | B5.3 |
| P5.3 | Avatar upload component | B5.5 |
| P5.4 | Preferences page (/settings/preferences) | B5.2 |
| P5.5 | Notifications page (/settings/notifications) | B5.2 |
| P5.6 | Account page (/settings/account) | B5.4, B5.6 |
| P5.7 | Export data section | B5.12, B5.14 |

#### Frontend - Admin
| Task | Description | Dependencies |
|------|-------------|--------------|
| P5.8 | Admin dashboard (/admin) | B5.15 |
| P5.9 | Moderation queue (/admin/moderation) | B5.15, B5.16 |
| P5.10 | User management (/admin/users) | B5.18 |
| P5.11 | Ban user confirmation modal | B5.20 |
| P5.12 | Specimen management (/admin/specimens) | B3.4 |
| P5.13 | Material management (/admin/materials) | B3.9 |

#### Frontend - Legal Pages
| Task | Description | Dependencies |
|------|-------------|--------------|
| P5.14 | Privacy Policy page (/privacy) | None |
| P5.15 | Terms of Service page (/terms) | None |
| P5.16 | Cookie Policy page (/cookies) | None |

### 6.2 Definition of Done

- [ ] User can update profile (name, bio, avatar)
- [ ] User can change preferences (units, timezone, date format)
- [ ] User can manage notification preferences
- [ ] User can change password
- [ ] User can deactivate account
- [ ] User can export cycle data as CSV
- [ ] User can request full data export (GDPR)
- [ ] Stage reminders send email notifications
- [ ] Comment/vote notifications work
- [ ] Admin can view moderation queue
- [ ] Admin can resolve reports
- [ ] Admin can manage users (roles, bans)
- [ ] Admin can manage specimens/materials
- [ ] Legal pages are in place

### 6.3 Deliverables

- Complete settings pages
- Background job infrastructure
- Email notification system
- Data export functionality
- Admin dashboard and tools
- Legal pages

---

## 7. Milestone 6: Launch Prep

**Goal**: Performance optimization, security audit, and production deployment.

### 7.1 Tasks

#### Performance
| Task | Description | Dependencies |
|------|-------------|--------------|
| O6.1 | Implement Redis caching for specimens/materials | M5 Complete |
| O6.2 | Implement Redis caching for gallery (hot posts) | O6.1 |
| O6.3 | Add database indexes for common queries | M5 Complete |
| O6.4 | Optimize photo loading (lazy load, blur placeholder) | M2 Complete |
| O6.5 | Implement API response compression | M1 Complete |
| O6.6 | Frontend bundle analysis and optimization | M5 Complete |
| O6.7 | Implement React Query cache strategies | O6.6 |
| O6.8 | Add loading skeletons to all pages | O6.6 |

#### Security Audit
| Task | Description | Dependencies |
|------|-------------|--------------|
| S6.1 | Review all endpoints for authorization | M5 Complete |
| S6.2 | Implement rate limiting on sensitive endpoints | M1 Complete |
| S6.3 | Add CSRF protection | M1 Complete |
| S6.4 | Audit file upload validation | M2 Complete |
| S6.5 | Review SQL injection prevention | M3 Complete |
| S6.6 | Implement content security policy | M5 Complete |
| S6.7 | Security headers configuration | S6.6 |
| S6.8 | Dependency vulnerability scan | M5 Complete |

#### Testing
| Task | Description | Dependencies |
|------|-------------|--------------|
| T6.1 | Integration tests for critical paths | M5 Complete |
| T6.2 | E2E tests for auth flow | M5 Complete |
| T6.3 | E2E tests for cycle creation | T6.2 |
| T6.4 | E2E tests for gallery/voting | T6.3 |
| T6.5 | Load testing with k6 or similar | T6.1 |
| T6.6 | Mobile responsiveness testing | M5 Complete |
| T6.7 | Cross-browser testing | T6.6 |
| T6.8 | Accessibility audit (Lighthouse, axe) | T6.6 |

#### Deployment
| Task | Description | Dependencies |
|------|-------------|--------------|
| D6.1 | Configure Railway production environment | All above |
| D6.2 | Set up production PostgreSQL | D6.1 |
| D6.3 | Set up production Redis | D6.1 |
| D6.4 | Configure Cloudflare R2 production bucket | D6.1 |
| D6.5 | Set up custom domain with SSL | D6.1 |
| D6.6 | Configure production environment variables | D6.5 |
| D6.7 | Set up GitHub Actions CI/CD pipeline | D6.6 |
| D6.8 | Configure database backup schedule | D6.2 |
| D6.9 | Set up error monitoring (Sentry or similar) | D6.7 |
| D6.10 | Set up uptime monitoring | D6.7 |
| D6.11 | Create runbook for common operations | D6.7 |

#### Documentation
| Task | Description | Dependencies |
|------|-------------|--------------|
| X6.1 | API documentation (Swagger/OpenAPI) | M5 Complete |
| X6.2 | User guide / help content | M5 Complete |
| X6.3 | Admin guide | P5.8 |
| X6.4 | Deployment documentation | D6.11 |

### 7.2 Definition of Done

- [ ] Page load times < 2 seconds
- [ ] Lighthouse performance score > 80
- [ ] Lighthouse accessibility score > 90
- [ ] All security headers in place
- [ ] Rate limiting active
- [ ] No critical/high vulnerabilities
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

## 10. Post-Launch Roadmap

Features to consider after initial launch:

| Feature | Priority | Notes |
|---------|----------|-------|
| Easy Mode | High | Simplified tracking for beginners |
| Push notifications | Medium | Browser push for reminders |
| Social login (Google) | Medium | Alternative to email auth |
| Advanced search/filters | Medium | More ways to find content |
| Specimen suggestions | Low | User-submitted specimen requests |
| Multiple languages | Low | i18n support |
| Native mobile app | Low | If web adoption is strong |
| API for third parties | Low | Public API for integrations |

---

## Next Steps

1. Review this roadmap with stakeholders
2. Set up development environment (M1 task B1.1)
3. Begin Milestone 1: Foundation
