# BirdNET Analyzer

A web application for analyzing bird sounds using the BirdNET AI model. Upload or record audio to detect bird species with confidence scores and time ranges, and browse past analyses.

## References

- [BirdNET-Analyzer](https://github.com/birdnet-team/BirdNET-Analyzer) – upstream analyzer and model definitions.
- [birdnetlib](https://pypi.org/project/birdnetlib/) – Python interface used to drive the analyzer.
- [TensorFlow](https://www.tensorflow.org/) – machine learning runtime leveraged by birdnetlib/BirdNET.

## Architecture

```
Browser  ──▶  Express (TS)  ──▶  FastAPI (Python, internal-only)
             owns:                owns:
             - API contract        - BirdNET inference, nothing else
             - persistence (SQLite via Drizzle)
             - validation
```

Express is the only service with a public API contract. FastAPI is a stateless,
internal-only inference service reached exclusively by Express — it's never
exposed to the browser or a public port.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query
- **Backend**: Express + TypeScript + Drizzle ORM (SQLite)
- **Analyzer**: FastAPI + birdnetlib + TensorFlow (internal-only)
- **Shared types**: `packages/types`, a workspace package used by both `client` and `server/express-api`
- **Tooling**: npm workspaces, Turborepo, Docker, docker-compose

## Quick Start

### Docker (full parity)

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Express API**: http://localhost:8080
- The FastAPI analyzer is internal-only and not published to the host.

### Local dev (fast iteration, hot reload)

Prerequisites: Node.js 22+, Python 3.13, `ffmpeg` on PATH.

```bash
npm install        # install all workspace deps from repo root
npm start          # launches all three services under Turbo's TUI
```

Or run services individually:

```bash
server/birdnet-api/run.sh                   # FastAPI analyzer — :8000
npm run dev --workspace server/express-api  # Express API — :8080
npm run dev --workspace client              # React dev server — :3000
```

## Data & Persistence

- Express stores every analysis and its detections in SQLite via Drizzle ORM (default path `server/express-api/data/birdnet.db`).
- Configure the path via `DATABASE_PATH` in `server/express-api/.env`.
- Migrations live in `server/express-api/drizzle/`. Run `npm run db:generate --workspace server/express-api` after changing `src/db/schema.ts`.
- `data/` is git-ignored; docker-compose bind-mounts it so history survives container rebuilds.

## Testing

```bash
npm run typecheck   # all TS workspaces
npm run lint         # all TS workspaces
npm run test          # all TS workspaces (Vitest)
npm run build          # all TS workspaces

cd server/birdnet-api && ./venv/bin/pytest   # Python service
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push/PR.

## License

This repository is published for personal, research, and educational use only and carries no commercial grant. The BirdNET models remain licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License, so any deployment must stay non-commercial, provide attribution, and preserve the same license for derivative model artifacts.
