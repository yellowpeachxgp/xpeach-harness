/**
 * Unit tests for XPeach 3-endpoint model pool classification, per-model call
 * settings, cross-pool protocol compat filtering, and reboot-safe persistence.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveProfiles } from '@xpeach/xph-llm-pi-ai/src/config.ts'
import {
  recommendedModelEndpoint,
  XPeachAccount,
  type XPeachModelRoutingState,
} from '../src/index.ts'
import { RelayState } from '../src/relay-state.ts'

const tempDirs: string[] = []

function freshProfile(): string {
  const root = mkdtempSync(join(tmpdir(), 'xph-model-routing-'))
  tempDirs.push(root)
  return root
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true })
  }
})

describe('recommendedModelEndpoint classification', () => {
  it('diversifies models across Chat Completions, Responses API, and Anthropic Messages', () => {
    expect(recommendedModelEndpoint({ id: 'swe-2', supported_endpoint_types: ['openai'] })).toBe('openai-responses')
    expect(recommendedModelEndpoint({ id: 'swe-2-flash', supported_endpoint_types: ['openai'] })).toBe('openai-responses')
    expect(recommendedModelEndpoint({ id: 'swe-2-max', supported_endpoint_types: ['openai', 'openai-response'] })).toBe('openai-responses')
    expect(recommendedModelEndpoint({ id: 'codex-auto-review', supported_endpoint_types: ['openai'] })).toBe('openai-responses')
    expect(recommendedModelEndpoint({ id: 'gpt-6-astra', supported_endpoint_types: ['openai'] })).toBe('openai-responses')
    expect(recommendedModelEndpoint({ id: 'o3-pro' })).toBe('openai-responses')

    expect(recommendedModelEndpoint({ id: 'claude-opus-5-5', supported_endpoint_types: ['openai', 'anthropic'] })).toBe('anthropic-messages')
    expect(recommendedModelEndpoint({ id: 'claude-sonnet-4-6' })).toBe('anthropic-messages')

    expect(recommendedModelEndpoint({ id: 'deepseek-flash', supported_endpoint_types: ['openai'] })).toBe('openai-completions')
    expect(recommendedModelEndpoint({ id: 'deepseek-v4.1-flash', supported_endpoint_types: ['openai'] })).toBe('openai-completions')
    expect(recommendedModelEndpoint({ id: 'qwen3-coder-plus', supported_endpoint_types: ['openai'] })).toBe('openai-completions')
    expect(recommendedModelEndpoint({ id: 'gemini-2.5-pro', supported_endpoint_types: ['openai'] })).toBe('openai-completions')
  })
})

describe('model pool persistence across restarts and cross-pool moves', () => {
  it('preserves user endpoint drag moves, disabled state, and per-model call settings across full process restarts', async () => {
    const profile = freshProfile()
    const keyFile = join(profile, 'xpeach.key')
    const relayStateFile = join(profile, 'xpeach.relay.json')
    const key = 'sk-xphPersistKey1234567890abcdef1234567890abcdef'
    writeFileSync(keyFile, key, { mode: 0o600 })

    const relayState = new RelayState({
      filename: relayStateFile,
      legacyKeyFile: keyFile,
      legacyTokenFile: join(profile, 'xpeach.token'),
      projectionDirs: [],
      lockWaitMs: 2_000,
    })
    await relayState.repair()
    const initialRelay = relayState.read()
    await relayState.commit(initialRelay, {
      key,
      token: { id: 101, name: 'xph-persist', groups: ['SWE', 'Claude'], key },
    })

    let savedProviders: Record<string, Record<string, unknown>> = {}
    let activeDefault: { provider: string; model: string; reasoningEffort?: string } | undefined = {
      provider: 'xpeach',
      model: 'deepseek-v4.1-flash',
    }
    const sessionSelectCalls: Array<{ sessionId: string; provider: string; model: string }> = []

    const createMockAccount = (): XPeachAccount => {
      const account = Object.create(XPeachAccount.prototype) as XPeachAccount
      Object.assign(account, {
        keyFile,
        keyVar: 'XPEACH_PERSIST_TEST_KEY',
        apiKeyEnv: 'XPEACH_PERSIST_API_KEY',
        baseURL: 'https://fast.xpeach.codes',
        activeBaseURL: 'https://fast.xpeach.codes',
        liveConfig: {
          relayStateFile,
          credentialLockWaitMs: 2_000,
          autoSyncModels: true,
          conversationTracking: true,
        },
        relayState,
        lastEnsureTokenInfoAt: Date.now(),
        enabledFamilies: [],
        protocolPreference: 'compatible',
        writingPiAiSettings: 0,
        api: {
          siteBaseURL: 'https://fast.xpeach.codes',
          models: vi.fn(async () => [
            { id: 'claude-opus-5-5', groups: ['Claude'], supported_endpoint_types: ['openai', 'anthropic'] },
            { id: 'deepseek-v4.1-flash', groups: ['SWE'], supported_endpoint_types: ['openai'] },
            { id: 'swe-2', groups: ['SWE'], supported_endpoint_types: ['openai'] },
            { id: 'swe-2-flash', groups: ['SWE'], supported_endpoint_types: ['openai'] },
            { id: 'codex-auto-review', groups: ['SWE'], supported_endpoint_types: ['openai'] },
          ]),
          groups: vi.fn(async () => ({
            SWE: { models: ['deepseek-v4.1-flash', 'swe-2', 'swe-2-flash', 'codex-auto-review'], ratio: 0.22 },
            Claude: { models: ['claude-opus-5-5'], ratio: 0.8 },
          })),
          adminPricing: vi.fn(async () => ({
            entries: [],
            groupRatio: { SWE: 0.22, Claude: 0.8 },
            usableGroup: { SWE: 'SWE', Claude: 'Claude' },
          })),
        },
        ctx: {
          emit: vi.fn(),
          get: (name: string) => {
            if (name === 'settings') {
              return {
                describe: async () => ({
                  namespaces: [{ ns: 'llm-pi-ai', value: { providers: savedProviders } }],
                }),
                update: async (_ns: string, patch: { providers?: Record<string, Record<string, unknown>> }) => {
                  if (patch.providers !== undefined) {
                    savedProviders = { ...savedProviders, ...patch.providers }
                  }
                },
                mutate: async (_ns: string, ops: Array<{ op: string; path: string[]; value?: unknown }>) => {
                  for (const op of ops) {
                    if (op.path[0] === 'providers' && op.path.length === 2 && typeof op.path[1] === 'string') {
                      if (op.op === 'unset') Reflect.deleteProperty(savedProviders, op.path[1])
                      else savedProviders[op.path[1]] = op.value as Record<string, unknown>
                    }
                  }
                },
              }
            }
            if (name === 'agentDefaultModel') {
              return {
                currentSelection: () => activeDefault,
                saveSelection: async (next: { provider: string; model: string; reasoningEffort?: string }) => {
                  activeDefault = next
                  return next
                },
              }
            }
            if (name === 'sessionPersistence') {
              return {
                list: async () => [{ id: 'sess-alpha', createdAt: 1 }],
              }
            }
            if (name === 'sessionProjectionCache') {
              return {
                get: () => ({ lastUsed: { provider: 'xpeach', model: 'deepseek-v4.1-flash' } }),
              }
            }
            if (name === 'sessionController') {
              return {
                selectModel: async (req: { sessionId: string; provider: string; model: string }) => {
                  sessionSelectCalls.push(req)
                },
              }
            }
            return undefined
          },
        },
      })
      return account
    }

    const sig = new AbortController().signal

    // 1. Initial sync partitions models across the 3 pools cleanly
    const boot1 = createMockAccount()
    const runSync = Reflect.get(XPeachAccount.prototype, 'runSyncModelCatalog') as (s: AbortSignal) => Promise<{ ok: boolean }>
    const firstSync = await runSync.call(boot1, sig)
    expect(firstSync.ok).toBe(true)

    const initialSnap = await boot1.modelPoolsSnapshotOp({}, sig)
    expect(initialSnap.pools['openai-completions'].map(m => m.id)).toEqual(['deepseek-v4.1-flash'])
    expect(initialSnap.pools['openai-responses'].map(m => m.id)).toEqual(['swe-2', 'swe-2-flash', 'codex-auto-review'])
    expect(initialSnap.pools['anthropic-messages'].map(m => m.id)).toEqual(['claude-opus-5-5'])

    // 2. User drags `deepseek-v4.1-flash` to `openai-responses`, drags `claude-opus-5-5` to `openai-completions`,
    //    disables `swe-2-flash`, adds custom model `my-private-r1`, and customizes `swe-2` call settings.
    const nextRouting: XPeachModelRoutingState = {
      version: 1,
      endpointOverrides: {
        'deepseek-v4.1-flash': 'openai-responses',
        'claude-opus-5-5': 'openai-completions',
      },
      poolOrder: {
        'openai-responses': ['deepseek-v4.1-flash', 'codex-auto-review', 'swe-2'],
      },
      modelSettings: {
        'swe-2': {
          displayName: 'SWE-2 Pro (Responses)',
          contextWindow: 512_000,
          maxTokens: 64_000,
          input: ['text'],
          defaultReasoning: 'medium',
          enabledEfforts: ['off', 'medium', 'high'],
          temperature: 0.15,
          compat: {
            thinkingFormat: 'deepseek',
            supportsDeveloperRole: false,
          },
        },
        'swe-2-flash': {
          disabled: true,
        },
      },
      customModels: ['my-private-r1'],
      customBaseUrl: 'https://relay.example.com',
      conversationTracking: false,
    }

    const afterSave = await boot1.modelPoolsSaveOp({ routing: nextRouting }, sig)
    expect(afterSave.pools['openai-responses'].map(m => m.id)).toEqual([
      'deepseek-v4.1-flash',
      'codex-auto-review',
      'swe-2',
    ])
    expect(afterSave.pools['openai-completions'].map(m => m.id)).toEqual([
      'claude-opus-5-5',
      'my-private-r1',
    ])
    expect(afterSave.disabledModels.map(m => m.id)).toEqual(['swe-2-flash'])

    // Default model & open session automatically relocated to `xpeach-openai-responses`!
    expect(activeDefault).toEqual({
      provider: 'xpeach-openai-responses',
      model: 'deepseek-v4.1-flash',
    })
    expect(sessionSelectCalls).toContainEqual({
      sessionId: 'sess-alpha',
      provider: 'xpeach-openai-responses',
      model: 'deepseek-v4.1-flash',
    })

    // Verify `llm-pi-ai` `resolveProfiles` accepts all 3 generated provider buckets without any compat error!
    const resolved = resolveProfiles(savedProviders)
    const responsesModels = resolved.get('xpeach-openai-responses')?.piProvider?.getModels() ?? []
    const swe2Resolved = responsesModels.find(m => m.id === 'swe-2')
    expect(swe2Resolved?.name).toBe('SWE-2 Pro (Responses)')
    expect(swe2Resolved?.contextWindow).toBe(512_000)
    expect(swe2Resolved?.maxTokens).toBe(64_000)
    expect(swe2Resolved?.api).toBe('openai-responses')
    expect(swe2Resolved?.baseUrl).toBe('https://relay.example.com/v1')
    // `thinkingFormat` (Chat-only) was safely filtered out on `openai-responses`, while `supportsDeveloperRole` stayed!
    expect(swe2Resolved?.compat).toEqual({ supportsDeveloperRole: false })

    // `claude-opus-5-5` moved to `xpeach` (`openai-completions`) uses `openai-completions`!
    const chatModels = resolved.get('xpeach')?.piProvider?.getModels() ?? []
    const claudeInChat = chatModels.find(m => m.id === 'claude-opus-5-5')
    expect(claudeInChat?.api).toBe('openai-completions')
    expect(claudeInChat?.baseUrl).toBe('https://relay.example.com/v1')

    // 3. Simulate FULL APP RESTART: brand-new XPeachAccount instance runs `upgradeStoredModels` AND `runSyncModelCatalog`
    const boot2 = createMockAccount()
    const upgradeStored = Reflect.get(XPeachAccount.prototype, 'upgradeStoredModels') as () => Promise<void>
    await upgradeStored.call(boot2)
    const secondSync = await runSync.call(boot2, sig)
    expect(secondSync.ok).toBe(true)

    const afterRestart = await boot2.modelPoolsSnapshotOp({}, sig)
    expect(afterRestart.baseUrl).toBe('https://relay.example.com')
    expect(afterRestart.conversationTracking).toBe(false)
    expect(afterRestart.pools['openai-responses'].map(m => m.id)).toEqual([
      'deepseek-v4.1-flash',
      'codex-auto-review',
      'swe-2',
    ])
    expect(afterRestart.pools['openai-completions'].map(m => m.id)).toEqual([
      'claude-opus-5-5',
      'my-private-r1',
    ])
    expect(afterRestart.disabledModels.map(m => m.id)).toEqual(['swe-2-flash'])
    const swe2After = afterRestart.pools['openai-responses'].find(m => m.id === 'swe-2')
    expect(swe2After?.displayName).toBe('SWE-2 Pro (Responses)')
    expect(swe2After?.contextWindow).toBe(512_000)
    expect(swe2After?.maxTokens).toBe(64_000)
    expect(swe2After?.temperature).toBe(0.15)
    expect(swe2After?.defaultReasoning).toBe('medium')

    Reflect.deleteProperty(process.env, 'XPEACH_PERSIST_TEST_KEY')
  })
})
