/** 用逐步条件接纳工具：读文件后启用，首次执行后关闭。 */
export const name = 'python-sdk-dynamic-tools'
export const inject = ['tools']

/** @param {import('@xpeach/xph-cordis').Context} ctx - 场景独占的工具注册表。 */
export function apply(ctx) {
  let enabled = false
  ctx.effect(() => ctx.tools.register({
    name: 'snapshot_ping',
    description: 'Return pong once.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    output: {
      schema: { type: 'string' },
      render(_args, value) { return [{ type: 'text', text: value }] },
    },
    async execute() { return 'pong' },
  }, { when: () => enabled }))
  ctx.on('tools/post-execute', async (exec, result, next) => {
    const downstream = await next()
    if (result.isError) return downstream
    if (exec.name === 'read' && exec.arguments.file_path === 'dynamic-tool-task.txt') {
      enabled = true
    } else if (exec.name === 'snapshot_ping') {
      enabled = false
    }
    return downstream
  })
}
