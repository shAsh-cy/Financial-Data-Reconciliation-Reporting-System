# Developer walkthrough

This project is a FastAPI backend plus a Vite/React dashboard. Use this guide to run both halves, exercise reconciliation and reporting flows, and understand where logic lives.

## Run the backend

1. Create a virtual environment, install dependencies, and configure the database URL:

   ```bash
   pip install -r requirements.txt
   ```

   Copy `.env.example` to `.env` and set `DATABASE_URL` for PostgreSQL. Apply migrations:

   ```bash
   alembic upgrade head
   ```

2. Start the API (from the repository root):

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   OpenAPI docs: `http://localhost:8000/docs`.

## Run the frontend

From `frontend/`:

```bash
npm install
npm run dev
```

### Pointing the UI at the API

`VITE_API_BASE_URL` must be an **origin only**. The axios client already appends
`/api/v1/...` to every request path, so a value that includes that prefix
produces `/api/v1/api/v1/...` and every detail route returns **404**.

| Value | Result |
|-------|--------|
| *(unset — recommended in dev)* | Same-origin requests; Vite proxies `/api` → FastAPI |
| `http://127.0.0.1:8000` | Correct — calls the backend directly |
| `http://127.0.0.1:8000/api/v1` | **Wrong** — doubled prefix, 404s on detail routes |

`frontend/src/utils/env.ts` defensively strips a trailing `/api/v1`, but do not
rely on that — set the origin.

Set `VITE_DEMO_MODE=true` to force the demo banner on regardless of API responses.

### Frontend layout

| Concern | Location |
|---------|----------|
| Design tokens, light/dark themes, glass utility | `frontend/src/theme/` |
| Shared component library (GlassCard, KPICard, DataTable, StatusChip, TaskStatusPoller, DemoBanner, …) | `frontend/src/components/ui/` |
| Feature pages | `frontend/src/features/<feature>/pages/` |
| Cross-feature hooks (`useReports`, `useLedgers`, `useJobHistory`) | `frontend/src/hooks/` |
| Global state (auth, theme, demo mode) | `frontend/src/app/state/` |

Theme mode persists to `localStorage` under `theme-mode` and is toggled from the
bottom of the sidebar. The `/operations` route is lazy-loaded because it pulls in
`@mui/x-date-pickers`.

Job history on the Operations page is per-tab, stored in `sessionStorage` under
`ops-job-history` and capped at the 10 most recent tasks. Non-terminal tasks are
re-polled every 5s; the inline poller under each form polls every 3s.

## Run the Celery worker

Job triggers return a `task_id` immediately, but nothing progresses past `queued`
unless a worker is consuming the Redis queue:

```bash
celery -A app.workers.celery_app worker -l info
```

## Trigger reconciliation and reporting flows

Every write path is exposed over HTTP and driven from the **Operations** page
(`/operations`) in the dashboard. Trigger endpoints require the **admin** or
**accountant** role; status polling is open to all roles.

| Method | Path | Body | Result |
|--------|------|------|--------|
| POST | `/api/v1/transactions/ingest` | `{ ledger_id, transactions[] }` | `{ task_id }` 202 |
| POST | `/api/v1/jobs/reconciliation` | `{ left_ledger_id, right_ledger_id }` | `{ task_id, status: "queued" }` 202 |
| POST | `/api/v1/jobs/reports/pnl` | `{ ledger_id, period_start, period_end }` | `{ task_id, status: "queued" }` 202 |
| POST | `/api/v1/jobs/reports/liquidity` | `{ ledger_id, period_start, period_end }` | `{ task_id, status: "queued" }` 202 |
| GET | `/api/v1/jobs/{task_id}` | — | `{ task_id, status, result?, error? }` |

`status` maps Celery states onto four values: `queued`, `running`, `success`,
`failed`. On success, `result` is the id of the record the worker produced — a
reconciliation run id, a report id, or (for ingest) the number of rows inserted.

Ledgers are managed under `/api/v1/ledgers` (list/get for every role; create and
update are admin-only). The job forms populate their dropdowns from this list.

Reads stay where they were: runs and items under `/api/v1/reconciliations`,
reports under `/api/v1/reports` and `/api/v1/reports/overview`, each also
aliased under `/api/v1/reporting/...`.

Use a valid JWT from `/api/v1/auth/login` and send `Authorization: Bearer <token>` on every request above.

## Synthetic (demo) data

When **`REPORTING_DEMO_FALLBACK=true`** (see `.env.example`):

- List endpoints return deterministic demo rows if the database has **no** matching rows (or in some failure paths documented in code).
- **Detail** endpoints resolve the same deterministic IDs used in those lists, so opening a run or report from the demo list does **not** 404.
- Responses include **`meta: { "is_demo": true }`** when the payload is synthetic.

Set **`REPORTING_DEMO_FALLBACK=false`** in production if you want strict empty results and no synthetic records.

The dashboard surfaces this with a single app-wide banner rendered in
`AppLayout`. It turns on when `VITE_DEMO_MODE=true`, or as soon as any API
response carries `meta.is_demo: true` — hooks and pages report that through
`activateDemoFromMeta` in `frontend/src/app/state/demoStore.ts`.

Demo UUIDs are derived in `app/services/reporting_demo.py` from a fixed namespace so they are stable across restarts.

## API response shape

Collection-style responses use:

```json
{
  "items": [],
  "total": 0,
  "meta": {}
}
```

When demo data is returned, `meta` typically contains `{ "is_demo": true }`. List endpoints for reconciliation runs and financial reports follow this shape.

Detail reads (`GET .../reconciliations/{id}`, `GET .../reports/{id}`) return:

```json
{
  "id": "<uuid>",
  "data": { "summary": {}, "timeseries": [], "breakdown": [] },
  "meta": { "is_demo": false }
}
```

Note that `is_demo` lives inside **`meta`**, not at the top level.

Deterministic demo IDs from `reporting_demo.py` resolve on detail **even when those rows are not stored in Postgres**, so links from overview/list stay consistent with synthetic data.

Reconciliation item lists include `meta.aggregation` (matched vs unmatched line counts). Item rows expose `match_status` (`matched` | `unmatched`) alongside `match_type`.

## Key modules

| Area | Responsibility |
|------|----------------|
| `app/repositories/reporting_queries.py` | Async SQLAlchemy reads only (counts, lists, get-by-id, reconciliation items). |
| `app/services/reporting_demo.py` | Deterministic demo payloads and ID helpers. |
| `app/services/reporting_read_service.py` | List + overview orchestration, demo fallback for lists, overview aggregation. |
| `app/services/reconciliation_service.py` | Reconciliation **detail** + **items** reads, logging, demo-aware fallbacks. |
| `app/services/report_service.py` | Financial report **detail** reads, logging, demo-aware fallbacks. |
| `app/api/routes/reporting.py` | Thin routes: auth deps, call services, map `None` to HTTP 404 where appropriate. |
| `app/services/job_service.py` | Celery `.delay()` dispatch and `AsyncResult` state mapping for the jobs API. |
| `app/services/ledger_service.py` | Async ledger CRUD, including slug-derived unique ledger codes. |
| `app/workers/tasks.py` | The Celery tasks themselves: ingest, reconcile, generate P&L, generate liquidity. |

Business rules for numeric reporting (PnL, liquidity math) live under `app/services/reporting.py` and related modules used by write/async jobs—not in the read routers above.

## Troubleshooting 404 on report/reconciliation detail

1. **Backend must start cleanly.** If `uvicorn` logs an import error (for example while loading `app.api.routes.reporting`), routes are not registered and proxies can return **404** for `/api/v1/reports/{id}`. Fix the error, then restart the API.

2. **Frontend API base URL.** The client calls paths like `/api/v1/reports/...`. Set `VITE_API_BASE_URL` to the **origin only** (e.g. `http://127.0.0.1:8000`), not `http://127.0.0.1:8000/api/v1`. A doubled prefix produces `/api/v1/api/v1/...` and **404**.

3. **Demo IDs.** UUIDs such as `5d26a6aa-…` are deterministic demo report keys from `reporting_demo.py`. They resolve on the API **without** a database row once the app loads correctly.

## Logging

Detail services log:

- The requested UUID.
- Whether a row was loaded from the database or from demo fallback.
- Database failures at warning or exception level before returning a controlled HTTP response.

Search log lines for `ReconciliationService` and `ReportService` when debugging 404 vs 503 vs demo behavior.
