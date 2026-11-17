/** 真实临时根的原始路径、物理路径及相邻前缀均采用合成账号数据。 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isTemporaryCredentialDirectory } from '../src/credential-paths.ts'
import { XPeachAccount } from '../src/index.ts'

const roots: string[] = []

afterEach(() => {
  vi.unstubAllEnvs()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('临时凭据路径隔离', () => {
  it.each(['原始', '规范'] as const)('%s临时根中的身份解析不改写假用户共享目录', async (form) => {
    const raw = mkdtempSync(join(tmpdir(), 'xph-shared-sentinel-'))
    const fakeUserHome = mkdtempSync(join(tmpdir(), 'xph-user-sentinel-'))
    roots.push(raw, fakeUserHome)
    const home = form === '规范' ? realpathSync(raw) : raw
    for (const [name, value] of Object.entries({ HOME: fakeUserHome, USERPROFILE: fakeUserHome, XPH_HOME: home, DSH_HOME: home })) {
      vi.stubEnv(name, value)
    }
    const profile = join(home, 'profiles', 'isolated')
    mkdirSync(profile, { recursive: true })
    const key = 'sk-path-isolation-synthetic'
    writeFileSync(join(profile, 'xpeach.key'), key + '\n')
    const original = JSON.stringify({ id: 8811, name: '合成身份', groups: ['合成组'], key })
    const shared = ['', 'profiles/xpeach', 'profiles/xpeach-desktop'].map(path => join(fakeUserHome, '.xph', path))
    for (const dir of shared) {
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'xpeach.key'), key + '\n')
      writeFileSync(join(dir, 'xpeach.token'), original)
    }
    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(account, {
      keyFile: join(profile, 'xpeach.key'), keyVar: 'PATH_ISOLATION_RELAY', liveConfig: {}, lastEnsureTokenInfoAt: 0,
      ctx: { get: () => undefined },
      api: { adminTokens: async () => ({ items: [], total: 0 }), userTokens: async () => ({ items: [], total: 0 }) },
    })
    const ensure = Reflect.get(XPeachAccount.prototype, 'ensureTokenInfo') as
      (signal: AbortSignal) => Promise<{ readonly failure?: string }>
    expect(await ensure.call(account, AbortSignal.timeout(5000))).toMatchObject({ failure: 'identity-unknown' })
    expect(existsSync(join(home, 'xpeach.relay.json'))).toBe(true)
    expect(JSON.parse(readFileSync(join(profile, 'xpeach.token'), 'utf8'))).toEqual({ key })
    for (const dir of shared) {
      expect(readFileSync(join(dir, 'xpeach.token'), 'utf8')).toBe(original)
      expect(readFileSync(join(dir, 'xpeach.key'), 'utf8')).toBe(key + '\n')
    }
  })

  it('按物理路径段识别原始路径、规范路径和不存在的子目录', () => {
    const root = mkdtempSync(join(tmpdir(), 'xph-path-isolation-'))
    roots.push(root)
    expect(isTemporaryCredentialDirectory(root)).toBe(true)
    expect(isTemporaryCredentialDirectory(realpathSync(root))).toBe(true)
    expect(isTemporaryCredentialDirectory(join(realpathSync(root), 'new', 'profile'))).toBe(true)
    expect(isTemporaryCredentialDirectory(resolve(tmpdir()) + '-other/profile')).toBe(false)
  })

  it('原始和规范临时 home 均只列出隔离组内镜像与 authority', () => {
    const raw = mkdtempSync(join(tmpdir(), 'xph-account-paths-'))
    roots.push(raw)
    for (const root of [raw, realpathSync(raw)]) {
      const profile = join(root, 'profiles', 'isolated')
      mkdirSync(profile, { recursive: true })
      const account = Object.create(XPeachAccount.prototype) as XPeachAccount
      Object.assign(account, { keyFile: join(profile, 'xpeach.key'), liveConfig: {} })
      const mirrors = Reflect.get(XPeachAccount.prototype, 'sharedMirrorDirs') as () => string[]
      expect(mirrors.call(account)).toEqual([
        root, join(root, 'profiles', 'xpeach-desktop'), join(root, 'profiles', 'xpeach'),
      ])
      const state = Reflect.get(XPeachAccount.prototype, 'getRelayState') as () => object
      const options = Reflect.get(state.call(account), 'options') as { filename: string; projectionDirs: string[] }
      expect(options.filename).toBe(join(root, 'xpeach.relay.json'))
      expect(options.projectionDirs.every(isTemporaryCredentialDirectory)).toBe(true)
    }
  })
})
