import { type OidcClient, type OidcTokenSet } from "./oidc.js";
export interface PkceLoopbackOptions {
    readonly oidc: OidcClient;
    readonly host?: "127.0.0.1" | "localhost";
    readonly callbackPath?: string;
    /** 依次尝试监听的回环端口列表；传 0 表示由操作系统分配临时端口。 */
    readonly preferredPorts?: readonly number[];
    readonly scope?: string;
    readonly prompt?: string;
    readonly loginHint?: string;
    readonly timeoutMs?: number;
    readonly signal?: AbortSignal;
    readonly successTitle?: string;
    readonly successMessage?: string;
}
export interface PkceLoopbackSession {
    readonly authorizationUrl: string;
    readonly redirectUri: string;
    readonly port: number;
    readonly state: string;
    readonly waitForTokens: () => Promise<OidcTokenSet>;
    readonly close: () => Promise<void>;
}
export declare function startPkceLoopbackListener(options: PkceLoopbackOptions): Promise<PkceLoopbackSession>;
