# Recovery Platform

Production-oriented React app: **Create React App** (`react-scripts`) with **CRACO** for path aliases, **TypeScript**, **Redux Toolkit**, **React Router v6**, **Jest** (via `react-scripts test`), **Tailwind CSS v3**, **ESLint 9 (flat)**, **Prettier**, **Husky + lint-staged**, and **Trivy** for filesystem / dependency scanning.

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

| Script                 | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `npm start`            | CRA dev server (CRACO)                        |
| `npm run build`        | Production build → `build/`                   |
| `npm run typecheck`    | `tsc --noEmit` (types not run inside webpack) |
| `npm run lint`         | ESLint                                        |
| `npm run format`       | Prettier write                                |
| `npm run format:check` | Prettier check (CI)                           |
| `npm test`             | Jest (interactive)                            |
| `npm run test:ci`      | Jest once (CI)                                |
| `npm run trivy:scan`   | Trivy vuln + secret scan                      |

## Environment variables

Use the `REACT_APP_` prefix (see `.env.example`). Access via `process.env.REACT_APP_*` in code (`src/utils/env.ts`).

## Layout

- `src/app/` — Redux store, providers, router
- `src/features/` — Feature slices (e.g. `auth/authSlice.ts`)
- `src/pages/` — Route-level screens
- `src/components/` — Shared UI
- `public/` — Static assets and `index.html`

Path alias: `@/` → `src/` (see `craco.config.cjs` and `tsconfig.json`).

## Linting

Configuration: **`eslint.config.mjs`**. Prettier is applied last via `eslint-config-prettier/flat`.

## Git hooks

After `npm install`, Husky runs `prepare` and installs `.husky/pre-commit` to run **lint-staged**.
