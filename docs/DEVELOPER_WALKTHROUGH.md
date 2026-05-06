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

Point the UI at the API with `VITE_API_BASE_URL` (see `frontend/src/utils/env.ts`). The default assumes the API is reachable at the same origin or the value you set for local dev.

## Trigger reconciliation and reporting flows

- **Transactions**: Users with the **admin** or **accountant** role can POST transaction ingest (see `/api/v1/transactions/ingest` in OpenAPI). That queues background work (Celery) depending on your deployment.

- **Reconciliation**: After ledgers have transactions, reconciliation jobs typically populate `reconciliation_runs` and `reconciliation_items`. Read APIs expose runs and items under `/api/v1/reconciliations` and `/api/v1/reporting/reconciliations` (aliases).

- **Reports**: Financial reports are persisted when reporting jobs complete. List and overview endpoints live under `/api/v1/reports` and `/api/v1/reports/overview`.

Use a valid JWT from `/api/v1/auth/login` (or your auth route) and send `Authorization: Bearer <token>` on reporting requests.

## Synthetic (demo) data

When **`REPORTING_DEMO_FALLBACK=true`** (see `.env.example`):

- List endpoints return deterministic demo rows if the database has **no** matching rows (or in some failure paths documented in code).
- **Detail** endpoints resolve the same deterministic IDs used in those lists, so opening a run or report from the demo list does **not** 404.
- Responses include **`meta: { "is_demo": true }`** when the payload is synthetic.

Set **`REPORTING_DEMO_FALLBACK=false`** in production if you want strict empty results and no synthetic records.

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
{ "id": "<uuid>", "data": { ... }, "is_demo": false }
```

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
