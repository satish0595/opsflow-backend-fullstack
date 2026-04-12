# OpsFlow – Backend-Heavy Full-Stack Demo

OpsFlow is a **basic but realistic backend-heavy project** built to help you clearly understand how these pieces work together:

- **Python + Django** for the core backend
- **Django REST Framework** for APIs
- **PostgreSQL** for relational data
- **Redis** for caching and Celery broker/result backend
- **Celery** for async/background jobs
- **React** for a minimal frontend

## Project idea
A small operations dashboard where you can:
- create customers and orders
- update order status
- view aggregated stats
- trigger a **background analytics report generation** job
- poll for job status from React

This keeps the frontend simple and lets you focus on the important backend concepts.

## Architecture

```text
React UI -> Django REST API -> PostgreSQL
                    |                    | -> Redis cache (stats endpoint)
                    |
                    -> Celery worker -> long-running report generation
                                 |
                                 -> PostgreSQL task record updates
```

## Main concepts covered

### 1) Django models + PostgreSQL
- `Customer`
- `Order`
- `ReportTask`

### 2) Django REST Framework
- CRUD APIs for customers and orders
- stats endpoint for dashboard cards
- endpoint to trigger report generation
- endpoint to check async task status

### 3) Celery + Redis
- a report generation job runs in background
- request returns immediately
- worker updates DB record over time
- React polls status until job completes

### 4) Redis caching
- `/api/dashboard/stats/` is cached for 60 seconds
- cache is cleared when orders change

### 5) React frontend
- list/create orders
- view dashboard stats
- trigger a report job
- view task progress and generated summary

## Quick start

### Option A: Docker Compose (recommended)
1. Copy environment file:
   ```bash
   cp .env.example .env
   ```
2. Start everything:
   ```bash
   docker compose up --build
   ```
3. Open:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000/api/`
   - Admin: `http://localhost:8000/admin/`

### Demo credentials
- username: `admin`
- password: `admin123`

The backend startup command also seeds sample data automatically.

## Useful API endpoints
- `GET /api/customers/`
- `POST /api/customers/`
- `GET /api/orders/`
- `POST /api/orders/`
- `PATCH /api/orders/<id>/`
- `GET /api/dashboard/stats/`
- `POST /api/reports/generate/`
- `GET /api/reports/tasks/`
- `GET /api/reports/tasks/<id>/`

## How background flow works
1. React calls `POST /api/reports/generate/`
2. Django creates a `ReportTask` row with status `PENDING`
3. Django queues a Celery job
4. Celery worker simulates heavy processing
5. Worker updates progress and final summary in PostgreSQL
6. React polls task endpoint and displays result

## Suggested learning path
1. Read `orders/models.py`
2. Read `orders/serializers.py`
3. Read `orders/views.py`
4. Read `orders/tasks.py`
5. Run app and trigger report job
6. Stop celery worker and observe what breaks
7. Change cache timeout and observe stats endpoint behavior

## Local non-Docker note
You can also run backend/frontend separately if you already have PostgreSQL/Redis installed, but Docker Compose is the fastest way to make the full project work.
