# Implementation Plan: CMS Job Tracker

## Overview

Incremental build in six phases: scaffold → database wiring → P1 fire alarm → notifications + WIP cap → design pass → property-based tests. Each phase produces working, runnable code before the next begins.

## Tasks

- [x] 1. Project scaffold — types, mock data, three-zone layout
  - [x] 1.1 Initialise Next.js 14 App Router project with Tailwind CSS
    - Run `npx create-next-app@latest` with App Router, TypeScript, Tailwind
    - Install dependencies: `@supabase/supabase-js framer-motion`
    - Run `npx shadcn@latest init` then add components: `button badge sheet tooltip separator scroll-area`
    - Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` placeholders
    - _Requirements: 5, 5a, 7_

  - [x] 1.2 Create `types/job.ts` with all shared types
    - Define `Job` interface, `JobStatus` union, `JobType` union, `CreateJobPayload`, `FireAlarmPayload`
    - Export `VALID_TRANSITIONS`, `PRIORITY_ORDER` constants
    - Export pure logic functions: `sortJobs`, `assignZone`, `isValidWorkbookLink`, `isReadyForQueue`
    - _Requirements: 3, 4.5, 4.6_

  - [x] 1.3 Create `lib/db.ts` Supabase client
    - Single `createClient` call using env vars; export `supabase`
    - _Requirements: 5a_

  - [x] 1.4 Create `lib/notifications.ts` browser push helpers
    - Export `requestNotificationPermission()` and `sendP1Notification(title: string, client: string)`
    - _Requirements: 4.4_

  - [x] 1.5 Build `components/JobCard.tsx` with mock data
    - Accept `JobCardProps` (job, role, onStatusChange, onWorkbookLinkAdd)
    - Render title, client, priority badge, status pill, due date, overdue indicator
    - Collapsible expand section: brief, asset notes, Workbook button
    - Left border colour: red P1, amber P2, grey P3; fire alarm cards get `#FFF5F5` tint
    - _Requirements: 4.1, 4.6_

  - [x] 1.6 Build `components/WorkbookButton.tsx`
    - Render "Open in Workbook ↗" when `link` is present; "Add Workbook link" prompt otherwise
    - Fire alarm cards with no link show amber banner: "Remember to log this in Workbook"
    - _Requirements: 4.6_

  - [x] 1.7 Build `components/StatsStrip.tsx`
    - Accept `StatsStripProps`; render six counters (totalActive, inProgress, blocked, overdue, completedThisWeek, p1sThisWeek)
    - Render `WIPWarningBanner` when `wipCapExceeded` is true
    - _Requirements: 4.8_

  - [x] 1.8 Build `components/JobBoard.tsx` with mock data
    - Three zones: NeedsInfoZone (hidden when `role=dev`), ActiveQueueZone, DoneThisWeekZone (collapsible)
    - Use `assignZone` and `sortJobs` from `types/job.ts` to distribute and order cards
    - _Requirements: 4.1, 2_

  - [x] 1.9 Build `app/page.tsx` with mock data wiring
    - Compose Header + StatsStrip + FilterBar + JobBoard
    - Role toggle (AM / Dev) stored in `sessionStorage`; passed as prop through tree
    - Compute stats from mock job list; pass to StatsStrip
    - _Requirements: 4.1, 4.7_

  - [x] 1.10 Build `components/NewJobPanel.tsx` (shadcn Sheet)
    - All fields from requirements 4.2 table; client-side validation
    - AM name persisted to `sessionStorage` after first entry
    - `onSubmit` calls parent handler with `CreateJobPayload`
    - _Requirements: 4.2_

  - [x] 1.11 Build `components/FireAlarmPanel.tsx` (shadcn Sheet)
    - Minimal fields: client, title, optional Workbook link
    - Priority locked to P1, type locked to "Urgent fix", `is_fire_alarm=true`
    - "🔴 Raise Urgent" trigger button always visible in header
    - _Requirements: 4.3_

  - [x] 1.12 Build `components/FilterBar.tsx`
    - Filter tabs: All / P1 Only / In Progress / Blocked / In Review / By Client / My Jobs
    - Sort selector: Priority / Due Date / Date Created
    - Search input filtering by title and client name
    - _Requirements: 4.7_

  - [ ]* 1.13 Write unit tests for pure logic functions in `types/job.ts`
    - Test `isValidWorkbookLink`: empty string → false, prefix only → false, valid link → true
    - Test `isReadyForQueue`: P1 without due date → false, P2 without due date → true
    - Test `assignZone`: needs-info → 'needs-info', live → 'done', all others → 'active'
    - Test `sortJobs`: P1 before P2 before P3; within priority, due dates before nulls
    - _Requirements: 4.1, 4.2, 4.6_

- [-] 2. Database wiring — API routes connected to Supabase
  - [ ] 2.1 Run Supabase schema migration
    - Execute the SQL from requirements Section 5b in Supabase Dashboard → SQL Editor
    - Verify table, trigger, and indexes are created
    - _Requirements: 5b_

  - [x] 2.2 Implement `GET /api/jobs` in `app/api/jobs/route.ts`
    - Fetch all non-live jobs ordered by priority ASC then created_at ASC
    - Accept `?include_done=true` query param to include live jobs from this week
    - Return JSON array; handle Supabase errors with 500 response
    - _Requirements: 4.1_

  - [x] 2.3 Implement `POST /api/jobs` in `app/api/jobs/route.ts`
    - Validate required fields per `standardJobRules` and `fireAlarmRules` from design
    - Validate Workbook link format if present
    - Determine initial status: fire alarm → `briefed`; standard with link + assets → `briefed`; otherwise → `needs-info`
    - Insert row via `supabase.from('jobs').insert(...).select().single()`
    - Return 201 with created row; return 400 with error message on validation failure
    - _Requirements: 4.2, 4.3_

  - [x] 2.4 Implement `PATCH /api/jobs/[id]` in `app/api/jobs/[id]/route.ts`
    - Fetch current job; return 404 if not found
    - Validate status transition against `VALID_TRANSITIONS`; return 400 if invalid
    - Block transition to `live` if `workbook_link` is null; return 400 with gate message
    - Set `completed_at = NOW()` when new status is `live`
    - Update row and return updated job
    - _Requirements: 4.5, 4.6_

  - [x] 2.5 Implement `DELETE /api/jobs/[id]` in `app/api/jobs/[id]/route.ts`
    - Hard delete by id; return 404 if not found; return 204 on success
    - _Requirements: 4.1_

  - [x] 2.6 Wire `app/page.tsx` to live API routes
    - Replace mock data with `fetch('/api/jobs')` on mount and after every mutation
    - Pass `onStatusChange` and `onWorkbookLinkAdd` handlers that call PATCH route
    - Pass `onSubmit` handlers for NewJobPanel and FireAlarmPanel that call POST route
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 2.7 Write integration tests for API routes
    - `GET /api/jobs` returns correct shape
    - `POST /api/jobs` inserts and returns created row
    - `PATCH /api/jobs/[id]` updates status and `updated_at`
    - `PATCH /api/jobs/[id]` with `status=live` and no link returns 400
    - _Requirements: 4.2, 4.5, 4.6_

- [ ] 3. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 4. P1 Fire Alarm — fast-track form, fire alarm card UI, Workbook link gate
  - [x] 4.1 Wire FireAlarmPanel submit to POST `/api/jobs`
    - On success, re-fetch job list and close panel
    - _Requirements: 4.3_

  - [x] 4.2 Implement fire alarm card visual treatment in `JobCard.tsx`
    - Amber banner: "Remember to log this in Workbook" when `is_fire_alarm=true` and `workbook_link=null`
    - Show "Add Workbook link" inline prompt when link is absent
    - Inline error on Live action button when Workbook link is missing: "Add the Workbook job link before marking this live"
    - _Requirements: 4.3, 4.6_

  - [x] 4.3 Implement Workbook link add flow
    - "Add Workbook link" prompt opens an inline input; validates prefix on submit
    - Calls PATCH route with `{ workbook_link }` on confirm
    - _Requirements: 4.6_

  - [ ]* 4.4 Write component tests for JobCard fire alarm states
    - Renders amber banner when `is_fire_alarm=true` and `workbook_link=null`
    - Renders "Open in Workbook ↗" when `workbook_link` is present
    - Renders "Add Workbook link" prompt when `workbook_link` is null
    - _Requirements: 4.3, 4.6_

- [x] 5. Notifications + WIP cap
  - [x] 5.1 Request browser notification permission on first page load
    - Call `requestNotificationPermission()` from `lib/notifications.ts` in a `useEffect` in `app/page.tsx`
    - _Requirements: 4.4_

  - [x] 5.2 Fire P1 browser notification on job creation
    - After successful POST of a P1 job, call `sendP1Notification(title, client)`
    - _Requirements: 4.4_

  - [x] 5.3 Add P1 pulse indicator to JobCard
    - P1 jobs with status `briefed` (not yet in-progress) render a red pulsing ring on the priority badge
    - Use `pulseVariants` from design Section 6
    - _Requirements: 4.4_

  - [x] 5.4 Implement WIP cap warning in StatsStrip
    - Compute `wipCapExceeded = inProgressCount > 3` in `app/page.tsx`
    - Pass to StatsStrip; render animated banner using `bannerVariants`
    - In-progress counter gets red tint when at or over cap
    - _Requirements: 4.1, 4.8_

  - [ ]* 5.5 Write component tests for notifications and WIP cap
    - StatsStrip renders WIP warning banner when `wipCapExceeded=true`
    - P1 pulse renders on briefed P1 cards
    - NeedsInfoZone not rendered when `role=dev`
    - _Requirements: 4.1, 4.4, 4.8_

- [ ] 6. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 7. Design pass — Linear aesthetic, shadcn/ui, Framer Motion
  - [x] 7.1 Extend `tailwind.config.ts` with design tokens
    - Add colour tokens from design Section 6: `p1`, `p2`, `p3`, `status-*`, `brand`, `brand-muted`
    - _Requirements: 6_

  - [x] 7.2 Apply Linear-style layout in `app/layout.tsx`
    - Dark sidebar `#0F0F0F`, off-white main panel `#FAFAFA`
    - Load Inter via `next/font/google`
    - _Requirements: 6_

  - [x] 7.3 Apply Framer Motion animations
    - Wrap job card list in `AnimatePresence` with staggered `cardVariants`
    - Wrap NewJobPanel and FireAlarmPanel Sheet content in `panelVariants`
    - Add `pulseVariants` to P1 fire alarm priority badge
    - Add `flashVariants` to JobCard on status change
    - Animate WIP warning banner with `bannerVariants`
    - _Requirements: 6_

  - [x] 7.4 Apply shadcn/ui components throughout
    - Replace raw elements with `Badge` for status and priority labels
    - Confirm `Sheet` wraps both slide-in panels
    - Add `Tooltip` to stats strip counters
    - Use `Separator` between board zones
    - _Requirements: 6_

  - [x] 7.5 Polish card and zone visual design
    - White card background, 1px border `#E5E7EB`, 8px radius, left border colour-coded by priority
    - Fire alarm cards: `#FFF5F5` background tint
    - Hover: border darkens, subtle shadow
    - "Open in Workbook ↗" styled as primary CTA on expanded cards
    - Stats strip: dark background, monospaced numbers, compact
    - _Requirements: 6_

- [ ] 8. Property-based tests — fast-check for all 9 correctness properties
  - [ ] 8.1 Set up fast-check and test runner
    - Install: `npm install --save-dev fast-check vitest @vitejs/plugin-react`
    - Create `vitest.config.ts`; add test script to `package.json`
    - Create `__tests__/arbitraries.ts` with `arbitraryJob()` fast-check arbitrary
    - _Requirements: Testing Strategy_

  - [ ]* 8.2 Write property test — Property 1: Priority ordering invariant
    - For any array of jobs, `sortJobs` produces a list where `PRIORITY_ORDER[a.priority] <= PRIORITY_ORDER[b.priority]` for all consecutive pairs
    - **Property 1: Priority ordering invariant**
    - **Validates: Requirements 4.1**

  - [ ]* 8.3 Write property test — Property 2: Within-priority due date ordering
    - For any array of jobs with the same priority, after sorting, jobs with a due date appear before jobs without, and earlier dates appear before later dates
    - **Property 2: Within-priority due date ordering**
    - **Validates: Requirements 4.1**

  - [ ]* 8.4 Write property test — Property 3: Workbook link gate blocks Live transition
    - For any job where `workbook_link` is null or invalid, a PATCH to `live` must return 400 and the job status must remain unchanged
    - **Property 3: Workbook link gate blocks Live transition**
    - **Validates: Requirements 4.6**

  - [ ]* 8.5 Write property test — Property 4: Needs Info gate correctness
    - For any job, `isReadyForQueue` returns true iff valid Workbook link AND type set AND (not P1 OR due date set)
    - **Property 4: Needs Info gate correctness**
    - **Validates: Requirements 4.2**

  - [ ]* 8.6 Write property test — Property 5: Fire alarm jobs bypass Needs Info gate
    - For any fire alarm payload, the created job's initial status is `briefed` regardless of whether `workbook_link` is present
    - **Property 5: Fire alarm jobs bypass Needs Info gate**
    - **Validates: Requirements 4.3**

  - [ ]* 8.7 Write property test — Property 6: Status transition validity
    - For any job and any target status, the transition is accepted iff the target appears in `VALID_TRANSITIONS[currentStatus]`
    - **Property 6: Status transition validity**
    - **Validates: Requirements 4.5**

  - [ ]* 8.8 Write property test — Property 7: Workbook link validation
    - For any string, `isValidWorkbookLink` returns true iff it starts with `https://wb.ogilvy.co.za#` and has at least one character after the `#`
    - **Property 7: Workbook link validation**
    - **Validates: Requirements 4.2**

  - [ ]* 8.9 Write property test — Property 8: Zone assignment completeness
    - For any job, `assignZone` returns exactly one of `needs-info`, `active`, or `done` — never throws, never returns undefined
    - **Property 8: Zone assignment completeness**
    - **Validates: Requirements 4.1**

  - [ ]* 8.10 Write property test — Property 9: Stats strip accuracy
    - For any list of jobs, computed stats (inProgress, blocked, overdue counts) exactly match the count of jobs with the corresponding status/condition
    - **Property 9: Stats strip accuracy**
    - **Validates: Requirements 4.8**

- [ ] 9. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests in phase 8 validate the pure logic functions in `types/job.ts` — run with `npx vitest --run`
- The Supabase schema migration (task 2.1) must be run manually in the Supabase Dashboard before wiring the API routes
- Design tokens in task 7.1 include a `brand` placeholder — replace with the agency's CI hex before the design pass
