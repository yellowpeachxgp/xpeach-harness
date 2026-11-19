/** 隔离源码和安装目录，验证资源播种不依赖桌面源码或环境凭据。 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { load, DEFAULT_SCHEMA, Type } from 'js-yaml'
import { afterEach, expect, it } from 'vitest'

const roots: string[] = []
const resource = new URL('../resources/xpeach.profile.yml', import.meta.url)
const schema = DEFAULT_SCHEMA.extend([new Type('tag:yaml.org,2002:js', { kind: 'scalar', construct: (value: string) => value })])
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function installedFixture(mode: 'src' | 'lib', shipResource = true) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'xph-resource-')))
  roots.push(root)
  const pkg = mode === 'src' ? join(root, 'apps', 'cli') : join(root, 'node_modules', '@xpeach', 'xph-dsh')
  const entry = join(pkg, mode, mode === 'src' ? 'xph.ts' : 'xph.js')
  const appBoot = join(pkg, 'node_modules', '@xpeach', 'xph-app-boot')
  mkdirSync(dirname(entry), { recursive: true })
  mkdirSync(appBoot, { recursive: true })
  symlinkSync(realpathSync(new URL('../node_modules/js-yaml', import.meta.url)), join(pkg, 'node_modules', 'js-yaml'), 'junction')
  writeFileSync(join(pkg, 'package.json'), JSON.stringify({ type: 'module' }))
  const source = readFileSync(new URL('../src/xph.ts', import.meta.url), 'utf8')
  // 仅擦除类型以隔离验证 lib 目录定位；不生成共享构建产物，也不声称覆盖真实打包。
  writeFileSync(entry, mode === 'src' ? source : stripTypeScriptTypes(source))
  // 此进程只测播种；真实 app-boot 初始化由 xph.spec.ts 的源码测试覆盖。
  writeFileSync(join(appBoot, 'package.json'), JSON.stringify({ type: 'module', exports: './index.js' }))
  writeFileSync(join(appBoot, 'index.js'), `
    import { existsSync, readFileSync } from 'node:fs';
    export const PROFILE_TEMPLATES = { xpeach: { bundles: [] } };
    export function initProfile() {}
    export function loadOptionalPatches(_name, file) {
      return existsSync(file) && readFileSync(file, 'utf8').trim() !== '[]' ? [{}] : [];
    }
  `)
  const shipped = join(pkg, 'resources', 'xpeach.profile.yml')
  if (shipResource) {
    mkdirSync(dirname(shipped), { recursive: true })
    copyFileSync(resource, shipped)
  }
  const home = join(root, 'home')
  const patch = join(home, 'profiles', 'xpeach', 'cordis.patch.yml')
  function seed() {
    const driver = `
      import { ensureXpeachProfile } from ${JSON.stringify(pathToFileURL(entry).href)};
      try { await ensureXpeachProfile(${JSON.stringify(home)}); }
      catch (error) {
        process.stderr.write(JSON.stringify({ code: error.code, path: error.path, message: error.message }));
        process.exitCode = 1;
      }
    `
    return spawnSync(process.execPath, ['--input-type=module', '--eval', driver], {
      cwd: root,
      env: { XPH_HOME: home, DSH_HOME: home, XPEACH_RELAY_KEY: 'fixture-no-credential', NODE_NO_WARNINGS: '1' },
      encoding: 'utf8',
      timeout: 10_000,
    })
  }
  return { root, patch, shipped, seed }
}

it.each(['src', 'lib'] as const)('%s 布局从 CLI 包资源播种，无需桌面目录', async (mode) => {
  const fixture = installedFixture(mode)
  const result = fixture.seed()
  expect(result.error).toBeUndefined()
  expect(result.status, result.stderr).toBe(0)
  expect(existsSync(join(fixture.root, 'apps', 'desktop'))).toBe(false)
  const actual = readFileSync(fixture.patch)
  expect(actual).toEqual(readFileSync(resource))
  await expect(JSON.stringify(load(actual.toString(), { schema }), null, 2) + '\n')
    .toMatchFileSnapshot('./expected/xpeach-profile.json')
})

it.each(['src', 'lib'] as const)('%s 布局资源缺失会停止播种并保留空补丁', (mode) => {
  const fixture = installedFixture(mode, false)
  mkdirSync(dirname(fixture.patch), { recursive: true })
  writeFileSync(fixture.patch, '[]\n')
  const result = fixture.seed()
  expect(result.error).toBeUndefined()
  expect(result.status).toBe(1)
  expect(JSON.parse(result.stderr)).toMatchObject({ code: 'XPH_PROFILE_RESOURCE_UNAVAILABLE', path: fixture.shipped })
  expect(readFileSync(fixture.patch, 'utf8')).toBe('[]\n')
})

it('已有用户补丁时不读取或重写缺失的种子资源', () => {
  const fixture = installedFixture('lib', false)
  mkdirSync(dirname(fixture.patch), { recursive: true })
  const patch = '- id: locale\n  config:\n    preference: en\n'
  writeFileSync(fixture.patch, patch)
  const result = fixture.seed()
  expect(result.status, result.stderr).toBe(0)
  expect(readFileSync(fixture.patch, 'utf8')).toBe(patch)
})

it('CLI 发布文件包含唯一规范资源', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { files: string[] }
  expect(manifest.files).toContain('resources/xpeach.profile.yml')
})

it('产品 PI provider 的加载依赖账号服务就绪', () => {
  const parsed: unknown = load(readFileSync(resource, 'utf8'), { schema })
  expect(parsed).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'llm-pi-ai', inject: ['xpeachAccount'] }),
  ]))
})
