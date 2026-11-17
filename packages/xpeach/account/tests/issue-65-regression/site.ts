/** 只模拟站点 HTTP，不替换账号、分页、目录或路由实现。 */
import type { XPeachAdminToken, XPeachModel } from '../../src/types.ts'

/** 站点扩展字段与公开令牌字段一同进入真实 HTTP 响应。 */
type SiteToken = XPeachAdminToken & { readonly groups?: readonly string[] }

/** 假站点请求与并发屏障的可观察状态。 */
export interface SiteState {
  tokens: SiteToken[]
  models: XPeachModel[]
  revealsAvailable: boolean
  writes: { id?: number; groups?: string[] }[]
  requests: { method: string; path: string }[]
  beforeDetail?: () => Promise<void>
  /** 定向响应错误只影响本次夹具的模型端点。 */
  modelsResponse?: () => Response
  /** 候选验证的确定性屏障及 HTTP 状态。 */
  beforeUsage?: (authorization: string | null) => Promise<void>
  usageStatus?: number
  /** 用量端点的原始 HTTP 响应，包含解析失败情况。 */
  usageResponse?: () => Response
  /** 用户端点自定分页大小；列表可遮蔽密钥，reveal 仍返回实际值。 */
  userPageSize?: number
  maskTokenKeys?: boolean
  /** 模拟账号可见的分组目录。 */
  groups?: Record<string, { models: string[] }>
  /** 记录本次创建的令牌，与分组修改分开观察。 */
  created?: number[]
}

/**
 * 构造固定身份的假站点；所有 key 均为测试字面量。
 * @returns 每次测试独立持有的外部站点状态。
 */
export function createSite(): SiteState {
  return {
    tokens: [{ id: 1, user_id: 1, name: '独立回归令牌', key: 'issue65-active', groups: ['原渠道'], status: 1 }],
    models: [{ id: 'retained-model', groups: ['原渠道'], supported_endpoint_types: ['openai'] }],
    revealsAvailable: true,
    writes: [],
    requests: [],
  }
}

/**
 * 把所有请求限制在无效测试域名，并按真实 New API 外层字段返回响应。
 * @param site - 本次测试的站点状态。
 * @param input - 产品发出的请求地址。
 * @param init - 请求参数。
 * @returns 本地生成的 HTTP 响应，不访问网络。
 */
export async function siteFetch(site: SiteState, input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input)
  if (url.hostname !== 'issue65.invalid') throw new Error(`回归夹具拒绝外网请求：${url.origin}${url.pathname}`)
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
  site.requests.push({ method, path: url.pathname + url.search })
  const json = (data: unknown, status = 200): Response => Response.json(data, { status })
  if (url.pathname === '/metadata') return json({})
  if (url.pathname === '/v1/models') return site.modelsResponse?.() ?? json({ data: site.models })
  if (url.pathname === '/api/pricing') return json({ data: [], group_ratio: {}, usable_group: {} })
  if (url.pathname === '/api/user/groups' || url.pathname === '/api/user/self/groups') return json({ success: true, data: site.groups ?? {} })
  if (url.pathname === '/api/user/self') return json({ success: true, data: { id: 1, group: 'SWE' } })
  if (url.pathname === '/api/usage/token/') {
    await site.beforeUsage?.(new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).get('Authorization'))
    if (site.usageResponse !== undefined) return site.usageResponse()
    return site.usageStatus === undefined || site.usageStatus === 200
      ? json({ success: true, data: {
        name: '独立回归', total_granted: 100, total_available: 100, total_used: 0,
        unlimited_quota: false, model_limits_enabled: false, expires_at: -1,
      } })
      : json({ success: false, message: '合成密钥拒绝' }, site.usageStatus)
  }
  if (url.pathname === '/api/token/' && method === 'POST') {
    if (typeof init?.body !== 'string') throw new Error('假站点创建需要字符串 JSON 请求体')
    const payload = JSON.parse(init.body) as { name: string; groups: string[] }
    const id = Math.max(0, ...site.tokens.map(token => token.id)) + 1
    site.tokens.push({ id, user_id: 1, name: payload.name, groups: payload.groups, status: 1, key: `created-synthetic-${id}` })
    ;(site.created ??= []).push(id)
    return json({ success: true, data: {} })
  }
  if (url.pathname === '/api/token/' && method === 'GET') {
    const page = Number(url.searchParams.get('p') ?? '1') - 1
    const size = Number(url.searchParams.get('page_size') ?? site.userPageSize ?? '100')
    const items = site.tokens.slice(page * size, (page + 1) * size)
      .map(token => site.maskTokenKeys ? { ...token, key: '***' } : token)
    return json({ success: true, data: { items, total: site.tokens.length } })
  }
  const keyMatch = /^\/api\/token\/(\d+)\/key$/u.exec(url.pathname)
  if (keyMatch !== null) {
    if (!site.revealsAvailable) return json({ success: false, message: '测试站点暂时不能显示密钥' }, 503)
    const token = site.tokens.find(row => row.id === Number(keyMatch[1]))
    return json({ success: true, data: { key: token?.key ?? 'foreign-key' } })
  }
  const detailMatch = /^\/api\/token\/(\d+)$/u.exec(url.pathname)
  if (detailMatch !== null) {
    await site.beforeDetail?.()
    return json({ success: true, data: site.tokens.find(row => row.id === Number(detailMatch[1])) ?? {} })
  }
  if (url.pathname === '/api/token/' && method === 'PUT') {
    if (typeof init?.body !== 'string') throw new Error('假站点写入需要字符串 JSON 请求体')
    const payload = JSON.parse(init.body) as { id?: number; groups?: string[] }
    site.writes.push(payload)
    return json({ success: true, data: {} })
  }
  throw new Error(`未声明的假站点请求：${method} ${url.pathname}`)
}
