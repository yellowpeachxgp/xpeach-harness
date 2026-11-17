/** 有界令牌分页与身份解析；分页完成前不执行逐项密钥 reveal。 */
import type { XPeachAdminToken } from './types.ts'

/** 一次令牌扫描的部署限额。 */
export interface TokenLookupLimits {
  /** 最大页数。 */
  readonly pages: number
  /** 管理接口请求的每页条数。 */
  readonly pageSize: number
  /** 单次身份解析最多 reveal 的令牌数。 */
  readonly reveals: number
}

/** 配置解析使用的初始限额；部署可通过账号 Config 覆盖。 */
export const DEFAULT_TOKEN_LOOKUP_LIMITS: TokenLookupLimits = { pages: 10, pageSize: 100, reveals: 16 }

/** 令牌分页的完成情况。 */
export interface TokenScan {
  readonly items: readonly XPeachAdminToken[]
  readonly status: 'complete' | 'budget-exhausted' | 'unavailable'
}

/**
 * 扫描有限页数，去重并识别重复页，保留已读取的行供精确密钥匹配。
 * @param readPage - 已绑定管理通道的分页读取器。
 * @param limits - 已验证的部署限额。
 * @param signal - 调用取消信号。
 * @param assertCurrent - 每次等待后检查调用方凭据是否仍有效。
 * @returns 已读取的令牌及扫描完成情况；取消直接传播。
 */
export async function scanTokenPages(
  readPage: (page: number, size: number, signal: AbortSignal) => Promise<{
    readonly items: readonly XPeachAdminToken[]
    readonly total: number
  }>,
  limits: TokenLookupLimits,
  signal: AbortSignal,
  assertCurrent: () => void = () => {},
): Promise<TokenScan> {
  const byId = new Map<number, XPeachAdminToken>()
  for (let page = 0; page < limits.pages; page += 1) {
    signal.throwIfAborted()
    assertCurrent()
    let result: Awaited<ReturnType<typeof readPage>>
    try {
      result = await readPage(page, limits.pageSize, signal)
    } catch (error) {
      assertCurrent()
      if (signal.aborted) throw error
      return { items: [...byId.values()], status: 'unavailable' }
    }
    assertCurrent()
    const previousCount = byId.size
    for (const item of result.items) byId.set(item.id, item)
    if (result.items.length === 0 || byId.size >= result.total) {
      return { items: [...byId.values()], status: 'complete' }
    }
    if (byId.size === previousCount) {
      return { items: [...byId.values()], status: 'budget-exhausted' }
    }
  }
  return { items: [...byId.values()], status: 'budget-exhausted' }
}
