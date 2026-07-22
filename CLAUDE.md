# BirdNet — Claude Code Guide

## Architecture

Three services, orchestrated by Turborepo + docker-compose, plus a shared types package:

| Service | Path | Port | Runtime |
|---|---|---|---|
| React SPA | `client/` | 3000 | Node 22 / Vite + React 19 |
| Express API | `server/express-api/` | 8080 | Node 22 + TypeScript |
| BirdNET analyzer | `server/birdnet-api/` | 8000 (internal only) | Python 3.13 + FastAPI |
| Shared types | `packages/types/` | — | `@birdnet/types`, used by `client` + `server/express-api` |

Request flow: **Browser → Express (8080) → FastAPI (8000, internal-only)**. Express owns the
public API contract, request validation, and SQLite persistence (via Drizzle ORM). FastAPI is a
thin, stateless inference service — it has no persistence, no CORS, and is never reachable from
the browser or a published port; Express is its only caller.

## Running the App

### Docker (full parity)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Express API: http://localhost:8080
- FastAPI is internal-only — not published to the host.

### Local dev (Turborepo TUI, hot reload)

```bash
npm install        # install all workspace deps from repo root
npm start          # launches all three services under Turbo's TUI
```

### Local dev (individual services)

```bash
# Terminal 1 — FastAPI analyzer
server/birdnet-api/run.sh

# Terminal 2 — Express API
npm run dev --workspace server/express-api

# Terminal 3 — React dev server
npm run dev --workspace client
```

Prerequisites: Python 3.13 (pinned — must match Docker and `requirements.txt`'s lockfile),
Node.js 22+, `ffmpeg` on PATH.

## Testing

- `npm run typecheck` / `npm run lint` / `npm run test` / `npm run build` at the repo root run
  across all TS workspaces via Turbo (each depends on `packages/types` building first).
- Python: `cd server/birdnet-api && ./venv/bin/pytest`.
- CI (`.github/workflows/ci.yml`) runs all of the above on every push/PR.
- After changes, no need to run the app in a browser (chromium, screenshots, etc.) — typecheck +
  lint + test + build passing is sufficient confirmation.

## Key Files

- `server/birdnet-api/app.py` — FastAPI app; lifespan-based startup, ASGI readiness middleware, streams uploads to disk in chunks
- `server/birdnet-api/analyzer_service.py` — wraps the birdnetlib `Analyzer` singleton
- `server/birdnet-api/config.py` — runtime knobs (`HOST`, `PORT`, `DEBUG`, `MAX_FILE_SIZE`, `ALLOWED_EXTENSIONS`, `DEFAULT_MIN_CONFIDENCE`)
- `server/birdnet-api/requirements.txt` / `requirements.in` — `pip-compile`-generated lockfile; regenerate with `pip-compile requirements.in -o requirements.txt --upgrade` when bumping deps
- `server/express-api/src/app.ts` — Express app factory (routes, CORS, error middleware)
- `server/express-api/src/routes/index.ts` — all route → controller wiring
- `server/express-api/src/db/schema.ts` — Drizzle schema + relations; `src/db/client.ts` runs migrations on boot
- `server/express-api/drizzle/` — generated migrations; regenerate via `npm run db:generate --workspace server/express-api` after editing `schema.ts`
- `server/express-api/src/services/birdnetClient.ts` — streams uploads to FastAPI, normalizes upstream errors
- `packages/types/src/index.ts` — `Detection` / `AnalyzerResponse` / `Analysis` — the single source of truth for API shapes shared by `client` and `server/express-api`
- `client/src/App.tsx` — route shell (React Router): `/` → `ListPage`, `/map` → `MapPage` (lazy-loaded, since Leaflet is a meaningful bundle addition). Hits `VITE_API_URL` (default `http://localhost:8080`)
- `client/src/pages/ListPage.tsx` — upload/record form + results + analysis history list (the "main" view)
- `client/src/pages/MapPage.tsx` — clustered map (Leaflet + react-leaflet + react-leaflet-cluster, OpenStreetMap tiles) of analyses that have a location; skips analyses with null lat/lon
- `client/src/lib/geolocation.ts` — `requestCurrentPosition()`; wraps the browser Geolocation API, always resolves (never rejects) — `null` means unsupported/denied/timed out, callers treat that as "leave location empty," not an error
- `docker-compose.yml` — multi-service definition; Express waits for FastAPI healthcheck before starting

## Configuration

| Layer | File | Key vars |
|---|---|---|
| FastAPI | `server/birdnet-api/config.py` | `HOST`, `PORT`, `DEBUG`, `MAX_FILE_SIZE`, `DEFAULT_MIN_CONFIDENCE` |
| Express | `server/express-api/.env` | `BIRDNET_API_URL`, `PORT`, `MAX_FILE_SIZE`, `ANALYZE_TIMEOUT_MS`, `CORS_ORIGINS`, `DATABASE_PATH` |
| React | `client/.env.development` | `VITE_API_URL` (baked in at build time — Vite env vars aren't runtime-configurable) |

## API Contract

`POST /analyze` (on Express, which streams the upload to FastAPI and persists the result) returns:

```json
{
  "filename": "...",
  "detections": [
    { "common_name": "...", "scientific_name": "...", "confidence": 0.9, "start_time": 0, "end_time": 3 }
  ],
  "detection_count": 1,
  "analysis_time_seconds": 1.2
}
```

Error responses (both services) use `{ "error": "<code>", "message": "<text>" }`. Frontend expects
`detection_count` and `detections` — keep this shape backwards-compatible; it's defined once in
`packages/types` and must not be redeclared locally.

## Data & Persistence

- SQLite DB: `server/express-api/data/birdnet.db` (git-ignored, bind-mounted in Docker)
- Schema lives in `server/express-api/src/db/schema.ts`; migrations are generated files under `server/express-api/drizzle/`, applied automatically on Express startup

## Troubleshooting

```bash
# Broken Python venv (must be Python 3.13 — run.sh fails loudly otherwise)
rm -rf server/birdnet-api/venv && ./server/birdnet-api/run.sh

# Inconsistent node_modules / stale lockfile hoisting weirdness
rm -rf node_modules client/node_modules server/express-api/node_modules packages/types/node_modules
npm install

# Drizzle migration errors against a pre-existing (non-Drizzle) SQLite file
# Move server/express-api/data/birdnet.db aside — a fresh file will be migrated automatically.
```

## Adding Features

- New FastAPI endpoints: add config flags to `config.py`, keep `analyzer_service` singleton, reuse existing validation pattern (extension check, then streamed size check). FastAPI stays internal-only — no new persistence, no CORS.
- New Express endpoints: add a route in `src/routes/index.ts` → controller → service → repository; validate request input with zod at the controller boundary.
- Schema changes: edit `server/express-api/src/db/schema.ts`, then `npm run db:generate --workspace server/express-api` to produce a migration.
- Frontend changes: maintain `detection_count` / `detections` payload shape (from `@birdnet/types`); `VITE_API_URL` drives all API calls via the axios instance in `src/api/client.ts`.
- Tests: Vitest for both `client` and `server/express-api`, pytest for `server/birdnet-api`. Add a test alongside any new behavior.
