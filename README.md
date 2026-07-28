# BirdNET Analyzer

A web application for analyzing bird sounds using the BirdNET AI model. Upload or record audio to detect bird species with confidence scores and time ranges, and browse past analyses. In the product itself, the app is branded **Singwarte**.

## About the Name

> **Singwarte** _noun, feminine (die Singwarte) · genitive -, plural -n_
> _Ornithology_: the elevated perch — a branch, wire, or treetop — from which a bird sings to advertise its territory and attract a mate; a song post.

Every recording in the app captures a bird announcing itself from its Singwarte, and each one is GPS-tagged to the spot where it was made — in effect, a map of the song posts the recorded birds are singing from. It's also a deliberate step away from naming the product after the underlying ML model: "Singwarte" isn't just "BirdNET" restated as a brand.

"Singwarte" is the product name across every deployment. The city and organization name shown next to it in the top nav (`VITE_CITY_NAME`, `VITE_ORG_NAME` — see [Configuration](#configuration)) identify the specific instance, so other towns can run their own copy of the same free tool under their own local identity without forking the brand itself.

## References

- [BirdNET-Analyzer](https://github.com/birdnet-team/BirdNET-Analyzer) – upstream analyzer and model definitions.
- [birdnetlib](https://pypi.org/project/birdnetlib/) – Python interface used to drive the analyzer.
- [TensorFlow](https://www.tensorflow.org/) – machine learning runtime leveraged by birdnetlib/BirdNET.
- BirdNET itself is developed by the Cornell Lab of Ornithology and Chemnitz University of Technology; the in-app sidebar links to [birdnet.cornell.edu/analyzer](https://birdnet.cornell.edu/analyzer/) for attribution.

## Architecture

```
Browser  ──▶  Express (TS, :8080)  ──▶  FastAPI (Python, :8000, internal-only)
```

- **Express** owns the public API contract, request validation, and persistence (SQLite via Drizzle) — recording metadata and detections only, not the raw audio file.
- **FastAPI** owns BirdNET inference only — stateless, no persistence, no CORS, and never reachable from the browser or a published port. Express is its only caller.

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

- Express stores every analysis and its detections in SQLite via Drizzle ORM (default path `server/express-api/data/birdnet.db`) — this is metadata only (filename, size, GPS, detections), not the audio file itself.
- The uploaded audio is streamed to a temp file for analysis and deleted once it completes; there's no blob/object storage, so past recordings can't be played back or re-downloaded.
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
