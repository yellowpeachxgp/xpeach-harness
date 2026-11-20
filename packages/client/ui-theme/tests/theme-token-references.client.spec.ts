/** Theme token reference gate: every --dsw-* and --ds-* custom property referenced in package CSS must exist. */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { packageStylesheets, parseRules, varReferences } from './stylesheet-scan.ts'

const stylesDir = fileURLToPath(new URL('../src/styles', import.meta.url))
const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url))

const globalThemeTokens = new Set(
  readdirSync(stylesDir)
    .filter(name => name.endsWith('.css'))
    .flatMap(name => parseRules(readFileSync(join(stylesDir, name), 'utf8')))
    .flatMap(rule => rule.declarations)
    .map(([property]) => property)
    .filter(property => property.startsWith('--')),
)

/**
 * Find `--dsw-*` or `--ds-*` references in `css` that are defined neither by `ui-theme` nor locally.
 * @param css - Component stylesheet text.
 * @param defined - Global theme token set.
 * @returns Missing token diagnostics in source order.
 */
function undefinedThemeReferences(css: string, defined: ReadonlySet<string>): string[] {
  const rules = parseRules(css)
  const localTokens = new Set(
    rules.flatMap(rule => rule.declarations).map(([property]) => property).filter(property => property.startsWith('--')),
  )
  return rules.flatMap(rule =>
    rule.declarations.flatMap(([property, value]) =>
      varReferences(value)
        .filter(name => (name.startsWith('--dsw-') || name.startsWith('--ds-')) && !defined.has(name) && !localTokens.has(name))
        .map(name => `${rule.selectors.join(', ')} { ${property}: ${value} } -> ${name}`),
    ),
  )
}

describe('theme token references', () => {
  it('rejects misspelled or absent --dsw-* and --ds-* variables while allowing defined and local ones', () => {
    expect(undefinedThemeReferences('.btn { color: var(--dsw-alias-label-missing); }', globalThemeTokens)).toHaveLength(1)
    expect(undefinedThemeReferences('.code { font-family: var(--ds-font-missing); }', globalThemeTokens)).toHaveLength(1)
    expect(undefinedThemeReferences('.btn { color: var(--dsw-alias-label-primary); font-family: var(--ds-font-family-code); }', globalThemeTokens)).toEqual([])
    expect(undefinedThemeReferences('.box { --dsw-local-gap: 4px; gap: var(--dsw-local-gap); }', globalThemeTokens)).toEqual([])
  })

  it('resolves every --dsw-* and --ds-* reference across all package stylesheets', () => {
    const files = packageStylesheets()
    expect(files.length).toBeGreaterThan(0)
    const missing = files.flatMap(file =>
      undefinedThemeReferences(readFileSync(file, 'utf8'), globalThemeTokens)
        .map(entry => `${relative(repoRoot, file).replaceAll('\\', '/')}: ${entry}`),
    )
    expect(missing).toEqual([])
  })
})
