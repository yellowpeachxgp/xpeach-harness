/**
 * Unit coverage for XPeach release channel recognition, downward-compatible
 * version eligibility, GitHub Releases REST/Atom parsing, preference persistence,
 * and `XPeachAccount` update channel Remote endpoints.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  XPEACH_CHANNEL_RANK,
  XPeachAccount,
  compatibleReleaseChannels,
  compareXpeachVersions,
  isVersionEligibleForChannel,
  normalizeXpeachChannel,
  parseGitHubReleasesAtom,
  parseGitHubReleasesJson,
  parseXpeachVersion,
  readXpeachUpdatePreference,
  selectBestUpdateForChannel,
  writeXpeachUpdatePreference,
  type XPeachReleaseCandidate,
} from '../src/index.ts'

const tempDirs: string[] = []

function makeTempHome(): string {
  const dir = mkdtempSync(join(tmpdir(), 'xph-update-channel-test-'))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('XPeach version parsing and channel normalization', () => {
  it('parses versions and tags across least, beta, and alpha channels', () => {
    expect(parseXpeachVersion('v0.0.24-least')).toEqual({
      raw: 'v0.0.24-least',
      version: '0.0.24-least',
      major: 0,
      minor: 0,
      patch: 24,
      channel: 'least',
      preNumber: 0,
    })
    expect(parseXpeachVersion('0.0.24')).toMatchObject({
      version: '0.0.24',
      channel: 'least',
      preNumber: 0,
    })
    expect(parseXpeachVersion('V0.0.24-beta.2')).toMatchObject({
      version: '0.0.24-beta.2',
      channel: 'beta',
      preNumber: 2,
    })
    expect(parseXpeachVersion('0.0.24-rc.1')).toMatchObject({
      version: '0.0.24-rc.1',
      channel: 'beta',
      preNumber: 1,
    })
    expect(parseXpeachVersion('0.0.24-alpha.5')).toMatchObject({
      version: '0.0.24-alpha.5',
      channel: 'alpha',
      preNumber: 5,
    })
    expect(parseXpeachVersion('not-a-version')).toBeNull()
  })

  it('normalizes channel aliases and falls back to fallbackVersion or beta', () => {
    expect(normalizeXpeachChannel('least')).toBe('least')
    expect(normalizeXpeachChannel('LATEST')).toBe('least')
    expect(normalizeXpeachChannel('stable')).toBe('least')
    expect(normalizeXpeachChannel('main')).toBe('least')
    expect(normalizeXpeachChannel('release')).toBe('least')

    expect(normalizeXpeachChannel('beta')).toBe('beta')
    expect(normalizeXpeachChannel('rc')).toBe('beta')
    expect(normalizeXpeachChannel('next')).toBe('beta')

    expect(normalizeXpeachChannel('alpha')).toBe('alpha')
    expect(normalizeXpeachChannel('nightly')).toBe('alpha')
    expect(normalizeXpeachChannel('canary')).toBe('alpha')

    expect(normalizeXpeachChannel(undefined, '0.0.24-least')).toBe('least')
    expect(normalizeXpeachChannel('unknown', '0.0.24-alpha')).toBe('alpha')
    expect(normalizeXpeachChannel(undefined)).toBe('beta')
  })

  it('enforces downward-compatible channel eligibility rules', () => {
    expect(XPEACH_CHANNEL_RANK).toEqual({ alpha: 1, beta: 2, least: 3 })
    expect(compatibleReleaseChannels('least')).toEqual(['least'])
    expect(compatibleReleaseChannels('beta')).toEqual(['beta', 'least'])
    expect(compatibleReleaseChannels('alpha')).toEqual(['alpha', 'beta', 'least'])

    // least user only receives least updates
    expect(isVersionEligibleForChannel('0.0.24-least', 'least')).toBe(true)
    expect(isVersionEligibleForChannel('0.0.24', 'least')).toBe(true)
    expect(isVersionEligibleForChannel('0.0.24-beta', 'least')).toBe(false)
    expect(isVersionEligibleForChannel('0.0.24-alpha', 'least')).toBe(false)

    // beta user receives beta and least updates (never alpha)
    expect(isVersionEligibleForChannel('0.0.24-least', 'beta')).toBe(true)
    expect(isVersionEligibleForChannel('0.0.24-beta', 'beta')).toBe(true)
    expect(isVersionEligibleForChannel('0.0.24-alpha', 'beta')).toBe(false)

    // alpha user receives alpha, beta, and least updates
    expect(isVersionEligibleForChannel('0.0.24-least', 'alpha')).toBe(true)
    expect(isVersionEligibleForChannel('0.0.24-beta', 'alpha')).toBe(true)
    expect(isVersionEligibleForChannel('0.0.24-alpha', 'alpha')).toBe(true)
    expect(isVersionEligibleForChannel('invalid', 'alpha')).toBe(false)
  })

  it('orders versions by semver core, then channel stability rank, then preNumber', () => {
    expect(compareXpeachVersions('0.0.25-alpha', '0.0.24-least')).toBe(1)
    expect(compareXpeachVersions('0.0.24-least', '0.0.24-beta')).toBe(1)
    expect(compareXpeachVersions('0.0.24-beta', '0.0.24-alpha')).toBe(1)
    expect(compareXpeachVersions('0.0.24-beta.2', '0.0.24-beta.1')).toBe(1)
    expect(compareXpeachVersions('0.0.24-beta', '0.0.24-beta')).toBe(0)
    expect(compareXpeachVersions('0.0.23-least', '0.0.24-alpha')).toBe(-1)
  })
})

describe('selectBestUpdateForChannel and preference persistence', () => {
  const sampleReleases: readonly XPeachReleaseCandidate[] = [
    {
      version: '0.0.27-alpha',
      tag: 'v0.0.27-alpha',
      channel: 'alpha',
      releaseUrl: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.27-alpha',
      releaseNotes: 'Alpha 26 build',
      publishedAt: '2026-10-30T12:00:00Z',
    },
    {
      version: '0.0.25-beta',
      tag: 'v0.0.25-beta',
      channel: 'beta',
      releaseUrl: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-beta',
      releaseNotes: 'Beta 25 build',
      publishedAt: '2026-10-29T12:00:00Z',
    },
    {
      version: '0.0.24-least',
      tag: 'v0.0.24-least',
      channel: 'least',
      releaseUrl: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-least',
      releaseNotes: 'Least 24 build',
      publishedAt: '2026-10-28T12:00:00Z',
    },
  ]

  it('selects the highest eligible version for each subscribed channel', () => {
    const forLeast = selectBestUpdateForChannel(sampleReleases, '0.0.23-least', 'least')
    expect(forLeast.updateAvailable).toBe(true)
    expect(forLeast.targetVersion).toBe('0.0.24-least')
    expect(forLeast.targetChannel).toBe('least')

    const forBeta = selectBestUpdateForChannel(sampleReleases, '0.0.24-least', 'beta')
    expect(forBeta.updateAvailable).toBe(true)
    expect(forBeta.targetVersion).toBe('0.0.25-beta')
    expect(forBeta.targetChannel).toBe('beta')

    const forAlpha = selectBestUpdateForChannel(sampleReleases, '0.0.25-beta', 'alpha')
    expect(forAlpha.updateAvailable).toBe(true)
    expect(forAlpha.targetVersion).toBe('0.0.27-alpha')
    expect(forAlpha.targetChannel).toBe('alpha')

    // Same-core channel promotion: 0.0.24-alpha -> 0.0.24-least on least channel
    const promotion = selectBestUpdateForChannel(sampleReleases, '0.0.24-alpha', 'least')
    expect(promotion.updateAvailable).toBe(true)
    expect(promotion.targetVersion).toBe('0.0.24-least')

    // Up to date on least when 0.0.24-least is already installed (ignores 0.0.25-beta and 0.0.27-alpha)
    const upToDate = selectBestUpdateForChannel(sampleReleases, '0.0.24-least', 'least')
    expect(upToDate.updateAvailable).toBe(false)
    expect(upToDate.targetVersion).toBeUndefined()
  })

  it('persists and reads ~/.xph/xpeach.update-channel.json', () => {
    const home = makeTempHome()
    const initial = readXpeachUpdatePreference(home, '0.0.23-alpha')
    expect(initial.channel).toBe('alpha')
    expect(initial.autoCheckUpdate).toBe(true)

    const saved = writeXpeachUpdatePreference({ channel: 'least', autoCheckUpdate: false }, home)
    expect(saved.channel).toBe('least')
    expect(saved.autoCheckUpdate).toBe(false)

    const reloaded = readXpeachUpdatePreference(home, '0.0.23-alpha')
    expect(reloaded.channel).toBe('least')
    expect(reloaded.autoCheckUpdate).toBe(false)
  })
})

describe('GitHub Releases Atom and REST parsers and XPeachAccount Remote methods', () => {
  const sampleAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.25-alpha</id>
    <updated>2026-10-30T10:00:00Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-alpha"/>
    <title>v0.0.25-alpha</title>
    <content type="html">&lt;p&gt;Alpha release notes&lt;/p&gt;</content>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.24-beta</id>
    <updated>2026-10-29T10:00:00Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-beta"/>
    <title>v0.0.24-beta</title>
    <content type="html">&lt;p&gt;Beta release notes&lt;/p&gt;</content>
  </entry>
</feed>`

  it('parses GitHub releases.atom XML feed entries', () => {
    const parsed = parseGitHubReleasesAtom(sampleAtom)
    expect(parsed).toEqual([
      {
        version: '0.0.25-alpha',
        tag: 'v0.0.25-alpha',
        channel: 'alpha',
        releaseUrl: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-alpha',
        releaseNotes: 'Alpha release notes',
        publishedAt: '2026-10-30T10:00:00Z',
      },
      {
        version: '0.0.24-beta',
        tag: 'v0.0.24-beta',
        channel: 'beta',
        releaseUrl: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-beta',
        releaseNotes: 'Beta release notes',
        publishedAt: '2026-10-29T10:00:00Z',
      },
    ])
  })

  it('parses GitHub REST releases JSON and skips draft entries', () => {
    const parsed = parseGitHubReleasesJson([
      {
        tag_name: 'v0.0.25-least',
        draft: false,
        html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-least',
        body: 'Stable release',
        published_at: '2026-10-30T11:00:00Z',
        assets: [
          {
            name: 'XPeach-Harness-0.0.25-least-mac-arm64.dmg',
            browser_download_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/download/v0.0.25-least/XPeach-Harness-0.0.25-least-mac-arm64.dmg',
          },
        ],
      },
      {
        tag_name: 'v0.0.27-alpha',
        draft: true,
      },
    ])
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({
      version: '0.0.25-least',
      channel: 'least',
      releaseNotes: 'Stable release',
    })
  })

  it('supports updateChannelStatus, setUpdateChannel, and checkUpdate via GitHub Releases REST API on XPeachAccount', async () => {
    const home = makeTempHome()
    vi.stubEnv('XPH_HOME', home)
    vi.stubEnv('XPEACH_VERSION', '0.0.23-beta')

    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    const status = account.updateChannelStatus({})
    expect(status).toEqual({
      currentVersion: '0.0.23-beta',
      currentChannel: 'beta',
      subscribedChannel: 'beta',
      autoCheckUpdate: true,
      compatibleChannels: ['beta', 'least'],
    })

    const updated = account.setUpdateChannel({ channel: 'beta', autoCheckUpdate: false })
    expect(updated.subscribedChannel).toBe('beta')
    expect(updated.autoCheckUpdate).toBe(false)

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify([
          {
            tag_name: 'v0.0.25-alpha',
            html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-alpha',
            draft: false,
            body: 'Alpha build',
            published_at: '2026-10-30T14:00:00Z',
          },
          {
            tag_name: 'v0.0.24-beta',
            html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-beta',
            draft: false,
            body: 'Beta build',
            published_at: '2026-10-30T13:00:00Z',
            assets: [
              {
                name: 'macos-xpeach-harness-0.0.24-beta-arm64-unsigned.dmg',
                size: 267599180,
                digest: 'sha256:81db8eac0f3e3354d6d5cf1ff2fd23a66b5e83e45cde45fc005e5ab5f1d23878',
                browser_download_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/download/v0.0.24-beta/macos-xpeach-harness-0.0.24-beta-arm64-unsigned.dmg',
              },
            ],
          },
        ]),
        { status: 200 },
      )
    })

    const checked = await account.checkUpdate({ force: true })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(checked.updateAvailable).toBe(true)
    // Subscribed to 'beta': skips 0.0.25-alpha and picks 0.0.24-beta!
    expect(checked.targetVersion).toBe('0.0.24-beta')
    expect(checked.targetChannel).toBe('beta')
    expect(checked.assets).toEqual([
      {
        name: 'macos-xpeach-harness-0.0.24-beta-arm64-unsigned.dmg',
        size: 267599180,
        sha256: '81db8eac0f3e3354d6d5cf1ff2fd23a66b5e83e45cde45fc005e5ab5f1d23878',
        browserDownloadUrl: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/download/v0.0.24-beta/macos-xpeach-harness-0.0.24-beta-arm64-unsigned.dmg',
      },
    ])
  })
})

function makeRelease(version: string): XPeachReleaseCandidate {
  const parsed = parseXpeachVersion(version)!
  return {
    version: parsed.version,
    tag: `v${parsed.version}`,
    channel: parsed.channel,
    releaseUrl: `https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v${parsed.version}`,
  }
}

describe('exhaustive downward compatibility matrix (all 9 combinations + version jumps)', () => {
  it('verifies least subscriber on 0.0.24-least rejects alpha/beta and accepts least/stable jumps', () => {
    const current = '0.0.24-least'

    // Rejects alpha releases regardless of numeric version jump
    for (const alphaVer of ['0.0.25-alpha', '0.0.99-alpha', '9.9.9-alpha']) {
      expect(isVersionEligibleForChannel(alphaVer, 'least')).toBe(false)
      const res = selectBestUpdateForChannel([makeRelease(alphaVer)], current, 'least')
      expect(res.updateAvailable).toBe(false)
      expect(res.targetVersion).toBeUndefined()
    }

    // Rejects beta releases regardless of numeric version jump
    for (const betaVer of ['0.0.25-beta', '0.0.99-beta', '9.9.9-beta']) {
      expect(isVersionEligibleForChannel(betaVer, 'least')).toBe(false)
      const res = selectBestUpdateForChannel([makeRelease(betaVer)], current, 'least')
      expect(res.updateAvailable).toBe(false)
      expect(res.targetVersion).toBeUndefined()
    }

    // Accepts least and bare stable releases across patch, minor, and major jumps
    for (const leastVer of ['0.0.25-least', '0.1.0-least', '1.0.0']) {
      expect(isVersionEligibleForChannel(leastVer, 'least')).toBe(true)
      const res = selectBestUpdateForChannel([makeRelease(leastVer)], current, 'least')
      expect(res.updateAvailable).toBe(true)
      expect(res.targetVersion).toBe(leastVer)
      expect(res.targetChannel).toBe('least')
    }
  })

  it('verifies beta subscriber on 0.0.24-beta rejects alpha and accepts beta, same-core least promotion, and major/minor least', () => {
    const current = '0.0.24-beta'

    // Rejects alpha releases regardless of numeric version jump
    for (const alphaVer of ['0.0.25-alpha', '0.0.99-alpha', '9.9.9-alpha']) {
      expect(isVersionEligibleForChannel(alphaVer, 'beta')).toBe(false)
      const res = selectBestUpdateForChannel([makeRelease(alphaVer)], current, 'beta')
      expect(res.updateAvailable).toBe(false)
      expect(res.targetVersion).toBeUndefined()
    }

    // Accepts beta releases across patch and minor jumps
    for (const betaVer of ['0.0.25-beta', '0.1.0-beta']) {
      expect(isVersionEligibleForChannel(betaVer, 'beta')).toBe(true)
      const res = selectBestUpdateForChannel([makeRelease(betaVer)], current, 'beta')
      expect(res.updateAvailable).toBe(true)
      expect(res.targetVersion).toBe(betaVer)
      expect(res.targetChannel).toBe('beta')
    }

    // Accepts same-core promotion 0.0.24-least (0.0.24-least > 0.0.24-beta)
    expect(compareXpeachVersions('0.0.24-least', '0.0.24-beta')).toBe(1)
    const sameCorePromo = selectBestUpdateForChannel([makeRelease('0.0.24-least')], current, 'beta')
    expect(sameCorePromo.updateAvailable).toBe(true)
    expect(sameCorePromo.targetVersion).toBe('0.0.24-least')
    expect(sameCorePromo.targetChannel).toBe('least')

    // Accepts major/minor stable update 0.1.0-least even if 0.0.99-alpha and 9.9.9-alpha also exist in the feed
    const mixedFeed = [
      makeRelease('9.9.9-alpha'),
      makeRelease('0.0.99-alpha'),
      makeRelease('0.1.0-least'),
      makeRelease('0.0.25-beta'),
    ]
    const majorMinorStable = selectBestUpdateForChannel(mixedFeed, current, 'beta')
    expect(majorMinorStable.updateAvailable).toBe(true)
    expect(majorMinorStable.targetVersion).toBe('0.1.0-least')
    expect(majorMinorStable.targetChannel).toBe('least')
  })

  it('verifies alpha subscriber on 0.0.23-alpha accepts all channels and orders by numeric core then stability rank', () => {
    const current = '0.0.23-alpha'

    // Accepts 0.0.24-alpha, 0.0.24-beta, 0.0.24-least, 0.1.0-least individually
    for (const ver of ['0.0.24-alpha', '0.0.24-beta', '0.0.24-least', '0.1.0-least']) {
      expect(isVersionEligibleForChannel(ver, 'alpha')).toBe(true)
      const res = selectBestUpdateForChannel([makeRelease(ver)], current, 'alpha')
      expect(res.updateAvailable).toBe(true)
      expect(res.targetVersion).toBe(ver)
    }

    // When 0.0.24-alpha, 0.0.24-beta, and 0.0.24-least all exist, picks 0.0.24-least (highest stability rank for same numeric core)
    const sameCoreAllChannels = [
      makeRelease('0.0.24-alpha'),
      makeRelease('0.0.24-beta'),
      makeRelease('0.0.24-least'),
    ]
    const pickedSameCore = selectBestUpdateForChannel(sameCoreAllChannels, current, 'alpha')
    expect(pickedSameCore.updateAvailable).toBe(true)
    expect(pickedSameCore.targetVersion).toBe('0.0.24-least')
    expect(pickedSameCore.targetChannel).toBe('least')

    // When 0.0.25-alpha and 0.0.24-least both exist, picks 0.0.25-alpha (higher numeric core)
    const higherNumericAlpha = [
      makeRelease('0.0.24-least'),
      makeRelease('0.0.25-alpha'),
    ]
    const pickedHigherNumeric = selectBestUpdateForChannel(higherNumericAlpha, current, 'alpha')
    expect(pickedHigherNumeric.updateAvailable).toBe(true)
    expect(pickedHigherNumeric.targetVersion).toBe('0.0.25-alpha')
    expect(pickedHigherNumeric.targetChannel).toBe('alpha')

    // When 0.1.0-least and 0.0.25-alpha both exist, picks 0.1.0-least (alpha receives least major/minor updates)
    const minorLeastVsPatchAlpha = [
      makeRelease('0.0.25-alpha'),
      makeRelease('0.1.0-least'),
    ]
    const pickedMinorLeast = selectBestUpdateForChannel(minorLeastVsPatchAlpha, current, 'alpha')
    expect(pickedMinorLeast.updateAvailable).toBe(true)
    expect(pickedMinorLeast.targetVersion).toBe('0.1.0-least')
    expect(pickedMinorLeast.targetChannel).toBe('least')
  })
})

describe('adversarial and malformed inputs', () => {
  it('falls back gracefully without throwing when ~/.xph/xpeach.update-channel.json contains corrupt JSON', () => {
    const home = makeTempHome()
    const prefPath = join(home, 'xpeach.update-channel.json')

    for (const corruptPayload of ['{corrupt json', '', 'null', '[]', '123', '{"channel": 42, "autoCheckUpdate": "yes"}']) {
      writeFileSync(prefPath, corruptPayload, 'utf8')
      expect(() => readXpeachUpdatePreference(home, '0.0.24-least')).not.toThrow()
      const pref = readXpeachUpdatePreference(home, '0.0.24-least')
      expect(pref.channel).toBe('least')
      expect(pref.autoCheckUpdate).toBe(true)
    }
  })

  it('ignores non-semver tags (docs-v1, v1.0, invalid-tag) and draft releases in REST JSON and releases.atom', () => {
    const restCandidates = parseGitHubReleasesJson([
      { tag_name: 'docs-v1', draft: false, html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/docs-v1' },
      { tag_name: 'v1.0', draft: false, html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v1.0' },
      { tag_name: 'invalid-tag', draft: false, html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/invalid-tag' },
      { tag_name: 'v0.0.25-least', draft: true, html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-least' },
      { tag_name: 'v0.0.24-least', draft: false, html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-least' },
    ])
    expect(restCandidates).toHaveLength(1)
    expect(restCandidates[0]?.version).toBe('0.0.24-least')

    const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
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
    <id>tag:github.com,2008:Repository/1/v0.0.24-least</id>
    <link rel="alternate" type="text/html" href="https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-least"/>
    <title>v0.0.24-least</title>
  </entry>
</feed>`
    const atomCandidates = parseGitHubReleasesAtom(atomXml)
    expect(atomCandidates).toHaveLength(1)
    expect(atomCandidates[0]?.version).toBe('0.0.24-least')
  })

  it('sanitizes or rejects non-https html_url, asset browser_download_url, and Atom <link> hrefs', () => {
    const restCandidates = parseGitHubReleasesJson([
      {
        tag_name: 'v0.0.25-least',
        draft: false,
        html_url: 'javascript:alert(1)',
        assets: [
          { name: 'evil.dmg', browser_download_url: 'http://evil.example.com/evil.dmg' },
          { name: 'xss.dmg', browser_download_url: 'javascript:alert(1)' },
          { name: 'safe.dmg', browser_download_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/download/v0.0.25-least/safe.dmg' },
        ],
      },
      {
        tag_name: 'v0.0.24-beta',
        draft: false,
        html_url: 'http://insecure.example.com/releases/tag/v0.0.24-beta',
      },
    ])
    expect(restCandidates).toHaveLength(2)
    expect(restCandidates[0]?.releaseUrl).toBe('https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-least')
    expect(restCandidates[0]?.assets).toEqual([
      {
        name: 'safe.dmg',
        browserDownloadUrl: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/download/v0.0.25-least/safe.dmg',
      },
    ])
    expect(restCandidates[1]?.releaseUrl).toBe('https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-beta')

    const atomWithUnsafeLinks = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.25-least</id>
    <link rel="alternate" type="text/html" href="javascript:alert(1)"/>
    <title>v0.0.25-least</title>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1/v0.0.24-beta</id>
    <link rel="alternate" type="text/html" href="http://insecure.example.com/releases/tag/v0.0.24-beta"/>
    <title>v0.0.24-beta</title>
  </entry>
</feed>`
    const atomCandidates = parseGitHubReleasesAtom(atomWithUnsafeLinks)
    expect(atomCandidates).toEqual([
      {
        version: '0.0.25-least',
        tag: 'v0.0.25-least',
        channel: 'least',
        releaseUrl: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-least',
      },
      {
        version: '0.0.24-beta',
        tag: 'v0.0.24-beta',
        channel: 'beta',
        releaseUrl: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-beta',
      },
    ])
  })

  it('coalesces concurrent checkUpdate requests via updateCheckInFlight and strips HTML tags from releaseNotes', async () => {
    const home = makeTempHome()
    vi.stubEnv('XPH_HOME', home)
    vi.stubEnv('XPEACH_VERSION', '0.0.23-beta')

    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      return new Response(
        JSON.stringify([
          {
            tag_name: 'v0.0.25-alpha',
            draft: false,
            html_url: 'https://evil.example.com/phishing',
            body: '<script>alert(1)</script><b>Alpha</b> 25 notes',
          },
          {
            tag_name: 'v0.0.24-beta',
            draft: false,
            html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.24-beta',
            body: '<p>Beta 24</p><style>body{display:none}</style>',
          },
        ]),
        { status: 200 },
      )
    })

    const [betaRes, alphaRes] = await Promise.all([
      account.checkUpdate({ channel: 'beta', force: true }),
      account.checkUpdate({ channel: 'alpha', force: true }),
    ])

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(betaRes.targetVersion).toBe('0.0.24-beta')
    expect(betaRes.releaseNotes).toBe('Beta 24')
    expect(alphaRes.targetVersion).toBe('0.0.25-alpha')
    expect(alphaRes.releaseUrl).toBe('https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.25-alpha')
    expect(alphaRes.releaseNotes).toBe('Alpha 25 notes')
  })
})
