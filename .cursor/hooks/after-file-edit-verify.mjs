#!/usr/bin/env node
/**
 * Cursor afterFileEdit: auto-fix and verify recovery-platform against local CI-style gates.
 * Writes JSON only to stdout (tooling logs go to stderr). Exit 2 on failure so Cursor can block.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const EXIT_BLOCK = 2

const PRETTIER_EXT = /\.(tsx?|jsx?|json|cjs|mjs|css|md)$/i
const ESLINT_EXT = /\.(tsx?|jsx?)$/i
const TS_FAMILY = /\.(tsx?|jsx?)$/i

function findRecoveryPlatformRoot(filePath) {
  const resolved = path.resolve(filePath)
  const segments = resolved.split(path.sep)
  const i = segments.lastIndexOf('recovery-platform')
  if (i === -1) return null
  return segments.slice(0, i + 1).join(path.sep)
}

function shouldSkipRel(rel) {
  const p = rel.replace(/\\/g, '/')
  if (!p || p.startsWith('..')) return true
  const blocked = ['node_modules', 'build', 'dist', 'coverage', '.git', '.cursor']
  for (const b of blocked) {
    if (p === b || p.startsWith(`${b}/`)) return true
  }
  return false
}

function run(cwd, cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0', CI: '1' },
    shell: opts.shell ?? false,
  })
  if (r.stdout) process.stderr.write(r.stdout)
  if (r.stderr) process.stderr.write(r.stderr)
  if (r.error) {
    process.stderr.write(`[after-file-edit-verify] ${cmd}: ${r.error.message}\n`)
    return false
  }
  return r.status === 0
}

function npmRun(cwd, script) {
  const isWin = process.platform === 'win32'
  if (isWin) {
    return run(cwd, 'cmd', ['/d', '/s', '/c', `npm run ${script}`], { shell: false })
  }
  return run(cwd, 'npm', ['run', script])
}

function main() {
  let raw = ''
  try {
    raw = readFileSync(0, 'utf8')
  } catch {
    raw = ''
  }

  let input = {}
  try {
    input = JSON.parse(raw.trim() || '{}')
  } catch {
    input = {}
  }

  const filePath = input.file_path
  if (!filePath || typeof filePath !== 'string') {
    process.stdout.write('{}\n')
    return
  }

  const projectRoot = findRecoveryPlatformRoot(filePath)
  if (!projectRoot) {
    process.stdout.write('{}\n')
    return
  }

  const rel = path.relative(projectRoot, path.resolve(filePath)).replace(/\\/g, '/')
  if (shouldSkipRel(rel)) {
    process.stdout.write('{}\n')
    return
  }

  const base = path.basename(rel)
  const isLockfile = base === 'package-lock.json' || base === 'npm-shrinkwrap.json'
  const isPkg = base === 'package.json'

  process.stderr.write(`[after-file-edit-verify] recovery-platform: ${rel}\n`)

  if (!isLockfile && PRETTIER_EXT.test(rel)) {
    if (!run(projectRoot, 'npx', ['prettier', '--write', rel])) {
      process.stderr.write('[after-file-edit-verify] Prettier failed.\n')
      process.exit(EXIT_BLOCK)
    }
  }

  if (ESLINT_EXT.test(rel)) {
    if (!run(projectRoot, 'npx', ['eslint', '--fix', '--max-warnings=0', rel])) {
      process.stderr.write('[after-file-edit-verify] ESLint failed.\n')
      process.exit(EXIT_BLOCK)
    }
  }

  if (TS_FAMILY.test(rel)) {
    if (!npmRun(projectRoot, 'typecheck')) {
      process.stderr.write('[after-file-edit-verify] Typecheck failed.\n')
      process.exit(EXIT_BLOCK)
    }
  }

  const skipI18n = rel.endsWith('.test.tsx') || rel.endsWith('.spec.tsx') || rel.includes('/test/')

  if (rel.endsWith('.tsx') && rel.startsWith('src/') && !skipI18n) {
    if (
      !run(projectRoot, 'node', [
        'scripts/audit-hardcoded-text.mjs',
        '--fail-on-findings',
        '--only-file',
        rel,
      ])
    ) {
      process.stderr.write('[after-file-edit-verify] i18n strict audit failed.\n')
      process.exit(EXIT_BLOCK)
    }
  }

  if (TS_FAMILY.test(rel) && rel.startsWith('src/')) {
    if (!run(projectRoot, 'npx', ['madge', '--circular', 'src/'])) {
      process.stderr.write('[after-file-edit-verify] Circular dependency check (madge) failed.\n')
      process.exit(EXIT_BLOCK)
    }
  }

  if (isPkg || isLockfile) {
    if (!npmRun(projectRoot, 'security:audit')) {
      process.stderr.write('[after-file-edit-verify] npm audit (high+) failed.\n')
      process.exit(EXIT_BLOCK)
    }
    if (!npmRun(projectRoot, 'security:trivy')) {
      process.stderr.write('[after-file-edit-verify] Trivy (CRITICAL vuln gate) failed.\n')
      process.exit(EXIT_BLOCK)
    }
  }

  process.stdout.write('{}\n')
}

main()
