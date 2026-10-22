import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertDesktopHostPackageFiles,
  selectDesktopPackageClosure,
  type PackedDesktopPackage,
} from '../scripts/prepare-package-set.ts'

function packed(name: string, manifest: Record<string, unknown> = {}): PackedDesktopPackage {
  return { tarball: `${name}.tgz`, manifest: { name, version: '1.0.0', ...manifest } }
}

describe('desktop package-set selection', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not select a packaging target when imported as a library', async () => {
    vi.stubEnv('DSH_DESKTOP_TARGET_PLATFORM', 'linux')
    vi.stubEnv('DSH_DESKTOP_TARGET_ARCH', 'x64')
    vi.resetModules()
    await expect(import('../scripts/prepare-package-set.ts')).resolves.toHaveProperty('prepareDesktopPackageSet')
  })

  it('includes only the available internal production closure', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@xpeach/xph-dsh', packed('@xpeach/xph-dsh', {
        dependencies: { '@xpeach/xph-base': '^1.0.0', external: '^2.0.0' },
        optionalDependencies: { '@xpeach/xph-platform-package': '1.0.0', '@xpeach/xph-missing-platform': '1.0.0' },
      })],
      ['@xpeach/xph-desktop-host', packed('@xpeach/xph-desktop-host', {
        dependencies: { '@xpeach/xph-dsh': '^1.0.0' },
      })],
      ['@xpeach/xph-account', packed('@xpeach/xph-account')],
      ['@xpeach/xph-client-ui', packed('@xpeach/xph-client-ui')],
      ['@xpeach/xph-base', packed('@xpeach/xph-base', {
        peerDependencies: { '@xpeach/xph-cordis': '^1.0.0' },
      })],
      ['@xpeach/xph-cordis', packed('@xpeach/xph-cordis')],
      ['@xpeach/xph-platform-package', packed('@xpeach/xph-platform-package')],
      ['@xpeach/xph-unused', packed('@xpeach/xph-unused')],
    ])
    expect(selectDesktopPackageClosure(available).map(entry => entry.manifest.name)).toEqual([
      '@xpeach/xph-account',
      '@xpeach/xph-base',
      '@xpeach/xph-client-ui',
      '@xpeach/xph-cordis',
      '@xpeach/xph-desktop-host',
      '@xpeach/xph-dsh',
      '@xpeach/xph-platform-package',
    ])
  })

  it.each([
    '@xpeach/xph-base', '@xpeach/xph-cordis', '@xpeach/xph-node-addon-system',
  ])('rejects required prepared package %s absent from the packed release inputs', (dependency) => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@xpeach/xph-dsh', packed('@xpeach/xph-dsh', {
        dependencies: { [dependency]: '^1.0.0' },
      })],
      ['@xpeach/xph-desktop-host', packed('@xpeach/xph-desktop-host', {
        dependencies: { '@xpeach/xph-dsh': '^1.0.0' },
      })],
    ])
    expect(() => selectDesktopPackageClosure(available)).toThrow(/unpacked package/u)
    expect(() => selectDesktopPackageClosure(new Map([
      ['@xpeach/xph-dsh', packed('@xpeach/xph-dsh')],
    ]))).toThrow(/omit @xpeach\/xph-desktop-host/u)
  })

  it('leaves independently published Office packages to npm resolution', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@xpeach/xph-dsh', packed('@xpeach/xph-dsh', {
        dependencies: {
          '@deepseek-ai/libreoffice-kit': '0.0.1',
          '@deepseek-ai/libreoffice-kit-wasm': '0.0.1',
        },
      })],
      ['@xpeach/xph-desktop-host', packed('@xpeach/xph-desktop-host')],
      ['@xpeach/xph-account', packed('@xpeach/xph-account')],
      ['@xpeach/xph-client-ui', packed('@xpeach/xph-client-ui')],
    ])
    expect(selectDesktopPackageClosure(available).map(entry => entry.manifest.name)).toEqual([
      '@xpeach/xph-account', '@xpeach/xph-client-ui', '@xpeach/xph-desktop-host', '@xpeach/xph-dsh',
    ])
  })

  it('requires both Desktop Host and public CLI entries', () => {
    const files = [
      'package/lib/index.js',
      'package/lib/cli.js',
    ]
    expect(() => {
      assertDesktopHostPackageFiles(files)
    }).not.toThrow()
    expect(() => {
      assertDesktopHostPackageFiles(files.slice(1))
    }).toThrow(/lib\/index\.js/u)
    expect(() => { assertDesktopHostPackageFiles(files.slice(0, 1)) }).toThrow(/lib\/cli\.js/u)
  })
})
