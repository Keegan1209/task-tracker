# CMS Job Tracker — Requirements & Build Guide

> Internal dev queue and priority manager for an advertising agency CMS team.
> Sits alongside Workbook — not replacing it. Built for Cursor / Kiro. Deploys to Vercel + Supabase.

---

## 1. Project Overview

A lightweight internal job tracker that sits **alongside Workbook** — not replacing it.
Workbook remains the source of truth for briefs, hour logging, and client communication.
This tool solves what Workbook doesn't: real-time queue visibility, priority management,
and immediate P1 escalation with direct notification to the dev.

**The relationship between the two systems:**
- AM / PM creates the job bag in Workbook as normal
- AM then creates a card in this tool and pastes the Workbook job link (mandatory)
- Dev works from this tool's queue — one place to see what to do next
- On completion, Workbook link is confirmed before marking Live — audit trail always closes

**Primary users:** Project Managers / Account Managers (create + escalate), Developer (works queue)
**Secondary users:** Designers (view only, flag asset readiness)

**Core value props:**
- PM raises a P1 and the dev knows in seconds — no Slack chase, no email
- Urgent fixes get captured immediately, logged to Workbook after the fact
- Dev is never overloaded — WIP cap of 3 jobs enforced by the system
- Every completed job ties back to a Workbook job bag — nothing falls off the audit trail

---

## 2. Core Workflow

### Standard job flow

```
AM creates job in Workbook → pastes Workbook link into this tool
       ↓
Needs Info  (incomplete brief, missing assets, no Workbook link)
       ↓         ← AM resolves, job becomes ready
Active Queue  →  In Progress  →  In Review  →  Awaiting Approval  →  Live
                      ↕
               Awaiting Assets  (blocked, any stage)
```

### P1 Urgent / Fire alarm flow

```
Something breaks or urgent request comes in
       ↓
PM raises P1 in this tool — minimal fields, takes under 20 seconds
       ↓
Dev sees P1 alert immediately — no Slack, no email needed
       ↓
Dev works it, marks complete
       ↓
Tool prompts: add Workbook link before marking Live
       ↓
Workbook updated retroactively with accurate job record
```

### Rules
- Only AMs / PMs create jobs
- Only the dev changes status (AM can mark "Awaiting Assets" or "Assets Received")
- **Workbook link is mandatory before a job can be marked Live** (can be added after creation for P1s)
- Max 3 jobs "In Progress" simultaneously — system warns if exceeded
- Jobs move sequentially through stages, no skipping
- P1 jobs always sit above P2 and P3 regardless of created date

### Three-zone board layout

```
NEEDS INFO        AM's court — incomplete jobs, missing Workbook link, unconfirmed assets
                  Dev does not see this section

ACTIVE QUEUE      Ready to work — WIP capped at 3, priority ordered
                  This is the dev's entire world

DONE THIS WEEK    Completed jobs with Workbook links confirmed, collapsible
```

The **Needs Info gate** is the most important feature. A job cannot enter the Active Queue
until: Workbook link is present, job type is set, and due date is set for P1s.
This forces clarity at the point of creation — not after the dev has already started.

---

## 3. Data Model

### Job Object

```typescript
interface Job {
  id: string                  // uuid
  title: string               // Short job name e.g. "Update Model Range PDF"
  client: string              // Client name e.g. "BMW", "Audi"
  brief: string | null        // Optional supplementary notes — full brief lives in Workbook
  type: JobType               // See enum below
  priority: 'p1' | 'p2' | 'p3'
  status: JobStatus           // See enum below
  am: string                  // Account Manager / PM name
  due_date: string | null     // ISO date string
  assets: boolean             // Are assets confirmed available?
  asset_notes: string | null  // What assets are needed / pending
  workbook_link: string | null // e.g. https://wb.ogilvy.co.za#84b5fb8c625
                               // Optional at creation for P1s, mandatory before Live
  is_fire_alarm: boolean      // true = raised as urgent P1 fix, no Workbook link at creation
  created_at: string          // ISO timestamp
  updated_at: string          // ISO timestamp
  completed_at: string | null // Set when status = 'live'
}

type JobStatus =
  | 'needs-info'          // Incomplete — AM's court, not visible to dev
  | 'briefed'             // Ready to work — in the active queue
  | 'in-progress'         // Dev is actively working it
  | 'awaiting-assets'     // Blocked — waiting on assets from client or designer
  | 'in-review'           // Dev done, AM checking
  | 'awaiting-approval'   // AM signed off, client / PM to approve
  | 'live'                // Done — Workbook link confirmed

type JobType =
  | 'Content update'
  | 'HTML emailer'
  | 'Bug fix'
  | 'Urgent fix'          // Default for fire alarm P1s
  | 'New asset upload'
  | 'Campaign page'
  | 'Copy change'
  | 'Other'
```

---

## 4. Feature Requirements

### 4.1 Job Board (Main View)

- [ ] **Three zones** — Needs Info (AM only) / Active Queue (dev's world) / Done This Week
- [ ] **Needs Info zone hidden from dev** — only visible to AM / PM role
- [ ] **Priority ordering** — P1 always above P2 and P3, then sorted by due date within priority
- [ ] **Live counters** — In Progress / Blocked / P1 Open / Completed This Week
- [ ] **Overdue indicator** — jobs past due date flagged in red
- [ ] **WIP warning** — banner if more than 3 jobs are In Progress simultaneously
- [ ] **Click to expand** — reveals supplementary notes, asset notes, and Workbook link
- [ ] **Workbook link** — visible as a prominent button on every expanded card: "Open in Workbook ↗"

### 4.2 Standard Job Creation (AM / PM)

Simplified form — the brief lives in Workbook, not here:

| Field | Required | Notes |
|-------|----------|-------|
| Client | Yes | Text input |
| Job title | Yes | Short, descriptive |
| Job type | Yes | Dropdown |
| Priority | Yes | P1 / P2 / P3 |
| Workbook link | Yes | Validated: must start with `https://wb.ogilvy.co.za#` |
| Due date | P1 only | Required if priority = P1 |
| Assets confirmed? | Yes | Yes / No toggle |
| Asset notes | If No | What's needed and from whom |
| Supplementary notes | No | Anything not in Workbook brief |
| AM / PM name | Yes | Session-persistent after first entry |

On submit: if Workbook link is present and assets confirmed → status = `briefed` (enters Active Queue).
If either is missing → status = `needs-info` (sits in AM zone until resolved).

### 4.3 P1 Fire Alarm Creation (PM — urgent fixes)

Separate fast-track form. Accessible via a prominent "🔴 Raise Urgent" button, always visible.

Minimal required fields only:

| Field | Notes |
|-------|-------|
| Client | Text |
| What's broken / the ask | One-line description |
| Priority | Locked to P1 |
| Workbook link | **Optional at creation** — PM may not have created the job bag yet |

On submit:
- `is_fire_alarm = true`
- Status goes straight to `briefed` regardless of missing Workbook link
- A **prominent banner on the card** reads: "Workbook link required before marking Live"
- Dev sees the P1 alert immediately

### 4.4 P1 Notification

When a P1 job is created or an existing job is escalated to P1:
- Browser push notification (if permission granted) — "🔴 P1 raised: [title] — [client]"
- In-app: P1 jobs render with a red pulsing indicator until picked up (status moves to in-progress)
- No Slack or email integration required for MVP — browser notification is sufficient

### 4.5 Status Transitions

| Current Status | Available Actions | Who |
|----------------|-------------------|-----|
| Needs Info | Edit to complete, confirm Workbook link | AM |
| Briefed | "Start job", "Flag: Awaiting Assets" | Dev |
| In Progress | "Send to Review", "Flag: Awaiting Assets" | Dev |
| Awaiting Assets | "Assets Received" (returns to previous status) | AM or Dev |
| In Review | "Approve — Awaiting Client" | AM |
| Awaiting Approval | "Push Live" (requires Workbook link) | Dev or AM |
| Live | No actions — archived in Done section | — |

### 4.6 Workbook Link Gate

- Every job card shows an "Open in Workbook ↗" button when a link is present
- If no link is present, shows "Add Workbook link" prompt instead
- **Attempting to mark a job Live without a Workbook link is blocked** — inline error:
  "Add the Workbook job link before marking this live"
- Fire alarm jobs show a persistent amber banner: "Remember to log this in Workbook"

### 4.7 Filtering & Search

- Filter: All / P1 Only / In Progress / Blocked / In Review / By Client / My Jobs
- Sort: Priority (default) / Due Date / Date Created
- Search: title and client name

### 4.8 Stats Strip (persistent, below header)

- Total active jobs in queue
- In Progress count (with red tint if at or over WIP cap)
- Blocked / Awaiting Assets count
- Overdue count
- Completed this week
- P1s raised this week (useful for reporting fire drill frequency per client)

### 4.9 Reporting (passive, no extra effort)

The data model passively captures:
- How many P1 fire alarms raised per client per week
- Average time from briefed → live per job type
- Which clients generate the most blocked / awaiting assets jobs

No dashboard needed for MVP — this data exists in the DB and can be queried later.

---

## 5. Tech Stack

```
Framework:  Next.js 14 (App Router)
Styling:    Tailwind CSS
Database:   Supabase (Postgres)
DB Library: @supabase/supabase-js  ← Official Supabase client, serverless-safe on Vercel
Hosting:    Vercel
```

This is the confirmed production stack. Shared data across all users, no per-browser
localStorage, real-time capable, and deployable in one `git push`.

---

## 5a. Database Connection

### Install

```bash
npm install @supabase/supabase-js
```

### `lib/db.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
```

One file. One export. Import `supabase` anywhere you need the database.

### Environment variables

In `.env.local` (local dev) and Vercel Dashboard → Settings → Environment Variables (production):

```
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[anon key from Supabase Dashboard → Settings → API]
```

Get these from: Supabase Dashboard → Settings → API

### Usage in any API route

```typescript
import { supabase } from '@/lib/db'

// Fetch all jobs
const { data: jobs, error } = await supabase
  .from('jobs')
  .select('*')
  .order('priority', { ascending: true })
  .order('created_at', { ascending: true })

// Insert a job
const { data, error } = await supabase
  .from('jobs')
  .insert(jobPayload)
  .select()
  .single()

// Update status
const { data, error } = await supabase
  .from('jobs')
  .update({ status: newStatus })
  .eq('id', jobId)
  .select()
  .single()
```

---

## 5b. Supabase Schema

Run this in Supabase Dashboard → SQL Editor:

```sql
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  client          TEXT NOT NULL,
  brief           TEXT,
  type            TEXT NOT NULL,
  priority        TEXT NOT NULL CHECK (priority IN ('p1', 'p2', 'p3')),
  status          TEXT NOT NULL DEFAULT 'needs-info' CHECK (status IN (
                    'needs-info', 'briefed', 'in-progress', 'awaiting-assets',
                    'in-review', 'awaiting-approval', 'live'
                  )),
  am              TEXT NOT NULL,
  due_date        DATE,
  assets          BOOLEAN DEFAULT false,
  asset_notes     TEXT,
  workbook_link   TEXT,
  is_fire_alarm   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX jobs_priority_idx ON jobs (priority, created_at DESC);
CREATE INDEX jobs_status_idx ON jobs (status);
CREATE INDEX jobs_client_idx ON jobs (client);
CREATE INDEX jobs_fire_alarm_idx ON jobs (is_fire_alarm, created_at DESC);

ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
```

---

## 6. Design System

### Library stack

```
shadcn/ui        Base component layer — buttons, forms, badges, sheets, tooltips
Framer Motion    Animations — slide-in panels, card transitions, P1 pulse
21st.dev         Supplementary components where shadcn doesn't have what you need
Tailwind CSS     All custom styling on top
Inter            Font (load via next/font/google in layout.tsx)
```

### Install

```bash
# Init shadcn in your Next.js project
npx shadcn@latest init

# Install the specific components you need
npx shadcn@latest add button badge sheet tooltip separator scroll-area

# Framer Motion
npm install framer-motion

# All three play nicely together — no conflicts
```

### shadcn components used in this project

| Component | Used for |
|-----------|----------|
| `Sheet` | Slide-in panel for New Job form and Fire Alarm form |
| `Badge` | Priority badges (P1/P2/P3) and status pills |
| `Button` | All action buttons on job cards and forms |
| `Tooltip` | Hover info on stats strip counters |
| `Separator` | Zone dividers between Needs Info / Active / Done |
| `ScrollArea` | Scrollable job list without page scroll |

### Framer Motion animations

These are the specific animations worth implementing — don't over-animate:

```typescript
// 1. Job card entrance — staggered list load
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.2, ease: 'easeOut' }
  })
}

// 2. Slide-in form panel (wrap shadcn Sheet content)
const panelVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:   { x: '100%', opacity: 0, transition: { duration: 0.2 } }
}

// 3. P1 fire alarm pulse — red ring on priority badge
const pulseVariants = {
  pulse: {
    boxShadow: ['0 0 0 0 rgba(226,75,74,0.4)', '0 0 0 8px rgba(226,75,74,0)'],
    transition: { duration: 1.2, repeat: Infinity }
  }
}

// 4. Status change — card briefly highlights on update
const flashVariants = {
  flash: { backgroundColor: ['#ffffff', '#f0fdf4', '#ffffff'],
           transition: { duration: 0.6 } }
}

// 5. WIP warning banner — smooth slide down
const bannerVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { duration: 0.2 } }
}
```

### 21st.dev — components worth grabbing

Visit [21st.dev](https://21st.dev) and search for these specifically:

- **Animated counter** — for the stats strip numbers (in progress, blocked count etc)
- **Notification badge** — for the P1 alert indicator in the header
- **Progress indicator** — subtle pipeline progress on each job card
- **Command palette** — optional but great for power users (search jobs via ⌘K)

21st.dev components are copy-paste ready and Tailwind-compatible. Grab the code
directly from the site and drop into your `/components` folder.

### Design tokens

```typescript
// tailwind.config.ts — extend with these
colors: {
  brand: '[YOUR CI HEX]',       // Replace with your company primary colour
  'brand-muted': '[YOUR CI HEX at 15% opacity]',
  p1: '#E24B4A',
  p2: '#EF9F27',
  p3: '#888780',
  'status-progress': '#1D9E75',
  'status-blocked':  '#EF9F27',
  'status-review':   '#7F77DD',
  'status-live':     '#3B6D11',
}
```

### Visual design direction

Cursor prompt to set the aesthetic for the whole app:

```
Style this app to match the aesthetic of Linear (linear.app).
Dark sidebar (#0F0F0F) with clean white/off-white main panel (#FAFAFA).
Font: Inter loaded via next/font.
Company CI colour: [INSERT YOUR HEX] — use as the primary accent throughout.

Card design:
- White background, 1px border (#E5E7EB), 8px radius
- Left border 3px: red (#E24B4A) for P1, amber (#EF9F27) for P2, grey (#D1D5DB) for P3
- Fire alarm cards: very subtle red background tint (#FFF5F5)
- Hover: border darkens to (#D1D5DB), subtle shadow lifts the card

Status badges: pill shape, soft colour fill, no hard outlines.
"Open in Workbook ↗" button: treat as a primary CTA on expanded cards.
Stats strip: dark background matching sidebar, monospaced numbers, compact.
🔴 Raise Urgent button: always visible in header, red fill, hard to miss.
```

### Company CI checklist — collect before starting design step

- [ ] Primary brand colour (hex)
- [ ] Secondary / accent colour (hex)
- [ ] Brand font name (or nearest Google Fonts match)
- [ ] Logo file (SVG preferred) for the sidebar header

---

## 7. File Structure (Next.js App Router)

```
cms-job-tracker/
├── app/
│   ├── page.tsx                    # Job board — main view
│   ├── layout.tsx                  # Root layout, Inter font, dark sidebar shell
│   └── api/
│       └── jobs/
│           ├── route.ts            # GET all jobs, POST new job
│           └── [id]/
│               └── route.ts        # PATCH status, DELETE job
├── components/
│   ├── JobBoard.tsx                # Three-zone board layout
│   ├── JobCard.tsx                 # Card + Framer Motion variants + status actions
│   ├── NewJobPanel.tsx             # shadcn Sheet — standard job creation form
│   ├── FireAlarmPanel.tsx          # shadcn Sheet — minimal P1 fast-track form
│   ├── StatsStrip.tsx              # Animated counters, WIP warning banner
│   ├── WorkbookButton.tsx          # "Open in Workbook ↗" CTA + link validation
│   └── ui/                         # shadcn auto-generated components (don't edit)
├── lib/
│   ├── db.ts                       # Supabase client
│   └── notifications.ts            # Browser push notification helpers
├── types/
│   └── job.ts                      # Job interface + enums
├── tailwind.config.ts              # Extended with design tokens from Section 6
├── .env.local                      # POSTGRES_URL — never commit
├── .gitignore
└── README.md
```

---

## 8. Cursor / Kiro Prompt Strategy

### Step 1 — Scaffold

```
Build a Next.js 14 App Router CMS job tracker.
Stack: Next.js, Tailwind CSS, @supabase/supabase-js connected to Supabase.

Requirements file is attached. Scaffold with:
- app/page.tsx — job board, three zones: Needs Info / Active Queue / Done This Week
- app/api/jobs/route.ts — GET all jobs, POST new job
- app/api/jobs/[id]/route.ts — PATCH status, DELETE
- lib/db.ts — Supabase client (Section 5a)
- types/job.ts — Job interface from Section 3

Use mock data. No DB calls yet. Get the three-zone layout rendering correctly.
The Needs Info zone should be visually distinct — muted, clearly the AM's problem to resolve.
```

### Step 2 — Database

```
Wire up API routes to Supabase using lib/db.ts.
- GET /api/jobs — all non-live jobs ordered by priority then created_at
- POST /api/jobs — insert, return created row. If workbook_link is missing or assets = false → status = 'needs-info'. Otherwise status = 'briefed'.
- PATCH /api/jobs/[id] — update status. If status = 'live' and workbook_link is null → return 400 with message "Add Workbook link before marking live"

Schema is in requirements Section 5b.
```

### Step 3 — P1 Fire Alarm

```
Add a "🔴 Raise Urgent" button fixed to the top right of the header — always visible.
It opens a minimal slide-in panel with only: client, what's broken, Workbook link (optional).
Priority locks to P1. is_fire_alarm = true. Job goes straight to briefed status.
On the job card, fire alarm jobs show an amber banner: "Remember to log this in Workbook".
If no workbook_link, show "Add Workbook link" prompt on the card instead of the open button.
```

### Step 4 — Notifications + WIP cap

```
Implement browser push notifications for P1 job creation.
Request notification permission on first load.
When a P1 job is created: fire a browser notification "🔴 P1 raised: [title] — [client]".
P1 jobs without a status of in-progress should show a subtle red pulse on the priority badge.
Add WIP warning banner when more than 3 jobs have status = 'in-progress'.
```

### Step 5 — Design pass

```
Restyle to match Linear (linear.app) — minimal, fast, professional.
Company CI colour: [INSERT YOUR HEX]
Font: Inter via next/font/google in layout.tsx

Design tokens and full visual direction are in requirements Section 6.

Libraries already installed: shadcn/ui, framer-motion, tailwind.

Apply these specifically:
- Wrap job card list in AnimatePresence with staggered cardVariants (Section 6)
- Wrap NewJobPanel and FireAlarmPanel content in panelVariants (Section 6)
- Add P1 pulse animation to fire alarm cards using pulseVariants (Section 6)
- Flash card background on status change using flashVariants (Section 6)
- Animate WIP warning banner in/out with bannerVariants (Section 6)
- Use shadcn Badge for all status and priority labels
- Use shadcn Sheet for both slide-in panels
- Use shadcn Tooltip on stats strip counters
- Left border colour coding: red P1, amber P2, grey P3
- Fire alarm cards: subtle red background tint #FFF5F5
- "Open in Workbook ↗" as a prominent primary button on expanded cards
```

---

## 9. Future Phase Ideas (Post-MVP)

- **Auth + roles** — Supabase Auth, AM vs Dev vs Designer permissions, PM-only escalation
- **Realtime** — Supabase Realtime so P1 alerts and status changes push instantly without refresh
- **Slack webhook** — post to a #cms-jobs channel when P1 is raised or job hits In Review
- **Comments per job** — quick note thread on each card, stored in a `comments` table
- **Job templates** — common job types pre-fill title and notes to speed up AM creation
- **Weekly report** — auto-generated summary: jobs completed, P1 fire alarms by client, avg turnaround
- **Client portal** — read-only view filtered by client, shareable URL for account reviews
- **Workbook API** — if Workbook exposes an API, auto-pull job title and client from the link

---

## 10. Success Criteria for MVP

The tool is done when:

1. A PM can raise a P1 urgent job in under 20 seconds and the dev sees it immediately
2. The dev can see exactly what to work on next without asking anyone
3. Any team member can answer "where is that BMW job?" in under 5 seconds
4. P1 jobs are visually unmissable — impossible to overlook
5. No job can be marked Live without a Workbook link — audit trail always closes
6. The AM zone absorbs half-baked jobs before they reach the dev's queue
