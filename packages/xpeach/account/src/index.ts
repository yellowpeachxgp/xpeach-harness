/**
 * XPeach (New API) account Remote owner: exposes the calling credential's own
 * usage, model catalog, session management, and site-administration surfaces
 * to Harness clients over the generated `xpeach` namespace.
 * @module @xpeach/xph-account
 */

import {
  cpSync,
  type Dirent,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { Context, Service } from '@xpeach/xph-cordis'
import z from '@xpeach/xph-schemastery'
import { Remote, RemoteError, TypertRemoteService } from '@xpeach/xph-typert-protocol'
import { credentialRef, type CredentialRef } from '@xpeach/xph-credentials'
import type { JsonValue } from '@xpeach/xph-util-values'
import { launchEnvironmentOf } from '@xpeach/xph-launch-environment'
import { XPeachApi, validateSsoBaseUrl, validateVerificationUrl } from './api.ts'
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
import {
  inspectMacosInstallerStatus,
  runMacosInstallerAction,
} from './macos-installer.ts'
import type {
  XPeachAssetImportResult,
  XPeachConversationImportResult,
  XPeachMacosInstallerActionRequest,
  XPeachMacosInstallerActionResult,
  XPeachMacosInstallerStatus,
  XPeachMcpDeleteRequest,
  XPeachMcpItem,
  XPeachMcpSaveRequest,
  XPeachMcpSnapshot,
  XPeachMcpToggleRequest,
  XPeachOnboardingScan,
  XPeachRulesSaveRequest,
  XPeachSkillDeleteRequest,
  XPeachSkillItem,
  XPeachSkillSaveRequest,
  XPeachSkillsSnapshot,
  XPeachSkillToggleRequest,
  XPeachSourceId,
  XPeachSsoBridgePayload,
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
  XPeachPlaygroundChunk,
} from './types.ts'

export type * from './types.ts'
export {
  buildMacosPkgInstaller,
  inspectMacosInstallerStatus,
  runMacosInstallerAction,
  type MacosInstallerOptions,
} from './macos-installer.ts'
export { validateSsoBaseUrl, validateVerificationUrl } from './api.ts'

declare module '@xpeach/xph-typert-protocol' {
  interface RemoteErrorDetailsMap {
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

interface ReconcileSessionHeader {
  readonly id: string
  readonly createdAt: number | string
  readonly cwd?: string
}

interface ReconcileSessionSnapshot {
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

interface LiveSkillService {
  list(): readonly {
    readonly name: string
    readonly description: string
    readonly location: string
  }[]
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
  readonly expiresIn?: number | undefined
  readonly user?: {
    readonly id?: string | undefined
    readonly username?: string | null | undefined
    readonly email?: string | null | undefined
    readonly name?: string | null | undefined
    readonly picture?: string | null | undefined
  } | undefined
  readonly peachcodeUserId?: number | undefined
  readonly boundAt?: number | undefined
}

interface DeepSeekAccountAttemptSnapshot {
  readonly id: string
  readonly phase: 'waiting-browser' | 'exchanging' | 'succeeded' | 'failed' | 'cancelled'
  readonly authorizeUrl?: string | undefined
  readonly expiresAt?: number | undefined
  readonly error?: {
    readonly code: 'invalid_state' | 'access_denied' | 'timeout' | 'token_exchange_failed' | 'browser_open_failed' | 'callback_listen_failed'
    readonly message: string
  } | undefined
}

interface DeepSeekAccountStateSnapshot {
  readonly status: 'signed-out' | 'signing-in' | 'credential-stored'
  readonly links: {
    readonly usageUrl: string
    readonly topUpUrl: string
  }
  readonly attempt?: DeepSeekAccountAttemptSnapshot | undefined
}

/**
 * Cordis `deepseekAccount` service provider backed by XPeach SSO Device Flow
 * and the PeachCode (NewAPI) credential bridge.
 */
class XPeachDeepSeekAccount extends Service {
  private readonly account: XPeachAccount
  private attempt: DeepSeekAccountAttemptSnapshot | undefined
  private attemptAbort: AbortController | undefined
  private readonly watchers = new Set<(identityChanged: boolean) => void>()

  constructor(ctx: Context, account: XPeachAccount) {
    super(ctx, 'deepseekAccount')
    this.account = account
  }

  notifyWatchers(identityChanged: boolean): void {
    for (const notify of this.watchers) {
      try {
        notify(identityChanged)
      } catch (_err) { /* ignore watcher error */ }
    }
  }

  onLocalCredentialsRevoked(reason: 'revoked' | 'banned' | 'signed-out' | 'expired'): void {
    if (this.attempt?.phase === 'waiting-browser') {
      this.attemptAbort?.abort()
    }
    this.attempt = reason === 'signed-out'
      ? undefined
      : {
        id: this.attempt?.id ?? `revoked-${String(Date.now())}`,
        phase: 'failed',
        error: {
          code: 'access_denied',
          message: reason === 'banned'
            ? '您的 XPeach 账号已被停用或封禁，本地凭证已安全清除。'
            : '您的 XPeach 登录会话已过期或被吊销，请重新登录。',
        },
      }
    this.notifyWatchers(true)
  }

  getState(): DeepSeekAccountStateSnapshot {
    const isBound = this.account.isBound()
    const siteRoot = this.account.currentSiteRoot()
    const status = isBound
      ? 'credential-stored'
      : this.attempt?.phase === 'waiting-browser' || this.attempt?.phase === 'exchanging'
        ? 'signing-in'
        : 'signed-out'
    return {
      status,
      links: {
        usageUrl: `${siteRoot}/console`,
        topUpUrl: `${siteRoot}/console/topup`,
      },
      ...(this.attempt !== undefined ? { attempt: this.attempt } : {}),
    }
  }

  async startSignIn(
    client?: string,
    _callbackOrigin?: string,
    _loginSource?: string,
  ): Promise<DeepSeekAccountStateSnapshot> {
    if (this.attempt?.phase === 'waiting-browser') {
      this.attemptAbort?.abort()
    }
    const attemptId = `sso-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`
    const abortController = new AbortController()
    this.attemptAbort = abortController

    const clientLabel = client !== undefined && client.trim().length > 0
      ? `XPeach Harness (${client.trim()})`
      : `XPeach Harness (${process.platform})`

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
      return this.getState()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.attempt = {
        id: attemptId,
        phase: 'failed',
        error: {
          code: 'token_exchange_failed',
          message: msg,
        },
      }
      this.notifyWatchers(false)
      return this.getState()
    }
  }

  private async pollDeviceAttempt(
    attemptId: string,
    deviceCode: string,
    intervalSec: number,
    signal: AbortSignal,
  ): Promise<void> {
    const intervalMs = Math.max(1500, intervalSec * 1000)
    const isAborted = (): boolean => signal.aborted
    const currentAttempt = (): DeepSeekAccountAttemptSnapshot | undefined => this.attempt
    while (!isAborted() && currentAttempt()?.id === attemptId && currentAttempt()?.phase === 'waiting-browser') {
      const expiresAt = currentAttempt()?.expiresAt
      if (expiresAt !== undefined && Date.now() >= expiresAt) {
        this.attempt = {
          id: attemptId,
          phase: 'failed',
          error: {
            code: 'timeout',
            message: 'SSO 设备授权已超时，请重新发起登录。',
          },
        }
        this.notifyWatchers(false)
        return
      }
      await new Promise<void>((res) => {
        const timer = setTimeout(res, intervalMs)
        timer.unref()
      })
      if (isAborted() || currentAttempt()?.id !== attemptId) return
      try {
        const polled = await this.account.ssoDevicePollOp({ deviceCode }, signal)
        if (polled.status === 'pending') continue
        if (polled.status === 'approved') {
          this.attempt = { id: attemptId, phase: 'succeeded' }
          this.notifyWatchers(true)
          return
        }
        this.attempt = {
          id: attemptId,
          phase: 'failed',
          error: {
            code: polled.status === 'expired'
              ? 'timeout'
              : polled.status === 'denied'
                ? 'access_denied'
                : 'token_exchange_failed',
            message: polled.message ?? 'SSO 设备授权未通过',
          },
        }
        this.notifyWatchers(false)
        return
      } catch (err) {
        if (isAborted()) return
        const msg = err instanceof Error ? err.message : String(err)
        this.attempt = {
          id: attemptId,
          phase: 'failed',
          error: {
            code: 'token_exchange_failed',
            message: msg,
          },
        }
        this.notifyWatchers(false)
        return
      }
    }
  }

  cancelSignIn(id?: string): DeepSeekAccountStateSnapshot {
    if (
      this.attempt !== undefined
      && this.attempt.phase === 'waiting-browser'
      && (id === undefined || this.attempt.id === id)
    ) {
      this.attemptAbort?.abort()
      this.attempt = { id: this.attempt.id, phase: 'cancelled' }
      this.notifyWatchers(false)
    }
    return this.getState()
  }

  async signOut(_client?: string): Promise<DeepSeekAccountStateSnapshot> {
    if (this.attempt?.phase === 'waiting-browser') {
      this.attemptAbort?.abort()
    }
    this.attempt = undefined
    await this.account.ssoLogoutOp({ allDevices: false, revokePeachcode: false }, AbortSignal.timeout(8_000))
    this.notifyWatchers(true)
    return this.getState()
  }

  async getProfile(_client?: string): Promise<{
    readonly id: string | null
    readonly name: string | null
    readonly contact: string | null
  }> {
    return await this.account.resolveAccountProfile(AbortSignal.timeout(10_000))
  }

  async getBalance(_client?: string): Promise<
    | {
      readonly available: true
      readonly totalBalance: string
      readonly toppedUpBalance: string
      readonly grantedBalance: string
      readonly currency: 'CNY' | 'USD'
    }
    | { readonly available: false }
  > {
    return await this.account.resolveAccountBalance(AbortSignal.timeout(10_000))
  }

  getUnnotifiedBonuses(_client?: string): Promise<null> {
    return Promise.resolve(null)
  }

  ackBonusNotified(_ids: readonly number[], _client?: string): Promise<boolean> {
    return Promise.resolve(false)
  }

  async resolveToken(signal?: AbortSignal): Promise<string> {
    return await this.account.resolveVerifiedRelayKey(false, signal)
  }

  async rejectToken(_rejectedToken: string, signal?: AbortSignal): Promise<string> {
    return await this.account.resolveVerifiedRelayKey(true, signal)
  }

  getPlatformSession():
    | {
      readonly status: 'signed-in'
      readonly bearerToken: string
      readonly userId: string | null
      readonly expiresAt: number | null
    }
    | { readonly status: 'signed-out' } {
    return this.account.currentPlatformSession()
  }

  getDeviceIdentity(): { readonly deviceId: string; readonly userAgent: string } {
    return {
      deviceId: 'xpeach-harness',
      userAgent: `XPeachHarness/1.0 (${process.platform})`,
    }
  }

  async *watch(signal?: AbortSignal, includeIdentityChanges = false): AsyncGenerator<void, void, void> {
    const isAborted = (): boolean => signal?.aborted === true
    while (!isAborted()) {
      await new Promise<void>((resolvePromise) => {
        const onAbort = (): void => {
          this.watchers.delete(onNotify)
          resolvePromise()
        }
        const onNotify = (identityChanged: boolean): void => {
          if (identityChanged && !includeIdentityChanges) return
          signal?.removeEventListener('abort', onAbort)
          this.watchers.delete(onNotify)
          resolvePromise()
        }
        this.watchers.add(onNotify)
        signal?.addEventListener('abort', onAbort, { once: true })
      })
      if (isAborted()) return
      yield
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
    modelMetadataUrl: z.string().default('https://raw.githubusercontent.com/YellowPeach122/xpeach-harness/main/resources/model-metadata.json').volatile(),
    timeoutMs: z.natural().min(1000).default(15000).volatile(),
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
  })

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
    const storedRoute = this.readRouteFile()
    this.activeBaseURL = (storedRoute.url ?? this.baseURL).replace(/\/+$/, '')
    this.networkAuto = storedRoute.auto ?? true
    this.adminKeyFile = resolveProfileFile(resolved.adminKeyFile, 'xpeach.admin')
    this.adminKeyVar = resolved.adminKeyVar
    this.sessionKeyFile = resolveProfileFile(resolved.sessionKeyFile, 'xpeach.session')
    this.sessionKeyVar = resolved.sessionKeyVar
    this.bootstrapKey()

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
    })

    if (this.ctx.get('deepseekAccount') === undefined) {
      try {
        this.ctx.provide('deepseekAccount')
        this.deepseekAccountBridge = new XPeachDeepSeekAccount(this.ctx, this)
      } catch (_err) {
        this.deepseekAccountBridge = undefined
      }
    }

    const registerEvent = this.ctx.on.bind(this.ctx) as (name: string, listener: (...args: never[]) => unknown) => () => boolean
    registerEvent('settings/document-updated', (ns: string) => {
      if (ns === 'xpeach-account' || ns === 'xpeach') {
        void this.syncModelCatalog(AbortSignal.timeout(this.timeoutMs)).catch(() => {})
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
    injectServices(['sessionPersistence', 'sessionProjectionCache', 'workspaceRegistry'], () => {
      void this.reconcileSessionsAndWorkspaces().catch(() => {})
    })
    this.ctx.effect(() => {
      const timer = setInterval(() => { void this.api.pricingSync(false, AbortSignal.timeout(30_000)).catch(() => {}) }, 60_000)
      const networkTimer = setInterval(() => { void this.probeNetwork().catch(() => {}) }, 30_000)
      const ssoVerifyTimer = setInterval(() => {
        if (this.isBound()) {
          void this.verifyAndSyncSsoSession(false).catch(() => {})
        }
      }, 20_000)
      const firstProbe = setTimeout(() => {
        void this.upgradeStoredModels().catch(() => {})
        void this.probeNetwork().catch(() => {})
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

  /**
   * Our independent key channel: profile-local file → process.env export for
   * the LLM providers → never the shared credentials.yaml. Seeding from the
   * shared store happens exactly once (tracked by the .seeded sentinel); an
   * explicit unbind never resurrects.
   */
  private bootstrapKey(): void {
    let key = this.readKeyFile()
    // A profile can hold the site token but no local xpk (first launch after an
    // upgrade, or a wiped key file). Re-derive the relay credential from the
    // server rather than starting keyless; the server reuses its own token, so
    // this does not mint a new one each boot.
    if (key === undefined && this.resolveAdmin() !== undefined) {
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
    if (key === undefined && !existsSync(this.seededMarker())) {
      const ambient = process.env[this.keyVar] ?? process.env[this.apiKeyEnv]
      if (ambient !== undefined && ambient.trim().length > 0) {
        key = ambient.trim()
        this.persistKey(key)
      }
      this.writeState(this.seededMarker(), '')
    }
    if (key !== undefined) { process.env[this.keyVar] = key; void this.publishCredential(key) }
  }

  /** Sentinel that "the shared store already contributed once". */
  private seededMarker(): string { return this.keyFile + '.seeded' }

  /**
   * Write one profile-local state file, creating its directory first.
   *
   * Every path here is profile-scoped and absent on a fresh install, so a
   * direct `writeFileSync` fails with ENOENT and the plugin never activates.
   * @param path - Absolute state file path.
   * @param body - Complete file contents.
   */
  private writeState(path: string, body: string): void {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, body, { mode: 0o600 })
  }

  /** Read the profile-local key file; absent or empty → undefined. */
  private readKeyFile(): string | undefined {
    if (!existsSync(this.keyFile)) return undefined
    const value = readFileSync(this.keyFile, 'utf8').trim()
    return value.length > 0 ? value : undefined
  }

  /** Write the key file with 0600 permissions, mkdir -p its parent. */
  private writeKeyFile(key: string): void {
    mkdirSync(dirname(this.keyFile), { recursive: true })
    this.writeState(this.keyFile, key + '\n')
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
    this.writeState(this.slotsFile(), JSON.stringify(slots))
  }

  /** This runtime's own home (XPH_HOME > DSH_HOME > ~/.xph). */
  private ownHome(): string {
    return process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homedir(), '.xph')
  }

  /** Relay-token metadata (id / name / groups) beside the key file. */
  private tokenInfoFile(): string { return this.keyFile.replace(/\.key$/, '.token') }
  private readTokenInfo(): { id?: number; name?: string; groups?: string[] } {
    let raw = ''
    try { raw = readFileSync(this.tokenInfoFile(), 'utf8') } catch (_err) { return {} }
    let parsed: Record<string, unknown> | undefined
    try { parsed = JSON.parse(raw) as Record<string, unknown> } catch (_err) { return {} }
    return {
      ...(typeof parsed.id === 'number' ? { id: parsed.id } : {}),
      ...(typeof parsed.name === 'string' ? { name: parsed.name } : {}),
      ...(Array.isArray(parsed.groups)
        ? { groups: parsed.groups.filter((g): g is string => typeof g === 'string' && g.length > 0) }
        : {}),
    }
  }
  private writeTokenInfo(info: { id?: number; name?: string; groups?: string[] }): void {
    mkdirSync(dirname(this.tokenInfoFile()), { recursive: true })
    this.writeState(this.tokenInfoFile(), JSON.stringify(info))
  }

  /**
   * Backfill the token metadata for a bind made before this file existed:
   * find the newest xph-/dsh- token and record its id/name/groups.
   */
  private async ensureTokenInfo(signal: AbortSignal): Promise<{ id?: number; name?: string; groups?: string[] }> {
    const info = this.readTokenInfo()
    if (info.id !== undefined) {
      let detail: Record<string, JsonValue> | undefined
      try { detail = await this.api.adminTokenGet(info.id, signal) } catch (_err) { return info }
      const groups = Array.isArray(detail.groups)
        ? detail.groups.filter((g): g is string => typeof g === 'string' && g.length > 0)
        : []
      const next = { ...info, groups }
      this.writeTokenInfo(next)
      return next
    }
    let page: XPeachAdminPage<XPeachAdminToken> | undefined
    try { page = await this.api.adminTokens(1, 100, signal) } catch (_err) { return info }
    const live = page.items
      .filter(t => t.status === 1 && ((t.name ?? '').startsWith('xph-') || (t.name ?? '').startsWith('dsh-')))
      .sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))[0]
    if (live === undefined) return info
    let detail: Record<string, JsonValue> | undefined
    try { detail = await this.api.adminTokenGet(live.id, signal) } catch (_err) { return info }
    const groups = Array.isArray(detail.groups)
      ? detail.groups.filter((g): g is string => typeof g === 'string' && g.length > 0)
      : []
    const next = { id: live.id, ...(live.name !== undefined ? { name: live.name } : {}), groups }
    this.writeTokenInfo(next)
    return next
  }

  /** Model counts per site group, read off the pricing catalog. */
  private async groupModelCounts(signal: AbortSignal): Promise<Map<string, number>> {
    const pricing = await this.api.adminPricing(signal)
    const counts = new Map<string, number>()
    for (const entry of pricing.entries) {
      for (const group of entry.enable_groups ?? []) counts.set(group, (counts.get(group) ?? 0) + 1)
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
    void this.upgradeStoredModels().catch(() => undefined)
    if (this.catalogSyncPromise !== undefined || this.catalogSynced) return
    const key = this.readKeyFile() ?? process.env[this.keyVar]?.trim()
    if (key === undefined || key.length === 0) return
    void this.syncModelCatalog(new AbortController().signal)
      .then((result) => {
        if (result.ok) this.catalogSynced = true
      })
      .catch(() => undefined)
  }

  private modelMetadataCacheFile(): string {
    return join(dirname(this.keyFile), 'xpeach-model-metadata.json')
  }

  private readModelMetadataCache(): ModelMetadataRegistry | undefined {
    const file = this.modelMetadataCacheFile()
    if (!existsSync(file)) return undefined
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
      return parseModelMetadataRegistry(parsed)
    } catch (_err) {
      return undefined
    }
  }

  private async refreshModelMetadata(signal: AbortSignal): Promise<ModelMetadataRegistry | undefined> {
    const url = unwrapConfigValue(this.liveConfig.modelMetadataUrl)?.trim()
      || 'https://raw.githubusercontent.com/YellowPeach122/xpeach-harness/main/resources/model-metadata.json'
    try {
      const res = await fetch(url, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]),
      })
      if (!res.ok) return this.readModelMetadataCache()
      const raw: unknown = await res.json()
      const registry = parseModelMetadataRegistry(raw)
      if (registry !== undefined) {
        this.writeState(this.modelMetadataCacheFile(), JSON.stringify(registry, null, 2))
        return registry
      }
    } catch (_err) {
      // Fall back to local cache and built-in model metadata rules.
    }
    return this.readModelMetadataCache()
  }

  private async upgradeStoredModels(): Promise<void> {
    const settings = this.ctx.get('settings') as
      | {
        describe?: () => unknown
        update?: (ns: string, patch: object) => Promise<void>
      }
      | undefined
    if (settings?.describe === undefined || settings.update === undefined) return
    const described = await settings.describe()
    const existingProviders = readProviderMap(described)
    const metadata = this.readModelMetadataCache()
    const updatedProviders: Record<string, object> = {}
    let changed = false

    for (const [key, provider] of Object.entries(existingProviders)) {
      if (!key.startsWith('xpeach')) continue
      let providerChanged = false
      const nextProvider: Record<string, unknown> = { ...provider }

      if (nextProvider['reasoning'] !== 'high') {
        nextProvider['reasoning'] = 'high'
        providerChanged = true
      }
      const defaultInput = nextProvider['defaultInput']
      if (!Array.isArray(defaultInput) || !defaultInput.includes('image')) {
        nextProvider['defaultInput'] = ['text', 'image']
        providerChanged = true
      }

      if (Array.isArray(nextProvider['models'])) {
        const nextModels = (nextProvider['models'] as unknown[]).map((entry) => {
          if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return entry
          const modelObj = entry as Record<string, unknown>
          const id = typeof modelObj['id'] === 'string' ? modelObj['id'] : ''
          if (id.length === 0) return entry
          const caps = modelCapabilities({ id }, metadata)
          const currentInput = Array.isArray(modelObj['input']) ? modelObj['input'] : []
          const needsInputUpgrade = caps.input.some(mod => !currentInput.includes(mod))
          const currentEfforts = modelObj['reasoningEfforts']
          const needsEffortsUpgrade = typeof currentEfforts !== 'object' || currentEfforts === null
          const currentCtx = typeof modelObj['contextWindow'] === 'number' ? modelObj['contextWindow'] : undefined
          const needsCtxUpgrade = currentCtx === undefined || (currentCtx === 262144 && caps.contextWindow !== 262144)
          const currentMax = typeof modelObj['maxTokens'] === 'number' ? modelObj['maxTokens'] : undefined
          const needsMaxUpgrade = currentMax === undefined || (currentMax === 32768 && caps.maxTokens !== 32768)

          if (!needsInputUpgrade && !needsEffortsUpgrade && !needsCtxUpgrade && !needsMaxUpgrade) {
            return entry
          }
          providerChanged = true
          return {
            ...modelObj,
            contextWindow: needsCtxUpgrade ? caps.contextWindow : currentCtx,
            maxTokens: needsMaxUpgrade ? caps.maxTokens : currentMax,
            input: needsInputUpgrade ? caps.input : currentInput,
            reasoningEfforts: needsEffortsUpgrade ? caps.reasoningEfforts : currentEfforts,
          }
        })
        if (providerChanged) {
          nextProvider['models'] = nextModels
        }
      }

      if (providerChanged) {
        updatedProviders[key] = nextProvider
        changed = true
      }
    }

    if (changed) {
      await settings.update('llm-pi-ai', { providers: updatedProviders })
    }
  }

  /**
   * Pick the relay token's initial groups: the user's own group when it carries
   * models, else the DSH-oriented SWE group, else the richest non-admin group.
   */
  private async defaultGroups(signal: AbortSignal): Promise<string[]> {
    const [counts, me] = await Promise.all([this.groupModelCounts(signal), this.api.adminSelf(signal)])
    if (me.group !== undefined && (counts.get(me.group) ?? 0) > 0) return [me.group]
    if ((counts.get('SWE') ?? 0) > 0) return ['SWE']
    const best = [...counts.entries()]
      .filter(([name]) => name !== '管理员分组' && name !== 'default')
      .sort((a, b) => b[1] - a[1])[0]
    return best === undefined ? [] : [best[0]]
  }

  /**
   * Write the site's callable models into the llm-pi-ai settings section so the
   * composer/settings pickers show the marketplace instead of a frozen list.
   * Deduplicates concurrent callers onto the in-flight sync promise.
   */
  private async syncModelCatalog(signal: AbortSignal, manual = false): Promise<XPeachModelSyncResult> {
    if (this.catalogSyncPromise !== undefined) return await this.catalogSyncPromise
    const run = this.runSyncModelCatalog(signal, manual).finally(() => {
      if (this.catalogSyncPromise === run) this.catalogSyncPromise = undefined
    })
    this.catalogSyncPromise = run
    return await run
  }

  private async runSyncModelCatalog(signal: AbortSignal, manual = false): Promise<XPeachModelSyncResult> {
    const info = await this.ensureTokenInfo(signal)
    try {
      const settings = this.ctx.get('settings') as
        | {
          describe?: () => unknown
          update?: (ns: string, patch: object) => Promise<void>
          mutate?: (ns: string, ops: unknown[]) => Promise<unknown>
        }
        | undefined
      if (settings?.update === undefined) return { ok: false, count: 0, groups: info.groups ?? [], error: 'settings service unavailable' }
      const described = await settings.describe?.()
      const liveAccountSettings = readAccountSettings(described)
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
      const [catalogue, metadata] = await Promise.all([
        this.api.models(signal),
        this.refreshModelMetadata(signal),
      ])
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
        ? catalogue
        : catalogue.filter(model => (model.groups ?? []).some(group => enabled.includes(group)))
      const models = list.map((m) => {
        const caps = modelCapabilities(m, metadata)
        return {
          id: m.id,
          name: m.id,
          contextWindow: caps.contextWindow,
          maxTokens: caps.maxTokens,
          input: caps.input,
          reasoningEfforts: caps.reasoningEfforts,
        }
      })
      const siteRoot = this.api.siteBaseURL.replace(/\/+$/, '')
      const openAIBase = siteRoot.endsWith('/v1') ? siteRoot : siteRoot + '/v1'
      const anthropicBase = siteRoot.replace(/\/v1$/u, '')
      const baseURLFor = (protocol: string): string =>
        protocol === 'anthropic-messages' ? anthropicBase : openAIBase
      const existingProviders = readProviderMap(described)
      const providers: Record<string, object> = {}
      for (const model of models) {
        const protocol = modelProtocol(list.find(m => m.id === model.id) ?? {}, this.protocolPreference)
        const key = protocol === 'openai-completions' ? 'xpeach' : `xpeach-${protocol.replace(/-messages$/u, '')}`
        const existingTracking = liveAccountSettings.conversationTracking
          ?? (typeof existingProviders[key]?.['conversationTracking'] === 'boolean' ? existingProviders[key]['conversationTracking'] : undefined)
          ?? (typeof existingProviders['xpeach']?.['conversationTracking'] === 'boolean' ? existingProviders['xpeach']['conversationTracking'] : undefined)
          ?? unwrapConfigValue(this.liveConfig.conversationTracking)
        providers[key] ??= {
          displayName: protocol === 'openai-completions' ? '🍑Code' : `🍑Code ${protocol}`,
          apiKeyEnv: this.keyVar,
          api: protocol,
          baseURL: baseURLFor(protocol),
          defaultInput: ['text', 'image'],
          reasoning: 'high',
          ...(existingTracking !== undefined ? { conversationTracking: existingTracking } : {}),
          retryPolicy: { mode: 'normal', maxRetries: 2 },
          models: [],
        }
        ;(providers[key] as { models: object[] }).models.push(model)
      }
      const live = Object.keys(existingProviders)
      const stale = live.filter(key => key.startsWith('xpeach') && !(key in providers))
      if (stale.length > 0 && settings.mutate !== undefined) {
        await settings.mutate('llm-pi-ai', stale.map(key => ({ op: 'unset', path: ['providers', key] })))
      }
      await settings.update('llm-pi-ai', { providers })
      return { ok: true, count: models.length, groups: info.groups ?? [] }
    } catch (e) {
      return { ok: false, count: 0, groups: info.groups ?? [], error: e instanceof Error ? e.message.slice(0, 160) : String(e) }
    }
  }

  /**
   * Persist into the profile file + live env + the credentials service.
   */
  private persistKey(key: string): void {
    this.writeKeyFile(key)
    process.env[this.keyVar] = key
    void this.publishCredential(key)
  }

  /**
   * Persist the site-management token (the user's Access Token).
   */
  private persistAdmin(token: string): void {
    mkdirSync(dirname(this.adminKeyFile), { recursive: true })
    this.writeState(this.adminKeyFile, token + '\n')
    process.env[this.adminKeyVar] = token
  }

  /** Best-effort runtime record under the provider's apiKeyEnv name. */
  private async publishCredential(key: string): Promise<void> {
    const creds = this.ctx.get('credentials') as { set?: (ref: CredentialRef, value: string) => Promise<void>; unset?: (ref: CredentialRef) => Promise<void> } | undefined
    try {
      await creds?.set?.(credentialRef(this.keyVar), key)
    } catch (e) {
      console.error('[xpeach] credential publish failed:', e instanceof Error ? e.message : String(e))
    }
  }

  /** Drop the runtime record so a revoked key cannot keep serving a route. */
  private async revokeCredential(): Promise<void> {
    const creds = this.ctx.get('credentials') as { unset?: (ref: CredentialRef) => Promise<void> } | undefined
    try { await creds?.unset?.(credentialRef(this.keyVar)) } catch (_err) { /* best effort */ }
  }

  /** Notify clients (and the forwarded-event allowlist) the key changed. */
  private notifyKeyChanged(): void {
    try { this.ctx.emit('credentials/reference-updated', this.apiKeyEnv) } catch (_err) { /* contained */ }
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
    return await this.api.tokenUsage(signal)
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
   * Add a key slot (validates the key first), then activate it.
   *
   * @param request - slot label and raw API key.
   * @param signal - carrier cancellation.
   * @returns whether the key slot was added and activated.
   */
  @Remote('keySlotAdd')
  async keySlotAddOp(request: { name: string; key: string }, signal: AbortSignal): Promise<{ ok: boolean; message: string }> {
    const key = request.key.trim()
    if (key.match(/^(?:xpk|sk)-/u) === null) return { ok: false, message: 'xpeach: key must start with xpk-' }
    const prev = this.readKeyFile()
    this.persistKey(key)
    try {
      await this.api.tokenUsage(signal)
    } catch (e) {
      if (prev !== undefined) {
        this.persistKey(prev)
      } else {
        try { unlinkSync(this.keyFile) } catch (_err) { /* absent */ }
        Reflect.deleteProperty(process.env, this.keyVar)
        await this.revokeCredential()
      }
      return { ok: false, message: e instanceof Error ? e.message : 'xpeach: key rejected' }
    }
    const slots = this.readSlots().filter(s => s.key !== key)
    slots.push({ name: request.name.trim() || `slot-${String(slots.length + 1)}`, key })
    this.writeSlots(slots)
    this.notifyKeyChanged()
    return { ok: true, message: 'xpeach: key slot added + active' }
  }

  /**
   * Switch the active key slot by index.
   *
   * @param request - zero-based slot index.
   * @returns switch outcome message.
   */
  @Remote('keySlotSwitch')
  keySlotSwitchOp(request: { index: number }): { ok: boolean; message: string } {
    const slots = this.readSlots()
    const target = slots[request.index]
    if (target === undefined) return { ok: false, message: 'xpeach: slot index out of range' }
    this.persistKey(target.key)
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
  keySlotRemoveOp(request: { index: number }): { ok: boolean; message: string } {
    const slots = this.readSlots()
    const target = slots[request.index]
    if (target === undefined) return { ok: false, message: 'xpeach: slot index out of range' }
    const active = this.readKeyFile()
    slots.splice(request.index, 1)
    this.writeSlots(slots)
    if (target.key === active) {
      const next = slots[0]
      if (next !== undefined) {
        this.persistKey(next.key)
      } else {
        try { unlinkSync(this.keyFile) } catch (_err) { /* absent */ }
        Reflect.deleteProperty(process.env, this.keyVar)
        void this.revokeCredential()
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
    const previousAdmin = this.resolveAdmin()
    this.api.setAdminKey(token)
    try {
      await this.api.adminSelf(signal)
    } catch (e) {
      this.api.setAdminKey(undefined)
      throw e
    }
    if (previousAdmin !== undefined && previousAdmin !== token) {
      try { unlinkSync(this.keyFile) } catch (_err) { /* absent */ }
      try { unlinkSync(this.slotsFile()) } catch (_err) { /* absent */ }
      try { unlinkSync(this.tokenInfoFile()) } catch (_err) { /* absent */ }
      Reflect.deleteProperty(process.env, this.keyVar)
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
    const key = this.readKeyFile() ?? process.env[this.keyVar]?.trim()
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
      const emit = this.ctx.emit.bind(this.ctx) as (name: string, payload: XPeachPlaygroundChunk) => void
      emit('xpeach/playground-chunk', { callId, delta })
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
    const trimmed = value.trim()
    if (trimmed.length === 0) throw new RemoteError('xpeach/request-failed', 'xpeach: empty session cookie', { status: 0, message: 'empty session cookie' })
    this.api.setSessionKey(trimmed)
    try {
      const me = await this.api.sessionSelf(signal)
      this.writeState(this.sessionKeyFile, trimmed + '\n')
      process.env[this.sessionKeyVar] = trimmed
      return { bound: true, as: me.username }
    } finally {
      this.api.setSessionKey(undefined)
    }
  }

  private currentSsoBaseURL(): string {
    const raw = unwrapConfigValue(this.liveConfig.ssoBaseURL) ?? process.env.XPEACH_SSO_URL ?? 'https://sso.xpeach.codes'
    return validateSsoBaseUrl(raw)
  }

  private currentSsoClientId(): string {
    const raw = unwrapConfigValue(this.liveConfig.ssoClientId) ?? 'xpeach-harness'
    return raw.trim() || 'xpeach-harness'
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
   * Whether any XPeach credential (relay key, admin token, or SSO session) is currently bound.
   *
   * @returns `true` when at least one credential channel is bound.
   */
  isBound(): boolean {
    const key = this.readKeyFile() ?? process.env[this.keyVar]?.trim()
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
    const bearer = sso?.accessToken ?? this.resolveAdmin() ?? this.readKeyFile() ?? process.env[this.keyVar]?.trim()
    if (bearer === undefined || bearer.length === 0) {
      return { status: 'signed-out' }
    }
    const expiresAt = typeof sso?.boundAt === 'number' && typeof sso.expiresIn === 'number'
      ? sso.boundAt + sso.expiresIn * 1000
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
    try {
      const me = await this.api.userSelf(signal)
      const usd = Math.max(0, (me.quota ?? 0) / 500_000).toFixed(2)
      return {
        available: true,
        totalBalance: usd,
        toppedUpBalance: usd,
        grantedBalance: '0.00',
        currency: 'USD',
      }
    } catch (_err) {
      try {
        const usage = await this.api.tokenUsage(signal)
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

  private async handleAuthRejected(status: 401 | 403): Promise<void> {
    const sso = this.readSsoState()
    if (sso?.accessToken !== undefined && sso.accessToken.length > 0) {
      await this.verifyAndSyncSsoSession(true).catch(() => {})
      return
    }
    await this.revokeAllLocalCredentials(status === 403 ? 'banned' : 'revoked')
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
      if (!key.startsWith('xpeach')) continue
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
      const sso = this.readSsoState()
      const hadAnyCredential = this.isBound()
      if (
        options?.revokeRemote === true
        && sso?.accessToken !== undefined
        && sso.accessToken.length > 0
      ) {
        await this.api.ssoRevokeToken(
          this.currentSsoBaseURL(),
          sso.accessToken,
          {
            allDevices: options.allDevices ?? false,
            revokePeachcode: options.revokePeachcode ?? false,
          },
          AbortSignal.timeout(5_000),
        ).catch(() => false)
      }

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

      Reflect.deleteProperty(process.env, this.keyVar)
      Reflect.deleteProperty(process.env, this.adminKeyVar)
      Reflect.deleteProperty(process.env, this.sessionKeyVar)
      this.api.setAdminKey(undefined)
      this.api.setSessionKey(undefined)
      this.writeState(this.seededMarker(), '')
      this.lastSsoVerifyAt = 0

      await this.revokeCredential()
      await this.clearModelCatalogFromSettings().catch(() => {})
      this.cancelRunningAccountTasks()

      const emitEvent = this.ctx.emit.bind(this.ctx) as (name: string, ...args: unknown[]) => void
      if (hadAnyCredential && (reason === 'revoked' || reason === 'banned' || reason === 'expired')) {
        try { emitEvent('deepseek-account/session-expired') } catch (_err) { /* contained */ }
      }
      try { emitEvent('deepseek-account/signed-out') } catch (_err) { /* contained */ }
      this.notifyKeyChanged()
      this.deepseekAccountBridge?.onLocalCredentialsRevoked(reason)
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
    if (!this.isBound()) {
      return { valid: false, status: 'unbound' }
    }
    if (!force && Date.now() - this.lastSsoVerifyAt < 5_000) {
      const sso = this.readSsoState()
      return {
        valid: true,
        status: 'ok',
        ...(sso?.user?.username ? { username: sso.user.username } : {}),
        ...(sso?.user?.email ? { email: sso.user.email } : {}),
      }
    }
    if (this.ssoVerifyPromise !== undefined) {
      return await this.ssoVerifyPromise
    }
    const effectiveSignal = signal ?? AbortSignal.timeout(Math.min(this.timeoutMs, 8_000))
    const run = (async (): Promise<XPeachSsoSessionStatus> => {
      const sso = this.readSsoState()
      if (sso?.accessToken !== undefined && sso.accessToken.length > 0) {
        const sync = await this.api.ssoPeachcodeCredentials(
          this.currentSsoBaseURL(),
          sso.accessToken,
          effectiveSignal,
        )
        if (sync.status === 'revoked') {
          await this.revokeAllLocalCredentials(sync.code === 403 ? 'banned' : 'revoked')
          return {
            valid: false,
            status: 'revoked',
            message: sync.message,
          }
        }
        if (sync.status === 'transient_error') {
          return {
            valid: true,
            status: 'transient_error',
            message: sync.message,
          }
        }
        this.lastSsoVerifyAt = Date.now()
        const peach = sync.payload.peachcode
        const nextAccessToken = peach?.accessToken?.trim()
        if (nextAccessToken !== undefined && nextAccessToken.length > 0 && nextAccessToken !== this.resolveAdmin()) {
          this.persistAdmin(nextAccessToken)
        }
        let nextApiKey = peach?.apiKey?.trim()
        if (nextApiKey !== undefined && nextApiKey.length > 0) {
          if (nextApiKey.match(/^(?:xpk|sk)-/u) === null) nextApiKey = 'sk-' + nextApiKey
          if (nextApiKey !== this.readKeyFile()) {
            this.persistKey(nextApiKey)
            this.notifyKeyChanged()
          }
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

      if (this.resolveAdmin() !== undefined) {
        try {
          const me = await this.api.userSelf(effectiveSignal)
          if (me.status !== undefined && me.status !== 1) {
            await this.revokeAllLocalCredentials('banned')
            return {
              valid: false,
              status: 'revoked',
              message: 'Account has been disabled',
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
          if (err instanceof RemoteError && (err.details as { status?: number } | undefined)?.status !== undefined) {
            const st = (err.details as { status?: number }).status
            if (st === 401 || st === 403) {
              await this.revokeAllLocalCredentials(st === 403 ? 'banned' : 'revoked')
              return {
                valid: false,
                status: 'revoked',
                message: err.message,
              }
            }
          }
          return { valid: true, status: 'transient_error' }
        }
      }

      if (this.readKeyFile() !== undefined) {
        try {
          await this.api.tokenUsage(effectiveSignal)
          this.lastSsoVerifyAt = Date.now()
          return { valid: true, status: 'ok' }
        } catch (err) {
          if (err instanceof RemoteError && (err.details as { status?: number } | undefined)?.status !== undefined) {
            const st = (err.details as { status?: number }).status
            if (st === 401 || st === 403) {
              await this.revokeAllLocalCredentials(st === 403 ? 'banned' : 'revoked')
              return {
                valid: false,
                status: 'revoked',
                message: err.message,
              }
            }
          }
          return { valid: true, status: 'transient_error' }
        }
      }

      return { valid: false, status: 'unbound' }
    })().finally(() => {
      this.ssoVerifyPromise = undefined
    })
    this.ssoVerifyPromise = run
    return await run
  }

  private async *guardLlmStream(
    options: { readonly provider?: string; readonly signal?: AbortSignal },
    next: (opts?: unknown) => AsyncGenerator<Record<string, unknown>, void, unknown>,
  ): AsyncGenerator<Record<string, unknown>, void, unknown> {
    const provider = options.provider ?? ''
    if (!provider.startsWith('xpeach')) {
      yield* next(options)
      return
    }
    const check = await this.verifyAndSyncSsoSession(false, options.signal)
    if (!check.valid || check.status === 'revoked' || !this.isBound()) {
      const emitEvent = this.ctx.emit.bind(this.ctx) as (name: string) => void
      try { emitEvent('deepseek-account/model-sign-in-required') } catch (_err) { /* contained */ }
      try { emitEvent('deepseek-account/session-expired') } catch (_err) { /* contained */ }
      yield {
        type: 'finish',
        reason: 'error',
        error: {
          message: check.message ?? '您的 XPeach 账号未登录或已被停用，请先完成 SSO 登录授权。',
          code: 'ACCOUNT_SIGN_IN_REQUIRED',
          retryable: false,
        },
        usage: { inputTokens: 0, outputTokens: 0 },
      }
      return
    }
    for await (const chunk of next(options)) {
      if (chunk['type'] === 'finish' && chunk['reason'] === 'error') {
        const errObj = chunk['error'] as { status?: number; message?: string } | undefined
        if (errObj?.status === 401 || errObj?.status === 403) {
          void this.handleAuthRejected(errObj.status)
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
   * Self-revoke the active SSO session (`POST /api/v1/peachcode/revoke` Mode B)
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

  private async openUrlInSystemBrowser(url: string): Promise<boolean> {
    if (process.env.VITEST !== undefined || process.env.NODE_ENV === 'test') return false
    try {
      const safeUrl = validateVerificationUrl(url, this.currentSsoBaseURL())
      const { spawn } = await import('node:child_process')
      const cmd = process.platform === 'darwin'
        ? 'open'
        : process.platform === 'win32'
          ? 'cmd'
          : 'xdg-open'
      const args = process.platform === 'win32' ? ['/c', 'start', '', safeUrl] : [safeUrl]
      const child = spawn(cmd, args, { detached: true, stdio: 'ignore' })
      child.unref()
      return true
    } catch (_err) {
      return false
    }
  }

  private async applySsoBridgePayload(
    payload: XPeachSsoBridgePayload,
    signal: AbortSignal,
  ): Promise<XPeachSsoDevicePollResult> {
    const peach = payload.peachcode
    const sso = payload.sso
    const username = peach?.username ?? sso?.user?.username ?? sso?.user?.name ?? undefined
    const email = sso?.user?.email ?? undefined

    if (sso?.accessToken !== undefined && sso.accessToken.length > 0) {
      try {
        this.writeState(
          this.ssoStateFile,
          JSON.stringify({
            accessToken: sso.accessToken,
            expiresIn: sso.expiresIn,
            user: sso.user,
            peachcodeUserId: peach?.userId,
            boundAt: Date.now(),
          }, null, 2) + '\n',
        )
      } catch (_err) { /* best effort */ }
    }

    const accessToken = peach?.accessToken?.trim()
    if (accessToken !== undefined && accessToken.length > 0) {
      this.persistAdmin(accessToken)
    }

    let apiKey = peach?.apiKey?.trim()
    let preview: string | undefined
    if (apiKey !== undefined && apiKey.length > 0) {
      if (apiKey.match(/^(?:xpk|sk)-/u) === null) apiKey = 'sk-' + apiKey
      this.writeTokenInfo({
        ...(peach?.tokenId !== undefined ? { id: peach.tokenId } : {}),
        ...(peach?.tokenName !== undefined ? { name: peach.tokenName } : {}),
        ...(peach?.group !== undefined && peach.group.length > 0 ? { groups: [peach.group] } : {}),
      })
      this.persistKey(apiKey)
      preview = apiKey.slice(0, 5) + '…' + apiKey.slice(-4)
    } else if (accessToken !== undefined && accessToken.length > 0) {
      const minted = await this.mintKeyWithAccessToken(signal)
      if (minted.ok) {
        preview = minted.preview
      }
    }

    this.lastSsoVerifyAt = Date.now()
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
    const ssoBaseURL = this.currentSsoBaseURL()
    const clientId = this.currentSsoClientId()
    const clientName = request.clientName?.trim() || `XPeach Harness (${process.platform})`
    const started = await this.api.ssoDeviceAuthorize(ssoBaseURL, clientId, clientName, signal)
    const browserOpened = request.openBrowser !== false
      ? await this.openUrlInSystemBrowser(started.verificationUriComplete)
      : false
    return {
      ...started,
      browserOpened,
    }
  }

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
    const polled = await this.api.ssoDeviceToken(
      this.currentSsoBaseURL(),
      this.currentSsoClientId(),
      deviceCode,
      signal,
    )
    if (polled.status !== 'approved' || polled.payload === undefined) {
      return {
        status: polled.status,
        ...(polled.message !== undefined ? { message: polled.message } : {}),
      }
    }
    return await this.applySsoBridgePayload(polled.payload, signal)
  }

  /**
   * Launch interactive browser sign-in via XPeach SSO Device Authorization (with
   * legacy Playwright fallback if SSO is unreachable), bind bridged credentials,
   * and sync the relay model catalog.
   *
   * @param signal - carrier cancellation.
   * @returns bound status, username, and relay key minting status.
   */
  @Remote('sessionLogin')
  async sessionLoginOp(signal: AbortSignal): Promise<{ bound: boolean; as?: string; minted?: boolean; mintErr?: string }> {
    let started: XPeachSsoDeviceStartResult | undefined
    try {
      started = await this.ssoDeviceStartOp({ openBrowser: true }, signal)
    } catch (_err) {
      started = undefined
    }
    if (started !== undefined) {
      const intervalMs = Math.max(1500, (started.interval || 2) * 1000)
      const deadline = Date.now() + Math.min((started.expiresIn || 600) * 1000, 180_000)
      while (Date.now() < deadline) {
        signal.throwIfAborted()
        await new Promise(res => setTimeout(res, intervalMs))
        const polled = await this.ssoDevicePollOp({ deviceCode: started.deviceCode }, signal)
        if (polled.status === 'pending') continue
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

    const cookie = await this.api.sessionLoginInteractive(signal)
    this.api.setSessionKey(cookie)
    let me: XPeachUserSelf
    try {
      me = await this.api.sessionSelf(signal)
    } finally {
      this.api.setSessionKey(undefined)
    }
    this.writeState(this.sessionKeyFile, cookie + '\n')
    process.env[this.sessionKeyVar] = cookie
    const mint = await this.mintConsoleKey(signal)
    return {
      bound: true,
      as: me.username,
      minted: mint.ok,
      ...(mint.ok ? {} : { mintErr: mint.err ?? 'mint failed' }),
    }
  }

  /**
   * Mint or reuse a console relay token through the active session so a single
   * browser login binds both the session cookie and an `sk-` key.
   */
  private async mintConsoleKey(signal: AbortSignal): Promise<{ ok: boolean; err?: string }> {
    try {
      let id: number
      let name: string
      const page = await this.api.userTokens(0, signal)
      const live = page.items
        .filter(t => t.status === 1 && (t.name.startsWith('xph-') || t.name.startsWith('dsh-')))
        .sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))[0]
      if (live !== undefined) {
        id = live.id
        name = live.name
      } else {
        name = 'xph-' + new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 6)
        await this.api.userTokenCreate({
          name, remain_quota: 0, expired_time: -1,
          unlimited_quota: true, model_limits_enabled: false, group: '',
        }, signal)
        const after = await this.api.userTokens(0, signal)
        const hit = after.items.filter(t => t.name === name).sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))[0]
        if (hit === undefined) return { ok: false, err: 'token not found after create' }
        id = hit.id
      }
      const revealed = await this.api.userTokenKey(id, signal)
      let key = revealed.key
      if (typeof key !== 'string' || key.length === 0) return { ok: false, err: 'key reveal empty' }
      if (key.match(/^(?:xpk|sk)-/u) === null) key = 'sk-' + key
      this.writeTokenInfo({ id, name })
      this.persistKey(key)
      this.notifyKeyChanged()
      await this.syncModelCatalog(signal).catch(() => {})
      return { ok: true }
    } catch (e) {
      return { ok: false, err: e instanceof Error ? e.message.slice(0, 120) : String(e) }
    }
  }

  /**
   * Find-or-create the sk- relay token through the access-token channel. Runs
   * once per bind: reuse the newest living xph-/dsh- token, otherwise create
   * one and reveal it. Returns the masked preview for the bind receipt.
   */
  private async mintKeyWithAccessToken(signal: AbortSignal): Promise<{ ok: boolean; err?: string; preview?: string }> {
    try {
      const defaults = await this.defaultGroups(signal)
      let id: number | undefined
      let name: string | undefined
      const page = await this.api.adminTokens(1, 100, signal)
      const live = page.items
        .filter(t => t.status === 1 && ((t.name ?? '').startsWith('xph-') || (t.name ?? '').startsWith('dsh-')))
        .sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))[0]
      if (live !== undefined) {
        id = live.id
        name = live.name
      } else {
        name = 'xph-' + new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 6)
        await this.api.adminTokenCreate({
          name,
          groups: defaults,
          group: defaults[0] ?? '',
          remain_quota: 0,
          expired_time: -1,
          unlimited_quota: true,
          model_limits_enabled: false,
        }, signal)
        const after = await this.api.adminTokens(1, 100, signal)
        const hit = after.items.filter(t => t.name === name).sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))[0]
        if (hit === undefined) return { ok: false, err: 'token not found after create' }
        id = hit.id
      }
      const counts = await this.groupModelCounts(signal)
      const detail = await this.api.adminTokenGet(id, signal)
      const currentGroups = Array.isArray(detail.groups)
        ? detail.groups.filter((g): g is string => typeof g === 'string' && g.length > 0)
        : []
      const usable = currentGroups.some(g => (counts.get(g) ?? 0) > 0)
      if (!usable && defaults.length > 0) {
        await this.api.adminTokenUpdate({ ...detail, groups: defaults, group: defaults[0] ?? '' }, signal)
      }
      const groups = usable ? currentGroups : defaults
      this.writeTokenInfo({ id, ...(name !== undefined ? { name } : {}), groups })
      const revealed = await this.api.adminTokenKey(id, signal)
      let key = revealed.key
      if (typeof key !== 'string' || key.length === 0) return { ok: false, err: 'key reveal empty' }
      if (key.match(/^(?:xpk|sk)-/u) === null) key = 'sk-' + key
      this.persistKey(key)
      void this.syncModelCatalog(signal).catch(() => {})
      return { ok: true, preview: key.slice(0, 5) + '…' + key.slice(-4) }
    } catch (e) {
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
    return { done: existsSync(join(this.ownHome(), '.xpeach-onboarded')) }
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
    this.writeState(join(this.ownHome(), '.xpeach-onboarded'), new Date().toISOString() + '\n')
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
    const [pricing, list] = await Promise.all([this.api.adminPricing(signal), this.api.models(signal)])
    const counts = new Map<string, number>()
    for (const entry of pricing.entries) {
      for (const group of entry.enable_groups ?? []) counts.set(group, (counts.get(group) ?? 0) + 1)
    }
    const groups = [...counts.entries()]
      .map(([name, models]) => ({
        name,
        models,
        ...(pricing.groupRatio[name] !== undefined ? { ratio: pricing.groupRatio[name] } : {}),
      }))
      .sort((a, b) => b.models - a.models)
    const info = await this.ensureTokenInfo(signal)
    return {
      groups,
      tokenGroups: info.groups ?? [],
      models: list.map(m => m.id),
      ...(info.id !== undefined ? { tokenId: info.id } : {}),
    }
  }

  /**
   * Reassign the relay token's groups, then re-sync the model picker.
   *
   * @param request - group names to assign to the relay token.
   * @param signal - carrier cancellation.
   * @returns model catalog sync outcome.
   */
  @Remote('setGroups')
  async setGroupsOp(request: { groups: string[] }, signal: AbortSignal): Promise<XPeachModelSyncResult> {
    signal.throwIfAborted()
    const info = await this.ensureTokenInfo(signal)
    if (info.id === undefined) return { ok: false, count: 0, groups: [], error: 'no relay token bound' }
    const groups = request.groups.filter(g => typeof g === 'string' && g.length > 0)
    if (groups.length === 0) return { ok: false, count: 0, groups: [], error: 'pick at least one group' }
    const detail = await this.api.adminTokenGet(info.id, signal)
    await this.api.adminTokenUpdate({ ...detail, groups, group: groups[0] ?? '' }, signal)
    this.writeTokenInfo({ ...info, groups })
    return await this.syncModelCatalog(signal, true)
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
      this.writeState(this.routeFile, JSON.stringify({ url: this.activeBaseURL, auto: this.networkAuto, at: Date.now() }))
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

  /** Keep all active `xpeach*` llm-pi-ai provider baseURLs in sync with the active route. */
  private async applyProviderBase(): Promise<void> {
    const settings = this.ctx.get('settings') as
      | { describe?: () => unknown; update?: (ns: string, patch: object) => Promise<void> }
      | undefined
    if (settings?.update === undefined) return
    const siteRoot = this.activeBaseURL.replace(/\/+$/, '')
    const openAIBase = siteRoot.endsWith('/v1') ? siteRoot : siteRoot + '/v1'
    const anthropicBase = siteRoot.replace(/\/v1$/u, '')
    const described = await settings.describe?.()
    const existing = readProviderMap(described)
    const xpeachKeys = Object.keys(existing).filter(key => key.startsWith('xpeach'))
    if (xpeachKeys.length === 0) return
    const providers: Record<string, { baseURL: string }> = {}
    let changed = false
    for (const key of xpeachKeys) {
      const api = existing[key]?.['api']
      const isAnthropic = api === 'anthropic-messages' || key === 'xpeach-anthropic'
      const nextUrl = isAnthropic ? anthropicBase : openAIBase
      if (existing[key]?.['baseURL'] !== nextUrl) changed = true
      providers[key] = { baseURL: nextUrl }
    }
    if (!changed) return
    await settings.update('llm-pi-ai', { providers })
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

  /** Probe all routes, switch if auto and another route wins, record history. */
  private async probeNetwork(): Promise<XPeachNetworkSnapshot> {
    const key = await this.resolveKey().catch(() => undefined)
    const probes = await probeRoutes(key, Math.min(this.timeoutMs, 4000))
    if (this.networkAuto) {
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
    const file = this.readKeyFile()
    if (file !== undefined) return file
    const ambient = process.env[this.keyVar]?.trim()
    if (ambient !== undefined && ambient.length > 0) { this.persistKey(ambient); return ambient }
    if (!existsSync(this.seededMarker())) {
      const credentials = this.ctx.get('credentials')
      const hit = credentials === undefined ? undefined : await credentials.resolve(this.apiKeyEnv)
      const legacy = hit ?? launchEnvironmentOf(this.ctx).get(this.apiKeyEnv)
      if (legacy !== undefined && legacy.value.length > 0) { this.persistKey(legacy.value); return legacy.value }
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
    if (!ownResolved.startsWith(resolve(tmpdir()))) {
      readSkillFolder(join(homedir(), '.agents', 'skills'), 'agents', false)
    }

    const liveSkills = this.getOptionalService('skill')?.list() ?? []
    for (const live of liveSkills) {
      const resolvedLoc = resolve(live.location)
      const resolvedDir = resolve(dirname(live.location))
      if (seenPaths.has(resolvedLoc) || seenPaths.has(resolvedDir)) continue
      if (!existsSync(live.location)) continue
      try {
        const raw = readFileSync(live.location, 'utf8')
        const dirName = basename(dirname(live.location))
        const normalized = normalizeSkillMarkdown(raw, live.name || dirName)
        seenPaths.add(resolvedLoc)
        seenPaths.add(resolvedDir)
        skills.push({
          id: `project:${dirName}`,
          name: live.name || normalized.name,
          dirName,
          description: live.description || normalized.description,
          ...(normalized.whenToUse !== undefined ? { whenToUse: normalized.whenToUse } : {}),
          path: live.location,
          source: 'project',
          enabled: true,
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

  /**
   * Enable or disable a user skill by toggling `SKILL.md` and `SKILL.md.disabled`.
   *
   * @param request - skill directory name, skill name, and target enabled flag.
   * @param signal - carrier cancellation.
   * @returns updated skills and rules snapshot.
   */
  @Remote('skillToggle')
  skillToggleOp(request: XPeachSkillToggleRequest, signal: AbortSignal): XPeachSkillsSnapshot {
    signal.throwIfAborted()
    const skillsRoot = this.skillsRoot()
    const disabledRoot = this.disabledSkillsRoot()
    const rawKey = request.dirName || request.name
    const folderName = this.findSkillFolderName(rawKey) ?? basename(rawKey.trim())
    const disabledSet = this.readDisabledSkills()
    if (folderName.length > 0 && folderName !== '.' && folderName !== '..') {
      const activeDir = join(skillsRoot, folderName)
      const legacyDisabledDir = join(disabledRoot, folderName)
      if (existsSync(legacyDisabledDir) && !existsSync(activeDir)) {
        mkdirSync(skillsRoot, { recursive: true })
        moveDirectory(legacyDisabledDir, activeDir)
      }
      const activeMd = join(activeDir, 'SKILL.md')
      const disabledMd = join(activeDir, 'SKILL.md.disabled')
      if (request.enabled) {
        disabledSet.delete(folderName)
        disabledSet.delete(request.name)
        if (existsSync(disabledMd)) {
          try {
            renameSync(disabledMd, activeMd)
          } catch (_err) {
            writeFileSync(activeMd, readFileSync(disabledMd, 'utf8'), 'utf8')
            try { unlinkSync(disabledMd) } catch (_e) { /* ignore */ }
          }
        }
        repairSkillsDirectory(skillsRoot)
      } else {
        disabledSet.add(folderName)
        if (existsSync(activeMd)) {
          try {
            renameSync(activeMd, disabledMd)
          } catch (_err) {
            writeFileSync(disabledMd, readFileSync(activeMd, 'utf8'), 'utf8')
            try { unlinkSync(activeMd) } catch (_e) { /* ignore */ }
          }
        }
      }
      this.writeDisabledSkills(disabledSet)
      this.notifySkillsChanged()
    }
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
  private getOptionalService(name: 'skill'): LiveSkillService | undefined
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
        if (new RegExp(rule.pattern, 'iu').test(id)) return rule
      } catch (_err) {
        // Ignore malformed dynamic regex rules.
      }
    }
  }
  return registry.defaults
}

/**
 * Input modalities a catalogue entry accepts.
 *
 * All conversational models default to `['text', 'image']` so image attachments
 * and multimodal pastes work across every relay model out of the box; only
 * explicit non-chat utility endpoints (embeddings, rerankers, speech/audio) stay
 * text-only.
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
  const defaultsRaw = obj['defaults']
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
 * The wire protocol a catalogue entry speaks.
 *
 * `compatible` keeps every route on chat completions, which is the one wire a
 * relay is most likely to have channels for; `native` prefers the richest wire
 * the route advertises, which keeps Anthropic cache breakpoints and Responses
 * reasoning state but only works where the relay routes those endpoints.
 * @param model - one catalogue entry.
 * @param preference - which wire to favour when the route offers several.
 * @returns a protocol identifier the pi-ai adapter accepts.
 */
export function modelProtocol(
  model: { supported_endpoint_types?: readonly string[] },
  preference: ModelProtocolPreference = 'compatible',
): 'openai-responses' | 'anthropic-messages' | 'openai-completions' {
  const offered = new Set(model.supported_endpoint_types ?? [])
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

