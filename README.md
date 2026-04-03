# Recovery Platform

Production-oriented React app: **Vite**, **TypeScript**, **Redux Toolkit**, **React Router v7**, **Vitest**, **ESLint 9 (flat)**, **Prettier**, **Husky + lint-staged**, and **Trivy** for filesystem / dependency scanning.

## Quick start

```bash
cd recovery-platform
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use `npm start` as an alias for `npm run dev`.

## Scripts

| Script                      | Purpose                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev` / `npm start` | Vite dev server                                                                        |
| `npm run build`             | Typecheck + production build                                                           |
| `npm run preview`           | Preview production build                                                               |
| `npm run lint`              | ESLint                                                                                 |
| `npm run format`            | Prettier write                                                                         |
| `npm run format:check`      | Prettier check (CI)                                                                    |
| `npm run test`              | Vitest (watch)                                                                         |
| `npm run test -- --run`     | Vitest once (CI)                                                                       |
| `npm run test:coverage`     | Coverage report                                                                        |
| `npm run trivy:scan`        | Trivy vuln + secret scan (requires [Trivy](https://aquasecurity.github.io/trivy/) CLI) |

## Layout

- `src/app/` — Redux store and typed hooks, providers, router entry
- `src/features/` — Feature slices (e.g. `auth/authSlice.ts`)
- `src/pages/` — Route-level screens
- `src/components/` — Shared UI (e.g. `layout/AppLayout`)
- `src/services/` — API helpers
- `src/hooks/` — App hooks (`useAuth` reads from Redux)
- `src/utils/` — `env` helpers for `import.meta.env`
- `src/types/` — Shared TypeScript types

Path alias: `@/` → `src/` (see `vite.config.ts` and `tsconfig.app.json`).

## Linting

Configuration lives in **`eslint.config.js`** (ESLint 9 flat config). Prettier is applied last via `eslint-config-prettier/flat` so there are no rule conflicts.

## Git hooks

After `git clone` / `npm install`, Husky runs `prepare` and installs `.husky/pre-commit` to run **lint-staged** (ESLint fix + Prettier on staged files).

## CI

See `.github/workflows/ci.yml` for lint, format check, tests, build, and Trivy.

## Environment

Only variables prefixed with `VITE_` are exposed to the client. Copy `.env.example` to `.env` and adjust values.

# Recovery-Platform
