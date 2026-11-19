/**
 * @xpeach/ts-xpeach/captcha — 统一 SSO 人机校验客户端（支持本地部署 Cap、Turnstile、reCAPTCHA、hCaptcha、Builtin）。
 *
 * 严格委托生成的 XpeachClient 执行双向 Schema 校验，严禁调用方手拼 SSO 或 Cap 核验 HTTP 路径。
 */
import { XpeachClient } from "./generated/client.js";
function normalizeRootOrigin(raw) {
    const trimmed = raw.trim().replace(/\/+$/, "");
    const tenantIndex = trimmed.indexOf("/t/");
    return tenantIndex > 0 ? trimmed.slice(0, tenantIndex) : trimmed;
}
/** 统一规范 Cap 前端提交令牌格式（确保以 `cap:` 前缀标识，防跨供应商回退误判）。 */
export function formatCapToken(rawToken) {
    const trimmed = rawToken.trim();
    if (!trimmed)
        return "";
    return trimmed.startsWith("cap:") ? trimmed : `cap:${trimmed}`;
}
/** 根据 SSO 公开人机策略解析指定场景生效的 Site Key。 */
export function resolveCaptchaSceneSiteKey(policy, scene) {
    if (policy.provider === "cap") {
        const canonical = scene === "reset_password" ? "recovery" : scene;
        const perScene = policy.cap_site_keys[canonical]?.trim() ?? "";
        return perScene || policy.site_key.trim();
    }
    return policy.site_key.trim();
}
/** 判断指定场景在当前 SSO 策略下是否启用了人机校验。 */
export function isCaptchaSceneEnabled(policy, scene) {
    if (!policy.enabled || policy.provider === "none")
        return false;
    const canonical = scene === "reset_password" ? "recovery" : scene;
    return Boolean(policy.scenes[canonical]);
}
export class CaptchaClient {
    raw;
    constructor(options) {
        if (options instanceof XpeachClient) {
            this.raw = options;
            return;
        }
        const credentials = {};
        if (options.clientId?.trim() && options.clientSecret?.trim()) {
            credentials.clientBasic = {
                username: options.clientId.trim(),
                password: options.clientSecret.trim(),
            };
        }
        this.raw = new XpeachClient({
            baseUrl: normalizeRootOrigin(options.baseUrl),
            ...(options.serviceKey?.trim() ? { serviceKey: options.serviceKey.trim() } : {}),
            ...(options.internalKey?.trim() ? { internalKey: options.internalKey.trim() } : {}),
            ...(Object.keys(credentials).length > 0 ? { credentials } : {}),
            ...(options.fetch ? { fetch: options.fetch } : {}),
            ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
            retry: options.retry ?? { maxAttempts: 1 },
            ...(options.sleep ? { sleep: options.sleep } : {}),
        });
    }
    /** 拉取单中心公开人机验证策略快照（含本地 Cap 根地址、分场景 Site Keys 与开关）。 */
    getPolicy(options) {
        return this.raw.captchaPolicyGet(options);
    }
    /** 按场景拉取人机验证挑战参数（Cap / Turnstile / Builtin）。 */
    getChallenge(scene, options) {
        return this.raw.portalCaptchaGet({ scene }, options);
    }
    /** 第一方服务端统一委托 SSO 核验人机令牌（单次消费、场景隔离、跨供应商拦截）。 */
    verify(body, options) {
        return this.raw.captchaVerify({ body }, options);
    }
}
