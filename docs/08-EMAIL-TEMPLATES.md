# Email Templates

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-XX-XX |
| Status | Draft |
| Related | [06-ARCHITECTURE.md](./06-ARCHITECTURE.md), [05-API-SPEC.md](./05-API-SPEC.md) |

---

## 1. Overview

### 1.1 Email Provider
**Resend** - Developer-friendly transactional email service

### 1.2 Email Types

| Category | Emails |
|----------|--------|
| **Authentication** | Email verification, Password reset, Password changed, Account locked |
| **Notifications** | Stage reminder, Comment received, Reply received |
| **Social** | Post featured, First "Ugly Rocks" received |
| **Admin** | Account warning, Account suspended |

### 1.3 Design Principles

1. **Mobile-first** - 90%+ of hobbyists check email on phones
2. **Clear CTAs** - One primary action per email
3. **Brand consistent** - Match the app's visual identity
4. **Accessible** - Plain text alternative, good contrast
5. **Concise** - Get to the point quickly

### 1.4 From Address

| Type | From Address |
|------|--------------|
| Transactional | `noreply@myuglyrocks.com` |
| Notifications | `notifications@myuglyrocks.com` |
| Support | `support@myuglyrocks.com` |

**From Name:** `MyUglyRocks`

---

## 2. Authentication Emails

### 2.1 Email Verification

**Trigger:** User registers a new account

**Subject:** `Verify your MyUglyRocks account`

**Variables:**
- `{{userName}}` - Display name or "there"
- `{{verificationUrl}}` - One-time verification link
- `{{expiresIn}}` - Link expiration time (e.g., "24 hours")

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  Welcome to MyUglyRocks! 🪨                                                 │
│                                                                             │
│  Please verify your email address to complete your registration and         │
│  start tracking your rock tumbling journey.                                 │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │     Verify Email Address    │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
│  This link expires in {{expiresIn}}.                                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  If the button doesn't work, copy and paste this link into your browser:   │
│  {{verificationUrl}}                                                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Didn't create an account? You can safely ignore this email.                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│  Questions? Contact support@myuglyrocks.com                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Plain Text Version:**
```
Hi {{userName}},

Welcome to MyUglyRocks!

Please verify your email address to complete your registration:
{{verificationUrl}}

This link expires in {{expiresIn}}.

Didn't create an account? You can safely ignore this email.

---
© 2025 MyUglyRocks
Questions? Contact support@myuglyrocks.com
```

---

### 2.2 Password Reset

**Trigger:** User requests password reset

**Subject:** `Reset your MyUglyRocks password`

**Variables:**
- `{{userName}}` - Display name or "there"
- `{{resetUrl}}` - One-time reset link
- `{{expiresIn}}` - Link expiration time (e.g., "1 hour")
- `{{ipAddress}}` - Request origin (optional, for security)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  We received a request to reset your password.                              │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │       Reset Password        │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
│  This link expires in {{expiresIn}}.                                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  If you didn't request this, you can safely ignore this email.              │
│  Your password won't be changed until you click the link above              │
│  and create a new one.                                                      │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  If the button doesn't work, copy and paste this link:                      │
│  {{resetUrl}}                                                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│  Questions? Contact support@myuglyrocks.com                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Password Changed Confirmation

**Trigger:** User successfully changes their password

**Subject:** `Your MyUglyRocks password was changed`

**Variables:**
- `{{userName}}` - Display name
- `{{changedAt}}` - Timestamp of change
- `{{supportUrl}}` - Link to contact support

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  Your password was successfully changed on {{changedAt}}.                   │
│                                                                             │
│  If you made this change, no further action is needed.                      │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ⚠️  Didn't make this change?                                               │
│                                                                             │
│  Someone may have access to your account. Please:                           │
│  1. Reset your password immediately                                         │
│  2. Contact us at support@myuglyrocks.com                                   │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │    Reset Password Now       │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Account Locked (Unlock Required)

**Trigger:** 5 consecutive failed login attempts

**Subject:** `Your MyUglyRocks account has been locked`

**Variables:**
- `{{userName}}` - Display name or "there"
- `{{unlockUrl}}` - One-time unlock link
- `{{expiresIn}}` - Link expiration time (e.g., "24 hours")
- `{{ipAddress}}` - IP address of failed attempts (optional)
- `{{attemptTime}}` - Time of lockout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  Your MyUglyRocks account has been temporarily locked due to multiple       │
│  failed login attempts.                                                     │
│                                                                             │
│  If this was you, click the button below to unlock your account:            │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │      Unlock My Account      │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
│  This link expires in {{expiresIn}}.                                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  If the button doesn't work, copy and paste this link into your browser:   │
│  {{unlockUrl}}                                                              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ⚠️  If this wasn't you:                                                    │
│  Someone may be trying to access your account. After unlocking, we          │
│  recommend:                                                                 │
│  1. Change your password immediately                                        │
│  2. Use a strong, unique password                                           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│  Questions? Contact support@myuglyrocks.com                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Plain Text Version:**
```
Hi {{userName}},

Your MyUglyRocks account has been temporarily locked due to multiple failed login attempts.

If this was you, click the link below to unlock your account:

{{unlockUrl}}

This link expires in {{expiresIn}}.

---

If this wasn't you, someone may be trying to access your account. After unlocking, please change your password immediately.

---

© 2025 MyUglyRocks
Questions? Contact support@myuglyrocks.com
```

---

## 3. Notification Emails

### 3.1 Stage Reminder

**Trigger:** Stage duration timer reaches reminder threshold (user-configured)

**Subject:** `⏰ Your "{{stageName}}" stage is ready to check!`

**Variables:**
- `{{userName}}` - Display name
- `{{cycleName}}` - Name of the cycle
- `{{stageName}}` - Current stage name (e.g., "Coarse Grind")
- `{{tumblerName}}` - Tumbler being used
- `{{startedAt}}` - When stage started
- `{{duration}}` - How long it's been running
- `{{cycleUrl}}` - Link to cycle detail page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  Your tumbler might be ready for the next step! 🪨                          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Cycle: {{cycleName}}                                                  │  │
│  │  Stage: {{stageName}}                                                  │  │
│  │  Tumbler: {{tumblerName}}                                              │  │
│  │                                                                        │  │
│  │  Started: {{startedAt}}                                                │  │
│  │  Running: {{duration}}                                                 │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Time to check your rocks! Open the barrel, rinse them off, and see         │
│  how they're progressing.                                                   │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │       View This Cycle       │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Quick tips:                                                                │
│  • Check for consistent rounding and smooth surfaces                        │
│  • Look for any chips or cracks that might have formed                      │
│  • If rocks aren't ready, add more grit and run longer                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│  Manage notifications in Settings                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Comment Notification

**Trigger:** Someone comments on user's public post

**Subject:** `💬 {{commenterName}} commented on your post`

**Variables:**
- `{{userName}}` - Post owner's display name
- `{{commenterName}}` - Commenter's display name
- `{{commenterAvatar}}` - Commenter's avatar URL
- `{{postTitle}}` - Post title or truncated cycle name
- `{{commentPreview}}` - First 100 characters of comment
- `{{postUrl}}` - Link to post with comment anchor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  {{commenterName}} commented on your post:                                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  [Avatar] {{commenterName}}                                            │  │
│  │                                                                        │  │
│  │  "{{commentPreview}}..."                                               │  │
│  │                                                                        │  │
│  │  On: {{postTitle}}                                                     │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │        View Comment         │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│  Manage notifications in Settings                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Reply Notification

**Trigger:** Someone replies to user's comment

**Subject:** `↩️ {{replierName}} replied to your comment`

**Variables:**
- `{{userName}}` - Original commenter's display name
- `{{replierName}}` - Replier's display name
- `{{originalComment}}` - User's original comment (truncated)
- `{{replyPreview}}` - First 100 characters of reply
- `{{postTitle}}` - Post where conversation is happening
- `{{commentUrl}}` - Direct link to the reply

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  {{replierName}} replied to your comment on "{{postTitle}}":                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Your comment:                                                         │  │
│  │  "{{originalComment}}..."                                              │  │
│  │                                                                        │  │
│  │  ─────────────────────────────────────────────────────────────────── │  │
│  │                                                                        │  │
│  │  [Avatar] {{replierName}} replied:                                     │  │
│  │  "{{replyPreview}}..."                                                 │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │         View Reply          │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│  Manage notifications in Settings                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Social/Engagement Emails

### 4.1 First "Ugly Rocks" Received

**Trigger:** User's post receives their first upvote

**Subject:** `🪨 Someone gave your rocks some love!`

**Variables:**
- `{{userName}}` - Post owner's display name
- `{{voterName}}` - First voter's display name
- `{{postTitle}}` - Post title
- `{{postUrl}}` - Link to post

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  Congratulations! 🎉                                                        │
│                                                                             │
│  {{voterName}} just gave your post an "Ugly Rocks" - our way of             │
│  saying your tumbling results are awesome!                                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │                             🪨                                         │  │
│  │                                                                        │  │
│  │  "{{postTitle}}"                                                       │  │
│  │                                                                        │  │
│  │  1 Ugly Rock                                                           │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Keep sharing your results - the community loves seeing great polishes!     │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │        View Your Post       │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Note:** Only sent for the FIRST vote. Subsequent votes don't trigger emails (to prevent spam).

---

### 4.2 Milestone: 10 Ugly Rocks

**Trigger:** Post reaches 10 upvotes

**Subject:** `🎉 Your post hit 10 Ugly Rocks!`

**Variables:**
- `{{userName}}` - Post owner's display name
- `{{postTitle}}` - Post title
- `{{voteCount}}` - Current vote count
- `{{postUrl}}` - Link to post

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  Your post is getting popular! 🌟                                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │                        🪨🪨🪨🪨🪨                                      │  │
│  │                        🪨🪨🪨🪨🪨                                      │  │
│  │                                                                        │  │
│  │  "{{postTitle}}"                                                       │  │
│  │                                                                        │  │
│  │  10 Ugly Rocks!                                                        │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  The community is loving your work. Thanks for sharing!                     │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │        View Your Post       │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Future milestones:** 25, 50, 100 (with increasingly excited messaging)

---

## 5. Welcome Email (Post-Verification)

**Trigger:** User successfully verifies email

**Subject:** `Welcome to MyUglyRocks! Here's how to get started`

**Variables:**
- `{{userName}}` - Display name
- `{{dashboardUrl}}` - Link to dashboard
- `{{specimensUrl}}` - Link to specimens reference
- `{{galleryUrl}}` - Link to public gallery

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Welcome to MyUglyRocks, {{userName}}! 🪨                                   │
│                                                                             │
│  You're officially part of our rock tumbling community. Here's how to       │
│  get the most out of your experience:                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  📦  Step 1: Add Your Tumbler                                               │
│  Tell us about your equipment so we can track which tumbler you use         │
│  for each batch.                                                            │
│                                                                             │
│  🪨  Step 2: Start Your First Cycle                                         │
│  Create a cycle for your current batch of rocks. Add stages as you          │
│  progress through coarse, medium, and polish.                               │
│                                                                             │
│  📸  Step 3: Document Your Progress                                         │
│  Upload photos at each stage. When you're done, share your results          │
│  with the community!                                                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │      Go to Dashboard        │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Helpful Resources:                                                         │
│                                                                             │
│  📚 Browse Specimens - Learn about different rock types and hardness        │
│  🧪 View Materials - Explore grits, polishes, and additives                 │
│  🖼️ Explore Gallery - See what others have created                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Questions? Reply to this email or visit our FAQ.                           │
│                                                                             │
│  Happy tumbling!                                                            │
│  The MyUglyRocks Team                                                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Admin/Moderation Emails

### 6.1 Comment Removed

**Trigger:** Moderator removes a user's comment

**Subject:** `Your comment was removed from MyUglyRocks`

**Variables:**
- `{{userName}}` - User's display name
- `{{postTitle}}` - Post the comment was on
- `{{commentPreview}}` - Their removed comment (truncated)
- `{{reason}}` - Reason for removal
- `{{guidelinesUrl}}` - Link to community guidelines

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  Your comment on "{{postTitle}}" was removed by a moderator.                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Your comment:                                                         │  │
│  │  "{{commentPreview}}..."                                               │  │
│  │                                                                        │  │
│  │  Reason: {{reason}}                                                    │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Please review our Community Guidelines to ensure your future               │
│  comments meet our standards.                                               │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │   View Community Guidelines │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
│  If you believe this was a mistake, please contact us at                    │
│  support@myuglyrocks.com.                                                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 6.2 Account Warning

**Trigger:** Admin issues a warning to user

**Subject:** `⚠️ Warning: Your MyUglyRocks account`

**Variables:**
- `{{userName}}` - User's display name
- `{{reason}}` - Reason for warning
- `{{warningCount}}` - Number of warnings (e.g., "1st warning")
- `{{guidelinesUrl}}` - Link to community guidelines

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  This is a {{warningCount}} regarding your account.                         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  ⚠️  Reason: {{reason}}                                                │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Please review our Community Guidelines. Repeated violations may            │
│  result in account suspension.                                              │
│                                                                             │
│                    ┌─────────────────────────────┐                          │
│                    │   View Community Guidelines │                          │
│                    └─────────────────────────────┘                          │
│                                                                             │
│  If you have questions, please contact support@myuglyrocks.com.             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 6.3 Account Suspended

**Trigger:** Admin suspends a user account

**Subject:** `Your MyUglyRocks account has been suspended`

**Variables:**
- `{{userName}}` - User's display name
- `{{reason}}` - Reason for suspension
- `{{duration}}` - Suspension duration or "permanently"
- `{{appealEmail}}` - Email to appeal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              [MyUglyRocks Logo]                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Hi {{userName}},                                                           │
│                                                                             │
│  Your MyUglyRocks account has been suspended {{duration}}.                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Reason: {{reason}}                                                    │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  During suspension:                                                         │
│  • You cannot log in to your account                                        │
│  • Your public posts are hidden from the gallery                            │
│  • Your data remains safe and will be restored after suspension             │
│                                                                             │
│  If you believe this was a mistake, you can appeal by emailing:             │
│  {{appealEmail}}                                                            │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  © 2025 MyUglyRocks                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Digest Emails (Future Enhancement)

### 7.1 Weekly Activity Digest

**Trigger:** Weekly cron job (Sundays)

**Subject:** `Your weekly rock tumbling recap 📊`

**Variables:**
- `{{userName}}` - Display name
- `{{weekStart}}` - Week start date
- `{{weekEnd}}` - Week end date
- `{{activeCycles}}` - Number of active cycles
- `{{stagesCompleted}}` - Stages completed this week
- `{{photosUploaded}}` - Photos uploaded
- `{{uglyRocksReceived}}` - Votes received
- `{{commentsReceived}}` - Comments received

**Note:** This is a "Nice to Have" feature for post-MVP.

---

## 8. Design Specifications

### 8.1 Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background | White | `#FFFFFF` |
| Header BG | Stone | `#78716C` |
| Primary CTA | Amber | `#F59E0B` |
| Primary CTA Hover | Amber Dark | `#D97706` |
| Text Primary | Gray 900 | `#111827` |
| Text Secondary | Gray 600 | `#4B5563` |
| Border | Gray 200 | `#E5E7EB` |
| Success | Green | `#10B981` |
| Warning | Yellow | `#F59E0B` |
| Error | Red | `#EF4444` |

### 8.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Header | System | 24px | Bold |
| Body | System | 16px | Regular |
| Caption | System | 14px | Regular |
| CTA Button | System | 16px | Semi-bold |

**Font Stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

### 8.3 Button Styles

```css
/* Primary CTA */
.btn-primary {
  background-color: #F59E0B;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
}

/* Link Style */
.text-link {
  color: #F59E0B;
  text-decoration: underline;
}
```

### 8.4 Email Width

- **Max width:** 600px
- **Mobile responsive:** Stack to single column below 480px
- **Padding:** 24px on desktop, 16px on mobile

---

## 9. Implementation Notes

### 9.1 Resend Integration

```typescript
// lib/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  to: string,
  userName: string,
  verificationUrl: string
) {
  await resend.emails.send({
    from: 'MyUglyRocks <noreply@myuglyrocks.com>',
    to,
    subject: 'Verify your MyUglyRocks account',
    html: renderVerificationEmail({ userName, verificationUrl }),
    text: renderVerificationEmailPlainText({ userName, verificationUrl }),
  });
}
```

### 9.2 Template System

Option A: **React Email** (recommended)
- JSX-based email templates
- Preview server for development
- Works well with Resend

Option B: **Handlebars/Mustache**
- Simple variable substitution
- No build step required

### 9.3 Rate Limiting

| Email Type | Limit |
|------------|-------|
| Verification | 3 per hour per email |
| Password Reset | 3 per hour per email |
| Stage Reminder | 1 per stage |
| Comment Notification | 10 per hour per user |

### 9.4 User Preferences (Settings)

Allow users to opt out of:
- [ ] Stage reminders
- [ ] Comment notifications
- [ ] Reply notifications
- [ ] Vote milestones
- [ ] Weekly digest (future)

**Cannot opt out of:**
- Verification email
- Password reset
- Security notifications (password changed)
- Account warnings/suspensions

---

## 10. Testing Checklist

Before production:

- [ ] All links are absolute URLs and point to production domain
- [ ] Plain text versions are included
- [ ] Emails render correctly in Gmail, Outlook, Apple Mail
- [ ] Mobile rendering is tested
- [ ] Unsubscribe links work (for marketing emails)
- [ ] Rate limiting is in place
- [ ] Sender domain is verified with SPF/DKIM/DMARC
- [ ] Test with spam checkers (mail-tester.com)

---

## 11. Related Documents

- [06-ARCHITECTURE.md](./06-ARCHITECTURE.md) - Email provider choice (Resend)
- [05-API-SPEC.md](./05-API-SPEC.md) - Auth and notification endpoints
- [wireframes/08-settings.md](./wireframes/08-settings.md) - Notification preferences UI
- [07-SEQUENCE-DIAGRAMS.md](./07-SEQUENCE-DIAGRAMS.md) - Email trigger flows
