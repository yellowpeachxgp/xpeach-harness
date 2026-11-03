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

const HELP_OR_VERSION_FLAGS = new Set(['-h', '--help', '-V', '--version'])
const POSITIONAL_PROFILES = new Set(['headless', 'acp', 'sdk'])

const DEFAULT_XPEACH_PROFILE_PATCH = `# XPeach product profile: replaces the DeepSeek brand, sign-in surface and
# model provider with the XPeach relay, and loads the XPeach product plugins.
- id: ui-settings-general
  name: "@xpeach/xph-client-ui-settings-general"
  config:
    welcomeNoticeVersion: 2026-09-28.1
- id: ui-settings-account
  disabled: true
- id: deepseek-account
  disabled: true
- id: account-controller
  disabled: true
- id: plugin-package-inventory-deepseek
  disabled: true
- id: deepseek-llm-api-extensions
  disabled: true
- id: session-log-deepseek
  disabled: true
- id: session-telemetry-otel
  disabled: true
- id: llm-deepseek-account
  disabled: true
- id: ui-deepseek-model-label-1017
  disabled: true
- id: llm-deepseek
  disabled: true # Disabled: models are served through the xpeach provider in llm-pi-ai.
  name: "@xpeach/xph-llm-deepseek-api-key"
  config:
    apiKeyEnv: XPEACH_RELAY_KEY
    baseURL: https://fast.xpeach.codes/v1
    models:
      - id: deepseek-flash
        name: DeepSeek-Flash
        contextWindow: 1000000
        inputModalities:
          - text
          - image
        systemPromptUpdate: in-history
      - id: deepseek-v4-pro
        name: DeepSeek-V4-Pro
        description: Stronger agentic coding, knowledge, and difficult reasoning; suited
          to complex or quality-critical tasks at higher cost.
        contextWindow: 1000000
        inputModalities:
          - text
      - id: deepseek-v4.1-flash
        name: DeepSeek-V4.1-Flash
        inputModalities:
          - text
          - image
      - id: swe-2-max
        name: swe-2-max
        contextWindow: 256000
        inputModalities:
          - text
          - image
- id: web-search-deepseek
  name: "@xpeach/xph-web-search-deepseek"
  config:
    apiKeyEnv: XPEACH_RELAY_KEY
    baseURL: https://fast.xpeach.codes/anthropic/v1
- id: agent-default-model
  name: "@xpeach/xph-agent-default-model"
  config:
    provider: xpeach
    model: swe-2-max
- id: llm-pi-ai
  name: "@xpeach/xph-llm-pi-ai"
  config:
    providers:
      xpeach:
        displayName: 🍑Code
        apiKeyEnv: XPEACH_RELAY_KEY
        api: openai-completions
        baseURL: https://fast.xpeach.codes/v1
        defaultInput:
          - text
          - image
        reasoning: high
        models:
          - id: swe-2-max
            name: swe-2-max
            contextWindow: 262144
            maxTokens: 65536
            input:
              - text
              - image
            reasoningEfforts:
              off: null
              low: low
              medium: medium
              high: high
        # The catalog is not frozen here: the account plugin writes the site's
        # live model list into this namespace at boot and after every bind.


- id: ui-brand-official
  disabled: true

# XPeach product plugins. They are host plugins (dsh.client) inserted here, the
# same way every other client-only plugin in this repository is loaded.
- insert:
    - id: xpeach-account
      name: '@xpeach/xph-account'
    - id: xpeach-client
      name: '@xpeach/xph-client-ui'

- id: locale
  name: "@xpeach/xph-client-locale"
  config:
    preference: zh
- id: permission
  name: "@xpeach/xph-permission-presets"
  config:
    presets:
      read-only:
        sandbox: read-only
        approval: ask
      workspace-write:
        sandbox: workspace-write
        approval: ask
      danger-full-access:
        sandbox: danger-full-access
        approval: never
    defaultPreset: danger-full-access
- id: agent-preset-registry
  name: "@xpeach/xph-agent-preset-registry"
  config:
    default: standard
    selectedDefault: ptc
- id: session-persistence-jsonl
  name: "@xpeach/xph-session-persistence-jsonl"
  config:
    root: !!js dshHomePath('sessions')
    listConcurrency: 32
`

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

function resolveShippedPatchContent(baseUrl: string | URL = import.meta.url): string {
  const candidates = [
    '../../desktop/resources/xpeach.profile.yml',
    '../../../desktop/resources/xpeach.profile.yml',
    '../../../../xpeach.profile.yml',
    '../../../../../xpeach.profile.yml',
  ]
  for (const rel of candidates) {
    try {
      const candidatePath = fileURLToPath(new URL(rel, baseUrl))
      if (existsSync(candidatePath)) return readFileSync(candidatePath, 'utf8')
    } catch (_err) {
      // Ignore unresolvable relative URLs in non-file environments and check the next candidate.
    }
  }
  return DEFAULT_XPEACH_PROFILE_PATCH
}

/**
 * Ensure the `~/.xph` home directory and `xpeach` profile exist, migrate any
 * `@deepseek-ai/dsh-*` legacy references in the profile manifest/patch, and
 * populate `XPEACH_RELAY_KEY` / `XPEACH_API_KEY` from the persisted `xpeach.key`
 * when not already set in the environment.
 * @param home - Optional explicit `XPH_HOME` override for testing.
 * @returns The resolved `xpeach` profile directory path.
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
  if (!existsSync(patchFile) || !/^\s*-/m.test(readFileSync(patchFile, 'utf8'))) {
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
