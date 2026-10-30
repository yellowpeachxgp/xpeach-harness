/** Electron-native inactivity deadlines for updater checks, full downloads, and blockmap requests. */
import { ElectronHttpExecutor } from 'electron-updater/out/electronHttpExecutor.js'
import type { ClientRequest, IncomingMessage } from 'electron'
import {
  buildAtomFeedFromGitHubReleases,
  compareXpeachVersions,
  filterAtomFeedForChannel,
  isVersionEligibleForChannel,
  parseGitHubReleasesApiJson,
  synthesizeUpdateYamlFromRelease,
  type XPeachGitHubRelease,
  type XPeachReleaseChannel,
} from './update-channel.ts'

const ATOM_FEED_PATH_PATTERN = /^\/([^/]+\/[^/]+)\/releases\.atom(?:\?.*)?$/u
const LATEST_RELEASE_PATH_PATTERN = /^\/(?:repos\/)?([^/]+\/[^/]+)\/releases\/latest(?:\?.*)?$/u
const CHANNEL_YML_PATH_PATTERN = /^\/([^/]+\/[^/]+)\/releases\/download\/([^/?#]+)\/([^/?#]+\.yml)(?:\?.*)?$/u

/** Retains electron-updater transport and proxy handling while resolving updates via the GitHub Releases API. */
export class DesktopUpdateHttpExecutor extends ElectronHttpExecutor {
  private releasesCache: {
    readonly slug: string
    readonly at: number
    readonly releases: readonly XPeachGitHubRelease[]
  } | undefined

  /**
   * @param idleTimeoutMs - Maximum silence before headers or between response chunks, not a total download deadline.
   * @param proxyLogin - Existing updater login event forwarding.
   * @param resolveXpeachChannel - Optional XPeach update channel resolver for GitHub Releases API filtering.
   */
  constructor(
    private readonly idleTimeoutMs: number,
    proxyLogin?: ConstructorParameters<typeof ElectronHttpExecutor>[0],
    private readonly resolveXpeachChannel?: () => XPeachReleaseChannel | undefined,
  ) {
    super(proxyLogin)
    if (!Number.isSafeInteger(idleTimeoutMs) || idleTimeoutMs < 1000 || idleTimeoutMs > 2_147_483_647) {
      throw new Error('desktop update: HTTP idle timeout must be an integer from 1000 through 2147483647')
    }
  }

  private async fetchGitHubReleases(
    slug: string,
    cancellationToken?: Parameters<ElectronHttpExecutor['request']>[1],
  ): Promise<readonly XPeachGitHubRelease[]> {
    const cached = this.releasesCache
    if (cached !== undefined && cached.slug === slug && Date.now() - cached.at < 30_000) {
      return cached.releases
    }
    try {
      const raw = await super.request(
        {
          protocol: 'https:',
          hostname: 'api.github.com',
          path: `/repos/${slug}/releases?per_page=30`,
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
    } catch (_err) {
      // Fall back to cached or upstream response when api.github.com is unreachable.
    }
    return cached?.slug === slug ? cached.releases : []
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
      const releases = await this.fetchGitHubReleases(slug, cancellationToken)
      const matchedRelease = releases.find(r => r.tag === rawTag || r.version === normalizedVersion)
      if (matchedRelease !== undefined) {
        const synthesized = synthesizeUpdateYamlFromRelease(matchedRelease, channelFile)
        if (synthesized !== null) return synthesized
      }
    }

    const latestMatch = LATEST_RELEASE_PATH_PATTERN.exec(pathStr)
    if (latestMatch !== null && this.resolveXpeachChannel !== undefined) {
      const slug = latestMatch[1] ?? 'yellowpeachxgp/xpeach-harness'
      const channel = this.resolveXpeachChannel() ?? 'beta'
      const releases = await this.fetchGitHubReleases(slug, cancellationToken)
      const eligible = releases
        .filter(r => isVersionEligibleForChannel(r.version, channel))
        .sort((a, b) => compareXpeachVersions(b.version, a.version))
      const best = eligible[0]
      if (best !== undefined) {
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
          return buildAtomFeedFromGitHubReleases(releases, channel, slug)
        }
      }
    }

    const body = await super.request(options, cancellationToken, data)
    if (
      typeof body === 'string'
      && this.resolveXpeachChannel !== undefined
      && pathStr.endsWith('/releases.atom')
    ) {
      const channel = this.resolveXpeachChannel()
      if (channel !== undefined) {
        return filterAtomFeedForChannel(body, channel)
      }
    }
    return body
  }

  override addErrorAndTimeoutHandlers(request: ClientRequest, reject: (error: Error) => void): void {
    // The upstream socket timer is for Node HTTP; Electron ClientRequest has response/close events instead.
    super.addErrorAndTimeoutHandlers(request, reject, this.idleTimeoutMs)
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
      }, this.idleTimeoutMs)
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
