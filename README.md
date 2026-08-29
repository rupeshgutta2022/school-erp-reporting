# Cross-Module Reporting — School ERP

A working example of a **cross-module report**: finance, attendance, and
academics — three modules that normally live in separate parts of a School
ERP — joined per student into one record, with a combined risk score that
none of the three modules could produce alone.

This is the "Cross-module reporting (finance + attendance + academics
joined)" feature from the ERP feature list, built as a standalone full-stack
app so you can run it, seed it with realistic data, and see the joins work.

## What it does

- **Student ledger** — one row per student: attendance %, fee collection %,
  academic average, and a combined risk badge (low / medium / high).
- **Risk engine** — scores each module independently, then flags students
  where two or more modules agree something's wrong (the "compounding"
  signal — the actual point of cross-module reporting).
- **Correlation views** — academic average bucketed by attendance band,
  and outcomes split by fee-payment standing, so you can see whether the
  three signals actually move together in the seed data (they do, by
  design — see [How the seed data works](#how-the-seed-data-works)).
- **Student drill-down** — click any row for full attendance history, fee
  payment breakdown, and exam results for that student.

## Stack

- **Backend:** Node.js + Express + `better-sqlite3` (file-based SQL database,
  zero setup, MIT-licensed)
- **Frontend:** Vanilla HTML/CSS/JS + Chart.js (vendored locally — no CDN
  dependency, works fully offline)
- No GPL-licensed components, no Apache-branded big-data tooling — this
  runs entirely on your machine with nothing to install beyond Node.

## Setup

Requires [Node.js](https://nodejs.org) 18 or later.

```bash
cd backend
npm install
npm run seed      # generates ~185 students with realistic, correlated data
npm start
```

Then open **http://localhost:4000** — the backend serves the frontend
directly, so there's nothing else to run.

To reset the data, delete `backend/db/school_erp.sqlite*` and run
`npm run seed` again.

## Project structure

```
school-erp-reporting/
├── backend/
│   ├── server.js              Express app entry point
│   ├── db/
│   │   ├── schema.sql          Table definitions
│   │   ├── database.js         SQLite connection + schema bootstrap
│   │   └── seed.js             Realistic sample-data generator
│   ├── lib/
│   │   └── riskEngine.js       Combines the 3 module signals into a risk score
│   └── routes/
│       ├── students.js         Student directory
│       ├── finance.js          Fee payment summaries
│       ├── attendance.js       Attendance summaries
│       ├── academics.js        Exam result summaries
│       └── reports.js          The cross-module joins — start here
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js
        ├── app.js
        └── vendor/chart.umd.js
```

**`backend/routes/reports.js`** is the core of this feature. Everything else
in the project exists to feed it real data.

## API reference

| Endpoint | Purpose |
|---|---|
| `GET /api/reports/cross-module?class=&section=&term=` | Joined report, one row per student |
| `GET /api/reports/cross-module/:studentId` | Full detail for one student |
| `GET /api/reports/at-risk?level=high` | Filtered to a risk level |
| `GET /api/reports/correlation?class=&term=` | Aggregate correlation stats + scatter data |
| `GET /api/students`, `/api/finance/*`, `/api/attendance/*`, `/api/academics/*` | Single-module endpoints the joins are built from |

## How the risk score works

Each module contributes 0–3 points:

- **Attendance:** < 60% → 3, < 75% → 2, < 85% → 1, else 0
- **Finance:** 2+ overdue fee items → 3, 1 overdue → 2, any partial → 1
- **Academics:** avg < 40% → 3, < 55% → 2, < 70% → 1

Total score 6–9 → **high** risk, 3–5 → **medium**, 0–2 → **low**. A student
flagged (score ≥ 2) in **two or more** modules is marked `compounding` —
the strongest, most actionable signal, since it means the pattern isn't
isolated to one area of the student's record.

Tune the thresholds in `backend/lib/riskEngine.js`.

## How the seed data works

`backend/db/seed.js` assigns each student one of four behavioural
archetypes (strong / steady / inconsistent / struggling) that correlate
attendance rate, mark range, and fee-delay probability together — the same
way a real cohort tends to cluster. This is what makes the correlation
charts show a real relationship instead of random noise. Swap in your own
data by pointing the same schema at a real student information system.

## Extending this

- Add authentication + role-based access (admin vs teacher vs parent view)
- Export the ledger or a single student's report to PDF
- Add a `term` selector in the UI (the API already supports filtering by term)
- Swap SQLite for Postgres for multi-user production use — the queries are
  standard SQL and should port with minimal changes

## Testing & Quality Assurance

- **Run Test Suite**:
  ```bash
  npm test
  ```

- **Run Tests with Code Coverage**:
  ```bash
  npm run test:coverage
  ```

## CI/CD & Deployment Pipelines

Independent deployment workflows are configured in `.github/workflows/`:
- `backend-pipeline.yml` — Automated testing and deployment of Express reporting API.
- `frontend-pipeline.yml` — Automated validation and CDN publishing of the SPA dashboard.
