/** Explicit exceptions and Host packages for the published dependency policy. */

/** Packages treated as Client/Host packages without declaring `dsh.client`. */
const CLIENT_FACE_INCLUDE: readonly string[] = []

/** Packages exempted from automatic Client/Host treatment despite declaring `dsh.client`. */
const CLIENT_FACE_EXCLUDE: readonly string[] = [
  '@xpeach/xph-api-session-controller',
  '@xpeach/xph-api-workspace-controller',
]

/** Host-only packages whose peer relays are deliberately flattened. */
const HOST_DEPENDENCY_PACKAGES: readonly string[] = [
  '@xpeach/xph-llm',
  '@xpeach/xph-session',
]

/** Required Cordis services whose Host imports are type-only. */
const REQUIRED_SERVICE_PEERS = {
  '@xpeach/xph-api-terminal-controller': ['@xpeach/xph-subprocess'],
} as const satisfies Readonly<Record<string, readonly string[]>>

/** Development-only package relationships not represented by source imports. */
const CONFIGURATION_ONLY_DEV_DEPENDENCIES = {
  '@xpeach/xph-client-locale': ['@xpeach/xph-api-remotes'],
  '@xpeach/xph-client-ui-conversation': [
    '@xpeach/xph-api-remotes',
    '@xpeach/xph-client-ui-workspace',
  ],
  '@xpeach/xph-client-ui-model-selection': ['@xpeach/xph-client-ui-input-trigger'],
  '@xpeach/xph-client-ui-sidebar': ['@xpeach/xph-client-ui-workspace'],
  '@xpeach/xph-client-ui-subagent': ['@xpeach/xph-client-ui-input-trigger'],
  '@xpeach/xph-client-ui-theme': ['@xpeach/xph-api-remotes'],
  '@xpeach/xph-client-ui-tool': ['@xpeach/xph-api-remotes'],
} as const satisfies Readonly<Record<string, readonly string[]>>

/** Workspace packages whose complete runtime surface is safe across duplicate installations. */
const DUPLICATE_SAFE_PACKAGES: readonly string[] = [
  '@xpeach/xph-brand',
  '@xpeach/xph-lazy-require',
  '@xpeach/xph-typert-protocol',
  '@xpeach/xph-util-code-language',
  '@xpeach/xph-util-crypto',
  '@xpeach/xph-util-values',
]

/**
 * Runtime exports whose values remain valid when npm installs another package copy.
 * New entries are forbidden by default. Automated agents must not add an
 * exception; every addition requires explicit human review and a dedicated,
 * prominent heading in the pull request description.
 */
const SAFE_HOST_DEPENDENCY_EXPORTS = {
  '@xpeach/xph-credentials': ['credentialKey'],
  '@xpeach/xph-deque': ['Deque'],
  '@xpeach/xph-llm': ['callConfigEquals'],
  '@xpeach/xph-session-format': ['sessionFormatLogFilename'],
  '@xpeach/xph-timeout': ['MAX_TIMER_DELAY_MS'],
  '@xpeach/xph-schemastery': ['default'],
} as const satisfies HostDependencyExports

/** Runtime exports that require every consumer to resolve the provider's shared peer instance. */
const PEER_REQUIRED_HOST_EXPORTS = {
  // Profile settings must match the installed Node provider's configuration schema.
  '@xpeach/xph-ptc-runtime-node/configuration': ['resolvePersistentExecution'],
  // `instanceof` checks need the translator's own class instance.
  '@xpeach/xph-experimental-translator': ['TranslationError'],
  '@xpeach/xph-scope': ['carrierKeyOf', 'createScope', 'scopeOf', 'scopeTarget'],
  '@xpeach/xph-session': ['SESSION_FORMAT_VERSION'],
  '@xpeach/xph-session-persistence': ['SessionPersistenceNotFoundError'],
} as const satisfies HostDependencyExports

/** Exact import specifier to reviewed runtime exports. */
type HostDependencyExports = Readonly<Record<string, readonly string[]>>

/** Complete configurable input to package dependency classification. */
export interface PackageDependencyPolicy {
  readonly clientFaceInclude: readonly string[]
  readonly clientFaceExclude: readonly string[]
  readonly hostPackages: readonly string[]
  readonly requiredServicePeers?: Readonly<Record<string, readonly string[]>>
  readonly configurationOnlyDevDependencies: Readonly<Record<string, readonly string[]>>
  readonly duplicateSafePackages?: readonly string[]
  readonly safeHostDependencyExports: HostDependencyExports
  readonly peerRequiredHostExports: HostDependencyExports
}

/** Repository dependency policy consumed by verification and benchmarking. */
export const PACKAGE_DEPENDENCY_POLICY: PackageDependencyPolicy = {
  clientFaceInclude: CLIENT_FACE_INCLUDE,
  clientFaceExclude: CLIENT_FACE_EXCLUDE,
  hostPackages: HOST_DEPENDENCY_PACKAGES,
  requiredServicePeers: REQUIRED_SERVICE_PEERS,
  configurationOnlyDevDependencies: CONFIGURATION_ONLY_DEV_DEPENDENCIES,
  duplicateSafePackages: DUPLICATE_SAFE_PACKAGES,
  safeHostDependencyExports: SAFE_HOST_DEPENDENCY_EXPORTS,
  peerRequiredHostExports: PEER_REQUIRED_HOST_EXPORTS,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whether a package manifest declares a dynamically loaded Client entry. */
export function hasClientDeclaration(dshField: unknown): boolean {
  return isRecord(dshField) && Object.hasOwn(dshField, 'client')
}
