import { describe, expect, it } from 'vitest'
import { builtDeclarationPath } from './doc-typecheck-paths.ts'

describe('builtDeclarationPath', () => {
  it('maps package source directories and exact entry files to built declarations', () => {
    expect(builtDeclarationPath('./packages/*/*/src')).toBe('./packages/*/*/lib/types')
    expect(builtDeclarationPath('./packages/core/session/src/index.ts'))
      .toBe('./packages/core/session/lib/types/index.d.ts')
    expect(builtDeclarationPath('./packages/core/session/src/types.ts'))
      .toBe('./packages/core/session/lib/types/types.d.ts')
    expect(builtDeclarationPath('./packages/experimental/claude-code-mods/examples/*'))
      .toBe('./packages/experimental/claude-code-mods/examples/*')
    expect(builtDeclarationPath('./packages/api/account-controller/lib/typert.host.d.ts'))
      .toBe('./packages/api/account-controller/lib/typert.host.d.ts')
    expect(builtDeclarationPath('./packages/bundle/acp-app/cordis.patch.yml'))
      .toBe('./packages/bundle/acp-app/cordis.patch.yml')
  })

  it('rejects aliases without a supported source target', () => {
    expect(() => builtDeclarationPath('./packages/core/session/source/index.ts'))
      .toThrow('cannot map workspace source path')
  })
})
