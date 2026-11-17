import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { Context } from '@xpeach/xph-cordis'
import Loader from '@xpeach/xph-cordis-plugin-loader'
import { createUserMessage } from '@xpeach/xph-llm'
import { SessionId } from '@xpeach/xph-session'
import AgentLoop from '@xpeach/xph-agent-loop'
import { mountAgentLoopTestDependencies } from '@xpeach/xph-agent-loop-testkit'
import * as JsonlPersistence from '@xpeach/xph-session-persistence-jsonl'
import { MockAdapter, textResponse } from '../../../core/agent-loop/tests/mock-adapter.ts'
import { HarnessSdkJsonRpcServer } from '../src/server.ts'

async function harness(root: string) {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(JsonlPersistence, { root })
  ctx.llm.registerAdapter(['mock'], new MockAdapter([textResponse('完成')]))
  const server = new HarnessSdkJsonRpcServer(ctx, {
    notify() {},
    request() { return Promise.reject(new Error('此夹具不支持宿主请求')) },
  })
  onTestFinished(async () => { await server.shutdown(); await ctx.fiber.dispose() })
  return { ctx, server }
}

async function storage(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'xph-sdk-activation-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  return root
}

describe('SDK 会话激活', () => {
  it('激活依赖方未就绪时拒绝提示和第二次初始化', async () => {
    const { ctx, server } = await harness(await storage())
    await ctx.plugin(Loader)
    const entered = Promise.withResolvers<undefined>()
    const release = Promise.withResolvers<undefined>()
    ctx.loader.builtins['activation-readiness'] = {
      inject: ['sessionActivation'],
      async apply() { entered.resolve(undefined); await release.promise },
    }
    const loading = ctx.loader.create({ name: 'cordis:activation-readiness' })
    const params = { cwd: '.', provider: 'mock', model: 'mock' }
    const initialization = server.initialize(params)
    try {
      await entered.promise
      await expect(server.prompt({ sessionId: 'too-early', contentBlocks: [{ type: 'text', text: '等待工具' }] }))
        .rejects.toThrow('not initialized')
      await expect(server.initialize(params)).rejects.toThrow('initialization is in progress')
      expect(ctx.agents.list()).toEqual([])
    } finally {
      release.resolve(undefined)
    }
    await initialization
    await loading
    await server.prompt({ sessionId: 'ready', contentBlocks: [{ type: 'text', text: '工具已就绪' }] })
    await server.wait({ sessionId: 'ready' })
    expect(ctx.agents.list()).toHaveLength(1)
  })
  it('初始化后才提供激活，复用现有句柄，并从另一个进程生命周期恢复原会话', async () => {
    const root = await storage()
    const first = await harness(root)
    expect(first.ctx.get('sessionActivation')).toBeUndefined()
    await first.server.initialize({ cwd: root, provider: 'mock', model: 'mock' })
    await first.server.prompt({ sessionId: 'persisted', contentBlocks: [{ type: 'text', text: '记住此会话' }] })
    await first.server.wait({ sessionId: 'persisted' })
    const original = first.ctx.agents.get(SessionId('persisted'))!
    await first.ctx.sessionActivation.withAgent(original.id, async (agent) => {
      expect(agent === original).toBe(true)
    })
    await first.ctx.sessions.flush(original.session)
    await first.server.shutdown()
    await first.ctx.fiber.dispose()

    const second = await harness(root)
    await second.server.initialize({ cwd: root, provider: 'mock', model: 'mock' })
    const resume = vi.spyOn(second.ctx.agents, 'resume')
    const create = vi.spyOn(second.ctx.agents, 'create')
    const [left, right] = await Promise.all([
      second.ctx.sessionActivation.withAgent(SessionId('persisted'), async (agent) => {
        expect(agent === second.ctx.agents.get(agent.id)).toBe(true)
        return { id: agent.session.id, cwd: agent.session.header.cwd }
      }),
      second.ctx.sessionActivation.withAgent(SessionId('persisted'), async (agent) => {
        expect(agent === second.ctx.agents.get(agent.id)).toBe(true)
        return { id: agent.session.id, cwd: agent.session.header.cwd }
      }),
    ])
    expect(left).toEqual(right)
    expect(left.id).toBe(original.session.id)
    expect(left.cwd).toBe(root)
    expect(resume).toHaveBeenCalledOnce()
    expect(create).not.toHaveBeenCalled()
    await expect(second.ctx.sessionActivation.withAgent(SessionId('missing'), async () => { throw new Error('缺失会话不应进入借用操作') })).rejects.toThrow()
    expect(second.ctx.agents.get(SessionId('missing'))).toBeUndefined()
    expect(create).not.toHaveBeenCalled()
  })

  it('撤回激活并排空依赖方后才释放 SDK 拥有的 Agent', async () => {
    const { ctx, server } = await harness(await storage())
    await server.initialize({ cwd: '.', provider: 'mock', model: 'mock' })
    await server.prompt({ sessionId: 'drain', contentBlocks: [{ type: 'text', text: '等待结束' }] })
    await server.wait({ sessionId: 'drain' })
    const agent = ctx.agents.get(SessionId('drain'))!
    const entered = Promise.withResolvers<undefined>()
    const release = Promise.withResolvers<undefined>()
    const consumer = ctx.inject(['sessionActivation'], (scope) => {
      scope.effect(() => async () => { entered.resolve(undefined); await release.promise })
    })
    await consumer
    const stop = server.shutdown()
    await entered.promise
    try {
      expect(ctx.get('sessionActivation')).toBeUndefined()
      expect(ctx.agents.get(agent.id)).toBe(agent)
    } finally {
      release.resolve(undefined)
    }
    await stop
    expect(ctx.agents.get(agent.id)).toBeUndefined()
  })

  it('关闭期间等待中的恢复结果不得发布为可用 Agent', async () => {
    const { ctx, server } = await harness(await storage())
    await server.initialize({ cwd: '.', provider: 'mock', model: 'mock' })
    const entered = Promise.withResolvers<undefined>()
    const release = Promise.withResolvers<undefined>()
    const handle = await ctx.agents.create({ sessionId: SessionId('late-agent') })
    const dispose = vi.spyOn(handle, 'dispose')
    vi.spyOn(ctx.agents, 'resume').mockImplementation(async (options) => {
      entered.resolve(undefined)
      await release.promise
      expect(options.signal?.aborted).toBe(true)
      return handle
    })
    const activation = ctx.sessionActivation.withAgent(SessionId('not-present'), async () => { throw new Error('关闭后不应进入借用操作') })
    const rejected = expect(activation).rejects.toThrow()
    await entered.promise
    const stop = server.shutdown()
    release.resolve(undefined)
    await rejected
    await stop
    expect(dispose).toHaveBeenCalledOnce()
    expect(ctx.agents.list()).toEqual([])
    expect(ctx.get('sessionActivation')).toBeUndefined()
    await expect(server.initialize({ cwd: '.', provider: 'mock', model: 'mock' })).rejects.toThrow('shutting down')
  })

  it('父级卸载时保留 Agent，直到已开始清理的消费者完成借用及持久化', async () => {
    const { ctx } = await harness(await storage())
    let sdk: HarnessSdkJsonRpcServer | undefined
    const parent = await ctx.plugin({
      name: 'sdk-owner-test', inject: ['agents'],
      apply(scope: Context) {
        sdk = new HarnessSdkJsonRpcServer(scope, {
          notify() {},
          request() { return Promise.reject(new Error('此夹具不支持宿主请求')) },
        })
      },
    })
    if (sdk === undefined) throw new Error('SDK 未创建')
    await sdk.initialize({ cwd: '.', provider: 'mock', model: 'mock' })
    await sdk.prompt({ sessionId: 'parent-drain', contentBlocks: [{ type: 'text', text: '建立会话' }] })
    await sdk.wait({ sessionId: 'parent-drain' })
    const agent = ctx.agents.get(SessionId('parent-drain'))!
    const entered = Promise.withResolvers<undefined>()
    const release = Promise.withResolvers<undefined>()
    const cleaning = Promise.withResolvers<undefined>()
    const shuttingDown = Promise.withResolvers<undefined>()
    const shutdown = sdk.shutdown.bind(sdk)
    vi.spyOn(sdk, 'shutdown').mockImplementation(() => { shuttingDown.resolve(undefined); return shutdown() })
    const order: string[] = []
    ctx.on('agent/disposed', ({ agent: disposed }) => {
      if (disposed === agent) order.push('agent-disposed')
    })
    onTestFinished(() => { release.resolve(undefined) })
    const consumer = parent.ctx.inject(['sessionActivation'], (scope) => {
      const work = scope.sessionActivation.withAgent(agent.id, async (borrowed) => {
        entered.resolve(undefined)
        await release.promise
        expect(ctx.agents.get(agent.id) === borrowed).toBe(true)
        borrowed.followup(createUserMessage({ content: [{ type: 'text', text: '卸载中完成投递' }], source: { kind: 'user' } }))
        expect(await ctx.sessions.flush(borrowed.session)).toBe(true)
        order.push('borrow-flushed')
      })
      scope.effect(() => async () => { cleaning.resolve(undefined); await work })
    })
    await consumer
    await entered.promise
    let finished = false
    const disposal = parent.dispose().then(() => { finished = true; order.push('parent-disposed') })
    await Promise.all([cleaning.promise, shuttingDown.promise])
    try {
      expect(finished).toBe(false)
      expect(ctx.agents.get(agent.id) === agent).toBe(true)
    } finally {
      release.resolve(undefined)
    }
    await disposal
    expect(order).toEqual(['borrow-flushed', 'agent-disposed', 'parent-disposed'])
    expect(ctx.get('sessionActivation')).toBeUndefined()
  })

  it('初始化的模型解析迟于关闭结束时不得发布激活服务', async () => {
    const { ctx, server } = await harness(await storage())
    const entered = Promise.withResolvers<undefined>()
    const release = Promise.withResolvers<undefined>()
    const resolve = ctx.llm.resolveCallConfig.bind(ctx.llm)
    vi.spyOn(ctx.llm, 'resolveCallConfig').mockImplementation(async (request) => {
      entered.resolve(undefined)
      await release.promise
      return resolve(request)
    })
    const initialization = server.initialize({ cwd: '.', provider: 'mock', model: 'mock' })
    const rejected = expect(initialization).rejects.toThrow('shutting down')
    await entered.promise
    await server.shutdown()
    release.resolve(undefined)
    await rejected
    expect(ctx.get('sessionActivation')).toBeUndefined()
  })
})
