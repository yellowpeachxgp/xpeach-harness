/** 延迟工具绑定保留一次专家组装、上下文、额外贡献和完整提示词覆盖。 */
import { Context, type Events } from '@xpeach/xph-cordis'
import SystemPrompt, { renderContextSnapshot, renderPrompt, type AssembleContext } from '../src/index.ts'
import { expect, it, onTestFinished, vi } from 'vitest'

async function fixture() {
  const ctx = new Context()
  onTestFinished(() => ctx.fiber.dispose())
  await ctx.plugin(SystemPrompt, { includeHarnessIdentity: false })
  return ctx
}

it('最终工具过滤和 SDK 改写只执行一次，普通额外贡献保留', async () => {
  const ctx = await fixture()
  let allowed = 'before'
  const provider = vi.fn(() => ({ schemas: [{ name: allowed, description: allowed, parameters: {} }] }))
  ctx.systemPrompt.tools(provider, { deferUntilTools: true })
  ctx.systemPrompt.section({ name: 'sdk', order: 5, deferUntilTools: true, text: () => `SDK:${allowed}` })
  ctx.systemPrompt.context({ name: 'runtime', order: 0, text: '预先可读的运行时事实' })
  const finalize = vi.fn((assembly: import('../src/index.ts').PromptAssembly) => ({
    ...assembly, tools: assembly.tools.filter(tool => tool.name !== 'after'),
    sections: assembly.sections.map(section => section.name === 'sdk' ? { ...section, text: section.text + ':专家' } : section),
  }))
  const expert = vi.fn<Events['system-prompt/assemble']>(async (_assembly, _context, next) => {
    const accepted = await next()
    expect(accepted.tools).toEqual([])
    expect(accepted.sections.some(section => section.name === 'sdk')).toBe(false)
    return { ...accepted, tools: [{ name: 'expert', description: '额外工具', parameters: {} }], finalizeTools: finalize }
  })
  ctx.on('system-prompt/assemble', expert)
  const prepared = await ctx.systemPrompt.prepare()
  expect(renderContextSnapshot(prepared.assembly)).toContain('预先可读的运行时事实')
  expect(provider).not.toHaveBeenCalled()
  allowed = 'after'
  const bound = prepared.bindTools({})
  expect(bound.tools.map(tool => tool.name)).toEqual(['expert'])
  expect(renderPrompt(bound)).toBe('SDK:after:专家')
  expect(expert).toHaveBeenCalledTimes(1)
  expect(provider).toHaveBeenCalledTimes(1)
  expect(finalize).toHaveBeenCalledTimes(1)
  expect(() => prepared.bindTools({})).toThrow('不能重复绑定')
})

it('完整片段在最终专家改写之后仍覆盖工具说明', async () => {
  const ctx = await fixture()
  ctx.systemPrompt.section({ name: 'complete', order: 0, text: '唯一提示词', complete: true })
  const sdk = vi.fn(() => { throw new Error('完整提示词不应求值 SDK 文本') })
  ctx.systemPrompt.section({ name: 'sdk', order: 5, text: sdk, deferUntilTools: true })
  ctx.on('system-prompt/assemble', async (_assembly, _context, next) => ({
    ...await next(), finalizeTools: assembly => ({ ...assembly, sections: [{ name: 'expert', text: '不能覆盖完整提示词' }] }),
  }))
  const prepared = await ctx.systemPrompt.prepare()
  expect(renderPrompt(prepared.bindTools({}))).toBe('唯一提示词')
  expect(sdk).not.toHaveBeenCalled()
  expect(() => ctx.systemPrompt.section({ name: 'invalid', order: 0, text: '', complete: true, deferUntilTools: true }))
    .toThrow('不能延迟')
})

it('取消后不调用延迟提供者且不允许重复绑定', async () => {
  const ctx = await fixture()
  const control = new AbortController()
  const provider = vi.fn(() => ({ schemas: [] }))
  ctx.systemPrompt.tools(provider, { deferUntilTools: true })
  const prepared = await ctx.systemPrompt.prepare({ signal: control.signal })
  control.abort(new Error('已取消'))
  expect(() => prepared.bindTools({})).toThrow('已取消')
  expect(provider).not.toHaveBeenCalled()
  expect(() => prepared.bindTools({})).toThrow('不能重复绑定')
})

it.each([false, true])('绑定参数不能覆盖原作用域或信号，准备时存在这些字段=%s', async (present) => {
  const ctx = await fixture()
  const scope = {}
  const original = new AbortController()
  const foreign = new AbortController()
  foreign.abort(new Error('不应采用此信号'))
  const contexts: AssembleContext[] = []
  ctx.systemPrompt.tools((context) => {
    contexts.push(context)
    return { schemas: [] }
  }, { deferUntilTools: true })
  const prepared = await ctx.systemPrompt.prepare(present ? { scope, signal: original.signal } : {})
  prepared.bindTools({ scope: {}, signal: foreign.signal })
  expect(contexts).toHaveLength(1)
  expect(Object.hasOwn(contexts[0]!, 'scope')).toBe(present)
  expect(Object.hasOwn(contexts[0]!, 'signal')).toBe(present)
  if (present) {
    expect(contexts[0]!.scope).toBe(scope)
    expect(contexts[0]!.signal).toBe(original.signal)
  }
})
