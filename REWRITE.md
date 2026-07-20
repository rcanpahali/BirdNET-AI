# BirdNet Rewrite Plan

Status: **implemented and verified on branch `rewrite`** (2026-07-20) — all 6 phases below are done: shared types package, both backend rewrites, client rewrite, docker-compose + CI. Verified via typecheck/lint/test/build across all workspaces, a real `docker-compose up --build` run, and a real headless-browser walkthrough of the live app. Not yet merged to `main`.

## Why

The current app was a first prototype built quickly with an earlier agent. It works, but:
- The client is a single "god component" with no API layer, duplicated types, and duplicated detection-rendering components.
- The Express service is a single 187-line file mixing routing, proxying, and persistence, with a confirmed N+1 query and unbounded upload buffering.
- The FastAPI service has fragile, loosely-pinned dependencies (Python 3.11 in Docker vs. whatever pip resolves locally), a deprecated lifecycle hook, and leaks raw exceptions to clients.
- Nothing has test coverage.

Goal: a clean rebuild of the **same feature set** (upload or record audio → analyze → view detections → browse past analyses), done with a proper architecture, shared types, and tests — not a feature expansion.

## Target architecture

```
Browser  ──▶  Express (TS)  ──▶  FastAPI (Python, internal-only)
             owns:                owns:
             - API contract        - BirdNET inference, nothing else
             - persistence (SQLite)
             - validation
             - business logic
```

Key shift from today: FastAPI stops being a semi-independent service with its own CORS/browser-facing config. It becomes a **pure internal inference function** — stateless, no persistence, not reachable from the browser or a public port. Express is the only service with a public API contract, which matches your primary stack (TS/Node) and removes a whole class of "who needs CORS configured for prod" confusion.

## Service-by-service plan

### 1. `server/birdnet-api` (Python/FastAPI) — thin inference microservice

- Single responsibility: take audio bytes + `lat`/`lon`/`min_conf`, run BirdNET, return detections. No DB, no concept of "analyses" — that's Express's job now.
- Replace the loose `requirements.txt` bounds with a real lockfile (`pip-tools` compile or Poetry) so Docker and local dev resolve the *same* dependency graph — today they can diverge silently (confirmed: this machine resolved Python 3.13 packages against a Dockerfile pinned to 3.11).
- Replace deprecated `@app.on_event("startup")` with the `@asynccontextmanager` lifespan pattern; add a real readiness gate (reject at the ASGI level until the model is loaded, not a per-route `None` check).
- Stream the uploaded body to disk instead of `await file.read()` into one big in-memory `bytes` object.
- Structured JSON error responses; log full exceptions server-side, never return raw exception text to the caller.
- Drop CORS entirely — not reachable from a browser, bind to the internal docker network only.
- Remove dead config (`MODEL_CACHE_DIR`) and the misleading "downloads ~500MB models" docs/health-check comment (the model ships bundled in the `birdnetlib` pip package).
- Tests: pytest for extension/size validation, corrupt-audio handling, and detection-parsing logic.

### 2. `server/express-api` (Node/TS) — the real backend

This is where "reconsider everything" matters most — today it's a flat single-file proxy; it becomes a layered service:

- `routes → controllers → services → repositories` (or whatever convention you prefer — flag if you want something else)
- **Validation**: zod schemas for request bodies/query params, replacing the hand-rolled lat/lon/min_conf parsing
- **Persistence**: keep SQLite (fits a single-file local app fine, no need for Postgres), replace the raw `db.exec(schema.sql)` bootstrapping with **Drizzle ORM + drizzle-kit** — typed queries, real generated migrations, pairs well with `better-sqlite3`'s synchronous API.
- Fix the N+1: one JOIN query (or Drizzle's relational query API) for analysis history instead of 1+N
- Fix buffering: stream the upload through to FastAPI instead of loading it fully into Node memory first
- Add a timeout on the `/analyze` upstream call (today only `/health` has one)
- Centralized error-handling middleware (replaces the duplicated `formatAxiosError`/`extractUpstreamPayload` pattern)
- Configurable CORS via `CORS_ORIGINS` env var, safe default for local dev
- Structured logging (pino or similar) instead of `console.log`
- Tests: Vitest + supertest for services/routes

### 3. `client` (React 19 + Vite + TS)

- Migrate off CRA to Vite, bump React 18 → 19 while build tooling is already being touched
- Styling: migrate CSS Modules → Tailwind CSS (bigger one-time conversion cost, faster iteration and consistent tokens afterward)
- Real API layer: one typed API client module, consumed through a data-fetching hook layer. **TanStack Query** — replaces the `refreshTrigger`-counter pub/sub hack with real caching/loading/error state
- Component cleanup: one `Detection` row component reused by both the live-results panel and the history panel — kills the `DetectionCard` vs `DetectionItem` duplication
- All shapes come from the shared types package — no more locally-redeclared `Detection`/`Analysis` interfaces
- Replace `Recorder.tsx`'s hand-rolled WAV encoder with a small maintained library (e.g. `extendable-media-recorder` + wav encoder plugin, or similar) — verify output still matches what BirdNET's backend accepts
- Tests: Vitest + React Testing Library
- Docker: actually build static assets and serve them (nginx or a tiny static file server) instead of running the dev server as "production"

### 4. Shared types package

New `packages/types` workspace — single source of truth for `Detection`/`AnalyzerResponse`/`Analysis`, imported by `client` and `server/express-api`. The Python service stays plain JSON/dict; Express is the TS-facing type boundary.

## Cross-cutting

- Keep Turborepo + npm workspaces — already works, no reason to change
- One `.env.example` per service, documented in an updated CLAUDE.md/README once the rewrite lands
- CI: add GitHub Actions (lint + typecheck + test) as part of this rewrite, wired in from the start since tests are new
- docker-compose: keep the 3-service shape, but FastAPI no longer needs a published host port in the normal flow (can still expose `/docs` behind a debug profile if useful)

## Proposed execution order

1. `packages/types` skeleton — unblocks both other tracks
2. FastAPI rewrite (smallest surface area, unblocks Express)
3. Express rewrite (layered backend, Drizzle + migrations, streaming proxy)
4. Client rewrite (Vite + React 19 + Tailwind + TanStack Query + component cleanup)
5. docker-compose + CI wiring, once services are individually stable

## Decisions

| Decision | Choice |
|---|---|
| ORM for Express | Drizzle |
| Client styling | Tailwind |
| CI | GitHub Actions (lint/typecheck/test), added now |
| Recorder WAV encoder | Replace with a maintained library |
| React version | 19 |

## Explicitly out of scope (this pass)

- New features (auth, multi-user, export, map view) — same feature set only
- Non-React frontend frameworks
- Postgres/hosted DB migration
