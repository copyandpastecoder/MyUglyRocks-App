# MyUglyRocks - Sequence Diagrams

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [05-API-SPEC.md](05-API-SPEC.md), [06-ARCHITECTURE.md](06-ARCHITECTURE.md) |

---

## Overview

This document contains sequence diagrams for complex multi-step interactions in the MyUglyRocks application. Each diagram shows the flow of data between components.

### Diagram Legend

| Component | Description |
|-----------|-------------|
| **Browser** | User's web browser |
| **Next.js** | Frontend application (Railway) |
| **API** | ASP.NET Core backend (Railway) |
| **DB** | PostgreSQL database |
| **Redis** | Cache / session store |
| **R2** | Cloudflare R2 image storage |
| **Hangfire** | Background job processor |
| **Resend** | Email service |

---

## 1. Authentication Flow

### 1.1 User Registration

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │   DB    │     │ Resend  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ Submit registration form      │               │               │
     │──────────────>│               │               │               │
     │               │               │               │               │
     │               │ POST /auth/register           │               │
     │               │──────────────>│               │               │
     │               │               │               │               │
     │               │               │ Check email exists             │
     │               │               │──────────────>│               │
     │               │               │<──────────────│               │
     │               │               │               │               │
     │               │               │ Hash password │               │
     │               │               │───────┐       │               │
     │               │               │<──────┘       │               │
     │               │               │               │               │
     │               │               │ Create user + settings         │
     │               │               │──────────────>│               │
     │               │               │<──────────────│               │
     │               │               │               │               │
     │               │               │ Generate verification token    │
     │               │               │───────┐       │               │
     │               │               │<──────┘       │               │
     │               │               │               │               │
     │               │               │ Queue verification email       │
     │               │               │──────────────────────────────>│
     │               │               │               │               │
     │               │ 201 Created   │               │               │
     │               │<──────────────│               │               │
     │               │               │               │               │
     │ Redirect to /check-email      │               │               │
     │<──────────────│               │               │               │
     │               │               │               │               │
```

**Steps:**
1. User submits registration form (email, username, password, displayName)
2. Frontend sends POST to `/auth/register`
3. API checks if email/username already exists
4. API hashes password using ASP.NET Identity
5. API creates User and UserSettings records
6. API generates email verification token
7. API queues verification email via Resend
8. API returns 201 Created
9. Frontend redirects to "check your email" page

---

### 1.2 User Login

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │   DB    │     │  Redis  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ Submit login form             │               │               │
     │──────────────>│               │               │               │
     │               │               │               │               │
     │               │ POST /auth/login              │               │
     │               │──────────────>│               │               │
     │               │               │               │               │
     │               │               │ Find user by email             │
     │               │               │──────────────>│               │
     │               │               │<──────────────│               │
     │               │               │               │               │
     │               │               │ Verify password                │
     │               │               │───────┐       │               │
     │               │               │<──────┘       │               │
     │               │               │               │               │
     │               │               │ Check email verified           │
     │               │               │───────┐       │               │
     │               │               │<──────┘       │               │
     │               │               │               │               │
     │               │               │ Generate access token (15 min) │
     │               │               │───────┐       │               │
     │               │               │<──────┘       │               │
     │               │               │               │               │
     │               │               │ Generate refresh token (7 days)│
     │               │               │───────┐       │               │
     │               │               │<──────┘       │               │
     │               │               │               │               │
     │               │               │ Store refresh token            │
     │               │               │──────────────────────────────>│
     │               │               │               │               │
     │               │ 200 OK + Set-Cookie (httpOnly)│               │
     │               │<──────────────│               │               │
     │               │               │               │               │
     │ Set cookies + redirect /dashboard             │               │
     │<──────────────│               │               │               │
     │               │               │               │               │
```

**Cookies Set:**
- `access_token`: httpOnly, Secure, SameSite=Lax, Path=/, MaxAge=15min
- `refresh_token`: httpOnly, Secure, SameSite=Strict, Path=/api/v1/auth, MaxAge=7days

---

### 1.3 Token Refresh

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │  Redis  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ API request (access_token expired)            │
     │──────────────>│               │               │
     │               │               │               │
     │               │ GET /cycles (401 Unauthorized)│
     │               │──────────────>│               │
     │               │<──────────────│               │
     │               │               │               │
     │               │ POST /auth/refresh            │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Validate refresh token         │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Revoke old refresh token       │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │ Generate new tokens            │
     │               │               │───────┐       │
     │               │               │<──────┘       │
     │               │               │               │
     │               │               │ Store new refresh token        │
     │               │               │──────────────>│
     │               │               │               │
     │               │ 200 OK + Set-Cookie           │
     │               │<──────────────│               │
     │               │               │               │
     │               │ Retry: GET /cycles            │
     │               │──────────────>│               │
     │               │<──────────────│               │
     │               │               │               │
     │ Return data   │               │               │
     │<──────────────│               │               │
     │               │               │               │
```

**Key Points:**
- Refresh token rotation: old token is invalidated, new one issued
- If refresh fails, user is redirected to login
- Frontend handles 401 transparently with automatic retry

---

### 1.4 Logout

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │  Redis  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Click logout  │               │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ POST /auth/logout             │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Revoke refresh token           │
     │               │               │──────────────>│
     │               │               │               │
     │               │ 200 OK + Clear cookies        │
     │               │<──────────────│               │
     │               │               │               │
     │ Clear cookies + redirect /    │               │
     │<──────────────│               │               │
     │               │               │               │
```

---

## 2. Create Cycle from Template

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Click "New Cycle"             │               │
     │──────────────>│               │               │
     │               │               │               │
     │ Navigate to /cycles/new       │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Select "Use a Template"       │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ GET /templates                │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Fetch user templates           │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │ 200 OK (template list)        │
     │               │<──────────────│               │
     │               │               │               │
     │ Show template selector        │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Select template + fill form   │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ POST /cycles/from-template    │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Fetch template with stageData  │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Begin transaction              │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │ Create Cycle  │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Create CycleSpecimens          │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Create CycleTags               │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ For each stage in template:    │
     │               │               │ ┌─────────────────────────────┐│
     │               │               │ │ Create StageRun             ││
     │               │               │ │ Create StageMaterials       ││
     │               │               │ └─────────────────────────────┘│
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Increment template.usageCount  │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │ Commit transaction             │
     │               │               │──────────────>│
     │               │               │               │
     │               │ 201 Created (cycle with stages)│
     │               │<──────────────│               │
     │               │               │               │
     │ Redirect to /cycles/{cycleId} │               │
     │<──────────────│               │               │
     │               │               │               │
```

**Entities Created:**
1. `Cycle` - Main cycle record
2. `CycleSpecimen` - Junction table linking specimens
3. `CycleTag` - Junction table linking tags (if any)
4. `StageRun` (multiple) - One for each stage in template, status="Pending"
5. `StageMaterial` (multiple) - Materials for each stage

**Template stageData Structure:**
```json
[
  {
    "stageName": "Stage 1 - Coarse",
    "durationDays": 7,
    "durationHours": 0,
    "materials": [
      { "materialId": "uuid", "displayAmount": 2, "displayUnit": "tbsp" }
    ]
  }
]
```

---

## 3. Photo Upload Pipeline

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │   R2    │     │   DB    │     │Hangfire │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │               │
     │ Select photos + upload        │               │               │               │
     │──────────────>│               │               │               │               │
     │               │               │               │               │               │
     │               │ POST /stages/{id}/photos      │               │               │
     │               │ (multipart/form-data)         │               │               │
     │               │──────────────>│               │               │               │
     │               │               │               │               │               │
     │               │               │ Validate ownership             │               │
     │               │               │──────────────────────────────>│               │
     │               │               │<──────────────────────────────│               │
     │               │               │               │               │               │
     │               │               │ For each photo:│               │               │
     │               │               │ ┌─────────────────────────────────────────────┐
     │               │               │ │                                             │
     │               │               │ │ Validate file type/size      │               │
     │               │               │ │───────┐       │               │               │
     │               │               │ │<──────┘       │               │               │
     │               │               │ │               │               │               │
     │               │               │ │ Generate photo ID             │               │
     │               │               │ │───────┐       │               │               │
     │               │               │ │<──────┘       │               │               │
     │               │               │ │               │               │               │
     │               │               │ │ Upload original to R2         │               │
     │               │               │ │──────────────>│               │               │
     │               │               │ │<──────────────│               │               │
     │               │               │ │               │               │               │
     │               │               │ │ Create Photo record           │               │
     │               │               │ │──────────────────────────────>│               │
     │               │               │ │<──────────────────────────────│               │
     │               │               │ │               │               │               │
     │               │               │ │ Queue ProcessPhotoJob         │               │
     │               │               │ │──────────────────────────────────────────────>│
     │               │               │ │               │               │               │
     │               │               │ └─────────────────────────────────────────────┘
     │               │               │               │               │               │
     │               │ 201 Created (photo URLs)      │               │               │
     │               │<──────────────│               │               │               │
     │               │               │               │               │               │
     │ Show photos (original size)   │               │               │               │
     │<──────────────│               │               │               │               │
     │               │               │               │               │               │
     │               │               │               │               │               │
     │ ═══════════════════════════ ASYNC (Background Job) ═══════════════════════════│
     │               │               │               │               │               │
     │               │               │               │               │     Process   │
     │               │               │               │               │     Photo     │
     │               │               │               │               │<──────────────│
     │               │               │               │               │               │
     │               │               │               │ Download original              │
     │               │               │               │<──────────────────────────────│
     │               │               │               │               │               │
     │               │               │               │ Generate sizes:│               │
     │               │               │               │ • thumb (200px)│               │
     │               │               │               │ • medium (600px)               │
     │               │               │               │ • large (1200px)               │
     │               │               │               │───────────────────────────────│
     │               │               │               │               │               │
     │               │               │               │ Upload variants│               │
     │               │               │<──────────────────────────────│               │
     │               │               │               │               │               │
     │               │               │               │ Update Photo record            │
     │               │               │               │ (dimensions, processedAt)      │
     │               │               │               │<──────────────────────────────│
     │               │               │               │               │               │
```

**Photo Storage Paths:**
```
/cycles/{cycleId}/stages/{stageRunId}/{photoId}_original.jpg
/cycles/{cycleId}/stages/{stageRunId}/{photoId}_large.jpg
/cycles/{cycleId}/stages/{stageRunId}/{photoId}_medium.jpg
/cycles/{cycleId}/stages/{stageRunId}/{photoId}_thumb.jpg
```

**Key Points:**
- Original upload is synchronous (user sees success immediately)
- Image resizing is asynchronous (Hangfire job)
- Frontend shows original until variants are ready
- Failed processing doesn't block user workflow

---

## 4. Stage Completion with Results

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Click "Complete Stage"        │               │
     │──────────────>│               │               │
     │               │               │               │
     │ Show completion modal         │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Fill result data (optional):  │               │
     │ • Rating (1-5)                │               │
     │ • Result sliders              │               │
     │ • Issue flags                 │               │
     │ • Lessons learned             │               │
     │ • Next action                 │               │
     │ • Weight after                │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ POST /stages/{id}/complete    │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Validate ownership             │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Check stage status = Active    │
     │               │               │───────┐       │               │
     │               │               │<──────┘       │               │
     │               │               │               │
     │               │               │ Update StageRun:               │
     │               │               │ • status = Completed           │
     │               │               │ • resultRating                 │
     │               │               │ • resultShapeRounding          │
     │               │               │ • resultScratchLevel           │
     │               │               │ • resultPitting                │
     │               │               │ • resultShine                  │
     │               │               │ • issueScratches               │
     │               │               │ • issueChips                   │
     │               │               │ • issueUnderRounded            │
     │               │               │ • issueContamination           │
     │               │               │ • lessonsLearned               │
     │               │               │ • nextAction                   │
     │               │               │ • loadWeightAfterGrams         │
     │               │               │ • actualEndDateTime            │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Create Activity record         │
     │               │               │──────────────>│
     │               │               │               │
     │               │ 200 OK (updated stage)        │
     │               │<──────────────│               │
     │               │               │               │
     │ Show success toast            │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Refresh cycle timeline        │               │
     │<──────────────│               │               │
     │               │               │               │
     │               │               │               │
     │ IF nextAction = "RepeatStage":│               │
     │ Show "Create next stage?" prompt              │
     │<──────────────│               │               │
     │               │               │               │
     │ IF nextAction = "EndCycle":   │               │
     │ Show "Complete cycle?" prompt │               │
     │<──────────────│               │               │
     │               │               │               │
```

**Next Action Options:**
| Value | Frontend Behavior |
|-------|-------------------|
| `Proceed` | No prompt, user manually adds next stage |
| `RepeatStage` | Prompt: "Would you like to run this stage again?" |
| `EndCycle` | Prompt: "Would you like to complete the cycle?" |

---

## 5. Share to Gallery

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Click "Share to Gallery"      │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ GET /cycles/{id}/photos       │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Fetch all cycle photos         │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │ 200 OK (photos by stage)      │
     │               │<──────────────│               │
     │               │               │               │
     │ Show share modal:             │               │
     │ • Title input                 │               │
     │ • Body textarea               │               │
     │ • Photo selector (checkboxes) │               │
     │ • Tag selector                │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Select photos + fill details  │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ POST /posts   │               │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Validate cycle ownership       │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Validate photos belong to cycle│
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Begin transaction              │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │ Create Post record             │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Create PostPhoto records       │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Create PostTag records         │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Create Activity record         │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │ Commit transaction             │
     │               │               │──────────────>│
     │               │               │               │
     │               │ 201 Created (post with URL)   │
     │               │<──────────────│               │
     │               │               │               │
     │ Show success + link to post   │               │
     │<──────────────│               │               │
     │               │               │               │
```

**Post Creation Data:**
```json
{
  "cycleId": "uuid",
  "title": "My Amazing Agates!",
  "body": "Check out these beauties from Lake Superior...",
  "photoIds": ["uuid1", "uuid2", "uuid3"],
  "tagIds": ["uuid1", "uuid2"]
}
```

**Key Points:**
- Photos are not duplicated; `PostPhoto` references existing `Photo` records
- Post inherits cycle's specimens for display
- Activity record created for user's feed
- Post is immediately public (no moderation queue in MVP)

---

## 6. Stage Reminder Notifications

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│Hangfire │     │   DB    │     │  Redis  │     │ Resend  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Cron: Run every hour          │               │
     │───────┐       │               │               │
     │<──────┘       │               │               │
     │               │               │               │
     │ Find stages ending in next 24h│               │
     │ WHERE reminderEnabled = true  │               │
     │   AND reminderSentAt IS NULL  │               │
     │   AND status = 'Active'       │               │
     │──────────────>│               │               │
     │<──────────────│               │               │
     │               │               │               │
     │ For each stage:               │               │
     │ ┌────────────────────────────────────────────┐
     │ │                              │               │
     │ │ Check user notification prefs│               │
     │ │──────────────>│               │               │
     │ │<──────────────│               │               │
     │ │               │               │               │
     │ │ IF notifyStageReminders = true              │
     │ │   AND not in quiet hours:   │               │
     │ │               │               │               │
     │ │ Check rate limit (1/stage)  │               │
     │ │──────────────────────────────>│               │
     │ │<──────────────────────────────│               │
     │ │               │               │               │
     │ │ Send reminder email          │               │
     │ │──────────────────────────────────────────────>│
     │ │               │               │               │
     │ │ Update stage.reminderSentAt  │               │
     │ │──────────────>│               │               │
     │ │               │               │               │
     │ └────────────────────────────────────────────┘
     │               │               │               │
```

**Reminder Email Content:**
- Subject: "Stage ending soon: {stageName} in {cycleName}"
- Body: Stage details, remaining time, link to cycle

---

## 7. Vote (Ugly Rocks) Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Click "Give an Ugly Rock"     │               │
     │──────────────>│               │               │
     │               │               │               │
     │ Optimistic update: +1 count   │               │
     │<──────────────│               │               │
     │               │               │               │
     │               │ POST /posts/{id}/vote         │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Check existing vote            │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ IF already voted:              │
     │               │               │   Return 409 Conflict          │
     │               │               │               │
     │               │               │ Create Vote record             │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Update post.uglyRocksCount     │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │ Create Activity (for author)   │
     │               │               │──────────────>│
     │               │               │               │
     │               │ 200 OK { uglyRocksCount, hasVoted }            │
     │               │<──────────────│               │
     │               │               │               │
     │ Confirm optimistic update     │               │
     │<──────────────│               │               │
     │               │               │               │
     │               │               │               │
     │ ══════════════ ERROR CASE ═══════════════════│
     │               │               │               │
     │               │ 409 Conflict (already voted)  │
     │               │<──────────────│               │
     │               │               │               │
     │ Rollback optimistic update    │               │
     │<──────────────│               │               │
     │               │               │               │
```

**Optimistic Update:**
Frontend immediately shows the vote to feel responsive, then confirms or rolls back based on API response.

---

## 8. Save Cycle as Template

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Next.js │     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Click "Save as Template"      │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ GET /cycles/{id}              │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Fetch cycle with stages        │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │ 200 OK (cycle data)           │
     │               │<──────────────│               │
     │               │               │               │
     │ Show template modal:          │               │
     │ • Template name               │               │
     │ • Description                 │               │
     │ • Stage checklist             │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Fill details + select stages  │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ POST /templates               │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Validate user template count   │
     │               │               │ (max 20)      │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Build stageData from selected  │
     │               │               │ stages:       │
     │               │               │ • stageName   │
     │               │               │ • durationDays│
     │               │               │ • durationHours                │
     │               │               │ • materials (id, amount, unit) │
     │               │               │───────┐       │
     │               │               │<──────┘       │
     │               │               │               │
     │               │               │ Create Template record         │
     │               │               │ (stageData as JSONB)           │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │               │
     │               │               │ Link TemplateSpecimens         │
     │               │               │──────────────>│
     │               │               │               │
     │               │ 201 Created (template)        │
     │               │<──────────────│               │
     │               │               │               │
     │ Show success toast            │               │
     │<──────────────│               │               │
     │               │               │               │
```

**stageData JSONB Structure:**
```json
[
  {
    "stageName": "Stage 1 - Coarse",
    "durationDays": 7,
    "durationHours": 0,
    "materials": [
      {
        "materialId": "uuid",
        "displayAmount": 2,
        "displayUnit": "tbsp"
      }
    ]
  }
]
```

---

## Related Documents

- [04-DATA-MODEL.md](04-DATA-MODEL.md) - Entity definitions
- [05-API-SPEC.md](05-API-SPEC.md) - API endpoint details
- [06-ARCHITECTURE.md](06-ARCHITECTURE.md) - System architecture
- [decisions/ADR-002-auth-strategy.md](decisions/ADR-002-auth-strategy.md) - Authentication decision
