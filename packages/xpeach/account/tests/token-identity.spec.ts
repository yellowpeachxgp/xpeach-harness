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
          // The credential rotates mid-sync: a fresh write bumps the epoch.
          const writer = Reflect.get(XPeachAccount.prototype, 'writeTokenInfo') as (info: object) => void
          writer.call(fakeAccount, { id: 11, name: 'xph-rotated', groups: ['Gemini'], key: 'sk-newRelayKey999' })
          return [{ id: 'deepseek-v4.1' }]
        }),
        adminPricing: vi.fn(async () => ({ entries: [], groupRatio: {}, usableGroup: {} })),
      },
      ctx: {
        emit: vi.fn(),
        get: (name: string) => (name === 'settings' ? settingsService : undefined),
      },
    })

    const run = Reflect.get(XPeachAccount.prototype, 'runSyncModelCatalog') as (sig: AbortSignal) => Promise<{ ok: boolean; error?: string }>
    const res = await run.call(fakeAccount, new AbortController().signal)
    expect(res.ok).toBe(false)
    expect(res.error).toContain('credential changed')
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
          { id: 'swe-2-max', groups: ['SWE'], supported_endpoint_types: ['openai', 'openai-response'] },
          { id: 'claude-sonnet-4-6', groups: ['Claude 渠道'], supported_endpoint_types: ['anthropic', 'openai'] },
        ]),
        groups: vi.fn(async () => ({
          SWE: { models: ['swe-2-max'], ratio: 0.22 },
          'Claude 渠道': { models: ['claude-sonnet-4-6'], ratio: 0.8 },
        })),
        adminPricing: vi.fn(async () => ({
          entries: [
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
    expect(ids(savedProviders['xpeach'])).toEqual(['claude-sonnet-4-6', 'swe-2-max'])
    expect(ids(savedProviders['xpeach-openai-responses'])).toEqual(['swe-2-max'])
    expect(ids(savedProviders['xpeach-anthropic'])).toEqual(['claude-sonnet-4-6'])
    expect(savedProviders['xpeach-openai-responses']?.api).toBe('openai-responses')
    Reflect.deleteProperty(process.env, 'XPEACH_TEST_EP_RELAY_KEY')
  })
})
