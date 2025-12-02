# MyUglyRocks - Data Model

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [01-PRD.md](01-PRD.md), [02-USER-STORIES.md](02-USER-STORIES.md) |

---

## 1. Overview

This document defines the database schema for MyUglyRocks, including:
- Entity definitions with all fields
- Relationships between entities
- Constraints and indexes
- Data type conventions

**Database:** PostgreSQL
**ORM:** Entity Framework Core

---

## 2. Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Cycle     │       │  StageRun   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ Id (PK)     │──1:N──│ Id (PK)     │──1:N──│ Id (PK)     │
│ Email       │       │ UserId (FK) │       │ CycleId(FK) │
│ Username    │       │ Name        │       │ BarrelId(FK)│
│ ...         │       │ Status      │       │ StageName   │
└─────────────┘       │ ...         │       │ ...         │
      │               └─────────────┘       └─────────────┘
      │                     │                     │
      │                     │                     │
      │               ┌─────┴─────┐               │
      │               │           │               │
      │               ▼           │               ▼
      │       ┌─────────────┐     │       ┌─────────────┐
      │       │CycleSpecimen│     │       │CleaningRun  │
      │       ├─────────────┤     │       ├─────────────┤
      │       │ CycleId(FK) │     │       │ Id (PK)     │
      │       │SpecimenId   │     │       │StageRunId   │
      │       └─────────────┘     │       │ ...         │
      │               │           │       └─────────────┘
      │               ▼           │               │
      │       ┌─────────────┐     │               │
      │       │  Specimen   │     │               ▼
      │       ├─────────────┤     │       ┌─────────────┐
      │       │ Id (PK)     │     │       │CleaningMat  │
      │       │ CommonName  │     │       ├─────────────┤
      │       │ ...         │     │       │CleanRunId   │
      │       └─────────────┘     │       │MaterialId   │
      │                           │       └─────────────┘
      │                           │
      │                           ▼
      │                   ┌─────────────┐
      │                   │StageMaterial│
      │                   ├─────────────┤
      │                   │StageRunId   │
      │                   │MaterialId   │
      │                   └─────────────┘
      │                           │
      │                           ▼
      │                   ┌─────────────┐
      │                   │  Material   │
      │                   ├─────────────┤
      │                   │ Id (PK)     │
      │                   │ CommonName  │
      │                   └─────────────┘
      │
      ├──1:N──┌─────────────┐       ┌─────────────┐
      │       │  Tumbler    │──1:N──│   Barrel    │
      │       ├─────────────┤       ├─────────────┤
      │       │ Id (PK)     │       │ Id (PK)     │
      │       │ UserId (FK) │       │TumblerId(FK)│
      │       │ Brand       │       │ Capacity    │
      │       └─────────────┘       │ Nickname    │
      │                             └─────────────┘
      │                                    │
      │                              ──────┘
      │                             │ (FK to StageRun.BarrelId)
      │
      ├──1:N──┌─────────────┐       ┌─────────────┐
      │       │    Post     │──1:N──│  Comment    │
      │       ├─────────────┤       ├─────────────┤
      │       │ Id (PK)     │       │ Id (PK)     │
      │       │ UserId (FK) │       │ PostId (FK) │
      │       │ CycleId(FK) │       │ UserId (FK) │
      │       └─────────────┘       │ ParentId    │
      │               │             └─────────────┘
      │               │
      │               ├──1:N──┌─────────────┐
      │               │       │    Vote     │
      │               │       ├─────────────┤
      │               │       │ Id (PK)     │
      │               │       │ PostId (FK) │
      │               │       │ UserId (FK) │
      │               │       └─────────────┘
      │               │
      │               └──1:N──┌─────────────┐
      │                       │  PostPhoto  │
      │                       ├─────────────┤
      │                       │ PostId (FK) │
      │                       │ PhotoId(FK) │
      │                       └─────────────┘
      │
      │       ┌─────────────┐
      └──1:1──│UserSettings │
              ├─────────────┤
              │ UserId (PK) │
              │ Timezone    │
              │ ...         │
              └─────────────┘

                      ┌─────────────┐
StageRun ──1:N──      │   Photo     │
                      ├─────────────┤
                      │ Id (PK)     │
                      │StageRunId   │
                      │ PhotoType   │
                      └─────────────┘
```

---

## 3. Conventions

### 3.1 Naming Conventions
- **Tables:** PascalCase, singular (e.g., `User`, `Cycle`, `StageRun`)
- **Columns:** PascalCase (e.g., `UserId`, `DateCreated`)
- **Primary Keys:** `{TableName}Id` (GUID) - e.g., `UserId`, `CycleId`, `AuditLogId`
- **Foreign Keys:** `{ReferencedTable}Id` (e.g., `UserId`, `CycleId`) - same as PK of referenced table

### 3.2 Common Fields & Base Interfaces

All entities implement one or more of these interfaces to ensure consistent naming across the codebase.

#### IAuditable (Required on ALL entities)
| Field | Type | Description |
|-------|------|-------------|
| `{TableName}Id` | GUID | Primary key (e.g., `UserId`, `CycleId`) |
| `DateCreated` | timestamptz | Record creation time (UTC) |
| `DateUpdated` | timestamptz | Last modification time (UTC) |

```csharp
public interface IAuditable<TKey>
{
    TKey Id { get; set; }  // Named {TableName}Id in each entity
    DateTime DateCreated { get; set; }
    DateTime DateUpdated { get; set; }
}
```

#### IUserAuditable (For admin/multi-user editable tables)
Extends IAuditable with user tracking. Apply to: `Specimen`, `Material`, and other reference data tables.

| Field | Type | Description |
|-------|------|-------------|
| `UserCreated` | uuid | FK → User who created the record |
| `UserUpdated` | uuid | FK → User who last updated the record |

```csharp
public interface IUserAuditable : IAuditable
{
    Guid UserCreated { get; set; }
    Guid UserUpdated { get; set; }
}
```

#### ISoftDeletable (For entities supporting soft delete)
| Field | Type | Description |
|-------|------|-------------|
| `IsDeleted` | boolean | Soft delete flag (default: false) |
| `DateDeleted` | timestamptz? | When deleted (nullable) |

```csharp
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DateDeleted { get; set; }
}
```

#### IWeightable (For entities tracking material amounts)
Apply to: `StageMaterial`, `CleaningMaterial` - entities that track amounts in user-friendly units with canonical storage.

| Field | Type | Description |
|-------|------|-------------|
| `DisplayAmount` | decimal(10,2) | User-entered amount |
| `DisplayUnit` | varchar(20) | User's unit (tsp, tbsp, g, ml, etc.) |
| `AmountGrams` | decimal(10,2) | Canonical amount for solids |
| `AmountMilliliters` | decimal(10,2) | Canonical amount for liquids |

```csharp
public interface IWeightable
{
    decimal? DisplayAmount { get; set; }
    string? DisplayUnit { get; set; }
    decimal? AmountGrams { get; set; }
    decimal? AmountMilliliters { get; set; }
}
```

#### Base Class Implementation
```csharp
// Note: Each entity defines its own {TableName}Id property
public abstract class BaseEntity : IAuditable<Guid>
{
    // Id property named {TableName}Id in each derived class
    public abstract Guid Id { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime DateUpdated { get; set; }
}

public abstract class BaseUserAuditedEntity : BaseEntity, IUserAuditable
{
    public Guid UserCreated { get; set; }
    public Guid UserUpdated { get; set; }

    // Navigation properties
    public virtual User CreatedByUser { get; set; }
    public virtual User UpdatedByUser { get; set; }
}

public abstract class BaseSoftDeletableEntity : BaseEntity, ISoftDeletable
{
    public bool IsDeleted { get; set; }
    public DateTime? DateDeleted { get; set; }
}

public abstract class BaseWeightableEntity : BaseEntity, IWeightable
{
    public decimal? DisplayAmount { get; set; }
    public string? DisplayUnit { get; set; }
    public decimal? AmountGrams { get; set; }
    public decimal? AmountMilliliters { get; set; }
}
```

#### Interface Application by Entity
| Entity | PK Name | IAuditable | IUserAuditable | ISoftDeletable | IWeightable |
|--------|---------|-----------|----------------|----------------|-------------|
| User | `UserId` | ✅ | ❌ | ❌ | ❌ |
| UserSettings | `UserId` | ✅ | ❌ | ❌ | ❌ |
| Cycle | `CycleId` | ✅ | ❌ | ✅ | ❌ |
| CycleSpecimen | `CycleId + SpecimenId` | ✅ | ❌ | ❌ | ❌ |
| Specimen | `SpecimenId` | ✅ | ✅ | ❌ | ❌ |
| StageRun | `StageRunId` | ✅ | ❌ | ✅ | ❌ |
| CleaningRun | `CleaningRunId` | ✅ | ❌ | ❌ | ❌ |
| Material | `MaterialId` | ✅ | ✅ | ❌ | ❌ |
| StageMaterial | `StageMaterialId` | ✅ | ❌ | ❌ | ✅ |
| CleaningMaterial | `CleaningMaterialId` | ✅ | ❌ | ❌ | ✅ |
| TumblerModel | `TumblerModelId` | ✅ | ❌ | ❌ | ❌ |
| Tumbler | `TumblerId` | ✅ | ❌ | ❌ | ❌ |
| Barrel | `BarrelId` | ✅ | ❌ | ❌ | ❌ |
| BarrelNickname | `NicknameId` | ✅ | ⚠️* | ❌ | ❌ |
| Photo | `PhotoId` | ✅ | ❌ | ✅ | ❌ |
| Post | `PostId` | ✅ | ❌ | ✅ | ❌ |
| PostPhoto | `PostId + PhotoId` | ✅ | ❌ | ❌ | ❌ |
| Comment | `CommentId` | ✅ | ❌ | ✅ | ❌ |
| CommentReport | `CommentReportId` | ✅ | ❌ | ❌ | ❌ |
| Vote | `VoteId` | ✅ | ❌ | ❌ | ❌ |
| SpecimenSuggestion | `SpecimenSuggestionId` | ✅ | ❌ | ❌ | ❌ |
| AuditLog | `AuditLogId` | ✅ | ❌ | ❌ | ❌ |
| EmailVerificationToken | `EmailVerificationTokenId` | ✅ | ❌ | ❌ | ❌ |
| PasswordResetToken | `PasswordResetTokenId` | ✅ | ❌ | ❌ | ❌ |
| RefreshToken | `RefreshTokenId` | ✅ | ❌ | ❌ | ❌ |
| PostReport | `PostReportId` | ✅ | ❌ | ❌ | ❌ |
| MaterialSuggestion | `MaterialSuggestionId` | ✅ | ❌ | ❌ | ❌ |
| ScheduledReminder | `ScheduledReminderId` | ✅ | ❌ | ❌ | ❌ |
| Template | `TemplateId` | ✅ | ❌ | ❌ | ❌ |
| Tag | `TagId` | ✅ | ❌ | ❌ | ❌ |
| CycleTag | `CycleId + TagId` | ✅ | ❌ | ❌ | ❌ |
| PostTag | `PostId + TagId` | ✅ | ❌ | ❌ | ❌ |

*⚠️ BarrelNickname has nullable UserCreated/UserUpdated fields (NULL for seed data)

### 3.3 Soft Deletes
Entities implementing `ISoftDeletable` include:

| Field | Type | Description |
|-------|------|-------------|
| `IsDeleted` | boolean | Soft delete flag (default: false) |
| `DateDeleted` | timestamptz? | When deleted (nullable) |

### 3.4 Data Types
| Concept | PostgreSQL Type | C# Type |
|---------|-----------------|---------|
| Identifiers | uuid | Guid |
| Strings (short) | varchar(255) | string |
| Strings (long) | text | string |
| Dates | date | DateOnly |
| Timestamps | timestamptz | DateTime (UTC) |
| Durations | integer | int (minutes/hours) |
| Money | decimal(10,2) | decimal |
| Booleans | boolean | bool |
| Enums | smallint | enum (int) |

---

## 4. Entity Definitions

### 4.1 User

Core user account.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `UserId` | uuid | PK | Unique identifier |
| `Email` | varchar(255) | UNIQUE, NOT NULL | Login email |
| `Username` | varchar(50) | UNIQUE, NOT NULL | Display username |
| `PasswordHash` | varchar(255) | NOT NULL | Hashed password |
| `DisplayName` | varchar(100) | NULL | Optional display name |
| `Bio` | text | NULL | Profile bio |
| `AvatarUrl` | varchar(500) | NULL | R2 URL for avatar |
| `Role` | smallint | NOT NULL, DEFAULT 0 | 0=User, 1=Moderator, 2=Admin |
| `EmailVerified` | boolean | NOT NULL, DEFAULT false | Email verification status |
| `DateEmailVerified` | timestamptz | NULL | When email was verified |
| `IsActive` | boolean | NOT NULL, DEFAULT true | Account active status |
| `DateLastLogin` | timestamptz | NULL | Last successful login |
| `DatePasswordChanged` | timestamptz | NULL | When password was last changed |
| `FailedLoginAttempts` | int | NOT NULL, DEFAULT 0 | Failed login attempt count |
| `LockoutEndTime` | timestamptz | NULL | Account lockout expiration |
| `UnlockToken` | varchar(128) | NULL | Token to unlock account via email |
| `UnlockTokenExpiry` | timestamptz | NULL | Unlock token valid until |
| `OnboardingCompleted` | boolean | NOT NULL, DEFAULT false | Whether user completed welcome wizard |
| `DateOnboardingCompleted` | timestamptz | NULL | When onboarding was completed |
| `DateCreated` | timestamptz | NOT NULL | Registration time |
| `DateUpdated` | timestamptz | NOT NULL | Last update time |

**Indexes:**
- `IX_User_Email` (unique)
- `IX_User_Username` (unique)
- `IX_User_LockoutEndTime` (for checking locked accounts)

**Enum - UserRole:**
```csharp
public enum UserRole
{
    User = 0,
    Moderator = 1,
    Admin = 2
}
```

---

### 4.2 UserSettings

User preferences (1:1 with User).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `UserId` | uuid | PK, FK → User | User reference |
| `MeasurementSystem` | smallint | NOT NULL, DEFAULT 0 | 0=Imperial, 1=Metric |
| `DateFormat` | smallint | NOT NULL, DEFAULT 0 | 0=MM/DD/YYYY, 1=DD/MM/YYYY, 2=YYYY-MM-DD |
| `TimeFormat` | smallint | NOT NULL, DEFAULT 0 | 0=12h, 1=24h |
| `Timezone` | varchar(50) | NOT NULL, DEFAULT 'UTC' | IANA timezone |
| `FirstDayOfWeek` | smallint | NOT NULL, DEFAULT 0 | 0=Sunday, 1=Monday |
| `ShowRelativeTimes` | boolean | NOT NULL, DEFAULT true | "3 days ago" vs absolute date |
| `TrackingMode` | smallint | NOT NULL, DEFAULT 0 | 0=Easy, 1=Advanced |
| `FontSize` | smallint | NOT NULL, DEFAULT 1 | 0=Small, 1=Normal, 2=Large |
| `Density` | smallint | NOT NULL, DEFAULT 1 | 0=Compact, 1=Comfortable |
| `DefaultHomeSection` | smallint | NOT NULL, DEFAULT 0 | 0=ActiveCycles, 1=Dashboard, 2=Gallery |
| `NotifyStageReminders` | boolean | NOT NULL, DEFAULT true | Email for stage reminders |
| `NotifyComments` | boolean | NOT NULL, DEFAULT true | Email for comments |
| `NotifyReplies` | boolean | NOT NULL, DEFAULT true | Email for replies |
| `NotifyUglyRocks` | boolean | NOT NULL, DEFAULT true | Email for votes |
| `NotifyRecipeCloned` | boolean | NOT NULL, DEFAULT true | Email when recipe is cloned |
| `QuietHoursEnabled` | boolean | NOT NULL, DEFAULT false | Enable quiet hours |
| `QuietHoursStart` | time | NULL | Start of quiet hours (e.g., 22:00) |
| `QuietHoursEnd` | time | NULL | End of quiet hours (e.g., 08:00) |
| `DigestFrequency` | smallint | NOT NULL, DEFAULT 0 | 0=Instant, 1=Daily |
| `PhotoUploadQuality` | smallint | NOT NULL, DEFAULT 1 | 0=DataSaver, 1=Balanced, 2=HighQuality |
| `AddWatermark` | boolean | NOT NULL, DEFAULT false | Add watermark to photos |
| `AutoFillFromLastRun` | boolean | NOT NULL, DEFAULT true | Auto-populate from previous stage |
| `DefaultPostVisibility` | smallint | NOT NULL, DEFAULT 0 | 0=Private, 1=Unlisted, 2=Public |
| `Theme` | varchar(50) | NOT NULL, DEFAULT 'obsidian' | Specimen-inspired theme name |
| `StageFieldVisibility` | jsonb | NULL | Which stage fields to show (null = all) |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**StageFieldVisibility JSON Schema:**
```json
{
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
```
When null, all fields are shown. Users can toggle individual fields. `TrackingMode = Easy` populates this with a minimal set; `TrackingMode = Advanced` shows all fields.

**Enums:**
```csharp
public enum MeasurementSystem { Imperial = 0, Metric = 1 }
public enum DateFormat { MMDDYYYY = 0, DDMMYYYY = 1, YYYYMMDD = 2 }
public enum TimeFormat { TwelveHour = 0, TwentyFourHour = 1 }
public enum FirstDayOfWeek { Sunday = 0, Monday = 1 }
public enum TrackingMode { Easy = 0, Advanced = 1 }
public enum FontSize { Small = 0, Normal = 1, Large = 2 }
public enum Density { Compact = 0, Comfortable = 1 }
public enum DefaultHomeSection { ActiveCycles = 0, Dashboard = 1, Gallery = 2 }
public enum DigestFrequency { Instant = 0, Daily = 1 }
public enum PhotoUploadQuality { DataSaver = 0, Balanced = 1, HighQuality = 2 }
public enum PostVisibility { Private = 0, Unlisted = 1, Public = 2 }
```

**Theme Values (string):**
| Value | Name | Type |
|-------|------|------|
| `obsidian` | Obsidian (default) | Dark |
| `lapis-lazuli` | Lapis Lazuli | Dark |
| `bumblebee-jasper` | Bumblebee Jasper | Dark |
| `malachite` | Malachite | Dark |
| `rose-quartz` | Rose Quartz | Dark |
| `tigers-eye` | Tiger's Eye | Dark |
| `snowflake-obsidian` | Snowflake Obsidian | Light |

See [Design System - Themes](wireframes/00-design-system.md#27-themes-specimen-inspired) for full color definitions.

---

### 4.3 Cycle

A tumbling cycle tracking a batch of rocks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CycleId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | Owner |
| `Name` | varchar(255) | NOT NULL | Cycle name |
| `StartDate` | date | NOT NULL | User-set start date |
| `EndDate` | date | NULL | Completion date |
| `Status` | smallint | NOT NULL, DEFAULT 0 | 0=Active, 1=Completed, 2=Archived |
| `Goal` | varchar(255) | NULL | "Nice polish", "Shaping only", "Test run" |
| `DifficultyRating` | smallint | NULL | 1-5 difficulty (set by user or auto) |
| `FinalQuality` | smallint | NULL | 1-5 rating when completed |
| `AdditionalSpecimens` | text | NULL | Free-text specimens |
| `Notes` | text | NULL | User notes |
| `IsDeleted` | boolean | NOT NULL, DEFAULT false | Soft delete |
| `DateDeleted` | timestamptz | NULL | When deleted |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_Cycle_UserId`
- `IX_Cycle_Status`
- `IX_Cycle_UserId_Status` (composite)
- `IX_Cycle_StartDate` (for date-range queries)

**Enum - CycleStatus:**
```csharp
public enum CycleStatus
{
    Active = 0,
    Completed = 1,
    Archived = 2
}
```

---

### 4.4 CycleSpecimen

Junction table for Cycle ↔ Specimen (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CycleId` | uuid | PK, FK → Cycle | Cycle reference |
| `SpecimenId` | uuid | PK, FK → Specimen | Specimen reference |
| `DateCreated` | timestamptz | NOT NULL | When added |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- Primary key on (`CycleId`, `SpecimenId`)
- `IX_CycleSpecimen_SpecimenId`

---

### 4.5 Specimen

Reference data for rock/mineral types.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `SpecimenId` | uuid | PK | Unique identifier |
| `CommonName` | varchar(100) | NOT NULL | Primary name |
| `ScientificName` | varchar(100) | NULL | Scientific name |
| `Alias` | varchar(255) | NULL | Alternative names (comma-separated) |
| `RockFamily` | varchar(100) | NULL | Rock family |
| `Species` | varchar(100) | NULL | Species |
| `Variety` | varchar(100) | NULL | Variety |
| `MaterialType` | smallint | NOT NULL, DEFAULT 0 | 0=Rock, 1=Mineral, 2=Glass, 3=Fossil, 4=Other |
| `MohsHardnessMin` | decimal(3,1) | NULL | Minimum hardness |
| `MohsHardnessMax` | decimal(3,1) | NULL | Maximum hardness |
| `TumblingDifficulty` | smallint | NULL | 0=Easy, 1=Medium, 2=Hard |
| `RecommendedGritSequence` | text | NULL | Recommended grit sequence |
| `SpecialConsiderations` | text | NULL | Special handling notes |
| `Notes` | text | NULL | General notes |
| `IsActive` | boolean | NOT NULL, DEFAULT true | Available for selection |
| `UserCreated` | uuid | FK → User, NOT NULL | User who created |
| `UserUpdated` | uuid | FK → User, NOT NULL | User who last updated |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_Specimen_CommonName`
- `IX_Specimen_IsActive`
- `IX_Specimen_UserCreated`
- `IX_Specimen_UserUpdated`

**Enums:**
```csharp
public enum MaterialType { Rock = 0, Mineral = 1, Glass = 2, Fossil = 3, Other = 4 }
public enum TumblingDifficulty { Easy = 0, Medium = 1, Hard = 2 }
```

---

### 4.6 StageRun

A single stage execution within a cycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `StageRunId` | uuid | PK | Unique identifier |
| `CycleId` | uuid | FK → Cycle, NOT NULL | Parent cycle |
| `BarrelId` | uuid | FK → Barrel, NOT NULL | Barrel used for this stage |
| `StageName` | varchar(100) | NOT NULL | e.g., "Stage 1", "Coarse Grind" |
| `StartDateTime` | timestamptz | NOT NULL | When stage started |
| `DurationDays` | int | NOT NULL, DEFAULT 0 | Duration in days |
| `DurationHours` | int | NOT NULL, DEFAULT 0 | Additional hours |
| `EndDateTime` | timestamptz | NOT NULL | Calculated end time |
| `Status` | smallint | NOT NULL, DEFAULT 0 | 0=Active, 1=Completed |
| `ReminderEnabled` | boolean | NOT NULL, DEFAULT false | Reminder on/off |
| `DateReminderSent` | timestamptz | NULL | When reminder was sent |
| `RemindAfterDays` | int | NULL | Days after start to send reminder |
| `RemindAtEndOfStage` | boolean | NULL | Send reminder at calculated end time |
| `LoadWeightBeforeGrams` | decimal(10,2) | NULL | Weight of rocks before stage (grams) |
| `LoadWeightAfterGrams` | decimal(10,2) | NULL | Weight of rocks after stage (grams) |
| `BarrelRpm` | decimal(6,2) | NULL | Barrel RPM (rotary tumblers) |
| `IsRpmEstimated` | boolean | NULL | Whether RPM is estimated vs measured |
| `FillLevelPercent` | smallint | NULL | % of barrel full (0-100) |
| `WaterLevel` | smallint | NULL | 0=JustCovering, 1=Halfway, 2=ThreeQuarters, 3=Full |
| `ResultRating` | smallint | NULL | 1-5 star satisfaction rating |
| `ResultShapeRounding` | smallint | NULL | 0-100 quality slider (advanced) |
| `ResultScratchLevel` | smallint | NULL | 0-100 quality slider (advanced) |
| `ResultPitting` | smallint | NULL | 0-100 quality slider (advanced) |
| `ResultShine` | smallint | NULL | 0-100 quality slider (advanced) |
| `IssueScratches` | boolean | NULL | Problem flag: scratches |
| `IssueChips` | boolean | NULL | Problem flag: chips/bruises |
| `IssueUnderRounded` | boolean | NULL | Problem flag: under-rounded |
| `IssueContamination` | boolean | NULL | Problem flag: grit contamination |
| `LessonsLearned` | text | NULL | What went wrong / lessons learned |
| `NextAction` | smallint | NULL | 0=Advance, 1=Repeat, 2=Abort |
| `Notes` | text | NULL | User notes |
| `IsDeleted` | boolean | NOT NULL, DEFAULT false | Soft delete |
| `DateDeleted` | timestamptz | NULL | When deleted |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_StageRun_CycleId`
- `IX_StageRun_BarrelId`
- `IX_StageRun_Status`
- `IX_StageRun_EndDateTime` (for reminder queries)

**Notes:**
- `LoadWeightBeforeGrams`/`LoadWeightAfterGrams`: Stored in grams, displayed per user's `MeasurementSystem` preference (oz for Imperial, g for Metric)
- `RemindAfterDays` and `RemindAtEndOfStage` are mutually exclusive reminder options

**Calculated Fields (not stored in DB):**
- `RunNumber` - Calculated on read: counts active (non-deleted) stages with same `StageName` within the cycle, ordered by `DateCreated`. Example: "Stage 1 Run 2" means second active run of "Stage 1". Recalculates automatically when stages are deleted.

**Enum - StageRunStatus:**
```csharp
public enum StageRunStatus
{
    Active = 0,
    Completed = 1
}
```

**Enum - WaterLevel:**
```csharp
public enum WaterLevel
{
    JustCovering = 0,   // Water just covering rocks
    Halfway = 1,        // Barrel half full
    ThreeQuarters = 2,  // Barrel 3/4 full
    Full = 3            // Barrel full
}
```

**Enum - StageNextAction:**
```csharp
public enum StageNextAction
{
    Advance = 0,  // Move to next stage
    Repeat = 1,   // Repeat same stage
    Abort = 2     // Stop/scrap/re-cut
}
```

---

### 4.7 CleaningRun

Optional cleaning/burnish run attached to a stage (0 or 1 per stage).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CleaningRunId` | uuid | PK | Unique identifier |
| `StageRunId` | uuid | FK → StageRun, UNIQUE, NOT NULL | Parent stage |
| `DurationMinutes` | int | NOT NULL | Total duration in minutes |
| `Purpose` | smallint | NULL | 0=PostStageClean, 1=PrePolishClean, 2=FinalBurnish, 3=GritRemoval |
| `Status` | smallint | NOT NULL, DEFAULT 0 | 0=Active, 1=Completed |
| `ReminderEnabled` | boolean | NOT NULL, DEFAULT false | Reminder on/off |
| `DateReminderSent` | timestamptz | NULL | When reminder was sent |
| `ResultNotes` | text | NULL | Results: haze removal, contamination issues |
| `Notes` | text | NULL | User notes |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_CleaningRun_StageRunId` (unique)

**Cascade Delete:** When a StageRun is soft-deleted, its CleaningRun and CleaningMaterials are cascade-deleted (hard delete) since they have no independent meaning.

**Enum - CleaningRunStatus:**
```csharp
public enum CleaningRunStatus
{
    Active = 0,
    Completed = 1
}
```

**Enum - CleaningPurpose:**
```csharp
public enum CleaningPurpose
{
    PostStageClean = 0,  // Post-stage grit removal
    PrePolishClean = 1,  // Pre-polish cleaning
    FinalBurnish = 2,    // Final burnish before photos
    GritRemoval = 3      // General grit removal
}
```

---

### 4.8 Material

Reference data for tumbling materials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `MaterialId` | uuid | PK | Unique identifier |
| `CommonName` | varchar(100) | NOT NULL | Display name |
| `Category` | smallint | NOT NULL | 0=Abrasive, 1=Additive, 2=Media, 3=Cleaning |
| `MaterialType` | varchar(100) | NULL | e.g., Silicon Carbide |
| `MaterialSize` | varchar(50) | NULL | e.g., 60/90, 120/220 |
| `UsageType` | smallint | NULL | 0=Coarse, 1=Medium, 2=Fine, 3=PrePolish, 4=Polish, 5=Cleaning |
| `MeshSize` | int | NOT NULL, DEFAULT 0 | Numeric mesh (0 for non-grit) |
| `SortOrder` | int | NOT NULL, DEFAULT 0 | Display order |
| `IsCleaning` | boolean | NOT NULL, DEFAULT false | Available for cleaning runs |
| `IsActive` | boolean | NOT NULL, DEFAULT true | Available for selection |
| `Notes` | text | NULL | Usage notes |
| `UserCreated` | uuid | FK → User, NOT NULL | User who created |
| `UserUpdated` | uuid | FK → User, NOT NULL | User who last updated |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_Material_Category`
- `IX_Material_IsActive`
- `IX_Material_IsCleaning`
- `IX_Material_UserCreated`
- `IX_Material_UserUpdated`

**Enums:**
```csharp
public enum MaterialCategory { Abrasive = 0, Additive = 1, Media = 2, Cleaning = 3 }
public enum UsageType { Coarse = 0, Medium = 1, Fine = 2, PrePolish = 3, Polish = 4, Cleaning = 5 }
```

---

### 4.9 StageMaterial

Materials used in a stage run (up to 10 per stage). Implements `IWeightable`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `StageMaterialId` | uuid | PK | Unique identifier |
| `StageRunId` | uuid | FK → StageRun, NOT NULL | Parent stage |
| `MaterialId` | uuid | FK → Material, NOT NULL | Material reference |
| `DisplayAmount` | decimal(10,2) | NULL | User-entered amount |
| `DisplayUnit` | varchar(20) | NULL | User's unit (tsp, tbsp, g, etc.) |
| `AmountGrams` | decimal(10,2) | NULL | Canonical amount (solids) |
| `AmountMilliliters` | decimal(10,2) | NULL | Canonical amount (liquids) |
| `SortOrder` | int | NOT NULL, DEFAULT 0 | Display order |
| `Notes` | text | NULL | Material-specific notes |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_StageMaterial_StageRunId`
- `IX_StageMaterial_MaterialId`

---

### 4.10 CleaningMaterial

Materials used in a cleaning run (up to 5 per cleaning run). Implements `IWeightable`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CleaningMaterialId` | uuid | PK | Unique identifier |
| `CleaningRunId` | uuid | FK → CleaningRun, NOT NULL | Parent cleaning run |
| `MaterialId` | uuid | FK → Material, NOT NULL | Material reference |
| `DisplayAmount` | decimal(10,2) | NULL | User-entered amount |
| `DisplayUnit` | varchar(20) | NULL | User's unit |
| `AmountGrams` | decimal(10,2) | NULL | Canonical amount (solids) |
| `AmountMilliliters` | decimal(10,2) | NULL | Canonical amount (liquids) |
| `SortOrder` | int | NOT NULL, DEFAULT 0 | Display order |
| `Notes` | text | NULL | Material-specific notes |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_CleaningMaterial_CleaningRunId`
- `IX_CleaningMaterial_MaterialId`

---

### 4.11 TumblerModel

Seed table of known tumbler models with default specifications. Used for auto-fill during onboarding and tumbler creation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `TumblerModelId` | uuid | PK | Unique identifier |
| `Brand` | varchar(100) | NOT NULL | Manufacturer (e.g., "Lortone", "National Geographic") |
| `Model` | varchar(100) | NOT NULL | Model name (e.g., "3A", "QT6", "Custom") |
| `TumblerType` | smallint | NOT NULL | 0=Rotary, 1=Vibratory |
| `DefaultCapacityLbs` | decimal(5,2) | NULL | Default barrel capacity in lbs (NULL for custom) |
| `DefaultBarrelCount` | int | NOT NULL, DEFAULT 1 | Number of barrels included |
| `IsCustomEntry` | boolean | NOT NULL, DEFAULT false | True for "Generic/Custom" entries |
| `SortOrder` | int | NOT NULL, DEFAULT 100 | Display order (popular models first) |
| `IsActive` | boolean | NOT NULL, DEFAULT true | Available for selection |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_TumblerModel_Brand`
- `IX_TumblerModel_IsActive_SortOrder`

**Seed Data** (see `seed-data/tumbler-models-seed.csv`):
- Popular brands: Lortone, National Geographic, Thumler's Tumbler, Harbor Freight, Chicago Electric
- Generic/Custom entries for DIY or unlisted tumblers

---

### 4.12 Tumbler

User's tumbler inventory. A tumbler has one or more barrels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `TumblerId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NULL | Owner (NULL for system tumblers) |
| `TumblerModelId` | uuid | FK → TumblerModel, NULL | Reference to known model (NULL for legacy/manual entry) |
| `Brand` | varchar(100) | NOT NULL | Manufacturer (auto-filled from model or manual) |
| `Model` | varchar(100) | NULL | Model name (auto-filled from model or manual) |
| `TumblerType` | smallint | NOT NULL | 0=Rotary, 1=Vibratory |
| `IsActive` | boolean | NOT NULL, DEFAULT true | Available for selection |
| `IsGeneric` | boolean | NOT NULL, DEFAULT false | System generic tumbler |
| `Notes` | text | NULL | User notes |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Relationships:**
- Tumbler (1) → (many) Barrel

**Indexes:**
- `IX_Tumbler_UserId`
- `IX_Tumbler_IsActive`
- `IX_Tumbler_IsGeneric` (for finding system tumblers)

**Deletion Rules:**
- If tumbler has **no** stage runs referencing its barrels → **hard delete** tumbler + barrels
- If tumbler has stage runs → **cannot delete**, only set `IsActive = false`
- System tumblers (`IsGeneric = true`, `UserId = NULL`) → cannot be deleted by users

**Enum - TumblerType:**
```csharp
public enum TumblerType
{
    Rotary = 0,
    Vibratory = 1
}
```

---

### 4.13 Barrel

Individual barrels belonging to a tumbler. Each barrel can be configured independently.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `BarrelId` | uuid | PK | Unique identifier |
| `TumblerId` | uuid | FK → Tumbler, NOT NULL | Parent tumbler |
| `BarrelNumber` | int | NOT NULL | Position (1, 2, 3...) |
| `Nickname` | varchar(100) | NULL | Fun name (auto-populated from BarrelNickname, user can override) |
| `Capacity` | decimal(5,2) | NULL | Capacity value |
| `IsCapacityMetric` | boolean | NOT NULL, DEFAULT false | false=lbs, true=kg |
| `DefaultGritAmountGrams` | decimal(10,2) | NULL | Default grit amount (always stored in grams) |
| `IsDedicated` | boolean | NOT NULL, DEFAULT false | Is this barrel dedicated to specific stage(s)? |
| `DedicatedStages` | varchar(100)[] | NULL | Array of stage types: ['polish', 'burnish'] |
| `DateLastDeepClean` | date | NULL | Last barrel deep clean date |
| `ContaminationNotes` | text | NULL | Contamination history/issues |
| `IsActive` | boolean | NOT NULL, DEFAULT true | Available for selection |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Relationships:**
- Barrel (many) → (1) Tumbler
- Barrel (1) → (many) StageRun

**Indexes:**
- `IX_Barrel_TumblerId`
- `IX_Barrel_IsActive`

**Deletion Rules:**
- If barrel has **no** stage runs → **hard delete** allowed
- If barrel has stage runs → **cannot delete**, only set `IsActive = false`

**How IsDedicated Works:**

When `IsDedicated = true`, the `DedicatedStages` array specifies which stages this barrel is reserved for.

| Scenario | UI Behavior |
|----------|-------------|
| User selects dedicated barrel for **matching** stage | Normal selection, no warning |
| User selects dedicated barrel for **non-matching** stage | Warning: "This barrel is dedicated to Polish/Burnish only. Using it for Coarse Grind may cause contamination. Continue anyway?" |
| User confirms warning | Proceed with selection, log the override |
| User cancels | Return to barrel selection |

**Example:**
```
Barrel: "Polly" (IsDedicated=true, DedicatedStages=['polish', 'burnish'])

User action: Selecting "Polly" for "Coarse Grind" stage
→ Warning displayed: "Polly is dedicated to polish, burnish stages only."
→ User can override if they know what they're doing
```

**Grit Amount Calculation:**

The `DefaultGritAmountGrams` is used to auto-populate the stage material form:

```
// When user selects this barrel for a stage:
if (barrel.DefaultGritAmountGrams != null) {
  // Display in user's preferred unit (from UserSettings.MeasurementSystem)
  if (user.MeasurementSystem == Metric) {
    display = barrel.DefaultGritAmountGrams + " g";
  } else {
    display = (barrel.DefaultGritAmountGrams / 28.35) + " oz";
  }
}
```

---

### 4.13 BarrelNickname

Seed table with fun barrel nicknames. Auto-assigned to new barrels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `NicknameId` | uuid | PK | Unique identifier |
| `Name` | varchar(100) | NOT NULL, UNIQUE | The nickname |
| `Category` | varchar(50) | NULL | Optional grouping (e.g., "Movies", "Food", "Animals") |
| `IsActive` | boolean | NOT NULL, DEFAULT true | Available for assignment |
| `UserCreated` | uuid | FK → User, NULL | User who created (NULL for seed data) |
| `UserUpdated` | uuid | FK → User, NULL | User who last updated |
| `DateCreated` | timestamptz | NOT NULL | When created |
| `DateUpdated` | timestamptz | NOT NULL | When last updated |

**Indexes:**
- `IX_BarrelNickname_Name` (unique)
- `IX_BarrelNickname_IsActive`

**Seed Data Examples (300 total):**

| Name | Category |
|------|----------|
| Rocky Balboa | Movies |
| The Grinder | Action |
| Barrel Roll | Gaming |
| Tumble Weed | Nature |
| Sir Spins-a-Lot | Royalty |
| The Polisher | Jobs |
| Grit Happens | Puns |
| Rolling Thunder | Weather |
| Spin Doctor | Music |
| The Rock Star | Music |
| Pebble Beach | Places |
| Stone Cold | Wrestling |
| Crystal Clear | Gems |
| Rough Diamond | Gems |
| Smooth Operator | Music |
| The Agitator | Action |
| Barrel of Laughs | Humor |
| Dizzy Gillespie | Music |
| Whirly Bird | Animals |
| The Mixer | Kitchen |

**Auto-Assignment Logic:**

```csharp
// When creating a new barrel:
public async Task<string> AssignNicknameAsync(Guid tumblerId, int barrelNumber)
{
    // Get nicknames already used by this tumbler's barrels
    var usedNicknames = await _db.Barrels
        .Where(b => b.TumblerId == tumblerId)
        .Select(b => b.Nickname)
        .ToListAsync();

    // Get a random unused nickname
    var nickname = await _db.BarrelNicknames
        .Where(n => n.IsActive && !usedNicknames.Contains(n.Name))
        .OrderBy(n => Guid.NewGuid()) // Random
        .Select(n => n.Name)
        .FirstOrDefaultAsync();

    // Fallback if all nicknames used
    return nickname ?? $"Barrel {barrelNumber}";
}
```

---

### 4.14 Photo

Photos attached to stage runs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `PhotoId` | uuid | PK | Unique identifier |
| `StageRunId` | uuid | FK → StageRun, NOT NULL | Parent stage |
| `StorageKey` | varchar(500) | NOT NULL | R2 object key |
| `Url` | varchar(500) | NOT NULL | Public/signed URL |
| `FileName` | varchar(255) | NULL | Original filename |
| `MimeType` | varchar(50) | NOT NULL | e.g., image/jpeg |
| `FileSizeBytes` | bigint | NOT NULL | File size |
| `Width` | int | NULL | Image width in pixels |
| `Height` | int | NULL | Image height in pixels |
| `PhotoType` | smallint | NOT NULL | 0=Before, 1=During, 2=After |
| `SortOrder` | int | NOT NULL, DEFAULT 0 | Display order |
| `IsDeleted` | boolean | NOT NULL, DEFAULT false | Soft delete |
| `DateDeleted` | timestamptz | NULL | When deleted |
| `DateCreated` | timestamptz | NOT NULL | Upload time |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_Photo_StageRunId`
- `IX_Photo_PhotoType`

**Enum - PhotoType:**
```csharp
public enum PhotoType
{
    Before = 0,
    During = 1,
    After = 2
}
```

---

### 4.15 Post

Public posts shared to the gallery.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `PostId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | Author |
| `CycleId` | uuid | FK → Cycle, NULL | Source cycle (optional) |
| `Title` | varchar(255) | NOT NULL | Post title |
| `Body` | text | NULL | User commentary |
| `Status` | smallint | NOT NULL, DEFAULT 0 | 0=Active, 1=Hidden |
| `IsEdited` | boolean | NOT NULL, DEFAULT false | Has been edited |
| `UglyRocksCount` | int | NOT NULL, DEFAULT 0 | Denormalized vote count |
| `CommentCount` | int | NOT NULL, DEFAULT 0 | Denormalized comment count |
| `IsDeleted` | boolean | NOT NULL, DEFAULT false | Soft delete |
| `DateDeleted` | timestamptz | NULL | When deleted |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_Post_UserId`
- `IX_Post_CycleId`
- `IX_Post_Status`
- `IX_Post_DateCreated`
- `IX_Post_UglyRocksCount`
- `IX_Post_Status_DateCreated` (composite for gallery sorting)

**Enum - PostStatus:**
```csharp
public enum PostStatus
{
    Active = 0,
    Hidden = 1
}
```

---

### 4.16 PostPhoto

Junction table for Post ↔ Photo (photos selected for a post).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `PostId` | uuid | PK, FK → Post | Post reference |
| `PhotoId` | uuid | PK, FK → Photo | Photo reference |
| `SortOrder` | int | NOT NULL, DEFAULT 0 | Display order in post |
| `DateCreated` | timestamptz | NOT NULL | When added |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- Primary key on (`PostId`, `PhotoId`)
- `IX_PostPhoto_PhotoId`

---

### 4.17 Comment

Comments on public posts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CommentId` | uuid | PK | Unique identifier |
| `PostId` | uuid | FK → Post, NOT NULL | Parent post |
| `UserId` | uuid | FK → User, NOT NULL | Author |
| `ParentCommentId` | uuid | FK → Comment, NULL | Parent comment (for replies) |
| `Body` | text | NOT NULL | Comment text |
| `IsEdited` | boolean | NOT NULL, DEFAULT false | Has been edited |
| `IsHidden` | boolean | NOT NULL, DEFAULT false | Hidden by moderator |
| `IsDeleted` | boolean | NOT NULL, DEFAULT false | Soft delete |
| `DateDeleted` | timestamptz | NULL | When deleted |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_Comment_PostId`
- `IX_Comment_UserId`
- `IX_Comment_ParentCommentId`
- `IX_Comment_DateCreated`

---

### 4.18 CommentReport

User reports on comments for moderation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CommentReportId` | uuid | PK | Unique identifier |
| `CommentId` | uuid | FK → Comment, NOT NULL | Reported comment |
| `ReporterId` | uuid | FK → User, NOT NULL | User who reported |
| `Reason` | text | NULL | Optional reason |
| `Status` | smallint | NOT NULL, DEFAULT 0 | 0=Pending, 1=Reviewed, 2=Dismissed |
| `ReviewedById` | uuid | FK → User, NULL | Moderator who reviewed |
| `DateReviewed` | timestamptz | NULL | When reviewed |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_CommentReport_CommentId`
- `IX_CommentReport_Status`

**Unique constraint:** One report per user per comment
- `UQ_CommentReport_CommentId_ReporterId`

**Enum - ReportStatus:**
```csharp
public enum ReportStatus
{
    Pending = 0,
    Reviewed = 1,
    Dismissed = 2
}
```

---

### 4.19 Vote

Upvotes ("Ugly Rocks") on posts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `VoteId` | uuid | PK | Unique identifier |
| `PostId` | uuid | FK → Post, NOT NULL | Voted post |
| `UserId` | uuid | FK → User, NOT NULL | Voter |
| `DateCreated` | timestamptz | NOT NULL | When voted |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_Vote_PostId`
- `IX_Vote_UserId`

**Unique constraint:** One vote per user per post
- `UQ_Vote_PostId_UserId`

---

### 4.20 SpecimenSuggestion

User suggestions for new specimens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `SpecimenSuggestionId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | Suggester |
| `CommonName` | varchar(100) | NOT NULL | Suggested name |
| `Details` | text | NULL | Additional info |
| `Status` | smallint | NOT NULL, DEFAULT 0 | 0=Pending, 1=Approved, 2=Rejected |
| `ReviewedById` | uuid | FK → User, NULL | Moderator who reviewed |
| `DateReviewed` | timestamptz | NULL | When reviewed |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_SpecimenSuggestion_Status`
- `IX_SpecimenSuggestion_UserId`

---

### 4.21 AuditLog

Audit trail for admin/mod actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `AuditLogId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | User who performed action |
| `Action` | varchar(100) | NOT NULL | Action type |
| `EntityType` | varchar(100) | NOT NULL | Affected entity type |
| `EntityId` | uuid | NULL | Affected entity ID |
| `Details` | jsonb | NULL | Additional details |
| `IpAddress` | varchar(45) | NULL | Client IP |
| `DateCreated` | timestamptz | NOT NULL | When action occurred |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_AuditLog_UserId`
- `IX_AuditLog_EntityType_EntityId`
- `IX_AuditLog_DateCreated`

---

### 4.22 EmailVerificationToken

Tokens for email verification flow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `EmailVerificationTokenId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | User being verified |
| `Token` | varchar(255) | UNIQUE, NOT NULL | Verification token (hashed) |
| `DateExpires` | timestamptz | NOT NULL | Token expiration time |
| `DateUsed` | timestamptz | NULL | When token was used |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_EmailVerificationToken_Token` (unique)
- `IX_EmailVerificationToken_UserId`
- `IX_EmailVerificationToken_DateExpires`

**Notes:** Tokens should be deleted after use or expiration via background job.

---

### 4.23 PasswordResetToken

Tokens for password reset flow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `PasswordResetTokenId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | User resetting password |
| `Token` | varchar(255) | UNIQUE, NOT NULL | Reset token (hashed) |
| `DateExpires` | timestamptz | NOT NULL | Token expiration time |
| `DateUsed` | timestamptz | NULL | When token was used |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_PasswordResetToken_Token` (unique)
- `IX_PasswordResetToken_UserId`
- `IX_PasswordResetToken_DateExpires`

**Notes:** Tokens should be deleted after use or expiration via background job. Consider invalidating all existing tokens when a new one is requested.

---

### 4.24 RefreshToken

JWT refresh tokens for maintaining sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `RefreshTokenId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | Token owner |
| `Token` | varchar(255) | UNIQUE, NOT NULL | Refresh token (hashed) |
| `DateExpires` | timestamptz | NOT NULL | Token expiration time |
| `IsRevoked` | boolean | NOT NULL, DEFAULT false | Manually revoked |
| `DateRevoked` | timestamptz | NULL | When revoked |
| `ReplacedByTokenId` | uuid | FK → RefreshToken, NULL | Token that replaced this one |
| `DeviceInfo` | varchar(255) | NULL | Browser/device identifier |
| `IpAddress` | varchar(45) | NULL | Client IP at creation |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_RefreshToken_Token` (unique)
- `IX_RefreshToken_UserId`
- `IX_RefreshToken_DateExpires`

**Notes:** Implements refresh token rotation - when a token is used, it's revoked and replaced with a new one. Cleanup job removes expired/revoked tokens.

---

### 4.25 PostReport

User reports on posts for moderation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `PostReportId` | uuid | PK | Unique identifier |
| `PostId` | uuid | FK → Post, NOT NULL | Reported post |
| `ReporterId` | uuid | FK → User, NOT NULL | User who reported |
| `Reason` | text | NULL | Optional reason |
| `Status` | smallint | NOT NULL, DEFAULT 0 | 0=Pending, 1=Reviewed, 2=Dismissed |
| `ReviewedById` | uuid | FK → User, NULL | Moderator who reviewed |
| `DateReviewed` | timestamptz | NULL | When reviewed |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_PostReport_PostId`
- `IX_PostReport_Status`

**Unique constraint:** One report per user per post
- `UQ_PostReport_PostId_ReporterId`

---

### 4.26 MaterialSuggestion

User suggestions for new materials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `MaterialSuggestionId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | Suggester |
| `CommonName` | varchar(100) | NOT NULL | Suggested name |
| `Category` | smallint | NULL | Suggested category |
| `Details` | text | NULL | Additional info |
| `Status` | smallint | NOT NULL, DEFAULT 0 | 0=Pending, 1=Approved, 2=Rejected |
| `ReviewedById` | uuid | FK → User, NULL | Moderator who reviewed |
| `DateReviewed` | timestamptz | NULL | When reviewed |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_MaterialSuggestion_Status`
- `IX_MaterialSuggestion_UserId`

---

### 4.27 ScheduledReminder

Scheduled reminders for stage completion notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `ScheduledReminderId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | User to notify |
| `StageRunId` | uuid | FK → StageRun, NULL | Associated stage (null if cleaning) |
| `CleaningRunId` | uuid | FK → CleaningRun, NULL | Associated cleaning run |
| `ReminderType` | smallint | NOT NULL | 0=StageComplete, 1=CleaningComplete |
| `DateScheduledFor` | timestamptz | NOT NULL | When to send reminder |
| `Status` | smallint | NOT NULL, DEFAULT 0 | 0=Pending, 1=Sent, 2=Cancelled |
| `DateSent` | timestamptz | NULL | When reminder was sent |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_ScheduledReminder_DateScheduledFor_Status` (composite for job queries)
- `IX_ScheduledReminder_StageRunId`
- `IX_ScheduledReminder_CleaningRunId`
- `IX_ScheduledReminder_UserId`

**Enums:**
```csharp
public enum ReminderType
{
    StageComplete = 0,
    CleaningComplete = 1
}

public enum ReminderStatus
{
    Pending = 0,
    Sent = 1,
    Cancelled = 2
}
```

**Notes:** Background job queries for `Status = Pending AND ScheduledFor <= NOW()`. When stage/cleaning run is deleted, associated reminders are cancelled.

---

### 4.28 Template

User-saved recipe templates for reuse.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `TemplateId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | Owner |
| `Name` | varchar(255) | NOT NULL | Template name |
| `Description` | text | NULL | Description of when to use |
| `SourceCycleId` | uuid | FK → Cycle, NULL | Cycle this was created from |
| `SourcePostId` | uuid | FK → Post, NULL | Public post this was cloned from |
| `RockTypes` | text | NULL | Rock types this works for |
| `Goal` | varchar(255) | NULL | Target goal |
| `DifficultyRating` | smallint | NULL | 1-5 difficulty |
| `StageData` | jsonb | NOT NULL | Stage definitions (name, duration, materials) |
| `IsActive` | boolean | NOT NULL, DEFAULT true | Available for use |
| `UsageCount` | int | NOT NULL, DEFAULT 0 | Times used |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_Template_UserId`
- `IX_Template_IsActive`

**StageData JSON Schema:**
```json
{
  "stages": [
    {
      "stageName": "Stage 1 - Coarse Grind",
      "durationDays": 7,
      "durationHours": 0,
      "materials": [
        { "materialId": "uuid", "amountGrams": 30, "unit": "tbsp" }
      ],
      "fillLevelPercent": 75,
      "plasticPelletsUsed": true,
      "plasticPelletsPercent": 20,
      "notes": "Check after 5 days"
    }
  ]
}
```

**Notes:**
- Templates can be created from completed cycles ("Save as Template")
- Templates can be cloned from public posts ("Use as Template")
- When starting a new cycle, user can select a template to pre-populate stages

**Orphan Reference Handling:**

The `StageData` JSON contains `materialId` references to the Material table. If a Material is deleted:

1. **Prevention**: Materials should only be soft-deleted (set `IsActive = false`), never hard-deleted
2. **Graceful degradation**: When loading a template, check if referenced materials exist:
   - If material exists but `IsActive = false`: Show as "Material Name (discontinued)" with warning
   - If material doesn't exist: Show as "Unknown material" and allow user to substitute
3. **Template validation**: Add a `IsValid` computed property that checks all materialIds still exist

```csharp
// Example validation when loading template
foreach (var stage in template.StageData.Stages)
{
    foreach (var material in stage.Materials)
    {
        var mat = await _db.Materials.FindAsync(material.MaterialId);
        if (mat == null)
            material.Status = "missing";
        else if (!mat.IsActive)
            material.Status = "discontinued";
        else
            material.Status = "active";
    }
}
```

---

### 4.29 Tag

Free-text tags for organizing cycles and posts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `TagId` | uuid | PK | Unique identifier |
| `UserId` | uuid | FK → User, NOT NULL | Owner (user-scoped tags) |
| `Name` | varchar(50) | NOT NULL | Tag name (e.g., "test", "kids", "gift") |
| `Color` | varchar(7) | NULL | Hex color (e.g., "#FF5733") |
| `DateCreated` | timestamptz | NOT NULL | |
| `DateUpdated` | timestamptz | NOT NULL | |

**Indexes:**
- `IX_Tag_UserId`
- `IX_Tag_UserId_Name` (unique per user)

**Notes:** Tags are user-scoped. Each user can have their own set of tags.

---

### 4.30 CycleTag

Junction table for Cycle ↔ Tag (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `CycleId` | uuid | PK, FK → Cycle | Cycle reference |
| `TagId` | uuid | PK, FK → Tag | Tag reference |
| `DateCreated` | timestamptz | NOT NULL | When added |
| `DateUpdated` | timestamptz | NOT NULL | When last updated |

**Indexes:**
- Primary key on (`CycleId`, `TagId`)
- `IX_CycleTag_TagId`

---

### 4.31 PostTag

Junction table for Post ↔ Tag (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `PostId` | uuid | PK, FK → Post | Post reference |
| `TagId` | uuid | PK, FK → Tag | Tag reference |
| `DateCreated` | timestamptz | NOT NULL | When added |
| `DateUpdated` | timestamptz | NOT NULL | When last updated |

**Indexes:**
- Primary key on (`PostId`, `TagId`)
- `IX_PostTag_TagId`

---

## 5. Relationships Summary

| Parent | Child | Relationship | FK Column |
|--------|-------|--------------|-----------|
| User | Cycle | 1:N | Cycle.UserId |
| User | Tumbler | 1:N | Tumbler.UserId |
| User | Post | 1:N | Post.UserId |
| User | Comment | 1:N | Comment.UserId |
| User | Vote | 1:N | Vote.UserId |
| User | UserSettings | 1:1 | UserSettings.UserId |
| Cycle | StageRun | 1:N | StageRun.CycleId |
| Cycle | CycleSpecimen | 1:N | CycleSpecimen.CycleId |
| Cycle | Post | 1:N | Post.CycleId |
| Specimen | CycleSpecimen | 1:N | CycleSpecimen.SpecimenId |
| StageRun | CleaningRun | 1:0..1 | CleaningRun.StageRunId |
| StageRun | StageMaterial | 1:N | StageMaterial.StageRunId |
| StageRun | Photo | 1:N | Photo.StageRunId |
| CleaningRun | CleaningMaterial | 1:N | CleaningMaterial.CleaningRunId |
| Material | StageMaterial | 1:N | StageMaterial.MaterialId |
| Material | CleaningMaterial | 1:N | CleaningMaterial.MaterialId |
| TumblerModel | Tumbler | 1:N | Tumbler.TumblerModelId |
| Tumbler | Barrel | 1:N | Barrel.TumblerId |
| Barrel | StageRun | 1:N | StageRun.BarrelId |
| Post | Comment | 1:N | Comment.PostId |
| Post | Vote | 1:N | Vote.PostId |
| Post | PostPhoto | 1:N | PostPhoto.PostId |
| Photo | PostPhoto | 1:N | PostPhoto.PhotoId |
| Comment | Comment | 1:N (self) | Comment.ParentCommentId |
| Comment | CommentReport | 1:N | CommentReport.CommentId |
| User | EmailVerificationToken | 1:N | EmailVerificationToken.UserId |
| User | PasswordResetToken | 1:N | PasswordResetToken.UserId |
| User | RefreshToken | 1:N | RefreshToken.UserId |
| Post | PostReport | 1:N | PostReport.PostId |
| User | MaterialSuggestion | 1:N | MaterialSuggestion.UserId |
| User | ScheduledReminder | 1:N | ScheduledReminder.UserId |
| StageRun | ScheduledReminder | 1:N | ScheduledReminder.StageRunId |
| CleaningRun | ScheduledReminder | 1:N | ScheduledReminder.CleaningRunId |
| RefreshToken | RefreshToken | 1:0..1 (self) | RefreshToken.ReplacedByTokenId |
| User | Template | 1:N | Template.UserId |
| Cycle | Template | 1:N | Template.SourceCycleId |
| Post | Template | 1:N | Template.SourcePostId |
| User | Tag | 1:N | Tag.UserId |
| Cycle | CycleTag | 1:N | CycleTag.CycleId |
| Tag | CycleTag | 1:N | CycleTag.TagId |
| Post | PostTag | 1:N | PostTag.PostId |
| Tag | PostTag | 1:N | PostTag.TagId |

---

## 6. Constraints & Business Rules

### 6.1 Enforced at Database Level
- Unique email and username per user
- One vote per user per post (`UQ_Vote_PostId_UserId`)
- One report per user per comment (`UQ_CommentReport_CommentId_ReporterId`)
- One report per user per post (`UQ_PostReport_PostId_ReporterId`)
- One cleaning run per stage run (unique `StageRunId` on CleaningRun)
- Foreign key constraints on all relationships
- Cascade delete: StageRun → CleaningRun → CleaningMaterial

### 6.2 Enforced at Application Level
- Max 10 materials per stage run
- Max 5 materials per cleaning run
- Max 10 photos per stage run
- Password complexity requirements
- Email format validation
- Photo file size limits (20 MB)
- Hardness warning when specimen difference > 1.0

---

## 7. Caching Strategy (Redis)

Entities/queries to cache:

| Key Pattern | Data | TTL |
|-------------|------|-----|
| `specimens:all` | Active specimens list | 1 hour |
| `specimens:{id}` | Single specimen | 1 hour |
| `materials:all` | Active materials list | 1 hour |
| `materials:{id}` | Single material | 1 hour |
| `user:{id}:tumblers` | User's tumblers | 15 min |
| `user:{id}:settings` | User settings | 15 min |

Cache invalidation triggers:
- Specimen/Material create/update → invalidate list + item
- Tumbler create/update/delete → invalidate user's tumbler cache
- Settings update → invalidate user's settings cache

---

## 8. Migration Notes

### 8.1 System User

A special "System" user account is required for seed data and system-generated content.

| Field | Value |
|-------|-------|
| `UserId` | `00000000-0000-0000-0000-000000000001` |
| `Email` | `system@myuglyrocks.local` |
| `Username` | `system` |
| `Role` | Admin (2) |
| `IsActive` | false (cannot login) |

**Usage:**
- `UserCreated`/`UserUpdated` for seed Specimens and Materials
- `UserCreated`/`UserUpdated` for seed BarrelNicknames
- System-generated tumblers (`Tumbler.IsGeneric = true`)

**Note:** The system user has `IsActive = false` so it cannot be used to login. It exists only to satisfy NOT NULL constraints on IUserAuditable entities.

### 8.2 Initial Seed Data
- System user (see 8.1)
- Generic Rotary Tumbler (system tumbler, `UserId = NULL`, `IsGeneric = true`)
- Generic Vibratory Tumbler (system tumbler, `UserId = NULL`, `IsGeneric = true`)
- 300 BarrelNicknames (with `UserCreated = system user`)
- Initial specimens list (with `UserCreated = system user`)
- Initial materials list (with `UserCreated = system user`)

### 8.3 Index Considerations
- Add indexes as listed above
- Consider partial indexes for soft-deleted queries (e.g., `WHERE IsDeleted = false`)
- Monitor query performance and add indexes as needed

---

## Next Steps

1. Review data model for completeness
2. Proceed to API Specification (`05-API-SPEC.md`)
3. Or proceed to Architecture (`06-ARCHITECTURE.md`)
