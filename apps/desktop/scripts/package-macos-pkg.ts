/**
 * Build, verify, and optionally install or open the macOS native `.pkg` guided
 * installer for XPeach Harness (`XPeach Harness.app` + `xph` & `dsh` CLI + `~/.xph`).
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildMacosPkgInstaller,
  runMacosInstallerAction,
  type MacosInstallerOptions,
} from '../../../packages/xpeach/account/src/macos-installer.ts'

interface CliFlags {
  readonly open: boolean
  readonly install: boolean
  readonly verify: boolean
  readonly outputPkgPath: string | undefined
}

function parseFlags(argv: readonly string[]): CliFlags {
  let open = false
  let install = false
  let verify = false
  let outputPkgPath: string | undefined
  const baseDir = process.env.INIT_CWD ?? process.cwd()

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--open') {
      open = true
    } else if (arg === '--install' || arg === '--install-direct') {
      install = true
    } else if (arg === '--verify') {
      verify = true
    } else if (arg === '--output' && argv[i + 1] !== undefined) {
      outputPkgPath = resolve(baseDir, argv[i + 1]!)
      i++
    } else if (arg !== undefined && arg.startsWith('--output=')) {
      outputPkgPath = resolve(baseDir, arg.slice('--output='.length))
    }
  }

  return { open, install, verify, outputPkgPath }
}

/**
 * Run the macOS `.pkg` guided installer packaging script from CLI flags.
 *
 * @param argv - Command-line arguments after the script name.
 * @returns A promise that resolves when packaging and optional actions complete.
 */
export async function runPackageMacosPkgCli(argv: readonly string[] = process.argv.slice(2)): Promise<void> {
  const flags = parseFlags(argv)
  const repoRoot = resolve(import.meta.dirname, '..', '..', '..')
  const options: MacosInstallerOptions = {
    repositoryRoot: repoRoot,
    ...(flags.outputPkgPath !== undefined ? { outputPkgPath: flags.outputPkgPath } : {}),
  }

  const built = await buildMacosPkgInstaller(options)
  console.log(`[xpeach-pkg] Built macOS guided installer: ${built.pkgPath} (${String(built.status.pkgSizeBytes)} bytes)`)
  if (flags.verify || (!flags.install && !flags.open)) {
    console.log(built.verifyOutput)
  }

  if (flags.install) {
    const res = await runMacosInstallerAction('install-direct', options)
    console.log(`[xpeach-pkg] ${res.message}`)
    if (res.verifyOutput !== undefined) {
      console.log(res.verifyOutput)
    }
  }

  if (flags.open) {
    const res = await runMacosInstallerAction('open', options)
    console.log(`[xpeach-pkg] ${res.message}`)
  }
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  void runPackageMacosPkgCli().catch((err: unknown) => {
    console.error('[xpeach-pkg] Failed:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  })
}
