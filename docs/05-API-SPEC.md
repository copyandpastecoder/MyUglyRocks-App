# MyUglyRocks - API Specification

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [04-DATA-MODEL.md](04-DATA-MODEL.md), [02-USER-STORIES.md](02-USER-STORIES.md) |

---

## 1. Overview

### 1.1 API Style
- **Architecture:** RESTful API
- **Format:** JSON
- **Authentication:** JWT tokens in httpOnly cookies
- **Versioning:** URL path prefix `/api/v1/`

### 1.2 Base URL
```
Production: https://myuglyrocks.com/api/v1
Development: https://dev.myuglyrocks.com/api/v1
```

### 1.3 Common Headers
| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Accept` | Yes | `application/json` |
| `X-Request-Id` | No | Client-generated UUID for request tracing |

---

## 2. Authentication

### 2.1 Password Requirements

Passwords must meet the following industry-standard requirements:

| Requirement | Description |
|-------------|-------------|
| Minimum length | 8 characters |
| Uppercase | At least one uppercase letter (A-Z) |
| Lowercase | At least one lowercase letter (a-z) |
| Number | At least one digit (0-9) |
| Special character | At least one special character (!@#$%^&*()_+-=[]{}|;:',.<>?) |

**Validation Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Password does not meet requirements",
    "details": [
      { "field": "password", "message": "Password must be at least 8 characters" },
      { "field": "password", "message": "Password must contain at least one uppercase letter" }
    ]
  }
}
```

### 2.2 Auth Endpoints

#### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "rockfan42",
  "password": "SecureP@ss123",
  "displayName": "Rock Fan"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "uuid"
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Validation error (weak password, invalid email) |
| 409 | Email or username already exists |

---

#### POST /auth/login
Authenticate user and set JWT cookie.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "rockfan42",
    "displayName": "Rock Fan",
    "avatarUrl": "https://...",
    "role": "User"
  }
}
```

**Cookies Set:**
- `access_token` (httpOnly, secure, 15 min expiry)
- `refresh_token` (httpOnly, secure, 7 day expiry)

**Errors:**
| Code | Description |
|------|-------------|
| 401 | Invalid credentials |
| 403 | Email not verified |
| 423 | Account locked - check email to unlock (after 5 failed attempts) |

**Notes:**
- After 5 failed login attempts, account is locked
- Locked account receives unlock email automatically
- Use `GET /auth/unlock-account?token=...` to unlock

---

#### POST /auth/logout
Clear auth cookies and revoke refresh token.

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### POST /auth/refresh
Refresh access token using refresh token cookie.

**Response (200 OK):**
```json
{
  "message": "Token refreshed"
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 401 | Invalid or expired refresh token |

---

#### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account exists with this email, a reset link has been sent."
}
```

---

#### POST /auth/reset-password
Reset password using token from email.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecureP@ss456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully. Please login with your new password."
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid or expired token |
| 400 | Password validation failed |

---

#### POST /auth/verify-email
Verify email address using token.

**Request:**
```json
{
  "token": "verification-token-from-email"
}
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully."
}
```

---

#### POST /auth/resend-verification
Resend email verification link.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If the email is registered and unverified, a new verification link has been sent."
}
```

---

#### GET /auth/unlock-account
Unlock a locked account using token from email.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | Unlock token from email |

**Response (200 OK):**
```json
{
  "message": "Account unlocked successfully. You may now login."
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid or expired unlock token |

**Notes:**
- Account gets locked after 5 failed login attempts
- User receives email with unlock link
- Token is valid for 24 hours
- Token is single-use

---

#### POST /auth/request-unlock
Request a new unlock email (if token expired).

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If the account is locked, an unlock link has been sent."
}
```

**Notes:**
- Same response regardless of whether email exists or is locked (security)
- Rate limited: 3 requests per hour per IP

---

## 3. Users

### 3.1 User Endpoints

#### GET /users/me
Get current authenticated user profile.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "username": "rockfan42",
  "displayName": "Rock Fan",
  "bio": "I love tumbling agates!",
  "avatarUrl": "https://...",
  "role": "User",
  "emailVerified": true,
  "dateCreated": "2025-01-15T10:30:00Z",
  "stats": {
    "totalCycles": 12,
    "activeCycles": 2,
    "completedCycles": 10,
    "totalPosts": 5,
    "totalUglyRocks": 47
  }
}
```

---

#### PATCH /users/me
Update current user profile.

**Auth Required:** Yes

**Request:**
```json
{
  "displayName": "Rock Enthusiast",
  "bio": "Tumbling since 2020!"
}
```

**Response (200 OK):** Updated user object

---

#### POST /users/me/avatar
Upload new avatar image.

**Auth Required:** Yes

**Request:** `multipart/form-data` with `avatar` file field

**Response (200 OK):**
```json
{
  "avatarUrl": "https://r2.myuglyrocks.com/avatars/uuid.jpg"
}
```

---

#### DELETE /users/me/avatar
Remove current avatar.

**Auth Required:** Yes

**Response (204 No Content)**

---

#### GET /users/:username
Get public user profile.

**Response (200 OK):**
```json
{
  "userId": "uuid",
  "username": "rockfan42",
  "displayName": "Rock Fan",
  "bio": "I love tumbling agates!",
  "avatarUrl": "https://...",
  "dateCreated": "2025-01-15T10:30:00Z",
  "stats": {
    "totalPosts": 5,
    "totalUglyRocks": 47
  }
}
```

---

## 4. User Settings

#### GET /users/me/settings
Get current user settings.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "measurementSystem": "Imperial",
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "12h",
  "timezone": "America/New_York",
  "theme": "Amber",

  "firstDayOfWeek": "Sunday",
  "showRelativeTimes": true,
  "fontSize": "Normal",
  "density": "Comfortable",

  "trackingMode": "Easy",
  "autoFillFromLastRun": true,
  "defaultHomeSection": "ActiveCycles",

  "notifyStageReminders": true,
  "notifyComments": true,
  "notifyReplies": true,
  "notifyUglyRocks": true,
  "notifyRecipeCloned": true,
  "digestFrequency": "Instant",
  "quietHoursEnabled": false,
  "quietHoursStart": null,
  "quietHoursEnd": null,

  "photoUploadQuality": "Balanced",
  "addWatermark": false,
  "defaultPostVisibility": "Private",

  "stageFieldVisibility": {
    "materials": true,
    "cleaningRun": true,
    "reminder": true,
    "notes": true,
    "photos": true,
    "duration": true,
    "fillLevel": true,
    "waterLevel": true,
    "plasticPellets": true,
    "resultRating": true,
    "resultSliders": false,
    "issueFlags": true,
    "lessonsLearned": true
  }
}
```

---

#### PATCH /users/me/settings
Update user settings.

**Auth Required:** Yes

**Request:**
```json
{
  "theme": "Teal",
  "measurementSystem": "Metric",
  "notifyComments": false
}
```

**Response (200 OK):** Updated settings object

---

#### PATCH /users/me/password
Change password.

**Auth Required:** Yes

**Request:**
```json
{
  "currentPassword": "OldP@ssword123",
  "newPassword": "NewP@ssword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

## 5. Cycles

### 5.1 Cycle Endpoints

#### GET /cycles
List user's cycles with filtering and pagination.

**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | `all` | `active`, `completed`, `archived`, `all` |
| `sort` | string | `recent` | `recent`, `oldest`, `name` |
| `specimen` | uuid | - | Filter by specimen ID |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |

**Response (200 OK):**
```json
{
  "data": [
    {
      "cycleId": "uuid",
      "name": "Lake Superior Agates",
      "status": "Active",
      "startDate": "2025-01-15",
      "endDate": null,
      "specimens": [
        { "specimenId": "uuid", "commonName": "Agate" }
      ],
      "additionalSpecimens": "Some jasper pieces",
      "currentStage": {
        "stageRunId": "uuid",
        "stageName": "Stage 2 - Medium",
        "status": "Active",
        "endDateTime": "2025-01-22T14:00:00Z"
      },
      "stageCount": 2,
      "photoCount": 8,
      "dateCreated": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 45,
    "totalPages": 3
  }
}
```

---

#### POST /cycles
Create a new cycle.

**Auth Required:** Yes

**Request:**
```json
{
  "name": "Beach Stones Batch 1",
  "startDate": "2025-01-20",
  "specimenIds": ["uuid1", "uuid2"],
  "additionalSpecimens": "Mixed beach pebbles",
  "notes": "Found these on vacation",
  "goal": "Mirror polish for display",
  "difficultyRating": 3,
  "tagIds": ["uuid1", "uuid2"]
}
```

**Optional Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `goal` | string | What user hopes to achieve (free text) |
| `difficultyRating` | int | Expected difficulty 1-5 |
| `tagIds` | uuid[] | Array of tag IDs to associate with cycle |

**Response (201 Created):**
```json
{
  "cycleId": "uuid",
  "name": "Beach Stones Batch 1",
  "status": "Active",
  "startDate": "2025-01-20",
  "goal": "Mirror polish for display",
  "difficultyRating": 3,
  "tags": [
    { "tagId": "uuid1", "name": "Lake Superior", "colorHex": "#3B82F6" }
  ],
  ...
}
```

---

#### GET /cycles/:cycleId
Get cycle details.

**Auth Required:** Yes (must be owner)

**Response (200 OK):**
```json
{
  "cycleId": "uuid",
  "name": "Lake Superior Agates",
  "status": "Active",
  "startDate": "2025-01-15",
  "endDate": null,
  "finalQuality": null,
  "goal": "Mirror polish for display",
  "difficultyRating": 3,
  "tags": [
    { "tagId": "uuid", "name": "Lake Superior", "colorHex": "#3B82F6" },
    { "tagId": "uuid", "name": "2025 Collection", "colorHex": "#10B981" }
  ],
  "specimens": [
    {
      "specimenId": "uuid",
      "commonName": "Agate",
      "mohsHardnessMin": 6.5,
      "mohsHardnessMax": 7.0
    }
  ],
  "additionalSpecimens": "Some jasper pieces",
  "notes": "Great batch from the lake",
  "stages": [
    {
      "stageRunId": "uuid",
      "stageName": "Stage 1 - Coarse",
      "runNumber": 1,
      "status": "Completed",
      "tumbler": { "tumblerId": "uuid", "brand": "Lortone", "model": "3A" },
      "startDateTime": "2025-01-15T10:00:00Z",
      "endDateTime": "2025-01-22T10:00:00Z",
      "durationDays": 7,
      "durationHours": 0,
      "materials": [
        { "materialId": "uuid", "commonName": "60/90 Silicon Carbide", "displayAmount": 2, "displayUnit": "tbsp" }
      ],
      "photoCount": 4,
      "hasCleaningRun": true,
      "resultRating": 4
    },
    {
      "stageRunId": "uuid",
      "stageName": "Stage 2 - Medium",
      "runNumber": 1,
      "status": "Active",
      ...
    }
  ],
  "dateCreated": "2025-01-15T10:30:00Z",
  "dateUpdated": "2025-01-22T14:00:00Z"
}
```

---

#### PATCH /cycles/:cycleId
Update cycle details.

**Auth Required:** Yes (must be owner)

**Request:**
```json
{
  "name": "Lake Superior Agates - Batch 2",
  "notes": "Updated notes"
}
```

**Response (200 OK):** Updated cycle object

---

#### POST /cycles/:cycleId/complete
Mark cycle as completed.

**Auth Required:** Yes (must be owner)

**Request:**
```json
{
  "finalQuality": 4,
  "notes": "Great results!"
}
```

**Response (200 OK):** Updated cycle with status "Completed"

---

#### POST /cycles/:cycleId/archive
Archive a completed cycle.

**Auth Required:** Yes (must be owner)

**Response (200 OK):** Updated cycle with status "Archived"

---

#### DELETE /cycles/:cycleId
Soft delete a cycle.

**Auth Required:** Yes (must be owner)

**Response (204 No Content)**

---

#### POST /cycles/:cycleId/duplicate
Create a copy of an existing cycle with all its stages (without photos).

**Auth Required:** Yes (must be owner)

**Request:**
```json
{
  "name": "Lake Superior Agates - Copy"
}
```

**Response (201 Created):**
```json
{
  "cycleId": "new-uuid",
  "name": "Lake Superior Agates - Copy",
  "status": "Active",
  "message": "Cycle duplicated with 4 stages"
}
```

**Notes:**
- Copies all stages with their configurations (tumbler, materials, duration)
- Does NOT copy photos
- Does NOT copy cleaning runs (user may want different cleaning setups)
- New cycle starts with status "Active"
- Stage statuses reset to "Pending"

---

#### GET /cycles/:cycleId/export
Export cycle data in various formats.

**Auth Required:** Yes (must be owner)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `format` | string | `json` | `json`, `csv`, `zip` |

**Response (200 OK):**
- `json`: Full cycle data as JSON
- `csv`: Spreadsheet-friendly format with stages as rows
- `zip`: Archive containing JSON data + all photos

**Response Headers:**
```
Content-Type: application/json | text/csv | application/zip
Content-Disposition: attachment; filename="cycle-name-export.json"
```

---

#### POST /cycles/:cycleId/specimens
Add specimens to a cycle.

**Auth Required:** Yes (must be owner)

**Request:**
```json
{
  "specimenIds": ["uuid1", "uuid2"]
}
```

**Response (200 OK):** Updated cycle object with specimens

---

#### DELETE /cycles/:cycleId/specimens/:specimenId
Remove a specimen from a cycle.

**Auth Required:** Yes (must be owner)

**Response (200 OK):** Updated cycle object

---

## 6. Stage Runs

#### GET /cycles/:cycleId/stages
List stages for a cycle.

**Auth Required:** Yes (must be cycle owner)

**Response (200 OK):**
```json
{
  "data": [
    {
      "stageRunId": "uuid",
      "stageName": "Stage 1 - Coarse",
      "runNumber": 1,
      "status": "Completed",
      ...
    }
  ]
}
```

---

#### POST /cycles/:cycleId/stages
Create a new stage run.

**Auth Required:** Yes (must be cycle owner)

**Request:**
```json
{
  "stageName": "Stage 2 - Medium",
  "tumblerId": "uuid",
  "startDateTime": "2025-01-22T10:00:00Z",
  "durationDays": 7,
  "durationHours": 0,
  "reminderEnabled": true,
  "materials": [
    { "materialId": "uuid", "displayAmount": 2, "displayUnit": "tbsp" }
  ],
  "notes": "Starting medium grit",

  "loadWeightBeforeGrams": 1360,
  "barrelRpm": 30,
  "isRpmEstimated": true,
  "fillLevelPercent": 67,
  "waterLevel": "JustCovering",
  "plasticPelletsUsed": true,
  "plasticPelletsPercent": 25
}
```

**Optional Fields (Advanced Mode):**
| Field | Type | Description |
|-------|------|-------------|
| `loadWeightBeforeGrams` | int | Weight before tumbling (stored in grams, displayed per user preference) |
| `barrelRpm` | int | Barrel rotation speed |
| `isRpmEstimated` | bool | Whether RPM is estimated (default true) |
| `fillLevelPercent` | int | Fill level 0-100% |
| `waterLevel` | string | `Dry`, `JustCovering`, `AboveRocks`, `Flooded` |
| `plasticPelletsUsed` | bool | Whether plastic pellets were used |
| `plasticPelletsPercent` | int | Percentage of load that is pellets (0-100) |

**Response (201 Created):** Created stage run object

---

#### GET /stages/:stageRunId
Get stage run details.

**Auth Required:** Yes (must be cycle owner)

**Response (200 OK):**
```json
{
  "stageRunId": "uuid",
  "cycleId": "uuid",
  "stageName": "Stage 2 - Medium",
  "runNumber": 1,
  "status": "Active",
  "tumbler": {
    "tumblerId": "uuid",
    "brand": "Lortone",
    "model": "3A",
    "tumblerType": "Rotary"
  },
  "startDateTime": "2025-01-22T10:00:00Z",
  "endDateTime": "2025-01-29T10:00:00Z",
  "durationDays": 7,
  "durationHours": 0,
  "reminderEnabled": true,
  "reminderSentAt": null,

  "loadWeightBeforeGrams": 1360,
  "loadWeightAfterGrams": 1200,
  "barrelRpm": 30,
  "isRpmEstimated": true,
  "fillLevelPercent": 67,
  "waterLevel": "JustCovering",
  "plasticPelletsUsed": true,
  "plasticPelletsPercent": 25,

  "resultRating": 4,
  "resultShapeRounding": 70,
  "resultScratchLevel": 30,
  "resultPitting": 20,
  "resultShine": null,
  "issueScratches": false,
  "issueChips": true,
  "issueUnderRounded": false,
  "issueContamination": false,
  "lessonsLearned": "Should have run an extra day",
  "nextAction": "Proceed",

  "materials": [
    {
      "stageMaterialId": "uuid",
      "materialId": "uuid",
      "commonName": "120/220 Silicon Carbide",
      "displayAmount": 2,
      "displayUnit": "tbsp",
      "sortOrder": 0
    }
  ],
  "photos": [
    {
      "photoId": "uuid",
      "url": "https://...",
      "photoType": "Before",
      "sortOrder": 0
    }
  ],
  "cleaningRun": {
    "cleaningRunId": "uuid",
    "durationMinutes": 30,
    "status": "Completed",
    "materials": [...]
  },
  "notes": "Starting medium grit",
  "dateCreated": "2025-01-22T10:00:00Z"
}
```

---

#### PATCH /stages/:stageRunId
Update stage run.

**Auth Required:** Yes (must be cycle owner)

**Request:**
```json
{
  "durationDays": 8,
  "notes": "Extended by 1 day"
}
```

**Response (200 OK):** Updated stage run object

---

#### POST /stages/:stageRunId/complete
Mark stage as completed with optional result tracking.

**Auth Required:** Yes (must be cycle owner)

**Request (optional):**
```json
{
  "loadWeightAfterGrams": 1200,

  "resultRating": 4,
  "resultShapeRounding": 70,
  "resultScratchLevel": 30,
  "resultPitting": 20,
  "resultShine": 60,

  "issueScratches": false,
  "issueChips": true,
  "issueUnderRounded": false,
  "issueContamination": false,

  "lessonsLearned": "Should have run an extra day",
  "nextAction": "Proceed"
}
```

**Result Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `loadWeightAfterGrams` | int | Weight after tumbling (in grams) |
| `resultRating` | int | Overall result 1-5 stars |
| `resultShapeRounding` | int | Shape/rounding quality 0-100 slider |
| `resultScratchLevel` | int | Scratch level 0-100 slider (lower is better) |
| `resultPitting` | int | Surface pitting 0-100 slider (lower is better) |
| `resultShine` | int | Shine level 0-100 slider (polish stages only) |
| `issueScratches` | bool | Flag: visible scratches |
| `issueChips` | bool | Flag: chips or fractures |
| `issueUnderRounded` | bool | Flag: needs more rounding |
| `issueContamination` | bool | Flag: grit contamination |
| `lessonsLearned` | string | Notes for future runs |
| `nextAction` | string | `Proceed`, `RepeatStage`, `EndCycle` |

**Response (200 OK):** Updated stage with status "Completed"

---

#### DELETE /stages/:stageRunId
Soft delete a stage run.

**Auth Required:** Yes (must be cycle owner)

**Response (204 No Content)**

---

#### POST /stages/:stageRunId/duplicate
Create a copy of a stage within the same cycle.

**Auth Required:** Yes (must be cycle owner)

**Response (201 Created):**
```json
{
  "stageRunId": "new-uuid",
  "stageName": "Stage 2 - Medium",
  "runNumber": 2,
  "status": "Pending",
  "message": "Stage duplicated successfully"
}
```

**Notes:**
- Copies stage configuration (tumbler, materials, duration, settings)
- Does NOT copy photos
- Does NOT copy cleaning run
- Increments `runNumber` automatically
- New stage starts with status "Pending"

---

#### PUT /stages/:stageRunId/materials
Replace all materials for a stage.

**Auth Required:** Yes (must be cycle owner)

**Request:**
```json
{
  "materials": [
    { "materialId": "uuid", "displayAmount": 2, "displayUnit": "tbsp" },
    { "materialId": "uuid2", "displayAmount": 1, "displayUnit": "cup" }
  ]
}
```

**Response (200 OK):** Updated stage run object with new materials

---

## 7. Cleaning Runs

#### POST /stages/:stageRunId/cleaning
Create cleaning run for a stage.

**Auth Required:** Yes (must be cycle owner)

**Request:**
```json
{
  "durationMinutes": 30,
  "reminderEnabled": false,
  "purpose": "Burnish",
  "materials": [
    { "materialId": "uuid", "displayAmount": 1, "displayUnit": "tbsp" }
  ],
  "notes": "Burnish run"
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `purpose` | string | `CleanGrit`, `Burnish`, `Both` (default: `CleanGrit`) |

**Response (201 Created):** Created cleaning run object

---

#### PATCH /stages/:stageRunId/cleaning
Update cleaning run.

**Auth Required:** Yes (must be cycle owner)

**Request:**
```json
{
  "durationMinutes": 45,
  "notes": "Extended time"
}
```

**Response (200 OK):** Updated cleaning run object

---

#### POST /stages/:stageRunId/cleaning/complete
Mark cleaning run as completed.

**Auth Required:** Yes (must be cycle owner)

**Request (optional):**
```json
{
  "resultNotes": "Rocks came out very clean, no residue"
}
```

**Response (200 OK):** Updated cleaning run with status "Completed"

---

#### DELETE /stages/:stageRunId/cleaning
Delete cleaning run.

**Auth Required:** Yes (must be cycle owner)

**Response (204 No Content)**

---

## 8. Photos

#### POST /stages/:stageRunId/photos
Upload photos to a stage.

**Auth Required:** Yes (must be cycle owner)

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| `photos` | File[] | Up to 10 image files |
| `photoType` | string | `Before`, `During`, or `After` |

**Response (201 Created):**
```json
{
  "photos": [
    {
      "photoId": "uuid",
      "url": "https://...",
      "photoType": "Before",
      "width": 1920,
      "height": 1080,
      "sortOrder": 0
    }
  ]
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid file type (not image) |
| 400 | File too large (> 20 MB) |
| 400 | Too many photos (> 10 per stage) |

---

#### DELETE /photos/:photoId
Delete a photo.

**Auth Required:** Yes (must be cycle owner)

**Response (204 No Content)**

---

#### PATCH /stages/:stageRunId/photos/reorder
Reorder photos within a stage.

**Auth Required:** Yes (must be cycle owner)

**Request:**
```json
{
  "photoIds": ["uuid1", "uuid3", "uuid2"]
}
```

**Response (200 OK):** Updated photos array

---

## 9. Tumbler Models (Seed Data)

#### GET /tumbler-models
List all available tumbler models (seed data for brand/model selection).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `brand` | string | Filter by brand (e.g., "Lortone") |

**Response (200 OK):**
```json
{
  "data": [
    {
      "tumblerModelId": "uuid",
      "brand": "Lortone",
      "model": "3A",
      "tumblerType": "Rotary",
      "defaultCapacityLbs": 3.0,
      "defaultBarrelCount": 1,
      "isCustomEntry": false,
      "sortOrder": 10
    },
    {
      "tumblerModelId": "uuid",
      "brand": "Lortone",
      "model": "QT6 (Dual Barrel)",
      "tumblerType": "Rotary",
      "defaultCapacityLbs": 3.0,
      "defaultBarrelCount": 2,
      "isCustomEntry": false,
      "sortOrder": 15
    },
    {
      "tumblerModelId": "uuid",
      "brand": "Generic",
      "model": "Rotary - Custom",
      "tumblerType": "Rotary",
      "defaultCapacityLbs": null,
      "defaultBarrelCount": 1,
      "isCustomEntry": true,
      "sortOrder": 200
    }
  ]
}
```

---

#### GET /tumbler-models/brands
List all unique brand names (for dropdown).

**Response (200 OK):**
```json
{
  "data": [
    "Lortone",
    "National Geographic",
    "Thumler's Tumbler",
    "Harbor Freight",
    "Generic",
    "DIY",
    "Other"
  ]
}
```

---

## 10. Barrel Nicknames (Seed Data)

#### GET /barrel-nicknames/random
Get random barrel nickname suggestion.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `count` | int | Number of suggestions (default 1, max 5) |
| `exclude` | string[] | Exclude these names (comma-separated) |

**Response (200 OK):**
```json
{
  "data": ["Chompy", "Gritty"]
}
```

---

## 11. Tumblers

#### GET /tumblers
List user's tumblers with barrels.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "data": [
    {
      "tumblerId": "uuid",
      "tumblerModelId": "uuid",
      "brand": "Lortone",
      "model": "3A",
      "tumblerType": "Rotary",
      "isActive": true,
      "notes": "My first tumbler",
      "barrels": [
        {
          "barrelId": "uuid",
          "barrelNumber": 1,
          "nickname": "Chompy",
          "capacityLbs": 3.0,
          "isDedicated": true,
          "dedicatedStages": ["polish"],
          "dateLastDeepClean": "2025-01-10",
          "contaminationNotes": null,
          "isActive": true
        }
      ],
      "stats": {
        "totalCycles": 8,
        "completedCycles": 6
      },
      "currentCycle": {
        "cycleId": "uuid",
        "cycleName": "Lake Superior Agates",
        "currentStageName": "Stage 2 - Medium"
      },
      "dateCreated": "2024-06-15T10:00:00Z"
    },
    {
      "tumblerId": "uuid",
      "tumblerModelId": "uuid",
      "brand": "Lortone",
      "model": "QT6",
      "tumblerType": "Rotary",
      "isActive": true,
      "notes": null,
      "barrels": [
        {
          "barrelId": "uuid",
          "barrelNumber": 1,
          "nickname": "Gritty",
          "capacityLbs": 3.0,
          "isDedicated": false,
          "isActive": true
        },
        {
          "barrelId": "uuid",
          "barrelNumber": 2,
          "nickname": "Rocky",
          "capacityLbs": 3.0,
          "isDedicated": true,
          "dedicatedStages": ["polish", "burnish"],
          "isActive": true
        }
      ],
      "stats": {
        "totalCycles": 3,
        "completedCycles": 3
      },
      "currentCycle": null,
      "dateCreated": "2024-09-20T14:30:00Z"
    }
  ]
}
```

---

#### POST /tumblers
Create a new tumbler with barrels.

**Auth Required:** Yes

**Request (Known Model):**
```json
{
  "tumblerModelId": "uuid",
  "notes": "Got this as a gift",
  "barrels": [
    {
      "nickname": "Chompy",
      "isDedicated": true,
      "dedicatedStages": ["polish"]
    }
  ]
}
```

**Request (Custom/Generic):**
```json
{
  "tumblerModelId": "uuid-for-generic",
  "brand": "DIY",
  "model": "Custom Build",
  "tumblerType": "Rotary",
  "notes": "Homemade PVC barrel tumbler",
  "barrels": [
    {
      "nickname": "Old Reliable",
      "capacityLbs": 5.0,
      "isDedicated": false
    }
  ]
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tumblerModelId` | uuid | Yes | Reference to TumblerModel (use Generic for custom) |
| `brand` | string | For custom | Override brand (for Generic/DIY/Other) |
| `model` | string | For custom | Override model name |
| `tumblerType` | string | For custom | `Rotary` or `Vibratory` |
| `notes` | string | No | User notes |
| `barrels` | array | Yes | Array of barrel configurations |
| `barrels[].nickname` | string | No | Barrel nickname |
| `barrels[].capacityLbs` | decimal | For custom | Capacity (for Generic) |
| `barrels[].isDedicated` | bool | No | Dedicated barrel flag |
| `barrels[].dedicatedStages` | string[] | No | Stage types if dedicated |

**Response (201 Created):** Created tumbler object with barrels

---

#### GET /tumblers/:tumblerId
Get tumbler details.

**Auth Required:** Yes (must be owner or generic)

**Response (200 OK):** Tumbler object

---

#### PATCH /tumblers/:tumblerId
Update tumbler details (not barrels).

**Auth Required:** Yes (must be owner)

**Request:**
```json
{
  "notes": "Updated notes",
  "isActive": true
}
```

**Response (200 OK):** Updated tumbler object

---

#### DELETE /tumblers/:tumblerId
Delete tumbler (only if no stage runs reference it).

**Auth Required:** Yes (must be owner)

**Response (204 No Content)**

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Cannot delete - tumbler is used in stage runs |

---

#### POST /tumblers/:tumblerId/deactivate
Mark tumbler as inactive (if it has stage runs).

**Auth Required:** Yes (must be owner)

**Response (200 OK):** Updated tumbler with isActive = false

---

## 12. Barrels

#### PATCH /barrels/:barrelId
Update barrel details.

**Auth Required:** Yes (must be tumbler owner)

**Request:**
```json
{
  "nickname": "Updated Nickname",
  "isDedicated": true,
  "dedicatedStages": ["polish", "burnish"],
  "contaminationNotes": "May have some 60/90 residue"
}
```

**Response (200 OK):** Updated barrel object

---

#### POST /barrels/:barrelId/deep-clean
Record a deep clean for a specific barrel.

**Auth Required:** Yes (must be tumbler owner)

**Request:**
```json
{
  "cleanDate": "2025-01-20",
  "notes": "Thoroughly cleaned with soap and water"
}
```

**Response (200 OK):**
```json
{
  "barrelId": "uuid",
  "dateLastDeepClean": "2025-01-20",
  "contaminationNotes": null,
  "message": "Deep clean recorded"
}
```

---

#### POST /barrels/:barrelId/deactivate
Mark barrel as inactive.

**Auth Required:** Yes (must be tumbler owner)

**Response (200 OK):** Updated barrel with isActive = false

---

## 13. Specimens

#### GET /specimens
List all active specimens.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by name |
| `materialType` | string | `Rock`, `Mineral`, `Glass`, `Fossil`, `Other` |
| `page` | int | Page number |
| `limit` | int | Items per page |

**Response (200 OK):**
```json
{
  "data": [
    {
      "specimenId": "uuid",
      "commonName": "Agate",
      "scientificName": null,
      "rockFamily": "Chalcedony",
      "materialType": "Mineral",
      "mohsHardnessMin": 6.5,
      "mohsHardnessMax": 7.0,
      "tumblingDifficulty": "Easy",
      "recommendedGritSequence": "60/90 → 120/220 → Pre-polish → Polish"
    }
  ],
  "pagination": { ... }
}
```

---

#### GET /specimens/:specimenId
Get specimen details.

**Response (200 OK):** Full specimen object with all fields

---

#### POST /specimens/suggest
Suggest a new specimen (user submission).

**Auth Required:** Yes

**Request:**
```json
{
  "commonName": "Tiger Iron",
  "details": "Found in Australia, contains tiger eye, jasper, and hematite"
}
```

**Response (201 Created):**
```json
{
  "suggestionId": "uuid",
  "message": "Thank you! Your suggestion will be reviewed."
}
```

---

## 11. Materials

#### GET /materials
List all active materials.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `category` | string | `Abrasive`, `Additive`, `Media`, `Cleaning` |
| `usageType` | string | `Coarse`, `Medium`, `Fine`, `PrePolish`, `Polish`, `Cleaning` |
| `isCleaning` | bool | Filter for cleaning run materials |

**Response (200 OK):**
```json
{
  "data": [
    {
      "materialId": "uuid",
      "commonName": "60/90 Silicon Carbide",
      "category": "Abrasive",
      "materialType": "Silicon Carbide",
      "materialSize": "60/90",
      "usageType": "Coarse",
      "meshSize": 60,
      "isCleaning": false,
      "sortOrder": 1
    }
  ]
}
```

---

#### GET /materials/:materialId
Get material details.

**Response (200 OK):** Full material object

---

#### POST /materials/suggest
Suggest a new material.

**Auth Required:** Yes

**Request:**
```json
{
  "commonName": "Ceramic Pellets",
  "category": "Media",
  "details": "Small ceramic tumbling media"
}
```

**Response (201 Created):** Suggestion confirmation

---

## 12. Posts (Gallery)

#### GET /posts
List public gallery posts.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `sort` | string | `newest` | `newest`, `uglyrocks`, `comments` |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |

**Response (200 OK):**
```json
{
  "data": [
    {
      "postId": "uuid",
      "title": "Amazing Agate Results!",
      "body": "Check out these beauties...",
      "author": {
        "userId": "uuid",
        "username": "rockfan42",
        "displayName": "Rock Fan",
        "avatarUrl": "https://..."
      },
      "photos": [
        { "photoId": "uuid", "url": "https://...", "photoType": "After" }
      ],
      "uglyRocksCount": 23,
      "commentCount": 5,
      "hasVoted": false,
      "dateCreated": "2025-01-20T14:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

#### POST /posts
Create a new post from a cycle.

**Auth Required:** Yes

**Request:**
```json
{
  "cycleId": "uuid",
  "title": "My First Tumbled Agates!",
  "body": "Just finished my first batch...",
  "photoIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (201 Created):** Created post object

---

#### GET /posts/:postId
Get post details with comments.

**Response (200 OK):**
```json
{
  "postId": "uuid",
  "title": "Amazing Agate Results!",
  "body": "Check out these beauties...",
  "author": { ... },
  "cycle": {
    "cycleId": "uuid",
    "name": "Lake Superior Agates",
    "specimens": [...],
    "stageCount": 4
  },
  "photos": [...],
  "uglyRocksCount": 23,
  "commentCount": 5,
  "hasVoted": false,
  "isEdited": false,
  "comments": [
    {
      "commentId": "uuid",
      "body": "These look great!",
      "author": { ... },
      "parentCommentId": null,
      "replies": [...],
      "isEdited": false,
      "dateCreated": "2025-01-20T15:00:00Z"
    }
  ],
  "dateCreated": "2025-01-20T14:30:00Z"
}
```

---

#### PATCH /posts/:postId
Update post (title, body only).

**Auth Required:** Yes (must be author)

**Request:**
```json
{
  "title": "Updated Title",
  "body": "Updated description"
}
```

**Response (200 OK):** Updated post object

---

#### DELETE /posts/:postId
Delete post.

**Auth Required:** Yes (must be author or moderator)

**Response (204 No Content)**

---

## 13. Votes (Ugly Rocks)

#### POST /posts/:postId/vote
Add vote to a post.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "uglyRocksCount": 24,
  "hasVoted": true
}
```

---

#### DELETE /posts/:postId/vote
Remove vote from a post.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "uglyRocksCount": 23,
  "hasVoted": false
}
```

---

## 14. Comments

#### POST /posts/:postId/comments
Add comment to a post.

**Auth Required:** Yes

**Request:**
```json
{
  "body": "These look amazing!",
  "parentCommentId": null
}
```

**Response (201 Created):** Created comment object

---

#### PATCH /comments/:commentId
Edit comment.

**Auth Required:** Yes (must be author)

**Request:**
```json
{
  "body": "Updated comment text"
}
```

**Response (200 OK):** Updated comment with isEdited = true

---

#### DELETE /comments/:commentId
Delete comment.

**Auth Required:** Yes (must be author or moderator)

**Response (204 No Content)**

---

#### POST /comments/:commentId/report
Report comment for moderation.

**Auth Required:** Yes

**Request:**
```json
{
  "reason": "Spam"
}
```

**Response (201 Created):**
```json
{
  "message": "Report submitted. Thank you for helping keep our community safe."
}
```

---

## 15. Reports

#### POST /posts/:postId/report
Report post for moderation.

**Auth Required:** Yes

**Request:**
```json
{
  "reason": "Inappropriate content"
}
```

**Response (201 Created):** Report confirmation

---

## 16. Dashboard

#### GET /dashboard
Get dashboard summary for authenticated user.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "activeCycles": [
    {
      "cycleId": "uuid",
      "name": "Lake Superior Agates",
      "currentStage": {
        "stageName": "Stage 2 - Medium",
        "endDateTime": "2025-01-29T10:00:00Z",
        "hoursRemaining": 48
      }
    }
  ],
  "upcomingReminders": [
    {
      "reminderId": "uuid",
      "type": "StageComplete",
      "cycleName": "Beach Stones",
      "stageName": "Stage 1 - Coarse",
      "scheduledFor": "2025-01-25T14:00:00Z"
    }
  ],
  "recentActivity": [
    {
      "type": "stage_completed",
      "cycleName": "Jasper Batch",
      "stageName": "Stage 4 - Polish",
      "date": "2025-01-20T09:00:00Z"
    }
  ],
  "stats": {
    "totalCycles": 12,
    "activeCycles": 3,
    "completedCycles": 9,
    "totalPhotos": 156
  }
}
```

---

## 17. Activity Feed

#### GET /activity
Get user's activity feed with pagination.

**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |

**Response (200 OK):**
```json
{
  "data": [
    {
      "activityId": "uuid",
      "type": "stage_completed",
      "message": "Completed Stage 2 - Medium in Lake Superior Agates",
      "cycleId": "uuid",
      "cycleName": "Lake Superior Agates",
      "stageRunId": "uuid",
      "stageName": "Stage 2 - Medium",
      "dateCreated": "2025-01-22T10:00:00Z"
    },
    {
      "activityId": "uuid",
      "type": "cycle_started",
      "message": "Started new cycle: Beach Stones Batch 2",
      "cycleId": "uuid",
      "cycleName": "Beach Stones Batch 2",
      "dateCreated": "2025-01-21T09:30:00Z"
    },
    {
      "activityId": "uuid",
      "type": "photo_added",
      "message": "Added 3 photos to Stage 1 - Coarse in Jasper Batch",
      "cycleId": "uuid",
      "cycleName": "Jasper Batch",
      "stageRunId": "uuid",
      "stageName": "Stage 1 - Coarse",
      "photoCount": 3,
      "dateCreated": "2025-01-20T16:45:00Z"
    },
    {
      "activityId": "uuid",
      "type": "post_created",
      "message": "Shared your results: Amazing Agate Results!",
      "postId": "uuid",
      "postTitle": "Amazing Agate Results!",
      "dateCreated": "2025-01-20T14:30:00Z"
    },
    {
      "activityId": "uuid",
      "type": "cycle_completed",
      "message": "Completed cycle: Tiger Eye Collection",
      "cycleId": "uuid",
      "cycleName": "Tiger Eye Collection",
      "finalQuality": 5,
      "dateCreated": "2025-01-19T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 87,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Activity Types:**
| Type | Description |
|------|-------------|
| `cycle_started` | New cycle created |
| `cycle_completed` | Cycle marked as completed |
| `cycle_archived` | Cycle archived |
| `stage_started` | New stage run started |
| `stage_completed` | Stage run completed |
| `cleaning_completed` | Cleaning run completed |
| `photo_added` | Photos uploaded to a stage |
| `post_created` | Results shared to gallery |
| `received_uglyrocks` | Received votes on a post |
| `received_comment` | Received comment on a post |

---

## 18. Tags

Tags are user-scoped labels that can be applied to cycles and posts for organization.

#### GET /tags
List all tags for the current user.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "data": [
    {
      "tagId": "uuid",
      "name": "Lake Superior",
      "colorHex": "#3B82F6",
      "cycleCount": 5,
      "postCount": 2,
      "dateCreated": "2025-01-10T09:00:00Z"
    },
    {
      "tagId": "uuid",
      "name": "2025 Collection",
      "colorHex": "#10B981",
      "cycleCount": 12,
      "postCount": 0,
      "dateCreated": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /tags
Create a new tag.

**Auth Required:** Yes

**Request:**
```json
{
  "name": "Beach Finds",
  "colorHex": "#F59E0B"
}
```

**Response (201 Created):**
```json
{
  "tagId": "uuid",
  "name": "Beach Finds",
  "colorHex": "#F59E0B",
  "cycleCount": 0,
  "postCount": 0,
  "dateCreated": "2025-01-20T14:00:00Z"
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Tag name already exists |
| 400 | Maximum 50 tags per user |

---

#### PATCH /tags/:tagId
Update a tag.

**Auth Required:** Yes (must be owner)

**Request:**
```json
{
  "name": "Updated Name",
  "colorHex": "#EF4444"
}
```

**Response (200 OK):** Updated tag object

---

#### DELETE /tags/:tagId
Delete a tag (removes from all cycles and posts).

**Auth Required:** Yes (must be owner)

**Response (204 No Content)**

---

#### POST /cycles/:cycleId/tags
Add tags to a cycle.

**Auth Required:** Yes (must be cycle owner)

**Request:**
```json
{
  "tagIds": ["uuid1", "uuid2"]
}
```

**Response (200 OK):**
```json
{
  "tags": [
    { "tagId": "uuid1", "name": "Lake Superior", "colorHex": "#3B82F6" },
    { "tagId": "uuid2", "name": "2025 Collection", "colorHex": "#10B981" }
  ]
}
```

---

#### DELETE /cycles/:cycleId/tags/:tagId
Remove a tag from a cycle.

**Auth Required:** Yes (must be cycle owner)

**Response (200 OK):** Updated tags array

---

## 19. Templates

Templates are saved "recipes" that can be applied when creating new cycles.

#### GET /templates
List user's templates.

**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `includeSystem` | bool | `true` | Include system-provided templates |

**Response (200 OK):**
```json
{
  "data": [
    {
      "templateId": "uuid",
      "name": "Standard 4-Stage Agate",
      "description": "My go-to process for agates",
      "isSystem": false,
      "specimenIds": ["uuid"],
      "stageCount": 4,
      "usageCount": 8,
      "dateCreated": "2025-01-10T09:00:00Z",
      "dateUpdated": "2025-01-15T14:00:00Z"
    },
    {
      "templateId": "uuid",
      "name": "Beginner 4-Stage",
      "description": "Standard process for beginners",
      "isSystem": true,
      "specimenIds": [],
      "stageCount": 4,
      "usageCount": 0,
      "dateCreated": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /templates
Create a new template.

**Auth Required:** Yes

**Request:**
```json
{
  "name": "My Agate Recipe",
  "description": "Works great for Lake Superior agates",
  "specimenIds": ["uuid1"],
  "stageData": [
    {
      "stageName": "Stage 1 - Coarse",
      "durationDays": 7,
      "durationHours": 0,
      "materials": [
        { "materialId": "uuid", "displayAmount": 2, "displayUnit": "tbsp" }
      ]
    },
    {
      "stageName": "Stage 2 - Medium",
      "durationDays": 7,
      "durationHours": 0,
      "materials": [
        { "materialId": "uuid", "displayAmount": 2, "displayUnit": "tbsp" }
      ]
    }
  ]
}
```

**Response (201 Created):** Created template object

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Maximum 20 templates per user |

---

#### GET /templates/:templateId
Get template details with full stage data.

**Auth Required:** Yes (must be owner or system template)

**Response (200 OK):**
```json
{
  "templateId": "uuid",
  "name": "Standard 4-Stage Agate",
  "description": "My go-to process for agates",
  "isSystem": false,
  "specimens": [
    { "specimenId": "uuid", "commonName": "Agate" }
  ],
  "stageData": [
    {
      "stageName": "Stage 1 - Coarse",
      "durationDays": 7,
      "durationHours": 0,
      "materials": [
        { "materialId": "uuid", "commonName": "60/90 Silicon Carbide", "displayAmount": 2, "displayUnit": "tbsp" }
      ]
    },
    {
      "stageName": "Stage 2 - Medium",
      "durationDays": 7,
      "durationHours": 0,
      "materials": [
        { "materialId": "uuid", "commonName": "120/220 Silicon Carbide", "displayAmount": 2, "displayUnit": "tbsp" }
      ]
    },
    {
      "stageName": "Stage 3 - Pre-Polish",
      "durationDays": 7,
      "durationHours": 0,
      "materials": [...]
    },
    {
      "stageName": "Stage 4 - Polish",
      "durationDays": 7,
      "durationHours": 0,
      "materials": [...]
    }
  ],
  "usageCount": 8,
  "dateCreated": "2025-01-10T09:00:00Z",
  "dateUpdated": "2025-01-15T14:00:00Z"
}
```

---

#### PATCH /templates/:templateId
Update a template.

**Auth Required:** Yes (must be owner, cannot edit system templates)

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "stageData": [...]
}
```

**Response (200 OK):** Updated template object

---

#### DELETE /templates/:templateId
Delete a template.

**Auth Required:** Yes (must be owner, cannot delete system templates)

**Response (204 No Content)**

---

#### POST /templates/:templateId/duplicate
Create a copy of a template.

**Auth Required:** Yes

**Request:**
```json
{
  "name": "My Copy of Beginner 4-Stage"
}
```

**Response (201 Created):** Created template object (isSystem = false)

---

#### POST /cycles/from-template
Create a new cycle from a template.

**Auth Required:** Yes

**Request:**
```json
{
  "templateId": "uuid",
  "name": "Lake Superior Batch 3",
  "startDate": "2025-01-25",
  "tumblerId": "uuid",
  "specimenIds": ["uuid1", "uuid2"],
  "additionalSpecimens": "Some extra pieces"
}
```

**Response (201 Created):**
```json
{
  "cycleId": "uuid",
  "name": "Lake Superior Batch 3",
  "status": "Active",
  "stages": [...],
  "message": "Cycle created from template with 4 stages"
}
```

**Notes:**
- All stages from template are created with status "Pending"
- Template's usageCount is incremented
- Specimens can be overridden in the request

---

## 20. Admin Endpoints (Moderator/Admin)

**All admin endpoints require:** `Auth Required: Yes, Role: Moderator or Admin`

#### GET /admin/reports
List pending reports.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | `post`, `comment`, `all` |
| `status` | string | `pending`, `reviewed`, `dismissed` |

**Response (200 OK):** List of reports with content details

---

#### POST /admin/reports/:reportId/review
Review a report.

**Request:**
```json
{
  "action": "hide",
  "notes": "Violated community guidelines"
}
```

`action`: `hide`, `dismiss`, `ban_user`

**Response (200 OK):** Updated report

---

#### GET /admin/specimens/suggestions
List pending specimen suggestions.

**Response (200 OK):** List of suggestions

---

#### POST /admin/specimens/suggestions/:id/approve
Approve specimen suggestion and create specimen.

**Request:**
```json
{
  "specimenData": { ... }
}
```

**Response (201 Created):** Created specimen

---

#### POST /admin/specimens/suggestions/:id/reject
Reject specimen suggestion.

**Response (200 OK):** Updated suggestion

---

## 21. Common Response Formats

### 21.1 Success Response
```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

### 21.2 Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### 21.3 Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 22. Error Codes

| HTTP Code | Error Code | Description |
|-----------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid request format |
| 400 | `VALIDATION_ERROR` | Field validation failed |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 401 | `TOKEN_EXPIRED` | JWT token expired |
| 403 | `FORBIDDEN` | Not authorized for this action |
| 403 | `EMAIL_NOT_VERIFIED` | Email verification required |
| 403 | `ACCOUNT_LOCKED` | Account temporarily locked |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource already exists |
| 413 | `PAYLOAD_TOO_LARGE` | File too large |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

---

## 23. Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Auth endpoints | 10 requests | 1 minute |
| Photo uploads | 30 requests | 1 hour |
| General API | 100 requests | 1 minute |
| Report submission | 5 requests | 1 hour |

Response header when rate limited:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706123456
Retry-After: 45
```

---

## 24. Webhooks (Future)

Reserved for future implementation:
- Stage completion notifications
- New comment notifications
- Vote milestone notifications

---

## Next Steps

1. Review and finalize endpoints
2. Implement authentication middleware
3. Create request/response DTOs
4. Proceed to Architecture document (`06-ARCHITECTURE.md`)
