/** 桌面资源复制与首次播种使用 CLI 的同一份产品补丁。 */
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load, DEFAULT_SCHEMA, Type } from 'js-yaml'
import { afterEach, expect, it } from 'vitest'
import { createElectronBuilderConfig } from '../scripts/electron-builder-config.mjs'
import { seedProductProfilePatch } from '../src/project-manager.ts'

const roots: string[] = []
const source = new URL('../../cli/resources/xpeach.profile.yml', import.meta.url)
const schema = DEFAULT_SCHEMA.extend([new Type('tag:yaml.org,2002:js', { kind: 'scalar', construct: (value: string) => value })])
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function profileFixture(content?: string) {
  const profile = mkdtempSync(join(tmpdir(), 'desktop-profile-seed-'))
  roots.push(profile)
  const target = join(profile, 'cordis.patch.yml')
  if (content !== undefined) writeFileSync(target, content)
  return { profile, target }
}

it.each([undefined, '', '  \r\n', '# 尚未配置\n', '[]\n', '[ # 空数组\n]\n', '---\n# 空文档\n...\n'])('只为缺失、空数组或空文档播种：%j', (empty) => {
  const f = profileFixture(empty)
  seedProductProfilePatch(f.profile, fileURLToPath(source))
  expect(readFileSync(f.target)).toEqual(readFileSync(source))
})

it.each([
  '- id: locale\n  config:\n    preference: en\n',
  '[{id: locale, config: {preference: en}}]\n',
  '- id: locale\n  config:\n    preference: !!js (() => { throw new Error("不得求值") })()\n',
])('非空补丁保留原字节且不求值表达式：%j', (content) => {
  const f = profileFixture(content)
  seedProductProfilePatch(f.profile, fileURLToPath(source))
  expect(readFileSync(f.target, 'utf8')).toBe(content)
})

it.each(['[{id: locale}\n', 'id: locale\n', '[42]\n', '!!js\n', '[]\n---\n[]\n'])('无效补丁明确失败且保留原文件：%j', (invalid) => {
  const f = profileFixture(invalid)
  expect(() => { seedProductProfilePatch(f.profile, fileURLToPath(source)) }).toThrow()
  expect(readFileSync(f.target, 'utf8')).toBe(invalid)
})

it.each(['darwin', 'win32'] as const)('%s 打包投影和 profile 播种保留 CLI 资源字节与模型配置', (platform) => {
  const config = createElectronBuilderConfig({
    DSH_DESKTOP_APP_ID: 'codes.example.profile-resource',
    DSH_DESKTOP_UNSIGNED: '1',
  }, platform, 'x64')
  const resources = config.extraResources.filter(resource => resource.to === 'xpeach.profile.yml')
  expect(resources).toHaveLength(1)
  const shipped = resources[0]!
  expect(realpathSync(shipped.from)).toBe(realpathSync(source))

  const root = mkdtempSync(join(tmpdir(), 'desktop-profile-resource-'))
  roots.push(root)
  const packaged = join(root, 'resources', shipped.to)
  mkdirSync(join(root, 'resources'))
  copyFileSync(shipped.from, packaged)
  const profile = join(root, 'home', 'profiles', 'xpeach-desktop')
  mkdirSync(profile, { recursive: true })
  writeFileSync(join(profile, 'cordis.patch.yml'), '[]\n')
  seedProductProfilePatch(profile, packaged)

  const actual = readFileSync(join(profile, 'cordis.patch.yml'))
  expect(actual).toEqual(readFileSync(source))
  const parsed = load(actual.toString(), { schema })
  expect(parsed).toEqual(load(readFileSync(source, 'utf8'), { schema }))
  expect(actual.toString()).toContain('maxTokens: 32768')

  const custom = '- id: locale\n  config:\n    preference: en\n'
  writeFileSync(join(profile, 'cordis.patch.yml'), custom)
  seedProductProfilePatch(profile, packaged)
  expect(readFileSync(join(profile, 'cordis.patch.yml'), 'utf8')).toBe(custom)
})
