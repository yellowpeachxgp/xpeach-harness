/** 安装版命令仅从其 CLI 包资源播种，失败时不派发命令。 */
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { runCli } from '@xpeach/xph-dsh/lib/bin.js'
import { runDesktopCli } from '../src/cli.ts'

vi.mock('@xpeach/xph-dsh/lib/bin.js', () => ({ runCli: vi.fn() }))
vi.mock('../src/office-engine.ts', () => ({ installOfficeEngineResolution: vi.fn() }))
const roots: string[] = []
const argv = [...process.argv]
afterEach(() => {
  process.argv = [...argv]
  vi.unstubAllEnvs()
  vi.clearAllMocks()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture(shipResource = true) {
  const root = mkdtempSync(join(tmpdir(), 'desktop-cli-profile-'))
  roots.push(root)
  const home = join(root, 'home')
  const runtime = join(root, 'app.asar', 'dsh')
  const resource = join(runtime, 'node_modules', '@xpeach', 'xph-dsh', 'resources', 'xpeach.profile.yml')
  if (shipResource) {
    mkdirSync(dirname(resource), { recursive: true })
    copyFileSync(new URL('../../cli/resources/xpeach.profile.yml', import.meta.url), resource)
  }
  vi.stubEnv('XPH_HOME', home)
  vi.stubEnv('DSH_HOME', home)
  vi.stubEnv('XPH_PRODUCT', '1')
  vi.stubEnv('XPEACH_RELAY_KEY', 'fixture-key')
  process.argv = [process.execPath, 'xph', '--version']
  return { root, runtime, resource, patch: join(home, 'profiles', 'xpeach', 'cordis.patch.yml') }
}

it.each([undefined, '', '# 尚未配置\n', '[]\n', '[ # 空数组\n]\n', '---\n# 空文档\n...\n'])('安装命令为首次或空补丁播种：%j', async (empty) => {
  const f = fixture()
  if (empty !== undefined) {
    mkdirSync(dirname(f.patch), { recursive: true })
    writeFileSync(f.patch, empty)
  }
  await runDesktopCli(f.runtime, join(f.root, 'runtime'))
  expect(readFileSync(f.patch)).toEqual(readFileSync(new URL('../../cli/resources/xpeach.profile.yml', import.meta.url)))
  expect(runCli).toHaveBeenCalledWith(expect.objectContaining({ manageDesktopProfile: true }))
})

it('资源缺失时保留空补丁并停止命令派发', async () => {
  const f = fixture(false)
  mkdirSync(dirname(f.patch), { recursive: true })
  writeFileSync(f.patch, '[]\n')
  await expect(runDesktopCli(f.runtime, join(f.root, 'runtime')))
    .rejects.toMatchObject({ code: 'XPH_PROFILE_RESOURCE_UNAVAILABLE', path: f.resource })
  expect(readFileSync(f.patch, 'utf8')).toBe('[]\n')
  expect(runCli).not.toHaveBeenCalled()
})

it.each([
  '- id: locale\n  config:\n    preference: en\n',
  '[{id: locale, config: {preference: en}}]\n',
  '- id: locale\n  config:\n    preference: !!js (() => { throw new Error("不得求值") })()\n',
])('资源缺失时保留已有非空用户补丁：%j', async (patch) => {
  const f = fixture(false)
  mkdirSync(dirname(f.patch), { recursive: true })
  writeFileSync(f.patch, patch)
  await runDesktopCli(f.runtime, join(f.root, 'runtime'))
  expect(readFileSync(f.patch, 'utf8')).toBe(patch)
  expect(runCli).toHaveBeenCalledOnce()
})

it.each(['[{id: locale}\n', 'id: locale\n', '[42]\n', '!!js\n', '[]\n---\n[]\n'])('无效补丁明确失败且不派发命令：%j', async (invalid) => {
  const f = fixture()
  mkdirSync(dirname(f.patch), { recursive: true })
  writeFileSync(f.patch, invalid)
  await expect(runDesktopCli(f.runtime, join(f.root, 'runtime'))).rejects.toThrow()
  expect(readFileSync(f.patch, 'utf8')).toBe(invalid)
  expect(runCli).not.toHaveBeenCalled()
})
