import { defineConfig } from 'tsdown'

/** Bundle the private vendored XPeach SDK into the Host runtime entry. */
export default defineConfig(({ env }) => env?.DSH_BUILD_FACE === 'client' ? [] : [{
  entry: ['lib/types/index.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  deps: { alwaysBundle: [/^@xpeach\/ts-xpeach(?:\/|$)/] },
  outputOptions: { inlineDynamicImports: true },
}])
