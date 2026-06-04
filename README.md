# Postman Clone

A full-stack API client built with React, FastAPI, and PostgreSQL. The project lets users organize requests into workspaces and collections, manage environments and variables, send authenticated proxied API calls, and generate API documentation with AI-assisted flows.

## Features

- JWT-based authentication with user-scoped workspaces
- Collection and request management for API testing workflows
- Environment management with activatable variable sets
- Authenticated `/proxy` endpoint for forwarding API requests from the backend
- AI-assisted document generation for collections
- PDF export for generated documentation
- Local benchmark suite for latency, concurrency, worker scaling, and payload scaling

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Zustand, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn, httpx
- Data: PostgreSQL, Redis
- Docs/AI: Markdown, xhtml2pdf, Grok-backed document generation

## Project Structure

```text
client/      React frontend
server/      FastAPI backend
benchmarks/  Mock upstream service, benchmark scripts, and captured results
```

## Local Setup

### 1. Start infrastructure

PostgreSQL is configured on Neon DB, which is a fully managed, serverless open-source PostgreSQL database

### 2. Configure backend environment

Create `server/.env` with values like:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost/postman_clone
JWT_SECRET=replace-this-with-a-secure-secret
GROK_API_KEY=your-grok-key
GROK_MODEL_NAME=your-grok-model
```

Note: the current backend settings require the AI-related env vars even if you are not using doc generation yet.

### 3. Run the backend

From [server](C:/Aayush/postman-clone/server):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 4. Run the frontend

From [client](C:/Aayush/postman-clone/client):

```powershell
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and uses `VITE_API_URL` if you want to point it at a different backend.

## Core Backend Flows

- `POST /auth/register`, `POST /auth/login`: create an account and obtain a JWT
- `GET/POST/PUT/DELETE /workspaces`: manage user workspaces
- `GET/POST/PUT/DELETE /collections`: organize collections and nested requests
- `GET/POST/PUT/DELETE /environments`: manage environments and variables
- `POST /proxy`: forward API requests through the backend
- `POST /documents/generate-docs/{collection_id}`: generate collection docs
- `POST /documents/{document_id}/export`: export docs as PDF

## Benchmarks

This project includes a local benchmark harness in [benchmarks](C:/Aayush/postman-clone/benchmarks) with:

- a mock upstream service for deterministic latency and payload tests
- a direct-vs-proxy latency benchmark
- a concurrent request benchmark
- documented benchmark results in [benchmarks/results.md](C:/Aayush/postman-clone/benchmarks/results.md:1)

### Headline Results

- Reduced average proxy overhead from `339.05 ms` to `2.05 ms`
- Reduced p95 proxy overhead from `408.98 ms` to `4.10 ms`
- Improved `100`-concurrency throughput from `62.77 RPS` on `1` worker to `113.24 RPS` on `2` workers
- Sustained `0%` failures up to `125` concurrent authenticated proxied requests
- At `100` concurrency, payload scaling measured:
  - `64 KB`: `234.08 RPS`, `387.30 ms` p95
  - `256 KB`: `152.95 RPS`, `613.90 ms` p95
  - `1024 KB`: `81.06 RPS`, `1152.42 ms` p95

### Run the Benchmark Suite

From the repo root:

```powershell
python -m venv .venv-bench
.\.venv-bench\Scripts\Activate.ps1
pip install -r benchmarks\mock_upstream\requirements.txt
pip install -r benchmarks\requirements.txt
```

Start the mock upstream:

```powershell
Set-Location benchmarks\mock_upstream
.\run.ps1
```

Then run one of the benchmark scripts from the repo root:

```powershell
python benchmarks\proxy_benchmark.py --email bench@example.com --password Pass@123456 --iterations 50 --path /delay/200
python benchmarks\concurrent_proxy_benchmark.py --email bench@example.com --password Pass@123456 --path /delay/200 --concurrency-levels 25,50,100 --requests-per-level 100
```

## Benchmark Story 

The project does more than render a Postman-like UI. It includes measurable backend performance work:

- identifying high proxy overhead caused by per-request HTTP client creation
- fixing it with a shared pooled `httpx.AsyncClient`
- validating throughput, latency, and failure behavior under concurrent load
- measuring how large response bodies affect user-perceived performance


# Collections Page

## variable resolution
![alt text](<Screenshot 2026-06-04 152849.png>)

## method selector
![alt text](<Screenshot 2026-06-04 152913.png>)

## workspace selector
![alt text](<Screenshot 2026-06-04 152930.png>) 

## environment selector
![alt text](<Screenshot 2026-06-04 152922.png>)

## header tab
![alt text](<Screenshot 2026-06-04 154027.png>) 

## body tab
![alt text](<Screenshot 2026-06-04 154004.png>) 

## authorization type selector
![alt text](<Screenshot 2026-06-04 153935.png>) 

## authorization tab
![alt text](<Screenshot 2026-06-04 153929.png>)

# Environment Page
![alt text](<Screenshot 2026-06-04 153012.png>) 

# Document Page
![alt text](<Screenshot 2026-06-04 152951.png>)


