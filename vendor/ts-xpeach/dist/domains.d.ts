/**
 * @xpeach/ts-xpeach/domains — 按业务域结构解离的高内聚 SDK 门面。
 *
 * 将底层 352 个生成操作解耦为职责单一的领域子客户端（OIDC、钱包两阶段账本、订单、兑换码、门户、健康探针、内部服务），
 * 同时保留完整底层客户端入口 `raw`，兼顾高可维护性与零协议漂移。
 */
import { XpeachClient } from "./generated/client.js";
import type * as C from "./generated/client.js";
import { type ClientConfig, type RequestOptions } from "./generated/runtime.js";
import type * as T from "./generated/types.js";
import { CaptchaClient } from "./captcha.js";
import { OidcClient, type OidcClientOptions } from "./oidc.js";
export interface TwoPhaseExecutionOutcome<TResult> {
    readonly result: TResult;
    readonly actualUnits: T.NonNegQuota;
    readonly usageEvidence: T.JsonObject;
    readonly settleIdempotencyKey: string;
    readonly cost?: T.SettleRequestCost;
}
export declare class WalletDomainClient {
    private readonly raw;
    constructor(raw: XpeachClient);
    balance(args: C.WalletBalanceArgs, options?: RequestOptions): Promise<T.WalletBalance>;
    lookupReservation(args: C.WalletReservationLookupArgs, options?: RequestOptions): Promise<T.ReservationResult>;
    reserve(args: C.WalletReserveArgs, options?: RequestOptions): Promise<T.ReservationResult>;
    extend(args: C.WalletExtendArgs, options?: RequestOptions): Promise<T.ReservationResult>;
    settle(args: C.WalletSettleArgs, options?: RequestOptions): Promise<T.ReservationResult>;
    release(args: C.WalletReleaseArgs, options?: RequestOptions): Promise<T.ReservationResult>;
    adjust(args: C.WalletAdjustArgs, options?: RequestOptions): Promise<T.WalletCorrectionResult>;
    refund(args: C.WalletRefundSubmitArgs, options?: RequestOptions): Promise<T.WalletCorrectionResult>;
    chargeback(args: C.WalletChargebackSubmitArgs, options?: RequestOptions): Promise<T.WalletCorrectionResult>;
    reverse(args: C.WalletReverseSubmitArgs, options?: RequestOptions): Promise<T.WalletCorrectionResult>;
    reconciliationDifferences(args?: C.WalletReconciliationDifferencesArgs, options?: RequestOptions): Promise<T.ReconciliationDifferences>;
    /**
     * 标准两阶段预占 -> 结算 / 未派发释放编排助手。
     * 仅当 `work` 明确标记 `{ dispatched: false }` 时才自动执行 `release`；一旦已向下游派发而结果未知，绝不盲目自动释放。
     */
    withReservation<TResult>(reserveArgs: C.WalletReserveArgs, work: (reservation: T.ReservationResult) => Promise<{
        readonly kind: "settle";
        readonly outcome: TwoPhaseExecutionOutcome<TResult>;
    } | {
        readonly kind: "abort_undispatched";
        readonly releaseIdempotencyKey: string;
        readonly reason?: string;
        readonly error: unknown;
    }>, options?: RequestOptions): Promise<{
        readonly reservation: T.ReservationResult;
        readonly settlement: T.ReservationResult;
        readonly result: TResult;
    }>;
}
export declare class OrdersDomainClient {
    private readonly raw;
    constructor(raw: XpeachClient);
    list(args?: C.OrderListArgs, options?: RequestOptions): Promise<T.OrderListResponse>;
    create(args: C.OrderCreateArgs, options?: RequestOptions): Promise<T.Order>;
}
export declare class CdkDomainClient {
    private readonly raw;
    constructor(raw: XpeachClient);
    redeem(args: C.CdkRedeemArgs, options?: RequestOptions): Promise<T.CdkClosureReceipt>;
    closureRedeem(args: C.CdkClosureRedeemArgs, options?: RequestOptions): Promise<T.CdkClosureReceipt>;
    entitlements(options?: RequestOptions): Promise<T.CdkClosureEntitlements>;
}
export declare class PortalDomainClient {
    private readonly raw;
    constructor(raw: XpeachClient);
    me(options?: RequestOptions): Promise<T.PortalUser>;
    updateMe(args: C.PortalMePatchArgs, options?: RequestOptions): Promise<T.PortalUser>;
    sessions(options?: RequestOptions): Promise<T.PortalSessionList>;
    revokeSession(args: C.PortalSessionRevokeArgs, options?: RequestOptions): Promise<T.OkResult>;
    revokeOtherSessions(args?: C.PortalSessionsRevokeOthersArgs, options?: RequestOptions): Promise<T.PortalRevokeSessionsResult>;
    deviceInfo(args: C.PortalDeviceInfoArgs, options?: RequestOptions): Promise<T.DeviceCodeInfo>;
    approveDevice(args: C.PortalDeviceApproveArgs, options?: RequestOptions): Promise<T.OkResult>;
    denyDevice(args: C.PortalDeviceDenyArgs, options?: RequestOptions): Promise<T.OkResult>;
    sites(options?: RequestOptions): Promise<T.PortalSiteList>;
}
export declare class HealthDomainClient {
    private readonly raw;
    constructor(raw: XpeachClient);
    live(options?: RequestOptions): Promise<T.CenterHealthReport>;
    ready(options?: RequestOptions): Promise<T.CenterHealthReport>;
    clientIp(options?: RequestOptions): Promise<T.CenterClientIp>;
}
export declare class InternalDomainClient {
    private readonly raw;
    constructor(raw: XpeachClient);
    verifyBearer(options?: RequestOptions): Promise<T.LegacyInternalVerifyResponse>;
    walReport(args: C.WalCenterReportArgs, options?: RequestOptions): Promise<T.WalCenterDecision>;
    walAck(args: C.WalCenterAckArgs, options?: RequestOptions): Promise<T.WalCenterAckReceipt>;
}
export declare class XpeachSdk {
    readonly raw: XpeachClient;
    readonly wallet: WalletDomainClient;
    readonly orders: OrdersDomainClient;
    readonly cdk: CdkDomainClient;
    readonly portal: PortalDomainClient;
    readonly health: HealthDomainClient;
    readonly internal: InternalDomainClient;
    readonly captcha: CaptchaClient;
    private readonly baseConfig;
    constructor(config: ClientConfig);
    /** 创建与当前 SDK 传输配置对齐的强类型 OIDC 客户端。 */
    createOidcClient(options: Omit<OidcClientOptions, "baseUrl" | "fetch" | "timeoutMs" | "retry" | "sleep">): OidcClient;
}
export declare function createXpeachSdk(config: ClientConfig): XpeachSdk;
