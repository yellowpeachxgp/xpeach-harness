/** 应用拥有的会话激活能力，供后台任务恢复目标会话。 */
import type { Agent } from './types.ts'
import type { SessionId } from '@xpeach/xph-session'

declare module '@xpeach/xph-cordis' {
  interface Context {
    sessionActivation: SessionActivation
  }
}

/** 应用提供并持有激活的 Agent；消费者仅在借用操作期间使用，不得释放其句柄。 */
export interface SessionActivation {
  /**
   * 复用应用拥有的活动 Agent，或恢复指定的持久会话；不存在或不可读时拒绝，不创建替代会话。
   * 提供方撤回服务时先等待依赖方排空，再释放 Agent 和持久化资源。
   * @param sessionId - 需要激活的持久会话标识。
   * @param operation - 在 Agent 保持存活期间完成的投递及持久化操作；不得保留 Agent 引用。
   * @returns 借用操作完成后的结果；关闭等待已接纳操作排空。
   */
  withAgent<T>(sessionId: SessionId, operation: (agent: Agent) => Promise<T>): Promise<T>
}

/** 跟踪借用操作，使已开始卸载的消费者也能在应用释放 Agent 前完成。 */
export class SessionActivationOwner implements SessionActivation {
  private closing = false
  private readonly pending = new Set<Promise<unknown>>()

  /** @param resolve - 应用的活动 Agent 复用或持久会话恢复实现，返回的 Agent 由应用持有。 */
  constructor(private readonly resolve: (sessionId: SessionId) => Promise<Agent>) {}

  /** @inheritdoc */
  withAgent<T>(sessionId: SessionId, operation: (agent: Agent) => Promise<T>): Promise<T> {
    if (this.closing) return Promise.reject(new Error('会话激活服务正在关闭'))
    const task = Promise.resolve().then(async () => {
      if (this.closing) throw new Error('会话激活服务正在关闭')
      const agent = await this.resolve(sessionId)
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- 等待恢复期间，应用可并发关闭准入。
      if (this.closing) throw new Error('会话激活服务正在关闭')
      return operation(agent)
    })
    this.pending.add(task)
    void task.then(
      () => { this.pending.delete(task) },
      () => { this.pending.delete(task) },
    )
    return task
  }

  /**
   * 拒绝新借用并排空已接纳操作；操作失败由原调用方处理。
   * @returns 所有已接纳操作均已完成后的清理结果。
   */
  async close(): Promise<void> {
    this.closing = true
    await Promise.allSettled(this.pending)
  }
}
