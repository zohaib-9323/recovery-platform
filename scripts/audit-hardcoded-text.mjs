#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const FAIL_ON_FINDINGS = process.argv.includes('--fail-on-findings')
const MAX_FINDINGS_PER_FILE = 80

const textNodeRegex = />\s*([^<>{\n][^<>{]*[A-Za-z][^<>{]*)\s*</g
const literalPropRegex =
  /\b(title|placeholder|label|alt|aria-label)\s*=\s*"([^"{\n]*[A-Za-z][^"\n]*)"/g

const SKIP_TEXT_SNIPPETS = new Set(['-'])
const SKIP_PROP_VALUES = new Set(['button'])

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim()

const getLineNumber = (source, index) => {
  let line = 1
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1
    }
  }
  return line
}

const shouldIgnoreByComment = (lines, lineNumber) => {
  const currentLine = lines[lineNumber - 1] || ''
  const previousLine = lines[lineNumber - 2] || ''
  return (
    currentLine.includes('i18n-ignore-line') ||
    currentLine.includes('i18n-ignore-next-line') ||
    previousLine.includes('i18n-ignore-next-line')
  )
}

const shouldSkipFile = (relativePath) =>
  relativePath.endsWith('.test.tsx') ||
  relativePath.endsWith('.spec.tsx') ||
  relativePath.includes('/test/')

const collectTsxFiles = async (dirPath) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', 'build', 'dist', 'coverage'].includes(entry.name)) {
        continue
      }
      files.push(...(await collectTsxFiles(fullPath)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }

  return files
}

const collectFindings = (content, lines) => {
  const findings = []

  textNodeRegex.lastIndex = 0
  let textMatch = textNodeRegex.exec(content)
  while (textMatch) {
    const rawText = normalizeWhitespace(textMatch[1])
    if (rawText && !SKIP_TEXT_SNIPPETS.has(rawText)) {
      const line = getLineNumber(content, textMatch.index)
      if (!shouldIgnoreByComment(lines, line)) {
        findings.push({ type: 'jsx-text', line, snippet: rawText })
      }
    }
    textMatch = textNodeRegex.exec(content)
  }

  literalPropRegex.lastIndex = 0
  let propMatch = literalPropRegex.exec(content)
  while (propMatch) {
    const value = normalizeWhitespace(propMatch[2])
    if (value && !SKIP_PROP_VALUES.has(value.toLowerCase())) {
      const line = getLineNumber(content, propMatch.index)
      if (!shouldIgnoreByComment(lines, line)) {
        findings.push({ type: `prop:${propMatch[1]}`, line, snippet: value })
      }
    }
    propMatch = literalPropRegex.exec(content)
  }

  return findings
}

const run = async () => {
  const files = await collectTsxFiles(path.join(ROOT, 'src'))

  const allResults = []
  for (const filePath of files) {
    const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/')
    if (shouldSkipFile(relativePath)) {
      continue
    }

    const content = await fs.readFile(filePath, 'utf8')
    const lines = content.split('\n')
    const findings = collectFindings(content, lines)

    if (findings.length > 0) {
      allResults.push({
        file: relativePath,
        findings: findings.slice(0, MAX_FINDINGS_PER_FILE),
        totalInFile: findings.length,
      })
    }
  }

  allResults.sort((a, b) => b.totalInFile - a.totalInFile)

  if (allResults.length === 0) {
    console.log('No hardcoded text findings detected.')
    return
  }

  const totalFindings = allResults.reduce((sum, item) => sum + item.totalInFile, 0)
  console.log(
    `Hardcoded text audit: ${totalFindings} finding(s) across ${allResults.length} file(s).`,
  )

  for (const result of allResults) {
    console.log(`\n${result.file} (${result.totalInFile})`)
    for (const finding of result.findings) {
      console.log(`  L${finding.line} [${finding.type}] ${finding.snippet}`)
    }
    if (result.totalInFile > result.findings.length) {
      console.log(`  ... ${result.totalInFile - result.findings.length} more finding(s)`)
    }
  }

  if (FAIL_ON_FINDINGS) {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error('Hardcoded text audit failed:', error)
  process.exitCode = 1
})
