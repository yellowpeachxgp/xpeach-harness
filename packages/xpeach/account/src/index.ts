/**
 * XPeach (New API) account Remote owner: exposes the calling credential's own
 * usage and recent relay log to Harness clients over the generated `xpeach`
 * namespace, plus dashboard-surface reads gated on a personal access token.
 *
 * Spike scope: read-only endpoints only (token usage, token log, self profile,
 * token list). Sign-in flows and writes are intentionally out of scope.
 * @module @xpeach/xph-account
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { Context } from '@xpeach/xph-cordis'
import z from '@xpeach/xph-schemastery'
import { Remote, RemoteError, TypertRemoteService } from '@xpeach/xph-typert-protocol'
import { credentialRef, type CredentialRef } from '@xpeach/xph-credentials'
import type { JsonValue } from '@xpeach/xph-util-values'
import { launchEnvironmentOf } from '@xpeach/xph-launch-environment'
import { XPeachApi } from './api.ts'
import { scanOnboarding, importConversations as importThreads, importAssets as importLocalAssets } from './onboarding.ts'
import { DEFAULT_ROUTE_URL, ROUTES, chooseBest, probeRoutes } from './network.ts'
import type { XPeachAssetImportResult, XPeachConversationImportResult, XPeachOnboardingScan, XPeachSourceId } from './types.ts'
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

declare module '@xpeach/xph-cordis' {
  interface Context {
    /** XPeach site account Remote namespace owner. */
    xpeachAccount: XPeachAccount
  }
  interface Events {
    /**
     * One streamed delta from a playground `chat` call, emitted while the SSE
     * body is still arriving so the console can render tokens live. Best-effort
     * fan-out; the call's resolved reply remains the authoritative content.
     * @param chunk - call correlation id and the incremental text delta.
     * @mode emit
     */
    'xpeach/playground-chunk'(chunk: XPeachPlaygroundChunk): void
  }
}

declare module '@xpeach/xph-typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** No credential resolved for the configured reference. */
    'xpeach/missing-credential': { readonly ref: string }
    /** The site rejected or failed the management request. */
    'xpeach/request-failed': { readonly status: number; readonly message: string }
  }
}

/** Deployment knobs for the XPeach site route. */
export interface Config {
  /** New API site root used for management calls (default https://xpeach.codes). */
  readonly baseURL?: string
  /** Credential reference resolved per call (default XPEACH_API_KEY). */
  readonly apiKeyEnv?: string
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
}

/** Host service backing the generated `xpeach` Remote namespace. */
export class XPeachAccount extends TypertRemoteService {
  static inject = ['typert', 'credentials', 'settings']

  /** Whether this process already refreshed the picker catalog from the site. */
  private catalogSynced = false
  /** Guards a catalog refresh already in flight. */
  private catalogSyncing = false

  static Config: z<Config> = z.object({
    baseURL: z.string().default('https://fast.xpeach.codes'),
    apiKeyEnv: z.string().role('credential-ref').default('XPEACH_API_KEY'),
    timeoutMs: z.natural().min(1000).default(15000),
    watchModels: z.array(z.string()).default([
      'swe-2-max',
    ]),
    adminKeyFile: z.string().default(`${process.env.XPH_HOME ?? process.env.HOME + '/.dsh'}/profiles/xpeach/xpeach.admin`),
    adminKeyVar: z.string().default('XPEACH_ADMIN_KEY'),
    sessionKeyFile: z.string().default(`${process.env.XPH_HOME ?? process.env.HOME + '/.dsh'}/profiles/xpeach/xpeach.session`),
    sessionKeyVar: z.string().default('XPEACH_SESSION'),
    keyFile: z.string().default(join(process.env.XPH_HOME ?? homedir() + '/.dsh', 'profiles/xpeach/xpeach.key')),
    keyVar: z.string().default('XPEACH_RELAY_KEY'),
  })

  private readonly baseURL: string
  private activeBaseURL: string
  private networkAuto = true
  private networkSnapshot: XPeachNetworkSnapshot | undefined
  private readonly networkHistory: Record<string, XPeachNetworkPoint[]> = {}
  private readonly routeFile: string
  private networkApplied = false
  private readonly apiKeyEnv: CredentialRef
  private readonly timeoutMs: number
  private readonly watchModels: string[]
  private readonly api: XPeachApi
  private healthCache: { at: number; rows: readonly XPeachHealthRow[] } | undefined
  private readonly adminKeyFile: string
  private readonly adminKeyVar: string
  private readonly sessionKeyFile: string
  private readonly sessionKeyVar: string
  private readonly keyFile: string
  private readonly keyVar: string

  constructor(ctx: Context, config: Config) {
    super(ctx, 'xpeachAccount', { namespace: 'xpeach' })
    const resolved = config as Required<Config>
    this.baseURL = resolved.baseURL.replace(/\/+$/, '')
    this.apiKeyEnv = credentialRef(resolved.apiKeyEnv)
    this.timeoutMs = resolved.timeoutMs
    this.watchModels = resolved.watchModels
    this.keyFile = resolved.keyFile
    this.keyVar = resolved.keyVar
    this.routeFile = join(dirname(this.keyFile), 'xpeach.route.json')
    const storedRoute = this.readRouteFile()
    this.activeBaseURL = (storedRoute.url ?? DEFAULT_ROUTE_URL ?? this.baseURL).replace(/\/+$/, '')
    this.networkAuto = storedRoute.auto ?? true
    this.adminKeyFile = resolved.adminKeyFile
    this.adminKeyVar = resolved.adminKeyVar
    this.sessionKeyFile = resolved.sessionKeyFile
    this.sessionKeyVar = resolved.sessionKeyVar
    this.bootstrapKey()

    this.api = new XPeachApi({
      baseURL: this.activeBaseURL,
      timeoutMs: this.timeoutMs,
      resolveKey: () => this.resolveKey(),
      resolveAdmin: () => this.resolveAdmin(),
      resolveCookie: () => this.resolveSession(),
      priceCacheFile: join(dirname(this.keyFile), 'xpeach-pricing.json'),
    })
    // Background price refresh: TTL-gated so the wire only sees a fetch when
    // the snapshot aged (~10min); unref'd so the timer never pins the process.
    const timer = setInterval(() => { void this.api.pricingSync(false, AbortSignal.timeout(30_000)).catch(() => {}) }, 60_000)
    // Route health: probe the three API endpoints from the host (where LLM
    // traffic leaves) and switch when another route is clearly better.
    const networkTimer = setInterval(() => { void this.probeNetwork().catch(() => {}) }, 30_000)
    networkTimer.unref?.()
    const firstProbe = setTimeout(() => { void this.probeNetwork().catch(() => {}) }, 3000)
    firstProbe.unref?.()
    timer.unref?.()
  }

  /**
   * Our independent key channel: profile-local file → process.env export for
   * the LLM providers → never the shared credentials.yaml. Seeding from the
   * shared store happens exactly once (tracked by the .seeded sentinel); an
   * explicit unbind never resurrects.
   */
  private bootstrapKey(): void {
    let key = this.readKeyFile()
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
    try {
      const raw = readFileSync(this.slotsFile(), 'utf8')
      const arr = JSON.parse(raw) as { name?: unknown; key?: unknown }[]
      return Array.isArray(arr) ? arr.filter(e => typeof e?.key === 'string' && (e.key as string).startsWith('sk-'))
        .map(e => ({ name: typeof e.name === 'string' && e.name.length > 0 ? e.name : 'slot', key: e.key as string })) : []
    } catch { return [] }
  }
  private writeSlots(slots: { name: string; key: string }[]): void {
    mkdirSync(dirname(this.slotsFile()), { recursive: true })
    this.writeState(this.slotsFile(), JSON.stringify(slots))
  }

  /** This runtime's own home (XPH_HOME > DSH_HOME > ~/.dsh). */
  private ownHome(): string {
    return process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homedir(), '.dsh')
  }

  /** Relay-token metadata (id / name / groups) beside the key file. */
  private tokenInfoFile(): string { return this.keyFile.replace(/\.key$/, '.token') }
  private readTokenInfo(): { id?: number; name?: string; groups?: string[] } {
    try {
      const parsed = JSON.parse(readFileSync(this.tokenInfoFile(), 'utf8')) as Record<string, unknown>
      return {
        ...(typeof parsed.id === 'number' ? { id: parsed.id } : {}),
        ...(typeof parsed.name === 'string' ? { name: parsed.name } : {}),
        ...(Array.isArray(parsed.groups)
          ? { groups: parsed.groups.filter((g): g is string => typeof g === 'string' && g.length > 0) }
          : {}),
      }
    } catch { return {} }
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
      // Refresh groups from the site: the token may have been edited elsewhere.
      try {
        const detail = await this.api.adminTokenGet(info.id, signal)
        const groups = Array.isArray(detail.groups)
          ? detail.groups.filter((g): g is string => typeof g === 'string' && g.length > 0)
          : []
        const next = { ...info, groups }
        this.writeTokenInfo(next)
        return next
      } catch { return info }
    }
    try {
      const page = await this.api.adminTokens(1, 100, signal)
      const live = page.items
        .filter(t => t.status === 1 && ((t.name ?? '').startsWith('xph-') || (t.name ?? '').startsWith('dsh-')))
        .sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))[0]
      if (live === undefined) return info
      const detail = await this.api.adminTokenGet(live.id, signal)
      const groups = Array.isArray(detail.groups)
        ? detail.groups.filter((g): g is string => typeof g === 'string' && g.length > 0)
        : []
      const next = { id: live.id, ...(live.name !== undefined ? { name: live.name } : {}), groups }
      this.writeTokenInfo(next)
      return next
    } catch { return info }
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
   * Pick the relay token's initial groups: the user's own group when it carries
   * models, else the DSH-oriented SWE group, else the richest non-admin group.
   * A token left on the admin group (or no group) sees an empty /v1/models.
   */
  /**
   * Refresh the picker's catalog once per process.
   *
   * The site's model list changes without a rebind, so a profile that bound once
   * would otherwise keep a stale (or, on first boot, empty) list forever. The
   * first state read is the earliest point where both the settings service and
   * the bound token exist; later calls are no-ops.
   */
  private syncCatalogOnce(): void {
    if (this.catalogSyncing || this.catalogSynced) return
    const key = this.readKeyFile() ?? process.env[this.keyVar]?.trim()
    if (key === undefined || key.length === 0) return
    this.catalogSyncing = true
    void this.syncModelCatalog(new AbortController().signal)
      .then((result) => {
        // A settings service that is not up yet leaves the flag clear so the next
        // state read retries instead of freezing an empty picker.
        if (result.ok) this.catalogSynced = true
      })
      .catch(() => undefined)
      .finally(() => { this.catalogSyncing = false })
  }

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
   * Hot-applies (the adapter re-reads profiles per request).
   */
  private async syncModelCatalog(signal: AbortSignal): Promise<XPeachModelSyncResult> {
    const info = await this.ensureTokenInfo(signal)
    try {
      const list = await this.api.models(signal)
      const models = list.map(m => ({
        id: m.id,
        name: m.id,
        contextWindow: 262144,
        maxTokens: 32768,
        input: ['text'],
      }))
      const settings = this.ctx.get('settings') as
        | { update?: (ns: string, patch: object) => Promise<void> }
        | undefined
      if (settings?.update === undefined) return { ok: false, count: 0, groups: info.groups ?? [], error: 'settings service unavailable' }
      // The provider base is the OpenAI-compatible `/v1` root, not the site root.
      const siteRoot = this.api.siteBaseURL.replace(/\/+$/, '')
      const baseURL = siteRoot.endsWith('/v1') ? siteRoot : siteRoot + '/v1'
      await settings.update('llm-pi-ai', {
        providers: {
          xpeach: {
            displayName: '🍑Code',
            apiKeyEnv: this.keyVar,
            api: 'openai-completions',
            baseURL,
            models,
          },
        },
      })
      return { ok: true, count: models.length, groups: info.groups ?? [] }
    } catch (e) {
      return { ok: false, count: 0, groups: info.groups ?? [], error: e instanceof Error ? e.message.slice(0, 160) : String(e) }
    }
  }

  /**
   * Persist into the profile file + live env + the credentials service.
   * The service write is what llm-pi-ai actually reads: auth resolves a
   * credentialRef through ctx.credentials, and the launch-environment layer
   * is an immutable boot-time copy — process.env writes land nowhere the
   * provider can see. Publishing via ctx.credentials.set is the sanctioned
   * runtime record path (same as the web Models page), not a manual edit of
   * the shared yaml.
   */
  private persistKey(key: string): void {
    this.writeKeyFile(key)
    process.env[this.keyVar] = key
    void this.publishCredential(key)
  }

  /**
   * Persist the site-management token (the user's Access Token). This is the
   * credential the access-token channel sends as a raw Authorization header —
   * it never reaches the LLM provider; it only powers management surfaces and
   * the one-time API-key mint.
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
      // Without the record the llm route reports MISSING_CREDENTIAL at request
      // time — surface the publish failure so the real cause is on the log.
      console.error('[xpeach] credential publish failed:', e instanceof Error ? e.message : String(e))
    }
  }

  /** Drop the runtime record so a revoked key cannot keep serving a route. */
  private async revokeCredential(): Promise<void> {
    const creds = this.ctx.get('credentials') as { unset?: (ref: CredentialRef) => Promise<void> } | undefined
    try { await creds?.unset?.(credentialRef(this.keyVar)) } catch { /* best effort */ }
  }

  /** Notify clients (and the forwarded-event allowlist) the key changed. */
  private notifyKeyChanged(): void {
    for (const listener of this.ctx.events.dispatch('emit', ['credentials/record-updated', this.apiKeyEnv]) as Array<(s: string) => unknown>) {
      try { void listener(this.apiKeyEnv) } catch { /* contained */ }
    }
  }

  /**
   * Usage summary of the calling API token: name, granted/used quota, and the
   * model limits in force. Works with the relay sk- credential.
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
   * @param signal - carrier cancellation.
   * @returns the newest log entries.
   */
  @Remote('tokenLogs')
  async tokenLogs(_request: XPeachTokenLogsRequest, signal: AbortSignal): Promise<readonly XPeachTokenLogEntry[]> {
    return await this.api.tokenLogs(signal)
  }

  /**
   * The relay catalog the calling token may invoke: the site's /v1/models
   * list, already scoped to the token's group by the server.
   * @param signal - carrier cancellation.
   * @returns the catalog entries.
   */
  @Remote('models')
  async models(_request: XPeachModelsRequest, signal: AbortSignal): Promise<readonly XPeachModel[]> {
    return await this.api.models(signal)
  }

  /**
   * The configured watch list cross-checked against the live catalog: each
   * watched model id plus whether the site lets the token call it.
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
   * Bind a relay API key the user pasted: stores it under the configured
   * credential reference through the credentials service.
   * @param signal - carrier cancellation.
   * @returns the post-write bound state.
   */
  /** List stored key slots: masked prefix + which is active. */
  @Remote('keySlots')
  keySlotsOp(): { slots: readonly { name: string; prefix: string; active: boolean }[] } {
    const active = this.readKeyFile()
    return {
      slots: this.readSlots().map(s => ({
        name: s.name, prefix: s.key.slice(0, 8) + '…' + s.key.slice(-4), active: s.key === active,
      })),
    }
  }

  /** Add a slot (validates the key first), then activate it. */
  @Remote('keySlotAdd')
  async keySlotAddOp(request: { name: string; key: string }, signal: AbortSignal): Promise<{ ok: boolean; message: string }> {
    const key = request.key.trim()
    if (!key.startsWith('sk-')) return { ok: false, message: 'xpeach: key must start with sk-' }
    const prev = this.readKeyFile()
    this.persistKey(key)
    try {
      await this.api.tokenUsage(signal)
    } catch (e) {
      if (prev !== undefined) this.persistKey(prev)
      return { ok: false, message: e instanceof Error ? e.message : 'xpeach: key rejected' }
    }
    const slots = this.readSlots().filter(s => s.key !== key)
    slots.push({ name: request.name.trim() || 'slot-' + (slots.length + 1), key })
    this.writeSlots(slots)
    this.notifyKeyChanged()
    return { ok: true, message: 'xpeach: key slot added + active' }
  }

  /** Switch the active slot by index. */
  @Remote('keySlotSwitch')
  keySlotSwitchOp(request: { index: number }): { ok: boolean; message: string } {
    const slots = this.readSlots()
    const target = slots[request.index]
    if (target === undefined) return { ok: false, message: 'xpeach: slot index out of range' }
    this.persistKey(target.key)
    return { ok: true, message: 'xpeach: switched to ' + target.name }
  }

  /** Remove a slot; when active, clears the key file too. */
  @Remote('keySlotRemove')
  keySlotRemoveOp(request: { index: number }): { ok: boolean; message: string } {
    const slots = this.readSlots()
    const target = slots[request.index]
    if (target === undefined) return { ok: false, message: 'xpeach: slot index out of range' }
    const active = this.readKeyFile()
    slots.splice(request.index, 1)
    this.writeSlots(slots)
    if (target.key === active) {
      try { unlinkSync(this.keyFile) } catch { /* absent */ }
      process.env[this.keyVar] = ''
    }
    return { ok: true, message: 'xpeach: slot removed' }
  }

  /**
   * Bind the user's Access Token (the site-management token). The token is
   * verified against /api/user/self, persisted as the admin credential, and
   * used once to find-or-create the sk- relay token that LLM calls bill
   * through. An sk- value is rejected: that is an API key, not a management
   * credential.
   */
  @Remote('bindKey')
  async bindKey(request: XPeachBindKeyRequest, signal: AbortSignal): Promise<XPeachBindResult> {
    signal.throwIfAborted()
    const token = request.key.trim()
    if (token.length === 0) {
      throw new RemoteError('xpeach/request-failed', 'xpeach: paste your site Access Token', { status: 0, message: 'empty token' })
    }
    if (token.startsWith('sk-')) {
      throw new RemoteError(
        'xpeach/request-failed',
        'xpeach: 这是 API 令牌(sk-),不是管理令牌。请粘贴站点「个人设置 → 系统访问令牌」里的 Access Token。',
        { status: 0, message: 'api key, not access token' },
      )
    }
    this.persistAdmin(token)
    try {
      await this.api.adminSelf(signal)
    } catch (e) {
      // A rejected token must not linger as a stored credential.
      try { unlinkSync(this.adminKeyFile) } catch { /* absent */ }
      Reflect.deleteProperty(process.env, this.adminKeyVar)
      throw e
    }
    const mint = await this.mintKeyWithAccessToken(signal)
    if (!mint.ok) {
      throw new RemoteError(
        'xpeach/request-failed',
        'xpeach: 访问令牌已验证,但铸取 API 令牌失败:' + (mint.err ?? 'unknown'),
        { status: 0, message: 'mint failed' },
      )
    }
    this.notifyKeyChanged()
    // Populate the model picker from the site market; binding still succeeds
    // when the catalog sync is unavailable.
    await this.syncModelCatalog(signal).catch(() => {})
    return {
      bound: true,
      preview: mint.preview ?? 'sk-…',
      adminBound: true,
      adminPreview: token.slice(0, 4) + '…' + token.slice(-4),
    }
  }

  /**
   * Remove the bound credential.
   * @param signal - carrier cancellation.
   * @returns the post-write bound state.
   */
  @Remote('unbindKey')
  async unbindKey(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachBindResult> {
    signal.throwIfAborted()
    if (existsSync(this.keyFile)) unlinkSync(this.keyFile)
    // The Access Token is the management credential the relay key was minted
    // from — unbinding drops both so a shared machine leaves no admin power.
    if (existsSync(this.adminKeyFile)) unlinkSync(this.adminKeyFile)
    Reflect.deleteProperty(process.env, this.adminKeyVar)
    this.writeState(this.seededMarker(), '')
    Reflect.deleteProperty(process.env, this.keyVar)
    void this.revokeCredential()
    this.notifyKeyChanged()
    return { bound: false }
  }

  /**
   * Whether a credential is currently bound (no value exposure).
   * @param signal - carrier cancellation.
   * @returns the bound state.
   */
  @Remote('keyState')
  async keyState(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachBindResult> {
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
      this.ctx.events.dispatch('emit', ['xpeach/playground-chunk', { callId, delta }])
    } catch {
      // Event fan-out is best-effort; the assembled reply is the contract.
    }
  }

  /**
   * The signed-in user's profile as the site's dashboard reads it. Requires a
   * personal access token; a relay sk- credential gets 401.
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
   */
  @Remote('adminOverview')
  async adminOverview(_request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachAdminOverview> {
    return await this.api.adminOverview(signal)
  }

  /** Paged site-user list for the admin table. */
  @Remote('adminUsers')
  async adminUsers(request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminUser>> {
    return await this.api.adminUsers(request.page ?? 0, request.size ?? 20, signal)
  }

  /** Paged site-token list. */
  @Remote('adminTokens')
  async adminTokens(request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminToken>> {
    return await this.api.adminTokens(request.page ?? 0, request.size ?? 20, signal)
  }

  /** Full model-pricing catalog (entries + per-group ratio table). */
  @Remote('adminPricing')
  async adminPricing(_request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachPricingCatalog> {
    return await this.api.adminPricing(signal)
  }

  /**
   * Live health probe: a 1-token ping against each catalog model (or the
   * requested subset), six at a time, cached 60 s so repeated tab visits don't
   * re-burn quota. Failed rows carry their error for honest chips.
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
   * The four billing multipliers for one model: catalog ratios joined with the
   * group discount our token actually paid on its last call. Drives the
   * composer cost pill's live session spend.
   */
  @Remote('priceSync')
  async priceSync(request: { readonly force?: boolean }, signal: AbortSignal):
  Promise<{ at: number; entries: number; groups: number; stale: boolean }> {
    const snap = await this.api.pricingSync(request.force === true, signal)
    return { at: snap.at, entries: snap.entries.length, groups: Object.keys(snap.groups).length, stale: snap.stale }
  }

  @Remote('groups')
  async groups(_request: Record<string, never>, signal: AbortSignal):
  Promise<Record<string, { desc?: string; models?: readonly string[]; ratio?: string | number }>> {
    return await this.api.groups(signal)
  }

  @Remote('billingRate')
  async billingRate(request: { readonly model: string; readonly group?: string }, signal: AbortSignal):
  Promise<XPeachBillingRate | undefined> {
    return await this.api.billingRate(request.model, signal, request.group)
  }

  /** Paged site-wide call logs; query filters by username or model. */
  @Remote('adminLogs')
  async adminLogs(request: XPeachAdminPageRequest, signal: AbortSignal): Promise<XPeachAdminPage<XPeachAdminLogEntry>> {
    return await this.api.adminLogs(request.page ?? 0, request.size ?? 20, request.query, signal)
  }

  /**
   * The site-management token: its own profile file first, then our own env
   * var. No shared-yaml seeding — the admin token is a deliberate power-up the
   * operator drops in place, never something we migrate silently.
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
   * The site session cookie: profile file → env var. Full user scope for the
   * write surfaces (token CRUD / topup / profile edit / stripe pay). New API
   * requires a Turnstile-passed browser login, so this is a paste-in fallback —
   * the user copies 'session=' from their own site login and we store it here.
   */
  private resolveSession(): string | undefined {
    if (existsSync(this.sessionKeyFile)) {
      const value = readFileSync(this.sessionKeyFile, 'utf8').trim()
      if (value.length > 0) return value
    }
    const ambient = process.env[this.sessionKeyVar]?.trim()
    return ambient !== undefined && ambient.length > 0 ? ambient : undefined
  }

  @Remote('userLogs')
  async userLogsOp(request: { page?: number; size?: number }, signal: AbortSignal): Promise<XPeachSelfLogPage> {
    signal.throwIfAborted()
    return await this.api.userLogs(request.page ?? 0, request.size ?? 100, signal)
  }

  @Remote('userLogStat')
  async userLogStatOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachSelfLogStat> {
    signal.throwIfAborted()
    return await this.api.userLogStat(signal)
  }

  @Remote('userSelf')
  async userSelfOp(signal: AbortSignal): Promise<XPeachUserSelf> {
    return await this.api.userSelf(signal)
  }

  @Remote('sessionBound')
  sessionBoundOp(): { bound: boolean } {
    return { bound: this.api.sessionBound() }
  }

  @Remote('bindSession')
  async bindSession(value: string, signal: AbortSignal): Promise<{ bound: boolean; as?: string }> {
    const trimmed = value.trim()
    if (trimmed.length === 0) throw new RemoteError('xpeach/request-failed', 'xpeach: empty session cookie', { status: 0, message: 'empty session cookie' })
    this.writeState(this.sessionKeyFile, trimmed + '\n')
    // Prove it: one self fetch must succeed or the write is rolled back.
    try {
      const me = await this.api.userSelf(signal)
      return { bound: true, ...(me.username !== undefined ? { as: me.username } : {}) }
    } catch (e) {
      if (existsSync(this.sessionKeyFile)) { unlinkSync(this.sessionKeyFile) }
      throw e
    }
  }

  @Remote('sessionLogin')
  async sessionLoginOp(signal: AbortSignal): Promise<{ bound: boolean; as?: string; minted?: boolean; mintErr?: string }> {
    const cookie = await this.api.sessionLoginInteractive(signal)
    this.writeState(this.sessionKeyFile, cookie + '\n')
    try {
      const me = await this.api.userSelf(signal)
      const mint = await this.mintConsoleKey(signal)
      return {
        bound: true,
        ...(me.username !== undefined ? { as: me.username } : {}),
        minted: mint.ok,
        ...(mint.ok ? {} : { mintErr: mint.err ?? 'mint failed' }),
      }
    } catch (e) {
      if (existsSync(this.sessionKeyFile)) { unlinkSync(this.sessionKeyFile) }
      throw e
    }
  }

  /** Codex-style: mint a console PAT through the fresh session so a single
   * browser login binds BOTH the session cookie and an sk- key. Best-effort —
   * a mint failure leaves the session bound and reports mintErr instead. */
  private async mintConsoleKey(signal: AbortSignal): Promise<{ ok: boolean; err?: string }> {
    try {
      // Reuse the newest living dsh-* token when one exists — repeat logins
      // re-bind the same key instead of sprawling one token per sign-in.
      let id: number | undefined
      const page = await this.api.userTokens(0, signal)
      const live = page.items
        .filter(t => t.status === 1 && (t.name.startsWith('xph-') || t.name.startsWith('dsh-')))
        .sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))[0]
      if (live !== undefined) {
        id = live.id
      } else {
        const name = 'xph-' + new Date().toISOString().slice(0, 10) + '-' + Math.random().toString(36).slice(2, 6)
        await this.api.userTokenCreate({
          name, remain_quota: 0, expired_time: -1,
          unlimited_quota: true, model_limits_enabled: false, group: '',
        }, signal)
        // new-api create returns an empty data body — recover the id by name.
        const after = await this.api.userTokens(0, signal)
        const hit = after.items.filter(t => t.name === name).sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))[0]
        if (hit === undefined) return { ok: false, err: 'token not found after create' }
        id = hit.id
      }
      const revealed = await this.api.userTokenKey(id, signal)
      // New API stores the token key without the sk- prefix; the provider
      // needs the prefixed form.
      let key = revealed?.key
      if (typeof key !== 'string' || key.length === 0) return { ok: false, err: 'key reveal empty' }
      if (!key.startsWith('sk-')) key = 'sk-' + key
      this.persistKey(key)
      this.notifyKeyChanged()
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
        // new-api create may echo an empty body — recover the id by name.
        const after = await this.api.adminTokens(1, 100, signal)
        const hit = after.items.filter(t => t.name === name).sort((a, b) => (b.created_time ?? 0) - (a.created_time ?? 0))[0]
        if (hit === undefined) return { ok: false, err: 'token not found after create' }
        id = hit.id
      }
      // A reused token may sit on a group with no models (or no group at all).
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
      this.writeTokenInfo({ ...(id !== undefined ? { id } : {}), ...(name !== undefined ? { name } : {}), groups })
      const revealed = await this.api.adminTokenKey(id, signal)
      let key = revealed?.key
      if (typeof key !== 'string' || key.length === 0) return { ok: false, err: 'key reveal empty' }
      if (!key.startsWith('sk-')) key = 'sk-' + key
      this.persistKey(key)
      // Populate the model picker from the site's market for these groups.
      void this.syncModelCatalog(signal).catch(() => {})
      return { ok: true, preview: key.slice(0, 5) + '…' + key.slice(-4) }
    } catch (e) {
      return { ok: false, err: e instanceof Error ? e.message.slice(0, 120) : String(e) }
    }
  }

  /** Model market for this token: every priced group plus the callable models. */
  /** Whether the first-run onboarding already ran in this home. */
  @Remote('onboardingDone')
  async onboardingDoneOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<{ done: boolean }> {
    signal.throwIfAborted()
    return { done: existsSync(join(this.ownHome(), '.xpeach-onboarded')) }
  }

  /** Mark the first-run onboarding complete. */
  @Remote('onboardingComplete')
  async onboardingCompleteOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<{ done: boolean }> {
    signal.throwIfAborted()
    this.writeState(join(this.ownHome(), '.xpeach-onboarded'), new Date().toISOString() + '\n')
    return { done: true }
  }

  /** Latest route-health snapshot (probes once when no cycle has run yet). */
  @Remote('networkStatus')
  async networkStatusOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachNetworkSnapshot> {
    signal.throwIfAborted()
    return this.networkSnapshot ?? await this.probeNetwork()
  }

  /** Force one probe cycle now. */
  @Remote('networkProbe')
  async networkProbeOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachNetworkSnapshot> {
    signal.throwIfAborted()
    return await this.probeNetwork()
  }

  /** Toggle automatic route switching. */
  @Remote('networkAuto')
  async networkAutoOp(request: { auto: boolean }, signal: AbortSignal): Promise<XPeachNetworkSnapshot> {
    signal.throwIfAborted()
    this.networkAuto = request.auto === true
    this.writeRouteFile()
    if (this.networkAuto) void this.probeNetwork().catch(() => {})
    return { ...this.currentSnapshot(), auto: this.networkAuto }
  }

  /** Switch to one route manually. */
  @Remote('networkRoute')
  async networkRouteOp(request: { url: string }, signal: AbortSignal): Promise<XPeachNetworkSnapshot> {
    signal.throwIfAborted()
    const normalized = request.url.replace(/\/+$/, '')
    const route = ROUTES.find(item => item.url === normalized)
    if (route === undefined) {
      throw new RemoteError('xpeach/request-failed', 'xpeach: unknown route', { status: 0, message: 'unknown route' })
    }
    // A manual choice sticks: stop auto-switching until the user re-enables it.
    this.networkAuto = false
    this.writeRouteFile()
    this.applyRoute(route.url)
    void this.probeNetwork().catch(() => {})
    return { ...this.currentSnapshot(), active: this.activeBaseURL, auto: false }
  }

  /** Silent first-run detection of local conversation stores and agent assets. */
  @Remote('onboardingScan')
  async onboardingScanOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachOnboardingScan> {
    signal.throwIfAborted()
    return scanOnboarding()
  }

  /** Decode and import the selected conversation sources into this home. */
  @Remote('importConversations')
  async importConversationsOp(request: { sources: string[] }, signal: AbortSignal): Promise<XPeachConversationImportResult[]> {
    signal.throwIfAborted()
    const root = join(this.ownHome(), 'sessions')
    const known = new Set<XPeachSourceId>(['deepseek', 'claude', 'codex', 'zcode', 'chatgpt'])
    const results: XPeachConversationImportResult[] = []
    for (const source of request.sources ?? []) {
      if (!known.has(source as XPeachSourceId)) continue
      signal.throwIfAborted()
      results.push(importThreads(source as XPeachSourceId, root))
    }
    return results
  }

  /** Copy skills, merge prompts, and append MCP server rows to the profile. */
  @Remote('importAssets')
  async importAssetsOp(
    request: { mcp?: boolean; skills?: boolean; prompts?: boolean },
    signal: AbortSignal,
  ): Promise<XPeachAssetImportResult> {
    signal.throwIfAborted()
    return importLocalAssets(
      { mcp: request.mcp === true, skills: request.skills === true, prompts: request.prompts === true },
      this.ownHome(),
      join(dirname(this.keyFile), 'cordis.patch.yml'),
    )
  }

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

  /** Reassign the relay token's groups, then re-sync the model picker. */
  @Remote('setGroups')
  async setGroupsOp(request: { groups: string[] }, signal: AbortSignal): Promise<XPeachModelSyncResult> {
    signal.throwIfAborted()
    const info = await this.ensureTokenInfo(signal)
    if (info.id === undefined) return { ok: false, count: 0, groups: [], error: 'no relay token bound' }
    const groups = (request.groups ?? []).filter(g => typeof g === 'string' && g.length > 0)
    if (groups.length === 0) return { ok: false, count: 0, groups: [], error: 'pick at least one group' }
    const detail = await this.api.adminTokenGet(info.id, signal)
    await this.api.adminTokenUpdate({ ...detail, groups, group: groups[0] ?? '' }, signal)
    this.writeTokenInfo({ ...info, groups })
    return await this.syncModelCatalog(signal)
  }

  /** Re-read /v1/models and rewrite the picker's model list. */
  @Remote('syncModels')
  async syncModelsOp(_request: XPeachSelfRequest, signal: AbortSignal): Promise<XPeachModelSyncResult> {
    signal.throwIfAborted()
    return await this.syncModelCatalog(signal)
  }

  /** Who the bound session cookie resolves to (for the bound-row display). */
  @Remote('sessionUser')
  async sessionUserOp(signal: AbortSignal): Promise<{ bound: boolean; as?: string }> {
    if (this.resolveSession() === undefined) return { bound: false }
    try {
      const me = await this.api.userSelf(signal)
      return { bound: true, ...(me.username !== undefined ? { as: me.username } : {}) }
    } catch {
      return { bound: true }
    }
  }

  @Remote('unbindSession')
  unbindSessionOp(): { bound: boolean } {
    if (existsSync(this.sessionKeyFile)) { unlinkSync(this.sessionKeyFile) }
    Reflect.deleteProperty(process.env, this.sessionKeyVar)
    return { bound: false }
  }

  @Remote('userTokens')
  async userTokensOp(request: { page?: number }, signal: AbortSignal): Promise<XPeachTokenPage> {
    return await this.api.userTokens(request.page ?? 0, signal)
  }

  @Remote('userTokenCreate')
  async userTokenCreateOp(request: { payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userTokenCreate(request.payload, signal)
  }

  @Remote('userTokenDelete')
  async userTokenDeleteOp(request: { id: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userTokenDelete(request.id, signal)
  }

  @Remote('userTokenKey')
  async userTokenKeyOp(request: { id: number }, signal: AbortSignal): Promise<{ key?: string }> {
    return await this.api.userTokenKey(request.id, signal)
  }

  @Remote('userTopup')
  async userTopupOp(request: { key: string }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userTopup(request.key, signal)
  }

  @Remote('userAff')
  async userAffOp(signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return await this.api.userAff(signal)
  }

  @Remote('userTokenUpdate')
  async userTokenUpdateOp(request: { id: number; payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userTokenUpdate(request.id, request.payload, signal)
  }

  @Remote('userSelfEdit')
  async userSelfEditOp(request: { payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.userSelfEdit(request.payload, signal)
  }

  @Remote('userSelfData')
  async userSelfDataOp(signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return await this.api.userSelfData(signal)
  }

  @Remote('stripePay')
  async stripePayOp(request: { amount: number; method: string }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.stripePay(request.amount, request.method, signal)
  }

  @Remote('stripeAmount')
  async stripeAmountOp(request: { amount: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.stripeAmount(request.amount, signal)
  }

  @Remote('adminChannels')
  async adminChannelsOp(request: { page?: number }, signal: AbortSignal): Promise<XPeachAdminPage<XPeachChannel>> {
    return await this.api.adminChannels(request.page ?? 0, signal)
  }

  @Remote('adminRedemptions')
  async adminRedemptionsOp(request: { page?: number }, signal: AbortSignal): Promise<XPeachAdminPage<XPeachRedemption>> {
    return await this.api.adminRedemptions(request.page ?? 0, signal)
  }

  @Remote('adminOptionSet')
  async adminOptionSetOp(request: { key: string; value: string }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminOptionSet(request.key, request.value, signal)
  }

  @Remote('adminChannelSave')
  async adminChannelSaveOp(request: { payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminChannelSave(request.payload, signal)
  }

  @Remote('adminChannelDelete')
  async adminChannelDeleteOp(request: { id: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminChannelDelete(request.id, signal)
  }

  @Remote('adminChannelTest')
  async adminChannelTestOp(request: { id: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminChannelTest(request.id, signal) as Promise<XPeachWriteResult>
  }

  @Remote('adminTokenCreate')
  async adminTokenCreateOp(request: { payload: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminTokenCreate(request.payload, signal)
  }

  @Remote('adminTokenDelete')
  async adminTokenDeleteOp(request: { id: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminTokenDelete(request.id, signal)
  }

  @Remote('adminNoticeGet')
  async adminNoticeOp(signal: AbortSignal): Promise<{ text: string }> {
    return { text: await this.api.adminNotice(signal) }
  }

  @Remote('adminUserGet')
  async adminUserGetOp(request: { id: number }, signal: AbortSignal): Promise<Record<string, JsonValue>> {
    return await this.api.adminUserGet(request.id, signal)
  }

  @Remote('adminUserUpdate')
  async adminUserUpdateOp(request: { user: Record<string, JsonValue> }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminUserUpdate(request.user, signal)
  }

  @Remote('adminUserManage')
  async adminUserManageOp(request: { id: number; action: string; value: number }, signal: AbortSignal): Promise<XPeachWriteResult> {
    return await this.api.adminUserManage(request.id, request.action, request.value, signal)
  }

  @Remote('adminModelPricing')
  async adminModelPricingOp(signal: AbortSignal): Promise<XPeachModelPricingSnapshot> {
    return await this.api.adminModelPricing(signal)
  }

  @Remote('adminModelPricingPatch')
  async adminModelPricingPatchOp(request: { changes: readonly XPeachModelPricingChange[] }, signal: AbortSignal):
  Promise<XPeachWriteResult> {
    return await this.api.adminModelPricingPatch(request.changes, signal)
  }

  @Remote('adminOptions')
  async adminOptionsOp(signal: AbortSignal): Promise<{ entries: readonly { key: string; value: string }[] }> {
    return { entries: await this.api.adminOptions(signal) }
  }

  @Remote('adminRedemptionCreate')
  async adminRedemptionCreateOp(request: { quota: number; count: number; name: string }, signal: AbortSignal):
  Promise<{ keys: readonly string[] }> {
    return { keys: await this.api.adminRedemptionCreate(request.quota, request.count, request.name, signal) }
  }

  /** Persisted route choice ({ url, auto, at }). */
  private readRouteFile(): { url?: string; auto?: boolean } {
    try {
      const parsed = JSON.parse(readFileSync(this.routeFile, 'utf8')) as Record<string, unknown>
      return {
        ...(typeof parsed.url === 'string' && parsed.url.length > 0 ? { url: parsed.url } : {}),
        ...(typeof parsed.auto === 'boolean' ? { auto: parsed.auto } : {}),
      }
    } catch { return {} }
  }

  private writeRouteFile(): void {
    try {
      this.writeState(this.routeFile, JSON.stringify({ url: this.activeBaseURL, auto: this.networkAuto, at: Date.now() }))
    } catch { /* best effort */ }
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

  /** Keep the llm-pi-ai provider base in sync with the active route. */
  private async applyProviderBase(): Promise<void> {
    const settings = this.ctx.get('settings') as
      | { update?: (ns: string, patch: object) => Promise<void> }
      | undefined
    await settings?.update?.('llm-pi-ai', { providers: { xpeach: { baseURL: this.activeBaseURL + '/v1' } } })
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
    // One-shot migration: seed once from the shared seam, then never again —
    // deleting the credential there must not resurrect or disturb ours.
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
   * $DSH_HOME/sessions and $DSH_HOME/storages into this profile's isolated
   * roots. Read-only against the source — existing destination ids are left
   * untouched so re-running never clobbers XPeach-side history.
   * @param signal - carrier cancellation.
   * @returns copied/skipped counters plus the resolved roots for the UI note.
   */
  @Remote('importDeepseek')
  async importDeepseekOp(signal: AbortSignal): Promise<{ imported: number; skipped: number; files: number; source: string; dest: string }> {
    signal.throwIfAborted()
    // Source is always the stock DeepSeek home (its product root is fixed
    // ~/.dsh); destination follows this runtime's own home — under pnpm xph
    // that is ~/.xph via XPH_HOME, under legacy boots ~/.dsh/xpeach.
    const sourceHome = join(homedir(), '.dsh')
    // Mirrors home-paths precedence (XPH_HOME > DSH_HOME > ~/.dsh) without the
    // cross-package import — this op is the one place allowed to touch
    // another product's root, and only as a read-only source. Destination is
    // the runtime's own home root so files land exactly where the default
    // persistence/attachment roots scan (legacy ~/.dsh/xpeach staging merges
    // into ~/.xph the same way).
    const ownHome = process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homedir(), '.dsh')
    const destRoot = ownHome
    let imported = 0, skipped = 0, files = 0
    const copyTree = (src: string, dst: string, depth: number): void => {
      signal.throwIfAborted()
      if (!existsSync(src)) return
      mkdirSync(dst, { recursive: true })
      for (const entry of readdirSync(src, { withFileTypes: true })) {
        signal.throwIfAborted()
        const name = entry.name
        // Skip live writer locks and transient files — never live state.
        if (name === 'session.lock' || name.endsWith('.tmp') || name === '.DS_Store') continue
        const sp = join(src, name)
        const dp = join(dst, name)
        if (entry.isDirectory()) {
          if (depth > 0 && existsSync(dp)) { skipped += 1; continue }
          cpSync(sp, dp, { recursive: true, force: false, errorOnExist: false, filter: f => !f.endsWith('session.lock') && !f.endsWith('.tmp') })
          if (depth > 0) imported += 1
          else copyTree(sp, dp, 1)
        } else if (entry.isFile()) {
          if (!existsSync(dp)) { cpSync(sp, dp); files += 1 }
        }
      }
    }
    // Sessions: copy at project-dir granularity (depth 1 = workspace slug dirs;
    // each session-<uuid> dir is atomic — presence means "already imported").
    copyTree(join(sourceHome, 'sessions'), join(destRoot, 'sessions'), 0)
    copyTree(join(sourceHome, 'storages'), join(destRoot, 'storages'), 0)
    copyTree(join(sourceHome, 'attachments'), join(destRoot, 'attachments'), 0)
    return { imported, skipped, files, source: join(sourceHome, 'sessions'), dest: join(destRoot, 'sessions') }
  }
}

export default XPeachAccount
