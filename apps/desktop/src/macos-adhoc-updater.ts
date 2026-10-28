/** Stage and atomically replace ad-hoc signed macOS application bundles after SHA-512 verification. */

import { execFile, spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { app } from 'electron'
import type { AppUpdater, UpdateDownloadedEvent } from 'electron-updater'

const execFileAsync = promisify(execFile)

/**
 * Resolve the outermost `.app` bundle path containing the given executable path.
 * @param execPath - Executable path (`process.execPath` by default).
 * @returns Absolute `.app` directory path, or `undefined` when not running inside a macOS bundle.
 */
export function resolveMacAppBundle(execPath: string = process.execPath): string | undefined {
  let current = resolve(execPath)
  let outermost: string | undefined
  while (true) {
    if (current.endsWith('.app')) outermost = current
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return outermost
}

/**
 * Check whether the packaged updater configuration targets GitHub Releases.
 * @param resourcesPath - Packaged `process.resourcesPath` directory.
 * @returns `true` when `app-update.yml` declares `provider: github`.
 */
export function isPackagedGitHubProvider(resourcesPath: string = process.resourcesPath): boolean {
  const configPath = join(resourcesPath, 'app-update.yml')
  if (!existsSync(configPath)) return false
  try {
    const content = readFileSync(configPath, 'utf8')
    return /^\s*provider:\s*['"]?github['"]?\s*$/mu.test(content)
  } catch (_error) {
    /* Unreadable config falls back to default updater channel behavior. */
    return false
  }
}

/**
 * Determine whether a macOS `.app` bundle uses an ad-hoc signature (`identity: '-'`) without an Apple Developer Team ID.
 *
 * Squirrel.Mac enforces a CDHash designated requirement when no Apple Team ID is sealed into the binary, which rejects
 * every new version's binary even after `electron-updater` verifies its SHA-512 digest against `latest-mac.yml`.
 *
 * @param appBundlePath - Path to the `.app` bundle to inspect.
 * @returns `true` when the bundle is ad-hoc signed or lacks a TeamIdentifier.
 */
export function isAdhocSignedMacApp(appBundlePath: string | undefined = resolveMacAppBundle()): boolean {
  if (process.platform !== 'darwin' || appBundlePath === undefined || !existsSync(appBundlePath)) return false
  try {
    const result = spawnSync('/usr/bin/codesign', ['--display', '--verbose=4', appBundlePath], {
      encoding: 'utf8',
      timeout: 5_000,
    })
    const output = `${result.stdout}\n${result.stderr}`
    if (result.status !== 0) return true
    return output.includes('Signature=adhoc') || output.includes('TeamIdentifier=not set')
  } catch (_error) {
    /* Missing codesign utility treats the bundle as ad-hoc. */
    return true
  }
}

/**
 * Extract a SHA-512-verified macOS update archive into a clean staging directory and locate the `.app` bundle.
 * @param downloadedZip - Verified `.zip` archive path produced by `electron-updater`.
 * @param extractArchive - Archive extractor injectable for unit tests.
 * @returns Absolute path to the staged `.app` bundle inside its staging directory.
 */
export async function stageMacosUpdateArchive(
  downloadedZip: string,
  extractArchive: (zipPath: string, destinationDir: string) => Promise<void> = defaultExtractArchive,
): Promise<{ stagingDir: string; stagedAppPath: string }> {
  const stagingDir = join(dirname(downloadedZip), 'staged-mac-app')
  rmSync(stagingDir, { recursive: true, force: true })
  mkdirSync(stagingDir, { recursive: true })
  await extractArchive(downloadedZip, stagingDir)
  const entries = readdirSync(stagingDir)
  const appEntry = entries.find(name => name.endsWith('.app'))
  if (appEntry === undefined) {
    rmSync(stagingDir, { recursive: true, force: true })
    throw new Error(`desktop update: extracted archive ${downloadedZip} does not contain a .app bundle`)
  }
  const stagedAppPath = join(stagingDir, appEntry)
  if (!existsSync(join(stagedAppPath, 'Contents', 'Info.plist')) || !existsSync(join(stagedAppPath, 'Contents', 'MacOS'))) {
    rmSync(stagingDir, { recursive: true, force: true })
    throw new Error(`desktop update: staged bundle ${stagedAppPath} is incomplete`)
  }
  try {
    await execFileAsync('/usr/bin/xattr', ['-cr', stagedAppPath])
  } catch (_error) {
    /* Attribute stripping is best-effort when no quarantine xattrs exist. */
  }
  return { stagingDir, stagedAppPath }
}

async function defaultExtractArchive(zipPath: string, destinationDir: string): Promise<void> {
  await execFileAsync('/usr/bin/ditto', ['-x', '-k', zipPath, destinationDir])
}

/**
 * Spawn a detached shell process that waits for the current process to exit,
 * atomically swaps the `.app` bundle, and optionally relaunches it.
 * @param options - Target bundle, staged bundle, process ID to wait on, and whether to relaunch after replacement.
 */
export function spawnMacosBundleReplacement(options: {
  targetAppPath: string
  stagedAppPath: string
  stagingDir: string
  waitPid?: number
  relaunch: boolean
}): void {
  const pid = options.waitPid ?? process.pid
  const scriptPath = join(dirname(options.stagingDir), `apply-macos-update-${String(pid)}.sh`)
  const script = [
    '#!/bin/sh',
    'set -eu',
    'PID="$1"',
    'TARGET_APP="$2"',
    'STAGED_APP="$3"',
    'STAGING_DIR="$4"',
    'RELAUNCH="$5"',
    'ATTEMPTS=0',
    'while kill -0 "$PID" 2>/dev/null; do',
    '  ATTEMPTS=$((ATTEMPTS + 1))',
    '  if [ "$ATTEMPTS" -ge 300 ]; then',
    '    exit 1',
    '  fi',
    '  sleep 0.2',
    'done',
    'BACKUP_APP="${TARGET_APP}.previous-$$"',
    'rm -rf "$BACKUP_APP"',
    'if [ -d "$TARGET_APP" ]; then',
    '  mv "$TARGET_APP" "$BACKUP_APP"',
    'fi',
    'if mv "$STAGED_APP" "$TARGET_APP"; then',
    '  rm -rf "$BACKUP_APP" "$STAGING_DIR"',
    '  /usr/bin/xattr -cr "$TARGET_APP" >/dev/null 2>&1 || true',
    '  if [ "$RELAUNCH" = "1" ]; then',
    '    /usr/bin/open -n "$TARGET_APP" >/dev/null 2>&1 || true',
    '  fi',
    'else',
    '  if [ -d "$BACKUP_APP" ]; then',
    '    mv "$BACKUP_APP" "$TARGET_APP" || true',
    '  fi',
    '  exit 1',
    'fi',
    'rm -f "$0" >/dev/null 2>&1 || true',
    '',
  ].join('\n')
  writeFileSync(scriptPath, script, { mode: 0o700 })
  const child = spawn(
    '/bin/sh',
    [
      scriptPath,
      String(pid),
      options.targetAppPath,
      options.stagedAppPath,
      options.stagingDir,
      options.relaunch ? '1' : '0',
    ],
    {
      detached: true,
      stdio: 'ignore',
    },
  )
  child.unref()
}

type MacUpdaterWithHook = AppUpdater & {
  updateDownloaded?: (zipFileInfo: unknown, event: { readonly downloadedFile: string }) => Promise<string[]>
}

/**
 * Configure `MacUpdater` on ad-hoc signed macOS builds so verified `.zip` updates
 * stage and replace the `.app` bundle without Squirrel.Mac CDHash rejection.
 * @param updater - The `electron-updater` instance.
 * @param options - Optional overrides for testing.
 * @returns `true` when the ad-hoc macOS installer hook was installed.
 */
export function configureMacosAdhocUpdater(
  updater: AppUpdater,
  options: {
    targetAppPath?: string | undefined
    extractArchive?: (zipPath: string, destinationDir: string) => Promise<void>
    applyReplacement?: (params: {
      targetAppPath: string
      stagedAppPath: string
      stagingDir: string
      relaunch: boolean
    }) => void
    quitApp?: () => void
  } = {},
): boolean {
  const targetAppPath = options.targetAppPath ?? resolveMacAppBundle()
  if (targetAppPath === undefined || !isAdhocSignedMacApp(targetAppPath)) return false
  const macUpdater: MacUpdaterWithHook = updater
  if (typeof macUpdater.updateDownloaded !== 'function') return false

  let staged: { stagingDir: string; stagedAppPath: string } | undefined
  let replacementScheduled = false
  const applyReplacement = options.applyReplacement ?? spawnMacosBundleReplacement
  const quitApp = options.quitApp ?? (() => { app.quit() })

  macUpdater.updateDownloaded = async (_zipFileInfo: unknown, event: { readonly downloadedFile: string }): Promise<string[]> => {
    staged = await stageMacosUpdateArchive(event.downloadedFile, options.extractArchive)
    replacementScheduled = false
    updater.emit('update-downloaded', event as UpdateDownloadedEvent)
    return []
  }

  macUpdater.quitAndInstall = (_isSilent?: boolean, isForceRunAfter?: boolean): void => {
    if (staged === undefined) {
      updater.emit('error', new Error('desktop update: no staged macOS bundle is ready to install'))
      return
    }
    try {
      replacementScheduled = true
      applyReplacement({
        targetAppPath,
        stagedAppPath: staged.stagedAppPath,
        stagingDir: staged.stagingDir,
        relaunch: isForceRunAfter ?? true,
      })
      quitApp()
    } catch (error) {
      replacementScheduled = false
      updater.emit('error', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const maybeApp = app as { on?: (event: 'will-quit', listener: () => void) => void } | undefined
  if (typeof maybeApp?.on === 'function') {
    maybeApp.on('will-quit', () => {
      if (replacementScheduled || staged === undefined || !updater.autoInstallOnAppQuit) return
      try {
        replacementScheduled = true
        applyReplacement({
          targetAppPath,
          stagedAppPath: staged.stagedAppPath,
          stagingDir: staged.stagingDir,
          relaunch: false,
        })
      } catch (_error) {
        /* Shutdown proceeds normally if background replacement cannot be spawned. */
      }
    })
  }

  return true
}
