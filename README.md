# Financial Data Reconciliation & Reporting System

Production-grade backend for financial data reconciliation and reporting.

## Tech Stack

- Python 3.11
- FastAPI
- SQLAlchemy 2.0
- Pydantic v2
- Celery (background workers)

## Project Structure

```
app/
├── api/           # API routes and dependencies
├── core/          # Configuration and app-wide concerns
├── database/      # Database connection and session management
├── models/        # SQLAlchemy ORM models
├── schemas/       # Pydantic schemas
├── services/      # Business logic
└── workers/       # Celery tasks
```

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Choose how you want to run Postgres/Redis:

   - **Option A: Local Postgres (recommended for quick local dev)**
   - **Option B: Docker Compose (production-like local deployment)**

   Then copy `.env.example` to `.env` and set your values.

4. Run the API (JSON backend only — there is no HTML at `http://127.0.0.1:8000/` besides the root JSON message):
   ```bash
   uvicorn app.main:app --reload
   ```
   - API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Health: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

5. Run the **frontend** (dashboard UI) in another terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   If you see `'vite' is not recognized`, run `npm install` again from the `frontend` folder (dependencies were not installed). Scripts use `npx vite` so the dev server resolves Vite reliably on Windows.
   Open the URL Vite prints (often `http://localhost:5173` or another port if busy). By default, Vite **proxies** `/api` → `http://127.0.0.1:8000`, so you do **not** need `frontend/.env` for login in dev as long as the API is on 8000. To call the API directly instead, set `VITE_API_BASE_URL=http://127.0.0.1:8000` in `frontend/.env`.

6. Run the Celery worker (requires Redis):
   ```bash
   celery -A app.workers.celery_app worker -l info
   ```
   Or: `python -m app.workers`

## Reporting list APIs

`GET /api/v1/reporting/reports` and `GET /api/v1/reporting/reconciliations` (and aliases `GET /api/v1/reports`, `GET /api/v1/reconciliations`) return:

```json
{ "items": [], "total": 0, "meta": {} }
```

When the database has **no rows** and `REPORTING_DEMO_FALLBACK=true` (default in `.env.example`), responses include deterministic demo `items` and `meta: { "is_demo": true }`. Detail endpoints resolve the same demo IDs. Set `REPORTING_DEMO_FALLBACK=false` in production if you prefer strict empty results.

See [docs/DEVELOPER_WALKTHROUGH.md](docs/DEVELOPER_WALKTHROUGH.md) for run instructions and service boundaries.

## Creating a login user (no self-signup)

This system uses the existing `/api/v1/auth/login` flow and does not expose a public sign-up UI.

After your database is reachable and migrations are applied:

```bash
alembic upgrade head
python scripts/create_user.py --email admin@company.com --password "ChangeMe123!" --role admin
```

## Option A: Local Postgres (current recommendation)

1. Install PostgreSQL and ensure it’s running on `localhost:5432`.

2. Create a database + user (example):

```sql
CREATE USER app WITH PASSWORD 'change-me';
CREATE DATABASE financial_reconciliation OWNER app;
GRANT ALL PRIVILEGES ON DATABASE financial_reconciliation TO app;
```

3. Update `.env` to match your local DB user/password:

```bash
DATABASE_URL=postgresql+asyncpg://app:change-me@localhost:5432/financial_reconciliation
JWT_SECRET_KEY=your-secret-key-min-32-chars
```

4. Run migrations + create your first user:

```bash
alembic upgrade head
python scripts/create_user.py --email admin@company.com --password "ChangeMe123!" --role admin
```

5. Start API + frontend and sign in using that email/password.

## Option B: Docker Compose (production-like local)

1. Provide required environment variables (PowerShell example):

```powershell
$env:POSTGRES_PASSWORD="change-me"
$env:JWT_SECRET_KEY="your-secret-key-min-32-chars"
docker compose up -d --build
```

2. Create a user inside the API container:

```bash
docker compose exec api python scripts/create_user.py --email admin@company.com --password "ChangeMe123!" --role admin
```

3. Open the frontend at `http://localhost` (or `http://localhost:$env:FRONTEND_PORT` if you set it).

## License

Proprietary
