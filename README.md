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

3. Copy `.env.example` to `.env` and set your values.

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
   Open the URL Vite prints (usually `http://localhost:5173`). Set `VITE_API_BASE_URL=http://127.0.0.1:8000` in `frontend/.env` if needed.

6. Run the Celery worker (requires Redis):
   ```bash
   celery -A app.workers.celery_app worker -l info
   ```
   Or: `python -m app.workers`

## License

Proprietary
