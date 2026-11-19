/** 校验 Project Reference 的 Host/Client 隔离及纯类型共享项目。 */

import { existsSync, globSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import ts from 'typescript'

type ProjectFace = 'host' | 'client'

interface ProjectReferenceConfig {
  readonly extends?: unknown
  readonly references?: ReadonlyArray<{ readonly path?: unknown }>
}

const WORKSPACE_MANIFESTS = [
  'packages/*/*/package.json',
  'apps/*/package.json',
  'vendor/*/package.json',
] as const

/**
 * 收集进入错误 Host/Client 叶、solution 或无效共享项目的引用。
 *
 * 单配置项目可被两面引用。split 包仅允许匹配的叶，或经校验的同包
 * tsconfig.shared.json：必须为 composite、仅生成声明、显式设置输入输出目录，
 * 且所有输入均为本包 src 内的纯类型文件。共享项目不能引用 split 叶或 solution。
 * 配置、继承解析及源文件 AST 的缓存仅属于本次检查，不跨调用保留。
 *
 * @param root - 含 Host 和 Client 聚合配置的仓库根目录。
 * @returns 按仓库相对路径排序的引用或共享项目诊断。
 */
export function collectProjectReferenceFaceViolations(root: string): string[] {
  const splitRoots = splitProjectRoots(root)
  const inspection = new ProjectReferenceInspection(root, splitRoots)
  const violations = new Set<string>()
  const pending = [resolve(root, 'tsconfig.host.json'), resolve(root, 'tsconfig.client.json')]
  const visited = new Set<string>()
  for (let configPath = pending.pop(); configPath !== undefined; configPath = pending.pop()) {
    if (visited.has(configPath) || !existsSync(configPath)) continue
    visited.add(configPath)
    const config = inspection.config(configPath)
    const face = inspection.face(configPath)
    const shared = inspection.sharedRoot(configPath) !== undefined
    for (const reference of projectReferences(config)) {
      const targetConfig = referenceConfigPath(configPath, reference)
      const splitRoot = containingSplitRoot(splitRoots, targetConfig)
      if (splitRoot !== undefined) {
        if (targetConfig === resolve(splitRoot, 'tsconfig.shared.json')) {
          const diagnostics = inspection.sharedViolations(targetConfig)
          for (const diagnostic of diagnostics) violations.add(diagnostic)
          if (diagnostics.length > 0) continue
        } else if (shared) {
          violations.add(
            `${repoPath(root, configPath)}: 共享项目不得直接引用 split 项目的 Host/Client 叶或 solution：${JSON.stringify(reference)}；请引用 ${JSON.stringify(repoPath(root, resolve(splitRoot, 'tsconfig.shared.json')))}`,
          )
          continue
        } else if (face === undefined) {
          violations.add(
            `${repoPath(root, configPath)}: Project Reference ${JSON.stringify(reference)} enters split project ${repoPath(root, splitRoot)} from a config with no Host/Client face`,
          )
          continue
        } else {
          const expected = resolve(splitRoot, `tsconfig.${face}.json`)
          if (targetConfig !== expected) {
            violations.add(
              `${repoPath(root, configPath)}: Project Reference ${JSON.stringify(reference)} enters split project ${repoPath(root, splitRoot)} from a ${faceLabel(face)} config; reference ${JSON.stringify(repoPath(root, expected))} instead`,
            )
            continue
          }
        }
      }
      pending.push(targetConfig)
    }
  }

  return [...violations].sort()
}

class ProjectReferenceInspection {
  private readonly configs = new Map<string, ProjectReferenceConfig>()
  private readonly faces = new Map<string, ProjectFace | undefined>()
  private readonly sharedChecks = new Map<string, readonly string[]>()
  private readonly sourceChecks = new Map<string, readonly string[]>()
  private readonly extendedConfigs = new Map<string, ts.ExtendedConfigCacheEntry>()

  constructor(private readonly root: string, private readonly splitRoots: readonly string[]) {}

  config(configPath: string): ProjectReferenceConfig {
    const cached = this.configs.get(configPath)
    if (cached !== undefined) return cached
    const config = projectConfig(this.root, configPath)
    this.configs.set(configPath, config)
    return config
  }

  sharedRoot(configPath: string): string | undefined {
    return this.splitRoots.find(dir => configPath === resolve(dir, 'tsconfig.shared.json'))
  }

  face(configPath: string, seen = new Set<string>()): ProjectFace | undefined {
    if (this.faces.has(configPath)) return this.faces.get(configPath)
    if (this.sharedRoot(configPath) !== undefined) return undefined
    if (basename(configPath) === 'tsconfig.host.json') return 'host'
    if (basename(configPath) === 'tsconfig.client.json') return 'client'
    if (configPath === resolve(this.root, 'tsconfig.base.json')) return 'host'
    if (configPath === resolve(this.root, 'tsconfig.base.client.json')) return 'client'
    if (seen.has(configPath)) return undefined
    seen.add(configPath)
    const parent = localExtendsConfig(configPath, this.config(configPath).extends)
    const face = parent === undefined || !existsSync(parent) ? undefined : this.face(parent, seen)
    this.faces.set(configPath, face)
    return face
  }

  sharedViolations(configPath: string): readonly string[] {
    const cached = this.sharedChecks.get(configPath)
    if (cached !== undefined) return cached
    const diagnostics: string[] = []
    const label = repoPath(this.root, configPath)
    if (!existsSync(configPath)) {
      diagnostics.push(`${label}: 共享项目配置不存在`)
    } else {
      const parsed = ts.parseJsonConfigFileContent(
        this.config(configPath), ts.sys, dirname(configPath), undefined, configPath,
        undefined, undefined, this.extendedConfigs,
      )
      for (const error of parsed.errors) {
        diagnostics.push(`${label}: 共享项目配置无效：${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`)
      }
      const options = parsed.options
      if (options.emitDeclarationOnly !== true) diagnostics.push(`${label}: 共享项目必须设置 emitDeclarationOnly: true`)
      if (options.composite !== true) diagnostics.push(`${label}: 共享项目必须设置 composite: true`)
      if (options.noEmit === true) diagnostics.push(`${label}: 共享项目不得设置 noEmit: true，必须生成声明`)
      if (options.rootDir === undefined) diagnostics.push(`${label}: 共享项目必须显式设置 rootDir`)
      if (options.outDir === undefined) diagnostics.push(`${label}: 共享项目必须显式设置 outDir`)
      const sourceRoot = resolve(dirname(configPath), 'src')
      const physicalSourceRoot = resolve(canonicalPath(dirname(configPath)), 'src')
      for (const [option, output] of [
        ['outDir', options.outDir], ['declarationDir', options.declarationDir], ['outFile', options.outFile],
        ['tsBuildInfoFile', options.tsBuildInfoFile],
      ] as const) {
        if (output !== undefined && (isWithin(sourceRoot, output) || isWithin(physicalSourceRoot, canonicalPath(output)))) {
          diagnostics.push(`${label}: 共享项目 ${option} 不得指向本包 src：${JSON.stringify(repoPath(this.root, output))}`)
        }
      }
      if (parsed.fileNames.length === 0) diagnostics.push(`${label}: 共享项目必须至少包含一个纯类型源文件`)
      for (const file of parsed.fileNames) {
        if (!isWithin(sourceRoot, file) || !isWithin(physicalSourceRoot, canonicalPath(file))) {
          diagnostics.push(`${label}: 共享项目输入文件必须位于本包 src 内：${JSON.stringify(repoPath(this.root, file))}`)
          continue
        }
        if (options.rootDir !== undefined && !isWithin(options.rootDir, file)) {
          diagnostics.push(`${label}: 共享项目 rootDir 必须包含输入文件：${JSON.stringify(repoPath(this.root, file))}`)
        }
        diagnostics.push(...this.sourceViolations(file))
      }
    }
    this.sharedChecks.set(configPath, diagnostics)
    return diagnostics
  }

  private sourceViolations(file: string): readonly string[] {
    const cached = this.sourceChecks.get(file)
    if (cached !== undefined) return cached
    const diagnostics: string[] = []
    const text = ts.sys.readFile(file)
    if (text === undefined) {
      diagnostics.push(`${repoPath(this.root, file)}: 无法读取共享项目输入文件`)
    } else {
      const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
      for (const statement of source.statements) {
        if (isTypeOnlyStatement(statement)) continue
        const { line, character } = source.getLineAndCharacterOfPosition(statement.getStart(source))
        diagnostics.push(`${repoPath(this.root, file)}:${line + 1}:${character + 1}: 共享项目仅允许 interface、type alias、type-only import/export 或无来源的 export {}；禁止运行时声明和副作用`)
      }
    }
    this.sourceChecks.set(file, diagnostics)
    return diagnostics
  }
}

function isTypeOnlyStatement(statement: ts.Statement): boolean {
  if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) return true
  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause
    if (clause === undefined) return false
    if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) return true
    const bindings = clause.namedBindings
    return clause.phaseModifier === undefined && clause.name === undefined
      && bindings !== undefined && ts.isNamedImports(bindings)
      && bindings.elements.length > 0 && bindings.elements.every(element => element.isTypeOnly)
  }
  if (ts.isExportDeclaration(statement)) {
    if (statement.isTypeOnly) return true
    const clause = statement.exportClause
    return clause !== undefined && ts.isNamedExports(clause)
      && (clause.elements.length === 0
        ? statement.moduleSpecifier === undefined
        : clause.elements.every(element => element.isTypeOnly))
  }
  return false
}

function isWithin(directory: string, path: string): boolean {
  const local = relative(directory, path)
  return local !== '..' && !local.startsWith(`..${sep}`) && !isAbsolute(local)
}

function canonicalPath(path: string): string {
  if (existsSync(path)) return realpathSync(path)
  const parent = dirname(path)
  return parent === path ? path : resolve(canonicalPath(parent), basename(path))
}

function splitProjectRoots(root: string): string[] {
  return globSync(WORKSPACE_MANIFESTS, { cwd: root })
    .map(manifest => resolve(root, dirname(manifest)))
    .filter(dir => existsSync(resolve(dir, 'tsconfig.host.json'))
      && existsSync(resolve(dir, 'tsconfig.client.json')))
    .sort((left, right) => right.length - left.length)
}

function projectConfig(root: string, configPath: string): ProjectReferenceConfig {
  const read = ts.readConfigFile(configPath, path => ts.sys.readFile(path))
  if (read.error !== undefined) {
    const message = ts.flattenDiagnosticMessageText(read.error.messageText, '\n')
    throw new Error(`${repoPath(root, configPath)}: ${message}`)
  }
  return read.config as ProjectReferenceConfig
}

function projectReferences(config: ProjectReferenceConfig): string[] {
  return (config.references ?? [])
    .map(reference => reference.path)
    .filter((path): path is string => typeof path === 'string')
}

function localExtendsConfig(configPath: string, value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('.')) return undefined
  const target = resolve(dirname(configPath), value)
  return target.endsWith('.json') ? target : `${target}.json`
}

function referenceConfigPath(sourceConfig: string, reference: string): string {
  const target = resolve(dirname(sourceConfig), reference)
  return target.endsWith('.json') ? target : resolve(target, 'tsconfig.json')
}

function containingSplitRoot(splitRoots: readonly string[], targetConfig: string): string | undefined {
  return splitRoots.find((root) => {
    const path = relative(root, targetConfig)
    return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)
  })
}

function repoPath(root: string, path: string): string {
  return relative(root, path).split(sep).join('/')
}

function faceLabel(face: ProjectFace): string {
  return face === 'host' ? 'Host' : 'Client'
}
