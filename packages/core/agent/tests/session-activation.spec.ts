import { describe, expect, it, vi } from 'vitest'
import { SessionId } from '@xpeach/xph-session'
import type { Agent } from '../src/types.ts'
import { SessionActivationOwner } from '../src/session-activation.ts'

describe('应用会话借用的关闭', () => {
  it('关闭发生在恢复开始前时拒绝借用，不调用恢复或投递', async () => {
    const resolve = vi.fn(async (): Promise<Agent> => { throw new Error('不应恢复') })
    const operation = vi.fn(async () => '不应投递')
    const owner = new SessionActivationOwner(resolve)
    const borrowing = owner.withAgent(SessionId('queued'), operation)
    const rejected = expect(borrowing).rejects.toThrow('正在关闭')
    await owner.close()
    await rejected
    expect(resolve).not.toHaveBeenCalled()
    expect(operation).not.toHaveBeenCalled()
    await expect(owner.withAgent(SessionId('late'), operation)).rejects.toThrow('正在关闭')
  })

  it('等待已开始的恢复失败并保留调用方的原始错误，关闭可重复等待', async () => {
    const entered = Promise.withResolvers<undefined>()
    const result = Promise.withResolvers<Agent>()
    const owner = new SessionActivationOwner(() => { entered.resolve(undefined); return result.promise })
    const operation = vi.fn(async () => '不应投递')
    const failure = new Error('持久会话读取失败')
    const borrowing = owner.withAgent(SessionId('restoring'), operation)
    const rejected = expect(borrowing).rejects.toBe(failure)
    await entered.promise
    let closed = false
    const close = owner.close().then(() => { closed = true })
    await expect(owner.withAgent(SessionId('late'), operation)).rejects.toThrow('正在关闭')
    expect(closed).toBe(false)
    result.reject(failure)
    await rejected
    await close
    await owner.close()
    expect(operation).not.toHaveBeenCalled()
  })
})
