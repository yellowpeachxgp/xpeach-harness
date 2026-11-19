/** 精确提供方选择在目录缺失、配置换序和热更新时保持隔离。 */

import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { Context } from '@xpeach/xph-cordis'
import LlmRuntime from '@xpeach/xph-llm'
import type { StreamChunk } from '@xpeach/xph-llm'
import type { PiAiProviderProfile } from '@xpeach/xph-llm-pi-ai'
import { PiAiAdapter } from '../src/adapter.ts'
import { resolveProfiles } from '../src/config.ts'
import { assemble } from './assemble.ts'
import { memoryAuth } from './auth-double.ts'
import { closeMockServers, mockServer, textEvents } from './mock-server.ts'

afterEach(closeMockServers)

function profile(
  baseURL: string,
  apiKeyEnv: string,
  ids: readonly string[],
  maxTokens = 2048,
  maxRetries = 1,
): PiAiProviderProfile {
  return {
    api: 'openai-completions',
    baseURL,
    apiKeyEnv,
    models: ids.map(id => ({ id, contextWindow: 65_536, maxTokens })),
    retryPolicy: { mode: 'normal', maxRetries },
  }
}

async function mount(adapter: PiAiAdapter, providers: string[]): Promise<Context> {
  const ctx = new Context()
  onTestFinished(() => ctx.fiber.dispose())
  await ctx.plugin(LlmRuntime)
  ctx.llm.registerAdapter(providers, adapter)
  return ctx
}

async function collect(stream: AsyncIterable<StreamChunk>): Promise<StreamChunk[]> {
  const chunks: StreamChunk[] = []
  for await (const chunk of stream) chunks.push(chunk)
  return chunks
}

describe.each([false, true])('精确提供方路由（反转配置顺序：%s）', (reversed) => {
  it('本路由缺失模型时拒绝借用兄弟目录，且不解析凭据或发请求', async () => {
    const own = await mockServer([])
    const siblingA = await mockServer([])
    const siblingB = await mockServer([])
    const entries: [string, PiAiProviderProfile][] = [
      ['xpeach', profile(own.url, 'OWN_KEY', ['own-model'])],
      ['xpeach-a', profile(siblingA.url, 'SIBLING_A_KEY', ['shared-model'])],
      ['xpeach-b', profile(siblingB.url, 'SIBLING_B_KEY', ['shared-model'])],
    ]
    const profiles = resolveProfiles(Object.fromEntries(reversed ? entries.toReversed() : entries))
    const resolveApiKey = vi.fn(() => Promise.resolve('synthetic-own-key'))
    const adapter = new PiAiAdapter({ profiles: () => profiles, resolveApiKey, auth: memoryAuth() })
    const ctx = await mount(adapter, [...profiles.keys()])
    const request = { provider: 'xpeach', model: 'shared-model', messages: [] }

    const result = await assemble(ctx, request)
    expect(result.finish).toMatchObject({ kind: 'error', failure: { code: 'UNKNOWN_MODEL' } })
    await expect(adapter.resolveModel(request.provider, request.model)).rejects.toMatchObject({ code: 'UNKNOWN_MODEL' })
    await expect(ctx.llm.resolveModelInfo(request.provider, request.model)).rejects.toMatchObject({ code: 'UNKNOWN_MODEL' })
    await expect(ctx.llm.prepareCall(request)).rejects.toMatchObject({ code: 'UNKNOWN_MODEL' })
    expect(resolveApiKey).not.toHaveBeenCalled()
    expect(own.requests).toEqual([])
    expect(siblingA.requests).toEqual([])
    expect(siblingB.requests).toEqual([])
  })

  it('同名模型按显式提供方使用各自端点、key、输出默认值和重试策略', async () => {
    const first = await mockServer([{ events: textEvents }])
    const second = await mockServer([{ events: textEvents }])
    const entries: [string, PiAiProviderProfile][] = [
      ['xpeach', profile(`${first.url}/first/v1`, 'FIRST_KEY', ['shared-model'], 2048, 1)],
      ['xpeach-b', profile(`${second.url}/second/v1`, 'SECOND_KEY', ['shared-model'], 4096, 3)],
    ]
    const profiles = resolveProfiles(Object.fromEntries(reversed ? entries.toReversed() : entries))
    const keys = new Map([['FIRST_KEY', 'synthetic-first-key'], ['SECOND_KEY', 'synthetic-second-key']])
    const adapter = new PiAiAdapter({
      profiles: () => profiles,
      resolveApiKey: (_provider, selected) => Promise.resolve(keys.get(selected.apiKeyEnv ?? '')),
      auth: memoryAuth(),
    })
    const ctx = await mount(adapter, [...profiles.keys()])

    for (const [provider, maxTokens, maxRetries] of [['xpeach', 2048, 1], ['xpeach-b', 4096, 3]] as const) {
      const prepared = await ctx.llm.prepareCall({ provider, model: 'shared-model' })
      expect(prepared.config).toMatchObject({ provider, model: 'shared-model', maxTokens })
      expect(prepared.retryPolicy).toMatchObject({ mode: 'normal', maxRetries })
      const chunks = await collect(prepared.stream({ ...prepared.config, messages: [] }))
      expect(chunks.at(-1)).toMatchObject({ type: 'finish', reason: { kind: 'stop' } })
    }

    expect(first.paths).toEqual(['/first/v1/chat/completions'])
    expect(second.paths).toEqual(['/second/v1/chat/completions'])
    expect(first.headers[0]?.authorization).toBe('Bearer synthetic-first-key')
    expect(second.headers[0]?.authorization).toBe('Bearer synthetic-second-key')
    expect(first.requests).toEqual([expect.objectContaining({ model: 'shared-model', max_completion_tokens: 2048 })])
    expect(second.requests).toEqual([expect.objectContaining({ model: 'shared-model', max_completion_tokens: 4096 })])
  })
})

it('目录热更新后拒绝已移除的选择，已准备请求保留原快照，重新加入后使用新端点和 key', async () => {
  const first = await mockServer([{ events: textEvents }])
  const sibling = await mockServer([{ events: textEvents }])
  const replacement = await mockServer([{ events: textEvents }])
  const siblingProfile = profile(sibling.url, 'SIBLING_KEY', ['shared-model'], 4096)
  let profiles = resolveProfiles({
    xpeach: profile(first.url, 'FIRST_KEY', ['shared-model']),
    'xpeach-b': siblingProfile,
  })
  const keys = new Map([
    ['FIRST_KEY', 'synthetic-first-key'],
    ['SIBLING_KEY', 'synthetic-sibling-key'],
    ['REPLACEMENT_KEY', 'synthetic-replacement-key'],
  ])
  const resolveApiKey = vi.fn((_provider: string, selected: { apiKeyEnv?: string }) =>
    Promise.resolve(keys.get(selected.apiKeyEnv ?? '')))
  const adapter = new PiAiAdapter({ profiles: () => profiles, resolveApiKey, auth: memoryAuth() })
  const ctx = await mount(adapter, [...profiles.keys()])
  const selection = { provider: 'xpeach', model: 'shared-model' }
  const prepared = await ctx.llm.prepareCall(selection)

  profiles = resolveProfiles({
    'xpeach-b': siblingProfile,
    xpeach: profile(replacement.url, 'REPLACEMENT_KEY', ['replacement-only']),
  })
  await expect(ctx.llm.prepareCall(selection)).rejects.toMatchObject({ code: 'UNKNOWN_MODEL' })
  await expect(ctx.llm.resolveModelInfo(selection.provider, selection.model)).rejects.toMatchObject({ code: 'UNKNOWN_MODEL' })
  expect((await assemble(ctx, { ...selection, messages: [] })).finish)
    .toMatchObject({ kind: 'error', failure: { code: 'UNKNOWN_MODEL' } })
  expect(resolveApiKey).not.toHaveBeenCalled()
  expect(first.requests).toEqual([])
  expect(sibling.requests).toEqual([])
  expect(replacement.requests).toEqual([])

  const chunks = await collect(prepared.stream({ ...prepared.config, messages: [] }))
  expect(chunks.at(-1)).toMatchObject({ type: 'finish', reason: { kind: 'stop' } })
  expect((await assemble(ctx, { provider: 'xpeach-b', model: 'shared-model', messages: [] })).finish)
    .toEqual({ kind: 'stop' })

  profiles = resolveProfiles({
    xpeach: profile(replacement.url, 'REPLACEMENT_KEY', ['shared-model'], 8192),
    'xpeach-b': siblingProfile,
  })
  const next = await ctx.llm.prepareCall(selection)
  expect(next.config.maxTokens).toBe(8192)
  expect((await collect(next.stream({ ...next.config, messages: [] }))).at(-1))
    .toMatchObject({ type: 'finish', reason: { kind: 'stop' } })
  expect(resolveApiKey.mock.calls.map(([provider, selected]) => [provider, selected.apiKeyEnv])).toEqual([
    ['xpeach', 'FIRST_KEY'], ['xpeach-b', 'SIBLING_KEY'], ['xpeach', 'REPLACEMENT_KEY'],
  ])
  expect(first.requests).toHaveLength(1)
  expect(sibling.requests).toHaveLength(1)
  expect(replacement.requests).toHaveLength(1)
  expect(first.headers[0]?.authorization).toBe('Bearer synthetic-first-key')
  expect(sibling.headers[0]?.authorization).toBe('Bearer synthetic-sibling-key')
  expect(replacement.headers[0]?.authorization).toBe('Bearer synthetic-replacement-key')
})
