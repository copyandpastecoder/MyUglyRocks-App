# Admin Dashboard Wireframe

> **URL:** `/admin/*`
> **Auth Required:** Yes (Admin or Moderator role)
> **Priority:** P2 (MVP)

---

## 1. Overview

The Admin Dashboard provides tools for moderators and administrators to manage content, review reports, approve specimen suggestions, and manage users.

### Admin Pages
- `/admin` - Dashboard overview
- `/admin/reports` - Content reports queue
- `/admin/specimens` - Specimen suggestions
- `/admin/users` - User management (Admin only)

### Roles
| Role | Capabilities |
|------|--------------|
| **Moderator** | Review reports, manage specimens |
| **Admin** | All moderator capabilities + user management |

---

## 2. Admin Dashboard Overview

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Admin Dashboard                                                               │
│                                                                                 │
│   ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────┐  │
│   │ 📋 Pending Reports    │  │ 🪨 Specimen Suggestions│  │ 👥 Total Users    │  │
│   │                       │  │                        │  │                    │  │
│   │        7              │  │        3               │  │     1,234          │  │
│   │                       │  │                        │  │                    │  │
│   │   [ View Reports → ]  │  │   [ Review →  ]        │  │   [ Manage →  ]   │  │
│   └───────────────────────┘  └───────────────────────┘  └───────────────────┘  │
│                                                                                 │
│   ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│   Recent Activity                                                               │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  • Report resolved: Post "Spam test" removed by @admin                  │  │
│   │    2 hours ago                                                          │  │
│   │                                                                          │  │
│   │  • Specimen approved: "Blue Lace Agate" by @moderator1                  │  │
│   │    5 hours ago                                                          │  │
│   │                                                                          │  │
│   │  • User banned: @spammer123 by @admin                                   │  │
│   │    Yesterday                                                            │  │
│   │                                                                          │  │
│   │  • Report resolved: Comment marked as inappropriate by @moderator2      │  │
│   │    2 days ago                                                           │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│   Quick Links                                                                   │
│                                                                                 │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐   │
│   │ 🚩 Reports          │  │ 🪨 Specimens         │  │ 👥 Users            │   │
│   │    View all reports │  │    Manage specimens  │  │    Manage users     │   │
│   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile Layout

```
┌─────────────────────────────────┐
│ ← Admin                        │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📋 Pending Reports          │ │
│ │ 7                     [ → ] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🪨 Specimen Suggestions     │ │
│ │ 3                     [ → ] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👥 Total Users              │ │
│ │ 1,234                 [ → ] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ Recent Activity                 │
│                                 │
│ • Report resolved: Post         │
│   removed by @admin             │
│   2 hours ago                   │
│                                 │
│ • Specimen approved: Blue       │
│   Lace Agate                    │
│   5 hours ago                   │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

---

## 3. Reports Queue

### 3.1 Reports List

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Admin > Reports                                                               │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  Filter: [All ▼]  [Posts]  [Comments]     Status: [Pending ▼]           │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   7 pending reports                                                             │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🚩 POST REPORT                                           Pending       │  │
│   │                                                                          │  │
│   │  Post: "Check out my amazing deals!!!"                                   │  │
│   │  Author: @newuser99                                                      │  │
│   │  Reported by: @rockfan42 • 2 hours ago                                   │  │
│   │  Reason: Spam or misleading                                              │  │
│   │                                                                          │  │
│   │  Details: "This looks like spam advertising, not rock tumbling"          │  │
│   │                                                                          │  │
│   │  [ View Post ]  [ Remove Post ]  [ Dismiss Report ]  [ Ban User ]       │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🚩 COMMENT REPORT                                        Pending       │  │
│   │                                                                          │  │
│   │  Comment: "You're an idiot if you use that grit..."                      │  │
│   │  On post: "My First Tumbling Batch"                                      │  │
│   │  Author: @angryuser                                                      │  │
│   │  Reported by: @newbie2025 • 5 hours ago                                  │  │
│   │  Reason: Harassment or hate speech                                       │  │
│   │                                                                          │  │
│   │  [ View Context ]  [ Remove Comment ]  [ Dismiss ]  [ Warn User ]       │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🚩 POST REPORT                                           Pending       │  │
│   │                                                                          │  │
│   │  Post: "Cool crystals from my garden"                                   │  │
│   │  Author: @crystalfan                                                     │  │
│   │  Reported by: @tumblequeen • 1 day ago                                   │  │
│   │  Reason: Not rock tumbling related                                       │  │
│   │                                                                          │  │
│   │  [ View Post ]  [ Remove Post ]  [ Dismiss Report ]                     │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ... more reports ...                                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Report Actions

| Action | Result |
|--------|--------|
| View Post/Comment | Opens content in new tab |
| Remove Post | Soft deletes post, notifies author |
| Remove Comment | Soft deletes comment |
| Dismiss Report | Marks report as reviewed, no action taken |
| Warn User | Sends warning email, logs warning |
| Ban User | Disables account, logs ban |

### 3.3 Confirm Remove Modal

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Remove Content                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Are you sure you want to remove this post?                                     │
│                                                                                 │
│  Post: "Check out my amazing deals!!!"                                          │
│  Author: @newuser99                                                             │
│                                                                                 │
│  Reason for removal: *                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Spam / advertising                                                   ▼  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Note to user (optional):                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ This post was removed because it appears to be advertising rather       │   │
│  │ than rock tumbling content.                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [ ] Also warn this user                                                        │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                     [ Cancel ]        [ Remove Post ]                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Specimen Suggestions

### 4.1 Suggestions List

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Admin > Specimen Suggestions                                                  │
│                                                                                 │
│   3 pending suggestions                                                         │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🪨 SPECIMEN SUGGESTION                                   Pending       │  │
│   │                                                                          │  │
│   │  Name: Blue Lace Agate                                                   │  │
│   │  Suggested by: @tumblequeen                                              │  │
│   │  Date: January 25, 2025                                                  │  │
│   │                                                                          │  │
│   │  Suggested Details:                                                      │  │
│   │  • Mohs Hardness: 6.5-7                                                  │  │
│   │  • Difficulty: Medium                                                    │  │
│   │  • Description: Light blue banded chalcedony, popular for jewelry        │  │
│   │                                                                          │  │
│   │  Notes from user: "This is a common tumbling stone that's missing        │  │
│   │  from the list."                                                         │  │
│   │                                                                          │  │
│   │  [ Approve ]  [ Edit & Approve ]  [ Reject ]                            │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🪨 SPECIMEN SUGGESTION                                   Pending       │  │
│   │                                                                          │  │
│   │  Name: Rainbow Obsidian                                                  │  │
│   │  Suggested by: @stonelover                                               │  │
│   │  Date: January 23, 2025                                                  │  │
│   │                                                                          │  │
│   │  ...                                                                     │  │
│   │                                                                          │  │
│   │  [ Approve ]  [ Edit & Approve ]  [ Reject ]                            │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Edit & Approve Modal

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Edit & Approve Specimen                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Name *                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Blue Lace Agate                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Mohs Hardness                                                                  │
│  ┌──────────────┐  to  ┌──────────────┐                                        │
│  │ 6.5          │      │ 7            │                                        │
│  └──────────────┘      └──────────────┘                                        │
│                                                                                 │
│  Tumbling Difficulty                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Medium                                                               ▼  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Description                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Light blue banded chalcedony, popular for jewelry. Takes a good         │   │
│  │ polish with standard 4-stage process.                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Tips (optional)                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Avoid tumbling with harder materials. Watch for fractures.              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                     [ Cancel ]        [ Approve Specimen ]                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. User Management (Admin Only)

### 5.1 Users List

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Admin > Users                                                                 │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  🔍 Search users...                                                      │  │
│   │                                                                          │  │
│   │  Status: [All ▼]    Role: [All ▼]    Sort: [Newest ▼]                   │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   1,234 users                                                                   │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  👤  rockfan42                              Role: User    Status: Active│  │
│   │      rockfan42@example.com                                               │  │
│   │      Joined: January 2024 • Last active: 2 hours ago                     │  │
│   │      Posts: 12 • Cycles: 9 • Reports: 0                                  │  │
│   │                                                                          │  │
│   │      [ View Profile ]  [ Edit Role ]  [ Ban ]                           │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  👤  tumblequeen                            Role: Moderator Status: Active│ │
│   │      tumblequeen@example.com                                             │  │
│   │      Joined: March 2023 • Last active: 1 day ago                         │  │
│   │      Posts: 45 • Cycles: 23 • Reports: 0                                 │  │
│   │                                                                          │  │
│   │      [ View Profile ]  [ Edit Role ]  [ Ban ]                           │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  👤  spammer123                              Role: User   Status: Banned│  │
│   │      spammer@fake.com                                                    │  │
│   │      Joined: January 2025 • Banned: Yesterday                            │  │
│   │      Posts: 0 • Reports against: 5                                       │  │
│   │      Ban reason: Spam                                                    │  │
│   │                                                                          │  │
│   │      [ View Profile ]  [ Unban ]                                        │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌────────────────────────────────────────────────────────────────────────┐   │
│   │              [← Prev]   Page 1 of 62   [Next →]                         │   │
│   └────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Edit Role Modal

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Edit User Role                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  User: @rockfan42                                                               │
│  Current Role: User                                                             │
│                                                                                 │
│  New Role:                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ○ User - Standard user                                                   │   │
│  │ ○ Moderator - Can review reports and manage specimens                    │   │
│  │ ○ Admin - Full access to all admin features                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                     [ Cancel ]        [ Update Role ]                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Ban User Modal

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Ban User                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ⚠️ Are you sure you want to ban @spammer123?                                   │
│                                                                                 │
│  This will:                                                                     │
│  • Disable their account (they cannot log in)                                   │
│  • Hide their posts from the gallery                                            │
│  • Remove their comments                                                        │
│                                                                                 │
│  Ban Reason *                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Spam                                                                 ▼  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Internal notes (optional):                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Multiple spam posts advertising unrelated products.                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                     [ Cancel ]        [ Ban User ]                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Requirements

### 6.1 API Endpoints

| Action | Endpoint |
|--------|----------|
| Admin stats | `GET /api/admin/stats` |
| List reports | `GET /api/admin/reports?status=...&type=...` |
| Resolve report | `PUT /api/admin/reports/:reportId` |
| List suggestions | `GET /api/admin/specimens/suggestions` |
| Approve suggestion | `POST /api/admin/specimens/suggestions/:id/approve` |
| Reject suggestion | `POST /api/admin/specimens/suggestions/:id/reject` |
| List users | `GET /api/admin/users?search=...&role=...&status=...` |
| Update user role | `PUT /api/admin/users/:userId/role` |
| Ban user | `POST /api/admin/users/:userId/ban` |
| Unban user | `POST /api/admin/users/:userId/unban` |

---

## 7. States

### 7.1 Empty States

**No Pending Reports:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                         ✅ All clear!                                           │
│                                                                                 │
│                  No pending reports to review.                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**No Specimen Suggestions:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                         📭 No suggestions                                       │
│                                                                                 │
│           No pending specimen suggestions to review.                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Access Control

### 8.1 Permission Matrix

| Feature | User | Moderator | Admin |
|---------|------|-----------|-------|
| View Admin Dashboard | ❌ | ✅ | ✅ |
| Review Reports | ❌ | ✅ | ✅ |
| Remove Content | ❌ | ✅ | ✅ |
| Warn Users | ❌ | ✅ | ✅ |
| Review Specimen Suggestions | ❌ | ✅ | ✅ |
| View Users List | ❌ | ❌ | ✅ |
| Change User Roles | ❌ | ❌ | ✅ |
| Ban/Unban Users | ❌ | ❌ | ✅ |

### 8.2 Unauthorized Access

If a non-admin tries to access `/admin`:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                         🚫 Access Denied                                        │
│                                                                                 │
│           You don't have permission to access this page.                        │
│                                                                                 │
│                      [ Back to Dashboard ]                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Implementation Notes

### 9.1 Component Files

```
app/(admin)/admin/
├── page.tsx                    # Admin dashboard
├── layout.tsx                  # Admin layout with role check
├── reports/
│   └── page.tsx               # Reports queue
├── specimens/
│   └── page.tsx               # Specimen suggestions
└── users/
    └── page.tsx               # User management

components/admin/
├── AdminStats.tsx              # Stats cards
├── ReportCard.tsx              # Individual report
├── ReportActions.tsx           # Action buttons
├── SpecimenSuggestionCard.tsx  # Suggestion card
├── UserCard.tsx                # User list item
├── EditRoleModal.tsx
├── BanUserModal.tsx
├── RemoveContentModal.tsx
└── EditSpecimenModal.tsx
```

### 9.2 Role Check Middleware

```typescript
// app/(admin)/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const user = await getUser();

  if (!user || !['Admin', 'Moderator'].includes(user.role)) {
    redirect('/dashboard');
  }

  return (
    <div>
      {/* Admin sidebar/nav */}
      {children}
    </div>
  );
}
```

---

## 10. Related Documents

- [04-DATA-MODEL.md](../04-DATA-MODEL.md) - User roles, CommentReport entity
- [05-API-SPEC.md](../05-API-SPEC.md) - Admin API endpoints
- [06-ARCHITECTURE.md](../06-ARCHITECTURE.md) - Authorization strategy
