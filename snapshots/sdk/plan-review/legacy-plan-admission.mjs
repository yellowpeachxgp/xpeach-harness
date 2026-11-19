/** 仅此旧录制在首次进入计划模式后公开退出工具；执行仍走当前计划服务。 */
export const name = 'snapshot-legacy-plan-admission'
export const inject = ['agents', 'tools', 'planMode']

/** @param {import('@xpeach/xph-cordis').Context} ctx - 旧计划评审场景上下文。 */
export function apply(ctx) {
  ctx.on('agent/created', async ({ agent }) => {
    await agent.ctx.plugin({
      name: 'snapshot-legacy-plan-admission-scope',
      inject: ['tools'],
      apply: inner => {
        if (agent.session.snapshotEvents().some(event => event.type === 'plan/mode' && event.data.active)) return
        const release = inner.tools.restrict({ deny: ['exit_plan_mode'] })
        inner.effect(() => ctx.on('session/event', (session, event) => {
          if (session === agent.session && event.type === 'plan/mode' && event.data.active) release()
        }))
      },
    })
  })
}
