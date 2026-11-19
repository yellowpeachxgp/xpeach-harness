/** Relay 状态验收使用的合成凭据、隔离目录和磁盘观测。 */
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import type { RelaySnapshot, RelayStateOptions } from '../../../src/relay-state.ts'

/** 仅供临时目录测试使用的第一组身份。 */
export const identityA = { key: 'sk-relay-synthetic-a', token: { id: 11, name: '合成身份甲', key: 'sk-relay-synthetic-a', groups: ['合成组甲'] } }
/** 仅供临时目录测试使用的第二组身份。 */
export const identityB = { key: 'xpk-relay-synthetic-b', token: { id: 22, name: '合成身份乙', key: 'xpk-relay-synthetic-b', groups: ['合成组乙'] } }

/**
 * 生成不会引用真实用户目录的部署选项。
 * @param root - 用 mkdtemp 独占分配的测试根目录。
 * @returns 权威文件、独立旧目录和两个投影目录。
 */
export function optionsFor(root: string): RelayStateOptions {
  return {
    filename: join(root, 'authority', 'xpeach.relay.json'),
    legacyKeyFile: join(root, 'legacy', 'xpeach.key'),
    legacyTokenFile: join(root, 'legacy', 'xpeach.token'),
    projectionDirs: [join(root, 'profiles', 'first'), join(root, 'profiles', 'second')],
    lockWaitMs: 60_000,
  }
}

/**
 * 创建测试声明的所有投影目录。
 * @param options - 指向独占临时目录的部署选项。
 * @returns 目录均可用时完成。
 */
export async function prepareDirectories(options: RelayStateOptions): Promise<void> {
  await Promise.all([
    dirname(options.filename), dirname(options.legacyKeyFile), dirname(options.legacyTokenFile), ...options.projectionDirs,
  ].map(path => mkdir(path, { recursive: true, mode: 0o700 })))
}

/**
 * 列出测试期望的全部兼容文件。
 * @param options - 测试部署选项。
 * @returns 密钥文件和令牌文件的绝对路径。
 */
export function projectionFiles(options: RelayStateOptions): { keys: string[]; tokens: string[] } {
  const dirs = options.projectionDirs
  return {
    keys: [options.legacyKeyFile, ...dirs.map(dir => join(dir, 'xpeach.key'))],
    tokens: [options.legacyTokenFile, ...dirs.map(dir => join(dir, 'xpeach.token'))],
  }
}

/**
 * 读取整个临时目录中的实际文件内容，包括意外遗留的 lock/tmp。
 * @param root - 测试独占根目录。
 * @returns 按相对路径排序的文件字节文本。
 */
export async function allDiskFiles(root: string): Promise<Record<string, string>> {
  const files: [string, string][] = []
  async function visit(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await visit(path)
      else files.push([relative(root, path), await readFile(path, 'utf8')])
    }
  }
  await visit(root)
  return Object.fromEntries(files.sort(([left], [right]) => left.localeCompare(right)))
}

/**
 * 将权威和令牌文件解析为 JSON，密钥文件保留精确换行。
 * @param root - 测试独占根目录。
 * @returns 包含全部实际文件的可比较磁盘状态。
 */
export async function observedDisk(root: string): Promise<Record<string, unknown>> {
  const files = await allDiskFiles(root)
  return Object.fromEntries(Object.entries(files).map(([path, text]) => [
    path, path.endsWith('.json') || path.endsWith('.token') ? JSON.parse(text) : text,
  ]))
}

/**
 * 描述一次完整提交应留下的文件与内容，不忽略多余文件。
 * @param root - 测试独占根目录。
 * @param options - 测试部署选项。
 * @param snapshot - 应提交的完整权威状态。
 * @returns 完整磁盘期望值。
 */
export function expectedDisk(root: string, options: RelayStateOptions, snapshot: RelaySnapshot): Record<string, unknown> {
  const paths = projectionFiles(options)
  const expected: Record<string, unknown> = { [relative(root, options.filename)]: snapshot }
  for (const path of paths.keys) expected[relative(root, path)] = snapshot.key === undefined ? '' : `${snapshot.key}\n`
  for (const path of paths.tokens) expected[relative(root, path)] = snapshot.token ?? {}
  return expected
}
