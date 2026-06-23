# PredAI — Student Performance Analytics Platform

> A full-stack ML platform that predicts student exam scores from 4 inputs using classical machine learning, with a modern web dashboard for management and analytics.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [How It Was Built](#4-how-it-was-built)
5. [Features](#5-features)
6. [How It Works (Data Flow)](#6-how-it-works-data-flow)
7. [Project Structure](#7-project-structure)
8. [How to Run the Project](#8-how-to-run-the-project)
9. [API Reference](#9-api-reference)
10. [Environment Variables](#10-environment-variables)

---

## 1. Project Overview

**PredAI** predicts student exam scores based on four input parameters:
- Attendance percentage
- Study hours per day
- Previous exam score
- Sleep hours per night

The platform uses classical ML (scikit-learn & XGBoost) to train models, provides a web interface for making predictions, uploading custom datasets, tracking analytics, and generating reports.

This is a **rebuild** from an earlier Streamlit prototype — moved to a production-grade 3-service architecture with proper authentication, database persistence, and a modern UI.

---

## 2. Architecture

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Browser    │       │  Node/Express │       │   Python     │
│  Next.js 16  │──────▶│     API      │──────▶│   FastAPI    │
│  (port 3000) │       │  (port 4000) │       │ (port 8000)  │
└──────────────┘       └──────┬───────┘       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ PostgreSQL   │
                       │  (port 5433) │
                       └──────────────┘
```

**Key design decisions:**

- **Browser never talks to Python directly** — only the Node API communicates with the ML service. This keeps the ML service isolated and stateless.
- **JWT in HttpOnly cookies** (never localStorage) — prevents XSS token theft. Cookies are automatically sent with every request.
- **Python service is stateless** — it loads a model from disk at startup. Node owns the database via Drizzle ORM.
- **Model loaded once** at startup in `model_registry.py`, not per-request. Predictions run in a background thread to avoid blocking the event loop.

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16.2.9 (App Router) + React 19 + TypeScript | Web UI |
| **Styling** | Tailwind CSS v4 + Custom CSS design tokens | Dark monochrome theme |
| **Charts** | Recharts | Data visualization |
| **Forms** | react-hook-form + zod | Form validation |
| **API** | Node.js + Express + TypeScript | Backend API |
| **ORM** | Drizzle ORM | Database access |
| **Database** | PostgreSQL 16 | Data persistence |
| **ML** | Python + FastAPI + scikit-learn + XGBoost | ML inference & training |
| **Auth** | bcryptjs + jsonwebtoken | Authentication |
| **Package Manager** | pnpm (workspaces) | Monorepo management |
| **Turborepo** | Turbo | Build orchestration |

---

## 4. How It Was Built

### Phase 1: ML Prototype (Streamlit)
Originally built as a quick Streamlit app to test the ML pipeline. Used scikit-learn with synthetic data to predict exam scores.

### Phase 2: Architecture Design
The Streamlit prototype was rebuilt as a **monorepo** with three services:
- **Frontend** (Next.js) — user interface
- **API** (Node/Express) — business logic & auth
- **ML Service** (FastAPI) — model training & inference

The decision to keep three separate services allows each to scale independently and use the best tool for each job.

### Phase 3: Implementation Order
1. **Database schema** — Designed 5 tables (users, refresh_tokens, datasets, model_runs, predictions) with Drizzle ORM
2. **ML service** — Built FastAPI with 3-model comparison pipeline (LinearRegression, RandomForest, XGBoost)
3. **API layer** — Express server with auth, rate limiting, validation, and ML client
4. **Frontend** — Next.js with App Router, dashboard layout, all pages
5. **Docker & dev scripts** — For easy local development and production deployment

### Phase 4: Design System
A monochrome "pixel terminal" aesthetic was chosen:
- Canvas `#070B13`, Surface `#0D1421`
- Grade colors are a brightness ladder (A=whitest, F=darkest)
- Square corners everywhere, uppercase micro-labels, pixel font for data
- Animations are subtle — fade-in, slide-up, pulse

---

## 5. Features

### Authentication
- User signup with password validation (8+ chars, must contain number)
- Login with bcrypt password hashing (12 rounds)
- JWT access tokens (15min) + refresh tokens (7 days) in HttpOnly cookies
- Auto-refresh on token expiration (handled by the frontend API client)
- Rate limiting on auth endpoints (5 requests/minute)
- Password change with current password verification

### Prediction
- Four input sliders with validation (attendance %, study hours, previous score, sleep hours)
- Debounced slider prediction (350ms) or manual "Run prediction" button
- Animated SVG gauge showing predicted score and grade
- All predictions stored in database with user attribution

### Model Training
- Three ML candidates compared: LinearRegression, RandomForest (200 estimators), XGBoost (200 estimators)
- 5-fold cross-validation to select the best model
- Training on synthetic data (500 rows) or on user-uploaded CSV
- Metrics: R², MAE, RMSE, CV R² mean ± std
- Model versioning — all training runs saved, any can be promoted to active
- Feature importance extraction (coefficients or feature_importances_)

### Dataset Upload
- Drag-and-drop CSV upload (max 10MB)
- File validation (.csv only)
- Preview showing first 5 rows with column headers
- Links directly to Train page after upload

### Analytics Dashboard
- **Overview**: System health, active model metrics (R², MAE, RMSE), prediction count, 30-day activity chart, grade distribution
- **Analytics**: Feature importance chart, grade distribution bar chart, R² over training runs
- **Reports**: Paginated prediction history with filtering (by grade), sorting, CSV export
- **Settings**: Account info, password change, logout

### UI/UX
- Premium dark monochrome design system
- Animated login page with canvas-based circles and stick figures
- Animated signup page with live prediction stream
- Custom 404 page with running stick figures
- Skeleton loading states, empty states, error states
- Responsive layout with sidebar navigation
- Reduced motion support

---

## 6. How It Works (Data Flow)

### Authentication Flow
```
User fills login form
  → Browser sends POST /api/auth/login
  → Node validates credentials with bcrypt
  → Server sets HttpOnly cookies (access_token + refresh_token)
  → Browser stores cookies automatically
  → Subsequent requests include cookies
  → Node middleware verifies JWT on protected routes
```

### Prediction Flow
```
User adjusts 4 sliders
  → Browser calls POST /api/predict (with JWT cookie)
  → Node validates input with Zod
  → Node forwards to Python POST /predict
  → Python scales features with StandardScaler
  → Runs active model (e.g. LinearRegression)
  → Returns predicted score
  → Node maps score to letter grade (A: ≥90, B: ≥75, C: ≥60, D: ≥50, F: <50)
  → Stores prediction record in PostgreSQL
  → Returns result to browser
```

### Training Flow
```
User clicks "Train"
  → Browser calls POST /api/train
  → Node forwards to Python POST /train
  → Python generates synthetic data OR loads uploaded CSV
  → Trains 3 candidate models (LinearRegression, RandomForest, XGBoost)
  → 5-fold cross-validation for each model
  → Selects best model by highest test R²
  → Saves model artifact (.joblib) to disk
  → Returns all metrics
  → Node stores model_runs record with all metrics
  → Deactivates all previous models, activates new one
```

### Upload Flow
```
User drops CSV file
  → Browser sends FormData via POST /api/datasets/upload
  → Node saves file to uploads/ directory (multer)
  → Reads first 5 rows for preview
  → Stores dataset metadata in PostgreSQL
  → Returns preview to browser
  → User navigates to Train page to train on this dataset
```

### Grade Mapping
```
Score ≥ 90  → Grade A
Score ≥ 75  → Grade B
Score ≥ 60  → Grade C
Score ≥ 50  → Grade D
Score < 50  → Grade F
```

### Synthetic Data Generation
When no dataset is provided, the ML service generates 500 rows of synthetic data:

```
final_score = 0.4 × attendance + 0.3 × (study_hours × 10) + 0.2 × previous_score + 0.1 × (sleep_hours × 5) + random_noise
```

The noise is normally distributed with mean 0 and std 5. Results are clipped to 0-100. This preserves an R² baseline of ~0.80.

---

## 7. Project Structure

```
media/workdown/pred-ai/
├── apps/
│   ├── api/                          # Node/Express API (:4000)
│   │   ├── src/
│   │   │   ├── config/env.ts         # Environment variable loader
│   │   │   ├── db/
│   │   │   │   ├── client.ts         # PostgreSQL + Drizzle connection
│   │   │   │   ├── schema.ts         # 5 table definitions
│   │   │   │   └── migrations/       # SQL migration files
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts # JWT verification
│   │   │   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   │   │   └── errorHandler.ts   # Global error handler
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts    # 6 auth endpoints
│   │   │   │   ├── predict.routes.ts # Prediction endpoint
│   │   │   │   ├── train.routes.ts   # Training endpoints
│   │   │   │   ├── dataset.routes.ts # Upload/list datasets
│   │   │   │   └── reports.routes.ts # Reports & export
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts   # Password hash, JWT, refresh
│   │   │   │   └── mlClient.service.ts # HTTP client for ML service
│   │   │   └── server.ts            # Express app entry point
│   │   ├── drizzle.config.ts
│   │   ├── .env
│   │   └── package.json
│   │
│   ├── ml-service/                   # Python FastAPI ML service (:8000)
│   │   ├── app/
│   │   │   ├── main.py              # FastAPI app with lifespan
│   │   │   ├── core/
│   │   │   │   ├── config.py        # MODEL_DIR, DATA_DIR
│   │   │   │   ├── model_registry.py # Singleton ModelRegistry
│   │   │   │   └── preprocess.py    # Feature scaling + grade mapping
│   │   │   ├── ml/
│   │   │   │   ├── generate_synthetic.py # 500-row synthetic data
│   │   │   │   └── train_pipeline.py     # 3-model CV training
│   │   │   ├── routers/
│   │   │   │   ├── health.py        # GET /health
│   │   │   │   ├── predict.py       # POST /predict
│   │   │   │   └── train.py         # POST /train, GET /feature-importance
│   │   │   └── schemas/
│   │   │       └── predict_schema.py # Pydantic models
│   │   ├── models/                   # Saved .joblib artifacts
│   │   ├── data/                     # Uploaded/training data
│   │   └── requirements.txt
│   │
│   └── web/                          # Next.js Frontend (:3000)
│       ├── app/
│       │   ├── layout.tsx           # Root layout
│       │   ├── page.tsx             # Root → redirect to /overview
│       │   ├── globals.css          # Design system + Tailwind v4
│       │   ├── not-found.tsx        # 404 page
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx   # Login with canvas animation
│       │   │   └── signup/page.tsx  # Signup with prediction stream
│       │   └── (dashboard)/
│       │       ├── layout.tsx       # Dashboard layout (sidebar + topbar)
│       │       ├── overview/page.tsx # Dashboard home
│       │       ├── predict/page.tsx # Prediction interface
│       │       ├── train/page.tsx   # Model training UI
│       │       ├── upload/page.tsx  # CSV upload
│       │       ├── analytics/page.tsx # Charts & insights
│       │       ├── reports/page.tsx # Prediction history
│       │       └── settings/page.tsx # Account settings
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Sidebar.tsx     # Navigation sidebar
│       │   │   ├── Topbar.tsx      # Header bar
│       │   │   ├── page-not-found.tsx # 404 animations
│       │   │   └── LivePredictionStream.tsx # Animated prediction cards
│       │   └── dashboard/
│       │       ├── MetricCard.tsx
│       │       ├── StatusChip.tsx
│       │       ├── HeroChart.tsx
│       │       ├── AIInsightsPanel.tsx
│       │       ├── RegressionChart.tsx
│       │       ├── PerformanceChart.tsx
│       │       ├── GradeDonut.tsx
│       │       └── PredictionsTable.tsx
│       └── lib/
│           ├── api-client.ts       # HTTP client with auto-refresh
│           └── auth-context.tsx    # Auth state management
│
├── packages/
│   └── shared-types/
│       └── index.ts                # Shared TypeScript interfaces
│
├── docker-compose.yml              # Production Docker setup
├── dev-start.sh                    # Local development launcher
├── pnpm-workspace.yaml            # pnpm workspace config
├── turbo.json                      # Turborepo pipeline
└── package.json                    # Root scripts
```

---

## 8. How to Run the Project

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8 (`npm install -g pnpm@latest`)
- **Python** >= 3.10
- **Docker** (for PostgreSQL)
- **psql** (PostgreSQL client, optional but used by dev-start.sh)

### Quick Start (One Command)

```bash
./dev-start.sh
```

This single script handles **everything** — dependency checks, PostgreSQL, migrations, and all 3 services:

1. **PostgreSQL** — starts in Docker on port 5433 (or connects to existing)
2. **DB Migrations** — runs Drizzle ORM migrations automatically
3. **ML Service** — creates Python virtualenv (if missing), installs deps, starts FastAPI on :8000
4. **Model Seeding** — auto-uploads/activates model if none loaded
5. **Node API** — starts Express on :4000
6. **Web Frontend** — starts Next.js 16 on :3000

Each step waits for the previous one to be healthy before proceeding, with clear colored output and timeout handling. If Docker is not available, it falls back gracefully (assumes PostgreSQL is already running).

Press **Ctrl+C** to stop all services.

### Manual Start (Terminal by Terminal)

If you prefer to run each service in its own terminal:

**Terminal 1 — PostgreSQL:**
```bash
docker run -d --name pred-ai-postgres \
  -e POSTGRES_USER=predai \
  -e POSTGRES_PASSWORD=predai_dev_password \
  -e POSTGRES_DB=predai \
  -p 5433:5432 \
  postgres:16-alpine

# Wait for it to be ready (check every second)
until docker exec pred-ai-postgres pg_isready -U predai -d predai &>/dev/null; do sleep 1; done
```

> **No Docker?** Make sure PostgreSQL is running on localhost:5433 with user=predai, password=predai_dev_password, database=predai.

**Terminal 2 — DB Migrations:**
```bash
cd apps/api
npx drizzle-kit migrate
```

**Terminal 3 — ML Service:**
```bash
cd apps/ml-service

# Create virtualenv (first time only)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run the service
MODEL_DIR=./models DATA_DIR=./data .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Seed the model** (if training hasn't happened yet — wait for ML service to be ready first):
```bash
curl -X POST http://localhost:8000/train \
  -H 'Content-Type: application/json' \
  -d '{"use_synthetic":true}'
```

**Terminal 4 — Node API:**
```bash
cd apps/api
pnpm install     # if dependencies haven't been installed yet
pnpm dev
```

**Terminal 5 — Next.js Frontend:**
```bash
cd apps/web
pnpm install     # if dependencies haven't been installed yet  
pnpm dev
```

> **Note:** The first request to the Next.js frontend will be slow (~15s) while it compiles pages. Subsequent requests are instant.

### Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| ML Service | http://localhost:8000 |
| API Health | http://localhost:4000/api/health |

### Production (Docker Compose)

```bash
# Set required secrets
export JWT_SECRET=<your-32-byte-hex>
export REFRESH_TOKEN_SECRET=<your-different-32-byte-hex>

# Start all services
docker compose up --build
```

---

## 9. API Reference

### Node/Express API (port 4000)

#### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | System health (DB + ML) |

#### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | Rate-limited | Create account |
| POST | `/api/auth/login` | Rate-limited | Sign in |
| POST | `/api/auth/refresh` | No | Refresh tokens |
| POST | `/api/auth/logout` | No | Sign out |
| GET | `/api/auth/me` | Required | Get profile |
| POST | `/api/auth/change-password` | Required | Change password |

#### Prediction
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/predict` | Required | Run prediction |

#### Training
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/train` | Required | Train model |
| POST | `/api/train/promote` | Required | Activate model |
| GET | `/api/train/runs` | Required | List model runs |
| GET | `/api/train/feature-importance` | Required | Feature importance |

#### Datasets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/datasets/upload` | Required | Upload CSV (max 10MB) |
| GET | `/api/datasets` | Required | List datasets |

#### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports` | Required | Paginated predictions |
| GET | `/api/reports/export` | Required | CSV export |
| GET | `/api/reports/summary` | Required | Summary stats |

### Python ML Service (port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health + model status |
| POST | `/predict` | Run inference |
| POST | `/train` | Train model |
| GET | `/feature-importance` | Feature importance |

---

## 10. Environment Variables

### API (`apps/api/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `JWT_SECRET` | (required) | Secret for signing access tokens |
| `REFRESH_TOKEN_SECRET` | (required) | Secret for refresh tokens |
| `ACCESS_TOKEN_EXPIRY` | `15m` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRY_DAYS` | `7` | Refresh token lifetime |
| `ML_SERVICE_URL` | `http://localhost:8000` | ML service URL |
| `WEB_ORIGIN` | `http://localhost:3000` | CORS origin |
| `PORT` | `4000` | API port |
| `NODE_ENV` | `development` | Environment mode |

### ML Service (`apps/ml-service/.env.example`)

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_DIR` | `./models` | Where .joblib artifacts are stored |
| `DATA_DIR` | `./data` | Training data directory |

### Web (`apps/web/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API base URL for client-side requests |

---

## Database Schema

**5 tables** managed by Drizzle ORM with PostgreSQL:

- **users** — id, email, password_hash, name, role (user/admin), created_at, updated_at
- **refresh_tokens** — id, user_id (FK), token_hash, expires_at, revoked, created_at
- **datasets** — id, user_id (FK), filename, row_count, column_count, storage_path, uploaded_at
- **model_runs** — id, user_id (FK), dataset_id (FK), mae, rmse, r2, cv_r2_mean, cv_r2_std, n_train, n_test, feature_importance (jsonb), model_version, is_active, trained_at
- **predictions** — id, user_id (FK), model_run_id (FK), 4 input fields, predicted_score, grade (A/B/C/D/F), created_at

---

## ML Pipeline Details

### Training
1. 3 candidate models trained with 5-fold cross-validation:
   - **LinearRegression** — probabilistic baseline
   - **RandomForestRegressor** — 200 trees, max_depth=8
   - **XGBRegressor** — 200 estimators, max_depth=6, lr=0.05
2. Winner selected by highest test R²
3. Full model + StandardScaler saved as `.joblib` artifact

### Inference
1. Input features scaled with fitted StandardScaler
2. Model runs prediction
3. Score mapped to letter grade
4. Result returned synchronously (for now; runs in thread to free event loop)

### Synthetic Data
When training without a dataset, 500 rows are generated with:
- Feature engineering with random uniform distributions
- Target constructed from a weighted linear formula + Gaussian noise
- R² baseline of ~0.80 (beats the prototype's 0.727)
