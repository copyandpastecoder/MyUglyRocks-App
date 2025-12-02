# MyUglyRocks – Complete System & Architecture Specification

This document is the **single source of truth** for the MyUglyRocks web app.  
It combines:

- Product & UX plans  
- Data model  
- Feature specs  
- Tech stack & architecture  
- Integration points (Redis, R2, email, etc.)

---

## 1. High-Level Goals

MyUglyRocks is a web app (and later, mobile-friendly app) for:

- Tracking **rock tumbling cycles** from rough to finished
- Recording **stages, materials, durations, photos, and results**
- Sharing before/after photos and recipes publicly in a **Reddit-style gallery**
- Helping beginners with **FAQ, specimens, materials guides, and recipes**
- Keeping the experience powerful for advanced users but still **simple & efficient**

There will be:

- **Easy mode** – track just core fields (start/end, specimen, simple notes)
- **Advanced mode** – full control over stages, materials, durations, photos, etc.

---

## 2. Tech Stack & Architecture

### 2.1 Backend

- **Language / Runtime:** C# on **.NET (Core/ASP.NET)**  
- **OS / Hosting:** Linux (e.g., Docker containers on a Linux host or managed service)  
- **API Style:** RESTful JSON API
- **Database:** **PostgreSQL**
  - Chosen over MySQL for:
    - Strong relational features
    - Better JSON support
    - Extensions & future-proofing

- **ORM:** Entity Framework Core (EF Core) with PostgreSQL provider  
- **Caching:** **Redis**, used from day one for:
  - Specimens list
  - Materials list
  - MyTumblers
  - Frequently-used reference data

- **Background Jobs:** Hangfire or Quartz.NET, used for:
  - Sending reminder emails
  - Batch notifications
  - Cleanup tasks

- **Image Storage:** **Cloudflare R2**
  - All photos stored in object storage
  - Database stores keys/URLs + metadata only

- **Email Provider:** **Resend**
  - Email verification
  - Password reset
  - Notifications (stage reminders, comments, Ugly Rocks, etc.)

- **Authentication:**
  - Email + password
  - JWT tokens in httpOnly cookies

---

### 2.2 Frontend

- **Framework:** Next.js (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Component Library:** (future choice – can be shadcn/ui or similar)
- **State Management:**
  - React Query / TanStack Query for server state
  - Minimal local state

- **Primary Features:**
  - Responsive design for desktop and mobile
  - Navigation aligned with main sections:
    - Dashboard
    - Tumbling Cycles
    - My Tumblers
    - Gallery
    - Learn
    - Settings
    - Help & Support

---

### 2.3 Infrastructure & Dev

- **Development IDE:** VS Code
- **Environment:**
  - Backend, DB, Redis, etc. running in Docker
- **Logging & Monitoring:**
  - Structured logs (e.g., Serilog or similar for backend)
  - Basic app health endpoints
- **Backups:**
  - Daily database backup
  - Photos in R2 (separate, durable storage)

---

## 3. Core Domain Systems

### 3.1 Cycle System

A **Tumbling Cycle** is the top-level record for a batch of stones.

Fields:

- `CycleId` (GUID)
- `UserId`
- `CycleName`
- `StartDate` (user-set)
- `EndDate` (optional, when completed)
- `Status` — Active / Completed / Archived / Deleted (soft delete)
- `FinalQuality` — user rating once done
- `TotalDuration` — auto-calculated from stages
- `Notes`
- `CreatedAt / UpdatedAt`

Associated data:

- **Specimens** (multi-select from specimen table via `CycleSpecimens`)
- **AdditionalSpecimens** (free-text)
- **StageRuns** (1-n)
- **Public Posts** (0-n, optional)

Important:

- Cycles **do not** have a tumbler assigned.
- Users manually add Stage Runs.
- Cycles page sorting: **Most recent activity first**.
- Filter by Specimen.

---

### 3.2 Stage Run System

A **Stage Run** represents one execution of a stage (e.g., “Stage 1 Run 2”).

Fields:

- `StageRunId` (GUID)
- `CycleId` (FK)
- `StageName` — user-defined (Stage 1, Coarse Grind, etc.)
- `RunNumber` — auto-calculated per StageName within a cycle
- `TumblerId` — required; chosen per Stage Run
- `StartDateTime`
- `DurationDays`
- `DurationHours`
- `EndDateTime` — auto-calculated; user can override (updating duration)
- `Notes`
- `Reminder` (enabled/disabled, rule for reminders)
- `CreatedAt / UpdatedAt`

Behavior:

- Users **manually create** Stage Runs (no auto-stage on cycle creation).
- Stage Runs are editable while active.
- When marked **Completed**:
  - Timing, tumbler, materials, photos become locked
  - Notes can still be edited

Stage Run data includes:

- Up to **10 materials**
- Up to **10 photos**
- Optional **Cleaning Run**

Sorting within a cycle:

- By Stage order (1, 2, 3…)  
- Then by RunNumber (Run 1, Run 2…)

---

### 3.3 Cleaning Run System

A **Cleaning Run** / Burnish Run is optional but tied to a Stage Run.

Fields:

- `CleaningRunId` (GUID)
- `StageRunId` (FK)
- `DurationMinutes` (user enters hours + minutes)
- `Notes`
- `Reminder`
- `CreatedAt / UpdatedAt`

Rules:

- Each Stage Run may have **0 or 1** Cleaning Run.
- Cleaning runs:
  - Do **not** have photos.
  - Can have up to **5 cleaning materials**.
  - Do not track start/end separately, only duration.

Cleaning materials:

- Filtered from TumblingMaterials where `IsCleaning = TRUE`.
- Borax, dish soap, burnish media, etc.

Cleaning run appears visually nested under its Stage Run.

---

## 4. Specimen System & Hardness Rules

### 4.1 Specimen Table

Fields (global reference data):

- `SpecimenId` (GUID)
- `CommonName`
- `RockFamily`
- `Species`
- `Variety`
- `Alias`
- `ScientificName`
- `MaterialType` (Rock, Mineral, Glass, Fossil, etc.)
- `MohsHardnessMin`
- `MohsHardnessMax`
- `TumblingDifficulty` (Easy/Medium/Hard)
- `RecommendedGritSequence`
- `SpecialConsiderations`
- `Notes`
- `IsActive`

Moderators:

- Can create and edit specimens.
- Cannot delete them.

---

### 4.2 Specimens per Cycle

Users can:

- Select **multiple specimens** for a cycle via multi-select.
  - Search on `CommonName` and `Alias`.
- Add **AdditionalSpecimens** (free-text) for rocks not in the list.

Hardness warnings:

- If max hardness difference across selected specimens **> 1.0**:
  - Show **soft warning (yellow icon)**.
  - No red or blocking warnings.

Behavior notes:

- From Specimen table:
  - `TumblingDifficulty`
  - `SpecialConsiderations`
  - `Notes`
- Shown:
  - Inline when selecting specimens
  - In cycle summary (after completion)

---

### 4.3 Specimen Suggestions & Review

Users can flag:

- “Recommend this specimen be added”

Admins/Mods see suggestions in an **Admin / Review Queue**, and can:

- Approve → create new specimen
- Reject → dismiss

---

## 5. Materials System

Global **TumblingMaterials** table:

- `MaterialId` (GUID)
- `Category` — Abrasive, Additive, Media, Cleaning
- `MaterialType` — e.g., Silicon Carbide, Aluminum Oxide, Borax, etc.
- `MaterialSize` — e.g., 60/90, 120/220, 500, 1000 AO
- `CommonName`
- `UsageType` — Coarse, Medium, Fine, Pre-Polish, Polish, Cleaning
- `MeshSize` — numeric (0 for non-grit)
- `SortOrder`
- `IsCleaning` — TRUE if usable in cleaning runs
- `IsActive`
- `Notes`

Per Stage Run:

- Up to **10 materials**
- Each has:
  - `MaterialId`
  - `DisplayAmount`
  - `DisplayUnit` (tsp, tbsp, g, ml, drops, etc.)
  - `AmountGrams`
  - `AmountMilliliters`
  - `Notes`

Per Cleaning Run:

- Up to **5 materials**
- Same fields, restricted by `IsCleaning = TRUE`.

Storage:

- Canonical units:
  - Solids → grams
  - Liquids → milliliters

UI:

- Shows user-friendly units.
- Converts to canonical before storing.

Sorting in UI:

1. Grit (MeshSize > 0)  
2. Additives  
3. Media  
4. Other  

---

## 6. My Tumblers System

Each user can manage their own tumblers.

Fields:

- `TumblerId` (GUID)
- `UserId`
- `Brand`
- `Model`
- `TumblerType` — Rotary / Vibratory
- `BarrelCount`
- `BarrelCapacity` — per barrel, in lbs
- `DefaultGritAmountGrams` — recommended grit for a full barrel
- `IsActive`
- `Notes`
- `CreatedAt / UpdatedAt`

Rules:

- **Tumbler is required for each Stage Run**, but not for the Cycle itself.
- Autofill:
  - Uses `DefaultGritAmountGrams`
  - Converts to user’s preferred unit
  - Fills only the grit material line
- User can override all autofilled values.

Edits:

- Changing tumbler properties:
  - Does **not** modify past Stage Runs
  - Only affects future autofill.

Selection UI:

- Dropdown listing active tumblers with:
  - Brand
  - Model
  - Capacity
  - BarrelCount
- Options for:
  - “Add New Tumbler”
  - “Use Generic Rotary”
  - “Use Generic Vibratory”

---

## 7. Photos System

Storage:

- All photos in **Cloudflare R2**
- DB stores:
  - `PhotoId`
  - `StageRunId`
  - Key/URL
  - File size
  - MIME type
  - `PhotoType` (Before, After, During)
  - `SortOrder`
  - `CreatedAt`

Constraints:

- Max upload per image: **20 MB**
- Resized/compressed to ~2–3 MB target.
- Max **10 photos per Stage Run**.
- **No photos on Cleaning Runs**.

Labeling:

- Required: `Before`, `After`, or `During`.
- Sorting:
  - By type (Before → During → After)
  - Then by upload time.

Privacy:

- All Stage Run photos are **private by default**.
- Become public only when attached to a **Public Post**.
- Deleting a post hides the public view but does not auto-delete original Stage photos unless explicitly chosen.

---

## 8. Public Posts & Gallery System

### 8.1 Public Posts

A **Public Post** is created from cycle data and Stage Run photos.

Fields:

- `PostId`
- `UserId`
- `CycleId` (optional FK)
- `Title`
- `Body` (user commentary)
- `Status` — Active / Hidden
- `CreatedAt / UpdatedAt`
- `IsEdited`

Posts show:

- Auto-generated **cycle summary**:
  - Stage names
  - Key materials
  - Final Quality
  - Total duration
  - Specimens
- User commentary below.
- Selected photos from Stage Runs (no new upload on post form).

Photo selection:

- By default, **all cycle photos are selected**.
- User may deselect photos.
- Sorted by:
  - Stage order
  - Run order
  - Photo type

---

### 8.2 Gallery

The **Gallery** lists all public posts.

Card includes:

- Thumbnail (first selected photo)
- Title
- Username
- Ugly Rocks count
- Comment count
- Time since posted

Sorting options:

- Newest (default)
- Most Ugly Rocks
- Most Commented

Mobile:

- Card list with infinite scroll.

---

## 9. Comments & Voting System

### 9.1 Comments

Each comment:

- `CommentId`
- `PostId`
- `UserId`
- `ParentCommentId` (nullable for replies)
- `Body`
- `CreatedAt / UpdatedAt`
- `IsEdited`
- `IsHidden`

Features:

- Threaded replies (ParentCommentId)
- Unlimited depth, but UI collapses after some levels.
- Users can:
  - Edit their comments
  - Delete their comments (removes that comment + its replies)

Reporting:

- Users can **Report** comments.
- Confirm dialog prevents accidental taps.
- Reports go to `CommentReports` and show in Admin queue.

Moderation:

- Moderators can:
  - Hide comments (`IsHidden = true`)
  - Delete comments
- Hidden comments appear as “Comment removed by moderator”.

Comments contain text only (no photos; photos belong to posts/stages).

---

### 9.2 Voting – “Ugly Rocks”

Votes:

- **Upvote-only** (“Ugly Rocks”).
- One Ugly Rock per user per post.
- Stored in `Votes` table:
  - `VoteId`
  - `UserId`
  - `PostId`
  - `CreatedAt`
  - Unique constraint on (UserId, PostId).

Behavior:

- Users can **add** or **remove** a vote.
- Visible as: **“X Ugly Rocks”**.
- Clicking while logged out triggers sign-in/up.

Votes:

- Contribute to:
  - Gallery sorting (Most Ugly Rocks)
  - Profile total Ugly Rocks
  - Dashboard stat for the user

Moderation:

- Hidden or deleted posts:
  - Votes not shown.
  - Deleting a post removes its votes.

---

## 10. User Profiles System

Public profile (`/user/{username}`) shows:

- Username
- Avatar
- Joined date
- Total Ugly Rocks
- Public posts
- Optional DisplayName
- Optional Bio

No private cycles or internal data are visible.

Avatar:

- Optional upload (stored in R2, compressed)
- Or auto-generated avatar (initials).

Profile edit via Settings allows:

- Avatar
- DisplayName
- Bio

---

## 11. Settings & Preferences System

Categories:

1. Units & Measurements  
2. Date & Time  
3. Notifications  
4. Profile Settings  
5. App Behavior  
6. Account Management  

### 11.1 Units & Measurements

- Measurement system:
  - Imperial / Metric
- All internal quantities:
  - Solids → grams
  - Liquids → milliliters
- UI converts as needed.

### 11.2 Date & Time

- Timezone
- Date format:
  - MM/DD/YYYY
  - DD/MM/YYYY
  - YYYY-MM-DD
- Time format:
  - 12h / 24h

Affects all displayed dates & reminders.

### 11.3 Notifications

Per-user toggles for:

- Stage reminders
- Comment notifications
- Ugly Rocks notifications
- Reply notifications

Uses Resend for email.

### 11.4 Profile Settings

- Display name
- Avatar
- Bio
- (Username change optional later)

### 11.5 App Behavior

- Default sorting for cycles
- Default reminder behavior
- Default units

### 11.6 Account Management

- Change password
- Email verification
- Deactivate account
- Data export

---

## 12. Admin & Moderation System

Roles:

- **Admin**:
  - Manage users
  - Manage specimens & materials
  - Hide/unhide posts
  - See moderation queues

- **Moderator**:
  - Review specimens suggestions
  - Handle comment reports
  - Hide/unhide posts and comments

Admin Dashboard:

- Specimen Review Queue
- Comment Reports Queue
- Post Moderation
- Materials Management (admin)
- User Management (admin)

Audit logging:

- Who did what, when.

Privacy:

- Admins **cannot** view private cycles or private photos (only public content).

---

## 13. Notifications System

Email-based notifications via Resend.

Types:

- Stage reminders:
  - “Remind after X days”
  - “Remind at expected end date”
- Public post activity:
  - New comment on user’s post
  - Reply to user’s comment
  - Ugly Rock received
- System:
  - Email verification
  - Password reset
  - Account-related messages

Backend uses job scheduler (e.g., Hangfire) for scheduling & batching.

---

## 14. Navigation & Dashboard Overview

### 14.1 Main Navigation

1. Dashboard
2. Tumbling Cycles
3. My Tumblers
4. Gallery
5. Learn
6. Settings
7. Help & Support

Mobile: bottom nav bar for the main items.

### 14.2 Dashboard

Shows:

- Active cycles (with current stage and ETA)
- Total Ugly Rocks received
- Recent activity on user posts
- Quick Actions:
  - Start new cycle
  - Add stage run
  - Add cleaning run
  - Upload photos

---

## 15. Export / Import System

Exports:

1. **Cycle Export (CSV)**
   - Flattens cycles, stages, cleaning runs, materials.

2. **Cycle Export (Markdown)**
   - Human-readable summary.

3. **Full User Export (Zip)**
   - Cycles (CSV/MD)
   - Posts
   - Comments
   - Profile & Settings

Imports (future):

- Specimens & materials via CSV.

---

## 16. API Endpoints (High-Level)

REST API with JWT auth via httpOnly cookies.

Key groups:

- `/auth/*` — register, login, logout, verify email
- `/users/*` — current user info, public profile
- `/cycles/*` — CRUD cycles
- `/stages/*` — Stage Runs
- `/cleaning/*` — Cleaning Runs
- `/materials/*` — list + admin
- `/specimens/*` — list, suggest, moderate
- `/my-tumblers/*` — user tumblers
- `/photos/*` — upload/delete
- `/posts/*` — public posts
- `/comments/*` — comments & replies
- `/votes/*` — Ugly Rocks
- `/admin/*` — moderation tools

---

## 17. Entity Relationship Diagram (Text Overview)

Main entities & relationships:

- **User** 1–n **Cycles**
- **Cycle** 1–n **StageRuns**
- **StageRun** 0–1 **CleaningRun**
- **StageRun** 1–n **StageMaterials**
- **CleaningRun** 1–n **CleaningMaterials**
- **Cycle** n–m **Specimens** via **CycleSpecimens**
- **StageRun** 1–n **Photos**
- **User** 1–n **Tumblers**
- **User** 1–n **Posts**
- **Post** 1–n **Comments**
- **Post** 1–n **Votes**
- **User** 1–n **Comments**
- **User** 1–n **Votes**

This matches all the domain logic defined above.

---

## 18. Voting System (Short Summary)

- “Ugly Rocks” are upvotes.
- 1 per user per post.
- Removable.
- No downvotes.
- Count visible.
- Drives:
  - Gallery sorting
  - Profile totals
  - Dashboard stats

---

# End of Specification

This single file contains the **entire current plan** for MyUglyRocks:
- Tech stack (backend, frontend, infra)
- Redis, Cloudflare R2, Resend usage
- All core domain models & workflows
- UI/UX structure
- Data model & API shape
- Admin, notifications, export/import, voting, and gallery behavior.
