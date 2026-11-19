/**
 * @xpeach/ts-xpeach/captcha — 统一 SSO 人机校验客户端（支持本地部署 Cap、Turnstile、reCAPTCHA、hCaptcha、Builtin）。
 *
 * 严格委托生成的 XpeachClient 执行双向 Schema 校验，严禁调用方手拼 SSO 或 Cap 核验 HTTP 路径。
 */
import { XpeachClient } from "./generated/client.js";
import type { ClientConfig, RequestOptions } from "./generated/runtime.js";
import type * as T from "./generated/types.js";
export type CaptchaScene = "login" | "register" | "recovery" | "reset_password" | "checkin" | "partner_consent";
export interface CaptchaClientOptions {
    readonly baseUrl: string;
    readonly clientId?: string;
    readonly clientSecret?: string;
    readonly serviceKey?: string;
    readonly internalKey?: string;
    readonly fetch?: ClientConfig["fetch"];
    readonly timeoutMs?: number;
    readonly retry?: ClientConfig["retry"];
    readonly sleep?: ClientConfig["sleep"];
}
/** 统一规范 Cap 前端提交令牌格式（确保以 `cap:` 前缀标识，防跨供应商回退误判）。 */
export declare function formatCapToken(rawToken: string): string;
/** 根据 SSO 公开人机策略解析指定场景生效的 Site Key。 */
export declare function resolveCaptchaSceneSiteKey(policy: T.CaptchaPublicPolicy, scene: CaptchaScene): string;
/** 判断指定场景在当前 SSO 策略下是否启用了人机校验。 */
export declare function isCaptchaSceneEnabled(policy: T.CaptchaPublicPolicy, scene: CaptchaScene): boolean;
export declare class CaptchaClient {
    private readonly raw;
    constructor(options: CaptchaClientOptions | XpeachClient);
    /** 拉取单中心公开人机验证策略快照（含本地 Cap 根地址、分场景 Site Keys 与开关）。 */
    getPolicy(options?: RequestOptions): Promise<T.CaptchaPublicPolicy>;
    /** 按场景拉取人机验证挑战参数（Cap / Turnstile / Builtin）。 */
    getChallenge(scene: CaptchaScene, options?: RequestOptions): Promise<T.PortalCaptchaChallenge>;
    /** 第一方服务端统一委托 SSO 核验人机令牌（单次消费、场景隔离、跨供应商拦截）。 */
    verify(body: T.CaptchaVerifyRequest, options?: RequestOptions): Promise<T.CaptchaVerifyResponse>;
}
