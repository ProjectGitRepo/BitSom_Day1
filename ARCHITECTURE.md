# Architecture

TalentIQ is modeled the way enterprise talent-intelligence platforms (e.g. PrismForce's
SkillPrism / talent-supply-chain category) are actually structured: a connector layer
that ingests from systems of record, a canonical talent graph with per-field provenance,
and a set of engines that reason over that graph. It's built so that **the only thing
that changes when a customer connects their real systems is the inside of one function
per connector** — the ingestion pipeline, data model, and every engine above it are
already wired end-to-end against the seeded dataset.

```
 Systems of record                Connector layer              Canonical talent graph          Engines                          API / UI
 ────────────────────           ────────────────────         ────────────────────────       ───────────────────────           ───────────────
 Workday (HRIS)         ──┐
 Greenhouse (ATS)         │      SourceConnector              Employee 360 record            Evidence Matching Engine
 Jira + Confluence (PM)   ├──►   { id, sync(ctx) }    ──►      + skills[] (source,       ──►  (skills + evidence text,   ──►   REST API  ──► HR web app
 Lattice (Perf.)          │      one adapter per system         lastVerifiedAt, level)         confidence-weighted)
 Cornerstone (LMS)        │      normalizes into the           + projects / feedback /        Workforce Supply-Demand
 Skills Taxonomy Service ─┘      Employee shape                  certs / LMS history            Engine (ready / reskill /
                                                                  (each with provenance)         hire split)
                                                                                                Reskilling / Career Engine
                                                                                                Insights & Analytics
```

## Connector layer (`backend/src/connectors/`)

Every source system implements one interface:

```ts
interface SourceConnector {
  id: string;                                  // matches the SystemSource record
  sync(context: SyncContext): SyncResult;      // { recordsChanged, summary, details }
}
```

Today `sync()` mutates the seeded in-memory dataset directly — e.g. the Jira connector
appends a real project record (with delivery evidence text) to a random employee; the
Cornerstone connector logs an LMS completion and bumps the matching skill. That's why
clicking **Sync now** in Settings → System Config visibly changes what Talent 360 and
Capability Search show — it's a real ingestion write, not a fake spinner.

**To go live against a real tenant:** replace the body of each connector's `sync()` with
an HTTP client call — Workday's Human_Resources/Staffing web services, the Greenhouse
Harvest API, the Jira/Confluence REST API, Lattice's API, Cornerstone's LMS API — and map
the response onto the same `Employee` fields. `backend/src/services/ingestion.ts`
(the orchestrator), `backend/src/routes/systemSources.ts` (the API), and the entire
matching/workforce/skill-gap engine stack don't change at all.

## Skills Repository & knowledge graph (`backend/src/data/skillsRepository.json`, `services/skillsRepository.ts`)

This is entirely backend infrastructure — no dedicated frontend page. It's the layer
every engine reasons against instead of comparing raw strings:

- **Canonical taxonomy** — 39 skills across 7 categories, each with a description.
- **Aliases** — `resolveSkill()` / `canonicalName()` normalize any raw skill string (from
  a connector, a resume parse, or an HR-typed query) to one canonical skill, so an
  employee tagged "ML" by one system and "Machine Learning" by another are recognized as
  the same skill everywhere matching happens. Before this existed, matching relied on
  exact, case-insensitive string equality — which is why the honest answer to "do we have
  a skills repo" used to be no.
- **Visual reference**: `backend/docs/knowledge-graph.html` — a self-contained page (open
  it directly in a browser, no server needed) walking through a real worked example and
  the actual Product & Strategy neighborhood, for when someone asks to see this
  mechanism directly. Not part of the running app.
- **Adjacency graph** — each skill lists related skills (`getAdjacentSkillNames()`). This
  is what lets the matching engine recognize *capability*, not just *vocabulary*: a
  Business Analyst who has never held the title "AI Product Manager" but does hold
  Requirement Gathering, SQL, and Stakeholder Management — skills the graph marks as
  adjacent to what that role needs — still earns partial credit and a rationale ("doesn't
  directly hold X, but shows adjacent capability via Y"), instead of scoring zero because
  the exact words never matched.

## Triangulated confidence (`backend/src/services/confidence.ts`)

Every skill record carries `source[]` (self-reported, project, manager, certification,
LMS) and `lastVerifiedAt`. Confidence isn't just "how much do we trust the best source" —
it's triangulated: an employee whose Python is confirmed by *both* a shipped project and a
certification scores higher than one with either alone, the same distinction between
"I know Python" and "I've delivered three Python projects and passed an assessment." On
top of that:

- **source trust** — a manager sign-off or certification counts for more than an
  unverified self-report
- **recency decay** — evidence not re-confirmed by a sync in 18+ months is discounted,
  the same way a real skills-intelligence engine treats a three-year-old resume claim as
  less reliable than a project shipped last quarter

The result is a `high` / `medium` / `low` confidence tier plus an evidence checklist
(which of resume / project / certification / manager / LMS are present) per skill. This
is what backs the "fresh / aging / stale" badges in Talent 360, the confidence percentage
on matched skills in Capability Search, and the adjacency reasoning above — and it's the
mechanism that would keep the whole system honest once real, continuously-syncing data
starts flowing through it, rather than a one-time import that goes stale.

## Engines

- **Evidence Matching Engine** (`services/matching.ts`) — Agent 2. Scores an employee
  against a role on weighted skill fit *and* free-text evidence found in resumes,
  project descriptions, and manager feedback, and generates a plain-English rationale
  per match (`buildRationale`) — not just a number.
- **Intent detection** (`services/intent.ts`) — parses a free-text ask ("I need someone
  who can gather requirements and manage stakeholders") against the role catalog via
  fuzzy token matching, so Capability Search doesn't require picking a role first.
- **Workforce Supply-Demand Engine** (`services/workforce.ts`) — Agent 3. Takes a
  role + headcount ask and allocates it across ready / reskillable / hire-externally
  pools — the demand vs. supply framing the talent-supply-chain category is built on.
  Also runs `checkPoolComposition()` — a rule-based check on whether any department
  makes up a disproportionate share of that pool relative to its share of the org
  (flagged at 2×+). This is the kind of bias check the EU AI Act requires of high-risk
  HR AI systems (core obligations effective August 2026); it's tractable here, and hard
  for a black-box model, because every score is already attributable to named factors.
- **Reskilling / Career Pathing** (`services/skillGap.ts`) — per-employee gap analysis
  against a target role, with LMS course recommendations and an estimated time-to-close.
- **ROI Engine** (`services/roi.ts`) — converts a workforce plan into a cost and
  time-to-staffed comparison against an all-external-hire baseline, with every
  assumption editable at request time.
- **Insights Engine** (`services/insights.ts`) — flight-risk scoring, cross-department
  "hidden gem" detection, and per-role bench-pressure alerts, surfaced on the Overview
  dashboard as "what your agents found today."
- **Analytics** (`routes/dashboard.ts`) — org-wide coverage and skill-supply rollups.

## Competitive grounding

These aren't invented categories — they're the same signals the established players in
this space (talent-supply-chain / talent-intelligence platforms) lead with, translated
into a deterministic, rule-based implementation instead of a black-box model:

- **PrismForce** frames the whole problem as a *talent supply chain* — SkillPrism
  (skill profiling + gap detection), CareerPrism (pathing), InsightPrism (workforce
  scenario dashboards) — sitting on top of Workday/SAP/ServiceNow as systems of record.
  That's the connector-layer-over-systems-of-record shape this repo mirrors.
- **Eightfold AI** treats matching as "which candidates/employees are likely to succeed,
  which show flight risk, which could move into a role even if their resume never lists
  the skill" — i.e. flight-risk scoring and "hidden gem" detection, which is exactly
  what `services/insights.ts` computes here (deterministically, not via a deep model).
- **Gloat**'s talent marketplace ranks internal opportunities by fit *and* growth value,
  not raw skill-match percentage — the same principle behind pairing the ready/reskill/
  hire split with a rationale instead of a bare score.
- **Published benchmarks** (external technical hire ≈ $14,170 fully loaded vs. ≈ $5,770
  to upskill, 70-92% average cost savings from upskilling, external hires taking 2-3
  years to match internal-promotion performance) are what the ROI engine's default
  assumptions are grounded in, not arbitrary numbers.

## Why this shape

Keyword/title-based search and a flat skills spreadsheet are the two failure modes this
is built against: point-in-time, unweighted, and blind to evidence trapped in project
records and manager feedback. Treating ingestion as a first-class, swappable layer — and
treating every skill as evidence with a trust score and an expiry, not a static tag — is
what makes "connect your systems" a real integration story instead of a slide.
