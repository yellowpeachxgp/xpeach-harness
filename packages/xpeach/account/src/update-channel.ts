/**
 * Release channel recognition, downward-compatible version eligibility,
 * GitHub Releases REST/Atom parsing, and shared update preference persistence
 * for XPeach Harness (`least`, `beta`, `alpha`).
 * @module @xpeach/xph-account/update-channel
 */

import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync, type Stats } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Release update channels supported by XPeach Harness. */
export type XPeachReleaseChannel = 'least' | 'beta' | 'alpha'

/**
 * Stability rank for each release channel.
 *
 * Higher rank means higher stability (`least: 3 > beta: 2 > alpha: 1`).
 * A user subscribed to channel `S` is eligible for any release with
 * `XPEACH_CHANNEL_RANK[release.channel] >= XPEACH_CHANNEL_RANK[S]`.
 */
export const XPEACH_CHANNEL_RANK: Readonly<Record<XPeachReleaseChannel, number>> = {
  alpha: 1,
  beta: 2,
  least: 3,
}

/** Structured representation of a parsed XPeach semantic version string. */
export interface ParsedXPeachVersion {
  /** Original input string before normalization. */
  readonly raw: string
  /** Normalized version string with leading `v`/`V` and surrounding whitespace removed. */
  readonly version: string
  /** Major version number. */
  readonly major: number
  /** Minor version number. */
  readonly minor: number
  /** Patch version number. */
  readonly patch: number
  /** Classified release stability channel (`'least' | 'beta' | 'alpha'`). */
  readonly channel: XPeachReleaseChannel
  /** Optional numeric prerelease iteration (for example `beta.2` -> `2`, default `0`). */
  readonly preNumber: number
}

/** One release candidate discovered from GitHub Releases REST API or Atom feed. */
export interface XPeachReleaseCandidate {
  /** Normalized version string (for example `'0.0.24-beta'`). */
  readonly version: string
  /** Git tag name (for example `'v0.0.24-beta'`). */
  readonly tag: string
  /** Classified release channel of this candidate. */
  readonly channel: XPeachReleaseChannel
  /** Browser URL to the release page. */
  readonly releaseUrl: string
  /** Release notes markdown or plain text summary. */
  readonly releaseNotes?: string | undefined
  /** ISO-8601 publication timestamp. */
  readonly publishedAt?: string | undefined
  /** Downloadable release assets when returned by the GitHub REST API. */
  readonly assets?: readonly {
    readonly name: string
    readonly browserDownloadUrl: string
    readonly size?: number | undefined
    readonly sha256?: string | undefined
  }[] | undefined
}

/** Current update channel status returned by `xpeach.updateChannelStatus` and `xpeach.setUpdateChannel`. */
export interface XPeachUpdateChannelStatus {
  /** Currently running XPeach Harness version string. */
  readonly currentVersion: string
  /** Release channel parsed from `currentVersion`. */
  readonly currentChannel: XPeachReleaseChannel
  /** User-subscribed update channel (`'least' | 'beta' | 'alpha'`). */
  readonly subscribedChannel: XPeachReleaseChannel
  /** Whether automatic update checks are enabled. */
  readonly autoCheckUpdate: boolean
  /** Release channels eligible for installation under `subscribedChannel`. */
  readonly compatibleChannels: readonly XPeachReleaseChannel[]
}

/** Request payload for `xpeach.setUpdateChannel`. */
export interface XPeachSetUpdateChannelRequest {
  /** Target release channel subscription (`'least' | 'beta' | 'alpha'`). */
  readonly channel?: XPeachReleaseChannel | undefined
  /** Whether automatic background update checks are enabled. */
  readonly autoCheckUpdate?: boolean | undefined
}

/** Request payload for `xpeach.checkUpdate`. */
export interface XPeachCheckUpdateRequest {
  /** Optional channel override for this check (`'least' | 'beta' | 'alpha'`). */
  readonly channel?: XPeachReleaseChannel | undefined
  /** When `true`, bypasses the 30-second in-memory release cache. */
  readonly force?: boolean | undefined
}

/** Result of evaluating available releases against the user's subscribed update channel. */
export interface XPeachUpdateCheckResult extends XPeachUpdateChannelStatus {
  /** Whether a newer downward-compatible release is available. */
  readonly updateAvailable: boolean
  /** Version string of the best eligible update when `updateAvailable` is `true`. */
  readonly targetVersion?: string | undefined
  /** Release channel of `targetVersion` when `updateAvailable` is `true`. */
  readonly targetChannel?: XPeachReleaseChannel | undefined
  /** Browser URL for the target release when `updateAvailable` is `true`. */
  readonly releaseUrl?: string | undefined
  /** Release notes for the target release when available. */
  readonly releaseNotes?: string | undefined
  /** ISO-8601 publication timestamp of the target release when available. */
  readonly publishedAt?: string | undefined
  /** Downloadable installer assets from the GitHub Releases REST API when available. */
  readonly assets?: readonly {
    readonly name: string
    readonly browserDownloadUrl: string
    readonly size?: number | undefined
    readonly sha256?: string | undefined
  }[] | undefined
  /** ISO-8601 timestamp when the update check completed. */
  readonly checkedAt: string
}

/** Persisted user update channel preference stored in `~/.xph/xpeach.update-channel.json`. */
export interface XPeachUpdatePreference {
  /** Subscribed release channel (`'least' | 'beta' | 'alpha'`). */
  readonly channel: XPeachReleaseChannel
  /** Whether automatic update checks are enabled. */
  readonly autoCheckUpdate: boolean
  /** ISO-8601 timestamp when the preference was last saved. */
  readonly updatedAt: string
}

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/u

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
 * Parse a raw XPeach version or Git tag into its numeric components and release channel.
 *
 * @param raw - Version string or tag (for example `'v0.0.24-beta'`, `'0.0.24-least'`, `'0.0.24-alpha.2'`).
 * @returns Parsed version metadata, or `null` when `raw` is not a valid version string.
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
 * Normalize an untrusted channel name or alias into `'least' | 'beta' | 'alpha'`.
 *
 * @param input - Untrusted channel value (for example `'least'`, `'latest'`, `'beta'`, `'alpha'`).
 * @param fallbackVersion - Optional version string whose channel is used when `input` is unrecognized.
 * @returns Normalized release channel (defaults to `'beta'` when neither `input` nor `fallbackVersion` resolves).
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
 * List all release channels that a user subscribed to `subscribed` may receive.
 *
 * Follows downward compatibility (`XPEACH_CHANNEL_RANK[c] >= XPEACH_CHANNEL_RANK[subscribed]`):
 * - `'least'` -> `['least']`
 * - `'beta'` -> `['beta', 'least']`
 * - `'alpha'` -> `['alpha', 'beta', 'least']`
 *
 * @param subscribed - User's subscribed release channel.
 * @returns Ordered list of compatible channels from most frequent to most stable.
 */
export function compatibleReleaseChannels(subscribed: XPeachReleaseChannel): readonly XPeachReleaseChannel[] {
  switch (subscribed) {
    case 'least':
      return ['least']
    case 'beta':
      return ['beta', 'least']
    case 'alpha':
      return ['alpha', 'beta', 'least']
  }
}

/**
 * Determine whether `candidateVersion` is eligible for installation under `subscribedChannel`.
 *
 * @param candidateVersion - Candidate release version or tag string.
 * @param subscribedChannel - User's subscribed release channel.
 * @returns `true` when `candidateVersion` parses and its channel rank is greater than or equal to `subscribedChannel`.
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
 * Compare two XPeach version strings by `major.minor.patch`, then by channel stability rank
 * (`least > beta > alpha`), then by numeric prerelease suffix (`preNumber`).
 *
 * @param a - First version string.
 * @param b - Second version string.
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

/**
 * Select the highest downward-compatible release for `subscribedChannel` and compare it
 * against `currentVersion`.
 *
 * @param releases - Available release candidates from GitHub Releases.
 * @param currentVersion - Currently running application version.
 * @param subscribedChannel - Subscribed release channel (`'least' | 'beta' | 'alpha'`).
 * @param autoCheckUpdate - Whether automatic background update checks are enabled.
 * @returns Structured update check result.
 */
export function selectBestUpdateForChannel(
  releases: readonly XPeachReleaseCandidate[],
  currentVersion: string,
  subscribedChannel: XPeachReleaseChannel,
  autoCheckUpdate = true,
): XPeachUpdateCheckResult {
  const parsedCurrent = parseXpeachVersion(currentVersion)
  const currentChannel = parsedCurrent?.channel ?? normalizeXpeachChannel(undefined, currentVersion)
  const normalizedCurrent = parsedCurrent?.version ?? currentVersion.trim().replace(/^[vV]+/u, '')
  const eligible = releases
    .filter(r => isVersionEligibleForChannel(r.version, subscribedChannel))
    .sort((a, b) => compareXpeachVersions(b.version, a.version))
  const best = eligible[0]
  const updateAvailable = best !== undefined && compareXpeachVersions(best.version, normalizedCurrent) > 0
  const checkedAt = new Date().toISOString()

  return {
    currentVersion: normalizedCurrent,
    currentChannel,
    subscribedChannel,
    autoCheckUpdate,
    compatibleChannels: compatibleReleaseChannels(subscribedChannel),
    updateAvailable,
    ...(updateAvailable
      ? {
        targetVersion: best.version,
        targetChannel: best.channel,
        releaseUrl: best.releaseUrl,
        ...(best.releaseNotes !== undefined ? { releaseNotes: best.releaseNotes } : {}),
        ...(best.publishedAt !== undefined ? { publishedAt: best.publishedAt } : {}),
        ...(best.assets !== undefined && best.assets.length > 0 ? { assets: best.assets } : {}),
      }
      : {}),
    checkedAt,
  }
}

function resolveXphHome(xphHome?: string): string {
  if (typeof xphHome === 'string' && xphHome.trim().length > 0) return xphHome.trim()
  return process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homedir(), '.xph')
}

function preferenceFilePath(xphHome?: string): string {
  return join(resolveXphHome(xphHome), 'xpeach.update-channel.json')
}

interface CachedPreferenceEntry {
  readonly mtimeMs: number
  readonly size: number
  readonly rawChannel: unknown
  readonly autoCheckUpdate: boolean
  readonly updatedAt: string
}

const preferenceCache = new Map<string, CachedPreferenceEntry>()

/**
 * Read the persisted update channel preference from `~/.xph/xpeach.update-channel.json`.
 *
 * Uses an in-memory cache keyed by file path and validated against `mtimeMs` and `size`
 * so repeated status queries do not perform redundant file reads and JSON parses.
 *
 * @param xphHome - Optional override for the `~/.xph` home directory.
 * @param fallbackVersion - Optional running version used to infer the initial channel when unconfigured.
 * @returns Normalized update preference record.
 */
export function readXpeachUpdatePreference(
  xphHome?: string,
  fallbackVersion?: string,
): XPeachUpdatePreference {
  const file = preferenceFilePath(xphHome)
  let stat: Stats | undefined
  try {
    stat = statSync(file, { throwIfNoEntry: false })
  } catch (_err) {
    stat = undefined
  }
  if (stat !== undefined) {
    const cached = preferenceCache.get(file)
    if (cached !== undefined && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      return {
        channel: normalizeXpeachChannel(cached.rawChannel, fallbackVersion),
        autoCheckUpdate: cached.autoCheckUpdate,
        updatedAt: cached.updatedAt,
      }
    }
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>
        const autoCheckUpdate = typeof obj['autoCheckUpdate'] === 'boolean' ? obj['autoCheckUpdate'] : true
        const updatedAt = typeof obj['updatedAt'] === 'string' && obj['updatedAt'].length > 0
          ? obj['updatedAt']
          : new Date(0).toISOString()
        preferenceCache.set(file, {
          mtimeMs: stat.mtimeMs,
          size: stat.size,
          rawChannel: obj['channel'],
          autoCheckUpdate,
          updatedAt,
        })
        return {
          channel: normalizeXpeachChannel(obj['channel'], fallbackVersion),
          autoCheckUpdate,
          updatedAt,
        }
      }
    } catch (_err) {
      // Fall through to default preference when the file is unreadable or corrupt.
    }
  } else {
    preferenceCache.delete(file)
  }
  return {
    channel: normalizeXpeachChannel(process.env.XPEACH_UPDATE_CHANNEL, fallbackVersion),
    autoCheckUpdate: true,
    updatedAt: new Date(0).toISOString(),
  }
}

/**
 * Persist the user's update channel preference to `~/.xph/xpeach.update-channel.json`.
 *
 * Updates the in-memory preference cache immediately (write-through) so subsequent
 * reads do not re-parse the file from disk.
 *
 * @param pref - Channel and optional `autoCheckUpdate` flag to save.
 * @param xphHome - Optional override for the `~/.xph` home directory.
 * @returns Saved update preference record.
 */
export function writeXpeachUpdatePreference(
  pref: { readonly channel: XPeachReleaseChannel; readonly autoCheckUpdate?: boolean | undefined },
  xphHome?: string,
): XPeachUpdatePreference {
  const home = resolveXphHome(xphHome)
  const existing = readXpeachUpdatePreference(home)
  const next: XPeachUpdatePreference = {
    channel: normalizeXpeachChannel(pref.channel),
    autoCheckUpdate: typeof pref.autoCheckUpdate === 'boolean' ? pref.autoCheckUpdate : existing.autoCheckUpdate,
    updatedAt: new Date().toISOString(),
  }
  const file = join(home, 'xpeach.update-channel.json')
  mkdirSync(home, { recursive: true })
  const tmpFile = `${file}.tmp.${String(process.pid)}`
  const serialized = JSON.stringify(next, null, 2) + '\n'
  writeFileSync(tmpFile, serialized, 'utf8')
  renameSync(tmpFile, file)
  try {
    const stat = statSync(file, { throwIfNoEntry: false })
    if (stat !== undefined) {
      preferenceCache.set(file, {
        mtimeMs: stat.mtimeMs,
        size: stat.size,
        rawChannel: next.channel,
        autoCheckUpdate: next.autoCheckUpdate,
        updatedAt: next.updatedAt,
      })
    }
  } catch (_err) {
    preferenceCache.delete(file)
  }
  return next
}

function unescapeXmlEntities(input: string): string {
  return input
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'")
    .replace(/&amp;/gu, '&')
}

function sanitizeHttpsUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  if (trimmed.length === 0) return undefined
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') return undefined
    return trimmed
  } catch (_err) {
    return undefined
  }
}

function sanitizeGitHubReleaseUrl(raw: unknown, repoSlug: string, tag: string): string {
  const fallback = `https://github.com/${repoSlug}/releases/tag/${tag}`
  if (typeof raw !== 'string') return fallback
  const trimmed = raw.trim()
  if (trimmed.length === 0 || /[\u0000-\u001f\u007f]/u.test(trimmed) || /\s/u.test(trimmed)) return fallback
  try {
    const parsed = new URL(trimmed)
    if (
      parsed.protocol !== 'https:'
      || parsed.hostname !== 'github.com'
      || parsed.username !== ''
      || parsed.password !== ''
    ) {
      return fallback
    }
    return trimmed
  } catch (_err) {
    return fallback
  }
}

function stripHtmlTags(input: string, collapseWhitespace: boolean): string {
  const withoutScripts = input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, ' ')
    .replace(/<[^>]+>/gu, collapseWhitespace ? ' ' : '')
  return collapseWhitespace
    ? withoutScripts.replace(/\s+/gu, ' ').trim()
    : withoutScripts.trim()
}

/**
 * Parse a GitHub `releases.atom` XML feed into structured `XPeachReleaseCandidate` records.
 *
 * Used both as a rate-limit-free fallback for `xpeach.checkUpdate` and as the feed model
 * for Desktop updater Atom filtering.
 *
 * @param xml - Raw Atom XML string from `https://github.com/<owner>/<repo>/releases.atom`.
 * @param repoSlug - Repository `owner/name` slug used to construct fallback release URLs.
 * @returns Parsed list of release candidates.
 */
export function parseGitHubReleasesAtom(
  xml: string,
  repoSlug = 'yellowpeachxgp/xpeach-harness',
): XPeachReleaseCandidate[] {
  if (typeof xml !== 'string' || xml.length === 0) return []
  const candidates: XPeachReleaseCandidate[] = []
  const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/giu
  let match: RegExpExecArray | null
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1] ?? ''
    const linkMatch = /<link\b[^>]*href=["']([^"']+)["'][^>]*>/iu.exec(entryXml)
    const href = linkMatch?.[1]?.trim()
    let rawTag: string | undefined
    if (href !== undefined) {
      const tagFromHref = /\/releases\/tag\/([^/?#&"']+)/iu.exec(href)
      if (tagFromHref?.[1] !== undefined) {
        try {
          rawTag = decodeURIComponent(tagFromHref[1])
        } catch (_err) {
          rawTag = tagFromHref[1]
        }
      }
    }
    if (rawTag === undefined) {
      const idMatch = /<id\b[^>]*>([^<]+)<\/id>/iu.exec(entryXml)
      const idText = idMatch?.[1]?.trim()
      if (idText !== undefined) {
        const lastSlash = idText.lastIndexOf('/')
        if (lastSlash >= 0 && lastSlash < idText.length - 1) {
          rawTag = idText.slice(lastSlash + 1).trim()
        }
      }
    }
    if (rawTag === undefined) {
      const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/iu.exec(entryXml)
      if (titleMatch?.[1] !== undefined) {
        rawTag = unescapeXmlEntities(titleMatch[1]).trim()
      }
    }
    if (rawTag === undefined || rawTag.length === 0) continue
    const parsed = parseXpeachVersion(rawTag)
    if (parsed === null) continue
    const tag = rawTag.startsWith('v') || rawTag.startsWith('V') ? rawTag : `v${parsed.version}`
    const releaseUrl = sanitizeGitHubReleaseUrl(href, repoSlug, tag)
    const updatedMatch = /<(?:updated|published)\b[^>]*>([^<]+)<\/(?:updated|published)>/iu.exec(entryXml)
    const publishedAt = updatedMatch?.[1]?.trim()
    const contentMatch = /<content\b[^>]*>([\s\S]*?)<\/content>/iu.exec(entryXml)
    let releaseNotes: string | undefined
    if (contentMatch?.[1] !== undefined) {
      const text = stripHtmlTags(unescapeXmlEntities(contentMatch[1]), true)
      if (text.length > 0) releaseNotes = text
    }
    candidates.push({
      version: parsed.version,
      tag,
      channel: parsed.channel,
      releaseUrl,
      ...(releaseNotes !== undefined ? { releaseNotes } : {}),
      ...(publishedAt !== undefined && publishedAt.length > 0 ? { publishedAt } : {}),
    })
  }
  return candidates
}

/**
 * Parse a GitHub REST API `/repos/<owner>/<repo>/releases` JSON payload into
 * structured `XPeachReleaseCandidate` records, excluding draft releases.
 *
 * @param payload - Untrusted parsed JSON payload from GitHub Releases REST API.
 * @param repoSlug - Repository `owner/name` slug used to construct fallback release URLs.
 * @returns Parsed list of non-draft release candidates.
 */
export function parseGitHubReleasesJson(
  payload: unknown,
  repoSlug = 'yellowpeachxgp/xpeach-harness',
): XPeachReleaseCandidate[] {
  if (!Array.isArray(payload)) return []
  const candidates: XPeachReleaseCandidate[] = []
  for (const item of payload) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
    const obj = item as Record<string, unknown>
    if (obj['draft'] === true) continue
    const rawTag = typeof obj['tag_name'] === 'string' && obj['tag_name'].trim().length > 0
      ? obj['tag_name'].trim()
      : typeof obj['name'] === 'string' && obj['name'].trim().length > 0
        ? obj['name'].trim()
        : undefined
    if (rawTag === undefined) continue
    const parsed = parseXpeachVersion(rawTag)
    if (parsed === null) continue
    const tag = rawTag.startsWith('v') || rawTag.startsWith('V') ? rawTag : `v${parsed.version}`
    const releaseUrl = sanitizeGitHubReleaseUrl(obj['html_url'], repoSlug, tag)
    const rawBody = typeof obj['body'] === 'string' ? stripHtmlTags(obj['body'], false) : ''
    const releaseNotes = rawBody.length > 0 ? rawBody : undefined
    const publishedAt = typeof obj['published_at'] === 'string' && obj['published_at'].trim().length > 0
      ? obj['published_at'].trim()
      : typeof obj['created_at'] === 'string' && obj['created_at'].trim().length > 0
        ? obj['created_at'].trim()
        : undefined
    const rawAssets = obj['assets']
    const assets: {
      readonly name: string
      readonly browserDownloadUrl: string
      readonly size?: number | undefined
      readonly sha256?: string | undefined
    }[] = []
    if (Array.isArray(rawAssets)) {
      for (const asset of rawAssets) {
        if (typeof asset !== 'object' || asset === null || Array.isArray(asset)) continue
        const a = asset as Record<string, unknown>
        const name = typeof a['name'] === 'string' ? a['name'].trim() : ''
        const browserDownloadUrl = sanitizeHttpsUrl(a['browser_download_url'])
        const size = typeof a['size'] === 'number' && Number.isFinite(a['size']) && a['size'] >= 0 ? a['size'] : undefined
        const digestRaw = typeof a['digest'] === 'string' ? a['digest'].trim() : ''
        const sha256Match = /^sha256:([0-9a-f]{64})$/iu.exec(digestRaw)
        const sha256 = sha256Match?.[1]?.toLowerCase()
        if (name.length > 0 && browserDownloadUrl !== undefined) {
          assets.push({
            name,
            browserDownloadUrl,
            ...(size !== undefined ? { size } : {}),
            ...(sha256 !== undefined ? { sha256 } : {}),
          })
        }
      }
    }
    candidates.push({
      version: parsed.version,
      tag,
      channel: parsed.channel,
      releaseUrl,
      ...(releaseNotes !== undefined ? { releaseNotes } : {}),
      ...(publishedAt !== undefined ? { publishedAt } : {}),
      ...(assets.length > 0 ? { assets } : {}),
    })
  }
  return candidates
}
