/** Desktop profile initialization and native recovery. */

import {
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  realpathSync,
  rmSync,
  statSync,
  closeSync,
  chmodSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { copyFileSync, cpSync } from 'node:fs'
import {
  DESKTOP_HOST_PACKAGE,
  desktopCorePackageOverrides,
  verifyDesktopCorePackageSet,
} from './core-package-set.ts'
import type { DesktopPaths } from './paths.ts'
import type { DesktopRelease } from './release.ts'
import { readDesktopRuntime } from './runtime-tree.ts'
import {
  initProfile, PROFILE_PATCH_FILENAME, PROFILE_TEMPLATES, removeLinkProjections, sanitizeProfile, type ProfileTemplate,
} from '@xpeach/xph-app-boot'

const PROJECT_NAME = 'xpeach-desktop-runtime'
const DSH_PACKAGE = '@xpeach/xph-dsh'
const CORE_BUILD_PACKAGE = '@xpeach/xph-subprocess-local'
const WEB_PROFILE = PROFILE_TEMPLATES.web as ProfileTemplate
/** XPeach product plugins loaded on top of the dsh web profile. */
export const XPEACH_PROFILE_BUNDLES = ['@xpeach/xph-account', '@xpeach/xph-client-ui'] as const
/**
 * Bundle list of the XPeach Desktop profile. The XPeach product plugins are not
 * bundles: they are host plugins inserted by the shipped product patch, which is
 * how every other client-only plugin in this repository is loaded.
 */
const XPEACH_BUNDLES = [...WEB_PROFILE.bundles]
const WORKSPACE_SETTINGS = 'nodeLinker: hoisted\nautoInstallPeers: false\n'
function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, undefined, 2)}\n`, { mode: 0o600 })
}

function workspaceFile(overrides: Readonly<Record<string, string>> = {}): string {
  const entries = Object.entries(overrides).sort(([left], [right]) => left.localeCompare(right))
  const overrideSection = entries.length === 0
    ? ''
    : `overrides:\n${entries.map(([name, spec]) => `  ${JSON.stringify(name)}: ${JSON.stringify(spec)}`).join('\n')}\n`
  if (entries.length === 0) return `packages:\n  - .\n\n${WORKSPACE_SETTINGS}`
  const coreBuildSpec = overrides[CORE_BUILD_PACKAGE]
  const coreBuildKey = coreBuildSpec === undefined
    ? CORE_BUILD_PACKAGE
    : `${CORE_BUILD_PACKAGE}@${coreBuildSpec.replace('file:./', 'file:')}`
  return `packages:\n  - .\n\n${overrideSection}${WORKSPACE_SETTINGS}allowBuilds:\n  node-pty: true\n  koffi: true\n  fs-ext: true\n  ${JSON.stringify(coreBuildKey)}: true\n  '@google/genai': false\n  protobufjs: false\n  node-addon-require-builtin: false\n`
}

function migrateProfileSettings(projectDir: string): void {
  const path = join(projectDir, 'pnpm-workspace.yaml')
  if (!existsSync(path)) return
  const legacy = `packages:\n  - .\n\n${WORKSPACE_SETTINGS}strictDepBuilds: true\nallowBuilds:\n  node-pty: true\n  koffi: true\n  fs-ext: true\n  "${CORE_BUILD_PACKAGE}": true\n  '@google/genai': false\n  protobufjs: false\n  node-addon-require-builtin: false\n`
  if (readFileSync(path, 'utf8').replaceAll('\r\n', '\n') === legacy) {
    writeFileSync(path, workspaceFile())
  }
}

/** Initializes the Desktop profile and disables third-party bundles during recovery. */
export class DesktopProjectManager {
  /**
   * @param paths - Electron-owned package state and reserved desktop profile paths.
   * @param runtime - location of the bundled application runtime.
   */
  constructor(
    readonly paths: DesktopPaths,
    readonly runtime: { readonly dsh: string },
    /** Packaged XPeach product patch seeded into a profile that has none. */
    readonly productPatch?: string,
  ) {}

  /**
   * Back up the profile patch and disable third-party bundles without loading application resources.
   * The caller must stop the Host first.
   * @returns Backup path after the locked profile write, or undefined if the patch was absent.
   */
  async disableAllPlugins(): Promise<string | undefined> {
    return this.withLock(() => {
      const backupPath = sanitizeProfile('dsh', this.paths.profile, WEB_PROFILE.bundles)
      seedProductProfilePatch(this.paths.profile, this.productPatch)
      return backupPath
    })
  }

  /**
   * Load application metadata and prepare the external plugin profile without installing packages.
   */
  async applyRelease(): Promise<void> {
    await this.withLock(() => {
      // Validation only: an unreadable or mismatched runtime descriptor stops preparation before the Host starts.
      readDesktopRuntime(this.runtime.dsh)
      migrateProfileSettings(this.paths.profile)
      createPluginProfile(this.paths.profile)
      seedProductProfilePatch(this.paths.profile, this.productPatch)
      adoptSharedSiteCredentials(this.paths.profile)
      installProductPlugins(this.paths.profile, this.runtime.dsh)
      removeLinkProjections(this.paths.profile)
    })
  }

  private async withLock<T>(operation: () => T | Promise<T>): Promise<T> {
    mkdirSync(this.paths.profile, { recursive: true, mode: 0o700 })
    const lockPath = join(realpathSync(this.paths.profile), 'lock')
    let descriptor: number
    try {
      descriptor = openSync(lockPath, 'wx', 0o600)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        const lock = lstatSync(lockPath)
        if (lock.isSymbolicLink() || !lock.isFile()) {
          throw new Error('desktop project: profile lock is not a regular file')
        }
        const owner = Number.parseInt(readFileSync(lockPath, 'utf8').trim(), 10)
        let active = !Number.isSafeInteger(owner) || owner <= 0
        if (!active) {
          try {
            process.kill(owner, 0)
            active = true
          } catch (signalError) {
            active = (signalError as NodeJS.ErrnoException).code !== 'ESRCH'
          }
        }
        if (active) throw new Error('desktop project: another profile operation is active')
        unlinkSync(lockPath)
        descriptor = openSync(lockPath, 'wx', 0o600)
      } else {
        throw error
      }
    }
    try {
      writeSync(descriptor, `${String(process.pid)}\n`)
      fsyncSync(descriptor)
      return await operation()
    } finally {
      closeSync(descriptor)
      unlinkSync(lockPath)
    }
  }
}

/** Create build-only project metadata for materializing the signed runtime. */
export function createRuntimeProjectMetadata(projectDir: string, release: DesktopRelease): void {
  mkdirSync(projectDir, { recursive: true, mode: 0o700 })
  const packageSet = verifyDesktopCorePackageSet(projectDir, release.version)
  const manifest = {
    name: PROJECT_NAME,
    private: true,
    version: '0.0.0',
    dependencies: desktopCorePackageOverrides(packageSet),
    dsh: { profile: { bundles: [...XPEACH_BUNDLES] } },
  }
  writeJson(join(projectDir, 'package.json'), manifest)
  writeFileSync(
    join(projectDir, 'pnpm-workspace.yaml'),
    workspaceFile(desktopCorePackageOverrides(packageSet)),
    { mode: 0o600 },
  )
}

/**
 * Create metadata for the unpackaged development project that links the current workspace.
 * @param projectDir - Disposable development profile directory.
 * @param release - Release identity shared by the linked CLI package and Electron shell.
 */
export function createDevelopmentProjectMetadata(projectDir: string, release: DesktopRelease): void {
  mkdirSync(projectDir, { recursive: true, mode: 0o700 })
  const manifest = {
    name: PROJECT_NAME,
    private: true,
    version: '0.0.0',
    dependencies: {
      [DSH_PACKAGE]: release.version,
      [DESKTOP_HOST_PACKAGE]: release.version,
    },
    dsh: { profile: { bundles: [...XPEACH_BUNDLES] } },
  }
  writeJson(join(projectDir, 'package.json'), manifest)
  writeFileSync(join(projectDir, 'pnpm-workspace.yaml'), workspaceFile(), { mode: 0o600 })
}

/**
 * Copy site credentials bound in the CLI profile or shared home root when the desktop profile has none yet.
 * @param profileDir - the desktop profile directory.
 */
export function adoptSharedSiteCredentials(profileDir: string): void {
  const parent = dirname(profileDir)
  const localHome = basename(parent) === 'profiles'
    ? dirname(parent)
    : (process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homedir(), '.xph'))
  if (existsSync(join(localHome, '.xpeach-signed-out'))) return
  const inTmp = resolve(profileDir).startsWith(resolve(tmpdir())) || resolve(localHome).startsWith(resolve(tmpdir()))
  const globalHome = join(homedir(), '.xph')
  if (!inTmp && existsSync(join(globalHome, '.xpeach-signed-out'))) return

  const sourceDirs = [
    localHome,
    join(localHome, 'profiles', 'xpeach-desktop'),
    join(localHome, 'profiles', 'xpeach'),
    ...(!inTmp
      ? [
        globalHome,
        join(globalHome, 'profiles', 'xpeach-desktop'),
        join(globalHome, 'profiles', 'xpeach'),
      ]
      : []),
  ]

  for (const file of [
    'xpeach.admin',
    'xpeach.key',
    'xpeach.session',
    'xpeach.sso.json',
    'xpeach.keys',
    'xpeach.token',
    'xpeach.route.json',
  ]) {
    const target = join(profileDir, file)
    if (existsSync(target)) {
      try {
        if (readFileSync(target, 'utf8').trim().length > 0) continue
      } catch (_err) { /* overwrite unreadable empty file */ }
    }
    for (const sourceDir of sourceDirs) {
      if (resolve(sourceDir) === resolve(profileDir)) continue
      const candidate = join(sourceDir, file)
      if (!existsSync(candidate)) continue
      try {
        if (readFileSync(candidate, 'utf8').trim().length === 0) continue
        mkdirSync(dirname(target), { recursive: true })
        copyFileSync(candidate, target)
        chmodSync(target, 0o600)
        break
      } catch (_error) { /* Read-only source leaves this profile unbound. */ }
    }
  }
}

/**
 * Seed the shipped XPeach product patch when the profile has no patch entries yet.
 * @param profileDir - Desktop profile directory.
 * @param source - Packaged product patch, when this build shipped one.
 */
export function seedProductProfilePatch(profileDir: string, source: string | undefined): void {
  if (source === undefined || !existsSync(source)) return
  const target = join(profileDir, PROFILE_PATCH_FILENAME)
  if (existsSync(target)) {
    // An empty placeholder patch carries no product configuration yet.
    const text = readFileSync(target, 'utf8')
    if (text.split('\n').some(line => line.trim().startsWith('-'))) return
  }
  copyFileSync(source, target)
}

/**
 * Expose the shipped XPeach plugins to the profile.
 *
 * The product patch inserts them by package name, so the profile has to be able
 * to resolve them. The runtime already carries them; linking that copy in keeps
 * the profile offline-installable and free of a package-manager round trip.
 *
 * @param profileDir - Desktop profile directory.
 * @param runtimeDir - Installed dsh package tree shipped with the app.
 */
export function installProductPlugins(profileDir: string, runtimeDir: string): void {
  const unpacked = runtimeDir.replace(/app\.asar(?=$|[\\/])/u, 'app.asar.unpacked')
  const stampPath = join(profileDir, 'node_modules', '@xpeach', '.installed-version')
  // The profile keeps its own copy of the product plugins, so an upgraded
  // application would otherwise run last version's code from the profile.
  // The version alone cannot tell two development builds apart, so the stamp
  // also carries the size and mtime of each bundled entry file.
  const versions = XPEACH_PROFILE_BUNDLES.map((name) => {
    const entry = join(unpacked === runtimeDir ? runtimeDir : unpacked, 'node_modules', name, 'lib', 'index.js')
    if (!existsSync(entry)) return ''
    const stats = statSync(entry)
    return `${stats.size}@${Math.trunc(stats.mtimeMs)}`
  })
  const stamp = versions.join(',')
  const previous = existsSync(stampPath) ? readFileSync(stampPath, 'utf8') : undefined
  // A profile with no stamp either predates this bookkeeping or is brand new. A
  // missing copy means new, so install it; an existing copy predates the stamp,
  // so leave it alone and only record the fingerprint.
  if (previous === undefined && XPEACH_PROFILE_BUNDLES.every(name => existsSync(join(profileDir, 'node_modules', name)))) {
    mkdirSync(dirname(stampPath), { recursive: true, mode: 0o700 })
    writeFileSync(stampPath, stamp, { mode: 0o600 })
    return
  }
  if (previous === stamp) return
  for (const name of XPEACH_PROFILE_BUNDLES) {
    // A packaged runtime keeps these packages unpacked; only a development
    // checkout has them as ordinary directories.
    const source = join(unpacked === runtimeDir ? runtimeDir : unpacked, 'node_modules', name)
    if (!existsSync(source)) continue
    const target = join(profileDir, 'node_modules', name)
    rmSync(target, { recursive: true, force: true })
    mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
    cpSync(source, target, { recursive: true, dereference: true, verbatimSymlinks: false })
  }
  mkdirSync(dirname(stampPath), { recursive: true, mode: 0o700 })
  writeFileSync(stampPath, stamp, { mode: 0o600 })
}

/** Create the first external plugin profile without running a package manager. */
export function createPluginProfile(projectDir: string): void {
  initProfile(projectDir, XPEACH_BUNDLES)
}
