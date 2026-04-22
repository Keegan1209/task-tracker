# CMS Job Tracker — Requirements & Build Guide

> Internal dev queue and priority manager for an advertising agency CMS team.
> Sits alongside Workbook — not replacing it. Deploys to Vercel + Supabase.

---

## 1. Project Overview

A lightweight internal job tracker that sits **alongside Workbook** — not replacing it.
Workbook remains the source of truth for briefs, hour logging, and client communication.
This tool solves what Workbook doesn't: real-time queue visibility, priority management,
and immediate P1 escalation with direct notification to the dev.

**Primary users:** Project Managers / Account Managers (create jobs), Developer (works queue)

**Core value props:**
- PM raises a P1 and the dev knows in seconds — no Slack chase, no email
- Dev view is zero friction — two buttons, three states
- WIP cap of 3 jobs enforced by the system
- Every completed job ties back to a Workbook link — audit trail always closes

---

## 2. Core Workflow

### Two views, same data

**AM view** — create jobs, monitor progress, add Workbook links, mark Live  
**Dev view** — stripped back queue, two buttons only: Start and Done

### Standard job flow

```
AM creates job → job appears in dev's queue (Queued)
                        ↓
              Dev hits "Start" → In Progress
                        ↓
              Dev hits "Done" → Done
                        ↓
              AM adds Workbook link → Mark Live
```

### P1 Fire Alarm flow

```
Something breaks → PM hits "Raise Urgent" (minimal fields, under 20 seconds)
                        ↓
              Job goes straight to queue as P1
                        ↓
              Dev sees it immediately at top of queue
                        ↓
              Dev works it → Done
                        ↓
              AM adds Workbook link → Live
```

### Rules
- Only AMs / PMs create jobs
- Dev has two actions only: Start and Done
- AM marks Live (requires Workbook link)
- Max 3 jobs In Progress simultaneously — system warns if exceeded
- P1 jobs always sit above P2 and P3 regardless of created date
- Workbook link is mandatory before a job can be marked Live

---

## 3. Data Model

### Job Object

```typescript
interface Job {
  id: string
  title: string               // Required — what needs doing
  client: string | null       // Optional
  description: string | null  // Optional extra context
  type: JobType | null        // Optional
  priority: 'p1' | 'p2' | 'p3'
  status: JobStatus
  am: string | null           // Who created it
  due_date: string | null
  workbook_link: string | null // Mandatory before marking Live
  is_fire_alarm: boolean
  created_at: string
  updated_at: string
  completed_at: string | null
}

type JobStatus =
  | 'queued'       // In dev's queue, not started
  | 'in-progress'  // Dev is working it
  | 'done'         // Dev marked done, AM to confirm + add Workbook link
  | 'live'         // AM confirmed, Workbook link added

type JobType =
  | 'Content update'
  | 'HTML emailer'
  | 'Bug fix'
  | 'Urgent fix'
  | 'New asset upload'
  | 'Campaign page'
  | 'Copy change'
  | 'Other'
```

---

## 4. Feature Requirements

### 4.1 Dev View

- [ ] **Queue** — all `queued` jobs, P1 at top, one "Start" button per card
- [ ] **In Progress** — max 3, shows `x / 3` counter, one "Done ✓" button per card
- [ ] **Completed Today** — jobs marked done today, read-only
- [ ] **WIP warning** — banner + Start button disabled when at cap
- [ ] **P1 pulse** — red pulsing ring on P1 priority badge until started
- [ ] **Overdue indicator** — red flag on cards past due date

### 4.2 AM View

- [ ] **In Queue** — all queued jobs with full detail on expand
- [ ] **In Progress** — jobs dev is working
- [ ] **Done — Add Workbook Link** — highlighted section, AM's action required
- [ ] **Live This Week** — completed jobs, collapsible
- [ ] **Mark Live** — button on done cards, blocked without Workbook link

### 4.3 Job Creation (AM only)

| Field | Required | Notes |
|-------|----------|-------|
| Job title | Yes | What needs doing |
| Description | No | Extra context for the dev |
| Client | No | e.g. BMW, Audi |
| Priority | No | Defaults to P2 |
| Job type | No | Dropdown |
| Workbook link | No | Can be added later, required before Live |
| Due date | No | Required for P1 recommended |
| Your name | No | Session-persistent |

On submit: job goes straight to `queued` — no gate, no Needs Info zone.

### 4.4 P1 Fire Alarm (AM / PM)

Accessible via "🔴 Raise Urgent" button, always visible in header.

| Field | Notes |
|-------|-------|
| Client | Required |
| What's broken / the ask | Required — one-line description |
| Workbook link | Optional at creation |

On submit: `is_fire_alarm = true`, `priority = p1`, `status = queued`, browser notification fired.

### 4.5 Status Transitions

| From | To | Who | Condition |
|------|----|-----|-----------|
| queued | in-progress | Dev | WIP < 3 |
| in-progress | done | Dev | — |
| done | live | AM | Workbook link present |

### 4.6 Workbook Link Gate

- AM can add Workbook link at any point from the job card
- "Mark Live" button blocked without a valid Workbook link
- Fire alarm cards show amber banner: "Remember to log this in Workbook"

### 4.7 Stats Strip

- Total active (queued + in-progress)
- In Progress count (red tint at cap)
- Overdue count
- Completed this week
- P1s this week

### 4.8 P1 Notifications

- Browser push notification on P1 creation: "🔴 P1 raised: [title] — [client]"
- In-app: red pulsing ring on P1 badge until started

---

## 5. Tech Stack

```
Framework:  Next.js 14 (App Router)
Styling:    Tailwind CSS v3
Database:   Supabase (Postgres)
DB Library: @supabase/supabase-js
Hosting:    Vercel
```

---

## 5a. Database Connection

### `lib/db.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=https://ckttlspbgorxmjpntsqh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

---

## 5b. Supabase Schema

Drop existing table and recreate with the simplified model:

```sql
DROP TABLE IF EXISTS jobs;

CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  client          TEXT,
  description     TEXT,
  type            TEXT,
  priority        TEXT NOT NULL DEFAULT 'p2' CHECK (priority IN ('p1', 'p2', 'p3')),
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
                    'queued', 'in-progress', 'done', 'live'
                  )),
  am              TEXT,
  due_date        DATE,
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

ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
```

---

## 6. File Structure

```
├── app/
│   ├── page.tsx                  # Main board — switches between AM and Dev view
│   ├── layout.tsx                # Root layout, Inter font
│   └── api/jobs/
│       ├── route.ts              # GET all jobs, POST new job
│       └── [id]/route.ts         # PATCH status/workbook_link, DELETE
├── components/
│   ├── DevBoard.tsx              # Dev view — Start / Done only
│   ├── AMBoard.tsx               # AM view — full job management
│   ├── NewJobPanel.tsx           # Slide-in job creation form
│   ├── FireAlarmPanel.tsx        # Minimal P1 fast-track form
│   ├── StatsStrip.tsx            # Stats bar below header
│   └── WorkbookButton.tsx        # Workbook link CTA + add flow
├── lib/
│   ├── db.ts                     # Supabase client
│   └── notifications.ts          # Browser push helpers
├── types/
│   └── job.ts                    # Job interface, enums, pure logic functions
├── tailwind.config.js
├── .env.local
└── .gitignore
```

---

## 7. Post-MVP Ideas

- **Auth + roles** — Supabase Auth, proper AM vs Dev permissions
- **Realtime** — Supabase Realtime for instant P1 alerts without refresh
- **Slack webhook** — post to #cms-jobs on P1 creation
- **Comments** — quick note thread per job
- **Weekly report** — auto-generated summary

---

## 8. Success Criteria

1. PM raises P1 in under 20 seconds, dev sees it immediately
2. Dev opens app, sees queue, hits Start — zero friction
3. No job marked Live without a Workbook link
4. P1 jobs are visually unmissable
