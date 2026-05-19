#!/usr/bin/env node
/**
 * Cursor sessionStart hook: inject Recovery Platform context into the agent session.
 * Reads JSON from stdin; writes JSON to stdout (Cursor expects snake_case fields).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..', '..')

let input = ''
try {
  input = readFileSync(0, 'utf8')
} catch {
  input = ''
}

let session = {}
try {
  if (input.trim()) session = JSON.parse(input)
} catch {
  session = {}
}

const mode = session.composer_mode ?? 'agent'
const isBg = session.is_background_agent === true

const additional_context = `## Recovery Platform (this repo)

You are in the **recovery-platform** workspace root: \`${projectRoot}\`.

### Commands
- Dev: \`npm start\` (CRACO)
- Build: \`npm run build\`
- Lint: \`npm run lint\` / strict: \`npm run lint:check\`
- Format: \`npm run format\`
- Types: \`npm run typecheck\`
- Tests (CI): \`npm run test:ci\` (coverage gates: ~70% lines/statements/functions, ~65% branches; stricter on \`api.ts\`, \`authSession.ts\`)

### Stack & entry
- React 18 + CRACO, Redux Toolkit + RTK Query (\`src/app/services/recoveryApi.ts\`)
- Entry: \`src/index.tsx\` → providers → \`AppRouter\` (\`src/app/router.tsx\`)
- Path alias: \`@/\` → \`src/\`

### Env
- Copy \`.env.example\` → \`.env.local\`; \`REACT_APP_API_BASE_URL\` is required at startup.

### Conventions
- Network: prefer RTK Query endpoints; direct HTTP in \`src/services/api.ts\` is mainly for token refresh (avoid circular reauth).
- UI primitives: \`src/components/ui/\` (CVA + tailwind-merge).
- \`no-console\` (use \`src/lib/error-reporting.ts\`), \`eqeqeq\`, \`curly: all\`; page files subject to ESLint \`max-lines\`.
- For structured review, the repo documents custom command \`/strict-ai-code-review <scope>\` in CLAUDE.md.

### Session meta (from hook input)
- composer_mode: ${mode}
- is_background_agent: ${isBg}

Prefer \`CLAUDE.md\` at the repo root for full architecture detail.`

const out = JSON.stringify({
  env: {
    RECOVERY_PLATFORM: '1',
  },
  additional_context,
})

process.stdout.write(out)
