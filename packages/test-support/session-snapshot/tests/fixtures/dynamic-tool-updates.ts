import assert from 'node:assert/strict'
import type { Context } from '@xpeach/xph-cordis'
import { projectToolUpdates } from '@xpeach/xph-llm'
import { defineContentToolFixture } from '@xpeach/xph-tool-testkit'

export const name = 'snapshot-dynamic-tool-updates'
export const inject = ['tools']

/** Register a tool after reading, then remove it after use without changing prompt text. */
export function apply(ctx: Context): void {
  installDynamicTools(ctx, false)
}

/**
 * 为记录场景安装相同的工具变化；条件模式保留注册，只切换逐步准入。
 * @param ctx - 场景插件上下文。
 * @param conditional - 是否以 when 条件控制工具可用性。
 */
export function installDynamicTools(ctx: Context, conditional: boolean): void {
  let removeTool: (() => void) | undefined
  let available = false
  let requests = 0
  const ping = defineContentToolFixture({
    name: 'snapshot_ping',
    description: 'Return pong once.',
    parameters: {},
    async execute() { return [{ type: 'text', text: 'pong' }] },
  })
  if (conditional) ctx.tools.register(ping, { when: () => available })
  ctx.on('tools/post-execute', async (exec, result, next) => {
    const downstream = await next()
    if (result.isError) return downstream
    switch (exec.name) {
      case 'read':
        if (conditional) available = true
        else removeTool = ctx.tools.register(ping)
        break
      case 'snapshot_ping':
        if (conditional) available = false
        else removeTool?.()
        break
    }
    return downstream
  })
  ctx.on('llm/stream', (options, next) => {
    requests++
    assert.ok(options.toolHistory)
    assert.equal(options.toolHistory.tools.some(tool => tool.name === 'snapshot_ping'), false)
    assert.equal(options.toolHistory.updates.length, requests - 1)
    for (const mode of ['in-history', 'addition-only'] as const) {
      const projected = projectToolUpdates(options.messages, options.tools, mode, options.toolHistory)
      const declaration = projected.tools?.find(tool => tool.name === 'snapshot_ping')
      const updates = projected.messages.filter(message => message.role === 'developer')
        .flatMap(message => message.content)
      switch (requests) {
        case 1:
          assert.equal(declaration, undefined)
          assert.deepEqual(updates, [])
          break
        case 2:
          // A new declaration stays deferred until its chronological activation.
          assert.equal(declaration?.deferLoading, true)
          assert.deepEqual(updates, [{ type: 'tool-addition', toolName: 'snapshot_ping' }])
          break
        case 3:
          if (mode === 'in-history') {
            assert.equal(declaration?.deferLoading, true)
            assert.deepEqual(updates, [
              { type: 'tool-addition', toolName: 'snapshot_ping' },
              { type: 'tool-removal', toolName: 'snapshot_ping' },
            ])
          } else {
            // Addition-only routes remove unavailable declarations and their activations.
            assert.equal(declaration, undefined)
            assert.deepEqual(updates, [])
          }
          break
        default:
          assert.fail('Unexpected model request after the tool lifecycle completed')
      }
    }
    return next()
  })
}
