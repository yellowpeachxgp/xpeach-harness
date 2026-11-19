import { type ClientConfig, type RequestOptions } from "./generated/runtime.js";
import type * as T from "./generated/types.js";
export interface PkcePair {
    readonly codeVerifier: string;
    readonly codeChallenge: string;
    readonly codeChallengeMethod: "S256";
}
export interface AuthorizationUrlInput {
    readonly baseUrl: string;
    readonly clientId: string;
    readonly redirectUri: string;
    readonly scope?: string;
    readonly state: string;
    readonly nonce?: string;
    readonly codeChallenge?: string;
    readonly codeChallengeMethod?: "S256";
    readonly prompt?: string;
    readonly loginHint?: string;
    readonly tenantSlug?: string;
}
export interface AuthorizationCallbackResult {
    readonly code: string;
    readonly state: string;
    readonly iss?: string;
}
export declare class OAuthCallbackError extends Error {
    readonly error: string;
    readonly errorDescription: string | undefined;
    readonly state: string | undefined;
    constructor(error: string, errorDescription?: string, state?: string);
}
export interface OidcClientOptions {
    readonly baseUrl: string;
    readonly clientId: string;
    readonly clientSecret?: string;
    readonly clientAuthMethod?: "client_secret_basic" | "client_secret_post" | "none";
    readonly tenantSlug?: string;
    readonly fetch?: ClientConfig["fetch"];
    readonly timeoutMs?: number;
    readonly retry?: ClientConfig["retry"];
    readonly sleep?: ClientConfig["sleep"];
    readonly jwksCacheTtlMs?: number;
}
export interface ExchangeCodeParams {
    readonly code: string;
    readonly redirectUri: string;
    readonly codeVerifier?: string;
    readonly expectedNonce?: string;
    readonly verifyIdToken?: boolean;
}
export interface RefreshTokenParams {
    readonly refreshToken: string;
    readonly scope?: string;
}
export interface DeviceAuthorizationParams {
    readonly scope?: string;
}
export interface DeviceFlowHandle {
    readonly deviceCode: string;
    readonly userCode: string;
    readonly verificationUri: string;
    readonly verificationUriComplete: string | undefined;
    readonly expiresIn: number;
    readonly intervalSeconds: number;
}
export interface PollDeviceTokenParams {
    readonly deviceCode: string;
    readonly intervalSeconds?: number;
    readonly expiresInSeconds?: number;
    readonly onPending?: (attempt: number, nextIntervalSeconds: number) => void;
}
export interface RevokeTokenParams {
    readonly token: string;
    readonly tokenTypeHint?: "access_token" | "refresh_token";
}
export interface IdTokenClaims {
    readonly iss: string;
    readonly sub: string;
    readonly aud: string | readonly string[];
    readonly exp: number;
    readonly iat: number;
    readonly authTime?: number;
    readonly nonce?: string;
    readonly email?: string;
    readonly emailVerified?: boolean;
    readonly preferredUsername?: string;
    readonly name?: string;
    readonly raw: Readonly<Record<string, unknown>>;
}
export interface VerifiedAccessIdentity {
    readonly active: true;
    readonly format: "jwt" | "opaque";
    readonly sub: string;
    readonly username: string | null;
    readonly email: string | null;
    readonly emailVerified: boolean;
    readonly name: string | null;
    readonly group: string;
    readonly affCode: string;
    readonly tenantId: string;
    readonly tenantSlug: string | null;
    readonly issuer?: string;
    readonly clientId: string;
    readonly scope: string;
    readonly roles: readonly string[];
    readonly exp: number;
}
export interface OidcTokenSet {
    readonly accessToken: string;
    readonly tokenType: string;
    readonly expiresIn: number;
    readonly expiresAt: number;
    readonly refreshToken?: string;
    readonly idToken?: string;
    readonly scope?: string;
    readonly idTokenClaims?: IdTokenClaims;
}
export interface OidcStoredSession {
    readonly accessToken: string;
    readonly tokenType: string;
    readonly expiresAt: number;
    readonly refreshToken?: string;
    readonly idToken?: string;
    readonly scope?: string;
    readonly identity?: VerifiedAccessIdentity;
    readonly updatedAt: number;
}
export interface OidcSessionStore {
    load(): Promise<OidcStoredSession | null> | OidcStoredSession | null;
    save(session: OidcStoredSession): Promise<void> | void;
    clear(): Promise<void> | void;
}
export interface OidcSessionManagerOptions {
    readonly oidc: OidcClient;
    readonly store: OidcSessionStore;
    /** 距离过期提前刷新的安全窗口（毫秒），默认 60_000ms。 */
    readonly refreshSkewMs?: number;
    readonly now?: () => number;
}
export declare function randomUrlSafeString(byteLength?: number): string;
export declare function generateCodeVerifier(byteLength?: number): string;
export declare function generateState(byteLength?: number): string;
export declare function generateNonce(byteLength?: number): string;
export declare function computeS256Challenge(codeVerifier: string): Promise<string>;
export declare function createPkcePair(byteLength?: number): Promise<PkcePair>;
export declare function buildAuthorizationUrl(input: AuthorizationUrlInput): string;
export declare function parseAuthorizationCallback(callbackUrlOrQuery: string | URL | URLSearchParams, expectedState: string, expectedIssuer?: string): AuthorizationCallbackResult;
/** 判断异常是否属于令牌已被服务端明确拒绝/吊销/失效（而非网络抖动或 5xx）。 */
export declare function isDefinitiveTokenRejection(error: unknown): boolean;
export declare class OidcClient {
    readonly baseUrl: string;
    readonly clientId: string;
    readonly tenantSlug: string | undefined;
    private readonly clientSecret;
    private readonly authMethod;
    private readonly baseTransportConfig;
    private readonly jwksCacheTtlMs;
    private readonly forcedJwksCooldownMs;
    private cachedJwks;
    private lastForcedJwksRefreshAt;
    private inflightForcedJwks;
    constructor(options: OidcClientOptions);
    get issuer(): string;
    private publicSdk;
    private oauthFormSdk;
    private bearerSdk;
    buildAuthorizationUrl(params: Omit<AuthorizationUrlInput, "baseUrl" | "clientId" | "tenantSlug">): string;
    discover(options?: RequestOptions): Promise<T.OidcDiscoveryDocument>;
    fetchJwks(forceRefresh?: boolean, options?: RequestOptions): Promise<readonly Record<string, unknown>[]>;
    private refreshJwksOnUnknownKid;
    verifyIdToken(idToken: string, opts?: {
        expectedNonce?: string;
        clockSkewSeconds?: number;
        nowSeconds?: number;
    }, requestOptions?: RequestOptions): Promise<IdTokenClaims>;
    private submitTokenForm;
    private normalizeTokenResponse;
    exchangeAuthorizationCode(params: ExchangeCodeParams, options?: RequestOptions): Promise<OidcTokenSet>;
    refreshToken(params: RefreshTokenParams, options?: RequestOptions): Promise<OidcTokenSet>;
    startDeviceAuthorization(params?: DeviceAuthorizationParams, options?: RequestOptions): Promise<DeviceFlowHandle>;
    pollDeviceToken(params: PollDeviceTokenParams, options?: RequestOptions): Promise<OidcTokenSet>;
    revokeToken(params: RevokeTokenParams, options?: RequestOptions): Promise<void>;
    /** 调用 SSO 权威令牌校验端点（同时支持 RS256 at+jwt 与 xph_at_ 不透明令牌）。 */
    verifyAccessToken(accessToken: string, options?: RequestOptions): Promise<VerifiedAccessIdentity>;
}
/**
 * 单飞（Single-Flight）OIDC 会话管理器：
 * - 自动在令牌临期前通过 refresh_token 静默轮换；
 * - 严格区分 `invalid_grant` / `401` 吊销与网络抖动，瞬态故障绝不误删本地会话。
 */
export declare class OidcSessionManager {
    private readonly oidc;
    private readonly store;
    private readonly refreshSkewMs;
    private readonly now;
    private inflightRefresh;
    constructor(options: OidcSessionManagerOptions);
    saveFromTokenSet(tokenSet: OidcTokenSet, verifyIdentity?: boolean, options?: RequestOptions): Promise<OidcStoredSession>;
    getValidSession(options?: RequestOptions & {
        forceRefresh?: boolean;
    }): Promise<OidcStoredSession | null>;
    private performRefresh;
    logout(options?: RequestOptions): Promise<void>;
}
