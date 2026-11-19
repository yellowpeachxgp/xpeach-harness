/**
 * @xpeach/ts-xpeach/oidc — XPeach 统一 OIDC / PKCE / RFC8628 设备流 / 令牌会话管理模块。
 *
 * 所有底层 HTTP 协议交互全部通过正式生成的 XpeachClient 执行，不引入任何裸网络调用，
 * 同时基于标准 WebCrypto 实现 PKCE S256 与 RS256 ID Token JWKS 验签，兼容 Node 22+ 与现代浏览器。
 */
import { XpeachClient } from "./generated/client.js";
import { DeclaredResponseError, OAuthProtocolError, ProblemError, ResponseFormatError, TransportError, } from "./generated/runtime.js";
export class OAuthCallbackError extends Error {
    error;
    errorDescription;
    state;
    constructor(error, errorDescription, state) {
        super(errorDescription ? `${error}: ${errorDescription}` : error);
        this.name = "OAuthCallbackError";
        this.error = error;
        this.errorDescription = errorDescription;
        this.state = state;
    }
}
function getWebCrypto() {
    const cryptoObj = globalThis.crypto;
    if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function" || !cryptoObj.subtle) {
        throw new ResponseFormatError("当前运行环境缺少标准 WebCrypto API");
    }
    return cryptoObj;
}
function base64UrlEncode(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function base64UrlDecode(input) {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLen);
    let binary;
    try {
        binary = atob(padded);
    }
    catch {
        throw new ResponseFormatError("JWT Base64URL 段格式无效");
    }
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        out[i] = binary.charCodeAt(i);
    }
    return out;
}
export function randomUrlSafeString(byteLength = 32) {
    if (!Number.isInteger(byteLength) || byteLength < 16 || byteLength > 96) {
        throw new ResponseFormatError("随机安全参数字节数必须在 16 到 96 之间");
    }
    const bytes = new Uint8Array(byteLength);
    getWebCrypto().getRandomValues(bytes);
    return base64UrlEncode(bytes);
}
export function generateCodeVerifier(byteLength = 32) {
    return randomUrlSafeString(byteLength);
}
export function generateState(byteLength = 24) {
    return randomUrlSafeString(byteLength);
}
export function generateNonce(byteLength = 24) {
    return randomUrlSafeString(byteLength);
}
export async function computeS256Challenge(codeVerifier) {
    if (codeVerifier.length < 43 || codeVerifier.length > 128 || !/^[A-Za-z0-9._~-]+$/.test(codeVerifier)) {
        throw new ResponseFormatError("PKCE code_verifier 长度或字符集不符合 RFC7636");
    }
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await getWebCrypto().subtle.digest("SHA-256", data);
    return base64UrlEncode(new Uint8Array(digest));
}
export async function createPkcePair(byteLength = 32) {
    const codeVerifier = generateCodeVerifier(byteLength);
    const codeChallenge = await computeS256Challenge(codeVerifier);
    return { codeVerifier, codeChallenge, codeChallengeMethod: "S256" };
}
function normalizeOrigin(baseUrl) {
    let parsed;
    try {
        parsed = new URL(baseUrl);
    }
    catch {
        throw new ResponseFormatError("OIDC 站点地址必须是合法绝对 URL");
    }
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.username || parsed.password || parsed.search || parsed.hash) {
        throw new ResponseFormatError("OIDC 站点地址不能包含凭据、查询串或片段");
    }
    const trimmedPath = parsed.pathname.replace(/\/+$/, "");
    if (trimmedPath !== "") {
        throw new ResponseFormatError("OIDC baseUrl 必须为纯 origin（租户路径请通过 tenantSlug 传入）");
    }
    return parsed.origin;
}
export function buildAuthorizationUrl(input) {
    const origin = normalizeOrigin(input.baseUrl);
    if (!input.clientId.trim())
        throw new ResponseFormatError("OIDC clientId 不能为空");
    if (!input.redirectUri.trim())
        throw new ResponseFormatError("OIDC redirectUri 不能为空");
    if (!input.state.trim())
        throw new ResponseFormatError("OIDC state 不能为空");
    let redirectParsed;
    try {
        redirectParsed = new URL(input.redirectUri);
    }
    catch {
        throw new ResponseFormatError("OIDC redirectUri 必须是合法绝对 URL");
    }
    if (redirectParsed.hash) {
        throw new ResponseFormatError("OIDC redirectUri 不允许包含 fragment");
    }
    const authPath = input.tenantSlug ? `/t/${encodeURIComponent(input.tenantSlug)}/auth` : "/auth";
    const url = new URL(authPath, origin);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", input.clientId);
    url.searchParams.set("redirect_uri", input.redirectUri);
    url.searchParams.set("scope", input.scope ?? "openid profile email offline_access");
    url.searchParams.set("state", input.state);
    if (input.nonce)
        url.searchParams.set("nonce", input.nonce);
    if (input.codeChallenge) {
        url.searchParams.set("code_challenge", input.codeChallenge);
        url.searchParams.set("code_challenge_method", input.codeChallengeMethod ?? "S256");
    }
    if (input.prompt)
        url.searchParams.set("prompt", input.prompt);
    if (input.loginHint)
        url.searchParams.set("login_hint", input.loginHint);
    return url.toString();
}
function constantTimeEqual(a, b) {
    const bytesA = new TextEncoder().encode(a);
    const bytesB = new TextEncoder().encode(b);
    const maxLen = Math.max(bytesA.length, bytesB.length);
    let diff = bytesA.length ^ bytesB.length;
    for (let i = 0; i < maxLen; i++) {
        diff |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
    }
    return diff === 0;
}
function validateIssuerUrl(rawIss) {
    const trimmed = rawIss.trim();
    if (!trimmed) {
        throw new ResponseFormatError("OIDC 授权回调 iss 参数不能为空");
    }
    let parsed;
    try {
        parsed = new URL(trimmed);
    }
    catch {
        throw new ResponseFormatError("OIDC 授权回调 iss 参数不是合法绝对 URL");
    }
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
        parsed.username ||
        parsed.password ||
        parsed.search ||
        parsed.hash) {
        throw new ResponseFormatError("OIDC 授权回调 iss 参数格式无效");
    }
    return trimmed.replace(/\/+$/, "");
}
async function sleepWithAbort(ms, signal, customSleep) {
    if (signal?.aborted) {
        throw new TransportError("设备授权轮询已取消");
    }
    if (!signal) {
        if (customSleep) {
            await customSleep(ms);
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, ms));
        return;
    }
    await new Promise((resolve, reject) => {
        let settled = false;
        let timer;
        const onAbort = () => {
            if (settled)
                return;
            settled = true;
            if (timer !== undefined)
                clearTimeout(timer);
            reject(new TransportError("设备授权轮询已取消"));
        };
        signal.addEventListener("abort", onAbort, { once: true });
        if (customSleep) {
            void customSleep(ms).then(() => {
                if (settled)
                    return;
                settled = true;
                signal.removeEventListener("abort", onAbort);
                resolve();
            }, (err) => {
                if (settled)
                    return;
                settled = true;
                signal.removeEventListener("abort", onAbort);
                reject(err);
            });
        }
        else {
            timer = setTimeout(() => {
                if (settled)
                    return;
                settled = true;
                signal.removeEventListener("abort", onAbort);
                resolve();
            }, ms);
        }
    });
}
export function parseAuthorizationCallback(callbackUrlOrQuery, expectedState, expectedIssuer) {
    if (!expectedState.trim()) {
        throw new ResponseFormatError("OIDC 回调校验必须提供非空 expectedState");
    }
    let params;
    try {
        params =
            callbackUrlOrQuery instanceof URLSearchParams
                ? callbackUrlOrQuery
                : callbackUrlOrQuery instanceof URL
                    ? callbackUrlOrQuery.searchParams
                    : callbackUrlOrQuery.startsWith("?")
                        ? new URLSearchParams(callbackUrlOrQuery.slice(1))
                        : callbackUrlOrQuery.includes("://")
                            ? new URL(callbackUrlOrQuery).searchParams
                            : new URL(callbackUrlOrQuery, "http://127.0.0.1").searchParams;
    }
    catch {
        throw new ResponseFormatError("OIDC 回调 URL 格式无效");
    }
    let validatedIss;
    if (params.has("iss")) {
        const normalizedIss = validateIssuerUrl(params.get("iss") ?? "");
        if (expectedIssuer !== undefined && expectedIssuer.trim() !== "") {
            const normalizedExpected = expectedIssuer.trim().replace(/\/+$/, "");
            if (normalizedIss !== normalizedExpected) {
                throw new ResponseFormatError("OIDC 授权回调 iss 与预期签发方不一致");
            }
        }
        validatedIss = normalizedIss;
    }
    const returnedState = params.get("state") ?? undefined;
    const oauthErr = params.get("error");
    if (oauthErr) {
        if (!returnedState || !constantTimeEqual(returnedState, expectedState)) {
            throw new ResponseFormatError("OIDC 错误回调 state 不匹配，拒绝采信");
        }
        throw new OAuthCallbackError(oauthErr, params.get("error_description") ?? undefined, returnedState);
    }
    if (!returnedState || !constantTimeEqual(returnedState, expectedState)) {
        throw new ResponseFormatError("OIDC 授权回调 state 不匹配");
    }
    const code = params.get("code")?.trim() ?? "";
    if (!code) {
        throw new ResponseFormatError("OIDC 授权回调缺少 code");
    }
    return {
        code,
        state: returnedState,
        ...(validatedIss !== undefined ? { iss: validatedIss } : {}),
    };
}
/** 判断异常是否属于令牌已被服务端明确拒绝/吊销/失效（而非网络抖动或 5xx）。 */
export function isDefinitiveTokenRejection(error) {
    if (error instanceof OAuthProtocolError) {
        return error.error === "invalid_grant" || error.error === "invalid_token" || error.error === "unauthorized_client";
    }
    if (error instanceof DeclaredResponseError) {
        return error.httpStatus === 401 && error.operationId === "v1_internal_verify";
    }
    if (error instanceof ProblemError) {
        return error.httpStatus === 401;
    }
    return false;
}
function parseJsonRecord(bytes, label) {
    let parsed;
    try {
        parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    }
    catch {
        throw new ResponseFormatError(`${label} 不是合法 UTF-8 JSON`);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new ResponseFormatError(`${label} 必须是 JSON 对象`);
    }
    return parsed;
}
export class OidcClient {
    baseUrl;
    clientId;
    tenantSlug;
    clientSecret;
    authMethod;
    baseTransportConfig;
    jwksCacheTtlMs;
    forcedJwksCooldownMs = 15_000;
    cachedJwks = null;
    lastForcedJwksRefreshAt = 0;
    inflightForcedJwks = null;
    constructor(options) {
        this.baseUrl = normalizeOrigin(options.baseUrl);
        if (!options.clientId.trim()) {
            throw new ResponseFormatError("OidcClient clientId 不能为空");
        }
        this.clientId = options.clientId.trim();
        this.clientSecret = options.clientSecret;
        this.tenantSlug = options.tenantSlug?.trim() || undefined;
        this.authMethod =
            options.clientAuthMethod ?? (options.clientSecret ? "client_secret_basic" : "none");
        if (this.authMethod !== "none" && !this.clientSecret) {
            throw new ResponseFormatError("保密客户端认证方式必须提供 clientSecret");
        }
        this.jwksCacheTtlMs = options.jwksCacheTtlMs ?? 300_000;
        this.baseTransportConfig = {
            baseUrl: this.baseUrl,
            ...(options.fetch ? { fetch: options.fetch } : {}),
            ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
            ...(options.retry ? { retry: options.retry } : { retry: { maxAttempts: 1 } }),
            ...(options.sleep ? { sleep: options.sleep } : {}),
        };
    }
    get issuer() {
        return this.tenantSlug ? `${this.baseUrl}/t/${encodeURIComponent(this.tenantSlug)}` : this.baseUrl;
    }
    publicSdk() {
        return new XpeachClient(this.baseTransportConfig);
    }
    oauthFormSdk() {
        if (this.authMethod === "client_secret_basic" && this.clientSecret !== undefined) {
            return {
                sdk: new XpeachClient({
                    ...this.baseTransportConfig,
                    credentials: {
                        oauthClientBasic: { username: this.clientId, password: this.clientSecret },
                    },
                    authentication: ["oauthClientBasic"],
                }),
                formCredentials: {},
            };
        }
        if (this.authMethod === "client_secret_post" && this.clientSecret !== undefined) {
            return {
                sdk: new XpeachClient(this.baseTransportConfig),
                formCredentials: {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                },
            };
        }
        return {
            sdk: new XpeachClient(this.baseTransportConfig),
            formCredentials: {
                client_id: this.clientId,
            },
        };
    }
    bearerSdk(accessToken) {
        const clean = accessToken.trim();
        if (!clean)
            throw new ResponseFormatError("访问令牌不能为空");
        return new XpeachClient({
            ...this.baseTransportConfig,
            accessToken: clean,
            authentication: ["bearerAT"],
        });
    }
    buildAuthorizationUrl(params) {
        return buildAuthorizationUrl({
            ...params,
            baseUrl: this.baseUrl,
            clientId: this.clientId,
            ...(this.tenantSlug ? { tenantSlug: this.tenantSlug } : {}),
        });
    }
    async discover(options) {
        const sdk = this.publicSdk();
        if (this.tenantSlug) {
            return sdk.oidcTenantDiscovery({ slug: this.tenantSlug }, options);
        }
        return sdk.oidcDiscovery(options);
    }
    async fetchJwks(forceRefresh = false, options) {
        const now = Date.now();
        if (!forceRefresh && this.cachedJwks && now - this.cachedJwks.fetchedAt < this.jwksCacheTtlMs) {
            return this.cachedJwks.keys;
        }
        const sdk = this.publicSdk();
        const doc = this.tenantSlug
            ? await sdk.oidcTenantJwks({ slug: this.tenantSlug }, options)
            : await sdk.oidcJwks(options);
        const keys = Array.isArray(doc.keys) ? doc.keys : [];
        this.cachedJwks = { fetchedAt: now, keys };
        return keys;
    }
    async refreshJwksOnUnknownKid(options) {
        if (this.inflightForcedJwks) {
            return this.inflightForcedJwks;
        }
        const now = Date.now();
        if (this.lastForcedJwksRefreshAt > 0 && now - this.lastForcedJwksRefreshAt < this.forcedJwksCooldownMs) {
            return this.cachedJwks?.keys ?? [];
        }
        this.lastForcedJwksRefreshAt = now;
        const task = this.fetchJwks(true, options).finally(() => {
            this.inflightForcedJwks = null;
        });
        this.inflightForcedJwks = task;
        return task;
    }
    async verifyIdToken(idToken, opts, requestOptions) {
        const parts = idToken.split(".");
        if (parts.length !== 3) {
            throw new ResponseFormatError("ID Token 必须为三段式 JWS");
        }
        const header = parseJsonRecord(base64UrlDecode(parts[0]), "ID Token Header");
        if (header.alg !== "RS256") {
            throw new ResponseFormatError(`ID Token 签名算法不受支持：${String(header.alg)}`);
        }
        if (header.typ !== undefined) {
            if (typeof header.typ !== "string") {
                throw new ResponseFormatError("ID Token typ 头格式无效");
            }
            const normalizedTyp = header.typ.trim().toLowerCase();
            if (normalizedTyp === "at+jwt" || normalizedTyp === "application/at+jwt") {
                throw new ResponseFormatError("拒绝将访问令牌 (at+jwt) 作为 ID Token 校验");
            }
        }
        const kid = typeof header.kid === "string" ? header.kid : undefined;
        const isMatchingSigKey = (k) => k.kty === "RSA" &&
            (k.use === undefined || k.use === "" || k.use === "sig") &&
            (!kid || k.kid === kid);
        let keys = await this.fetchJwks(false, requestOptions);
        let jwk = keys.find(isMatchingSigKey);
        if (!jwk) {
            keys = await this.refreshJwksOnUnknownKid(requestOptions);
            jwk = keys.find(isMatchingSigKey);
        }
        if (!jwk || typeof jwk.n !== "string" || typeof jwk.e !== "string") {
            throw new ResponseFormatError("JWKS 中未找到匹配的 RSA 签名公钥");
        }
        const cryptoKey = await getWebCrypto().subtle.importKey("jwk", { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
        const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
        const signature = base64UrlDecode(parts[2]);
        const validSig = await getWebCrypto().subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signature, signingInput);
        if (!validSig) {
            throw new ResponseFormatError("ID Token RS256 签名校验失败");
        }
        const payload = parseJsonRecord(base64UrlDecode(parts[1]), "ID Token Payload");
        const iss = typeof payload.iss === "string" ? payload.iss : "";
        const sub = typeof payload.sub === "string" ? payload.sub : "";
        const exp = typeof payload.exp === "number" ? payload.exp : NaN;
        const iat = typeof payload.iat === "number" ? payload.iat : NaN;
        const rawAud = payload.aud;
        const audList = typeof rawAud === "string"
            ? [rawAud]
            : Array.isArray(rawAud) && rawAud.every((item) => typeof item === "string")
                ? rawAud
                : [];
        if (!iss || iss.replace(/\/+$/, "") !== this.issuer.replace(/\/+$/, "")) {
            throw new ResponseFormatError("ID Token issuer 与预期不一致");
        }
        if (!sub) {
            throw new ResponseFormatError("ID Token 缺少主体标识 sub");
        }
        if (!audList.includes(this.clientId)) {
            throw new ResponseFormatError("ID Token audience 不包含当前 clientId");
        }
        if (audList.length > 1) {
            const azp = typeof payload.azp === "string" ? payload.azp : "";
            if (azp !== this.clientId) {
                throw new ResponseFormatError("多受众 ID Token 缺少匹配的 azp");
            }
        }
        else if (payload.azp !== undefined && payload.azp !== this.clientId) {
            throw new ResponseFormatError("ID Token azp 与当前 clientId 不一致");
        }
        const skew = opts?.clockSkewSeconds ?? 60;
        const nowSec = opts?.nowSeconds ?? Math.floor(Date.now() / 1000);
        if (!Number.isFinite(exp) || nowSec - skew >= exp) {
            throw new ResponseFormatError("ID Token 已过期");
        }
        if (!Number.isFinite(iat) || iat <= 0 || iat > nowSec + skew) {
            throw new ResponseFormatError("ID Token 签发时间异常");
        }
        if (payload.nbf !== undefined) {
            if (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf) || payload.nbf > nowSec + skew) {
                throw new ResponseFormatError("ID Token 尚未生效");
            }
        }
        if (opts?.expectedNonce !== undefined && payload.nonce !== opts.expectedNonce) {
            throw new ResponseFormatError("ID Token nonce 与授权请求不一致");
        }
        return {
            iss,
            sub,
            aud: typeof rawAud === "string" ? rawAud : audList,
            exp,
            iat,
            ...(typeof payload.auth_time === "number" ? { authTime: payload.auth_time } : {}),
            ...(typeof payload.nonce === "string" ? { nonce: payload.nonce } : {}),
            ...(typeof payload.email === "string" ? { email: payload.email } : {}),
            ...(typeof payload.email_verified === "boolean" ? { emailVerified: payload.email_verified } : {}),
            ...(typeof payload.preferred_username === "string" ? { preferredUsername: payload.preferred_username } : {}),
            ...(typeof payload.name === "string" ? { name: payload.name } : {}),
            raw: payload,
        };
    }
    async submitTokenForm(body, options) {
        const { sdk, formCredentials } = this.oauthFormSdk();
        const formBody = { ...formCredentials, ...body };
        if (this.tenantSlug) {
            return sdk.oidcTenantToken({ slug: this.tenantSlug, body: formBody }, options);
        }
        return sdk.oidcToken({ body: formBody }, options);
    }
    normalizeTokenResponse(raw, idTokenClaims) {
        const accessToken = raw.access_token?.trim() ?? "";
        if (!accessToken) {
            throw new ResponseFormatError("OIDC 令牌响应缺少 access_token");
        }
        const expiresIn = typeof raw.expires_in === "number" && raw.expires_in > 0 ? raw.expires_in : 3600;
        return {
            accessToken,
            tokenType: raw.token_type ?? "Bearer",
            expiresIn,
            expiresAt: Date.now() + expiresIn * 1000,
            ...(raw.refresh_token ? { refreshToken: raw.refresh_token } : {}),
            ...(raw.id_token ? { idToken: raw.id_token } : {}),
            ...(raw.scope ? { scope: raw.scope } : {}),
            ...(idTokenClaims ? { idTokenClaims } : {}),
        };
    }
    async exchangeAuthorizationCode(params, options) {
        if (!params.code.trim() || !params.redirectUri.trim()) {
            throw new ResponseFormatError("授权码换取令牌必须提供 code 与 redirectUri");
        }
        if (params.verifyIdToken === false && params.expectedNonce !== undefined) {
            throw new ResponseFormatError("已要求校验 nonce，不允许跳过 ID Token 验签");
        }
        const raw = await this.submitTokenForm({
            grant_type: "authorization_code",
            code: params.code,
            redirect_uri: params.redirectUri,
            ...(params.codeVerifier ? { code_verifier: params.codeVerifier } : {}),
        }, options);
        let claims;
        if (raw.id_token && params.verifyIdToken !== false) {
            claims = await this.verifyIdToken(raw.id_token, params.expectedNonce !== undefined ? { expectedNonce: params.expectedNonce } : undefined, options);
        }
        else if (params.expectedNonce !== undefined && !raw.id_token) {
            throw new ResponseFormatError("已要求校验 nonce，但令牌响应未返回 id_token");
        }
        return this.normalizeTokenResponse(raw, claims);
    }
    async refreshToken(params, options) {
        if (!params.refreshToken.trim()) {
            throw new ResponseFormatError("刷新令牌不能为空");
        }
        const raw = await this.submitTokenForm({
            grant_type: "refresh_token",
            refresh_token: params.refreshToken,
            ...(params.scope ? { scope: params.scope } : {}),
        }, options);
        let claims;
        if (raw.id_token) {
            claims = await this.verifyIdToken(raw.id_token, undefined, options);
        }
        const tokenSet = this.normalizeTokenResponse(raw, claims);
        return {
            ...tokenSet,
            refreshToken: tokenSet.refreshToken ?? params.refreshToken,
        };
    }
    async startDeviceAuthorization(params = {}, options) {
        const { sdk, formCredentials } = this.oauthFormSdk();
        const formBody = {
            ...formCredentials,
            scope: params.scope ?? "openid profile email offline_access",
        };
        const res = this.tenantSlug
            ? await sdk.oidcTenantDeviceAuthorization({ slug: this.tenantSlug, body: formBody }, options)
            : await sdk.oidcDeviceAuthorization({ body: formBody }, options);
        const deviceCode = res.device_code?.trim() ?? "";
        const userCode = res.user_code?.trim() ?? "";
        const verificationUri = res.verification_uri?.trim() ?? "";
        if (!deviceCode || !userCode || !verificationUri) {
            throw new ResponseFormatError("OIDC 设备授权响应缺少必要字段");
        }
        return {
            deviceCode,
            userCode,
            verificationUri,
            verificationUriComplete: res.verification_uri_complete,
            expiresIn: typeof res.expires_in === "number" && res.expires_in > 0 ? res.expires_in : 600,
            intervalSeconds: typeof res.interval === "number" && res.interval > 0 ? res.interval : 5,
        };
    }
    async pollDeviceToken(params, options) {
        if (!params.deviceCode.trim()) {
            throw new ResponseFormatError("设备流轮询必须提供 deviceCode");
        }
        let intervalSeconds = Math.max(1, params.intervalSeconds ?? 5);
        const deadline = Date.now() + Math.max(5, params.expiresInSeconds ?? 600) * 1000;
        const customSleep = this.baseTransportConfig.sleep;
        for (let attempt = 1; Date.now() < deadline; attempt++) {
            if (options?.signal?.aborted) {
                throw new TransportError("设备授权轮询已取消");
            }
            try {
                const raw = await this.submitTokenForm({
                    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                    device_code: params.deviceCode,
                }, options);
                let claims;
                if (raw.id_token) {
                    claims = await this.verifyIdToken(raw.id_token, undefined, options);
                }
                return this.normalizeTokenResponse(raw, claims);
            }
            catch (err) {
                if (err instanceof OAuthProtocolError) {
                    if (err.error === "authorization_pending") {
                        params.onPending?.(attempt, intervalSeconds);
                        await sleepWithAbort(intervalSeconds * 1000, options?.signal, customSleep);
                        continue;
                    }
                    if (err.error === "slow_down") {
                        intervalSeconds += 5;
                        params.onPending?.(attempt, intervalSeconds);
                        await sleepWithAbort(intervalSeconds * 1000, options?.signal, customSleep);
                        continue;
                    }
                }
                throw err;
            }
        }
        throw new OAuthCallbackError("expired_token", "设备授权码已超时，请重新发起登录");
    }
    async revokeToken(params, options) {
        if (!params.token.trim())
            return;
        const { sdk, formCredentials } = this.oauthFormSdk();
        const formBody = {
            ...formCredentials,
            token: params.token,
            ...(params.tokenTypeHint ? { token_type_hint: params.tokenTypeHint } : {}),
        };
        if (this.tenantSlug) {
            await sdk.oidcTenantTokenRevocation({ slug: this.tenantSlug, body: formBody }, options);
            return;
        }
        await sdk.oidcTokenRevocation({ body: formBody }, options);
    }
    /** 调用 SSO 权威令牌校验端点（同时支持 RS256 at+jwt 与 xph_at_ 不透明令牌）。 */
    async verifyAccessToken(accessToken, options) {
        const res = await this.bearerSdk(accessToken).v1InternalVerify(options);
        if (res.issuer && res.issuer.replace(/\/+$/, "") !== this.issuer.replace(/\/+$/, "")) {
            throw new ResponseFormatError("访问令牌 issuer 与当前 OIDC 客户端配置不一致");
        }
        const resolvedTenantSlug = res.tenant_slug ?? null;
        if (this.tenantSlug && resolvedTenantSlug && resolvedTenantSlug !== this.tenantSlug) {
            throw new ResponseFormatError("访问令牌 tenant_slug 与当前 OIDC 客户端配置不一致");
        }
        return {
            active: true,
            format: res.format,
            sub: res.sub,
            username: res.username,
            email: res.email,
            emailVerified: res.email_verified,
            name: res.name,
            group: res.group,
            affCode: res.aff_code,
            tenantId: res.tenant_id,
            tenantSlug: resolvedTenantSlug,
            ...(res.issuer ? { issuer: res.issuer } : {}),
            clientId: res.client_id,
            scope: res.scope,
            roles: res.format === "jwt" ? res.roles : [],
            exp: res.exp,
        };
    }
}
/**
 * 单飞（Single-Flight）OIDC 会话管理器：
 * - 自动在令牌临期前通过 refresh_token 静默轮换；
 * - 严格区分 `invalid_grant` / `401` 吊销与网络抖动，瞬态故障绝不误删本地会话。
 */
export class OidcSessionManager {
    oidc;
    store;
    refreshSkewMs;
    now;
    inflightRefresh = null;
    constructor(options) {
        this.oidc = options.oidc;
        this.store = options.store;
        this.refreshSkewMs = options.refreshSkewMs ?? 60_000;
        this.now = options.now ?? (() => Date.now());
    }
    async saveFromTokenSet(tokenSet, verifyIdentity = true, options) {
        let identity;
        if (verifyIdentity) {
            identity = await this.oidc.verifyAccessToken(tokenSet.accessToken, options);
        }
        const session = {
            accessToken: tokenSet.accessToken,
            tokenType: tokenSet.tokenType,
            expiresAt: tokenSet.expiresAt,
            ...(tokenSet.refreshToken ? { refreshToken: tokenSet.refreshToken } : {}),
            ...(tokenSet.idToken ? { idToken: tokenSet.idToken } : {}),
            ...(tokenSet.scope ? { scope: tokenSet.scope } : {}),
            ...(identity ? { identity } : {}),
            updatedAt: this.now(),
        };
        await this.store.save(session);
        return session;
    }
    async getValidSession(options) {
        const current = await this.store.load();
        if (!current)
            return null;
        const needsRefresh = options?.forceRefresh === true || current.expiresAt - this.refreshSkewMs <= this.now();
        if (!needsRefresh) {
            return current;
        }
        if (!current.refreshToken) {
            if (current.expiresAt <= this.now()) {
                await this.store.clear();
                return null;
            }
            return current;
        }
        if (this.inflightRefresh) {
            return this.inflightRefresh;
        }
        const task = this.performRefresh(current, options).finally(() => {
            this.inflightRefresh = null;
        });
        this.inflightRefresh = task;
        return task;
    }
    async performRefresh(current, options) {
        try {
            const nextTokens = await this.oidc.refreshToken({ refreshToken: current.refreshToken }, options);
            let identity = current.identity;
            try {
                identity = await this.oidc.verifyAccessToken(nextTokens.accessToken, options);
            }
            catch (verifyErr) {
                if (isDefinitiveTokenRejection(verifyErr)) {
                    await this.store.clear();
                    return null;
                }
            }
            const updated = {
                accessToken: nextTokens.accessToken,
                tokenType: nextTokens.tokenType,
                expiresAt: nextTokens.expiresAt,
                ...(nextTokens.refreshToken ? { refreshToken: nextTokens.refreshToken } : {}),
                ...(nextTokens.idToken
                    ? { idToken: nextTokens.idToken }
                    : current.idToken
                        ? { idToken: current.idToken }
                        : {}),
                ...(nextTokens.scope
                    ? { scope: nextTokens.scope }
                    : current.scope
                        ? { scope: current.scope }
                        : {}),
                ...(identity ? { identity } : {}),
                updatedAt: this.now(),
            };
            await this.store.save(updated);
            return updated;
        }
        catch (err) {
            if (isDefinitiveTokenRejection(err)) {
                await this.store.clear();
                return null;
            }
            throw err;
        }
    }
    async logout(options) {
        const current = await this.store.load();
        await this.store.clear();
        if (!current)
            return;
        if (current.refreshToken) {
            try {
                await this.oidc.revokeToken({ token: current.refreshToken, tokenTypeHint: "refresh_token" }, options);
            }
            catch {
                // 本地退出不得因远端网路不可达而卡死
            }
        }
        try {
            await this.oidc.revokeToken({ token: current.accessToken, tokenTypeHint: "access_token" }, options);
        }
        catch {
            // 同上
        }
    }
}
