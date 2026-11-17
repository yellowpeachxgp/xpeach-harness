/** 已退出 registry 的 Schedule 借用必须覆盖收件箱 flush 和任务行提交。 */
import { Context } from '@xpeach/xph-cordis'
import { SessionActivationOwner, type SessionActivation } from '@xpeach/xph-agent'
import { expect, it, vi } from 'vitest'
import ScheduleService from '../src/index.ts'
import { ScheduleRuntime } from '../src/runtime.ts'
import { agentFor, gatedScheduleBackend, harness } from './harness.ts'
import { MemoryMediaPool } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'

it('父级卸载排空已退出 registry 的 Schedule 借用直到任务回执提交', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-16T00:00:00Z'))
  const releaseFlush = Promise.withResolvers<undefined>()
  const flushing = Promise.withResolvers<undefined>()
  const releaseCommit = Promise.withResolvers<undefined>()
  const committing = Promise.withResolvers<undefined>()
  const draining = Promise.withResolvers<undefined>()
  const closing = Promise.withResolvers<undefined>()
  const pool = new MemoryMediaPool()
  let holdCommit = false
  const backend = gatedScheduleBackend(pool, {
    async putRecord(table) {
      if (table !== 'tasks' || !holdCommit) return
      committing.resolve(undefined)
      await releaseCommit.promise
    },
  })
  let ctx: Context | undefined
  let consumerDisposal: Promise<void> | undefined
  let parentDisposal: Promise<void> | undefined
  try {
    const test = await harness({ pool, backend })
    ctx = test.ctx
    await test.fiber.dispose()
    await test.withdrawActivation()
    const agent = agentFor(ctx)
    test.resolve.mockResolvedValue(agent)
    const owner = new SessionActivationOwner(test.resolve)
    const completedBorrow = vi.fn()
    const activation: SessionActivation = {
      withAgent: (id, operation) => owner.withAgent(id, async (borrowed) => {
        const result = await operation(borrowed)
        completedBorrow()
        return result
      }),
    }
    const releases: boolean[] = []
    const released = vi.fn(() => { releases.push(completedBorrow.mock.calls.length === 1) })
    const parent = await ctx.plugin(function scheduleApplication(scope: Context) {
      const resources = scope.plugin({
        inject: ['agents'],
        apply(resource: Context) {
          resource.effect(() => resource.agents.enter(agent, undefined))
          resource.effect(() => released)
        },
      })
      const publication = scope.plugin({
        apply(publication: Context) { publication.provide('sessionActivation', activation) },
      })
      scope.effect(function* () {
        yield resources.dispose
        yield publication.dispose
        yield () => {
          const task = owner.close()
          closing.resolve(undefined)
          return task
        }
      })
    })
    const consumer = await parent.ctx.plugin(ScheduleService)
    const service = ctx.schedule
    const record = await service.create(agent.id, { prompt: '提交前保留借用', after_seconds: 1, title: '借用屏障' })
    holdCommit = true
    test.flush.mockImplementationOnce(async () => {
      flushing.resolve(undefined)
      await releaseFlush.promise
    })
    // oxlint-disable-next-line typescript/unbound-method -- spy 保留原方法，调用时通过 call(this) 显式提供接收者。
    const disposeRuntime = ScheduleRuntime.prototype.dispose
    vi.spyOn(ScheduleRuntime.prototype, 'dispose').mockImplementation(function (this: ScheduleRuntime) {
      draining.resolve(undefined)
      return disposeRuntime.call(this)
    })
    await vi.advanceTimersByTimeAsync(1000)
    await flushing.promise
    consumerDisposal = consumer.dispose()
    await draining.promise
    expect(ctx.registry.has(ScheduleService)).toBe(false)
    let disposed = false
    parentDisposal = parent.dispose().then(() => { disposed = true })
    await closing.promise
    await expect(activation.withAgent(agent.id, async () => {})).rejects.toThrow('会话激活服务正在关闭')
    expect(disposed).toBe(false)
    expect(released).not.toHaveBeenCalled()
    expect(completedBorrow).not.toHaveBeenCalled()
    expect(ctx.agents.get(agent.id) === agent).toBe(true)
    expect(pool.media.get('schedule')!.tables.get('tasks')!.get(record.id)).toMatchObject({ status: 'active' })
    releaseFlush.resolve(undefined)
    await committing.promise
    expect(disposed).toBe(false)
    expect(released).not.toHaveBeenCalled()
    expect(completedBorrow).not.toHaveBeenCalled()
    expect(ctx.agents.get(agent.id) === agent).toBe(true)
    expect(pool.media.get('schedule')!.tables.get('tasks')!.get(record.id)).toMatchObject({ status: 'active' })
    releaseCommit.resolve(undefined)
    await consumerDisposal
    await parentDisposal
    expect(completedBorrow).toHaveBeenCalledOnce()
    expect(released).toHaveBeenCalledOnce()
    expect(releases).toEqual([true])
    expect(ctx.agents.get(agent.id)).toBeUndefined()
    expect(agent.followup).toHaveBeenCalledOnce()
    expect(test.flush).toHaveBeenCalledOnce()
    const message = agent.followup.mock.calls[0]![0]
    expect(pool.media.get('schedule')!.tables.get('tasks')!.get(record.id)).toMatchObject({
      status: 'inactive', lastDelivery: { scheduledAt: record.scheduledAt, messageId: message.id },
      deliveryHistory: { records: [{ scheduledAt: record.scheduledAt, messageId: message.id, prompt: record.prompt }] },
    })
  } finally {
    releaseFlush.resolve(undefined)
    releaseCommit.resolve(undefined)
    await consumerDisposal
    await parentDisposal
    await ctx?.fiber.dispose()
    vi.restoreAllMocks()
    vi.useRealTimers()
  }
})
