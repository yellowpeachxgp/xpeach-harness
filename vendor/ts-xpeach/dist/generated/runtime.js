import { OPERATIONS, SECURITY_SCHEMES } from "./operations.js";
import { getValidatorShardSync, loadValidatorShard, validateWithShard, validateRawDocumentWithShard } from "./validator-runtime.js";
export const API_BASE = "/api/v2";
export const SESSION_COOKIE_NAME = "__Host-xp_console";
export const SERVICE_KEY_HEADER = "X-Service-Key";
export const INTERNAL_KEY_HEADER = "X-Internal-Key";
export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
// ---------- i64 decimal-string family (Quota / NonNegQuota / PosQuota / MoneyMinor) ----------
// Wire contract: decimal i64 as JSON string, pattern ^-?(0|[1-9][0-9]{0,18})$, canonical
// only: no "-0", no leading zeros, no JSON number, |v| <= int64 range.
export const I64_MIN = -(1n << 63n);
export const I64_MAX = (1n << 63n) - 1n;
const I64_RE = /^-?(0|[1-9][0-9]{0,18})$/;
const NONNEG_RE = /^(0|[1-9][0-9]{0,18})$/;
const POS_RE = /^[1-9][0-9]{0,18}$/;
export class QuotaFormatError extends Error {
    field;
    constructor(field, reason) {
        super("xpeach-sdk: invalid " + field + ": " + reason);
        this.name = "QuotaFormatError";
        this.field = field;
    }
}
function parseDecimalI64(value, re, field) {
    if (typeof value !== "string" || !re.test(value)) {
        throw new QuotaFormatError(field, "额度必须使用规范十进制文本");
    }
    const v = BigInt(value);
    if (v.toString(10) !== value) {
        throw new QuotaFormatError(field, "额度必须使用规范十进制文本");
    }
    if (v < I64_MIN || v > I64_MAX) {
        throw new QuotaFormatError(field, "额度超出有符号64位范围");
    }
    return v;
}
/** Validate a signed i64 decimal string and return its bigint. Throws QuotaFormatError. */
export function parseI64(value, field = "quota") {
    return parseDecimalI64(value, I64_RE, field);
}
/** Serialize bigint to canonical i64 decimal string. Throws QuotaFormatError on overflow. */
export function i64String(v, field = "quota") {
    if (v < I64_MIN || v > I64_MAX)
        throw new QuotaFormatError(field, "out of int64 range");
    return v.toString(10);
}
export function quota(v) {
    const s = typeof v === "bigint" ? i64String(v, "Quota") : v;
    parseDecimalI64(s, I64_RE, "Quota");
    return s;
}
export function quotaToBigInt(q) {
    return parseDecimalI64(q, I64_RE, "Quota");
}
export function nonNegQuota(v) {
    const s = typeof v === "bigint" ? i64String(v, "NonNegQuota") : v;
    parseDecimalI64(s, NONNEG_RE, "NonNegQuota");
    return s;
}
export function posQuota(v) {
    const s = typeof v === "bigint" ? i64String(v, "PosQuota") : v;
    parseDecimalI64(s, POS_RE, "PosQuota");
    return s;
}
export function moneyMinor(v) {
    const s = typeof v === "bigint" ? i64String(v, "MoneyMinor") : v;
    parseDecimalI64(s, I64_RE, "MoneyMinor");
    return s;
}
export class ProblemError extends Error {
    httpStatus;
    problem;
    constructor(httpStatus, problem) {
        super("接口请求失败（HTTP " + httpStatus + "）");
        this.name = "ProblemError";
        this.httpStatus = httpStatus;
        this.problem = problem;
    }
    get code() { return this.problem.code ?? ""; }
    get traceId() { return this.problem.traceId; }
    get retryable() { return this.problem.retryable === true; }
    get conflicts() { return this.problem.conflicts; }
}
/** OAuth错误保持协议字段及原始响应，不伪装成RFC9457 Problem。异常文字不含凭据或响应正文。 */
export class OAuthProtocolError extends Error {
    httpStatus;
    body;
    response;
    error;
    errorDescription;
    errorUri;
    constructor(httpStatus, body, response) {
        super("OIDC协议请求失败(HTTP " + httpStatus + ")");
        this.httpStatus = httpStatus;
        this.body = body;
        this.response = response;
        this.name = "OAuthProtocolError";
        this.error = typeof response?.error === "string" ? response.error : "";
        this.errorDescription = typeof response?.error_description === "string" ? response.error_description : undefined;
        this.errorUri = typeof response?.error_uri === "string" ? response.error_uri : undefined;
    }
}
/** Transport-level failure (DNS/TLS/reset/timeout) before a usable response. */
export class TransportError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.name = "TransportError";
        this.cause = cause;
    }
}
export class ResponseFormatError extends Error {
    httpStatus;
    constructor(message, httpStatus = 0) {
        super(message);
        this.httpStatus = httpStatus;
        this.name = "ResponseFormatError";
    }
}
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const PROTECTED = new Set(["authorization", "cookie", "x-csrf-token", "content-type", "accept", "idempotency-key"]);
for (const scheme of Object.values(SECURITY_SCHEMES))
    if (scheme.type === "apiKey" && scheme.in === "header" && scheme.name)
        PROTECTED.add(scheme.name.toLowerCase());
export function resolveConfig(c) {
    if (!c || typeof c.baseUrl !== "string" || (!c.browser && !/^https?:\/\//.test(c.baseUrl)))
        throw new ResponseFormatError("SDK必须使用明确的站点地址");
    if (c.baseUrl !== "") {
        try {
            const url = new URL(c.baseUrl);
            if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
                throw new Error();
        }
        catch {
            throw new ResponseFormatError("SDK地址必须是不含身份和路径的HTTP站点origin");
        }
    }
    const currentLocation = globalThis.location;
    if (c.browser && c.baseUrl && currentLocation && new URL(c.baseUrl).origin !== currentLocation.origin)
        throw new ResponseFormatError("浏览器SDK只允许当前同源站点");
    const credentials = Object.fromEntries(Object.entries(c.credentials ?? {}).map(([k, v]) => [k, typeof v === 'object' ? { ...v } : v]));
    for (const [name, value] of Object.entries({ sessionCookie: c.sessionCookie, bearerAT: c.accessToken, serviceKey: c.serviceKey, internalKey: c.internalKey, legacyNativeKey: c.legacyNativeKey, legacyCostBridgeKey: c.legacyCostBridgeKey }))
        if (value !== undefined) {
            if (credentials[name] !== undefined)
                throw new ResponseFormatError("同一认证方案不能重复配置");
            credentials[name] = value;
        }
    if (c.browser && (Object.keys(credentials).length || c.authentication))
        throw new ResponseFormatError("浏览器会话模式不能配置机器或Cookie凭据");
    for (const key of Object.keys(credentials))
        if (!Object.hasOwn(SECURITY_SCHEMES, key))
            throw new ResponseFormatError("认证方案未登记");
    for (const key of Object.keys(c.extraHeaders ?? {}))
        if (PROTECTED.has(key.toLowerCase()))
            throw new ResponseFormatError("附加请求头不能覆盖受保护字段");
    // 默认浏览器fetch必须使用其真实全局接收者；显式注入的传输保持原样。
    const fetcher = c.fetch ?? (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined);
    if (typeof fetcher !== "function")
        throw new ResponseFormatError("未提供HTTP传输");
    const timeoutMs = c.timeoutMs ?? 10000;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
        throw new ResponseFormatError("请求超时必须为正数");
    return { apiOrigin: c.baseUrl.replace(/\/+$/, ""), fetch: fetcher, credentials, authentication: c.authentication, extraHeaders: { ...c.extraHeaders },
        browser: c.browser === true, csrfToken: c.csrfToken, timeoutMs, retry: { maxAttempts: Math.max(1, c.retry?.maxAttempts ?? (c.browser ? 1 : 3)), baseDelayMs: c.retry?.baseDelayMs ?? 100, maxDelayMs: c.retry?.maxDelayMs ?? 2000 }, sleep: c.sleep ?? (ms => new Promise(r => setTimeout(r, ms))) };
}
function auth(cfg, spec) {
    const headers = new Headers();
    const query = {};
    const available = (name) => cfg.browser ? SECURITY_SCHEMES[name]?.in === "cookie" : cfg.credentials[name] !== undefined;
    const candidates = spec.auth.filter(g => g.every(available));
    let group;
    if (cfg.authentication) {
        const matches = candidates.filter(g => g.length === cfg.authentication.length && g.every(n => cfg.authentication.includes(n)));
        if (matches.length !== 1)
            throw new ResponseFormatError("所选认证组合不符合正式契约");
        group = matches[0];
    }
    else {
        const nonempty = candidates.filter(g => g.length);
        if (nonempty.length > 1)
            throw new ResponseFormatError("存在多个认证身份，请明确选择认证组合");
        if (nonempty.length)
            group = nonempty[0];
        else if (!spec.auth.length || candidates.some(g => !g.length))
            group = [];
        else
            throw new ResponseFormatError("缺少操作所需的认证凭据");
    }
    for (const name of group) {
        const scheme = SECURITY_SCHEMES[name];
        if (cfg.browser && scheme.in === "cookie")
            continue;
        const value = cfg.credentials[name];
        if (scheme.type === "apiKey" && typeof value === "string" && value) {
            if (scheme.in === "header" && scheme.name) {
                if (headers.has(scheme.name))
                    throw new ResponseFormatError("认证请求头冲突");
                headers.set(scheme.name, value);
            }
            else if (scheme.in === "query" && scheme.name)
                query[scheme.name] = value;
            else if (scheme.in === "cookie" && scheme.name) {
                if (!/^[\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]+$/.test(value))
                    throw new ResponseFormatError("Cookie凭据必须为合法原始Cookie值");
                headers.set("Cookie", (headers.get("Cookie") ? headers.get("Cookie") + "; " : "") + scheme.name + "=" + value);
            }
            else
                throw new ResponseFormatError("不支持的认证参数位置");
        }
        else if (scheme.type === "http" && scheme.scheme === "bearer" && typeof value === "string" && value) {
            if (headers.has("Authorization"))
                throw new ResponseFormatError("认证请求头冲突");
            headers.set("Authorization", "Bearer " + value);
        }
        else if (scheme.type === "http" && scheme.scheme === "basic" && typeof value === "object" && (scheme["x-oauth-client-password"] === true || !value.username.includes(":"))) {
            if (headers.has("Authorization"))
                throw new ResponseFormatError("认证请求头冲突");
            // RFC6749客户端密码先分别表单编码；普通HTTP Basic保持原有语义。
            const component = (part) => new URLSearchParams([['value', part]]).toString().slice(6);
            const pair = scheme['x-oauth-client-password'] === true ? component(value.username) + ':' + component(value.password) : value.username + ':' + value.password;
            const bytes = new TextEncoder().encode(pair);
            headers.set("Authorization", "Basic " + btoa(Array.from(bytes, b => String.fromCharCode(b)).join("")));
        }
        else
            throw new ResponseFormatError("认证凭据格式无效");
    }
    return { headers, query, schemes: group };
}
function clean(obj) { return Object.fromEntries(Object.entries(obj ?? {}).filter(([, v]) => v !== undefined)); }
function prepare(spec, input, csrf, validatorShard) {
    const pathParams = clean(input.pathParams), query = clean(input.query), headers = {};
    for (const value of Object.values(pathParams))
        if (typeof value !== 'string' || value === '' || value === '.' || value === '..' || /[\/\\\u0000-\u001f\u007f]/.test(value))
            throw new ResponseFormatError("路径参数不能改变操作路径");
    for (const [k, v] of Object.entries(input.headers ?? {}))
        if (v !== undefined) {
            if (PROTECTED.has(k.toLowerCase()))
                throw new ResponseFormatError("业务请求头不能覆盖受保护字段");
            headers[k.toLowerCase()] = v;
        }
    if (input.idempotencyKey)
        headers["idempotency-key"] = input.idempotencyKey;
    if (csrf && spec.parameters.some(p => p.in === "header" && p.name.toLowerCase() === "x-csrf-token"))
        headers["x-csrf-token"] = csrf;
    if (spec.idempotency === "required" && !input.idempotencyKey)
        throw new ResponseFormatError("操作必须提供idempotencyKey");
    const request = { pathParams, query, headers, ...(input.body === undefined || spec.requestMedia === "application/octet-stream" ? {} : { body: input.body }) };
    if (!validateWithShard(validatorShard, spec.requestValidator, request))
        throw new ResponseFormatError("请求不符合正式接口契约");
    return request;
}
// 只解析HTTP媒体类型语法；错误参数不能通过截取分号前缀冒成合法媒体。
function responseMediaType(value) {
    if (!value)
        return { media: '', charset: undefined };
    let at = 0;
    const fail = () => { throw new ResponseFormatError('响应媒体类型语法无效'); };
    const ws = () => { while (value[at] === ' ' || value[at] === '\t')
        at++; };
    const token = () => { const start = at; while (at < value.length && /[!#$%&'*+.^_`|~0-9A-Za-z-]/.test(value[at]))
        at++; if (start === at)
        fail(); return value.slice(start, at); };
    ws();
    const type = token();
    if (value[at++] !== '/')
        fail();
    const subtype = token();
    ws();
    const params = {};
    while (at < value.length) {
        if (value[at++] !== ';')
            fail();
        ws();
        const name = token().toLowerCase();
        ws();
        if (value[at++] !== '=')
            fail();
        ws();
        let text = '';
        if (value[at] === '"') {
            at++;
            let closed = false;
            while (at < value.length) {
                let char = value[at++];
                if (char === '"') {
                    closed = true;
                    break;
                }
                if (char === '\\') {
                    if (at >= value.length)
                        fail();
                    char = value[at++];
                }
                const code = char.charCodeAt(0);
                if ((code < 32 && code !== 9) || code === 127 || code > 255)
                    fail();
                text += char;
            }
            if (!closed)
                fail();
        }
        else
            text = token();
        if (Object.hasOwn(params, name))
            fail();
        params[name] = text;
        ws();
    }
    return { media: (type + '/' + subtype).toLowerCase(), charset: params.charset?.toLowerCase() };
}
export const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
async function readBytes(res, signal) {
    const length = res.headers.get("content-length");
    if (length && (!/^\d+$/.test(length) || Number(length) > MAX_RESPONSE_BYTES)) {
        await res.body?.cancel();
        throw new ResponseFormatError("响应超过8MiB预算", res.status);
    }
    if (!res.body)
        return new Uint8Array();
    const reader = res.body.getReader();
    const blocks = [];
    let total = 0;
    let rejectAbort = () => { };
    const cancelled = new Promise((_, reject) => { rejectAbort = reject; });
    const onAbort = () => { void reader.cancel().catch(() => { }); rejectAbort(new TransportError("请求已取消或超时")); };
    signal.addEventListener("abort", onAbort, { once: true });
    try {
        if (signal.aborted)
            onAbort();
        for (;;) {
            const item = await Promise.race([reader.read(), cancelled]);
            if (signal.aborted)
                throw new TransportError("请求已取消或超时");
            if (item.done)
                break;
            total += item.value.length;
            if (total > MAX_RESPONSE_BYTES) {
                await reader.cancel();
                throw new ResponseFormatError("响应超过8MiB预算", res.status);
            }
            blocks.push(item.value);
        }
        const out = new Uint8Array(total);
        let offset = 0;
        for (const b of blocks) {
            out.set(b, offset);
            offset += b.length;
        }
        return out;
    }
    finally {
        signal.removeEventListener("abort", onAbort);
        reader.releaseLock();
    }
}
function parseJSON(bytes, status) {
    try {
        return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    }
    catch {
        throw new ResponseFormatError("响应必须是完整UTF-8 JSON", status);
    }
}
function problem(status, data) {
    const raw = data && typeof data === "object" && !Array.isArray(data) ? data : {};
    const out = { status, title: "接口请求失败", code: status === 429 ? "rate_limited" : "http_" + status, retryable: status >= 500 || status === 429 };
    for (const key of ["type", "title", "detail", "instance", "code", "traceId"])
        if (typeof raw[key] === "string")
            out[key] = raw[key];
    if (typeof raw.retryable === "boolean")
        out.retryable = raw.retryable;
    if (Array.isArray(raw.conflicts) && raw.conflicts.every(v => typeof v === "string"))
        out.conflicts = raw.conflicts;
    return out;
}
export async function executeOperation(cfg, spec, input, options = {}) {
    if (!Object.hasOwn(OPERATIONS, spec.operationId) || OPERATIONS[spec.operationId] !== spec)
        throw new ResponseFormatError("操作未在正式SDK登记");
    if (cfg.browser && input.csrfToken !== undefined)
        throw new ResponseFormatError("浏览器CSRF只能从逐次可信回调取得");
    if (options.signal?.aborted)
        throw new TransportError("请求已取消");
    const validatorShard = getValidatorShardSync(spec.validatorShard) ?? await loadValidatorShard(spec.validatorShard);
    if (options.signal?.aborted)
        throw new TransportError("请求已取消");
    const csrf = cfg.csrfToken?.() ?? input.csrfToken;
    let wireBody = input.body;
    let encodedBody;
    if (input.body !== undefined && spec.requestMedia !== "application/octet-stream") {
        try {
            encodedBody = JSON.stringify(input.body);
            if (encodedBody === undefined)
                throw new Error();
            wireBody = JSON.parse(encodedBody);
        }
        catch {
            throw new ResponseFormatError("请求必须能编码为完整JSON");
        }
    }
    const req = prepare(spec, { ...input, ...(input.body === undefined ? {} : { body: wireBody }), headers: { ...cfg.extraHeaders, ...input.headers } }, csrf, validatorShard);
    const identity = auth(cfg, spec);
    if (identity.schemes.some(name => SECURITY_SCHEMES[name]?.['x-oauth-client-password'] === true) && wireBody !== null && typeof wireBody === 'object' && Object.hasOwn(wireBody, 'client_secret'))
        throw new ResponseFormatError('OAuth客户端不能同时使用Basic与post密码');
    if (Object.keys(spec.authRequestValidators).length) {
        let matched = false;
        for (const scheme of identity.schemes) {
            const validator = spec.authRequestValidators[scheme];
            if (validator) {
                matched = true;
                if (!validateWithShard(validatorShard, validator, wireBody ?? {}))
                    throw new ResponseFormatError("请求不符合所选认证身份的正式契约");
            }
        }
        if (!matched)
            throw new ResponseFormatError("认证身份没有对应请求契约");
    }
    const headers = new Headers(identity.headers);
    for (const [key, value] of Object.entries(req.headers))
        headers.set(key, String(value));
    headers.set("Accept", spec.responseMedia || "application/json");
    if (input.body !== undefined)
        headers.set("Content-Type", spec.requestMedia);
    if (cfg.browser && !SAFE_METHODS.has(spec.method) && csrf)
        headers.set("X-CSRF-Token", csrf);
    let wire = spec.mount + spec.path.slice(spec.mountStrip?.length ?? 0);
    for (const [key, value] of Object.entries(req.pathParams))
        wire = wire.split("{" + key + "}").join(encodeURIComponent(String(value)));
    if (/[{}]/.test(wire))
        throw new ResponseFormatError("路径参数不完整");
    for (const key of Object.keys(identity.query))
        if (Object.hasOwn(req.query, key))
            throw new ResponseFormatError("认证查询参数冲突");
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...req.query, ...identity.query }))
        query.append(key, String(value));
    const url = cfg.apiOrigin + wire + (query.size ? "?" + query : "");
    let body;
    if (input.body !== undefined) {
        if (spec.requestMedia === "application/octet-stream") {
            if (!(input.body instanceof Uint8Array))
                throw new ResponseFormatError("二进制请求必须提供字节数组");
            body = new Uint8Array(input.body);
        }
        else if (spec.requestMedia === "application/x-www-form-urlencoded") {
            if (wireBody === null || typeof wireBody !== "object" || Array.isArray(wireBody) || Object.values(wireBody).some(v => typeof v !== "string"))
                throw new ResponseFormatError("表单必须是平面字符串对象");
            body = new URLSearchParams(wireBody).toString();
        }
        else
            body = encodedBody;
    }
    const retryable = SAFE_METHODS.has(spec.method) || spec.idempotency === "required";
    for (let attempt = 0; attempt < cfg.retry.maxAttempts; attempt++) {
        if (options.signal?.aborted)
            throw new TransportError("请求已取消");
        if (attempt)
            await cfg.sleep(Math.min(cfg.retry.baseDelayMs * 2 ** (attempt - 1), cfg.retry.maxDelayMs));
        const controller = new AbortController();
        const cancel = () => controller.abort();
        options.signal?.addEventListener("abort", cancel, { once: true });
        const timer = setTimeout(cancel, cfg.timeoutMs);
        try {
            const init = { method: spec.method, headers, signal: controller.signal, credentials: cfg.browser ? "same-origin" : "omit", redirect: "manual", ...(body === undefined ? {} : { body }) };
            let rejectAbort = () => { };
            const aborted = new Promise((_, reject) => { rejectAbort = reject; });
            const stop = () => rejectAbort(new TransportError("请求已取消或超时"));
            controller.signal.addEventListener("abort", stop, { once: true });
            let res;
            let bytes;
            try {
                if (controller.signal.aborted)
                    stop();
                const pending = cfg.fetch(url, init).then(response => { if (controller.signal.aborted) {
                    void response.body?.cancel().catch(() => { });
                    throw new TransportError("请求已取消或超时");
                } return response; });
                res = await Promise.race([pending, aborted]);
                bytes = await readBytes(res, controller.signal);
            }
            finally {
                controller.signal.removeEventListener("abort", stop);
            }
            const response = spec.responses[String(res.status)] ?? spec.responses.default;
            if (response?.headerValidator) {
                // Set-Cookie在浏览器不可观察；此投影仅说明可读头合规，不证明Cookie已经写入。
                const validator = cfg.browser ? response.browserHeaderValidator : response.headerValidator;
                const headers = cfg.browser ? response.browserHeaders : response.headers;
                if (!validator || !headers)
                    throw new ResponseFormatError("响应头可观察契约未生成", res.status);
                const values = {};
                for (const header of headers) {
                    const value = res.headers.get(header.name);
                    if (value === null)
                        continue;
                    values[header.name] = ['integer', 'number'].includes(header.type) && /^-?[0-9]+(?:\.[0-9]+)?$/.test(value) ? Number(value) : header.type === 'boolean' && ['true', 'false'].includes(value) ? value === 'true' : value;
                }
                if (!validateWithShard(validatorShard, validator, values))
                    throw new ResponseFormatError("响应头不符合正式接口契约", res.status);
            }
            let content;
            try {
                content = responseMediaType(res.headers.get('content-type') ?? '');
            }
            catch {
                throw new ResponseFormatError('响应媒体类型语法无效', res.status);
            }
            const media = content.media;
            if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400))
                throw new ResponseFormatError("SDK不跟随接口重定向", res.status);
            if (!res.ok) {
                const raw = bytes.length && ["application/json", "application/problem+json"].includes(media) ? parseJSON(bytes, res.status) : undefined;
                if (response?.validator && (!response.media || media !== response.media || !validateWithShard(validatorShard, response.validator, raw)))
                    throw new ResponseFormatError("错误响应不符合正式契约", res.status);
                if (spec.requestMedia === "application/x-www-form-urlencoded" && media !== "application/problem+json")
                    throw new OAuthProtocolError(res.status, bytes, raw);
                if (response?.media && response.media !== "application/problem+json")
                    throw spec.errorFamily === "legacy-v1" ? new LegacyV1Error(res.status, spec.operationId, bytes, raw) : new DeclaredResponseError(res.status, spec.operationId, bytes, raw);
                const p = problem(res.status, raw);
                if (retryable && p.retryable && attempt + 1 < cfg.retry.maxAttempts)
                    continue;
                throw new ProblemError(res.status, p);
            }
            // 不能由default或res.ok凭空扩大正式成功状态集合。
            const declared = spec.responses[String(res.status)];
            if (!declared)
                throw new ResponseFormatError("成功状态未在正式契约声明", res.status);
            if (!declared.media) {
                if (bytes.length)
                    throw new ResponseFormatError("空响应端点返回了额外正文", res.status);
                return undefined;
            }
            const charset = content.charset;
            if (charset && charset !== "utf-8" && declared.media !== "application/octet-stream")
                throw new ResponseFormatError("响应字符集必须为UTF-8", res.status);
            if (media !== declared.media)
                throw new ResponseFormatError("响应媒体类型不符合正式契约", res.status);
            if (spec.responseMode === "binary")
                return bytes;
            if (spec.responseMode === "raw-json-document") {
                const document = parseJSON(bytes, res.status);
                if (!declared.validator || !validateRawDocumentWithShard(validatorShard, declared.validator, document))
                    throw new ResponseFormatError('公开JSON文档不符合正式外层契约', res.status);
                return bytes;
            }
            if (spec.responseMode === "text") {
                let text;
                try {
                    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
                }
                catch {
                    throw new ResponseFormatError('纯文本响应必须为完整UTF-8', res.status);
                }
                if (!declared.validator || !validateWithShard(validatorShard, declared.validator, text))
                    throw new ResponseFormatError('纯文本响应不符合正式接口契约', res.status);
                return text;
            }
            const raw = parseJSON(bytes, res.status);
            if (!declared.validator || !validateWithShard(validatorShard, declared.validator, raw))
                throw new ResponseFormatError("响应不符合正式接口契约", res.status);
            if (Object.keys(spec.responseHeaderSets).length) {
                const format = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw.format : undefined;
                const selected = typeof format === 'string' ? spec.responseHeaderSets[format] : undefined;
                if (!selected)
                    throw new ResponseFormatError("响应格式没有对应的正式头集合", res.status);
                const all = new Set(Object.values(spec.responseHeaderSets).flat());
                for (const name of all)
                    if (res.headers.has(name) !== selected.includes(name))
                        throw new ResponseFormatError("响应头集合与JSON格式不一致", res.status);
            }
            return raw;
        }
        catch (error) {
            if (error instanceof ResponseFormatError || error instanceof ProblemError || error instanceof OAuthProtocolError || error instanceof DeclaredResponseError)
                throw error;
            // 取消、超时、收到响应后的未知结果均不盲重试。
            throw new TransportError("HTTP传输未完成，结果未确认", error);
        }
        finally {
            clearTimeout(timer);
            options.signal?.removeEventListener("abort", cancel);
        }
    }
    throw new TransportError("请求尝试次数已用尽");
}
/** 由正式注册表解析具体浏览器路径；未知路径在网络请求前拒绝。 */
export function resolveOperation(method, pathname) {
    const matches = [];
    for (const spec of Object.values(OPERATIONS)) {
        if (spec.method !== method)
            continue;
        const matched = new RegExp(spec.matcher.pattern).exec(pathname);
        if (!matched)
            continue;
        const pathParams = {};
        let valid = true;
        for (let i = 0; i < spec.matcher.names.length; i++) {
            const name = spec.matcher.names[i];
            let value;
            try {
                value = decodeURIComponent(matched[i + 1]);
            }
            catch {
                valid = false;
                break;
            }
            if (Object.hasOwn(pathParams, name) && pathParams[name] !== value) {
                valid = false;
                break;
            }
            pathParams[name] = value;
        }
        if (valid)
            matches.push({ spec, pathParams, score: spec.matcher.specificity });
    }
    matches.sort((a, b) => b.score - a.score);
    if (!matches[0] || (matches[1] && matches[1].score === matches[0].score))
        throw new ResponseFormatError("操作未在正式SDK唯一登记");
    return matches[0];
}
/** 已按正式状态Schema验证的非Problem协议错误；原字节仅供明确的协议适配使用。 */
export class DeclaredResponseError extends Error {
    httpStatus;
    operationId;
    body;
    response;
    constructor(httpStatus, operationId, body, response) {
        super('协议接口请求失败（HTTP ' + httpStatus + '）');
        this.httpStatus = httpStatus;
        this.operationId = operationId;
        this.body = body;
        this.response = response;
        this.name = 'DeclaredResponseError';
    }
}
/** 旧v1错误仍保持正式信封，不能伪装成Problem或从200轮询正文推断失败。 */
export class LegacyV1Error extends DeclaredResponseError {
    constructor(status, operationId, body, response) { super(status, operationId, body, response); this.name = 'LegacyV1Error'; }
}
