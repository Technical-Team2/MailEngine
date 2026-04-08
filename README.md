# MailEngine — Professional Email Campaign System

> A full-stack campaign engine: manage contacts, build templates, run targeted campaigns, and auto-extract leads with AI — all from a single, sleek dashboard.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Prerequisites](#4-prerequisites)
5. [Quick Start — Docker (Recommended)](#5-quick-start--docker-recommended)
6. [Manual Setup — Frontend](#6-manual-setup--frontend)
7. [Manual Setup — Backend](#7-manual-setup--backend)
8. [Environment Variables](#8-environment-variables)
9. [Database Setup & Migrations](#9-database-setup--migrations)
10. [API Reference](#10-api-reference)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Backend Architecture](#12-backend-architecture)
13. [Email Engine (Async Sending)](#13-email-engine-async-sending)
14. [AI Extractor Module](#14-ai-extractor-module)
15. [Running Tests](#15-running-tests)
16. [Deployment Guide](#16-deployment-guide)
17. [Default Credentials](#17-default-credentials)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Project Overview

MailEngine is a **full-stack, production-grade email campaign management system** built with:
- **React** frontend with a dark, professional dashboard UI
- **FastAPI** backend with JWT authentication
- **PostgreSQL** for persistent storage
- **Celery + Redis** for async email sending (batched, never blocking)
- **AI Contact Extractor** that crawls web sources and scores leads

### Key Features

| Feature | Description |
|---|---|
| Contact Management | Import CSV/XLSX, CRUD, search, filter by sector/type |
| Sector Management | Admin approval workflow for sectors |
| Template Builder | HTML email templates with `{{variable}}` placeholders |
| Campaign Wizard | 4-step wizard: details → template → recipients → send |
| Async Email Engine | Celery tasks, batches of 50, 5s delay, full logging |
| AI Contact Extractor | Crawls websites, extracts emails, confidence scoring, approval queue |
| Dashboard | Charts (area + bar), live campaign stats, quick actions |
| Role-based Auth | Admin + Staff roles, JWT access tokens |

---

## 2. Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Zustand | Lightweight global state |
| TanStack Query | Server state + caching |
| Axios | HTTP client |
| Recharts | Data visualization |
| React Dropzone | CSV/XLSX file uploads |
| React Hot Toast | Notifications |
| Lucide React | Icon library |

### Backend
| Tool | Purpose |
|---|---|
| FastAPI | REST API framework |
| SQLAlchemy 2.0 | ORM |
| Alembic | Database migrations |
| PostgreSQL | Primary database |
| Redis | Message broker + task backend |
| Celery | Async task queue (email sending, extraction) |
| Passlib + bcrypt | Password hashing |
| Python-JOSE | JWT tokens |
| Pandas | CSV/XLSX import |
| SendGrid / SMTP | Email providers |

---

## 3. Project Structure

```
emailsys/
├── frontend/                      # React application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Sidebar.jsx    # Navigation sidebar
│   │   │       └── Header.jsx     # Top header bar
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx      # Auth page
│   │   │   ├── DashboardPage.jsx  # Stats + charts
│   │   │   ├── ContactsPage.jsx   # Contact CRUD + import
│   │   │   ├── TemplatesPage.jsx  # Email template editor
│   │   │   ├── CampaignsPage.jsx  # Campaign wizard + list
│   │   │   ├── SectorsPage.jsx    # Sector approval
│   │   │   └── ExtractorPage.jsx  # AI contact extraction
│   │   ├── store/
│   │   │   └── authStore.js       # Zustand auth state
│   │   ├── utils/
│   │   │   └── api.js             # Axios instance + interceptors
│   │   ├── styles/
│   │   │   └── globals.css        # Full design system
│   │   ├── App.jsx                # Router + layout
│   │   └── index.js               # Entry point
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                       # FastAPI application
│   ├── app/
│   │   ├── api/                   # Route handlers
│   │   │   ├── auth.py            # POST /auth/login, GET /auth/me
│   │   │   ├── contacts.py        # Full CRUD + import
│   │   │   ├── sectors.py         # Sector management + approval
│   │   │   ├── templates.py       # Email template CRUD
│   │   │   ├── campaigns.py       # Campaign CRUD + send trigger
│   │   │   └── extraction.py      # Source management + approval
│   │   ├── models/                # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── contact.py         # Contact + Sector
│   │   │   ├── template.py
│   │   │   ├── campaign.py        # Campaign + Recipient + Log
│   │   │   └── extraction.py      # Source + ExtractedContact
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── tasks/
│   │   │   ├── celery_app.py      # Celery configuration
│   │   │   ├── campaign_tasks.py  # Async email sending
│   │   │   └── extraction_tasks.py # Web crawl + extraction
│   │   ├── utils/
│   │   │   ├── security.py        # JWT + bcrypt
│   │   │   └── email_sender.py    # SMTP + SendGrid adapter
│   │   ├── config.py              # Pydantic settings
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   └── main.py                # App factory + router registration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml             # Full stack orchestration
└── README.md
```

---

## 4. Prerequisites

Make sure you have the following installed:

```bash
# Check versions
node --version        # v18+ required
npm --version         # v9+
python --version      # 3.11+
docker --version      # 24+
docker compose version # 2.x
```

If you don't have Docker:
- [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

If you prefer manual setup without Docker:
- [PostgreSQL 16](https://www.postgresql.org/download/)
- [Redis 7](https://redis.io/docs/getting-started/installation/)

---

## 5. Quick Start — Docker (Recommended)

This launches the **entire stack** (API, Worker, Beat, DB, Redis, Frontend) in one command.

### Step 1: Clone / extract the project

```bash
# If you have git:
git clone <your-repo-url> emailsys
cd emailsys

# Or extract the zip and cd into it:
cd emailsys
```

### Step 2: Set up environment variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and update these values at minimum:

```env
SECRET_KEY=your-strong-random-secret-key
DATABASE_URL=postgresql://mailengine:mailengine123@db:5432/mailengine_db
REDIS_URL=redis://redis:6379/0
```

> **Note:** When using Docker Compose, use `db` and `redis` as hostnames (not `localhost`).

### Step 3: Start everything

```bash
docker compose up --build
```

Wait for all services to be healthy (~60 seconds). You'll see:
```
api_1     | ✅ Default admin created: admin@mailengine.com / admin123
api_1     | INFO:     Application startup complete.
```

### Step 4: Open in browser

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **API Docs** | http://localhost:8000/api/docs |
| **Health Check** | http://localhost:8000/api/health |

Login with: `admin@mailengine.com` / `admin123`

### Stop the stack

```bash
docker compose down           # Stop containers
docker compose down -v        # Stop and remove all data (fresh start)
```

---

## 6. Manual Setup — Frontend

Use this if you want hot-reload React development without Docker.

### Step 1: Install Node dependencies

```bash
cd frontend
npm install
```

This installs all packages from `package.json` including React, Recharts, Zustand, etc.

### Step 2: Configure API URL

Create a `.env` file in the `frontend/` directory:

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### Step 3: Start the dev server

```bash
npm start
```

The app opens at **http://localhost:3000** with hot-reload enabled.

### Step 4: Build for production

```bash
npm run build
```

This creates an optimized static build in `frontend/build/`.

---

## 7. Manual Setup — Backend

Use this for local development without Docker.

### Step 1: Create and activate a virtual environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it:
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### Step 2: Install Python dependencies

```bash
pip install -r requirements.txt
```

Key packages being installed:
- `fastapi` — web framework
- `uvicorn` — ASGI server
- `sqlalchemy` — ORM
- `alembic` — migrations
- `psycopg2-binary` — PostgreSQL driver
- `celery` + `redis` — async task queue
- `python-jose` — JWT
- `passlib[bcrypt]` — password hashing
- `pandas` + `openpyxl` — file import

### Step 3: Create your .env file

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://your_user:your_pass@localhost:5432/mailengine_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=a-very-long-random-string-replace-this
SMTP_USER=your@gmail.com
SMTP_PASS=your-gmail-app-password
```

### Step 4: Set up the PostgreSQL database

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql:
CREATE USER mailengine WITH PASSWORD 'mailengine123';
CREATE DATABASE mailengine_db OWNER mailengine;
GRANT ALL PRIVILEGES ON DATABASE mailengine_db TO mailengine;
\q
```

### Step 5: Run database migrations

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Edit alembic/env.py to import your Base:
# from app.database import Base
# from app.models import *
# target_metadata = Base.metadata

# Generate the first migration
alembic revision --autogenerate -m "initial schema"

# Apply migrations
alembic upgrade head
```

### Step 6: Start the FastAPI server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API is live at **http://localhost:8000**
Interactive docs at **http://localhost:8000/api/docs**

### Step 7: Start the Celery worker (separate terminal)

```bash
# Activate venv first
source venv/bin/activate

celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4
```

### Step 8: Start Celery Beat scheduler (separate terminal)

```bash
source venv/bin/activate

celery -A app.tasks.celery_app beat --loglevel=info
```

Celery Beat handles the daily extraction job schedule.

---

## 8. Environment Variables

Full reference for `backend/.env`:

```env
# ── Application ──────────────────────────────────────────────────
APP_NAME=MailEngine
SECRET_KEY=your-super-secret-key-min-32-chars       # CHANGE THIS
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080                    # 7 days

# ── Database ─────────────────────────────────────────────────────
# Docker:  postgresql://mailengine:mailengine123@db:5432/mailengine_db
# Local:   postgresql://mailengine:mailengine123@localhost:5432/mailengine_db
DATABASE_URL=postgresql://mailengine:mailengine123@db:5432/mailengine_db

# ── Redis ────────────────────────────────────────────────────────
# Docker: redis://redis:6379/0
# Local:  redis://localhost:6379/0
REDIS_URL=redis://redis:6379/0

# ── Email (choose one provider) ──────────────────────────────────
EMAIL_PROVIDER=smtp                                  # "smtp" or "sendgrid"

# SMTP (works with Gmail, Outlook, any SMTP server)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password                          # Use Gmail App Password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=MailEngine

# SendGrid (recommended for production)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx

# ── App ──────────────────────────────────────────────────────────
ENVIRONMENT=development                              # "development" or "production"
FRONTEND_URL=http://localhost:3000

# ── Sending Config ───────────────────────────────────────────────
BATCH_SIZE=50                                        # Emails per batch
BATCH_DELAY_SECONDS=5                                # Seconds between batches
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail".

---

## 9. Database Setup & Migrations

### Understanding the schema

The database follows the clean 3-layer architecture from the plan:

```
Contacts (data layer) → Templates (content layer) → Campaigns (execution layer)
```

Key design decisions:
- **UUID primary keys** throughout for scalability
- **Snapshot pattern** in `campaign_recipients`: contact details are frozen at campaign creation time, so later contact edits don't affect in-progress sends
- **JSONB** for `tags` and `variables` — flexible without schema changes
- **Indexed** on `email`, `sector_id`, `campaign_id` for query performance

### Creating a new migration after model changes

```bash
# After editing any model file:
alembic revision --autogenerate -m "describe your change"
alembic upgrade head

# Rollback one migration:
alembic downgrade -1
```

---

## 10. API Reference

All endpoints are prefixed with `/api/v1`. Full interactive docs at `/api/docs`.

### Auth
```
POST   /api/v1/auth/login          # { email, password } → JWT token
GET    /api/v1/auth/me             # Current user info
```

### Contacts
```
GET    /api/v1/contacts            # List with filters: search, type, sector_id, page
POST   /api/v1/contacts            # Create contact
PUT    /api/v1/contacts/{id}       # Update contact
DELETE /api/v1/contacts/{id}       # Delete contact
POST   /api/v1/contacts/upload     # Upload file → preview rows
POST   /api/v1/contacts/import     # Upload file → save to DB
```

### Sectors
```
GET    /api/v1/sectors             # List all sectors
POST   /api/v1/sectors             # Create (status: pending)
PUT    /api/v1/sectors/{id}/approve  # Admin: approve sector
DELETE /api/v1/sectors/{id}        # Admin: delete sector
```

### Templates
```
GET    /api/v1/templates           # List templates
POST   /api/v1/templates           # Create template (auto-detects {{variables}})
PUT    /api/v1/templates/{id}      # Update template
DELETE /api/v1/templates/{id}      # Delete template
```

### Campaigns
```
GET    /api/v1/campaigns           # List all campaigns
POST   /api/v1/campaigns           # Create campaign + snapshot recipients
GET    /api/v1/campaigns/{id}      # Campaign detail + live stats
POST   /api/v1/campaigns/{id}/send # Queue for async sending
DELETE /api/v1/campaigns/{id}      # Delete (not if sending)
```

### AI Extraction
```
GET    /api/v1/extraction/sources              # List sources
POST   /api/v1/extraction/sources              # Add source
DELETE /api/v1/extraction/sources/{id}         # Remove source
POST   /api/v1/extraction/sources/{id}/run     # Manual trigger
GET    /api/v1/extraction/extracted            # Staging queue (filter by status)
POST   /api/v1/extraction/extracted/{id}/approve  # Approve → move to contacts
POST   /api/v1/extraction/extracted/{id}/reject   # Reject
```

---

## 11. Frontend Architecture

### Design System (globals.css)

All styling uses **CSS custom properties** (variables) for theming:

```css
:root {
  --bg-base: #080c10;        /* Main background */
  --accent: #00e5ff;          /* Cyan accent */
  --accent-2: #ff6b35;        /* Orange accent */
  --font-display: 'Syne';     /* Headings */
  --font-body: 'DM Sans';     /* Body text */
  --font-mono: 'DM Mono';     /* Code, numbers */
}
```

### State Management

| State Type | Tool | Location |
|---|---|---|
| Auth (user, token) | Zustand + persist | `store/authStore.js` |
| Server data | TanStack Query | Per-page query hooks |
| Form state | Local `useState` | Inside components |
| UI state (modals) | Local `useState` | Inside components |

### Routing

Protected routes wrap content in `<ProtectedLayout>` which checks `isAuthenticated` from Zustand. If false → redirect to `/login`.

```jsx
// App.jsx pattern
<Route path="/dashboard" element={
  <ProtectedLayout>
    <DashboardPage />
  </ProtectedLayout>
} />
```

### Key Component Patterns

**Modal pattern** (used everywhere):
```jsx
{showModal && (
  <div className="modal-overlay" onClick={closeOnBackdrop}>
    <div className="modal">
      <div className="modal-header">...</div>
      <div className="modal-body">...</div>
      <div className="modal-footer">...</div>
    </div>
  </div>
)}
```

**Table pattern** with empty state:
```jsx
<div className="table-wrap">
  <table className="data-table">
    <thead>...</thead>
    <tbody>
      {items.length === 0 ? (
        <tr><td colSpan={N}><div className="empty-state">...</div></td></tr>
      ) : items.map(item => <tr key={item.id}>...</tr>)}
    </tbody>
  </table>
</div>
```

---

## 12. Backend Architecture

### FastAPI Application Factory

`main.py` creates the app, registers CORS, mounts all routers under `/api/v1`, and seeds the default admin on startup.

### Dependency Injection

FastAPI's `Depends()` is used consistently:
- `get_db` → database session (auto-closes after request)
- `get_current_user` → parses JWT, fetches user
- `require_admin` → extends `get_current_user`, checks role

### Non-Negotiable Rules (from spec)

1. **No direct email sending from request thread** — `POST /campaigns/{id}/send` only queues the Celery task
2. **No duplicate emails** — unique constraint on `contacts.email` + check before import
3. **No raw HTML injection** — templates are stored and rendered server-side; user input is never directly injected

---

## 13. Email Engine (Async Sending)

### How it works

```
HTTP Request → FastAPI → queue Celery task → return 200 immediately
                                   ↓
                              Redis queue
                                   ↓
                         Celery worker picks up
                                   ↓
               For each batch of 50 recipients:
                 1. Render template (replace {{vars}})
                 2. Call SMTP / SendGrid
                 3. Mark sent or failed in DB
                 4. Log to email_logs
                 5. Sleep 5 seconds
                                   ↓
                      Campaign status → "completed"
```

### Template Rendering

Variables use double-curly-brace syntax: `{{name}}`, `{{organization}}`

The `render_template()` function does a simple string replace:
```python
def render_template(template_html, template_subject, context):
    body = template_html
    for key, value in context.items():
        body = body.replace("{{" + key + "}}", str(value or ""))
    return subject, body
```

### Switching Email Providers

Change `EMAIL_PROVIDER` in `.env`:
- `smtp` — works locally with Gmail, Mailtrap, etc.
- `sendgrid` — for production (requires `SENDGRID_API_KEY`)

---

## 14. AI Extractor Module

### Pipeline

```
Source URL → httpx crawl → extract emails with regex
          → validate (business domain check)
          → confidence scoring (0–100)
          → save to extracted_contacts (staging)
          → Admin reviews in UI
          → Approve → moves to contacts table
          → Reject → marked rejected
```

### Confidence Scoring

```python
def compute_confidence(contact):
    score = 0
    if valid_email(contact["email"]):  score += 40
    if business_domain(contact["email"]): score += 30
    if contact["organization"]:        score += 20
    if contact["phone"]:               score += 10
    return score  # max 100
```

Contacts with score < 60 should be reviewed carefully.

### Daily Automation

Celery Beat runs `run_all_sources()` every 24 hours automatically, which dispatches `run_source_extraction()` for each active source.

---

## 15. Running Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# With coverage
pytest --cov=app --cov-report=html
```

For frontend:
```bash
cd frontend
npm test
```

---

## 16. Deployment Guide

### Production checklist

- [ ] Change `SECRET_KEY` to a strong random value (`openssl rand -hex 32`)
- [ ] Set `ENVIRONMENT=production`
- [ ] Use `SENDGRID_API_KEY` instead of SMTP
- [ ] Set up a proper domain and SSL (use Nginx + Certbot)
- [ ] Use managed PostgreSQL (e.g. Supabase, Neon, RDS)
- [ ] Use managed Redis (e.g. Upstash, Redis Cloud)
- [ ] Set `FRONTEND_URL` to your actual domain

### Render.com (easy)

1. Push the repo to GitHub
2. Create a **PostgreSQL** database on Render
3. Deploy the backend as a **Web Service**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Deploy the Celery worker as a **Background Worker**: `celery -A app.tasks.celery_app worker --loglevel=info`
5. Deploy the frontend as a **Static Site**: build command `npm run build`, publish dir `build`

### Railway.app (alternative)

Click "New Project" → "Deploy from GitHub" → configure environment variables.

---

## 17. Default Credentials

| Email | Password | Role |
|---|---|---|
| admin@mailengine.com | admin123 | Admin |

> **Change these immediately in production!** You can update via the API or directly in the database.

---

## 18. Troubleshooting

### "Cannot connect to PostgreSQL"
```bash
# Check if PostgreSQL is running
docker compose ps db

# View DB logs
docker compose logs db

# If using local Postgres, ensure it's started:
brew services start postgresql  # macOS
sudo service postgresql start   # Linux
```

### "Celery worker not picking up tasks"
```bash
# Check Redis is running
docker compose ps redis

# Restart the worker
docker compose restart worker

# View worker logs
docker compose logs -f worker
```

### "Frontend shows blank page / API errors"
```bash
# Check the API is responding
curl http://localhost:8000/api/health

# Check CORS — ensure FRONTEND_URL matches your frontend origin
# Check the browser console for CORS or 401 errors
```

### "Email not being sent"
1. Verify SMTP credentials in `.env`
2. For Gmail: enable 2FA and use an **App Password** (not your regular password)
3. Check Celery worker logs: `docker compose logs -f worker`
4. Check the `email_logs` table in the database

### "Import fails with column error"
Your CSV/XLSX must have at minimum an `email` column. Recommended columns:
```
name, email, phone, organization, type, sector
```

### Resetting the database
```bash
docker compose down -v          # Remove all volumes
docker compose up --build       # Fresh start
```

---

## Code Attribution Guide

| File | Key concept demonstrated |
|---|---|
| `backend/app/tasks/campaign_tasks.py` | Async batch email sending with Celery |
| `backend/app/api/contacts.py` | File upload + pandas parsing + deduplication |
| `backend/app/utils/security.py` | JWT auth with FastAPI dependencies |
| `backend/app/models/campaign.py` | Snapshot pattern for recipients |
| `frontend/src/pages/CampaignsPage.jsx` | Multi-step wizard UI pattern |
| `frontend/src/store/authStore.js` | Zustand with localStorage persistence |
| `frontend/src/styles/globals.css` | Full CSS design system with variables |
| `docker-compose.yml` | Multi-service orchestration with health checks |

