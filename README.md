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

4. Run the API:
   ```bash
   uvicorn app.main:app --reload
   ```

5. Run the Celery worker (requires Redis):
   ```bash
   celery -A app.workers.celery_app worker -l info
   ```
   Or: `python -m app.workers`

## License

Proprietary
