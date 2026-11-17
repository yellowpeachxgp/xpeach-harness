/** Python SDK 预期固定模型可见时钟，真实定时器保持运行。 */
export const name = 'python-sdk-fixed-clock'

/** @param ctx - 本次 SDK 进程独占的插件上下文。 */
export function apply(ctx) {
  const previous = Date.now
  ctx.effect(() => {
    Date.now = () => Date.UTC(2026, 10, 17)
    return () => { Date.now = previous }
  })
}
