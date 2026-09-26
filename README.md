# TalentIQ — Internal Talent Marketplace

An HR-facing prototype that turns three manual hiring pain points into rule-based agents, backed by a seeded JSON dataset of 95 employees.

- **Agent 1 — Talent Data Aggregator** (`Talent 360`): unifies employee profiles, resumes/certifications, project records, manager feedback, and LMS history into one profile per person.
- **Agent 2 — Capability-to-Role Mapping** (`Capability Search`): scores employees against a role using both formal skills and evidence phrases mined from resumes, project descriptions, and manager feedback — not just job-title keywords.
- **Agent 3 — Hybrid Workforce Planner**: given a role + headcount (e.g. "50 AI Engineers"), splits the number into who's ready now, who can be reskilled, and how many actually need to be hired externally — plus a per-employee skill-gap and learning-path drill-down, and a **cost/time ROI panel** comparing that plan against hiring everyone externally.

Matching/scoring is deterministic and rule-based (weighted skill match + evidence keyword search, confidence-weighted by source and recency) — no LLM calls yet. On top of that:

- **Natural-language capability search** — the free-text box on Capability Search is parsed against the role catalog (fuzzy token matching, not just exact keywords) to auto-detect the closest role, shown as "Interpreted as: {role} ({confidence}%)". Each match also gets a generated, plain-English rationale, not just a score.
- **Proactive insights** (`GET /api/insights`, surfaced on the Overview dashboard) — flight-risk scoring, cross-department "hidden gem" detection, and per-role bench-pressure alerts, the same category of signal Eightfold AI and Gloat market as their core differentiators (see Architecture below).
- **ROI modeling** — the workforce planner's cost/time comparison uses published benchmarks as defaults (external technical hire ≈ $14,170 fully loaded vs. ≈ $5,770 to upskill; ~8 week average external time-to-fill) and lets HR override every assumption live.

A real connector/ingestion layer sits under all three agents (`backend/src/connectors/`) — one adapter per source system (Workday, Greenhouse, Jira+Confluence, Lattice, Cornerstone LMS, Skills Taxonomy Service), each behind the same `SourceConnector` interface. Settings → System Config's "Sync now" triggers a real ingestion write (a new project record, certification, feedback entry, or LMS completion lands on an employee's profile immediately). See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full data-flow diagram, the competitive grounding for these features, and what changes to go live against a real tenant.

**Skills Repository & knowledge graph** (`backend/src/data/skillsRepository.json` + `services/skillsRepository.ts`) is backend-only infrastructure, not a UI page: a canonical taxonomy with categories, synonyms/aliases (so "ML" and "Machine Learning" resolve to one skill everywhere), and an adjacency graph the matching engine actually scores against — an employee missing a required skill outright can still earn partial credit and a rationale ("shows adjacent capability via X") if they hold a skill the graph marks as related. Confidence itself is triangulated across sources (a skill confirmed by both a project *and* a certification scores higher than either alone), not just weighted by the single best source.

## Design

UI is built on Tailwind's `stone` neutral palette with an indigo (`brand`) accent — see `frontend/tailwind.config.js`.

## Structure

```
backend/    Express + TypeScript API, seeded JSON data, connectors, matching/workforce/skill-gap engines
frontend/   React + TypeScript + Vite + Tailwind UI (HR persona only)
```

## Running locally

**Backend** (http://localhost:4000):
```
cd backend
npm install
npm run generate-data   # regenerate the seeded employee dataset (optional, already generated)
npm run dev
```

**Frontend** (http://localhost:5173):
```
cd frontend
npm install
npm run dev
```

The frontend reads the API base URL from `frontend/.env` (`VITE_API_URL`).

## Data

All data is seeded JSON under `backend/src/data/` (`employees.json`, `roles.json`, `lmsCatalog.json`). No database is wired up yet — swapping the JSON reads in `backend/src/data/index.ts` for real queries is the intended upgrade path once this needs to run on live HR systems.
