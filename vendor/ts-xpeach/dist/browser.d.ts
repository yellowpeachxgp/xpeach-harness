import type { ClientConfig, RequestOptions } from './generated/runtime.js';
export interface BrowserClientOptions {
    /** 站点origin，使用相对同源路径时传空字符串。 */
    baseUrl?: string;
    fetch?: ClientConfig['fetch'];
    csrfToken?: () => string | undefined;
    timeoutMs?: number;
}
export interface BrowserRequest extends RequestOptions {
    method: string;
    path: string;
    query?: Readonly<Record<string, unknown>>;
    body?: unknown;
    headers?: Readonly<Record<string, string>>;
    idempotencyKey?: string;
}
export declare class BrowserClient {
    private readonly cfg;
    constructor(options?: BrowserClientOptions);
    request(request: BrowserRequest): Promise<unknown>;
}
