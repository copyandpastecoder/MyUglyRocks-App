# MyUglyRocks - Product Requirements Document (PRD)

## Document Info
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | 2025-01-XX |
| Status | Draft |
| Author | [Your Name] |

---

## 1. Product Vision

### 1.1 Mission Statement
MyUglyRocks helps rock tumbling enthusiasts track their tumbling cycles, learn from their results, and share their polished creations with a community of fellow hobbyists.

### 1.2 Vision
To become the go-to platform for rock tumblers of all skill levels—from beginners learning the basics to experienced hobbyists perfecting their craft—by providing intuitive tracking tools and a supportive community.

### 1.3 Elevator Pitch
> "MyUglyRocks is a web app that lets you track your rock tumbling from ugly rough to beautiful polish. Log your cycles, stages, and materials. Upload before/after photos. Share your results in a community gallery and learn from others' recipes. Whether you're running your first batch or your hundredth, MyUglyRocks helps you tumble smarter."

---

## 2. Problem Statement

### 2.1 The Problem
Rock tumbling is a multi-week process involving multiple stages, each with specific materials, durations, and techniques. Currently, hobbyists:

1. **Lose track of cycles** - Forgetting what stage they're on, when it started, or what materials they used
2. **Can't learn from past results** - No systematic way to compare what worked vs what didn't
3. **Reinvent the wheel** - Beginners have no easy way to learn proven recipes from experienced tumblers
4. **Miss the community** - Reddit and Facebook groups exist, but there's no dedicated platform with structured sharing

### 2.2 Current Alternatives
| Alternative | Limitations |
|-------------|-------------|
| Paper notebooks | Easy to lose, hard to search, no photos |
| Spreadsheets | Clunky for photos, no community features |
| Notes apps | Unstructured, no tumbling-specific fields |
| Reddit/Facebook | No structured tracking, posts get buried |
| Nothing | Most common—people just forget and repeat mistakes |

### 2.3 Opportunity
There is no dedicated app for rock tumbling tracking and community. The hobby is growing (driven by YouTube, TikTok, and beginner-friendly tumblers), but digital tools haven't caught up.

---

## 3. Target Audience

### 3.1 Primary Personas

#### Persona 1: "Beginner Beth"
- **Demographics:** 35-55, got a tumbler as a gift or impulse buy
- **Experience:** 0-6 months, has run 1-5 cycles
- **Goals:**
  - Learn the basics without feeling overwhelmed
  - Know when to check/change stages
  - See what "good results" look like
- **Pain Points:**
  - Confused by grit types and sequences
  - Forgets when she started a stage
  - Doesn't know if her results are "normal"
- **Needs from MyUglyRocks:**
  - Simple tracking (Easy Mode)
  - Reminders
  - Learning resources
  - Gallery for inspiration

#### Persona 2: "Hobbyist Henry"
- **Demographics:** 30-60, dedicated hobbyist
- **Experience:** 1-5 years, runs multiple cycles simultaneously
- **Goals:**
  - Track multiple tumblers and cycles at once
  - Experiment and compare results
  - Share successes with community
- **Pain Points:**
  - Hard to remember which barrel has what
  - Wants to correlate materials → results
  - Existing tracking methods are scattered
- **Needs from MyUglyRocks:**
  - Full tracking with all fields (Advanced Mode)
  - Multiple tumbler support
  - Photo history
  - Export for personal records

#### Persona 3: "Community Chris"
- **Demographics:** Any age, active in online communities
- **Experience:** Varies, but engaged and social
- **Goals:**
  - Share beautiful results
  - Help beginners with advice
  - Get recognition for great work
- **Pain Points:**
  - Reddit posts disappear quickly
  - Hard to share "recipes" in a structured way
  - No dedicated platform for the hobby
- **Needs from MyUglyRocks:**
  - Easy posting with auto-generated summaries
  - Comments and voting
  - Profile to showcase work

### 3.2 Secondary Personas
- **Educators/YouTubers** - May want to reference or recommend the platform
- **Rock shops** - Could recommend to customers buying tumblers
- **Kids/Families** - Simpler use case, parent-supervised

### 3.3 Non-Target Users
- Industrial/commercial tumbling operations
- Jewelry professionals (different needs)
- Users wanting to sell rocks (no marketplace planned)

---

## 4. Core Value Propositions

| Value Prop | Description |
|------------|-------------|
| **Never Forget** | Track every cycle, stage, material, and photo in one place |
| **Learn What Works** | Compare past cycles to understand what produces the best results |
| **Get Reminded** | Notifications when it's time to check or change stages |
| **Share & Inspire** | Post your before/after photos and see what others are creating |
| **Start Simple, Go Deep** | Easy Mode for beginners, Advanced Mode for serious hobbyists |

---

## 5. Feature Requirements

### 5.1 Feature Priority Matrix

#### Must Have (MVP)
These features are required for initial launch:

| Feature | Description |
|---------|-------------|
| User Authentication | Register, login, logout, password reset |
| Cycle Management | Create, view, edit, complete, delete cycles |
| Specimen Selection | Select rocks from curated list + free-text additions |
| Stage Run Tracking | Add stages with tumbler, duration, materials, notes |
| Photo Upload | Upload before/during/after photos per stage |
| My Tumblers | Manage personal tumbler inventory |
| Basic Dashboard | See active cycles and quick actions |
| Settings | Units, date format, timezone, notifications |

#### Should Have (MVP+)
High priority but can follow shortly after launch:

| Feature | Description |
|---------|-------------|
| Cleaning Runs | Optional cleaning/burnish run per stage |
| Reminders | Email notifications for stage completion |
| Public Posts | Share completed cycles to gallery |
| Gallery | Browse public posts from community |
| Voting (Ugly Rocks) | Upvote posts you like |
| Comments | Comment on public posts |
| User Profiles | Public profile showing posts and stats |

#### Nice to Have (Future)
Planned for later phases:

| Feature | Description |
|---------|-------------|
| Hardness Warnings | Warn when mixing specimens with different hardness |
| Specimen Suggestions | Users suggest new specimens for review |
| Advanced Filtering | Filter cycles by specimen, date, quality rating |
| Export | CSV/Markdown/Zip export of user data |
| Learn Section | FAQ, specimen guides, material guides |
| Moderation Tools | Admin dashboard for content moderation |
| Easy Mode | Simplified tracking for beginners |

#### Out of Scope (v1)
Explicitly not planned for initial versions:

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first, responsive design covers mobile |
| Marketplace | Selling rocks adds complexity and liability |
| Real-time chat | Comments are sufficient for community |
| Video upload | Photos only for now (storage/bandwidth) |
| Social login (Google/Facebook) | Email auth first, social later |
| Multi-language | English only for MVP |
| Paid tiers/subscriptions | Free to start, monetization later |

---

### 5.2 Feature Details

#### 5.2.1 Easy Mode vs Advanced Mode
- **Easy Mode:** Minimal fields—just name, specimen, start date, notes, and photos
- **Advanced Mode:** Full tracking—stages, materials, durations, tumblers, cleaning runs
- **Default:** TBD (likely Easy Mode for new users)
- **Switching:** Users can toggle in Settings

#### 5.2.2 Voting System ("Ugly Rocks")
- Upvote-only (no downvotes)
- One vote per user per post
- Votes can be removed
- Displayed as "X Ugly Rocks"
- Drives gallery sorting and profile stats

#### 5.2.3 Photo Requirements
- Max 10 photos per stage run
- Max 20 MB upload size (compressed to ~2-3 MB)
- Required label: Before, During, or After
- Private by default; public only when attached to a post

---

## 6. MVP Scope Definition

### 6.1 MVP Goal
Launch a functional app where users can:
1. Create an account
2. Track tumbling cycles with stages and photos
3. Manage their tumblers
4. See their work on a dashboard

### 6.2 MVP Feature List
- [ ] User registration and login
- [ ] Email verification
- [ ] Password reset
- [ ] Create/edit/delete cycles
- [ ] Add specimens to cycles
- [ ] Create/edit/complete stage runs
- [ ] Select tumbler per stage
- [ ] Add materials to stage
- [ ] Upload photos to stage
- [ ] Dashboard with active cycles
- [ ] My Tumblers CRUD
- [ ] Basic settings (units, timezone)

### 6.3 MVP Exclusions
- Public posts and gallery (MVP+)
- Comments and voting (MVP+)
- Cleaning runs (MVP+)
- Reminders/notifications (MVP+)
- Admin/moderation (MVP+)
- Export (Future)
- Learn section (Future)

### 6.4 MVP Success Criteria
- Users can complete a full cycle from start to finish
- Users can upload and view photos
- System is stable and performant
- Mobile experience is usable (responsive design)

---

## 7. Success Metrics

### 7.1 Engagement Metrics
| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Registered users | 500+ |
| Monthly active users | 100+ |
| Cycles created | 1,000+ |
| Photos uploaded | 5,000+ |
| Public posts | 200+ |

### 7.2 Quality Metrics
| Metric | Target |
|--------|--------|
| Page load time | < 2 seconds |
| Uptime | 99.5% |
| Error rate | < 1% of requests |
| Mobile usability score | 90+ (Lighthouse) |

### 7.3 User Satisfaction
| Metric | Target |
|--------|--------|
| Task completion rate | 90%+ (can complete a cycle) |
| User feedback | Net positive sentiment |
| Return rate | 30%+ users return within 30 days |

---

## 8. Assumptions & Dependencies

### 8.1 Assumptions
- Users have email addresses for registration
- Users have smartphones or computers with cameras for photos
- Rock tumbling hobby continues to grow
- English-only is acceptable for MVP

### 8.2 Dependencies
| Dependency | Risk | Mitigation |
|------------|------|------------|
| Cloudflare R2 | Low | Established service, easy to migrate if needed |
| Resend (email) | Low | Can swap email providers if needed |
| PostgreSQL hosting | Low | Many hosting options available |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low adoption | Medium | High | Focus on SEO, Reddit/YouTube marketing |
| Spam/abuse | Medium | Medium | Email verification, moderation tools |
| Photo storage costs | Low | Medium | Compression, reasonable limits |
| Scope creep | High | Medium | Strict MVP definition, phased roadmap |
| Technical complexity | Medium | Medium | Proven tech stack, incremental delivery |

---

## 10. Resolved Questions

Decisions made during planning:

| Question | Decision |
|----------|----------|
| **Default mode** | Advanced Mode (full tracking with stages, materials, etc.) |
| **Tumbler requirement** | Required per stage run. If user has only one tumbler, it will be auto-selected |
| **Specimen data** | Database table with master list of specimens. Users select from this list, plus a free-text input for specimens not in the table |
| **Materials data** | Database table with master list of materials. Same approach as specimens |
| **Moderation** | Hybrid approach: (1) Automated pre-post filters for NSFW images and profanity/spam text to block obvious issues, (2) Reactive moderation post-publication via user reports |
| **Monetization** | None at launch. Free for all users initially |
| **Analytics** | Track tumbling cycles per specimen to understand which rocks users are tumbling most |

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-XX-XX | [Your Name] | Initial draft |

---

## Next Steps

1. Review and finalize this PRD
2. Answer open questions (Section 10)
3. Proceed to User Stories (`02-USER-STORIES.md`)
