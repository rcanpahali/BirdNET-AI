# BirdNet — Architectural TODOs

**Status: all items resolved by the 2026-07-20 full rewrite (see `REWRITE.md`, branch `rewrite`).**

## High Priority

- [x] **Fix N+1 query in analysis history**
  Fixed via Drizzle ORM's relational query API — one query instead of 1+N. See `server/express-api/src/repositories/analysisRepository.ts`.

- [x] **Stop buffering uploaded files twice**
  Express now streams the upload to disk in chunks and forwards it to FastAPI via a read stream instead of buffering the whole file in memory (twice). See `server/express-api/src/middleware/upload.ts` and `src/services/birdnetClient.ts`; FastAPI's side in `server/birdnet-api/app.py`.

## Medium Priority

- [x] **Create a shared types package**
  Done — `packages/types` (`@birdnet/types`), imported by both `client` and `server/express-api`.

- [x] **Make CORS configurable via environment variable**
  Express reads `CORS_ORIGINS` from env now. FastAPI's CORS was removed entirely rather than made configurable — it's an internal-only service, never reached by a browser, so it doesn't need CORS at all.

- [x] **Add a timeout to the `/analyze` endpoint**
  Added via `ANALYZE_TIMEOUT_MS` (default 120s) in `server/express-api/src/config.ts`.

- [x] **Migrate from Create React App to Vite**
  Done — `client` is now Vite + React 19 + Tailwind v4 + TanStack Query.

## Low Priority

- [x] **Fix deprecated FastAPI startup event**
  Replaced with the `@asynccontextmanager` lifespan pattern plus an ASGI-level readiness middleware. See `server/birdnet-api/app.py`.

- [x] **Align TypeScript versions across packages**
  All TS workspaces (`client`, `server/express-api`, `packages/types`) are pinned to the same version (6.0.3 — deliberately one minor behind latest, since `typescript-eslint` doesn't yet support 7.x).
