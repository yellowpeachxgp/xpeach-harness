/**
 * XPeach Harness CLI entry (`pnpm xph`): sets `XPH_HOME` (`~/.xph`) so every
 * data root stays isolated from `~/.dsh`, seeds the `xpeach` profile when
 * needed, and delegates to the shared CLI runner.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

function normalizeXphArgv(rawArgs: readonly string[]): string[] {
  const normalized: string[] = []
  let explicitProfile: string | undefined
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i]
    if (arg === undefined) continue
    if (arg === '--') {
      normalized.push(...rawArgs.slice(i))
      break
    }
    if (arg === '--profile' || arg === '-p') {
      const next = rawArgs[i + 1]
      normalized.push('--profile')
      if (next !== undefined) {
        explicitProfile = next
        normalized.push(next)
        i++
      }
      continue
    }
    if (arg.startsWith('--profile=') || arg.startsWith('-p=')) {
      const value = arg.slice(arg.indexOf('=') + 1)
      explicitProfile = value
      normalized.push(`--profile=${value}`)
      continue
    }
    normalized.push(arg)
  }
  const profile = explicitProfile ?? 'xpeach'
  if (profile === 'xpeach' && normalized[0] !== 'plugin') {
    for (let i = 0; i < normalized.length; i++) {
      const arg = normalized[i]
      if (arg === undefined || arg === '--') break
      if (arg === '--profile' || arg === '--patch' || arg === '--port' || arg === '--host' || arg === '--model' || arg === '--cwd') {
        i++
        continue
      }
      if (arg.startsWith('-')) continue
      if (arg === 'web') normalized.splice(i, 1)
      break
    }
  }
  if (explicitProfile !== undefined) return normalized
  if (normalized[0] === 'plugin') {
    const dashDash = normalized.indexOf('--')
    if (dashDash >= 0) normalized.splice(dashDash, 0, '--profile', 'xpeach')
    else normalized.push('--profile', 'xpeach')
    return normalized
  }
  return ['--profile', 'xpeach', ...normalized]
}

process.env.XPH_PRODUCT = '1'
const XPH_HOME = process.env.XPH_HOME ?? join(homedir(), '.xph')
process.env.XPH_HOME = XPH_HOME
mkdirSync(XPH_HOME, { recursive: true })

const legacyProfile = join(homedir(), '.dsh', 'profiles', 'xpeach')
const xphProfile = join(XPH_HOME, 'profiles', 'xpeach')
if (!existsSync(xphProfile) && existsSync(legacyProfile)) {
  mkdirSync(join(XPH_HOME, 'profiles'), { recursive: true })
  // Copy the user patch layer without carrying credentials, lockfiles, or legacy manifests.
  const excluded = new RegExp(
    'xpeach\\.(key|key\\.bak|keys|key\\.seeded|session|admin)$|\\.credentials|pricing\\.json$|package\\.json$|pnpm-.*\\.yaml$|pnpm-lock\\.yaml$|node_modules$',
  )
  cpSync(legacyProfile, xphProfile, { recursive: true, dereference: false, filter: src => !excluded.test(src) })
  console.log('[xph] seeded profile from ~/.dsh — from now on the two homes are independent')
}

{
  const { initProfile, PROFILE_TEMPLATES } = await import('@xpeach/xph-app-boot')
  mkdirSync(xphProfile, { recursive: true })
  const template = PROFILE_TEMPLATES.xpeach
  if (template === undefined) throw new Error('xph: the shipped xpeach profile template is missing')
  initProfile(xphProfile, template.bundles)
}

const manifestFile = join(xphProfile, 'package.json')
if (existsSync(manifestFile)) {
  let manifest: { dependencies?: Record<string, string> } | undefined
  try {
    manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as { dependencies?: Record<string, string> }
  } catch (_unreadableManifest) { /* ignore malformed user manifest */ }
  if (manifest?.dependencies !== undefined) {
    let changed = false
    for (const [depName, spec] of Object.entries(manifest.dependencies)) {
      if (depName.startsWith('@deepseek-ai/') || spec.includes('/deepseek-harness/')) {
        Reflect.deleteProperty(manifest.dependencies, depName)
        changed = true
      }
    }
    if (changed) {
      writeFileSync(manifestFile, `${JSON.stringify(manifest, undefined, 2)}\n`)
      rmSync(join(xphProfile, 'node_modules'), { recursive: true, force: true })
    }
  }
}

const patchFile = join(xphProfile, 'cordis.patch.yml')
if (existsSync(patchFile)) {
  const text = readFileSync(patchFile, 'utf8')
  const cleaned = text
    .replace(/# 旧路径兜底隔离[\s\S]*?(?=- insert:)/, '')
    .replaceAll('@deepseek-ai/dsh-xpeach-account', '@xpeach/xph-account')
    .replaceAll('@deepseek-ai/dsh-client-ui-xpeach', '@xpeach/xph-client-ui')
    .replaceAll('@deepseek-ai/dsh-', '@xpeach/xph-')
  if (cleaned !== text) writeFileSync(patchFile, cleaned)
}
const shippedPatchFile = fileURLToPath(new URL('../../desktop/resources/xpeach.profile.yml', import.meta.url))
if ((!existsSync(patchFile) || !/^\s*-/m.test(readFileSync(patchFile, 'utf8'))) && existsSync(shippedPatchFile)) {
  mkdirSync(xphProfile, { recursive: true })
  writeFileSync(patchFile, readFileSync(shippedPatchFile, 'utf8'))
}

process.argv = [process.argv[0] ?? process.execPath, process.argv[1] ?? '', ...normalizeXphArgv(process.argv.slice(2))]
const { runCli } = await import('./bin.ts')
await runCli()
