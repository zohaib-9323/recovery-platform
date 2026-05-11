#!/usr/bin/env node
/**
 * Runs pre-build gates and prints a summary report.
 * Exits 1 when any mandatory gate fails.
 *
 * SKIP_TRIVY=1 to skip Trivy in minimal environments.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const npmExecPath = process.env.npm_execpath
const skipTrivy = ['1', 'true', 'yes'].includes((process.env.SKIP_TRIVY || '').toLowerCase())

function runNpm(args) {
  if (npmExecPath) {
    return spawnSync(process.execPath, [npmExecPath, ...args], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    })
  }

  if (process.platform === 'win32') {
    return spawnSync('npm', args, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    })
  }

  return spawnSync('npm', args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
}

const checks = [
  {
    name: 'ESLint',
    detail: 'npm run lint:check',
    args: ['run', 'lint:check'],
  },
  {
    name: 'Typecheck',
    detail: 'npm run typecheck',
    args: ['run', 'typecheck'],
  },
  {
    name: 'Prettier',
    detail: 'npm run format:check',
    args: ['run', 'format:check'],
  },
  {
    name: 'i18n audit',
    detail: 'npm run i18n:audit:strict',
    args: ['run', 'i18n:audit:strict'],
  },
  {
    name: 'Tests',
    detail: 'npm run test:ci',
    args: ['run', 'test:ci'],
  },
]

if (skipTrivy) {
  checks.push({
    name: 'Trivy',
    detail: 'SKIPPED (SKIP_TRIVY=1). Run npm run security:trivy in CI/locally.',
    skip: true,
  })
} else {
  checks.push({
    name: 'Trivy',
    detail: 'npm run security:trivy (CRITICAL)',
    args: ['run', 'security:trivy'],
  })
}

const results = []
console.log('\n=== Recovery prebuild verification ===\n')

for (const check of checks) {
  if (check.skip) {
    console.log(`- ${check.name}: SKIPPED`)
    console.log(`  ${check.detail}\n`)
    results.push({ name: check.name, ok: true, skipped: true, status: 0, detail: check.detail })
    continue
  }

  console.log(`- ${check.name}`)
  console.log(`  ${check.detail}\n`)
  const run = runNpm(check.args)
  if (run.error) {
    console.error(`Command failed to start: ${check.detail}`)
    console.error(run.error.message)
  }
  const status = run.status ?? (run.error ? 1 : 0)
  const ok = status === 0
  results.push({
    name: check.name,
    ok,
    skipped: false,
    status,
    detail: check.detail,
  })
}

const failed = results.filter((r) => !r.ok).length
const passed = results.filter((r) => r.ok && !r.skipped).length
const skipped = results.filter((r) => r.skipped).length

console.log('\n=== Build gate report ===')
for (const r of results) {
  const status = r.skipped ? 'SKIPPED' : r.ok ? 'PASSED' : `FAILED (exit ${r.status})`
  console.log(`${status} - ${r.name}`)
  console.log(`  ${r.detail}`)
}
console.log(`Summary: ${passed} passed, ${skipped} skipped, ${failed} failed`)
console.log(failed ? 'Build blocked.' : 'All gates passed. Build can proceed.')

process.exit(failed ? 1 : 0)
