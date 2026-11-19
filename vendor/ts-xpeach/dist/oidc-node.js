/**
 * @xpeach/ts-xpeach/oidc-node — Node.js 桌面/CLI 端本地回环 OIDC + PKCE 一键登录监听器。
 *
 * 优先尝试绑定已登记的确定性回环端口（默认 18920..18922，兼容生产环境 Strict redirect_uri 策略），
 * 也可在开发模式下回退至 0（动态端口）。
 */
import { createServer } from "node:http";
import { ResponseFormatError, TransportError } from "./generated/runtime.js";
import { OAuthCallbackError, createPkcePair, generateNonce, generateState, parseAuthorizationCallback, } from "./oidc.js";
function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
function renderCallbackHtml(ok, title, detail) {
    const badgeColor = ok ? "#16a34a" : "#dc2626";
    const badgeBg = ok ? "#dcfce7" : "#fee2e2";
    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; background: #0f1115; color: #f3f4f6; display: flex; min-height: 100vh; align-items: center; justify-content: center; }
  .card { width: min(420px, 90vw); background: #181b22; border: 1px solid #282d37; border-radius: 16px; padding: 28px; box-sizing: border-box; }
  .pill { display: inline-block; font-size: 12px; font-weight: 600; color: ${badgeColor}; background: ${badgeBg}; border-radius: 999px; padding: 4px 10px; margin-bottom: 14px; }
  h1 { margin: 0 0 8px; font-size: 20px; font-weight: 600; }
  p { margin: 0; font-size: 14px; line-height: 1.6; color: #9ca3af; }
</style>
</head>
<body>
  <div class="card">
    <span class="pill">${ok ? "认证已完成" : "认证未完成"}</span>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(detail)}</p>
  </div>
</body>
</html>`;
}
async function listenFirstAvailable(handler, host, ports) {
    let lastError;
    for (const port of ports) {
        const server = createServer(handler);
        try {
            await new Promise((resolve, reject) => {
                const onError = (err) => {
                    server.removeListener("listening", onListening);
                    reject(err);
                };
                const onListening = () => {
                    server.removeListener("error", onError);
                    resolve();
                };
                server.once("error", onError);
                server.once("listening", onListening);
                server.listen(port, host);
            });
            return server;
        }
        catch (err) {
            lastError = err;
            try {
                server.close();
            }
            catch {
                // 忽略未成功监听实例关闭异常
            }
        }
    }
    throw new TransportError("无法绑定本地 OIDC 回环回调端口", lastError);
}
const LOOPBACK_SECURITY_HEADERS = {
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
};
function sendLoopbackResponse(res, status, contentType, body) {
    return new Promise((resolve) => {
        let finished = false;
        const done = () => {
            if (!finished) {
                finished = true;
                resolve();
            }
        };
        res.once("close", done);
        res.once("error", done);
        if (!res.headersSent) {
            res.writeHead(status, {
                ...LOOPBACK_SECURITY_HEADERS,
                "content-type": contentType,
            });
        }
        res.end(body, done);
    });
}
export async function startPkceLoopbackListener(options) {
    if (options.signal?.aborted) {
        throw new TransportError("本地回环 OIDC 登录已取消");
    }
    const host = options.host ?? "127.0.0.1";
    const callbackPath = options.callbackPath ?? "/oauth/callback";
    if (!callbackPath.startsWith("/")) {
        throw new ResponseFormatError("callbackPath 必须以 / 开头");
    }
    const ports = options.preferredPorts && options.preferredPorts.length > 0 ? options.preferredPorts : [18920, 18921, 18922, 0];
    const pkce = await createPkcePair();
    const state = generateState();
    const nonce = generateNonce();
    if (options.signal?.aborted) {
        throw new TransportError("本地回环 OIDC 登录已取消");
    }
    let resolveResult;
    let rejectResult;
    let settled = false;
    let exchanging = false;
    const resultPromise = new Promise((resolve, reject) => {
        resolveResult = resolve;
        rejectResult = reject;
    });
    // 防止调用方尚未调用 waitForTokens 时触发 Node 未捕获拒绝告警
    void resultPromise.catch(() => { });
    let redirectUri = "";
    let expectedHost = "";
    let timer;
    const server = await listenFirstAvailable((req, res) => {
        const hostHeader = typeof req.headers.host === "string" ? req.headers.host.trim() : "";
        if (!expectedHost || hostHeader.toLowerCase() !== expectedHost.toLowerCase()) {
            void sendLoopbackResponse(res, 400, "text/plain; charset=utf-8", "Bad Request");
            return;
        }
        let reqUrl;
        try {
            reqUrl = new URL(req.url ?? "/", `http://${expectedHost}`);
        }
        catch {
            void sendLoopbackResponse(res, 400, "text/plain; charset=utf-8", "Bad Request");
            return;
        }
        if (req.method !== "GET" || reqUrl.pathname !== callbackPath) {
            void sendLoopbackResponse(res, 404, "text/plain; charset=utf-8", "Not Found");
            return;
        }
        if (settled) {
            void sendLoopbackResponse(res, 200, "text/html; charset=utf-8", renderCallbackHtml(true, "登录请求已处理", "你可以直接关闭此浏览器标签页并返回客户端。"));
            return;
        }
        if (exchanging) {
            void sendLoopbackResponse(res, 200, "text/html; charset=utf-8", renderCallbackHtml(true, "登录请求正在处理中", "授权回调正在校验，请稍候片刻。"));
            return;
        }
        let parsed;
        try {
            parsed = parseAuthorizationCallback(reqUrl.searchParams, state, options.oidc.issuer);
        }
        catch (err) {
            if (err instanceof OAuthCallbackError) {
                settled = true;
                void (async () => {
                    await sendLoopbackResponse(res, 400, "text/html; charset=utf-8", renderCallbackHtml(false, "XPeach 登录未完成", err.message));
                    await closeServer();
                    rejectResult(err);
                })();
                return;
            }
            const message = err instanceof Error ? err.message : "授权回调参数无效";
            void sendLoopbackResponse(res, 400, "text/html; charset=utf-8", renderCallbackHtml(false, "无效的授权回调", message));
            return;
        }
        exchanging = true;
        void (async () => {
            try {
                const tokenSet = await options.oidc.exchangeAuthorizationCode({
                    code: parsed.code,
                    redirectUri,
                    codeVerifier: pkce.codeVerifier,
                    expectedNonce: nonce,
                }, options.signal ? { signal: options.signal } : undefined);
                if (settled) {
                    if (!res.writableEnded) {
                        await sendLoopbackResponse(res, 400, "text/html; charset=utf-8", renderCallbackHtml(false, "XPeach 登录已取消", "本地回环登录已提前结束。"));
                    }
                    return;
                }
                settled = true;
                await sendLoopbackResponse(res, 200, "text/html; charset=utf-8", renderCallbackHtml(true, options.successTitle ?? "XPeach 登录成功", options.successMessage ?? "授权已完成，你可以关闭此页面并回到 XPeach 客户端。"));
                await closeServer();
                resolveResult(tokenSet);
            }
            catch (err) {
                if (settled) {
                    if (!res.writableEnded) {
                        await sendLoopbackResponse(res, 400, "text/html; charset=utf-8", renderCallbackHtml(false, "XPeach 登录已取消", "本地回环登录已提前结束。"));
                    }
                    return;
                }
                settled = true;
                const message = err instanceof Error ? err.message : "授权回调校验失败";
                await sendLoopbackResponse(res, 400, "text/html; charset=utf-8", renderCallbackHtml(false, "XPeach 登录未完成", message));
                await closeServer();
                rejectResult(err);
            }
        })();
    }, host, ports);
    const address = server.address();
    if (!address || typeof address === "string") {
        server.close();
        throw new TransportError("回环监听器未能取得有效 TCP 端口");
    }
    expectedHost = `${host}:${address.port}`;
    redirectUri = `http://${expectedHost}${callbackPath}`;
    let closed = false;
    const closeServer = async () => {
        if (closed)
            return;
        closed = true;
        if (timer !== undefined)
            clearTimeout(timer);
        options.signal?.removeEventListener("abort", onAbort);
        server.closeAllConnections?.();
        await new Promise((resolve) => server.close(() => resolve()));
    };
    const onAbort = () => {
        if (settled)
            return;
        settled = true;
        void closeServer();
        rejectResult(new TransportError("本地回环 OIDC 登录已取消"));
    };
    if (options.signal) {
        if (options.signal.aborted) {
            settled = true;
            await closeServer();
            throw new TransportError("本地回环 OIDC 登录已取消");
        }
        else {
            options.signal.addEventListener("abort", onAbort, { once: true });
        }
    }
    const timeoutMs = options.timeoutMs ?? 300_000;
    timer = setTimeout(() => {
        if (settled)
            return;
        settled = true;
        void closeServer();
        rejectResult(new TransportError("本地回环 OIDC 登录等待超时"));
    }, timeoutMs);
    timer.unref?.();
    let authorizationUrl;
    try {
        authorizationUrl = options.oidc.buildAuthorizationUrl({
            redirectUri,
            state,
            nonce,
            codeChallenge: pkce.codeChallenge,
            codeChallengeMethod: "S256",
            ...(options.scope ? { scope: options.scope } : {}),
            ...(options.prompt ? { prompt: options.prompt } : {}),
            ...(options.loginHint ? { loginHint: options.loginHint } : {}),
        });
    }
    catch (err) {
        settled = true;
        await closeServer();
        throw err;
    }
    return {
        authorizationUrl,
        redirectUri,
        port: address.port,
        state,
        waitForTokens: () => resultPromise,
        close: async () => {
            if (!settled) {
                settled = true;
                rejectResult(new TransportError("本地回环 OIDC 监听器已主动关闭"));
            }
            await closeServer();
        },
    };
}
