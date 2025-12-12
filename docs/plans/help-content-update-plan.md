# Help Content Expansion Plan (X6.2)

## Goals
- Complete user guide/help coverage for MyUglyRocks within the in-app help system.
- Add contextual topics for photos, learn/FAQ, social/gallery, admin, and auth flows.
- Improve path-to-topic mapping so help surfaces the right guidance per page.

## Files to Modify
- `src/web/src/data/help-content.ts`
- `src/web/src/components/help/HelpPanel.tsx` (for admin-only topic filtering)

## Proposed Additions
1) New help topics
- `photos`: stage-required uploads, before/during/after types, captions, size/format limits, retry & mixed-content/CORS troubleshooting.
- `learn`: specimens/materials search, filters, hardness notes, link to FAQ.
- `social` (or expanded gallery): creating posts from cycles, voting, commenting, reporting abuse, visibility expectations.
- `admin`: reports queue, specimen suggestions, user actions (warn/ban/unban), what each action does (from wireframe 09-admin.md). **⚠️ ADMIN-ONLY: This topic must be hidden from non-admin users. Requires role check before displaying.**
- `auth`: sign up/login, email verification, password reset, session/device tracking note (UserSession analytics).
- `faq`: top "How do I…?" Q&A (start a cycle, add photos to past stage, fix upload/CORS errors, add materials/cleaning runs, dull polish/scratches).

2) Existing topic refinements
- `cycles`: editing/renaming, specimen tagging, recipe tips, abandoned flows.
- `stages`: materials/cleaning runs callouts, completion checklist, extend stage guidance.
- `gallery`: clarify how stage photos become gallery posts; privacy/visibility notes.
- `settings`: notifications, units, profile visibility, security basics.

3) Route-to-topic mapping updates (`getHelpTopicFromPath`)
- Map `/learn` ? `learn`.
- Map `/gallery` ? `social` (or keep as `gallery` if we keep that topic distinct).
- Map `/admin` ? `admin`.
- Map `/photos` (if routed) ? `photos`.
- Map auth routes (`/login`, `/register`, `/forgot-password`, `/reset-password`) ? `auth`.

## Deliverable
- Updated `help-content.ts` with new topics, refined sections/tips, and improved path mapping.
- Updated `HelpPanel.tsx` to filter admin topic based on user role.

## Recommendations

### Open Question Resolutions

| Question | Recommendation |
|----------|----------------|
| Keep `social` separate vs. expand `gallery`? | **Keep both.** `gallery` = browsing/viewing; `social` = creating posts, voting, commenting. Cross-link between them. |
| Upload size/format limits? | Use **10 MB max, JPG/PNG/WebP formats**. Cite these in both `photos` topic and FAQ. |
| Separate troubleshooting vs. shared FAQ? | **Shared FAQ entry** for common issues (CORS, upload failures) with brief inline tips in each topic linking to FAQ. Reduces duplication. |

### Admin Topic Access Control

The `admin` help topic contains sensitive operational guidance. Implementation approach:

```typescript
// In help-content.ts, add metadata to topic:
admin: {
  title: 'Admin Dashboard',
  requiresRole: 'admin', // <-- new field
  sections: [...]
}

// In HelpPanel.tsx, filter topics:
const visibleTopics = Object.entries(helpTopics).filter(
  ([key, topic]) => !topic.requiresRole || user?.role === topic.requiresRole
);
```

### Content Priority Order
1. `photos` & `faq` (highest user friction points)
2. `auth` (onboarding clarity)
3. `learn` & `social` (feature discovery)
4. `admin` (admin-only, lower volume)
5. Existing topic refinements (cycles, stages, gallery, settings)


## Future Enhancements

### Contextual Help Triggers
Add small `?` icons next to key UI elements (photo upload button, etc.) that jump directly to the relevant help section. More discoverable than relying on users to open the help panel manually.

### Help Search
As topics grow, add keyword search within the help panel. Low priority for initial release but valuable as content expands.

### Version/Changelog Reference
Consider linking to a changelog or displaying app version in help footer. Helps users determine if their issue might be resolved in a newer release.

### Empty State Integration
When users haven't created cycles, uploaded photos, etc., empty state UI should link directly to the relevant help topic (e.g., "New here? Learn how to start your first cycle").

### Localization Readiness
If i18n is planned, structure help content as translation keys rather than inline strings to avoid future refactoring. Flag for review before implementation.

### Help Analytics
Track which help topics are viewed most frequently. Data can:
- Prioritize future documentation improvements
- Identify UX pain points (high-traffic topics may indicate confusing features)
- Inform FAQ ordering

## X6.2 Completion Plan (Authoring + Wiring)
- **Authored content (per topic)**: draft sections, bullets, and links; include concise troubleshooting that points to FAQ.
- **Metadata**: add `requiresRole` to admin topic; add `category`/`tags` if needed for search.
- **Routing**: implement `getHelpTopicFromPath` mappings for `/learn`, `/gallery`, `/admin`, `/photos`, and auth routes.
- **UI filtering**: ensure `HelpPanel` hides admin topic for non-admins.
- **Validation**: confirm 10 MB JPG/PNG/WebP limit is enforced (frontend + backend); adjust copy if limits differ.
- **Analytics**: track topic views; add help-open event; optional per-topic dwell time.
- **Localization-ready**: structure strings for i18n keys where applicable.

### Topic Content Outlines (for authoring)
- **photos**: when uploads are required by stage; before/during/after examples; captions; 10 MB JPG/PNG/WebP; retry steps; mixed-content/CORS quick fix; link to FAQ.
- **learn**: how to search specimens/materials; filters; hardness notes; link to FAQ for “can’t find my specimen”.
- **social**: create post from cycle/stage photos; voting; commenting; reporting abuse; visibility expectations; link to gallery browsing.
- **gallery**: how stage photos become gallery posts; privacy/visibility; browsing tips; link to social for interaction features.
- **admin** (admin-only): reports queue; specimen suggestions moderation; warn/ban/unban behaviors; link to wireframe 09-admin.md; note audit/logging expectations.
- **auth**: signup/login steps; email verification; password reset; session/device tracking note; link to FAQ for login issues.
- **faq**: "start a cycle"; "add photos to past stage"; "fix upload/CORS errors"; "add materials/cleaning runs"; "dull polish/scratches" fixes.
- **cycles**: edit/rename; specimen tagging; recipe tips; abandoned flows handling.
- **stages**: materials/cleaning runs callouts; completion checklist; extending a stage safely.
- **settings**: notifications; units; profile visibility; security basics.

### Editorial/UX Notes
- Keep sections scannable (bullets, short steps).
- Cross-link FAQ from troubleshooting snippets; avoid duplicating long fixes.
- Prefer concrete examples (e.g., “Stage 2 requires at least 1 photo before completion”).
- Add contextual `?` affordances near high-friction actions (upload, report).

## Pending Code Review (to align plan with current implementation)
- Verify structure of `help-content.ts` (types, topic keys, any existing metadata) before adding `requiresRole`, `category/tags`, and new topics.
- Inspect `HelpPanel.tsx` (or equivalent) for current filtering/sorting; adjust plan if it already supports role gating or search.
- Locate `getHelpTopicFromPath` (or similar) to confirm current route mappings and add `/learn`, `/gallery` vs `/social`, `/admin`, `/photos`, and auth routes as planned.
- Check existing help/learn page components for contextual help triggers or empty-state links; update plan if hooks already exist.
- Confirm upload size/format validation is implemented; if not, note that documentation must match actual limits.
- If localization/i18n is present, note whether help content already uses translation keys to avoid duplicate work.
