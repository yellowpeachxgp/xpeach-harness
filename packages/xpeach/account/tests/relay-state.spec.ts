/** R3 单文件权威、比较提交、失效拒读和投影重放的磁盘验收。 */
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RelayState, RelayStateError } from '../src/relay-state.ts'
import type { RelaySnapshot, RelayStateOptions } from '../src/relay-state.ts'
import {
  allDiskFiles, expectedDisk, identityA, identityB, observedDisk, optionsFor, prepareDirectories, projectionFiles,
} from './relay-state/fixtures/state-files.ts'

const roots: string[] = []

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

async function fixture(): Promise<{ root: string; options: RelayStateOptions; state: RelayState }> {
  const root = await mkdtemp(join(tmpdir(), 'xph-relay-state-'))
  roots.push(root)
  const options = optionsFor(root)
  await prepareDirectories(options)
  return { root, options, state: new RelayState(options) }
}

async function seedAuthority(options: RelayStateOptions, value: unknown): Promise<void> {
  await writeFile(options.filename, JSON.stringify(value), { mode: 0o600 })
}

async function seedLegacy(options: RelayStateOptions, key: string, token: unknown): Promise<void> {
  await writeFile(options.legacyKeyFile, `${key}\n`, { mode: 0o600 })
  await writeFile(options.legacyTokenFile, JSON.stringify(token), { mode: 0o600 })
}

const completeA: RelaySnapshot = { version: 1, revision: 1, ...identityA, projectionPending: false }

describe('Relay 权威快照的解析', () => {
  it.each([
    { name: '完整身份', value: completeA },
    { name: '仅有密钥', value: { version: 1, revision: 2, key: identityA.key, projectionPending: false } },
    { name: '已撤销身份', value: { version: 1, revision: 3, projectionPending: false } },
    { name: '最小绑定令牌', value: { version: 1, revision: 4, key: identityA.key, token: { key: identityA.key }, projectionPending: false } },
    { name: '最大安全修订', value: { version: 1, revision: Number.MAX_SAFE_INTEGER, ...identityA, projectionPending: false } },
  ])('读取合法的$name且不改磁盘', async ({ value }) => {
    const { root, options, state } = await fixture()
    await seedAuthority(options, value)
    const before = await allDiskFiles(root)
    expect(state.read()).toEqual(value)
    expect(await allDiskFiles(root)).toEqual(before)
  })

  const invalid = [
    { name: '损坏JSON', text: '{' },
    { name: '空值', text: 'null' },
    { name: '数组', text: '[]' },
    ...[
      { version: 2 },
      { version: 0 },
      { revision: 0 },
      { revision: -1 },
      { revision: 1.5 },
      { revision: Number.MAX_SAFE_INTEGER + 1 },
      { revision: '1' },
      { projectionPending: 'false' },
      { projectionPending: null },
      { key: '' },
      { key: 123 },
      { token: null },
      { token: [] },
      { token: { key: identityB.key } },
      { token: { key: '' } },
      { token: { id: 11 } },
      { token: { key: identityA.key, id: '11' } },
      { token: { key: identityA.key, id: Number.MAX_SAFE_INTEGER + 1 } },
      { token: { key: identityA.key, groups: [123] } },
      { token: { key: identityA.key, name: false } },
      { token: { key: identityA.key, unexpected: true } },
      { unexpected: true },
    ].map((patch, index) => ({ name: `不合法字段${index + 1}`, text: JSON.stringify({ ...completeA, ...patch }) })),
  ]

  it.each(invalid)('拒绝$name且不回退旧文件', async ({ text }) => {
    const { root, options, state } = await fixture()
    await seedLegacy(options, identityB.key, identityB.token)
    await writeFile(options.filename, text, { mode: 0o600 })
    const before = await allDiskFiles(root)
    expect(() => state.read()).toThrow(RelayStateError)
    expect(() => state.read()).toThrow(expect.objectContaining({ code: 'credential-write-incomplete' }))
    await expect(state.repair()).rejects.toMatchObject({ code: 'credential-write-incomplete' })
    expect(await allDiskFiles(root)).toEqual(before)
  })
})

describe('Relay 单文件权威与比较提交', () => {
  it('相同语义的JSON属性顺序不同仍可比较并提交完整二元状态', async () => {
    const { root, options, state } = await fixture()
    const first = await state.commit(state.read(), identityA)
    const reordered: RelaySnapshot = {
      projectionPending: false,
      token: { groups: ['合成组甲'], key: identityA.key, name: '合成身份甲', id: 11 },
      key: identityA.key,
      revision: first.revision,
      version: 1,
    }
    state.assertCurrent(reordered)
    const second = await state.commit(reordered, identityB)
    expect(second).toEqual({ version: 1, revision: 2, ...identityB, projectionPending: false })
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, second))
  })

  it('旧快照不能覆盖另一实例已提交的新密钥和令牌', async () => {
    const { root, options, state } = await fixture()
    const stale = await state.commit(state.read(), identityA)
    const newer = await new RelayState(options).commit(stale, identityB)
    const before = await allDiskFiles(root)
    await expect(state.commit(stale, identityA)).rejects.toMatchObject({ code: 'credential-changed' })
    expect(() =>{  state.assertCurrent(stale) }).toThrow(expect.objectContaining({ code: 'credential-changed' }))
    expect(await allDiskFiles(root)).toEqual(before)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, newer))
  })

  it('即使语义值相同也不能越过已经变化的修订号', async () => {
    const { root, options, state } = await fixture()
    const first = await state.commit(state.read(), identityA)
    const second = await state.commit(first, identityA)
    await expect(state.commit(first, identityB)).rejects.toMatchObject({ code: 'credential-changed' })
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, second))
  })

  it('修订相同但身份不匹配的快照也不能提交', async () => {
    const { root, options, state } = await fixture()
    const first = await state.commit(state.read(), identityA)
    const unrelated: RelaySnapshot = { ...first, ...identityB }
    await expect(state.commit(unrelated, identityB)).rejects.toMatchObject({ code: 'credential-changed' })
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, first))
  })

  it('密钥与令牌绑定不匹配时保持全部文件不变并释放锁', async () => {
    const { root, options, state } = await fixture()
    const first = await state.commit(state.read(), identityA)
    const before = await allDiskFiles(root)
    await expect(state.commit(first, { key: identityB.key, token: identityA.token })).rejects.toMatchObject({ code: 'credential-changed' })
    expect(await allDiskFiles(root)).toEqual(before)
    const next = await new RelayState(options).commit(first, identityB)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, next))
  })

  it('撤销时同时清空全部旧密钥与令牌投影', async () => {
    const { root, options, state } = await fixture()
    const first = await state.commit(state.read(), identityA)
    const revoked = await state.commit(first, {})
    expect(revoked).toEqual({ version: 1, revision: 2, projectionPending: false })
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, revoked))
    expect(new RelayState(options).read()).toEqual(revoked)
  })

  it('安全整数修订耗尽时拒绝提交而不改动磁盘', async () => {
    const { root, options, state } = await fixture()
    const last: RelaySnapshot = { ...completeA, revision: Number.MAX_SAFE_INTEGER }
    await seedAuthority(options, last)
    const before = await allDiskFiles(root)
    await expect(state.commit(state.read(), identityB)).rejects.toMatchObject({ code: 'credential-write-incomplete' })
    expect(await allDiskFiles(root)).toEqual(before)
  })
})

describe('首次迁移与只从权威重放投影', () => {
  it('自定义权威目录不隐式接收密钥或令牌投影', async () => {
    const { root, options, state } = await fixture()
    const committed = await state.commit(state.read(), identityA)
    expect(await readdir(dirname(options.filename))).toEqual(['xpeach.relay.json'])
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, committed))
  })

  it('显式将权威目录加入共享组时，完整二元状态投影到该目录', async () => {
    const { root, options } = await fixture()
    const shared = { ...options, projectionDirs: [dirname(options.filename), ...options.projectionDirs] }
    const state = new RelayState(shared)
    const committed = await state.commit(state.read(), identityB)
    expect((await readdir(dirname(options.filename))).sort()).toEqual(['xpeach.key', 'xpeach.relay.json', 'xpeach.token'])
    expect(await observedDisk(root)).toEqual(expectedDisk(root, shared, committed))
  })

  it.each([false, true])('首次迁移仅在权威目录显式入组=%s时读取该目录的旧身份', async (member) => {
    const { root, options } = await fixture()
    const selected = member ? { ...options, projectionDirs: [dirname(options.filename), ...options.projectionDirs] } : options
    await seedLegacy(options, identityA.key, identityA.token)
    await writeFile(join(dirname(options.filename), 'xpeach.key'), `${identityB.key}\n`)
    await writeFile(join(dirname(options.filename), 'xpeach.token'), JSON.stringify(identityB.token))
    const before = await allDiskFiles(root)
    const state = new RelayState(selected)
    const expected = { version: 1, revision: 0, ...(member ? identityB : identityA), projectionPending: false }
    expect(state.read()).toEqual(expected)
    expect(await state.repair()).toEqual(expected)
    expect(await allDiskFiles(root)).toEqual(before)
  })

  it('仅在权威不存在时读取同源且绑定相符的旧二元状态', async () => {
    const { root, options, state } = await fixture()
    const normalizedToken = { ...identityA.token, key: identityA.key.replace(/^sk-/u, 'xpk-') }
    await seedLegacy(options, identityA.key, normalizedToken)
    const before = await allDiskFiles(root)
    const initial = state.read()
    expect(initial).toEqual({ version: 1, revision: 0, key: identityA.key, token: normalizedToken, projectionPending: false })
    expect(await state.repair()).toEqual(initial)
    expect(await allDiskFiles(root)).toEqual(before)
    const committed = await state.commit(initial, identityA)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, committed))
  })

  it.each([
    { name: '外来令牌', token: identityB.token },
    { name: '无绑定令牌', token: { id: 11, groups: ['合成组甲'] } },
  ])('首次读取丢弃$name，不把它配给旧密钥', async ({ token }) => {
    const { root, options, state } = await fixture()
    await seedLegacy(options, identityA.key, token)
    const before = await allDiskFiles(root)
    expect(state.read()).toEqual({ version: 1, revision: 0, key: identityA.key, projectionPending: false })
    expect(await allDiskFiles(root)).toEqual(before)
  })

  it('旧token的JSON损坏仅丢弃该token，不改写可读取的旧密钥', async () => {
    const { root, options, state } = await fixture()
    await seedLegacy(options, identityA.key, identityA.token)
    await writeFile(options.legacyTokenFile, '{')
    const before = await allDiskFiles(root)
    expect(state.read()).toEqual({ version: 1, revision: 0, key: identityA.key, projectionPending: false })
    expect(await state.repair()).toEqual(state.read())
    expect(await allDiskFiles(root)).toEqual(before)
  })

  it('旧token解析发生非语法资源错误时上抛，不把失败当作空token继续', async () => {
    const { root, options, state } = await fixture()
    await seedLegacy(options, identityA.key, identityA.token)
    const before = await allDiskFiles(root)
    const failure = new RangeError('合成JSON解析资源错误')
    // 仅注入此次宿主解析失败，同步读取完成后立即恢复全局函数。
    const parser = vi.spyOn(JSON, 'parse').mockImplementationOnce(() => { throw failure })
    try {
      expect(() => state.read()).toThrow(failure)
    } finally {
      parser.mockRestore()
    }
    expect(await allDiskFiles(root)).toEqual(before)
    expect(state.read()).toEqual({ version: 1, revision: 0, ...identityA, projectionPending: false })
  })

  it('权威路径的I/O错误拒绝读取和修复，不回退有效legacy', async () => {
    const { root, options, state } = await fixture()
    await seedLegacy(options, identityA.key, identityA.token)
    const initial = state.read()
    await mkdir(options.filename)
    const before = await allDiskFiles(root)
    expect(() => state.read()).toThrow(Error)
    const repairing = state.repair()
    await expect(repairing).rejects.toMatchObject({ code: 'credential-write-incomplete' })
    await expect(repairing).rejects.toHaveProperty('cause', expect.any(Error))
    expect(await allDiskFiles(root)).toEqual(before)
    expect(await readdir(options.filename)).toEqual([])
    await rm(options.filename, { recursive: true })
    const recovered = await new RelayState(options).commit(initial, identityB)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, recovered))
  })

  it('损坏权威的错误诊断不保存可能含合成密钥的JSON原始异常', async () => {
    const { root, options, state } = await fixture()
    await writeFile(options.filename, `{"key":"${identityA.key}"`)
    const before = await allDiskFiles(root)
    let failure: unknown
    try {
      state.read()
    } catch (error) {
      failure = error
    }
    expect(failure).toBeInstanceOf(RelayStateError)
    expect(failure).toMatchObject({ code: 'credential-write-incomplete' })
    expect(failure).not.toHaveProperty('cause')
    expect(String(failure)).not.toContain(identityA.key)
    expect(await allDiskFiles(root)).toEqual(before)
  })

  it('既有权威优先于所有旧文件，repair不得把旧身份反推回权威', async () => {
    const { root, options, state } = await fixture()
    const authority = await state.commit(state.read(), identityB)
    const authorityText = await readFile(options.filename, 'utf8')
    for (const path of projectionFiles(options).keys) await writeFile(path, `${identityA.key}\n`)
    for (const path of projectionFiles(options).tokens) await writeFile(path, JSON.stringify(identityA.token))
    expect(new RelayState(options).read()).toEqual(authority)
    expect(await state.repair()).toEqual(authority)
    expect(await readFile(options.filename, 'utf8')).toBe(authorityText)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, authority))
  })

  it('部分投影失败时权威保留完整新状态并拒读，修复只重放该状态', async () => {
    const { root, options, state } = await fixture()
    const first = await state.commit(state.read(), identityA)
    await rm(options.legacyTokenFile)
    await mkdir(options.legacyTokenFile)
    await expect(state.commit(first, identityB)).rejects.toMatchObject({ code: 'credential-write-incomplete' })
    const pending: RelaySnapshot = { version: 1, revision: 2, ...identityB, projectionPending: true }
    expect(JSON.parse(await readFile(options.filename, 'utf8'))).toEqual(pending)
    for (const path of projectionFiles(options).keys) expect(await readFile(path, 'utf8')).toBe(`${identityB.key}\n`)
    for (const path of projectionFiles(options).tokens.filter(path => path !== options.legacyTokenFile)) {
      expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(identityA.token)
    }
    expect(await readdir(options.legacyTokenFile)).toEqual([])
    const partial = await allDiskFiles(root)
    const expectedPaths = Object.keys(expectedDisk(root, options, pending))
      .filter(path => path !== relative(root, options.legacyTokenFile)).sort()
    expect(Object.keys(partial).sort()).toEqual(expectedPaths)
    expect(() => new RelayState(options).read()).toThrow(expect.objectContaining({ code: 'credential-write-incomplete' }))
    await expect(state.repair()).rejects.toMatchObject({ code: 'credential-write-incomplete' })
    expect(await allDiskFiles(root)).toEqual(partial)
    await rm(options.legacyTokenFile, { recursive: true })
    await seedLegacy(options, identityA.key, identityA.token)
    const recovered = await new RelayState(options).repair()
    expect(recovered).toEqual({ ...pending, projectionPending: false })
    expect(new RelayState(options).read()).toEqual(recovered)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, recovered))
  })
})

describe('持锁依赖操作的异常清理', () => {
  it.each(['commit', 'withCurrent'] as const)('已取消的%s不写任何文件，释放后仍可提交', async (operation) => {
    const { root, options, state } = await fixture()
    const first = await state.commit(state.read(), identityA)
    const before = await allDiskFiles(root)
    const controller = new AbortController()
    const cancelled = new Error('合成调用取消')
    controller.abort(cancelled)
    const work = operation === 'commit'
      ? state.commit(first, identityB, controller.signal)
      : state.withCurrent(first, async () => { await writeFile(join(root, '不应执行的发布'), '不得出现') }, controller.signal)
    await expect(work).rejects.toMatchObject({ code: 'credential-write-incomplete', cause: cancelled })
    expect(await allDiskFiles(root)).toEqual(before)
    const next = await new RelayState(options).commit(first, identityB)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, next))
  })

  it('竞争锁超时不移除仍活着的持有者，持有者成功返回后可重开提交', async () => {
    const { root, options, state } = await fixture()
    const first = await state.commit(state.read(), identityA)
    const entered = Promise.withResolvers<undefined>()
    const release = Promise.withResolvers<undefined>()
    const published = { revision: first.revision, description: '合成发布结果' }
    const holding = state.withCurrent(first, async () => {
      entered.resolve(undefined)
      await release.promise
      return published
    })
    void holding.catch(entered.reject)
    try {
      await entered.promise
      expect(await readFile(`${options.filename}.lock`, 'utf8')).toBe(`${process.pid}\n`)
      const before = await allDiskFiles(root)
      const contender = new RelayState({ ...options, lockWaitMs: 0 })
      const committing = contender.commit(first, identityB)
      await expect(committing).rejects.toMatchObject({ code: 'credential-write-incomplete' })
      await expect(committing).rejects.toHaveProperty('cause.message', expect.stringContaining('timed out waiting for the writer lock'))
      expect(await allDiskFiles(root)).toEqual(before)
      expect(new RelayState(options).read()).toEqual(first)
    } finally {
      release.resolve(undefined)
      await holding
    }
    expect(await holding).toBe(published)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, first))
    const next = await new RelayState(options).commit(first, identityB)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, next))
  })

  it('无法创建权威父目录时拒绝提交，解除文件阻碍后可重新打开', async () => {
    const { root, options, state } = await fixture()
    const initial = state.read()
    const parent = dirname(options.filename)
    await rm(parent, { recursive: true })
    await writeFile(parent, '合成目录阻碍')
    const before = await allDiskFiles(root)
    const committing = state.commit(initial, identityA)
    await expect(committing).rejects.toMatchObject({ code: 'credential-write-incomplete' })
    await expect(committing).rejects.toHaveProperty('cause', expect.any(Error))
    expect(await allDiskFiles(root)).toEqual(before)
    await rm(parent)
    const recovered = await new RelayState(options).commit(initial, identityB)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, recovered))
  })

  it('操作异常释放实际锁，重开实例仍能提交下一修订', async () => {
    const { root, options, state } = await fixture()
    const first = await state.commit(state.read(), identityA)
    const failure = new Error('合成依赖操作失败')
    await expect(state.withCurrent(first, async () => {
      expect(await readFile(`${options.filename}.lock`, 'utf8')).toBe(`${process.pid}\n`)
      throw failure
    })).rejects.toMatchObject({ code: 'credential-write-incomplete', cause: failure })
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, first))
    const second = await new RelayState(options).commit(first, identityB)
    expect(await observedDisk(root)).toEqual(expectedDisk(root, options, second))
  })
})
