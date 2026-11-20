/** Electron-native inactivity deadlines for updater checks, full downloads, and blockmap requests. */
import { ElectronHttpExecutor } from 'electron-updater/out/electronHttpExecutor.js'
import type { ClientRequest, IncomingMessage } from 'electron'
import {
  buildAtomFeedFromGitHubReleases,
  compareXpeachVersions,
  filterAtomFeedForChannel,
  hasAtomEntries,
  isVersionEligibleForChannel,
  normalizeUpdateYamlAssetPrefixes,
  parseGitHubReleasesApiJson,
  resolveTopAtomEntryUpdaterChannel,
  synthesizeUpdateYamlFromRelease,
  XPeachNoEligibleReleaseError,
  type XPeachGitHubRelease,
  type XPeachReleaseChannel,
} from './update-channel.ts'

const ATOM_FEED_PATH_PATTERN = /^\/([^/]+\/[^/]+)\/releases\.atom(?:\?.*)?$/u
const LATEST_RELEASE_PATH_PATTERN = /^\/(?:repos\/)?([^/]+\/[^/]+)\/releases\/latest(?:\?.*)?$/u
const CHANNEL_YML_PATH_PATTERN = /^\/([^/]+\/[^/]+)\/releases\/download\/([^/?#]+)\/([^/?#]+\.yml)(?:\?.*)?$/u
const API_METADATA_TIMEOUT_MS = 12_000
const API_RATE_LIMIT_COOLDOWN_MS = 5 * 60_000
const METADATA_RETRY_DELAYS_MS = [500, 1_500] as const
const DOWNLOAD_RETRY_DELAYS_MS = [1_000, 3_000] as const

const RETRYABLE_TRANSPORT_ERROR = new RegExp(
  `\\b(?:${[
    'ETIMEDOUT',
    'ECONNRESET',
    'EPIPE',
    'EAI_AGAIN',
    'ENOTFOUND',
    'ECONNREFUSED',
    'ERR_CONNECTION_RESET',
    'ERR_CONNECTION_CLOSED',
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_TIMED_OUT',
    'ERR_NETWORK_CHANGED',
    'ERR_FAILED',
    'HTTP_ERROR_5\\d\\d',
  ].join('|')})\\b`,
  'u',
)

function errorMessageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return ''
}

function errorCodeOf(error: unknown): string {
  if (typeof error !== 'object' || error === null) return ''
  const code = (error as { code?: unknown }).code
  if (typeof code === 'string') return code
  if (typeof code === 'number') return String(code)
  return ''
}

function httpStatusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const statusCode = (error as { statusCode?: unknown }).statusCode
  if (typeof statusCode === 'number' && Number.isInteger(statusCode)) return statusCode
  const match = /\bstatus\s+(\d{3})\b/iu.exec(errorMessageOf(error))
  return match?.[1] !== undefined ? Number(match[1]) : undefined
}

function isCancellationError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const name = (error as { name?: unknown }).name
  return name === 'CancellationError' || errorCodeOf(error) === 'ERR_UPDATER_CANCELLED'
}

function isRetryableMetadataError(error: unknown): boolean {
  if (isCancellationError(error)) return false
  const status = httpStatusOf(error)
  if (status !== undefined) {
    return status >= 500 && status <= 599
  }
  const code = errorCodeOf(error)
  const message = errorMessageOf(error)
  return RETRYABLE_TRANSPORT_ERROR.test(code) || RETRYABLE_TRANSPORT_ERROR.test(message)
}

function isRetryableDownloadError(error: unknown): boolean {
  if (isCancellationError(error)) return false
  const code = errorCodeOf(error)
  if (code === 'ERR_CHECKSUM_MISMATCH' || code === 'ERR_UPDATER_INVALID_SIGNATURE') return false
  const status = httpStatusOf(error)
  if (status !== undefined) {
    return status === 429 || (status >= 500 && status <= 599)
  }
  const message = errorMessageOf(error)
  return RETRYABLE_TRANSPORT_ERROR.test(code) || RETRYABLE_TRANSPORT_ERROR.test(message)
}

function looksLikeUpdateYaml(content: string): boolean {
  const trimmed = content.trimStart()
  if (trimmed.length === 0 || trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('<')) {
    return false
  }
  return /^\s*version:\s*.+/mu.test(content) && /^\s*(?:files:|path:|sha512:|sha2:)/mu.test(content)
}

function delayWithCancellation(
  ms: number,
  cancellationToken?: { readonly cancelled?: boolean },
): Promise<void> {
  if (cancellationToken?.cancelled === true) return Promise.resolve()
  return new Promise((resolve) => { setTimeout(resolve, ms) })
}

/**
 * Retains electron-updater transport and proxy handling while resolving updates
 * via GitHub Releases with rate-limit and network resilience.
 */
export class DesktopUpdateHttpExecutor extends ElectronHttpExecutor {
  private releasesCache: {
    readonly slug: string
    readonly at: number
    readonly releases: readonly XPeachGitHubRelease[]
  } | undefined

  private apiRateLimitedUntil = 0

  /**
   * @param idleTimeoutMs - Maximum silence before headers or between response chunks, not a total download deadline.
   * @param proxyLogin - Existing updater login event forwarding.
   * @param resolveXpeachChannel - Optional XPeach update channel resolver for GitHub Releases API filtering.
   * @param syncUpdaterChannel - Optional callback synchronizing `updater.channel` with the selected release tag's prerelease identifier.
   */
  constructor(
    private readonly idleTimeoutMs: number,
    proxyLogin?: ConstructorParameters<typeof ElectronHttpExecutor>[0],
    private readonly resolveXpeachChannel?: () => XPeachReleaseChannel | undefined,
    private readonly syncUpdaterChannel?: (updaterChannel: string) => void,
  ) {
    super(proxyLogin)
    if (!Number.isSafeInteger(idleTimeoutMs) || idleTimeoutMs < 1000 || idleTimeoutMs > 2_147_483_647) {
      throw new Error('desktop update: HTTP idle timeout must be an integer from 1000 through 2147483647')
    }
  }

  /** Invalidate cached GitHub Releases metadata so the next check fetches fresh data. */
  clearReleasesCache(): void {
    this.releasesCache = undefined
  }

  private async requestWithRetry(
    options: Parameters<ElectronHttpExecutor['request']>[0],
    cancellationToken?: Parameters<ElectronHttpExecutor['request']>[1],
    data?: Parameters<ElectronHttpExecutor['request']>[2],
  ): Promise<string | null> {
    let lastError: unknown
    for (let attempt = 0; attempt <= METADATA_RETRY_DELAYS_MS.length; attempt++) {
      try {
        return await super.request(options, cancellationToken, data)
      } catch (error) {
        lastError = error
        const waitMs = METADATA_RETRY_DELAYS_MS[attempt]
        if (waitMs === undefined || cancellationToken?.cancelled === true || !isRetryableMetadataError(error)) {
          throw error
        }
        await delayWithCancellation(waitMs, cancellationToken)
      }
    }
    throw lastError
  }

  private async fetchGitHubReleases(
    slug: string,
    cancellationToken?: Parameters<ElectronHttpExecutor['request']>[1],
  ): Promise<readonly XPeachGitHubRelease[]> {
    const cached = this.releasesCache
    if (cached !== undefined && cached.slug === slug && Date.now() - cached.at < 30_000) {
      return cached.releases
    }
    if (Date.now() < this.apiRateLimitedUntil) {
      return cached?.slug === slug ? cached.releases : []
    }
    try {
      const raw = await super.request(
        {
          protocol: 'https:',
          hostname: 'api.github.com',
          path: `/repos/${slug}/releases?per_page=30`,
          timeout: Math.min(this.idleTimeoutMs, API_METADATA_TIMEOUT_MS),
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'XPeach-Harness-Updater',
          },
        },
        cancellationToken,
      )
      if (typeof raw === 'string' && raw.length > 0) {
        const parsed = parseGitHubReleasesApiJson(raw, slug)
        if (parsed.length > 0) {
          this.releasesCache = { slug, at: Date.now(), releases: parsed }
          return parsed
        }
      }
    } catch (error) {
      const status = httpStatusOf(error)
      if (status === 403 || status === 429) {
        this.apiRateLimitedUntil = Date.now() + API_RATE_LIMIT_COOLDOWN_MS
      }
      // Fall back to cached or Atom feed when api.github.com is unreachable or rate-limited.
    }
    return cached?.slug === slug ? cached.releases : []
  }

  override async download(
    url: Parameters<ElectronHttpExecutor['download']>[0],
    destination: Parameters<ElectronHttpExecutor['download']>[1],
    options: Parameters<ElectronHttpExecutor['download']>[2],
  ): Promise<string> {
    let lastError: unknown
    for (let attempt = 0; attempt <= DOWNLOAD_RETRY_DELAYS_MS.length; attempt++) {
      try {
        return await super.download(url, destination, options)
      } catch (error) {
        lastError = error
        const waitMs = DOWNLOAD_RETRY_DELAYS_MS[attempt]
        if (waitMs === undefined || options.cancellationToken.cancelled || !isRetryableDownloadError(error)) {
          throw error
        }
        await delayWithCancellation(waitMs, options.cancellationToken)
      }
    }
    throw lastError
  }

  override async request(
    options: Parameters<ElectronHttpExecutor['request']>[0],
    cancellationToken?: Parameters<ElectronHttpExecutor['request']>[1],
    data?: Parameters<ElectronHttpExecutor['request']>[2],
  ): Promise<string | null> {
    const pathStr = typeof options.path === 'string' ? options.path : ''

    const ymlMatch = CHANNEL_YML_PATH_PATTERN.exec(pathStr)
    if (ymlMatch !== null) {
      const slug = ymlMatch[1] ?? 'yellowpeachxgp/xpeach-harness'
      const rawTag = decodeURIComponent(ymlMatch[2] ?? '')
      const channelFile = decodeURIComponent(ymlMatch[3] ?? 'latest.yml')
      const normalizedVersion = rawTag.replace(/^[vV]+/u, '')

      // Prefer the release's uploaded YAML descriptor first so electron-updater retains
      // real SHA-512 checksums (required by DownloadedUpdateHelper cache verification).
      let primaryError: Error | undefined
      try {
        const upstreamYaml = await this.requestWithRetry(options, cancellationToken, data)
        if (typeof upstreamYaml === 'string' && looksLikeUpdateYaml(upstreamYaml)) {
          return normalizeUpdateYamlAssetPrefixes(upstreamYaml, channelFile)
        }
      } catch (err) {
        primaryError = err instanceof Error
          ? err
          : new Error(errorMessageOf(err) || 'Failed to download update metadata')
        const fallbackFile = channelFile.replace(/^(?:alpha|beta|least)(?=(-mac|-linux)?\.yml$)/iu, 'latest')
        if (fallbackFile !== channelFile) {
          try {
            const fallbackPath = pathStr.replace(/[^/?#]+\.yml(?=\?|$)/u, encodeURIComponent(fallbackFile))
            const fallbackYaml = await this.requestWithRetry({ ...options, path: fallbackPath }, cancellationToken, data)
            if (typeof fallbackYaml === 'string' && looksLikeUpdateYaml(fallbackYaml)) {
              return normalizeUpdateYamlAssetPrefixes(fallbackYaml, fallbackFile)
            }
          } catch (_fallbackErr) {
            // Continue to API-based YAML synthesis for releases without uploaded .yml descriptors.
          }
        }
      }

      const releases = await this.fetchGitHubReleases(slug, cancellationToken)
      const matchedRelease = releases.find(r => r.tag === rawTag || r.version === normalizedVersion)
      if (matchedRelease !== undefined) {
        const synthesized = synthesizeUpdateYamlFromRelease(matchedRelease, channelFile)
        if (synthesized !== null) return synthesized
      }
      if (primaryError !== undefined) throw primaryError
      return null
    }

    const latestMatch = LATEST_RELEASE_PATH_PATTERN.exec(pathStr)
    if (latestMatch !== null && this.resolveXpeachChannel !== undefined) {
      const slug = latestMatch[1] ?? 'yellowpeachxgp/xpeach-harness'
      const channel = this.resolveXpeachChannel() ?? 'beta'
      const releases = await this.fetchGitHubReleases(slug, cancellationToken)
      if (releases.length > 0) {
        const eligible = releases
          .filter(r => isVersionEligibleForChannel(r.version, channel))
          .sort((a, b) => compareXpeachVersions(b.version, a.version))
        const best = eligible[0]
        if (best === undefined) throw new XPeachNoEligibleReleaseError(channel)
        return JSON.stringify({ tag_name: best.tag })
      }
    }

    const atomMatch = ATOM_FEED_PATH_PATTERN.exec(pathStr)
    if (atomMatch !== null && this.resolveXpeachChannel !== undefined) {
      const slug = atomMatch[1] ?? 'yellowpeachxgp/xpeach-harness'
      const channel = this.resolveXpeachChannel()
      if (channel !== undefined) {
        const releases = await this.fetchGitHubReleases(slug, cancellationToken)
        if (releases.length > 0) {
          const feedXml = buildAtomFeedFromGitHubReleases(releases, channel, slug)
          if (!hasAtomEntries(feedXml)) throw new XPeachNoEligibleReleaseError(channel)
          const updaterChannel = resolveTopAtomEntryUpdaterChannel(feedXml)
          if (updaterChannel !== undefined) this.syncUpdaterChannel?.(updaterChannel)
          return feedXml
        }
      }
    }

    const body = await this.requestWithRetry(options, cancellationToken, data)
    if (
      typeof body === 'string'
      && this.resolveXpeachChannel !== undefined
      && ATOM_FEED_PATH_PATTERN.test(pathStr)
    ) {
      const channel = this.resolveXpeachChannel()
      if (channel !== undefined) {
        const hadEntries = hasAtomEntries(body)
        const filteredXml = filterAtomFeedForChannel(body, channel)
        if (hadEntries && !hasAtomEntries(filteredXml)) {
          throw new XPeachNoEligibleReleaseError(channel)
        }
        const updaterChannel = resolveTopAtomEntryUpdaterChannel(filteredXml)
        if (updaterChannel !== undefined) this.syncUpdaterChannel?.(updaterChannel)
        return filteredXml
      }
    }
    return body
  }

  override addErrorAndTimeoutHandlers(
    request: ClientRequest,
    reject: (error: Error) => void,
    timeout: number = this.idleTimeoutMs,
  ): void {
    const effectiveTimeout = Number.isSafeInteger(timeout) && timeout >= 1000 && timeout <= 2_147_483_647
      ? timeout
      : this.idleTimeoutMs
    // The upstream socket timer is for Node HTTP; Electron ClientRequest has response/close events instead.
    super.addErrorAndTimeoutHandlers(request, reject, effectiveTimeout)
    let response: IncomingMessage | undefined
    let timer: ReturnType<typeof setTimeout>
    const stop = (): void => {
      clearTimeout(timer)
      request.off('response', onResponse)
      request.off('abort', stop)
      request.off('error', stop)
      response?.off('data', refresh)
      response?.off('end', stop)
      response?.off('error', stop)
    }
    const refresh = (): void => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        stop()
        reject(Object.assign(new Error('Desktop update connection timed out'), { code: 'ETIMEDOUT' }))
        request.abort()
      }, effectiveTimeout)
    }
    const onResponse = (incoming: IncomingMessage): void => {
      response = incoming
      response.on('data', refresh)
      response.once('end', stop)
      response.once('error', stop)
      refresh()
    }
    request.once('response', onResponse)
    // Electron 44 can emit writable close after finish, before response headers arrive.
    request.once('abort', stop)
    request.once('error', stop)
    refresh()
  }
}
