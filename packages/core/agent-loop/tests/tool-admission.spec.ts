/** 真实循环按已准备路线解析一次工具准入，并覆盖失败与取消的释放。 */
import { Context, type Events } from '@xpeach/xph-cordis'
import AgentRegistry, { installModelSelection, type ModelSelectionRef } from '@xpeach/xph-agent'
import LlmRuntime, { createUserMessage, LlmError } from '@xpeach/xph-llm'
import SessionStore, { SessionId } from '@xpeach/xph-session'
import Projections from '@xpeach/xph-session-projection'
import SystemPrompt, { type PromptAssembly } from '@xpeach/xph-system-prompt'
import Tools, { defineTool, type ResolvedToolSet, type ToolRegistrationOptions } from '@xpeach/xph-tools'
import * as Native from '@xpeach/xph-tool-executor-native'
import { expect, it, onTestFinished, vi } from 'vitest'
import AgentLoop from '../src/index.ts'
import { MockAdapter, textResponse, toolCallResponse } from './mock-adapter.ts'

async function fixture(adapter = new MockAdapter([textResponse('完成')])) {
  const ctx = new Context()
  onTestFinished(() => ctx.fiber.dispose())
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(Projections)
  await ctx.plugin(SystemPrompt, { includeHarnessIdentity: false })
  await ctx.plugin(Tools)
  await ctx.plugin(Native)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(AgentLoop, { agents: [] })
  ctx.llm.registerAdapter(['mock', 'selected', 'rewritten'], adapter)
  const agent = await ctx.agentLoop.create(SessionId('admission'), { provider: 'mock', model: 'initial' })
  const sets: ResolvedToolSet[] = []
  const resolve = ctx.tools.resolve.bind(ctx.tools)
  const resolution = vi.spyOn(ctx.tools, 'resolve').mockImplementation(async (context) => {
    const result = await resolve(context)
    sets.push(result)
    return result
  })
  const run = async () => {
    agent.followup(createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: '执行' }] }))
    await agent.whenIdle()
  }
  return { ctx, agent, adapter, sets, resolution, run }
}

function tool(name: string, execute = vi.fn(async () => '完成')) {
  return defineTool({ name, description: name, parameters: {},
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] }, execute })
}

it('按真实准备路线解析，schema、SDK 文本和批次使用同一准入', async () => {
  const h = await fixture(new MockAdapter([toolCallResponse('call', 'allowed', {}), textResponse('完成')]))
  const selection: ModelSelectionRef = { current: { provider: 'selected', model: 'selected-model' }, assembled: undefined }
  installModelSelection(h.agent.ctx, selection)
  h.ctx.on('agent/request', async (_payload, next) => ({ ...await next(), provider: 'rewritten', model: 'actual-model' }), { prepend: true })
  const condition = vi.fn<NonNullable<ToolRegistrationOptions['when']>>(({ modelSelection }) => modelSelection.provider === 'rewritten' && modelSelection.model === 'actual-model')
  const allowed = vi.fn(async () => '允许')
  const denied = vi.fn(async () => '不应执行')
  h.ctx.tools.register(tool('allowed', allowed), { when: condition })
  h.ctx.tools.register(tool('denied', denied), { when: () => false })
  h.ctx.systemPrompt.section({ name: 'sdk', order: 5, deferUntilTools: true,
    text: ({ toolSet }) => 'SDK:' + h.ctx.tools.definitions(h.agent, toolSet).map(tool => tool.name).join(',') })
  h.ctx.on('tools/pre-execute', (execution, next) => {
    expect(execution.toolSet).toBe(h.sets[0])
    return next()
  })
  await h.run()
  expect(condition).toHaveBeenCalledTimes(2)
  expect(condition.mock.calls[0]![0].modelSelection).toEqual({ provider: 'rewritten', model: 'actual-model' })
  expect(h.adapter.requests[0]?.tools?.map(tool => tool.name)).toEqual(['allowed'])
  expect(h.adapter.requests[0]?.messages.filter(message => message.role === 'system').map(message => message.content))
    .toEqual([[{ type: 'text', text: 'SDK:allowed' }]])
  expect(allowed).toHaveBeenCalledTimes(1)
  expect(denied).not.toHaveBeenCalled()
  expect(h.sets).toHaveLength(2)
  expect(h.sets.every(set => set.view(h.agent).size === 0)).toBe(true)
})

it.each(['reject', 'empty'] as const)('pre-step %s 不分配准入或准备模型请求', async (kind) => {
  const h = await fixture()
  const condition = vi.fn(() => true)
  h.ctx.tools.register(tool('allowed'), { when: condition })
  h.ctx.on('agent/pre-step', () => Promise.resolve(kind === 'reject' ? { kind: 'reject' } : { kind: 'enter', messages: [] }))
  await h.run()
  expect(h.resolution).not.toHaveBeenCalled()
  expect(condition).not.toHaveBeenCalled()
  expect(h.adapter.requests).toEqual([])
  expect(h.agent.session.snapshotEvents().some(event => event.type === 'step/start')).toBe(false)
})

it('准入已返回但准备尚未恢复时取消，仍关闭该集合', async () => {
  const h = await fixture()
  h.ctx.tools.register(tool('allowed'), { when: () => true })
  const entered = Promise.withResolvers<undefined>()
  const release = Promise.withResolvers<undefined>()
  onTestFinished(() => { release.resolve(undefined) })
  const resolve = h.resolution.getMockImplementation()!
  h.resolution.mockImplementation(async (context) => {
    const result = await resolve(context)
    entered.resolve(undefined)
    await release.promise
    return result
  })
  const running = h.run()
  await entered.promise
  expect(h.sets[0]?.view(h.agent).has('allowed')).toBe(true)
  h.agent.cancel({ kind: 'user' })
  release.resolve(undefined)
  await running
  expect(h.sets[0]?.view(h.agent).size).toBe(0)
  expect(h.adapter.requests).toEqual([])
  expect(h.agent.session.snapshotEvents().some(event => event.type === 'user/message')).toBe(false)
})

it.each(['binding', 'batch', 'prepare'] as const)('%s 失败不泄露准入', async (stage) => {
  const h = await fixture(new MockAdapter([toolCallResponse('call', 'allowed', {})]))
  h.ctx.tools.register(tool('allowed'), { when: () => true })
  if (stage === 'binding') h.ctx.systemPrompt.section({ name: 'sdk', order: 0, deferUntilTools: true,
    text: () => { throw new Error('绑定失败') } })
  if (stage === 'batch') vi.spyOn(h.ctx.tools, 'execute').mockRejectedValue(new Error('批次失败'))
  if (stage === 'prepare') h.ctx.on('agent/request', () => { throw new Error('准备失败') })
  await h.run()
  expect(h.sets).toHaveLength(stage === 'prepare' ? 0 : 1)
  expect(h.sets.every(set => set.view(h.agent).size === 0)).toBe(true)
  expect(h.agent.session.snapshotEvents().findLast(event => event.type === 'turn/end')?.data.reason.kind).toBe('error')
})

it('同一步重试不重新解析准入或执行原组装 waterfall', async () => {
  const h = await fixture(new MockAdapter([() => { throw new LlmError('暂时失败', 'RETRY') }, textResponse('完成')]))
  const condition = vi.fn(() => true)
  h.ctx.tools.register(tool('allowed'), { when: condition })
  const expert = vi.fn<Events['system-prompt/assemble']>((_assembly, _context, next) => next())
  h.ctx.on('system-prompt/assemble', expert)
  h.ctx.on('agent/request-error', () => Promise.resolve({ kind: 'retry' }))
  await h.run()
  expect(h.adapter.requests).toHaveLength(2)
  expect(condition).toHaveBeenCalledTimes(1)
  expect(expert).toHaveBeenCalledTimes(1)
  expect(h.sets).toHaveLength(1)
  expect(h.sets[0]?.view(h.agent).size).toBe(0)
})

it('重试换模型时拒绝复用旧准入，且保留已结束尝试', async () => {
  const h = await fixture(new MockAdapter([() => { throw new LlmError('暂时失败', 'RETRY') }, textResponse('不应请求')]))
  let changed = false
  h.ctx.tools.register(tool('allowed'), { when: () => true })
  h.ctx.on('agent/request', async (_payload, next) => ({ ...await next(), model: changed ? 'changed' : 'initial' }))
  h.ctx.on('agent/request-error', () => { changed = true; return Promise.resolve({ kind: 'retry' }) })
  await h.run()
  expect(h.adapter.requests).toHaveLength(1)
  expect(h.sets).toHaveLength(1)
  expect(h.sets[0]?.view(h.agent).size).toBe(0)
  const end = h.agent.session.snapshotEvents().findLast(event => event.type === 'turn/end')
  expect(end?.data.reason).toMatchObject({ kind: 'error', error: { code: 'TOOL_MODEL_SELECTION_CHANGED' } })
})

it('最终专家改写真实 schema 与工具说明，额外贡献保持有效', async () => {
  const h = await fixture()
  h.ctx.tools.register(tool('b'), { when: () => true })
  h.ctx.tools.register(tool('a'), { when: () => true })
  h.ctx.systemPrompt.section({ name: 'sdk', order: 5, deferUntilTools: true, text: '自动 SDK' })
  h.ctx.on('system-prompt/assemble', async (_assembly, _context, next) => ({ ...await next(),
    finalizeTools: (assembly: PromptAssembly) => ({ ...assembly, tools: [...assembly.tools].reverse(),
      sections: assembly.sections.filter(section => section.name !== 'sdk') }),
  }))
  await h.run()
  expect(h.adapter.requests[0]?.tools?.map(tool => tool.name)).toEqual(['b', 'a'])
  expect(h.adapter.requests[0]?.messages.some(message => message.role === 'system')).toBe(false)
})
