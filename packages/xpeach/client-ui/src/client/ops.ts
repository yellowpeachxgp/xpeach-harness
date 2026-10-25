/** Shared operations face injected into the XPeach UI components. */
import type { XPeachModel, XPeachTokenLogEntry, XPeachTokenUsage } from '@xpeach/xph-account/types'

/** One combined usage/log read outcome. */
export interface XPeachData {
  readonly usage?: XPeachTokenUsage
  readonly logs?: readonly XPeachTokenLogEntry[]
  readonly error?: string
}

export interface XPeachUserSelfRow {
  readonly id?: number
  readonly username?: string
  readonly display_name?: string
  readonly email?: string
  readonly group?: string
  readonly quota?: number
  readonly used_quota?: number
  readonly role?: number
  readonly status?: number
  readonly aff_code?: string
  readonly aff_count?: number
  readonly aff_quota?: number
  readonly request_count?: number
  readonly has_password?: boolean
}

/** One own-usage log row (access-token channel). */
export interface XPeachSelfLogRow {
  readonly id: number
  readonly created_at: number
  readonly model_name?: string
  readonly token_name?: string
  readonly group?: string
  readonly quota: number
  readonly prompt_tokens: number
  readonly completion_tokens: number
  readonly use_time: number
  readonly is_stream?: boolean
  readonly other?: string
}

/** One page of own-usage logs. */
export interface XPeachSelfLogPage {
  readonly page: number
  readonly page_size: number
  readonly total: number
  readonly items: readonly XPeachSelfLogRow[]
}

/** Own-usage totals. */
export interface XPeachSelfLogStat {
  readonly quota: number
  readonly rpm: number
  readonly tpm: number
}
export interface XPeachUserTokenRow {
  readonly id: number
  readonly name: string
  readonly status: number
  readonly key?: string
  readonly key_prefix?: string
  readonly group?: string
  readonly remain_quota?: number
  readonly used_quota?: number
  readonly unlimited_quota?: boolean
  readonly expired_time?: number
  readonly created_time?: number
}
export interface XPeachChannelRow {
  readonly id: number
  readonly type: number
  readonly name: string
  readonly status: number
  readonly weight?: number
  readonly priority?: number
  readonly group?: string
  readonly models?: string
  readonly base_url?: string
  readonly response_time?: number
  readonly auto_ban?: number
  readonly used_quota?: number
  readonly test_time?: number
}
export interface XPeachRedemptionRow {
  readonly id: number
  readonly key: string
  readonly status: number
  readonly name?: string
  readonly quota?: number
  readonly created_time?: number
  readonly redeemed_time?: number
  readonly used_user_id?: number
}

/** One site group in the model market. */
export interface XPeachSiteGroup {
  readonly name: string
  readonly desc?: string
  readonly ratio?: number
  readonly models: number
}

/** The site's model market for the bound token. */
export interface XPeachSiteCatalog {
  readonly groups: readonly XPeachSiteGroup[]
  readonly tokenGroups: readonly string[]
  readonly models: readonly string[]
  readonly tokenId?: number
}

/** Outcome of a model-catalog sync. */
export interface XPeachModelSyncResult {
  readonly ok: boolean
  readonly count: number
  readonly groups: readonly string[]
  readonly error?: string
}

/** One detected local conversation store. */
export interface XPeachDetectedSource {
  id: 'deepseek' | 'claude' | 'codex' | 'zcode' | 'chatgpt'
  label: string
  path: string
  found: boolean
  threads: number
  detail?: string
}

/** One MCP server declared by a local agent. */
export interface XPeachDetectedMcp { readonly source: string, readonly name: string, readonly config: Readonly<Record<string, unknown>> }

/** One skill directory found under a local agent. */
export interface XPeachDetectedSkill { readonly source: string, readonly name: string, readonly path: string }

/** One user-global instruction file found under a local agent. */
export interface XPeachDetectedPrompt { readonly source: string, readonly path: string, readonly preview: string }

/** Silent first-run detection report. */
export interface XPeachOnboardingScan {
  readonly sources: readonly XPeachDetectedSource[]
  readonly mcp: readonly XPeachDetectedMcp[]
  readonly skills: readonly XPeachDetectedSkill[]
  readonly prompts: readonly XPeachDetectedPrompt[]
}

/** Per-source conversation import outcome. */
export interface XPeachConversationImportResult {
  readonly source: string
  readonly imported: number
  readonly skipped: number
  readonly error?: string
}

/** Skills / prompts / MCP import outcome. */
export interface XPeachAssetImportResult {
  readonly mcp: number
  readonly skills: number
  readonly prompts: number
  readonly errors: readonly string[]
}

/** One probed API route. */
export interface XPeachNetworkRoute {
  readonly id: string
  readonly label: string
  readonly url: string
  readonly latencyMs?: number
  readonly loss: number
  readonly samples: number
  readonly ok: boolean
}

/** One history point for a route sparkline. */
export interface XPeachNetworkPoint { readonly at: number, readonly latencyMs?: number, readonly loss: number }

/** Latest network snapshot. */
export interface XPeachNetworkSnapshot {
  readonly at: number
  readonly active: string
  readonly auto: boolean
  readonly probes: readonly XPeachNetworkRoute[]
  readonly history: Readonly<Record<string, readonly XPeachNetworkPoint[]>>
}

/** Operations the plugin injects into the Cordis-free components. */
export interface XPeachOps {
  /** Read only the token usage summary (fast — one small request). */
  readonly loadUsage: () => Promise<XPeachData>
  /** Read usage plus the token's log tail (heavier — the site returns it whole). */
  readonly load: () => Promise<XPeachData>
  /** List the relay models the bound key may call. */
  readonly models: () => Promise<readonly XPeachModel[] | { error: string }>
  /** Configured ids cross-checked against the site catalog (✓/✗). */
  readonly modelMatch: () => Promise<readonly { id: string, available: boolean }[] | { error: string }>
  /** Whether a relay key is bound; carries the masked preview when bound. */
  readonly keyState: () => Promise<{ readonly bound: boolean, readonly preview?: string, readonly adminBound?: boolean, readonly adminPreview?: string }>
  /** Bind a pasted sk- key. Returns an error message or null on success. */
  readonly bind: (key: string) => Promise<string | null>
  /** Remove the bound key. */
  readonly unbind: () => Promise<void>
  /**
   * Playground call: run a chat completion on any catalog model with the
   * bound key. Returns the reply or an error string.
   */
  readonly chat: (model: string, prompt: string, callId?: string) => Promise<
    { content: string, promptTokens: number, completionTokens: number, latencyMs: number } | { error: string }>
  /** Model ids currently mounted on the xpeach provider route. */
  readonly mountedModels: () => Promise<readonly string[]>
  /**
   * Write a site catalog model into the llm-pi-ai providers.xpeach.models
   * list via settings.mutate — live-registers the route, no restart.
   * @returns error message or null on success.
   */
  readonly addModel: (id: string) => Promise<string | null>
  /** Whether the product providers send the conversation tracking headers. */
  readonly trackingState: () => Promise<boolean>
  /** Turn the tracking headers on or off for every product provider; null on success. */
  readonly setTracking: (enabled: boolean) => Promise<string | null>
  /** Which wire the catalogue routes prefer. */
  readonly protocolPreference: () => Promise<'compatible' | 'native' | 'auto'>
  /** Choose the wire preference and re-sync the catalogue; null on success. */
  readonly setProtocolPreference: (value: 'compatible' | 'native' | 'auto') => Promise<string | null>
  /** Model families the site offers, and the ones currently kept. */
  readonly families: () => Promise<{ all: readonly string[]; enabled: readonly string[] }>
  /** Keep only these families (empty keeps all); null on success. */
  readonly setFamilies: (enabled: readonly string[]) => Promise<string | null>
  /**
   * Select a mounted model for THIS session (and persist it as the default):
   * the "加入并选中" end of the one-stop chain. Bound per pane instance.
   * @returns error message or null on success.
   */
  readonly selectModel?: (sessionId: string | undefined, model: string) => Promise<string | null>
  /** Routes used recently, most recent first. */
  readonly recents: () => Promise<readonly { provider: string, model: string }[]>
  /** Remember one route as just used. */
  readonly rememberModel: (provider: string, model: string) => Promise<void>
  /** Site-admin overview aggregate (requires the management token). */
  readonly adminOverview: () => Promise<
    { adminName: string, totalUsers: number, totalLogs: number, totalTokens: number,
      groups: readonly string[], selfQuotaUsed?: number | undefined, rpm?: number | undefined, tpm?: number | undefined } | { error: string }>
  /** Paged site-user list. */
  readonly adminUsers: (page: number, size?: number) => Promise<
    { page: number, page_size: number, total: number, items: readonly XPeachAdminUserRow[] } | { error: string }>
  /** Paged site-token list. */
  readonly adminTokens: (page: number, size?: number) => Promise<
    { page: number, page_size: number, total: number, items: readonly XPeachAdminTokenRow[] } | { error: string }>
  /** Full pricing catalog (entries + per-group ratio table). */
  readonly adminPricing: () => Promise<XPeachPricingCatalog | { error: string }>
  /**
   * The four billing multipliers for a model, recovered from the pricing
   * catalog plus the group discount the token actually paid last time.
   * Undefined when the admin token is not bound or the model is unpriced.
   */
  readonly billingRate: (model: string, group?: string) => Promise<XPeachBillingRate | { error: string } | undefined>
  /**
   * PAT-readable group catalog: name → { desc, models, ratio }. The model→group
   * picker's data — every group that can serve a model and its price multiplier.
   */
  /** The price sync table's freshness stamp + row counts (see api.pricingSync). */
  readonly priceSync: (force?: boolean) => Promise<{ at: number, entries: number, groups: number, stale: boolean } | { error: string }>
  readonly groupCatalog: () => Promise<Readonly<Record<string, { desc?: string, models?: readonly string[], ratio?: string | number }>> | { error: string }>
  /** Live probe of the catalog (60s host-side cache). */
  readonly modelHealth: () => Promise<readonly XPeachHealthRow[] | { error: string }>
  /** Paged site-wide call logs; optional username filter. */
  readonly adminLogs: (page: number, size?: number, query?: string) => Promise<
    { page: number, page_size: number, total: number, items: readonly XPeachAdminLogRow[] } | { error: string }>
  /** Session cookie bound? (gates user-write surfaces). */
  readonly sessionBound: () => Promise<{ bound: boolean } | { error: string }>
  /** Bind a pasted site session cookie (value after 'session='). */
  readonly bindSession: (cookie: string) => Promise<{ error?: string, as?: string }>
  readonly unbindSession: () => Promise<void>
  /** Own user card — username/email/group/quota (session cookie required). */
  readonly userSelf: () => Promise<XPeachUserSelfRow | { error: string }>
  /** Own token list page. */
  readonly userTokens: (page?: number) => Promise<{ items: readonly XPeachUserTokenRow[], total: number } | { error: string }>
  /** Own usage log page (newest first). */
  readonly userLogs: (page: number, size: number) => Promise<XPeachSelfLogPage | { error: string }>
  /** Own usage totals (quota / rpm / tpm). */
  readonly userLogStat: () => Promise<XPeachSelfLogStat | { error: string }>
  /** First-run detection of local conversation stores and agent assets. */
  readonly onboardingScan: () => Promise<XPeachOnboardingScan | { error: string }>
  /** Import the selected conversation sources. */
  readonly importConversations: (sources: string[]) => Promise<readonly XPeachConversationImportResult[] | { error: string }>
  /** Copy skills, merge prompts, append MCP rows. */
  readonly importAssets: (selection: { mcp: boolean, skills: boolean, prompts: boolean }) => Promise<XPeachAssetImportResult | { error: string }>
  /** Whether the first-run onboarding already ran. */
  readonly onboardingDone: () => Promise<{ done: boolean }>
  /** Mark the first-run onboarding complete. */
  readonly onboardingComplete: () => Promise<{ done: boolean }>
  /** Latest route-health snapshot. */
  readonly networkStatus: () => Promise<XPeachNetworkSnapshot | { error: string }>
  /** Force one probe cycle. */
  readonly networkProbe: () => Promise<XPeachNetworkSnapshot | { error: string }>
  /** Toggle automatic route switching. */
  readonly networkAuto: (auto: boolean) => Promise<XPeachNetworkSnapshot | { error: string }>
  /** Switch to one route manually. */
  readonly networkRoute: (url: string) => Promise<XPeachNetworkSnapshot | { error: string }>
  /** Open the plugin manager panel. */
  readonly openPlugins: () => void
  /** Recent local sessions for the profile's "recent works" row. */
  readonly recentSessions: () => Promise<readonly { id: string, cwd?: string, updatedAt: number }[] | { error: string }>
  /** Redeem a top-up code. */
  readonly userTopup: (key: string) => Promise<string | null>
  /** Stripe: money preview for amount, then checkout URL. */
  readonly stripeAmount: (amount: number) => Promise<{ money: string } | { error: string }>
  readonly stripePay: (amount: number, method: string) => Promise<{ url: string } | { error: string }>
  /** Admin paged channel list. */
  readonly adminChannels: (page?: number) => Promise<{ page: number, page_size: number, total: number, items: readonly XPeachChannelRow[] } | { error: string }>
  /** Admin paged redemption list + generator. */
  readonly adminRedemptions: (page?: number) => Promise<{ page: number, page_size: number, total: number, items: readonly XPeachRedemptionRow[] } | { error: string }>
  readonly adminRedemptionCreate: (quota: number, count: number, name: string) => Promise<{ keys: readonly string[] } | { error: string }>
  readonly adminOptionSet: (key: string, value: string) => Promise<{ error?: string }>
  readonly adminChannelSave: (payload: Record<string, unknown>) => Promise<string | null>
  readonly adminChannelDelete: (id: number) => Promise<string | null>
  readonly adminChannelTest: (id: number) => Promise<string | null>
  readonly adminTokenCreate: (payload: Record<string, unknown>) => Promise<string | null>
  readonly adminTokenDelete: (id: number) => Promise<string | null>
  readonly adminOptions: () => Promise<{ entries: readonly { key: string, value: string }[] } | { error: string }>
  readonly adminModelPricing: () => Promise<XPeachModelPricingSnapshotRow | { error: string }>
  readonly adminModelPricingPatch: (changes: readonly XPeachModelPricingChangeRow[]) => Promise<string | null>
  readonly keySlots: () => Promise<readonly { name: string, prefix: string, active: boolean }[]>
  readonly keySlotAdd: (name: string, key: string) => Promise<string | null>
  readonly keySlotSwitch: (index: number) => Promise<string | null>
  readonly keySlotRemove: (index: number) => Promise<string | null>
  readonly userTokenCreate: (payload: Record<string, unknown>) => Promise<string | null>
  readonly userTokenUpdate: (id: number, payload: Record<string, unknown>) => Promise<string | null>
  readonly userTokenDelete: (id: number) => Promise<string | null>
  readonly userSelfEdit: (payload: Record<string, unknown>) => Promise<string | null>
  readonly userAff: () => Promise<Record<string, unknown> | { error: string }>
  readonly userTokenKey: (id: number) => Promise<string | { error: string }>
  readonly adminUserGet: (id: number) => Promise<Record<string, unknown> | { error: string }>
  readonly adminUserUpdate: (user: Record<string, unknown>) => Promise<string | null>
  readonly adminUserManage: (id: number, action: string, value: number) => Promise<string | null>
  readonly sessionUser: () => Promise<{ bound: boolean, as?: string }>
  readonly sessionLogin: () => Promise<{ bound: boolean, as?: string, error?: string, minted?: boolean, mintErr?: string }>
  /** One-way copy of the stock DeepSeek Harness session + storage roots into this profile's isolated tree. */
  readonly importDeepseek: () => Promise<{ imported: number, skipped: number, files: number, source: string, dest: string } | { error: string }>
  /** Site model market: groups + the models this token can call. */
  readonly siteCatalog: () => Promise<XPeachSiteCatalog | { error: string }>
  /** Reassign the relay token's groups, then re-sync the model picker. */
  readonly setGroups: (groups: string[]) => Promise<XPeachModelSyncResult | { error: string }>
  /** Re-read /v1/models and rewrite the picker's model list. */
  readonly syncModels: () => Promise<XPeachModelSyncResult | { error: string }>
  /**
   * Subscribe to streamed playground deltas ('xpeach/playground-chunk').
   * @returns unsubscribe disposer.
   */
  readonly subscribePlaygroundChunk: (fn: (chunk: { callId: string, delta: string }) => void) => () => void
  /**
   * Notify whenever the credential seam may have changed (bind/unbind or an
   * out-of-band write); consumers re-read their views.
   * @param fn - invalidate callback.
   * @returns disposer.
   */
  readonly subscribeCredentialChange: (fn: () => void) => () => void
}

/** Admin-facing row aliases kept client-side (mirrors host types). */
export interface XPeachAdminUserRow {
  id: number, username: string, display_name?: string, email?: string, role?: number,
  status?: number, group?: string, quota?: number, used_quota?: number,
  request_count?: number, aff_count?: number, aff_quota?: number
}
export interface XPeachAdminTokenRow {
  id: number, user_id: number, name?: string, key?: string, status?: number,
  group?: string, remain_quota?: number, used_quota?: number, unlimited_quota?: boolean,
  created_time?: number, accessed_time?: number
}
export interface XPeachAdminLogRow {
  id: number, user_id?: number, username?: string, token_name?: string,
  model_name?: string, group?: string, channel_name?: string, quota?: number,
  prompt_tokens?: number, completion_tokens?: number, use_time?: number,
  created_at?: number, is_stream?: boolean
}
export interface XPeachPricingRow {
  model_name: string, vendor_id?: number, quota_type?: number, model_ratio?: number,
  model_price?: number, completion_ratio?: number, cache_ratio?: number, create_cache_ratio?: number,
  description?: string, tags?: string, icon?: string,
  enable_groups?: readonly string[], supported_endpoint_types?: readonly string[]
}

/** Live billing multipliers for one model (catalog ratios + the group discount actually paid). */
export interface XPeachBillingRate {
  readonly modelRatio: number
  readonly completionRatio: number
  readonly cacheRatio: number
  readonly groupRatio: number
}

/** Pricing catalog: entry rows + per-group ratio table. */
export interface XPeachPricingCatalog {
  readonly entries: readonly XPeachPricingRow[]
  readonly groupRatio: Readonly<Record<string, number>>
}

/** One measured health row for a probed model (optional fields mirror the remote face). */
export interface XPeachHealthRow {
  readonly id: string
  readonly ok: boolean
  readonly mocked?: boolean | undefined
  readonly latencyMs?: number | undefined
  readonly error?: string | undefined
}

/** Row types for the model-pricing admin surface. */
export interface XPeachModelPricingEntryRow {
  readonly model_name: string
  readonly version: string
  readonly configured: Record<string, unknown>
  readonly effective: Record<string, unknown>
}
export interface XPeachModelPricingSnapshotRow {
  readonly entries: readonly XPeachModelPricingEntryRow[]
  readonly options: Record<string, string>
  readonly empty_version: string
}
export interface XPeachModelPricingChangeRow {
  readonly model_name: string
  readonly expected_version: string
  readonly pricing?: Record<string, unknown>
  readonly reset?: boolean
}
