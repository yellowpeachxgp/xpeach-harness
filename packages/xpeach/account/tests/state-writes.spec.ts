/**
 * Regression coverage for the fresh-install activation failure.
 *
 * A new install has no profile directory, and every state file the account
 * service owns lives inside it. A bare writeFileSync therefore threw ENOENT
 * from the constructor, so the plugin never activated and onboarding step 2
 * reported "active Service xpeachAccount is unavailable".
 */

import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { XPeachAccount } from '../src/index.ts'

const roots: string[] = []

/** A profile directory that does not exist yet, as on a fresh install. */
function freshProfile(): string {
  const root = mkdtempSync(join(tmpdir(), 'xph-account-fresh-'))
  roots.push(root)
  return join(root, 'profiles', 'xpeach')
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

/** Reach the private writer without constructing the whole cordis service. */
function writeState(path: string, body: string): void {
  const prototype = XPeachAccount.prototype as unknown as Record<string, (path: string, body: string) => void>
  const writer = prototype.writeState
  if (typeof writer !== 'function') throw new Error('XPeachAccount.writeState is missing')
  writer.call({}, path, body)
}

describe('account state writes on a fresh install', () => {
  it('creates the profile directory instead of failing with ENOENT', () => {
    const profile = freshProfile()
    const marker = join(profile, 'xpeach.key.seeded')

    expect(() => writeState(marker, '')).not.toThrow()
    expect(readFileSync(marker, 'utf8')).toBe('')
  })

  it('creates nested directories for the admin and session files', () => {
    const profile = freshProfile()
    const nested = join(profile, 'state', 'xpeach.admin')

    writeState(nested, 'token\n')
    expect(readFileSync(nested, 'utf8')).toBe('token\n')
  })

  it('writes state files readable only by the owner', () => {
    const profile = freshProfile()
    const marker = join(profile, 'xpeach.key')

    writeState(marker, 'sk-test\n')
    expect(statSync(marker).mode & 0o777).toBe(0o600)
  })

  it('overwrites an existing file without disturbing its directory', () => {
    const profile = freshProfile()
    const marker = join(profile, 'xpeach.key')

    writeState(marker, 'first\n')
    writeState(marker, 'second\n')
    expect(readFileSync(marker, 'utf8')).toBe('second\n')
  })
})
