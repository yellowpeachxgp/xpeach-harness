/** 真实账号组合的坏响应、令牌创建和候选密钥验证回归；仅替换站点 HTTP。 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { credentialRef } from '@xpeach/xph-credentials'
import type { XPeachAccount } from '../src/index.ts'
import { loadAccount } from './issue-65-regression/loader.ts'
import { siteFetch } from './issue-65-regression/site.ts'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

const activeKey = 'sk-issue65-active'
const candidateKey = 'sk-issue65-candidate'
const rotatedKey = 'sk-issue65-rotated'
const signal = (): AbortSignal => AbortSignal.timeout(10_000)

async function mint(account: XPeachAccount, channel: 'admin' | 'console' = 'admin'): Promise<{ ok: boolean; err?: string }> {
  const operation = Reflect.get(account, channel === 'admin' ? 'mintKeyWithAccessToken' : 'mintConsoleKey') as (signal: AbortSignal) => Promise<{ ok: boolean; err?: string }>
  const result = await operation.call(account, signal())
  const syncing = Reflect.get(account, 'catalogSyncPromise') as Promise<unknown> | undefined
  await syncing
  return result
}

describe('模型目录解析失败保持发布状态', () => {
  it.each([
    ['非JSON', () => new Response('not-json')],
    ['无数组', () => Response.json({ unexpected: true })],
    ['空值', () => Response.json(null)],
    ['缺少模型id', () => Response.json({ data: [{}] })],
    ['非法分组', () => Response.json({ data: [{ id: 'bad-model', groups: 'SWE' }] })],
  ] as const)('%s响应不会清空目录', async (_label, response) => {
    const { ctx, account, site, seedToken } = await loadAccount()
    await seedToken({ id: 1, groups: ['原渠道'], key: activeKey })
    site.modelsResponse = response
    const mutate = vi.spyOn(ctx.settings, 'mutate')
    const result = await account.syncModelsOp({}, signal())
    expect(result).toMatchObject({ ok: false, count: 0 })
    expect(result.error).toContain('模型目录响应无效')
    expect(mutate).not.toHaveBeenCalled()
    await expect(ctx.llm.resolveCallConfig({ provider: 'xpeach', model: 'removed-model' })).resolves.toMatchObject({ model: 'removed-model' })
    expect(site.writes).toEqual([])
  })

  it('合法空数组清理账号目录并保留自建提供方', async () => {
    const { ctx, account, site, seedToken } = await loadAccount()
    await seedToken({ id: 1, groups: ['原渠道'], key: activeKey })
    site.models = []
    const result = await account.syncModelsOp({}, signal())
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true, count: 0 })
    await expect(ctx.llm.resolveCallConfig({ provider: 'xpeach', model: 'removed-model' })).rejects.toMatchObject({ code: 'UNKNOWN_MODEL' })
    await expect(ctx.llm.resolveCallConfig({ provider: 'custom', model: 'custom-model' })).resolves.toMatchObject({ model: 'custom-model' })
  })
})

describe('mint只给本次新建的令牌设置默认分组', () => {
  it.each(['xph-dashboard-other-client', 'dsh-dashboard-other-client'])('无活动key不认领%s', async (name) => {
    const { account, site, state } = await loadAccount()
    await state.commit(state.read(), {})
    site.tokens = [{ id: 777, user_id: 1, name, key: 'other-client-synthetic', groups: ['有意保留的空组'], status: 1 }]
    const original = structuredClone(site.tokens[0])
    site.groups = { SWE: { models: ['retained-model'] } }
    expect(await mint(account)).toMatchObject({ ok: true })
    expect(site.created).toEqual([778])
    expect(site.writes).toHaveLength(1)
    expect(site.writes[0]).toMatchObject({ id: 778, groups: ['SWE'] })
    expect(site.tokens[0]).toEqual(original)
    expect(state.read().token).toMatchObject({ id: 778, groups: ['SWE'] })
  })

  it('已确认的既有令牌即使分组无模型也不被自动改组', async () => {
    const { account, site, state } = await loadAccount()
    site.tokens[0] = { ...site.tokens[0]!, groups: ['有意保留的空组'] }
    site.groups = { SWE: { models: ['retained-model'] } }
    expect(await mint(account)).toMatchObject({ ok: true })
    expect(site.created ?? []).toEqual([])
    expect(site.writes).toEqual([])
    expect(state.read().token).toMatchObject({ id: 1, groups: ['有意保留的空组'] })
  })

  it('已有key无法确认归属时不创建或修改令牌', async () => {
    const { account, site, state } = await loadAccount()
    site.tokens[0] = { ...site.tokens[0]!, key: 'foreign-synthetic' }
    site.revealsAvailable = false
    const before = state.read()
    expect(await mint(account)).toMatchObject({ ok: false })
    expect(site.created ?? []).toEqual([])
    expect(site.writes).toEqual([])
    expect(state.read()).toEqual(before)
  })

  it('新令牌reveal不可用时报告已创建且零改组、零绑定', async () => {
    const { account, site, state } = await loadAccount()
    await state.commit(state.read(), {})
    site.groups = { SWE: { models: ['retained-model'] } }
    site.revealsAvailable = false
    const before = state.read()
    const result = await mint(account)
    expect(result.ok).toBe(false)
    expect(result.err).toContain('新令牌已创建')
    expect(site.created).toHaveLength(1)
    expect(site.writes).toEqual([])
    expect(state.read()).toEqual(before)
  })

  it('创建后分页不完整时保留原身份，不猜测新行或修改分组', async () => {
    const { account, site, state } = await loadAccount({ tokenPageLimit: 1, tokenPageSize: 1 })
    await state.commit(state.read(), {})
    site.groups = { SWE: { models: ['retained-model'] } }
    const before = state.read()
    const result = await mint(account)
    expect(result.ok).toBe(false)
    expect(result.err).toContain('无法唯一确认新令牌')
    expect(site.created).toHaveLength(1)
    expect(site.writes).toEqual([])
    expect(state.read()).toEqual(before)
  })

  it('新建令牌在详情请求中轮转key时，写前reveal拒绝改组及本地绑定', async () => {
    const { account, site, state } = await loadAccount()
    await state.commit(state.read(), {})
    site.groups = { SWE: { models: ['retained-model'] } }
    site.beforeDetail = async () => {
      site.tokens = site.tokens.map(token => site.created?.includes(token.id) ? { ...token, key: 'rotated-remotely-synthetic' } : token)
    }
    const before = state.read()
    const result = await mint(account)
    expect(result.ok).toBe(false)
    expect(result.err).toContain('远端可能已有新令牌')
    expect(site.created).toHaveLength(1)
    expect(site.writes).toEqual([])
    expect(state.read()).toEqual(before)
  })
})

describe('候选key先独立验证再提交', () => {
  it.each([
    ['非JSON', () => new Response('not-json')],
    ['错误对象', () => Response.json({ error: { message: '合成网关错误' } })],
    ['无用量字段', () => Response.json({ unexpected: true })],
    ['空值', () => Response.json(null)],
    ['无效额度字段', () => Response.json({ success: true, data: {
      name: '合成令牌', total_granted: 100, total_used: 0, total_available: '100',
      unlimited_quota: false, model_limits_enabled: false, expires_at: -1,
    } })],
    ['无效开关字段', () => Response.json({ success: true, data: {
      name: '合成令牌', total_granted: 100, total_used: 0, total_available: 100,
      unlimited_quota: 'false', model_limits_enabled: false, expires_at: -1,
    } })],
  ] as const)('HTTP200的%s响应不提交候选或改写任何活动凭据', async (_label, response) => {
    const { ctx, account, site, state, keyFile, tokenFile, dir } = await loadAccount()
    const reference = credentialRef('ISSUE65_RELAY')
    await ctx.credentials.set(reference, activeKey)
    const before = {
      authority: state.read(), key: readFileSync(keyFile, 'utf8'), token: readFileSync(tokenFile, 'utf8'),
      relayEnvironment: process.env.ISSUE65_RELAY, apiEnvironment: process.env.ISSUE65_API,
      reference: await ctx.credentials.resolve(reference),
    }
    site.usageResponse = response
    site.beforeUsage = async (authorization) => { expect(authorization).toBe('Bearer ' + candidateKey) }
    const set = vi.spyOn(ctx.credentials, 'set')
    expect(await account.keySlotAddOp({ name: '无效响应候选', key: candidateKey }, signal())).toMatchObject({ ok: false })
    expect(state.read()).toEqual(before.authority)
    expect(readFileSync(keyFile, 'utf8')).toBe(before.key)
    expect(readFileSync(tokenFile, 'utf8')).toBe(before.token)
    expect(process.env.ISSUE65_RELAY).toBe(before.relayEnvironment)
    expect(process.env.ISSUE65_API).toBe(before.apiEnvironment)
    expect(await ctx.credentials.resolve(reference)).toEqual(before.reference)
    expect(set).not.toHaveBeenCalled()
    expect(existsSync(join(dir, 'xpeach.keys'))).toBe(false)
    expect(site.writes).toEqual([])
  })

  it('合法用量响应可以激活候选并保存槽位', async () => {
    const { ctx, account, site, state, dir } = await loadAccount()
    site.beforeUsage = async (authorization) => {
      expect(authorization).toBe('Bearer ' + candidateKey)
      expect(state.read().key).toBe(activeKey)
    }
    expect(await account.keySlotAddOp({ name: '有效候选', key: candidateKey }, signal())).toMatchObject({ ok: true })
    expect(state.read()).toMatchObject({ key: candidateKey, projectionPending: false })
    expect((await ctx.credentials.resolve(credentialRef('ISSUE65_RELAY')))?.value).toBe(candidateKey)
    expect(JSON.parse(readFileSync(join(dir, 'xpeach.keys'), 'utf8'))).toEqual([{ name: '有效候选', key: candidateKey }])
  })

  it('候选被拒绝时不改authority、环境、投影或凭据引用', async () => {
    const { ctx, account, site, state, keyFile, tokenFile } = await loadAccount()
    const before = { authority: state.read(), key: readFileSync(keyFile, 'utf8'), token: readFileSync(tokenFile, 'utf8') }
    const set = vi.spyOn(ctx.credentials, 'set')
    site.usageStatus = 401
    site.beforeUsage = async (authorization) => { expect(authorization).toBe('Bearer ' + candidateKey); expect(state.read()).toEqual(before.authority) }
    const result = await account.keySlotAddOp({ name: '拒绝候选', key: candidateKey }, signal())
    expect(result).toMatchObject({ ok: false })
    expect(state.read()).toEqual(before.authority)
    expect(readFileSync(keyFile, 'utf8')).toBe(before.key)
    expect(readFileSync(tokenFile, 'utf8')).toBe(before.token)
    expect(process.env.ISSUE65_RELAY).not.toBe(candidateKey)
    expect(set).not.toHaveBeenCalled()
  })

  it('已验证候选的引用发布失败不伪报成功且没有残留探测屏蔽', async () => {
    const { ctx, account, site, state, dir } = await loadAccount()
    const reference = credentialRef('ISSUE65_RELAY')
    await ctx.credentials.set(reference, activeKey)
    let verified = false
    site.beforeUsage = async (authorization) => { expect(authorization).toBe('Bearer ' + candidateKey); expect(state.read().key).toBe(activeKey); verified = true }
    vi.spyOn(ctx.credentials, 'set').mockImplementation(async () => { expect(verified).toBe(true); throw new Error('合成引用存储失败') })
    await expect(account.keySlotAddOp({ name: '有效候选', key: candidateKey }, signal())).rejects.toMatchObject({ code: 'credential-write-incomplete' })
    expect(verified).toBe(true)
    expect(state.read()).toMatchObject({ key: candidateKey, projectionPending: false })
    expect((await ctx.credentials.resolve(reference))?.value).toBe(activeKey)
    expect(existsSync(join(dir, 'xpeach.keys'))).toBe(false)
    expect(Reflect.get(account, 'probingSlotKey')).toBeUndefined()
    const assertPublished = Reflect.get(account, 'assertPublishedCredential') as (snapshot: { relay: ReturnType<typeof state.read> }) => Promise<void>
    await expect(assertPublished.call(account, { relay: state.read() })).rejects.toMatchObject({ code: 'credential-write-incomplete' })
  })

  it.each(['成功', '拒绝'] as const)('验证%s返回前另一实例轮转时，不覆盖新修订', async (outcome) => {
    const { account, site, state, dir } = await loadAccount()
    const entered = Promise.withResolvers<undefined>()
    const release = Promise.withResolvers<undefined>()
    site.beforeUsage = async () => { entered.resolve(undefined); await release.promise }
    site.usageStatus = outcome === '拒绝' ? 401 : 200
    const pending = account.keySlotAddOp({ name: '迟到候选', key: candidateKey }, signal())
    const rejected = expect(pending).rejects.toMatchObject({ code: 'credential-changed' })
    try {
      await entered.promise
      await state.commit(state.read(), { key: rotatedKey })
    } finally {
      release.resolve(undefined)
    }
    await rejected
    expect(state.read().key).toBe(rotatedKey)
    expect(existsSync(join(dir, 'xpeach.keys'))).toBe(false)
  })

  it('验证期间取消后不提交候选key或槽位', async () => {
    const { account, site, state, dir } = await loadAccount()
    const controller = new AbortController()
    const reason = new Error('合成验证取消')
    const before = state.read()
    site.beforeUsage = async () => { controller.abort(reason) }
    await expect(account.keySlotAddOp({ name: '取消候选', key: candidateKey }, controller.signal)).rejects.toBe(reason)
    expect(state.read()).toEqual(before)
    expect(existsSync(join(dir, 'xpeach.keys'))).toBe(false)
  })
})

describe('控制台备用mint使用精确身份与完整分页', () => {
  it.each(['xph-dashboard-other-client', 'dsh-dashboard-other-client'])('无活动key时不认领%s', async (name) => {
    const { account, site, state } = await loadAccount()
    await state.commit(state.read(), {})
    site.tokens = [{ id: 777, user_id: 1, name, status: 1, key: 'review-other-client', groups: ['其他客户端渠道'] }]
    const foreign = structuredClone(site.tokens[0])
    expect(await mint(account, 'console')).toMatchObject({ ok: true })
    expect(site.created).toEqual([778])
    expect(site.tokens[0]).toEqual(foreign)
    expect(site.writes).toEqual([])
    expect(state.read()).toMatchObject({ key: 'sk-created-synthetic-778', token: { id: 778 } })
  })

  it.each([false, true])('完整扫描后复用活动key，列表遮蔽=%s', async (masked) => {
    const { account, site, state } = await loadAccount()
    site.tokens.unshift({ id: 777, user_id: 1, name: 'xph-其他客户端', status: 1, key: 'other-client', groups: ['其他渠道'] })
    site.userPageSize = 1
    site.maskTokenKeys = masked
    expect(await mint(account, 'console')).toMatchObject({ ok: true })
    expect(site.created ?? []).toEqual([])
    expect(site.writes).toEqual([])
    expect(state.read()).toMatchObject({ key: activeKey, token: { id: 1, groups: ['原渠道'] } })
    expect(site.requests.some(request => request.path === '/api/token/?p=2')).toBe(true)
  })

  it('已有key不能由reveal确认时不创建、不绑定或改组', async () => {
    const { account, site, state } = await loadAccount()
    site.tokens[0] = { ...site.tokens[0]!, key: 'other-client' }
    site.revealsAvailable = false
    const before = state.read()
    expect(await mint(account, 'console')).toMatchObject({ ok: false })
    expect(state.read()).toEqual(before)
    expect(site.created ?? []).toEqual([])
    expect(site.writes).toEqual([])
  })

  it('创建后分页预算不足时报告未知绑定结果且不改凭据', async () => {
    const { account, site, state } = await loadAccount({ tokenPageLimit: 1 })
    await state.commit(state.read(), {})
    site.userPageSize = 1
    const before = state.read()
    const result = await mint(account, 'console')
    expect(result.ok).toBe(false)
    expect(result.err).toContain('无法唯一确认新令牌')
    expect(site.created).toHaveLength(1)
    expect(state.read()).toEqual(before)
    expect(site.writes).toEqual([])
  })

  it.each(['admin', 'console'] as const)('%s创建后有两个同名新id时不猜测唯一身份', async (channel) => {
    const { account, site, state } = await loadAccount()
    await state.commit(state.read(), {})
    const before = state.read()
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const response = await siteFetch(site, input, init)
      const url = new URL(input instanceof Request ? input.url : input)
      if (url.pathname === '/api/token/' && init?.method === 'POST') {
        const created = site.tokens.at(-1)
        if (created === undefined) throw new Error('合成站点未创建令牌')
        site.tokens.push({ ...created, id: created.id + 1 })
      }
      return response
    })
    expect(await mint(account, channel)).toMatchObject({ ok: false })
    expect(site.created).toHaveLength(1)
    expect(state.read()).toEqual(before)
    expect(site.writes).toEqual([])
  })

  it('创建后无法reveal时保留原凭据并报告远端已创建', async () => {
    const { account, site, state } = await loadAccount()
    await state.commit(state.read(), {})
    site.revealsAvailable = false
    const before = state.read()
    const result = await mint(account, 'console')
    expect(result.ok).toBe(false)
    expect(result.err).toContain('新令牌已创建')
    expect(site.created).toHaveLength(1)
    expect(state.read()).toEqual(before)
    expect(site.writes).toEqual([])
  })
})

describe.each(['admin', 'console'] as const)('%s通道的mint身份拒绝规则', (channel) => {
  it.each([false, true])('活动key仅匹配禁用令牌时零创建、零改组、零绑定且拒绝mint，列表遮蔽=%s', async (masked) => {
    const { ctx, account, site, state, keyFile, tokenFile } = await loadAccount()
    site.tokens = site.tokens.map(token => ({ ...token, status: 2 }))
    site.maskTokenKeys = masked
    const before = {
      authority: state.read(), key: readFileSync(keyFile, 'utf8'), token: readFileSync(tokenFile, 'utf8'),
      relayEnvironment: process.env.ISSUE65_RELAY, apiEnvironment: process.env.ISSUE65_API,
      tokens: structuredClone(site.tokens),
    }
    const set = vi.spyOn(ctx.credentials, 'set')
    expect(await mint(account, channel)).toEqual({ ok: false, err: '无法确认现有密钥归属，未创建或修改令牌。' })
    expect(site.requests.some(request => request.method === 'GET' && request.path.startsWith('/api/token/?p='))).toBe(true)
    expect(site.created ?? []).toEqual([])
    expect(site.writes).toEqual([])
    expect(site.tokens).toEqual(before.tokens)
    expect(site.requests.some(request => request.path.endsWith('/key'))).toBe(false)
    expect(state.read()).toEqual(before.authority)
    expect(readFileSync(keyFile, 'utf8')).toBe(before.key)
    expect(readFileSync(tokenFile, 'utf8')).toBe(before.token)
    expect(process.env.ISSUE65_RELAY).toBe(before.relayEnvironment)
    expect(process.env.ISSUE65_API).toBe(before.apiEnvironment)
    expect(set).not.toHaveBeenCalled()
  })

  it('创建前分页预算不足时零创建、零reveal、零绑定', async () => {
    const { account, site, state } = await loadAccount({ tokenPageLimit: 1, tokenPageSize: 1 })
    await state.commit(state.read(), {})
    site.userPageSize = 1
    site.tokens.push({ id: 2, user_id: 1, name: '其他客户端', key: 'foreign-synthetic', status: 1 })
    const before = state.read()
    expect(await mint(account, channel)).toMatchObject({ ok: false })
    expect(site.created ?? []).toEqual([])
    expect(site.writes).toEqual([])
    expect(site.requests.some(request => request.path.endsWith('/key'))).toBe(false)
    expect(state.read()).toEqual(before)
  })

  it.each(['创建前', '创建后'] as const)('%s列表返回与总数矛盾的空页时不提交凭据', async (stage) => {
    const { account, site, state } = await loadAccount()
    await state.commit(state.read(), {})
    const before = state.read()
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : input)
      const created = (site.created?.length ?? 0) > 0
      if (url.pathname === '/api/token/' && (init?.method ?? 'GET') === 'GET'
        && created === (stage === '创建后')) {
        const items = stage === '创建后' && url.searchParams.get('p') === '1' ? site.tokens.slice(-1) : []
        return Response.json({ success: true, data: { items, total: site.tokens.length } })
      }
      return await siteFetch(site, input, init)
    })
    const result = await mint(account, channel)
    expect(result.ok).toBe(false)
    expect(site.created ?? []).toHaveLength(stage === '创建前' ? 0 : 1)
    expect(site.writes).toEqual([])
    expect(state.read()).toEqual(before)
  })

  it('完整读取创建前后各页后才reveal，且只为本次新增id设置默认组', async () => {
    const { account, site, state } = await loadAccount({ tokenPageSize: 1 })
    await state.commit(state.read(), {})
    site.userPageSize = 1
    site.tokens = [
      { id: 7, user_id: 1, name: 'xph-其他客户端', key: 'foreign-seven', groups: ['其他渠道'], status: 1 },
      { id: 8, user_id: 1, name: 'dsh-其他客户端', key: 'foreign-eight', groups: [], status: 1 },
    ]
    const originals = structuredClone(site.tokens)
    site.groups = { SWE: { models: ['retained-model'] } }
    expect(await mint(account, channel)).toMatchObject({ ok: true })
    expect(site.created).toEqual([9])
    expect(site.tokens.slice(0, 2)).toEqual(originals)
    const requests = site.requests
    const createdAt = requests.findIndex(request => request.method === 'POST' && request.path === '/api/token/')
    const revealedAt = requests.findIndex(request => request.path === '/api/token/9/key')
    expect(requests.slice(0, createdAt).filter(request => request.path.startsWith('/api/token/?p='))).toHaveLength(2)
    expect(requests.slice(createdAt + 1, revealedAt).filter(request => request.path.startsWith('/api/token/?p='))).toHaveLength(3)
    expect(revealedAt).toBeGreaterThan(createdAt)
    expect(site.writes).toEqual(channel === 'admin' ? [expect.objectContaining({ id: 9, groups: ['SWE'] })] : [])
    expect(state.read()).toMatchObject({ key: 'sk-created-synthetic-9', token: { id: 9, groups: channel === 'admin' ? ['SWE'] : [] } })
  })

  it('创建后仅有旧id被改为新名称时不认领旧令牌', async () => {
    const { account, site, state } = await loadAccount()
    await state.commit(state.read(), {})
    const before = state.read()
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const response = await siteFetch(site, input, init)
      if (init?.method === 'POST') {
        const created = site.tokens.pop()
        const old = site.tokens[0]
        if (created?.name === undefined || old === undefined) throw new Error('合成站点缺少新令牌名称或旧令牌')
        site.tokens[0] = { ...old, name: created.name }
      }
      return response
    })
    const result = await mint(account, channel)
    expect(result.ok).toBe(false)
    expect(result.err).toContain('无法唯一确认新令牌')
    expect(site.created).toHaveLength(1)
    expect(site.writes).toEqual([])
    expect(site.requests.some(request => request.path.endsWith('/key'))).toBe(false)
    expect(state.read()).toEqual(before)
  })

  it('列表精确匹配但reveal已轮转时拒绝绑定且零创建', async () => {
    const { account, site, state } = await loadAccount()
    const before = state.read()
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const response = await siteFetch(site, input, init)
      const url = new URL(input instanceof Request ? input.url : input)
      return url.pathname === '/api/token/1/key'
        ? Response.json({ success: true, data: { key: 'rotated-remotely-synthetic' } })
        : response
    })
    expect(await mint(account, channel)).toMatchObject({ ok: false })
    expect(site.created ?? []).toEqual([])
    expect(site.writes).toEqual([])
    expect(state.read()).toEqual(before)
  })
})
