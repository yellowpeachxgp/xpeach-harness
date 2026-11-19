import { createSign, generateKeyPairSync } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { XPeachApi } from '../src/api.ts'
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
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      type: 'basic',
      body: {
        getReader: () => ({
          read: vi.fn().mockRejectedValue(new Error('stream aborted mid-flight')),
          cancel: cancelSpy,
          releaseLock: releaseSpy,
        }),
      },
    } as unknown as Response)

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
    vi.spyOn(account as unknown as { writeState: (p: string, b: string) => void }, 'writeState').mockImplementation((p) => {
      if (p === ssoStateFile) throw new Error('ENOSPC: disk full')
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
})
