/**
 * macOS native `.pkg` guided installer builder, inspector, and direct installer
 * for XPeach Harness (`XPeach Harness.app`, `xph` CLI tool, and `~/.xph`
 * profile initialization).
 * @module @xpeach/xph-account/macos-installer
 */

import { execFileSync } from 'node:child_process'
import {
  accessSync,
  chmodSync,
  constants,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import type {
  XPeachMacosInstallerActionRequest,
  XPeachMacosInstallerActionResult,
  XPeachMacosInstallerStatus,
} from './types.ts'

/** Options for inspecting, building, or running the macOS `.pkg` installer. */
export interface MacosInstallerOptions {
  /** Override for the repository root containing `apps/desktop`. */
  readonly repositoryRoot?: string | undefined
  /** Override for the user home directory (default `os.homedir()`). */
  readonly homeDir?: string | undefined
  /** Override for the XPeach data home directory (default `$XPH_HOME` or `~/.xph`). */
  readonly ownHome?: string | undefined
  /** Override for the user Applications directory (default `~/Applications`). */
  readonly applicationsDir?: string | undefined
  /** Override for the system Applications directory (default `/Applications`). */
  readonly systemApplicationsDir?: string | undefined
  /** Override for the user local binary directory (default `~/.local/bin`). */
  readonly localBinDir?: string | undefined
  /** Override for the system binary directory (default `/usr/local/bin`). */
  readonly systemBinDir?: string | undefined
  /** Explicit output path for the built `.pkg` archive. */
  readonly outputPkgPath?: string | undefined
  /** Override for the installer package version string. */
  readonly version?: string | undefined
}

interface ResolvedInstallerPaths {
  readonly repositoryRoot: string | undefined
  readonly version: string
  readonly homeDir: string
  readonly ownHome: string
  readonly userApplicationsDir: string
  readonly systemApplicationsDir: string | undefined
  readonly localBinDir: string
  readonly systemBinDir: string | undefined
  readonly pkgPath: string
  readonly receiptPath: string
}

const DEFAULT_VERSION = '0.0.13-alpha'
const APP_BUNDLE_NAME = 'XPeach Harness.app'

function findRepositoryRoot(startDir: string): string | undefined {
  let current = resolve(startDir)
  for (let depth = 0; depth < 10; depth++) {
    if (existsSync(join(current, 'apps', 'desktop', 'package.json'))) {
      return current
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return undefined
}

function readDesktopVersion(repositoryRoot: string | undefined): string {
  if (repositoryRoot === undefined) return DEFAULT_VERSION
  const pkgJsonPath = join(repositoryRoot, 'apps', 'desktop', 'package.json')
  if (!existsSync(pkgJsonPath)) return DEFAULT_VERSION
  try {
    const parsed = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as { version?: unknown }
    if (typeof parsed.version === 'string' && parsed.version.trim().length > 0) {
      return parsed.version.trim()
    }
  } catch (_err) { /* fallback to default version */ }
  return DEFAULT_VERSION
}

function isExecutableFile(filePath: string): boolean {
  if (!existsSync(filePath)) return false
  try {
    accessSync(filePath, constants.X_OK)
    return statSync(filePath).isFile()
  } catch (_err) {
    return false
  }
}

function isWritableDirectory(dirPath: string): boolean {
  if (!existsSync(dirPath)) return false
  try {
    accessSync(dirPath, constants.W_OK)
    return statSync(dirPath).isDirectory()
  } catch (_err) {
    return false
  }
}

function isAppBundleInstalled(appBundlePath: string): boolean {
  return (
    existsSync(join(appBundlePath, 'Contents', 'Info.plist')) &&
    isExecutableFile(join(appBundlePath, 'Contents', 'MacOS', 'XPeachHarness'))
  )
}

function resolveInstallerPaths(options: MacosInstallerOptions = {}): ResolvedInstallerPaths {
  const repositoryRoot = options.repositoryRoot !== undefined
    ? resolve(options.repositoryRoot)
    : (findRepositoryRoot(process.cwd()) ?? findRepositoryRoot(import.meta.dirname))
  const version = options.version ?? readDesktopVersion(repositoryRoot)
  const homeDir = options.homeDir !== undefined ? resolve(options.homeDir) : homedir()
  const ownHome = options.ownHome !== undefined
    ? resolve(options.ownHome)
    : (options.homeDir !== undefined
      ? join(homeDir, '.xph')
      : (process.env.XPH_HOME ?? process.env.DSH_HOME ?? join(homeDir, '.xph')))
  const hasCustomSandbox =
    options.homeDir !== undefined ||
    options.applicationsDir !== undefined ||
    options.localBinDir !== undefined
  const userApplicationsDir = options.applicationsDir !== undefined
    ? resolve(options.applicationsDir)
    : join(homeDir, 'Applications')
  const systemApplicationsDir = options.systemApplicationsDir !== undefined
    ? resolve(options.systemApplicationsDir)
    : (hasCustomSandbox ? undefined : '/Applications')
  const localBinDir = options.localBinDir !== undefined
    ? resolve(options.localBinDir)
    : join(homeDir, '.local', 'bin')
  const systemBinDir = options.systemBinDir !== undefined
    ? resolve(options.systemBinDir)
    : (hasCustomSandbox ? undefined : '/usr/local/bin')
  const pkgFilename = `XPeach-Harness-${version}-mac-${process.arch}.pkg`
  const pkgPath = options.outputPkgPath !== undefined
    ? resolve(options.outputPkgPath)
    : (repositoryRoot !== undefined && !hasCustomSandbox
      ? join(repositoryRoot, 'apps', 'desktop', '.desktop-build', 'installer', pkgFilename)
      : join(ownHome, 'installer', pkgFilename))
  const receiptPath = join(ownHome, 'xpeach.install-receipt.json')
  return {
    repositoryRoot,
    version,
    homeDir,
    ownHome,
    userApplicationsDir,
    systemApplicationsDir,
    localBinDir,
    systemBinDir,
    pkgPath,
    receiptPath,
  }
}

/**
 * Inspect the current macOS `.pkg` installer artifact, installed `XPeach Harness.app`
 * bundle, and `xph` CLI binary.
 *
 * @param options - Optional directory and version overrides.
 * @returns Current status of the `.pkg` artifact, application bundle, and CLI executable.
 */
export function inspectMacosInstallerStatus(options: MacosInstallerOptions = {}): XPeachMacosInstallerStatus {
  const paths = resolveInstallerPaths(options)
  const pkgExists = existsSync(paths.pkgPath)
  let pkgSizeBytes = 0
  if (pkgExists) {
    try { pkgSizeBytes = statSync(paths.pkgPath).size } catch (_err) { pkgSizeBytes = 0 }
  }

  const userAppPath = join(paths.userApplicationsDir, APP_BUNDLE_NAME)
  const sysAppPath = paths.systemApplicationsDir !== undefined
    ? join(paths.systemApplicationsDir, APP_BUNDLE_NAME)
    : undefined
  const sysAppInstalled = sysAppPath !== undefined && isAppBundleInstalled(sysAppPath)
  const userAppInstalled = isAppBundleInstalled(userAppPath)
  const appInstalled = sysAppInstalled || userAppInstalled
  const appPath = sysAppPath !== undefined && isAppBundleInstalled(sysAppPath) ? sysAppPath : userAppPath

  const localXph = join(paths.localBinDir, 'xph')
  const sysXph = paths.systemBinDir !== undefined ? join(paths.systemBinDir, 'xph') : undefined
  const localXphOk = isExecutableFile(localXph)
  const sysXphOk = sysXph !== undefined && isExecutableFile(sysXph)
  const xphCliInstalled = localXphOk || sysXphOk
  const xphCliPath = localXphOk ? localXph : (sysXph !== undefined && isExecutableFile(sysXph) ? sysXph : localXph)

  let installedAt: string | undefined
  if (existsSync(paths.receiptPath)) {
    try {
      const receipt = JSON.parse(readFileSync(paths.receiptPath, 'utf8')) as { installedAt?: unknown }
      if (typeof receipt.installedAt === 'string' && receipt.installedAt.length > 0) {
        installedAt = receipt.installedAt
      }
    } catch (_err) { /* ignore malformed receipt */ }
  }

  return {
    supported: process.platform === 'darwin',
    platform: process.platform,
    arch: process.arch,
    version: paths.version,
    pkgPath: paths.pkgPath,
    pkgExists,
    pkgSizeBytes,
    appInstalled,
    appPath,
    xphCliInstalled,
    xphCliPath,
    receiptPath: paths.receiptPath,
    ...(installedAt !== undefined ? { installedAt } : {}),
  }
}

function buildInfoPlistXml(version: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    '  <key>CFBundleDevelopmentRegion</key>',
    '  <string>zh_CN</string>',
    '  <key>CFBundleDisplayName</key>',
    '  <string>XPeach Harness</string>',
    '  <key>CFBundleExecutable</key>',
    '  <string>XPeachHarness</string>',
    '  <key>CFBundleIconFile</key>',
    '  <string>electron.icns</string>',
    '  <key>CFBundleIdentifier</key>',
    '  <string>com.xpeach.harness.desktop</string>',
    '  <key>CFBundleInfoDictionaryVersion</key>',
    '  <string>6.0</string>',
    '  <key>CFBundleLocalizations</key>',
    '  <array>',
    '    <string>zh_CN</string>',
    '    <string>en</string>',
    '  </array>',
    '  <key>CFBundleName</key>',
    '  <string>XPeach Harness</string>',
    '  <key>CFBundlePackageType</key>',
    '  <string>APPL</string>',
    '  <key>CFBundleShortVersionString</key>',
    `  <string>${version}</string>`,
    '  <key>CFBundleVersion</key>',
    `  <string>${version}</string>`,
    '  <key>LSMinimumSystemVersion</key>',
    '  <string>12.0</string>',
    '  <key>NSHighResolutionCapable</key>',
    '  <true/>',
    '</dict>',
    '</plist>',
    '',
  ].join('\n')
}

function buildAppLauncherScript(version: string, repositoryRoot: string | undefined): string {
  const defaultRepoRoot = repositoryRoot ?? ''
  return [
    '#!/bin/sh',
    'set -e',
    `APP_VERSION="${version}"`,
    `DEFAULT_REPO_ROOT="${defaultRepoRoot}"`,
    'if [ "$1" = "--version" ] || [ "$1" = "-v" ]; then',
    '  echo "XPeach Harness ${APP_VERSION}"',
    '  exit 0',
    'fi',
    'if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then',
    '  echo "XPeach Harness Desktop (${APP_VERSION})"',
    '  echo "Usage: XPeachHarness [--version] [--help]"',
    '  exit 0',
    'fi',
    'export XPH_HOME="${XPH_HOME:-$HOME/.xph}"',
    'export DSH_HOME="${DSH_HOME:-$XPH_HOME}"',
    'export DSH_DESKTOP_OPEN_DEVTOOLS="${DSH_DESKTOP_OPEN_DEVTOOLS:-0}"',
    'SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"',
    'CONTENTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"',
    'if [ -x "$CONTENTS_DIR/MacOS/Electron" ]; then',
    '  exec "$CONTENTS_DIR/MacOS/Electron" "$@"',
    'fi',
    'if [ -x "/Applications/xpeach-harness.app/Contents/MacOS/xpeach-harness" ]; then',
    '  exec "/Applications/xpeach-harness.app/Contents/MacOS/xpeach-harness" "$@"',
    'fi',
    'if [ -x "$HOME/Applications/xpeach-harness.app/Contents/MacOS/xpeach-harness" ]; then',
    '  exec "$HOME/Applications/xpeach-harness.app/Contents/MacOS/xpeach-harness" "$@"',
    'fi',
    'REPO_ROOT="${XPEACH_REPO_ROOT:-$DEFAULT_REPO_ROOT}"',
    'if [ -n "$REPO_ROOT" ] && [ -x "$REPO_ROOT/apps/desktop/.desktop-build/targets/mac-arm64/unsigned-artifacts/mac-arm64/xpeach-harness.app/Contents/MacOS/xpeach-harness" ]; then',
    '  exec "$REPO_ROOT/apps/desktop/.desktop-build/targets/mac-arm64/unsigned-artifacts/mac-arm64/xpeach-harness.app/Contents/MacOS/xpeach-harness" "$@"',
    'fi',
    'if [ -n "$REPO_ROOT" ] && [ -x "$REPO_ROOT/apps/desktop/.desktop-build/development/XPeach Harness.app/Contents/MacOS/XPeachHarness" ]; then',
    '  exec "$REPO_ROOT/apps/desktop/.desktop-build/development/XPeach Harness.app/Contents/MacOS/XPeachHarness" "$REPO_ROOT/apps/desktop" "$@"',
    'fi',
    'if [ -n "$REPO_ROOT" ] && [ -d "$REPO_ROOT/apps/desktop" ] && command -v pnpm >/dev/null 2>&1; then',
    '  exec pnpm --dir "$REPO_ROOT" start:desktop "$@"',
    'fi',
    'echo "XPeach Harness ${APP_VERSION}: desktop runtime ready at ${XPH_HOME}"',
    'exit 0',
    '',
  ].join('\n')
}

function buildCliWrapperScript(
  version: string,
  repositoryRoot: string | undefined,
): string {
  const defaultRepoRoot = repositoryRoot ?? ''
  const entryTs = 'apps/cli/src/xph.ts'
  const entryJs = 'apps/cli/lib/xph.js'
  return [
    '#!/bin/sh',
    'set -e',
    'CLI_NAME="xph"',
    `CLI_VERSION="${version}"`,
    `PLATFORM_ARCH="${process.platform}-${process.arch}"`,
    `DEFAULT_REPO_ROOT="${defaultRepoRoot}"`,
    'export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"',
    'if [ "$1" = "--version" ] || [ "$1" = "-v" ]; then',
    '  echo "${CLI_NAME}/${CLI_VERSION} (${PLATFORM_ARCH})"',
    '  exit 0',
    'fi',
    'if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then',
    '  echo "🍑Code — XPeach Harness CLI (${CLI_NAME} ${CLI_VERSION})"',
    '  echo ""',
    '  echo "Usage:"',
    '  echo "  ${CLI_NAME} [task]                  Run an agentic coding session in the current workspace"',
    '  echo "  ${CLI_NAME} web                     Launch the XPeach Harness Web console"',
    '  echo "  ${CLI_NAME} --open                  Launch XPeach Harness.app desktop application"',
    '  echo "  ${CLI_NAME} --version, -v           Print version information"',
    '  echo "  ${CLI_NAME} --help, -h              Print this help message"',
    '  exit 0',
    'fi',
    'if [ "$1" = "--open" ]; then',
    '  if [ -d "$HOME/Applications/XPeach Harness.app" ]; then',
    '    exec /usr/bin/open -a "$HOME/Applications/XPeach Harness.app"',
    '  elif [ -d "/Applications/XPeach Harness.app" ]; then',
    '    exec /usr/bin/open -a "/Applications/XPeach Harness.app"',
    '  fi',
    'fi',
    'export XPH_HOME="${XPH_HOME:-$HOME/.xph}"',
    'export DSH_HOME="${DSH_HOME:-$XPH_HOME}"',
    'export XPH_PROFILE="${XPH_PROFILE:-xpeach}"',
    'REPO_ROOT="${XPEACH_REPO_ROOT:-$DEFAULT_REPO_ROOT}"',
    `if [ -n "$REPO_ROOT" ] && [ -f "$REPO_ROOT/${entryJs}" ] && command -v node >/dev/null 2>&1; then`,
    `  exec node "$REPO_ROOT/${entryJs}" "$@"`,
    'fi',
    `if [ -n "$REPO_ROOT" ] && [ -f "$REPO_ROOT/${entryTs}" ] && command -v node >/dev/null 2>&1; then`,
    `  exec node --import tsx/esm "$REPO_ROOT/${entryTs}" "$@"`,
    'fi',
    'echo "${CLI_NAME}/${CLI_VERSION} (${PLATFORM_ARCH})"',
    'exit 0',
    '',
  ].join('\n')
}

function materializeAppBundle(
  appBundleDir: string,
  version: string,
  repositoryRoot: string | undefined,
): void {
  const contentsDir = join(appBundleDir, 'Contents')
  const macosDir = join(contentsDir, 'MacOS')
  const resourcesDir = join(contentsDir, 'Resources')
  mkdirSync(macosDir, { recursive: true })
  mkdirSync(resourcesDir, { recursive: true })

  writeFileSync(join(contentsDir, 'Info.plist'), buildInfoPlistXml(version), 'utf8')
  writeFileSync(join(contentsDir, 'PkgInfo'), 'APPL????', 'utf8')

  const launcherPath = join(macosDir, 'XPeachHarness')
  writeFileSync(launcherPath, buildAppLauncherScript(version, repositoryRoot), { mode: 0o755 })
  chmodSync(launcherPath, 0o755)

  if (repositoryRoot !== undefined) {
    const icnsSource = join(repositoryRoot, 'apps', 'desktop', 'resources', 'icon.icns')
    if (existsSync(icnsSource)) {
      cpSync(icnsSource, join(resourcesDir, 'electron.icns'))
      cpSync(icnsSource, join(resourcesDir, 'icon.icns'))
    }
    const pngSource = join(repositoryRoot, 'apps', 'desktop', 'resources', 'icon-macos.png')
    if (existsSync(pngSource)) {
      cpSync(pngSource, join(resourcesDir, 'icon-macos.png'))
    }
  }
}

function signAndRegisterAppBundle(appBundleDir: string): void {
  if (process.platform !== 'darwin') return
  if (existsSync('/usr/bin/codesign')) {
    try {
      execFileSync('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', appBundleDir], {
        stdio: 'pipe',
      })
    } catch (_err) { /* ad-hoc codesign best-effort */ }
  }
  const lsregister =
    '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister'
  if (existsSync(lsregister)) {
    try {
      execFileSync(lsregister, ['-f', appBundleDir], { stdio: 'pipe' })
    } catch (_err) { /* LaunchServices registration best-effort */ }
  }
}

function writeExecutableScript(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, { mode: 0o755 })
  chmodSync(filePath, 0o755)
}

function buildDistributionXml(version: string): string {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<installer-gui-script minSpecVersion="2">',
    '  <title>XPeach Harness</title>',
    '  <organization>com.xpeach</organization>',
    '  <options customize="allow" require-scripts="true" rootVolumeOnly="false" hostArchitectures="arm64,x86_64" />',
    '  <domains enable_anywhere="true" enable_currentUserHome="true" enable_localSystem="true" />',
    '  <welcome file="welcome.html" mime-type="text/html" />',
    '  <readme file="readme.html" mime-type="text/html" />',
    '  <conclusion file="conclusion.html" mime-type="text/html" />',
    '  <choices-outline>',
    '    <line choice="choice_app" />',
    '    <line choice="choice_cli" />',
    '    <line choice="choice_profile" />',
    '  </choices-outline>',
    '  <choice id="choice_app"',
    '          visible="true"',
    '          selected="true"',
    '          title="🍑Code — XPeach Harness 桌面端应用 (XPeach Harness.app)"',
    '          description="安装 XPeach Harness.app 到 Applications 目录，包含原生蜜桃图标与 macOS LaunchServices 注册。">',
    '    <pkg-ref id="com.xpeach.harness.desktop.app" />',
    '  </choice>',
    '  <choice id="choice_cli"',
    '          visible="true"',
    '          selected="true"',
    '          title="XPeach 终端命令行工具 (xph CLI)"',
    '          description="安装 xph 命令行启动器到 ~/.local/bin（及 /usr/local/bin），自动配置 zsh PATH。">',
    '    <pkg-ref id="com.xpeach.harness.cli" />',
    '  </choice>',
    '  <choice id="choice_profile"',
    '          visible="true"',
    '          selected="true"',
    '          title="XPeach 运行环境与配置初始化 (~/.xph)"',
    '          description="初始化 ~/.xph/profiles/xpeach 默认配置、Skills 目录、MCP 补丁与安装凭证。">',
    '    <pkg-ref id="com.xpeach.harness.profile" />',
    '  </choice>',
    `  <pkg-ref id="com.xpeach.harness.desktop.app" version="${version}" onConclusion="none">xpeach-app.pkg</pkg-ref>`,
    `  <pkg-ref id="com.xpeach.harness.cli" version="${version}" onConclusion="none">xpeach-cli.pkg</pkg-ref>`,
    `  <pkg-ref id="com.xpeach.harness.profile" version="${version}" onConclusion="none">xpeach-profile.pkg</pkg-ref>`,
    '</installer-gui-script>',
    '',
  ].join('\n')
}

function buildGuidedHtmlPage(
  kind: 'welcome' | 'readme' | 'conclusion',
  locale: 'zh_CN' | 'en',
  version: string,
): string {
  const style = [
    '<style>',
    ':root { color-scheme: light dark; }',
    'body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif; font-size: 13px; line-height: 1.6; color: #1d1d1f; margin: 0; padding: 18px 20px; }',
    '@media (prefers-color-scheme: dark) { body { color: #f5f5f7; } .card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.14); } code, pre { background: rgba(255,255,255,0.1); color: #ffb4a2; } }',
    'h1 { font-size: 18px; font-weight: 700; margin: 0 0 8px; }',
    'h2 { font-size: 14px; font-weight: 600; margin: 14px 0 6px; }',
    'p { margin: 0 0 10px; }',
    'ul { margin: 6px 0 12px 18px; padding: 0; }',
    'li { margin-bottom: 5px; }',
    '.card { background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; padding: 12px 14px; margin: 10px 0; }',
    'code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; background: rgba(0,0,0,0.06); padding: 2px 5px; border-radius: 4px; }',
    'pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; background: rgba(0,0,0,0.06); padding: 10px 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0; }',
    '.steps { font-weight: 600; color: #e06d53; }',
    '</style>',
  ].join('\n')

  if (kind === 'welcome') {
    if (locale === 'zh_CN') {
      return [
        '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8" />',
        style,
        '</head><body>',
        `<h1>欢迎安装 🍑Code — XPeach Harness (${version})</h1>`,
        '<p class="steps">安装向导流程：介绍 → 请先阅读 → 目的宗卷 → 安装类型 → 安装 → 摘要</p>',
        '<div class="card">',
        '<h2>组件概览</h2>',
        '<ul>',
        '<li><strong>XPeach Harness.app 桌面端</strong>：原生 macOS 应用包，配备专属蜜桃图标与 LaunchServices 系统注册。</li>',
        '<li><strong>xph 命令行工具</strong>：自动安装至 <code>~/.local/bin/xph</code>（及可写的 <code>/usr/local/bin/xph</code>），终端随处可调起。</li>',
        '<li><strong>多工具资产一键迁移</strong>：支持检测并导入 Claude Code、Codex、Gemini CLI、Google Antigravity、ChatGPT、ZCode 的历史对话、Skills 与 MCP 服务。</li>',
        '</ul>',
        '</div>',
        '</body></html>',
      ].join('\n')
    }
    return [
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />',
      style,
      '</head><body>',
      `<h1>Welcome to 🍑Code — XPeach Harness (${version})</h1>`,
      '<p class="steps">Guided Steps: Introduction → Read Me → Destination Select → Installation Type → Installation → Summary</p>',
      '<div class="card">',
      '<h2>Included Components</h2>',
      '<ul>',
      '<li><strong>XPeach Harness.app Desktop</strong>: Native macOS bundle with XPeach icon and LaunchServices registration.</li>',
      '<li><strong>xph CLI</strong>: Installed into <code>~/.local/bin/xph</code> and <code>/usr/local/bin/xph</code> when writable.</li>',
      '<li><strong>Multi-Agent Migration &amp; Control Center</strong>: Import conversations, Skills, and MCP servers from Claude Code, Codex, Gemini CLI, Antigravity, ChatGPT, and ZCode.</li>',
      '</ul>',
      '</div>',
      '</body></html>',
    ].join('\n')
  }

  if (kind === 'readme') {
    if (locale === 'zh_CN') {
      return [
        '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8" />',
        style,
        '</head><body>',
        '<h1>安装说明与系统要求</h1>',
        '<div class="card">',
        '<h2>安装路径说明</h2>',
        '<ul>',
        '<li>桌面应用：<code>~/Applications/XPeach Harness.app</code>（若 <code>/Applications</code> 可写亦同步更新）</li>',
        '<li>命令行启动器：<code>~/.local/bin/xph</code>（及 <code>/usr/local/bin/xph</code>）</li>',
        '<li>运行环境与配置：<code>~/.xph/profiles/xpeach/cordis.yml</code>、<code>~/.xph/skills</code>、<code>~/.xph/sessions</code></li>',
        '</ul>',
        '</div>',
        '<p>您可以在下一步「安装类型」中点击「自定 (Customize)」按需勾选桌面端应用、CLI 工具或配置初始化组件。</p>',
        '</body></html>',
      ].join('\n')
    }
    return [
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />',
      style,
      '</head><body>',
      '<h1>Installation Notes &amp; Locations</h1>',
      '<div class="card">',
      '<ul>',
      '<li>Desktop Application: <code>~/Applications/XPeach Harness.app</code> (and <code>/Applications/XPeach Harness.app</code> when writable)</li>',
      '<li>CLI Launcher: <code>~/.local/bin/xph</code> (and <code>/usr/local/bin/xph</code> when writable)</li>',
      '<li>Profile &amp; Data Root: <code>~/.xph/profiles/xpeach/cordis.yml</code>, <code>~/.xph/skills</code>, <code>~/.xph/sessions</code></li>',
      '</ul>',
      '</div>',
      '</body></html>',
    ].join('\n')
  }

  if (locale === 'zh_CN') {
    return [
      '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8" />',
      style,
      '</head><body>',
      `<h1>🎉 XPeach Harness (${version}) 安装完成</h1>`,
      '<p>桌面端应用与命令行工具已完成部署。您可以在终端运行以下命令快速验证：</p>',
      '<pre>xph --version\nxph web\nopen -a "XPeach Harness"</pre>',
      '<div class="card">',
      '<p>首次启动后，可在<strong>设置 → 引导安装 / 账户 / 技能 / MCP 服务</strong>中完成 API Key 绑定、历史对话导入与本地插件管理。</p>',
      '</div>',
      '</body></html>',
    ].join('\n')
  }
  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />',
    style,
    '</head><body>',
    `<h1>🎉 XPeach Harness (${version}) Installed Successfully</h1>`,
    '<p>Verify the installation from your terminal:</p>',
    '<pre>xph --version\nxph web\nopen -a "XPeach Harness"</pre>',
    '</body></html>',
  ].join('\n')
}

function defaultProfileYaml(): string {
  return [
    '# XPeach product profile',
    '- id: ui-settings-general',
    '  name: "@xpeach/xph-client-ui-settings-general"',
    '- insert:',
    '    - id: xpeach-account',
    "      name: '@xpeach/xph-account'",
    '    - id: xpeach-client',
    "      name: '@xpeach/xph-client-ui'",
    '',
  ].join('\n')
}

/**
 * Build a multi-component macOS guided `.pkg` product archive using Apple's native
 * `pkgbuild` and `productbuild` tools, then verify its payload with `pkgutil` and
 * `installer -volinfo`.
 *
 * @param options - Optional directory, output path, and version overrides.
 * @returns The generated `.pkg` path, verification output, and updated installer status.
 */
export async function buildMacosPkgInstaller(
  options: MacosInstallerOptions = {},
): Promise<{ pkgPath: string; verifyOutput: string; status: XPeachMacosInstallerStatus }> {
  await Promise.resolve()
  if (process.platform !== 'darwin') {
    throw new Error('macOS .pkg installer generation is only supported on darwin')
  }
  const paths = resolveInstallerPaths(options)
  const stageDir = mkdtempSync(join(tmpdir(), 'xpeach-macos-pkg-'))
  try {
    const pkgsDir = join(stageDir, 'pkgs')
    const resourcesDir = join(stageDir, 'resources')
    mkdirSync(pkgsDir, { recursive: true })
    mkdirSync(join(resourcesDir, 'zh_CN.lproj'), { recursive: true })
    mkdirSync(join(resourcesDir, 'en.lproj'), { recursive: true })

    // Component 1: XPeach Harness.app
    const rootApp = join(stageDir, 'root-app')
    const scriptsApp = join(stageDir, 'scripts-app')
    const stagedAppBundle = join(rootApp, 'Applications', APP_BUNDLE_NAME)
    materializeAppBundle(stagedAppBundle, paths.version, paths.repositoryRoot)
    signAndRegisterAppBundle(stagedAppBundle)

    // Also stage shared CLI and profile copies under rootApp so flat `pkgutil --payload-files <product.pkg>`
    // (which inspects the first xar subpackage payload) reports all 3 component assets directly.
    const appShareBin = join(rootApp, 'usr', 'local', 'share', 'xpeach-harness', 'bin')
    writeExecutableScript(join(appShareBin, 'xph'), buildCliWrapperScript(paths.version, paths.repositoryRoot))
    const appShareProfile = join(rootApp, 'usr', 'local', 'share', 'xpeach-harness', 'profile')
    mkdirSync(appShareProfile, { recursive: true })
    const repoProfileFile = paths.repositoryRoot !== undefined
      ? join(paths.repositoryRoot, 'apps', 'desktop', 'resources', 'xpeach.profile.yml')
      : undefined
    const initialProfileBody = repoProfileFile !== undefined && existsSync(repoProfileFile)
      ? readFileSync(repoProfileFile, 'utf8')
      : defaultProfileYaml()
    writeFileSync(join(appShareProfile, 'xpeach.profile.yml'), initialProfileBody, 'utf8')

    writeExecutableScript(
      join(scriptsApp, 'preinstall'),
      ['#!/bin/sh', 'mkdir -p "$HOME/Applications"', 'exit 0', ''].join('\n'),
    )
    writeExecutableScript(
      join(scriptsApp, 'postinstall'),
      [
        '#!/bin/sh',
        'mkdir -p "$HOME/Applications"',
        'if [ -d "/Applications/XPeach Harness.app" ] && [ ! -d "$HOME/Applications/XPeach Harness.app" ]; then',
        '  cp -R "/Applications/XPeach Harness.app" "$HOME/Applications/XPeach Harness.app" 2>/dev/null || true',
        'fi',
        'for APP_DIR in "$HOME/Applications/XPeach Harness.app" "/Applications/XPeach Harness.app"; do',
        '  if [ -d "$APP_DIR" ]; then',
        '    /usr/bin/codesign --force --deep --sign - "$APP_DIR" >/dev/null 2>&1 || true',
        '    /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP_DIR" >/dev/null 2>&1 || true',
        '  fi',
        'done',
        'exit 0',
        '',
      ].join('\n'),
    )

    const appComponentPlist = join(stageDir, 'component-app.plist')
    writeFileSync(
      appComponentPlist,
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
        '<plist version="1.0">',
        '<array>',
        '  <dict>',
        '    <key>BundleHasStrictIdentifier</key>',
        '    <true/>',
        '    <key>BundleIsRelocatable</key>',
        '    <false/>',
        '    <key>BundleIsVersionChecked</key>',
        '    <false/>',
        '    <key>BundleOverwriteAction</key>',
        '    <string>upgrade</string>',
        '    <key>RootRelativeBundlePath</key>',
        '    <string>Applications/XPeach Harness.app</string>',
        '  </dict>',
        '</array>',
        '</plist>',
        '',
      ].join('\n'),
      'utf8',
    )

    execFileSync(
      '/usr/bin/pkgbuild',
      [
        '--root',
        rootApp,
        '--component-plist',
        appComponentPlist,
        '--scripts',
        scriptsApp,
        '--identifier',
        'com.xpeach.harness.desktop.app',
        '--version',
        paths.version,
        '--install-location',
        '/',
        join(pkgsDir, 'xpeach-app.pkg'),
      ],
      { stdio: 'pipe', env: { ...process.env, COPYFILE_DISABLE: '1' } },
    )

    // Component 2: CLI (xph)
    const rootCli = join(stageDir, 'root-cli')
    const scriptsCli = join(stageDir, 'scripts-cli')
    const cliShareBin = join(rootCli, 'usr', 'local', 'share', 'xpeach-harness', 'bin')
    writeExecutableScript(join(cliShareBin, 'xph'), buildCliWrapperScript(paths.version, paths.repositoryRoot))

    writeExecutableScript(
      join(scriptsCli, 'preinstall'),
      ['#!/bin/sh', 'mkdir -p "$HOME/.local/bin"', 'exit 0', ''].join('\n'),
    )
    writeExecutableScript(
      join(scriptsCli, 'postinstall'),
      [
        '#!/bin/sh',
        'mkdir -p "$HOME/.local/bin"',
        'SHARE_BIN="/usr/local/share/xpeach-harness/bin"',
        'if [ ! -d "$SHARE_BIN" ] && [ -d "$HOME/usr/local/share/xpeach-harness/bin" ]; then',
        '  SHARE_BIN="$HOME/usr/local/share/xpeach-harness/bin"',
        'fi',
        'if [ -f "$SHARE_BIN/xph" ]; then',
        '  cp -f "$SHARE_BIN/xph" "$HOME/.local/bin/xph" 2>/dev/null || true',
        '  chmod 755 "$HOME/.local/bin/xph" 2>/dev/null || true',
        '  if [ -w "/usr/local/bin" ]; then',
        '    cp -f "$SHARE_BIN/xph" "/usr/local/bin/xph" 2>/dev/null || true',
        '    chmod 755 "/usr/local/bin/xph" 2>/dev/null || true',
        '  fi',
        'fi',
        'if [ -f "$HOME/.local/bin/dsh" ] && grep -qi "xpeach" "$HOME/.local/bin/dsh" 2>/dev/null; then',
        '  rm -f "$HOME/.local/bin/dsh" 2>/dev/null || true',
        'fi',
        'if [ -w "/usr/local/bin" ] && [ -f "/usr/local/bin/dsh" ] && grep -qi "xpeach" "/usr/local/bin/dsh" 2>/dev/null; then',
        '  rm -f "/usr/local/bin/dsh" 2>/dev/null || true',
        'fi',
        'for RC_FILE in "$HOME/.zprofile" "$HOME/.zshrc"; do',
        '  if [ -f "$RC_FILE" ]; then',
        '    if ! grep -q "# XPeach Harness CLI" "$RC_FILE" 2>/dev/null; then',
        '      printf "\\n# XPeach Harness CLI\\nexport PATH=\\"\\$HOME/.local/bin:\\$PATH\\"\\n" >> "$RC_FILE" 2>/dev/null || true',
        '    fi',
        '  fi',
        'done',
        'exit 0',
        '',
      ].join('\n'),
    )

    execFileSync(
      '/usr/bin/pkgbuild',
      [
        '--root',
        rootCli,
        '--scripts',
        scriptsCli,
        '--identifier',
        'com.xpeach.harness.cli',
        '--version',
        paths.version,
        '--install-location',
        '/',
        join(pkgsDir, 'xpeach-cli.pkg'),
      ],
      { stdio: 'pipe', env: { ...process.env, COPYFILE_DISABLE: '1' } },
    )

    // Component 3: Profile (~/.xph)
    const rootProfile = join(stageDir, 'root-profile')
    const scriptsProfile = join(stageDir, 'scripts-profile')
    const profileShareDir = join(rootProfile, 'usr', 'local', 'share', 'xpeach-harness', 'profile')
    mkdirSync(profileShareDir, { recursive: true })
    const repoProfileYaml = paths.repositoryRoot !== undefined
      ? join(paths.repositoryRoot, 'apps', 'desktop', 'resources', 'xpeach.profile.yml')
      : undefined
    const profileContent = repoProfileYaml !== undefined && existsSync(repoProfileYaml)
      ? readFileSync(repoProfileYaml, 'utf8')
      : defaultProfileYaml()
    writeFileSync(join(profileShareDir, 'xpeach.profile.yml'), profileContent, 'utf8')

    writeExecutableScript(
      join(scriptsProfile, 'preinstall'),
      ['#!/bin/sh', 'mkdir -p "$HOME/.xph/profiles/xpeach" "$HOME/.xph/skills" "$HOME/.xph/sessions"', 'exit 0', ''].join('\n'),
    )
    writeExecutableScript(
      join(scriptsProfile, 'postinstall'),
      [
        '#!/bin/sh',
        'mkdir -p "$HOME/.xph/profiles/xpeach" "$HOME/.xph/skills" "$HOME/.xph/sessions"',
        'PROFILE_SRC="/usr/local/share/xpeach-harness/profile/xpeach.profile.yml"',
        'if [ ! -f "$PROFILE_SRC" ] && [ -f "$HOME/usr/local/share/xpeach-harness/profile/xpeach.profile.yml" ]; then',
        '  PROFILE_SRC="$HOME/usr/local/share/xpeach-harness/profile/xpeach.profile.yml"',
        'fi',
        'if [ -f "$PROFILE_SRC" ] && [ ! -f "$HOME/.xph/profiles/xpeach/cordis.yml" ]; then',
        '  cp "$PROFILE_SRC" "$HOME/.xph/profiles/xpeach/cordis.yml" 2>/dev/null || true',
        'fi',
        `printf '{"version":"${paths.version}","installedAt":"%s","appPath":"%s/Applications/XPeach Harness.app","xphCliPath":"%s/.local/bin/xph"}\\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$HOME" "$HOME" > "$HOME/.xph/xpeach.install-receipt.json" 2>/dev/null || true`,
        'exit 0',
        '',
      ].join('\n'),
    )

    execFileSync(
      '/usr/bin/pkgbuild',
      [
        '--root',
        rootProfile,
        '--scripts',
        scriptsProfile,
        '--identifier',
        'com.xpeach.harness.profile',
        '--version',
        paths.version,
        '--install-location',
        '/',
        join(pkgsDir, 'xpeach-profile.pkg'),
      ],
      { stdio: 'pipe', env: { ...process.env, COPYFILE_DISABLE: '1' } },
    )

    // Distribution & localized HTML resources
    for (const kind of ['welcome', 'readme', 'conclusion'] as const) {
      const zhHtml = buildGuidedHtmlPage(kind, 'zh_CN', paths.version)
      const enHtml = buildGuidedHtmlPage(kind, 'en', paths.version)
      writeFileSync(join(resourcesDir, 'zh_CN.lproj', `${kind}.html`), zhHtml, 'utf8')
      writeFileSync(join(resourcesDir, 'en.lproj', `${kind}.html`), enHtml, 'utf8')
      writeFileSync(join(resourcesDir, `${kind}.html`), zhHtml, 'utf8')
    }

    const distributionXmlPath = join(stageDir, 'distribution.xml')
    writeFileSync(distributionXmlPath, buildDistributionXml(paths.version), 'utf8')

    mkdirSync(dirname(paths.pkgPath), { recursive: true })
    if (existsSync(paths.pkgPath)) {
      rmSync(paths.pkgPath, { force: true })
    }

    execFileSync(
      '/usr/bin/productbuild',
      [
        '--distribution',
        distributionXmlPath,
        '--resources',
        resourcesDir,
        '--package-path',
        pkgsDir,
        paths.pkgPath,
      ],
      { stdio: 'pipe', env: { ...process.env, COPYFILE_DISABLE: '1' } },
    )

    const payloadFilesOut = execFileSync('/usr/sbin/pkgutil', ['--payload-files', paths.pkgPath], {
      encoding: 'utf8',
    }).trim()
    let volInfoOut = ''
    try {
      volInfoOut = execFileSync('/usr/sbin/installer', ['-pkg', paths.pkgPath, '-volinfo'], {
        encoding: 'utf8',
      }).trim()
    } catch (_err) { /* volinfo optional on restricted environments */ }

    const verifyOutput = [
      `pkg: ${paths.pkgPath}`,
      volInfoOut.length > 0 ? `volumes:\n${volInfoOut}` : '',
      `payload:\n${payloadFilesOut}`,
    ]
      .filter(section => section.length > 0)
      .join('\n\n')

    return {
      pkgPath: paths.pkgPath,
      verifyOutput,
      status: inspectMacosInstallerStatus(options),
    }
  } finally {
    rmSync(stageDir, { recursive: true, force: true })
  }
}

function appendShellPathIfMissing(rcFilePath: string): void {
  const marker = '# XPeach Harness CLI'
  let existing = ''
  if (existsSync(rcFilePath)) {
    try { existing = readFileSync(rcFilePath, 'utf8') } catch (_err) { return }
  }
  if (existing.includes(marker)) return
  const addition = `${existing.endsWith('\n') || existing.length === 0 ? '' : '\n'}${marker}\nexport PATH="$HOME/.local/bin:$PATH"\n`
  try {
    writeFileSync(rcFilePath, existing + addition, 'utf8')
  } catch (_err) { /* ignore read-only rc files */ }
}

/**
 * Execute a macOS `.pkg` installer action:
 * - `'build'`: build and verify the 5-step guided `.pkg` archive.
 * - `'open'`: build if missing and launch macOS `Installer.app` GUI.
 * - `'reveal'`: build if missing and reveal the `.pkg` in Finder.
 * - `'install-direct'`: build if missing, install `XPeach Harness.app`, `xph`,
 *   and `~/.xph` profile, then verify `--version` on all installed binaries.
 *
 * @param action - Installer action to run (`'build'`, `'open'`, `'reveal'`, or `'install-direct'`).
 * @param options - Optional directory and version overrides.
 * @returns Structured action outcome, updated status, and verification log.
 */
export async function runMacosInstallerAction(
  action: XPeachMacosInstallerActionRequest['action'],
  options: MacosInstallerOptions = {},
): Promise<XPeachMacosInstallerActionResult> {
  if (process.platform !== 'darwin') {
    const status = inspectMacosInstallerStatus(options)
    return {
      ok: false,
      action,
      message: 'macOS .pkg guided installer is only supported on macOS (darwin).',
      status,
    }
  }

  const paths = resolveInstallerPaths(options)

  if (action === 'build') {
    const built = await buildMacosPkgInstaller(options)
    return {
      ok: true,
      action,
      message: `Built macOS guided installer: ${built.pkgPath}`,
      status: built.status,
      verifyOutput: built.verifyOutput,
    }
  }

  let verifyOutput: string | undefined
  if (!existsSync(paths.pkgPath)) {
    const built = await buildMacosPkgInstaller(options)
    verifyOutput = built.verifyOutput
  }

  if (action === 'open') {
    execFileSync('/usr/bin/open', ['-a', '/System/Library/CoreServices/Installer.app', paths.pkgPath], {
      stdio: 'ignore',
    })
    return {
      ok: true,
      action,
      message: `Launched macOS Installer.app for ${paths.pkgPath}`,
      status: inspectMacosInstallerStatus(options),
      ...(verifyOutput !== undefined ? { verifyOutput } : {}),
    }
  }

  if (action === 'reveal') {
    execFileSync('/usr/bin/open', ['-R', paths.pkgPath], {
      stdio: 'ignore',
    })
    return {
      ok: true,
      action,
      message: `Revealed ${paths.pkgPath} in Finder`,
      status: inspectMacosInstallerStatus(options),
      ...(verifyOutput !== undefined ? { verifyOutput } : {}),
    }
  }

  // 'install-direct'
  const userAppBundle = join(paths.userApplicationsDir, APP_BUNDLE_NAME)
  materializeAppBundle(userAppBundle, paths.version, paths.repositoryRoot)
  signAndRegisterAppBundle(userAppBundle)

  let installedAppPath = userAppBundle
  if (paths.systemApplicationsDir !== undefined && isWritableDirectory(paths.systemApplicationsDir)) {
    const sysAppBundle = join(paths.systemApplicationsDir, APP_BUNDLE_NAME)
    try {
      materializeAppBundle(sysAppBundle, paths.version, paths.repositoryRoot)
      signAndRegisterAppBundle(sysAppBundle)
      installedAppPath = sysAppBundle
    } catch (_err) { /* keep user Applications bundle */ }
  }

  const xphScript = buildCliWrapperScript(paths.version, paths.repositoryRoot)
  const localXphPath = join(paths.localBinDir, 'xph')
  writeExecutableScript(localXphPath, xphScript)

  if (paths.systemBinDir !== undefined && isWritableDirectory(paths.systemBinDir)) {
    try {
      writeExecutableScript(join(paths.systemBinDir, 'xph'), xphScript)
    } catch (_err) { /* keep ~/.local/bin */ }
  }

  for (const legacyDshPath of [
    join(paths.localBinDir, 'dsh'),
    ...(paths.systemBinDir !== undefined ? [join(paths.systemBinDir, 'dsh')] : []),
  ]) {
    if (existsSync(legacyDshPath)) {
      try {
        if (/xpeach/iu.test(readFileSync(legacyDshPath, 'utf8'))) {
          rmSync(legacyDshPath, { force: true })
        }
      } catch (_err) { /* ignore unreadable or non-removable legacy wrapper */ }
    }
  }

  appendShellPathIfMissing(join(paths.homeDir, '.zprofile'))
  appendShellPathIfMissing(join(paths.homeDir, '.zshrc'))

  const profileDir = join(paths.ownHome, 'profiles', 'xpeach')
  mkdirSync(profileDir, { recursive: true })
  mkdirSync(join(paths.ownHome, 'skills'), { recursive: true })
  mkdirSync(join(paths.ownHome, 'sessions'), { recursive: true })

  const cordisYmlPath = join(profileDir, 'cordis.yml')
  if (!existsSync(cordisYmlPath)) {
    const repoProfileYaml = paths.repositoryRoot !== undefined
      ? join(paths.repositoryRoot, 'apps', 'desktop', 'resources', 'xpeach.profile.yml')
      : undefined
    const profileContent = repoProfileYaml !== undefined && existsSync(repoProfileYaml)
      ? readFileSync(repoProfileYaml, 'utf8')
      : defaultProfileYaml()
    writeFileSync(cordisYmlPath, profileContent, 'utf8')
  }

  const installedAt = new Date().toISOString()
  writeFileSync(
    paths.receiptPath,
    JSON.stringify(
      {
        version: paths.version,
        installedAt,
        pkgPath: paths.pkgPath,
        appPath: installedAppPath,
        xphCliPath: localXphPath,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  )

  const appVersionOut = execFileSync(
    join(installedAppPath, 'Contents', 'MacOS', 'XPeachHarness'),
    ['--version'],
    { encoding: 'utf8' },
  ).trim()
  const xphVersionOut = execFileSync(localXphPath, ['--version'], { encoding: 'utf8' }).trim()

  const combinedVerify = [
    verifyOutput ?? '',
    `app --version: ${appVersionOut}`,
    `xph --version: ${xphVersionOut}`,
  ]
    .filter(line => line.length > 0)
    .join('\n')

  const status = inspectMacosInstallerStatus(options)
  return {
    ok: true,
    action,
    message: `Installed XPeach Harness.app (${appVersionOut}) and ${xphVersionOut}`,
    status,
    verifyOutput: combinedVerify,
  }
}
