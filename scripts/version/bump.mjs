/**
 * Single source of truth for the XPeach product version.
 *
 * The counter lives in `version.json` at the repository root and is the only
 * place a release number is authored. Everything else — every workspace
 * manifest, the desktop bundle, the update feed — derives from it.
 *
 * Two ways to move the counter:
 *   pnpm run version:bump            # patch +1 (CI does this per release)
 *   pnpm run version:bump -- minor   # or major | minor | patch, or an exact X.Y.Z
 *
 * `--dry-run` prints the result without writing. `--sync` only propagates the
 * current counter to the manifests.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..', '..')
const COUNTER = join(ROOT, 'version.json')

/** Directories whose manifests carry the product version. */
const MANIFEST_ROOTS = ['packages', 'apps']

/** Never descended into. */
const SKIP = new Set(['node_modules', 'lib', 'dist', '.git', '.desktop-build', 'coverage'])

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/u

/**
 * Read the counter file.
 * @returns {{ version: string, build: number, history: Array<{ version: string, build: number, at: string }> }}
 */
export function readCounter() {
  return JSON.parse(readFileSync(COUNTER, 'utf8'))
}

/** The prerelease label each long-lived branch publishes under. */
export const BRANCH_LABEL = { alpha: '-alpha', beta: '-beta', main: '-least' }

/**
 * Apply a branch's label to a version core.
 * @param version - any semantic version.
 * @param branch - the branch being released.
 * @returns the version carrying that branch's label.
 */
export function labelFor(version, branch) {
  const parsed = SEMVER.exec(version)
  if (parsed === null) throw new Error(`version: ${JSON.stringify(version)} is not a semantic version`)
  const label = BRANCH_LABEL[branch]
  if (label === undefined) throw new Error(`version: ${JSON.stringify(branch)} is not a release branch`)
  return `${parsed[1]}.${parsed[2]}.${parsed[3]}${label}`
}

/**
 * Compute the next version.
 * @param {string} current - current X.Y.Z.
 * @param {string} request - bump keyword or an exact version.
 * @returns {string} the next version.
 */
export function nextVersion(current, request) {
  const parsed = SEMVER.exec(current)
  if (parsed === null) throw new Error(`version: ${JSON.stringify(current)} is not a semantic version`)
  const [major, minor, patch] = [Number(parsed[1]), Number(parsed[2]), Number(parsed[3])]
  // A prerelease line stays on its label: 0.0.1-alpha -> 0.0.2-alpha, not 0.0.2.
  const label = parsed[4]
  const suffix = label === undefined ? '' : label
  if (request === 'major') return `${major + 1}.0.0${suffix}`
  if (request === 'minor') return `${major}.${minor + 1}.0${suffix}`
  if (request === 'patch' || request === undefined) return `${major}.${minor}.${patch + 1}${suffix}`
  // Explicitly leaving the prerelease line.
  if (request === 'stable') return `${major}.${minor}.${patch}`
  if (SEMVER.test(request)) return request
  throw new Error(`version: ${JSON.stringify(request)} is not a bump keyword or semantic version`)
}

/** Every workspace manifest path. */
function manifests() {
  const found = [join(ROOT, 'package.json')]
  const walk = (dir) => {
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) { walk(path); continue }
      if (entry.name === 'package.json') found.push(path)
    }
  }
  for (const root of MANIFEST_ROOTS) walk(join(ROOT, root))
  return found
}

/**
 * Write one version into every workspace manifest.
 * @param {string} version - X.Y.Z to publish.
 * @returns {number} how many manifests changed.
 */
export function writeVersion(version) {
  if (!SEMVER.test(version)) throw new Error(`version: ${JSON.stringify(version)} is not X.Y.Z`)
  let changed = 0
  for (const path of manifests()) {
    const raw = readFileSync(path, 'utf8')
    const manifest = JSON.parse(raw)
    if (manifest.version === version) continue
    manifest.version = version
    writeFileSync(path, `${JSON.stringify(manifest, undefined, 2)}\n`)
    changed += 1
  }
  return changed
}

const argv = process.argv.slice(2)
const labelIndex = argv.indexOf('--label')
if (labelIndex !== -1) {
  const branch = argv[labelIndex + 1]
  console.log(labelFor(readCounter().version, branch))
  process.exit(0)
}
const dryRun = argv.includes('--dry-run')
const syncOnly = argv.includes('--sync')
const bumpFlagIndex = argv.indexOf('--bump')
const bumpEqArg = argv.find((value) => value.startsWith('--bump='))
const request = bumpFlagIndex !== -1
  ? argv[bumpFlagIndex + 1]
  : bumpEqArg !== undefined
    ? bumpEqArg.slice('--bump='.length)
    : argv.find((value) => !value.startsWith('--'))
const counter = readCounter()

if (syncOnly) {
  const changed = writeVersion(counter.version)
  console.log(`version: synced ${counter.version} into ${changed} manifest(s)`)
  process.exit(0)
}

const version = nextVersion(counter.version, request)
if (dryRun) {
  console.log(version)
  process.exit(0)
}

const changed = writeVersion(version)
const next = {
  version,
  build: counter.build + 1,
  history: [...(counter.history ?? []), { version, build: counter.build + 1, at: new Date().toISOString() }].slice(-100),
}
writeFileSync(COUNTER, `${JSON.stringify(next, undefined, 2)}\n`)
console.log(`version: ${counter.version} -> ${version} (build ${next.build}); ${changed} manifest(s) updated`)
