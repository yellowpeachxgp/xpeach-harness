import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import type { AppUpdater } from 'electron-updater'
import {
  buildAtomFeedFromGitHubReleases,
  compareXpeachVersions,
  desktopUpdateChannel,
  filterAtomFeedForChannel,
  isVersionEligibleForChannel,
  normalizeXpeachChannel,
  parseGitHubReleasesApiJson,
  parseXpeachVersion,
  readXpeachUpdateChannel,
  synthesizeUpdateYamlFromRelease,
} from '../src/update-channel.ts'

vi.mock('electron', () => ({ app: { isPackaged: false } }))
vi.mock('electron-updater', () => ({
  default: { autoUpdater: { autoDownload: true, autoInstallOnAppQuit: true } },
}))

const { DesktopUpdateCoordinator } = await import('../src/update-coordinator.ts')

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

it('reads the installed channel independently from the current version', () => {
  expect(desktopUpdateChannel({ version: '1.0.0', dshDesktopUpdateChannel: 'nightly' })).toBe('nightly')
  expect(desktopUpdateChannel({ version: '1.0.0', dshDesktopUpdateChannel: 'latest' })).toBe('latest')
  expect(desktopUpdateChannel({ version: '1.0.0' })).toBe('nightly')
  expect(() => desktopUpdateChannel({ dshDesktopUpdateChannel: 'beta' })).toThrow(/channel/u)
  expect(() => desktopUpdateChannel(null)).toThrow(/manifest/u)
})

it('parses XPeach versions, evaluates channel eligibility, and filters releases.atom', () => {
  expect(parseXpeachVersion('v0.0.24-least')?.channel).toBe('least')
  expect(parseXpeachVersion('0.0.24-beta')?.channel).toBe('beta')
  expect(parseXpeachVersion('0.0.24-alpha')?.channel).toBe('alpha')
  expect(normalizeXpeachChannel('latest')).toBe('least')
  expect(normalizeXpeachChannel(undefined, '0.0.24-alpha')).toBe('alpha')

  expect(isVersionEligibleForChannel('0.0.24-least', 'least')).toBe(true)
  expect(isVersionEligibleForChannel('0.0.24-beta', 'least')).toBe(false)
  expect(isVersionEligibleForChannel('0.0.24-least', 'beta')).toBe(true)
  expect(isVersionEligibleForChannel('0.0.24-beta', 'beta')).toBe(true)
  expect(isVersionEligibleForChannel('0.0.24-alpha', 'beta')).toBe(false)
  expect(isVersionEligibleForChannel('0.0.24-alpha', 'alpha')).toBe(true)

  expect(compareXpeachVersions('0.0.24-least', '0.0.24-beta')).toBe(1)
  expect(compareXpeachVersions('0.0.24-beta', '0.0.24-alpha')).toBe(1)

  const tempHome = mkdtempSync(join(tmpdir(), 'xph-desktop-channel-'))
  tempDirs.push(tempHome)
  expect(readXpeachUpdateChannel(tempHome, '0.0.24-alpha')).toBe('alpha')
  writeFileSync(join(tempHome, 'xpeach.update-channel.json'), JSON.stringify({ channel: 'least' }))
  expect(readXpeachUpdateChannel(tempHome, '0.0.24-alpha')).toBe('least')

  const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.27-alpha</id>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.27-alpha"/>
    <title>v0.0.27-alpha</title>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.24-least</id>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-least"/>
    <title>v0.0.24-least</title>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.25-beta</id>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-beta"/>
    <title>v0.0.25-beta</title>
  </entry>
</feed>`

  const filteredLeast = filterAtomFeedForChannel(atomXml, 'least')
  expect(filteredLeast).toContain('v0.0.24-least')
  expect(filteredLeast).not.toContain('v0.0.25-beta')
  expect(filteredLeast).not.toContain('v0.0.27-alpha')

  const filteredBeta = filterAtomFeedForChannel(atomXml, 'beta')
  expect(filteredBeta).toContain('v0.0.25-beta')
  expect(filteredBeta).toContain('v0.0.24-least')
  expect(filteredBeta).not.toContain('v0.0.27-alpha')
  expect(filteredBeta.indexOf('v0.0.25-beta')).toBeLessThan(filteredBeta.indexOf('v0.0.24-least'))
})

function makeMockUpdater(getCandidateVersion: () => string): AppUpdater {
  const events = new EventEmitter()
  const base: AppUpdater = Object.create(events)
  return Object.assign(base, {
    on: events.on.bind(events),
    off: events.off.bind(events),
    checkForUpdates: vi.fn(async () => ({
      isUpdateAvailable: true,
      updateInfo: { version: getCandidateVersion() },
    })),
    downloadUpdate: vi.fn(async () => []),
    quitAndInstall: vi.fn(),
    channel: 'nightly',
    allowPrerelease: true,
    allowDowngrade: false,
  })
}

it('filters ineligible releases and allows same-core channel promotions in DesktopUpdateCoordinator', async () => {
  process.env.XPEACH_SILENT_UPDATE = '0'
  let candidateVersion = '0.0.25-alpha'
  const updater = makeMockUpdater(() => candidateVersion)

  const coordinator = new DesktopUpdateCoordinator(
    state => state,
    async () => true,
    updater,
    () => true,
    () => '0.0.24-alpha',
  )
  try {
    // Subscribed to 'beta': 0.0.25-alpha is ineligible -> idle
    coordinator.setXpeachChannel('beta')
    expect(await coordinator.check()).toEqual({ phase: 'idle' })

    // Subscribed to 'beta': 0.0.24-beta is a same-core promotion over 0.0.24-alpha -> available
    candidateVersion = '0.0.24-beta'
    expect(await coordinator.check()).toEqual({ phase: 'available', version: '0.0.24-beta' })

    // Subscribed to 'least': 0.0.24-beta is ineligible -> idle
    coordinator.setXpeachChannel('least')
    expect(await coordinator.check()).toEqual({ phase: 'idle' })

    // Subscribed to 'least': 0.0.24-least is eligible -> available
    candidateVersion = '0.0.24-least'
    expect(await coordinator.check()).toEqual({ phase: 'available', version: '0.0.24-least' })
  } finally {
    coordinator.dispose()
  }
})

function buildAtomFeed(tags: readonly string[]): string {
  const entries = tags.map(tag => `  <entry>
    <id>tag:github.com,2008:Repository/1/${tag}</id>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/${tag}"/>
    <title>${tag}</title>
  </entry>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n${entries}\n</feed>`
}

function firstEntryTitle(xml: string): string | undefined {
  return /<entry\b[\s\S]*?<title>([^<]+)<\/title>/iu.exec(xml)?.[1]
}

it('verifies downward compatibility matrix (all 9 combinations + version jumps) across Atom filtering and DesktopUpdateCoordinator', async () => {
  process.env.XPEACH_SILENT_UPDATE = '0'

  // 1. least subscriber on 0.0.24-least
  {
    const events = new EventEmitter()
    let candidateVersion = '0.0.25-alpha'
    const updater = Object.assign(events, {
      checkForUpdates: vi.fn(async () => ({
        isUpdateAvailable: true,
        updateInfo: { version: candidateVersion },
      })),
      downloadUpdate: vi.fn(async () => []),
      quitAndInstall: vi.fn(),
      channel: 'nightly',
      allowPrerelease: true,
      allowDowngrade: false,
    }) as unknown as AppUpdater
    const coordinator = new DesktopUpdateCoordinator(
      state => state,
      async () => true,
      updater,
      () => true,
      () => '0.0.24-least',
    )
    try {
      coordinator.setXpeachChannel('least')
      for (const rejected of ['0.0.25-alpha', '0.0.99-alpha', '9.9.9-alpha', '0.0.25-beta', '0.0.99-beta', '9.9.9-beta']) {
        expect(isVersionEligibleForChannel(rejected, 'least')).toBe(false)
        candidateVersion = rejected
        expect(await coordinator.check()).toEqual({ phase: 'idle' })
      }
      for (const accepted of ['0.0.25-least', '0.1.0-least', '1.0.0']) {
        expect(isVersionEligibleForChannel(accepted, 'least')).toBe(true)
        candidateVersion = accepted
        expect(await coordinator.check()).toEqual({ phase: 'available', version: accepted })
      }
    } finally {
      coordinator.dispose()
    }
  }

  // 2. beta subscriber on 0.0.24-beta
  {
    const events = new EventEmitter()
    let candidateVersion = '0.0.25-alpha'
    const updater = Object.assign(events, {
      checkForUpdates: vi.fn(async () => ({
        isUpdateAvailable: true,
        updateInfo: { version: candidateVersion },
      })),
      downloadUpdate: vi.fn(async () => []),
      quitAndInstall: vi.fn(),
      channel: 'nightly',
      allowPrerelease: true,
      allowDowngrade: false,
    }) as unknown as AppUpdater
    const coordinator = new DesktopUpdateCoordinator(
      state => state,
      async () => true,
      updater,
      () => true,
      () => '0.0.24-beta',
    )
    try {
      coordinator.setXpeachChannel('beta')
      for (const rejected of ['0.0.25-alpha', '0.0.99-alpha', '9.9.9-alpha']) {
        expect(isVersionEligibleForChannel(rejected, 'beta')).toBe(false)
        candidateVersion = rejected
        expect(await coordinator.check()).toEqual({ phase: 'idle' })
      }
      for (const accepted of ['0.0.25-beta', '0.1.0-beta', '0.0.24-least', '0.1.0-least']) {
        expect(isVersionEligibleForChannel(accepted, 'beta')).toBe(true)
        candidateVersion = accepted
        expect(await coordinator.check()).toEqual({ phase: 'available', version: accepted })
      }
      // Feed with 0.0.99-alpha and 0.1.0-least filters out 0.0.99-alpha and selects v0.1.0-least first
      const filteredBetaFeed = filterAtomFeedForChannel(
        buildAtomFeed(['v0.0.99-alpha', 'v0.0.25-beta', 'v0.1.0-least']),
        'beta',
      )
      expect(filteredBetaFeed).not.toContain('v0.0.99-alpha')
      expect(firstEntryTitle(filteredBetaFeed)).toBe('v0.1.0-least')
    } finally {
      coordinator.dispose()
    }
  }

  // 3. alpha subscriber on 0.0.23-alpha
  {
    const events = new EventEmitter()
    let candidateVersion = '0.0.24-alpha'
    const updater = Object.assign(events, {
      checkForUpdates: vi.fn(async () => ({
        isUpdateAvailable: true,
        updateInfo: { version: candidateVersion },
      })),
      downloadUpdate: vi.fn(async () => []),
      quitAndInstall: vi.fn(),
      channel: 'nightly',
      allowPrerelease: true,
      allowDowngrade: false,
    }) as unknown as AppUpdater
    const coordinator = new DesktopUpdateCoordinator(
      state => state,
      async () => true,
      updater,
      () => true,
      () => '0.0.23-alpha',
    )
    try {
      coordinator.setXpeachChannel('alpha')
      for (const accepted of ['0.0.24-alpha', '0.0.24-beta', '0.0.24-least', '0.1.0-least']) {
        expect(isVersionEligibleForChannel(accepted, 'alpha')).toBe(true)
        candidateVersion = accepted
        expect(await coordinator.check()).toEqual({ phase: 'available', version: accepted })
      }

      // Same numeric core (0.0.24-alpha, 0.0.24-beta, 0.0.24-least) -> picks 0.0.24-least first
      const sameCoreFiltered = filterAtomFeedForChannel(
        buildAtomFeed(['v0.0.24-alpha', 'v0.0.24-beta', 'v0.0.24-least']),
        'alpha',
      )
      expect(firstEntryTitle(sameCoreFiltered)).toBe('v0.0.24-least')

      // 0.0.25-alpha vs 0.0.24-least -> picks 0.0.25-alpha first
      const higherPatchFiltered = filterAtomFeedForChannel(
        buildAtomFeed(['v0.0.24-least', 'v0.0.25-alpha']),
        'alpha',
      )
      expect(firstEntryTitle(higherPatchFiltered)).toBe('v0.0.25-alpha')

      // 0.1.0-least vs 0.0.25-alpha -> picks 0.1.0-least first
      const minorLeastFiltered = filterAtomFeedForChannel(
        buildAtomFeed(['v0.0.25-alpha', 'v0.1.0-least']),
        'alpha',
      )
      expect(firstEntryTitle(minorLeastFiltered)).toBe('v0.1.0-least')
    } finally {
      coordinator.dispose()
    }
  }
})

it('handles corrupt preference files, non-semver Atom tags, and non-https Atom <link> entries safely', () => {
  const tempHome = mkdtempSync(join(tmpdir(), 'xph-desktop-adversarial-'))
  tempDirs.push(tempHome)
  const prefFile = join(tempHome, 'xpeach.update-channel.json')

  for (const corrupt of ['{corrupt json', '', 'null', '[]', '{"channel": 999}']) {
    writeFileSync(prefFile, corrupt, 'utf8')
    expect(() => readXpeachUpdateChannel(tempHome, '0.0.24-least')).not.toThrow()
    expect(readXpeachUpdateChannel(tempHome, '0.0.24-least')).toBe('least')
  }

  const adversarialAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>tag:github.com,2008:Repository/1/docs-v1</id>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/docs-v1"/>
    <title>docs-v1</title>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1/v1.0</id>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v1.0"/>
    <title>v1.0</title>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1/invalid-tag</id>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/invalid-tag"/>
    <title>invalid-tag</title>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.26-least</id>
    <link rel="alternate" type="text/html" href="http://insecure.example.com/releases/tag/v0.0.26-least"/>
    <title>v0.0.26-least</title>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.27-least</id>
    <link rel="alternate" type="text/html" href="javascript:alert(1)"/>
    <title>v0.0.27-least</title>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.25-least</id>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-least"/>
    <title>v0.0.25-least</title>
  </entry>
</feed>`

  const filtered = filterAtomFeedForChannel(adversarialAtom, 'least')
  expect(filtered).not.toContain('docs-v1')
  expect(filtered).not.toContain('v1.0')
  expect(filtered).not.toContain('invalid-tag')
  expect(filtered).not.toContain('v0.0.26-least')
  expect(filtered).not.toContain('v0.0.27-least')
  expect(filtered).toContain('v0.0.25-least')
})

it('parses GitHub Releases REST API payloads and synthesizes platform update descriptors without static .yml assets', () => {
  const apiPayload = [
    {
      tag_name: 'v0.0.25-beta',
      name: 'XPeach Harness v0.0.25-beta',
      draft: false,
      body: 'Beta release notes',
      published_at: '2026-10-30T18:42:38Z',
      assets: [
        {
          name: 'macos-xpeach-harness-0.0.25-beta-arm64-unsigned.dmg',
          size: 267599180,
          digest: 'sha256:81db8eac0f3e3354d6d5cf1ff2fd23a66b5e83e45cde45fc005e5ab5f1d23878',
          browser_download_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/download/v0.0.25-beta/macos-xpeach-harness-0.0.25-beta-arm64-unsigned.dmg',
        },
        {
          name: 'macos-xpeach-harness-0.0.25-beta-arm64-unsigned.zip',
          size: 355613923,
          digest: 'sha256:d42ae7055ad8d4ce95aba311f7ea2bf27a5c8ac0e0f4714fd2dc9d92e15feb81',
          browser_download_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/download/v0.0.25-beta/macos-xpeach-harness-0.0.25-beta-arm64-unsigned.zip',
        },
        {
          name: 'windows-xpeach-harness-0.0.25-beta-x64-unsigned.exe',
          size: 293889353,
          digest: 'sha256:d674aba78d141eadfdaf9fc53389448c9cd24b0f1fb3ae045ccbbd50c9e489af',
          browser_download_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/download/v0.0.25-beta/windows-xpeach-harness-0.0.25-beta-x64-unsigned.exe',
        },
        {
          name: 'linux-xpeach-harness-0.0.25-beta-x86_64-unsigned.AppImage',
          size: 361270757,
          digest: 'sha256:766a886a4d0536dd7c6889d623308625b50779cd97622066907092471bc1daf6',
          browser_download_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/download/v0.0.25-beta/linux-xpeach-harness-0.0.25-beta-x86_64-unsigned.AppImage',
        },
      ],
    },
  ]

  const parsed = parseGitHubReleasesApiJson(JSON.stringify(apiPayload))
  expect(parsed).toHaveLength(1)
  const release = parsed[0]!
  expect(release.version).toBe('0.0.25-beta')
  expect(release.channel).toBe('beta')
  expect(release.assets).toHaveLength(4)

  const atomForBeta = buildAtomFeedFromGitHubReleases(parsed, 'beta')
  expect(atomForBeta).toContain('releases/tag/v0.0.25-beta')

  const atomForLeast = buildAtomFeedFromGitHubReleases(parsed, 'least')
  expect(atomForLeast).not.toContain('releases/tag/v0.0.25-beta')

  const macYaml = synthesizeUpdateYamlFromRelease(release, 'beta-mac.yml')
  expect(macYaml).toContain('path: "macos-xpeach-harness-0.0.25-beta-arm64-unsigned.zip"')
  expect(macYaml).toContain('sha2: d42ae7055ad8d4ce95aba311f7ea2bf27a5c8ac0e0f4714fd2dc9d92e15feb81')

  const winYaml = synthesizeUpdateYamlFromRelease(release, 'beta.yml')
  expect(winYaml).toContain('path: "windows-xpeach-harness-0.0.25-beta-x64-unsigned.exe"')
  expect(winYaml).toContain('sha2: d674aba78d141eadfdaf9fc53389448c9cd24b0f1fb3ae045ccbbd50c9e489af')

  const linuxYaml = synthesizeUpdateYamlFromRelease(release, 'beta-linux.yml')
  expect(linuxYaml).toContain('path: "linux-xpeach-harness-0.0.25-beta-x86_64-unsigned.AppImage"')
  expect(linuxYaml).toContain('sha2: 766a886a4d0536dd7c6889d623308625b50779cd97622066907092471bc1daf6')
})
