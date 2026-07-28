# Backend Implementation Plan — Projects & Recording Metadata/Status

**Status: implemented (2026-07-27).** All checklist items below are done — full-repo
typecheck/lint/test/build (Node + Python) all pass. The "Explicitly out of scope" section
below remains an accurate backlog for the next phase.

Companion to `project-enhancement.md` (which was UI/UX only, built against mock/placeholder
data). This plan wires up the two backend epics selected for this phase and lists everything
else as an explicit backlog, so nothing gets silently assumed into scope.

## Scope for this phase

1. **Projects backend** — real `projects` table, required `projectId` on every analysis,
   CRUD API, cascade delete, frontend fully switched off `MOCK_PROJECTS`.
2. **Recording metadata & status** — real `duration`, real `status`/failure tracking
   (replacing hardcoded "Uploaded"/"Analyzed" badges), `tags`, `notes`, and the "Recording
   hours" / "Upload success rate" dashboard stats that fall out of those two fields.
3. **Error handling refactor** — replace the current thrown `AppError` subclass hierarchy
   with typed `Result`/`ResultAsync` values (via `neverthrow`) across the code this plan
   touches, instead of adding more custom `Error` subclasses.

## Explicitly out of scope (backlog for later)

- Async background job processing for `/analyze` (pending/processing states, queue/worker,
  polling or websocket status updates). Keep the current synchronous request/response flow
  for now.
- Audio file persistence & playback (storing uploaded audio, serving/streaming it back,
  real waveforms for historical recordings). Uploaded files continue to be deleted after
  analysis, same as today.
- Real statistics computation (species trends, seasonal comparison, biodiversity heatmap)
  from actual stored data — `StatisticsPage.tsx` keeps using its mock data for now.
- Recording quality / background noise DSP analysis — no signal-processing feature, no
  formula decided.
- Any auth/user system beyond the current single implicit user — no `users` table, no
  login, no "assigned users" on projects.
- Surfacing birdnetlib's extra per-detection fields (`label`, `is_predicted_for_location_and_date`)
  — noted as available, not needed for MVP.

## Key decisions made in planning (recap)

- **Greenfield data**: existing dev DB rows get wiped, not migrated/backfilled. No legacy
  "unassigned" analyses will ever exist.
- **Project required**: a project must be selected before a new recording can be analyzed;
  `analyses.projectId` is `NOT NULL`.
- **Cascade delete**: deleting a project deletes all of its analyses + detections. The
  frontend must show a clear, explicit warning (with the real recording count) before
  calling delete.
- **Failures are persisted**: an analysis row is now created even when BirdNET analysis
  fails (corrupt audio, upstream error/timeout), with `status: 'failed'` and an error
  message, so status badges and success-rate stats reflect reality. Failures during
  request *validation* (missing file, bad extension, invalid `project_id`) are not
  persisted — nothing meaningful to record yet at that point.
- **Duration is nearly free**: `birdnetlib`'s `Recording.duration` (via librosa) is already
  computed during analysis — FastAPI just needs to include it in the response.
- **Typed errors, not thrown classes**: `errors.ts`'s `AppError`/`ValidationError`/
  `UpstreamError` class hierarchy is replaced with a `DomainError` discriminated union and
  `neverthrow`'s `Result`/`ResultAsync`. Services/repositories return a `Result` instead of
  throwing; controllers convert the final `Result` to an HTTP response at the boundary. The
  Express `errorHandler` middleware is kept, but narrowed to a last-resort catch for things
  that are *not* domain errors (Multer's own file-size errors, malformed JSON bodies, actual
  bugs) — expected failure paths (validation, not-found, upstream failure) are handled
  explicitly via `Result`, not thrown-and-caught centrally.

## Schema changes (`server/express-api/src/db/schema.ts`)

- [x] New `projects` table: `id`, `name` (required), `description` (nullable), `targetLocation`
      (nullable text — free text like "Bad Vilbel, Hesse, Germany", not lat/lon), `createdAt`.
- [x] `analyses` table additions:
  - [x] `projectId` — integer FK → `projects.id`, `NOT NULL`, `onDelete: 'cascade'`.
  - [x] `status` — text, `NOT NULL`, `'completed' | 'failed'`.
  - [x] `errorMessage` — text, nullable (populated only when `status = 'failed'`).
  - [x] `duration` — real, nullable (seconds; null for any failed analysis).
  - [x] `tags` — text, nullable, JSON-encoded `string[]` (drizzle `mode: 'json'`), freeform
        user-typed tags, no fixed vocabulary/table.
  - [x] `notes` — text, nullable, freeform.
- [x] Wipe `server/express-api/data/birdnet.db` (dev-only data, approved for deletion),
      regenerate migrations via `npm run db:generate --workspace server/express-api`.

## FastAPI changes (`server/birdnet-api/`)

- [x] `analyzer_service.py`: include `"duration_seconds": round(recording.duration, 2)` (or
      `None`) in the dict returned from `analyze()`.
- [x] No other changes — FastAPI stays stateless/internal-only; it never learns about
      projects (same reasoning as lat/lon already documented in `analyze.controller.ts`:
      project scoping is an Express/persistence concern only).

## Shared types (`packages/types/src/index.ts`)

- [x] `AnalyzerResponse`: add `duration_seconds?: number`.
- [x] `Analysis`: add `projectId: number`, `status: 'completed' | 'failed'`,
      `errorMessage: string | null`, `duration: number | null`, `tags: string[]`,
      `notes: string | null`.
- [x] New `Project` type: `{ id: number; name: string; description: string | null;
      targetLocation: string | null; createdAt: string; recordingCount: number }`
      (`recordingCount` included specifically so the frontend can show a real number in the
      "this will delete N recordings" confirmation dialog).

## Express API changes (`server/express-api/src/`)

**Error handling (cross-cutting, do this first)**
- [x] Add `neverthrow` dependency.
- [x] `errors.ts` → replace `AppError`/`ValidationError`/`UpstreamError` classes with a
      `DomainError` union: `{ kind: 'validation'; message; details? }`,
      `{ kind: 'not_found'; message }`, `{ kind: 'upstream'; status; message; upstreamBody? }`,
      plus small factory functions (`validationError()`, `notFoundError()`, `upstreamError()`).
- [x] New `http/respondWithError.ts` (or similar) — one place that maps a `DomainError` to a
      `{ status, body }` HTTP response, used by every controller instead of each one
      re-deriving status codes.
- [x] `middleware/errorHandler.ts` — narrow to non-domain errors only: `MulterError`, body
      parser errors, and a final unhandled-exception fallback (still logs + 500s, unchanged
      behavior for actual bugs).
- [x] `services/birdnetClient.ts` — `analyzeUpstream()`/`checkUpstreamHealth()` return
      `ResultAsync<T, DomainError>` (via `ResultAsync.fromPromise`) instead of throwing
      `UpstreamError`.
- [x] Zod parsing helper (e.g. `parseOrError(schema, data)`) that turns a `safeParse` result
      into `Result<T, DomainError>`, used by both the analyze and projects validation.

**Projects (new)**
- [x] `validation/project.schema.ts` — zod create/update schemas (`name` required,
      `description`/`targetLocation` optional).
- [x] `repositories/projectRepository.ts` — `createProject`, `listProjects` (with
      `recordingCount` via a join/count), `getProject`, `updateProject`, `deleteProject`
      (cascade handled by FK `onDelete`); lookups return `Result<Project, DomainError>`
      (`notFoundError` when missing).
- [x] `services/projectService.ts` — thin pass-through, same pattern as `analysisService.ts`,
      propagating `Result` from the repository.
- [x] `controllers/projects.controller.ts` — list/get/create/update/delete handlers; each
      unwraps its `Result` via `.match()`/`respondWithError` at the boundary.
- [x] `routes/index.ts` — `GET /projects`, `POST /projects`, `GET /projects/:id`,
      `PATCH /projects/:id`, `DELETE /projects/:id`.

**Analyses (extend existing)**
- [x] `validation/analyzeRequest.schema.ts` — add required `project_id` form field
      (coerced number).
- [x] `analyze.controller.ts` — rewritten as a `Result`/`ResultAsync` chain: parse form fields
      → confirm `project_id` exists (`notFoundError` if not) → `analyzeUpstream` → persist →
      single `.match()` at the end that either `res.json(...)`s the success or calls
      `respondWithError`. On an `upstream` failure specifically, persist an analysis row
      (`status: 'failed'`, `errorMessage`, `duration: null`, `detections: []`) before
      responding with the error — validation failures (missing file, bad extension, unknown
      `project_id`) are not persisted, nothing meaningful exists yet at that point.
  - [x] On success, persist with `status: 'completed'` and the new `duration` field.
- [x] `analyses.controller.ts` — `listAnalysesController` accepts a required `projectId`
      query param; add `updateAnalysisController` for `PATCH /analyses/:id` (tags/notes only —
      everything else about an analysis is immutable history).
- [x] `analysisService.ts` / `analysisRepository.ts` — thread `projectId`/`status`/
      `errorMessage`/`duration` through `saveAnalysis`; filter `listAnalysesWithDetections` by
      `projectId`; add `updateAnalysisMetadata(id, { tags, notes })`.
- [x] `routes/index.ts` — add `PATCH /analyses/:id`.

## Frontend changes (`client/src/`)

- [x] `api/client.ts`: `analyzeAudio()` sends `project_id`; `fetchAnalyses()` takes a
      required `projectId` param; add `fetchProjects` / `createProject` / `updateProject` /
      `deleteProject` / `updateAnalysis` (PATCH).
- [x] New hooks: `useProjects.ts` (query) + create/update/delete mutations;
      `useUpdateAnalysis.ts` mutation for tags/notes.
- [x] `context/ProjectContext.tsx`: replace in-memory `MOCK_PROJECTS` CRUD with the real
      API hooks above; persist the selected project id (e.g. `localStorage`) across reloads;
      if there are zero projects, force a "create your first project" empty state (no
      recording is possible without one).
- [x] `lib/mockData.ts`: remove `MockProject`/`MOCK_PROJECTS`/`DEFAULT_PROJECT_ID` entirely.
      Leave `MOCK_USER`/`MOCK_NOTIFICATIONS` as-is (out of scope, no auth this phase).
- [x] `MapPage.tsx`, `DashboardPage.tsx`, `RecordingsPage.tsx`: drive `useAnalyses` off
      `selectedProject.id` instead of the `DEFAULT_PROJECT_ID` hack / unfiltered fetch. Remove
      the "not actually project-scoped yet" sample-project warning banner on the dashboard.
- [x] `ProjectsPage.tsx` / `NewProjectDialog.tsx` / `EditProjectDialog.tsx`: wire to real
      mutations. Delete flow must show `recordingCount` and an explicit "this permanently
      deletes N recordings" warning before confirming.
- [x] `NewRecordingButton` / upload flow: read `projectId` from `ProjectContext`, include it
      in the analyze request.
- [x] `RecordingsTable.tsx` / `RecordingsCardGrid.tsx` / `RecordingDetailPanel.tsx`:
  - [x] Replace hardcoded "Uploaded"/"Analyzed" badges with a badge derived from
        `analysis.status` (`completed` → success badge, `failed` → error badge + show
        `errorMessage` in the detail panel).
  - [x] Add real `duration` display (format seconds as `mm:ss`), replacing the "no duration
        field" gap.
  - [x] Replace `PLACEHOLDER_TAGS`/`PLACEHOLDER_NOTES` with editable tag input + notes
        textarea wired to the new `PATCH /analyses/:id` mutation.
  - [x] Leave `PLACEHOLDER_RECORDING_QUALITY`/`PLACEHOLDER_BACKGROUND_NOISE` untouched (DSP
        analysis is out of scope this phase).
- [x] `lib/analytics.ts` — add `recordingHours(list)` and `uploadSuccessRate(list)`, following
      the exact pattern of the existing `shannonBiodiversityIndex`/`totalRecordings` functions
      (pure functions over the already-fetched `Analysis[]` list — no new backend endpoint
      needed, since `duration` and `status` are already present on every row once the fields
      above land): `recordingHours` = `sum(duration where status === 'completed') / 3600`;
      `uploadSuccessRate` = `completedCount / (completedCount + failedCount) * 100`.
- [x] `DashboardPage.tsx` — replace `PLACEHOLDER_STATS.recordingHoursLabel` and
      `.uploadSuccessRatePercent` with the two functions above; drop `isPlaceholder` styling
      on those two `StatCard`s.
- [x] `lib/mockData.ts` — remove `PLACEHOLDER_STATS` (no longer used anywhere).

## Suggested rollout order

1. Error-handling foundation (`neverthrow`, `DomainError`, `respondWithError`, narrowed
   `errorHandler`) — everything else is written directly against this pattern rather than
   converted after the fact.
2. Schema + migration (projects table, analyses columns) — wipe dev DB, regenerate.
3. FastAPI `duration_seconds` passthrough (small, independent, unblocks duration everywhere).
4. Express: Projects CRUD endpoints, fully independent of the analyze flow.
5. Express: extend `/analyze` (required `project_id`, failure persistence, duration) and
   `/analyses` (project filter), add `PATCH /analyses/:id`.
6. Shared types update (`packages/types`) — do this alongside step 4/5, since both Express
   and client consume it.
7. Frontend: `ProjectContext` + Projects page off real API first (can ship/verify
   independently of recording changes).
8. Frontend: recording upload/list/detail wiring (project filter, status badges, duration,
   tags/notes editing, recording hours / upload success rate) last, since it depends on
   everything above.
