/**
 * Unit and integration coverage for the macOS native `.pkg` guided installer
 * builder, payload verifier, and direct bundle/CLI installer.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  buildMacosPkgInstaller,
  inspectMacosInstallerStatus,
  runMacosInstallerAction,
  XPeachAccount,
} from '../src/index.ts'

const tempRoots: string[] = []

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
})
