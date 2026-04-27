# Graphene Trace

Graphene Trace is a full-stack web application for pressure monitoring, clinician workflows, alerts, and feedback management.

## Tech Stack

- Backend: Django + Django REST Framework + JWT auth
- Frontend: React + TypeScript + Vite
- Database: PostgreSQL

## Project Structure

- backend: Django API and business logic
- frontend: React web app

## Prerequisites

Install these first:

- Python 3.11+ (or a compatible 3.x version)
- Node.js 18+
- npm 9+
- PostgreSQL 14+

## 1) Backend Setup

From project root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Database setup

This project is configured for PostgreSQL in backend/graphene_trace/settings.py.

Create the database and user in PostgreSQL:

```sql
CREATE DATABASE graphene_trace;
CREATE USER graphene_user WITH PASSWORD 'Password123';
GRANT ALL PRIVILEGES ON DATABASE graphene_trace TO graphene_user;
```

If your local database credentials are different, update backend/graphene_trace/settings.py accordingly.

### Run migrations

```bash
python manage.py migrate
```

### Optional seed/admin helpers

If you want sample data or admin helpers, run project scripts if needed:

```bash
python create_admin.py
python run_seed.py
```

### Start backend server

```bash
python manage.py runserver
```

Backend runs at:

- http://127.0.0.1:8000

Health endpoint:

- http://127.0.0.1:8000/api/health/

## 2) Frontend Setup

Open a new terminal from project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

- http://localhost:5173

## 3) Run the Full App

1. Start backend first (port 8000)
2. Start frontend second (port 5173)
3. Open http://localhost:5173 in your browser

## Common Commands

### Backend

```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

## Troubleshooting

- Port already in use:
  - Change the running port or stop the process using it.
- CORS issues:
  - Confirm frontend URL is allowed in backend/graphene_trace/settings.py.
- Database connection errors:
  - Verify PostgreSQL is running and credentials in settings.py are correct.
- Migration errors:
  - Activate backend virtual environment and rerun migrations.

## Notes

- Current backend settings are development-oriented.
- Do not use current default secrets and debug settings in production.
