/** Platform-neutral assembly of generated Host Remote contributions. */

import type { Context } from '@xpeach/xph-cordis'
import productAnalyticsRemote from '@xpeach/xph-client-product-analytics/remote'
export type {} from '@xpeach/xph-client-product-analytics/remote'
import agentPresetsRemote from '@xpeach/xph-agent-preset-registry/remote'
import userQuestionsRemote from '@xpeach/xph-user-questions/remote'
import commandsRemote from '@xpeach/xph-commands/remote'
import accountRemote from '@xpeach/xph-api-account-controller/remote'
import settingsControllerRemote from '@xpeach/xph-api-settings-controller/remote'
import officeToPdfRemote from '@xpeach/xph-office-to-pdf/remote'
import goalsRemote from '@xpeach/xph-goal/remote'
import scheduleRemote from '@xpeach/xph-schedule/remote'
import llmRemote from '@xpeach/xph-llm/remote'
import dynamicRemote from '@xpeach/xph-cordis-host-runner/remote'
import pluginManagerRemote from '@xpeach/xph-plugin-manager/remote'
import toolResultsRemote from '@xpeach/xph-client-ui-trajectory/remote'
import pluginRegistryProbeRemote from '@xpeach/xph-client-ui-plugin-manager/remote'
import pluginMarketRemote from '@xpeach/xph-plugin-market/remote'
import pluginInventoryRemote from '@xpeach/xph-host-plugin-inventory/remote'
import messageFeedbackRemote from '@xpeach/xph-message-feedback/remote'
import permissionPresetsRemote from '@xpeach/xph-permission-presets/remote'
import sessionFeedbackRemote from '@xpeach/xph-command-feedback/remote'
import fileUploadsRemote from '@xpeach/xph-client-file-upload/remote'
import sessionReferencesRemote from '@xpeach/xph-session-reference/remote'
import subagentsRemote from '@xpeach/xph-subagent/remote'
import sessionRemote from '@xpeach/xph-api-session-controller/remote'
import jobRemote from '@xpeach/xph-api-job-controller/remote'
import workspaceRemote from '@xpeach/xph-api-workspace-controller/remote'
import terminalRemote from '@xpeach/xph-api-terminal-controller/remote'
import workspaceFilesRemote from '@xpeach/xph-api-workspace-files/remote'
import type { ClientRemote } from '@xpeach/xph-api-gateway/client'

export type { ClientRemote } from '@xpeach/xph-api-gateway/client'
export type {
  BundleInfo, BundleRowInfo, ChangeResult, IncompatiblePlugin, InspectOptions, InstallBundleOptions, InstallSpecKind, ManagementError,
  PackageResult,
  PluginChange, PluginEntryId, PluginInfo, PluginInspectProblem, PluginInstallCancellation, PluginInstallFailureKind,
  PluginInstallLogChunk, PluginInstallProgress, PluginInstallRequestId, PluginRegistries, PluginSpecInspection,
  ReadOnlyReason, Registry, RestartReason,
} from '@xpeach/xph-plugin-manager/types'
export type {} from '@xpeach/xph-plugin-manager/remote'
export type {} from '@xpeach/xph-client-ui-plugin-manager/remote'
export type {} from '@xpeach/xph-client-ui-trajectory/remote'
export type {} from '@xpeach/xph-plugin-market/remote'
export type {
  MarketCompatibility, MarketIndexSummary, MarketInstallation, MarketInstallationStatus, MarketListingEntry, MarketListingVersion,
  MarketQuery, MarketSearchResult, MarketSort,
} from '@xpeach/xph-plugin-market/types'
export type { PluginInventorySnapshot } from '@xpeach/xph-host-plugin-inventory/types'
export type {} from '@xpeach/xph-agent-preset-registry/remote'
export type {} from '@xpeach/xph-user-questions/remote'
export type {} from '@xpeach/xph-commands/remote'
export type {} from '@xpeach/xph-api-settings-controller/remote'
export type {} from '@xpeach/xph-api-account-controller/remote'
export type {} from '@xpeach/xph-goal/remote'
export type {} from '@xpeach/xph-schedule/remote'
export type {} from '@xpeach/xph-office-to-pdf/remote'
export type {} from '@xpeach/xph-llm/remote'
export type {} from '@xpeach/xph-host-plugin-inventory/remote'
export type {} from '@xpeach/xph-message-feedback/remote'
export type {} from '@xpeach/xph-permission-presets/remote'
export type {} from '@xpeach/xph-command-feedback/remote'
export type {} from '@xpeach/xph-client-file-upload/remote'
export type {} from '@xpeach/xph-session-reference/remote'
export type {} from '@xpeach/xph-subagent/remote'
export type * from '@xpeach/xph-subagent/client'
export type {} from '@xpeach/xph-api-session-controller/remote'
export type * from '@xpeach/xph-api-session-controller/types'
export type {} from '@xpeach/xph-api-job-controller/remote'
export type * from '@xpeach/xph-api-job-controller/types'
export type {} from '@xpeach/xph-api-workspace-controller/remote'
export type * from '@xpeach/xph-api-workspace-controller/types'
export type {} from '@xpeach/xph-api-workspace-files/remote'
export type * from '@xpeach/xph-api-workspace-files/types'
export type {} from '@xpeach/xph-api-terminal-controller/remote'
export type * from '@xpeach/xph-api-terminal-controller/types'
// The forwarded-event allowlist's selection seat: without it in the consumer's
// compilation face `TypertRemoteEvent` is `never` and every `$on` call fails.
export type { ApiRemoteForwardedEvent } from '../types.ts'
// The owner packages' client-safe `./types` exports supply the `Events`
// signatures `$on` hands to a listener, so a consumer reads the very
// declaration the Host emits rather than a flattened restatement of it.
export type {} from '@xpeach/xph-commands/types'
export type {} from '@xpeach/xph-cordis-host-runner/types'
export type {} from '@xpeach/xph-credentials/types'
export type {} from '@xpeach/xph-llm/types'
export type {} from '@xpeach/xph-agent-preset-registry/types'
export type {} from '@xpeach/xph-permission-presets/types'
export type {} from '@xpeach/xph-settings/types'
export type {} from '@xpeach/xph-user-approval/types'
export type {} from '@xpeach/xph-user-questions/types'
export type {} from '@xpeach/xph-api-session-controller/types'

/**
 * The carrier's Client-facing types, re-exported so a business package names one
 * assembly package instead of both this facade and the Connection plugin. Type-only:
 * the carrier's runtime values stay behind their own module edge.
 */
export type {
  ConnectionHandle, ConnectionSinks, ContentBlock,
  MessageId,
  RpcId, RpcRequest, RpcResponse, RpcResult, SessionId,
  StreamChunk,
} from '@xpeach/xph-client-connection/client'
export type {} from '@xpeach/xph-api-gateway/client'
export type {} from '@xpeach/xph-cordis-host-runner/remote'

// The payload vocabulary of the selected namespaces, re-exported so a Client
// contribution can name what it sends and receives without importing a Host
// package: this assembly is the one place both planes legitimately meet.
export type {
  ApprovalRequestId,
  CordisHalfState,
  CordisDynamicPackageId,
  CordisDynamicPluginId,
  CordisDynamicPluginRunId,
  CordisDynamicRunMode,
  CordisInspectMethodManifest,
  CordisInspectPlatform,
  CordisInspectProviderManifest,
  CordisInspectProviderView,
  CordisInspectQueryRequest,
  CordisInspectQueryResolution,
  CordisInspectQueryResolved,
  CordisInspectRequestId,
  CordisInspectResolveAck,
  CordisRunDiagnostic,
  CordisRunStatus,
  DynamicCordisClientSource,
  DynamicCordisHostHalfResult,
  DynamicCordisInventoryRow,
  DynamicCordisInvokeResult,
  DynamicCordisPackage,
  DynamicCordisRequestResolved,
  DynamicCordisResolveAck,
  DynamicCordisRetracted,
  DynamicCordisRunRequest,
  DynamicCordisRunResolution,
  DynamicCordisRunAttempt,
  DynamicCordisRunResponse,
  DynamicCordisStopResponse,
  DynamicCordisUndefineReceipt,
  RequestRunOutcome,
} from '@xpeach/xph-cordis-host-runner/types'
// Credential state vocabulary for the credentials namespace (values never ride it).
export type { CredentialInfo } from '@xpeach/xph-credentials/types'
// Redacted namespace vocabulary for the settings namespace (secrets never ride
// it). It travels with its seam, whose `./types` the Client face already reads.
export type {
  SettingsDescribeValue, SettingsNamespaceView, SettingsPathOpView, SettingsSecretView,
} from '@xpeach/xph-settings/types'
// Provider registry and discovery vocabulary for the llm namespace.
export type {
  LlmConfigurableProvider, LlmDiscoveredModel,
  LlmModelDiscoveryRequest, LlmNativeAuth, LlmProviderInfo,
} from '@xpeach/xph-llm/types'
// Reference-discovery result vocabulary for the fileReferences and
// sessionReferenceResolver namespaces.
export type { FileReferenceCandidate } from '@xpeach/xph-file-reference/types'
export type { SessionReferenceMentionCandidate } from '@xpeach/xph-session-reference/types'

// The Remote failure vocabulary, re-exported so business packages keep naming
// this assembly alone. Types only: a value export would make spec imports load
// this module's owner /remote artifacts; specs take RemoteError from
// dsh-client-test-runtime instead.
export type {
  RemoteErrorCode, RemoteErrorDetailsMap, RemoteFailure, RemoteResult,
} from '@xpeach/xph-typert-protocol'
export type { RemoteHostFacts } from '@xpeach/xph-api-gateway/client'

declare module '@xpeach/xph-cordis' {
  interface Context {
    /** Generated Remote namespaces selected by this Client assembly. */
    remote: ClientRemote
  }
}

/** Required service: the typed Client Remote contribution mount. */
export const inject = ['remote']

/**
 * Mount the Host capabilities explicitly selected for this Client assembly.
 * @param ctx - Client Cordis root carrying the typed API service.
 * @returns disposer after every selected Remote namespace is ready.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const disposers: Array<() => Promise<void>> = []
  try {
    for (const contribution of [
      productAnalyticsRemote, agentPresetsRemote, commandsRemote, settingsControllerRemote, accountRemote,
      goalsRemote, llmRemote, dynamicRemote, scheduleRemote,
      pluginInventoryRemote, pluginManagerRemote, pluginMarketRemote, pluginRegistryProbeRemote, toolResultsRemote,
      messageFeedbackRemote, sessionFeedbackRemote,
      fileUploadsRemote, sessionReferencesRemote,
      permissionPresetsRemote, subagentsRemote, sessionRemote, jobRemote, workspaceRemote, workspaceFilesRemote, terminalRemote,
      officeToPdfRemote, userQuestionsRemote,
    ]) {
      disposers.push(await ctx.remote.$mount(contribution))
    }
  } catch (error) {
    for (const dispose of disposers.reverse()) await dispose()
    throw error
  }
  // Unwound in reverse mount order, so a namespace never outlives one mounted
  // after it.
  return async () => {
    for (const dispose of disposers.reverse()) await dispose()
  }
}
