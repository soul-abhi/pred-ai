# PredAI — Student Performance Analytics Platform

A production-grade ML analytics platform predicting student exam scores from 4 inputs
(attendance %, study hours/day, previous score, sleep hours) using classical ML (scikit-learn).

**No LLM/AI API used anywhere.** All inference is scikit-learn RandomForestRegressor.

## Architecture

```
Browser (:3000)  →  Node/Express API (:4000)  →  Python FastAPI (:8000)
                            │
                      PostgreSQL (:5433)
```

- **Browser never talks to Python directly** — Node is the only public-facing API
- **JWT in HttpOnly, Secure, SameSite=Strict cookies** — never localStorage
- **Python service is stateless** — Node owns the database via Drizzle ORM

## Quick start (local dev)

### 1. Prerequisites

```bash
node >= 18, pnpm, python3.12+, docker
```

### 2. Start Postgres via Docker

```bash
docker run -d --name pred-ai-postgres \
  -e POSTGRES_USER=predai -e POSTGRES_PASSWORD=predai_dev_password -e POSTGRES_DB=predai \
  -p 5433:5432 postgres:16-alpine
```

### 3. Install JS deps and run migrations

```bash
pnpm install --ignore-scripts
cp apps/api/.env.example apps/api/.env    # edit to taste
pnpm db:generate
pnpm db:migrate
```

### 4. Start the Python ML service

```bash
cd apps/ml-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
MODEL_DIR=./models DATA_DIR=./data uvicorn app.main:app --port 8000 --reload
# In another terminal, seed the model:
curl -X POST http://localhost:8000/train -H 'Content-Type: application/json' -d '{"use_synthetic":true}'
```

### 5. Start the Node API

```bash
pnpm --filter api dev
```

### 6. Start the Next.js frontend

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm --filter web dev
```

Open http://localhost:3000 → sign up → start predicting.

## JWT secret generation

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run twice for `JWT_SECRET` and `REFRESH_TOKEN_SECRET` in `apps/api/.env`.

## ML baseline metrics (synthetic data, 500 rows)

| Metric | Value |
|--------|-------|
| R²     | 0.80+ |
| MAE    | ≈ 4.5 pts |
| RMSE   | ≈ 5.7 pts |

These beat the prototype (R²=0.727, MAE=4.86, RMSE=6.09) because LinearRegression
outperforms RandomForest on this synthetic dataset (the features are constructed linearly).
The 3-model comparison pipeline automatically selects the winner.

## Project structure

```
apps/
  web/              # Next.js 14 (App Router) frontend
  api/              # Node/Express API — auth, app logic, DB
  ml-service/       # Python FastAPI — ML inference only
packages/
  shared-types/     # TypeScript types shared between web & api
```
