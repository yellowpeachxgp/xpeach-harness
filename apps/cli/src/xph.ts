#!/usr/bin/env node
/**
 * XPeach Harness CLI entry (`pnpm xph`): sets `XPH_HOME` (`~/.xph`) so every
 * data root stays isolated from `~/.dsh`, seeds the `xpeach` profile when
 * needed, and delegates to the shared CLI runner.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'

const HELP_OR_VERSION_FLAGS = new Set(['-h', '--help', '-V', '--version'])
const POSITIONAL_PROFILES = new Set(['headless', 'acp', 'sdk'])
const productPatchSchema = yaml.JSON_SCHEMA.extend(new yaml.Type('tag:yaml.org,2002:js', {
  kind: 'scalar', resolve: (expression: unknown) => typeof expression === 'string',
  construct: (expression: string) => expression,
}))

/**
 * Normalize raw `xph` CLI arguments into the canonical `runCli` form.
 *
 * Bare help/version invocations pass through unchanged so the launcher prints
 * help or version without booting the web profile. Positional profile
 * shorthands (`headless`, `acp`, `sdk`, `web`) and `plugin` subcommand profile
 * defaults are expanded in the positions expected by `parseCliCommand`.
 * @param rawArgs - Arguments following the executable and script path (`process.argv.slice(2)`).
 * @returns Normalized argument array for `runCli`.
 */
export function normalizeXphArgv(rawArgs: readonly string[]): string[] {
  if (rawArgs.length > 0 && rawArgs.every(arg => HELP_OR_VERSION_FLAGS.has(arg))) {
    return [...rawArgs]
  }
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
  if (explicitProfile === undefined && normalized[0] !== undefined && POSITIONAL_PROFILES.has(normalized[0])) {
    return ['--profile', normalized[0], ...normalized.slice(1)]
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
    return ['plugin', '--profile', 'xpeach', ...normalized.slice(1)]
  }
  return ['--profile', 'xpeach', ...normalized]
}

/** 读取源码和安装包共同使用的产品补丁；资源不可读时停止播种。 */
function resolveShippedPatchContent(): string {
  const resource = new URL('../resources/xpeach.profile.yml', import.meta.url)
  try {
    return readFileSync(resource, 'utf8')
  } catch (cause) {
    throw Object.assign(new Error('xph：无法读取随包产品补丁，请重新安装完整的 CLI 包。', { cause }), {
      code: 'XPH_PROFILE_RESOURCE_UNAVAILABLE',
      path: fileURLToPath(resource),
    })
  }
}

/**
 * Ensure the `~/.xph` home directory and `xpeach` profile exist, migrate any
 * `@deepseek-ai/dsh-*` legacy references in the profile manifest/patch, and
 * populate `XPEACH_RELAY_KEY` / `XPEACH_API_KEY` from the persisted `xpeach.key`
 * when not already set in the environment.
 * @param home - Optional explicit `XPH_HOME` override for testing.
 * @returns The resolved `xpeach` profile directory path.
 * @throws 用户补丁语法或条目无效时，在补丁旧引用迁移与种子写入前失败。
 */
export async function ensureXpeachProfile(home?: string): Promise<string> {
  process.env.XPH_PRODUCT = '1'
  const explicitHome = home !== undefined || process.env.XPH_HOME !== undefined
  const XPH_HOME = home ?? process.env.XPH_HOME ?? join(homedir(), '.xph')
  process.env.XPH_HOME = XPH_HOME
  process.env.DSH_HOME ??= XPH_HOME
  mkdirSync(XPH_HOME, { recursive: true })

  const legacyProfile = join(homedir(), '.dsh', 'profiles', 'xpeach')
  const xphProfile = join(XPH_HOME, 'profiles', 'xpeach')
  if (!explicitHome && !existsSync(xphProfile) && existsSync(legacyProfile)) {
    mkdirSync(join(XPH_HOME, 'profiles'), { recursive: true })
    // Copy the user patch layer without carrying credentials, state files, temp files, lockfiles, or legacy manifests.
    const excluded = new RegExp(
      'xpeach\\.(key|key\\.bak|keys|key\\.seeded|session|admin|sso\\.json|token|relay\\.json|route\\.json)$|\\.tmp\\.[^/\\\\]+$|\\.credentials|pricing\\.json$|package\\.json$|pnpm-.*\\.yaml$|pnpm-lock\\.yaml$|node_modules$',
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
  const { loadOptionalPatches } = await import('@xpeach/xph-app-boot')
  const currentPatch = existsSync(patchFile) ? readFileSync(patchFile, 'utf8') : ''
  const parsed: unknown = yaml.load(currentPatch, { schema: productPatchSchema, filename: patchFile })
  const emptyPatch = parsed === undefined || parsed === null || (loadOptionalPatches('xph', patchFile)?.length ?? 0) === 0
  if (existsSync(patchFile)) {
    const cleaned = currentPatch
      .replace(/# 旧路径兜底隔离[\s\S]*?(?=- insert:)/, '')
      .replaceAll('@deepseek-ai/dsh-xpeach-account', '@xpeach/xph-account')
      .replaceAll('@deepseek-ai/dsh-client-ui-xpeach', '@xpeach/xph-client-ui')
      .replaceAll('@deepseek-ai/dsh-', '@xpeach/xph-')
    if (!emptyPatch && cleaned !== currentPatch) writeFileSync(patchFile, cleaned)
  }
  if (emptyPatch) {
    mkdirSync(xphProfile, { recursive: true })
    writeFileSync(patchFile, resolveShippedPatchContent())
  }

  if (!process.env.XPEACH_RELAY_KEY) {
    const keyPaths = [
      join(xphProfile, 'xpeach.key'),
      join(XPH_HOME, 'profiles', 'xpeach-desktop', 'xpeach.key'),
    ]
    for (const keyPath of keyPaths) {
      try {
        if (existsSync(keyPath)) {
          const key = readFileSync(keyPath, 'utf8').trim()
          if (key.length > 0) {
            process.env.XPEACH_RELAY_KEY = key
            process.env.XPEACH_API_KEY = key
            break
          }
        }
      } catch (_err) {
        // Ignore unreadable key files; unauthenticated sessions prompt for login in the UI.
      }
    }
  }

  return xphProfile
}

if (import.meta.main) {
  await ensureXpeachProfile()
  process.argv = [process.argv[0] ?? process.execPath, process.argv[1] ?? '', ...normalizeXphArgv(process.argv.slice(2))]
  const { runCli } = await import('./bin.ts')
  await runCli()
}
