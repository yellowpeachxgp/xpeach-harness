/**
 * @xpeach/ts-xpeach/oidc-node — Node.js 桌面/CLI 端本地回环 OIDC + PKCE 一键登录监听器。
 *
 * 优先尝试绑定已登记的确定性回环端口（默认 18920..18922，兼容生产环境 Strict redirect_uri 策略），
 * 也可在开发模式下回退至 0（动态端口）。
 */
import { createServer } from "node:http";
import { ResponseFormatError, TransportError } from "./generated/runtime.js";
import { createPkcePair, generateNonce, generateState, parseAuthorizationCallback, } from "./oidc.js";
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
export async function startPkceLoopbackListener(options) {
    const host = options.host ?? "127.0.0.1";
    const callbackPath = options.callbackPath ?? "/oauth/callback";
    if (!callbackPath.startsWith("/")) {
        throw new ResponseFormatError("callbackPath 必须以 / 开头");
    }
    const ports = options.preferredPorts && options.preferredPorts.length > 0 ? options.preferredPorts : [18920, 18921, 18922, 0];
    const pkce = await createPkcePair();
    const state = generateState();
    const nonce = generateNonce();
    let resolveResult;
    let rejectResult;
    let settled = false;
    const resultPromise = new Promise((resolve, reject) => {
        resolveResult = resolve;
        rejectResult = reject;
    });
    // 防止调用方尚未调用 waitForTokens 时触发 Node 未捕获拒绝告警
    void resultPromise.catch(() => { });
    let redirectUri = "";
    let timer;
    const server = await listenFirstAvailable((req, res) => {
        const reqUrl = new URL(req.url ?? "/", `http://${host}`);
        if (req.method !== "GET" || reqUrl.pathname !== callbackPath) {
            res.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
            res.end("Not Found");
            return;
        }
        if (settled) {
            res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
            res.end(renderCallbackHtml(true, "登录请求已处理", "你可以直接关闭此浏览器标签页并返回客户端。"));
            return;
        }
        void (async () => {
            try {
                const parsed = parseAuthorizationCallback(reqUrl.searchParams, state);
                const tokenSet = await options.oidc.exchangeAuthorizationCode({
                    code: parsed.code,
                    redirectUri,
                    codeVerifier: pkce.codeVerifier,
                    expectedNonce: nonce,
                }, options.signal ? { signal: options.signal } : undefined);
                settled = true;
                res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
                res.end(renderCallbackHtml(true, options.successTitle ?? "XPeach 登录成功", options.successMessage ?? "授权已完成，你可以关闭此页面并回到 XPeach 客户端。"));
                await closeServer();
                resolveResult(tokenSet);
            }
            catch (err) {
                settled = true;
                const message = err instanceof Error ? err.message : "授权回调校验失败";
                res.writeHead(400, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
                res.end(renderCallbackHtml(false, "XPeach 登录未完成", message));
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
    redirectUri = `http://${host}:${address.port}${callbackPath}`;
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
            onAbort();
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
    const authorizationUrl = options.oidc.buildAuthorizationUrl({
        redirectUri,
        state,
        nonce,
        codeChallenge: pkce.codeChallenge,
        codeChallengeMethod: "S256",
        ...(options.scope ? { scope: options.scope } : {}),
        ...(options.prompt ? { prompt: options.prompt } : {}),
        ...(options.loginHint ? { loginHint: options.loginHint } : {}),
    });
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
