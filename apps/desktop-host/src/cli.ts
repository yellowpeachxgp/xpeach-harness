/** Public xph / dsh commands using the immutable runtime carried by the Desktop installation. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'
import * as yaml from 'js-yaml'
import { runCli } from '@xpeach/xph-dsh/lib/bin.js'
import { loadOptionalPatches } from '@xpeach/xph-app-boot'
import { installOfficeEngineResolution, runtimeArchivePath } from './office-engine.ts'

const HELP_OR_VERSION_FLAGS = new Set(['-h', '--help', '-V', '--version'])
const POSITIONAL_PROFILES = new Set(['headless', 'acp', 'sdk'])
const productPatchSchema = yaml.JSON_SCHEMA.extend(new yaml.Type('tag:yaml.org,2002:js', {
  kind: 'scalar', resolve: (expression: unknown) => typeof expression === 'string',
  construct: (expression: string) => expression,
}))

/**
 * Normalize raw Desktop CLI arguments using `xph` profile rules.
 * @param rawArgs - Arguments following the executable and script path (`process.argv.slice(2)`).
 * @returns Normalized argument array for `runCli`.
 */
export function normalizeDesktopXphArgv(rawArgs: readonly string[]): string[] {
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

function bootstrapDesktopXpeachHome(runtimeDir: string): void {
  process.env.XPH_PRODUCT ??= '1'
  const xphHome = process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homedir(), '.xph')
  process.env.XPH_HOME ??= xphHome
  process.env.DSH_HOME ??= xphHome

  const xphProfile = join(xphHome, 'profiles', 'xpeach')
  const patchFile = join(xphProfile, 'cordis.patch.yml')
  const currentPatch = existsSync(patchFile) ? readFileSync(patchFile, 'utf8') : ''
  const parsed: unknown = yaml.load(currentPatch, { schema: productPatchSchema, filename: patchFile })
  if (parsed === undefined || parsed === null || (loadOptionalPatches('xph', patchFile)?.length ?? 0) === 0) {
    const resource = join(runtimeDir, 'node_modules', '@xpeach', 'xph-dsh', 'resources', 'xpeach.profile.yml')
    let content: string
    try {
      content = readFileSync(resource, 'utf8')
    } catch (cause) {
      throw Object.assign(new Error('xph：无法读取随包产品补丁，请重新安装完整的桌面应用。', { cause }), {
        code: 'XPH_PROFILE_RESOURCE_UNAVAILABLE',
        path: resource,
      })
    }
    mkdirSync(xphProfile, { recursive: true })
    writeFileSync(patchFile, content)
  }

  if (!process.env.XPEACH_RELAY_KEY) {
    const keyCandidates = [
      join(xphProfile, 'xpeach.key'),
      join(xphHome, 'profiles', 'xpeach-desktop', 'xpeach.key'),
    ]
    for (const keyPath of keyCandidates) {
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
        // Ignore unreadable key files; unauthenticated runs prompt for login.
      }
    }
  }
}

/**
 * Run the ordinary CLI with Desktop's bundled package manager and reserved-profile plugin access.
 * @param runtimeDir - Prepared or ASAR-contained production DSH package tree.
 * @param supportDir - Physical Desktop runtime directory containing the primary-runtime payload and Node launchers.
 * @returns Completion of the selected CLI command; profile plugins own their process lifetime.
 */
export async function runDesktopCli(runtimeDir: string, supportDir: string): Promise<void> {
  bootstrapDesktopXpeachHome(runtimeDir)
  if (process.argv.length > 2) {
    process.argv = [
      process.argv[0] ?? process.execPath,
      process.argv[1] ?? '',
      ...normalizeDesktopXphArgv(process.argv.slice(2)),
    ]
  }
  installOfficeEngineResolution(runtimeDir)
  await runCli({
    manageDesktopProfile: true,
    packageManager: {
      command: process.execPath,
      args: ['--expose-internals', join(supportDir, 'primary-runtime', 'dependencies', 'pnpm', 'bin', 'pnpm.mjs')],
      env: {
        ELECTRON_RUN_AS_NODE: '1',
        DSH_DESKTOP_NODE_EXECUTABLE: process.execPath,
        PATH: `${join(supportDir, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    },
  })
}

if (import.meta.main) {
  if (process.platform === 'win32') {
    const { installWindowsCliSignals } = await import('./windows-cli-signals.ts')
    await installWindowsCliSignals()
  }
  if (process.argv.length <= 2) {
    process.argv = [
      process.argv[0] ?? process.execPath,
      process.argv[1] ?? '',
      ...normalizeDesktopXphArgv([]),
    ]
  }
  const runtimeDir = resolve(import.meta.dirname, '../../../..')
  await runDesktopCli(runtimeDir, join(dirname(runtimeArchivePath(runtimeDir) ?? runtimeDir), 'runtime'))
}
