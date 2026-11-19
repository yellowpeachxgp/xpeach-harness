/** issue #65 独立回归：实际 Loader 组合只替换站点 HTTP 与内存凭据存储。 */
import { unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadAccount, loadUnreadyAccount } from './issue-65-regression/loader.ts'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

const activeKey = ['sk', 'issue65', 'active'].join('-')
const rotatedKey = ['sk', 'issue65', 'rotated'].join('-')

const signal = (): AbortSignal => AbortSignal.timeout(10_000)

describe('issue #65 独立账号回归', () => {
  it.each(['authority-damaged', 'projection-failure'] as const)('%s导致账号未就绪时阻断产品PI路由且零HTTP', async (failure) => {
    const { ctx, site } = await loadUnreadyAccount(failure)
    expect(ctx.get('llm')).toBeDefined()
    expect(ctx.get('xpeachAccount')).toBeUndefined()
    await expect(ctx.llm.resolveCallConfig({ provider: 'xpeach', model: 'removed-model' })).rejects.toMatchObject({ code: 'NO_ADAPTER' })
    await expect(ctx.llm.prepareCall({ provider: 'xpeach', model: 'removed-model' })).rejects.toMatchObject({ code: 'NO_ADAPTER' })
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(site.requests).toEqual([])
    expect(site.writes).toEqual([])
  })
  it('写前不能显示密钥时拒绝修改任何远端令牌', async () => {
    const { account, site, seedToken } = await loadAccount()
    await seedToken({ id: 1, name: '已绑定令牌', groups: ['原渠道'], key: activeKey })
    site.revealsAvailable = false
    const result = await account.setGroupsOp({ groups: ['新渠道'] }, signal())
    expect(site.writes).toEqual([])
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it.each(['管理令牌', '用户会话'] as const)('%s在第二页命中当前key且只写正确令牌', async (channel) => {
    const { account, site, dir } = await loadAccount()
    if (channel === '用户会话') {
      unlinkSync(join(dir, 'xpeach.admin'))
      writeFileSync(join(dir, 'xpeach.session'), 'issue65-fake-session\n', { mode: 0o600 })
    }
    site.tokens = Array.from({ length: 101 }, (_, index) => ({
      id: index + 1, user_id: 1, name: '分页令牌', key: index === 100 ? 'issue65-active' : `foreign-${index}`,
      groups: ['原渠道'], status: 1, created_time: 101 - index,
    }))
    const result = await account.setGroupsOp({ groups: ['新渠道'] }, signal())
    expect(result.ok, result.error).toBe(true)
    expect(result.tokenId).toBe(101)
    expect(site.writes.map(row => row.id)).toEqual([101])
    expect(site.requests.some(request => request.path.startsWith('/api/token/?p=2'))).toBe(true)
  })

  it('身份解析预算耗尽时不猜令牌且返回可见错误', async () => {
    const { account, site } = await loadAccount({ tokenRevealLimit: 2 })
    site.tokens = Array.from({ length: 3 }, (_, index) => ({
      id: index + 1, user_id: 1, name: '隐藏key令牌', status: 1, created_time: 100 - index,
    }))
    const result = await account.setGroupsOp({ groups: ['新渠道'] }, signal())
    expect(result.ok).toBe(false)
    expect(result.code).toBe('identity-budget-exhausted')
    expect(result.error).toBeTruthy()
    expect(site.writes).toEqual([])
    const reveals = site.requests.filter(request => /\/key$/u.test(request.path))
    expect(reveals).toHaveLength(2)
  })

  it('分页预算耗尽时保留原目录、不把不完整身份当成全量可用模型', async () => {
    const { ctx, account, site } = await loadAccount({ tokenPageLimit: 1, tokenPageSize: 2 })
    site.tokens = Array.from({ length: 3 }, (_, index) => ({
      id: index + 1, user_id: 1, name: '分页预算', key: index === 2 ? 'issue65-active' : `foreign-${index}`, status: 1,
    }))
    const mutate = vi.spyOn(ctx.settings, 'mutate')
    const result = await account.syncModelsOp({}, signal())
    expect(result).toMatchObject({ ok: false, code: 'identity-budget-exhausted' })
    expect(mutate).not.toHaveBeenCalled()
    expect(site.writes).toEqual([])
    expect(site.requests.filter(request => request.path.startsWith('/api/token/?'))).toHaveLength(1)
    await expect(ctx.llm.resolveCallConfig({ provider: 'xpeach', model: 'removed-model' })).resolves.toMatchObject({ model: 'removed-model' })
  })

  it('被动目录收缩不读取或激活原会话、不改任何已有provider选择', async () => {
    const { ctx, account, site, seedToken } = await loadAccount()
    await seedToken({ id: 1, groups: ['原渠道'], key: activeKey })
    const selectModel = vi.fn(async () => undefined)
    const list = vi.fn(async () => [{ id: 'xpeach-session' }, { id: 'account-session' }, { id: 'custom-session' }])
    const get = vi.fn((id: string) => ({ lastUsed: {
      provider: id === 'account-session' ? 'deepseek-account' : id === 'custom-session' ? 'custom' : 'xpeach',
      model: 'removed-model',
    } }))
    ctx.provide('sessionController', { selectModel })
    ctx.provide('sessionPersistence', { list })
    ctx.provide('sessionProjectionCache', { get })
    const result = await account.syncModelsOp({}, signal())
    expect(result.ok, result.error).toBe(true)
    expect(site.writes).toEqual([])
    expect(selectModel).not.toHaveBeenCalled()
    expect(list).not.toHaveBeenCalled()
    expect(get).not.toHaveBeenCalled()
    expect(await ctx.llm.resolveCallConfig({ provider: 'custom', model: 'custom-model' })).toMatchObject({ provider: 'custom', model: 'custom-model' })
    await expect(ctx.llm.resolveCallConfig({ provider: 'xpeach', model: 'removed-model' })).rejects.toMatchObject({ code: 'UNKNOWN_MODEL' })
  })

  it('显式换组只协调XPeach会话、不改deepseek-account或自建provider', async () => {
    const { ctx, account, seedToken } = await loadAccount()
    await seedToken({ id: 1, groups: ['原渠道'], key: activeKey })
    const selected: { sessionId: string; provider: string }[] = []
    ctx.provide('sessionController', { selectModel: async (request: { sessionId: string; provider: string }) => { selected.push(request) } })
    ctx.provide('sessionPersistence', { list: async () => [{ id: 'xpeach-session' }, { id: 'account-session' }, { id: 'custom-session' }] })
    ctx.provide('sessionProjectionCache', { get: (id: string) => ({ lastUsed: {
      provider: id === 'account-session' ? 'deepseek-account' : id === 'custom-session' ? 'custom' : 'xpeach', model: 'removed-model',
    } }) })
    const result = await account.setGroupsOp({ groups: ['新渠道'] }, signal())
    expect(result.ok, result.error).toBe(true)
    expect(selected.map(request => request.sessionId)).toEqual(['xpeach-session'])
  })

  it('解析中key轮转后迟到的旧详情不能写回旧记录或发布目录', async () => {
    const { ctx, account, site, state } = await loadAccount()
    const entered = Promise.withResolvers<undefined>()
    const release = Promise.withResolvers<undefined>()
    site.beforeDetail = async () => { entered.resolve(undefined); await release.promise }
    const mutate = vi.spyOn(ctx.settings, 'mutate')
    const pending = account.syncModelsOp({}, signal())
    try {
      await Promise.race([entered.promise, pending.then(() => { throw new Error('旧操作未进入详情屏障') })])
      site.tokens.push({ id: 2, user_id: 1, name: '新凭据令牌', key: ['issue65', 'rotated'].join('-'), groups: ['新渠道'], status: 1 })
      const rotated = await account.keySlotAddOp({ name: '新凭据', key: rotatedKey }, signal())
      expect(rotated.ok).toBe(true)
      expect(state.read().key).toBe(rotatedKey)
    } finally {
      release.resolve(undefined)
    }
    const outcome: unknown = await pending.catch((error: unknown) => error)
    expect(outcome).toMatchObject({ code: 'credential-changed' })
    const committed = state.read()
    expect(committed.key).toBe(rotatedKey)
    expect(committed.token?.key).not.toBe(activeKey)
    expect(mutate).not.toHaveBeenCalled()
    expect(site.writes).toEqual([])
  })
})
