/** 用量端点只接受有效 JSON 和公开用量字段，不向真实网络发送请求。 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { XPeachApi } from '../src/api.ts'

const usage = {
  name: '合成令牌', total_granted: 100, total_used: 125, total_available: -25,
  unlimited_quota: false, model_limits_enabled: true, expires_at: -1,
}

afterEach(() => { vi.restoreAllMocks() })

function apiResponse(response: () => Response): XPeachApi {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    expect(new URL(input instanceof Request ? input.url : input).href).toBe('https://usage-test.invalid/api/usage/token/')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer sk-synthetic-usage')
    return response()
  })
  return new XPeachApi({
    baseURL: 'https://usage-test.invalid', timeoutMs: 1000,
    resolveKey: () => Promise.resolve('sk-synthetic-usage'), resolveAdmin: () => undefined,
    resolveCookie: () => undefined,
  })
}

describe('用量wire响应解析', () => {
  it.each([false, true])('接受合法负余额、无限期和未知扩展，封套=%s', async (enveloped) => {
    const value = { ...usage, extension: { enabled: true } }
    const api = apiResponse(() => Response.json(enveloped ? { success: true, data: value } : value))
    expect(await api.tokenUsage(AbortSignal.timeout(10_000))).toEqual(value)
  })

  it.each([
    ['无效名称', { ...usage, name: null }],
    ['缺少总额', { total_used: 0, total_available: 0 }],
    ['无效已用额度', { ...usage, total_used: '125' }],
    ['无效模型限制开关', { ...usage, model_limits_enabled: 'true' }],
    ['无效过期时间', { ...usage, expires_at: null }],
  ] as const)('拒绝%s', async (_label, value) => {
    const api = apiResponse(() => Response.json({ success: true, data: value }))
    await expect(api.tokenUsage(AbortSignal.timeout(10_000))).rejects.toMatchObject({
      code: 'xpeach/request-failed', details: { status: 0, message: 'invalid-token-usage' },
    })
  })

  it('拒绝合法JSON中的非有限数值', async () => {
    const api = apiResponse(() => new Response(JSON.stringify(usage).replace('"total_granted":100', '"total_granted":1e999')))
    await expect(api.tokenUsage(AbortSignal.timeout(10_000))).rejects.toMatchObject({ code: 'xpeach/request-failed' })
  })

  it('JSON读取期间取消时保留调用方取消原因', async () => {
    const controller = new AbortController()
    const reason = new Error('合成读取取消')
    const api = apiResponse(() => {
      controller.abort(reason)
      return Response.json({ success: true, data: usage })
    })
    await expect(api.tokenUsage(controller.signal)).rejects.toBe(reason)
  })
})
