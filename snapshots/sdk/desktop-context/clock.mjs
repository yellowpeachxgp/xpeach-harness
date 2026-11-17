/** 固定模型可见时钟，不替换真实定时器或取消机制。 */
export const name = 'sdk-snapshot-clock'
export function apply(ctx) {
  const previous = Date.now
  ctx.effect(() => {
    Date.now = () => Date.UTC(2026, 9, 16)
    return () => { Date.now = previous }
  })
}
