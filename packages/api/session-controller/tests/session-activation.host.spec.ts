/** Web 提供方通过公共激活服务复用真实 Agent，并在消费者排空后释放资源。 */
import { SessionActivationOwner } from '@xpeach/xph-agent'
import { Context, Service } from '@xpeach/xph-cordis'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@xpeach/xph-agent-loop-testkit'
import { createUserMessage } from '@xpeach/xph-llm'
import { SessionId } from '@xpeach/xph-session'
import { RemoteError } from '@xpeach/xph-typert-protocol'
import { expect, it, onTestFinished, vi } from 'vitest'
import type { SessionController } from '../src/index.ts'
import { ApiSessionAgentController } from '../src/agent.ts'
import { createSessionTestController, installSessionControllerTestDependencies } from './test-remote.ts'

async function setup() {
  const ctx = new Context()
  onTestFinished(() => ctx.fiber.dispose())
  await mountAgentLoopTestDependencies(ctx)
  const loop = await mountAgentLoopTestHarness(ctx)
  const released = vi.fn()
  ctx.provide('fileUploads', { registerAgentResolver: () => released } as never)
  const defaults = { defaultModelSelection: () => ({ provider: 'fixture', model: 'fixture-model' }), cwd: '/tmp' }
  installSessionControllerTestDependencies(ctx, defaults)
  let controller: SessionController | undefined
  const provider = await ctx.plugin(function webActivationProvider(ctx: Context) {
    controller = createSessionTestController(ctx, defaults)
  })
  if (controller === undefined) throw new Error('Web 控制器未初始化')
  await controller[Service.init]()
  return { ctx, loop, controller, provider, released }
}

it('公共服务复用已注册 Agent，保留真实收件箱及 flush 结果', async () => {
  const { ctx, loop } = await setup()
  const agent = await loop.create(SessionId('web-activation-live'))
  const release = Promise.withResolvers<undefined>()
  const maintenance = agent.runMaintenance(() => release.promise)
  onTestFinished(async () => { release.resolve(undefined); await maintenance })
  const flush = vi.fn(async () => {})
  ctx.on('session/flush', flush)
  const message = createUserMessage({ content: [{ type: 'text', text: '公共激活服务投递' }], source: { kind: 'user' } })
  const result = await ctx.sessionActivation.withAgent(agent.id, async (borrowed) => {
    expect(borrowed === agent).toBe(true)
    borrowed.followup(message)
    expect(borrowed.inbox.nextTurn).toEqual([message])
    expect(await ctx.sessions.flush(borrowed.session)).toBe(true)
    return message.id
  })
  expect(result).toBe(message.id)
  expect(flush).toHaveBeenCalledWith(agent.session)
  expect(ctx.agents.get(agent.id)).toBe(agent)
})

it.each(['领域错误', '异常拒绝'] as const)('激活%s不返回成功 Agent', async (mode) => {
  const { ctx } = await setup()
  const id = SessionId('web-activation-failure')
  const failure = new RemoteError('session/not-found', '验收会话不存在', { sessionId: id })
  const resolve = vi.spyOn(ApiSessionAgentController.prototype, 'resolveAgent')
  onTestFinished(() => { resolve.mockRestore() })
  if (mode === '领域错误') resolve.mockResolvedValueOnce({ error: failure })
  else resolve.mockRejectedValueOnce(failure)
  const operation = vi.fn(async () => {})
  await expect(ctx.sessionActivation.withAgent(id, operation)).rejects.toBe(failure)
  expect(operation).not.toHaveBeenCalled()
  expect(ctx.sessions.get(id)).toBeUndefined()
  expect(ctx.agents.get(id)).toBeUndefined()
})

it('资源初始化失败时不发布激活服务', async () => {
  const ctx = new Context()
  onTestFinished(() => ctx.fiber.dispose())
  await mountAgentLoopTestDependencies(ctx)
  const defaults = { defaultModelSelection: () => ({ provider: 'fixture', model: 'fixture-model' }), cwd: '/tmp' }
  installSessionControllerTestDependencies(ctx, defaults)
  const failure = new Error('投影资源初始化失败')
  vi.spyOn(ctx.sessionProjections, 'register').mockImplementationOnce(() => { throw failure })
  await expect(ctx.plugin(function failedProvider(ctx: Context) {
    createSessionTestController(ctx, defaults)
  })).rejects.toBe(failure)
  expect(ctx.get('sessionActivation')).toBeUndefined()
})

it.each(['提供方卸载', '父级卸载且消费者已移除'] as const)('%s保留原始资源直到借用完成真实收件箱持久化', async (mode) => {
  const { ctx, loop, provider, released } = await setup()
  const agent = await loop.create(SessionId('web-activation-drain'))
  const releaseMaintenance = Promise.withResolvers<undefined>()
  const maintenance = agent.runMaintenance(() => releaseMaintenance.promise)
  const releaseFlush = Promise.withResolvers<undefined>()
  const flushing = Promise.withResolvers<undefined>()
  const draining = Promise.withResolvers<undefined>()
  const completed = Promise.withResolvers<undefined>()
  onTestFinished(async () => {
    releaseFlush.resolve(undefined)
    releaseMaintenance.resolve(undefined)
    await maintenance
  })
  const persisted: string[] = []
  ctx.on('session/flush', async (session) => {
    flushing.resolve(undefined)
    await releaseFlush.promise
    persisted.push(...session.snapshotEvents().flatMap(event =>
      event.type === 'agent/inbox/spliced' ? event.data.inserted.map(message => message.id) : []))
  })
  const message = createUserMessage({ content: [{ type: 'text', text: '等待消费者排空' }], source: { kind: 'user' } })
  const releases: boolean[] = []
  released.mockImplementation(() => { releases.push(persisted.includes(message.id)) })
  const consumerPlugin = {
    inject: ['sessionActivation', 'sessions'],
    apply(consumer: Context) {
      const work = consumer.sessionActivation.withAgent(agent.id, async (activated) => {
        activated.followup(message)
        if (!await consumer.sessions.flush(activated.session)) throw new Error('收件箱未持久化')
        completed.resolve(undefined)
      })
      consumer.effect(() => async () => { draining.resolve(undefined); await work })
    },
  }
  const consumer = await (mode === '父级卸载且消费者已移除' ? provider.ctx : ctx).plugin(consumerPlugin)
  await flushing.promise
  const activation = ctx.sessionActivation
  if (!(activation instanceof SessionActivationOwner)) throw new Error('Web 未提供借用操作所有者')
  const closing = Promise.withResolvers<undefined>()
  const close = activation.close.bind(activation)
  const closes: boolean[] = []
  vi.spyOn(activation, 'close').mockImplementation(() => {
    const task = close().then(() => { closes.push(persisted.includes(message.id)) })
    closing.resolve(undefined)
    return task
  })
  let consumerDisposal: Promise<void> | undefined
  if (mode === '父级卸载且消费者已移除') {
    consumerDisposal = consumer.dispose()
    await draining.promise
    expect(ctx.registry.has(consumerPlugin)).toBe(false)
  }
  let disposed = false
  const disposal = provider.dispose().then(() => { disposed = true })
  await closing.promise
  expect(ctx.get('sessionActivation')).toBe(activation)
  await expect(activation.withAgent(agent.id, async () => {})).rejects.toThrow('会话激活服务正在关闭')
  expect(disposed).toBe(false)
  expect(released).not.toHaveBeenCalled()
  expect(persisted).toEqual([])
  releaseFlush.resolve(undefined)
  await completed.promise
  await draining.promise
  await consumerDisposal
  await disposal
  expect(ctx.get('sessionActivation')).toBeUndefined()
  expect(persisted).toEqual([message.id])
  expect(released).toHaveBeenCalledOnce()
  expect(releases).toEqual([true])
  expect(closes).toEqual([true])
  expect(ctx.agents.get(agent.id)).toBe(agent)
})
