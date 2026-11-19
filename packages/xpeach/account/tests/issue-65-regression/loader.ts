/** 经真实 Loader、Settings 和 pi-ai 加载账号，假凭据仅使用私有临时目录与内存。 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { onTestFinished, vi } from 'vitest'
import { initProfile, mountRootInclude, readProfilePatches, type ProfileContext } from '@xpeach/xph-app-boot'
import { Context } from '@xpeach/xph-cordis'
import Loader from '@xpeach/xph-cordis-plugin-loader'
import ConfigEditor from '@xpeach/xph-config-editor'
import Settings from '@xpeach/xph-settings'
import Llm from '@xpeach/xph-llm'
import * as PiAi from '@xpeach/xph-llm-pi-ai'
import Typert from '@xpeach/xph-typert-registry'
import { MemoryCredentials } from '../../../../credentials/credentials/tests/memory.ts'
import { XPeachAccount, type Config } from '../../src/index.ts'
import { RelayState, type RelayTokenInfo } from '../../src/relay-state.ts'
import { createSite, siteFetch } from './site.ts'

/**
 * 启动真实账号组合，并在启动完成后提交初始假凭据，避免启动同步抢占断言。
 * @param config - 本次测试显式选择的身份查找预算。
 * @returns 已加载的产品服务、独立站点桩及权威状态访问器。
 */
async function loadFixture(
  config: Pick<Config, 'tokenPageLimit' | 'tokenPageSize' | 'tokenRevealLimit'>,
  startupFailure?: 'authority-damaged' | 'projection-failure',
) {
  const home = mkdtempSync(join(tmpdir(), 'xph-issue65-'))
  onTestFinished(() => { rmSync(home, { recursive: true, force: true }) })
  for (const key of ['HOME', 'USERPROFILE', 'XPH_HOME', 'DSH_HOME']) vi.stubEnv(key, home)
  for (const key of ['RELAY', 'API', 'ADMIN', 'SESSION'].map(suffix => ['ISSUE65', suffix].join('_'))) vi.stubEnv(key, '')
  const site = createSite()
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => siteFetch(site, input, init))
  const dir = join(home, 'profiles', 'test')
  initProfile(dir, ['issue65-test-bundle'])
  const bundle = join(dir, 'node_modules', 'issue65-test-bundle')
  mkdirSync(bundle, { recursive: true })
  writeFileSync(join(home, 'package.json'), '{"name":"issue65-test-installation"}\n')
  writeFileSync(join(bundle, 'package.json'), JSON.stringify({ name: 'issue65-test-bundle', version: '1.0.0', dsh: { bundle: { patch: 'cordis.patch.yml' } } }))
  const rows = JSON.parse(readFileSync(fileURLToPath(new URL('./cordis.yml', import.meta.url)), 'utf8')) as { id: string; config?: Record<string, unknown> }[]
  const accountRow = rows.find(row => row.id === 'xpeach-account')
  if (accountRow === undefined) throw new Error('账号组合缺少账号配置')
  accountRow.config = {
    ...accountRow.config,
    ...config,
    keyVar: ['ISSUE65', 'RELAY'].join('_'), apiKeyEnv: ['ISSUE65', 'API'].join('_'),
    adminKeyVar: ['ISSUE65', 'ADMIN'].join('_'), sessionKeyVar: ['ISSUE65', 'SESSION'].join('_'),
    keyFile: join(dir, 'xpeach.key'), adminKeyFile: join(dir, 'xpeach.admin'),
    sessionKeyFile: join(dir, 'xpeach.session'), ssoStateFile: join(dir, 'xpeach.sso.json'),
  }
  writeFileSync(join(bundle, 'cordis.patch.yml'), JSON.stringify([{ insert: rows }]))
  writeFileSync(join(dir, 'cordis.yml'), '[]\n')
  const profile: ProfileContext = {
    name: 'test', dir, home, cwd: home, startedBundles: ['issue65-test-bundle'],
    patchPath: join(dir, 'cordis.patch.yml'), installAnchor: join(home, 'package.json'), overlays: [], telemetryDisabledEnv: '1',
  }
  if (startupFailure !== undefined) {
    writeFileSync(join(home, 'xpeach.relay.json'), startupFailure === 'authority-damaged' ? '{' : JSON.stringify({
      version: 1, revision: 1, key: ['sk', 'issue65', 'active'].join('-'), projectionPending: true,
    }), { mode: 0o600 })
    if (startupFailure === 'projection-failure') mkdirSync(join(dir, 'xpeach.token'))
  }
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose() })
  ctx.baseUrl = pathToFileURL(dir).href + '/'
  await ctx.plugin(Loader)
  ctx.provide('profileContext', profile)
  ctx.provide('appReady', { onReady: (listener: () => void) => { listener(); return () => {} } })
  Object.assign(ctx.loader.builtins, {
    editor: ConfigEditor, settings: Settings, credentials: MemoryCredentials,
    llm: Llm, pi: PiAi, typert: Typert, account: XPeachAccount,
  })
  await mountRootInclude(ctx, join(dir, 'cordis.yml'), readProfilePatches('issue65-test', profile))
  await ctx.loader.await()
  return { ctx, site, home, dir }
}

/**
 * 加载账号启动失败的真实组合，保留其他服务以观察 provider 依赖的隔离效果。
 * @param failure - 损坏权威文件或制造兼容投影修复失败。
 * @returns 已完成 Loader 结算的服务树与外部 HTTP 观测。
 */
export async function loadUnreadyAccount(failure: 'authority-damaged' | 'projection-failure') {
  return await loadFixture({}, failure)
}

/**
 * 启动真实账号组合，并在启动完成后提交初始假凭据。
 * @param config - 本次测试显式选择的身份查找预算。
 * @returns 已加载的产品服务、独立站点桩及权威状态访问器。
 */
export async function loadAccount(config: Pick<Config, 'tokenPageLimit' | 'tokenPageSize' | 'tokenRevealLimit'> = {}) {
  const { ctx, site, home, dir } = await loadFixture(config)
  const account = ctx.get('xpeachAccount') as XPeachAccount | undefined
  if (account === undefined) throw new Error('真实 Loader 未挂载账号服务')
  if (Reflect.get(account, 'baseURL') !== 'https://issue65.invalid') {
    throw new Error(`测试配置未生效：${String(Reflect.get(account, 'baseURL'))}`)
  }
  const api = Reflect.get(account, 'api') as { siteBaseURL: string }
  if (api.siteBaseURL !== 'https://issue65.invalid') {
    throw new Error(`测试请求初始路由不一致：${api.siteBaseURL}；活动路由 ${String(Reflect.get(account, 'activeBaseURL'))}`)
  }
  const keyFile = join(dir, 'xpeach.key')
  const tokenFile = join(dir, 'xpeach.token')
  writeFileSync(join(dir, 'xpeach.admin'), 'issue65-fake-admin\n', { mode: 0o600 })
  const state = new RelayState({
    filename: join(home, 'xpeach.relay.json'), legacyKeyFile: keyFile, legacyTokenFile: tokenFile,
    projectionDirs: [home], lockWaitMs: 1000,
  })
  await state.commit(state.read(), { key: ['sk', 'issue65', 'active'].join('-') })
  const seedToken = async (value: RelayTokenInfo): Promise<void> => {
    const snapshot = state.read()
    if (snapshot.key === undefined) throw new Error('测试身份缺少已绑定的密钥')
    await state.commit(snapshot, { key: snapshot.key, token: value })
  }
  return { ctx, account, site, home, dir, keyFile, tokenFile, seedToken, state }
}
