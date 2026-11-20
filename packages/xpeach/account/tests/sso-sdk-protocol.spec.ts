import { createSign, generateKeyPairSync } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { XPeachApi, parseSsoIssuer, validateSsoBaseUrl } from '../src/api.ts'
import { scrubbedSqliteEnv } from '../src/chatgpt-db.ts'
import { XPeachAccount, XPeachDeepSeekAccount, scrubbedBrowserEnv, sleepWithAbort } from '../src/index.ts'
import { probeRoutes } from '../src/network.ts'

function signTestJwt(privatePem: string, kid: string, payload: Record<string, unknown>): string {
  const b64u = (val: string | Buffer): string =>
    Buffer.from(val).toString('base64').replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/gu, '')
  const header = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid }))
  const body = b64u(JSON.stringify(payload))
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${body}`)
  signer.end()
  return `${header}.${body}.${b64u(signer.sign(privatePem))}`
}

describe('XPeachApi @xpeach/ts-xpeach 正式 SDK 协议闭环', () => {
  const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const jwk = { ...(rsa.publicKey.export({ format: 'jwk' }) as Record<string, unknown>), kid: 'harness-k1', alg: 'RS256', use: 'sig' }
  const privPem = rsa.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()

  let ssoSrv: Server
  let ssoBase = ''
  let lastNonce: string | undefined
  let devicePollCount = 0
  const revoked: string[] = []
  const peachcodeRevokeCalls: { auth?: string | undefined; body: unknown }[] = []
  const callOrder: string[] = []
  const tempRoots: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true })
  })

  function freshTempHome(): string {
    const root = mkdtempSync(join(tmpdir(), 'xph-sso-sec-'))
    tempRoots.push(root)
    return root
  }

  beforeAll(async () => {
    ssoSrv = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      let raw = ''
      req.on('data', (c: Buffer) => { raw += c.toString() })
      req.on('end', () => {
        const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
          res.writeHead(status, { 'content-type': 'application/json', ...headers })
          res.end(JSON.stringify(body))
        }
        if (req.method === 'GET' && url.pathname === '/.well-known/jwks') {
          send(200, { keys: [jwk] })
          return
        }
        if (req.method === 'POST' && url.pathname === '/device/auth') {
          send(200, {
            device_code: 'sdk-dev-code',
            user_code: 'SDK1-2345',
            verification_uri: `${ssoBase}/device`,
            verification_uri_complete: `${ssoBase}/device?user_code=SDK1-2345`,
            expires_in: 300,
            interval: 1,
          })
          return
        }
        if (req.method === 'POST' && url.pathname === '/token') {
          const form = new URLSearchParams(raw)
          const grantType = form.get('grant_type')
          const nowSec = Math.floor(Date.now() / 1000)
          if (grantType === 'authorization_code') {
            const idToken = signTestJwt(privPem, 'harness-k1', {
              iss: ssoBase,
              sub: 'sub-pkce-user',
              aud: 'xpeach-harness',
              exp: nowSec + 3600,
              iat: nowSec,
              ...(lastNonce ? { nonce: lastNonce } : {}),
            })
            send(200, {
              access_token: 'xph_at_pkce_live_001',
              token_type: 'Bearer',
              expires_in: 3600,
              refresh_token: 'xph_rt_pkce_001',
              id_token: idToken,
              scope: 'openid profile email offline_access api',
            })
            return
          }
          if (grantType === 'urn:ietf:params:oauth:grant-type:device_code') {
            const devCode = form.get('device_code')
            if (devCode === 'dev-slow-down') {
              send(400, { error: 'slow_down' })
              return
            }
            if (devCode === 'dev-valid-idtoken') {
              const idToken = signTestJwt(privPem, 'harness-k1', {
                iss: ssoBase,
                sub: 'sub-pkce-user',
                aud: 'xpeach-harness',
                exp: nowSec + 3600,
                iat: nowSec,
              })
              send(200, {
                access_token: 'xph_at_device_idtok_ok',
                token_type: 'Bearer',
                expires_in: 1800,
                id_token: idToken,
              })
              return
            }
            if (devCode === 'dev-bad-idtoken') {
              send(200, {
                access_token: 'xph_at_device_idtok_bad',
                token_type: 'Bearer',
                expires_in: 1800,
                id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Imhhcm5lc3MtazEifQ.eyJpc3MiOiJodHRwOi8vZXZpbCJ9.bad-sig',
              })
              return
            }
            if (devCode === 'dev-sub-mismatch') {
              const idToken = signTestJwt(privPem, 'harness-k1', {
                iss: ssoBase,
                sub: 'sub-different-user',
                aud: 'xpeach-harness',
                exp: nowSec + 3600,
                iat: nowSec,
              })
              send(200, {
                access_token: 'xph_at_device_sub_mismatch',
                token_type: 'Bearer',
                expires_in: 1800,
                id_token: idToken,
              })
              return
            }
            devicePollCount += 1
            if (devicePollCount === 1) {
              send(400, { error: 'authorization_pending' })
              return
            }
            send(200, {
              access_token: 'xph_at_device_live_001',
              token_type: 'Bearer',
              expires_in: 1800,
              refresh_token: 'xph_rt_device_001',
            })
            return
          }
          if (grantType === 'refresh_token') {
            if (form.get('refresh_token') !== 'xph_rt_pkce_001') {
              send(400, { error: 'invalid_grant' })
              return
            }
            send(200, {
              access_token: 'xph_at_rotated_live_002',
              token_type: 'Bearer',
              expires_in: 3600,
              refresh_token: 'xph_rt_rotated_002',
            })
            return
          }
        }
        if (req.method === 'GET' && url.pathname === '/api/internal/verify') {
          const auth = req.headers['authorization']
          if (auth === 'Bearer xph_at_expired') {
            send(401, {
              api_version: 'v1',
              request_id: 'r-exp',
              timestamp: '2026-11-18T00:00:00Z',
              ok: false,
              active: false,
              error: 'invalid_or_expired_token',
              error_detail: {
                code: 'INVALID_OR_EXPIRED_TOKEN',
                error_key: 'invalid_or_expired_token',
                message: 'invalid_or_expired_token',
                status: 401,
                request_id: 'r-exp',
              },
            }, { pragma: 'no-cache' })
            return
          }
          send(200, {
            api_version: 'v1',
            request_id: 'r-ok',
            timestamp: '2026-11-18T00:00:00Z',
            ok: true,
            active: true,
            sub: 'sub-pkce-user',
            username: 'harness_sdk_user',
            email: 'sdk@xpeach.invalid',
            email_verified: true,
            name: 'Harness SDK User',
            group: 'default',
            aff_code: 'SDK01',
            inviter_sub: null,
            invited_from_site: null,
            tenant_id: '11111111-1111-4111-8111-111111111111',
            client_id: 'xpeach-harness',
            scope: 'openid profile email offline_access api',
            exp: Math.floor(Date.now() / 1000) + 3600,
            format: 'opaque',
          }, {
            pragma: 'no-cache',
            'x-auth-user': 'sub-pkce-user',
            'x-auth-username': 'harness_sdk_user',
            'x-auth-email': 'sdk@xpeach.invalid',
            'x-auth-group': 'default',
            'x-auth-aff-code': 'SDK01',
            'x-auth-inviter': '',
          })
          return
        }
        if (req.method === 'POST' && url.pathname === '/api/v1/peachcode/revoke') {
          callOrder.push('v1_peachcode_revoke')
          const parsedBody: unknown = raw.length > 0 ? JSON.parse(raw) : {}
          peachcodeRevokeCalls.push({
            auth: typeof req.headers['authorization'] === 'string' ? req.headers['authorization'] : undefined,
            body: parsedBody,
          })
          send(200, {
            api_version: 'v1',
            request_id: 'r-revoke-1',
            timestamp: '2026-11-18T00:00:00Z',
            ok: true,
            userId: 'sub-pkce-user',
            allDevices: Boolean((parsedBody as { allDevices?: boolean }).allDevices),
            peachcodeRevoked: false,
          })
          return
        }
        if (req.method === 'POST' && url.pathname === '/token/revocation') {
          callOrder.push('rfc7009_revocation')
          const form = new URLSearchParams(raw)
          const tok = form.get('token')
          if (tok) revoked.push(tok)
          res.writeHead(200)
          res.end()
          return
        }
        if (req.method === 'GET' && url.pathname === '/api/v2/captcha/policy') {
          send(200, {
            enabled: true,
            provider: 'cap',
            site_key: 'cap_login_key',
            cap_origin: 'http://127.0.0.1:14250',
            cap_site_keys: {
              login: 'cap_login_key',
              register: 'cap_register_key',
              recovery: 'cap_recovery_key',
              checkin: 'cap_checkin_key',
              partner_consent: 'cap_consent_key',
            },
            scenes: {
              login: true,
              register: true,
              recovery: false,
              checkin: true,
              partner_consent: true,
            },
          })
          return
        }
        if (req.method === 'GET' && url.pathname === '/api/v2/portal/auth/captcha') {
          const scene = url.searchParams.get('scene') ?? 'login'
          const siteKeys: Record<string, string> = {
            login: 'cap_login_key',
            register: 'cap_register_key',
            recovery: 'cap_recovery_key',
            checkin: 'cap_checkin_key',
            partner_consent: 'cap_consent_key',
          }
          const enabled = scene !== 'recovery'
          send(200, {
            enabled,
            provider: enabled ? 'cap' : 'none',
            site_key: enabled ? (siteKeys[scene] ?? 'cap_login_key') : '',
            cap_origin: enabled ? 'http://127.0.0.1:14250' : null,
            question: null,
            captcha_token: null,
          })
          return
        }
        send(404, { status: 404, title: 'not_found', code: 'not_found' })
      })
    })
    await new Promise<void>(resolve => ssoSrv.listen(0, '127.0.0.1', resolve))
    ssoBase = `http://127.0.0.1:${(ssoSrv.address() as AddressInfo).port}`
  })

  afterAll(() => new Promise<void>(resolve => ssoSrv.close(() => { resolve() })))

  it('通过 @xpeach/ts-xpeach 完成 PKCE 一键登录、RFC8628 设备流、自动 refresh_token 轮换与 RFC7009 吊销', async () => {
    const api = new XPeachApi({
      baseURL: 'http://127.0.0.1:13000',
      timeoutMs: 5000,
      resolveKey: async () => '',
      resolveAdmin: () => undefined,
      resolveCookie: () => undefined,
    })
    const signal = AbortSignal.timeout(8000)

    const pkce = await api.ssoPkceLoopbackStart(ssoBase, 'xpeach-harness', signal, [0])
    const authUrl = new URL(pkce.authorizationUrl)
    lastNonce = authUrl.searchParams.get('nonce') ?? undefined
    const state = authUrl.searchParams.get('state') ?? ''

    const cbRes = await fetch(`${pkce.redirectUri}?code=pkce-code-1&state=${encodeURIComponent(state)}`)
    expect(cbRes.status).toBe(200)
    const pkcePayload = await pkce.waitForApproval()
    expect(pkcePayload.sso?.accessToken).toBe('xph_at_pkce_live_001')
    expect(pkcePayload.sso?.refreshToken).toBe('xph_rt_pkce_001')
    expect(pkcePayload.peachcode?.accessToken).toBe('xph_at_pkce_live_001')
    expect(pkcePayload.peachcode?.username).toBe('harness_sdk_user')

    // 访问令牌过期时自动用 refresh_token 无感轮换，不误判为吊销
    const rotated = await api.ssoPeachcodeCredentials(ssoBase, 'xph_at_expired', signal, 'xph_rt_pkce_001', 'xpeach-harness')
    expect(rotated.status).toBe('ok')
    if (rotated.status === 'ok') {
      expect(rotated.payload.sso?.accessToken).toBe('xph_at_rotated_live_002')
      expect(rotated.payload.sso?.refreshToken).toBe('xph_rt_rotated_002')
    }

    // RFC8628 设备流兼容模式
    const devStart = await api.ssoDeviceAuthorize(ssoBase, 'xpeach-harness', 'CLI', signal)
    expect(devStart.userCode).toBe('SDK1-2345')
    const p1 = await api.ssoDeviceToken(ssoBase, 'xpeach-harness', devStart.deviceCode, signal)
    expect(p1.status).toBe('pending')
    const p2 = await api.ssoDeviceToken(ssoBase, 'xpeach-harness', devStart.deviceCode, signal)
    expect(p2.status).toBe('approved')
    expect(p2.payload?.sso?.accessToken).toBe('xph_at_device_live_001')

    // RFC7009 登出吊销
    const okRevoke = await api.ssoRevokeToken(ssoBase, 'xph_at_rotated_live_002', {}, signal, 'xph_rt_rotated_002', 'xpeach-harness')
    expect(okRevoke).toBe(true)
    expect(revoked).toEqual(['xph_rt_rotated_002', 'xph_at_rotated_live_002'])
  })

  it('通过 @xpeach/ts-xpeach CaptchaClient 统一获取 SSO 本地 Cap 人机校验策略与分场景挑战', async () => {
    const api = new XPeachApi({
      baseURL: 'http://127.0.0.1:13000',
      timeoutMs: 5000,
      resolveKey: async () => '',
      resolveAdmin: () => undefined,
      resolveCookie: () => undefined,
    })
    const signal = AbortSignal.timeout(5000)

    const policy = await api.ssoCaptchaPolicy(ssoBase, signal)
    expect(policy.enabled).toBe(true)
    expect(policy.provider).toBe('cap')
    expect(policy.capOrigin).toBe('http://127.0.0.1:14250')
    expect(policy.capSiteKeys.checkin).toBe('cap_checkin_key')
    expect(policy.capSiteKeys.partnerConsent).toBe('cap_consent_key')
    expect(policy.scenes.checkin).toBe(true)
    expect(policy.scenes.recovery).toBe(false)

    const checkin = await api.ssoCaptchaChallenge(ssoBase, 'checkin', signal)
    expect(checkin.enabled).toBe(true)
    expect(checkin.provider).toBe('cap')
    expect(checkin.siteKey).toBe('cap_checkin_key')
    expect(checkin.capOrigin).toBe('http://127.0.0.1:14250')

    const recovery = await api.ssoCaptchaChallenge(ssoBase, 'recovery', signal)
    expect(recovery.enabled).toBe(false)
    expect(recovery.provider).toBe('none')
    expect(recovery.capOrigin).toBeNull()
  })

  it('ssoDeviceToken 校验 id_token 签名与 sub 绑定，并返回独立的 slow_down 状态', async () => {
    const api = new XPeachApi({
      baseURL: 'http://127.0.0.1:13000',
      timeoutMs: 5000,
      resolveKey: async () => 'sk-test',
      resolveAdmin: () => undefined,
      resolveCookie: () => undefined,
    })
    const signal = AbortSignal.timeout(5000)

    const slow = await api.ssoDeviceToken(ssoBase, 'xpeach-harness', 'dev-slow-down', signal)
    expect(slow.status).toBe('slow_down')

    const valid = await api.ssoDeviceToken(ssoBase, 'xpeach-harness', 'dev-valid-idtoken', signal)
    expect(valid.status).toBe('approved')
    expect(valid.payload?.sso?.idToken).toBeDefined()

    const forged = await api.ssoDeviceToken(ssoBase, 'xpeach-harness', 'dev-bad-idtoken', signal)
    expect(forged.status).toBe('error')

    const mismatched = await api.ssoDeviceToken(ssoBase, 'xpeach-harness', 'dev-sub-mismatch', signal)
    expect(mismatched.status).toBe('error')
    expect(mismatched.message).toContain('subject mismatch')
  })

  it('ssoRevokeToken 在 allDevices/revokePeachcode 启用时先调用 /api/v1/peachcode/revoke 再执行 RFC 7009 吊销', async () => {
    const api = new XPeachApi({
      baseURL: 'http://127.0.0.1:13000',
      timeoutMs: 5000,
      resolveKey: async () => 'sk-test',
      resolveAdmin: () => undefined,
      resolveCookie: () => undefined,
    })
    const signal = AbortSignal.timeout(5000)
    callOrder.length = 0
    peachcodeRevokeCalls.length = 0

    const ok = await api.ssoRevokeToken(
      ssoBase,
      'xph_at_all_dev_1',
      { allDevices: true, revokePeachcode: true },
      signal,
      'xph_rt_all_dev_1',
      'xpeach-harness',
    )
    expect(ok).toBe(true)
    expect(peachcodeRevokeCalls).toEqual([
      {
        auth: 'Bearer xph_at_all_dev_1',
        body: { allDevices: true, revokePeachcode: true },
      },
    ])
    expect(callOrder[0]).toBe('v1_peachcode_revoke')
    expect(callOrder.slice(1)).toEqual(['rfc7009_revocation', 'rfc7009_revocation'])
  })

  it('redirect: manual 显式拒绝 3xx 重定向且绝不将 x-api-key 或 Authorization 转发至重定向目标', async () => {
    const sinkHits: { url: string; headers: Record<string, string | string[] | undefined> }[] = []
    const sinkSrv = createServer((req, res) => {
      sinkHits.push({ url: req.url ?? '', headers: req.headers })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    })
    await new Promise<void>(resolve => sinkSrv.listen(0, '127.0.0.1', resolve))
    const sinkOrigin = `http://127.0.0.1:${(sinkSrv.address() as AddressInfo).port}`

    const redirectSrv = createServer((_req, res) => {
      res.writeHead(302, { Location: `${sinkOrigin}/steal` })
      res.end()
    })
    await new Promise<void>(resolve => redirectSrv.listen(0, '127.0.0.1', resolve))
    const redirectOrigin = `http://127.0.0.1:${(redirectSrv.address() as AddressInfo).port}`

    try {
      const api = new XPeachApi({
        baseURL: redirectOrigin,
        timeoutMs: 5000,
        resolveKey: async () => 'sk-secret-relay-key',
        resolveAdmin: () => undefined,
        resolveCookie: () => undefined,
      })
      const signal = AbortSignal.timeout(5000)

      await expect(api.tokenUsage(signal)).rejects.toMatchObject({
        code: 'xpeach/request-failed',
        details: { status: 302, message: 'redirect-blocked' },
      })
      await expect(
        api.chat({ model: 'claude-sonnet-4-5', prompt: 'hi' }, signal),
      ).rejects.toMatchObject({
        code: 'xpeach/request-failed',
        details: { status: 302, message: 'redirect-blocked' },
      })
      await expect(
        api.chatStream({ model: 'claude-sonnet-4-5', prompt: 'hi' }, () => {}, signal),
      ).rejects.toMatchObject({
        code: 'xpeach/request-failed',
        details: { status: 302, message: 'redirect-blocked' },
      })
      const probeRes = await api.probe('claude-sonnet-4-5', signal)
      expect(probeRes.ok).toBe(false)
      expect(probeRes.error).toContain('302')

      // Verify network.ts probeRoutes passes redirect: 'manual' and rejects 3xx
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
        expect(init?.redirect).toBe('manual')
        return new Response(null, { status: 302, headers: { Location: `${sinkOrigin}/steal` } })
      })
      const routeProbes = await probeRoutes('sk-secret-relay-key', 2000)
      expect(routeProbes.every(p => !p.ok)).toBe(true)
      expect(fetchSpy).toHaveBeenCalled()

      expect(sinkHits).toEqual([])
    } finally {
      await new Promise<void>(resolve => redirectSrv.close(() => { resolve() }))
      await new Promise<void>(resolve => sinkSrv.close(() => { resolve() }))
    }
  })

  it('chatStream 在读取异常或中止时取消底层 reader 释放连接', async () => {
    const cancelSpy = vi.fn().mockResolvedValue(undefined)
    const releaseSpy = vi.fn()
    const mockRes = new Response(null, { status: 200 })
    Object.defineProperty(mockRes, 'body', {
      value: {
        getReader: () => ({
          read: vi.fn().mockRejectedValue(new Error('stream aborted mid-flight')),
          cancel: cancelSpy,
          releaseLock: releaseSpy,
        }),
      },
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockRes)

    const api = new XPeachApi({
      baseURL: 'http://127.0.0.1:13000',
      timeoutMs: 5000,
      resolveKey: async () => 'sk-stream-test',
      resolveAdmin: () => undefined,
      resolveCookie: () => undefined,
    })

    await expect(
      api.chatStream({ model: 'gpt-4o', prompt: 'hello' }, () => {}, AbortSignal.timeout(5000)),
    ).rejects.toThrow('stream aborted mid-flight')
    expect(cancelSpy).toHaveBeenCalledTimes(1)
    expect(releaseSpy).toHaveBeenCalledTimes(1)
  })

  it('probeNetwork 对自定义/本地端点绝不访问生产 ROUTES 也不劫持 activeBaseURL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const target = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      throw new Error(`custom endpoint must not probe production route: ${target}`)
    })
    const applyRouteSpy = vi.fn()

    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(account, {
      baseURL: 'http://127.0.0.1:13000',
      activeBaseURL: 'http://127.0.0.1:13000',
      networkAuto: true,
      networkHistory: {},
      timeoutMs: 5000,
      resolveKey: vi.fn().mockResolvedValue('sk-custom-local-key'),
      applyRoute: applyRouteSpy,
    })

    const probe = Reflect.get(XPeachAccount.prototype, 'probeNetwork') as () => Promise<{ active: string; probes: unknown[] }>
    const snap = await probe.call(account)
    expect(snap.active).toBe('http://127.0.0.1:13000')
    expect(snap.probes).toEqual([])
    expect(Reflect.get(account, 'activeBaseURL')).toBe('http://127.0.0.1:13000')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(applyRouteSpy).not.toHaveBeenCalled()
  })

  it('跨进程 refresh_token 并发轮换竞态不会擦除磁盘上已更新的凭据，且持久化失败与 Caller 1 中止被正确隔离', async () => {
    const home = freshTempHome()
    const profile = join(home, 'profiles', 'xpeach')
    mkdirSync(profile, { recursive: true })
    const keyFile = join(profile, 'xpeach.key')
    const adminKeyFile = join(profile, 'xpeach.admin')
    const sessionKeyFile = join(profile, 'xpeach.session')
    const ssoStateFile = join(profile, 'xpeach.sso.json')

    writeFileSync(keyFile, 'sk-race-active-key\n', { mode: 0o600 })
    writeFileSync(adminKeyFile, 'admin-race-token\n', { mode: 0o600 })
    writeFileSync(
      ssoStateFile,
      JSON.stringify({
        accessToken: 'xph_at_old_1',
        refreshToken: 'xph_rt_old_1',
        expiresIn: 3600,
        boundAt: Date.now(),
        user: { id: 'u1', username: 'raceuser', email: 'race@xpeach.invalid' },
      }),
      { mode: 0o600 },
    )

    // Scenario A: Another process rotates xpeach.sso.json on disk while Process A's verify returns 'revoked'
    const ssoCredsMock = vi.fn().mockImplementation(async () => {
      writeFileSync(
        ssoStateFile,
        JSON.stringify({
          accessToken: 'xph_at_rotated_by_proc_b',
          refreshToken: 'xph_rt_rotated_by_proc_b',
          expiresIn: 3600,
          boundAt: Date.now(),
          user: { id: 'u1', username: 'raceuser', email: 'race@xpeach.invalid' },
        }),
        { mode: 0o600 },
      )
      return { status: 'revoked' as const, revoked: true as const, code: 401 as const, message: 'invalid_grant' }
    })

    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(account, {
      liveConfig: { ssoBaseURL: 'https://sso.xpeach.codes', ssoClientId: 'xpeach-harness' },
      baseURL: 'https://fast.xpeach.codes',
      activeBaseURL: 'https://fast.xpeach.codes',
      keyFile,
      keyVar: 'XPEACH_RACE_RELAY_KEY',
      adminKeyFile,
      adminKeyVar: 'XPEACH_RACE_ADMIN_KEY',
      sessionKeyFile,
      sessionKeyVar: 'XPEACH_RACE_SESSION_KEY',
      ssoStateFile,
      apiKeyEnv: 'XPEACH_API_KEY',
      timeoutMs: 5000,
      lastSsoVerifyAt: 0,
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        ssoPeachcodeCredentials: ssoCredsMock,
        ssoRevokeToken: vi.fn().mockResolvedValue(true),
        setAdminKey: vi.fn(),
        setSessionKey: vi.fn(),
        setBaseURL: vi.fn(),
      },
      ctx: { emit: vi.fn(), get: () => undefined },
    })

    const res = await account.verifyAndSyncSsoSession(true)
    expect(res.valid).toBe(true)
    expect(res.status).toBe('ok')
    expect(existsSync(keyFile)).toBe(true)
    expect(existsSync(ssoStateFile)).toBe(true)
    const onDisk = JSON.parse(readFileSync(ssoStateFile, 'utf8')) as { accessToken: string; refreshToken: string }
    expect(onDisk.accessToken).toBe('xph_at_rotated_by_proc_b')
    expect(onDisk.refreshToken).toBe('xph_rt_rotated_by_proc_b')

    // Scenario B: Caller 1 aborting does NOT cancel Caller 2 waiting on shared ssoVerifyPromise
    const gate = Promise.withResolvers<undefined>()
    ssoCredsMock.mockImplementationOnce(async (_url: string, _at: string, sig: AbortSignal) => {
      await gate.promise
      expect(sig.aborted).toBe(false)
      return {
        status: 'ok' as const,
        payload: {
          sso: {
            accessToken: 'xph_at_rotated_by_proc_b',
            refreshToken: 'xph_rt_rotated_by_proc_b',
            expiresIn: 3600,
            user: { id: 'u1', username: 'raceuser', email: 'race@xpeach.invalid' },
          },
          peachcode: { baseUrl: 'https://fast.xpeach.codes', username: 'raceuser' },
        },
      }
    })
    const c1 = new AbortController()
    const c2 = new AbortController()
    const p1 = account.verifyAndSyncSsoSession(true, c1.signal)
    const p2 = account.verifyAndSyncSsoSession(true, c2.signal)
    c1.abort(new Error('caller-1-cancelled'))
    await expect(p1).rejects.toThrow('caller-1-cancelled')
    gate.resolve(undefined)
    await expect(p2).resolves.toMatchObject({ valid: true, status: 'ok' })

    // Scenario C: Persisting a newly rotated refreshToken must surface write failure instead of swallowing
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const origWriteState = Reflect.get(account, 'writeState') as (p: string, b: string) => void
    Reflect.set(account, 'writeState', (p: string, b: string) => {
      if (p === ssoStateFile) throw new Error('ENOSPC: disk full')
      origWriteState.call(account, p, b)
    })
    ssoCredsMock.mockResolvedValueOnce({
      status: 'ok' as const,
      payload: {
        sso: {
          accessToken: 'xph_at_new_unsaved',
          refreshToken: 'xph_rt_new_unsaved',
          expiresIn: 3600,
          user: { id: 'u1', username: 'raceuser', email: 'race@xpeach.invalid' },
        },
        peachcode: { baseUrl: 'https://fast.xpeach.codes', username: 'raceuser' },
      },
    })
    let persistFailure: unknown
    try {
      await account.verifyAndSyncSsoSession(true)
    } catch (err) {
      persistFailure = err
    }
    expect(persistFailure).toMatchObject({ code: 'xpeach/request-failed' })
    expect((persistFailure as { details?: { message?: string } }).details?.message).toContain('sso-persist-failed')
    expect(errSpy).toHaveBeenCalled()
  })

  it('XPeachDeepSeekAccount.resolveToken 校验目标 origin，拒绝向非授权域释放中转密钥', async () => {
    const resolveKeySpy = vi.fn().mockResolvedValue('sk-xphVerifiedRelayKey')
    const officialAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(officialAccount, {
      baseURL: 'https://fast.xpeach.codes',
      activeBaseURL: 'https://fast.xpeach.codes',
      isBound: () => true,
      currentSiteRoot: () => 'https://fast.xpeach.codes',
      resolveVerifiedRelayKey: resolveKeySpy,
    })
    const bridge = Object.create(XPeachDeepSeekAccount.prototype) as XPeachDeepSeekAccount
    Object.assign(bridge, { account: officialAccount })

    expect(await bridge.resolveToken('https://evil.example/v1')).toBeUndefined()
    expect(await bridge.resolveToken('http://fast.xpeach.codes/v1')).toBeUndefined()
    expect(await bridge.resolveToken('https://fast.xpeach.codes.evil.example/v1')).toBeUndefined()
    expect(await bridge.resolveToken('https://user:pass@fast.xpeach.codes/v1')).toBeUndefined()
    expect(await bridge.resolveToken('not-a-valid-url')).toBeUndefined()
    expect(resolveKeySpy).not.toHaveBeenCalled()

    expect(await bridge.resolveToken('https://fast.xpeach.codes/v1/chat/completions')).toBe('sk-xphVerifiedRelayKey')
    expect(await bridge.resolveToken('https://xpeach.codes/v1/models')).toBe('sk-xphVerifiedRelayKey')
    expect(resolveKeySpy).toHaveBeenCalledTimes(2)

    // Custom local endpoint must NOT release key to production ROUTES
    const customResolveSpy = vi.fn().mockResolvedValue('sk-custom-only')
    const customAccount = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(customAccount, {
      baseURL: 'http://127.0.0.1:13000',
      activeBaseURL: 'http://127.0.0.1:13000',
      isBound: () => true,
      currentSiteRoot: () => 'http://127.0.0.1:13000',
      resolveVerifiedRelayKey: customResolveSpy,
    })
    const customBridge = Object.create(XPeachDeepSeekAccount.prototype) as XPeachDeepSeekAccount
    Object.assign(customBridge, { account: customAccount })

    expect(await customBridge.resolveToken('https://fast.xpeach.codes/v1')).toBeUndefined()
    expect(await customBridge.resolveToken('https://evil.example/v1')).toBeUndefined()
    expect(await customBridge.resolveToken('http://127.0.0.1:13000/v1/chat/completions')).toBe('sk-custom-only')
    expect(customResolveSpy).toHaveBeenCalledTimes(1)
  })

  it('bootstrapKey 与 bindSession 不再写入 process.env[sessionKeyVar]，且 scrubbedBrowserEnv 过滤敏感变量', async () => {
    const home = freshTempHome()
    const profile = join(home, 'profiles', 'xpeach')
    mkdirSync(profile, { recursive: true })
    const sessionKeyFile = join(profile, 'xpeach.session')
    const sessionVar = 'XPEACH_TEST_NO_ENV_LEAK_SESSION'
    Reflect.deleteProperty(process.env, sessionVar)

    const setSessionKey = vi.fn()
    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(account, {
      liveConfig: {},
      keyFile: join(profile, 'xpeach.key'),
      keyVar: 'XPEACH_TEST_NO_ENV_RELAY',
      adminKeyFile: join(profile, 'xpeach.admin'),
      adminKeyVar: 'XPEACH_TEST_NO_ENV_ADMIN',
      sessionKeyFile,
      sessionKeyVar: sessionVar,
      ssoStateFile: join(profile, 'xpeach.sso.json'),
      routeFile: join(profile, 'xpeach.route.json'),
      apiKeyEnv: 'XPEACH_TEST_NO_ENV_API',
      timeoutMs: 5000,
      api: {
        siteBaseURL: 'https://session-probe-test.invalid',
        setSessionKey,
        setAdminKey: vi.fn(),
      },
      ctx: { emit: vi.fn(), get: () => undefined },
    })

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : input)
      expect(url.origin).toBe('https://session-probe-test.invalid')
      expect(url.pathname).toBe('/api/user/self')
      const headers = new Headers(init?.headers)
      if (headers.get('Cookie') === 'session=bad-cookie-value') {
        return Response.json({ success: false, message: 'invalid session' }, { status: 401 })
      }
      expect(headers.get('Cookie')).toBe('session=raw-cookie-secret-value')
      return Response.json({ success: true, data: { username: 'cookie-user' } }, { status: 200 })
    })
    try {
      // Failed probe must never mutate shared this.api.setSessionKey override
      await expect(account.bindSession('bad-cookie-value', AbortSignal.timeout(5000))).rejects.toThrow('invalid session')
      expect(setSessionKey).not.toHaveBeenCalled()

      const bound = await account.bindSession('raw-cookie-secret-value', AbortSignal.timeout(5000))
      expect(bound).toEqual({ bound: true, as: 'cookie-user' })
      expect(process.env[sessionVar]).toBeUndefined()
      expect(readFileSync(sessionKeyFile, 'utf8').trim()).toBe('raw-cookie-secret-value')
      expect(setSessionKey).toHaveBeenCalledTimes(1)
      expect(setSessionKey).toHaveBeenLastCalledWith('raw-cookie-secret-value')
    } finally {
      fetchSpy.mockRestore()
    }

    // Cold bootstrap with xpeach.session on disk also keeps cookie out of process.env
    setSessionKey.mockClear()
    const bootstrap = Reflect.get(XPeachAccount.prototype, 'bootstrapKey') as () => Promise<void>
    await bootstrap.call(account)
    expect(process.env[sessionVar]).toBeUndefined()
    expect(setSessionKey).toHaveBeenCalledWith('raw-cookie-secret-value')

    const browserEnv = scrubbedBrowserEnv({
      PATH: '/usr/bin',
      HOME: '/Users/tester',
      XPEACH_SESSION: 'secret',
      XPEACH_RELAY_KEY: 'secret',
      XPH_HOME: '/tmp/home',
      DSH_PROFILE: 'xpeach',
      APP_COOKIE: 'secret',
      CUSTOM_AUTH_HEADER: 'secret',
      SAFE_LANG: 'zh_CN.UTF-8',
    })
    expect(browserEnv).toEqual({
      PATH: '/usr/bin',
      HOME: '/Users/tester',
      SAFE_LANG: 'zh_CN.UTF-8',
    })
  })

  it('applySsoBridgePayload 与 verifyAndSyncSsoSession 使用 validateSsoBaseUrl 拒绝非法 peach.baseUrl', async () => {
    const home = freshTempHome()
    const profile = join(home, 'profiles', 'xpeach')
    mkdirSync(profile, { recursive: true })
    const keyFile = join(profile, 'xpeach.key')
    const ssoStateFile = join(profile, 'xpeach.sso.json')
    writeFileSync(keyFile, 'sk-base-url-test\n', { mode: 0o600 })
    writeFileSync(
      ssoStateFile,
      JSON.stringify({ accessToken: 'xph_at_valid', expiresIn: 3600, boundAt: Date.now() }),
      { mode: 0o600 },
    )

    const setBaseURL = vi.fn()
    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(account, {
      liveConfig: { ssoBaseURL: 'https://sso.xpeach.codes', ssoClientId: 'xpeach-harness' },
      baseURL: 'https://fast.xpeach.codes',
      activeBaseURL: 'https://fast.xpeach.codes',
      keyFile,
      keyVar: 'XPEACH_BASEURL_RELAY',
      adminKeyFile: join(profile, 'xpeach.admin'),
      adminKeyVar: 'XPEACH_BASEURL_ADMIN',
      sessionKeyFile: join(profile, 'xpeach.session'),
      sessionKeyVar: 'XPEACH_BASEURL_SESSION',
      ssoStateFile,
      apiKeyEnv: 'XPEACH_API_KEY',
      timeoutMs: 5000,
      lastSsoVerifyAt: 0,
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        setBaseURL,
        setAdminKey: vi.fn(),
        setSessionKey: vi.fn(),
        ssoPeachcodeCredentials: vi.fn().mockResolvedValue({
          status: 'ok' as const,
          payload: {
            sso: { accessToken: 'xph_at_valid', expiresIn: 3600 },
            peachcode: { baseUrl: 'http://evil.example/v1' },
          },
        }),
      },
      ctx: { emit: vi.fn(), get: () => undefined },
    })

    const applyBridge = Reflect.get(XPeachAccount.prototype, 'applySsoBridgePayload') as (
      payload: unknown,
      signal: AbortSignal,
    ) => Promise<unknown>
    await expect(
      applyBridge.call(
        account,
        { peachcode: { baseUrl: 'http://evil.example/v1', apiKey: 'sk-test' } },
        AbortSignal.timeout(5000),
      ),
    ).rejects.toMatchObject({ code: 'xpeach/invalid-sso-url' })

    await expect(account.verifyAndSyncSsoSession(true)).rejects.toMatchObject({
      code: 'xpeach/invalid-sso-url',
    })
    expect(setBaseURL).not.toHaveBeenCalled()
    expect(Reflect.get(account, 'activeBaseURL')).toBe('https://fast.xpeach.codes')
  })

  it('已删除遗留 sessionLoginInteractive 死代码，且 scrubbedSqliteEnv 过滤凭据与宿主前缀变量', () => {
    expect('sessionLoginInteractive' in XPeachApi.prototype).toBe(false)
    const sqliteEnv = scrubbedSqliteEnv({
      PATH: '/usr/bin',
      HOME: '/Users/tester',
      LANG: 'en_US.UTF-8',
      XPEACH_RELAY_KEY: 'sk-secret',
      XPEACH_ADMIN_KEY: 'adm-secret',
      XPH_HOME: '/tmp/home',
      DSH_PROFILE: 'xpeach',
      OPENAI_API_KEY: 'sk-other',
      MY_PASSWORD: 'pw',
      AUTH_HEADER: 'bearer',
      SESSION_ID: 'sess',
      COOKIE_JAR: 'cookie',
      APP_TOKEN: 'tok',
      CLIENT_SECRET: 'sec',
    })
    expect(sqliteEnv).toEqual({
      PATH: '/usr/bin',
      HOME: '/Users/tester',
      LANG: 'en_US.UTF-8',
    })
  })

  it('applySsoBridgePayload 在中转密钥铸造失败时不在磁盘、镜像目录或环境变量留下孤立 SSO/Admin 凭据', async () => {
    const home = freshTempHome()
    const profile = join(home, 'profiles', 'xpeach')
    const desktopProfile = join(home, 'profiles', 'xpeach-desktop')
    mkdirSync(profile, { recursive: true })
    mkdirSync(desktopProfile, { recursive: true })
    vi.stubEnv('XPH_HOME', home)
    vi.stubEnv('DSH_HOME', home)

    const adminKeyVar = 'XPEACH_TEST_MINT_FAIL_ADMIN_KEY'
    Reflect.deleteProperty(process.env, adminKeyVar)
    const signedOutMarker = join(home, '.xpeach-signed-out')
    writeFileSync(signedOutMarker, '2026-11-19T00:00:00Z\n', { mode: 0o600 })

    const setBaseURL = vi.fn()
    const setAdminKey = vi.fn()
    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(account, {
      liveConfig: { ssoBaseURL: 'https://sso.xpeach.codes', ssoClientId: 'xpeach-harness' },
      baseURL: 'https://fast.xpeach.codes',
      activeBaseURL: 'https://fast.xpeach.codes',
      keyFile: join(profile, 'xpeach.key'),
      keyVar: 'XPEACH_TEST_MINT_FAIL_RELAY_KEY',
      adminKeyFile: join(profile, 'xpeach.admin'),
      adminKeyVar,
      sessionKeyFile: join(profile, 'xpeach.session'),
      sessionKeyVar: 'XPEACH_TEST_MINT_FAIL_SESSION_KEY',
      ssoStateFile: join(profile, 'xpeach.sso.json'),
      routeFile: join(profile, 'xpeach.route.json'),
      apiKeyEnv: 'XPEACH_TEST_MINT_FAIL_API_KEY',
      timeoutMs: 5000,
      lastSsoVerifyAt: 0,
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        setBaseURL,
        setAdminKey,
        setSessionKey: vi.fn(),
      },
      ctx: { emit: vi.fn(), get: () => undefined },
    })

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : input)
      expect(url.origin).toBe('https://candidate-relay.invalid')
      const headers = new Headers(init?.headers)
      expect(headers.get('Authorization')).toBe('xph_at_mint_fail_admin_token')
      return Response.json({ success: false, message: 'relay token service unavailable' }, { status: 503 })
    })

    try {
      const applyBridge = Reflect.get(XPeachAccount.prototype, 'applySsoBridgePayload') as (
        payload: unknown,
        signal: AbortSignal,
      ) => Promise<{ status: string; bound: boolean; message?: string }>
      const result = await applyBridge.call(
        account,
        {
          sso: {
            accessToken: 'xph_at_orphan_candidate',
            refreshToken: 'xph_rt_orphan_candidate',
            expiresIn: 3600,
            user: { id: 'u-orphan', username: 'orphan', email: 'orphan@xpeach.invalid' },
          },
          peachcode: {
            baseUrl: 'https://candidate-relay.invalid',
            username: 'orphan',
            accessToken: 'xph_at_mint_fail_admin_token',
          },
        },
        AbortSignal.timeout(5000),
      )

      expect(result.status).toBe('error')
      expect(result.bound).toBe(false)
      expect(setAdminKey).not.toHaveBeenCalled()
      expect(setBaseURL).not.toHaveBeenCalled()
      expect(Reflect.get(account, 'activeBaseURL')).toBe('https://fast.xpeach.codes')
      expect(process.env[adminKeyVar]).toBeUndefined()
      expect(existsSync(signedOutMarker)).toBe(true)

      for (const dir of [profile, home, desktopProfile]) {
        expect(existsSync(join(dir, 'xpeach.sso.json')), `orphaned xpeach.sso.json in ${dir}`).toBe(false)
        expect(existsSync(join(dir, 'xpeach.admin')), `orphaned xpeach.admin in ${dir}`).toBe(false)
        expect(existsSync(join(dir, 'xpeach.key')), `orphaned xpeach.key in ${dir}`).toBe(false)
      }
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('sleepWithAbort、sessionLoginOp 与 pollDeviceAttempt 在 AbortSignal 触发时立即唤醒取消', async () => {
    // 1. sleepWithAbort wakes immediately instead of waiting 30s
    const cSleep = new AbortController()
    const sleepStart = Date.now()
    const sleepPromise = sleepWithAbort(30_000, cSleep.signal)
    setTimeout(() => { cSleep.abort(new Error('sleep-cancelled')) }, 15)
    await expect(sleepPromise).rejects.toThrow('sleep-cancelled')
    expect(Date.now() - sleepStart).toBeLessThan(1000)

    // 2. sessionLoginOp device-flow poll sleep wakes immediately on AbortSignal
    vi.stubEnv('XPEACH_SSO_LOGIN_MODE', 'device')
    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    const pollSpy = vi.fn()
    Object.assign(account, {
      ssoDeviceStartOp: vi.fn().mockResolvedValue({
        deviceCode: 'dev-abort-sleep',
        userCode: 'ABRT-1234',
        verificationUri: 'https://sso.xpeach.codes/device',
        verificationUriComplete: 'https://sso.xpeach.codes/device?user_code=ABRT-1234',
        expiresIn: 300,
        interval: 30,
        browserOpened: false,
      }),
      ssoDevicePollOp: pollSpy,
    })
    const cLogin = new AbortController()
    const loginStart = Date.now()
    const loginPromise = account.sessionLoginOp(cLogin.signal)
    setTimeout(() => { cLogin.abort(new Error('login-cancelled-during-sleep')) }, 20)
    await expect(loginPromise).rejects.toThrow('login-cancelled-during-sleep')
    expect(Date.now() - loginStart).toBeLessThan(1000)
    expect(pollSpy).not.toHaveBeenCalled()

    // 3. XPeachDeepSeekAccount.pollDeviceAttempt exits immediately when aborted mid-sleep
    const bridge = Object.create(XPeachDeepSeekAccount.prototype) as XPeachDeepSeekAccount
    const bridgePollSpy = vi.fn()
    Object.assign(bridge, {
      account: { ssoDevicePollOp: bridgePollSpy },
      attempt: { id: 'att-1', phase: 'waiting-browser', expiresAt: Date.now() + 60_000 },
      notifyWatchers: vi.fn(),
    })
    const pollDeviceAttempt = Reflect.get(XPeachDeepSeekAccount.prototype, 'pollDeviceAttempt') as (
      attemptId: string,
      deviceCode: string,
      intervalSec: number,
      signal: AbortSignal,
    ) => Promise<void>
    const cBridge = new AbortController()
    const bridgeStart = Date.now()
    const bridgePromise = pollDeviceAttempt.call(bridge, 'att-1', 'dev-bridge-abort', 30, cBridge.signal)
    setTimeout(() => { cBridge.abort() }, 20)
    await expect(bridgePromise).resolves.toBeUndefined()
    expect(Date.now() - bridgeStart).toBeLessThan(1000)
    expect(bridgePollSpy).not.toHaveBeenCalled()
  })

  it('单飞共享操作 (usageInFlight/ssoDevicePollInFlight/catalogSyncPromise/updateCheckInFlight) 隔离 Caller 1 的 AbortSignal', async () => {
    const home = freshTempHome()
    const profile = join(home, 'profiles', 'xpeach')
    mkdirSync(profile, { recursive: true })
    const keyFile = join(profile, 'xpeach.key')
    writeFileSync(keyFile, 'sk-singleflight-test-key\n', { mode: 0o600 })

    // 1. usageInFlight
    const usageGate = Promise.withResolvers<undefined>()
    const tokenUsageMock = vi.fn(async (sig: AbortSignal) => {
      await usageGate.promise
      expect(sig.aborted).toBe(false)
      return {
        name: 'sf-token',
        total_granted: 100,
        total_used: 10,
        total_available: 90,
        expires_at: 0,
        unlimited_quota: false,
        model_limits_enabled: false,
      }
    })
    // 2. ssoDevicePollInFlight
    const pollGate = Promise.withResolvers<undefined>()
    const deviceTokenMock = vi.fn(async (_url: string, _cid: string, _code: string, sig: AbortSignal) => {
      await pollGate.promise
      expect(sig.aborted).toBe(false)
      return { status: 'pending' as const }
    })
    // 3. catalogSyncPromise
    const syncGate = Promise.withResolvers<undefined>()
    const runSyncMock = vi.fn(async (sig: AbortSignal) => {
      await syncGate.promise
      expect(sig.aborted).toBe(false)
      return { ok: true, count: 3, groups: ['SWE'] }
    })
    // 4. updateCheckInFlight
    const updateGate = Promise.withResolvers<undefined>()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      await updateGate.promise
      expect(init?.signal?.aborted).toBe(false)
      return Response.json([
        {
          tag_name: 'v0.0.99-alpha',
          draft: false,
          html_url: 'https://github.com/yellowpeachxgp/xpeach-harness/releases/tag/v0.0.99-alpha',
          body: 'release',
        },
      ])
    })

    const account = Object.create(XPeachAccount.prototype) as XPeachAccount
    Object.assign(account, {
      liveConfig: { ssoBaseURL: 'https://sso.xpeach.codes', ssoClientId: 'xpeach-harness' },
      keyFile,
      keyVar: 'XPEACH_SF_RELAY',
      adminKeyFile: join(profile, 'xpeach.admin'),
      adminKeyVar: 'XPEACH_SF_ADMIN',
      sessionKeyFile: join(profile, 'xpeach.session'),
      sessionKeyVar: 'XPEACH_SF_SESSION',
      ssoStateFile: join(profile, 'xpeach.sso.json'),
      apiKeyEnv: 'XPEACH_SF_API',
      timeoutMs: 5000,
      api: {
        siteBaseURL: 'https://fast.xpeach.codes',
        tokenUsage: tokenUsageMock,
        ssoDeviceToken: deviceTokenMock,
      },
      ctx: { emit: vi.fn(), get: () => undefined },
      runSyncModelCatalog: runSyncMock,
    })

    try {
      // usageInFlight: Caller 1 aborts, Caller 2 succeeds
      const u1 = new AbortController()
      const u2 = new AbortController()
      const up1 = account.tokenUsage({}, u1.signal)
      const up2 = account.tokenUsage({}, u2.signal)
      u1.abort(new Error('usage-c1-abort'))
      await expect(up1).rejects.toThrow('usage-c1-abort')
      usageGate.resolve(undefined)
      await expect(up2).resolves.toMatchObject({ name: 'sf-token', total_available: 90 })
      expect(tokenUsageMock).toHaveBeenCalledTimes(1)

      // ssoDevicePollInFlight: Caller 1 aborts, Caller 2 succeeds
      const d1 = new AbortController()
      const d2 = new AbortController()
      const dp1 = account.ssoDevicePollOp({ deviceCode: 'dev-sf-1' }, d1.signal)
      const dp2 = account.ssoDevicePollOp({ deviceCode: 'dev-sf-1' }, d2.signal)
      d1.abort(new Error('poll-c1-abort'))
      await expect(dp1).rejects.toThrow('poll-c1-abort')
      pollGate.resolve(undefined)
      await expect(dp2).resolves.toEqual({ status: 'pending' })
      expect(deviceTokenMock).toHaveBeenCalledTimes(1)

      // catalogSyncPromise: Caller 1 aborts, Caller 2 succeeds
      const s1 = new AbortController()
      const s2 = new AbortController()
      const sp1 = account.syncModelsOp({}, s1.signal)
      const sp2 = account.syncModelsOp({}, s2.signal)
      s1.abort(new Error('sync-c1-abort'))
      await expect(sp1).rejects.toThrow('sync-c1-abort')
      syncGate.resolve(undefined)
      await expect(sp2).resolves.toEqual({ ok: true, count: 3, groups: ['SWE'] })
      expect(runSyncMock).toHaveBeenCalledTimes(1)

      // updateCheckInFlight: Caller 1 aborts, Caller 2 succeeds
      const r1 = new AbortController()
      const r2 = new AbortController()
      const fetchReleases = Reflect.get(XPeachAccount.prototype, 'fetchGitHubReleaseCandidates') as (
        force: boolean,
        signal?: AbortSignal,
      ) => Promise<readonly { version: string }[]>
      const rp1 = fetchReleases.call(account, true, r1.signal)
      const rp2 = fetchReleases.call(account, true, r2.signal)
      r1.abort(new Error('update-c1-abort'))
      await expect(rp1).rejects.toThrow('update-c1-abort')
      updateGate.resolve(undefined)
      const releases = await rp2
      expect(releases[0]?.version).toBe('0.0.99-alpha')
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('支持多租户 /t/acme issuer 发现、PKCE 预检 client/redirect 回退及租户级 Device/Revoke 闭环', async () => {
    expect(parseSsoIssuer('https://sso.xpeach.codes/t/acme/')).toEqual({
      origin: 'https://sso.xpeach.codes',
      tenantSlug: 'acme',
      issuer: 'https://sso.xpeach.codes/t/acme',
    })
    expect(validateSsoBaseUrl('https://sso.xpeach.codes/t/acme')).toBe('https://sso.xpeach.codes/t/acme')
    expect(validateSsoBaseUrl('https://sso.xpeach.codes/device')).toBe('https://sso.xpeach.codes')

    const seenAuthClients: string[] = []
    const seenPaths: string[] = []
    let lastNonce = ''
    let tenantSsoOrigin = ''

    const tenantSsoSrv = createServer((req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        const url = new URL(req.url ?? '/', 'http://127.0.0.1')
        seenPaths.push(`${req.method ?? 'GET'} ${url.pathname}`)
        const send = (status: number, body: unknown, extraHeaders: Record<string, string> = {}): void => {
          res.writeHead(status, {
            'content-type': 'application/json',
            'cache-control': 'no-store',
            ...extraHeaders,
          })
          res.end(JSON.stringify(body))
        }

        if (req.method === 'GET' && url.pathname === '/t/acme/auth') {
          const cid = url.searchParams.get('client_id') ?? ''
          const ruri = url.searchParams.get('redirect_uri') ?? ''
          seenAuthClients.push(`${cid}|${new URL(ruri).pathname}`)
          if (cid === 'xpeach-harness') {
            send(400, { error: 'invalid_client', error_description: 'unknown client' })
            return
          }
          if (new URL(ruri).pathname !== '/callback') {
            send(400, { error: 'invalid_redirect_uri', error_description: 'redirect_uri not registered' })
            return
          }
          lastNonce = url.searchParams.get('nonce') ?? ''
          res.writeHead(303, { location: '/portal/login?return_to=%2Ft%2Facme%2Fauth' })
          res.end()
          return
        }
        if (req.method === 'GET' && url.pathname === '/t/acme/jwks') {
          send(200, { keys: [jwk] })
          return
        }
        if (req.method === 'POST' && url.pathname === '/t/acme/device/auth') {
          const form = new URLSearchParams(raw)
          const cid = form.get('client_id') ?? ''
          if (cid === 'xpeach-harness') {
            send(400, { error: 'invalid_client', error_description: 'unknown client' })
            return
          }
          send(200, {
            device_code: 'dvc_tenant_001',
            user_code: 'ACME-8899',
            verification_uri: `${tenantSsoOrigin}/t/acme/device`,
            verification_uri_complete: `${tenantSsoOrigin}/t/acme/device?code=ACME-8899`,
            expires_in: 600,
            interval: 2,
          })
          return
        }
        if (req.method === 'POST' && url.pathname === '/t/acme/token') {
          const form = new URLSearchParams(raw)
          const grantType = form.get('grant_type')
          const cid = form.get('client_id') ?? ''
          if (cid !== 'peachcode-cli') {
            send(400, { error: 'invalid_client', error_description: 'unknown client' })
            return
          }
          const nowSec = Math.floor(Date.now() / 1000)
          const idToken = signTestJwt(privPem, 'harness-k1', {
            iss: `${tenantSsoOrigin}/t/acme`,
            sub: 'sub-tenant-user',
            aud: 'peachcode-cli',
            exp: nowSec + 600,
            iat: nowSec - 5,
            ...(grantType === 'authorization_code' && lastNonce ? { nonce: lastNonce } : {}),
            preferred_username: 'acme_user',
          })
          send(200, {
            access_token: 'xph_at_tenant_live_001',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'xph_rt_tenant_live_001',
            id_token: idToken,
          })
          return
        }
        if (req.method === 'GET' && url.pathname === '/api/internal/verify') {
          send(200, {
            api_version: 'v1',
            request_id: 'r-tenant-verify',
            timestamp: '2026-11-20T00:00:00Z',
            ok: true,
            active: true,
            sub: 'sub-tenant-user',
            username: 'acme_user',
            email: 'acme@xpeach.invalid',
            email_verified: true,
            name: 'Acme User',
            group: 'default',
            aff_code: 'ACME01',
            inviter_sub: null,
            invited_from_site: null,
            tenant_id: '22222222-2222-4222-8222-222222222222',
            tenant_slug: 'acme',
            issuer: `${tenantSsoOrigin}/t/acme`,
            client_id: 'peachcode-cli',
            scope: 'openid profile email offline_access api',
            exp: Math.floor(Date.now() / 1000) + 3600,
            format: 'jwt',
            roles: ['member'],
          }, {
            pragma: 'no-cache',
            'x-auth-user': 'sub-tenant-user',
            'x-auth-username': 'acme_user',
            'x-auth-email': 'acme@xpeach.invalid',
            'x-auth-group': 'default',
            'x-auth-aff-code': 'ACME01',
            'x-auth-inviter': '',
            'x-auth-tenant': 'acme',
            'x-auth-roles': 'member',
          })
          return
        }
        if (req.method === 'POST' && url.pathname === '/t/acme/token/revocation') {
          res.writeHead(200, { 'cache-control': 'no-store' })
          res.end()
          return
        }
        send(404, { status: 404, title: 'not_found', code: 'not_found' })
      })
    })
    await new Promise<void>(resolve => tenantSsoSrv.listen(0, '127.0.0.1', () => { resolve() }))
    tenantSsoOrigin = `http://127.0.0.1:${String((tenantSsoSrv.address() as AddressInfo).port)}`

    let advertisedEndpoint = `${tenantSsoOrigin}/t/acme/auth`
    const siteSrv = createServer((req, res) => {
      if (req.url === '/api/status') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({
          success: true,
          data: { oidc_enabled: true, oidc_authorization_endpoint: advertisedEndpoint },
        }))
        return
      }
      res.writeHead(404)
      res.end()
    })
    await new Promise<void>(resolve => siteSrv.listen(0, '127.0.0.1', () => { resolve() }))
    const siteBase = `http://127.0.0.1:${String((siteSrv.address() as AddressInfo).port)}`

    try {
      const api = new XPeachApi({
        baseURL: siteBase,
        timeoutMs: 5000,
        resolveKey: async () => 'sk-tenant',
        resolveAdmin: () => undefined,
        resolveCookie: () => undefined,
      })
      const signal = AbortSignal.timeout(10_000)

      // 1. Discover tenant issuer from /api/status
      const discovered = await api.discoverSsoIssuer(tenantSsoOrigin, signal)
      expect(discovered).toBe(`${tenantSsoOrigin}/t/acme`)

      // Cross-origin advertisement is rejected (falls back to configured origin)
      advertisedEndpoint = 'https://evil.example/t/acme/auth'
      const apiCrossOrigin = new XPeachApi({
        baseURL: siteBase,
        timeoutMs: 5000,
        resolveKey: async () => 'sk-tenant',
        resolveAdmin: () => undefined,
        resolveCookie: () => undefined,
      })
      expect(await apiCrossOrigin.discoverSsoIssuer(tenantSsoOrigin, signal)).toBe(tenantSsoOrigin)

      // 2. PKCE preflight falls back xpeach-harness -> peachcode-cli and /oauth/callback -> /callback
      const pkce = await api.ssoPkceLoopbackStart(discovered, 'xpeach-harness', signal, [0], { allowClientFallback: true })
      try {
        expect(pkce.clientId).toBe('peachcode-cli')
        expect(pkce.issuer).toBe(`${tenantSsoOrigin}/t/acme`)
        expect(new URL(pkce.redirectUri).pathname).toBe('/callback')
        expect(seenAuthClients).toEqual([
          'xpeach-harness|/oauth/callback',
          'peachcode-cli|/oauth/callback',
          'peachcode-cli|/callback',
        ])
        const authUrl = new URL(pkce.authorizationUrl)
        expect(authUrl.pathname).toBe('/t/acme/auth')
        const state = authUrl.searchParams.get('state') ?? ''
        const cb = await fetch(`${pkce.redirectUri}?code=acme_code&state=${encodeURIComponent(state)}&iss=${encodeURIComponent(discovered)}`)
        expect(cb.status).toBe(200)
        const payload = await pkce.waitForApproval()
        expect(payload.sso?.issuer).toBe(`${tenantSsoOrigin}/t/acme`)
        expect(payload.sso?.clientId).toBe('peachcode-cli')
        expect(payload.sso?.user?.username).toBe('acme_user')
      } finally {
        await pkce.close()
      }

      // 3. Device flow fallback + tenant token poll + tenant revocation
      const dev = await api.ssoDeviceAuthorize(discovered, 'xpeach-harness', 'Harness', signal, true)
      expect(dev.clientId).toBe('peachcode-cli')
      expect(dev.issuer).toBe(`${tenantSsoOrigin}/t/acme`)
      const polled = await api.ssoDeviceToken(discovered, dev.clientId ?? 'peachcode-cli', dev.deviceCode, signal)
      expect(polled.status).toBe('approved')
      expect(polled.payload?.sso?.issuer).toBe(`${tenantSsoOrigin}/t/acme`)
      expect(polled.payload?.sso?.clientId).toBe('peachcode-cli')
      expect(await api.ssoRevokeToken(discovered, 'xph_at_tenant_live_001', {}, signal, 'xph_rt_tenant_live_001', 'peachcode-cli')).toBe(true)
      expect(seenPaths).toContain('POST /t/acme/device/auth')
      expect(seenPaths).toContain('POST /t/acme/token')
      expect(seenPaths).toContain('POST /t/acme/token/revocation')
    } finally {
      await new Promise<void>(resolve => tenantSsoSrv.close(() => { resolve() }))
      await new Promise<void>(resolve => siteSrv.close(() => { resolve() }))
    }
  })

  it('临期 SSO 令牌自动静默刷新、缺少 api scope 拒绝并触发 401 透明重试', async () => {
    let refreshCount = 0
    const ssoLocal = createServer((req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        const url = new URL(req.url ?? '/', 'http://127.0.0.1')
        const send = (status: number, body: unknown, extraHeaders: Record<string, string> = {}): void => {
          res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', ...extraHeaders })
          res.end(JSON.stringify(body))
        }
        const verifyHeaders = {
          pragma: 'no-cache',
          'x-auth-user': 'sub-u1',
          'x-auth-username': 'u1',
          'x-auth-email': 'u1@xpeach.invalid',
          'x-auth-group': 'default',
          'x-auth-aff-code': 'U1',
          'x-auth-inviter': '',
        }
        if (req.method === 'POST' && url.pathname === '/token') {
          const form = new URLSearchParams(raw)
          refreshCount += 1
          if (form.get('refresh_token') === 'rt_no_api') {
            send(200, { access_token: 'at_still_no_api', token_type: 'Bearer', expires_in: 3600, refresh_token: 'rt_no_api_2' })
            return
          }
          send(200, { access_token: 'at_fresh_rotated', token_type: 'Bearer', expires_in: 3600, refresh_token: 'rt_fresh_rotated' })
          return
        }
        if (req.method === 'GET' && url.pathname === '/api/internal/verify') {
          const auth = req.headers['authorization']
          const nowSec = Math.floor(Date.now() / 1000)
          const base = {
            api_version: 'v1',
            request_id: 'r-v',
            timestamp: '2026-11-20T00:00:00Z',
            ok: true,
            active: true,
            sub: 'sub-u1',
            username: 'u1',
            email: 'u1@xpeach.invalid',
            email_verified: true,
            name: 'U1',
            group: 'default',
            aff_code: 'U1',
            inviter_sub: null,
            invited_from_site: null,
            tenant_id: '11111111-1111-4111-8111-111111111111',
            client_id: 'xpeach-harness',
            format: 'opaque',
          }
          if (auth === 'Bearer at_expiring_soon') {
            send(200, { ...base, scope: 'openid profile email offline_access api', exp: nowSec + 25 }, verifyHeaders)
            return
          }
          if (auth === 'Bearer at_no_api' || auth === 'Bearer at_still_no_api') {
            send(200, { ...base, scope: 'openid profile email offline_access peachcode:credentials', exp: nowSec + 3600 }, verifyHeaders)
            return
          }
          send(200, { ...base, scope: 'openid profile email offline_access api', exp: nowSec + 3600 }, verifyHeaders)
          return
        }
        send(404, { error: 'not_found' })
      })
    })
    await new Promise<void>(resolve => ssoLocal.listen(0, '127.0.0.1', () => { resolve() }))
    const ssoLocalBase = `http://127.0.0.1:${String((ssoLocal.address() as AddressInfo).port)}`

    let activeToken = 'at_stale_1'
    const authHeadersSeen: string[] = []
    const apiSrv = createServer((req, res) => {
      const auth = req.headers['authorization'] ?? ''
      authHeadersSeen.push(`${req.url ?? '/'}|${auth}`)
      if (auth === 'at_stale_1') {
        res.writeHead(401, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ success: false, message: 'expired' }))
        return
      }
      if (req.url?.startsWith('/api/pricing')) {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ data: [], group_ratio: { SWE: 0.5 } }))
        return
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ success: true, data: { id: 1, username: 'u1', items: [], total: 0 } }))
    })
    await new Promise<void>(resolve => apiSrv.listen(0, '127.0.0.1', () => { resolve() }))
    const apiBase = `http://127.0.0.1:${String((apiSrv.address() as AddressInfo).port)}`

    try {
      let onRefreshCalls = 0
      const api = new XPeachApi({
        baseURL: apiBase,
        timeoutMs: 5000,
        resolveKey: async () => 'sk-test',
        resolveAdmin: () => activeToken,
        resolveCookie: () => undefined,
        onRefreshAuth: async () => {
          onRefreshCalls += 1
          activeToken = 'at_fresh_2'
          return true
        },
      })
      const signal = AbortSignal.timeout(10_000)

      // Proactive refresh when <= 60s left
      const proactive = await api.ssoPeachcodeCredentials(ssoLocalBase, 'at_expiring_soon', signal, 'rt_live')
      expect(proactive.status).toBe('ok')
      if (proactive.status === 'ok') {
        expect(proactive.payload.sso?.accessToken).toBe('at_fresh_rotated')
      }
      expect(refreshCount).toBe(1)

      // Missing api scope is rejected cleanly
      const missingScope = await api.ssoPeachcodeCredentials(ssoLocalBase, 'at_no_api', signal, 'rt_no_api')
      expect(missingScope.status).toBe('revoked')

      // 1x transparent 401 refresh-and-retry on userSelf + adminPricing
      const me = await api.userSelf(signal)
      expect(me.username).toBe('u1')
      expect(onRefreshCalls).toBe(1)

      activeToken = 'at_stale_1'
      const pricing = await api.adminPricing(signal)
      expect(pricing.groupRatio).toEqual({ SWE: 0.5 })
      expect(onRefreshCalls).toBe(2)
      expect(authHeadersSeen).toContain('/api/user/self|at_stale_1')
      expect(authHeadersSeen).toContain('/api/user/self|at_fresh_2')
      expect(authHeadersSeen).toContain('/api/pricing|at_stale_1')
      expect(authHeadersSeen).toContain('/api/pricing|at_fresh_2')
    } finally {
      await new Promise<void>(resolve => ssoLocal.close(() => { resolve() }))
      await new Promise<void>(resolve => apiSrv.close(() => { resolve() }))
    }
  })

  it('新版主站接口适配：/api/log/usage、tokenLogs 403 回退、SSO_BEARER_ADMIN_DENIED 不误退登、auto_groups 多分组读写', async () => {
    const requestedPaths: string[] = []
    const rejectedCalls: number[] = []
    const siteSrv = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      requestedPaths.push(url.pathname)
      if (url.pathname === '/api/log/token') {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ success: false, code: 'AUTH_INSUFFICIENT_PRIVILEGE', message: 'forbidden' }))
        return
      }
      if (url.pathname === '/api/log/usage') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({
          success: true,
          data: {
            page: 1,
            page_size: 50,
            total: 1,
            items: [{ id: 101, created_at: 1700000000, model_name: 'swe-2-max', quota: 120, prompt_tokens: 10, completion_tokens: 5, use_time: 1 }],
          },
        }))
        return
      }
      if (url.pathname === '/api/log/usage/stat') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ success: true, data: { quota: 999, rpm: 2, tpm: 500 } }))
        return
      }
      if (url.pathname === '/api/user/') {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ success: false, code: 'SSO_BEARER_ADMIN_DENIED', message: 'admin denied' }))
        return
      }
      res.writeHead(404)
      res.end()
    })
    await new Promise<void>(resolve => siteSrv.listen(0, '127.0.0.1', () => { resolve() }))
    const siteBase = `http://127.0.0.1:${String((siteSrv.address() as AddressInfo).port)}`

    try {
      const api = new XPeachApi({
        baseURL: siteBase,
        timeoutMs: 5000,
        resolveKey: async () => 'sk-user-key',
        resolveAdmin: () => 'at_sso_user',
        resolveCookie: () => undefined,
        onAuthRejected: (status) => { rejectedCalls.push(status) },
      })
      const signal = AbortSignal.timeout(10_000)

      // tokenLogs falls back to /api/log/usage on 403
      const rows = await api.tokenLogs(signal)
      expect(rows).toHaveLength(1)
      expect(rows[0]?.model_name).toBe('swe-2-max')

      // userLogStat & adminSelfStat hit /api/log/usage/stat
      expect(await api.userLogStat(signal)).toMatchObject({ quota: 999, rpm: 2, tpm: 500 })
      expect(await api.adminSelfStat(signal)).toMatchObject({ quota: 999 })
      expect(requestedPaths).not.toContain('/api/log/self')
      expect(requestedPaths).not.toContain('/api/log/self/stat')

      // SSO_BEARER_ADMIN_DENIED must not trigger onAuthRejected
      await expect(api.adminUsers(0, 10, signal)).rejects.toThrow(/admin denied/)
      expect(rejectedCalls).toEqual([])

      // auto_groups encoding & decoding helpers on XPeachAccount
      const extract = Reflect.get(XPeachAccount.prototype, 'extractTokenGroups') as (d: Record<string, unknown>) => string[]
      const build = Reflect.get(XPeachAccount.prototype, 'buildTokenGroupFields') as (g: readonly string[]) => Record<string, unknown>
      expect(extract({ group: 'auto', auto_groups: ['SWE', 'Claude'] })).toEqual(['SWE', 'Claude'])
      expect(extract({ group: 'auto', auto_groups: [] })).toEqual([])
      expect(build(['SWE', 'Claude'])).toEqual({
        group: 'auto',
        auto_groups: ['SWE', 'Claude'],
        cross_group_retry: true,
        groups: ['SWE', 'Claude'],
      })
      expect(build(['SWE'])).toEqual({
        group: 'SWE',
        auto_groups: [],
        cross_group_retry: false,
        groups: ['SWE'],
      })
    } finally {
      await new Promise<void>(resolve => siteSrv.close(() => { resolve() }))
    }
  })

  it('支持 /v1/responses 对话、SSE 流式、健康探针，以及 /v1/chat/completions 500 get_channel_failed 自动回退', async () => {
    const calledEndpoints: string[] = []
    const relaySrv = createServer((req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        const body = raw.length > 0 ? JSON.parse(raw) as { stream?: boolean; max_output_tokens?: number } : {}
        calledEndpoints.push(`${req.url ?? ''}|stream=${String(Boolean(body.stream))}`)
        if (req.url === '/v1/chat/completions') {
          res.writeHead(500, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ error: { code: 'get_channel_failed', message: 'No available channel for model' } }))
          return
        }
        if (req.url === '/v1/responses') {
          if (body.stream === true) {
            res.writeHead(200, { 'content-type': 'text/event-stream' })
            res.write('data: {"type":"response.output_text.delta","delta":"hello "}\n\n')
            res.write('data: {"type":"response.output_text.delta","delta":"responses"}\n\n')
            res.write('data: {"type":"response.completed","response":{"usage":{"input_tokens":12,"output_tokens":4}}}\n\n')
            res.end()
            return
          }
          expect(body.max_output_tokens).toBeGreaterThanOrEqual(16)
          res.writeHead(200, { 'content-type': 'application/json' })
          res.end(JSON.stringify({
            id: 'resp_1',
            output: [{ type: 'message', content: [{ type: 'output_text', text: 'pong-from-responses' }] }],
            usage: { input_tokens: 9, output_tokens: 3 },
          }))
          return
        }
        res.writeHead(404)
        res.end()
      })
    })
    await new Promise<void>(resolve => relaySrv.listen(0, '127.0.0.1', () => { resolve() }))
    const relayBase = `http://127.0.0.1:${String((relaySrv.address() as AddressInfo).port)}`

    try {
      const api = new XPeachApi({
        baseURL: relayBase,
        timeoutMs: 5000,
        resolveKey: async () => 'sk-resp-test',
        resolveAdmin: () => undefined,
        resolveCookie: () => undefined,
      })
      const signal = AbortSignal.timeout(10_000)

      const chat = await api.chat({ model: 'gemini-4-carbon', prompt: 'hi' }, signal)
      expect(chat.content).toBe('pong-from-responses')
      expect(chat.promptTokens).toBe(9)
      expect(chat.completionTokens).toBe(3)

      const deltas: string[] = []
      const streamed = await api.chatStream({ model: 'gemini-4-carbon', prompt: 'hi' }, d => deltas.push(d), signal)
      expect(deltas).toEqual(['hello ', 'responses'])
      expect(streamed.content).toBe('hello responses')
      expect(streamed.promptTokens).toBe(12)
      expect(streamed.completionTokens).toBe(4)

      const health = await api.probe('gemini-4-carbon', signal)
      expect(health.ok).toBe(true)
      expect(calledEndpoints).toContain('/v1/chat/completions|stream=false')
      expect(calledEndpoints).toContain('/v1/responses|stream=false')
      expect(calledEndpoints).toContain('/v1/responses|stream=true')
    } finally {
      await new Promise<void>(resolve => relaySrv.close(() => { resolve() }))
    }
  })

  it('官方线路 GET 请求遇到 502/503 网关瞬态错误时自动故障转移到健康线路', async () => {
    const attemptedHosts: string[] = []
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url)
      attemptedHosts.push(url.hostname)
      if (url.hostname === 'fast.xpeach.codes') {
        return new Response('bad gateway', { status: 502 })
      }
      return new Response(JSON.stringify({
        success: true,
        data: { oidc_authorization_endpoint: 'https://sso.xpeach.codes/t/acme/auth' },
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    })

    try {
      const api = new XPeachApi({
        baseURL: 'https://fast.xpeach.codes',
        timeoutMs: 5000,
        resolveKey: async () => 'sk-route-test',
        resolveAdmin: () => undefined,
        resolveCookie: () => undefined,
      })
      const issuer = await api.discoverSsoIssuer('https://sso.xpeach.codes', AbortSignal.timeout(5000))
      expect(issuer).toBe('https://sso.xpeach.codes/t/acme')
      expect(attemptedHosts[0]).toBe('fast.xpeach.codes')
      expect(attemptedHosts[1]).toBe('xpeach.codes')
    } finally {
      fetchSpy.mockRestore()
    }
  })
})
