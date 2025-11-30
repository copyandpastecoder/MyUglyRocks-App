# MyUglyRocks System Specification

## Table of Contents
- Cycle System
- Stage Run System
- Cleaning Run System
- Specimen System
- Materials System
- Navigation System
- My Tumblers System
- Dashboard System
- Photos System
- Public Posts & Gallery System
- Comments & Voting System
- User Profiles System
- Settings & Preferences System
- Admin & Moderation System
- Notifications System
- Gallery System
- Export / Import System
- API Endpoints Specification
- Entity Relationship Diagram (ERD)
- Voting System (Expanded)

---

## Cycle System
A Tumbling Cycle is the top-level record containing specimens, stages, cleaning runs, summaries, and quality ratings.
Cycles contain:
- Name
- Start date
- Specimens (multi-select + user-added free text)
- AdditionalSpecimens
- Status (Active, Completed, Archived, Deleted)
- FinalQuality
- TotalDuration
- Notes
- CreatedAt / UpdatedAt

Cycles do NOT contain:
- Tumblers
- Default stage templates

Users manually add stages. Sorting is by recent activity.

---

## Stage Run System
Each cycle contains multiple stages, and each stage may have multiple runs (Run 1, Run 2…).

Stage Run includes:
- StageRunId
- CycleId
- StageName
- RunNumber
- Tumbler (required)
- StartDateTime
- Duration (days + hours)
- EndDateTime (auto-calculated)
- Notes
- Reminder
- Materials (up to 10)
- Photos (up to 10)

Locked after completion except notes.

---

## Cleaning Run System
Each Stage Run may have 0 or 1 cleaning run.

Cleaning Run includes:
- CleaningRunId
- StageRunId
- DurationMinutes
- Materials (up to 5)
- Notes
- Reminder

Cleaning runs do NOT allow photos.

---

## Specimen System
Specimens include fields such as:
- CommonName
- RockFamily
- Species
- Variety
- Mohs hardness (min and max)
- Difficulty
- RecommendedGritSequence
- Notes
- Active flag

Cycles can include multiple specimens.

Hardness warning:
- Yellow icon if hardness difference > 1.

Users may add AdditionalSpecimens (free text).
Moderators review suggested additions.

---

## Materials System
Materials include:
- Category (Abrasive, Additive, Media, Cleaning)
- MaterialType
- MeshSize
- CommonName
- UsageType
- Notes
- IsCleaning flag
- Default units per imperial/metric

Stage Run:
- Up to 10 materials
Cleaning Run:
- Up to 5 materials

Units stored in grams / milliliters internally.

Sorting: Grit → Additives → Media → Other.

---

## Navigation System
Main navigation:
1. Dashboard
2. Tumbling Cycles
3. My Tumblers
4. Gallery
5. Learn
6. Settings
7. Help & Support

Mobile:
- Bottom nav tabs for top sections.

---

## My Tumblers System
Each user can add tumblers with:
- Brand
- Model
- Type (Rotary/Vibe)
- BarrelCount
- BarrelCapacity
- DefaultGritAmountGrams
- Active flag

Tumbler required per Stage Run (not per cycle).
Autofill uses grams for grit only.

---

## Dashboard System
Shows:
- Active cycles
- Total Ugly Rocks received
- Last activity on user posts
- Quick Actions

Keeps UI minimal and beginner-friendly.

---

## Photos System
Photos stored in Cloudflare R2.

Limits:
- Max photo upload size: 20 MB
- Max 10 photos per Stage Run
- No photos for cleaning runs

Photo labels: Before / After / During.

Public posts use selected Stage Run photos.

Everything private unless posted publicly.

---

## Public Posts & Gallery System
Public posts contain:
- Auto-generated cycle summary
- User commentary
- Selected photos
- Comments
- Ugly Rocks voting

Sorting:
- Newest
- Most Ugly Rocks
- Most Commented

Hidden posts removed from gallery.

---

## Comments & Voting System
Threaded comments with:
- Replies
- Edit/delete
- Reporting
- Moderation controls

Voting:
- Upvote-only system ("Ugly Rocks")
- One per user per post
- No downvotes
- Count displayed publicly

---

## User Profiles System
User profiles show:
- Username
- Avatar
- Joined date
- Total Ugly Rocks
- Public posts
- Bio

No private cycle data shown.

---

## Settings & Preferences System
Users control:
- Units (Imperial/Metric)
- Date format
- Timezone
- Notification settings
- Profile settings
- Account management

---

## Admin & Moderation System
Admins:
- Manage specimens, materials, users
- Hide/unhide posts
- Reset accounts

Moderators:
- Review specimen additions
- Handle comment reports
- Hide/unhide posts and comments

All actions logged.

---

## Notifications System
Email-based:
- Stage reminders
- Comment replies
- Ugly Rocks received
- System messages

Users can toggle each.

Reminders support:
- After X days
- At expected completion

---

## Gallery System
Displays public posts in:
- Grid (desktop)
- Card list (mobile)

Shows:
- Thumbnail
- Title
- Username
- Ugly Rocks
- Comment count

Supports infinite scroll.

---

## Export / Import System
Exports include:
- CSV for cycles
- Markdown summaries
- Full user export (zip)

Imports:
- Specimens/materials via CSV (future)

---

## API Endpoints Specification
REST API with endpoints for:
- Auth
- Users
- Cycles
- Stages
- Cleaning
- Materials
- Specimens
- Tumblers
- Photos
- Posts
- Comments
- Votes
- Admin

JWT auth via httpOnly cookies.

---

## Entity Relationship Diagram (Text)
Entities:
- User
- Cycle
- CycleSpecimens
- StageRun
- CleaningRun
- StageMaterials
- CleaningMaterials
- Tumbler
- Specimen
- Material
- Photo
- Post
- Comment
- Vote

Defines all FK relationships and constraints.

---

## Voting System (Expanded)
Voting rules:
- Upvote-only
- 1 per user
- Removable
- (UserId, PostId) unique constraint

Displayed as: "X Ugly Rocks".

---

# End of Specification
