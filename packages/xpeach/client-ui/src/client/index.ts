/** XPeach client face: peach brand, quota pill, quota notice, settings section. */
import type { JSX } from 'react'
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
import type {} from '@xpeach/xph-client-ui-chat/client'
import type {} from '@xpeach/xph-client-ui-conversation/client'
import type {} from '@xpeach/xph-client-ui-sidebar-right/client'
import type { QuotaNoticeOwnerProps } from '@xpeach/xph-client-ui-chat/client'
import xpeachRemote from '@xpeach/xph-account/remote'
import type {
  XPeachData,
  XPeachMacosInstallerActionRequest,
  XPeachMacosInstallerActionResult,
  XPeachMacosInstallerStatus,
  XPeachMcpDeleteRequest,
  XPeachMcpSaveRequest,
  XPeachMcpSnapshot,
  XPeachMcpToggleRequest,
  XPeachOps,
  XPeachRulesSaveRequest,
  XPeachSkillDeleteRequest,
  XPeachSkillSaveRequest,
  XPeachSkillsSnapshot,
  XPeachSkillToggleRequest,
  XPeachSsoDevicePollRequest,
  XPeachSsoDevicePollResult,
  XPeachSsoDeviceStartRequest,
  XPeachSsoDeviceStartResult,
} from './ops.ts'
import { XPeachMark, XPeachName } from './brand.tsx'
import { XPeachStatusPill } from './StatusPill.tsx'
import { XPeachOnboarding } from './XPeachOnboarding.tsx'
import { XPeachSettingsLauncher } from './XPeachSettingsLauncher.tsx'
import { XPeachQuotaNotice } from './QuotaNotice.tsx'
import { XPeachSection } from './XPeachSection.tsx'
import { GeneralPreferencesRow } from './GeneralPreferencesRow.tsx'
import { ModuleSettingsSection, ModuleSettingsTab } from './ModuleSettingsSection.tsx'
import { XPeachTab, type XPeachTabProps } from './XPeachTab.tsx'
import { XPeachSkillsIcon, XPeachSkillsPage } from './XPeachSkills.tsx'
import { XPeachMcpIcon, XPeachMcpPage } from './XPeachMcp.tsx'
import { footerBridge } from './FooterAction.tsx'
import { XPeachCostPill } from './XPeachCostPill.tsx'
import { en, NS, zh } from './locales.ts'
import { readRecents, rememberModel } from './recents.ts'
import { PALETTES, paletteTokens } from './palettes.ts'
import { PaletteRow } from './PaletteRow.tsx'
import { inferClientModelSpec, XPeachModelLabel } from './model-meta.tsx'

declare module '@xpeach/xph-client-ui-slots' {
  interface SlotMap {
    'conversation.input.model.label': {
      kind: 'single'
      scope: 'session'
      inline: true
      owner: {
        provider: { readonly id: string; readonly name: string }
        model: { readonly id: string; readonly name: string }
        placement: 'trigger' | 'menu' | 'option'
        selected: boolean
      }
    }
  }
}

type RemoteOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly message: string } }

interface XPeachExtRemote {
  skillsList(req: Record<string, never>): Promise<RemoteOutcome<XPeachSkillsSnapshot>>
  skillToggle(req: XPeachSkillToggleRequest): Promise<RemoteOutcome<XPeachSkillsSnapshot>>
  skillSave(req: XPeachSkillSaveRequest): Promise<RemoteOutcome<XPeachSkillsSnapshot>>
  skillDelete(req: XPeachSkillDeleteRequest): Promise<RemoteOutcome<XPeachSkillsSnapshot>>
  rulesSave(req: XPeachRulesSaveRequest): Promise<RemoteOutcome<XPeachSkillsSnapshot>>
  mcpList(req: Record<string, never>): Promise<RemoteOutcome<XPeachMcpSnapshot>>
  mcpToggle(req: XPeachMcpToggleRequest): Promise<RemoteOutcome<XPeachMcpSnapshot>>
  mcpSave(req: XPeachMcpSaveRequest): Promise<RemoteOutcome<XPeachMcpSnapshot>>
  mcpDelete(req: XPeachMcpDeleteRequest): Promise<RemoteOutcome<XPeachMcpSnapshot>>
  macosInstallerStatus(request: Record<string, never>): Promise<RemoteOutcome<XPeachMacosInstallerStatus>>
  macosInstallerAction(request: XPeachMacosInstallerActionRequest): Promise<RemoteOutcome<XPeachMacosInstallerActionResult>>
  ssoDeviceStart(request: XPeachSsoDeviceStartRequest): Promise<RemoteOutcome<XPeachSsoDeviceStartResult>>
  ssoDevicePoll(request: XPeachSsoDevicePollRequest): Promise<RemoteOutcome<XPeachSsoDevicePollResult>>
  ssoLogout(request: {
    readonly allDevices?: boolean
    readonly revokePeachcode?: boolean
  }): Promise<RemoteOutcome<{ readonly bound: boolean }>>
}

/** Services needed at mount time (the xpeach namespace joins as remote.xpeach). */
export const inject = ['remote', 'slots', 'locale', 'theme', 'layout']

/**
 * Register the 🍑Code UI surface inside a child context that legally injects
 * the freshly-mounted `remote.xpeach` namespace.
 * @param ctx - child context carrying remote.xpeach.
 * @returns list of registration disposers.
 */
function registerUi(ctx: Context): Array<() => void> {
  const extRemote = ctx.remote.xpeach as typeof ctx.remote.xpeach & XPeachExtRemote
  const mutateAccountSetting = async (
    path: string[],
    value: boolean | string | string[],
  ): Promise<string | null> => {
    const described = await ctx.remote.settings.describe()
    if (!described.ok) return described.error.message
    const view = described.value.namespaces.find(ns => ns.ns === 'xpeach-account')
      ?? described.value.namespaces.find(ns => ns.ns === 'xpeach')
    const targetNs = view?.ns ?? 'xpeach-account'
    const written = await ctx.remote.settings.mutate(targetNs, [{ op: 'set', path, value }], view?.revision)
    return written.ok ? null : written.error.message
  }
  const ops: XPeachOps = {
    loadUsage: async (): Promise<XPeachData> => {
      const usage = await ctx.remote.xpeach.tokenUsage({})
      if (!usage.ok) return { error: usage.error.message }
      return { usage: usage.value }
    },
    load: async (): Promise<XPeachData> => {
      const [usage, logs] = await Promise.all([
        ctx.remote.xpeach.tokenUsage({}),
        ctx.remote.xpeach.tokenLogs({}),
      ])
      if (!usage.ok) return { error: usage.error.message }
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
      const providers = (view?.value as { providers?: Record<string, { models?: { id: string }[] }> } | undefined)?.providers ?? {}
      const ids: string[] = []
      for (const [key, provider] of Object.entries(providers)) {
        if (!key.startsWith('xpeach')) continue
        for (const m of provider.models ?? []) ids.push(m.id)
      }
      return [...new Set(ids)]
    },
    addModel: async (id: string) => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return described.error.message
      const view = described.value.namespaces.find(ns => ns.ns === 'llm-pi-ai')
      type ProviderCfg = { api?: string; apiKeyEnv?: string; baseUrl?: string; models?: { id: string }[] }
      const providers = (view?.value as { providers?: Record<string, ProviderCfg> } | undefined)?.providers
      const completions = 'xpeach-completions'
      const xpeachApi = providers?.xpeach?.api
      const key = /^swe-/i.test(id)
        ? 'xpeach'
        : xpeachApi === 'openai-completions'
          ? 'xpeach'
          : completions
      const source = providers?.xpeach
      for (const [pKey, pVal] of Object.entries(providers ?? {})) {
        if (pKey.startsWith('xpeach') && pVal.models?.some(m => m.id === id)) return null
      }
      type JsonV = null | boolean | number | string | JsonV[] | { [k: string]: JsonV }
      const opsList: { op: 'set'; path: string[]; value: JsonV }[] = []
      if (key === completions && providers?.[completions] === undefined) {
        const { models: _m, ...rest } = (source ?? {}) as Record<string, JsonV>
        opsList.push({
          op: 'set',
          path: ['providers', completions],
          value: { ...rest, api: 'openai-completions', defaultInput: ['text', 'image'], reasoning: 'high', models: [] },
        })
      }
      const existing = providers?.[key]?.models ?? []
      const spec = inferClientModelSpec(id)
      const entry = {
        id,
        name: id,
        contextWindow: spec.contextWindow,
        maxTokens: spec.maxTokens,
        input: spec.supportsImage ? ['text', 'image'] : ['text'],
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high' },
      }
      opsList.push({ op: 'set', path: ['providers', key, 'reasoning'], value: 'high' })
      opsList.push({ op: 'set', path: ['providers', key, 'defaultInput'], value: ['text', 'image'] })
      opsList.push({ op: 'set', path: ['providers', key, 'models'], value: [...existing, entry] as JsonV })
      const written = await ctx.remote.settings.mutate('llm-pi-ai', opsList, view?.revision)
      return written.ok ? null : written.error.message
    },
    trackingState: async () => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return true
      const accountView = described.value.namespaces.find(ns => ns.ns === 'xpeach-account')
        ?? described.value.namespaces.find(ns => ns.ns === 'xpeach')
      const accountTracking = (accountView?.value as { conversationTracking?: unknown } | undefined)?.conversationTracking
      if (typeof accountTracking === 'boolean') return accountTracking
      const view = described.value.namespaces.find(ns => ns.ns === 'llm-pi-ai')
      const providers = (view?.value as { providers?: Record<string, { conversationTracking?: boolean }> } | undefined)?.providers ?? {}
      const firstXpeach = Object.entries(providers).find(([k]) => k.startsWith('xpeach'))?.[1]
      return (providers.xpeach ?? firstXpeach)?.conversationTracking !== false
    },
    setTracking: async (enabled: boolean) => {
      const accountErr = await mutateAccountSetting(['conversationTracking'], enabled)
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return accountErr ?? described.error.message
      const view = described.value.namespaces.find(ns => ns.ns === 'llm-pi-ai')
      const providers = (view?.value as { providers?: Record<string, unknown> } | undefined)?.providers ?? {}
      type JsonV = null | boolean | number | string | JsonV[] | { [k: string]: JsonV }
      const keys = new Set<string>(['xpeach'])
      for (const key of Object.keys(providers)) {
        if (key.startsWith('xpeach')) keys.add(key)
      }
      const opsList: { op: 'set'; path: string[]; value: JsonV }[] = [...keys].map(key => ({
        op: 'set',
        path: ['providers', key, 'conversationTracking'],
        value: enabled,
      }))
      const written = await ctx.remote.settings.mutate('llm-pi-ai', opsList, view?.revision)
      return written.ok ? accountErr : written.error.message
    },
    autoSyncModels: async () => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return true
      const view = described.value.namespaces.find(ns => ns.ns === 'xpeach-account')
        ?? described.value.namespaces.find(ns => ns.ns === 'xpeach')
      const value = (view?.value as { autoSyncModels?: unknown } | undefined)?.autoSyncModels
      return value !== false
    },
    setAutoSyncModels: async (enabled: boolean) => {
      const err = await mutateAccountSetting(['autoSyncModels'], enabled)
      if (err === null && enabled) {
        void ctx.remote.xpeach.syncModels({})
      }
      return err
    },
    protocolPreference: async () => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return 'compatible'
      const view = described.value.namespaces.find(ns => ns.ns === 'xpeach-account')
        ?? described.value.namespaces.find(ns => ns.ns === 'xpeach')
      const value = (view?.value as { protocolPreference?: string } | undefined)?.protocolPreference
      return value === 'native' || value === 'auto' ? value : 'compatible'
    },
    setProtocolPreference: async (value) => {
      return await mutateAccountSetting(['protocolPreference'], value)
    },
    families: async () => {
      const described = await ctx.remote.settings.describe()
      const catalogue = await ctx.remote.xpeach.models({})
      const all = catalogue.ok
        ? [...new Set(catalogue.value.flatMap(m => (m as { groups?: readonly string[] }).groups ?? []))].sort()
        : []
      const view = described.ok
        ? (described.value.namespaces.find(ns => ns.ns === 'xpeach-account')
          ?? described.value.namespaces.find(ns => ns.ns === 'xpeach'))
        : undefined
      const enabled = (view?.value as { enabledFamilies?: readonly string[] } | undefined)?.enabledFamilies ?? []
      return { all, enabled }
    },
    setFamilies: async (enabled) => {
      return await mutateAccountSetting(['enabledFamilies'], [...enabled])
    },
    recents: () => Promise.resolve(readRecents()),
    rememberModel: (provider: string, model: string) => { rememberModel(provider, model); return Promise.resolve() },
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
      if (r.ok) await (ctx.get('sessions') as { refresh?: () => Promise<void> } | undefined)?.refresh?.()
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
      if (r.ok) await (ctx.get('sessions') as { refresh?: () => Promise<void> } | undefined)?.refresh?.()
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
      const sessionsService = ctx.get('sessions') as {
        list?: {
          snapshot?: () => {
            phase?: string
            items?: readonly { sessionId: string; cwd?: string; updatedAt: number }[]
          }
        }
      } | undefined
      const snap = sessionsService?.list?.snapshot?.()
      if (snap?.phase === 'ready' && snap.items !== undefined) {
        return snap.items.slice(0, 8).map(i => ({
          id: i.sessionId,
          ...(i.cwd !== undefined ? { cwd: i.cwd } : {}),
          updatedAt: i.updatedAt,
        }))
      }
      const r = await ctx.remote.session.list({})
      if (!r.ok) return { error: r.error.message }
      return r.value.items.slice(0, 8).map(i => ({
        id: i.sessionId,
        ...(i.cwd !== undefined ? { cwd: i.cwd } : {}),
        updatedAt: i.updatedAt,
      }))
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
      return r.ok ? { money: (r.value as { data?: string }).data ?? '' } : { error: r.error.message }
    },
    stripePay: async (amount: number, method: string) => {
      const r = await ctx.remote.xpeach.stripePay({ amount, method })
      return r.ok
        ? { url: (r.value as { data?: string; url?: string }).data ?? (r.value as { url?: string }).url ?? '' }
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
      return r.ok ? (r.value) : { error: r.error.message }
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
      return r.ok ? (r.value) : { error: r.error.message }
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
    subscribePlaygroundChunk: (fn: (chunk: { callId: string; delta: string }) => void) =>
      ctx.remote.$on('xpeach/playground-chunk', (payload: unknown) => {
        if (typeof payload === 'object' && payload !== null) {
          const c = payload as { callId?: unknown; delta?: unknown }
          if (typeof c.callId === 'string' && typeof c.delta === 'string') fn({ callId: c.callId, delta: c.delta })
        }
      }),
    subscribeCredentialChange: (fn: () => void) => {
      const offRef = ctx.remote.$on('credentials/reference-updated', fn)
      const offRec = ctx.remote.$on('credentials/record-updated', fn)
      const offExp = ctx.remote.$on('deepseek-account/session-expired', fn)
      return () => { offRef(); offRec(); offExp() }
    },
    subscribeSessionExpired: (fn: () => void) =>
      ctx.remote.$on('deepseek-account/session-expired', fn),
    subscribeModelSignInRequired: (fn: () => void) =>
      ctx.remote.$on('deepseek-account/model-sign-in-required', fn),
    skillsList: async () => {
      const r = await extRemote.skillsList({})
      if (!r.ok) throw new Error(r.error.message)
      return r.value
    },
    skillToggle: async (req) => {
      const r = await extRemote.skillToggle(req)
      if (!r.ok) throw new Error(r.error.message)
      return r.value
    },
    skillSave: async (req) => {
      const r = await extRemote.skillSave(req)
      if (!r.ok) throw new Error(r.error.message)
      return r.value
    },
    skillDelete: async (req) => {
      const r = await extRemote.skillDelete(req)
      if (!r.ok) throw new Error(r.error.message)
      return r.value
    },
    rulesSave: async (req) => {
      const r = await extRemote.rulesSave(req)
      if (!r.ok) throw new Error(r.error.message)
      return r.value
    },
    mcpList: async () => {
      const r = await extRemote.mcpList({})
      if (!r.ok) throw new Error(r.error.message)
      return r.value
    },
    mcpToggle: async (req) => {
      const r = await extRemote.mcpToggle(req)
      if (!r.ok) throw new Error(r.error.message)
      return r.value
    },
    mcpSave: async (req) => {
      const r = await extRemote.mcpSave(req)
      if (!r.ok) throw new Error(r.error.message)
      return r.value
    },
    mcpDelete: async (req) => {
      const r = await extRemote.mcpDelete(req)
      if (!r.ok) throw new Error(r.error.message)
      return r.value
    },
    macosInstallerStatus: async () => {
      const r = await extRemote.macosInstallerStatus({})
      return r.ok ? r.value : { error: r.error.message }
    },
    macosInstallerAction: async (action) => {
      const r = await extRemote.macosInstallerAction({ action })
      return r.ok ? r.value : { error: r.error.message }
    },
    ssoDeviceStart: async (openBrowser = true) => {
      const r = await extRemote.ssoDeviceStart({ openBrowser })
      return r.ok ? r.value : { error: r.error.message }
    },
    ssoDevicePoll: async (deviceCode: string) => {
      const r = await extRemote.ssoDevicePoll({ deviceCode })
      return r.ok ? r.value : { error: r.error.message }
    },
    ssoLogout: async (allDevices = false) => {
      await extRemote.ssoLogout({ allDevices, revokePeachcode: false })
    },
    describeSettings: async () => {
      const described = await ctx.remote.settings.describe()
      if (!described.ok) return { error: described.error.message }
      return described.value.namespaces.map(ns => ({
        ns: ns.ns,
        value: (typeof ns.value === 'object' && ns.value !== null ? ns.value : {}) as Readonly<Record<string, unknown>>,
        base: (typeof ns.base === 'object' && ns.base !== null ? ns.base : undefined) as Readonly<Record<string, unknown>> | undefined,
        user: (typeof ns.user === 'object' && ns.user !== null ? ns.user : undefined) as Readonly<Record<string, unknown>> | undefined,
        revision: ns.revision,
      }))
    },
    mutateSettings: async (ns, mutationOps, expectedRevision) => {
      type JsonV = null | boolean | number | string | JsonV[] | { [k: string]: JsonV }
      const wireOps = mutationOps.map(op => (
        op.op === 'unset'
          ? { op: 'unset' as const, path: [...op.path] }
          : { op: 'set' as const, path: [...op.path], value: op.value as JsonV }
      ))
      const written = await ctx.remote.settings.mutate(ns, wireOps, expectedRevision)
      if (!written.ok) return { error: written.error.message }
      const item = written.value
      return {
        ns: item.ns,
        value: (typeof item.value === 'object' && item.value !== null ? item.value : {}) as Readonly<Record<string, unknown>>,
        base: (typeof item.base === 'object' && item.base !== null ? item.base : undefined) as Readonly<Record<string, unknown>> | undefined,
        user: (typeof item.user === 'object' && item.user !== null ? item.user : undefined) as Readonly<Record<string, unknown>> | undefined,
        revision: item.revision,
      }
    },
  }
  const undo: Array<() => void> = []
  // Composer-dock session cost: live $ from the tokenUsage projection against
  // the rates our token actually pays (operator surface; needs the admin token).
  undo.push(ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
    { name: 'conversation.composer.dock', id: 'xpeach-cost', order: 2, locale: NS, inject: () => ({ billingRate: ops.billingRate }) },
    XPeachCostPill)))
  undo.push(ctx.slots.inject('conversation.input.model.label', () => ctx.slots.register(
    { name: 'conversation.input.model.label', priority: -10 },
    XPeachModelLabel)))
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-xpeach: dictionaries')
  undo.push(ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register(
    { name: 'sidebar.brand.mark', priority: -10 }, XPeachMark)))
  undo.push(ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register(
    { name: 'sidebar.brand.name', priority: -10, locale: NS }, XPeachName)))
  undo.push(ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register(
    { name: 'conversation.hero.brand.mark', priority: -10 }, XPeachMark)))
  // The console is a first-class main panel: panellist row above Plugins
  // (order -5 < plugins' 0) + keyed 'main' body.
  undo.push(ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
    { name: 'sidebar.panellist', id: 'xpeach', order: -5, label: () => ctx.locale.bind(NS)('tab.title'), locale: NS },
    ({ size }: { size?: number }) => XPeachMark({ size: size ?? 18 }))))
  undo.push(ctx.slots.inject('main', () => ctx.slots.register(
    {
      name: 'main', key: 'xpeach', locale: NS,
      inject: (): XPeachOps => ({
        ...ops,
        selectModel: async (sessionId: string | undefined, model: string) => {
          let targetId = sessionId as Parameters<typeof ctx.remote.session.selectModel>[0]['sessionId'] | undefined
          if (targetId === undefined) {
            const listed = await ctx.remote.session.list({})
            if (!listed.ok) return listed.error.message
            targetId = listed.value.items[0]?.sessionId
          }
          if (targetId === undefined) return 'no active session'
          let provider = 'xpeach'
          const described = await ctx.remote.settings.describe()
          if (described.ok) {
            const view = described.value.namespaces.find(ns => ns.ns === 'llm-pi-ai')
            const providers = (view?.value as { providers?: Record<string, { models?: { id: string }[] }> } | undefined)?.providers ?? {}
            const matched = Object.entries(providers).find(([k, p]) => k.startsWith('xpeach') && p.models?.some(m => m.id === model))?.[0]
            if (matched !== undefined) provider = matched
          }
          rememberModel(provider, model)
          const result = await ctx.remote.session.selectModel({ sessionId: targetId, provider, model })
          return result.ok ? null : result.error.message
        },
      }),
    }, XPeachConsolePage)))
  // Skill & Global Rules Control Center (order 2: right below Plugins at 0 and above Schedules at 10)
  undo.push(ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
    { name: 'sidebar.panellist', id: 'xpeach-skills', order: 2, label: () => ctx.locale.bind(NS)('sidebarSkillsLabel'), locale: NS },
    XPeachSkillsIcon)))
  undo.push(ctx.slots.inject('main', () => ctx.slots.register(
    { name: 'main', key: 'xpeach-skills', locale: NS, inject: (): XPeachOps => ops },
    XPeachSkillsPage)))
  // MCP Server Control Center (order 3: right below Skills at 2 and above Schedules at 10)
  undo.push(ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
    { name: 'sidebar.panellist', id: 'xpeach-mcp', order: 3, label: () => ctx.locale.bind(NS)('sidebarMcpLabel'), locale: NS },
    XPeachMcpIcon)))
  undo.push(ctx.slots.inject('main', () => ctx.slots.register(
    { name: 'main', key: 'xpeach-mcp', locale: NS, inject: (): XPeachOps => ops },
    XPeachMcpPage)))
  footerBridge.openConsole = () => { ctx.layout.selectPanel('xpeach' as MainPanelId) }
  undo.push(() => { footerBridge.openConsole = () => {} })
  undo.push(ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: 'xpeach.status', locale: NS, inject: () => ops }, XPeachStatusPill)))
  undo.push(ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: 'xpeach.bindgate', locale: NS, inject: () => ops }, XPeachOnboarding)))
  undo.push(ctx.slots.inject('shell.quota-notice', () => ctx.slots.register(
    {
      name: 'shell.quota-notice', locale: NS, priority: -10,
      select: (owner): QuotaNoticeOwnerProps | null =>
        (owner.code === 'ACCOUNT_QUOTA' ? owner : null),
    }, XPeachQuotaNotice)))
  undo.push(ctx.slots.inject('settings.general.item', () => ctx.slots.register(
    { name: 'settings.general.item', id: 'xpeach-general-preferences', order: 20, locale: NS, inject: () => ops },
    GeneralPreferencesRow)))
  undo.push(ctx.slots.inject('settings.section', () => ctx.slots.register(
    { name: 'settings.section', id: 'modules', order: 12, label: () => ctx.locale.bind(NS)('modules.nav'), locale: NS, inject: () => ops },
    ModuleSettingsSection)))
  undo.push(ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register(
    { name: 'settings.plugins.tab', id: 'module-configs', order: 5, label: () => ctx.locale.bind(NS)('modules.tabLabel'), locale: NS, inject: () => ops },
    ModuleSettingsTab)))
  undo.push(ctx.slots.inject('settings.section', () => ctx.slots.register(
    { name: 'settings.section', id: 'xpeach', order: 20, label: () => ctx.locale.bind(NS)('nav'), locale: NS, inject: () => ops },
    XPeachSection)))
  undo.push(ctx.slots.inject('settings.launcher', () => ctx.slots.register(
    { name: 'settings.launcher', priority: -10, locale: NS, inject: () => ops }, XPeachSettingsLauncher)))
  return undo
}

const PEACH_BRAND_OVERRIDES = {
  '--dsw-alias-brand-primary': { light: '#E0653F', dark: '#FF9D7E' },
  '--dsw-alias-brand-primary-invert': { light: '#FFF6F1', dark: '#2B1409' },
  '--dsw-alias-brand-primary-new-colorprimary-new-color': { light: '#E0653F', dark: '#FF9D7E' },
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
} as const

/**
 * Client plugin body: paint the accent, mount the generated `xpeach` Remote,
 * then register every UI occupant inside a child context that injects it.
 * @param ctx - client root context.
 * @returns async disposer completing reverse-order cleanup.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const earlyUndo: Array<() => void> = []
  for (const definition of PALETTES) {
    for (const mode of ['light', 'dark'] as const) {
      const id = mode === 'light' ? definition.id : `${definition.id}-dark`
      const tokens = paletteTokens(definition, mode)
      try {
        earlyUndo.push(ctx.theme.register({ id, colorScheme: mode, tokens }))
      } catch (_duplicateTheme) {
        // An id already taken keeps the existing registration.
      }
    }
  }
  earlyUndo.push(ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'xpeach-palette',
    order: 11,
    locale: 'xpeach.account',
    inject: () => ({
      active: () => ctx.theme.getTheme().active.id,
      setTheme: (id: string) => { ctx.theme.setTheme(id) },
    }),
  }, PaletteRow)))

  let isOverriding = false
  let undoBrandOverride: (() => void) | undefined
  const syncBrandOverride = (activeId: string): void => {
    const shouldOverride = activeId === 'light' || activeId === 'dark'
    if (shouldOverride && !isOverriding) {
      isOverriding = true
      undoBrandOverride = ctx.theme.overrideTokens('xpeach', PEACH_BRAND_OVERRIDES)
    } else if (!shouldOverride && isOverriding) {
      isOverriding = false
      const dispose = undoBrandOverride
      undoBrandOverride = undefined
      dispose?.()
    }
  }
  syncBrandOverride(ctx.theme.getTheme().active.id)
  earlyUndo.push(ctx.on('theme/change', (snapshot) => {
    syncBrandOverride(snapshot.active.id)
  }))
  earlyUndo.push(() => {
    isOverriding = false
    const dispose = undoBrandOverride
    undoBrandOverride = undefined
    dispose?.()
  })
  const disposeEarly = (): void => {
    for (const fn of [...earlyUndo].reverse()) fn()
  }

  let unmountRemote: (() => Promise<void>) | undefined
  try {
    unmountRemote = await ctx.remote.$mount(xpeachRemote)
  } catch (error) {
    disposeEarly()
    throw error
  }
  const ui = ctx.inject(['remote.xpeach', 'remote.settings', 'remote.session', 'slots', 'locale', 'theme', 'layout'], (child) => {
    const disposers = registerUi(child)
    return () => { for (const fn of disposers.reverse()) fn() }
  })
  try {
    await ui
  } catch (error) {
    await ui.dispose()
    await unmountRemote()
    disposeEarly()
    throw error
  }
  return async () => {
    await ui.dispose()
    await unmountRemote()
    disposeEarly()
  }
}

/**
 * Main-panel seat of the console.
 * @param props - XPeach console operations and locale translator.
 * @returns the console panel element.
 */
function XPeachConsolePage(props: XPeachTabProps): JSX.Element {
  return XPeachTab(props)
}
