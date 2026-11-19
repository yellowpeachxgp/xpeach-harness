/** 真实临时根的原始路径、物理路径及相邻前缀均采用合成账号数据。 */
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
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
    if (process.platform !== 'win32') {
      expect(isTemporaryCredentialDirectory('/tmp/xph-isolated-sandbox')).toBe(true)
      expect(isTemporaryCredentialDirectory('/tmp-other/xph-isolated-sandbox')).toBe(false)
    }
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

  it('自定义非临时 XPH_HOME 严格隔离于 ~/.xph，且同 rootHome 内兄弟 profile 仍可共享', () => {
    const fakeUserHome = resolve('/var/opt/xph-fake-user-home')
    const customNonTmpHome = resolve('/var/opt/xph-custom-tenant-a')
    expect(isTemporaryCredentialDirectory(customNonTmpHome)).toBe(false)
    expect(isTemporaryCredentialDirectory(fakeUserHome)).toBe(false)

    vi.stubEnv('HOME', fakeUserHome)
    vi.stubEnv('USERPROFILE', fakeUserHome)
    vi.stubEnv('XPH_HOME', customNonTmpHome)
    vi.stubEnv('DSH_HOME', customNonTmpHome)

    const customProfile = join(customNonTmpHome, 'profiles', 'xpeach')
    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(account, { keyFile: join(customProfile, 'xpeach.key'), liveConfig: {} })

    const mirrors = (Reflect.get(XPeachAccount.prototype, 'sharedMirrorDirs') as () => string[]).call(account)
    expect(mirrors).toEqual([
      customNonTmpHome,
      join(customNonTmpHome, 'profiles', 'xpeach-desktop'),
    ])
    expect(mirrors.some(dir => resolve(dir).startsWith(resolve(join(fakeUserHome, '.xph'))))).toBe(false)

    const state = (Reflect.get(XPeachAccount.prototype, 'getRelayState') as () => object).call(account)
    const options = Reflect.get(state, 'options') as { filename: string; projectionDirs: string[] }
    expect(options.filename).toBe(join(customNonTmpHome, 'xpeach.relay.json'))
    expect(options.projectionDirs.every(dir => resolve(dir).startsWith(customNonTmpHome))).toBe(true)

    const isDefault = Reflect.get(XPeachAccount.prototype, 'isDefaultXphHome') as (dir: string) => boolean
    expect(isDefault.call(account, customNonTmpHome)).toBe(false)
    expect(isDefault.call(account, join(fakeUserHome, '.xph'))).toBe(true)
  })

  it('unbindSessionOp 同步清理所有镜像目录中的 xpeach.session，重启不会通过 adoptSharedCredentials 复活', () => {
    const root = mkdtempSync(join(tmpdir(), 'xph-session-unbind-'))
    roots.push(root)
    vi.stubEnv('XPH_HOME', root)
    vi.stubEnv('DSH_HOME', root)

    const cliProfile = join(root, 'profiles', 'xpeach')
    const desktopProfile = join(root, 'profiles', 'xpeach-desktop')
    mkdirSync(cliProfile, { recursive: true })
    mkdirSync(desktopProfile, { recursive: true })

    const sessionCookie = 'sess_cookie_should_not_resurrect'
    for (const dir of [root, cliProfile, desktopProfile]) {
      writeFileSync(join(dir, 'xpeach.session'), sessionCookie + '\n', { mode: 0o600 })
    }
    vi.stubEnv('XPEACH_TEST_UNBIND_SESSION', sessionCookie)

    const setSessionKey = vi.fn()
    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(account, {
      keyFile: join(cliProfile, 'xpeach.key'),
      adminKeyFile: join(cliProfile, 'xpeach.admin'),
      sessionKeyFile: join(cliProfile, 'xpeach.session'),
      sessionKeyVar: 'XPEACH_TEST_UNBIND_SESSION',
      ssoStateFile: join(cliProfile, 'xpeach.sso.json'),
      routeFile: join(cliProfile, 'xpeach.route.json'),
      liveConfig: {},
      api: { setSessionKey },
    })

    expect(account.unbindSessionOp()).toEqual({ bound: false })
    expect(existsSync(join(cliProfile, 'xpeach.session'))).toBe(false)
    expect(existsSync(join(root, 'xpeach.session'))).toBe(false)
    expect(existsSync(join(desktopProfile, 'xpeach.session'))).toBe(false)
    expect(process.env.XPEACH_TEST_UNBIND_SESSION).toBeUndefined()
    expect(setSessionKey).toHaveBeenCalledWith(undefined)

    // Simulate cold start adoptSharedCredentials(): session must stay unbound
    const adopt = Reflect.get(XPeachAccount.prototype, 'adoptSharedCredentials') as () => void
    adopt.call(account)
    expect(existsSync(join(cliProfile, 'xpeach.session'))).toBe(false)
  })

  it('writeState 使用 0o700 父目录、即使内容不变也收紧 0o600 权限，且不跟随目标符号链接', () => {
    const root = mkdtempSync(join(tmpdir(), 'xph-write-state-hardening-'))
    roots.push(root)
    const writer = Reflect.get(XPeachAccount.prototype, 'writeState') as (path: string, body: string) => void

    const nestedDir = join(root, 'nested-profile')
    const targetFile = join(nestedDir, 'xpeach.sso.json')
    writer.call({}, targetFile, '{"token":"same"}\n')

    if (process.platform !== 'win32') {
      expect(statSync(nestedDir).mode & 0o777).toBe(0o700)
      expect(statSync(targetFile).mode & 0o777).toBe(0o600)

      // Loosen permissions externally, then re-write identical body -> must re-tighten to 0o600
      chmodSync(targetFile, 0o644)
      expect(statSync(targetFile).mode & 0o777).toBe(0o644)
      writer.call({}, targetFile, '{"token":"same"}\n')
      expect(statSync(targetFile).mode & 0o777).toBe(0o600)

      // Symlink replacement: target outside must NOT be modified
      const outside = join(root, 'outside.txt')
      writeFileSync(outside, 'untouched\n', { mode: 0o644 })
      const linkTarget = join(nestedDir, 'xpeach.admin')
      symlinkSync(outside, linkTarget)
      writer.call({}, linkTarget, 'untouched\n')
      expect(lstatSync(linkTarget).isSymbolicLink()).toBe(false)
      expect(statSync(linkTarget).mode & 0o777).toBe(0o600)
      expect(readFileSync(outside, 'utf8')).toBe('untouched\n')
    }
  })
})
