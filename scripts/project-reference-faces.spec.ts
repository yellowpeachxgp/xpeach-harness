import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { collectProjectReferenceFaceViolations } from './project-reference-faces.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function sharedProjectFixture(options: {
  readonly compilerOptions?: Readonly<Record<string, unknown>>
  readonly files?: readonly string[]
  readonly include?: readonly string[]
  readonly source?: string
  readonly references?: readonly string[]
} = {}): { readonly root: string; readonly split: string } {
  const root = workspaceFixture({
    host: ['./packages/api/split/tsconfig.host.json'],
    client: ['./packages/api/split/tsconfig.client.json'],
  })
  const split = join(root, 'packages/api/split')
  mkdirSync(join(split, 'src'), { recursive: true })
  writeFileSync(join(split, 'src/types.ts'), options.source ?? 'export interface SharedDto { readonly value: string }\n')
  writeJson(join(split, 'tsconfig.shared.json'), {
    extends: '../../../tsconfig.base.json',
    compilerOptions: {
      composite: true,
      emitDeclarationOnly: true,
      rootDir: 'src',
      outDir: 'lib/types',
      ...options.compilerOptions,
    },
    files: options.files ?? ['src/types.ts'],
    ...options.include === undefined ? {} : { include: options.include },
    references: (options.references ?? []).map(path => ({ path })),
  })
  for (const face of ['host', 'client']) {
    writeJson(join(split, `tsconfig.${face}.json`), { references: [{ path: './tsconfig.shared.json' }] })
  }
  return { root, split }
}

describe('纯类型 shared Project Reference', () => {
  it('允许 Host、Client 及外包 Client 直接引用同一个合法 shared', () => {
    const { root, split } = sharedProjectFixture({
      source: [
        "import type DefaultDto, { Peer } from './peer.js'",
        "import type * as Types from './peer.js'",
        "import { type Peer as NamedPeer } from './peer.js'",
        'export interface SharedDto { readonly value: Peer; readonly other: DefaultDto }',
        'export type Alias = Types.Peer',
        'export type { Peer }',
        'export { type NamedPeer }',
        "export type * from './peer.js'",
        "export type * as Schema from './peer.js'",
        'export {}',
        '',
      ].join('\n'),
      include: ['src/peer.ts'],
    })
    writeFileSync(join(split, 'src/peer.ts'), 'export interface Peer { readonly id: string }\nexport default interface DefaultDto { readonly name: string }\n')
    const consumer = join(root, 'packages/core/client-consumer')
    mkdirSync(consumer, { recursive: true })
    writeJson(join(consumer, 'package.json'), { name: '@xpeach/xph-client-consumer' })
    writeJson(join(consumer, 'tsconfig.json'), {
      extends: '../../../tsconfig.base.client.json',
      references: [{ path: '../../api/split/tsconfig.shared.json' }],
    })
    writeJson(join(root, 'tsconfig.client.json'), {
      references: [{ path: './packages/api/split/tsconfig.client.json' }, { path: './packages/core/client-consumer' }],
    })
    expect(collectProjectReferenceFaceViolations(root)).toEqual([])
  })

  it.each([
    ['emitDeclarationOnly', undefined, '共享项目必须设置 emitDeclarationOnly: true'],
    ['emitDeclarationOnly', false, '共享项目必须设置 emitDeclarationOnly: true'],
    ['composite', undefined, '共享项目必须设置 composite: true'],
    ['composite', false, '共享项目必须设置 composite: true'],
    ['rootDir', undefined, '共享项目必须显式设置 rootDir'],
    ['outDir', undefined, '共享项目必须显式设置 outDir'],
    ['noEmit', true, '共享项目不得设置 noEmit: true，必须生成声明'],
  ] as const)('拒绝不满足声明输出要求的 %s=%s', (option, value, message) => {
    const { root } = sharedProjectFixture({ compilerOptions: { [option]: value } })
    expect(collectProjectReferenceFaceViolations(root))
      .toEqual([`packages/api/split/tsconfig.shared.json: ${message}`])
  })

  it.each([
    ['outDir', 'src'],
    ['outDir', 'src/generated'],
    ['declarationDir', 'src/declarations'],
    ['tsBuildInfoFile', 'src/shared.tsbuildinfo'],
    ['outFile', 'src/shared.js'],
  ] as const)('拒绝 %s 将产物写入 %s', (option, value) => {
    const { root } = sharedProjectFixture({ compilerOptions: { [option]: value } })
    expect(collectProjectReferenceFaceViolations(root)).toContain(
      `packages/api/split/tsconfig.shared.json: 共享项目 ${option} 不得指向本包 src："packages/api/split/${value}"`,
    )
  })

  it('允许 src 同名前缀目录及显式 lib 声明和缓存目录', () => {
    const { root } = sharedProjectFixture({ compilerOptions: {
      outDir: 'src-output', declarationDir: 'lib/declarations', tsBuildInfoFile: 'lib/shared.tsbuildinfo',
    } })
    expect(collectProjectReferenceFaceViolations(root)).toEqual([])
  })

  it('拒绝空文件清单', () => {
    const { root } = sharedProjectFixture({ files: [] })
    expect(collectProjectReferenceFaceViolations(root)).toContain(
      'packages/api/split/tsconfig.shared.json: 共享项目必须至少包含一个纯类型源文件',
    )
  })

  it.each(['types.ts', '../outside.ts', 'src-sibling/types.ts'])('拒绝 src 以外的输入 %s', (file) => {
    const { root, split } = sharedProjectFixture({ files: [file] })
    mkdirSync(join(split, 'src-sibling'), { recursive: true })
    writeFileSync(join(split, file), 'export interface OutsideDto {}\n')
    expect(collectProjectReferenceFaceViolations(root)).toContain(
      `packages/api/split/tsconfig.shared.json: 共享项目输入文件必须位于本包 src 内：${JSON.stringify(file === '../outside.ts' ? 'packages/api/outside.ts' : `packages/api/split/${file}`)}`,
    )
  })

  it('拒绝 rootDir 未包含实际输入文件', () => {
    const { root } = sharedProjectFixture({ compilerOptions: { rootDir: 'src/nested' } })
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'packages/api/split/tsconfig.shared.json: 共享项目 rootDir 必须包含输入文件："packages/api/split/src/types.ts"',
    ])
  })

  it.each([
    'export function run() {}',
    'export const value = 1',
    'export class Runtime {}',
    'export enum Runtime { Value }',
    'declare function run(): void',
    'declare const value: string',
    'declare class Runtime {}',
    'declare namespace Runtime {}',
    "import './effects.js'",
    "import {} from './effects.js'",
    "import { Value } from './values.js'",
    "import { type Dto, Value } from './values.js'",
    "import Value from './values.js'",
    "import * as Values from './values.js'",
    "export * from './values.js'",
    "export { Value } from './values.js'",
    "export {} from './effects.js'",
    'export default {}',
    'globalThis.effect()',
  ])('拒绝运行时或非纯类型顶层语句：%s', (source) => {
    const { root } = sharedProjectFixture({ source: `${source}\n` })
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'packages/api/split/src/types.ts:1:1: 共享项目仅允许 interface、type alias、type-only import/export 或无来源的 export {}；禁止运行时声明和副作用',
    ])
  })

  it('检查 include 展开后的每个输入文件，不能只验证 files 中的 DTO', () => {
    const { root, split } = sharedProjectFixture({ include: ['src/**/*.ts'] })
    writeFileSync(join(split, 'src/runtime.ts'), 'export const runtime = true\n')
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'packages/api/split/src/runtime.ts:1:1: 共享项目仅允许 interface、type alias、type-only import/export 或无来源的 export {}；禁止运行时声明和副作用',
    ])
  })

  it.each(['./tsconfig.host.json', './tsconfig.client.json', '.'])('拒绝 shared 直接引用 split 叶或 solution：%s', (reference) => {
    const { root } = sharedProjectFixture({ references: [reference] })
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      `packages/api/split/tsconfig.shared.json: 共享项目不得直接引用 split 项目的 Host/Client 叶或 solution：${JSON.stringify(reference)}；请引用 "packages/api/split/tsconfig.shared.json"`,
    ])
  })

  it('允许 shared 引用其他 split 包中合法的 shared', () => {
    const { root } = sharedProjectFixture({ references: ['../peer/tsconfig.shared.json'] })
    const peer = join(root, 'packages/api/peer')
    mkdirSync(join(peer, 'src'), { recursive: true })
    writeJson(join(peer, 'package.json'), { name: '@xpeach/xph-peer' })
    for (const face of ['host', 'client']) writeJson(join(peer, `tsconfig.${face}.json`), {})
    writeJson(join(peer, 'tsconfig.shared.json'), {
      compilerOptions: { composite: true, emitDeclarationOnly: true, rootDir: 'src', outDir: 'lib/types' },
      files: ['src/types.ts'],
    })
    writeFileSync(join(peer, 'src/types.ts'), 'export type PeerDto = string\n')
    expect(collectProjectReferenceFaceViolations(root)).toEqual([])
  })

  it('shared 引用其他 shared 时仍验证后者的源码', () => {
    const { root } = sharedProjectFixture({ references: ['../peer/tsconfig.shared.json'] })
    const peer = join(root, 'packages/api/peer')
    mkdirSync(join(peer, 'src'), { recursive: true })
    writeJson(join(peer, 'package.json'), { name: '@xpeach/xph-peer' })
    for (const face of ['host', 'client']) writeJson(join(peer, `tsconfig.${face}.json`), {})
    writeJson(join(peer, 'tsconfig.shared.json'), {
      compilerOptions: { composite: true, emitDeclarationOnly: true, rootDir: 'src', outDir: 'lib/types' },
      files: ['src/types.ts'],
    })
    writeFileSync(join(peer, 'src/types.ts'), 'export const value = true\n')
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'packages/api/peer/src/types.ts:1:1: 共享项目仅允许 interface、type alias、type-only import/export 或无来源的 export {}；禁止运行时声明和副作用',
    ])
  })

  it('已有合法 shared 也不允许引用 split solution 或相反的叶', () => {
    const { root } = sharedProjectFixture()
    writeJson(join(root, 'tsconfig.client.json'), { references: [
      { path: './packages/api/split/tsconfig.shared.json' },
      { path: './packages/api/split' },
      { path: './packages/api/split/tsconfig.host.json' },
    ] })
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'tsconfig.client.json: Project Reference "./packages/api/split" enters split project packages/api/split from a Client config; reference "packages/api/split/tsconfig.client.json" instead',
      'tsconfig.client.json: Project Reference "./packages/api/split/tsconfig.host.json" enters split project packages/api/split from a Client config; reference "packages/api/split/tsconfig.client.json" instead',
    ])
  })

  it('拒绝缺失的 shared 配置，并合并两面重复的诊断', () => {
    const { root, split } = sharedProjectFixture()
    rmSync(join(split, 'tsconfig.shared.json'))
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'packages/api/split/tsconfig.shared.json: 共享项目配置不存在',
    ])
  })

  it('拒绝通过符号链接将输入移出本包 src', () => {
    const { root, split } = sharedProjectFixture({ files: ['src/linked/types.ts'] })
    const outside = join(root, 'outside')
    mkdirSync(outside)
    writeFileSync(join(outside, 'types.ts'), 'export interface OutsideDto {}\n')
    symlinkSync(outside, join(split, 'src/linked'), 'junction')
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'packages/api/split/tsconfig.shared.json: 共享项目输入文件必须位于本包 src 内："packages/api/split/src/linked/types.ts"',
    ])
  })

  it('拒绝通过输出目录链接把不存在的声明子目录写入 src', () => {
    const { root, split } = sharedProjectFixture({ compilerOptions: { declarationDir: 'declarations/new' } })
    symlinkSync(join(split, 'src'), join(split, 'declarations'), 'junction')
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'packages/api/split/tsconfig.shared.json: 共享项目 declarationDir 不得指向本包 src："packages/api/split/declarations/new"',
    ])
  })

  it('每次调用重新读取源码，缓存不会掩盖后续引入的运行时声明', () => {
    const { root, split } = sharedProjectFixture()
    expect(collectProjectReferenceFaceViolations(root)).toEqual([])
    writeFileSync(join(split, 'src/types.ts'), 'export const runtime = true\n')
    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'packages/api/split/src/types.ts:1:1: 共享项目仅允许 interface、type alias、type-only import/export 或无来源的 export {}；禁止运行时声明和副作用',
    ])
  })
})

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function workspaceFixture(options: {
  readonly host: readonly string[]
  readonly client: readonly string[]
}): string {
  const root = mkdtempSync(join(tmpdir(), 'dsh-project-reference-faces-'))
  roots.push(root)
  const shared = join(root, 'packages/core/shared')
  const split = join(root, 'packages/api/split')
  mkdirSync(shared, { recursive: true })
  mkdirSync(split, { recursive: true })
  writeJson(join(root, 'tsconfig.base.json'), {})
  writeJson(join(root, 'tsconfig.base.client.json'), { extends: './tsconfig.base.json' })
  writeJson(join(shared, 'package.json'), { name: '@xpeach/xph-shared' })
  writeJson(join(shared, 'tsconfig.json'), {
    extends: '../../../tsconfig.base.json',
    references: [],
  })
  writeJson(join(split, 'package.json'), { name: '@xpeach/xph-split' })
  writeJson(join(split, 'tsconfig.json'), {
    files: [],
    references: [{ path: './tsconfig.host.json' }, { path: './tsconfig.client.json' }],
  })
  writeJson(join(split, 'tsconfig.host.json'), { references: [{ path: '../../core/shared' }] })
  writeJson(join(split, 'tsconfig.client.json'), { references: [{ path: '../../core/shared' }] })
  writeJson(join(root, 'tsconfig.host.json'), {
    references: options.host.map(path => ({ path })),
  })
  writeJson(join(root, 'tsconfig.client.json'), {
    references: options.client.map(path => ({ path })),
  })
  return root
}

describe('Project Reference compiler faces', () => {
  it('allows neutral projects in either graph and matching split leaves', () => {
    const root = workspaceFixture({
      host: ['./packages/core/shared', './packages/api/split/tsconfig.host.json'],
      client: ['./packages/core/shared', './packages/api/split/tsconfig.client.json'],
    })

    expect(collectProjectReferenceFaceViolations(root)).toEqual([])
  })

  it('rejects the opposite leaf and the solution root of a split project', () => {
    const root = workspaceFixture({
      host: [
        './packages/api/split/tsconfig.host.json',
        './packages/api/split/tsconfig.client.json',
      ],
      client: ['./packages/api/split'],
    })

    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'tsconfig.client.json: Project Reference "./packages/api/split" enters split project packages/api/split from a Client config; reference "packages/api/split/tsconfig.client.json" instead',
      'tsconfig.host.json: Project Reference "./packages/api/split/tsconfig.client.json" enters split project packages/api/split from a Host config; reference "packages/api/split/tsconfig.host.json" instead',
    ])
  })

  it('uses the referencing project face throughout the reachable graph', () => {
    const root = workspaceFixture({
      host: ['./packages/core/host-consumer'],
      client: ['./packages/core/client-consumer'],
    })
    const hostConsumer = join(root, 'packages/core/host-consumer')
    mkdirSync(hostConsumer, { recursive: true })
    writeJson(join(hostConsumer, 'package.json'), { name: '@xpeach/xph-host-consumer' })
    writeJson(join(hostConsumer, 'tsconfig.json'), {
      extends: '../../../tsconfig.base.json',
      references: [{ path: '../../api/split/tsconfig.client.json' }],
    })
    const clientConsumer = join(root, 'packages/core/client-consumer')
    mkdirSync(clientConsumer, { recursive: true })
    writeJson(join(clientConsumer, 'package.json'), { name: '@xpeach/xph-client-consumer' })
    writeJson(join(clientConsumer, 'tsconfig.json'), {
      extends: '../../../tsconfig.base.client.json',
      references: [{ path: '../../api/split/tsconfig.host.json' }],
    })

    expect(collectProjectReferenceFaceViolations(root)).toEqual([
      'packages/core/client-consumer/tsconfig.json: Project Reference "../../api/split/tsconfig.host.json" enters split project packages/api/split from a Client config; reference "packages/api/split/tsconfig.client.json" instead',
      'packages/core/host-consumer/tsconfig.json: Project Reference "../../api/split/tsconfig.client.json" enters split project packages/api/split from a Host config; reference "packages/api/split/tsconfig.host.json" instead',
    ])
  })
})
