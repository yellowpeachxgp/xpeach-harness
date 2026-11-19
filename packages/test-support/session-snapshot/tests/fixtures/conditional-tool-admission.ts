/** 条件工具场景复用动态声明场景的请求与执行断言。 */
import type { Context } from '@xpeach/xph-cordis'
import { installDynamicTools } from './dynamic-tool-updates.ts'

export const name = 'snapshot-conditional-tool-admission'
export const inject = ['tools']

/**
 * 安装先拒绝、读文件后接纳、执行后再次拒绝的条件工具。
 * @param ctx - 隔离的快照场景上下文。
 */
export function apply(ctx: Context): void {
  installDynamicTools(ctx, true)
}
