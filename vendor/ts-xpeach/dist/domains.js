/**
 * @xpeach/ts-xpeach/domains — 按业务域结构解离的高内聚 SDK 门面。
 *
 * 将底层 352 个生成操作解耦为职责单一的领域子客户端（OIDC、钱包两阶段账本、订单、兑换码、门户、健康探针、内部服务），
 * 同时保留完整底层客户端入口 `raw`，兼顾高可维护性与零协议漂移。
 */
import { XpeachClient } from "./generated/client.js";
import { ResponseFormatError } from "./generated/runtime.js";
import { OidcClient } from "./oidc.js";
export class WalletDomainClient {
    raw;
    constructor(raw) {
        this.raw = raw;
    }
    balance(args, options) {
        return this.raw.walletBalance(args, options);
    }
    lookupReservation(args, options) {
        return this.raw.walletReservationLookup(args, options);
    }
    reserve(args, options) {
        return this.raw.walletReserve(args, options);
    }
    extend(args, options) {
        return this.raw.walletExtend(args, options);
    }
    settle(args, options) {
        return this.raw.walletSettle(args, options);
    }
    release(args, options) {
        return this.raw.walletRelease(args, options);
    }
    adjust(args, options) {
        return this.raw.walletAdjust(args, options);
    }
    refund(args, options) {
        return this.raw.walletRefundSubmit(args, options);
    }
    chargeback(args, options) {
        return this.raw.walletChargebackSubmit(args, options);
    }
    reverse(args, options) {
        return this.raw.walletReverseSubmit(args, options);
    }
    reconciliationDifferences(args, options) {
        return this.raw.walletReconciliationDifferences(args, options);
    }
    /**
     * 标准两阶段预占 -> 结算 / 未派发释放编排助手。
     * 仅当 `work` 明确标记 `{ dispatched: false }` 时才自动执行 `release`；一旦已向下游派发而结果未知，绝不盲目自动释放。
     */
    async withReservation(reserveArgs, work, options) {
        const reservation = await this.reserve(reserveArgs, options);
        const reservationId = reservation.reservation_id?.trim() ?? "";
        if (!reservationId) {
            throw new ResponseFormatError("钱包预占成功响应缺少 reservation_id");
        }
        const decision = await work(reservation);
        if (decision.kind === "abort_undispatched") {
            await this.release({
                idempotencyKey: decision.releaseIdempotencyKey,
                body: {
                    reservation_id: reservationId,
                    ...(decision.reason !== undefined ? { reason: decision.reason } : {}),
                },
            }, options);
            throw decision.error;
        }
        const settlement = await this.settle({
            idempotencyKey: decision.outcome.settleIdempotencyKey,
            body: {
                reservation_id: reservationId,
                actual_units: decision.outcome.actualUnits,
                usage_evidence: decision.outcome.usageEvidence,
                ...(decision.outcome.cost !== undefined ? { cost: decision.outcome.cost } : {}),
            },
        }, options);
        return { reservation, settlement, result: decision.outcome.result };
    }
}
export class OrdersDomainClient {
    raw;
    constructor(raw) {
        this.raw = raw;
    }
    list(args, options) {
        return this.raw.orderList(args, options);
    }
    create(args, options) {
        return this.raw.orderCreate(args, options);
    }
}
export class CdkDomainClient {
    raw;
    constructor(raw) {
        this.raw = raw;
    }
    redeem(args, options) {
        return this.raw.cdkRedeem(args, options);
    }
    closureRedeem(args, options) {
        return this.raw.cdkClosureRedeem(args, options);
    }
    entitlements(options) {
        return this.raw.cdkClosureEntitlements(options);
    }
}
export class PortalDomainClient {
    raw;
    constructor(raw) {
        this.raw = raw;
    }
    me(options) {
        return this.raw.portalMe(options);
    }
    updateMe(args, options) {
        return this.raw.portalMePatch(args, options);
    }
    sessions(options) {
        return this.raw.portalSessions(options);
    }
    revokeSession(args, options) {
        return this.raw.portalSessionRevoke(args, options);
    }
    revokeOtherSessions(args, options) {
        return this.raw.portalSessionsRevokeOthers(args, options);
    }
    deviceInfo(args, options) {
        return this.raw.portalDeviceInfo(args, options);
    }
    approveDevice(args, options) {
        return this.raw.portalDeviceApprove(args, options);
    }
    denyDevice(args, options) {
        return this.raw.portalDeviceDeny(args, options);
    }
    sites(options) {
        return this.raw.portalSites(options);
    }
}
export class HealthDomainClient {
    raw;
    constructor(raw) {
        this.raw = raw;
    }
    live(options) {
        return this.raw.healthLive(options);
    }
    ready(options) {
        return this.raw.healthReady(options);
    }
    clientIp(options) {
        return this.raw.healthClientIp(options);
    }
}
export class InternalDomainClient {
    raw;
    constructor(raw) {
        this.raw = raw;
    }
    verifyBearer(options) {
        return this.raw.v1InternalVerify(options);
    }
    walReport(args, options) {
        return this.raw.walCenterReport(args, options);
    }
    walAck(args, options) {
        return this.raw.walCenterAck(args, options);
    }
}
export class XpeachSdk {
    raw;
    wallet;
    orders;
    cdk;
    portal;
    health;
    internal;
    baseConfig;
    constructor(config) {
        this.baseConfig = config;
        this.raw = new XpeachClient(config);
        this.wallet = new WalletDomainClient(this.raw);
        this.orders = new OrdersDomainClient(this.raw);
        this.cdk = new CdkDomainClient(this.raw);
        this.portal = new PortalDomainClient(this.raw);
        this.health = new HealthDomainClient(this.raw);
        this.internal = new InternalDomainClient(this.raw);
    }
    /** 创建与当前 SDK 传输配置对齐的强类型 OIDC 客户端。 */
    createOidcClient(options) {
        return new OidcClient({
            baseUrl: this.baseConfig.baseUrl,
            ...(this.baseConfig.fetch ? { fetch: this.baseConfig.fetch } : {}),
            ...(this.baseConfig.timeoutMs !== undefined ? { timeoutMs: this.baseConfig.timeoutMs } : {}),
            ...(this.baseConfig.retry ? { retry: this.baseConfig.retry } : {}),
            ...(this.baseConfig.sleep ? { sleep: this.baseConfig.sleep } : {}),
            ...options,
        });
    }
}
export function createXpeachSdk(config) {
    return new XpeachSdk(config);
}
