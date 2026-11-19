/** 安装版 Node、真实 Remote 和 pkg 脚本只使用独占假用户目录；系统安装命令均为桩。 */
import childProcess, { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire, stripTypeScriptTypes, syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { XPeachAccount } from '../src/index.ts'
import { COVERAGE_TEST_TIMEOUT_ENV, coverageTestTimeoutOptions } from '../../../../scripts/coverage-partitions.ts'

const roots: string[] = []
const canonical = new URL('../../../../apps/cli/resources/xpeach.profile.yml', import.meta.url)
const processTimeoutMs = coverageTestTimeoutOptions(process.env[COVERAGE_TEST_TIMEOUT_ENV]).testTimeout ?? 15_000

function isolatedEnvironment(home: string): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH, HOME: home, USERPROFILE: home,
    XDG_CONFIG_HOME: home, XDG_CACHE_HOME: home, XDG_STATE_HOME: home, XDG_DATA_HOME: home,
    APPDATA: home, LOCALAPPDATA: home, DSH_AGENTS_HOME: home, NODE_NO_WARNINGS: '1',
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  syncBuiltinESMExports()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

interface LayoutOptions {
  patch?: string
  action?: 'build' | 'install-direct'
  resource?: 'present' | 'missing' | 'invalid' | 'empty'
  explicit?: boolean
  entry?: 'cli' | 'desktop-host'
}

interface LayoutResult {
  ok: boolean
  error?: { code: string; path?: string }
  calls: string[]
  patch?: string
  applicationCreated: boolean
  binCreated: boolean
  receiptCreated: boolean
}

function installedLayout(options: LayoutOptions = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'xph-installer-layout-')))
  roots.push(root)
  const home = join(root, 'home')
  const cli = join(root, 'node_modules', '@xpeach', 'xph-dsh')
  const account = join(root, 'node_modules', '@xpeach', 'xph-account')
  const entry = join(account, 'lib', 'macos-installer.mjs')
  const host = join(root, 'node_modules', '@xpeach', 'xph-desktop-host')
  const driver = options.entry === 'desktop-host' ? join(host, 'lib', 'cli.js') : join(cli, 'lib', 'xph.js')
  const resource = join(cli, 'resources', 'xpeach.profile.yml')
  mkdirSync(dirname(entry), { recursive: true })
  mkdirSync(dirname(driver), { recursive: true })
  mkdirSync(dirname(resource), { recursive: true })
  mkdirSync(home)
  // 保留真实包导出；入口脚本只驱动当前安装器，不启动产品或读取账号。
  writeFileSync(join(cli, 'package.json'), readFileSync(new URL('../../../../apps/cli/package.json', import.meta.url)))
  if (options.entry === 'desktop-host') {
    writeFileSync(join(host, 'package.json'), readFileSync(new URL('../../../../apps/desktop-host/package.json', import.meta.url)))
  }
  writeFileSync(entry, stripTypeScriptTypes(readFileSync(new URL('../src/macos-installer.ts', import.meta.url), 'utf8')))
  symlinkSync(dirname(createRequire(import.meta.url).resolve('js-yaml/package.json')), join(root, 'node_modules', 'js-yaml'), 'junction')
  if (options.resource !== 'missing') {
    writeFileSync(resource, options.resource === 'invalid' ? 'id: locale\n' : options.resource === 'empty' ? '[]\n' : readFileSync(canonical, 'utf8'))
  }
  const ownHome = join(home, '.xph')
  const patch = join(ownHome, 'profiles', 'xpeach', 'cordis.patch.yml')
  if (options.patch !== undefined) {
    mkdirSync(dirname(patch), { recursive: true })
    writeFileSync(patch, options.patch)
  }
  const pkg = join(root, 'installer.pkg')
  writeFileSync(pkg, 'fixture-pkg')
  const installerOptions = {
    homeDir: home, ownHome, applicationsDir: join(home, 'Applications'), localBinDir: join(home, 'bin'),
    outputPkgPath: pkg, version: '0.0.34-alpha', ...(options.explicit ? { productProfilePath: resource } : {}),
  }
  writeFileSync(driver, `
    import cp from 'node:child_process';
    import { syncBuiltinESMExports } from 'node:module';
    import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
    import { basename, dirname, join } from 'node:path';
    const root = ${JSON.stringify(root)};
    const calls = [];
    cp.execFileSync = (command, args, options) => {
      calls.push(command);
      if (command === '/usr/bin/pkgbuild') {
        const scripts = args[args.indexOf('--scripts') + 1];
        cpSync(scripts, join(root, 'scripts', basename(scripts)), { recursive: true });
        const payload = join(args[args.indexOf('--root') + 1], 'usr/local/share/xpeach-harness/profile/xpeach.profile.yml');
        if (existsSync(payload)) {
          const target = join(root, 'volume/usr/local/share/xpeach-harness/profile/xpeach.profile.yml');
          mkdirSync(dirname(target), { recursive: true });
          cpSync(payload, target);
        }
      }
      if (command === '/usr/bin/productbuild') writeFileSync(args.at(-1), 'fixture-pkg');
      return options?.encoding ? 'fixture-output' : Buffer.alloc(0);
    };
    syncBuiltinESMExports();
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const installer = await import(${JSON.stringify(pathToFileURL(entry).href)});
    let result;
    try {
      result = await installer.runMacosInstallerAction(${JSON.stringify(options.action ?? 'install-direct')}, ${JSON.stringify(installerOptions)});
    } catch (error) { result = { ok: false, error: { code: error.code, path: error.path } }; }
    const patch = ${JSON.stringify(patch)};
    process.stdout.write(JSON.stringify({ ok: result.ok, error: result.error, calls,
      patch: existsSync(patch) ? readFileSync(patch, 'utf8') : undefined,
      applicationCreated: existsSync(${JSON.stringify(installerOptions.applicationsDir)}),
      binCreated: existsSync(${JSON.stringify(installerOptions.localBinDir)}),
      receiptCreated: existsSync(${JSON.stringify(join(ownHome, 'xpeach.install-receipt.json'))}) }));
  `)
  // 工作目录故意包含另一个“仓库”；已安装 CLI 的标准包解析必须仍是唯一选中资源。
  const cwd = join(root, 'unrelated')
  mkdirSync(join(cwd, 'apps', 'desktop'), { recursive: true })
  writeFileSync(join(cwd, 'apps', 'desktop', 'package.json'), '{}')
  const result = JSON.parse(execFileSync(process.execPath, [driver], {
    cwd, env: isolatedEnvironment(home), encoding: 'utf8', timeout: processTimeoutMs,
  })) as LayoutResult
  return { root, home, ownHome, resource, patch, result }
}

describe('普通 Node 安装版资源与预检', () => {
  it.each(['cli', 'desktop-host'] as const)('从 %s 启动入口的公开 CLI 包导出定位 canonical，不依赖 Electron 或工作目录', (entry) => {
    const fixture = installedLayout({ entry })
    expect(fixture.result.ok).toBe(true)
    expect(fixture.result.patch).toBe(readFileSync(canonical, 'utf8'))
    expect(readFileSync(join(dirname(fixture.patch), 'cordis.yml'), 'utf8')).toBe('[]\n')
  })

  it.each(['missing', 'invalid', 'empty'] as const)('选中的安装版资源 %s 时拒绝安装且不猜其他目录', (resource) => {
    const fixture = installedLayout({ resource })
    expect(fixture.result).toMatchObject({
      ok: false, calls: [], applicationCreated: false, binCreated: false, receiptCreated: false,
      error: { code: resource === 'missing' ? 'XPH_PROFILE_RESOURCE_UNAVAILABLE' : 'XPH_PROFILE_RESOURCE_INVALID', path: fixture.resource },
    })
  })

  it.each(['', '# 尚未配置\n', '[]\n', '[ # 空数组\n]\n', '---\n# 空文档\n...\n'])('为空补丁 %j 播种', (patch) => {
    const fixture = installedLayout({ patch })
    expect(fixture.result.ok).toBe(true)
    expect(fixture.result.patch).toBe(readFileSync(canonical, 'utf8'))
  })

  it.each(['id: locale\n', '[42]\n', '[{id: locale}\n', '!!js\n', '[]\n---\n[]\n'])('错误补丁 %j 在所有安装副作用前失败', (patch) => {
    for (const action of ['build', 'install-direct'] as const) {
      const fixture = installedLayout({ patch, action })
      expect(fixture.result).toMatchObject({
        ok: false, error: { code: 'XPH_PROFILE_PATCH_INVALID', path: fixture.patch },
        calls: [], patch, applicationCreated: false, binCreated: false, receiptCreated: false,
      })
    }
  })

  it.each([
    '- id: locale\n  config: {preference: en}\n',
    '[{id: locale, config: {preference: en}}]\n',
    '- id: locale\n  config:\n    preference: !!js (() => { throw new Error("不得求值") })()\n',
  ])('已有合法自定义补丁 %j 原字节保留，即使种子资源缺失', (patch) => {
    const fixture = installedLayout({ patch, resource: 'missing' })
    expect(fixture.result.ok).toBe(true)
    expect(fixture.result.patch).toBe(patch)
  })
})

describe('账号真实 Remote 的安装前拒绝', () => {
  it('真实 macosInstallerActionOp 拒绝错误现有补丁，未调用系统命令', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'xph-installer-remote-')))
    roots.push(root)
    for (const [key, value] of Object.entries(isolatedEnvironment(root))) if (value !== undefined) vi.stubEnv(key, value)
    vi.stubEnv('XPH_HOME', root)
    vi.stubEnv('DSH_HOME', root)
    const patch = join(root, 'profiles', 'xpeach', 'cordis.patch.yml')
    mkdirSync(dirname(patch), { recursive: true })
    writeFileSync(patch, 'id: locale\n')
    const commands = vi.spyOn(childProcess, 'execFileSync').mockImplementation(() => { throw new Error('不得执行系统安装命令') })
    syncBuiltinESMExports()
    vi.stubGlobal('process', { ...process, platform: 'darwin' })
    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    await expect(account.macosInstallerActionOp({ action: 'install-direct' }, new AbortController().signal))
      .rejects.toMatchObject({ code: 'XPH_PROFILE_PATCH_INVALID', path: patch })
    expect(commands).not.toHaveBeenCalled()
    expect(readFileSync(patch, 'utf8')).toBe('id: locale\n')
    vi.unstubAllGlobals()
  })
})

describe.skipIf(process.platform !== 'darwin')('pkg 生成的实际脚本', () => {
  it('三个组件的 preinstall 都拒绝错误补丁；profile postinstall 区分空和自定义', () => {
    const fixture = installedLayout({ action: 'build' })
    expect(fixture.result.ok).toBe(true)
    const scripts = join(fixture.root, 'scripts')
    const run = (component: string, phase: string) => spawnSync('/bin/sh', [join(scripts, component, phase), 'fixture.pkg', '/', join(fixture.root, 'volume')], {
      cwd: fixture.root, env: isolatedEnvironment(fixture.home), encoding: 'utf8', timeout: processTimeoutMs,
    })
    mkdirSync(dirname(fixture.patch), { recursive: true })
    writeFileSync(fixture.patch, 'id: locale\n')
    for (const component of ['scripts-app', 'scripts-cli', 'scripts-profile']) {
      const result = run(component, 'preinstall')
      expect(result.status, result.stderr).not.toBe(0)
      expect(result.stderr).toContain('XPH_PROFILE_PATCH_INVALID')
    }
    const rejected = run('scripts-profile', 'postinstall')
    expect(rejected.status).not.toBe(0)
    expect(readFileSync(fixture.patch, 'utf8')).toBe('id: locale\n')
    expect(existsSync(join(fixture.home, 'Applications'))).toBe(false)
    expect(existsSync(join(fixture.home, '.local'))).toBe(false)
    expect(existsSync(join(fixture.ownHome, 'xpeach.install-receipt.json'))).toBe(false)

    for (const patch of ['', '# 注释\n', '[]\n', '---\n...\n']) {
      writeFileSync(fixture.patch, patch)
      const result = run('scripts-profile', 'postinstall')
      expect(result.status, result.stderr).toBe(0)
      expect(readFileSync(fixture.patch, 'utf8')).toBe(readFileSync(canonical, 'utf8'))
    }
    const custom = '- id: locale\n  config:\n    preference: !!js (() => { throw new Error("不得求值") })()\n'
    writeFileSync(fixture.patch, custom)
    const preserved = run('scripts-profile', 'postinstall')
    expect(preserved.status, preserved.stderr).toBe(0)
    expect(readFileSync(fixture.patch, 'utf8')).toBe(custom)
  }, 60_000)
})
