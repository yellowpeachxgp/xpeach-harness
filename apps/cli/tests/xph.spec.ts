/**
 * Unit tests for `apps/cli/src/xph.ts` argument normalization (`normalizeXphArgv`)
 * and `~/.xph` profile/credential bootstrap (`ensureXpeachProfile`).
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseDshArgs } from '../src/args.ts'
import { ensureXpeachProfile, normalizeXphArgv } from '../src/xph.ts'

describe('normalizeXphArgv', () => {
  it('passes bare help and version flags through without prepending --profile xpeach', () => {
    expect(normalizeXphArgv(['-h'])).toEqual(['-h'])
    expect(normalizeXphArgv(['--help'])).toEqual(['--help'])
    expect(normalizeXphArgv(['-V'])).toEqual(['-V'])
    expect(normalizeXphArgv(['--version'])).toEqual(['--version'])
    expect(normalizeXphArgv(['-h', '--version'])).toEqual(['-h', '--version'])
  })

  it('defaults empty argv and positional web shorthand to --profile xpeach', () => {
    expect(normalizeXphArgv([])).toEqual(['--profile', 'xpeach'])
    expect(normalizeXphArgv(['web'])).toEqual(['--profile', 'xpeach'])
    expect(normalizeXphArgv(['web', '--port', '4123', '--no-open'])).toEqual([
      '--profile',
      'xpeach',
      '--port',
      '4123',
      '--no-open',
    ])
    expect(normalizeXphArgv(['--port', '4123', 'web'])).toEqual([
      '--profile',
      'xpeach',
      '--port',
      '4123',
    ])
  })

  it('expands positional headless, acp, and sdk profile shorthands when --profile is omitted', () => {
    expect(normalizeXphArgv(['headless', 'solve task'])).toEqual(['--profile', 'headless', 'solve task'])
    expect(normalizeXphArgv(['acp'])).toEqual(['--profile', 'acp'])
    expect(normalizeXphArgv(['sdk', '--cwd', '/tmp'])).toEqual(['--profile', 'sdk', '--cwd', '/tmp'])

    const headlessCmd = parseDshArgs(normalizeXphArgv(['headless', 'solve task']), '1.0.0')
    expect(headlessCmd).toEqual({
      mode: 'profile',
      profile: 'headless',
      patches: [],
      args: ['solve task'],
    })
  })

  it('inserts --profile xpeach immediately after plugin subcommand when --profile is omitted', () => {
    expect(normalizeXphArgv(['plugin', 'list'])).toEqual(['plugin', '--profile', 'xpeach', 'list'])
    expect(normalizeXphArgv(['plugin', 'install', '@xpeach/xph-demo'])).toEqual([
      'plugin',
      '--profile',
      'xpeach',
      'install',
      '@xpeach/xph-demo',
    ])
    expect(normalizeXphArgv(['plugin', '-h'])).toEqual(['plugin', '--profile', 'xpeach', '-h'])

    const pluginCmd = parseDshArgs(normalizeXphArgv(['plugin', 'list']), '1.0.0')
    expect(pluginCmd).toEqual({
      mode: 'plugin',
      profile: 'xpeach',
      args: ['list'],
    })
  })

  it('preserves explicit --profile and -p flags across profile and plugin commands', () => {
    expect(normalizeXphArgv(['--profile', 'headless', 'task'])).toEqual(['--profile', 'headless', 'task'])
    expect(normalizeXphArgv(['-p', 'headless', 'task'])).toEqual(['--profile', 'headless', 'task'])
    expect(normalizeXphArgv(['--profile=sdk'])).toEqual(['--profile=sdk'])
    expect(normalizeXphArgv(['-p=acp'])).toEqual(['--profile=acp'])
    expect(normalizeXphArgv(['plugin', '--profile', 'web', 'list'])).toEqual(['plugin', '--profile', 'web', 'list'])
  })
})

describe('ensureXpeachProfile', () => {
  const tempDirs: string[] = []

  function makeTempHome(): string {
    const dir = mkdtempSync(join(tmpdir(), 'xph-cli-test-'))
    tempDirs.push(dir)
    return dir
  }

  afterEach(() => {
    vi.unstubAllEnvs()
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('seeds ~/.xph/profiles/xpeach with cordis.patch.yml and sets XPH_PRODUCT and XPH_HOME', async () => {
    const home = makeTempHome()
    vi.stubEnv('XPH_HOME', home)
    vi.stubEnv('DSH_HOME', '')
    delete process.env.DSH_HOME
    delete process.env.XPEACH_RELAY_KEY
    delete process.env.XPEACH_API_KEY

    const profileDir = await ensureXpeachProfile(home)
    expect(profileDir).toBe(join(home, 'profiles', 'xpeach'))
    expect(process.env.XPH_PRODUCT).toBe('1')
    expect(process.env.XPH_HOME).toBe(home)
    expect(process.env.DSH_HOME).toBe(home)

    const patchPath = join(profileDir, 'cordis.patch.yml')
    expect(existsSync(patchPath)).toBe(true)
    const patchContent = readFileSync(patchPath, 'utf8')
    expect(patchContent).toContain('@xpeach/xph-account')
    expect(patchContent).toContain('@xpeach/xph-client-ui')
  })

  it('loads xpeach.key into XPEACH_RELAY_KEY and XPEACH_API_KEY when XPEACH_RELAY_KEY is unset', async () => {
    const home = makeTempHome()
    const profileDir = join(home, 'profiles', 'xpeach')
    mkdirSync(profileDir, { recursive: true })
    writeFileSync(join(profileDir, 'xpeach.key'), '  sk-xpeach-test-12345 \n', 'utf8')

    vi.stubEnv('XPH_HOME', home)
    delete process.env.XPEACH_RELAY_KEY
    delete process.env.XPEACH_API_KEY

    await ensureXpeachProfile(home)
    expect(process.env.XPEACH_RELAY_KEY).toBe('sk-xpeach-test-12345')
    expect(process.env.XPEACH_API_KEY).toBe('sk-xpeach-test-12345')
  })

  it('rewrites legacy @deepseek-ai/dsh-* references in existing cordis.patch.yml and package.json', async () => {
    const home = makeTempHome()
    const profileDir = join(home, 'profiles', 'xpeach')
    mkdirSync(profileDir, { recursive: true })
    writeFileSync(
      join(profileDir, 'package.json'),
      JSON.stringify({
        name: 'dsh-profile',
        private: true,
        dependencies: {
          '@deepseek-ai/dsh-web-app': '0.0.1',
          '@xpeach/xph-web-app': '0.3.21',
        },
      }),
      'utf8',
    )
    writeFileSync(
      join(profileDir, 'cordis.patch.yml'),
      [
        '- insert:',
        '    - id: xpeach-account',
        "      name: '@deepseek-ai/dsh-xpeach-account'",
        '    - id: xpeach-client',
        "      name: '@deepseek-ai/dsh-client-ui-xpeach'",
        '- id: locale',
        '  name: "@deepseek-ai/dsh-client-locale"',
        '',
      ].join('\n'),
      'utf8',
    )

    vi.stubEnv('XPH_HOME', home)
    await ensureXpeachProfile(home)

    const updatedManifest = JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
    }
    expect(updatedManifest.dependencies).not.toHaveProperty('@deepseek-ai/dsh-web-app')
    expect(updatedManifest.dependencies).toHaveProperty('@xpeach/xph-web-app')

    const updatedPatch = readFileSync(join(profileDir, 'cordis.patch.yml'), 'utf8')
    expect(updatedPatch).toContain("name: '@xpeach/xph-account'")
    expect(updatedPatch).toContain("name: '@xpeach/xph-client-ui'")
    expect(updatedPatch).toContain('name: "@xpeach/xph-client-locale"')
    expect(updatedPatch).not.toContain('@deepseek-ai/')
  })
})
