#!/usr/bin/env node
/**
 * Ensures a Trivy binary is available for local verify/build gates.
 * Uses system `trivy` when present; otherwise downloads a pinned release to ./bin.
 */
import { spawnSync } from 'node:child_process'
import { chmodSync, createWriteStream, existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const binDir = join(root, 'bin')
const localTrivy = join(binDir, process.platform === 'win32' ? 'trivy.exe' : 'trivy')
const TRIVY_VERSION = '0.71.1'

function trivyWorks(command) {
  const run = spawnSync(command, ['--version'], { stdio: 'ignore' })
  return run.status === 0
}

function resolvePlatformAsset() {
  const { platform, arch } = process

  if (platform === 'darwin') {
    return arch === 'arm64'
      ? `trivy_${TRIVY_VERSION}_macOS-ARM64.tar.gz`
      : `trivy_${TRIVY_VERSION}_macOS-64bit.tar.gz`
  }

  if (platform === 'linux') {
    if (arch === 'arm64') return `trivy_${TRIVY_VERSION}_Linux-ARM64.tar.gz`
    return `trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz`
  }

  throw new Error(`Unsupported platform for auto-install: ${platform} ${arch}`)
}

async function downloadFile(url, destination) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download Trivy (${response.status}): ${url}`)
  }

  await pipeline(response.body, createWriteStream(destination))
}

async function installLocalTrivy() {
  mkdirSync(binDir, { recursive: true })
  const asset = resolvePlatformAsset()
  const url = `https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/${asset}`
  const archivePath = join(binDir, asset)

  console.log(`Installing Trivy v${TRIVY_VERSION} to ${binDir}...`)
  await downloadFile(url, archivePath)

  const extract = spawnSync('tar', ['-xzf', archivePath, '-C', binDir], { stdio: 'inherit' })
  if (extract.status !== 0) {
    throw new Error('Failed to extract Trivy archive.')
  }

  unlinkSync(archivePath)

  if (!existsSync(localTrivy)) {
    throw new Error(`Trivy binary missing after install: ${localTrivy}`)
  }

  chmodSync(localTrivy, 0o755)
}

async function main() {
  if (process.argv.includes('--print-path')) {
    if (trivyWorks('trivy')) {
      process.stdout.write('trivy\n')
      return
    }
    if (existsSync(localTrivy) && trivyWorks(localTrivy)) {
      process.stdout.write(`${localTrivy}\n`)
      return
    }
    process.exit(1)
  }

  if (trivyWorks('trivy')) {
    return
  }

  if (existsSync(localTrivy) && trivyWorks(localTrivy)) {
    return
  }

  await installLocalTrivy()

  if (!trivyWorks(localTrivy)) {
    throw new Error('Installed Trivy binary failed --version check.')
  }

  console.log(`Trivy ready at ${localTrivy}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
