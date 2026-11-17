/** 仅为显式旧组合保留已录制的身份文本；普通 SDK 场景使用当前默认文本。 */
export const name = 'snapshot-legacy-sdk-identity'
export const inject = ['systemPrompt']

/** @param {import('@xpeach/xph-cordis').Context} ctx - 旧组合的隔离上下文。 */
export function apply(ctx) {
  ctx.on('system-prompt/assemble', async (_assembly, _context, next) => {
    const assembly = await next()
    return {
      ...assembly,
      sections: assembly.sections.map(section => section.name === 'harness:identity'
        ? { ...section, text: 'You are an AI agent powered by DeepSeek Harness.' }
        : section),
    }
  })
}
