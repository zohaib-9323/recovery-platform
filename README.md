# Recovery Platform

Production-oriented React app: **Create React App** (`react-scripts`) with **CRACO** for path aliases, **TypeScript**, **Redux Toolkit**, **React Router v6**, **Jest** (via `react-scripts test`), **Tailwind CSS v3**, **ESLint 9 (flat)**, **Prettier**, **Husky + lint-staged**, and **Trivy** for filesystem / dependency scanning.

## Runtime requirements

- Node.js: **22.x** (CI uses Node 22)
- npm: **10+**

## Quick start

```bash
cd recovery-platform
cp .env.example .env
npm install
npm start
```

(`npm run dev` is the same as `npm start`.)

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                  | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `npm start`             | CRA dev server (CRACO)                        |
| `npm run build`         | Production build → `build/`                   |
| `npm run typecheck`     | `tsc --noEmit` (types not run inside webpack) |
| `npm run lint`          | ESLint                                        |
| `npm run dep:cycles`    | Dependency cycle detection (Madge)            |
| `npm run format`        | Prettier write                                |
| `npm run format:check`  | Prettier check (CI)                           |
| `npm test`              | Jest (interactive)                            |
| `npm run test:ci`       | Jest once (CI)                                |
| `npm run test:coverage` | Jest once with coverage thresholds            |
| `npm run trivy:scan`    | Trivy vuln + secret scan                      |

## Environment variables

Use the `REACT_APP_` prefix (see `.env.example`). Access via `process.env.REACT_APP_*` in code (`src/utils/env.ts`).

### Rules

- `REACT_APP_API_BASE_URL` is **required** and validated at startup.
- Missing required env variables fail fast to avoid accidental bad deployments.
- Never commit secrets; use `.env.local` for local-only overrides.

## Layout

- `src/app/` — Redux store, providers, router
- `src/features/` — Feature slices (e.g. `auth/authSlice.ts`)
- `src/pages/` — Route-level screens
- `src/components/` — Shared UI
- `src/pages/**/hooks` — feature/page business logic hooks
- `src/pages/**/components` — presentational page UI blocks
- `public/` — Static assets and `index.html`
- `docs/adr/` — architecture decision records

Path alias: `@/` → `src/` (see `craco.config.cjs` and `tsconfig.json`).

## Linting

Configuration: **`eslint.config.mjs`**. Prettier is applied last via `eslint-config-prettier/flat`.

- `no-console` is enforced (except `warn`/`error`).
- CI enforces lint + format + typecheck + tests + dependency cycle check.

## Git hooks

After `npm install`, Husky runs `prepare` and installs hooks:

- `pre-commit`: `lint-staged` + `typecheck`
- `pre-push`: `test:ci`

## Testing standards

- Coverage thresholds are enforced in Jest config (via CRACO):
  - lines/statements >= 80%
  - functions >= 75%
  - branches >= 70%
- Prefer testing business logic through hooks/services and API edge paths (failures/retry).

## API validation strategy

- Request and response schemas are defined with **Zod** in `src/lib/schemas`.
- Validation is applied in API boundaries and sensitive auth flows.

## Dependency management

- Dependabot is configured at `.github/dependabot.yml` (weekly npm updates).
- Upgrade strategy:
  1. Auto-merge patch/minor updates after CI passes.
  2. Review major updates manually with changelog impact analysis.
  3. Run `lint`, `typecheck`, `test:coverage`, and `build` before merge.

## Common issues

- **`Missing required environment variable: REACT_APP_API_BASE_URL`**
  - Ensure `.env` or `.env.local` defines `REACT_APP_API_BASE_URL`.
- **Hook/CI failures after dependency changes**
  - Run `npm ci` then `npm run lint && npm run typecheck && npm run test:coverage`.
- **Cycle check failure**
  - Run `npm run dep:cycles` and remove bidirectional imports.
