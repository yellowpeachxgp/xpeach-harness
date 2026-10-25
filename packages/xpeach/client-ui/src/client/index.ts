/** XPeach client face: peach brand, quota pill, quota notice, settings section. */
import type { Context } from '@xpeach/xph-cordis'
// Type-only: ambient merges — ctx.slots, ctx.locale, ctx.theme, ctx.remote and
// every SlotMap/LocaleNamespaceMap seat this plugin occupies.
import type {} from '@xpeach/xph-client-ui-renderer/client'
import type {} from '@xpeach/xph-client-locale/client'
import type {} from '@xpeach/xph-client-ui-theme/client'
import type {} from '@xpeach/xph-client-ui-sidebar/client'
import type { MainPanelId } from '@xpeach/xph-client-ui-layout/client'
import type {} from '@xpeach/xph-client-ui-layout/client'
import type {} from '@xpeach/xph-client-ui-settings/client'
import type {} from '@xpeach/xph-client-ui-settings/client'
import type {} from '@xpeach/xph-client-ui-chat/client'
import type {} from '@xpeach/xph-client-ui-conversation/client'
import type {} from '@xpeach/xph-client-ui-sidebar-right/client'
import type { QuotaNoticeOwnerProps } from '@xpeach/xph-client-ui-chat/client'
import xpeachRemote from '@xpeach/xph-account/remote'
import type { XPeachData, XPeachOps } from './ops.ts'
import { XPeachMark, XPeachName } from './brand.tsx'
import { XPeachStatusPill } from './StatusPill.tsx'
import { XPeachOnboarding } from './XPeachOnboarding.tsx'
import { XPeachSettingsLauncher } from './XPeachSettingsLauncher.tsx'
import { XPeachQuotaNotice } from './QuotaNotice.tsx'
import { XPeachSection } from './XPeachSection.tsx'
import { XPeachTab, type XPeachTabProps } from './XPeachTab.tsx'
import { footerBridge } from './FooterAction.tsx'
import { XPeachCostPill } from './XPeachCostPill.tsx'
import { en, NS, zh } from './locales.ts'
import { readRecents, rememberModel } from './recents.ts'
import { PALETTES, paletteTokens } from './palettes.ts'
import { PaletteRow } from './PaletteRow.tsx'

/** Services needed at mount time (the xpeach namespace joins as remote.xpeach). */
export const inject = ['remote', 'slots', 'locale', 'theme', 'layout']

/**
 * Register the 🍑Code UI surface inside a child context that legally injects
 * the freshly-mounted `remote.xpeach` namespace.
 * @param ctx - child context carrying remote.xpeach.
 * @returns list of registration disposers.
 */
function registerUi(ctx: Context): Array<() => void> {
  const ops: XPeachOps = {
    loadUsage: async (): Promise<XPeachData> => {
      const usage = await ctx.remote.xpeach.tokenUsage({})
      if (!usage.ok) return { error: usage.error.message }
      return { usage: usage.value }
    },
    load: async (): Promise<XPeachData> => {
      const usage = await ctx.remote.xpeach.tokenUsage({})
      if (!usage.ok) return { error: usage.error.message }
      const logs = await ctx.remote.xpeach.tokenLogs({})
      if (logs.ok) return { usage: usage.value, logs: logs.value }
      return { usage: usage.value, error: logs.error.message }
    },
    models: async () => {
      const result = await ctx.remote.xpeach.models({})
      if (!result.ok) return { error: result.error.message }
      return result.value
    },
    modelMatch: async () => {
      const result = await ctx.remote.xpeach.modelMatch({})
      if (!result.ok) return { error: result.error.message }
      return result.value
    },
    keyState: async () => {
      const result = await ctx.remote.xpeach.keyState({})
      return result.ok ? result.value : { bound: false }
    },
    bind: async (key: string) => {
      const result = await ctx.remote.xpeach.bindKey({ key })
      return result.ok ? null : result.error.message
    },
    unbind: async () => { await ctx.remote.xpeach.unbindKey({}) },
    chat: async (model: string, prompt: string, callId?: string) => {
      const result = await ctx.remote.xpeach.chat({ model, prompt, callId })
      return result.ok ? result.value : { error: result.error.message }
    },
    mountedModels: async () => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return []
      const view = described.value.namespaces.find(ns => ns.ns === 'llm-pi-ai')
      const providers = (view?.value as { providers?: Record<string, { models?: { id: string }[] }> } | undefined)?.providers
      return [...(providers?.xpeach?.models ?? []), ...(providers?.['xpeach-completions']?.models ?? [])].map(m => m.id)
    },
    addModel: async (id: string) => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return described.error.message
      const view = described.value.namespaces.find(ns => ns.ns === 'llm-pi-ai')
      const providers = (view?.value as { providers?: Record<string, { apiKeyEnv?: string, baseUrl?: string, models?: { id: string }[] }> } | undefined)?.providers
      // Route by wire format: the relay's anthropic/openai channels expect
      // chat-completions; only the swe-* lane speaks openai-responses. The wrong
      // format is a hard 400 at the door (field messages is required).
      const completions = 'xpeach-completions'
      const key = /^swe-/i.test(id) ? 'xpeach' : completions
      const source = providers?.xpeach
      if (providers?.[key]?.models?.some(m => m.id === id)) return null
      type JsonV = null | boolean | number | string | JsonV[] | { [k: string]: JsonV }
      const opsList: { op: 'set', path: string[], value: JsonV }[] = []
      if (providers?.[completions] === undefined && source !== undefined) {
        const { models: _m, ...rest } = source as Record<string, JsonV>
        opsList.push({ op: 'set', path: ['providers', completions], value: { ...rest, api: 'openai-completions', models: [] } })
      }
      const existing = providers?.[key]?.models ?? []
      const entry = { id, name: id, contextWindow: 256000, maxTokens: 8192, input: ['text'] }
      opsList.push({ op: 'set', path: ['providers', key, 'models'], value: [...existing, entry] as JsonV })
      const written = await ctx.remote.settings.mutate('llm-pi-ai', opsList, view?.revision)
      return written.ok ? null : written.error.message
    },
    trackingState: async () => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return true
      const view = described.value.namespaces.find(ns => ns.ns === 'llm-pi-ai')
      const providers = (view?.value as { providers?: Record<string, { conversationTracking?: boolean }> } | undefined)?.providers ?? {}
      // The switch writes every product provider together, so the canonical one
      // speaks for all of them. An absent field means on: the relay is more
      // likely to reject a request that names no conversation than to mind the
      // headers.
      return providers.xpeach?.conversationTracking !== false
    },
    setTracking: async (enabled: boolean) => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return described.error.message
      const view = described.value.namespaces.find(ns => ns.ns === 'llm-pi-ai')
      const providers = (view?.value as { providers?: Record<string, unknown> } | undefined)?.providers ?? {}
      type JsonV = null | boolean | number | string | JsonV[] | { [k: string]: JsonV }
      const opsList: { op: 'set', path: string[], value: JsonV }[] = []
      for (const key of Object.keys(providers)) {
        if (!key.startsWith('xpeach')) continue
        opsList.push({ op: 'set', path: ['providers', key, 'conversationTracking'], value: enabled })
      }
      if (opsList.length === 0) return null
      const written = await ctx.remote.settings.mutate('llm-pi-ai', opsList, view?.revision)
      return written.ok ? null : written.error.message
    },
    protocolPreference: async () => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return 'compatible'
      const view = described.value.namespaces.find(ns => ns.ns === 'xpeach')
      const value = (view?.value as { protocolPreference?: string } | undefined)?.protocolPreference
      return value === 'native' || value === 'auto' ? value : 'compatible'
    },
    setProtocolPreference: async (value) => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return described.error.message
      const view = described.value.namespaces.find(ns => ns.ns === 'xpeach')
      const written = await ctx.remote.settings.mutate('xpeach', [{ op: 'set', path: ['protocolPreference'], value }], view?.revision)
      return written.ok ? null : written.error.message
    },
    families: async () => {
      const described = await ctx.remote.settings.describe()
      const catalogue = await ctx.remote.xpeach.models({})
      const all = catalogue.ok
        ? [...new Set(catalogue.value.flatMap(m => (m as { groups?: readonly string[] }).groups ?? []))].sort()
        : []
      const view = described.ok ? described.value.namespaces.find(ns => ns.ns === 'xpeach') : undefined
      const enabled = (view?.value as { enabledFamilies?: readonly string[] } | undefined)?.enabledFamilies ?? []
      return { all, enabled }
    },
    setFamilies: async (enabled) => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return described.error.message
      const view = described.value.namespaces.find(ns => ns.ns === 'xpeach')
      const written = await ctx.remote.settings.mutate('xpeach', [{ op: 'set', path: ['enabledFamilies'], value: [...enabled] }], view?.revision)
      return written.ok ? null : written.error.message
    },
    recents: async () => readRecents(),
    rememberModel: async (provider: string, model: string) => { rememberModel(provider, model) },
    adminOverview: async () => {
      const r = await ctx.remote.xpeach.adminOverview({})
      return r.ok ? r.value : { error: r.error.message }
    },
    adminUsers: async (page: number, size?: number) => {
      const r = await ctx.remote.xpeach.adminUsers({ page, size })
      return r.ok ? r.value : { error: r.error.message }
    },
    adminTokens: async (page: number, size?: number) => {
      const r = await ctx.remote.xpeach.adminTokens({ page, size })
      return r.ok ? r.value : { error: r.error.message }
    },
    adminPricing: async () => {
      const r = await ctx.remote.xpeach.adminPricing({})
      return r.ok ? r.value : { error: r.error.message }
    },
    modelHealth: async () => {
      const r = await ctx.remote.xpeach.modelHealth({})
      return r.ok ? r.value : { error: r.error.message }
    },
    billingRate: async (model: string, group?: string) => {
      const r = await ctx.remote.xpeach.billingRate(group === undefined ? { model } : { model, group })
      return r.ok ? r.value : { error: r.error.message }
    },
    groupCatalog: async () => {
      const r = await ctx.remote.xpeach.groups({})
      return r.ok ? r.value : { error: r.error.message }
    },
    priceSync: async (force?: boolean) => {
      const r = await ctx.remote.xpeach.priceSync(force === true ? { force: true } : {})
      return r.ok ? r.value : { error: r.error.message }
    },
    adminLogs: async (page: number, size?: number, query?: string) => {
      const r = await ctx.remote.xpeach.adminLogs({ page, size, query })
      return r.ok ? r.value : { error: r.error.message }
    },
    sessionBound: async () => {
      const r = await ctx.remote.xpeach.sessionBound()
      return r.ok ? r.value : { error: r.error.message }
    },
    siteCatalog: async () => {
      const result = await ctx.remote.xpeach.siteCatalog({})
      if (!result.ok) return { error: result.error.message }
      return result.value
    },
    setGroups: async (groups) => {
      const result = await ctx.remote.xpeach.setGroups({ groups })
      if (!result.ok) return { error: result.error.message }
      return result.value
    },
    syncModels: async () => {
      const result = await ctx.remote.xpeach.syncModels({})
      if (!result.ok) return { error: result.error.message }
      return result.value
    },
    importDeepseek: async () => {
      const r = await ctx.remote.xpeach.importDeepseek()
      return r.ok ? r.value : { error: r.error.message }
    },
    bindSession: async (cookie: string) => {
      const r = await ctx.remote.xpeach.bindSession(cookie)
      return r.ok ? { ...(r.value.as !== undefined ? { as: r.value.as } : {}) } : { error: r.error.message }
    },
    unbindSession: async () => {
      await ctx.remote.xpeach.unbindSession()
    },
    userSelf: async () => {
      const r = await ctx.remote.xpeach.userSelf()
      return r.ok ? r.value : { error: r.error.message }
    },
    userLogs: async (page, size) => {
      const r = await ctx.remote.xpeach.userLogs({ page, size })
      return r.ok ? r.value : { error: r.error.message }
    },
    userLogStat: async () => {
      const r = await ctx.remote.xpeach.userLogStat({})
      return r.ok ? r.value : { error: r.error.message }
    },
    onboardingScan: async () => {
      const r = await ctx.remote.xpeach.onboardingScan({})
      return r.ok ? r.value : { error: r.error.message }
    },
    importConversations: async (sources) => {
      const r = await ctx.remote.xpeach.importConversations({ sources })
      return r.ok ? r.value : { error: r.error.message }
    },
    importAssets: async (selection) => {
      const r = await ctx.remote.xpeach.importAssets(selection)
      return r.ok ? r.value : { error: r.error.message }
    },
    onboardingDone: async () => {
      const r = await ctx.remote.xpeach.onboardingDone({})
      return r.ok ? r.value : { done: false }
    },
    onboardingComplete: async () => {
      const r = await ctx.remote.xpeach.onboardingComplete({})
      return r.ok ? r.value : { done: false }
    },
    networkStatus: async () => {
      const r = await ctx.remote.xpeach.networkStatus({})
      return r.ok ? r.value : { error: r.error.message }
    },
    networkProbe: async () => {
      const r = await ctx.remote.xpeach.networkProbe({})
      return r.ok ? r.value : { error: r.error.message }
    },
    networkAuto: async (auto) => {
      const r = await ctx.remote.xpeach.networkAuto({ auto })
      return r.ok ? r.value : { error: r.error.message }
    },
    networkRoute: async (url) => {
      const r = await ctx.remote.xpeach.networkRoute({ url })
      return r.ok ? r.value : { error: r.error.message }
    },
    openPlugins: () => { ctx.layout.selectPanel('plugins' as never) },
    recentSessions: async () => {
      const remote = ctx.remote as unknown as { session?: { list: (req: object) => Promise<{ ok: boolean, value?: { items: readonly { sessionId: string, cwd?: string, updatedAt: number }[] }, error?: { message: string } }> } }
      if (remote.session === undefined) return { error: 'session remote unavailable' }
      const r = await remote.session.list({})
      if (!r.ok || r.value === undefined) return { error: r.error?.message ?? 'session list failed' }
      return r.value.items.slice(0, 8).map(i => ({ id: i.sessionId, ...(i.cwd !== undefined ? { cwd: i.cwd } : {}), updatedAt: i.updatedAt }))
    },
    userTokens: async (page?: number) => {
      const r = await ctx.remote.xpeach.userTokens({ page: page ?? 0 })
      return r.ok ? r.value : { error: r.error.message }
    },
    userTopup: async (key: string) => {
      const r = await ctx.remote.xpeach.userTopup({ key })
      return r.ok ? null : r.error.message
    },
    stripeAmount: async (amount: number) => {
      const r = await ctx.remote.xpeach.stripeAmount({ amount })
      return r.ok ? { money: String((r.value as { data?: string }).data ?? '') } : { error: r.error.message }
    },
    stripePay: async (amount: number, method: string) => {
      const r = await ctx.remote.xpeach.stripePay({ amount, method })
      return r.ok
        ? { url: String((r.value as { data?: string, url?: string }).data ?? (r.value as { url?: string }).url ?? '') }
        : { error: r.error.message }
    },
    adminChannels: async (page?: number) => {
      const r = await ctx.remote.xpeach.adminChannels({ page: page ?? 0 })
      return r.ok ? r.value : { error: r.error.message }
    },
    adminRedemptions: async (page?: number) => {
      const r = await ctx.remote.xpeach.adminRedemptions({ page: page ?? 0 })
      return r.ok ? r.value : { error: r.error.message }
    },
    adminRedemptionCreate: async (quota: number, count: number, name: string) => {
      const r = await ctx.remote.xpeach.adminRedemptionCreate({ quota, count, name })
      return r.ok ? r.value : { error: r.error.message }
    },
    adminOptionSet: async (key: string, value: string) => {
      const r = await ctx.remote.xpeach.adminOptionSet({ key, value })
      return r.ok ? {} : { error: r.error.message }
    },
    userTokenCreate: async (payload: Record<string, unknown>) => {
      const r = await ctx.remote.xpeach.userTokenCreate({ payload: payload as never })
      return r.ok ? null : r.error.message
    },
    userTokenUpdate: async (id: number, payload: Record<string, unknown>) => {
      const r = await ctx.remote.xpeach.userTokenUpdate({ id, payload: payload as never })
      return r.ok ? null : r.error.message
    },
    userTokenDelete: async (id: number) => {
      const r = await ctx.remote.xpeach.userTokenDelete({ id })
      return r.ok ? null : r.error.message
    },
    userSelfEdit: async (payload: Record<string, unknown>) => {
      const r = await ctx.remote.xpeach.userSelfEdit({ payload: payload as never })
      return r.ok ? null : r.error.message
    },
    sessionLogin: async () => {
      const r = await ctx.remote.xpeach.sessionLogin()
      return r.ok ? r.value : { bound: false, error: r.error.message }
    },
    sessionUser: async () => {
      const r = await ctx.remote.xpeach.sessionUser()
      return r.ok ? r.value : { bound: false }
    },
    userTokenKey: async (id: number) => {
      const r = await ctx.remote.xpeach.userTokenKey({ id })
      return r.ok ? (r.value.key ?? '') : { error: r.error.message }
    },
    userAff: async () => {
      const r = await ctx.remote.xpeach.userAff()
      return r.ok ? (r.value as Record<string, unknown>) : { error: r.error.message }
    },
    keySlots: async () => {
      const r = await ctx.remote.xpeach.keySlots()
      return r.ok ? r.value.slots : []
    },
    keySlotAdd: async (name: string, key: string) => {
      const r = await ctx.remote.xpeach.keySlotAdd({ name, key })
      return r.ok ? (r.value.ok ? null : r.value.message) : r.error.message
    },
    keySlotSwitch: async (index: number) => {
      const r = await ctx.remote.xpeach.keySlotSwitch({ index })
      return r.ok ? (r.value.ok ? null : r.value.message) : r.error.message
    },
    keySlotRemove: async (index: number) => {
      const r = await ctx.remote.xpeach.keySlotRemove({ index })
      return r.ok ? (r.value.ok ? null : r.value.message) : r.error.message
    },
    adminUserGet: async (id: number) => {
      const r = await ctx.remote.xpeach.adminUserGet({ id })
      return r.ok ? (r.value as Record<string, unknown>) : { error: r.error.message }
    },
    adminUserUpdate: async (user: Record<string, unknown>) => {
      const r = await ctx.remote.xpeach.adminUserUpdate({ user: user as never })
      return r.ok ? null : r.error.message
    },
    adminUserManage: async (id: number, action: string, value: number) => {
      const r = await ctx.remote.xpeach.adminUserManage({ id, action, value })
      return r.ok ? null : r.error.message
    },
    adminModelPricing: async () => {
      const r = await ctx.remote.xpeach.adminModelPricing()
      return r.ok ? r.value : { error: r.error.message }
    },
    adminModelPricingPatch: async (changes: readonly import('./ops.ts').XPeachModelPricingChangeRow[]) => {
      const r = await ctx.remote.xpeach.adminModelPricingPatch({ changes: changes as never })
      return r.ok ? null : r.error.message
    },
    adminOptions: async () => {
      const r = await ctx.remote.xpeach.adminOptions()
      return r.ok ? r.value : { error: r.error.message }
    },
    adminChannelSave: async (payload: Record<string, unknown>) => {
      const r = await ctx.remote.xpeach.adminChannelSave({ payload: payload as never })
      return r.ok ? null : r.error.message
    },
    adminChannelDelete: async (id: number) => {
      const r = await ctx.remote.xpeach.adminChannelDelete({ id })
      return r.ok ? null : r.error.message
    },
    adminChannelTest: async (id: number) => {
      const r = await ctx.remote.xpeach.adminChannelTest({ id })
      return r.ok ? null : r.error.message
    },
    adminTokenCreate: async (payload: Record<string, unknown>) => {
      const r = await ctx.remote.xpeach.adminTokenCreate({ payload: payload as never })
      return r.ok ? null : r.error.message
    },
    adminTokenDelete: async (id: number) => {
      const r = await ctx.remote.xpeach.adminTokenDelete({ id })
      return r.ok ? null : r.error.message
    },
    subscribePlaygroundChunk: (fn: (chunk: { callId: string, delta: string }) => void) => ctx.effect(() => [
      ctx.remote.$on('xpeach/playground-chunk', (payload: unknown) => {
        if (typeof payload === 'object' && payload !== null) {
          const c = payload as { callId?: unknown, delta?: unknown }
          if (typeof c.callId === 'string' && typeof c.delta === 'string') fn({ callId: c.callId, delta: c.delta })
        }
      }),
    ]),
    subscribeCredentialChange: (fn: () => void) => ctx.effect(() => [
      ctx.remote.$on('credentials/reference-updated', fn),
      ctx.remote.$on('credentials/record-updated', fn),
    ], 'xpeach: credential-change listeners'),
  }
  const undo: Array<() => void> = []
  // Composer-dock session cost: live $ from the tokenUsage projection against
  // the rates our token actually pays (operator surface; needs the admin token).
  undo.push(ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
    { name: 'conversation.composer.dock', id: 'xpeach-cost', order: 2, locale: NS, inject: () => ({ billingRate: ops.billingRate }) },
    XPeachCostPill)))
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-xpeach: dictionaries')
  undo.push(ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register(
    { name: 'sidebar.brand.mark' }, XPeachMark)))
  undo.push(ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register(
    { name: 'sidebar.brand.name', locale: NS }, XPeachName)))
  undo.push(ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register(
    { name: 'conversation.hero.brand.mark' }, XPeachMark)))
  // The console is a first-class main panel: panellist row above Plugins
  // (order -5 < plugins' 0) + keyed 'main' body. selectModel needs the
  // session id the right-pane seat once supplied — read the active session
  // from the navigation context instead.
  undo.push(ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
    { name: 'sidebar.panellist', id: 'xpeach' as MainPanelId, order: -5, label: () => ctx.locale.bind(NS)('tab.title'), locale: NS },
    ({ size }: { size?: number }) => XPeachMark({ size: size ?? 18 }))))
  undo.push(ctx.slots.inject('main', () => ctx.slots.register(
    {
      name: 'main', key: 'xpeach', locale: NS,
      inject: (): XPeachOps => ({
        ...ops,
        selectModel: async (sessionId: string | undefined, model: string) => {
          if (sessionId === undefined) return 'no active session'
          const provider = /^swe-/i.test(model) ? 'xpeach' : 'xpeach-completions'
          const result = await ctx.remote.session.selectModel({ sessionId: sessionId as Parameters<typeof ctx.remote.session.selectModel>[0]['sessionId'], provider, model })
          return result.ok ? null : result.error.message
        },
      }),
    }, XPeachConsolePage)))
  // footerBridge keeps its contract: pill card's "open console" routes to the
  // main panel now — one console surface, one place.
  footerBridge.openConsole = () => { ctx.layout?.selectPanel('xpeach' as MainPanelId) }
  undo.push(ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: 'xpeach.status', locale: NS, inject: () => ops }, XPeachStatusPill)))
  undo.push(ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: 'xpeach.bindgate', locale: NS, inject: () => ops }, XPeachOnboarding)))
  undo.push(ctx.slots.inject('shell.quota-notice', () => ctx.slots.register(
    {
      name: 'shell.quota-notice', locale: NS, priority: -10,
      select: (owner): QuotaNoticeOwnerProps | null =>
        (owner.code === 'QUOTA' || owner.code === 'ACCOUNT_QUOTA' ? owner : null),
    }, XPeachQuotaNotice)))
  // Housekeeping: old probe sessions titled "[Mock]…" by the dead mock channel
  // get a neutral human-readable title once per console open.
  void ctx.remote.session.list({}).then(async r => {
    if (!r.ok) return
    for (const item of r.value.items) {
      const p = await ctx.remote.session.projections({ sessionId: item.sessionId })
      if (!p.ok || p.value === null) continue
      const title = p.value.values['title']
      const text = typeof title === 'string' ? title : (title as { text?: string } | undefined)?.text
      if (typeof text === 'string' && text.includes('[Mock]')) {
        await ctx.remote.session.rename({ sessionId: item.sessionId, title: 'relay probe' })
      }
    }
  }).catch(() => {})
  undo.push(ctx.slots.inject('settings.section', () => ctx.slots.register(
    { name: 'settings.section', id: 'xpeach', order: 20, label: () => ctx.locale.bind(NS)('nav'), locale: NS, inject: () => ops },
    XPeachSection)))
  undo.push(ctx.slots.inject('settings.launcher', () => ctx.slots.register(
    { name: 'settings.launcher', locale: NS, inject: () => ops }, XPeachSettingsLauncher)))
  return undo
}

/**
 * Client plugin body: paint the accent, mount the generated `xpeach` Remote,
 * then register every UI occupant inside a child context that injects it.
 * @param ctx - client root context.
 * @returns async disposer completing reverse-order cleanup.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  // The palettes register through the public theme API, so ui-theme stays
  // stock: a palette is an alias-token override, not a fork of the layer.
  for (const definition of PALETTES) {
    for (const mode of ['light', 'dark'] as const) {
      try {
        ctx.theme.register({
          id: mode === 'light' ? definition.id : `${definition.id}-dark`,
          colorScheme: mode,
          tokens: paletteTokens(definition, mode),
        })
      } catch {
        // An id already taken simply keeps the stock theme; nothing else changes.
      }
    }
  }
  // 🍑Code identity: warm peach accent over both palettes, applied
  // unconditionally (brand, not a user preference).
  // Registered through the stock item slot, so the appearance page keeps its
  // own row and gains ours beside it rather than being forked.
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'xpeach-palette',
    order: 11,
    locale: 'xpeach.account',
    inject: () => ({
      active: () => ctx.theme.getTheme().active.id,
      setTheme: (id: string) => { ctx.theme.setTheme(id) },
    }),
  }, PaletteRow))

  const undoTheme = ctx.theme.overrideTokens('xpeach', {
    '--dsw-alias-brand-primary': { light: '#E0653F', dark: '#FF9D7E' },
    '--dsw-alias-brand-primary-invert': { light: '#FFF6F1', dark: '#2B1409' },
    '--dsw-alias-brand-primary-new-colorprimary-new-color': { light: '#E0653F', dark: '#FF9D7E' },
    // The accent ramp consumers reach straight for the deepseek-* statics —
    // repaint the whole ramp peach so every blue spot follows.
    '--dsw-static-deepseek-50': { light: '#FDF1EA', dark: '#3A241B' },
    '--dsw-static-deepseek-100': { light: '#FBE4D7', dark: '#4A2E21' },
    '--dsw-static-deepseek-200': { light: '#F7CDB4', dark: '#633E2C' },
    '--dsw-static-deepseek-300': { light: '#F0AC85', dark: '#8A543A' },
    '--dsw-static-deepseek-400': { light: '#EF9163', dark: '#C97450' },
    '--dsw-static-deepseek-450': { light: '#E97E4E', dark: '#F08A60' },
    '--dsw-static-deepseek-500': { light: '#E0653F', dark: '#FF9D7E' },
    '--dsw-static-deepseek-600': { light: '#B04E30', dark: '#E0865F' },
    '--dsw-static-deepseek-700': { light: '#8C3C24', dark: '#B96F4C' },
    '--dsw-static-deepseek-800': { light: '#6B2E1C', dark: '#8C5338' },
    '--dsw-static-deepseek-900': { light: '#522416', dark: '#6E422C' },
  })
  const unmountRemote = await ctx.remote.$mount(xpeachRemote)
  const ui = ctx.inject(['remote.xpeach', 'remote.settings', 'remote.session', 'slots', 'locale', 'theme', 'layout'], child => {
    const disposers = registerUi(child)
    return () => { for (const fn of disposers.reverse()) fn() }
  })
  try { await ui } catch (error) { await ui.dispose(); await unmountRemote(); undoTheme(); throw error }
  return async () => { await ui.dispose(); await unmountRemote(); undoTheme() }
}

/**
 * Main-panel seat of the console: the 'main' slot injects the ops face and the
 * locale namespace; XPeachTab's runtime hook (useTabInfo) is right-pane-only
 * and never called by the component, so the face-only props satisfy it.
 */
function XPeachConsolePage(props: XPeachOps): JSX.Element {
  // The right-pane runtime hook useTabInfo is declared on XPeachTabProps but
  // never invoked — the main seat's composed props satisfy the used surface.
  return XPeachTab(props as unknown as XPeachTabProps)
}
