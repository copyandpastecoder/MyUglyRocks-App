# User Profile Wireframe

> **URL:** `/user/:username`
> **Auth Required:** No (public page)
> **Priority:** P1 (MVP)

---

## 1. Overview

The User Profile page is a public view of a user's activity and shared posts. Users can see their own profile and others' profiles.

### Key User Goals
- "See someone's tumbling portfolio"
- "Find more posts from an author I like"
- "Show off my collection to the community"

---

## 2. Profile Page

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]     [Dashboard]  [Cycles]  [Tumblers]  [Gallery]  [Specimens]  [👤 ▼]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │   ┌────────────────┐                                                    │  │
│   │   │                │   rockfan42                                        │  │
│   │   │    [Avatar]    │   Rock Tumbling Enthusiast                         │  │
│   │   │     100x100    │                                                    │  │
│   │   │                │   📍 Duluth, Minnesota                              │  │
│   │   └────────────────┘   🗓️ Member since January 2024                     │  │
│   │                                                                          │  │
│   │   Lake Superior agate collector and tumbler. I love the reds and        │  │
│   │   oranges found on Brighton Beach!                                      │  │
│   │                                                                          │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│   │   │ Posts       │  │ Ugly Rocks  │  │ Cycles      │  │ Photos      │   │  │
│   │   │ 12          │  │ Received    │  │ Completed   │  │ Shared      │   │  │
│   │   │             │  │ 248         │  │ 9           │  │ 156         │   │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│   │                                                                          │  │
│   │   [ Edit Profile ]                                   ← Only for own profile│
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │  POSTS (12)                                                              │  │
│   │                                                                          │  │
│   │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐    │  │
│   │  │                   │  │                   │  │                   │    │  │
│   │  │     [Photo]       │  │     [Photo]       │  │     [Photo]       │    │  │
│   │  │                   │  │                   │  │                   │    │  │
│   │  ├───────────────────┤  ├───────────────────┤  ├───────────────────┤    │  │
│   │  │ Amazing Lake      │  │ Brighton Beach    │  │ Tiger Eye Magic   │    │  │
│   │  │ Superior Agates!  │  │ Finds             │  │                   │    │  │
│   │  │ 🪨 48  💬 12      │  │ 🪨 35  💬 8       │  │ 🪨 29  💬 5       │    │  │
│   │  └───────────────────┘  └───────────────────┘  └───────────────────┘    │  │
│   │                                                                          │  │
│   │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐    │  │
│   │  │                   │  │                   │  │                   │    │  │
│   │  │     [Photo]       │  │     [Photo]       │  │     [Photo]       │    │  │
│   │  │                   │  │                   │  │                   │    │  │
│   │  ├───────────────────┤  ├───────────────────┤  ├───────────────────┤    │  │
│   │  │ First Batch!      │  │ Jasper Journey    │  │ Beach Glass       │    │  │
│   │  │                   │  │                   │  │ Collection        │    │  │
│   │  │ 🪨 24  💬 15      │  │ 🪨 18  💬 3       │  │ 🪨 21  💬 2       │    │  │
│   │  └───────────────────┘  └───────────────────┘  └───────────────────┘    │  │
│   │                                                                          │  │
│   │  ... more posts                                                          │  │
│   │                                                                          │  │
│   │  [ Load More ]                                                           │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile Layout

```
┌─────────────────────────────────┐
│ ← rockfan42                    │
├─────────────────────────────────┤
│                                 │
│        ┌────────────────┐       │
│        │                │       │
│        │   [Avatar]     │       │
│        │                │       │
│        └────────────────┘       │
│                                 │
│         rockfan42               │
│  Rock Tumbling Enthusiast       │
│                                 │
│  📍 Duluth, Minnesota           │
│  🗓️ Member since Jan 2024       │
│                                 │
│  Lake Superior agate collector  │
│  and tumbler...                 │
│                                 │
│  ┌─────────┐ ┌─────────┐       │
│  │ Posts   │ │ Rocks   │       │
│  │ 12      │ │ 248     │       │
│  └─────────┘ └─────────┘       │
│  ┌─────────┐ ┌─────────┐       │
│  │ Cycles  │ │ Photos  │       │
│  │ 9       │ │ 156     │       │
│  └─────────┘ └─────────┘       │
│                                 │
│ [ Edit Profile ]                │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ POSTS (12)                      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │         [Photo]             │ │
│ ├─────────────────────────────┤ │
│ │ Amazing Lake Superior       │ │
│ │ Agates!                     │ │
│ │ 🪨 48  💬 12                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │         [Photo]             │ │
│ ├─────────────────────────────┤ │
│ │ Brighton Beach Finds        │ │
│ │ 🪨 35  💬 8                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ [ Load More ]                   │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📋] [📦] [🖼️] [•••]      │
└─────────────────────────────────┘
```

---

## 3. Profile Header Component

### 3.1 Own Profile (Logged-in viewing own)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│   ┌────────────────┐                                                         │
│   │                │   rockfan42                              [ Edit Profile ]│
│   │    [Avatar]    │   Rock Tumbling Enthusiast                              │
│   │                │                                                         │
│   │                │   📍 Duluth, Minnesota                                   │
│   └────────────────┘   🗓️ Member since January 2024                          │
│                                                                               │
│   Lake Superior agate collector and tumbler. I love the reds and             │
│   oranges found on Brighton Beach!                                           │
│                                                                               │
│   ... stats ...                                                              │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Other User's Profile

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│   ┌────────────────┐                                                         │
│   │                │   tumblequeen                                           │
│   │    [Avatar]    │   Master Rock Polisher                                  │
│   │                │                                                         │
│   │                │   📍 Portland, Oregon                                    │
│   └────────────────┘   🗓️ Member since March 2023                            │
│                                                                               │
│   ... bio ...                                                                │
│                                                                               │
│   ... stats ...                                                              │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Note:** No "Edit Profile" button when viewing other users.

---

## 4. Stats Cards

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Posts       │  │ Ugly Rocks  │  │ Cycles      │  │ Photos      │
│ 12          │  │ Received    │  │ Completed   │  │ Shared      │
│             │  │ 248         │  │ 9           │  │ 156         │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

| Stat | Description |
|------|-------------|
| Posts | Number of gallery posts |
| Ugly Rocks Received | Total votes received across all posts |
| Cycles Completed | Number of cycles marked complete |
| Photos Shared | Total photos across all posts |

---

## 5. Edit Profile Flow

### 5.1 Edit Profile Modal

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Edit Profile                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Avatar                                                                         │
│  ┌────────────────┐                                                            │
│  │                │   [ Change Photo ]                                         │
│  │    [Avatar]    │   [ Remove ]                                               │
│  │                │                                                            │
│  └────────────────┘                                                            │
│                                                                                 │
│  Display Name                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ rockfan42                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  This is how your name appears on your profile and posts                        │
│                                                                                 │
│  Tagline                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Rock Tumbling Enthusiast                                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  A short description (max 50 characters)                                        │
│                                                                                 │
│  Location (optional)                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Duluth, Minnesota                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Bio (optional)                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Lake Superior agate collector and tumbler. I love the reds and          │   │
│  │ oranges found on Brighton Beach!                                        │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Tell others about yourself (max 500 characters)                                │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                     [ Cancel ]        [ Save Changes ]                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Avatar Upload

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Change Profile Photo                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │         📷 Drag a photo here or click to upload                          │   │
│  │                                                                          │   │
│  │         [ Browse Files ]                                                 │   │
│  │                                                                          │   │
│  │         Accepts: JPG, PNG • Max 5MB                                      │   │
│  │         Square images work best                                          │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Preview:                                                                       │
│  ┌────────────────┐                                                            │
│  │                │                                                            │
│  │   [Preview]    │                                                            │
│  │                │                                                            │
│  └────────────────┘                                                            │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                     [ Cancel ]        [ Save Photo ]                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Requirements

### 6.1 API Endpoints

| Action | Endpoint |
|--------|----------|
| Get profile | `GET /api/users/:username` |
| Get own profile | `GET /api/users/me` |
| Update profile | `PUT /api/users/me/profile` |
| Upload avatar | `POST /api/users/me/avatar` |
| Get user's posts | `GET /api/users/:username/posts` |

### 6.2 Data Shapes

**User Profile:**
```typescript
interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  tagline?: string;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  memberSince: string;
  stats: {
    postsCount: number;
    uglyRocksReceived: number;
    completedCycles: number;
    photosShared: number;
  };
  isOwnProfile: boolean;
}
```

---

## 7. States

### 7.1 Loading State

Skeleton for profile header and post grid.

### 7.2 Empty States

**User has no posts:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  POSTS                                                                          │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │                    [Image icon]                                          │   │
│  │                                                                          │   │
│  │                 No posts yet                                             │   │
│  │                                                                          │   │
│  │   {username} hasn't shared any results yet.                              │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Own profile with no posts:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  POSTS                                                                          │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │                    [Image icon]                                          │   │
│  │                                                                          │   │
│  │                 Share your first post!                                   │   │
│  │                                                                          │   │
│  │   Complete a cycle and share your results to the gallery.                │   │
│  │                                                                          │   │
│  │                   [ Go to My Cycles ]                                    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 User Not Found

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                         [User icon]                                             │
│                                                                                 │
│                    User not found                                               │
│                                                                                 │
│   The user "@{username}" doesn't exist or has been removed.                     │
│                                                                                 │
│                      [ Back to Gallery ]                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (sm) | Single column, centered header |
| 640-1024px (md) | Single column, wider |
| > 1024px (lg) | Header with side-by-side avatar/info, 3-col post grid |

---

## 9. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Avatar | Alt text with username |
| Stats | Announced with labels ("12 posts", "248 Ugly Rocks received") |
| Edit form | Proper labels and error messages |
| Post grid | Same accessibility as gallery |

---

## 10. Implementation Notes

### 10.1 Component Files

```
app/(public)/user/[username]/
├── page.tsx                    # Profile page
├── loading.tsx                 # Skeleton
└── error.tsx                   # Error boundary

components/
├── ProfileHeader.tsx           # Avatar, name, bio, stats
├── ProfileStats.tsx            # Stats cards
├── ProfilePosts.tsx            # Posts grid
├── EditProfileModal.tsx        # Edit form
└── AvatarUpload.tsx            # Avatar upload component
```

### 10.2 SEO Metadata

```typescript
export async function generateMetadata({ params }: Props) {
  const user = await getUser(params.username);
  return {
    title: `${user.displayName} (@${user.username}) | MyUglyRocks`,
    description: user.bio || `View ${user.displayName}'s rock tumbling results`,
    openGraph: {
      images: user.avatarUrl ? [user.avatarUrl] : [],
    },
  };
}
```

---

## 11. Related Documents

- [05-gallery.md](./05-gallery.md) - Gallery links to profiles
- [06-post-detail.md](./06-post-detail.md) - Post author links to profile
- [08-settings.md](./08-settings.md) - Account settings (separate from profile)
- [05-API-SPEC.md](../05-API-SPEC.md) - User API endpoints
