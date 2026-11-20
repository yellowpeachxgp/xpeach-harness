/**
 * Issue #65 regression coverage: the relay token record is bound to the
 * relay key it belongs to. SSO rotation, foreign tokens minted on the web,
 * and mid-sync credential changes must never let the harness read or write
 * another token's groups, and every catalog model mounts under each endpoint
 * it supports instead of one shared wire.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { XPeachAccount } from '../src/index.ts'

const roots: string[] = []

function freshProfile(): string {
  const root = mkdtempSync(join(tmpdir(), 'xph-token-identity-'))
  roots.push(root)
  return join(root, 'profiles', 'xpeach')
}

afterEach(() => {
  vi.unstubAllEnvs()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function writeState(path: string, body: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body, { mode: 0o600 })
}

interface FakeFiles {
  profile: string
  keyFile: string
  adminKeyFile: string
  sessionKeyFile: string
  ssoStateFile: string
  routeFile: string
  tokenFile: string
}

function profileFiles(): FakeFiles {
  const profile = freshProfile()
  return {
    profile,
    keyFile: join(profile, 'xpeach.key'),
    adminKeyFile: join(profile, 'xpeach.admin'),
    sessionKeyFile: join(profile, 'xpeach.session'),
    ssoStateFile: join(profile, 'xpeach.sso.json'),
    routeFile: join(profile, 'xpeach.route.json'),
    tokenFile: join(profile, 'xpeach.token'),
  }
}

function fakeAccountFor(files: FakeFiles, suffix: string): Record<string, unknown> {
  const fakeAccount = Object.create(XPeachAccount.prototype) as Record<string, unknown>
  Object.assign(fakeAccount, {
    liveConfig: {},
    keyFile: files.keyFile,
    keyVar: `XPEACH_TEST_${suffix}_RELAY_KEY`,
    adminKeyFile: files.adminKeyFile,
    adminKeyVar: `XPEACH_TEST_${suffix}_ADMIN_KEY`,
    sessionKeyFile: files.sessionKeyFile,
    sessionKeyVar: `XPEACH_TEST_${suffix}_SESSION_KEY`,
    ssoStateFile: files.ssoStateFile,
    routeFile: files.routeFile,
    apiKeyEnv: 'XPEACH_API_KEY',
    timeoutMs: 15_000,
  })
  return fakeAccount
}

describe('token identity binding (issue #65)', () => {
  it.each(['合法空目录', '过滤后为空'])('身份已确认的%s会清空账号目录，保留自建 provider 与会话选择', async (scenario) => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-empty-catalog\n')
    writeState(files.tokenFile, JSON.stringify({ id: 3, key: 'sk-empty-catalog', groups: ['SWE'] }))
    let saved: object | undefined
    const listSessions = vi.fn(async () => [])
    const selectModel = vi.fn()
    const custom = { models: [{ id: 'private-model' }], apiKeyEnv: 'PRIVATE_KEY' }
    const account = fakeAccountFor(files, 'EMPTY')
    Object.assign(account, {
      liveConfig: { autoSyncModels: true, enabledFamilies: scenario === '过滤后为空' ? ['other'] : [] },
      enabledFamilies: [],
      refreshModelMetadata: async () => undefined,
      api: {
        siteBaseURL: 'https://fixture.invalid',
        adminTokenGet: vi.fn(async () => ({ id: 3, groups: ['SWE'] })),
        models: vi.fn(async () => scenario === '合法空目录' ? [] : [{ id: 'old-model', groups: ['SWE'] }]),
        groups: vi.fn(async () => ({ SWE: { models: ['old-model'] } })),
      },
      ctx: { get: (name: string) => {
        if (name === 'settings') return {
          describe: () => ({ namespaces: [{ ns: 'llm-pi-ai', value: { providers: {
            xpeach: { models: [{ id: 'old-model' }] }, 'xpeach-anthropic': { models: [{ id: 'old-model' }] },
            'xpeach-custom': custom, private: custom,
          } } }] }),
          update: async (_ns: string, patch: object) => { saved = patch },
        }
        if (name === 'sessionPersistence') return { list: listSessions }
        if (name === 'sessionController') return { selectModel }
        return undefined
      } },
    })
    const sync = Reflect.get(XPeachAccount.prototype, 'syncModelsOp')
    expect(await sync.call(account, {}, AbortSignal.timeout(1000))).toMatchObject({ ok: true, count: 0 })
    expect(saved).toEqual({ providers: {
      xpeach: { models: [] }, 'xpeach-anthropic': { models: [] }, 'xpeach-custom': custom, private: custom,
    } })
    expect(listSessions).not.toHaveBeenCalled()
    expect(selectModel).not.toHaveBeenCalled()
  })

  it('跨页精确密钥优先于首屏隐藏密钥的 reveal', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-page-target\n')
    const reveal = vi.fn(async () => ({ key: 'foreign' }))
    const account = fakeAccountFor(files, 'PAGES')
    const adminTokens = vi.fn(async (page: number) => ({
      items: page === 0 ? [{ id: 1, name: 'xph-hidden' }] : [{ id: 2, key: 'page-target', groups: ['SWE'] }],
      total: 2,
    }))
    Object.assign(account, {
      liveConfig: { tokenPageLimit: 3, tokenPageSize: 1, tokenRevealLimit: 1 },
      api: { adminTokens, userTokenKey: reveal, adminTokenKey: reveal },
    })
    const resolve = Reflect.get(XPeachAccount.prototype, 'resolveTokenForKey') as (
      key: string, signal: AbortSignal,
    ) => Promise<{ info?: { id: number } }>
    expect((await resolve.call(account, 'sk-page-target', AbortSignal.timeout(1000))).info?.id).toBe(2)
    expect(adminTokens.mock.calls.map(([page]) => page)).toEqual([0, 1])
    expect(reveal).not.toHaveBeenCalled()
  })

  it('身份预算耗尽保留旧目录，未绑定旧分组不能扩大目录', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-budget-target\n')
    writeState(files.tokenFile, JSON.stringify({ id: 99, groups: ['全站分组'] }))
    const models = vi.fn(async () => [{ id: 'untrusted-model' }])
    const update = vi.fn()
    const account = fakeAccountFor(files, 'BUDGET')
    Object.assign(account, {
      liveConfig: { tokenPageLimit: 1, tokenPageSize: 1, tokenRevealLimit: 1 },
      api: {
        adminTokens: vi.fn(async () => ({ items: [{ id: 1 }], total: 2 })),
        userTokenKey: vi.fn(async () => ({ key: 'foreign' })),
        adminTokenKey: vi.fn(async () => ({ key: 'foreign' })),
        models,
      },
      ctx: { get: () => ({ update }), emit: vi.fn() },
    })
    const sync = Reflect.get(XPeachAccount.prototype, 'syncModelsOp')
    const result = await sync.call(account, {}, AbortSignal.timeout(1000))
    expect(result).toMatchObject({ ok: false, code: 'identity-budget-exhausted', groups: [] })
    expect(models).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('解析暂停期间另一实例轮转后，旧解析不能覆盖新凭据', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-before-lookup\n')
    const pending = Promise.withResolvers<{ items: { id: number; key: string }[]; total: number }>()
    const entered = Promise.withResolvers<undefined>()
    const first = fakeAccountFor(files, 'FIRST')
    const second = fakeAccountFor(files, 'SECOND')
    Object.assign(first, { api: { adminTokens: vi.fn(() => { entered.resolve(undefined); return pending.promise }) } })
    Object.assign(second, { ctx: { get: () => undefined } })
    const ensure = Reflect.get(XPeachAccount.prototype, 'ensureTokenInfo') as (signal: AbortSignal) => Promise<object>
    const persist = Reflect.get(XPeachAccount.prototype, 'persistRelayCredential') as (key: string, info: object) => Promise<void>
    const resolving = ensure.call(first, AbortSignal.timeout(1000))
    const rejected = expect(resolving).rejects.toMatchObject({ code: 'credential-changed' })
    await entered.promise
    await persist.call(second, 'sk-after-lookup', { id: 2, key: 'sk-after-lookup', groups: ['new'] })
    pending.resolve({ items: [{ id: 1, key: 'before-lookup' }], total: 1 })
    await rejected
    expect(readFileSync(files.keyFile, 'utf8').trim()).toBe('sk-after-lookup')
    expect(JSON.parse(readFileSync(files.tokenFile, 'utf8'))).toEqual({ id: 2, key: 'sk-after-lookup', groups: ['new'] })
    Reflect.deleteProperty(process.env, 'XPEACH_TEST_SECOND_RELAY_KEY')
    Reflect.deleteProperty(process.env, 'XPEACH_API_KEY')
  })

  it('跨实例撤销后旧环境变量和旧槽位不能使 authority 复活', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-revoked-old\n')
    const first = fakeAccountFor(files, 'REVOKE_A')
    const second = fakeAccountFor(files, 'REVOKE_B')
    const credentials = { resolve: vi.fn(async () => ({ value: 'sk-revoked-old' })), unset: vi.fn(async () => {}) }
    Object.assign(first, {
      api: { setAdminKey: vi.fn(), setSessionKey: vi.fn() },
      ctx: { get: () => undefined, emit: vi.fn() },
    })
    Object.assign(second, { ctx: { get: () => credentials, emit: vi.fn() } })
    vi.stubEnv('XPEACH_TEST_REVOKE_B_RELAY_KEY', 'sk-revoked-old')
    writeState(files.keyFile.replace(/\.key$/, '.keys'), JSON.stringify([{ name: '旧槽位', key: 'sk-revoked-old' }]))
    const revoke = Reflect.get(XPeachAccount.prototype, 'revokeAllLocalCredentials') as (reason: string) => Promise<void>
    const resolve = Reflect.get(XPeachAccount.prototype, 'resolveKey') as () => Promise<string>
    const initialize = Reflect.get(XPeachAccount.prototype, 'initializeRelay') as () => Promise<void>
    await revoke.call(first, 'signed-out')
    await expect(resolve.call(second)).rejects.toMatchObject({ code: 'xpeach/missing-credential' })
    await initialize.call(second)
    await expect(resolve.call(second)).rejects.toMatchObject({ code: 'xpeach/missing-credential' })
    expect(credentials.resolve).not.toHaveBeenCalled()
    expect(JSON.parse(readFileSync(join(files.profile, '..', '..', 'xpeach.relay.json'), 'utf8'))).toMatchObject({ revision: 1, projectionPending: false })
    expect(process.env['XPEACH_TEST_REVOKE_B_RELAY_KEY']).toBeUndefined()
  })

  it('等待凭据引用提交且复验一致后才发布目录', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-reference-current\n')
    writeState(files.tokenFile, JSON.stringify({ id: 3, key: 'sk-reference-current', groups: ['SWE'] }))
    const entered = Promise.withResolvers<undefined>()
    const pending = Promise.withResolvers<undefined>()
    let reference = 'sk-reference-old'
    const update = vi.fn(async () => {})
    const credentials = {
      set: vi.fn(async (_ref: string, key: string) => { entered.resolve(undefined); await pending.promise; reference = key }),
      resolve: vi.fn(async () => ({ value: reference })),
    }
    const account = fakeAccountFor(files, 'REFERENCE')
    Object.assign(account, {
      liveConfig: { autoSyncModels: true },
      enabledFamilies: [],
      refreshModelMetadata: async () => undefined,
      api: {
        siteBaseURL: 'https://fixture.invalid',
        adminTokenGet: vi.fn(async () => ({ id: 3, groups: ['SWE'] })),
        models: vi.fn(async () => [{ id: 'fixture-model', groups: ['SWE'] }]),
      },
      ctx: { get: (name: string) => name === 'credentials' ? credentials : name === 'settings'
        ? { update, describe: () => ({ namespaces: [] }) } : undefined },
    })
    const sync = Reflect.get(XPeachAccount.prototype, 'syncModelsOp')
    const result = sync.call(account, {}, AbortSignal.timeout(1000))
    await entered.promise
    expect(update).not.toHaveBeenCalled()
    pending.resolve(undefined)
    expect((await result).ok).toBe(true)
    expect(update).toHaveBeenCalledTimes(1)
    expect(credentials.resolve).toHaveBeenCalledTimes(2)
  })

  it('凭据引用仍为旧密钥时，目录发布和模型流都拒绝继续', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-reference-new\n')
    writeState(files.tokenFile, JSON.stringify({ id: 3, key: 'sk-reference-new', groups: ['SWE'] }))
    const update = vi.fn(async () => {})
    const credentials = { set: vi.fn(async () => {}), resolve: vi.fn(async () => ({ value: 'sk-reference-old' })) }
    const account = fakeAccountFor(files, 'REFERENCE_MISMATCH')
    Object.assign(account, {
      liveConfig: { autoSyncModels: true },
      enabledFamilies: [],
      refreshModelMetadata: async () => undefined,
      verifyAndSyncSsoSession: async () => ({ valid: true, status: 'ok' }),
      api: {
        siteBaseURL: 'https://fixture.invalid',
        adminTokenGet: vi.fn(async () => ({ id: 3, groups: ['SWE'] })),
        models: vi.fn(async () => [{ id: 'fixture-model', groups: ['SWE'] }]),
      },
      ctx: { get: (name: string) => name === 'credentials' ? credentials : name === 'settings'
        ? { update, describe: () => ({ namespaces: [] }) } : undefined },
    })
    const sync = Reflect.get(XPeachAccount.prototype, 'syncModelsOp')
    expect(await sync.call(account, {}, AbortSignal.timeout(1000))).toMatchObject({ ok: false, code: 'credential-write-incomplete' })
    expect(update).not.toHaveBeenCalled()
    const next = vi.fn(async function* () { yield { type: 'fixture-provider-called' } })
    const guard = Reflect.get(XPeachAccount.prototype, 'guardLlmStream') as (
      options: { provider: string }, proceed: typeof next,
    ) => AsyncGenerator<Record<string, unknown>>
    const chunks: Record<string, unknown>[] = []
    for await (const chunk of guard.call(account, { provider: 'xpeach' }, next)) chunks.push(chunk)
    expect(chunks).toMatchObject([{ type: 'finish', reason: { failure: { code: 'MISSING_CREDENTIAL' } } }])
    expect(next).not.toHaveBeenCalled()
  })

  it('drops the previous token record when the SSO bridge rotates the relay key without token metadata', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-oldRelayKey001\n')
    writeState(files.adminKeyFile, 'adm-oldRelayKey001\n')
    writeState(files.ssoStateFile, JSON.stringify({
      accessToken: 'sso-oldRelayKey001',
      expiresIn: 86400,
      user: { id: '7', username: 'peachuser' },
      boundAt: Date.now(),
    }))
    writeState(files.tokenFile, JSON.stringify({ id: 10, name: 'xph-deepseek', groups: ['DeepSeek Pro'], key: 'sk-oldRelayKey001' }))

    const updatedIds: number[] = []
    const fakeAccount = fakeAccountFor(files, 'ROT')
    Object.assign(fakeAccount, {
      liveConfig: { ssoBaseURL: 'https://sso.xpeach.codes', ssoClientId: 'xpeach-harness' },
      activeBaseURL: 'https://fast.xpeach.codes',
      lastSsoVerifyAt: 0,
      lastEnsureTokenInfoAt: 0,
      catalogSynced: true,
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        setAdminKey: vi.fn(),
        setSessionKey: vi.fn(),
        ssoPeachcodeCredentials: vi.fn(async () => ({
          status: 'ok',
          payload: {
            sso: { accessToken: 'sso-oldRelayKey001', expiresIn: 86400 },
            peachcode: { apiKey: 'sk-newRelayKey999' },
          },
        })),
        adminTokens: vi.fn(async () => ({
          items: [{ id: 20, name: 'gemini-pro', key: 'geminiKey9999', status: 1, created_time: 300 }],
          total: 1,
        })),
        adminTokenGet: vi.fn(async (id: number) => ({ id, groups: ['Gemini'] })),
        adminTokenUpdate: vi.fn(async (payload: { id?: number }) => {
          updatedIds.push(payload.id ?? -1)
          return { success: true }
        }),
        userTokenKey: vi.fn(async () => ({ key: 'sk-geminiKey9999' })),
        adminTokenKey: vi.fn(async () => ({ key: 'sk-geminiKey9999' })),
      },
      ctx: { emit: vi.fn(), get: () => undefined },
    })

    const verifyOp = Reflect.get(XPeachAccount.prototype, 'verifyAndSyncSsoSession')
    const setGroupsOp = Reflect.get(XPeachAccount.prototype, 'setGroupsOp')
    const signal = new AbortController().signal
    const verify = await verifyOp.call(fakeAccount, true, signal)
    expect(verify.valid).toBe(true)

    const info = JSON.parse(readFileSync(files.tokenFile, 'utf8')) as { id?: number; name?: string; groups?: string[]; key?: string }
    expect(info.key).toBe('sk-newRelayKey999')
    expect(info.id).toBeUndefined()
    expect(info.name).toBeUndefined()
    expect(info.groups).toBeUndefined()

    const res = await setGroupsOp.call(fakeAccount, { groups: ['DeepSeek Pro'] }, signal)
    expect(res.ok).toBe(false)
    expect(updatedIds).toEqual([])
    Reflect.deleteProperty(process.env, 'XPEACH_TEST_ROT_RELAY_KEY')
  })

  it('refuses a group write when the stored token reveals a different key', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-mineRelayKey001\n')
    writeState(files.adminKeyFile, 'adm-mineRelayKey001\n')
    writeState(files.tokenFile, JSON.stringify({ id: 10, name: 'xph-deepseek', groups: ['DeepSeek Pro'], key: 'sk-mineRelayKey001' }))

    const updatedIds: number[] = []
    const fakeAccount = fakeAccountFor(files, 'MISM')
    Object.assign(fakeAccount, {
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        adminTokens: vi.fn(async () => ({
          items: [{ id: 10, name: 'xph-deepseek', key: 'mineRelayKey001', status: 1, created_time: 100 }],
          total: 1,
        })),
        adminTokenGet: vi.fn(async (id: number) => ({ id, groups: ['DeepSeek Pro'] })),
        adminTokenUpdate: vi.fn(async (payload: { id?: number }) => {
          updatedIds.push(payload.id ?? -1)
          return { success: true }
        }),
        userTokenKey: vi.fn(async () => ({ key: 'sk-rotatedAway999' })),
        adminTokenKey: vi.fn(async () => ({ key: 'sk-rotatedAway999' })),
      },
      ctx: { emit: vi.fn(), get: () => undefined },
    })

    const setGroupsOp = Reflect.get(XPeachAccount.prototype, 'setGroupsOp')
    const signal = new AbortController().signal
    const res = await setGroupsOp.call(fakeAccount, { groups: ['DeepSeek Pro'] }, signal)
    expect(res.ok).toBe(false)
    expect(updatedIds).toEqual([])
    const info = JSON.parse(readFileSync(files.tokenFile, 'utf8')) as { id?: number; key?: string }
    expect(info.id).toBeUndefined()
    Reflect.deleteProperty(process.env, 'XPEACH_TEST_MISM_RELAY_KEY')
  })

  it('discards a model catalog computed while the credential rotated', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-mineRelayKey001\n')
    writeState(files.adminKeyFile, 'adm-mineRelayKey001\n')
    writeState(files.tokenFile, JSON.stringify({ id: 10, name: 'xph-deepseek', groups: ['SWE'], key: 'sk-mineRelayKey001' }))

    let settingsWrites = 0
    const settingsService = {
      describe: () => ({ namespaces: [{ ns: 'llm-pi-ai', value: { providers: {} } }] }),
      update: vi.fn(async () => { settingsWrites += 1 }),
      mutate: vi.fn(async () => { settingsWrites += 1 }),
    }
    const fakeAccount = fakeAccountFor(files, 'EPOCH')
    Object.assign(fakeAccount, {
      liveConfig: { autoSyncModels: true },
      enabledFamilies: [],
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        models: vi.fn(async () => {
          // 成对提交新密钥与身份，模拟目录请求期间的实际轮转。
          const writer = Reflect.get(XPeachAccount.prototype, 'persistRelayCredential') as (key: string, info: object) => Promise<void>
          await writer.call(fakeAccount, 'sk-newRelayKey999', { id: 11, name: 'xph-rotated', groups: ['Gemini'], key: 'sk-newRelayKey999' })
          return [{ id: 'deepseek-v4.1' }]
        }),
        adminPricing: vi.fn(async () => ({ entries: [], groupRatio: {}, usableGroup: {} })),
      },
      ctx: {
        emit: vi.fn(),
        get: (name: string) => (name === 'settings' ? settingsService : undefined),
      },
    })

    const run = Reflect.get(XPeachAccount.prototype, 'runSyncModelCatalog') as (sig: AbortSignal) => Promise<{ ok: boolean; code?: string }>
    const res = await run.call(fakeAccount, new AbortController().signal)
    expect(res.ok).toBe(false)
    expect(res.code).toBe('credential-changed')
    expect(settingsWrites).toBe(0)
    Reflect.deleteProperty(process.env, 'XPEACH_TEST_EPOCH_RELAY_KEY')
  })

  it('mounts each catalog model under every endpoint it supports', async () => {
    const files = profileFiles()
    writeState(files.keyFile, 'sk-mineRelayKey001\n')
    writeState(files.adminKeyFile, 'adm-mineRelayKey001\n')
    writeState(files.tokenFile, JSON.stringify({ id: 10, name: 'xph-deepseek', groups: ['SWE', 'Claude 渠道'], key: 'sk-mineRelayKey001' }))

    let savedProviders: Record<string, { api?: string; models?: { id: string }[] }> = {}
    const settingsService = {
      describe: () => ({ namespaces: [{ ns: 'llm-pi-ai', value: { providers: {} } }] }),
      update: vi.fn(async (_ns: string, patch: { providers?: typeof savedProviders }) => {
        if (patch.providers !== undefined) savedProviders = patch.providers
      }),
      mutate: vi.fn(async (_ns: string, ops: { op: string; path: string[]; value?: unknown }[]) => {
        for (const op of ops) {
          if (op.path[0] !== 'providers' || op.path.length !== 2) continue
          if (op.op === 'unset') Reflect.deleteProperty(savedProviders, op.path[1] as string)
          else savedProviders[op.path[1] as string] = op.value as (typeof savedProviders)[string]
        }
      }),
    }
    const fakeAccount = fakeAccountFor(files, 'EP')
    Object.assign(fakeAccount, {
      liveConfig: { autoSyncModels: true },
      enabledFamilies: [],
      protocolPreference: 'compatible',
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        models: vi.fn(async () => [
          { id: 'deepseek-v4.1-flash', groups: ['SWE'], supported_endpoint_types: ['openai'] },
          { id: 'swe-2-max', groups: ['SWE'], supported_endpoint_types: ['openai', 'openai-response'] },
          { id: 'claude-sonnet-4-6', groups: ['Claude 渠道'], supported_endpoint_types: ['anthropic', 'openai'] },
        ]),
        groups: vi.fn(async () => ({
          SWE: { models: ['deepseek-v4.1-flash', 'swe-2-max'], ratio: 0.22 },
          'Claude 渠道': { models: ['claude-sonnet-4-6'], ratio: 0.8 },
        })),
        adminPricing: vi.fn(async () => ({
          entries: [
            { model_name: 'deepseek-v4.1-flash', enable_groups: ['SWE'], supported_endpoint_types: ['openai'] },
            { model_name: 'swe-2-max', enable_groups: ['SWE'], supported_endpoint_types: ['openai', 'openai-response'] },
            { model_name: 'claude-sonnet-4-6', enable_groups: ['Claude 渠道'], supported_endpoint_types: ['anthropic', 'openai'] },
          ],
          groupRatio: { SWE: 0.22, 'Claude 渠道': 0.8 },
          usableGroup: { SWE: 'SWE', 'Claude 渠道': 'Claude' },
        })),
      },
      ctx: {
        emit: vi.fn(),
        get: (name: string) => (name === 'settings' ? settingsService : undefined),
      },
    })

    const run = Reflect.get(XPeachAccount.prototype, 'runSyncModelCatalog') as (sig: AbortSignal) => Promise<{ ok: boolean }>
    const res = await run.call(fakeAccount, new AbortController().signal)
    expect(res.ok).toBe(true)
    const ids = (p?: { models?: { id: string }[] }) => (p?.models ?? []).map(m => m.id).sort()
    expect(ids(savedProviders['xpeach'])).toEqual(['deepseek-v4.1-flash'])
    expect(ids(savedProviders['xpeach-openai-responses'])).toEqual(['swe-2-max'])
    expect(ids(savedProviders['xpeach-anthropic'])).toEqual(['claude-sonnet-4-6'])
    expect(savedProviders['xpeach-openai-responses']?.api).toBe('openai-responses')
    Reflect.deleteProperty(process.env, 'XPEACH_TEST_EP_RELAY_KEY')
  })
})
