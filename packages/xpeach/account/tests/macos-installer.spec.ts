/**
 * Unit and integration coverage for the macOS native `.pkg` guided installer
 * builder, payload verifier, and direct bundle/CLI installer.
 */

import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { COVERAGE_TEST_TIMEOUT_ENV, coverageTestTimeoutOptions } from '../../../../scripts/coverage-partitions.ts'
import {
  buildMacosPkgInstaller,
  inspectMacosInstallerStatus,
  runMacosInstallerAction,
  XPeachAccount,
} from '../src/index.ts'
import {
  findBuiltElectronAppBundle,
  isNativeElectronAppBundle,
} from '../src/macos-installer.ts'

const tempRoots: string[] = []
const processTimeoutMs = coverageTestTimeoutOptions(process.env[COVERAGE_TEST_TIMEOUT_ENV]).testTimeout ?? 10_000

function makeTempSandbox(): string {
  const dir = mkdtempSync(join(tmpdir(), 'xph-macos-pkg-test-'))
  tempRoots.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of tempRoots.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function installedProfileFixture(source: 'explicit' | 'desktop' | 'repository' | 'missing' | 'none', action = 'install-direct') {
  const root = realpathSync(makeTempSandbox())
  const entry = join(root, 'macos-installer.mjs')
  mkdirSync(join(root, 'node_modules'), { recursive: true })
  symlinkSync(dirname(createRequire(import.meta.url).resolve('js-yaml/package.json')), join(root, 'node_modules', 'js-yaml'), 'junction')
  writeFileSync(entry, stripTypeScriptTypes(readFileSync(new URL('../src/macos-installer.ts', import.meta.url), 'utf8')))
  const canonical = new URL('../../../../apps/cli/resources/xpeach.profile.yml', import.meta.url)
  const copied = join(root, 'resources', 'xpeach.profile.yml')
  mkdirSync(dirname(copied), { recursive: true })
  copyFileSync(canonical, copied)
  const repositoryRoot = source === 'repository' ? join(root, 'repository') : undefined
  if (repositoryRoot !== undefined) {
    const resource = join(repositoryRoot, 'apps', 'cli', 'resources', 'xpeach.profile.yml')
    mkdirSync(dirname(resource), { recursive: true })
    copyFileSync(canonical, resource)
  }
  const options = {
    homeDir: join(root, 'home'),
    ownHome: join(root, 'home', '.xph'),
    applicationsDir: join(root, 'Applications'),
    localBinDir: join(root, 'bin'),
    outputPkgPath: join(root, 'prepared.pkg'),
    version: '0.0.13-alpha',
    repositoryRoot,
    productProfilePath: source === 'explicit' ? copied : (source === 'missing' ? join(root, 'missing.yml') : undefined),
  }
  writeFileSync(options.outputPkgPath, 'fixture')
  // 在隔离进程替代系统安装命令；不构建 pkg、不签名、不注册宿主应用。
  const driver = `
    import childProcess from 'node:child_process';
    import { syncBuiltinESMExports } from 'node:module';
    import { existsSync, readFileSync } from 'node:fs';
    const calls = [];
    childProcess.execFileSync = (command, args, options) => {
      calls.push(command);
      return options?.encoding ? 'fixture-version' : Buffer.alloc(0);
    };
    syncBuiltinESMExports();
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    ${source === 'desktop' || source === 'missing' ? `process.resourcesPath = ${JSON.stringify(dirname(copied))};` : ''}
    const installer = await import(${JSON.stringify(pathToFileURL(entry).href)});
    try {
      const result = ${action === 'build' ? 'await installer.buildMacosPkgInstaller' : `await installer.runMacosInstallerAction(${JSON.stringify(action)}, `}(${JSON.stringify(options)})${action === 'build' ? '' : ')'};
      const patch = ${JSON.stringify(join(options.ownHome, 'profiles', 'xpeach', 'cordis.patch.yml'))};
      process.stdout.write(JSON.stringify({ ok: result.ok, patch: readFileSync(patch, 'utf8') }));
    } catch (error) {
      process.stdout.write(JSON.stringify({ error: { code: error.code, path: error.path }, calls,
        profileCreated: existsSync(${JSON.stringify(join(options.ownHome, 'profiles', 'xpeach'))}) }));
    }
  `
  const result: unknown = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '--eval', driver], {
    cwd: root,
    env: {
      NODE_NO_WARNINGS: '1', HOME: options.homeDir, USERPROFILE: options.homeDir,
      XDG_CONFIG_HOME: options.homeDir, XDG_CACHE_HOME: options.homeDir, XDG_STATE_HOME: options.homeDir,
      APPDATA: options.homeDir, LOCALAPPDATA: options.homeDir, DSH_AGENTS_HOME: options.homeDir,
    },
    encoding: 'utf8',
    timeout: processTimeoutMs,
  }))
  return result
}

it.each(['explicit', 'desktop', 'repository'] as const)('安装布局从选中的规范资源播种：%s', (source) => {
  expect(installedProfileFixture(source)).toMatchObject({
    ok: true,
    patch: readFileSync(new URL('../../../../apps/cli/resources/xpeach.profile.yml', import.meta.url), 'utf8'),
  })
})

it.each(['missing', 'none'] as const)('安装布局缺少选定资源时不执行系统命令：%s', (source) => {
  expect(installedProfileFixture(source)).toMatchObject({
    error: { code: 'XPH_PROFILE_RESOURCE_UNAVAILABLE' }, calls: [], profileCreated: false,
  })
})

it('构建缺少选定资源时在创建安装载荷前失败', () => {
  expect(installedProfileFixture('missing', 'build')).toMatchObject({
    error: { code: 'XPH_PROFILE_RESOURCE_UNAVAILABLE' }, calls: [], profileCreated: false,
  })
})

describe('macOS native .pkg guided installer and CLI/Desktop bundle deployment', () => {
  it('reports initial uninstalled status inside a clean sandbox', () => {
    const sandbox = makeTempSandbox()
    const status = inspectMacosInstallerStatus({
      homeDir: sandbox,
      ownHome: join(sandbox, '.xph'),
      applicationsDir: join(sandbox, 'Applications'),
      localBinDir: join(sandbox, '.local', 'bin'),
      outputPkgPath: join(sandbox, 'out', 'XPeach-Harness-test.pkg'),
      version: '0.0.13-alpha',
    })

    expect(status.version).toBe('0.0.13-alpha')
    expect(status.pkgExists).toBe(false)
    expect(status.pkgSizeBytes).toBe(0)
    expect(status.appInstalled).toBe(false)
    expect(status.xphCliInstalled).toBe(false)
    expect('dshCliInstalled' in status).toBe(false)
    expect('dshCliPath' in status).toBe(false)
    expect(status.installedAt).toBeUndefined()
  })

  it.skipIf(process.platform !== 'darwin')(
    'builds a multi-component macOS guided .pkg archive and verifies payload files and direct installation',
    async () => {
      const sandbox = makeTempSandbox()
      const pkgPath = join(sandbox, 'installer', 'XPeach-Harness-0.0.13-alpha-mac.pkg')
      const localBinDir = join(sandbox, '.local', 'bin')
      const options = {
        homeDir: sandbox,
        ownHome: join(sandbox, '.xph'),
        applicationsDir: join(sandbox, 'Applications'),
        localBinDir,
        outputPkgPath: pkgPath,
        version: '0.0.13-alpha',
      }

      const built = await buildMacosPkgInstaller(options)
      expect(built.pkgPath).toBe(pkgPath)
      expect(existsSync(pkgPath)).toBe(true)
      expect(built.status.pkgExists).toBe(true)
      expect(built.status.pkgSizeBytes).toBeGreaterThan(1024)

      // Verify the 3 component payloads inside the product archive (xph only, no dsh)
      expect(built.verifyOutput).toContain('Applications/XPeach Harness.app/Contents/Info.plist')
      expect(built.verifyOutput).toContain('Applications/XPeach Harness.app/Contents/MacOS/XPeachHarness')
      expect(built.verifyOutput).toContain('usr/local/share/xpeach-harness/bin/xph')
      expect(built.verifyOutput).not.toContain('usr/local/share/xpeach-harness/bin/dsh')
      expect(built.verifyOutput).toContain('usr/local/share/xpeach-harness/profile/xpeach.profile.yml')

      // Seed a legacy xpeach dsh wrapper to verify install-direct removes it cleanly
      mkdirSync(localBinDir, { recursive: true })
      const legacyDshPath = join(localBinDir, 'dsh')
      writeFileSync(legacyDshPath, '#!/bin/sh\n# xpeach-harness legacy wrapper\nexit 0\n', { mode: 0o755 })
      expect(existsSync(legacyDshPath)).toBe(true)

      // Run direct installation into the sandbox and verify xph and app binaries are executable and runnable
      const installed = await runMacosInstallerAction('install-direct', options)
      expect(installed.ok).toBe(true)
      expect(installed.status.appInstalled).toBe(true)
      expect(installed.status.xphCliInstalled).toBe(true)
      expect(existsSync(legacyDshPath)).toBe(false)
      expect(installed.status.installedAt).toBeDefined()

      const appExec = join(installed.status.appPath, 'Contents', 'MacOS', 'XPeachHarness')
      expect(execFileSync(appExec, ['--version'], { encoding: 'utf8' }).trim()).toBe(
        'XPeach Harness 0.0.13-alpha',
      )
      expect(execFileSync(installed.status.xphCliPath, ['--version'], { encoding: 'utf8' }).trim()).toContain(
        'xph/0.0.13-alpha',
      )
      expect(execFileSync(installed.status.xphCliPath, ['--help'], { encoding: 'utf8' })).toContain(
        'XPeach Harness CLI',
      )

      const receipt = JSON.parse(readFileSync(installed.status.receiptPath, 'utf8')) as {
        version?: string
        appPath?: string
        dshCliPath?: string
      }
      expect(receipt.version).toBe('0.0.13-alpha')
      expect(receipt.appPath).toBe(installed.status.appPath)
      expect(receipt.dshCliPath).toBeUndefined()
      expect(readFileSync(join(sandbox, '.zshrc'), 'utf8')).toContain('# XPeach Harness CLI')
      expect(existsSync(join(sandbox, '.xph', 'profiles', 'xpeach', 'cordis.yml'))).toBe(true)
      const profileSource = readFileSync(new URL('../../../../apps/cli/resources/xpeach.profile.yml', import.meta.url))
      expect(readFileSync(join(sandbox, '.xph', 'profiles', 'xpeach', 'cordis.patch.yml'))).toEqual(profileSource)

      // share 目标路径保留，两个组件必须携带同一份 CLI 规范资源。
      const expanded = join(sandbox, 'expanded')
      execFileSync('/usr/sbin/pkgutil', ['--expand-full', pkgPath, expanded], { stdio: 'pipe' })
      for (const component of ['xpeach-app.pkg', 'xpeach-profile.pkg']) {
        expect(readFileSync(join(expanded, component, 'Payload', 'usr', 'local', 'share', 'xpeach-harness', 'profile', 'xpeach.profile.yml')))
          .toEqual(profileSource)
      }

      // Also verify XPeachAccount Remote methods delegate cleanly
      const prevXphHome = process.env.XPH_HOME
      process.env.XPH_HOME = join(sandbox, '.xph')
      try {
        const fakeAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
        const remoteStatus = fakeAccount.macosInstallerStatusOp({}, new AbortController().signal)
        expect(remoteStatus.version).toMatch(/^\d+\.\d+\.\d+/u)
        expect(remoteStatus.installedAt).toBe(installed.status.installedAt)
      } finally {
        if (prevXphHome === undefined) delete process.env.XPH_HOME
        else process.env.XPH_HOME = prevXphHome
      }
    },
  )

  it('locates built native Electron app bundles named xpeach-harness.app or XPeach Harness.app across target directories', () => {
    const repoRoot = makeTempSandbox()
    expect(findBuiltElectronAppBundle(undefined)).toBeUndefined()
    expect(findBuiltElectronAppBundle(repoRoot)).toBeUndefined()

    const unsignedArm64App = join(
      repoRoot,
      'apps',
      'desktop',
      '.desktop-build',
      'targets',
      'mac-arm64',
      'unsigned-artifacts',
      'mac-arm64',
      'xpeach-harness.app',
    )
    mkdirSync(join(unsignedArm64App, 'Contents', 'Frameworks', 'Electron Framework.framework'), {
      recursive: true,
    })
    mkdirSync(join(unsignedArm64App, 'Contents', 'MacOS'), { recursive: true })
    writeFileSync(join(unsignedArm64App, 'Contents', 'Info.plist'), '<plist/>', 'utf8')
    writeFileSync(join(unsignedArm64App, 'Contents', 'MacOS', 'xpeach-harness'), '#!/bin/sh\nexit 0\n', {
      mode: 0o755,
    })

    expect(isNativeElectronAppBundle(unsignedArm64App)).toBe(true)
    expect(findBuiltElectronAppBundle(repoRoot)).toBe(unsignedArm64App)

    const stubApp = join(repoRoot, 'Stub.app')
    mkdirSync(join(stubApp, 'Contents', 'MacOS'), { recursive: true })
    writeFileSync(join(stubApp, 'Contents', 'MacOS', 'XPeachHarness'), '#!/bin/sh\nexit 0\n', {
      mode: 0o755,
    })
    expect(isNativeElectronAppBundle(stubApp)).toBe(false)
  })
})
