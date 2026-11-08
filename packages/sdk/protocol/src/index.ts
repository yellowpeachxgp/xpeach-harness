/**
 * Shared wire protocol for the DeepSeek Harness SDK runtime: the
 * newline-delimited JSON-RPC stdio transport plus the named request, result,
 * and notification types both wire ends speak. The runtime server plugin
 * (`@xpeach/xph-sdk-jsonrpc-server`) serves this protocol; SDK clients
 * (`@xpeach/xph-sdk-client`, the Python SDK) drive it.
 *
 * @module @xpeach/xph-sdk-protocol
 */

export { JsonRpcLineTransport, JsonRpcResponseError } from './transport.ts'
export type { JsonRpcTransportPeer } from './transport.ts'
export type {
  CommandExecution,
  HarnessSdkHostRequestMap,
  HarnessSdkNotificationMap,
  HarnessSdkRequestMap,
  InitializeParams,
  InitializeResult,
  SdkEncodedImageBlock,
  SdkPromptContentBlock,
  SdkRunStatus,
  SdkUserQuestionAnswer,
  SdkUserQuestionCancelled,
  SdkUserQuestionRequest,
  SdkUserQuestionResult,
  SessionEventNotification,
  SessionQueryParams,
  SessionQueryResult,
  SessionStatusNotification,
  SessionPromptParams,
  SessionPromptResult,
  SessionResumeParams,
  SessionWaitParams,
  SessionWorkingDirectoryParams,
  SessionWorkingDirectorySetParams,
  SessionWorkingDirectoryResult,
  SubagentFinishedNotification,
  SubagentStartedNotification,
} from './types.ts'
