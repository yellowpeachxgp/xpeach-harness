/** Resolve the update channel sealed into the installed application manifest and XPeach release channel rules. */

import { readFileSync, statSync, type Stats } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Installer-owned channel, independent of release version and upload environment. */
export type DesktopUpdateChannel = 'nightly' | 'latest'

/** XPeach release stability channels (`least` = stable, `beta` = preview, `alpha` = bleeding-edge). */
export type XPeachReleaseChannel = 'least' | 'beta' | 'alpha'

/** Stability rank for each XPeach release channel (`least: 3 > beta: 2 > alpha: 1`). */
export const XPEACH_CHANNEL_RANK: Readonly<Record<XPeachReleaseChannel, number>> = {
  alpha: 1,
  beta: 2,
  least: 3,
}

/** Parsed XPeach semantic version and channel classification. */
export interface ParsedXPeachVersion {
  readonly raw: string
  readonly version: string
  readonly major: number
  readonly minor: number
  readonly patch: number
  readonly channel: XPeachReleaseChannel
  readonly preNumber: number
}

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/u

/**
 * Read the packaged channel; older manifests retain their existing nightly behavior.
 * @param manifest Parsed application manifest.
 * @returns Validated channel. Invalid explicit values reject instead of changing feeds.
 */
export function desktopUpdateChannel(manifest: unknown): DesktopUpdateChannel {
  if (typeof manifest !== 'object' || manifest === null) throw new Error('desktop update: invalid application manifest')
  if (!('dshDesktopUpdateChannel' in manifest)) return 'nightly'
  const channel = manifest.dshDesktopUpdateChannel
  if (channel !== 'nightly' && channel !== 'latest') throw new Error('desktop update: invalid packaged channel')
  return channel
}

function classifyPrereleaseLabel(label: string | undefined): XPeachReleaseChannel {
  if (label === undefined || label.length === 0) return 'least'
  const lower = label.toLowerCase()
  if (
    lower.startsWith('least')
    || lower.startsWith('latest')
    || lower.startsWith('stable')
    || lower.startsWith('release')
  ) {
    return 'least'
  }
  if (
    lower.startsWith('beta')
    || lower.startsWith('rc')
    || lower.startsWith('next')
  ) {
    return 'beta'
  }
  return 'alpha'
}

/**
 * Parse a raw XPeach version or tag into numeric components and release channel.
 * @param raw Version string or tag.
 * @returns Parsed version metadata, or `null` when invalid.
 */
export function parseXpeachVersion(raw: string): ParsedXPeachVersion | null {
  if (typeof raw !== 'string') return null
  const cleaned = raw.trim().replace(/^[vV]+/u, '')
  const match = VERSION_PATTERN.exec(cleaned)
  if (match === null) return null
  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  if (!Number.isSafeInteger(major) || !Number.isSafeInteger(minor) || !Number.isSafeInteger(patch)) {
    return null
  }
  const suffix = match[4]
  const channel = classifyPrereleaseLabel(suffix)
  let preNumber = 0
  if (suffix !== undefined) {
    const trailingNumber = /(?:^|[.-])(\d+)$/u.exec(suffix)
    if (trailingNumber !== null) {
      const parsedNum = Number(trailingNumber[1])
      if (Number.isSafeInteger(parsedNum)) preNumber = parsedNum
    }
  }
  return {
    raw,
    version: cleaned,
    major,
    minor,
    patch,
    channel,
    preNumber,
  }
}

/**
 * Normalize an untrusted channel string or alias into `'least' | 'beta' | 'alpha'`.
 * @param input Untrusted channel value.
 * @param fallbackVersion Optional version string used when `input` is unrecognized.
 * @returns Normalized XPeach release channel.
 */
export function normalizeXpeachChannel(input: unknown, fallbackVersion?: string): XPeachReleaseChannel {
  if (typeof input === 'string') {
    const lower = input.trim().toLowerCase()
    if (
      lower === 'least'
      || lower === 'latest'
      || lower === 'stable'
      || lower === 'main'
      || lower === 'release'
    ) {
      return 'least'
    }
    if (lower === 'beta' || lower === 'rc' || lower === 'next') {
      return 'beta'
    }
    if (lower === 'alpha' || lower === 'nightly' || lower === 'canary') {
      return 'alpha'
    }
  }
  if (typeof fallbackVersion === 'string' && fallbackVersion.trim().length > 0) {
    const parsed = parseXpeachVersion(fallbackVersion)
    if (parsed !== null) return parsed.channel
  }
  return 'beta'
}

/**
 * Determine whether `candidateVersion` is eligible for `subscribedChannel`.
 * @param candidateVersion Candidate release version or tag.
 * @param subscribedChannel User's subscribed update channel.
 * @returns `true` when `candidateVersion` is downward-compatible with `subscribedChannel`.
 */
export function isVersionEligibleForChannel(
  candidateVersion: string,
  subscribedChannel: XPeachReleaseChannel,
): boolean {
  const parsed = parseXpeachVersion(candidateVersion)
  if (parsed === null) return false
  return XPEACH_CHANNEL_RANK[parsed.channel] >= XPEACH_CHANNEL_RANK[subscribedChannel]
}

/**
 * Compare two XPeach version strings by semver core, then channel stability rank
 * (`least > beta > alpha`), then prerelease iteration number.
 * @param a First version string.
 * @param b Second version string.
 * @returns `-1` when `a < b`, `0` when `a == b`, or `1` when `a > b`.
 */
export function compareXpeachVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parseXpeachVersion(a)
  const pb = parseXpeachVersion(b)
  if (pa === null && pb === null) return a === b ? 0 : (a > b ? 1 : -1)
  if (pa === null) return -1
  if (pb === null) return 1

  if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1
  if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1

  const rankA = XPEACH_CHANNEL_RANK[pa.channel]
  const rankB = XPEACH_CHANNEL_RANK[pb.channel]
  if (rankA !== rankB) return rankA > rankB ? 1 : -1

  if (pa.preNumber !== pb.preNumber) return pa.preNumber > pb.preNumber ? 1 : -1
  return 0
}

interface CachedDesktopChannelEntry {
  readonly mtimeMs: number
  readonly size: number
  readonly rawChannel: string
}

const desktopChannelCache = new Map<string, CachedDesktopChannelEntry>()

/**
 * Read the user's persisted XPeach update channel from `~/.xph/xpeach.update-channel.json`.
 *
 * Uses an in-memory cache validated against `mtimeMs` and `size` so repeated feed
 * filtering and update checks do not perform redundant disk reads.
 * @param xphHome Optional override for `~/.xph`.
 * @param fallbackVersion Optional running version string used when no preference file exists.
 * @returns Active XPeach release channel (`'least' | 'beta' | 'alpha'`).
 */
export function readXpeachUpdateChannel(
  xphHome?: string,
  fallbackVersion?: string,
): XPeachReleaseChannel {
  const home = typeof xphHome === 'string' && xphHome.trim().length > 0
    ? xphHome.trim()
    : (process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homedir(), '.xph'))
  const file = join(home, 'xpeach.update-channel.json')
  let stat: Stats | undefined
  try {
    stat = statSync(file, { throwIfNoEntry: false })
  } catch (_err) {
    stat = undefined
  }
  if (stat !== undefined) {
    const cached = desktopChannelCache.get(file)
    if (cached !== undefined && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      return normalizeXpeachChannel(cached.rawChannel, fallbackVersion)
    }
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const channel = (parsed as Record<string, unknown>)['channel']
        if (typeof channel === 'string' && channel.trim().length > 0) {
          desktopChannelCache.set(file, {
            mtimeMs: stat.mtimeMs,
            size: stat.size,
            rawChannel: channel,
          })
          return normalizeXpeachChannel(channel, fallbackVersion)
        }
      }
    } catch (_err) {
      // Fall back to environment or running version when preference file is unreadable.
    }
  } else {
    desktopChannelCache.delete(file)
  }
  return normalizeXpeachChannel(process.env.XPEACH_UPDATE_CHANNEL, fallbackVersion)
}

function hasUnsafeEntryLink(entryXml: string): boolean {
  const linkRegex = /<link\b[^>]*href=["']([^"']*)["'][^>]*>/giu
  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(entryXml)) !== null) {
    const href = match[1]?.trim() ?? ''
    try {
      const parsed = new URL(href)
      if (parsed.protocol !== 'https:') return true
    } catch (_err) {
      return true
    }
  }
  return false
}

function extractEntryTag(entryXml: string): string | undefined {
  const linkMatch = /<link\b[^>]*href=["']([^"']+)["'][^>]*>/iu.exec(entryXml)
  const href = linkMatch?.[1]?.trim()
  if (href !== undefined) {
    const tagFromHref = /\/releases\/tag\/([^/?#&"']+)/iu.exec(href)
    if (tagFromHref?.[1] !== undefined) {
      try {
        return decodeURIComponent(tagFromHref[1])
      } catch (_err) {
        return tagFromHref[1]
      }
    }
  }
  const idMatch = /<id\b[^>]*>([^<]+)<\/id>/iu.exec(entryXml)
  const idText = idMatch?.[1]?.trim()
  if (idText !== undefined) {
    const lastSlash = idText.lastIndexOf('/')
    if (lastSlash >= 0 && lastSlash < idText.length - 1) {
      return idText.slice(lastSlash + 1).trim()
    }
  }
  const titleMatch = /<title\b[^>]*>([^<]+)<\/title>/iu.exec(entryXml)
  return titleMatch?.[1]?.trim()
}

/**
 * Filter a GitHub `releases.atom` XML feed so only `<entry>` blocks eligible for
 * `subscribedChannel` remain, ordered highest version first so `electron-updater`'s
 * `GitHubProvider` selects the best downward-compatible release.
 * @param xml Raw GitHub `releases.atom` XML document.
 * @param subscribedChannel Subscribed XPeach release channel (`'least' | 'beta' | 'alpha'`).
 * @returns Filtered and version-ordered Atom XML document.
 */
export function filterAtomFeedForChannel(
  xml: string,
  subscribedChannel: XPeachReleaseChannel,
): string {
  if (typeof xml !== 'string' || !xml.includes('<entry')) return xml
  const entryRegex = /<entry\b[^>]*>[\s\S]*?<\/entry>/giu
  const matches = [...xml.matchAll(entryRegex)]
  if (matches.length === 0) return xml
  const firstMatch = matches[0]
  const lastMatch = matches[matches.length - 1]
  if (firstMatch === undefined || lastMatch === undefined) return xml
  const startIndex = firstMatch.index
  const endIndex = lastMatch.index + lastMatch[0].length

  const eligible: { readonly raw: string; readonly version: string }[] = []
  for (const m of matches) {
    const rawEntry = m[0]
    if (hasUnsafeEntryLink(rawEntry)) continue
    const tag = extractEntryTag(rawEntry)
    if (tag === undefined) continue
    const parsed = parseXpeachVersion(tag)
    if (parsed === null) continue
    if (!isVersionEligibleForChannel(parsed.version, subscribedChannel)) continue
    eligible.push({ raw: rawEntry, version: parsed.version })
  }

  eligible.sort((a, b) => compareXpeachVersions(b.version, a.version))
  const replacement = eligible.map(item => item.raw).join('\n  ')
  return xml.slice(0, startIndex) + replacement + xml.slice(endIndex)
}

/** One installer asset returned by the GitHub Releases REST API. */
export interface XPeachGitHubReleaseAsset {
  readonly name: string
  readonly size: number
  readonly sha256?: string | undefined
  readonly browserDownloadUrl: string
}

/** One non-draft GitHub Release parsed from the GitHub Releases REST API. */
export interface XPeachGitHubRelease {
  readonly version: string
  readonly tag: string
  readonly channel: XPeachReleaseChannel
  readonly title: string
  readonly notes: string
  readonly publishedAt: string
  readonly releaseUrl: string
  readonly assets: readonly XPeachGitHubReleaseAsset[]
}

const SHA256_DIGEST_PATTERN = /^sha256:([0-9a-f]{64})$/iu

function escapeXml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;')
}

/**
 * Parse a GitHub Releases REST API JSON payload (either an array from `/releases`
 * or a single release object from `/releases/tags/<tag>`) into structured records.
 * @param payload Parsed JSON payload or raw JSON string from `api.github.com`.
 * @param repoSlug Repository `owner/name` slug.
 * @returns Non-draft releases with parsed assets and SHA-256 digests.
 */
export function parseGitHubReleasesApiJson(
  payload: unknown,
  repoSlug = 'yellowpeachxgp/xpeach-harness',
): XPeachGitHubRelease[] {
  let parsedPayload: unknown = payload
  if (typeof payload === 'string') {
    try {
      parsedPayload = JSON.parse(payload)
    } catch (_err) {
      return []
    }
  }
  const items = Array.isArray(parsedPayload)
    ? parsedPayload
    : (typeof parsedPayload === 'object' && parsedPayload !== null ? [parsedPayload] : [])
  const out: XPeachGitHubRelease[] = []
  for (const item of items) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
    const obj = item as Record<string, unknown>
    if (obj['draft'] === true) continue
    const rawTag = typeof obj['tag_name'] === 'string' && obj['tag_name'].trim().length > 0
      ? obj['tag_name'].trim()
      : undefined
    if (rawTag === undefined) continue
    const parsedVersion = parseXpeachVersion(rawTag)
    if (parsedVersion === null) continue
    const tag = rawTag.startsWith('v') || rawTag.startsWith('V') ? rawTag : `v${parsedVersion.version}`
    const title = typeof obj['name'] === 'string' && obj['name'].trim().length > 0
      ? obj['name'].trim()
      : tag
    const notes = typeof obj['body'] === 'string' ? obj['body'].trim() : ''
    const publishedAt = typeof obj['published_at'] === 'string' && obj['published_at'].trim().length > 0
      ? obj['published_at'].trim()
      : typeof obj['created_at'] === 'string' && obj['created_at'].trim().length > 0
        ? obj['created_at'].trim()
        : new Date(0).toISOString()
    const releaseUrl = `https://github.com/${repoSlug}/releases/tag/${encodeURIComponent(tag)}`
    const assets: XPeachGitHubReleaseAsset[] = []
    if (Array.isArray(obj['assets'])) {
      for (const rawAsset of obj['assets']) {
        if (typeof rawAsset !== 'object' || rawAsset === null || Array.isArray(rawAsset)) continue
        const a = rawAsset as Record<string, unknown>
        const name = typeof a['name'] === 'string' ? a['name'].trim() : ''
        const size = typeof a['size'] === 'number' && Number.isFinite(a['size']) && a['size'] >= 0 ? a['size'] : 0
        const url = typeof a['browser_download_url'] === 'string' ? a['browser_download_url'].trim() : ''
        if (name.length === 0 || !url.startsWith('https://')) continue
        const digestRaw = typeof a['digest'] === 'string' ? a['digest'].trim() : ''
        const digestMatch = SHA256_DIGEST_PATTERN.exec(digestRaw)
        const sha256 = digestMatch?.[1]?.toLowerCase()
        assets.push({
          name,
          size,
          ...(sha256 !== undefined ? { sha256 } : {}),
          browserDownloadUrl: url,
        })
      }
    }
    out.push({
      version: parsedVersion.version,
      tag,
      channel: parsedVersion.channel,
      title,
      notes,
      publishedAt,
      releaseUrl,
      assets,
    })
  }
  return out
}

/**
 * Render an Atom XML document from GitHub Releases REST API records, filtered and
 * version-ordered for `subscribedChannel`.
 * @param releases Parsed GitHub Releases API records.
 * @param subscribedChannel Subscribed XPeach release channel (`'least' | 'beta' | 'alpha'`).
 * @param repoSlug Repository `owner/name` slug.
 * @returns Atom XML document compatible with `electron-updater`'s `GitHubProvider`.
 */
export function buildAtomFeedFromGitHubReleases(
  releases: readonly XPeachGitHubRelease[],
  subscribedChannel: XPeachReleaseChannel,
  repoSlug = 'yellowpeachxgp/xpeach-harness',
): string {
  const eligible = releases
    .filter(r => isVersionEligibleForChannel(r.version, subscribedChannel))
    .sort((a, b) => compareXpeachVersions(b.version, a.version))
  const entries = eligible.map(r => [
    '  <entry>',
    `    <id>tag:github.com,2008:Repository/${escapeXml(repoSlug)}/${escapeXml(r.tag)}</id>`,
    `    <updated>${escapeXml(r.publishedAt)}</updated>`,
    `    <link rel="alternate" type="text/html" href="https://github.com/${escapeXml(repoSlug)}/releases/tag/${escapeXml(r.tag)}"/>`,
    `    <title>${escapeXml(r.title)}</title>`,
    `    <content type="html">${escapeXml(r.notes)}</content>`,
    '  </entry>',
  ].join('\n')).join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <id>tag:github.com,2008:https://github.com/${escapeXml(repoSlug)}/releases</id>`,
    '  <title>Release notes</title>',
    ...(entries.length > 0 ? [entries] : []),
    '</feed>',
  ].join('\n')
}

/**
 * Synthesize an `electron-updater` update descriptor YAML directly from a GitHub
 * Releases REST API record and its asset SHA-256 digests (`sha2`), eliminating
 * the need to upload static `latest*.yml` / `beta*.yml` / `alpha*.yml` files.
 * @param release Parsed GitHub Release record containing `assets`.
 * @param channelFile Requested descriptor filename (for example `'latest-mac.yml'`, `'beta-linux.yml'`, `'latest.yml'`).
 * @returns Synthesized YAML string, or `null` when the release has no matching installer asset with a SHA-256 digest.
 */
export function synthesizeUpdateYamlFromRelease(
  release: XPeachGitHubRelease,
  channelFile: string,
): string | null {
  const lowerChannelFile = channelFile.toLowerCase()
  const isMac = lowerChannelFile.endsWith('-mac.yml')
  const isLinux = lowerChannelFile.includes('-linux')

  const candidates = release.assets.filter((asset) => {
    if (asset.sha256 === undefined) return false
    const lower = asset.name.toLowerCase()
    if (lower.endsWith('.blockmap') || lower.endsWith('.yml')) return false
    if (isMac) return lower.endsWith('.zip') || lower.endsWith('.dmg') || lower.endsWith('.pkg')
    if (isLinux) return lower.endsWith('.appimage')
    return lower.endsWith('.exe')
  })

  if (candidates.length === 0) return null

  if (isMac) {
    candidates.sort((a, b) => {
      const aZip = a.name.toLowerCase().endsWith('.zip') ? 0 : 1
      const bZip = b.name.toLowerCase().endsWith('.zip') ? 0 : 1
      return aZip - bZip
    })
  }

  const primary = candidates[0]
  if (primary === undefined || primary.sha256 === undefined) return null

  const filesBlock = candidates
    .filter((a): a is XPeachGitHubReleaseAsset & { readonly sha256: string } => a.sha256 !== undefined)
    .map(a => [
      `  - url: ${JSON.stringify(a.name)}`,
      `    sha2: ${a.sha256}`,
      `    size: ${String(a.size)}`,
    ].join('\n'))
    .join('\n')

  return [
    `version: ${JSON.stringify(release.version)}`,
    'files:',
    filesBlock,
    `path: ${JSON.stringify(primary.name)}`,
    `sha2: ${primary.sha256}`,
    `releaseDate: ${JSON.stringify(release.publishedAt)}`,
    '',
  ].join('\n')
}
