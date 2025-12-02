# MyUglyRocks - User Stories

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [01-PRD.md](01-PRD.md) |

---

## Overview

User stories are organized by **Epic** (major feature area). Each story follows the format:

> **As a** [type of user]
> **I want** [goal]
> **So that** [benefit]

Priority levels:
- **P0** = MVP (Must Have)
- **P1** = MVP+ (Should Have)
- **P2** = Future (Nice to Have)

---

## Epic 1: Authentication

### AUTH-01: Register with Email (P0)
**As a** new user
**I want** to create an account with my email and password
**So that** I can save my tumbling data

**Acceptance Criteria:**
- [ ] User provides email and password
- [ ] Password must be at least 8 characters
- [ ] Email must be valid format
- [ ] Email must be unique (not already registered)
- [ ] User receives verification email after registration
- [ ] User cannot fully use app until email is verified
- [ ] Error messages are clear and helpful

---

### AUTH-02: Verify Email (P0)
**As a** newly registered user
**I want** to verify my email address
**So that** I can access all features

**Acceptance Criteria:**
- [ ] User receives email with verification link
- [ ] Clicking link verifies the account
- [ ] Link expires after 24 hours
- [ ] User can request a new verification email
- [ ] Success message shown after verification

---

### AUTH-03: Login (P0)
**As a** registered user
**I want** to log in with my email and password
**So that** I can access my data

**Acceptance Criteria:**
- [ ] User enters email and password
- [ ] Successful login redirects to Dashboard
- [ ] Invalid credentials show error message
- [ ] Session persists across browser refreshes
- [ ] "Remember me" option (optional)

---

### AUTH-04: Logout (P0)
**As a** logged-in user
**I want** to log out
**So that** I can secure my account on shared devices

**Acceptance Criteria:**
- [ ] Logout button in navigation/settings
- [ ] Session is terminated
- [ ] User is redirected to login page
- [ ] Protected pages are no longer accessible

---

### AUTH-05: Reset Password (P0)
**As a** user who forgot my password
**I want** to reset it via email
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] User enters email on "Forgot Password" page
- [ ] If email exists, reset link is sent
- [ ] Link expires after 1 hour
- [ ] User sets new password via link
- [ ] Old password no longer works
- [ ] Confirmation message shown

---

### AUTH-06: Change Password (P0)
**As a** logged-in user
**I want** to change my password
**So that** I can keep my account secure

**Acceptance Criteria:**
- [ ] User must enter current password
- [ ] User enters new password (with confirmation)
- [ ] New password must meet requirements
- [ ] Success message shown after change

---

## Epic 2: Dashboard

### DASH-01: View Dashboard (P0)
**As a** logged-in user
**I want** to see a dashboard when I log in
**So that** I can quickly understand my current tumbling status

**Acceptance Criteria:**
- [ ] Dashboard is the default landing page after login
- [ ] Shows list of active cycles
- [ ] Shows current stage and time remaining for each active cycle
- [ ] Shows quick action buttons

---

### DASH-02: Quick Actions (P0)
**As a** user on the dashboard
**I want** quick action buttons
**So that** I can perform common tasks without navigating

**Acceptance Criteria:**
- [ ] "Start New Cycle" button
- [ ] "Add Stage Run" button (if active cycles exist)
- [ ] Buttons navigate to appropriate forms

---

### DASH-03: View Ugly Rocks Stats (P1)
**As a** user who has posted publicly
**I want** to see my total Ugly Rocks received
**So that** I can track my community engagement

**Acceptance Criteria:**
- [ ] Total Ugly Rocks count displayed on dashboard
- [ ] Recent activity on my posts shown

---

## Epic 3: Cycle Management

### CYC-01: Create Cycle (P0)
**As a** user
**I want** to create a new tumbling cycle
**So that** I can track a batch of rocks

**Acceptance Criteria:**
- [ ] User provides cycle name
- [ ] User selects start date (defaults to today)
- [ ] User can select specimens from master list (multi-select)
- [ ] User can add additional specimens via free-text
- [ ] User can add notes (optional)
- [ ] Cycle is created with "Active" status
- [ ] User is redirected to cycle detail page

---

### CYC-02: View Cycle List (P0)
**As a** user
**I want** to see all my cycles
**So that** I can find and manage them

**Acceptance Criteria:**
- [ ] List shows all cycles (Active, Completed, Archived)
- [ ] Default sort: most recent activity first
- [ ] Each cycle shows: name, status, specimens, date, stage count
- [ ] Clicking a cycle opens the detail view
- [ ] Visual distinction between Active/Completed/Archived

---

### CYC-03: View Cycle Detail (P0)
**As a** user
**I want** to view a cycle's full details
**So that** I can see all stages, photos, and progress

**Acceptance Criteria:**
- [ ] Shows cycle name, status, dates, specimens
- [ ] Lists all stage runs in order
- [ ] Shows photos from each stage
- [ ] Shows total duration (calculated)
- [ ] Shows notes
- [ ] Edit and action buttons available

---

### CYC-04: Edit Cycle (P0)
**As a** user
**I want** to edit a cycle's basic info
**So that** I can fix mistakes or update details

**Acceptance Criteria:**
- [ ] Can edit: name, specimens, additional specimens, notes
- [ ] Cannot edit: start date after stages are added
- [ ] Changes are saved
- [ ] Validation on required fields

---

### CYC-05: Complete Cycle (P0)
**As a** user
**I want** to mark a cycle as completed
**So that** I can indicate it's finished

**Acceptance Criteria:**
- [ ] "Complete Cycle" button available on active cycles
- [ ] User can optionally set a Final Quality rating (1-5 stars or similar)
- [ ] End date is set to today (or user-specified)
- [ ] Status changes to "Completed"
- [ ] Completed cycles can still be viewed but not edited (except notes)

---

### CYC-06: Archive Cycle (P0)
**As a** user
**I want** to archive old cycles
**So that** they don't clutter my main list

**Acceptance Criteria:**
- [ ] "Archive" button on completed cycles
- [ ] Archived cycles hidden from default view
- [ ] Filter/toggle to show archived cycles
- [ ] Can unarchive if needed

---

### CYC-07: Delete Cycle (P0)
**As a** user
**I want** to delete a cycle
**So that** I can remove unwanted records

**Acceptance Criteria:**
- [ ] "Delete" button available
- [ ] Confirmation dialog before delete
- [ ] Soft delete (marked as Deleted, not removed from DB)
- [ ] Deleted cycles not shown in any list
- [ ] Associated stage runs and photos are also soft-deleted

---

### CYC-08: Filter Cycles by Specimen (P2)
**As a** user with many cycles
**I want** to filter my cycles by specimen
**So that** I can find cycles for a specific rock type

**Acceptance Criteria:**
- [ ] Filter dropdown with specimen list
- [ ] Shows only cycles containing selected specimen
- [ ] Can clear filter

---

## Epic 4: Stage Runs

### STG-01: Add Stage Run (P0)
**As a** user
**I want** to add a stage run to my cycle
**So that** I can track each tumbling stage

**Acceptance Criteria:**
- [ ] User selects cycle (or is already on cycle detail page)
- [ ] User enters stage name (e.g., "Stage 1", "Coarse Grind")
- [ ] Run number is auto-calculated (Run 1, Run 2, etc. per stage name)
- [ ] User selects tumbler (required)
  - If user has one tumbler, auto-selected
  - Dropdown shows: Brand, Model, Capacity
- [ ] User enters start date/time
- [ ] User enters duration (days + hours)
- [ ] End date/time is auto-calculated
- [ ] User can add notes
- [ ] User can enable/configure reminder

---

### STG-02: Add Materials to Stage (P0)
**As a** user
**I want** to add materials to a stage run
**So that** I can track what I used

**Acceptance Criteria:**
- [ ] User selects material from master list
- [ ] User enters amount and unit (tsp, tbsp, g, etc.)
- [ ] Up to 10 materials per stage run
- [ ] Materials sorted by: Grit → Additives → Media → Other
- [ ] Can remove materials
- [ ] Notes field per material (optional)

---

### STG-03: Upload Photos to Stage (P0)
**As a** user
**I want** to upload photos to a stage run
**So that** I can document progress

**Acceptance Criteria:**
- [ ] Upload up to 10 photos per stage
- [ ] Max 20 MB per photo (compressed after upload)
- [ ] User must label each photo: Before, During, or After
- [ ] Photos sorted by type, then upload time
- [ ] Can delete photos
- [ ] Photos are private by default

---

### STG-04: View Stage Run Detail (P0)
**As a** user
**I want** to view a stage run's details
**So that** I can see what I did

**Acceptance Criteria:**
- [ ] Shows: stage name, run number, tumbler, dates, duration
- [ ] Shows materials list
- [ ] Shows photos
- [ ] Shows notes
- [ ] Shows cleaning run (if any)

---

### STG-05: Edit Stage Run (P0)
**As a** user
**I want** to edit a stage run
**So that** I can correct or update info

**Acceptance Criteria:**
- [ ] Can edit all fields while stage is active
- [ ] Changing duration recalculates end date (and vice versa)
- [ ] Changes are saved

---

### STG-06: Complete Stage Run (P0)
**As a** user
**I want** to mark a stage run as completed
**So that** I can indicate it's done and move on

**Acceptance Criteria:**
- [ ] "Complete" button on active stage runs
- [ ] Once completed:
  - Timing, tumbler, materials, photos are locked
  - Notes can still be edited
- [ ] Visual indicator that stage is completed

---

### STG-07: Delete Stage Run (P0)
**As a** user
**I want** to delete a stage run
**So that** I can remove mistakes

**Acceptance Criteria:**
- [ ] Confirmation dialog
- [ ] Deletes associated photos and cleaning run
- [ ] Recalculates cycle total duration

---

## Epic 5: Cleaning Runs

### CLN-01: Add Cleaning Run (P1)
**As a** user
**I want** to add a cleaning/burnish run to a stage
**So that** I can track post-stage cleaning

**Acceptance Criteria:**
- [ ] Each stage run can have 0 or 1 cleaning run
- [ ] User enters duration (hours + minutes)
- [ ] User can add cleaning materials (up to 5)
  - Only materials marked as "cleaning" available
- [ ] User can add notes
- [ ] Can enable reminder

---

### CLN-02: View Cleaning Run (P1)
**As a** user
**I want** to see cleaning run details
**So that** I can review what I did

**Acceptance Criteria:**
- [ ] Cleaning run shown nested under its stage run
- [ ] Shows duration, materials, notes

---

### CLN-03: Edit Cleaning Run (P1)
**As a** user
**I want** to edit a cleaning run
**So that** I can update the info

**Acceptance Criteria:**
- [ ] Can edit duration, materials, notes
- [ ] Changes are saved

---

### CLN-04: Delete Cleaning Run (P1)
**As a** user
**I want** to delete a cleaning run
**So that** I can remove it if not needed

**Acceptance Criteria:**
- [ ] Confirmation dialog
- [ ] Cleaning run is removed
- [ ] Stage run remains intact

---

## Epic 6: My Tumblers

### TUM-01: Add Tumbler (P0)
**As a** user
**I want** to add my tumblers to the app
**So that** I can select them when creating stage runs

**Acceptance Criteria:**
- [ ] User enters: Brand, Model, Type (Rotary/Vibratory)
- [ ] User enters: Barrel count, Barrel capacity (lbs)
- [ ] User can set default grit amount (optional)
- [ ] User can add notes
- [ ] Tumbler is marked as Active

---

### TUM-02: View Tumbler List (P0)
**As a** user
**I want** to see all my tumblers
**So that** I can manage them

**Acceptance Criteria:**
- [ ] List shows all active tumblers
- [ ] Shows: Brand, Model, Type, Capacity
- [ ] Option to show inactive tumblers
- [ ] Click to view/edit

---

### TUM-03: Edit Tumbler (P0)
**As a** user
**I want** to edit my tumbler info
**So that** I can keep it accurate

**Acceptance Criteria:**
- [ ] Can edit all fields
- [ ] Changes do NOT affect past stage runs
- [ ] Changes affect future autofill

---

### TUM-04: Deactivate Tumbler (P0)
**As a** user
**I want** to deactivate a tumbler I no longer use
**So that** it doesn't appear in selection dropdowns

**Acceptance Criteria:**
- [ ] "Deactivate" button
- [ ] Tumbler hidden from dropdowns
- [ ] Past stage runs still show the tumbler
- [ ] Can reactivate later

---

### TUM-05: Delete Tumbler (P0)
**As a** user
**I want** to delete a tumbler
**So that** I can remove it completely

**Acceptance Criteria:**
- [ ] Only allowed if tumbler has no associated stage runs
- [ ] Otherwise, must deactivate instead
- [ ] Confirmation dialog

---

### TUM-06: Generic Tumbler Options (P0)
**As a** user without a saved tumbler
**I want** to select "Generic Rotary" or "Generic Vibratory"
**So that** I can still create stage runs

**Acceptance Criteria:**
- [ ] "Use Generic Rotary" option in tumbler dropdown
- [ ] "Use Generic Vibratory" option in tumbler dropdown
- [ ] No autofill for generic tumblers

---

## Epic 7: Specimens

### SPC-01: Browse Specimens (P0)
**As a** user
**I want** to browse the specimen list
**So that** I can learn about rocks and select them for cycles

**Acceptance Criteria:**
- [ ] List shows all active specimens
- [ ] Shows: Common name, hardness, difficulty
- [ ] Search by name or alias
- [ ] Click to view details

---

### SPC-02: View Specimen Detail (P0)
**As a** user
**I want** to view specimen details
**So that** I can learn about a rock type

**Acceptance Criteria:**
- [ ] Shows: Common name, scientific name, family
- [ ] Shows: Hardness (min-max), difficulty
- [ ] Shows: Recommended grit sequence
- [ ] Shows: Special considerations, notes

---

### SPC-03: Hardness Warning (P2)
**As a** user selecting multiple specimens
**I want** to see a warning if hardness differs too much
**So that** I can avoid tumbling incompatible rocks together

**Acceptance Criteria:**
- [ ] Warning shown if max hardness difference > 1.0
- [ ] Soft warning only (yellow icon)
- [ ] Does not block cycle creation

---

### SPC-04: Suggest New Specimen (P2)
**As a** user
**I want** to suggest a specimen that's not in the list
**So that** it can be added for everyone

**Acceptance Criteria:**
- [ ] "Suggest Specimen" button
- [ ] User enters specimen details
- [ ] Suggestion goes to admin review queue
- [ ] User notified if approved/rejected

---

## Epic 8: Materials

### MAT-01: Browse Materials (P0)
**As a** user
**I want** to browse the materials list
**So that** I can select them for stage runs

**Acceptance Criteria:**
- [ ] List shows all active materials
- [ ] Grouped by category: Abrasive, Additive, Media, Cleaning
- [ ] Search by name
- [ ] Shows: Name, type, mesh size (if grit)

---

### MAT-02: View Material Detail (P0)
**As a** user
**I want** to view material details
**So that** I can understand when to use it

**Acceptance Criteria:**
- [ ] Shows: Common name, category, type
- [ ] Shows: Mesh size, usage type
- [ ] Shows: Notes

---

## Epic 9: Public Posts & Gallery

### POST-01: Create Public Post (P1)
**As a** user with a completed cycle
**I want** to share it publicly
**So that** others can see my results and recipe

**Acceptance Criteria:**
- [ ] "Share to Gallery" button on completed cycles
- [ ] User enters title
- [ ] User enters commentary/body text
- [ ] Auto-generated cycle summary shown (stages, materials, specimens, duration)
- [ ] User selects which photos to include (default: all)
- [ ] Content passes NSFW and profanity filters before posting
- [ ] Post is created with "Active" status

---

### POST-02: View Gallery (P1)
**As a** visitor (logged in or not)
**I want** to browse the gallery
**So that** I can see what others are tumbling

**Acceptance Criteria:**
- [ ] Grid/card layout of public posts
- [ ] Each card shows: thumbnail, title, username, Ugly Rocks count, comment count
- [ ] Sort options: Newest, Most Ugly Rocks, Most Commented
- [ ] Infinite scroll on mobile
- [ ] Click to view post detail

---

### POST-03: View Post Detail (P1)
**As a** visitor
**I want** to view a post's full details
**So that** I can see the photos and recipe

**Acceptance Criteria:**
- [ ] Shows: title, author, date
- [ ] Shows: all selected photos
- [ ] Shows: auto-generated cycle summary
- [ ] Shows: user commentary
- [ ] Shows: Ugly Rocks count
- [ ] Shows: comments section
- [ ] Vote button (if logged in)

---

### POST-04: Edit Post (P1)
**As a** post author
**I want** to edit my post
**So that** I can fix mistakes

**Acceptance Criteria:**
- [ ] Can edit: title, body text, photo selection
- [ ] Cannot change the linked cycle
- [ ] "Edited" indicator shown on post
- [ ] Content re-checked by filters

---

### POST-05: Hide/Delete Post (P1)
**As a** post author
**I want** to hide or delete my post
**So that** I can remove it from public view

**Acceptance Criteria:**
- [ ] "Hide" removes from gallery but keeps data
- [ ] "Delete" permanently removes post
- [ ] Original cycle photos are NOT deleted (unless user explicitly chooses)
- [ ] Confirmation dialog

---

## Epic 10: Voting (Ugly Rocks)

### VOTE-01: Give Ugly Rock (P1)
**As a** logged-in user
**I want** to upvote a post I like
**So that** I can show appreciation

**Acceptance Criteria:**
- [ ] Click "Ugly Rock" button on post
- [ ] Count increases by 1
- [ ] Button shows voted state
- [ ] One vote per user per post

---

### VOTE-02: Remove Ugly Rock (P1)
**As a** user who voted
**I want** to remove my vote
**So that** I can change my mind

**Acceptance Criteria:**
- [ ] Click voted button again to remove
- [ ] Count decreases by 1
- [ ] Button returns to unvoted state

---

### VOTE-03: Prompt Login to Vote (P1)
**As a** visitor not logged in
**I want** to be prompted to log in when I try to vote
**So that** I can create an account and participate

**Acceptance Criteria:**
- [ ] Clicking vote button shows login/register prompt
- [ ] After login, user can vote

---

## Epic 11: Comments

### COM-01: Add Comment (P1)
**As a** logged-in user
**I want** to comment on a post
**So that** I can share feedback or ask questions

**Acceptance Criteria:**
- [ ] Comment text field on post detail
- [ ] Submit adds comment
- [ ] Comment appears immediately (after passing filters)
- [ ] Profanity/spam filter applied before posting

---

### COM-02: Reply to Comment (P1)
**As a** logged-in user
**I want** to reply to a comment
**So that** I can have a conversation

**Acceptance Criteria:**
- [ ] "Reply" button on each comment
- [ ] Reply appears nested under parent
- [ ] Threading supported (unlimited depth, but UI collapses after ~3 levels)

---

### COM-03: Edit Comment (P1)
**As a** comment author
**I want** to edit my comment
**So that** I can fix mistakes

**Acceptance Criteria:**
- [ ] "Edit" button on own comments
- [ ] "Edited" indicator shown
- [ ] Content re-checked by filters

---

### COM-04: Delete Comment (P1)
**As a** comment author
**I want** to delete my comment
**So that** I can remove it

**Acceptance Criteria:**
- [ ] "Delete" button on own comments
- [ ] Confirmation dialog
- [ ] Deleting removes comment and all replies

---

### COM-05: Report Comment (P1)
**As a** user
**I want** to report an inappropriate comment
**So that** moderators can review it

**Acceptance Criteria:**
- [ ] "Report" button on comments
- [ ] Confirmation dialog (prevent accidental reports)
- [ ] Report goes to moderation queue
- [ ] User cannot report same comment twice

---

## Epic 12: User Profiles

### PROF-01: View Own Profile (P1)
**As a** logged-in user
**I want** to view my public profile
**So that** I can see what others see

**Acceptance Criteria:**
- [ ] Shows: username, avatar, joined date
- [ ] Shows: total Ugly Rocks received
- [ ] Shows: list of my public posts
- [ ] Shows: display name and bio (if set)

---

### PROF-02: View Other Profiles (P1)
**As a** visitor
**I want** to view other users' profiles
**So that** I can see their work

**Acceptance Criteria:**
- [ ] Public profile page at `/user/{username}`
- [ ] Shows same info as own profile
- [ ] No private data (cycles, settings) visible

---

### PROF-03: Edit Profile (P1)
**As a** logged-in user
**I want** to edit my profile
**So that** I can personalize it

**Acceptance Criteria:**
- [ ] Edit: display name, bio, avatar
- [ ] Avatar upload (compressed, stored in R2)
- [ ] Default avatar if none uploaded (initials)
- [ ] Changes saved

---

## Epic 13: Settings

### SET-01: Units & Measurements (P0)
**As a** user
**I want** to set my preferred units
**So that** quantities display correctly for me

**Acceptance Criteria:**
- [ ] Choose: Imperial or Metric
- [ ] Affects display of amounts throughout app
- [ ] Internal storage remains in grams/milliliters

---

### SET-02: Date & Time Preferences (P0)
**As a** user
**I want** to set my date/time preferences
**So that** dates display correctly for me

**Acceptance Criteria:**
- [ ] Set timezone
- [ ] Choose date format: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- [ ] Choose time format: 12h or 24h

---

### SET-03: Notification Settings (P1)
**As a** user
**I want** to control what notifications I receive
**So that** I'm not overwhelmed

**Acceptance Criteria:**
- [ ] Toggle: Stage reminders
- [ ] Toggle: Comment notifications
- [ ] Toggle: Ugly Rocks notifications
- [ ] Toggle: Reply notifications

---

### SET-04: Account Management (P0)
**As a** user
**I want** to manage my account
**So that** I have control over my data

**Acceptance Criteria:**
- [ ] Change password (see AUTH-06)
- [ ] Change email (with verification)
- [ ] Deactivate account
- [ ] Export my data (P2)

---

## Epic 14: Notifications & Reminders

### NOT-01: Stage Reminder Email (P1)
**As a** user
**I want** to receive an email when a stage is about to end
**So that** I don't forget to check my tumbler

**Acceptance Criteria:**
- [ ] User configures reminder when creating stage run
- [ ] Options: "Remind X days before end" or "Remind at expected end"
- [ ] Email sent at configured time
- [ ] Email contains: cycle name, stage name, expected end date

---

### NOT-02: Comment Notification (P1)
**As a** post author
**I want** to be notified when someone comments on my post
**So that** I can respond

**Acceptance Criteria:**
- [ ] Email sent when new comment added
- [ ] Batched if multiple comments (not spammy)
- [ ] Can disable in settings

---

### NOT-03: Reply Notification (P1)
**As a** comment author
**I want** to be notified when someone replies to my comment
**So that** I can continue the conversation

**Acceptance Criteria:**
- [ ] Email sent when reply added
- [ ] Can disable in settings

---

### NOT-04: Ugly Rock Notification (P1)
**As a** post author
**I want** to be notified when my post receives Ugly Rocks
**So that** I know people like my work

**Acceptance Criteria:**
- [ ] Email sent (batched, e.g., "You received 5 Ugly Rocks today")
- [ ] Not sent for every single vote
- [ ] Can disable in settings

---

## Epic 15: Admin & Moderation

### ADM-01: View Moderation Queue (P2)
**As a** moderator
**I want** to see reported content
**So that** I can take action

**Acceptance Criteria:**
- [ ] Queue shows: reported comments, flagged posts
- [ ] Shows: content, reporter, reason, date
- [ ] Actions: Hide, Delete, Dismiss

---

### ADM-02: Hide Content (P2)
**As a** moderator
**I want** to hide inappropriate content
**So that** other users don't see it

**Acceptance Criteria:**
- [ ] "Hide" action on posts and comments
- [ ] Hidden content shows "Removed by moderator" placeholder
- [ ] Action is logged

---

### ADM-03: Manage Users (P2)
**As an** admin
**I want** to manage user accounts
**So that** I can handle issues

**Acceptance Criteria:**
- [ ] View user list
- [ ] Reset user password
- [ ] Deactivate user account
- [ ] View user's public posts

---

### ADM-04: Review Specimen Suggestions (P2)
**As a** moderator
**I want** to review specimen suggestions
**So that** good ones can be added to the master list

**Acceptance Criteria:**
- [ ] Queue shows pending suggestions
- [ ] Can approve (creates specimen) or reject (dismisses)
- [ ] Submitter notified of outcome

---

### ADM-05: Manage Specimens (P2)
**As an** admin
**I want** to add/edit specimens
**So that** the reference data stays accurate

**Acceptance Criteria:**
- [ ] CRUD for specimens
- [ ] Cannot delete (only deactivate)
- [ ] Changes logged

---

### ADM-06: Manage Materials (P2)
**As an** admin
**I want** to add/edit materials
**So that** the reference data stays accurate

**Acceptance Criteria:**
- [ ] CRUD for materials
- [ ] Cannot delete (only deactivate)
- [ ] Changes logged

---

## Epic 16: Export

### EXP-01: Export Cycle to CSV (P2)
**As a** user
**I want** to export a cycle to CSV
**So that** I have a backup or can analyze in spreadsheet

**Acceptance Criteria:**
- [ ] "Export CSV" button on cycle detail
- [ ] Includes: cycle info, stages, materials, cleaning runs
- [ ] Downloads as .csv file

---

### EXP-02: Export Cycle to Markdown (P2)
**As a** user
**I want** to export a cycle as readable text
**So that** I can share or print it

**Acceptance Criteria:**
- [ ] "Export Markdown" button
- [ ] Human-readable summary format
- [ ] Downloads as .md file

---

### EXP-03: Full Data Export (P2)
**As a** user
**I want** to export all my data
**So that** I have a complete backup

**Acceptance Criteria:**
- [ ] "Export All Data" in settings
- [ ] Includes: cycles, posts, comments, profile, settings
- [ ] Downloads as .zip file
- [ ] May take time to generate (async with email notification)

---

## Epic 17: Learn Section

### LRN-01: Browse Learn Section (P2)
**As a** user
**I want** to access learning resources
**So that** I can improve my tumbling

**Acceptance Criteria:**
- [ ] "Learn" section in navigation
- [ ] Links to: Specimens, Materials, FAQ
- [ ] Future: Guides, tutorials

---

### LRN-02: View FAQ (P2)
**As a** user
**I want** to read FAQs
**So that** I can find answers to common questions

**Acceptance Criteria:**
- [ ] FAQ page with expandable questions
- [ ] Covers: tumbling basics, app usage, troubleshooting

---

## Summary

### MVP (P0) Stories: 35
- Authentication: 6
- Dashboard: 2
- Cycle Management: 7
- Stage Runs: 7
- My Tumblers: 6
- Specimens: 2
- Materials: 2
- Settings: 3

### MVP+ (P1) Stories: 24
- Dashboard: 1
- Cleaning Runs: 4
- Public Posts: 5
- Voting: 3
- Comments: 5
- Profiles: 3
- Settings: 1
- Notifications: 4

### Future (P2) Stories: 13
- Cycle Management: 1
- Specimens: 2
- Admin: 6
- Export: 3
- Learn: 2

---

## Next Steps

1. Review stories for completeness
2. Add any missing stories
3. Proceed to Sitemap (`03-SITEMAP.md`)
