/**
 * XPeach (New API) account Remote owner: exposes the calling credential's own
 * usage, model catalog, session management, and site-administration surfaces
 * to Harness clients over the generated `xpeach` namespace.
 * @module @xpeach/xph-account
 */

import {
  chmodSync,
  cpSync,
  type Dirent,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { randomBytes, randomUUID } from 'node:crypto'
import { homedir, release, tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { Context, Service } from '@xpeach/xph-cordis'
import z from '@xpeach/xph-schemastery'
import { Remote, RemoteError, TypertRemoteService } from '@xpeach/xph-typert-protocol'
import { credentialRef, type CredentialRef } from '@xpeach/xph-credentials'
// Type-only: merges the forwarded `xpeach/playground-chunk` member onto cordis Events.
import type {} from '@xpeach/xph-api-remotes/types'
import { deepEqualJson, type JsonValue } from '@xpeach/xph-util-values'
import { launchEnvironmentOf } from '@xpeach/xph-launch-environment'
import { XPeachApi, parseSsoIssuer, validateSsoBaseUrl, validateVerificationUrl } from './api.ts'
import {
  importAssets as importLocalAssets,
  importConversations as importThreads,
  normalizeSkillMarkdown,
  readMcpPatchEntries,
  repairSkillsDirectory,
  sanitizeMcpId,
  sanitizeMcpServerName,
  sanitizeSkillName,
  scanOnboarding,
  writeMcpPatchEntries,
  type XPeachMcpPatchEntry,
} from './onboarding.ts'
import { ROUTES, chooseBest, probeRoutes } from './network.ts'
import { DEFAULT_TOKEN_LOOKUP_LIMITS, scanTokenPages, type TokenLookupLimits, type TokenScan } from './token-lookup.ts'
import { RelayState, RelayStateError, type RelaySnapshot, type RelayTokenInfo } from './relay-state.ts'
import { isTemporaryCredentialDirectory } from './credential-paths.ts'
import {
  inspectMacosInstallerStatus,
  runMacosInstallerAction,
} from './macos-installer.ts'
import {
  compatibleReleaseChannels,
  normalizeXpeachChannel,
  parseGitHubReleasesAtom,
  parseGitHubReleasesJson,
  parseXpeachVersion,
  readXpeachUpdatePreference,
  selectBestUpdateForChannel,
  writeXpeachUpdatePreference,
  type XPeachCheckUpdateRequest,
  type XPeachReleaseCandidate,
  type XPeachReleaseChannel,
  type XPeachSetUpdateChannelRequest,
  type XPeachUpdateChannelStatus,
  type XPeachUpdateCheckResult,
} from './update-channel.ts'
import {
  DEFAULT_PROMPT_OVERRIDES,
  normalizePromptOverridesConfig,
  XPeachGatewayInspectorController,
} from './gateway-inspector.ts'
import {
  buildModelPoolsAndProviders,
  DEFAULT_MODEL_ROUTING_STATE,
  ENDPOINT_POOLS,
  extractModelsFromExistingProviders,
  normalizeModelRoutingState,
  providerKeyForEndpoint,
  recommendedModelEndpoint,
} from './model-routing.ts'
import type {
  XPeachAssetImportResult,
  XPeachConversationImportResult,
  XPeachGatewayInspectorRequest,
  XPeachGatewayInspectorSaveRequest,
  XPeachGatewayInspectorSnapshot,
  XPeachMacosInstallerActionRequest,
  XPeachMacosInstallerActionResult,
  XPeachMacosInstallerStatus,
  XPeachMcpBatchDeleteRequest,
  XPeachMcpBatchToggleRequest,
  XPeachMcpDeleteRequest,
  XPeachMcpItem,
  XPeachMcpSaveRequest,
  XPeachMcpSnapshot,
  XPeachMcpToggleRequest,
  XPeachModelPoolsSaveRequest,
  XPeachModelPoolsSnapshot,
  XPeachModelRoutingState,
  XPeachOnboardingScan,
  XPeachPromptOverridesConfig,
  XPeachRulesSaveRequest,
  XPeachSkillBatchDeleteRequest,
  XPeachSkillBatchToggleRequest,
  XPeachSkillDeleteRequest,
  XPeachSkillItem,
  XPeachSkillSaveRequest,
  XPeachSkillsSnapshot,
  XPeachSkillToggleRequest,
  XPeachSourceId,
  XPeachSsoBridgePayload,
  XPeachSsoBrowserCancelRequest,
  XPeachSsoBrowserPollRequest,
  XPeachSsoBrowserStartRequest,
  XPeachSsoBrowserStartResult,
  XPeachSsoCaptchaChallenge,
  XPeachSsoCaptchaChallengeRequest,
  XPeachSsoCaptchaPolicy,
  XPeachSsoCredentialSyncResult,
  XPeachSsoDevicePollRequest,
  XPeachSsoDevicePollResult,
  XPeachSsoDeviceStartRequest,
  XPeachSsoDeviceStartResult,
  XPeachSsoRevokeRequest,
  XPeachSsoSessionStatus,
} from './types.ts'
import type {
  XPeachAdminLogEntry, XPeachAdminOverview, XPeachAdminPage, XPeachAdminPageRequest,
  XPeachAdminToken, XPeachAdminUser, XPeachBillingRate, XPeachHealthRequest, XPeachHealthRow, XPeachPricingCatalog,
  XPeachBindKeyRequest, XPeachBindResult, XPeachModel, XPeachModelsRequest,
  XPeachSelfRequest, XPeachTokenLogEntry, XPeachTokenLogsRequest,
  XPeachChatReply, XPeachChatRequest, XPeachChannel, XPeachRedemption, XPeachWriteResult,
  XPeachTokenPage, XPeachTokenUsage, XPeachTokenUsageRequest, XPeachTokensRequest, XPeachUserSelf,
  XPeachModelPricingChange, XPeachModelSyncResult, XPeachSiteCatalog, XPeachSelfLogPage,
  XPeachSelfLogStat, XPeachNetworkPoint, XPeachNetworkSnapshot, XPeachModelPricingSnapshot,
  XPeachModelPerfDetail, XPeachModelPerfSummary,
} from './types.ts'

export type * from './types.ts'
export {
  buildMacosPkgInstaller,
  inspectMacosInstallerStatus,
  runMacosInstallerAction,
  type MacosInstallerOptions,
} from './macos-installer.ts'
export {
  XPEACH_CHANNEL_RANK,
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
  type ParsedXPeachVersion,
  type XPeachCheckUpdateRequest,
  type XPeachReleaseCandidate,
  type XPeachReleaseChannel,
  type XPeachSetUpdateChannelRequest,
  type XPeachUpdateChannelStatus,
  type XPeachUpdateCheckResult,
  type XPeachUpdatePreference,
} from './update-channel.ts'
export {
  XPeachApi,
  candidateSsoBaseURLs,
  parseSsoIssuer,
  validateSsoBaseUrl,
  validateVerificationUrl,
  type ParsedSsoIssuer,
} from './api.ts'
export {
  DEFAULT_ENABLED_REASONING_EFFORTS,
  DEFAULT_MODEL_ROUTING_STATE,
  ENDPOINT_POOLS,
  endpointForProviderKey,
  normalizeModelRoutingState,
  providerKeyForEndpoint,
  recommendedModelEndpoint,
} from './model-routing.ts'
export {
  dispatchHostSystemNotification,
  resetHostSystemNotificationCache,
  type XPeachSystemNotificationKind,
  type XPeachSystemNotificationOptions,
  type XPeachSystemNotificationRequest,
  type XPeachSystemNotificationResult,
} from './system-notification.ts'
import {
  dispatchHostSystemNotification,
  type XPeachSystemNotificationRequest,
  type XPeachSystemNotificationResult,
} from './system-notification.ts'


declare module '@xpeach/xph-typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** 令牌身份尚未确认，调用方应在凭据稳定后重试。 */
    'xpeach/identity-incomplete': { readonly reason: 'identity-unknown' | 'identity-budget-exhausted' | 'credential-changed' | 'credential-write-incomplete' }
    /** No credential resolved for the configured reference. */
    'xpeach/missing-credential': { readonly ref: string }
    /** The site rejected or failed the management request. */
    'xpeach/request-failed': { readonly status: number; readonly message: string }
    /** An SSO or verification URL failed scheme, origin, or credential validation. */
    'xpeach/invalid-sso-url': Record<string, never>
  }
}

/** Deployment knobs for the XPeach site route. */
export interface Config {
  /** New API site root used for management calls (default https://xpeach.codes). */
  readonly baseURL?: string
  /** Credential reference resolved per call (default XPEACH_API_KEY). */
  readonly apiKeyEnv?: string
  /**
   * Which wire a model uses when the site advertises several
   * (default `compatible`, i.e. chat completions). `native` prefers Anthropic
   * messages and the Responses API, which keep cache breakpoints and reasoning
   * state but only work where the relay routes those endpoints.
   */
  readonly protocolPreference?: ModelProtocolPreference
  /**
   * Model families (the site's `groups`) the catalogue keeps. Absent or empty
   * keeps every family, so a fresh profile is not silently narrowed.
   */
  readonly enabledFamilies?: readonly string[]
  /** Whether product providers inject `X-Session-ID` and `X-Conversation-ID` tracking headers (default true). */
  readonly conversationTracking?: boolean
  /** Whether startup and settings changes automatically sync the site model catalog into `llm-pi-ai` (default true). */
  readonly autoSyncModels?: boolean
  /** Remote JSON URL for dynamic model context-window and capability metadata sync. */
  readonly modelMetadataUrl?: string
  /**
   * Site-management token store path (default $XPH_HOME/profiles/xpeach/xpeach.admin):
   * the New API system access token authenticating admin endpoints as the site
   * owner. Profile-local like keyFile — optional; admin surfaces stay honest
   * "not bound" while absent.
   */
  readonly adminKeyFile?: string
  /** Process-env variable for the admin token (default XPEACH_ADMIN_KEY). */
  readonly adminKeyVar?: string
  /**
   * Session-cookie store path (default $XPH_HOME/profiles/xpeach/xpeach.session).
   * New API's user-write endpoints need the site's own session cookie —
   * Turnstile blocks programmatic login so the user pastes 'session=' here.
   */
  readonly sessionKeyFile?: string
  /** Process-env variable for the session cookie (default XPEACH_SESSION). */
  readonly sessionKeyVar?: string
  /** Per-request timeout in milliseconds (default 15000). */
  readonly timeoutMs?: number
  /** 身份解析和写组查行的最大分页数，默认 10。 */
  readonly tokenPageLimit?: number
  /** 管理接口每页令牌条数，默认 100。 */
  readonly tokenPageSize?: number
  /** 每次身份解析最多 reveal 的令牌数，默认 16。 */
  readonly tokenRevealLimit?: number
  /** Relay 原子状态文件；未指定时位于既有共享凭据根目录。 */
  readonly relayStateFile?: string
  /** 等待凭据事务锁的最长时间，默认 5000 毫秒。 */
  readonly credentialLockWaitMs?: number
  /**
   * Harness-configured model ids the section cross-checks against the site
   * catalog — the "is my model actually available" answer.
   */
  readonly watchModels?: string[]
  /**
   * Independent key store path (default $XPH_HOME/profiles/xpeach/xpeach.key).
   * Deliberately outside the shared credentials.yaml — deleting entries there
   * never disturbs this harness.
   */
  readonly keyFile?: string
  /**
   * Process-env variable the key is exported under for the LLM providers'
   * apiKeyEnv resolution (default XPEACH_RELAY_KEY). Not the shared
   * credentials.yaml reference — our own channel.
   */
  readonly keyVar?: string
  /** XPeach SSO root URL used for Device Authorization and credential bridging. */
  readonly ssoBaseURL?: string
  /** Client identifier registered with XPeach SSO Device Authorization. */
  readonly ssoClientId?: string
  /** Profile-local file storing bound SSO identity metadata (`xpeach.sso.json`). */
  readonly ssoStateFile?: string
  /** Subscribed release update channel (`'least' | 'beta' | 'alpha'`); inferred from the current version when unset. */
  readonly updateChannel?: XPeachReleaseChannel
  /** Whether automatic update checks are enabled (default `true`). */
  readonly autoCheckUpdate?: boolean
}

let cachedFileRuntimeVersion: string | undefined

function readCurrentRuntimeVersion(): string {
  for (const envVar of [process.env.XPEACH_VERSION, process.env.DSH_CLIENT_VERSION]) {
    if (typeof envVar === 'string' && parseXpeachVersion(envVar) !== null) {
      return envVar.trim()
    }
  }
  if (cachedFileRuntimeVersion !== undefined) {
    return cachedFileRuntimeVersion
  }
  const baseDir = import.meta.dirname
  const candidates = [
    join(baseDir, '..', 'package.json'),
    join(baseDir, '..', '..', 'package.json'),
    join(baseDir, '..', '..', '..', 'version.json'),
    join(baseDir, '..', '..', '..', '..', 'version.json'),
  ]
  for (const file of candidates) {
    if (!existsSync(file)) continue
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as { version?: unknown }
      if (typeof parsed.version === 'string' && parsed.version.trim().length > 0) {
        cachedFileRuntimeVersion = parsed.version.trim()
        return cachedFileRuntimeVersion
      }
    } catch (_err) { /* try next candidate */ }
  }
  cachedFileRuntimeVersion = '0.0.23-alpha'
  return cachedFileRuntimeVersion
}

/**
 * Directory holding this profile's own state files.
 *
 * The desktop application runs a distinct profile, so the path cannot be
 * hard-coded to the CLI profile name.
 * @returns absolute profile directory.
 */
function profileHome(): string {
  const home = process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homedir(), '.xph')
  const profile = process.env.XPH_PROFILE ?? process.env.DSH_PROFILE ?? 'xpeach'
  return join(home, 'profiles', profile)
}

const INITIAL_PROFILE_HOME = profileHome()

const BROWSER_SENSITIVE_ENV_PATTERN = /KEY|PASSWORD|SECRET|TOKEN|SESSION|COOKIE|AUTH/i
const BROWSER_BLOCKED_ENV_PREFIXES = ['XPEACH_', 'XPH_', 'DSH_'] as const

/**
 * Scrub credential-shaped and harness-prefixed environment variables before
 * launching an external system browser process.
 *
 * @param source - parent environment map to filter (defaults to `process.env`).
 * @returns sanitized environment dictionary safe to pass to `spawn(..., { env })`.
 */
export function scrubbedBrowserEnv(source: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue
    const upper = key.toUpperCase()
    if (BROWSER_SENSITIVE_ENV_PATTERN.test(key)) continue
    if (BROWSER_BLOCKED_ENV_PREFIXES.some(prefix => upper.startsWith(prefix))) continue
    env[key] = value
  }
  return env
}

function abortReasonError(signal: AbortSignal): Error {
  const reason: unknown = signal.reason
  if (reason instanceof Error) return reason
  return new DOMException(typeof reason === 'string' && reason.length > 0 ? reason : 'The operation was aborted.', 'AbortError')
}

/**
 * Race a shared in-flight promise against a caller-specific `AbortSignal`
 * without propagating that caller's cancellation into the shared work.
 */
async function raceWithAbortSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal === undefined) return await promise
  if (signal.aborted) throw abortReasonError(signal)
  let onAbort: (() => void) | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, rejectPromise) => {
        onAbort = (): void => {
          rejectPromise(abortReasonError(signal))
        }
        signal.addEventListener('abort', onAbort, { once: true })
      }),
    ])
  } finally {
    if (onAbort !== undefined) {
      signal.removeEventListener('abort', onAbort)
    }
  }
}

/**
 * Create an internal `.unref()`'d timeout controller for shared single-flight work
 * so cancelling one caller never cancels peer callers waiting on the same flight.
 */
function createInternalTimeoutController(timeoutMs: number, message: string): {
  readonly signal: AbortSignal
  readonly clear: () => void
} {
  const controller = new AbortController()
  const safeMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15_000
  const timer = setTimeout(() => {
    controller.abort(new DOMException(message, 'TimeoutError'))
  }, safeMs)
  timer.unref()
  return {
    signal: controller.signal,
    clear: () => { clearTimeout(timer) },
  }
}

/**
 * Sleep for `ms` milliseconds using an `.unref()`'d timer that wakes and rejects
 * immediately when `signal` aborts.
 *
 * @param ms - sleep duration in milliseconds.
 * @param signal - optional cancellation signal.
 */
export function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(abortReasonError(signal))
  }
  return new Promise<void>((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer)
      reject(signal !== undefined ? abortReasonError(signal) : new DOMException('The operation was aborted.', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    timer.unref()
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

interface ReconcileSessionHeader {
  readonly id: string
  readonly createdAt: number | string
  readonly cwd?: string
}

interface ReconcileSessionSnapshot {
  readonly id?: string
  readonly header: ReconcileSessionHeader
  readonly events?: readonly object[]
}

interface ReconcileSessionHandle {
  readonly inheritedEventCount?: number
  read(): Promise<ReconcileSessionSnapshot>
  close(): Promise<void>
}

interface ReconcileSessionPersistence {
  list(): Promise<readonly (ReconcileSessionSnapshot | string)[]>
  open(id: string, mode: 'read'): Promise<ReconcileSessionHandle>
}

interface ReconcileProjectionCache {
  cachedSnapshot(headerOrId: ReconcileSessionHeader | string): object | undefined | Promise<object | undefined>
  coldSnapshot(
    headerOrSnapshot: ReconcileSessionHeader | ReconcileSessionSnapshot,
    inheritedEventCount?: number,
    events?: readonly object[],
  ): object | Promise<object>
  get?(
    sessionId: string,
    name: string,
  ): {
    readonly pending?: {
      readonly provider: string
      readonly model: string
      readonly reasoningEffort?: string | undefined
    } | null | undefined
    readonly lastUsed?: {
      readonly provider: string
      readonly model: string
      readonly reasoningEffort?: string | undefined
    } | null | undefined
  } | undefined
}

interface LiveSessionControllerService {
  selectModel(request: {
    readonly sessionId: string
    readonly provider: string
    readonly model: string
    readonly reasoningEffort?: string | null | undefined
  }): Promise<unknown>
}

interface ReconcileWorkspaceEntity {
  readonly id: string
  readonly rootPath: string
  readonly sessionIds: readonly string[]
  attachSession(sessionId: string): void | Promise<void>
}

interface ReconcileWorkspaceRegistry {
  list(): readonly ReconcileWorkspaceEntity[]
  create(rootPath: string): Promise<ReconcileWorkspaceEntity>
}

interface LiveSkillEntry {
  readonly name: string
  readonly description: string
  readonly location?: string | undefined
  readonly path?: string | undefined
}

interface LiveSkillService {
  list(): readonly LiveSkillEntry[]
}

interface LiveAgentDefaultModelService {
  currentSelection(): {
    readonly provider: string
    readonly model: string
    readonly reasoningEffort?: string | undefined
  } | undefined
  saveSelection(selection: {
    readonly provider: string
    readonly model: string
    readonly reasoningEffort?: string | undefined
  }): Promise<{
    readonly provider: string
    readonly model: string
    readonly reasoningEffort?: string | undefined
  }>
}

interface LiveToolsService {
  schemas(): readonly {
    readonly name: string
    readonly description?: string
  }[]
}

function unwrapConfigValue<T>(value: T): T {
  if (typeof value === 'object' && value !== null && 'get' in value && typeof (value as { get?: unknown }).get === 'function') {
    return (value as { get: () => T }).get()
  }
  return value
}

interface StoredSsoState {
  readonly accessToken?: string | undefined
  readonly refreshToken?: string | undefined
  readonly idToken?: string | undefined
  readonly expiresIn?: number | undefined
  readonly issuer?: string | undefined
  readonly clientId?: string | undefined
  readonly user?: {
    readonly id?: string | undefined
    readonly username?: string | null | undefined
    readonly email?: string | null | undefined
    readonly name?: string | null | undefined
    readonly picture?: string | null | undefined
  } | undefined
  readonly peachcodeUserId?: number | undefined
  readonly boundAt?: number | string | undefined
}

interface CredentialSnapshot {
  relay: RelaySnapshot
}

function isAccountModelProvider(provider: string): boolean {
  return provider === 'xpeach' || provider === 'xpeach-openai-responses' || provider === 'xpeach-anthropic'
}

/** Requesting UI identity metadata for `DeepSeekAccount` operations. */
export interface DeepSeekAccountClientMetadata {
  /** Client application version string. */
  readonly version: string
  /** Active UI language tag. */
  readonly locale: string
  /** Offset from UTC in seconds. */
  readonly timezoneOffsetSeconds: number
}

/** Safe failure codes rendered through the caller's locale dictionary. */
export type DeepSeekSignInErrorCode = 'no-response' | 'network' | 'protocol' | 'expired' | 'storage'

/** Latest login attempt projection, including terminal outcomes until the next attempt. */
export interface DeepSeekSignInAttemptView {
  /** Identity of the local login attempt. */
  readonly id: string
  /** Current lifecycle phase of the login attempt. */
  readonly phase: 'initializing' | 'waiting-browser' | 'exchanging' | 'committing' | 'succeeded' | 'cancelled' | 'expired' | 'failed'
  /** Verification URL to open in the user's browser while waiting for approval. */
  readonly authorizeUrl?: string
  /** Expiration timestamp in epoch milliseconds. */
  readonly expiresAt?: number
  /** Safe error code when the attempt failed or expired. */
  readonly errorCode?: DeepSeekSignInErrorCode
}

/** Client-safe account state projection returned by `DeepSeekAccount`. */
export interface DeepSeekAccountView {
  /** Whether local account credentials are stored. */
  readonly status: 'signed-out' | 'credential-stored'
  /** Browser destinations for usage and top-up consoles. */
  readonly links: {
    readonly usageUrl: string
    readonly topUpUrl: string
  }
  /** Active or most recent sign-in attempt, or `null` when none exists. */
  readonly attempt: DeepSeekSignInAttemptView | null
}

/** Display-safe profile outcome returned by `DeepSeekAccount.getProfile()`. */
export type DeepSeekAccountProfileOutcome =
  | {
    readonly status: 'ready'
    readonly value: {
      readonly id: string | null
      readonly name: string | null
      readonly contact: string | null
      readonly avatarUrl: string | null
    }
  }
  | {
    readonly status: 'failed'
  }

/** Wallet balance outcome returned by `DeepSeekAccount.getBalance()`. */
export type DeepSeekAccountBalanceOutcome =
  | {
    readonly status: 'ready'
    readonly value: readonly {
      readonly currency: 'CNY' | 'USD'
      readonly balance: string
    }[]
    readonly bonusWallets: readonly {
      readonly currency: 'CNY' | 'USD'
      readonly balance: string
    }[]
  }
  | {
    readonly status: 'failed'
  }

/** Host-only platform session credentials returned by `DeepSeekAccount.getPlatformSession()`. */
export interface DeepSeekPlatformSession {
  /** Platform origin URL. */
  readonly origin: string
  /** Bearer token for the platform session. */
  readonly token: string
  /** Stable account identifier, or `null` when unknown. */
  readonly userId: string | null
}

/**
 * Cordis `deepseekAccount` service provider backed by XPeach SSO Device Flow
 * and the PeachCode (NewAPI) credential bridge.
 */
export class XPeachDeepSeekAccount extends Service {
  private readonly account: XPeachAccount
  private attempt: DeepSeekSignInAttemptView | null = null
  private attemptAbort: AbortController | undefined
  private readonly watchers = new Set<(identityChanged: boolean) => void>()

  constructor(ctx: Context, account: XPeachAccount) {
    super(ctx, 'deepseekAccount')
    this.account = account
  }

  /**
   * Notify all active `watch()` subscribers that account state or identity changed.
   *
   * @param identityChanged - whether the change represents an identity transition.
   */
  notifyWatchers(identityChanged: boolean): void {
    for (const notify of this.watchers) {
      try {
        notify(identityChanged)
      } catch (_err) { /* ignore watcher error */ }
    }
  }

  /**
   * Handle local credential revocation by aborting any pending device flow and
   * updating the attempt state before notifying watchers.
   *
   * @param reason - reason local credentials were revoked.
   */
  onLocalCredentialsRevoked(reason: 'revoked' | 'banned' | 'signed-out' | 'expired'): void {
    if (
      this.attempt?.phase === 'initializing'
      || this.attempt?.phase === 'waiting-browser'
      || this.attempt?.phase === 'exchanging'
    ) {
      this.attemptAbort?.abort()
    }
    this.attempt = reason === 'signed-out'
      ? null
      : {
        id: this.attempt?.id ?? `revoked-${String(Date.now())}`,
        phase: reason === 'expired' ? 'expired' : 'failed',
        errorCode: reason === 'expired' ? 'expired' : 'protocol',
      }
    this.notifyWatchers(true)
  }

  /**
   * Read the client-safe account state and latest login attempt.
   *
   * @returns promise resolving to the current `AccountView` projection.
   */
  getState(): Promise<DeepSeekAccountView> {
    const status = this.account.isBound() ? 'credential-stored' : 'signed-out'
    return Promise.resolve({
      status,
      links: {
        usageUrl: 'https://xpeach.codes/console',
        topUpUrl: 'https://xpeach.codes/topup',
      },
      attempt: this.attempt !== null ? { ...this.attempt } : null,
    })
  }

  /**
   * Start a new XPeach SSO Device Authorization sign-in attempt.
   *
   * @param client - optional requesting UI metadata or label.
   * @param _callbackOrigin - unused loopback callback origin.
   * @param loginSource - optional initiating UI surface (`'web'` or `'desktop'`).
   * @returns initial account state snapshot with the active sign-in attempt.
   */
  async startSignIn(
    client?: DeepSeekAccountClientMetadata | string,
    _callbackOrigin?: string,
    loginSource?: string,
  ): Promise<DeepSeekAccountView> {
    if (
      this.attempt?.phase === 'initializing'
      || this.attempt?.phase === 'waiting-browser'
      || this.attempt?.phase === 'exchanging'
    ) {
      this.attemptAbort?.abort()
    }
    const attemptId = `sso-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`
    const abortController = new AbortController()
    this.attemptAbort = abortController

    this.attempt = {
      id: attemptId,
      phase: 'initializing',
    }
    this.notifyWatchers(false)

    const rawLabel = typeof client === 'string'
      ? client.trim()
      : typeof client?.version === 'string' && client.version.trim().length > 0
        ? `${loginSource ?? process.platform}/${client.version.trim()}`
        : loginSource ?? ''
    const clientLabel = rawLabel.length > 0
      ? `XPeach Harness (${rawLabel})`
      : `XPeach Harness (${process.platform})`

    const pkceStarter = (this.account as {
      ssoPkceLoopbackStartOp?: (
        request: { readonly openBrowser?: boolean | undefined },
        signal: AbortSignal,
      ) => Promise<{
        readonly authorizationUrl: string
        readonly expiresIn: number
        readonly waitForBound: () => Promise<XPeachSsoDevicePollResult>
      }>
    }).ssoPkceLoopbackStartOp

    if (typeof pkceStarter === 'function' && process.env.XPEACH_SSO_LOGIN_MODE !== 'device') {
      try {
        const pkceStarted = await pkceStarter.call(this.account, { openBrowser: false }, abortController.signal)
        this.attempt = {
          id: attemptId,
          phase: 'waiting-browser',
          authorizeUrl: pkceStarted.authorizationUrl,
          expiresAt: Date.now() + (pkceStarted.expiresIn || 300) * 1000,
        }
        this.notifyWatchers(false)
        void (async () => {
          try {
            const outcome = await pkceStarted.waitForBound()
            if (abortController.signal.aborted || this.attempt?.id !== attemptId) return
            if (outcome.status === 'approved' && outcome.bound === true) {
              this.attempt = { id: attemptId, phase: 'succeeded' }
              this.notifyWatchers(true)
              return
            }
            this.attempt = {
              id: attemptId,
              phase: outcome.status === 'expired' ? 'expired' : 'failed',
              errorCode: outcome.status === 'expired' ? 'expired' : 'protocol',
            }
            this.notifyWatchers(false)
          } catch (err) {
            if (abortController.signal.aborted || this.attempt?.id !== attemptId) return
            const isExpired = err instanceof Error && (err.message.includes('超时') || err.message === 'expired_token')
            this.attempt = {
              id: attemptId,
              phase: isExpired ? 'expired' : 'failed',
              errorCode: isExpired ? 'expired' : 'network',
            }
            this.notifyWatchers(false)
          }
        })()
        return await this.getState()
      } catch (_pkceFallbackErr) {
        if (abortController.signal.aborted) return await this.getState()
      }
    }

    try {
      const started = await this.account.ssoDeviceStartOp(
        { openBrowser: false, clientName: clientLabel },
        abortController.signal,
      )
      this.attempt = {
        id: attemptId,
        phase: 'waiting-browser',
        authorizeUrl: started.verificationUriComplete,
        expiresAt: Date.now() + (started.expiresIn || 600) * 1000,
      }
      this.notifyWatchers(false)
      void this.pollDeviceAttempt(attemptId, started.deviceCode, started.interval || 2, abortController.signal)
      return await this.getState()
    } catch (err) {
      const isExpired = err instanceof Error && err.message === 'expired_token'
      this.attempt = {
        id: attemptId,
        phase: isExpired ? 'expired' : 'failed',
        errorCode: isExpired ? 'expired' : 'network',
      }
      this.notifyWatchers(false)
      return await this.getState()
    }
  }

  private async pollDeviceAttempt(
    attemptId: string,
    deviceCode: string,
    intervalSec: number,
    signal: AbortSignal,
  ): Promise<void> {
    let intervalMs = Math.max(1500, intervalSec * 1000)
    const isAborted = (): boolean => signal.aborted
    const currentAttempt = (): DeepSeekSignInAttemptView | null => this.attempt
    while (!isAborted() && currentAttempt()?.id === attemptId && currentAttempt()?.phase === 'waiting-browser') {
      const expiresAt = currentAttempt()?.expiresAt
      if (expiresAt !== undefined && Date.now() >= expiresAt) {
        this.attempt = {
          id: attemptId,
          phase: 'expired',
          errorCode: 'expired',
        }
        this.notifyWatchers(false)
        return
      }
      try {
        await sleepWithAbort(intervalMs, signal)
      } catch (_abortErr) {
        return
      }
      if (isAborted() || currentAttempt()?.id !== attemptId) return
      const postWaitExpiresAt = currentAttempt()?.expiresAt
      if (postWaitExpiresAt !== undefined && Date.now() >= postWaitExpiresAt) {
        this.attempt = {
          id: attemptId,
          phase: 'expired',
          errorCode: 'expired',
        }
        this.notifyWatchers(false)
        return
      }
      try {
        const polled = await this.account.ssoDevicePollOp({ deviceCode }, signal)
        if ((polled.status as string) === 'slow_down') {
          intervalMs += 5000
          continue
        }
        if (polled.status === 'pending') {
          if (polled.message === 'slow_down') {
            intervalMs += 5000
          }
          continue
        }
        if (polled.status === 'approved') {
          this.attempt = { id: attemptId, phase: 'succeeded' }
          this.notifyWatchers(true)
          return
        }
        const isExpired = polled.status === 'expired' || polled.message === 'expired_token'
        this.attempt = {
          id: attemptId,
          phase: isExpired ? 'expired' : 'failed',
          errorCode: isExpired
            ? 'expired'
            : polled.status === 'denied'
              ? 'protocol'
              : 'network',
        }
        this.notifyWatchers(false)
        return
      } catch (err) {
        if (isAborted()) return
        const isExpired = err instanceof Error && err.message === 'expired_token'
        this.attempt = {
          id: attemptId,
          phase: isExpired ? 'expired' : 'failed',
          errorCode: isExpired ? 'expired' : 'network',
        }
        this.notifyWatchers(false)
        return
      }
    }
  }

  /**
   * Cancel the active sign-in attempt if it matches `id`.
   *
   * @param id - optional attempt identifier to cancel.
   * @returns settled account state snapshot.
   */
  async cancelSignIn(id?: string): Promise<DeepSeekAccountView> {
    if (
      this.attempt !== null
      && (this.attempt.phase === 'initializing' || this.attempt.phase === 'waiting-browser' || this.attempt.phase === 'exchanging')
      && (id === undefined || this.attempt.id === id)
    ) {
      this.attemptAbort?.abort()
      this.attempt = { id: this.attempt.id, phase: 'cancelled' }
      this.notifyWatchers(false)
    }
    return await this.getState()
  }

  /**
   * Sign out of XPeach SSO and clear all local credentials.
   *
   * @param _client - optional requesting UI metadata.
   * @returns signed-out account state snapshot.
   */
  async signOut(_client?: DeepSeekAccountClientMetadata | string): Promise<DeepSeekAccountView> {
    if (
      this.attempt !== null
      && (this.attempt.phase === 'initializing' || this.attempt.phase === 'waiting-browser' || this.attempt.phase === 'exchanging')
    ) {
      this.attemptAbort?.abort()
    }
    this.attempt = null
    await this.account.ssoLogoutOp({ allDevices: false, revokePeachcode: false }, AbortSignal.timeout(8_000))
    this.notifyWatchers(true)
    return await this.getState()
  }

  /**
   * Query display-safe account profile data.
   *
   * @param _client - optional requesting UI metadata.
   * @returns profile outcome, or `null` when signed out.
   */
  async getProfile(_client?: DeepSeekAccountClientMetadata | string): Promise<DeepSeekAccountProfileOutcome | null> {
    if (!this.account.isBound()) return null
    try {
      const profile = await this.account.getProfile(true)
      return {
        status: 'ready',
        value: {
          id: profile.id || null,
          name: profile.name || null,
          contact: profile.contact || null,
          avatarUrl: null,
        },
      }
    } catch (_err) {
      return { status: 'failed' }
    }
  }

  /**
   * Query account wallet balances.
   *
   * @param _client - optional requesting UI metadata.
   * @returns balance outcome, or `null` when signed out.
   */
  async getBalance(_client?: DeepSeekAccountClientMetadata | string): Promise<DeepSeekAccountBalanceOutcome | null> {
    if (!this.account.isBound()) return null
    try {
      const bal = await this.account.getBalance(true)
      if (!bal.available) {
        return { status: 'failed' }
      }
      return {
        status: 'ready',
        value: [{ currency: 'USD', balance: bal.totalBalance }],
        bonusWallets: [],
      }
    } catch (_err) {
      return { status: 'failed' }
    }
  }

  /**
   * Query unnotified bonus grants (none on XPeach).
   *
   * @param _client - optional requesting UI metadata.
   * @returns always `null`.
   */
  getUnnotifiedBonuses(_client?: DeepSeekAccountClientMetadata | string): Promise<null> {
    return Promise.resolve(null)
  }

  /**
   * Acknowledge a displayed bonus notification.
   *
   * @param _accountId - account identifier or legacy id list.
   * @param _orderId - bonus order identifier.
   * @param _client - optional requesting UI metadata.
   * @returns always `false`.
   */
  ackBonusNotified(
    _accountId?: string | readonly number[],
    _orderId?: string,
    _client?: DeepSeekAccountClientMetadata | string,
  ): Promise<boolean> {
    return Promise.resolve(false)
  }

  private allowedOrigins(): Set<string> {
    if (typeof this.account.allowedRelayOrigins === 'function') {
      const list = this.account.allowedRelayOrigins()
      if (list.length > 0) return new Set(list)
    }
    const origins = new Set<string>()
    const currentRoot = typeof this.account.currentSiteRoot === 'function'
      ? this.account.currentSiteRoot()
      : undefined
    if (typeof currentRoot === 'string' && currentRoot.trim().length > 0) {
      try {
        const origin = new URL(currentRoot.trim()).origin
        origins.add(origin)
        if (ROUTES.some(route => route.url === origin)) {
          for (const route of ROUTES) origins.add(route.url)
        }
      } catch { /* ignore invalid */ }
    }
    return origins
  }

  /**
   * Resolve the active inference relay token when signed in.
   *
   * @param urlOrSignal - optional destination URL or cancellation signal.
   * @param signal - optional cancellation signal.
   * @returns active relay token, or `undefined` when signed out, origin-mismatched, or unavailable.
   */
  async resolveToken(urlOrSignal?: string | AbortSignal, signal?: AbortSignal): Promise<string | undefined> {
    const effectiveSignal = urlOrSignal instanceof AbortSignal ? urlOrSignal : signal
    if (typeof urlOrSignal === 'string') {
      let targetOrigin: string
      try {
        const parsed = new URL(urlOrSignal.trim())
        if (parsed.username !== '' || parsed.password !== '') return undefined
        targetOrigin = parsed.origin
      } catch {
        return undefined
      }
      if (!this.allowedOrigins().has(targetOrigin)) {
        return undefined
      }
    }
    if (!this.account.isBound()) return undefined
    try {
      return await this.account.resolveVerifiedRelayKey(false, effectiveSignal)
    } catch (_err) {
      return undefined
    }
  }

  /**
   * Handle an inference-rejected token by re-verifying the SSO session.
   *
   * @param _rejectedToken - token rejected by the inference endpoint.
   * @param signal - optional cancellation signal.
   */
  async rejectToken(_rejectedToken: string, signal?: AbortSignal): Promise<void> {
    await this.account.resolveVerifiedRelayKey(true, signal).catch(() => undefined)
  }

  /**
   * Read the current platform session for embedded platform consumers.
   *
   * @returns platform session snapshot, or `null` when signed out.
   */
  getPlatformSession(): Promise<DeepSeekPlatformSession | null> {
    if (!this.account.isBound()) return Promise.resolve(null)
    const sess = this.account.currentPlatformSession()
    if (sess.status !== 'signed-in' || !sess.bearerToken) {
      return Promise.resolve(null)
    }
    return Promise.resolve({
      origin: 'https://xpeach.codes',
      token: sess.bearerToken,
      userId: sess.userId || null,
    })
  }

  /**
   * Read device and account identity for product telemetry.
   *
   * @returns device identifier, optional user identifier, and OS version string.
   */
  getDeviceIdentity(): Promise<{ deviceId?: string; userId?: string; osVersion: string }> {
    const sess = this.account.isBound() ? this.account.currentPlatformSession() : { status: 'signed-out' as const }
    const userId = sess.status === 'signed-in' && sess.userId ? sess.userId : undefined
    return Promise.resolve({
      deviceId: 'xpeach-harness',
      ...(userId !== undefined ? { userId } : {}),
      osVersion: `${process.platform}-${release()}`,
    })
  }

  /**
   * Stream complete `AccountView` snapshots starting with the immediate current state
   * and yielding on every subsequent state change until `signal` aborts.
   *
   * @param signal - optional subscription cancellation signal.
   * @param includeIdentityChanges - whether to emit when identity metadata changes.
   * @returns async generator of `AccountView` snapshots.
   */
  async *watch(signal?: AbortSignal, includeIdentityChanges = false): AsyncGenerator<DeepSeekAccountView, void, void> {
    const isAborted = (): boolean => signal?.aborted === true
    if (isAborted()) return
    const watchState: { pending: boolean; wake: (() => void) | undefined } = {
      pending: false,
      wake: undefined,
    }
    const onNotify = (identityChanged: boolean): void => {
      if (identityChanged && !includeIdentityChanges) return
      watchState.pending = true
      watchState.wake?.()
    }
    const onAbort = (): void => {
      watchState.wake?.()
    }
    this.watchers.add(onNotify)
    signal?.addEventListener('abort', onAbort, { once: true })
    try {
      yield await this.getState()
      while (!isAborted()) {
        if (!watchState.pending) {
          await new Promise<void>((resolvePromise) => {
            watchState.wake = resolvePromise
          })
          watchState.wake = undefined
        }
        if (isAborted()) return
        if (watchState.pending) {
          watchState.pending = false
          yield await this.getState()
        }
      }
    } finally {
      this.watchers.delete(onNotify)
      signal?.removeEventListener('abort', onAbort)
    }
  }
}

/** Host service backing the generated `xpeach` Remote namespace. */
export class XPeachAccount extends TypertRemoteService {
  static inject = ['typert', 'credentials', 'settings']

  /** Whether this process already refreshed the picker catalog from the site. */
  private catalogSynced = false
  /** In-flight catalog sync promise used to deduplicate concurrent sync calls. */
  private catalogSyncPromise: Promise<XPeachModelSyncResult> | undefined
  /** In-flight session/workspace reconciliation promise used to deduplicate concurrent runs. */
  private reconcilePromise: Promise<void> | undefined
  /** Optional override for candidate home directories used during session/skill reconciliation. */
  candidateHomes: readonly string[] | undefined

  static Config = z.object({
    baseURL: z.string().default('https://fast.xpeach.codes'),
    apiKeyEnv: z.string().role('credential-ref').default('XPEACH_API_KEY'),
    protocolPreference: z.union(['compatible', 'native', 'auto']).default('compatible').volatile(),
    enabledFamilies: z.array(z.string()).default([]).volatile(),
    conversationTracking: z.boolean().default(true).volatile(),
    autoSyncModels: z.boolean().default(true).volatile(),
    modelMetadataUrl: z.string().default('https://raw.githubusercontent.com/yellowpeachxgp/xpeach-harness/main/resources/model-metadata.json').volatile(),
    timeoutMs: z.natural().min(1000).default(15000).volatile(),
    tokenPageLimit: z.natural().min(1).default(DEFAULT_TOKEN_LOOKUP_LIMITS.pages),
    tokenPageSize: z.natural().min(1).default(DEFAULT_TOKEN_LOOKUP_LIMITS.pageSize),
    tokenRevealLimit: z.natural().min(1).default(DEFAULT_TOKEN_LOOKUP_LIMITS.reveals),
    relayStateFile: z.string(),
    credentialLockWaitMs: z.natural().min(1).default(5000),
    watchModels: z.array(z.string()).default([
      'swe-2-max',
    ]).volatile(),
    adminKeyFile: z.string().default(join(INITIAL_PROFILE_HOME, 'xpeach.admin')),
    adminKeyVar: z.string().default('XPEACH_ADMIN_KEY'),
    sessionKeyFile: z.string().default(join(INITIAL_PROFILE_HOME, 'xpeach.session')),
    sessionKeyVar: z.string().default('XPEACH_SESSION'),
    keyFile: z.string().default(join(INITIAL_PROFILE_HOME, 'xpeach.key')),
    keyVar: z.string().default('XPEACH_RELAY_KEY'),
    ssoBaseURL: z.string().default(process.env.XPEACH_SSO_URL ?? 'https://sso.xpeach.codes').volatile(),
    ssoClientId: z.string().default('xpeach-harness').volatile(),
    ssoStateFile: z.string().default(join(INITIAL_PROFILE_HOME, 'xpeach.sso.json')),
    updateChannel: z.union(['least', 'beta', 'alpha']).volatile(),
    autoCheckUpdate: z.boolean().default(true).volatile(),
  })

  private subscribedUpdateChannel: XPeachReleaseChannel | undefined
  private autoCheckUpdateEnabled: boolean | undefined
  private releasesCache: { at: number; items: readonly XPeachReleaseCandidate[] } | undefined
  private updateCheckInFlight: Promise<readonly XPeachReleaseCandidate[]> | undefined
  private githubApiRateLimitedUntil: number | undefined

  private readonly liveConfig: Config
  private readonly baseURL: string
  private activeBaseURL: string
  private networkAuto = true
  private networkSnapshot: XPeachNetworkSnapshot | undefined
  private readonly networkHistory: Record<string, XPeachNetworkPoint[]> = {}
  private readonly routeFile: string
  private networkApplied = false
  private readonly apiKeyEnv: CredentialRef
  private timeoutMs: number
  private watchModels: string[]
  private readonly api: XPeachApi
  private healthCache: { at: number; rows: readonly XPeachHealthRow[] } | undefined
  private readonly adminKeyFile: string
  private readonly adminKeyVar: string
  private readonly sessionKeyFile: string
  private readonly sessionKeyVar: string
  private readonly keyFile: string
  private protocolPreference: ModelProtocolPreference
  /** Model families the catalogue keeps; empty means every family. */
  private enabledFamilies: readonly string[]

  private readonly keyVar: string
  private readonly ssoStateFile: string
  private readonly deepseekAccountBridge: XPeachDeepSeekAccount | undefined
  private revokingPromise: Promise<void> | undefined
  private ssoVerifyPromise: Promise<XPeachSsoSessionStatus> | undefined
  private lastSsoVerifyAt = 0
  private sharedCredentialsAdopted = false
  private lastAccountSettingsSnapshot: ReturnType<typeof readAccountSettings> | undefined
  private lastEnsureTokenInfoAt = 0
  private relayState: RelayState | undefined
  private relayReady: Promise<void> | undefined
  private usageCache: { at: number; key: string; usage: XPeachTokenUsage } | undefined
  private usageInFlight: Promise<XPeachTokenUsage> | undefined
  private perfSummaryCache: { at: number; hours: number; items: readonly XPeachModelPerfSummary[] } | undefined
  private promptOverridesCache: XPeachPromptOverridesConfig | undefined
  private modelRoutingCache: XPeachModelRoutingState | undefined
  private catalogModelsCache: readonly XPeachModel[] | undefined
  private writingPiAiSettings: number | undefined
  private readonly gatewayInspector: XPeachGatewayInspectorController | undefined

  constructor(ctx: Context, config: Config) {
    super(ctx, 'xpeachAccount', { namespace: 'xpeach' })
    this.liveConfig = config
    const resolved = config as Required<Config>
    this.baseURL = resolved.baseURL.replace(/\/+$/, '')
    this.apiKeyEnv = credentialRef(resolved.apiKeyEnv)
    this.timeoutMs = unwrapConfigValue(resolved.timeoutMs)
    this.watchModels = unwrapConfigValue(resolved.watchModels)
    this.protocolPreference = unwrapConfigValue(config.protocolPreference) ?? 'compatible'
    this.enabledFamilies = unwrapConfigValue(config.enabledFamilies) ?? []
    const currentProfileHome = profileHome()
    const resolveProfileFile = (configured: string | undefined, filename: string): string => {
      const initialDefault = join(INITIAL_PROFILE_HOME, filename)
      const isInitialDefault = configured === initialDefault && currentProfileHome !== INITIAL_PROFILE_HOME
      if (configured === undefined || configured.length === 0 || isInitialDefault) {
        return join(currentProfileHome, filename)
      }
      return configured
    }
    this.keyFile = resolveProfileFile(resolved.keyFile, 'xpeach.key')
    this.keyVar = resolved.keyVar
    this.ssoStateFile = resolveProfileFile(resolved.ssoStateFile, 'xpeach.sso.json')
    this.routeFile = join(dirname(this.keyFile), 'xpeach.route.json')
    this.adminKeyFile = resolveProfileFile(resolved.adminKeyFile, 'xpeach.admin')
    this.adminKeyVar = resolved.adminKeyVar
    this.sessionKeyFile = resolveProfileFile(resolved.sessionKeyFile, 'xpeach.session')
    this.sessionKeyVar = resolved.sessionKeyVar
    const storedRoute = this.readRouteFile()
    this.activeBaseURL = (storedRoute.url ?? this.baseURL).replace(/\/+$/, '')
    this.networkAuto = storedRoute.auto ?? true

    this.api = new XPeachApi({
      baseURL: this.activeBaseURL,
      timeoutMs: this.timeoutMs,
      resolveKey: () => this.resolveKey(),
      resolveAdmin: () => this.resolveAdmin(),
      resolveCookie: () => this.resolveSession(),
      priceCacheFile: join(dirname(this.keyFile), 'xpeach-pricing.json'),
      onAuthRejected: (status) => {
        void this.handleAuthRejected(status)
      },
      onRefreshAuth: async (signal) => {
        const status = await this.verifyAndSyncSsoSession(true, signal).catch(() => undefined)
        return status?.valid === true && status.status === 'ok'
      },
      resolveModelEndpoint: (model) => {
        const routing = this.readModelRouting()
        const mapped = routing.endpointOverrides[model]
        if (mapped !== undefined) return mapped
        const catalogEntry = this.catalogModelsCache?.find(item => item.id === model)
        return recommendedModelEndpoint({
          id: model,
          ...(catalogEntry?.supported_endpoint_types !== undefined
            ? { supported_endpoint_types: catalogEntry.supported_endpoint_types }
            : {}),
        })
      },
    })

    this.relayReady = this.initializeRelay()
    void this.relayReady.catch((error: unknown) => {
      console.error('[xpeach] 凭据启动失败：', error instanceof RelayStateError ? error.message : '无法初始化账号凭据')
    })

    if (this.ctx.get('deepseekAccount') === undefined) {
      try {
        this.ctx.provide('deepseekAccount')
        this.deepseekAccountBridge = new XPeachDeepSeekAccount(this.ctx, this)
      } catch (_err) {
        this.deepseekAccountBridge = undefined
      }
    }

    this.gatewayInspector = new XPeachGatewayInspectorController({
      ctx: this.ctx,
      readConfig: () => this.readPromptOverrides(),
      getActiveBaseUrl: () => this.activeBaseURL,
      getCustomBaseUrl: () => this.readModelRouting().customBaseUrl,
      readModelCallSettings: modelId => this.readModelRouting().modelSettings[modelId],
      readBoundKey: () => this.readKeyFile(),
      listSkillsSnapshot: signal => this.skillsListOp({}, signal),
    })
    this.gatewayInspector.installHooks()

    const registerEvent = this.ctx.on.bind(this.ctx) as (name: string, listener: (...args: never[]) => unknown) => () => boolean
    registerEvent('settings/document-updated', (ns: string) => {
      if (ns === 'llm-pi-ai' && (this.writingPiAiSettings ?? 0) === 0) {
        void this.reconcileExternalPiAiEdits().catch(() => {})
        return
      }
      if (ns === 'xpeach-account' || ns === 'xpeach') {
        void (async () => {
          const settings = this.ctx.get('settings') as { describe?: () => unknown } | undefined
          if (settings?.describe !== undefined) {
            const described = await settings.describe()
            const nextSettings = readAccountSettings(described)
            if (
              this.lastAccountSettingsSnapshot !== undefined
              && deepEqualJson(this.lastAccountSettingsSnapshot, nextSettings)
            ) {
              return
            }
            this.lastAccountSettingsSnapshot = nextSettings
          }
          await this.syncModelCatalog(AbortSignal.timeout(this.timeoutMs))
        })().catch(() => {})
      }
    })
    registerEvent('llm/stream', (
      options: { readonly provider?: string; readonly signal?: AbortSignal },
      next: (opts?: unknown) => AsyncGenerator<Record<string, unknown>, void, unknown>,
    ) => this.guardLlmStream(options, next))
    const injectServices = this.ctx.inject.bind(this.ctx) as (
      deps: readonly string[],
      callback: (ctx: Context) => void,
    ) => void
    injectServices(['credentials'], () => {
      void this.relayReady?.then(async () => {
        const boundKey = this.readKeyFile()
        if (boundKey !== undefined) await this.publishCredential(boundKey)
      }).catch(() => {})
    })
    injectServices(['settings'], () => {
      void this.relayReady?.then(async () => {
        if (this.isBound() || existsSync(join(this.ownHome(), '.xpeach-onboarded')) || existsSync(join(this.profileRootHome(), '.xpeach-onboarded'))) {
          await this.ensureDesktopOnboardingCompleted()
        }
        if (this.isBound()) this.syncCatalogOnce()
      }).catch(() => {})
    })
    injectServices(['sessionPersistence', 'sessionProjectionCache', 'workspaceRegistry'], () => {
      void this.reconcileSessionsAndWorkspaces().catch(() => {})
    })
    this.ctx.effect(() => {
      const timer = setInterval(() => { void this.api.pricingSync(false, AbortSignal.timeout(30_000)).catch(() => {}) }, 60_000)
      const networkTimer = setInterval(() => {
        if (this.usesOfficialRoutePool()) void this.probeNetwork().catch(() => {})
      }, 180_000)
      const ssoVerifyTimer = setInterval(() => {
        if (this.isBound()) {
          void this.verifyAndSyncSsoSession(false).catch(() => {})
        }
      }, 120_000)
      const firstProbe = setTimeout(() => {
        if (this.usesOfficialRoutePool()) void this.probeNetwork().catch(() => {})
        if (this.isBound()) {
          void this.verifyAndSyncSsoSession(false).catch(() => {})
        }
      }, 3000)
      timer.unref()
      networkTimer.unref()
      ssoVerifyTimer.unref()
      firstProbe.unref()
      return () => {
        clearInterval(timer)
        clearInterval(networkTimer)
        clearInterval(ssoVerifyTimer)
        clearTimeout(firstProbe)
      }
    })
  }

  /** 等待启动修复及环境/凭据引用发布，失败阻止服务激活。 */
  async [Service.init](): Promise<void> {
    await this.relayReady
  }

  private async initializeRelay(): Promise<void> {
    await this.getRelayState().repair()
    await this.bootstrapKey()
  }

  private isDefaultXphHome(rootHome: string): boolean {
    return !isTemporaryCredentialDirectory(rootHome) && resolve(rootHome) === resolve(join(homedir(), '.xph'))
  }

  private getRelayState(): RelayState {
    if (this.relayState !== undefined) return this.relayState
    const mirrors = this.sharedMirrorDirs()
    const root = mirrors.length === 0 ? dirname(this.keyFile) : this.profileRootHome()
    const sharedRoot = mirrors.length === 0 || !this.isDefaultXphHome(root) ? root : join(homedir(), '.xph')
    const defaultFile = join(sharedRoot, 'xpeach.relay.json')
    const configured = this.liveConfig.relayStateFile
    if (configured !== undefined && !isAbsolute(configured)) {
      throw new Error('relayStateFile 必须是绝对路径，以确保所有实例使用同一权威文件。')
    }
    if (configured !== undefined && resolve(configured) !== resolve(defaultFile) && mirrors.length > 0) {
      throw new Error('共享凭据镜像必须使用同一个 xpeach.relay.json；自定义状态文件仅支持不参与镜像的 keyFile。')
    }
    if (configured !== undefined && mirrors.length === 0 && dirname(configured) !== resolve(dirname(this.keyFile))) {
      throw new Error('隔离的 relayStateFile 必须与自定义 keyFile 位于同一目录。')
    }
    this.relayState = new RelayState({
      filename: resolve(configured ?? defaultFile),
      legacyKeyFile: this.keyFile,
      legacyTokenFile: this.tokenInfoFile(),
      projectionDirs: mirrors,
      lockWaitMs: this.liveConfig.credentialLockWaitMs ?? 5000,
    })
    return this.relayState
  }

  private captureCredentialSnapshot(): CredentialSnapshot {
    return { relay: this.getRelayState().read() }
  }

  private assertCredentialSnapshot(snapshot: CredentialSnapshot): void {
    this.getRelayState().assertCurrent(snapshot.relay)
  }

  private async commitRelay(
    snapshot: CredentialSnapshot,
    next: { readonly key?: string; readonly token?: { id?: number; name?: string; groups?: readonly string[]; key?: string } },
    signal?: AbortSignal,
  ): Promise<void> {
    this.assertCredentialSnapshot(snapshot)
    const committed = await this.getRelayState().commit(snapshot.relay, next, signal)
    this.getRelayState().assertCurrent(committed)
    snapshot.relay = committed
  }

  /**
   * Resolve the home root that owns `this.keyFile` (`<home>/profiles/<name>/xpeach.key` -> `<home>`).
   */
  private profileRootHome(): string {
    if (typeof this.keyFile === 'string' && this.keyFile.length > 0) {
      const profileDir = dirname(this.keyFile)
      const parentDir = dirname(profileDir)
      if (basename(parentDir) === 'profiles') {
        return dirname(parentDir)
      }
    }
    return this.ownHome()
  }

  /** Sentinel written on explicit user sign-out or authoritative ban so restarts do not re-adopt credentials. */
  private signedOutMarker(homeDir = this.profileRootHome()): string {
    return join(homeDir, '.xpeach-signed-out')
  }

  /**
   * Candidate shared/sibling directories for cross-profile and dev/packaged credential persistence.
   * Any custom or temporary `XPH_HOME` (`resolve(rootHome) !== resolve(join(homedir(), '.xph'))`)
   * stays strictly isolated within its own `rootHome` and never mirrors into `~/.xph`.
   */
  private sharedMirrorDirs(): string[] {
    if (typeof this.keyFile !== 'string' || this.keyFile.length === 0) return []
    const profileDir = dirname(this.keyFile)
    const parentDir = dirname(profileDir)
    if (basename(parentDir) !== 'profiles') return []
    const rootHome = dirname(parentDir)
    const defaultHome = join(homedir(), '.xph')
    const isDefaultHome = this.isDefaultXphHome(rootHome)
    const candidates = [
      rootHome,
      join(rootHome, 'profiles', 'xpeach-desktop'),
      join(rootHome, 'profiles', 'xpeach'),
      ...(isDefaultHome ? [
        defaultHome,
        join(defaultHome, 'profiles', 'xpeach-desktop'),
        join(defaultHome, 'profiles', 'xpeach'),
      ] : []),
    ]
    const seen = new Set<string>([resolve(profileDir)])
    const result: string[] = []
    for (const dir of candidates) {
      const resolved = resolve(dir)
      if (seen.has(resolved)) continue
      seen.add(resolved)
      result.push(dir)
    }
    return result
  }

  /**
   * Mirror one credential or route configuration file to the shared home root and sibling profiles
   * so switching between CLI, Web, unpackaged dev, and packaged Desktop retains user state.
   */
  private mirrorCredentialFile(filename: string, body: string): void {
    const rootHome = this.profileRootHome()
    const defaultHome = join(homedir(), '.xph')
    const isDefaultHome = this.isDefaultXphHome(rootHome)
    for (const dir of this.sharedMirrorDirs()) {
      const isRootDir = resolve(dir) === resolve(rootHome) || (isDefaultHome && resolve(dir) === resolve(defaultHome))
      if (!isRootDir && !existsSync(dir)) continue
      try {
        this.writeState(join(dir, filename), body)
      } catch (_err) { /* best effort mirror */ }
    }
  }

  /**
   * Record that onboarding is complete and clear any explicit sign-out sentinel.
   */
  private markOnboardedAndClearSignOut(): void {
    const stamp = new Date().toISOString() + '\n'
    const rootHome = this.profileRootHome()
    const defaultHome = join(homedir(), '.xph')
    const isDefaultHome = this.isDefaultXphHome(rootHome)
    const homes = new Set<string>([rootHome])
    const own = this.ownHome()
    if (isDefaultHome || resolve(own) === resolve(rootHome)) {
      homes.add(own)
    }
    if (isDefaultHome) homes.add(defaultHome)
    for (const home of homes) {
      const marker = this.signedOutMarker(home)
      if (existsSync(marker)) {
        try { unlinkSync(marker) } catch (_err) { /* ignore */ }
      }
      const onboardedFile = join(home, '.xpeach-onboarded')
      if (!existsSync(onboardedFile)) {
        try { this.writeState(onboardedFile, stamp) } catch (_err) { /* ignore */ }
      }
    }
  }

  /**
   * Ensure the host `ui-settings-account` onboarding step is marked `'done'` once XPeach credentials
   * or onboarding completion exist so the legacy 4-step DesktopOnboarding overlay never re-prompts on startup.
   */
  private async ensureDesktopOnboardingCompleted(): Promise<void> {
    const settings = this.ctx.get('settings') as
      | {
        describe?: () => unknown
        update?: (ns: string, patch: object) => Promise<void>
      }
      | undefined
    if (settings?.describe === undefined || settings.update === undefined) return
    const described = await settings.describe()
    if (typeof described !== 'object' || described === null) return
    const namespaces = (described as { namespaces?: unknown }).namespaces
    if (!Array.isArray(namespaces)) return
    const accountNs = namespaces.find(
      (item): item is { ns: string; value?: { step?: string } } =>
        typeof item === 'object' && item !== null && (item as { ns?: unknown }).ns === 'ui-settings-account',
    )
    if (accountNs?.value?.step === 'done') return
    await settings.update('ui-settings-account', {
      version: 1,
      step: 'done',
      completion: 'completed',
    })
  }

  /**
   * Adopt persisted credentials from the shared home root or sibling profiles on cold start
   * unless the user explicitly signed out.
   */
  private adoptSharedCredentials(): void {
    const rootHome = this.profileRootHome()
    if (existsSync(this.signedOutMarker(rootHome))) return
    const defaultHome = join(homedir(), '.xph')
    if (this.isDefaultXphHome(rootHome) && !this.isBound() && existsSync(this.signedOutMarker(defaultHome))) return
    const mirrorDirs = this.sharedMirrorDirs()
    if (mirrorDirs.length === 0) return

    const targets: readonly [string, string][] = [
      [this.adminKeyFile, 'xpeach.admin'],
      [this.sessionKeyFile, 'xpeach.session'],
      [this.ssoStateFile, 'xpeach.sso.json'],
      [this.slotsFile(), 'xpeach.keys'],
      [this.routeFile, 'xpeach.route.json'],
    ]

    for (const [localPath, filename] of targets) {
      if (existsSync(localPath)) {
        try {
          const current = readFileSync(localPath, 'utf8')
          if (current.trim().length > 0) {
            this.mirrorCredentialFile(filename, current)
            continue
          }
        } catch (_err) { /* try adopting below */ }
      }
      for (const dir of mirrorDirs) {
        const candidate = join(dir, filename)
        if (!existsSync(candidate)) continue
        try {
          const content = readFileSync(candidate, 'utf8')
          if (content.trim().length === 0) continue
          this.writeState(localPath, content)
          break
        } catch (_err) { /* ignore unreadable candidate */ }
      }
    }
  }

  /**
   * 从共享 authority 建立账号状态并发布凭据引用；旧文件仅供初次迁移。
   * 已存在的空 authority 表示撤销，不允许环境、槽位或旧引用反向恢复。
   */
  private async bootstrapKey(): Promise<void> {
    if (!this.sharedCredentialsAdopted) {
      this.adoptSharedCredentials()
      this.sharedCredentialsAdopted = true
    }
    let key = this.readKeyFile()
    const hasAuthority = this.getRelayState().read().revision > 0
    if (key === undefined && hasAuthority) {
      Reflect.deleteProperty(process.env, this.keyVar)
      Reflect.deleteProperty(process.env, this.apiKeyEnv)
      await this.revokeCredential()
      this.writeState(this.seededMarker(), '')
      return
    }
    if (key === undefined && !hasAuthority) {
      const slots = this.readSlots()
      if (slots[0]?.key !== undefined) {
        key = slots[0].key
        await this.persistKey(key)
      }
    }
    const admin = this.resolveAdmin()
    if (admin !== undefined) {
      process.env[this.adminKeyVar] = admin
    }
    const session = this.resolveSession()
    if (session !== undefined) {
      ;(this.api as { setSessionKey?: (cookie: string | undefined) => void } | undefined)?.setSessionKey?.(session)
    }
    const sso = this.readSsoState()
    const hasEffect = typeof (this.ctx as { effect?: unknown } | undefined)?.effect === 'function'
    if (key === undefined && sso?.accessToken !== undefined && sso.accessToken.length > 0 && hasEffect) {
      this.ctx.effect(() => {
        const bootSsoTimer = setTimeout(() => {
          void this.verifyAndSyncSsoSession(true).catch(() => {})
        }, 250)
        bootSsoTimer.unref()
        return () => { clearTimeout(bootSsoTimer) }
      })
    } else if (key === undefined && admin !== undefined && hasEffect) {
      // A profile can hold the site token but no local xpk (first launch after an
      // upgrade, or a wiped key file). Re-derive the relay credential from the
      // server rather than starting keyless; the server reuses its own token, so
      // this does not mint a new one each boot.
      this.ctx.effect(() => {
        const bootMintTimer = setTimeout(() => {
          void (async () => {
            const minted = await this.mintKeyWithAccessToken(AbortSignal.timeout(30_000)).catch(() => ({ ok: false }))
            if (minted.ok) this.notifyKeyChanged()
          })()
        }, 1_500)
        bootMintTimer.unref()
        return () => { clearTimeout(bootMintTimer) }
      })
    }
    if (key === undefined && !hasAuthority && !existsSync(this.seededMarker())) {
      const ambient = process.env[this.keyVar] ?? process.env[this.apiKeyEnv]
      if (ambient !== undefined && ambient.trim().length > 0) {
        key = ambient.trim()
        await this.persistKey(key)
      }
      this.writeState(this.seededMarker(), '')
    }
    if (key !== undefined) {
      const snapshot = this.captureCredentialSnapshot()
      if (snapshot.relay.revision === 0) {
        await this.commitRelay(snapshot, { key, ...(snapshot.relay.token === undefined ? {} : { token: snapshot.relay.token }) })
      }
      process.env[this.keyVar] = key
      process.env[this.apiKeyEnv] = key
      await this.publishCredential(key)
    }
    if (this.isBound()) {
      this.markOnboardedAndClearSignOut()
    }
  }

  /** Sentinel that "the shared store already contributed once". */
  private seededMarker(): string { return this.keyFile + '.seeded' }

  /**
   * Write one profile-local state file atomically with `0o600` permissions,
   * creating its parent directory first.
   *
   * Every path here is profile-scoped and absent on a fresh install, so a
   * direct `writeFileSync` fails with ENOENT and the plugin never activates.
   * @param path - Absolute state file path.
   * @param body - Complete file contents.
   */
  private writeState(path: string, body: string): void {
    if (existsSync(path)) {
      try {
        if (!lstatSync(path).isSymbolicLink() && readFileSync(path, 'utf8') === body) {
          try {
            chmodSync(path, 0o600)
          } catch (_err) { /* chmod may be a no-op on Windows */ }
          return
        }
      } catch (_err) { /* proceed with atomic write */ }
    }
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    const tmpPath = `${path}.tmp.${String(process.pid)}.${randomBytes(6).toString('hex')}`
    try {
      writeFileSync(tmpPath, body, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
      try {
        chmodSync(tmpPath, 0o600)
      } catch (_err) { /* chmod may be a no-op on Windows */ }
      renameSync(tmpPath, path)
    } catch (err) {
      try { unlinkSync(tmpPath) } catch (_cleanupErr) { /* ignore */ }
      throw err
    }
  }

  /** Read the profile-local key file; absent or empty → undefined. */
  private readKeyFile(): string | undefined {
    return this.getRelayState().read().key
  }

  /** Multi-slot key store: xpeach.keys JSON [{name,key}] next to keyFile. */
  private slotsFile(): string { return this.keyFile.replace(/\.key$/, '.keys') }
  private readSlots(): { name: string; key: string }[] {
    let raw = ''
    try { raw = readFileSync(this.slotsFile(), 'utf8') } catch (_err) { return [] }
    let arr: ({ name?: unknown; key?: unknown } | null | undefined)[] | undefined
    try { arr = JSON.parse(raw) as ({ name?: unknown; key?: unknown } | null | undefined)[] } catch (_err) { return [] }
    return Array.isArray(arr)
      ? arr
        .filter((e): e is { name?: unknown; key: string } => typeof e?.key === 'string' && /^(?:xpk|sk)-/u.test(e.key))
        .map(e => ({ name: typeof e.name === 'string' && e.name.length > 0 ? e.name : 'slot', key: e.key }))
      : []
  }
  private writeSlots(slots: { name: string; key: string }[]): void {
    mkdirSync(dirname(this.slotsFile()), { recursive: true })
    const serialized = JSON.stringify(slots)
    this.writeState(this.slotsFile(), serialized)
    this.mirrorCredentialFile('xpeach.keys', serialized)
  }

  /** This runtime's own home (XPH_HOME > DSH_HOME > ~/.xph). */
  private ownHome(): string {
    return process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homedir(), '.xph')
  }

  /** Relay-token metadata (id / name / groups / bound key) beside the key file. */
  private tokenInfoFile(): string { return this.keyFile.replace(/\.key$/, '.token') }
  private readTokenInfo(): { id?: number; name?: string; groups?: string[]; key?: string } {
    const token = this.getRelayState().read().token
    if (token === undefined) return {}
    const { groups, ...fields } = token
    return { ...fields, ...(groups === undefined ? {} : { groups: [...groups] }) }
  }
  private async writeTokenInfo(
    info: { id?: number; name?: string; groups?: string[]; key?: string },
    snapshot = this.captureCredentialSnapshot(),
  ): Promise<void> {
    await this.commitRelay(snapshot, { ...(snapshot.relay.key === undefined ? {} : { key: snapshot.relay.key }), token: info })
    this.lastEnsureTokenInfoAt = Date.now()
  }

  /** Strip the vendor prefix so a raw relay key compares equal across forms. */
  private normalizeRelayKey(key: string | undefined): string {
    return (key ?? '').replace(/^(?:xpk|sk)-/u, '').trim()
  }

  /** Whether the stored token record is bound to (verified against) this key. */
  private tokenInfoMatchesKey(
    info: { id?: number; name?: string; groups?: string[]; key?: string },
    activeKey: string | undefined,
  ): boolean {
    return activeKey !== undefined && info.key !== undefined && this.normalizeRelayKey(info.key) === this.normalizeRelayKey(activeKey)
  }

  /**
   * Extract normalized group names from a token record (`auto_groups` array for
   * PeachAPI multi-group `auto` tokens, legacy `groups` array, or comma-separated `group` string).
   */
  private extractTokenGroups(detail: {
    readonly auto_groups?: unknown
    readonly groups?: unknown
    readonly group?: unknown
  }): string[] {
    if (Array.isArray(detail.auto_groups)) {
      const fromAuto = detail.auto_groups
        .filter((g): g is string => typeof g === 'string' && g.trim().length > 0 && g.trim() !== 'auto')
        .map(g => g.trim())
      if (fromAuto.length > 0) return fromAuto
    }
    if (Array.isArray(detail.groups)) {
      const fromArray = detail.groups
        .filter((g): g is string => typeof g === 'string' && g.trim().length > 0 && g.trim() !== 'auto')
        .map(g => g.trim())
      if (fromArray.length > 0) return fromArray
    }
    if (typeof detail.group === 'string' && detail.group.trim().length > 0) {
      return detail.group
        .split(',')
        .map(g => g.trim())
        .filter(g => g.length > 0 && g !== 'auto')
    }
    return []
  }

  /**
   * Encode selected channel groups into PeachAPI's token schema (`group: "auto"` +
   * `auto_groups` + `cross_group_retry: true` for multi-group tokens; single `group`
   * otherwise) while preserving the `groups` array for backwards compatibility.
   */
  private buildTokenGroupFields(groups: readonly string[]): Record<string, JsonValue> {
    const normalized = [...new Set(groups.map(g => g.trim()).filter(g => g.length > 0 && g !== 'auto'))]
    if (normalized.length > 1) {
      return {
        group: 'auto',
        auto_groups: normalized,
        cross_group_retry: true,
        groups: normalized,
      }
    }
    const first = normalized[0]
    if (normalized.length === 1 && first !== undefined) {
      return {
        group: first,
        auto_groups: [],
        cross_group_retry: false,
        groups: normalized,
      }
    }
    return {
      group: '',
      auto_groups: [],
      cross_group_retry: false,
      groups: [],
    }
  }

  /**
   * Candidate order for key verification: managed-name prefixes first
   * (`xph-`, `dsh-`, `sso-`, `peachcode`, `xpeach`), then the remaining
   * enabled tokens newest-first. The order only decides which token's key gets
   * revealed first — it never selects a token on its own.
   */
  private tokenResolveOrder(items: readonly XPeachAdminToken[]): XPeachAdminToken[] {
    const enabled = items
      .filter(t => t.status === undefined || t.status === 1)
      .sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))
    const isManagedName = (t: XPeachAdminToken): boolean => {
      const lower = (t.name ?? '').toLowerCase()
      return lower.startsWith('xph-')
        || lower.startsWith('dsh-')
        || lower.startsWith('sso-')
        || lower.startsWith('peachcode')
        || lower.startsWith('xpeach')
    }
    return [...enabled.filter(isManagedName), ...enabled.filter(t => !isManagedName(t))]
  }

  /** 将部署配置解析为一次扫描使用的固定限额。 */
  private resolveTokenLookupLimits(): TokenLookupLimits {
    return {
      pages: this.liveConfig.tokenPageLimit ?? DEFAULT_TOKEN_LOOKUP_LIMITS.pages,
      pageSize: this.liveConfig.tokenPageSize ?? DEFAULT_TOKEN_LOOKUP_LIMITS.pageSize,
      reveals: this.liveConfig.tokenRevealLimit ?? DEFAULT_TOKEN_LOOKUP_LIMITS.reveals,
    }
  }

  /** 管理通道不可用时改用用户通道；预算耗尽不伪装成完整目录。 */
  private async listTokenPages(
    signal: AbortSignal,
    userOnly = false,
    snapshot = this.captureCredentialSnapshot(),
    apiClient: XPeachApi = this.api,
  ): Promise<TokenScan> {
    const limits = this.resolveTokenLookupLimits()
    const readUser = async (page: number): Promise<{ items: XPeachAdminToken[]; total: number }> => {
      const result = await apiClient.userTokens(page, signal)
      return { items: result.items.map(item => ({ ...item, user_id: 0 })), total: result.total }
    }
    const assertCurrent = (): void => { this.assertCredentialSnapshot(snapshot) }
    const scan = async (readPage: Parameters<typeof scanTokenPages>[0]): Promise<TokenScan> => {
      let expectedTotal = 0
      const result = await scanTokenPages(async (...args) => {
        const page = await readPage(...args)
        expectedTotal = Math.max(expectedTotal, page.total)
        return page
      }, limits, signal, assertCurrent)
      // 提前返回空页不代表已读完站点声明的全部令牌。
      return result.status === 'complete' && result.items.length < expectedTotal
        ? { ...result, status: 'unavailable' }
        : result
    }
    if (userOnly) return await scan(readUser)
    const admin = await scan((page, size) => apiClient.adminTokens(page, size, signal))
    if (admin.status !== 'unavailable') return admin
    const user = await scan(readUser)
    const items = new Map(admin.items.map(item => [item.id, item]))
    for (const item of user.items) items.set(item.id, item)
    return { items: [...items.values()], status: user.status }
  }

  /** 揭示令牌密钥；控制台限定用户认证通道，其他调用可使用管理通道补充验证。 */
  private async revealTokenKey(
    id: number,
    signal: AbortSignal,
    snapshot = this.captureCredentialSnapshot(),
    userOnly = false,
    apiClient: XPeachApi = this.api,
  ): Promise<{ key?: string } | undefined> {
    const attempts: (() => Promise<{ key?: string }>)[] = []
    if (typeof apiClient.userTokenKey === 'function') {
      attempts.push(() => apiClient.userTokenKey(id, signal))
    }
    if (!userOnly && typeof apiClient.adminTokenKey === 'function') {
      attempts.push(() => apiClient.adminTokenKey(id, signal))
    }
    for (const attempt of attempts) {
      try {
        this.assertCredentialSnapshot(snapshot)
        const revealed = await attempt()
        this.assertCredentialSnapshot(snapshot)
        if (revealed.key !== undefined && revealed.key.length > 0) return revealed
      } catch (err) {
        this.assertCredentialSnapshot(snapshot)
        if (signal.aborted) throw err
      }
    }
    return undefined
  }

  /**
   * Identify the site token the active relay key belongs to. An exact key match
   * on the token page wins; otherwise each candidate's stored key is revealed
   * and compared, in `tokenResolveOrder` order. No name or creation-time
   * fallback: `undefined` means the active key's token is unknown, which keeps
   * group writes from ever landing on a token the key does not own.
   */
  private async resolveTokenForKey(
    activeKey: string | undefined,
    signal: AbortSignal,
    snapshot = this.captureCredentialSnapshot(),
  ): Promise<{
    info?: { id: number; name?: string; groups?: string[] }
    failure?: 'identity-unknown' | 'identity-budget-exhausted'
  }> {
    const normKey = this.normalizeRelayKey(activeKey)
    if (normKey.length === 0) return { failure: 'identity-unknown' }
    const scan = await this.listTokenPages(signal, false, snapshot)
    this.assertCredentialSnapshot(snapshot)
    const ordered = this.tokenResolveOrder(scan.items)
    const byKey = ordered.find(t => this.normalizeRelayKey(t.key) === normKey)
    if (byKey !== undefined) {
      const groups = this.extractTokenGroups(byKey)
      return { info: {
        id: byKey.id,
        ...(byKey.name !== undefined ? { name: byKey.name } : {}),
        ...(groups.length > 0 ? { groups } : {}),
      } }
    }
    const limits = this.resolveTokenLookupLimits()
    for (const candidate of ordered.slice(0, limits.reveals)) {
      const revealed = await this.revealTokenKey(candidate.id, signal, snapshot)
      this.assertCredentialSnapshot(snapshot)
      if (revealed !== undefined && this.normalizeRelayKey(revealed.key) === normKey) {
        const groups = this.extractTokenGroups(candidate)
        return { info: {
          id: candidate.id,
          ...(candidate.name !== undefined ? { name: candidate.name } : {}),
          ...(groups.length > 0 ? { groups } : {}),
        } }
      }
    }
    return { failure: scan.status === 'budget-exhausted' || ordered.length > limits.reveals
      ? 'identity-budget-exhausted'
      : 'identity-unknown' }
  }

  /**
   * Backfill the token metadata: confirm which site token the active relay key
   * belongs to and persist its id/name/groups bound to that key. Read-only
   * against the site — remote group writes live exclusively in the explicit
   * `setGroups` operation, so refreshing the catalog can no longer edit
   * whichever token happened to be newest or share a managed prefix.
   */
  private async ensureTokenInfo(signal: AbortSignal, snapshot = this.captureCredentialSnapshot()): Promise<{
    id?: number
    name?: string
    groups?: string[]
    key?: string
    failure?: 'identity-unknown' | 'identity-budget-exhausted'
  }> {
    this.assertCredentialSnapshot(snapshot)
    const activeKey = snapshot.relay.key
    const info = this.readTokenInfo()
    const bound = this.tokenInfoMatchesKey(info, activeKey)
    if (
      bound
      && info.id !== undefined
      && Array.isArray(info.groups)
      && info.groups.length > 0
      && Date.now() - this.lastEnsureTokenInfoAt < 300_000
    ) {
      return info
    }
    let tokenId = bound ? info.id : undefined
    let tokenName = bound ? info.name : undefined
    let resolvedGroups: string[] | undefined
    if (tokenId === undefined) {
      const live = await this.resolveTokenForKey(activeKey, signal, snapshot)
      this.assertCredentialSnapshot(snapshot)
      if (live.info === undefined) {
        // Identity unresolved: never guess a token. A record bound to another
        // key is stale — strip its id/name so no later write can target it.
        const displayGroups = bound ? info.groups : undefined
        const next = {
          ...(activeKey !== undefined ? { key: activeKey } : {}),
          ...(displayGroups !== undefined ? { groups: displayGroups } : {}),
        }
        if (!deepEqualJson(info, next)) await this.writeTokenInfo(next, snapshot)
        return { ...next, failure: live.failure ?? 'identity-unknown' }
      }
      tokenId = live.info.id
      tokenName = live.info.name
      resolvedGroups = live.info.groups
    }
    let detail: Record<string, JsonValue> | undefined
    try {
      detail = await this.api.adminTokenGet(tokenId, signal)
    } catch (err) {
      this.assertCredentialSnapshot(snapshot)
      if (signal.aborted) throw err
      // Detail unavailable: keep only confirmed fields. An id just resolved by
      // key is trustworthy; groups fall back to the resolved (or a same-key
      // stored) set — never to a record bound to another key.
      const fallbackGroups = resolvedGroups !== undefined
        ? resolvedGroups
        : (bound ? info.groups : undefined)
      return {
        id: tokenId,
        ...(tokenName !== undefined ? { name: tokenName } : {}),
        ...(fallbackGroups !== undefined ? { groups: fallbackGroups } : {}),
        ...(activeKey !== undefined ? { key: activeKey } : {}),
      }
    }
    this.assertCredentialSnapshot(snapshot)
    const detailGroups = this.extractTokenGroups(detail)
    const groups = detailGroups.length > 0
      ? detailGroups
      : resolvedGroups !== undefined
        ? resolvedGroups
        : (bound ? (info.groups ?? []) : [])
    const next = {
      id: tokenId,
      ...(tokenName !== undefined ? { name: tokenName } : {}),
      groups,
      ...(activeKey !== undefined ? { key: activeKey } : {}),
    }
    await this.writeTokenInfo(next, snapshot)
    return next
  }

  /** Model counts per site group, filtered to groups usable by the signed-in user. */
  private async groupModelCounts(signal: AbortSignal, apiClient: XPeachApi = this.api): Promise<Map<string, number>> {
    const [pricing, groupCat] = await Promise.all([
      apiClient.adminPricing(signal).catch(() => undefined),
      typeof apiClient.groups === 'function' ? apiClient.groups(signal).catch(() => undefined) : Promise.resolve(undefined),
    ])
    const counts = new Map<string, number>()
    if (pricing !== undefined) {
      const usableKeys = pricing.usableGroup !== undefined ? Object.keys(pricing.usableGroup) : []
      const usableSet = usableKeys.length > 0 ? new Set(usableKeys) : undefined
      for (const entry of pricing.entries) {
        for (const group of entry.enable_groups ?? []) {
          if (usableSet !== undefined && !usableSet.has(group) && !(groupCat !== undefined && group in groupCat)) continue
          counts.set(group, (counts.get(group) ?? 0) + 1)
        }
      }
    }
    if (groupCat !== undefined) {
      for (const [name, meta] of Object.entries(groupCat)) {
        const len = Array.isArray(meta.models) ? meta.models.length : 0
        if (len > (counts.get(name) ?? 0)) {
          counts.set(name, len)
        }
      }
    }
    return counts
  }

  /**
   * Refresh the picker's catalog once per process.
   *
   * The site's model list changes without a rebind, so a profile that bound once
   * would otherwise keep a stale (or, on first boot, empty) list forever. The
   * first state read is the earliest point where both the settings service and
   * the bound token exist; later calls are no-ops.
   */
  private syncCatalogOnce(): void {
    if (this.catalogSyncPromise !== undefined || this.catalogSynced) return
    void this.upgradeStoredModels().catch(() => undefined)
    const key = this.readKeyFile()
    if (key === undefined || key.length === 0) return
    void this.syncModelCatalog(new AbortController().signal)
      .then((result) => {
        if (result.ok) this.catalogSynced = true
      })
      .catch(() => undefined)
  }

  private modelMetadataCacheFile(): string | undefined {
    if (typeof this.keyFile !== 'string' || this.keyFile.length === 0) return undefined
    return join(dirname(this.keyFile), 'xpeach-model-metadata.json')
  }

  private readModelMetadataCache(): ModelMetadataRegistry | undefined {
    const file = this.modelMetadataCacheFile()
    if (file === undefined || !existsSync(file)) return undefined
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
      return parseModelMetadataRegistry(parsed)
    } catch (_err) {
      return undefined
    }
  }

  private async fetchAndCacheModelMetadata(signal: AbortSignal): Promise<ModelMetadataRegistry | undefined> {
    const url = unwrapConfigValue(this.liveConfig.modelMetadataUrl)?.trim()
      || 'https://raw.githubusercontent.com/yellowpeachxgp/xpeach-harness/main/resources/model-metadata.json'
    try {
      const res = await fetch(url, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3_000)]),
      })
      if (!res.ok) return undefined
      const raw: unknown = await res.json()
      const registry = parseModelMetadataRegistry(raw)
      if (registry !== undefined) {
        const file = this.modelMetadataCacheFile()
        if (file !== undefined) {
          this.writeState(file, JSON.stringify(registry, null, 2))
        }
        return registry
      }
    } catch (_err) {
      // Fall back to local cache and built-in model metadata rules.
    }
    return undefined
  }

  private async refreshModelMetadata(signal: AbortSignal): Promise<ModelMetadataRegistry | undefined> {
    const file = this.modelMetadataCacheFile()
    const cached = this.readModelMetadataCache()
    if (cached !== undefined && file !== undefined) {
      let ageMs = Number.POSITIVE_INFINITY
      try {
        ageMs = Date.now() - statSync(file).mtimeMs
      } catch (_err) { /* treat unreadable mtime as stale */ }
      if (ageMs < 30 * 60_000) {
        return cached
      }
      void this.fetchAndCacheModelMetadata(signal).catch(() => {})
      return cached
    }
    return (await this.fetchAndCacheModelMetadata(signal)) ?? this.readModelMetadataCache()
  }

  private async upgradeStoredModels(): Promise<void> {
    const settings = this.ctx.get('settings') as
      | {
        describe?: () => unknown
        update?: (ns: string, patch: object) => Promise<void>
        mutate?: (ns: string, ops: unknown[]) => Promise<unknown>
      }
      | undefined
    if (settings?.describe === undefined || (settings.update === undefined && settings.mutate === undefined)) return
    const described = await settings.describe()
    const existingProviders = readProviderMap(described)
    const cachedModels = this.readModelsCache()
    const fallbackModels = extractModelsFromExistingProviders(existingProviders)
    const routing = this.readModelRouting()
    if (cachedModels.length === 0 && fallbackModels.length === 0 && routing.customModels.length === 0) return

    const metadata = this.readModelMetadataCache()
    const built = this.buildPoolsFromState({
      described,
      existingProviders,
      catalogModels: cachedModels.length > 0 ? cachedModels : fallbackModels,
      routing,
      metadata,
    })

    const providersChanged = Object.entries(built.providers).some(
      ([k, v]) => !deepEqualJson(existingProviders[k] ?? null, v),
    )
    if (!providersChanged) return

    await this.writePiAiProviders(settings, existingProviders, built.providers)
    const mergedProviders: Record<string, { models?: unknown }> = {
      ...(existingProviders as Record<string, { models?: unknown }>),
      ...(built.providers as Record<string, { models?: unknown }>),
    }
    await this.reconcileDefaultModelSelection(mergedProviders)
  }

  /**
   * Pick the relay token's initial groups: the user's own group when it carries
   * models, else the DSH-oriented SWE group, else the richest non-admin group.
   */
  private async defaultGroups(signal: AbortSignal, apiClient: XPeachApi = this.api): Promise<string[]> {
    const [counts, me] = await Promise.all([this.groupModelCounts(signal, apiClient), apiClient.adminSelf(signal)])
    if (me.group !== undefined && me.group !== '管理员分组' && (counts.get(me.group) ?? 0) > 0) return [me.group]
    if ((counts.get('SWE') ?? 0) > 0) return ['SWE']
    const best = [...counts.entries()]
      .filter(([name]) => name !== '管理员分组' && name !== 'default')
      .sort((a, b) => b[1] - a[1])[0]
    if (best !== undefined) return [best[0]]
    if ((counts.get('default') ?? 0) > 0) return ['default']
    return []
  }

  /**
   * Write the site's callable models into the llm-pi-ai settings section so the
   * composer/settings pickers show the marketplace instead of a frozen list.
   * Deduplicates concurrent callers onto the in-flight sync promise.
   */
  private async syncModelCatalog(
    signal: AbortSignal,
    manual = false,
    options?: { readonly forceGroupSwitch?: boolean },
  ): Promise<XPeachModelSyncResult> {
    signal.throwIfAborted()
    if (this.catalogSyncPromise !== undefined) {
      if (options?.forceGroupSwitch === true) {
        await raceWithAbortSignal(this.catalogSyncPromise.catch(() => undefined), signal)
      } else {
        const joined = await raceWithAbortSignal(this.catalogSyncPromise, signal)
        // A joined run discarded for staleness leaves this caller's catalog
        // unpublished — run once more against the current credential.
        if (joined.ok || joined.code !== 'credential-changed') return joined
      }
    }
    signal.throwIfAborted()
    const internalTimeout = createInternalTimeoutController(
      Math.max((this.timeoutMs || 15_000) * 2, 30_000),
      'Model catalog sync timed out',
    )
    const run = this.runSyncModelCatalog(internalTimeout.signal, manual, options).finally(() => {
      internalTimeout.clear()
      if (this.catalogSyncPromise === run) this.catalogSyncPromise = undefined
    })
    this.catalogSyncPromise = run
    void run.catch(() => {})
    return await raceWithAbortSignal(run, signal)
  }

  private async runSyncModelCatalog(
    signal: AbortSignal,
    manual = false,
    options?: { readonly forceGroupSwitch?: boolean },
  ): Promise<XPeachModelSyncResult> {
    let info: Awaited<ReturnType<XPeachAccount['ensureTokenInfo']>> = {}
    try {
      const snapshot = this.captureCredentialSnapshot()
      info = await this.ensureTokenInfo(signal, snapshot)
      this.assertCredentialSnapshot(snapshot)
      if (info.id === undefined || info.failure !== undefined) {
        const code = info.failure ?? 'identity-unknown'
        return { ok: false, count: 0, groups: [], code,
          error: code === 'identity-budget-exhausted'
            ? '令牌身份扫描预算已耗尽；已保留原模型目录，请调整分页或 reveal 限额后重试。'
            : '尚未确认当前密钥的令牌身份；已保留原模型目录，请检查管理凭据后重试。' }
      }
      const settings = this.ctx.get('settings') as
        | {
          describe?: () => unknown
          update?: (ns: string, patch: object) => Promise<void>
          mutate?: (ns: string, ops: unknown[]) => Promise<unknown>
        }
        | undefined
      if (settings?.update === undefined) return { ok: false, count: 0, groups: info.groups ?? [], error: 'settings service unavailable' }
      const updateSettings = settings.update.bind(settings)
      const described = await settings.describe?.()
      this.assertCredentialSnapshot(snapshot)
      const liveAccountSettings = readAccountSettings(described)
      this.lastAccountSettingsSnapshot = liveAccountSettings
      if (liveAccountSettings.timeoutMs !== undefined) {
        this.timeoutMs = liveAccountSettings.timeoutMs
      }
      if (liveAccountSettings.watchModels !== undefined) {
        this.watchModels = [...liveAccountSettings.watchModels]
      }
      const autoSync = liveAccountSettings.autoSyncModels ?? unwrapConfigValue(this.liveConfig.autoSyncModels) ?? true
      if (!manual && !autoSync) {
        return { ok: true, count: 0, groups: info.groups ?? [] }
      }
      const [catalogue, groupCat, pricing, metadata] = await Promise.all([
        this.api.models(signal),
        typeof this.api.groups === 'function'
          ? this.api.groups(signal).catch(() => undefined)
          : Promise.resolve(undefined),
        typeof this.api.adminPricing === 'function'
          ? this.api.adminPricing(signal).catch(() => undefined)
          : Promise.resolve(undefined),
        this.refreshModelMetadata(signal),
      ])
      this.assertCredentialSnapshot(snapshot)

      const groupsByModel = new Map<string, Set<string>>()
      const endpointsByModel = new Map<string, Set<string>>()
      const ensureModelGroups = (modelId: string): Set<string> => {
        let set = groupsByModel.get(modelId)
        if (set === undefined) {
          set = new Set<string>()
          groupsByModel.set(modelId, set)
        }
        return set
      }
      const ensureModelEndpoints = (modelId: string): Set<string> => {
        let set = endpointsByModel.get(modelId)
        if (set === undefined) {
          set = new Set<string>()
          endpointsByModel.set(modelId, set)
        }
        return set
      }

      for (const m of catalogue) {
        for (const g of m.groups ?? []) {
          if (typeof g === 'string' && g.length > 0) ensureModelGroups(m.id).add(g)
        }
        for (const ep of m.supported_endpoint_types ?? []) {
          if (typeof ep === 'string' && ep.length > 0) ensureModelEndpoints(m.id).add(ep)
        }
      }
      if (groupCat !== undefined) {
        for (const [gName, gInfo] of Object.entries(groupCat)) {
          if (gName.length === 0) continue
          for (const mId of gInfo.models ?? []) {
            if (typeof mId === 'string' && mId.length > 0) ensureModelGroups(mId).add(gName)
          }
        }
      }
      if (pricing !== undefined) {
        const usableKeys = pricing.usableGroup !== undefined ? Object.keys(pricing.usableGroup) : []
        const usableSet = usableKeys.length > 0 ? new Set(usableKeys) : undefined
        for (const entry of pricing.entries) {
          if (typeof entry.model_name !== 'string' || entry.model_name.length === 0) continue
          for (const gName of entry.enable_groups ?? []) {
            if (typeof gName !== 'string' || gName.length === 0) continue
            if (usableSet !== undefined && !usableSet.has(gName) && !(groupCat !== undefined && gName in groupCat)) continue
            ensureModelGroups(entry.model_name).add(gName)
          }
          for (const ep of entry.supported_endpoint_types ?? []) {
            if (typeof ep === 'string' && ep.length > 0) ensureModelEndpoints(entry.model_name).add(ep)
          }
        }
      }

      const tokenGroups = (info.groups ?? []).filter(g => typeof g === 'string' && g.length > 0)
      const primaryGroup = tokenGroups[0]
      const primaryGroupModels = new Set<string>()
      const tokenGroupModels = new Set<string>()
      if (tokenGroups.length > 0) {
        for (const [modelId, mGroups] of groupsByModel.entries()) {
          if (primaryGroup !== undefined && mGroups.has(primaryGroup)) {
            primaryGroupModels.add(modelId)
          }
          for (const tg of tokenGroups) {
            if (mGroups.has(tg)) {
              tokenGroupModels.add(modelId)
              break
            }
          }
        }
      }

      const byId = new Map<string, XPeachModel>()
      for (const m of catalogue) {
        const mergedGroups = [...(groupsByModel.get(m.id) ?? m.groups ?? [])]
        const mergedEndpoints = [...(endpointsByModel.get(m.id) ?? m.supported_endpoint_types ?? [])]
        byId.set(m.id, {
          ...m,
          ...(mergedGroups.length > 0 ? { groups: mergedGroups } : {}),
          ...(mergedEndpoints.length > 0 ? { supported_endpoint_types: mergedEndpoints } : {}),
        })
      }
      for (const modelId of catalogue.length > 0 ? tokenGroupModels : []) {
        if (!byId.has(modelId)) {
          const mergedGroups = [...(groupsByModel.get(modelId) ?? [])]
          const mergedEndpoints = [...(endpointsByModel.get(modelId) ?? [])]
          byId.set(modelId, {
            id: modelId,
            ...(mergedGroups.length > 0 ? { groups: mergedGroups } : {}),
            ...(mergedEndpoints.length > 0 ? { supported_endpoint_types: mergedEndpoints } : {}),
          })
        }
      }

      let mergedCatalogue = [...byId.values()]
      if (tokenGroupModels.size > 0) {
        mergedCatalogue = mergedCatalogue.filter((m) => {
          const knownGroups = groupsByModel.get(m.id)
          if (knownGroups === undefined || knownGroups.size === 0) return true
          return tokenGroupModels.has(m.id)
        })
        if (primaryGroupModels.size > 0) {
          mergedCatalogue.sort((a, b) => Number(primaryGroupModels.has(b.id)) - Number(primaryGroupModels.has(a.id)))
        }
      }

      const configuredPref = unwrapConfigValue(this.liveConfig.protocolPreference)
      if (liveAccountSettings.protocolPreference !== undefined) {
        this.protocolPreference = liveAccountSettings.protocolPreference
      } else if (configuredPref !== undefined) {
        this.protocolPreference = configuredPref
      }
      const configuredFamilies = unwrapConfigValue(this.liveConfig.enabledFamilies)
      if (liveAccountSettings.enabledFamilies !== undefined) {
        this.enabledFamilies = liveAccountSettings.enabledFamilies
      } else if (configuredFamilies !== undefined) {
        this.enabledFamilies = configuredFamilies
      }
      const enabled = this.enabledFamilies
      const list = enabled.length === 0
        ? mergedCatalogue
        : mergedCatalogue.filter(model => (model.groups ?? []).some(group => enabled.includes(group)))
      this.writeModelsCache(list)

      const existingProviders = readProviderMap(described)
      const routing = this.readModelRouting()
      const built = this.buildPoolsFromState({
        described,
        existingProviders,
        catalogModels: list,
        routing,
        metadata,
      })
      const providers = built.providers
      const providersChanged = Object.entries(providers).some(
        ([k, v]) => !deepEqualJson(existingProviders[k] ?? null, v),
      )
      // The credential may have rotated while the catalog was being computed
      // (SSO refresh, key-slot switch). Writing the stale result would push a
      // catalog scoped to a key that is no longer active — discard it and let
      // the sync the credential change triggered publish its own.
      await this.getRelayState().withCurrent(snapshot.relay, async () => {
        this.assertCredentialSnapshot(snapshot)
        if (snapshot.relay.key === undefined) throw new RelayStateError('credential-changed')
        await this.publishCredentialUnderLock(snapshot.relay.key, snapshot)
        await this.assertPublishedCredential(snapshot)
        if (providersChanged) {
          this.writingPiAiSettings = (this.writingPiAiSettings ?? 0) + 1
          try {
            if (settings.mutate !== undefined) {
              // 一次发布空列表与新目录，失败时保留原设置。
              const ops = Object.entries(providers).map(([key, value]) => ({ op: 'set' as const, path: ['providers', key], value }))
              await settings.mutate('llm-pi-ai', ops)
            } else {
              const merged = { ...existingProviders, ...providers }
              await updateSettings('llm-pi-ai', { providers: merged })
            }
          } finally {
            this.writingPiAiSettings = Math.max(0, this.writingPiAiSettings - 1)
          }
        }
        this.assertCredentialSnapshot(snapshot)
        await this.assertPublishedCredential(snapshot)
        await this.reconcileDefaultModelSelection(providers, {
          primaryGroupModels,
          forceGroupSwitch: options?.forceGroupSwitch === true,
        })
      }, signal)
      return { ok: true, count: built.enabledCount, groups: info.groups ?? [] }
    } catch (e) {
      if (e instanceof RelayStateError) return { ok: false, count: 0, groups: info.groups ?? [], code: e.code, error: e.message }
      return { ok: false, count: 0, groups: info.groups ?? [], error: e instanceof Error ? e.message.slice(0, 160) : String(e) }
    }
  }

  private async reconcileDefaultModelSelection(
    providers: Record<string, { models?: unknown }>,
    options?: {
      readonly primaryGroupModels?: ReadonlySet<string>
      readonly forceGroupSwitch?: boolean
    },
  ): Promise<void> {
    const providerEntries = Object.entries(providers)
    if (providerEntries.length === 0) return

    const findModelInProvider = (provObj: { models?: unknown } | undefined, modelId: string): Record<string, unknown> | undefined => {
      if (provObj === undefined) return undefined
      const list = provObj.models
      if (!Array.isArray(list)) return undefined
      return list.find(
        (m): m is Record<string, unknown> =>
          typeof m === 'object' && m !== null && (m as { id?: unknown }).id === modelId,
      )
    }

    const findProviderForModel = (modelId: string): { provider: string; modelObj: Record<string, unknown> } | undefined => {
      for (const [provKey, provObj] of providerEntries) {
        if (!isAccountModelProvider(provKey)) continue
        const found = findModelInProvider(provObj, modelId)
        if (found !== undefined) return { provider: provKey, modelObj: found }
      }
      return undefined
    }

    const primarySet = options?.primaryGroupModels
    const hasPrimaryScope = primarySet !== undefined && primarySet.size > 0
    const forceSwitch = options?.forceGroupSwitch === true

    // Provider preference per endpoint: 'compatible' keeps chat completions
    // first, 'native' prefers the Responses/Messages wires, 'auto' follows the
    // site order. Claude ids keep their Messages mount as the default pick
    // even though they may now also list under chat completions.
    const preferredProviderOrder = (): readonly string[] => {
      switch (this.protocolPreference) {
        case 'native': return ['xpeach-openai-responses', 'xpeach-anthropic', 'xpeach']
        case 'auto': return ['xpeach', 'xpeach-openai-responses', 'xpeach-anthropic']
        default: return ['xpeach', 'xpeach-anthropic', 'xpeach-openai-responses']
      }
    }
    const providerRank = (key: string, modelId: string): number => {
      if (isAnthropicClaudeModel(modelId) && key === 'xpeach-anthropic') return -1
      const order = preferredProviderOrder()
      const idx = order.indexOf(key)
      return idx === -1 ? order.length : idx
    }
    const pickPreferredSelection = (): { provider: string; model: string } | undefined => {
      const byId = new Map<string, { provider: string; rank: number }>()
      for (const [key, provObj] of providerEntries) {
        if (!isAccountModelProvider(key)) continue
        const rawList = provObj.models
        if (!Array.isArray(rawList)) continue
        for (const item of rawList) {
          if (typeof item !== 'object' || item === null || typeof (item as { id?: unknown }).id !== 'string') continue
          const id = (item as { id: string }).id
          if (id.length === 0) continue
          const rank = providerRank(key, id)
          const existing = byId.get(id)
          if (existing === undefined || rank < existing.rank) byId.set(id, { provider: key, rank })
        }
      }
      if (byId.size === 0) return undefined
      const pool = [...byId.entries()].map(([id, v]) => ({ provider: v.provider, id }))
      const scoped = hasPrimaryScope
        ? pool.filter(m => primarySet.has(m.id))
        : pool
      const usable = scoped.length > 0 ? scoped : pool
      const swe = usable.find(m => m.id === 'swe-2-max')
      const chosen = swe ?? usable[0]
      return chosen !== undefined ? { provider: chosen.provider, model: chosen.id } : undefined
    }

    const preferredSelection = pickPreferredSelection()
    const defaultModelService = this.getOptionalService('agentDefaultModel')
    if (defaultModelService !== undefined) {
      const current = defaultModelService.currentSelection()
      let reconciled = false
      if (current !== undefined) {
        const isXpeach = isAccountModelProvider(current.provider)
        if (!isXpeach) {
          reconciled = true
        } else if (!forceSwitch || !hasPrimaryScope || primarySet.has(current.model)) {
          const directMatch = findModelInProvider(providers[current.provider], current.model)
          const relocatedMatch = directMatch !== undefined
            ? { provider: current.provider, modelObj: directMatch }
            : findProviderForModel(current.model)
          if (relocatedMatch !== undefined) {
            const efforts = relocatedMatch.modelObj['reasoningEfforts']
            const supportsEffort = current.reasoningEffort === undefined
              || (typeof efforts === 'object' && efforts !== null && current.reasoningEffort in efforts)
            if (relocatedMatch.provider !== current.provider || !supportsEffort) {
              await defaultModelService.saveSelection({
                provider: relocatedMatch.provider,
                model: current.model,
                ...(supportsEffort && current.reasoningEffort !== undefined
                  ? { reasoningEffort: current.reasoningEffort }
                  : {}),
              }).catch(() => undefined)
            }
            reconciled = true
          }
        }
      }
      if (!reconciled && preferredSelection !== undefined) {
        await defaultModelService.saveSelection({
          provider: preferredSelection.provider,
          model: preferredSelection.model,
        }).catch(() => undefined)
      }
    }

    if (forceSwitch) {
      await this.reconcileActiveSessionModels(
        providers,
        findModelInProvider,
        findProviderForModel,
        preferredSelection,
        primarySet,
        true,
      )
    }
  }

  private async reconcileActiveSessionModels(
    providers: Record<string, { models?: unknown }>,
    findModelInProvider: (provObj: { models?: unknown } | undefined, modelId: string) => Record<string, unknown> | undefined,
    findProviderForModel: (modelId: string) => { provider: string; modelObj: Record<string, unknown> } | undefined,
    preferredSelection: { provider: string; model: string } | undefined,
    primaryGroupModels: ReadonlySet<string> | undefined,
    forceGroupSwitch: boolean,
  ): Promise<void> {
    if (!forceGroupSwitch) return
    const sessionController = this.getOptionalService('sessionController')
    const sessionPersistence = this.getOptionalService('sessionPersistence')
    const projectionCache = this.getOptionalService('sessionProjectionCache')
    if (sessionController === undefined || sessionPersistence === undefined) return
    try {
      const entries = (await sessionPersistence.list()).slice(0, 50)
      const hasPrimaryScope = primaryGroupModels !== undefined && primaryGroupModels.size > 0
      for (const entry of entries) {
        // Listing rows may carry only a top-level id; snapshots carry header.id.
        const sessionId = typeof entry === 'string'
          ? entry
          : (entry as Omit<ReconcileSessionSnapshot, 'header'> & { header?: ReconcileSessionHeader }).header?.id ?? entry.id
        if (typeof sessionId !== 'string' || sessionId.length === 0) continue
        const proj = projectionCache?.get?.(sessionId, 'modelSelection')
        const active = proj?.pending ?? proj?.lastUsed
        if (active === undefined || active === null) continue
        const isXpeach = isAccountModelProvider(active.provider)
        if (!isXpeach) continue

        if (hasPrimaryScope && !primaryGroupModels.has(active.model)) {
          if (preferredSelection !== undefined) {
            await sessionController.selectModel({
              sessionId,
              provider: preferredSelection.provider,
              model: preferredSelection.model,
            }).catch(() => undefined)
          }
          continue
        }

        const directMatch = findModelInProvider(providers[active.provider], active.model)
        if (directMatch !== undefined) continue

        const relocated = findProviderForModel(active.model)
        if (relocated !== undefined) {
          await sessionController.selectModel({
            sessionId,
            provider: relocated.provider,
            model: active.model,
            ...(active.reasoningEffort !== undefined ? { reasoningEffort: active.reasoningEffort } : {}),
          }).catch(() => undefined)
        } else if (preferredSelection !== undefined) {
          await sessionController.selectModel({
            sessionId,
            provider: preferredSelection.provider,
            model: preferredSelection.model,
          }).catch(() => undefined)
        }
      }
    } catch (_err) {
      // Best-effort session model reconciliation.
    }
  }

  /**
   * Persist into the profile file + live env + the credentials service.
   */
  private async persistKey(key: string, snapshot = this.captureCredentialSnapshot(), signal?: AbortSignal): Promise<void> {
    const token = this.normalizeRelayKey(snapshot.relay.key) === this.normalizeRelayKey(key) ? snapshot.relay.token : undefined
    await this.persistRelayCredential(key, token, snapshot, signal)
  }

  private async persistRelayCredential(
    key: string,
    token: RelayTokenInfo | undefined,
    snapshot = this.captureCredentialSnapshot(),
    signal?: AbortSignal,
  ): Promise<void> {
    await this.commitRelay(snapshot, { key, ...(token === undefined ? {} : { token }) }, signal)
    process.env[this.keyVar] = key
    process.env[this.apiKeyEnv] = key
    this.markOnboardedAndClearSignOut()
    await this.publishCredential(key, snapshot)
  }

  /**
   * Persist the site-management token (the user's Access Token).
   */
  private persistAdmin(token: string): void {
    mkdirSync(dirname(this.adminKeyFile), { recursive: true })
    const content = token + '\n'
    this.writeState(this.adminKeyFile, content)
    this.mirrorCredentialFile('xpeach.admin', content)
    process.env[this.adminKeyVar] = token
    this.markOnboardedAndClearSignOut()
  }

  /** 发布完成后重新校验同代凭据，失败不得继续发布目录。 */
  private async publishCredential(key: string, snapshot = this.captureCredentialSnapshot()): Promise<void> {
    await this.getRelayState().withCurrent(snapshot.relay, async () => {
      await this.publishCredentialUnderLock(key, snapshot)
    })
  }

  private async publishCredentialUnderLock(key: string, snapshot: CredentialSnapshot): Promise<void> {
    const creds = this.ctx.get('credentials') as { set?: (ref: CredentialRef, value: string) => Promise<void>; unset?: (ref: CredentialRef) => Promise<void> } | undefined
    this.assertCredentialSnapshot(snapshot)
    if (key !== snapshot.relay.key) throw new RelayStateError('credential-changed')
    try {
      await creds?.set?.(credentialRef(this.keyVar), key)
    } catch (cause) {
      throw new RelayStateError('credential-write-incomplete', { cause })
    }
    this.assertCredentialSnapshot(snapshot)
  }

  private async assertPublishedCredential(snapshot: CredentialSnapshot): Promise<void> {
    this.assertCredentialSnapshot(snapshot)
    const credentials = this.ctx.get('credentials')
    if (credentials !== undefined) {
      const resolved = await credentials.resolve(credentialRef(this.keyVar))
      this.assertCredentialSnapshot(snapshot)
      if (resolved?.value !== snapshot.relay.key) throw new RelayStateError('credential-write-incomplete')
    }
  }

  /** Drop the runtime record so a revoked key cannot keep serving a route. */
  private async revokeCredential(): Promise<void> {
    const snapshot = this.captureCredentialSnapshot()
    await this.getRelayState().withCurrent(snapshot.relay, async () => {
      await this.revokeCredentialUnderLock(snapshot)
    })
  }

  private async revokeCredentialUnderLock(snapshot: CredentialSnapshot): Promise<void> {
    this.assertCredentialSnapshot(snapshot)
    if (snapshot.relay.key !== undefined) throw new RelayStateError('credential-changed')
    const creds = this.ctx.get('credentials') as { unset?: (ref: CredentialRef) => Promise<void> } | undefined
    try {
      await creds?.unset?.(credentialRef(this.keyVar))
    } catch (cause) {
      throw new RelayStateError('credential-write-incomplete', { cause })
    }
  }

  /** Notify clients (and the forwarded-event allowlist) the key changed. */
  private notifyKeyChanged(): void {
    try { this.ctx.emit('credentials/reference-updated', this.apiKeyEnv) } catch (_err) { /* contained */ }
    if (this.keyVar !== this.apiKeyEnv) {
      try { this.ctx.emit('credentials/reference-updated', credentialRef(this.keyVar)) } catch (_err) { /* contained */ }
    }
  }

  private async cachedTokenUsage(signal: AbortSignal): Promise<XPeachTokenUsage> {
    signal.throwIfAborted()
    const cacheKey = `${this.readKeyFile() ?? ''}|${this.resolveAdmin() ?? ''}`
    if (this.usageCache !== undefined && this.usageCache.key === cacheKey && Date.now() - this.usageCache.at < 15_000) {
      return this.usageCache.usage
    }
    if (this.usageInFlight !== undefined) {
      return await raceWithAbortSignal(this.usageInFlight, signal)
    }
    const internalTimeout = createInternalTimeoutController(this.timeoutMs || 15_000, 'Token usage request timed out')
    const effectiveSignal = internalTimeout.signal
    const run = (async (): Promise<XPeachTokenUsage> => {
      const usage = await this.api.tokenUsage(effectiveSignal)
      if ((usage.unlimited_quota || usage.total_available < 0) && this.resolveAdmin() !== undefined) {
        try {
          const me = await this.api.userSelf(effectiveSignal)
          if (typeof me.quota === 'number' && Number.isFinite(me.quota)) {
            const used = typeof me.used_quota === 'number' && Number.isFinite(me.used_quota)
              ? me.used_quota
              : Math.max(0, usage.total_used)
            const avail = Math.max(0, me.quota)
            const merged: XPeachTokenUsage = {
              ...usage,
              name: me.display_name || me.username || usage.name,
              total_available: avail,
              total_used: used,
              total_granted: avail + used,
              unlimited_quota: false,
            }
            this.usageCache = { at: Date.now(), key: cacheKey, usage: merged }
            return merged
          }
        } catch (_err) {
          // Fall back to raw token usage when personal profile lookup fails.
        }
      }
      this.usageCache = { at: Date.now(), key: cacheKey, usage }
      return usage
    })().finally(() => {
      internalTimeout.clear()
      if (this.usageInFlight === run) this.usageInFlight = undefined
    })
    this.usageInFlight = run
    void run.catch(() => {})
    return await raceWithAbortSignal(run, signal)
  }

  /**
   * Usage summary of the calling API token: name, granted/used quota, and the
   * model limits in force. Works with the relay sk- credential.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns the token usage record.
   */
  @Remote('tokenUsage')
  async tokenUsage(_request: XPeachTokenUsageRequest, signal: AbortSignal): Promise<XPeachTokenUsage> {
    return await this.cachedTokenUsage(signal)
  }

  /**
   * Recent relay log rows attributed to the calling token: model, prompt and
   * completion tokens, latency. Works with the relay sk- credential. The site
   * returns the token's full log tail (server-capped); callers slice.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns the newest log entries.
   */
  @Remote('tokenLogs')
  async tokenLogs(_request: XPeachTokenLogsRequest, signal: AbortSignal): Promise<readonly XPeachTokenLogEntry[]> {
    return await this.api.tokenLogs(signal)
  }

  /**
   * The relay catalog the calling token may invoke: the site's `/v1/models`
   * list, already scoped to the token's group by the server.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns the catalog entries.
   */
  @Remote('models')
  async models(_request: XPeachModelsRequest, signal: AbortSignal): Promise<readonly XPeachModel[]> {
    const [list, metadata] = await Promise.all([
      this.api.models(signal),
      Promise.resolve(this.readModelMetadataCache()),
    ])
    return list.map((m) => {
      const caps = modelCapabilities(m, metadata)
      return {
        ...m,
        contextWindow: caps.contextWindow,
        maxTokens: caps.maxTokens,
        inputModalities: caps.input,
        defaultReasoningEffort: 'high',
      }
    })
  }

  /**
   * The configured watch list cross-checked against the live catalog: each
   * watched model id plus whether the site lets the token call it.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns the match rows.
   */
  @Remote('modelMatch')
  async modelMatch(_request: XPeachModelsRequest, signal: AbortSignal): Promise<readonly { id: string; available: boolean }[]> {
    const catalog = await this.models({}, signal)
    const site = new Set(catalog.map(m => m.id))
    return this.watchModels.map(id => ({ id, available: site.has(id) }))
  }

  /**
   * List stored key slots: masked prefix and which slot is active.
   *
   * @returns stored key slots with masked prefixes.
   */
  @Remote('keySlots')
  keySlotsOp(): { slots: readonly { name: string; prefix: string; active: boolean }[] } {
    const active = this.readKeyFile()
    return {
      slots: this.readSlots().map(s => ({
        name: s.name, prefix: s.key.slice(0, 8) + '…' + s.key.slice(-4), active: s.key === active,
      })),
    }
  }

  /**
   * 独立验证候选密钥，再按捕获修订提交并激活槽位；不会临时替换活动凭据。
   * @param request - 槽位名称与候选密钥。
   * @param signal - 验证及等待提交的取消信号；提交后的清理继续完成。
   * @returns 验证失败返回 ok: false 且原凭据不变；并发变化或提交／引用发布失败拒绝。
   */
  @Remote('keySlotAdd')
  async keySlotAddOp(request: { name: string; key: string }, signal: AbortSignal): Promise<{ ok: boolean; message: string }> {
    signal.throwIfAborted()
    const key = request.key.trim()
    if (key.match(/^(?:xpk|sk)-/u) === null) return { ok: false, message: 'xpeach: key must start with xpk-' }
    const snapshot = this.captureCredentialSnapshot()
    const prev = snapshot.relay.key
    const candidate = new XPeachApi({
      baseURL: this.api.siteBaseURL,
      timeoutMs: this.timeoutMs,
      resolveKey: () => Promise.resolve(key),
      resolveAdmin: () => undefined,
      resolveCookie: () => undefined,
    })
    try {
      await candidate.tokenUsage(signal)
    } catch (e) {
      this.assertCredentialSnapshot(snapshot)
      if (signal.aborted) throw e
      return { ok: false, message: '候选密钥验证失败，原活动凭据保持不变；请检查密钥后重试。' }
    }
    signal.throwIfAborted()
    this.assertCredentialSnapshot(snapshot)
    await this.persistKey(key, snapshot, signal)
    const slots = this.readSlots().filter(s => s.key !== key)
    slots.push({ name: request.name.trim() || `slot-${String(slots.length + 1)}`, key })
    this.writeSlots(slots)
    if (prev !== key) {
      this.lastEnsureTokenInfoAt = 0
    }
    this.markOnboardedAndClearSignOut()
    void this.ensureDesktopOnboardingCompleted().catch(() => {})
    this.notifyKeyChanged()
    void this.syncModelCatalog(AbortSignal.timeout(this.timeoutMs)).catch(() => {})
    return { ok: true, message: 'xpeach: key slot added + active' }
  }

  /**
   * Switch the active key slot by index.
   *
   * @param request - zero-based slot index.
   * @returns switch outcome message.
   */
  @Remote('keySlotSwitch')
  async keySlotSwitchOp(request: { index: number }): Promise<{ ok: boolean; message: string }> {
    const slots = this.readSlots()
    const target = slots[request.index]
    if (target === undefined) return { ok: false, message: 'xpeach: slot index out of range' }
    const prev = this.readKeyFile()
    await this.persistKey(target.key)
    if (prev !== target.key) {
      this.lastEnsureTokenInfoAt = 0
    }
    this.notifyKeyChanged()
    void this.syncModelCatalog(AbortSignal.timeout(this.timeoutMs)).catch(() => {})
    return { ok: true, message: 'xpeach: switched to ' + target.name }
  }

  /**
   * Remove a key slot; when active, activates the first remaining slot or clears the key file.
   *
   * @param request - zero-based slot index.
   * @returns removal outcome message.
   */
  @Remote('keySlotRemove')
  async keySlotRemoveOp(request: { index: number }): Promise<{ ok: boolean; message: string }> {
    const slots = this.readSlots()
    const target = slots[request.index]
    if (target === undefined) return { ok: false, message: 'xpeach: slot index out of range' }
    const snapshot = this.captureCredentialSnapshot()
    const active = snapshot.relay.key
    slots.splice(request.index, 1)
    this.writeSlots(slots)
    if (target.key === active) {
      const next = slots[0]
      if (next !== undefined) {
        await this.persistKey(next.key, snapshot)
        this.lastEnsureTokenInfoAt = 0
      } else {
        await this.commitRelay(snapshot, {})
        Reflect.deleteProperty(process.env, this.keyVar)
        Reflect.deleteProperty(process.env, this.apiKeyEnv)
        await this.getRelayState().withCurrent(snapshot.relay, async () => { await this.revokeCredentialUnderLock(snapshot) })
      }
      this.notifyKeyChanged()
    }
    return { ok: true, message: 'xpeach: slot removed' }
  }

  /**
   * Bind the user's Access Token (the site-management token). The token is
   * verified against `/api/user/self`, persisted as the admin credential, and
   * used once to find-or-create the `sk-` relay token that LLM calls bill
   * through.
   *
   * @param request - site access token payload.
   * @param signal - carrier cancellation.
   * @returns bound credential status and masked previews.
   */
  @Remote('bindKey')
  async bindKey(request: XPeachBindKeyRequest, signal: AbortSignal): Promise<XPeachBindResult> {
    signal.throwIfAborted()
    const token = request.key.trim()
    if (token.length === 0) {
      throw new RemoteError('xpeach/request-failed', 'xpeach: paste your site Access Token', { status: 0, message: 'empty token' })
    }
    if (token.match(/^(?:xpk|sk)-/u) !== null) {
      throw new RemoteError(
        'xpeach/request-failed',
        'xpeach: 这是 API 令牌(sk-),不是管理令牌。请粘贴站点「个人设置 → 系统访问令牌」里的 Access Token。',
        { status: 0, message: 'api key, not access token' },
      )
    }
    const snapshot = this.captureCredentialSnapshot()
    const previousAdmin = this.resolveAdmin()
    const candidate = new XPeachApi({
      baseURL: this.api.siteBaseURL,
      timeoutMs: this.timeoutMs,
      resolveKey: () => Promise.reject(new RemoteError('xpeach/missing-credential', 'xpeach: probe client has no relay key', { ref: 'key' })),
      resolveAdmin: () => token,
      resolveCookie: () => undefined,
    })
    await candidate.adminSelf(signal)
    this.assertCredentialSnapshot(snapshot)
    if (previousAdmin !== undefined && previousAdmin !== token) {
      await this.commitRelay(snapshot, {})
      try { unlinkSync(this.slotsFile()) } catch (_err) { /* absent */ }
      Reflect.deleteProperty(process.env, this.keyVar)
      Reflect.deleteProperty(process.env, this.apiKeyEnv)
      await this.revokeCredential()
    }
    this.persistAdmin(token)
    this.api.setAdminKey(undefined)
    const mint = await this.mintKeyWithAccessToken(signal)
    if (!mint.ok) {
      throw new RemoteError(
        'xpeach/request-failed',
        'xpeach: 访问令牌已验证,但铸取 API 令牌失败:' + (mint.err ?? 'unknown'),
        { status: 0, message: 'mint failed' },
      )
    }
    this.lastSsoVerifyAt = Date.now()
    this.markOnboardedAndClearSignOut()
    void this.ensureDesktopOnboardingCompleted().catch(() => {})
    const emitEvent = this.ctx.emit.bind(this.ctx) as (name: string) => void
    try { emitEvent('deepseek-account/signed-in') } catch (_err) { /* contained */ }
    this.notifyKeyChanged()
    this.deepseekAccountBridge?.notifyWatchers(true)
    await this.syncModelCatalog(signal).catch(() => {})
    return {
      bound: true,
      preview: mint.preview ?? 'sk-…',
      adminBound: true,
      adminPreview: token.slice(0, 4) + '…' + token.slice(-4),
    }
  }

  /**
   * Remove all bound credentials (relay key, admin token, session cookie, SSO state, slots, and token metadata).
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns the post-write bound state.
   */
  @Remote('unbindKey')
  async unbindKey(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachBindResult> {
    signal.throwIfAborted()
    await this.revokeAllLocalCredentials('signed-out', {
      revokeRemote: true,
      allDevices: false,
      revokePeachcode: false,
    })
    return { bound: false }
  }

  /**
   * Whether a credential is currently bound (no value exposure).
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns the bound state.
   */
  @Remote('keyState')
  keyState(_request: XPeachSelfRequest, signal: AbortSignal): XPeachBindResult {
    signal.throwIfAborted()
    this.syncCatalogOnce()
    const key = this.readKeyFile()
    const admin = this.resolveAdmin()
    const adminBits = admin === undefined ? {} : { adminBound: true, adminPreview: admin.slice(0, 4) + '…' + admin.slice(-4) }
    if (key !== undefined && key.length > 0) {
      return { bound: true, preview: key.slice(0, 3) + '…' + key.slice(-4), ...adminBits }
    }
    return { bound: false, ...adminBits }
  }

  /**
   * Playground call: run one chat completion against any catalog model with the
   * bound key — the console's "try this model" action.
   *
   * @param request - model id + prompt.
   * @param signal - carrier cancellation.
   * @returns reply text, token counts and latency.
   */
  @Remote('chat')
  async chat(request: XPeachChatRequest, signal: AbortSignal): Promise<XPeachChatReply> {
    const callId = request.callId
    if (callId !== undefined && callId.length > 0) {
      return await this.api.chatStream(request, (delta) => { this.emitChunk(callId, delta) }, signal)
    }
    return await this.api.chat(request, signal)
  }

  /** Broadcast one streamed delta on the forwarded playground event. */
  private emitChunk(callId: string, delta: string): void {
    try {
      this.ctx.emit('xpeach/playground-chunk', { callId, delta })
    } catch (_err) {
      // Event fan-out is best-effort; the assembled reply is the contract.
    }
  }

  /**
   * The signed-in user's profile as the site's dashboard reads it. Requires a
   * personal access token; a relay sk- credential gets 401.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns the New API self record.
   */
  @Remote('self')
  async self(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachUserSelf> {
    return await this.api.self(signal)
  }

  /**
   * The first page of the user's API tokens (newest first). Requires a
   * personal access token; a relay sk- credential gets 401.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns the token list page.
   */
  @Remote('tokens')
  async tokens(_request: XPeachTokensRequest, signal: AbortSignal): Promise<XPeachTokenPage> {
    return await this.api.tokens(signal)
  }

  /**
   * Admin aggregate for the console header: admin identity, site totals
   * (users/logs/tokens), groups, and the admin's own rate stats.
   *
   * @param _request - paging request payload.
   * @param signal - carrier cancellation.
   * @returns aggregated admin overview metrics.
   */
  @Remote('adminOverview')
  async adminOverview(_request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachAdminOverview> {
    return await this.api.adminOverview(signal)
  }

  /**
   * Paged site-user list for the admin table.
   *
   * @param request - page index and size.
   * @param signal - carrier cancellation.
   * @returns paged list of users.
   */
  @Remote('adminUsers')
  async adminUsers(request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminUser>> {
    return await this.api.adminUsers(request.page ?? 0, request.size ?? 20, signal)
  }

  /**
   * Paged site-token list.
   *
   * @param request - page index and size.
   * @param signal - carrier cancellation.
   * @returns paged list of tokens.
   */
  @Remote('adminTokens')
  async adminTokens(request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminToken>> {
    return await this.api.adminTokens(request.page ?? 0, request.size ?? 20, signal)
  }

  /**
   * Full model-pricing catalog (entries + per-group ratio table).
   *
   * @param _request - paging request payload.
   * @param signal - carrier cancellation.
   * @returns pricing catalog entries and group ratios.
   */
  @Remote('adminPricing')
  async adminPricing(_request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachPricingCatalog> {
    return await this.api.adminPricing(signal)
  }

  /**
   * Live health probe: a 1-token ping against each catalog model (or the
   * requested subset), six at a time, cached 60 s so repeated tab visits don't
   * re-burn quota. Failed rows carry their error for honest chips.
   *
   * @param request - optional subset of model ids to probe.
   * @param signal - carrier cancellation.
   * @returns sorted model health rows.
   */
  @Remote('modelHealth')
  async modelHealth(request: XPeachHealthRequest, signal: AbortSignal): Promise<readonly XPeachHealthRow[]> {
    const fresh = this.healthCache
    if (fresh !== undefined && Date.now() - fresh.at < 60_000 && (request.models === undefined || request.models.length === 0)) {
      return fresh.rows
    }
    const catalog = await this.api.models(signal)
    const targets = request.models !== undefined && request.models.length > 0
      ? catalog.filter(m => request.models?.includes(m.id))
      : catalog
    const rows: XPeachHealthRow[] = []
    let cursor = 0
    const lanes = Array.from({ length: Math.min(6, Math.max(1, targets.length)) }, async () => {
      while (cursor < targets.length) {
        const model = targets[cursor]
        cursor += 1
        if (model === undefined) break
        rows.push(await this.api.probe(model.id, signal))
      }
    })
    await Promise.all(lanes)
    const sorted = rows.sort((a, b) => Number(b.ok) - Number(a.ok) || (a.latencyMs ?? 9e9) - (b.latencyMs ?? 9e9))
    if (request.models === undefined || request.models.length === 0) this.healthCache = { at: Date.now(), rows: sorted }
    return sorted
  }

  /**
   * Synchronize the cached pricing catalog and group ratios.
   *
   * @param request - optional `force` flag to bypass cache TTL.
   * @param signal - carrier cancellation.
   * @returns snapshot timestamp, entry counts, and staleness flag.
   */
  @Remote('priceSync')
  async priceSync(request: { readonly force?: boolean }, signal: AbortSignal):
  Promise<{ at: number; entries: number; groups: number; stale: boolean }> {
    const snap = await this.api.pricingSync(request.force === true, signal)
    return { at: snap.at, entries: snap.entries.length, groups: Object.keys(snap.groups).length, stale: snap.stale }
  }

  /**
   * Fetch the site group catalog visible to the calling token.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns group descriptors keyed by group name.
   */
  @Remote('groups')
  async groups(_request: Record<string, never>, signal: AbortSignal):
  Promise<Record<string, { desc?: string; models?: readonly string[]; ratio?: string | number }>> {
    return await this.api.groups(signal)
  }

  /**
   * Fetch 24-hour performance telemetry summaries across all models from
   * PeachAPI (`/api/perf-metrics/summary`), cached for 60 seconds.
   *
   * @param request - optional lookback window in hours (`default = 24`).
   * @param signal - carrier cancellation.
   * @returns list of model performance summaries.
   */
  @Remote('perfMetricsSummary')
  async perfMetricsSummaryOp(
    request: { readonly hours?: number | undefined },
    signal: AbortSignal,
  ): Promise<readonly XPeachModelPerfSummary[]> {
    signal.throwIfAborted()
    const hours = request.hours ?? 24
    const cached = this.perfSummaryCache
    if (cached !== undefined && cached.hours === hours && Date.now() - cached.at < 60_000) {
      return cached.items
    }
    const items = await this.api.perfMetricsSummary(hours, signal)
    this.perfSummaryCache = { at: Date.now(), hours, items }
    return items
  }

  /**
   * Fetch per-group 24-hour performance telemetry and hourly time series for one
   * model from PeachAPI (`/api/perf-metrics`).
   *
   * @param request - target model name and optional lookback window in hours (`default = 24`).
   * @param signal - carrier cancellation.
   * @returns model performance detail grouped by channel group.
   */
  @Remote('perfMetricsDetail')
  async perfMetricsDetailOp(
    request: { readonly model: string; readonly hours?: number | undefined },
    signal: AbortSignal,
  ): Promise<XPeachModelPerfDetail> {
    signal.throwIfAborted()
    return await this.api.perfMetricsDetail(request.model, request.hours ?? 24, signal)
  }

  /**
   * The four billing multipliers for one model: catalog ratios joined with the
   * group discount our token actually paid on its last call.
   *
   * @param request - model identifier and optional group name.
   * @param signal - carrier cancellation.
   * @returns billing rate multipliers, or `undefined` when unknown.
   */
  @Remote('billingRate')
  async billingRate(request: { readonly model: string; readonly group?: string }, signal: AbortSignal):
  Promise<XPeachBillingRate | undefined> {
    return await this.api.billingRate(request.model, signal, request.group)
  }

  /**
   * Paged site-wide call logs; query filters by username or model.
   *
   * @param request - page index, size, and optional filter query.
   * @param signal - carrier cancellation.
   * @returns paged list of admin log entries.
   */
  @Remote('adminLogs')
  async adminLogs(request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminLogEntry>> {
    return await this.api.adminLogs(request.page ?? 0, request.size ?? 20, request.query, signal)
  }

  /**
   * The site-management token: its own profile file first, then our own env
   * var.
   */
  private resolveAdmin(): string | undefined {
    if (existsSync(this.adminKeyFile)) {
      const value = readFileSync(this.adminKeyFile, 'utf8').trim()
      if (value.length > 0) return value
    }
    const ambient = process.env[this.adminKeyVar]?.trim()
    return ambient !== undefined && ambient.length > 0 ? ambient : undefined
  }

  /**
   * The site session cookie: profile file → env var.
   */
  private resolveSession(): string | undefined {
    if (existsSync(this.sessionKeyFile)) {
      const value = readFileSync(this.sessionKeyFile, 'utf8').trim()
      if (value.length > 0) return value
    }
    const ambient = process.env[this.sessionKeyVar]?.trim()
    return ambient !== undefined && ambient.length > 0 ? ambient : undefined
  }

  /**
   * Fetch a page of the signed-in user's own usage logs.
   *
   * @param request - optional page index and page size.
   * @param signal - carrier cancellation.
   * @returns paged list of self usage log entries.
   */
  @Remote('userLogs')
  async userLogsOp(request: { page?: number; size?: number }, signal: AbortSignal): Promise<XPeachSelfLogPage> {
    signal.throwIfAborted()
    return await this.api.userLogs(request.page ?? 0, request.size ?? 100, signal)
  }

  /**
   * Fetch the signed-in user's own usage statistics.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns own quota, RPM, and TPM totals.
   */
  @Remote('userLogStat')
  async userLogStatOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachSelfLogStat> {
    signal.throwIfAborted()
    return await this.api.userLogStat(signal)
  }

  /**
   * Fetch the signed-in user's profile over the login channel.
   *
   * @param signal - carrier cancellation.
   * @returns user profile record.
   */
  @Remote('userSelf')
  async userSelfOp(signal: AbortSignal): Promise<XPeachUserSelf> {
    return await this.api.userSelf(signal)
  }

  /**
   * Check whether a site session cookie is currently bound.
   *
   * @returns object indicating session bound status.
   */
  @Remote('sessionBound')
  sessionBoundOp(): { bound: boolean } {
    return { bound: this.api.sessionBound() }
  }

  /**
   * Validate and bind a pasted site session cookie.
   *
   * @param value - raw session cookie value.
   * @param signal - carrier cancellation.
   * @returns bound status and resolved username.
   */
  @Remote('bindSession')
  async bindSession(value: string, signal: AbortSignal): Promise<{ bound: boolean; as?: string }> {
    signal.throwIfAborted()
    const trimmed = value.trim()
    if (trimmed.length === 0) throw new RemoteError('xpeach/request-failed', 'xpeach: empty session cookie', { status: 0, message: 'empty session cookie' })
    const candidate = new XPeachApi({
      baseURL: this.api.siteBaseURL,
      timeoutMs: this.timeoutMs,
      resolveKey: () => Promise.reject(new RemoteError('xpeach/missing-credential', 'xpeach: probe client has no relay key', { ref: 'key' })),
      resolveAdmin: () => undefined,
      resolveCookie: () => trimmed,
    })
    const me = await candidate.sessionSelf(signal)
    const content = trimmed + '\n'
    this.writeState(this.sessionKeyFile, content)
    this.mirrorCredentialFile('xpeach.session', content)
    this.api.setSessionKey(trimmed)
    this.markOnboardedAndClearSignOut()
    void this.ensureDesktopOnboardingCompleted().catch(() => {})
    this.notifyKeyChanged()
    return { bound: true, as: me.username }
  }

  private currentSsoBaseURL(): string {
    const raw = unwrapConfigValue(this.liveConfig.ssoBaseURL) ?? process.env.XPEACH_SSO_URL ?? 'https://sso.xpeach.codes'
    return validateSsoBaseUrl(raw)
  }

  private currentSsoClientId(): string {
    const raw = unwrapConfigValue(this.liveConfig.ssoClientId) ?? process.env.XPEACH_SSO_CLIENT_ID ?? 'xpeach-harness'
    return raw.trim() || 'xpeach-harness'
  }

  private hasExplicitCustomSsoClientId(): boolean {
    if (process.env.XPEACH_SSO_STRICT_CLIENT_ID === '1') return true
    const configured = this.currentSsoClientId()
    return configured !== 'xpeach-harness'
  }

  private async resolveEffectiveSsoIssuer(signal: AbortSignal, preferredIssuer?: string): Promise<string> {
    const configured = parseSsoIssuer(this.currentSsoBaseURL())
    if (configured.tenantSlug !== undefined) {
      return configured.issuer
    }
    if (typeof preferredIssuer === 'string' && preferredIssuer.trim().length > 0) {
      try {
        const preferred = parseSsoIssuer(preferredIssuer)
        if (preferred.origin === configured.origin && preferred.tenantSlug !== undefined) {
          return preferred.issuer
        }
      } catch (_err) {
        /* ignore invalid stored issuer and fall back to discovery */
      }
    }
    const discover = (this.api as { discoverSsoIssuer?: (base: string, sig: AbortSignal) => Promise<string> }).discoverSsoIssuer
    if (typeof discover === 'function') {
      return await discover.call(this.api, configured.issuer, signal)
    }
    return configured.issuer
  }

  /**
   * Current relay site root URL without trailing slash.
   *
   * @returns normalized site base URL.
   */
  currentSiteRoot(): string {
    return this.api.siteBaseURL.replace(/\/+$/, '')
  }

  /**
   * Origins permitted to receive the active relay API key from `DeepSeekAccount.resolveToken(url)`.
   *
   * @returns allowed relay origins (active site root, configured baseURL, custom routing origin,
   * and official `ROUTES` only when operating on the official route pool).
   */
  allowedRelayOrigins(): readonly string[] {
    const origins = new Set<string>()
    const addOrigin = (raw: string | undefined): void => {
      if (typeof raw !== 'string' || raw.trim().length === 0) return
      try {
        origins.add(new URL(raw.trim()).origin)
      } catch { /* ignore invalid */ }
    }
    let currentRoot: string | undefined
    try {
      currentRoot = this.currentSiteRoot()
    } catch {
      currentRoot = typeof this.activeBaseURL === 'string' ? this.activeBaseURL.replace(/\/+$/u, '') : undefined
    }
    addOrigin(currentRoot)
    addOrigin(this.baseURL)
    if (typeof this.readModelRouting === 'function') {
      try {
        addOrigin(this.readModelRouting().customBaseUrl)
      } catch { /* ignore in partial mocks */ }
    }
    if (this.isOfficialRouteUrl(currentRoot) || this.isOfficialRouteUrl(this.baseURL)) {
      for (const route of ROUTES) {
        addOrigin(route.url)
      }
    }
    return [...origins]
  }

  /**
   * Whether any XPeach credential (relay key, admin token, or SSO session) is currently bound.
   *
   * @returns `true` when at least one credential channel is bound.
   */
  isBound(): boolean {
    const key = this.readKeyFile()
    if (key !== undefined && key.length > 0) return true
    if (this.resolveAdmin() !== undefined) return true
    const sso = this.readSsoState()
    return typeof sso?.accessToken === 'string' && sso.accessToken.length > 0
  }

  /**
   * Read the stored SSO state file (`xpeach.sso.json`) if present and valid.
   *
   * @returns parsed SSO state object, or `undefined` when absent or malformed.
   */
  readSsoState(): StoredSsoState | undefined {
    if (!existsSync(this.ssoStateFile)) return undefined
    try {
      const parsed: unknown = JSON.parse(readFileSync(this.ssoStateFile, 'utf8'))
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
      return parsed
    } catch (_err) {
      return undefined
    }
  }

  /**
   * Current platform session snapshot for `DeepSeekAccount.getPlatformSession()`.
   *
   * @returns signed-in bearer session snapshot or `{ status: 'signed-out' }`.
   */
  currentPlatformSession():
    | {
      readonly status: 'signed-in'
      readonly bearerToken: string
      readonly userId: string | null
      readonly expiresAt: number | null
    }
    | { readonly status: 'signed-out' } {
    const sso = this.readSsoState()
    const bearer = sso?.accessToken ?? this.resolveAdmin() ?? this.readKeyFile()
    if (bearer === undefined || bearer.length === 0) {
      return { status: 'signed-out' }
    }
    const boundAtMs = typeof sso?.boundAt === 'number'
      ? sso.boundAt
      : typeof sso?.boundAt === 'string'
        ? Date.parse(sso.boundAt)
        : Number.NaN
    const expiresAt = Number.isFinite(boundAtMs) && typeof sso?.expiresIn === 'number'
      ? boundAtMs + sso.expiresIn * 1000
      : null
    const userId = sso?.user?.id ?? (typeof sso?.peachcodeUserId === 'number' ? String(sso.peachcodeUserId) : null)
    return {
      status: 'signed-in',
      bearerToken: bearer,
      userId,
      expiresAt,
    }
  }

  /**
   * Resolve a verified relay key or throw an `ACCOUNT_SIGN_IN_REQUIRED` error.
   *
   * @param forceVerify - bypass the 5-second SSO verification cache.
   * @param signal - optional request cancellation signal.
   * @returns active relay API key string.
   */
  async resolveVerifiedRelayKey(forceVerify = false, signal?: AbortSignal): Promise<string> {
    const verify = await this.verifyAndSyncSsoSession(forceVerify, signal)
    if (!verify.valid || verify.status === 'revoked') {
      const err = new Error(verify.message ?? 'XPeach 账号已退出或被停用，请重新登录。') as Error & { code?: string }
      err.code = 'ACCOUNT_SIGN_IN_REQUIRED'
      throw err
    }
    const key = await this.resolveKey().catch(() => undefined)
    if (key === undefined || key.length === 0) {
      const err = new Error('XPeach 账号未绑定凭证，请先完成登录。') as Error & { code?: string }
      err.code = 'ACCOUNT_SIGN_IN_REQUIRED'
      throw err
    }
    return key
  }

  /**
   * Resolve user profile metadata for `DeepSeekAccount.getProfile()`.
   *
   * @param signal - request cancellation signal.
   * @returns user identifier, display name, and email/contact.
   */
  async resolveAccountProfile(signal: AbortSignal): Promise<{
    readonly id: string | null
    readonly name: string | null
    readonly contact: string | null
  }> {
    const sso = this.readSsoState()
    try {
      const me = await this.api.userSelf(signal)
      return {
        id: String(me.id),
        name: me.display_name || me.username || sso?.user?.name || sso?.user?.username || null,
        contact: me.email || sso?.user?.email || null,
      }
    } catch (_err) {
      if (sso?.user !== undefined) {
        return {
          id: sso.user.id ?? (typeof sso.peachcodeUserId === 'number' ? String(sso.peachcodeUserId) : null),
          name: sso.user.name ?? sso.user.username ?? null,
          contact: sso.user.email ?? null,
        }
      }
      return { id: null, name: null, contact: null }
    }
  }

  /**
   * Query user profile metadata for `DeepSeekAccount.getProfile()`.
   *
   * @param _force - whether to force a fresh profile query.
   * @param signal - optional request cancellation signal.
   * @returns user identifier, display name, and email/contact.
   */
  async getProfile(_force?: boolean, signal?: AbortSignal): Promise<{
    readonly id: string | null
    readonly name: string | null
    readonly contact: string | null
  }> {
    return await this.resolveAccountProfile(signal ?? AbortSignal.timeout(10_000))
  }

  /**
   * Resolve account quota balance for `DeepSeekAccount.getBalance()`.
   *
   * @param signal - request cancellation signal.
   * @returns USD wallet balance snapshot or `{ available: false }`.
   */
  async resolveAccountBalance(signal: AbortSignal): Promise<
    | {
      readonly available: true
      readonly totalBalance: string
      readonly toppedUpBalance: string
      readonly grantedBalance: string
      readonly currency: 'CNY' | 'USD'
    }
    | { readonly available: false }
  > {
    if (!this.isBound()) return { available: false }
    const cacheKey = `${this.readKeyFile() ?? ''}|${this.resolveAdmin() ?? ''}`
    if (
      this.usageCache !== undefined
      && this.usageCache.key === cacheKey
      && Date.now() - this.usageCache.at < 15_000
      && this.usageCache.usage.total_available >= 0
      && !this.usageCache.usage.unlimited_quota
    ) {
      const usd = Math.max(0, this.usageCache.usage.total_available / 500_000).toFixed(2)
      return {
        available: true,
        totalBalance: usd,
        toppedUpBalance: usd,
        grantedBalance: '0.00',
        currency: 'USD',
      }
    }
    try {
      const me = await this.api.userSelf(signal)
      const avail = Math.max(0, me.quota ?? 0)
      const used = Math.max(0, me.used_quota ?? 0)
      this.usageCache = {
        at: Date.now(),
        key: cacheKey,
        usage: {
          name: me.display_name || me.username || 'xpeach',
          total_available: avail,
          total_used: used,
          total_granted: avail + used,
          unlimited_quota: false,
          expires_at: 0,
          model_limits_enabled: false,
        },
      }
      const usd = (avail / 500_000).toFixed(2)
      return {
        available: true,
        totalBalance: usd,
        toppedUpBalance: usd,
        grantedBalance: '0.00',
        currency: 'USD',
      }
    } catch (_err) {
      try {
        const usage = await this.cachedTokenUsage(signal)
        const usd = Math.max(0, usage.total_available / 500_000).toFixed(2)
        return {
          available: true,
          totalBalance: usd,
          toppedUpBalance: usd,
          grantedBalance: '0.00',
          currency: 'USD',
        }
      } catch (_innerErr) {
        return { available: false }
      }
    }
  }

  /**
   * Query account quota balance for `DeepSeekAccount.getBalance()`.
   *
   * @param _force - whether to force a fresh balance query.
   * @param signal - optional request cancellation signal.
   * @returns USD wallet balance snapshot or `{ available: false }`.
   */
  async getBalance(_force?: boolean, signal?: AbortSignal): Promise<
    | {
      readonly available: true
      readonly totalBalance: string
      readonly toppedUpBalance: string
      readonly grantedBalance: string
      readonly currency: 'CNY' | 'USD'
    }
    | { readonly available: false }
  > {
    return await this.resolveAccountBalance(signal ?? AbortSignal.timeout(10_000))
  }

  private async handleAuthRejected(_status: 401 | 403): Promise<void> {
    await this.verifyAndSyncSsoSession(true).catch(() => {})
  }

  private cancelRunningAccountTasks(): void {
    try {
      const agents = this.ctx.get('agents') as {
        list?: () => readonly {
          readonly status?: string
          readonly session?: { readonly requestContext?: () => { readonly provider?: string } | undefined }
          readonly cancel?: (reason: { readonly kind: 'hook'; readonly reason: string }, options?: { readonly keepInbox?: boolean }) => void
        }[]
      } | undefined
      if (agents?.list !== undefined) {
        for (const agent of agents.list()) {
          if (agent.status !== 'running') continue
          const provider = agent.session?.requestContext?.()?.provider
          if (provider === undefined || provider === 'deepseek-account' || provider.startsWith('xpeach')) {
            try {
              agent.cancel?.({ kind: 'hook', reason: 'deepseek-account/signed-out' }, { keepInbox: true })
            } catch (_err) { /* ignore individual agent cancel errors */ }
          }
        }
      }
      const agentService = this.ctx.get('agent') as {
        list?: () => readonly { readonly id: string; readonly state?: string }[]
        getSessionId?: (taskId: string) => string | undefined
        cancel?: (taskId: string, reason: { readonly kind: 'hook'; readonly reason: string }, options?: { readonly keepInbox?: boolean }) => void
      } | undefined
      if (agentService?.list !== undefined && agentService.cancel !== undefined) {
        const sessionProjection = this.ctx.get('sessionProjectionCache') as {
          getLastModel?: (sessionId: string) => { readonly provider?: string } | undefined
        } | undefined
        for (const task of agentService.list()) {
          if (task.state !== 'running') continue
          const sessionId = agentService.getSessionId?.(task.id)
          const provider = sessionId !== undefined ? sessionProjection?.getLastModel?.(sessionId)?.provider : undefined
          if (provider === undefined || provider === 'deepseek-account' || provider.startsWith('xpeach')) {
            try {
              agentService.cancel(task.id, { kind: 'hook', reason: 'deepseek-account/signed-out' }, { keepInbox: true })
            } catch (_err) { /* ignore individual task cancel errors */ }
          }
        }
      }
    } catch (_err) { /* best effort */ }
  }

  private async clearModelCatalogFromSettings(): Promise<void> {
    const settings = this.ctx.get('settings') as
      | {
        describe?: () => unknown
        update?: (ns: string, patch: object) => Promise<void>
      }
      | undefined
    if (settings?.describe === undefined || settings.update === undefined) return
    const described = await settings.describe()
    const existing = readProviderMap(described)
    const providers: Record<string, object> = {}
    let changed = false
    for (const [key, provider] of Object.entries(existing)) {
      if (!isAccountModelProvider(key)) continue
      if (Array.isArray(provider['models']) && provider['models'].length > 0) {
        providers[key] = { ...provider, models: [] }
        changed = true
      }
    }
    if (changed) {
      await settings.update('llm-pi-ai', { providers })
    }
    this.catalogSynced = false
  }

  /**
   * Wipe all local credentials (`xpeach.sso.json`, `xpeach.admin`, `xpeach.key`,
   * `xpeach.session`, `xpeach.keys`, `xpeach.token`), unset environment and
   * credential-service entries, cancel running agent tasks, clear `xpeach*`
   * model catalogs, and emit session-expired / signed-out events.
   *
   * @param reason - why local credentials are being revoked.
   * @param options - optional remote SSO revocation flags.
   */
  async revokeAllLocalCredentials(
    reason: 'revoked' | 'banned' | 'signed-out' | 'expired',
    options?: {
      readonly revokeRemote?: boolean | undefined
      readonly allDevices?: boolean | undefined
      readonly revokePeachcode?: boolean | undefined
    },
  ): Promise<void> {
    if (this.revokingPromise !== undefined) {
      await this.revokingPromise
      return
    }
    const run = (async () => {
      const snapshot = this.captureCredentialSnapshot()
      const sso = this.readSsoState()
      const hadAnyCredential = this.isBound()
      if (
        options?.revokeRemote === true
        && sso?.accessToken !== undefined
        && sso.accessToken.length > 0
      ) {
        const revokeSignal = AbortSignal.timeout(5_000)
        const ssoIssuer = await this.resolveEffectiveSsoIssuer(revokeSignal, sso.issuer).catch(() => this.currentSsoBaseURL())
        const ssoClientId = sso.clientId?.trim() || this.currentSsoClientId()
        await this.api.ssoRevokeToken(
          ssoIssuer,
          sso.accessToken,
          {
            allDevices: options.allDevices ?? false,
            revokePeachcode: options.revokePeachcode ?? false,
          },
          revokeSignal,
          sso.refreshToken,
          ssoClientId,
        ).catch(() => false)
      }

      this.assertCredentialSnapshot(snapshot)
      await this.commitRelay(snapshot, {})
      await this.getRelayState().withCurrent(snapshot.relay, async () => {

        const credentialFilenames = [
          'xpeach.key',
          'xpeach.admin',
          'xpeach.session',
          'xpeach.sso.json',
          'xpeach.keys',
          'xpeach.token',
        ]

        for (const file of [
          this.keyFile,
          this.adminKeyFile,
          this.sessionKeyFile,
          this.ssoStateFile,
          this.slotsFile(),
          this.tokenInfoFile(),
        ]) {
          if (existsSync(file)) {
            try { unlinkSync(file) } catch (_err) { /* absent */ }
          }
        }

        for (const dir of this.sharedMirrorDirs()) {
          for (const filename of credentialFilenames) {
            const target = join(dir, filename)
            if (existsSync(target)) {
              try { unlinkSync(target) } catch (_err) { /* absent */ }
            }
          }
        }

        if (reason === 'signed-out' || reason === 'banned') {
          const rootHome = this.profileRootHome()
          const stamp = new Date().toISOString() + '\n'
          try { this.writeState(this.signedOutMarker(rootHome), stamp) } catch (_err) { /* best effort */ }
          const defaultHome = join(homedir(), '.xph')
          if (this.isDefaultXphHome(rootHome)) {
            try { this.writeState(this.signedOutMarker(defaultHome), stamp) } catch (_err) { /* best effort */ }
          }
        }

        Reflect.deleteProperty(process.env, this.keyVar)
        Reflect.deleteProperty(process.env, this.apiKeyEnv)
        Reflect.deleteProperty(process.env, this.adminKeyVar)
        Reflect.deleteProperty(process.env, this.sessionKeyVar)
        this.api.setAdminKey(undefined)
        this.api.setSessionKey(undefined)
        this.writeState(this.seededMarker(), '')
        this.lastSsoVerifyAt = 0
        this.lastEnsureTokenInfoAt = 0
        this.usageCache = undefined

        await this.revokeCredentialUnderLock(snapshot)
        await this.clearModelCatalogFromSettings().catch(() => {})
        this.cancelRunningAccountTasks()

        const emitEvent = this.ctx.emit.bind(this.ctx) as (name: string, ...args: unknown[]) => void
        if (hadAnyCredential && (reason === 'revoked' || reason === 'banned' || reason === 'expired')) {
          try { emitEvent('deepseek-account/session-expired') } catch (_err) { /* contained */ }
        }
        try { emitEvent('deepseek-account/signed-out') } catch (_err) { /* contained */ }
        this.notifyKeyChanged()
        this.deepseekAccountBridge?.onLocalCredentialsRevoked(reason)
      })
    })().finally(() => {
      this.revokingPromise = undefined
    })
    this.revokingPromise = run
    await run
  }

  /**
   * Verify the active SSO session (or PeachCode access token / relay key) against
   * the authoritative upstream endpoint; if the user has been banned or their
   * token revoked (`401`/`403`), immediately trigger `revokeAllLocalCredentials`.
   *
   * @param force - bypass the 5-second verification cache.
   * @param signal - optional cancellation signal.
   * @returns current SSO session validity and identity summary.
   */
  async verifyAndSyncSsoSession(force = false, signal?: AbortSignal): Promise<XPeachSsoSessionStatus> {
    const relay = this.getRelayState().read()
    if (relay.revision > 0 && relay.key === undefined) return { valid: false, status: 'unbound' }
    if (!this.isBound()) {
      return { valid: false, status: 'unbound' }
    }
    const initialSso = this.readSsoState()
    const initialBoundAtMs = typeof initialSso?.boundAt === 'number'
      ? initialSso.boundAt
      : typeof initialSso?.boundAt === 'string'
        ? Date.parse(initialSso.boundAt)
        : Number.NaN
    const initialLocallyExpired = typeof initialSso?.expiresIn === 'number'
      && initialSso.expiresIn > 0
      && Number.isFinite(initialBoundAtMs)
      && (initialBoundAtMs + initialSso.expiresIn * 1000 <= Date.now())

    if (!force && !initialLocallyExpired && Date.now() - this.lastSsoVerifyAt < 5_000) {
      return {
        valid: true,
        status: 'ok',
        ...(initialSso?.user?.username ? { username: initialSso.user.username } : {}),
        ...(initialSso?.user?.email ? { email: initialSso.user.email } : {}),
      }
    }
    if (this.ssoVerifyPromise !== undefined) {
      return await raceWithAbortSignal(this.ssoVerifyPromise, signal)
    }
    if (signal?.aborted) {
      signal.throwIfAborted()
    }
    const internalController = new AbortController()
    const verifyTimeoutMs = Math.min(this.timeoutMs || 15_000, 8_000)
    const internalTimer = setTimeout(() => {
      internalController.abort(new DOMException('SSO verification timed out', 'TimeoutError'))
    }, verifyTimeoutMs)
    internalTimer.unref()
    const effectiveSignal = internalController.signal
    const run = (async (): Promise<XPeachSsoSessionStatus> => {
      const snapshot = this.captureCredentialSnapshot()
      const sso = this.readSsoState()
      const boundAtMs = typeof sso?.boundAt === 'number'
        ? sso.boundAt
        : typeof sso?.boundAt === 'string'
          ? Date.parse(sso.boundAt)
          : Number.NaN
      const isLocallyExpired = typeof sso?.expiresIn === 'number'
        && sso.expiresIn > 0
        && Number.isFinite(boundAtMs)
        && (boundAtMs + sso.expiresIn * 1000 <= Date.now())

      if (sso?.accessToken !== undefined && sso.accessToken.length > 0) {
        const testedAccessToken = sso.accessToken
        const testedRefreshToken = sso.refreshToken
        const ssoIssuer = await this.resolveEffectiveSsoIssuer(effectiveSignal, sso.issuer).catch(() => this.currentSsoBaseURL())
        const ssoClientId = sso.clientId?.trim() || this.currentSsoClientId()
        let sync: XPeachSsoCredentialSyncResult
        try {
          sync = await this.api.ssoPeachcodeCredentials(
            ssoIssuer,
            testedAccessToken,
            effectiveSignal,
            testedRefreshToken,
            ssoClientId,
          )
        } catch (err) {
          this.assertCredentialSnapshot(snapshot)
          sync = {
            status: 'transient_error',
            transient: true,
            message: err instanceof Error ? err.message : String(err),
          }
        }
        this.assertCredentialSnapshot(snapshot)
        const rawSyncStatus = sync.status as string
        if (sync.status === 'revoked' || rawSyncStatus === 'banned') {
          const syncMessage = 'message' in sync && typeof sync.message === 'string'
            ? sync.message
            : 'SSO session expired or revoked'
          const latestSso = this.readSsoState()
          const rotatedOnDisk = latestSso !== undefined
            && typeof latestSso.accessToken === 'string'
            && latestSso.accessToken.length > 0
            && (
              latestSso.accessToken !== testedAccessToken
              || (
                typeof latestSso.refreshToken === 'string'
                && latestSso.refreshToken.length > 0
                && latestSso.refreshToken !== testedRefreshToken
              )
            )
          if (rotatedOnDisk) {
            this.lastSsoVerifyAt = Date.now()
            const username = latestSso.user?.username ?? undefined
            const email = latestSso.user?.email ?? undefined
            return {
              valid: true,
              status: 'ok',
              ...(username ? { username } : {}),
              ...(email ? { email } : {}),
            }
          }
          const isBanned = rawSyncStatus === 'banned'
            || ('code' in sync && sync.code === 403)
          await this.revokeAllLocalCredentials(isBanned ? 'banned' : 'revoked')
          return {
            valid: false,
            status: 'revoked',
            revoked: true,
            error: syncMessage,
            message: syncMessage,
          }
        }
        if (sync.status === 'transient_error') {
          if (isLocallyExpired && !testedRefreshToken) {
            await this.revokeAllLocalCredentials('expired')
            return {
              valid: false,
              status: 'revoked',
              revoked: true,
              error: 'SSO session expired',
              message: 'SSO session expired',
            }
          }
          return {
            valid: true,
            status: 'transient_error',
            transient: true,
            error: sync.message,
            message: sync.message,
          }
        }
        this.lastSsoVerifyAt = Date.now()
        const peach = sync.payload.peachcode
        const refreshedSso = sync.payload.sso
        const nextSsoToken = refreshedSso?.accessToken ?? testedAccessToken
        const nextRefreshToken = refreshedSso?.refreshToken ?? testedRefreshToken
        const nextIdToken = refreshedSso?.idToken ?? sso.idToken
        const nextExpiresIn = refreshedSso?.expiresIn ?? sso.expiresIn
        const nextIssuer = refreshedSso?.issuer ?? sso.issuer ?? ssoIssuer
        const nextClientId = refreshedSso?.clientId ?? sso.clientId ?? ssoClientId
        const nextUser = refreshedSso?.user ?? sso.user
        const nextPeachcodeUserId = peach?.userId ?? sso.peachcodeUserId
        const ssoChanged = nextSsoToken !== testedAccessToken
          || nextRefreshToken !== testedRefreshToken
          || nextIdToken !== sso.idToken
          || nextExpiresIn !== sso.expiresIn
          || nextIssuer !== sso.issuer
          || nextClientId !== sso.clientId
          || nextPeachcodeUserId !== sso.peachcodeUserId
          || !deepEqualJson(nextUser ?? null, sso.user ?? null)
        if (nextSsoToken.length > 0 && ssoChanged) {
          const rotatedTokens = nextSsoToken !== testedAccessToken || nextRefreshToken !== testedRefreshToken
          const ssoContent = JSON.stringify({
            accessToken: nextSsoToken,
            ...(nextRefreshToken ? { refreshToken: nextRefreshToken } : {}),
            ...(nextIdToken ? { idToken: nextIdToken } : {}),
            expiresIn: nextExpiresIn,
            ...(nextIssuer ? { issuer: nextIssuer } : {}),
            ...(nextClientId ? { clientId: nextClientId } : {}),
            user: nextUser,
            peachcodeUserId: nextPeachcodeUserId,
            boundAt: refreshedSso?.accessToken !== undefined && refreshedSso.accessToken !== testedAccessToken
              ? Date.now()
              : (sso.boundAt ?? Date.now()),
          }, null, 2) + '\n'
          try {
            this.writeState(this.ssoStateFile, ssoContent)
          } catch (persistErr) {
            const detail = persistErr instanceof Error ? persistErr.message : String(persistErr)
            console.error('[xpeach] 持久化已轮换的 SSO 会话状态失败：', detail)
            if (rotatedTokens) {
              throw new RemoteError(
                'xpeach/request-failed',
                `xpeach: failed to persist rotated SSO tokens to ${this.ssoStateFile}: ${detail}`,
                { status: 0, message: `sso-persist-failed: ${detail}` },
              )
            }
          }
          try {
            this.mirrorCredentialFile('xpeach.sso.json', ssoContent)
          } catch (mirrorErr) {
            console.error(
              '[xpeach] 镜像 SSO 会话状态失败：',
              mirrorErr instanceof Error ? mirrorErr.message : String(mirrorErr),
            )
          }
        }
        if (typeof peach?.baseUrl === 'string' && peach.baseUrl.trim().length > 0) {
          const normalizedBase = validateSsoBaseUrl(peach.baseUrl)
          if (normalizedBase !== this.activeBaseURL) {
            this.activeBaseURL = normalizedBase
            ;(this.api as { setBaseURL?: (url: string) => void }).setBaseURL?.(normalizedBase)
            void this.applyProviderBase().catch(() => {})
          }
        }
        const nextAccessToken = peach?.accessToken?.trim()
        if (nextAccessToken !== undefined && nextAccessToken.length > 0 && nextAccessToken !== this.resolveAdmin()) {
          this.persistAdmin(nextAccessToken)
        }
        const bridgeGroups = Array.isArray(peach?.tokenGroups)
          ? peach.tokenGroups.filter((g): g is string => typeof g === 'string' && g.trim().length > 0).map(g => g.trim())
          : typeof peach?.group === 'string' && peach.group.trim().length > 0
            ? peach.group.split(',').map(g => g.trim()).filter(g => g.length > 0)
            : []
        let keyChanged = false
        const rawNextKey = peach?.apiKey?.trim()
        const nextApiKey = rawNextKey !== undefined && rawNextKey.length > 0
          ? (rawNextKey.match(/^(?:xpk|sk)-/u) === null ? 'sk-' + rawNextKey : rawNextKey)
          : undefined
        const currentKey = this.readKeyFile()
        if (nextApiKey !== undefined && nextApiKey !== currentKey) {
          // Key and token record move as one credential: never carry the
          // previous token's id/name/groups over a different key — that stale
          // identity is what let group edits land on the wrong site token.
          await this.persistRelayCredential(nextApiKey, {
            ...(peach?.tokenId !== undefined ? { id: peach.tokenId } : {}),
            ...(peach?.tokenName !== undefined ? { name: peach.tokenName } : {}),
            ...(bridgeGroups.length > 0 ? { groups: bridgeGroups } : {}),
            key: nextApiKey,
          }, snapshot)
          this.notifyKeyChanged()
          keyChanged = true
        } else if (
          nextApiKey === undefined
          && currentKey === undefined
          && this.resolveAdmin() !== undefined
        ) {
          const minted = await this.mintKeyWithAccessToken(effectiveSignal).catch(() => ({ ok: false }))
          if (minted.ok) {
            this.notifyKeyChanged()
            keyChanged = true
          }
        }
        if ((nextApiKey === undefined || nextApiKey === currentKey)
          && (peach?.tokenId !== undefined || peach?.tokenName !== undefined || bridgeGroups.length > 0)) {
          // Same-key refresh: bridge fields update the record bound to THIS
          // key. Fields the bridge omits are inherited only from a record that
          // is already key-bound; an unbound record's id/name stay dropped.
          const prevInfo = this.readTokenInfo()
          const sameRecord = this.tokenInfoMatchesKey(prevInfo, currentKey)
          const applyBridgeGroups = bridgeGroups.length > 0 && (
            !sameRecord
            || (peach?.tokenId !== undefined && peach.tokenId !== prevInfo.id)
            || !Array.isArray(prevInfo.groups)
            || prevInfo.groups.length === 0
          )
          const nextInfo: { id?: number; name?: string; groups?: string[]; key?: string } = {
            ...(sameRecord && prevInfo.id !== undefined ? { id: prevInfo.id } : {}),
            ...(sameRecord && prevInfo.name !== undefined ? { name: prevInfo.name } : {}),
            ...(sameRecord && Array.isArray(prevInfo.groups) && prevInfo.groups.length > 0 ? { groups: prevInfo.groups } : {}),
            ...(peach?.tokenId !== undefined ? { id: peach.tokenId } : {}),
            ...(peach?.tokenName !== undefined ? { name: peach.tokenName } : {}),
            ...(applyBridgeGroups ? { groups: bridgeGroups } : {}),
            ...(currentKey !== undefined ? { key: currentKey } : {}),
          }
          if (!deepEqualJson(prevInfo, nextInfo)) {
            await this.writeTokenInfo(nextInfo, snapshot)
          }
        }
        if (keyChanged || !this.catalogSynced) {
          void this.syncModelCatalog(effectiveSignal).catch(() => {})
        }
        const username = peach?.username ?? sync.payload.sso?.user?.username ?? sso.user?.username ?? undefined
        const email = sync.payload.sso?.user?.email ?? sso.user?.email ?? undefined
        return {
          valid: true,
          status: 'ok',
          ...(username !== undefined ? { username } : {}),
          ...(email !== undefined ? { email } : {}),
        }
      }

      if (isLocallyExpired) {
        await this.revokeAllLocalCredentials('expired')
        return {
          valid: false,
          status: 'revoked',
          revoked: true,
          error: 'SSO session expired',
          message: 'SSO session expired',
        }
      }

      if (this.resolveAdmin() !== undefined) {
        try {
          const me = await this.api.userSelf(effectiveSignal)
          this.assertCredentialSnapshot(snapshot)
          if (me.status !== undefined && me.status !== 1) {
            await this.revokeAllLocalCredentials('banned')
            return {
              valid: false,
              status: 'revoked',
              revoked: true,
              error: 'Account has been disabled',
              message: 'Account has been disabled',
            }
          }
          if ((this.readKeyFile()) === undefined) {
            const minted = await this.mintKeyWithAccessToken(effectiveSignal).catch(() => ({ ok: false }))
            if (minted.ok) {
              this.notifyKeyChanged()
            }
          }
          this.lastSsoVerifyAt = Date.now()
          return {
            valid: true,
            status: 'ok',
            username: me.username,
            email: me.email,
          }
        } catch (err) {
          this.assertCredentialSnapshot(snapshot)
          if (err instanceof RemoteError && (err.details as { status?: number } | undefined)?.status !== undefined) {
            const st = (err.details as { status?: number }).status
            if (st === 401 || st === 403) {
              await this.revokeAllLocalCredentials(st === 403 ? 'banned' : 'revoked')
              return {
                valid: false,
                status: 'revoked',
                revoked: true,
                error: err.message,
                message: err.message,
              }
            }
          }
          return { valid: true, status: 'transient_error', transient: true }
        }
      }

      if (this.readKeyFile() !== undefined) {
        try {
          await this.api.tokenUsage(effectiveSignal)
          this.assertCredentialSnapshot(snapshot)
          this.lastSsoVerifyAt = Date.now()
          return { valid: true, status: 'ok' }
        } catch (err) {
          this.assertCredentialSnapshot(snapshot)
          if (err instanceof RemoteError && (err.details as { status?: number } | undefined)?.status !== undefined) {
            const st = (err.details as { status?: number }).status
            if (st === 401 || st === 403) {
              await this.revokeAllLocalCredentials(st === 403 ? 'banned' : 'revoked')
              return {
                valid: false,
                status: 'revoked',
                revoked: true,
                error: err.message,
                message: err.message,
              }
            }
          }
          return { valid: true, status: 'transient_error', transient: true }
        }
      }

      return { valid: false, status: 'unbound' }
    })().finally(() => {
      clearTimeout(internalTimer)
      this.ssoVerifyPromise = undefined
    })
    this.ssoVerifyPromise = run
    void run.catch(() => {})
    return await raceWithAbortSignal(run, signal)
  }

  private async *guardLlmStream(
    options: { readonly provider?: string; readonly signal?: AbortSignal },
    next: (opts?: unknown) => AsyncGenerator<Record<string, unknown>, void, unknown>,
  ): AsyncGenerator<Record<string, unknown>, void, unknown> {
    const provider = options.provider ?? ''
    if (!isAccountModelProvider(provider)) {
      yield* next(options)
      return
    }
    let check: XPeachSsoSessionStatus
    try {
      await this.relayReady
      check = await this.verifyAndSyncSsoSession(false, options.signal)
      await this.assertPublishedCredential(this.captureCredentialSnapshot())
    } catch (error) {
      if (!(error instanceof RelayStateError)) throw error
      yield { type: 'finish', reason: { kind: 'error', failure: { message: error.message, code: 'MISSING_CREDENTIAL' } } }
      return
    }
    if (!check.valid || check.status === 'revoked' || !this.isBound()) {
      const emitEvent = this.ctx.emit.bind(this.ctx) as (name: string) => void
      try { emitEvent('deepseek-account/model-sign-in-required') } catch (_err) { /* contained */ }
      try { emitEvent('deepseek-account/session-expired') } catch (_err) { /* contained */ }
      yield {
        type: 'finish',
        reason: {
          kind: 'error',
          failure: {
            message: check.message ?? '您的 XPeach 账号未登录或已被停用，请先完成 SSO 登录授权。',
            code: 'ACCOUNT_SIGN_IN_REQUIRED',
          },
        },
      }
      return
    }
    const effectiveOptions = this.gatewayInspector !== undefined
      ? this.gatewayInspector.interceptAndCaptureStream(options)
      : options
    for await (const chunk of next(effectiveOptions)) {
      if (chunk['type'] === 'finish') {
        const reason = chunk['reason'] as
          | { kind?: string; failure?: { code?: string; message?: string } }
          | string
          | null
          | undefined
        if (typeof reason === 'object' && reason !== null && reason.kind === 'error') {
          const code = reason.failure?.code
          const msg = reason.failure?.message ?? ''
          if (code === 'AUTH' || /\b401\b/u.test(msg)) {
            void this.handleAuthRejected(401)
          }
        } else if (reason === 'error') {
          const errObj = chunk['error'] as { status?: number; code?: string; message?: string } | undefined
          if (errObj?.status === 401 || errObj?.code === 'AUTH') {
            void this.handleAuthRejected(401)
          }
        }
      }
      yield chunk
    }
  }

  /**
   * Verify the active SSO session and local credentials on demand.
   *
   * @param request - optional `force` flag to bypass cache TTL.
   * @param signal - carrier cancellation.
   * @returns current SSO session status.
   */
  @Remote('ssoSessionVerify')
  async ssoSessionVerifyOp(
    request: { readonly force?: boolean | undefined },
    signal: AbortSignal,
  ): Promise<XPeachSsoSessionStatus> {
    signal.throwIfAborted()
    return await this.verifyAndSyncSsoSession(request.force === true, signal)
  }

  /**
   * Self-revoke the active SSO session via RFC 7009 (`@xpeach/ts-xpeach`)
   * and wipe all local credentials.
   *
   * @param request - optional `allDevices` and `revokePeachcode` flags.
   * @param signal - carrier cancellation.
   * @returns post-logout bound state (`{ bound: false }`).
   */
  @Remote('ssoLogout')
  async ssoLogoutOp(
    request: XPeachSsoRevokeRequest,
    signal: AbortSignal,
  ): Promise<XPeachBindResult> {
    signal.throwIfAborted()
    await this.revokeAllLocalCredentials('signed-out', {
      revokeRemote: true,
      allDevices: request.allDevices ?? false,
      revokePeachcode: request.revokePeachcode ?? false,
    })
    return { bound: false }
  }

  private async openUrlInSystemBrowser(rawUrl: string, expectedSsoBaseURL?: string): Promise<boolean> {
    const safeUrl = validateVerificationUrl(rawUrl, expectedSsoBaseURL ?? this.currentSsoBaseURL())
    if (/[\s\u0000-\u0008\u000e-\u001f\u007f]/u.test(safeUrl)) {
      throw new Error('xpeach: verification URL contains whitespace or control characters')
    }
    if (process.env.VITEST !== undefined || process.env.NODE_ENV === 'test') return false
    try {
      const { spawn } = await import('node:child_process')
      const env = scrubbedBrowserEnv()
      const child = process.platform === 'win32'
        ? spawn('rundll32.exe', ['url.dll,FileProtocolHandler', safeUrl], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
          env,
        })
        : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [safeUrl], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
          env,
        })
      return await new Promise<boolean>((resolvePromise) => {
        let settled = false
        const finish = (ok: boolean): void => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          child.unref()
          resolvePromise(ok)
        }
        child.once('error', () => { finish(false) })
        child.once('exit', (code) => { finish(code === 0 || code === null) })
        const timer = setTimeout(() => { finish(true) }, 150)
        timer.unref()
      })
    } catch (_err) {
      return false
    }
  }

  private async applySsoBridgePayload(
    payload: XPeachSsoBridgePayload,
    signal: AbortSignal,
    snapshot = this.captureCredentialSnapshot(),
  ): Promise<XPeachSsoDevicePollResult> {
    this.assertCredentialSnapshot(snapshot)
    const peach = payload.peachcode
    const sso = payload.sso
    const username = peach?.username ?? sso?.user?.username ?? sso?.user?.name ?? undefined
    const email = sso?.user?.email ?? undefined

    const normalizedBase = typeof peach?.baseUrl === 'string' && peach.baseUrl.trim().length > 0
      ? validateSsoBaseUrl(peach.baseUrl)
      : undefined
    const effectiveBaseURL = normalizedBase ?? (this.activeBaseURL || this.api.siteBaseURL)
    const accessToken = peach?.accessToken?.trim()

    let apiKey = peach?.apiKey?.trim()
    let preview: string | undefined
    if (apiKey !== undefined && apiKey.length > 0) {
      if (apiKey.match(/^(?:xpk|sk)-/u) === null) apiKey = 'sk-' + apiKey
      const bridgeGroups = Array.isArray(peach?.tokenGroups)
        ? peach.tokenGroups.filter((g): g is string => typeof g === 'string' && g.trim().length > 0).map(g => g.trim())
        : typeof peach?.group === 'string' && peach.group.trim().length > 0
          ? peach.group.split(',').map(g => g.trim()).filter(g => g.length > 0)
          : []
      await this.persistRelayCredential(apiKey, {
        ...(peach?.tokenId !== undefined ? { id: peach.tokenId } : {}),
        ...(peach?.tokenName !== undefined ? { name: peach.tokenName } : {}),
        ...(bridgeGroups.length > 0 ? { groups: bridgeGroups } : {}),
        key: apiKey,
      }, snapshot, signal)
      preview = apiKey.slice(0, 5) + '…' + apiKey.slice(-4)
    } else if (accessToken !== undefined && accessToken.length > 0) {
      const candidateApi = new XPeachApi({
        baseURL: effectiveBaseURL,
        timeoutMs: this.timeoutMs || 15_000,
        resolveKey: () => this.resolveKey(),
        resolveAdmin: () => accessToken,
        resolveCookie: () => undefined,
      })
      const minted = await this.mintRelayToken(signal, 'admin', candidateApi, snapshot)
      if (!minted.ok) {
        const detail = typeof minted.err === 'string' && minted.err.trim().length > 0
          ? `（${minted.err.trim()}）`
          : ''
        return {
          status: 'error',
          bound: false,
          message: `SSO 已授权，但未能获取或铸造可用的 API 密钥 (XPEACH_RELAY_KEY)${detail}，请重试。`,
        }
      }
      preview = minted.preview
    }

    const boundRelayKey = this.readKeyFile()
    if (boundRelayKey === undefined || boundRelayKey.length === 0) {
      return {
        status: 'error',
        bound: false,
        message: 'SSO 已授权，但未能获取或铸造可用的 API 密钥 (XPEACH_RELAY_KEY)，请重试。',
      }
    }

    if (normalizedBase !== undefined && normalizedBase !== this.activeBaseURL) {
      this.activeBaseURL = normalizedBase
      ;(this.api as { setBaseURL?: (url: string) => void }).setBaseURL?.(normalizedBase)
      void this.applyProviderBase().catch(() => {})
    }

    if (sso?.accessToken !== undefined && sso.accessToken.length > 0) {
      try {
        const ssoContent = JSON.stringify({
          accessToken: sso.accessToken,
          ...(sso.refreshToken ? { refreshToken: sso.refreshToken } : {}),
          ...(sso.idToken ? { idToken: sso.idToken } : {}),
          expiresIn: sso.expiresIn,
          ...(sso.issuer ? { issuer: sso.issuer } : {}),
          ...(sso.clientId ? { clientId: sso.clientId } : {}),
          user: sso.user,
          peachcodeUserId: peach?.userId,
          boundAt: Date.now(),
        }, null, 2) + '\n'
        this.writeState(this.ssoStateFile, ssoContent)
        this.mirrorCredentialFile('xpeach.sso.json', ssoContent)
      } catch (_err) { /* best effort */ }
    }

    if (accessToken !== undefined && accessToken.length > 0) {
      this.persistAdmin(accessToken)
    }

    this.lastSsoVerifyAt = Date.now()
    this.markOnboardedAndClearSignOut()
    void this.ensureDesktopOnboardingCompleted().catch(() => {})
    const emitEvent = this.ctx.emit.bind(this.ctx) as (name: string) => void
    try { emitEvent('deepseek-account/signed-in') } catch (_err) { /* contained */ }
    this.notifyKeyChanged()
    this.deepseekAccountBridge?.notifyWatchers(true)
    await this.syncModelCatalog(signal).catch(() => {})

    return {
      status: 'approved',
      bound: true,
      ...(username !== undefined ? { username } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(preview !== undefined ? { preview } : {}),
      ...(accessToken !== undefined && accessToken.length >= 8
        ? { adminPreview: accessToken.slice(0, 4) + '…' + accessToken.slice(-4) }
        : {}),
    }
  }

  /**
   * Start a 1-click OIDC Authorization Code + PKCE S256 loopback login session
   * via `@xpeach/ts-xpeach` and bind credentials immediately upon browser approval.
   *
   * @param request - optional browser-open flag and loopback port list.
   * @param signal - carrier cancellation.
   * @returns authorization URL, redirect URI, expiry, browser-opened flag, and completion promise.
   */
  async ssoPkceLoopbackStartOp(
    request: {
      readonly openBrowser?: boolean | undefined
      readonly preferredPorts?: readonly number[] | undefined
    },
    signal: AbortSignal,
  ): Promise<{
    readonly authorizationUrl: string
    readonly redirectUri: string
    readonly expiresIn: number
    readonly browserOpened: boolean
    readonly waitForBound: () => Promise<XPeachSsoDevicePollResult>
  }> {
    signal.throwIfAborted()
    const ssoBaseURL = await this.resolveEffectiveSsoIssuer(signal)
    const clientId = this.currentSsoClientId()
    const snapshot = this.captureCredentialSnapshot()
    const pkce = await this.api.ssoPkceLoopbackStart(
      ssoBaseURL,
      clientId,
      signal,
      request.preferredPorts,
      { allowClientFallback: !this.hasExplicitCustomSsoClientId() },
    )
    const browserOpened = request.openBrowser !== false
      ? await this.openUrlInSystemBrowser(pkce.authorizationUrl, ssoBaseURL)
      : false
    return {
      authorizationUrl: pkce.authorizationUrl,
      redirectUri: pkce.redirectUri,
      expiresIn: pkce.expiresIn,
      browserOpened,
      waitForBound: async () => {
        const payload = await pkce.waitForApproval()
        return await this.applySsoBridgePayload(payload, signal, snapshot)
      },
    }
  }

  private ssoBrowserAttempts?: Map<string, {
    readonly controller: AbortController
    readonly expiresAt: number
    outcome?: XPeachSsoDevicePollResult | undefined
  }>

  /**
   * Start a non-blocking 1-click XPeach SSO browser sign-in: prefers OAuth 2.0
   * + PKCE S256 local loopback (`127.0.0.1`) so the user approves once in the
   * browser with zero code or token copy-paste, falling back to RFC 8628 Device
   * Authorization only when local loopback cannot bind.
   *
   * @param request - optional `openBrowser` and `clientName` options.
   * @param signal - carrier cancellation.
   * @returns non-blocking sign-in attempt descriptor for immediate UI feedback.
   */
  @Remote('ssoBrowserStart')
  async ssoBrowserStartOp(
    request: XPeachSsoBrowserStartRequest,
    signal: AbortSignal,
  ): Promise<XPeachSsoBrowserStartResult> {
    signal.throwIfAborted()
    const attempts = (this.ssoBrowserAttempts ??= new Map())
    for (const [oldId, prev] of attempts.entries()) {
      if (prev.outcome === undefined) prev.controller.abort()
      attempts.delete(oldId)
    }

    const attemptId = randomUUID()
    const attemptController = new AbortController()

    if (process.env.XPEACH_SSO_LOGIN_MODE !== 'device') {
      try {
        const pkce = await this.ssoPkceLoopbackStartOp(
          { openBrowser: request.openBrowser ?? true },
          attemptController.signal,
        )
        const expiresIn = pkce.expiresIn || 300
        const record: {
          readonly controller: AbortController
          readonly expiresAt: number
          outcome?: XPeachSsoDevicePollResult | undefined
        } = {
          controller: attemptController,
          expiresAt: Date.now() + expiresIn * 1000,
        }
        attempts.set(attemptId, record)
        void pkce.waitForBound().then((outcome) => {
          if (attemptController.signal.aborted) return
          record.outcome = outcome
        }).catch((err: unknown) => {
          if (attemptController.signal.aborted) return
          const msg = err instanceof Error ? err.message : String(err)
          const isExpired = msg.includes('超时') || msg === 'expired_token'
          record.outcome = {
            status: isExpired ? 'expired' : 'error',
            message: msg,
          }
        })
        return {
          attemptId,
          mode: 'pkce',
          authorizationUrl: pkce.authorizationUrl,
          expiresIn,
          interval: 1,
          browserOpened: pkce.browserOpened,
        }
      } catch (_pkceFallbackErr) {
        attemptController.abort()
        if (signal.aborted) throw _pkceFallbackErr
      }
    }

    const deviceStarted = await this.ssoDeviceStartOp(
      {
        openBrowser: request.openBrowser ?? true,
        ...(request.clientName !== undefined ? { clientName: request.clientName } : {}),
      },
      signal,
    )
    return {
      attemptId,
      mode: 'device',
      authorizationUrl: deviceStarted.verificationUriComplete,
      expiresIn: deviceStarted.expiresIn,
      interval: deviceStarted.interval,
      browserOpened: deviceStarted.browserOpened,
      deviceCode: deviceStarted.deviceCode,
      userCode: deviceStarted.userCode,
    }
  }

  /**
   * Poll an active non-blocking XPeach SSO browser sign-in attempt started via
   * `ssoBrowserStart`.
   *
   * @param request - attempt identifier and optional fallback device code.
   * @param signal - carrier cancellation.
   * @returns current authorization status and bound user summary.
   */
  @Remote('ssoBrowserPoll')
  async ssoBrowserPollOp(
    request: XPeachSsoBrowserPollRequest,
    signal: AbortSignal,
  ): Promise<XPeachSsoDevicePollResult> {
    signal.throwIfAborted()
    if (typeof request.deviceCode === 'string' && request.deviceCode.trim().length > 0) {
      return await this.ssoDevicePollOp({ deviceCode: request.deviceCode }, signal)
    }
    const attempts = this.ssoBrowserAttempts
    const record = attempts?.get(request.attemptId)
    if (record === undefined) {
      return { status: 'expired', message: 'SSO 登录会话已结束或已取消' }
    }
    if (record.outcome !== undefined) {
      return record.outcome
    }
    if (Date.now() >= record.expiresAt) {
      record.controller.abort()
      const expired: XPeachSsoDevicePollResult = { status: 'expired', message: 'SSO 浏览器授权已超时，请重新发起登录' }
      record.outcome = expired
      return expired
    }
    return { status: 'pending' }
  }

  /**
   * Cancel an in-flight XPeach SSO browser sign-in attempt and close its local
   * loopback callback listener immediately.
   *
   * @param request - attempt identifier to cancel.
   * @returns confirmation flag.
   */
  @Remote('ssoBrowserCancel')
  ssoBrowserCancelOp(request: XPeachSsoBrowserCancelRequest): { cancelled: boolean } {
    const record = this.ssoBrowserAttempts?.get(request.attemptId)
    if (record !== undefined) {
      record.controller.abort()
      this.ssoBrowserAttempts?.delete(request.attemptId)
      return { cancelled: true }
    }
    return { cancelled: false }
  }

  private ssoDeviceSessionMeta?: Map<string, { readonly issuer: string; readonly clientId: string }>

  /**
   * Start an XPeach SSO Device Authorization session and optionally launch the
   * verification URL in the user's default system browser.
   *
   * @param request - optional browser-open flag and client display name.
   * @param signal - carrier cancellation.
   * @returns device code, 8-char user code, verification URLs, and polling interval.
   */
  @Remote('ssoDeviceStart')
  async ssoDeviceStartOp(
    request: XPeachSsoDeviceStartRequest,
    signal: AbortSignal,
  ): Promise<XPeachSsoDeviceStartResult> {
    signal.throwIfAborted()
    const ssoBaseURL = await this.resolveEffectiveSsoIssuer(signal)
    const clientId = this.currentSsoClientId()
    const clientName = request.clientName?.trim() || `XPeach Harness (${process.platform})`
    const started = await this.api.ssoDeviceAuthorize(
      ssoBaseURL,
      clientId,
      clientName,
      signal,
      !this.hasExplicitCustomSsoClientId(),
    )
    const effectiveIssuer = started.issuer ?? ssoBaseURL
    const effectiveClientId = started.clientId ?? clientId
    const metaMap = (this.ssoDeviceSessionMeta ??= new Map())
    if (metaMap.size >= 32) {
      const oldest = metaMap.keys().next().value
      if (oldest !== undefined) metaMap.delete(oldest)
    }
    metaMap.set(started.deviceCode, { issuer: effectiveIssuer, clientId: effectiveClientId })
    const verificationUri = validateVerificationUrl(started.verificationUri, effectiveIssuer)
    const verificationUriComplete = validateVerificationUrl(started.verificationUriComplete, effectiveIssuer)
    const browserOpened = request.openBrowser !== false
      ? await this.openUrlInSystemBrowser(verificationUriComplete, effectiveIssuer)
      : false
    return {
      ...started,
      verificationUri,
      verificationUriComplete,
      browserOpened,
    }
  }

  private ssoDevicePollInFlight?: Map<string, Promise<XPeachSsoDevicePollResult>>
  private ssoDeviceApprovedCache?: Map<string, XPeachSsoDevicePollResult>

  /**
   * Poll an active XPeach SSO Device Authorization session once; when approved,
   * automatically bind the bridged PeachCode access token and `sk-` relay key.
   *
   * @param request - device code returned by `ssoDeviceStart`.
   * @param signal - carrier cancellation.
   * @returns current device authorization status and bound credential summary.
   */
  @Remote('ssoDevicePoll')
  async ssoDevicePollOp(
    request: XPeachSsoDevicePollRequest,
    signal: AbortSignal,
  ): Promise<XPeachSsoDevicePollResult> {
    signal.throwIfAborted()
    const deviceCode = request.deviceCode.trim()
    if (deviceCode.length === 0) {
      return { status: 'error', message: 'missing deviceCode' }
    }
    const approvedCache = (this.ssoDeviceApprovedCache ??= new Map())
    const inFlightMap = (this.ssoDevicePollInFlight ??= new Map())
    const cachedApproved = approvedCache.get(deviceCode)
    if (cachedApproved !== undefined) {
      return cachedApproved
    }
    const inFlight = inFlightMap.get(deviceCode)
    if (inFlight !== undefined) {
      return await raceWithAbortSignal(inFlight, signal)
    }
    const internalTimeout = createInternalTimeoutController(
      Math.max((this.timeoutMs || 15_000) * 2, 30_000),
      'SSO device poll timed out',
    )
    const effectiveSignal = internalTimeout.signal
    const run = (async (): Promise<XPeachSsoDevicePollResult> => {
      const snapshot = this.captureCredentialSnapshot()
      const meta = this.ssoDeviceSessionMeta?.get(deviceCode)
      const pollIssuer = meta?.issuer ?? await this.resolveEffectiveSsoIssuer(effectiveSignal)
      const pollClientId = meta?.clientId ?? this.currentSsoClientId()
      const polled = await this.api.ssoDeviceToken(
        pollIssuer,
        pollClientId,
        deviceCode,
        effectiveSignal,
      )
      this.assertCredentialSnapshot(snapshot)
      if (polled.status === 'slow_down') {
        return {
          status: 'pending',
          message: 'slow_down',
        }
      }
      if (polled.status !== 'approved' || polled.payload === undefined) {
        if (polled.status === 'expired' || polled.status === 'denied') {
          this.ssoDeviceSessionMeta?.delete(deviceCode)
        }
        return {
          status: polled.status,
          ...(polled.message !== undefined ? { message: polled.message } : {}),
        }
      }
      const applied = await this.applySsoBridgePayload(polled.payload, effectiveSignal, snapshot)
      if (applied.status === 'approved' && applied.bound === true) {
        this.ssoDeviceSessionMeta?.delete(deviceCode)
        if (approvedCache.size >= 32) {
          const oldestKey = approvedCache.keys().next().value
          if (oldestKey !== undefined) approvedCache.delete(oldestKey)
        }
        approvedCache.set(deviceCode, applied)
      }
      return applied
    })().finally(() => {
      internalTimeout.clear()
      if (inFlightMap.get(deviceCode) === run) inFlightMap.delete(deviceCode)
    })
    inFlightMap.set(deviceCode, run)
    void run.catch(() => {})
    return await raceWithAbortSignal(run, signal)
  }

  /**
   * Fetch the unified human-verification policy centrally governed by XPeach SSO.
   *
   * @param signal - request cancellation signal.
   * @returns normalized SSO captcha policy (including self-hosted Cap config).
   */
  @Remote('ssoCaptchaPolicy')
  async ssoCaptchaPolicyOp(signal: AbortSignal): Promise<XPeachSsoCaptchaPolicy> {
    return await this.api.ssoCaptchaPolicy(this.currentSsoBaseURL(), signal)
  }

  /**
   * Fetch a scene-scoped human-verification challenge from XPeach SSO.
   *
   * @param request - target captcha scene governed by SSO.
   * @param signal - request cancellation signal.
   * @returns scene-scoped challenge configuration from XPeach SSO.
   */
  @Remote('ssoCaptchaChallenge')
  async ssoCaptchaChallengeOp(
    request: XPeachSsoCaptchaChallengeRequest,
    signal: AbortSignal,
  ): Promise<XPeachSsoCaptchaChallenge> {
    return await this.api.ssoCaptchaChallenge(this.currentSsoBaseURL(), request.scene, signal)
  }

  /**
   * Launch interactive browser sign-in strictly through XPeach SSO (1-click PKCE S256
   * loopback with RFC 8628 Device Authorization fallback) so all human verification
   * (including self-hosted Cap) is enforced centrally by SSO without bypassing to legacy
   * main-site cookie scraping.
   *
   * @param signal - carrier cancellation.
   * @returns bound status, username, and relay key minting status.
   */
  @Remote('sessionLogin')
  async sessionLoginOp(signal: AbortSignal): Promise<{ bound: boolean; as?: string; minted?: boolean; mintErr?: string }> {
    if (process.env.XPEACH_SSO_LOGIN_MODE !== 'device') {
      try {
        const pkce = await this.ssoPkceLoopbackStartOp({ openBrowser: true }, signal)
        const outcome = await pkce.waitForBound()
        if (outcome.status === 'approved' && outcome.bound === true) {
          return {
            bound: true,
            ...(outcome.username !== undefined ? { as: outcome.username } : {}),
            minted: true,
          }
        }
      } catch (_pkceErr) {
        if (signal.aborted) throw _pkceErr
      }
    }

    let started: XPeachSsoDeviceStartResult | undefined
    try {
      started = await this.ssoDeviceStartOp({ openBrowser: true }, signal)
    } catch (cause) {
      if (signal.aborted) throw cause
      started = undefined
    }
    if (started !== undefined) {
      let intervalMs = Math.max(1500, (started.interval || 2) * 1000)
      const deadline = Date.now() + Math.min((started.expiresIn || 600) * 1000, 180_000)
      while (Date.now() < deadline) {
        await sleepWithAbort(intervalMs, signal)
        const polled = await this.ssoDevicePollOp({ deviceCode: started.deviceCode }, signal)
        if ((polled.status as string) === 'slow_down') {
          intervalMs += 5000
          continue
        }
        if (polled.status === 'pending') {
          if (polled.message === 'slow_down') {
            intervalMs += 5000
          }
          continue
        }
        if (polled.status === 'approved') {
          return {
            bound: true,
            ...(polled.username !== undefined ? { as: polled.username } : {}),
            minted: true,
          }
        }
        throw new RemoteError('xpeach/request-failed', polled.message ?? `SSO login ${polled.status}`, { status: 0, message: polled.message ?? polled.status })
      }
      throw new RemoteError('xpeach/request-failed', 'SSO 设备授权超时', { status: 0, message: 'sso login timed out' })
    }

    throw new RemoteError(
      'xpeach/request-failed',
      '无法连接 XPeach SSO 完成统一登录与人机验证，请检查网络或 SSO 服务地址后重试。',
      { status: 0, message: 'sso unreachable' },
    )
  }

  /** 通过控制台认证通道精确复用或新建令牌，不按名称认领。 */
  protected async mintConsoleKey(signal: AbortSignal): Promise<{ ok: boolean; err?: string }> {
    const result = await this.mintRelayToken(signal, 'console')
    if (result.ok) {
      this.notifyKeyChanged()
      await this.syncModelCatalog(signal).catch(() => {})
    }
    return result
  }

  /** 复用当前密钥已确认的令牌；无活动密钥时新建，不凭名称认领既有令牌。 */
  private async mintKeyWithAccessToken(signal: AbortSignal): Promise<{ ok: boolean; err?: string; preview?: string }> {
    const result = await this.mintRelayToken(signal, 'admin')
    if (result.ok) void this.syncModelCatalog(signal).catch(() => {})
    return result
  }

  /** 两种认证通道共用完整扫描及绑定规则；仅管理员为本次新建的令牌设置默认组。 */
  private async mintRelayToken(
    signal: AbortSignal,
    channel: 'admin' | 'console',
    apiClient: XPeachApi = this.api,
    snapshot = this.captureCredentialSnapshot(),
  ): Promise<{ ok: boolean; err?: string; preview?: string }> {
    const userOnly = channel === 'console'
    const reveal = async (id: number): Promise<{ key?: string } | undefined> =>
      await this.revealTokenKey(id, signal, snapshot, userOnly, apiClient)
    let creationRequested = false
    try {
      let id: number | undefined
      let name: string | undefined
      let defaults: string[] = []
      let created = false
      const page = await this.listTokenPages(signal, userOnly, snapshot, apiClient)
      if (page.status !== 'complete') return { ok: false, err: '令牌列表扫描未完成，未创建或修改令牌。' }
      const activeKey = this.readKeyFile()
      const normKey = this.normalizeRelayKey(activeKey)
      const enabled = page.items
        .filter(t => t.status === undefined || t.status === 1)
        .sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))
      // 既有令牌只能由当前密钥确认；名称不是创建者或用途的证据。
      let live = enabled.find(t => this.normalizeRelayKey(t.key) === normKey && normKey.length > 0)
      if (normKey.length > 0 && live === undefined) {
        const candidates = this.tokenResolveOrder(page.items).slice(0, this.resolveTokenLookupLimits().reveals)
        for (const candidate of candidates) {
          const revealed = await reveal(candidate.id)
          if (this.normalizeRelayKey(revealed?.key) === normKey) {
            live = candidate
            break
          }
        }
        if (live === undefined) return { ok: false, err: '无法确认现有密钥归属，未创建或修改令牌。' }
      }
      if (live !== undefined) {
        id = live.id
        name = live.name
      } else {
        if (!userOnly) defaults = await this.defaultGroups(signal, apiClient)
        this.assertCredentialSnapshot(snapshot)
        name = 'xph-' + randomUUID()
        creationRequested = true
        const payload = {
          name,
          group: '',
          remain_quota: 0,
          expired_time: -1,
          unlimited_quota: true,
          model_limits_enabled: false,
        }
        if (userOnly) await apiClient.userTokenCreate(payload, signal)
        else await apiClient.adminTokenCreate({ ...payload, ...this.buildTokenGroupFields(defaults) }, signal)
        this.assertCredentialSnapshot(snapshot)
        const after = await this.listTokenPages(signal, userOnly, snapshot, apiClient)
        const existingIds = new Set(page.items.map(token => token.id))
        const matches = after.items.filter(token => token.name === name && !existingIds.has(token.id))
        const hit = matches[0]
        if (after.status !== 'complete' || matches.length !== 1 || hit === undefined) {
          return { ok: false, err: '创建请求已发送，但无法唯一确认新令牌，未修改分组或绑定；请检查站点令牌列表。' }
        }
        id = hit.id
        live = hit
        created = true
      }
      const revealed = await reveal(id)
      let key = revealed?.key
      if (typeof key !== 'string' || key.length === 0) {
        return { ok: false, err: created ? '新令牌已创建，但无法确认密钥；未修改分组或绑定，请检查站点令牌列表。' : '未能确认令牌密钥，分组未修改。' }
      }
      if (normKey.length > 0 && this.normalizeRelayKey(key) !== normKey) {
        return { ok: false, err: '令牌不再持有当前密钥，分组未修改。' }
      }
      if (key.match(/^(?:xpk|sk)-/u) === null) key = 'sk-' + key
      const detail = userOnly ? live : await apiClient.adminTokenGet(id, signal)
      this.assertCredentialSnapshot(snapshot)
      const currentGroups = this.extractTokenGroups(detail)
      if (created && defaults.length > 0) {
        await this.getRelayState().withCurrent(snapshot.relay, async () => {
          const confirmed = await reveal(id)
          if (confirmed?.key === undefined || this.normalizeRelayKey(confirmed.key) !== this.normalizeRelayKey(key)) {
            throw new RemoteError('xpeach/identity-incomplete', '写入前无法确认令牌密钥，分组未修改。', { reason: 'identity-unknown' })
          }
          await apiClient.adminTokenUpdate({ ...detail, id, ...this.buildTokenGroupFields(defaults) }, signal)
          this.assertCredentialSnapshot(snapshot)
        }, signal)
      }
      const groups = created && defaults.length > 0 ? defaults : currentGroups
      await this.persistRelayCredential(key, { id, ...(name !== undefined ? { name } : {}), groups, key }, snapshot, signal)
      return { ok: true, preview: key.slice(0, 5) + '…' + key.slice(-4) }
    } catch (e) {
      if (creationRequested) {
        return { ok: false, err: '创建令牌后的绑定未完成，远端可能已有新令牌；请检查站点列表及本地凭据状态后重试。' }
      }
      return { ok: false, err: e instanceof Error ? e.message.slice(0, 120) : String(e) }
    }
  }

  /**
   * Whether the first-run onboarding already ran in this home.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns onboarding completion status.
   */
  @Remote('onboardingDone')
  onboardingDoneOp(_request: XPeachSelfRequest, signal: AbortSignal): { done: boolean } {
    signal.throwIfAborted()
    if (this.isBound()) {
      return { done: true }
    }
    return {
      done: existsSync(join(this.ownHome(), '.xpeach-onboarded'))
        || existsSync(join(this.profileRootHome(), '.xpeach-onboarded')),
    }
  }

  /**
   * Mark the first-run onboarding complete.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns updated onboarding completion status.
   */
  @Remote('onboardingComplete')
  onboardingCompleteOp(_request: XPeachSelfRequest, signal: AbortSignal): { done: boolean } {
    signal.throwIfAborted()
    this.markOnboardedAndClearSignOut()
    void this.ensureDesktopOnboardingCompleted().catch(() => {})
    return { done: true }
  }

  /**
   * Latest route-health snapshot (probes once when no cycle has run yet).
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns current route probe snapshot.
   */
  @Remote('networkStatus')
  async networkStatusOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachNetworkSnapshot> {
    signal.throwIfAborted()
    return this.networkSnapshot ?? await this.probeNetwork()
  }

  /**
   * Force one probe cycle now.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns fresh route probe snapshot.
   */
  @Remote('networkProbe')
  async networkProbeOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachNetworkSnapshot> {
    signal.throwIfAborted()
    return await this.probeNetwork()
  }

  /**
   * Toggle automatic route switching.
   *
   * @param request - whether automatic route switching is enabled.
   * @param signal - carrier cancellation.
   * @returns updated route probe snapshot.
   */
  @Remote('networkAuto')
  networkAutoOp(request: { auto: boolean }, signal: AbortSignal): XPeachNetworkSnapshot {
    signal.throwIfAborted()
    this.networkAuto = request.auto
    this.writeRouteFile()
    if (this.networkAuto) void this.probeNetwork().catch(() => {})
    return { ...this.currentSnapshot(), auto: this.networkAuto }
  }

  /**
   * Switch to one route manually.
   *
   * @param request - target route URL.
   * @param signal - carrier cancellation.
   * @returns updated route probe snapshot.
   */
  @Remote('networkRoute')
  networkRouteOp(request: { url: string }, signal: AbortSignal): XPeachNetworkSnapshot {
    signal.throwIfAborted()
    const normalized = request.url.replace(/\/+$/, '')
    const route = ROUTES.find(item => item.url === normalized)
    if (route === undefined) {
      throw new RemoteError('xpeach/request-failed', 'xpeach: unknown route', { status: 0, message: 'unknown route' })
    }
    this.networkAuto = false
    this.writeRouteFile()
    this.applyRoute(route.url)
    void this.probeNetwork().catch(() => {})
    return { ...this.currentSnapshot(), active: this.activeBaseURL, auto: false }
  }

  /**
   * Silent first-run detection of local conversation stores and agent assets.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns detected local sources, MCP servers, skills, and prompts.
   */
  @Remote('onboardingScan')
  onboardingScanOp(_request: XPeachSelfRequest, signal: AbortSignal): XPeachOnboardingScan {
    signal.throwIfAborted()
    return scanOnboarding()
  }

  /**
   * Decode and import the selected conversation sources into this home.
   *
   * @param request - list of source identifiers to import.
   * @param signal - carrier cancellation.
   * @returns per-source import results.
   */
  @Remote('importConversations')
  async importConversationsOp(
    request: { sources: string[] },
    signal: AbortSignal,
  ): Promise<XPeachConversationImportResult[]> {
    signal.throwIfAborted()
    const root = join(this.ownHome(), 'sessions')
    const known = new Set<XPeachSourceId>(['deepseek', 'claude', 'codex', 'zcode', 'chatgpt', 'gemini', 'antigravity'])
    const results: XPeachConversationImportResult[] = []
    for (const source of request.sources) {
      if (!known.has(source as XPeachSourceId)) continue
      signal.throwIfAborted()
      results.push(importThreads(source as XPeachSourceId, root))
    }
    try { unlinkSync(join(this.ownHome(), '.xpeach-reconciled-v2')) } catch (_err) { /* absent */ }
    await this.reconcileSessionsAndWorkspaces().catch(() => {})
    return results
  }

  /**
   * Copy skills, merge prompts, and append MCP server rows to the profile.
   *
   * @param request - asset category selection flags.
   * @param signal - carrier cancellation.
   * @returns counts of imported assets and any error messages.
   */
  @Remote('importAssets')
  importAssetsOp(
    request: { mcp?: boolean; skills?: boolean; prompts?: boolean },
    signal: AbortSignal,
  ): XPeachAssetImportResult {
    signal.throwIfAborted()
    const result = importLocalAssets(
      { mcp: request.mcp === true, skills: request.skills === true, prompts: request.prompts === true },
      this.ownHome(),
      this.mcpPatchPath(),
    )
    if (request.skills === true) {
      this.notifySkillsChanged()
    }
    return result
  }

  /**
   * Model market for this token: every priced group plus the callable models.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns site catalog groups, token groups, and callable models.
   */
  @Remote('siteCatalog')
  async siteCatalogOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachSiteCatalog> {
    signal.throwIfAborted()
    const snapshot = this.captureCredentialSnapshot()
    const [pricing, groupCat, info] = await Promise.all([
      this.api.adminPricing(signal),
      typeof this.api.groups === 'function' ? this.api.groups(signal).catch(() => undefined) : Promise.resolve(undefined),
      this.ensureTokenInfo(signal, snapshot),
    ])
    this.assertCredentialSnapshot(snapshot)
    if (info.id === undefined || info.failure !== undefined) {
      throw new RemoteError('xpeach/identity-incomplete', '尚未确认当前密钥的令牌身份；请检查管理凭据或扫描预算后重试。', {
        reason: info.failure ?? 'identity-unknown',
      })
    }
    const list = await this.api.models(signal).catch(() => [])
    this.assertCredentialSnapshot(snapshot)
    const usableKeys = pricing.usableGroup !== undefined ? Object.keys(pricing.usableGroup) : []
    const usableSet = usableKeys.length > 0 ? new Set(usableKeys) : undefined
    const counts = new Map<string, number>()
    for (const entry of pricing.entries) {
      for (const group of entry.enable_groups ?? []) {
        if (usableSet !== undefined && !usableSet.has(group) && !(groupCat !== undefined && group in groupCat)) continue
        counts.set(group, (counts.get(group) ?? 0) + 1)
      }
    }
    if (groupCat !== undefined) {
      for (const [name, meta] of Object.entries(groupCat)) {
        const len = Array.isArray(meta.models) ? meta.models.length : 0
        if (len > (counts.get(name) ?? 0)) {
          counts.set(name, len)
        }
      }
    }
    const groups = [...counts.entries()]
      .filter(([name]) => name !== 'default' && name !== '管理员分组')
      .map(([name, models]) => {
        const catMeta = groupCat?.[name]
        const rawRatio = pricing.groupRatio[name] ?? (typeof catMeta?.ratio === 'number' ? catMeta.ratio : typeof catMeta?.ratio === 'string' ? Number(catMeta.ratio) : undefined)
        const desc = (pricing.usableGroup?.[name] !== undefined && pricing.usableGroup[name] !== '')
          ? pricing.usableGroup[name]
          : (typeof catMeta?.desc === 'string' && catMeta.desc !== '' ? catMeta.desc : undefined)
        return {
          name,
          models,
          ...(typeof rawRatio === 'number' && Number.isFinite(rawRatio) ? { ratio: rawRatio } : {}),
          ...(desc !== undefined ? { desc } : {}),
        }
      })
      .sort((a, b) => b.models - a.models)
    const activeKey = this.readKeyFile()
    return {
      groups,
      tokenGroups: info.groups ?? [],
      models: list.map(m => m.id),
      ...(this.tokenInfoMatchesKey(info, activeKey) ? { tokenId: info.id } : {}),
      ...(info.name !== undefined && this.tokenInfoMatchesKey(info, activeKey) ? { tokenName: info.name } : {}),
      ...(activeKey !== undefined && activeKey.length > 4 ? { keyTail: activeKey.slice(-4) } : {}),
    }
  }

  /**
   * 显式修改当前 relay 令牌的分组；写入前必须重新确认密钥归属。
   *
   * @param request - group names to assign to the relay token.
   * @param signal - carrier cancellation.
   * @returns model catalog sync outcome plus the token the write targeted.
   */
  @Remote('setGroups')
  async setGroupsOp(request: { groups: string[] }, signal: AbortSignal): Promise<XPeachModelSyncResult> {
    signal.throwIfAborted()
    try {
      const snapshot = this.captureCredentialSnapshot()
      const activeKey = snapshot.relay.key
      const info = await this.ensureTokenInfo(signal, snapshot)
      this.assertCredentialSnapshot(snapshot)
      const groups = request.groups.filter(g => typeof g === 'string' && g.length > 0)
      if (groups.length === 0) return { ok: false, count: 0, groups: info.groups ?? [], error: 'pick at least one group' }
      if (info.id === undefined || !this.tokenInfoMatchesKey(info, activeKey)) {
        return {
          ok: false,
          count: 0,
          groups: info.groups ?? [],
          code: info.failure ?? 'identity-unknown',
          error: '无法确认当前密钥所属的令牌；请检查管理凭据或扫描预算后重试。',
        }
      }
      const tokenId = info.id
      // The stored binding may predate a remote rotation: the site must still
      // reveal THIS key for the stored token row before we edit its groups.
      const revealed = await this.revealTokenKey(info.id, signal, snapshot)
      this.assertCredentialSnapshot(snapshot)
      if (revealed?.key === undefined || this.normalizeRelayKey(revealed.key) !== this.normalizeRelayKey(activeKey)) {
        await this.writeTokenInfo({
          ...(activeKey !== undefined ? { key: activeKey } : {}),
          ...(info.groups !== undefined ? { groups: info.groups } : {}),
        }, snapshot)
        return {
          ok: false,
          count: 0,
          groups: info.groups ?? [],
          code: 'identity-unknown',
          error: '写入前未能确认令牌仍持有当前密钥，分组未修改；请重新同步身份。',
        }
      }
      await this.getRelayState().withCurrent(snapshot.relay, async () => {
        if (this.resolveAdmin() !== undefined) {
          const detail = await this.api.adminTokenGet(tokenId, signal)
          this.assertCredentialSnapshot(snapshot)
          const confirmed = await this.revealTokenKey(tokenId, signal, snapshot)
          if (confirmed?.key === undefined || this.normalizeRelayKey(confirmed.key) !== this.normalizeRelayKey(activeKey)) {
            throw new RemoteError('xpeach/identity-incomplete', '写入前未能确认当前令牌密钥，分组未修改。', { reason: 'identity-unknown' })
          }
          await this.api.adminTokenUpdate({ ...detail, id: tokenId, ...this.buildTokenGroupFields(groups) }, signal)
        } else {
          const page = await this.listTokenPages(signal, true, snapshot)
          const row = page.items.find(t => t.id === info.id)
          if (row === undefined) {
            const code = page.status === 'budget-exhausted' ? 'identity-budget-exhausted' : 'identity-unknown'
            throw new RemoteError('xpeach/identity-incomplete', '未能在扫描范围内确认用户令牌行，分组未修改。', { reason: code })
          }
          const confirmed = await this.revealTokenKey(tokenId, signal, snapshot)
          if (confirmed?.key === undefined || this.normalizeRelayKey(confirmed.key) !== this.normalizeRelayKey(activeKey)) {
            throw new RemoteError('xpeach/identity-incomplete', '写入前未能确认当前令牌密钥，分组未修改。', { reason: 'identity-unknown' })
          }
          const { user_id: _userId, ...userRow } = row
          await this.api.userTokenUpdate(tokenId, { ...userRow, ...this.buildTokenGroupFields(groups) }, signal)
        }
        this.assertCredentialSnapshot(snapshot)
      }, signal)
      await this.writeTokenInfo({ ...info, groups }, snapshot)
      const synced = await this.syncModelCatalog(signal, true, { forceGroupSwitch: true })
      return {
        ...synced,
        tokenId: info.id,
        ...(info.name !== undefined ? { tokenName: info.name } : {}),
      }
    } catch (error) {
      if (error instanceof RelayStateError) return { ok: false, count: 0, groups: [], code: error.code, error: error.message }
      throw error
    }
  }

  /**
   * Re-read `/v1/models` and rewrite the picker's model list.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns model catalog sync outcome.
   */
  @Remote('syncModels')
  async syncModelsOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachModelSyncResult> {
    signal.throwIfAborted()
    return await this.syncModelCatalog(signal, true)
  }

  /**
   * Who the bound session cookie resolves to (for the bound-row display).
   *
   * @param signal - carrier cancellation.
   * @returns session bound status and resolved username.
   */
  @Remote('sessionUser')
  async sessionUserOp(signal: AbortSignal): Promise<{ bound: boolean; as?: string }> {
    if (this.resolveSession() === undefined) return { bound: false }
    try {
      const me = await this.api.sessionSelf(signal)
      return { bound: true, as: me.username }
    } catch (_err) {
      return { bound: true }
    }
  }

  /**
   * Remove the bound site session cookie.
   *
   * @returns updated session bound status.
   */
  @Remote('unbindSession')
  unbindSessionOp(): { bound: boolean } {
    if (existsSync(this.sessionKeyFile)) { try { unlinkSync(this.sessionKeyFile) } catch (_err) { /* absent */ } }
    for (const dir of this.sharedMirrorDirs()) {
      const mirrored = join(dir, 'xpeach.session')
      if (existsSync(mirrored)) {
        try { unlinkSync(mirrored) } catch (_err) { /* absent */ }
      }
    }
    Reflect.deleteProperty(process.env, this.sessionKeyVar)
    this.api.setSessionKey(undefined)
    return { bound: false }
  }

  /**
   * Fetch a page of the signed-in user's own tokens.
   *
   * @param request - optional zero-based page index.
   * @param signal - carrier cancellation.
   * @returns paged list of user tokens.
   */
  @Remote('userTokens')
  async userTokensOp(request: { page?: number }, signal: AbortSignal): Promise<XPeachTokenPage> {
    return await this.api.userTokens(request.page ?? 0, signal)
  }

  /**
   * Create a new token for the signed-in user.
   *
   * @param request - token creation payload.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('userTokenCreate')
  async userTokenCreateOp(request: { payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userTokenCreate(request.payload, signal)
  }

  /**
   * Delete one of the signed-in user's tokens.
   *
   * @param request - token identifier to delete.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('userTokenDelete')
  async userTokenDeleteOp(request: { id: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userTokenDelete(request.id, signal)
  }

  /**
   * Reveal the raw key for one of the signed-in user's tokens.
   *
   * @param request - token identifier to reveal.
   * @param signal - carrier cancellation.
   * @returns object containing the raw token key.
   */
  @Remote('userTokenKey')
  async userTokenKeyOp(request: { id: number }, signal: AbortSignal): Promise<{ key?: string }> {
    return await this.api.userTokenKey(request.id, signal)
  }

  /**
   * Redeem a top-up code for the signed-in user.
   *
   * @param request - redemption code key.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('userTopup')
  async userTopupOp(request: { key: string }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userTopup(request.key, signal)
  }

  /**
   * Fetch the signed-in user's affiliate code and summary.
   *
   * @param signal - carrier cancellation.
   * @returns affiliate record.
   */
  @Remote('userAff')
  async userAffOp(signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return await this.api.userAff(signal)
  }

  /**
   * Update one of the signed-in user's tokens.
   *
   * @param request - token identifier and updated fields.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('userTokenUpdate')
  async userTokenUpdateOp(request: { id: number; payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userTokenUpdate(request.id, request.payload, signal)
  }

  /**
   * Update the signed-in user's own profile fields.
   *
   * @param request - profile fields to update.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('userSelfEdit')
  async userSelfEditOp(request: { payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userSelfEdit(request.payload, signal)
  }

  /**
   * Fetch per-day usage rows for the signed-in user.
   *
   * @param signal - carrier cancellation.
   * @returns self usage data payload.
   */
  @Remote('userSelfData')
  async userSelfDataOp(signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return await this.api.userSelfData(signal)
  }

  /**
   * Create a Stripe checkout session for a quota top-up.
   *
   * @param request - top-up amount and payment method.
   * @param signal - carrier cancellation.
   * @returns checkout session payload.
   */
  @Remote('stripePay')
  async stripePayOp(request: { amount: number; method: string }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.stripePay(request.amount, request.method, signal)
  }

  /**
   * Preview the charge amount for a Stripe quota top-up.
   *
   * @param request - top-up quota amount.
   * @param signal - carrier cancellation.
   * @returns preview result from Stripe endpoint.
   */
  @Remote('stripeAmount')
  async stripeAmountOp(request: { amount: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.stripeAmount(request.amount, signal)
  }

  /**
   * Fetch a page of upstream channels (admin scope).
   *
   * @param request - optional zero-based page index.
   * @param signal - carrier cancellation.
   * @returns paged list of upstream channels.
   */
  @Remote('adminChannels')
  async adminChannelsOp(request: { page?: number }, signal: AbortSignal): Promise<XPeachAdminPage<XPeachChannel>> {
    return await this.api.adminChannels(request.page ?? 0, signal)
  }

  /**
   * Fetch a page of redemption codes (admin scope).
   *
   * @param request - optional zero-based page index.
   * @param signal - carrier cancellation.
   * @returns paged list of redemption codes.
   */
  @Remote('adminRedemptions')
  async adminRedemptionsOp(request: { page?: number }, signal: AbortSignal): Promise<XPeachAdminPage<XPeachRedemption>> {
    return await this.api.adminRedemptions(request.page ?? 0, signal)
  }

  /**
   * Set one site configuration option (admin scope).
   *
   * @param request - option key and value.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('adminOptionSet')
  async adminOptionSetOp(request: { key: string; value: string }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminOptionSet(request.key, request.value, signal)
  }

  /**
   * Create or update an upstream channel (admin scope).
   *
   * @param request - channel payload.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('adminChannelSave')
  async adminChannelSaveOp(request: { payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminChannelSave(request.payload, signal)
  }

  /**
   * Delete an upstream channel (admin scope).
   *
   * @param request - channel identifier.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('adminChannelDelete')
  async adminChannelDeleteOp(request: { id: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminChannelDelete(request.id, signal)
  }

  /**
   * Test connectivity of an upstream channel (admin scope).
   *
   * @param request - channel identifier.
   * @param signal - carrier cancellation.
   * @returns channel test result.
   */
  @Remote('adminChannelTest')
  async adminChannelTestOp(request: { id: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminChannelTest(request.id, signal)
  }

  /**
   * Create a site token (admin scope).
   *
   * @param request - token creation payload.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('adminTokenCreate')
  async adminTokenCreateOp(request: { payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminTokenCreate(request.payload, signal)
  }

  /**
   * Delete a site token (admin scope).
   *
   * @param request - token identifier.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('adminTokenDelete')
  async adminTokenDeleteOp(request: { id: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminTokenDelete(request.id, signal)
  }

  /**
   * Fetch the site notice text (admin scope).
   *
   * @param signal - carrier cancellation.
   * @returns object containing the notice markdown string.
   */
  @Remote('adminNoticeGet')
  async adminNoticeOp(signal: AbortSignal): Promise<{ text: string }> {
    return { text: await this.api.adminNotice(signal) }
  }

  /**
   * Fetch one user record by id (admin scope).
   *
   * @param request - user identifier.
   * @param signal - carrier cancellation.
   * @returns user record fields.
   */
  @Remote('adminUserGet')
  async adminUserGetOp(request: { id: number }, signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return await this.api.adminUserGet(request.id, signal)
  }

  /**
   * Update a user record (admin scope).
   *
   * @param request - full user record to save.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('adminUserUpdate')
  async adminUserUpdateOp(request: { user: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminUserUpdate(request.user, signal)
  }

  /**
   * Apply a management action to a user (admin scope).
   *
   * @param request - user identifier, action verb, and numeric value.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('adminUserManage')
  async adminUserManageOp(request: { id: number; action: string; value: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminUserManage(request.id, request.action, request.value, signal)
  }

  /**
   * Fetch the optimistic-locked per-model pricing snapshot (admin scope).
   *
   * @param signal - carrier cancellation.
   * @returns model pricing snapshot.
   */
  @Remote('adminModelPricing')
  async adminModelPricingOp(signal: AbortSignal): Promise<XPeachModelPricingSnapshot> {
    return await this.api.adminModelPricing(signal)
  }

  /**
   * Apply optimistic-locked per-model pricing changes (admin scope).
   *
   * @param request - list of pricing changes.
   * @param signal - carrier cancellation.
   * @returns write operation result.
   */
  @Remote('adminModelPricingPatch')
  async adminModelPricingPatchOp(request: { changes: readonly XPeachModelPricingChange[] }, signal: AbortSignal):
  Promise<XPeachWriteResult> {
    return await this.api.adminModelPricingPatch(request.changes, signal)
  }

  /**
   * Fetch all site configuration options (admin scope).
   *
   * @param signal - carrier cancellation.
   * @returns list of option key/value pairs.
   */
  @Remote('adminOptions')
  async adminOptionsOp(signal: AbortSignal): Promise<{ entries: readonly { key: string; value: string }[] }> {
    return { entries: await this.api.adminOptions(signal) }
  }

  /**
   * Mint a batch of redemption codes (admin scope).
   *
   * @param request - quota per code, count, and batch label.
   * @param signal - carrier cancellation.
   * @returns generated redemption code keys.
   */
  @Remote('adminRedemptionCreate')
  async adminRedemptionCreateOp(request: { quota: number; count: number; name: string }, signal: AbortSignal):
  Promise<{ keys: readonly string[] }> {
    return { keys: await this.api.adminRedemptionCreate(request.quota, request.count, request.name, signal) }
  }

  /**
   * Dispatch a native OS notification from the Host process on macOS, Windows, or Linux.
   *
   * @param request - notification title, subtitle, body, urgency, and deduplication identifier.
   * @returns delivery outcome and platform identifier.
   */
  @Remote('sendSystemNotification')
  async sendSystemNotificationOp(request: XPeachSystemNotificationRequest): Promise<XPeachSystemNotificationResult> {
    return await dispatchHostSystemNotification(request)
  }


  /** Persisted route choice ({ url, auto, at }), validated against known routes. */
  private readRouteFile(): { url?: string; auto?: boolean } {
    let raw = ''
    try { raw = readFileSync(this.routeFile, 'utf8') } catch (_err) { return {} }
    let parsed: Record<string, unknown> | undefined
    try { parsed = JSON.parse(raw) as Record<string, unknown> } catch (_err) { return {} }
    const rawUrl = typeof parsed.url === 'string' && parsed.url.length > 0 ? parsed.url.replace(/\/+$/, '') : undefined
    const validUrl = rawUrl !== undefined && (ROUTES.some(route => route.url === rawUrl) || rawUrl === this.baseURL)
      ? rawUrl
      : undefined
    return {
      ...(validUrl !== undefined ? { url: validUrl } : {}),
      ...(typeof parsed.auto === 'boolean' ? { auto: parsed.auto } : {}),
    }
  }

  private writeRouteFile(): void {
    try {
      const content = JSON.stringify({ url: this.activeBaseURL, auto: this.networkAuto, at: Date.now() })
      this.writeState(this.routeFile, content)
      this.mirrorCredentialFile('xpeach.route.json', content)
    } catch (_err) { /* best effort */ }
  }

  /** Re-point management calls and the LLM provider at another route. */
  private applyRoute(url: string): void {
    const normalized = url.replace(/\/+$/, '')
    if (normalized === this.activeBaseURL) return
    this.activeBaseURL = normalized
    this.api.setBaseURL(normalized)
    this.writeRouteFile()
    void this.applyProviderBase().catch(() => {})
  }

  /** Keep all active `xpeach*` llm-pi-ai provider baseURLs in sync with the active route unless overridden by user routing. */
  private async applyProviderBase(): Promise<void> {
    if (this.readModelRouting().customBaseUrl !== undefined) return
    const settings = this.ctx.get('settings') as
      | { describe?: () => unknown; update?: (ns: string, patch: object) => Promise<void> }
      | undefined
    if (settings?.update === undefined) return
    const siteRoot = this.activeBaseURL.replace(/\/+$/, '')
    const openAIBase = siteRoot.endsWith('/v1') ? siteRoot : siteRoot + '/v1'
    const anthropicBase = siteRoot.replace(/\/v1$/u, '')
    const described = await settings.describe?.()
    const existing = readProviderMap(described)
    const xpeachKeys = Object.keys(existing).filter(isAccountModelProvider)
    if (xpeachKeys.length === 0) return
    const providers: Record<string, object> = {}
    let changed = false
    for (const key of xpeachKeys) {
      const currentProvider = existing[key]
      if (currentProvider === undefined) continue
      const existingModels = currentProvider['models']
      if (!Array.isArray(existingModels) || existingModels.length === 0) continue
      const api = currentProvider['api']
      const isAnthropic = api === 'anthropic-messages' || key === 'xpeach-anthropic'
      const nextUrl = isAnthropic ? anthropicBase : openAIBase
      if (currentProvider['baseURL'] !== nextUrl) changed = true
      providers[key] = { ...currentProvider, baseURL: nextUrl }
    }
    if (!changed || Object.keys(providers).length === 0) return
    this.writingPiAiSettings = (this.writingPiAiSettings ?? 0) + 1
    try {
      await settings.update('llm-pi-ai', { providers })
    } finally {
      this.writingPiAiSettings = Math.max(0, this.writingPiAiSettings - 1)
    }
  }

  /** Current snapshot (possibly stale) for instant UI updates. */
  private currentSnapshot(): XPeachNetworkSnapshot {
    return this.networkSnapshot ?? {
      at: Date.now(),
      active: this.activeBaseURL,
      auto: this.networkAuto,
      probes: [],
      history: { ...this.networkHistory },
    }
  }

  private isOfficialRouteUrl(url: string | undefined): boolean {
    if (typeof url !== 'string' || url.trim().length === 0) return false
    const normalized = url.trim().replace(/\/+$/u, '')
    return ROUTES.some(route => route.url === normalized)
  }

  private usesOfficialRoutePool(): boolean {
    return this.isOfficialRouteUrl(this.baseURL) && this.isOfficialRouteUrl(this.activeBaseURL)
  }

  /** Probe all routes, switch if auto and another route wins, record history. */
  private async probeNetwork(): Promise<XPeachNetworkSnapshot> {
    if (!this.usesOfficialRoutePool()) {
      const snapshot: XPeachNetworkSnapshot = {
        at: Date.now(),
        active: this.activeBaseURL,
        auto: this.networkAuto,
        probes: [],
        history: { ...this.networkHistory },
      }
      this.networkSnapshot = snapshot
      return snapshot
    }
    const key = await this.resolveKey().catch(() => undefined)
    const probes = await probeRoutes(key, Math.min(this.timeoutMs, 4000))
    if (this.networkAuto && this.usesOfficialRoutePool()) {
      const best = chooseBest(probes, this.activeBaseURL)
      if (best !== undefined && best.url !== this.activeBaseURL) this.applyRoute(best.url)
    }
    if (!this.networkApplied) {
      this.networkApplied = true
      void this.applyProviderBase().catch(() => {})
    }
    const at = Date.now()
    for (const probe of probes) {
      const list = this.networkHistory[probe.id] ?? []
      list.push({
        at,
        ...(probe.latencyMs === undefined ? {} : { latencyMs: probe.latencyMs }),
        loss: probe.loss,
      })
      if (list.length > 12) list.shift()
      this.networkHistory[probe.id] = list
    }
    const snapshot: XPeachNetworkSnapshot = {
      at,
      active: this.activeBaseURL,
      auto: this.networkAuto,
      probes,
      history: { ...this.networkHistory },
    }
    this.networkSnapshot = snapshot
    return snapshot
  }

  private async resolveKey(): Promise<string> {
    await this.relayReady
    const snapshot = this.captureCredentialSnapshot()
    const file = snapshot.relay.key
    if (file !== undefined) return file
    const ambient = snapshot.relay.revision === 0 ? process.env[this.keyVar]?.trim() : undefined
    if (ambient !== undefined && ambient.length > 0) { await this.persistKey(ambient); return ambient }
    if (snapshot.relay.revision === 0 && !existsSync(this.seededMarker())) {
      const credentials = this.ctx.get('credentials')
      const hit = credentials === undefined ? undefined : await credentials.resolve(this.apiKeyEnv)
      this.assertCredentialSnapshot(snapshot)
      const legacy = hit ?? launchEnvironmentOf(this.ctx).get(this.apiKeyEnv)
      if (legacy !== undefined && legacy.value.length > 0) { await this.persistKey(legacy.value, snapshot); return legacy.value }
      this.writeState(this.seededMarker(), '')
    }
    throw new RemoteError(
      'xpeach/missing-credential',
      `xpeach: no relay key; bind one in XPeach settings or drop it at ${this.keyFile}`,
      { ref: this.apiKeyEnv },
    )
  }

  /**
   * One-way import of the stock DeepSeek Harness conversation store: copies
   * `$DSH_HOME/sessions`, `$DSH_HOME/storages`, and `$DSH_HOME/attachments`
   * into this profile's isolated roots. Read-only against the source — existing
   * destination ids are left untouched so re-running never clobbers XPeach-side
   * history.
   *
   * @param signal - carrier cancellation.
   * @returns copied/skipped counters plus the resolved roots for the UI note.
   */
  @Remote('importDeepseek')
  async importDeepseekOp(
    signal: AbortSignal,
  ): Promise<{ imported: number; skipped: number; files: number; source: string; dest: string }> {
    signal.throwIfAborted()
    const sourceHome = join(homedir(), '.dsh')
    const destRoot = this.ownHome()
    if (resolve(sourceHome) === resolve(destRoot)) {
      return { imported: 0, skipped: 0, files: 0, source: join(sourceHome, 'sessions'), dest: join(destRoot, 'sessions') }
    }
    let imported = 0, skipped = 0, files = 0
    const copySessions = (src: string, dst: string, depth: number): void => {
      signal.throwIfAborted()
      if (!existsSync(src)) return
      mkdirSync(dst, { recursive: true })
      for (const entry of readdirSync(src, { withFileTypes: true })) {
        signal.throwIfAborted()
        const name = entry.name
        if (name === 'session.lock' || name.endsWith('.tmp') || name === '.DS_Store') continue
        const sp = join(src, name)
        const dp = join(dst, name)
        if (entry.isDirectory()) {
          if (depth === 0) {
            copySessions(sp, dp, 1)
          } else if (existsSync(dp)) {
            skipped += 1
          } else {
            cpSync(sp, dp, { recursive: true, force: false, errorOnExist: false, filter: f => !f.endsWith('session.lock') && !f.endsWith('.tmp') })
            imported += 1
          }
        } else if (entry.isFile() && !existsSync(dp)) {
          cpSync(sp, dp)
          files += 1
        }
      }
    }
    const copyFilesTree = (src: string, dst: string): void => {
      signal.throwIfAborted()
      if (!existsSync(src)) return
      mkdirSync(dst, { recursive: true })
      for (const entry of readdirSync(src, { withFileTypes: true })) {
        signal.throwIfAborted()
        const name = entry.name
        if (name === 'session.lock' || name.endsWith('.tmp') || name === '.DS_Store') continue
        const sp = join(src, name)
        const dp = join(dst, name)
        if (entry.isDirectory()) {
          copyFilesTree(sp, dp)
        } else if (entry.isFile() && !existsSync(dp)) {
          cpSync(sp, dp)
          files += 1
        }
      }
    }
    copySessions(join(sourceHome, 'sessions'), join(destRoot, 'sessions'), 0)
    copyFilesTree(join(sourceHome, 'storages'), join(destRoot, 'storages'))
    copyFilesTree(join(sourceHome, 'attachments'), join(destRoot, 'attachments'))
    try { unlinkSync(join(destRoot, '.xpeach-reconciled-v2')) } catch (_err) { /* absent */ }
    await this.reconcileSessionsAndWorkspaces().catch(() => {})
    return { imported, skipped, files, source: join(sourceHome, 'sessions'), dest: join(destRoot, 'sessions') }
  }

  /**
   * Reconcile sessions and skills across candidate home directories, warm the
   * projection cache for unindexed sessions, and attach orphan sessions to
   * workspaces grouped by their working directory.
   *
   * @returns promise that resolves when reconciliation completes.
   */
  async reconcileSessionsAndWorkspaces(): Promise<void> {
    if (this.reconcilePromise !== undefined) {
      await this.reconcilePromise
      return
    }
    const promise = this.runReconcileSessionsAndWorkspaces().finally(() => {
      if (this.reconcilePromise === promise) this.reconcilePromise = undefined
    })
    this.reconcilePromise = promise
    await promise
  }

  private async runReconcileSessionsAndWorkspaces(): Promise<void> {
    const own = this.ownHome()
    const marker = join(own, '.xpeach-reconciled-v2')
    if (this.candidateHomes === undefined && existsSync(marker)) {
      return
    }
    const ownResolved = resolve(own)
    const tmpResolved = resolve(tmpdir())
    const candidates = this.candidateHomes ?? (
      ownResolved.startsWith(tmpResolved)
        ? []
        : [
          resolve(process.cwd(), 'apps/desktop/.desktop-build/development/home'),
          resolve(process.cwd(), '.desktop-build/development/home'),
          join(homedir(), '.xph'),
        ]
    )

    for (const candidate of candidates) {
      if (!existsSync(candidate) || resolve(candidate) === ownResolved) continue
      const candSessions = join(candidate, 'sessions')
      if (existsSync(candSessions)) {
        let projects: Dirent[] = []
        try { projects = readdirSync(candSessions, { withFileTypes: true }) } catch (_err) { projects = [] }
        for (const proj of projects) {
          if (!proj.isDirectory() || proj.name.startsWith('.')) continue
          const srcProj = join(candSessions, proj.name)
          const dstProj = join(own, 'sessions', proj.name)
          let sessDirs: Dirent[] = []
          try { sessDirs = readdirSync(srcProj, { withFileTypes: true }) } catch (_err) { sessDirs = [] }
          for (const sess of sessDirs) {
            if (!sess.isDirectory() || !sess.name.startsWith('session-')) continue
            const srcSess = join(srcProj, sess.name)
            const dstSess = join(dstProj, sess.name)
            if (
              !existsSync(dstSess)
              && (existsSync(join(srcSess, 'session.v4.jsonl.zstd')) || existsSync(join(srcSess, 'meta.json')))
            ) {
              try {
                mkdirSync(dstProj, { recursive: true })
                cpSync(srcSess, dstSess, {
                  recursive: true,
                  force: false,
                  errorOnExist: false,
                  filter: f => !f.endsWith('session.lock') && !f.endsWith('.tmp'),
                })
              } catch (_err) { /* ignore copy race */ }
            }
          }
        }
      }

      const candSkills = join(candidate, 'skills')
      if (existsSync(candSkills)) {
        let skillDirs: Dirent[] = []
        try { skillDirs = readdirSync(candSkills, { withFileTypes: true }) } catch (_err) { skillDirs = [] }
        for (const sk of skillDirs) {
          if (!sk.isDirectory() || sk.name.startsWith('.')) continue
          const srcSk = join(candSkills, sk.name)
          const dstSk = join(own, 'skills', sk.name)
          const dstDisabledSk = join(own, 'skills', '.disabled', sk.name)
          if (
            !existsSync(dstSk)
            && !existsSync(dstDisabledSk)
            && (existsSync(join(srcSk, 'SKILL.md')) || existsSync(join(srcSk, 'SKILL.md.disabled')))
          ) {
            try {
              mkdirSync(join(own, 'skills'), { recursive: true })
              cpSync(srcSk, dstSk, { recursive: true })
            } catch (_err) { /* ignore copy race */ }
          }
        }
      }
    }

    const repairedActive = repairSkillsDirectory(this.skillsRoot())
    const repairedDisabled = repairSkillsDirectory(this.disabledSkillsRoot())
    if (repairedActive + repairedDisabled > 0) {
      this.notifySkillsChanged()
    }

    const persistence = this.getOptionalService('sessionPersistence')
    const cache = this.getOptionalService('sessionProjectionCache')
    const workspaces = this.getOptionalService('workspaceRegistry')
    if (persistence === undefined) return

    const accounted = new Set<string>()
    if (workspaces !== undefined) {
      for (const ws of workspaces.list()) {
        for (const sid of ws.sessionIds) accounted.add(sid)
      }
    }

    let listed: readonly (ReconcileSessionSnapshot | string)[] = []
    try { listed = await persistence.list() } catch (_err) { return }

    const snapshots: ReconcileSessionSnapshot[] = []
    let warmedCount = 0
    for (const item of listed) {
      try {
        if (typeof item === 'string') {
          let snap = cache !== undefined
            ? (await cache.cachedSnapshot(item)) as ReconcileSessionSnapshot | undefined
            : undefined
          if (snap === undefined) {
            const handle = await persistence.open(item, 'read')
            try {
              snap = await handle.read()
            } finally {
              await handle.close()
            }
            if (cache !== undefined && warmedCount < 16) {
              warmedCount += 1
              await cache.coldSnapshot(snap.header, handle.inheritedEventCount ?? 0, snap.events ?? [])
            }
          }
          snapshots.push(snap)
        } else {
          if (!accounted.has(item.header.id) && cache !== undefined && warmedCount < 16) {
            const cached = await cache.cachedSnapshot(item.header)
            if (cached === undefined) {
              warmedCount += 1
              const handle = await persistence.open(item.header.id, 'read')
              try {
                const readRes = await handle.read()
                await cache.coldSnapshot(item.header, handle.inheritedEventCount ?? 0, readRes.events ?? [])
              } finally {
                await handle.close()
              }
            }
          }
          snapshots.push(item)
        }
      } catch (_err) { /* skip unreadable session */ }
    }

    if (workspaces === undefined) return

    const parseCreatedAt = (val: number | string): number =>
      typeof val === 'number' ? val : (Date.parse(val) || 0)

    const groupsByCwd = new Map<string, ReconcileSessionSnapshot[]>()
    for (const snap of snapshots) {
      if (accounted.has(snap.header.id)) continue
      const rawCwd = snap.header.cwd?.trim()
      const cwd = rawCwd !== undefined && rawCwd.length > 0 && isAbsolute(rawCwd)
        ? rawCwd
        : join(own, 'XPeach Imported')
      const group = groupsByCwd.get(cwd) ?? []
      group.push(snap)
      groupsByCwd.set(cwd, group)
    }

    const sortedGroups = [...groupsByCwd.entries()].sort((a, b) => {
      const maxA = Math.max(...a[1].map(s => parseCreatedAt(s.header.createdAt)))
      const maxB = Math.max(...b[1].map(s => parseCreatedAt(s.header.createdAt)))
      return maxA - maxB
    })

    for (const [cwd, group] of sortedGroups) {
      group.sort((a, b) => parseCreatedAt(a.header.createdAt) - parseCreatedAt(b.header.createdAt))
      let targetCwd = cwd
      if (!existsSync(targetCwd)) {
        try { mkdirSync(targetCwd, { recursive: true }) } catch (_err) { /* fallback below */ }
      }
      if (!existsSync(targetCwd)) {
        targetCwd = join(own, 'XPeach Imported', basename(cwd) || 'default')
        try { mkdirSync(targetCwd, { recursive: true }) } catch (_err) { /* ignore */ }
      }
      if (!existsSync(targetCwd)) continue
      try {
        const ws = await workspaces.create(targetCwd)
        for (const snap of group) {
          if (!accounted.has(snap.header.id) && !ws.sessionIds.includes(snap.header.id)) {
            try {
              await ws.attachSession(snap.header.id)
              accounted.add(snap.header.id)
            } catch (_err) { /* ignore attach error */ }
          }
        }
      } catch (_err) { /* ignore uncreatable workspace */ }
    }
    if (this.candidateHomes === undefined && !ownResolved.startsWith(tmpResolved)) {
      try { this.writeState(marker, String(Date.now())) } catch (_err) { /* ignore */ }
    }
  }

  /**
   * List all user/workspace skills and global `AGENTS.md` rules.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns skills and rules snapshot.
   */
  @Remote('skillsList')
  skillsListOp(_request: XPeachSelfRequest, signal: AbortSignal): XPeachSkillsSnapshot {
    signal.throwIfAborted()
    const skillsRoot = this.skillsRoot()
    const disabledRoot = this.disabledSkillsRoot()
    repairSkillsDirectory(skillsRoot)
    repairSkillsDirectory(disabledRoot)

    const disabledSet = this.readDisabledSkills()
    const skills: XPeachSkillItem[] = []
    const seenPaths = new Set<string>()

    const readSkillFolder = (
      rootDir: string,
      source: 'user' | 'agents' | 'project' | 'builtin',
      forceDisabled = false,
    ): void => {
      if (!existsSync(rootDir)) return
      let entries: Dirent[] = []
      try { entries = readdirSync(rootDir, { withFileTypes: true }) } catch (_err) { return }
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue
        const dirPath = join(rootDir, entry.name)
        const activeMd = join(dirPath, 'SKILL.md')
        const disabledMd = join(dirPath, 'SKILL.md.disabled')
        const hasActive = existsSync(activeMd)
        const hasDisabled = existsSync(disabledMd)
        if (!hasActive && !hasDisabled) continue
        const skillFile = hasActive ? activeMd : disabledMd
        try {
          const raw = readFileSync(skillFile, 'utf8')
          const normalized = normalizeSkillMarkdown(raw, entry.name)
          if (source === 'user' && (!normalized.valid || normalized.content !== raw)) {
            try { writeFileSync(skillFile, normalized.content, 'utf8') } catch (_err) { /* ignore */ }
          }
          const isDisabled = forceDisabled || !hasActive || disabledSet.has(entry.name) || disabledSet.has(normalized.name)
          if (source === 'user' && isDisabled && hasActive && !forceDisabled) {
            try {
              renameSync(activeMd, disabledMd)
            } catch (_err) { /* ignore */ }
          }
          const finalPath = isDisabled && existsSync(disabledMd) ? disabledMd : skillFile
          seenPaths.add(resolve(dirPath))
          seenPaths.add(resolve(finalPath))
          skills.push({
            id: `${source}:${entry.name}`,
            name: normalized.name,
            dirName: entry.name,
            description: normalized.description,
            ...(normalized.whenToUse !== undefined ? { whenToUse: normalized.whenToUse } : {}),
            path: finalPath,
            source,
            enabled: !isDisabled,
            valid: true,
            content: normalized.content,
          })
        } catch (_err) { /* ignore unreadable skill */ }
      }
    }

    readSkillFolder(skillsRoot, 'user', false)
    readSkillFolder(disabledRoot, 'user', true)

    const ownResolved = resolve(this.ownHome())
    if (!isTemporaryCredentialDirectory(ownResolved)) {
      readSkillFolder(join(homedir(), '.agents', 'skills'), 'agents', false)
      readSkillFolder(join(process.cwd(), '.agents', 'skills'), 'project', false)
    }

    const rawLiveSkills = (this.getOptionalService('skills') ?? this.getOptionalService('skill'))?.list()
    const liveSkills: readonly LiveSkillEntry[] = Array.isArray(rawLiveSkills) ? rawLiveSkills : []
    for (const live of liveSkills) {
      const loc = live.location ?? live.path ?? ''
      if (loc.length === 0) continue
      const resolvedLoc = resolve(loc)
      const resolvedDir = resolve(dirname(loc))
      if (seenPaths.has(resolvedLoc) || seenPaths.has(resolvedDir)) continue
      if (!existsSync(loc)) continue
      try {
        const raw = readFileSync(loc, 'utf8')
        const dirName = basename(dirname(loc))
        const normalized = normalizeSkillMarkdown(raw, live.name || dirName)
        seenPaths.add(resolvedLoc)
        seenPaths.add(resolvedDir)
        const resolvedName = live.name || normalized.name
        const isLiveDisabled = disabledSet.has(dirName) || disabledSet.has(resolvedName)
        skills.push({
          id: `project:${dirName}`,
          name: resolvedName,
          dirName,
          description: live.description || normalized.description,
          ...(normalized.whenToUse !== undefined ? { whenToUse: normalized.whenToUse } : {}),
          path: loc,
          source: 'project',
          enabled: !isLiveDisabled,
          valid: normalized.valid,
          content: raw,
        })
      } catch (_err) { /* ignore unreadable workspace skill */ }
    }

    skills.sort((a, b) => a.name.localeCompare(b.name))
    const rulesPath = join(this.ownHome(), 'AGENTS.md')
    let rulesContent = ''
    if (existsSync(rulesPath)) {
      try { rulesContent = readFileSync(rulesPath, 'utf8') } catch (_err) { rulesContent = '' }
    }
    return {
      skills,
      rulesPath,
      rulesContent,
    }
  }

  private applySkillToggleToSet(
    item: { readonly dirName: string; readonly name: string; readonly enabled: boolean },
    disabledSet: Set<string>,
  ): boolean {
    const skillsRoot = this.skillsRoot()
    const disabledRoot = this.disabledSkillsRoot()
    const rawKey = item.dirName || item.name
    const folderName = this.findSkillFolderName(rawKey) ?? basename(rawKey.trim())
    if (folderName.length === 0 || folderName === '.' || folderName === '..') return false
    const activeDir = join(skillsRoot, folderName)
    const legacyDisabledDir = join(disabledRoot, folderName)
    if (existsSync(legacyDisabledDir) && !existsSync(activeDir)) {
      mkdirSync(skillsRoot, { recursive: true })
      moveDirectory(legacyDisabledDir, activeDir)
    }
    const activeMd = join(activeDir, 'SKILL.md')
    const disabledMd = join(activeDir, 'SKILL.md.disabled')
    if (item.enabled) {
      disabledSet.delete(folderName)
      disabledSet.delete(item.name)
      if (existsSync(disabledMd)) {
        try {
          renameSync(disabledMd, activeMd)
        } catch (_err) {
          writeFileSync(activeMd, readFileSync(disabledMd, 'utf8'), 'utf8')
          try { unlinkSync(disabledMd) } catch (_e) { /* ignore */ }
        }
      }
    } else {
      disabledSet.add(folderName)
      if (item.name.trim().length > 0) disabledSet.add(item.name.trim())
      if (existsSync(activeMd)) {
        try {
          renameSync(activeMd, disabledMd)
        } catch (_err) {
          writeFileSync(disabledMd, readFileSync(activeMd, 'utf8'), 'utf8')
          try { unlinkSync(activeMd) } catch (_e) { /* ignore */ }
        }
      }
    }
    return true
  }

  /**
   * Enable or disable a skill by updating `xpeach.skills-disabled.json` and
   * toggling `SKILL.md` / `SKILL.md.disabled` for user skills.
   *
   * @param request - skill directory name, skill name, and target enabled flag.
   * @param signal - carrier cancellation.
   * @returns updated skills and rules snapshot.
   */
  @Remote('skillToggle')
  skillToggleOp(request: XPeachSkillToggleRequest, signal: AbortSignal): XPeachSkillsSnapshot {
    signal.throwIfAborted()
    const disabledSet = this.readDisabledSkills()
    if (this.applySkillToggleToSet(request, disabledSet)) {
      if (request.enabled) repairSkillsDirectory(this.skillsRoot())
      this.writeDisabledSkills(disabledSet)
      this.notifySkillsChanged()
    }
    return this.skillsListOp({}, signal)
  }

  /**
   * Atomically enable or disable multiple skills in a single disk update.
   *
   * @param request - target skill entries and desired enabled state.
   * @param signal - carrier cancellation.
   * @returns updated skills and rules snapshot.
   */
  @Remote('skillBatchToggle')
  skillBatchToggleOp(request: XPeachSkillBatchToggleRequest, signal: AbortSignal): XPeachSkillsSnapshot {
    signal.throwIfAborted()
    if (request.items.length === 0) return this.skillsListOp({}, signal)
    const disabledSet = this.readDisabledSkills()
    let touched = false
    for (const entry of request.items) {
      if (this.applySkillToggleToSet({ ...entry, enabled: request.enabled }, disabledSet)) {
        touched = true
      }
    }
    if (touched) {
      if (request.enabled) repairSkillsDirectory(this.skillsRoot())
      this.writeDisabledSkills(disabledSet)
      this.notifySkillsChanged()
    }
    return this.skillsListOp({}, signal)
  }

  /**
   * Atomically delete multiple user skill directories from `$XPH_HOME/skills`.
   *
   * @param request - skill directory names to delete.
   * @param signal - carrier cancellation.
   * @returns updated skills and rules snapshot.
   */
  @Remote('skillBatchDelete')
  skillBatchDeleteOp(request: XPeachSkillBatchDeleteRequest, signal: AbortSignal): XPeachSkillsSnapshot {
    signal.throwIfAborted()
    if (request.dirNames.length === 0) return this.skillsListOp({}, signal)
    const disabledSet = this.readDisabledSkills()
    let disabledChanged = false
    let deletedAny = false
    for (const rawDir of request.dirNames) {
      const folderName = this.findSkillFolderName(rawDir) ?? basename(rawDir.trim())
      if (folderName.length === 0 || folderName === '.' || folderName === '..') continue
      const activeDir = join(this.skillsRoot(), folderName)
      const disabledDir = join(this.disabledSkillsRoot(), folderName)
      if (existsSync(activeDir)) {
        try { rmSync(activeDir, { recursive: true, force: true }); deletedAny = true } catch (_err) { /* ignore */ }
      }
      if (existsSync(disabledDir)) {
        try { rmSync(disabledDir, { recursive: true, force: true }); deletedAny = true } catch (_err) { /* ignore */ }
      }
      if (disabledSet.delete(folderName)) disabledChanged = true
    }
    if (disabledChanged) this.writeDisabledSkills(disabledSet)
    if (deletedAny || disabledChanged) this.notifySkillsChanged()
    return this.skillsListOp({}, signal)
  }

  /**
   * Create or update a user skill in `$XPH_HOME/skills/<dirName>/SKILL.md` with
   * normalized frontmatter.
   *
   * @param request - skill directory name, name, description, and markdown content.
   * @param signal - carrier cancellation.
   * @returns updated skills and rules snapshot.
   */
  @Remote('skillSave')
  skillSaveOp(request: XPeachSkillSaveRequest, signal: AbortSignal): XPeachSkillsSnapshot {
    signal.throwIfAborted()
    const skillsRoot = this.skillsRoot()
    const name = sanitizeSkillName(request.name || request.dirName || 'skill')
    const rawDirName = request.dirName !== undefined && request.dirName.trim().length > 0
      ? basename(request.dirName.trim())
      : name
    const dirName = rawDirName.length > 0 && rawDirName !== '.' && rawDirName !== '..' ? rawDirName : name

    const trimmedContent = request.content.trimStart()
    let rawMd: string
    if (trimmedContent.startsWith('---')) {
      const parsed = normalizeSkillMarkdown(request.content, name)
      const desc = request.description.trim().length > 0 ? request.description.trim() : parsed.description
      const whenToUse = request.whenToUse !== undefined && request.whenToUse.trim().length > 0
        ? request.whenToUse.trim()
        : parsed.whenToUse
      rawMd = [
        '---',
        `name: ${name}`,
        `description: ${JSON.stringify(desc)}`,
        ...(whenToUse !== undefined ? [`whenToUse: ${JSON.stringify(whenToUse)}`] : []),
        '---',
        '',
        parsed.body,
      ].join('\n')
    } else {
      const desc = (request.description || name).trim()
      const whenToUse = request.whenToUse !== undefined && request.whenToUse.trim().length > 0
        ? request.whenToUse.trim()
        : undefined
      rawMd = [
        '---',
        `name: ${name}`,
        `description: ${JSON.stringify(desc)}`,
        ...(whenToUse !== undefined ? [`whenToUse: ${JSON.stringify(whenToUse)}`] : []),
        '---',
        '',
        request.content.replace(/^\r?\n+/u, ''),
      ].join('\n')
    }

    const normalized = normalizeSkillMarkdown(rawMd, name)
    const targetDir = join(skillsRoot, dirName)
    mkdirSync(targetDir, { recursive: true })
    const disabledMd = join(targetDir, 'SKILL.md.disabled')
    const activeMd = join(targetDir, 'SKILL.md')
    if (existsSync(disabledMd) && !existsSync(activeMd)) {
      writeFileSync(disabledMd, normalized.content, 'utf8')
    } else {
      writeFileSync(activeMd, normalized.content, 'utf8')
    }
    this.notifySkillsChanged()
    return this.skillsListOp({}, signal)
  }

  /**
   * Delete a user skill directory from `$XPH_HOME/skills`.
   *
   * @param request - skill directory name to delete.
   * @param signal - carrier cancellation.
   * @returns updated skills and rules snapshot.
   */
  @Remote('skillDelete')
  skillDeleteOp(request: XPeachSkillDeleteRequest, signal: AbortSignal): XPeachSkillsSnapshot {
    signal.throwIfAborted()
    const folderName = this.findSkillFolderName(request.dirName) ?? basename(request.dirName.trim())
    if (folderName.length > 0 && folderName !== '.' && folderName !== '..') {
      const activeDir = join(this.skillsRoot(), folderName)
      const disabledDir = join(this.disabledSkillsRoot(), folderName)
      if (existsSync(activeDir)) {
        try { rmSync(activeDir, { recursive: true, force: true }) } catch (_err) { /* ignore */ }
      }
      if (existsSync(disabledDir)) {
        try { rmSync(disabledDir, { recursive: true, force: true }) } catch (_err) { /* ignore */ }
      }
      const disabledSet = this.readDisabledSkills()
      if (disabledSet.delete(folderName)) {
        this.writeDisabledSkills(disabledSet)
      }
      this.notifySkillsChanged()
    }
    return this.skillsListOp({}, signal)
  }

  /**
   * Save global rules to `$XPH_HOME/AGENTS.md`.
   *
   * @param request - markdown content for `AGENTS.md`.
   * @param signal - carrier cancellation.
   * @returns updated skills and rules snapshot.
   */
  @Remote('rulesSave')
  rulesSaveOp(request: XPeachRulesSaveRequest, signal: AbortSignal): XPeachSkillsSnapshot {
    signal.throwIfAborted()
    const rulesPath = join(this.ownHome(), 'AGENTS.md')
    mkdirSync(dirname(rulesPath), { recursive: true })
    const content = request.content.length === 0 || request.content.endsWith('\n')
      ? request.content
      : request.content + '\n'
    writeFileSync(rulesPath, content, 'utf8')
    return this.skillsListOp({}, signal)
  }

  /**
   * List configured MCP servers in the profile's `cordis.patch.yml` and cross-
   * check live tool registrations.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns MCP servers snapshot.
   */
  @Remote('mcpList')
  mcpListOp(_request: XPeachSelfRequest, signal: AbortSignal): XPeachMcpSnapshot {
    signal.throwIfAborted()
    const patchPath = this.mcpPatchPath()
    const entries = readMcpPatchEntries(patchPath)

    const allSchemas = this.getOptionalService('tools')?.schemas() ?? []
    const servers: XPeachMcpItem[] = entries.map((entry) => {
      const prefixes = [
        `mcp__${entry.serverName}__`,
        `mcp_${entry.serverName}__`,
        `mcp__${sanitizeMcpServerName(entry.serverName)}__`,
        `mcp_${sanitizeMcpServerName(entry.serverName)}__`,
      ]
      const tools: { readonly name: string; readonly description: string }[] = []
      for (const schema of allSchemas) {
        const lowerName = schema.name.toLowerCase()
        const matchedPrefix = prefixes.find(p => lowerName.startsWith(p.toLowerCase()))
        if (matchedPrefix !== undefined) {
          tools.push({
            name: schema.name.slice(matchedPrefix.length),
            description: schema.description ?? '',
          })
        }
      }
      const status: 'active' | 'disabled' | 'configured' = entry.disabled
        ? 'disabled'
        : tools.length > 0
          ? 'active'
          : 'configured'
      return {
        id: entry.id,
        serverName: entry.serverName,
        disabled: entry.disabled,
        transportType: entry.transportType,
        ...(entry.command !== undefined ? { command: entry.command } : {}),
        ...(entry.args !== undefined ? { args: entry.args } : {}),
        ...(entry.env !== undefined ? { env: entry.env } : {}),
        ...(entry.url !== undefined ? { url: entry.url } : {}),
        ...(entry.headers !== undefined ? { headers: entry.headers } : {}),
        status,
        toolCount: tools.length,
        tools,
      }
    })

    return {
      servers,
      patchPath,
    }
  }

  /**
   * Toggle an MCP server entry's `disabled` flag in `cordis.patch.yml`.
   *
   * @param request - MCP entry id and target enabled flag.
   * @param signal - carrier cancellation.
   * @returns updated MCP servers snapshot.
   */
  @Remote('mcpToggle')
  mcpToggleOp(request: XPeachMcpToggleRequest, signal: AbortSignal): XPeachMcpSnapshot {
    signal.throwIfAborted()
    const patchPath = this.mcpPatchPath()
    const entries = readMcpPatchEntries(patchPath)
    const next = entries.map(entry =>
      entry.id === request.id || entry.serverName === request.id
        ? { ...entry, disabled: !request.enabled }
        : entry,
    )
    writeMcpPatchEntries(patchPath, next)
    return this.mcpListOp({}, signal)
  }

  /**
   * Create or update an MCP server entry in `cordis.patch.yml` without
   * duplicating existing servers.
   *
   * @param request - MCP server configuration to save.
   * @param signal - carrier cancellation.
   * @returns updated MCP servers snapshot.
   */
  @Remote('mcpSave')
  mcpSaveOp(request: XPeachMcpSaveRequest, signal: AbortSignal): XPeachMcpSnapshot {
    signal.throwIfAborted()
    const patchPath = this.mcpPatchPath()
    const entries = readMcpPatchEntries(patchPath)
    const serverName = sanitizeMcpServerName(request.serverName)
    const requestedId = request.id !== undefined && request.id.trim().length > 0
      ? sanitizeMcpId(request.id.replace(/^mcp[-_]/iu, ''))
      : sanitizeMcpId(serverName)
    const existing = entries.find(
      e => e.id === request.id || e.id === requestedId || e.serverName === serverName,
    )
    const saved: XPeachMcpPatchEntry = {
      id: existing?.id ?? requestedId,
      serverName,
      disabled: request.disabled ?? existing?.disabled ?? false,
      transportType: request.transportType,
      ...(request.transportType === 'stdio' && request.command !== undefined && request.command.trim().length > 0
        ? { command: request.command.trim() }
        : {}),
      ...(request.transportType === 'stdio' && request.args !== undefined && request.args.length > 0
        ? { args: [...request.args] }
        : {}),
      ...(request.transportType === 'stdio' && request.env !== undefined && Object.keys(request.env).length > 0
        ? { env: { ...request.env } }
        : {}),
      ...(request.transportType === 'streamable-http' && request.url !== undefined && request.url.trim().length > 0
        ? { url: request.url.trim() }
        : {}),
      ...(request.transportType === 'streamable-http' && request.headers !== undefined && Object.keys(request.headers).length > 0
        ? { headers: { ...request.headers } }
        : {}),
    }

    let replaced = false
    const next: XPeachMcpPatchEntry[] = []
    for (const entry of entries) {
      if (entry.id === request.id || entry.id === saved.id || entry.serverName === saved.serverName) {
        if (!replaced) {
          next.push(saved)
          replaced = true
        }
      } else {
        next.push(entry)
      }
    }
    if (!replaced) next.push(saved)
    writeMcpPatchEntries(patchPath, next)
    return this.mcpListOp({}, signal)
  }

  /**
   * Delete an MCP server entry from `cordis.patch.yml`.
   *
   * @param request - MCP entry id to delete.
   * @param signal - carrier cancellation.
   * @returns updated MCP servers snapshot.
   */
  @Remote('mcpDelete')
  mcpDeleteOp(request: XPeachMcpDeleteRequest, signal: AbortSignal): XPeachMcpSnapshot {
    signal.throwIfAborted()
    const patchPath = this.mcpPatchPath()
    const entries = readMcpPatchEntries(patchPath)
    const next = entries.filter(e => e.id !== request.id && e.serverName !== request.id)
    writeMcpPatchEntries(patchPath, next)
    return this.mcpListOp({}, signal)
  }

  /**
   * Atomically enable or disable multiple MCP servers in `cordis.patch.yml`.
   *
   * @param request - MCP entry IDs and target enabled flag.
   * @param signal - carrier cancellation.
   * @returns updated MCP servers snapshot.
   */
  @Remote('mcpBatchToggle')
  mcpBatchToggleOp(request: XPeachMcpBatchToggleRequest, signal: AbortSignal): XPeachMcpSnapshot {
    signal.throwIfAborted()
    if (request.ids.length === 0) return this.mcpListOp({}, signal)
    const targetSet = new Set(request.ids)
    const patchPath = this.mcpPatchPath()
    const entries = readMcpPatchEntries(patchPath)
    const next = entries.map(entry =>
      targetSet.has(entry.id) || targetSet.has(entry.serverName)
        ? { ...entry, disabled: !request.enabled }
        : entry,
    )
    writeMcpPatchEntries(patchPath, next)
    return this.mcpListOp({}, signal)
  }

  /**
   * Atomically delete multiple MCP servers from `cordis.patch.yml`.
   *
   * @param request - MCP entry IDs to remove.
   * @param signal - carrier cancellation.
   * @returns updated MCP servers snapshot.
   */
  @Remote('mcpBatchDelete')
  mcpBatchDeleteOp(request: XPeachMcpBatchDeleteRequest, signal: AbortSignal): XPeachMcpSnapshot {
    signal.throwIfAborted()
    if (request.ids.length === 0) return this.mcpListOp({}, signal)
    const targetSet = new Set(request.ids)
    const patchPath = this.mcpPatchPath()
    const entries = readMcpPatchEntries(patchPath)
    const next = entries.filter(e => !targetSet.has(e.id) && !targetSet.has(e.serverName))
    writeMcpPatchEntries(patchPath, next)
    return this.mcpListOp({}, signal)
  }

  private getGatewayInspector(): XPeachGatewayInspectorController {
    if (this.gatewayInspector !== undefined) return this.gatewayInspector
    return new XPeachGatewayInspectorController({
      ctx: this.ctx,
      readConfig: () => this.readPromptOverrides(),
      getActiveBaseUrl: () => this.activeBaseURL,
      getCustomBaseUrl: () => this.readModelRouting().customBaseUrl,
      readModelCallSettings: modelId => this.readModelRouting().modelSettings[modelId],
      readBoundKey: () => this.readKeyFile(),
      listSkillsSnapshot: s => this.skillsListOp({}, s),
    })
  }

  /**
   * Assemble a full snapshot of prompts, implicit injections, tools, headers,
   * and serialized upstream gateway request body.
   *
   * @param request - optional protocol, model, session id, and sample prompt.
   * @param signal - carrier cancellation.
   * @returns complete gateway inspector snapshot.
   */
  @Remote('gatewayInspectorSnapshot')
  async gatewayInspectorSnapshotOp(
    request: XPeachGatewayInspectorRequest,
    signal: AbortSignal,
  ): Promise<XPeachGatewayInspectorSnapshot> {
    return await this.getGatewayInspector().buildSnapshot(request, signal)
  }

  /**
   * Persist user adjustments to system prompts, implicit injections, tool
   * schemas, upstream headers, and request parameters, then sync `llm-pi-ai`
   * provider profiles and return the refreshed inspector snapshot.
   *
   * @param request - updated prompt/gateway overrides and optional preview parameters.
   * @param signal - carrier cancellation.
   * @returns refreshed gateway inspector snapshot.
   */
  @Remote('gatewayInspectorSave')
  async gatewayInspectorSaveOp(
    request: XPeachGatewayInspectorSaveRequest,
    signal: AbortSignal,
  ): Promise<XPeachGatewayInspectorSnapshot> {
    signal.throwIfAborted()
    const normalized = normalizePromptOverridesConfig(request.config)
    this.promptOverridesCache = normalized
    const promptFile = this.promptOverridesFile()
    if (promptFile !== undefined) {
      this.writeState(promptFile, JSON.stringify(normalized, null, 2))
    }
    await this.syncGatewayOverridesToProviders(normalized).catch(() => {})
    return await this.getGatewayInspector().buildSnapshot(request.preview ?? {}, signal)
  }

  /**
   * Read the three XPeach wire-protocol endpoint pools, per-model call settings,
   * and gateway configuration for the `Settings → Models` Pool Studio.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns complete endpoint pools snapshot.
   */
  @Remote('modelPoolsSnapshot')
  async modelPoolsSnapshotOp(
    _request: XPeachSelfRequest,
    signal: AbortSignal,
  ): Promise<XPeachModelPoolsSnapshot> {
    signal.throwIfAborted()
    if (this.readModelsCache().length === 0 && this.isBound()) {
      await this.syncModelCatalog(signal).catch(() => undefined)
    }
    return await this.computeModelPoolsSnapshot()
  }

  /**
   * Persist user drag-and-drop endpoint pool assignments, pool ordering,
   * per-model call settings, and gateway options into `xpeach.model-routing.json`,
   * synchronize `llm-pi-ai` provider profiles immediately, and relocate active
   * default/session model selections when a model moves between pools.
   *
   * @param request - updated routing ledger and optional auto-sync preference.
   * @param signal - carrier cancellation.
   * @returns updated endpoint pools snapshot.
   */
  @Remote('modelPoolsSave')
  async modelPoolsSaveOp(
    request: XPeachModelPoolsSaveRequest,
    signal: AbortSignal,
  ): Promise<XPeachModelPoolsSnapshot> {
    signal.throwIfAborted()
    const normalized = normalizeModelRoutingState(request.routing)
    this.writeModelRouting(normalized)

    if (normalized.conversationTracking !== undefined) {
      const currentPrompts = this.readPromptOverrides()
      if (currentPrompts.conversationTracking !== normalized.conversationTracking) {
        const nextPrompts = { ...currentPrompts, conversationTracking: normalized.conversationTracking }
        this.promptOverridesCache = nextPrompts
        const pf = this.promptOverridesFile()
        if (pf !== undefined) {
          this.writeState(pf, JSON.stringify(nextPrompts, null, 2))
        }
      }
    }

    const settings = this.ctx.get('settings') as
      | {
        describe?: () => unknown
        update?: (ns: string, patch: object) => Promise<void>
        mutate?: (ns: string, ops: unknown[]) => Promise<unknown>
      }
      | undefined

    if (settings?.update !== undefined && (request.autoSyncModels !== undefined || normalized.conversationTracking !== undefined)) {
      const accountPatch: Record<string, unknown> = {}
      if (request.autoSyncModels !== undefined) accountPatch['autoSyncModels'] = request.autoSyncModels
      if (normalized.conversationTracking !== undefined) accountPatch['conversationTracking'] = normalized.conversationTracking
      await settings.update('xpeach-account', accountPatch).catch(() => undefined)
    }

    return await this.applyModelRoutingAndSnapshot(normalized)
  }

  /**
   * Reset all endpoint pool overrides and per-model call settings back to smart
   * diversified defaults, re-sync `llm-pi-ai`, and return the fresh pool snapshot.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns reset endpoint pools snapshot.
   */
  @Remote('modelPoolsReset')
  async modelPoolsResetOp(
    _request: XPeachSelfRequest,
    signal: AbortSignal,
  ): Promise<XPeachModelPoolsSnapshot> {
    signal.throwIfAborted()
    this.writeModelRouting(DEFAULT_MODEL_ROUTING_STATE)
    if (this.isBound()) {
      await this.syncModelCatalog(signal, true, { forceGroupSwitch: true }).catch(() => undefined)
    }
    return await this.applyModelRoutingAndSnapshot(DEFAULT_MODEL_ROUTING_STATE)
  }

  /**
   * Inspect the current macOS `.pkg` guided installer artifact and installed
   * `XPeach Harness.app` / `xph` CLI binary.
   *
   * @param _request - empty request payload.
   * @param signal - carrier cancellation.
   * @returns current macOS installer status.
   */
  @Remote('macosInstallerStatus')
  macosInstallerStatusOp(_request: XPeachSelfRequest, signal: AbortSignal): XPeachMacosInstallerStatus {
    signal.throwIfAborted()
    return inspectMacosInstallerStatus({ ownHome: this.ownHome() })
  }

  /**
   * Build, open, reveal, or directly install the macOS `.pkg` guided installer
   * and `XPeach Harness.app` + `xph` CLI tool.
   *
   * @param request - installer action to execute (`build`, `open`, `reveal`, or `install-direct`).
   * @param signal - carrier cancellation.
   * @returns installer action result and updated status.
   */
  @Remote('macosInstallerAction')
  async macosInstallerActionOp(
    request: XPeachMacosInstallerActionRequest,
    signal: AbortSignal,
  ): Promise<XPeachMacosInstallerActionResult> {
    signal.throwIfAborted()
    return await runMacosInstallerAction(request.action, { ownHome: this.ownHome() })
  }

  /**
   * Read the current runtime version, parsed channel, user-subscribed update
   * channel, automatic update check preference, and downward-compatible release
   * channels.
   *
   * @param _request - Empty request payload.
   * @param signal - Optional carrier cancellation signal.
   * @returns Current update channel status.
   */
  @Remote('updateChannelStatus')
  updateChannelStatus(_request?: XPeachSelfRequest, signal?: AbortSignal): XPeachUpdateChannelStatus {
    signal?.throwIfAborted()
    const rawVersion = readCurrentRuntimeVersion()
    const parsedVersion = parseXpeachVersion(rawVersion)
    const currentVersion = parsedVersion?.version ?? rawVersion
    const currentChannel = parsedVersion?.channel ?? normalizeXpeachChannel(undefined, rawVersion)
    const prefFile = join(this.ownHome(), 'xpeach.update-channel.json')
    const hasPersisted = existsSync(prefFile)
    const persisted = readXpeachUpdatePreference(this.ownHome(), currentVersion)
    const configuredChannel = (this.liveConfig as Config | undefined) !== undefined
      ? unwrapConfigValue(this.liveConfig.updateChannel)
      : undefined
    const configuredAutoCheck = (this.liveConfig as Config | undefined) !== undefined
      ? unwrapConfigValue(this.liveConfig.autoCheckUpdate)
      : undefined
    const fallbackChannel = configuredChannel !== undefined
      ? normalizeXpeachChannel(configuredChannel, currentVersion)
      : persisted.channel
    const subscribedChannel = hasPersisted
      ? persisted.channel
      : this.subscribedUpdateChannel ?? fallbackChannel
    const autoCheckUpdate = hasPersisted
      ? persisted.autoCheckUpdate
      : this.autoCheckUpdateEnabled ?? (typeof configuredAutoCheck === 'boolean' ? configuredAutoCheck : persisted.autoCheckUpdate)
    this.subscribedUpdateChannel = subscribedChannel
    this.autoCheckUpdateEnabled = autoCheckUpdate
    return {
      currentVersion,
      currentChannel,
      subscribedChannel,
      autoCheckUpdate,
      compatibleChannels: compatibleReleaseChannels(subscribedChannel),
    }
  }

  /**
   * Update and persist the user's release channel subscription and automatic
   * update check preference in `~/.xph/xpeach.update-channel.json`.
   *
   * @param request - Target update channel and/or `autoCheckUpdate` toggle.
   * @param signal - Optional carrier cancellation signal.
   * @returns Updated update channel status.
   */
  @Remote('setUpdateChannel')
  setUpdateChannel(
    request: XPeachSetUpdateChannelRequest,
    signal?: AbortSignal,
  ): XPeachUpdateChannelStatus {
    signal?.throwIfAborted()
    const current = this.updateChannelStatus({}, signal)
    const nextChannel = request.channel !== undefined
      ? normalizeXpeachChannel(request.channel, current.currentVersion)
      : current.subscribedChannel
    const nextAutoCheck = typeof request.autoCheckUpdate === 'boolean'
      ? request.autoCheckUpdate
      : current.autoCheckUpdate
    const saved = writeXpeachUpdatePreference(
      { channel: nextChannel, autoCheckUpdate: nextAutoCheck },
      this.ownHome(),
    )
    this.subscribedUpdateChannel = saved.channel
    this.autoCheckUpdateEnabled = saved.autoCheckUpdate
    const settings = (this.ctx as Context | undefined)?.get('settings') as
      | { update?: (ns: string, patch: object) => Promise<void> }
      | undefined
    if (settings?.update !== undefined) {
      void settings.update('xpeach-account', {
        updateChannel: saved.channel,
        autoCheckUpdate: saved.autoCheckUpdate,
      }).catch(() => {})
    }
    return {
      currentVersion: current.currentVersion,
      currentChannel: current.currentChannel,
      subscribedChannel: saved.channel,
      autoCheckUpdate: saved.autoCheckUpdate,
      compatibleChannels: compatibleReleaseChannels(saved.channel),
    }
  }

  /**
   * Check the GitHub Releases REST API and select the highest downward-compatible
   * release for the user's subscribed update channel.
   *
   * @param request - Optional channel override and `force` cache-bypass flag.
   * @param signal - Optional carrier cancellation signal.
   * @returns Structured update check result.
   */
  @Remote('checkUpdate')
  async checkUpdate(
    request?: XPeachCheckUpdateRequest,
    signal?: AbortSignal,
  ): Promise<XPeachUpdateCheckResult> {
    signal?.throwIfAborted()
    const status = this.updateChannelStatus({}, signal)
    const subscribedChannel = request?.channel !== undefined
      ? normalizeXpeachChannel(request.channel, status.currentVersion)
      : status.subscribedChannel
    const releases = await this.fetchGitHubReleaseCandidates(request?.force === true, signal)
    return selectBestUpdateForChannel(
      releases,
      status.currentVersion,
      subscribedChannel,
      status.autoCheckUpdate,
    )
  }

  private async fetchGitHubReleaseCandidates(
    force: boolean,
    signal?: AbortSignal,
  ): Promise<readonly XPeachReleaseCandidate[]> {
    signal?.throwIfAborted()
    const cached = this.releasesCache
    if (!force && cached !== undefined && Date.now() - cached.at < 30_000) {
      return cached.items
    }
    if (this.updateCheckInFlight !== undefined) {
      return await raceWithAbortSignal(this.updateCheckInFlight, signal)
    }
    const baseTimeoutMs = this.timeoutMs > 0 ? this.timeoutMs : 15_000
    const run = (async (): Promise<readonly XPeachReleaseCandidate[]> => {
      const repoSlug = 'yellowpeachxgp/xpeach-harness'
      let lastFailure = 'unable to reach GitHub Releases'
      let lastStatus = 0

      if (Date.now() >= (this.githubApiRateLimitedUntil ?? 0)) {
        const apiTimeout = createInternalTimeoutController(
          Math.min(baseTimeoutMs, 10_000),
          'GitHub Releases API timed out',
        )
        try {
          const res = await fetch(`https://api.github.com/repos/${repoSlug}/releases?per_page=30`, {
            headers: {
              Accept: 'application/vnd.github+json',
              'User-Agent': 'XPeach-Harness-Updater',
            },
            signal: apiTimeout.signal,
          })
          if (res.ok) {
            const json: unknown = await res.json()
            const parsed = parseGitHubReleasesJson(json, repoSlug)
            if (parsed.length > 0) {
              this.releasesCache = { at: Date.now(), items: parsed }
              return parsed
            }
            lastFailure = 'GitHub Releases API returned no parseable releases'
          } else {
            lastStatus = res.status
            lastFailure = `GitHub Releases API HTTP ${String(res.status)}`
            if (res.status === 403 || res.status === 429) {
              this.githubApiRateLimitedUntil = Date.now() + 5 * 60_000
            }
          }
        } catch (err) {
          lastFailure = err instanceof Error ? err.message : String(err)
        } finally {
          apiTimeout.clear()
        }
      }

      // Rate-limit-free fallback via GitHub's public Atom feed when REST API fails or is throttled.
      const atomTimeout = createInternalTimeoutController(
        baseTimeoutMs,
        'GitHub Releases Atom feed timed out',
      )
      try {
        const atomRes = await fetch(`https://github.com/${repoSlug}/releases.atom`, {
          headers: {
            Accept: 'application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
            'User-Agent': 'XPeach-Harness-Updater',
          },
          signal: atomTimeout.signal,
        })
        if (atomRes.ok) {
          const xml = await atomRes.text()
          const parsed = parseGitHubReleasesAtom(xml, repoSlug)
          if (parsed.length > 0) {
            this.releasesCache = { at: Date.now(), items: parsed }
            return parsed
          }
          lastFailure = 'GitHub Releases Atom feed returned no parseable releases'
        } else {
          lastStatus = atomRes.status
          lastFailure = `GitHub Releases Atom HTTP ${String(atomRes.status)}`
        }
      } catch (err) {
        lastFailure = err instanceof Error ? err.message : String(err)
      } finally {
        atomTimeout.clear()
      }

      if (!force && cached !== undefined) return cached.items
      throw new RemoteError(
        'xpeach/request-failed',
        `无法获取 GitHub 更新列表（${lastFailure}），请检查网络连接或代理设置后重试。`,
        { status: lastStatus, message: lastFailure },
      )
    })().finally(() => {
      if (this.updateCheckInFlight === run) this.updateCheckInFlight = undefined
    })
    this.updateCheckInFlight = run
    void run.catch(() => {})
    return await raceWithAbortSignal(run, signal)
  }

  private skillsRoot(): string {
    return join(this.ownHome(), 'skills')
  }

  private disabledSkillsRoot(): string {
    return join(this.ownHome(), 'skills', '.disabled')
  }

  private disabledSkillsFile(): string {
    return join(dirname(this.keyFile), 'xpeach.skills-disabled.json')
  }

  private readDisabledSkills(): Set<string> {
    if (!existsSync(this.disabledSkillsFile())) return new Set()
    try {
      const parsed: unknown = JSON.parse(readFileSync(this.disabledSkillsFile(), 'utf8'))
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((item): item is string => typeof item === 'string'))
      }
    } catch (_err) { /* ignore */ }
    return new Set()
  }

  private writeDisabledSkills(disabled: Set<string>): void {
    try {
      this.writeState(this.disabledSkillsFile(), JSON.stringify([...disabled]))
    } catch (_err) { /* ignore */ }
  }

  private promptOverridesFile(): string | undefined {
    if (typeof this.keyFile !== 'string' || this.keyFile.length === 0) return undefined
    return join(dirname(this.keyFile), 'xpeach.gateway-inspector.json')
  }

  private readPromptOverrides(): XPeachPromptOverridesConfig {
    if (this.promptOverridesCache !== undefined) return this.promptOverridesCache
    const file = this.promptOverridesFile()
    if (file === undefined || !existsSync(file)) {
      this.promptOverridesCache = DEFAULT_PROMPT_OVERRIDES
      return DEFAULT_PROMPT_OVERRIDES
    }
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
      const normalized = normalizePromptOverridesConfig(parsed)
      this.promptOverridesCache = normalized
      return normalized
    } catch (_err) {
      this.promptOverridesCache = DEFAULT_PROMPT_OVERRIDES
      return DEFAULT_PROMPT_OVERRIDES
    }
  }

  private modelRoutingFile(): string | undefined {
    if (typeof this.keyFile !== 'string' || this.keyFile.length === 0) return undefined
    return join(dirname(this.keyFile), 'xpeach.model-routing.json')
  }

  private readModelRouting(): XPeachModelRoutingState {
    if (this.modelRoutingCache !== undefined) return this.modelRoutingCache
    const file = this.modelRoutingFile()
    if (file === undefined || !existsSync(file)) {
      this.modelRoutingCache = DEFAULT_MODEL_ROUTING_STATE
      return DEFAULT_MODEL_ROUTING_STATE
    }
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
      const normalized = normalizeModelRoutingState(parsed)
      this.modelRoutingCache = normalized
      return normalized
    } catch (_err) {
      this.modelRoutingCache = DEFAULT_MODEL_ROUTING_STATE
      return DEFAULT_MODEL_ROUTING_STATE
    }
  }

  private writeModelRouting(next: XPeachModelRoutingState): void {
    const normalized = normalizeModelRoutingState(next)
    this.modelRoutingCache = normalized
    const file = this.modelRoutingFile()
    if (file !== undefined) {
      this.writeState(file, JSON.stringify(normalized, null, 2))
    }
  }

  private modelsCacheFile(): string | undefined {
    if (typeof this.keyFile !== 'string' || this.keyFile.length === 0) return undefined
    return join(dirname(this.keyFile), 'xpeach.models-cache.json')
  }

  private readModelsCache(): readonly XPeachModel[] {
    if (this.catalogModelsCache !== undefined) return this.catalogModelsCache
    const file = this.modelsCacheFile()
    if (file === undefined || !existsSync(file)) return []
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
      if (!Array.isArray(parsed)) return []
      const models: XPeachModel[] = []
      for (const item of parsed) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
        const obj = item as Record<string, unknown>
        const id = typeof obj['id'] === 'string' ? obj['id'].trim() : ''
        if (id.length === 0) continue
        const groups = Array.isArray(obj['groups'])
          ? obj['groups'].filter((g): g is string => typeof g === 'string' && g.length > 0)
          : undefined
        const endpoints = Array.isArray(obj['supported_endpoint_types'])
          ? obj['supported_endpoint_types'].filter((e): e is string => typeof e === 'string' && e.length > 0)
          : undefined
        models.push({
          id,
          ...(groups !== undefined && groups.length > 0 ? { groups } : {}),
          ...(endpoints !== undefined && endpoints.length > 0 ? { supported_endpoint_types: endpoints } : {}),
        })
      }
      this.catalogModelsCache = models
      return models
    } catch (_err) {
      return []
    }
  }

  private writeModelsCache(models: readonly XPeachModel[]): void {
    this.catalogModelsCache = [...models]
    const file = this.modelsCacheFile()
    if (file !== undefined) {
      try {
        this.writeState(file, JSON.stringify(models, null, 2))
      } catch (_err) { /* best-effort catalog cache */ }
    }
  }

  private async writePiAiProviders(
    settings: {
      update?: (ns: string, patch: object) => Promise<void>
      mutate?: (ns: string, ops: unknown[]) => Promise<unknown>
    },
    existingProviders: Readonly<Record<string, Record<string, unknown>>>,
    providers: Readonly<Record<string, Record<string, unknown>>>,
  ): Promise<void> {
    this.writingPiAiSettings = (this.writingPiAiSettings ?? 0) + 1
    try {
      if (settings.mutate !== undefined) {
        const ops = Object.entries(providers).map(([key, value]) => ({
          op: 'set' as const,
          path: ['providers', key],
          value,
        }))
        await settings.mutate('llm-pi-ai', ops)
      } else if (settings.update !== undefined) {
        await settings.update('llm-pi-ai', { providers: { ...existingProviders, ...providers } })
      }
    } finally {
      this.writingPiAiSettings = Math.max(0, this.writingPiAiSettings - 1)
    }
  }

  private buildPoolsFromState(params: {
    readonly described: unknown
    readonly existingProviders: Readonly<Record<string, Record<string, unknown>>>
    readonly catalogModels: readonly XPeachModel[]
    readonly routing: XPeachModelRoutingState
    readonly metadata: ModelMetadataRegistry | undefined
  }): ReturnType<typeof buildModelPoolsAndProviders> {
    const { described, existingProviders, catalogModels, routing, metadata } = params
    const liveAccountSettings = readAccountSettings(described)
    const inspectorCfg = this.readPromptOverrides()
    const customHeaders: Record<string, string> = {}
    for (const h of inspectorCfg.customHeaders) {
      if (h.enabled && h.key.trim().length > 0 && h.key.toLowerCase() !== 'user-agent') {
        customHeaders[h.key.trim()] = h.value
      }
    }
    const globalReasoning = inspectorCfg.reasoningEffort === 'default'
      ? 'high'
      : (inspectorCfg.reasoningEffort === 'off' ? undefined : inspectorCfg.reasoningEffort)
    const cacheRetention = inspectorCfg.cacheRetention === 'default'
      ? undefined
      : inspectorCfg.cacheRetention
    const fallbackTracking = inspectorCfg.conversationTracking
      && (liveAccountSettings.conversationTracking
        ?? (typeof existingProviders['xpeach']?.['conversationTracking'] === 'boolean' ? existingProviders['xpeach']['conversationTracking'] : undefined)
        ?? unwrapConfigValue(this.liveConfig.conversationTracking)
        ?? true)
    const autoSyncModels = liveAccountSettings.autoSyncModels
      ?? unwrapConfigValue(this.liveConfig.autoSyncModels)
      ?? true
    const defaultModelSvc = this.getOptionalService('agentDefaultModel')
    const currentSel = defaultModelSvc?.currentSelection()
    const activeDefaultModel = currentSel !== undefined
      ? { provider: currentSel.provider, model: currentSel.model }
      : undefined
    const siteBase = (this.activeBaseURL || this.api.siteBaseURL || 'https://fast.xpeach.codes').replace(/\/+$/u, '')
    const defaultBase = (this.baseURL || siteBase).replace(/\/+$/u, '')
    const keyVar = this.keyVar || 'XPEACH_RELAY_KEY'

    return buildModelPoolsAndProviders({
      catalogModels,
      routing,
      resolveCapabilities: m => modelCapabilities(m, metadata),
      activeBaseUrl: siteBase,
      defaultBaseUrl: defaultBase,
      keyVar,
      existingProviders,
      customHeaders,
      globalReasoning,
      cacheRetention,
      fallbackTracking,
      autoSyncModels,
      activeDefaultModel,
    })
  }

  private async computeModelPoolsSnapshot(): Promise<XPeachModelPoolsSnapshot> {
    const settings = this.ctx.get('settings') as { describe?: () => unknown } | undefined
    const described = await settings?.describe?.()
    const existingProviders = readProviderMap(described)
    const cachedModels = this.readModelsCache()
    const fallbackModels = extractModelsFromExistingProviders(existingProviders)
    const catalogModels = cachedModels.length > 0 ? cachedModels : fallbackModels
    const routing = this.readModelRouting()
    const metadata = this.readModelMetadataCache()
    return this.buildPoolsFromState({
      described,
      existingProviders,
      catalogModels,
      routing,
      metadata,
    }).snapshot
  }

  private async applyModelRoutingAndSnapshot(
    routing: XPeachModelRoutingState,
  ): Promise<XPeachModelPoolsSnapshot> {
    const settings = this.ctx.get('settings') as
      | {
        describe?: () => unknown
        update?: (ns: string, patch: object) => Promise<void>
        mutate?: (ns: string, ops: unknown[]) => Promise<unknown>
      }
      | undefined
    const described = await settings?.describe?.()
    const existingProviders = readProviderMap(described)
    const cachedModels = this.readModelsCache()
    const fallbackModels = extractModelsFromExistingProviders(existingProviders)
    const catalogModels = cachedModels.length > 0 ? cachedModels : fallbackModels
    const metadata = this.readModelMetadataCache()
    const built = this.buildPoolsFromState({
      described,
      existingProviders,
      catalogModels,
      routing,
      metadata,
    })
    const providersChanged = Object.entries(built.providers).some(
      ([k, v]) => !deepEqualJson(existingProviders[k] ?? null, v),
    )
    if (providersChanged && settings !== undefined) {
      await this.writePiAiProviders(settings, existingProviders, built.providers)
    }
    const mergedProviders: Record<string, { models?: unknown }> = {
      ...(existingProviders as Record<string, { models?: unknown }>),
      ...(built.providers as Record<string, { models?: unknown }>),
    }
    await this.reconcileDefaultModelSelection(mergedProviders, { forceGroupSwitch: true })
    return await this.computeModelPoolsSnapshot()
  }

  private async reconcileExternalPiAiEdits(): Promise<void> {
    if ((this.writingPiAiSettings ?? 0) > 0) return
    if (this.modelRoutingFile() === undefined) return
    const settings = this.ctx.get('settings') as { describe?: () => unknown } | undefined
    if (settings?.describe === undefined) return
    const described = await settings.describe()
    const existingProviders = readProviderMap(described)
    const current = this.readModelRouting()

    const poolsByModel = new Map<string, XPeachEndpoint[]>()
    type XPeachEndpoint = (typeof ENDPOINT_POOLS)[number]
    for (const pool of ENDPOINT_POOLS) {
      const key = providerKeyForEndpoint(pool)
      const list = existingProviders[key]?.['models']
      if (!Array.isArray(list)) continue
      for (const raw of list) {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) continue
        const id = typeof (raw as { id?: unknown }).id === 'string' ? (raw as { id: string }).id.trim() : ''
        if (id.length === 0) continue
        const seen = poolsByModel.get(id) ?? []
        if (!seen.includes(pool)) seen.push(pool)
        poolsByModel.set(id, seen)
      }
    }
    if (poolsByModel.size === 0) return

    const knownCatalogIds = new Set(this.readModelsCache().map(m => m.id))
    const overrideMap = new Map<string, XPeachEndpoint>(Object.entries(current.endpointOverrides))
    const nextCustomModels = new Set(current.customModels)
    let dirty = false

    for (const [id, pools] of poolsByModel.entries()) {
      if (pools.length === 1 && pools[0] !== undefined) {
        const externalPool = pools[0]
        const recommended = recommendedModelEndpoint({ id })
        const effectiveCurrent = overrideMap.get(id) ?? recommended
        if (externalPool !== effectiveCurrent) {
          if (externalPool === recommended) {
            overrideMap.delete(id)
          } else {
            overrideMap.set(id, externalPool)
          }
          dirty = true
        }
      }
      if (knownCatalogIds.size > 0 && !knownCatalogIds.has(id) && !nextCustomModels.has(id)) {
        nextCustomModels.add(id)
        dirty = true
      }
    }

    const xpeachTracking = existingProviders['xpeach']?.['conversationTracking']
    let nextTracking = current.conversationTracking
    if (typeof xpeachTracking === 'boolean' && xpeachTracking !== (current.conversationTracking ?? true)) {
      nextTracking = xpeachTracking
      dirty = true
    }

    if (dirty) {
      this.writeModelRouting({
        ...current,
        endpointOverrides: Object.fromEntries(overrideMap.entries()),
        customModels: [...nextCustomModels],
        ...(nextTracking !== undefined ? { conversationTracking: nextTracking } : {}),
      })
    }
  }

  private async syncGatewayOverridesToProviders(cfg: XPeachPromptOverridesConfig): Promise<void> {
    if (this.modelRoutingFile() !== undefined) {
      const currentRouting = this.readModelRouting()
      if (currentRouting.conversationTracking !== undefined && currentRouting.conversationTracking !== cfg.conversationTracking) {
        this.writeModelRouting({ ...currentRouting, conversationTracking: cfg.conversationTracking })
      }
    }
    const settings = this.ctx.get('settings') as
      | {
        describe?: () => unknown
        update?: (ns: string, patch: object) => Promise<void>
      }
      | undefined
    if (settings?.describe === undefined || settings.update === undefined) return
    const described = await settings.describe()
    const existingProviders = readProviderMap(described)
    const customHeaderMap: Record<string, string> = {}
    for (const h of cfg.customHeaders) {
      if (h.enabled && h.key.trim().length > 0 && h.key.toLowerCase() !== 'user-agent') {
        customHeaderMap[h.key.trim()] = h.value
      }
    }
    const updated: Record<string, object> = {}
    let changed = false
    for (const [key, provider] of Object.entries(existingProviders)) {
      if (!isAccountModelProvider(key)) continue
      const next: Record<string, unknown> = { ...provider }
      next['conversationTracking'] = cfg.conversationTracking
      if (Object.keys(customHeaderMap).length > 0) {
        next['headers'] = customHeaderMap
      } else {
        delete next['headers']
      }
      if (cfg.reasoningEffort === 'off') {
        delete next['reasoning']
      } else if (cfg.reasoningEffort !== 'default') {
        next['reasoning'] = cfg.reasoningEffort
      } else {
        next['reasoning'] = 'high'
      }
      if (cfg.cacheRetention === 'default') {
        delete next['cacheRetention']
      } else {
        next['cacheRetention'] = cfg.cacheRetention
      }
      updated[key] = next
      changed = true
    }
    if (changed) {
      this.writingPiAiSettings = (this.writingPiAiSettings ?? 0) + 1
      try {
        await settings.update('llm-pi-ai', { providers: updated })
      } finally {
        this.writingPiAiSettings = Math.max(0, this.writingPiAiSettings - 1)
      }
    }
  }

  private mcpPatchPath(): string {
    return join(dirname(this.keyFile), 'cordis.patch.yml')
  }

  private findSkillFolderName(idOrName: string): string | undefined {
    const stripped = idOrName.trim().replace(/^(?:user|agents|project|builtin):/u, '')
    const clean = basename(stripped)
    if (clean.length === 0 || clean === '.' || clean === '..') return undefined
    for (const root of [this.skillsRoot(), this.disabledSkillsRoot()]) {
      if (!existsSync(root)) continue
      if (existsSync(join(root, clean, 'SKILL.md')) || existsSync(join(root, clean, 'SKILL.md.disabled'))) {
        return clean
      }
      let entries: Dirent[] = []
      try { entries = readdirSync(root, { withFileTypes: true }) } catch (_err) { continue }
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue
        const skillMd = existsSync(join(root, entry.name, 'SKILL.md'))
          ? join(root, entry.name, 'SKILL.md')
          : join(root, entry.name, 'SKILL.md.disabled')
        if (!existsSync(skillMd)) continue
        try {
          const normalized = normalizeSkillMarkdown(readFileSync(skillMd, 'utf8'), entry.name)
          if (normalized.name === clean || normalized.name === sanitizeSkillName(clean)) {
            return entry.name
          }
        } catch (_err) { /* ignore */ }
      }
    }
    return undefined
  }

  private notifySkillsChanged(): void {
    const emitEvent = this.ctx.emit.bind(this.ctx) as (name: string, ...args: never[]) => void
    try { emitEvent('skill/changed') } catch (_err) { /* contained */ }
    try { emitEvent('skills/change') } catch (_err) { /* contained */ }
  }

  private getOptionalService(name: 'tools'): LiveToolsService | undefined
  private getOptionalService(name: 'skill' | 'skills'): LiveSkillService | undefined
  private getOptionalService(name: 'agentDefaultModel'): LiveAgentDefaultModelService | undefined
  private getOptionalService(name: 'sessionController'): LiveSessionControllerService | undefined
  private getOptionalService(name: 'sessionPersistence'): ReconcileSessionPersistence | undefined
  private getOptionalService(name: 'sessionProjectionCache'): ReconcileProjectionCache | undefined
  private getOptionalService(name: 'workspaceRegistry'): ReconcileWorkspaceRegistry | undefined
  private getOptionalService(name: string): unknown {
    const getService = this.ctx.get.bind(this.ctx) as (serviceName: string) => unknown
    return getService(name)
  }
}

export default XPeachAccount

/** Capability and context-window overrides for one exact model identifier. */
export interface ModelMetadataEntry {
  /** Maximum input context window in tokens. */
  readonly contextWindow?: number
  /** Maximum completion output tokens. */
  readonly maxTokens?: number
  /** Accepted input modalities (`['text', 'image']` or `['text']`). */
  readonly input?: readonly ('text' | 'image')[]
  /** Default reasoning effort when the user has not chosen a level. */
  readonly reasoning?: 'off' | 'low' | 'medium' | 'high'
}

/** Pattern-matched capability and context-window rule for a model family. */
export interface ModelMetadataRule extends ModelMetadataEntry {
  /** Case-insensitive regular expression pattern matched against the model identifier. */
  readonly pattern: string
}

/** Syncable model capability and context-window registry payload. */
export interface ModelMetadataRegistry {
  /** Schema version of the metadata registry. */
  readonly version?: number
  /** ISO-8601 timestamp when the registry was last updated. */
  readonly updatedAt?: string
  /** Fallback capability defaults when no exact or pattern entry matches. */
  readonly defaults?: ModelMetadataEntry
  /** Exact model identifier map (`modelId.toLowerCase()` -> metadata). */
  readonly models?: Readonly<Record<string, ModelMetadataEntry>>
  /** Ordered regular expression rules evaluated when `models` has no exact match. */
  readonly rules?: readonly ModelMetadataRule[]
}

/**
 * Default reasoning effort map advertised for XPeach chat models.
 *
 * Includes `'off': null` (provider native default without reasoning override)
 * alongside `'low'`, `'medium'`, and `'high'`, while the provider route sets
 * `reasoning: 'high'` so sessions default to `'high'` unless the user selects
 * `'off'` or another effort level.
 */
export const DEFAULT_REASONING_EFFORTS = {
  off: null,
  low: 'low',
  medium: 'medium',
  high: 'high',
} as const

/** Resolved model capabilities for `llm-pi-ai` and UI badges. */
export interface ResolvedModelCapabilities {
  /** Maximum input context window in tokens. */
  readonly contextWindow: number
  /** Maximum output completion tokens. */
  readonly maxTokens: number
  /** Accepted input modalities (`['text', 'image']` by default for chat models). */
  readonly input: ('text' | 'image')[]
  /** Reasoning effort wire-value mapping. */
  readonly reasoningEfforts: {
    readonly off: null
    readonly low: string
    readonly medium: string
    readonly high: string
  }
  /** Default reasoning effort level (`'high'`). */
  readonly defaultReasoningEffort: 'high'
}

const NON_VISION_MODEL_PATTERN = new RegExp(
  '(?:^|[-_./])(embedding|embeddings|text-embedding|rerank|reranker|bge|whisper|tts|moderation)(?:$|[-_./])',
  'iu',
)

const TEXT_ONLY_CHAT_MODEL_PATTERN = new RegExp(
  '(?:^|/)(?:deepseek-(?:r1|v3|chat|reasoner|coder)|qwen3-coder|qwq-|kimi-k2-(?:0711|0905)|glm-(?:5|4\\.[567]|4-long)|minimax-m[12])(?:$|[-_.:])',
  'iu',
)

const BUILTIN_MODEL_RULES: readonly { readonly regex: RegExp; readonly contextWindow: number; readonly maxTokens: number }[] = [
  // Explicit token-window suffixes in model IDs
  { regex: /(?:^|[-_.])2m(?:$|[-_.])/iu, contextWindow: 2_097_152, maxTokens: 65_536 },
  { regex: /(?:^|[-_.])(?:1m|1000k|1024k)(?:$|[-_.])/iu, contextWindow: 1_048_576, maxTokens: 65_536 },
  { regex: /(?:^|[-_.])512k(?:$|[-_.])/iu, contextWindow: 524_288, maxTokens: 65_536 },
  { regex: /(?:^|[-_.])400k(?:$|[-_.])/iu, contextWindow: 400_000, maxTokens: 128_000 },
  { regex: /(?:^|[-_.])256k(?:$|[-_.])/iu, contextWindow: 262_144, maxTokens: 65_536 },
  { regex: /(?:^|[-_.])200k(?:$|[-_.])/iu, contextWindow: 200_000, maxTokens: 64_000 },
  { regex: /(?:^|[-_.])128k(?:$|[-_.])/iu, contextWindow: 131_072, maxTokens: 32_768 },
  { regex: /(?:^|[-_.])64k(?:$|[-_.])/iu, contextWindow: 65_536, maxTokens: 16_384 },
  { regex: /(?:^|[-_.])32k(?:$|[-_.])/iu, contextWindow: 32_768, maxTokens: 8_192 },

  // OpenAI GPT-5, GPT-6 & Codex families (400K context, 128K output)
  { regex: /(?:^|\/)(?:gpt-[56]|codex)/iu, contextWindow: 400_000, maxTokens: 128_000 },
  // OpenAI GPT-4.1 family (1M context, 32K output)
  { regex: /(?:^|\/)gpt-4\.1/iu, contextWindow: 1_047_576, maxTokens: 32_768 },
  // OpenAI o-series reasoning models (200K context, 100K output)
  { regex: /(?:^|\/)o[134](?:$|[-_.])/iu, contextWindow: 200_000, maxTokens: 100_000 },
  // OpenAI GPT-4o & GPT-4 Turbo (128K context)
  { regex: /(?:^|\/)(?:chat)?gpt-4(?:o|-turbo)/iu, contextWindow: 128_000, maxTokens: 16_384 },

  // Anthropic Claude 5 / 4.5 / 4.6 / 4 / 3.7 / 3.5 / 3 (200K context, up to 64K-128K output)
  { regex: /(?:^|\/)claude-(?:opus-[45]|sonnet-[45]|fable-[45])/iu, contextWindow: 200_000, maxTokens: 128_000 },
  { regex: /(?:^|\/)claude-/iu, contextWindow: 200_000, maxTokens: 64_000 },

  // Google Gemini (1.5 Pro = 2M, Gemini 2.0 / 2.5 / 3 = 1M)
  { regex: /(?:^|\/)gemini-1\.5-pro/iu, contextWindow: 2_097_152, maxTokens: 65_536 },
  { regex: /(?:^|\/)gemini-/iu, contextWindow: 1_048_576, maxTokens: 65_536 },

  // DeepSeek (V4 / Flash / R2 = 1M, V3 / R1 / Reasoner / Chat = 128K)
  { regex: /(?:^|\/)deepseek-(?:v4|r2|flash|chat-v4|reasoner-v4)/iu, contextWindow: 1_048_576, maxTokens: 65_536 },
  { regex: /(?:^|\/)deepseek-(?:r1|reasoner)/iu, contextWindow: 131_072, maxTokens: 65_536 },
  { regex: /(?:^|\/)deepseek-/iu, contextWindow: 131_072, maxTokens: 32_768 },

  // SWE coding models (256K context)
  { regex: /(?:^|\/)swe-/iu, contextWindow: 262_144, maxTokens: 65_536 },

  // xAI Grok (Grok 4 = 256K, Grok 3/2 = 128K)
  { regex: /(?:^|\/)grok-4/iu, contextWindow: 262_144, maxTokens: 65_536 },
  { regex: /(?:^|\/)grok-/iu, contextWindow: 131_072, maxTokens: 32_768 },

  // Moonshot Kimi (Kimi K2 / latest = 256K, Moonshot v1 = 128K)
  { regex: /(?:^|\/)kimi-(?:k2|latest)/iu, contextWindow: 262_144, maxTokens: 65_536 },
  { regex: /(?:^|\/)(?:kimi|moonshot)/iu, contextWindow: 131_072, maxTokens: 32_768 },

  // Alibaba Qwen (Qwen3 Coder Plus / Qwen Long / Qwen Turbo = 1M, Qwen3 / QwQ = 128K)
  { regex: /(?:^|\/)qwen(?:3-coder-plus|-long|-turbo)/iu, contextWindow: 1_048_576, maxTokens: 65_536 },
  { regex: /(?:^|\/)(?:qwen|qwq)/iu, contextWindow: 131_072, maxTokens: 32_768 },

  // Zhipu GLM (GLM-4-Long = 1M, GLM-5 / GLM-4.5 / 4.6 / 4.7 = 200K, others = 128K)
  { regex: /(?:^|\/)glm-4-long/iu, contextWindow: 1_048_576, maxTokens: 32_768 },
  { regex: /(?:^|\/)glm-(?:5|4\.[567])/iu, contextWindow: 200_000, maxTokens: 65_536 },
  { regex: /(?:^|\/)glm-/iu, contextWindow: 131_072, maxTokens: 32_768 },

  // MiniMax (Text-01 / 01 / abab6.5s = 1M, M1 / M2 = 200K)
  { regex: /(?:^|\/)(?:minimax-(?:text-)?01|abab6\.5s)/iu, contextWindow: 1_048_576, maxTokens: 65_536 },
  { regex: /(?:^|\/)minimax/iu, contextWindow: 200_000, maxTokens: 65_536 },

  // ByteDance Doubao / Seed (Seed = 256K, Doubao = 128K)
  { regex: /(?:^|\/)(?:doubao-seed|seed-)/iu, contextWindow: 262_144, maxTokens: 65_536 },
  { regex: /(?:^|\/)doubao-/iu, contextWindow: 131_072, maxTokens: 32_768 },

  // Meta Llama (Llama 4 Scout = 1M, Llama 4 = 256K, Llama 3 = 128K)
  { regex: /(?:^|\/)llama-4-scout/iu, contextWindow: 1_048_576, maxTokens: 32_768 },
  { regex: /(?:^|\/)llama-4/iu, contextWindow: 262_144, maxTokens: 32_768 },
  { regex: /(?:^|\/)llama-/iu, contextWindow: 131_072, maxTokens: 32_768 },
]

/** Upstream or local model fields inspected when resolving capabilities. */
export interface ModelCapabilityInput {
  /** Model identifier. */
  readonly id: string
  /** Optional context window in tokens. */
  readonly contextWindow?: number
  /** Optional snake_case context window from upstream `/v1/models`. */
  readonly context_window?: number
  /** Optional `context_length` field from upstream `/v1/models`. */
  readonly context_length?: number
  /** Optional `max_input_tokens` field from upstream `/v1/models`. */
  readonly max_input_tokens?: number
  /** Optional `max_context_length` field from upstream `/v1/models`. */
  readonly max_context_length?: number
  /** Optional maximum completion output tokens. */
  readonly maxTokens?: number
  /** Optional snake_case maximum completion output tokens. */
  readonly max_tokens?: number
  /** Optional `max_output_tokens` field from upstream `/v1/models`. */
  readonly max_output_tokens?: number
  /** Optional `max_completion_tokens` field from upstream `/v1/models`. */
  readonly max_completion_tokens?: number
  /** Optional accepted input modalities. */
  readonly inputModalities?: readonly ('text' | 'image')[]
}

function extractUpstreamNumber(
  model: ModelCapabilityInput,
  keys: readonly (keyof ModelCapabilityInput)[],
): number | undefined {
  for (const key of keys) {
    const val = model[key]
    if (typeof val === 'number' && Number.isFinite(val) && val >= 1024) {
      return Math.trunc(val)
    }
  }
  return undefined
}

function lookupRegistryEntry(id: string, registry?: ModelMetadataRegistry): ModelMetadataEntry | undefined {
  if (registry === undefined) return undefined
  const lower = id.trim().toLowerCase()
  const stripped = lower.includes('/') ? lower.slice(lower.lastIndexOf('/') + 1) : lower
  const exact = registry.models?.[lower] ?? registry.models?.[stripped] ?? registry.models?.[id.trim()]
  if (exact !== undefined) return exact
  if (registry.rules !== undefined) {
    for (const rule of registry.rules) {
      if (typeof rule.pattern !== 'string' || rule.pattern.length === 0) continue
      try {
        const re = new RegExp(rule.pattern, 'iu')
        if (re.test(id) || re.test(stripped)) return rule
      } catch (_err) {
        // Ignore malformed dynamic regex rules.
      }
    }
  }
  return undefined
}

/**
 * Input modalities a catalogue entry accepts.
 *
 * Multimodal chat models advertise `['text', 'image']` while known text-only
 * chat/coding/reasoning models and utility endpoints (embeddings, rerankers,
 * speech/audio) stay `['text']`.
 * @param model - one catalogue entry.
 * @param registry - optional synced model metadata registry.
 * @returns the modalities the model accepts.
 */
export function modelInputs(
  model: ModelCapabilityInput,
  registry?: ModelMetadataRegistry,
): ('text' | 'image')[] {
  if (model.inputModalities !== undefined && model.inputModalities.length > 0) {
    return [...model.inputModalities]
  }
  if (NON_VISION_MODEL_PATTERN.test(model.id)) {
    return ['text']
  }
  const matched = lookupRegistryEntry(model.id, registry)
  if (matched?.input !== undefined && matched.input.length > 0) {
    return [...matched.input]
  }
  if (TEXT_ONLY_CHAT_MODEL_PATTERN.test(model.id)) {
    return ['text']
  }
  if (registry?.defaults?.input !== undefined && registry.defaults.input.length > 0) {
    return [...registry.defaults.input]
  }
  return ['text', 'image']
}

/**
 * Resolve the context window (in tokens) for a model using a 3-tier strategy:
 * 1. Explicit upstream `/v1/models` fields (`contextWindow`, `context_window`, `context_length`, `max_input_tokens`)
 * 2. Synced GitHub / cached `ModelMetadataRegistry` exact or regex rule match
 * 3. Built-in official model family specification table (fallback `200000`)
 *
 * @param model - model record with `id` and optional upstream token fields.
 * @param registry - optional synced model metadata registry.
 * @returns resolved context window in tokens.
 */
export function modelContextWindow(
  model: ModelCapabilityInput,
  registry?: ModelMetadataRegistry,
): number {
  const upstream = extractUpstreamNumber(model, [
    'contextWindow',
    'context_window',
    'context_length',
    'max_input_tokens',
    'max_context_length',
  ])
  if (upstream !== undefined) return upstream

  const matched = lookupRegistryEntry(model.id, registry)
  if (typeof matched?.contextWindow === 'number' && matched.contextWindow >= 1024) {
    return matched.contextWindow
  }

  for (const rule of BUILTIN_MODEL_RULES) {
    if (rule.regex.test(model.id)) {
      return rule.contextWindow
    }
  }
  if (typeof registry?.defaults?.contextWindow === 'number' && registry.defaults.contextWindow >= 1024) {
    return registry.defaults.contextWindow
  }
  return 200_000
}

/**
 * Resolve the maximum output completion tokens for a model.
 *
 * @param model - model record with `id` and optional upstream token fields.
 * @param registry - optional synced model metadata registry.
 * @returns resolved maximum completion tokens.
 */
export function modelMaxTokens(
  model: ModelCapabilityInput,
  registry?: ModelMetadataRegistry,
): number {
  const upstream = extractUpstreamNumber(model, [
    'maxTokens',
    'max_tokens',
    'max_output_tokens',
    'max_completion_tokens',
  ])
  if (upstream !== undefined) return upstream

  const matched = lookupRegistryEntry(model.id, registry)
  if (typeof matched?.maxTokens === 'number' && matched.maxTokens >= 512) {
    return matched.maxTokens
  }

  for (const rule of BUILTIN_MODEL_RULES) {
    if (rule.regex.test(model.id)) {
      return rule.maxTokens
    }
  }
  if (typeof registry?.defaults?.maxTokens === 'number' && registry.defaults.maxTokens >= 512) {
    return registry.defaults.maxTokens
  }
  return 64_000
}

/**
 * Resolve the full capability bundle (`contextWindow`, `maxTokens`, `input`,
 * `reasoningEfforts`, and `defaultReasoningEffort: 'high'`) for one model.
 *
 * @param model - model record with `id` and optional upstream fields.
 * @param registry - optional synced model metadata registry.
 * @returns resolved capabilities ready for `llm-pi-ai` settings and UI display.
 */
export function modelCapabilities(
  model: ModelCapabilityInput,
  registry?: ModelMetadataRegistry,
): ResolvedModelCapabilities {
  return {
    contextWindow: modelContextWindow(model, registry),
    maxTokens: modelMaxTokens(model, registry),
    input: modelInputs(model, registry),
    reasoningEfforts: DEFAULT_REASONING_EFFORTS,
    defaultReasoningEffort: 'high',
  }
}

/**
 * Format a numeric token context window into a compact badge label (`200K`, `1M`, `256K`, `128K`).
 *
 * @param contextWindow - token count.
 * @returns compact human-readable badge string.
 */
export function formatContextWindow(contextWindow: number): string {
  if (!Number.isFinite(contextWindow) || contextWindow <= 0) return '200K'
  if (contextWindow >= 1_000_000) {
    const binaryM = contextWindow / 1_048_576
    if (Math.abs(binaryM - Math.round(binaryM)) < 0.08) {
      return `${String(Math.round(binaryM))}M`
    }
    const decimalM = contextWindow / 1_000_000
    return `${decimalM.toFixed(1).replace(/\.0$/u, '')}M`
  }
  if (contextWindow % 1024 === 0) {
    const binaryK = contextWindow / 1024
    if (binaryK === 16 || binaryK === 32 || binaryK === 64 || binaryK === 128 || binaryK === 256 || binaryK === 512) {
      return `${String(binaryK)}K`
    }
  }
  return `${String(Math.round(contextWindow / 1000))}K`
}

/**
 * Validate and normalize a parsed JSON value into a `ModelMetadataRegistry`.
 *
 * @param raw - untrusted parsed JSON value.
 * @returns normalized registry or `undefined` when invalid.
 */
export function parseModelMetadataRegistry(raw: unknown): ModelMetadataRegistry | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const obj = raw as Record<string, unknown>
  const modelsRaw = obj['models']
  const rulesRaw = obj['rules']
  const defaultsRaw = obj['defaults'] ?? obj['default']
  const models: Record<string, ModelMetadataEntry> = {}
  if (typeof modelsRaw === 'object' && modelsRaw !== null && !Array.isArray(modelsRaw)) {
    for (const [key, val] of Object.entries(modelsRaw as Record<string, unknown>)) {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const entry = val as Record<string, unknown>
        models[key.toLowerCase()] = {
          ...(typeof entry['contextWindow'] === 'number' ? { contextWindow: entry['contextWindow'] } : {}),
          ...(typeof entry['maxTokens'] === 'number' ? { maxTokens: entry['maxTokens'] } : {}),
          ...(Array.isArray(entry['input'])
            ? { input: entry['input'].filter((i): i is 'text' | 'image' => i === 'text' || i === 'image') }
            : {}),
        }
      }
    }
  }
  const rules: ModelMetadataRule[] = []
  if (Array.isArray(rulesRaw)) {
    for (const item of rulesRaw) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const entry = item as Record<string, unknown>
        if (typeof entry['pattern'] === 'string' && entry['pattern'].length > 0) {
          rules.push({
            pattern: entry['pattern'],
            ...(typeof entry['contextWindow'] === 'number' ? { contextWindow: entry['contextWindow'] } : {}),
            ...(typeof entry['maxTokens'] === 'number' ? { maxTokens: entry['maxTokens'] } : {}),
            ...(Array.isArray(entry['input'])
              ? { input: entry['input'].filter((i): i is 'text' | 'image' => i === 'text' || i === 'image') }
              : {}),
          })
        }
      }
    }
  }
  const defaults: ModelMetadataEntry | undefined =
    typeof defaultsRaw === 'object' && defaultsRaw !== null && !Array.isArray(defaultsRaw)
      ? {
        ...(typeof (defaultsRaw as Record<string, unknown>)['contextWindow'] === 'number'
          ? { contextWindow: (defaultsRaw as Record<string, unknown>)['contextWindow'] as number }
          : {}),
        ...(typeof (defaultsRaw as Record<string, unknown>)['maxTokens'] === 'number'
          ? { maxTokens: (defaultsRaw as Record<string, unknown>)['maxTokens'] as number }
          : {}),
        ...(Array.isArray((defaultsRaw as Record<string, unknown>)['input'])
          ? { input: ((defaultsRaw as Record<string, unknown>)['input'] as unknown[]).filter((i): i is 'text' | 'image' => i === 'text' || i === 'image') }
          : {}),
      }
      : undefined
  return {
    ...(typeof obj['version'] === 'number' ? { version: obj['version'] } : {}),
    ...(typeof obj['updatedAt'] === 'string' ? { updatedAt: obj['updatedAt'] } : {}),
    ...(defaults !== undefined ? { defaults } : {}),
    models,
    rules,
  }
}

function extractSettingsEntries(described: unknown): readonly { ns?: string; value?: unknown }[] {
  if (Array.isArray(described)) return described as readonly { ns?: string; value?: unknown }[]
  const namespaces = (described as { namespaces?: unknown } | null | undefined)?.namespaces
  return Array.isArray(namespaces) ? namespaces as readonly { ns?: string; value?: unknown }[] : []
}

function readProviderMap(described: unknown): Record<string, Record<string, unknown>> {
  const section = extractSettingsEntries(described).find(ns => ns.ns === 'llm-pi-ai')
  const providers = (section?.value as { providers?: unknown } | null | undefined)?.providers
  if (typeof providers !== 'object' || providers === null || Array.isArray(providers)) return {}
  const out: Record<string, Record<string, unknown>> = {}
  for (const [key, val] of Object.entries(providers as Record<string, unknown>)) {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      out[key] = val as Record<string, unknown>
    }
  }
  return out
}

function readAccountSettings(described: unknown): {
  protocolPreference?: ModelProtocolPreference
  enabledFamilies?: readonly string[]
  conversationTracking?: boolean
  autoSyncModels?: boolean
  timeoutMs?: number
  watchModels?: readonly string[]
} {
  const section = extractSettingsEntries(described).find(ns => ns.ns === 'xpeach-account' || ns.ns === 'xpeach')
  const rawValue = section?.value
  if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) return {}
  const value = rawValue as Record<string, unknown>
  const pref = value['protocolPreference']
  const families = value['enabledFamilies']
  const tracking = value['conversationTracking']
  const autoSync = value['autoSyncModels']
  const timeout = value['timeoutMs']
  const watched = value['watchModels']
  return {
    ...(pref === 'compatible' || pref === 'native' || pref === 'auto' ? { protocolPreference: pref } : {}),
    ...(Array.isArray(families)
      ? { enabledFamilies: families.filter((f): f is string => typeof f === 'string') }
      : {}),
    ...(typeof tracking === 'boolean' ? { conversationTracking: tracking } : {}),
    ...(typeof autoSync === 'boolean' ? { autoSyncModels: autoSync } : {}),
    ...(typeof timeout === 'number' && Number.isFinite(timeout) && timeout >= 1000 ? { timeoutMs: timeout } : {}),
    ...(Array.isArray(watched)
      ? { watchModels: watched.filter((w): w is string => typeof w === 'string') }
      : {}),
  }
}

/**
 * Provider keys present in a settings describe payload.
 *
 * The catalogue sync owns only the `xpeach*` keys, so it needs the live set to
 * tell which of its own older writes to retire; a payload it cannot read simply
 * yields no keys and retires nothing.
 * @param described - settings describe result, or undefined when unavailable.
 * @returns provider keys, or an empty list.
 */
export function readProviderKeys(described: unknown): string[] {
  return Object.keys(readProviderMap(described))
}

/** Wire protocol selection strategy for catalog models. */
export type ModelProtocolPreference = 'compatible' | 'native' | 'auto'

/**
 * Check whether a model identifier belongs to the Anthropic Claude family.
 *
 * @param id - Model identifier to inspect.
 * @returns `true` when the identifier names a Claude model.
 */
export function isAnthropicClaudeModel(id: string | undefined): boolean {
  if (typeof id !== 'string') return false
  const normalized = id.trim().toLowerCase()
  return /(?:^|\/|[-_])claude[-_0-9]/u.test(normalized) || normalized === 'claude'
}

/**
 * Pick the wire protocol for one `/v1/models` entry.
 *
 * Anthropic Claude models (`claude-*`) use `anthropic-messages` (`POST /v1/messages`)
 * unless `preference === 'compatible'` and the route explicitly advertises only
 * `'openai'` without `'anthropic'`.
 *
 * @param model - one catalogue entry.
 * @param preference - which wire to favour when the route offers several.
 * @returns a protocol identifier the pi-ai adapter accepts.
 */
export function modelProtocol(
  model: { id?: string; supported_endpoint_types?: readonly string[] },
  preference: ModelProtocolPreference = 'compatible',
): 'openai-responses' | 'anthropic-messages' | 'openai-completions' {
  const offered = new Set(model.supported_endpoint_types ?? [])
  if (isAnthropicClaudeModel(model.id)) {
    if (preference === 'compatible' && offered.has('openai') && !offered.has('anthropic')) {
      return 'openai-completions'
    }
    return 'anthropic-messages'
  }
  if (preference === 'native') {
    if (offered.has('openai-response')) return 'openai-responses'
    if (offered.has('anthropic')) return 'anthropic-messages'
    return 'openai-completions'
  }
  if (preference === 'auto') {
    if (offered.has('openai')) return 'openai-completions'
    if (offered.has('openai-response')) return 'openai-responses'
    if (offered.has('anthropic')) return 'anthropic-messages'
    return 'openai-completions'
  }
  if (offered.has('openai') || offered.size === 0) return 'openai-completions'
  if (offered.has('openai-response')) return 'openai-responses'
  return 'anthropic-messages'
}

/** Wire protocols a model can be mounted under, keyed to llm-pi-ai provider buckets. */
export type XPeachModelEndpoint = 'openai-completions' | 'openai-responses' | 'anthropic-messages'

/**
 * Every wire protocol a catalog entry supports — the model is mounted under
 * each of them so the picker can select the same model on the endpoint that
 * actually serves it instead of forcing one shared endpoint for all models.
 *
 * @param model - one catalogue entry.
 * @returns protocol identifiers the pi-ai adapter accepts.
 */
export function modelEndpoints(
  model: { id?: string; supported_endpoint_types?: readonly string[] },
): readonly XPeachModelEndpoint[] {
  const offered = new Set(model.supported_endpoint_types ?? [])
  const out: XPeachModelEndpoint[] = []
  if (offered.has('openai') || offered.size === 0) out.push('openai-completions')
  if (offered.has('openai-response')) out.push('openai-responses')
  if (offered.has('anthropic')) out.push('anthropic-messages')
  if (out.length === 0) out.push('openai-completions')
  return out
}

function moveDirectory(src: string, dst: string): void {
  if (existsSync(dst)) {
    try { rmSync(dst, { recursive: true, force: true }) } catch (_err) { /* ignore */ }
  }
  try {
    renameSync(src, dst)
  } catch (_err) {
    cpSync(src, dst, { recursive: true })
    rmSync(src, { recursive: true, force: true })
  }
}
