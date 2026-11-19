import { createSign, generateKeyPairSync } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { XPeachApi } from '../src/api.ts'

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
          return send(200, { keys: [jwk] })
        }
        if (req.method === 'POST' && url.pathname === '/device/auth') {
          return send(200, {
            device_code: 'sdk-dev-code',
            user_code: 'SDK1-2345',
            verification_uri: `${ssoBase}/device`,
            verification_uri_complete: `${ssoBase}/device?user_code=SDK1-2345`,
            expires_in: 300,
            interval: 1,
          })
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
            return send(200, {
              access_token: 'xph_at_pkce_live_001',
              token_type: 'Bearer',
              expires_in: 3600,
              refresh_token: 'xph_rt_pkce_001',
              id_token: idToken,
              scope: 'openid profile email offline_access api',
            })
          }
          if (grantType === 'urn:ietf:params:oauth:grant-type:device_code') {
            devicePollCount += 1
            if (devicePollCount === 1) {
              return send(400, { error: 'authorization_pending' })
            }
            return send(200, {
              access_token: 'xph_at_device_live_001',
              token_type: 'Bearer',
              expires_in: 1800,
              refresh_token: 'xph_rt_device_001',
            })
          }
          if (grantType === 'refresh_token') {
            if (form.get('refresh_token') !== 'xph_rt_pkce_001') {
              return send(400, { error: 'invalid_grant' })
            }
            return send(200, {
              access_token: 'xph_at_rotated_live_002',
              token_type: 'Bearer',
              expires_in: 3600,
              refresh_token: 'xph_rt_rotated_002',
            })
          }
        }
        if (req.method === 'GET' && url.pathname === '/api/internal/verify') {
          const auth = req.headers['authorization']
          if (auth === 'Bearer xph_at_expired') {
            return send(401, {
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
          }
          return send(200, {
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
        }
        if (req.method === 'POST' && url.pathname === '/token/revocation') {
          const form = new URLSearchParams(raw)
          const tok = form.get('token')
          if (tok) revoked.push(tok)
          res.writeHead(200)
          res.end()
          return
        }
        send(404, { status: 404, title: 'not_found', code: 'not_found' })
      })
    })
    await new Promise<void>(resolve => ssoSrv.listen(0, '127.0.0.1', resolve))
    ssoBase = `http://127.0.0.1:${(ssoSrv.address() as AddressInfo).port}`
  })

  afterAll(() => new Promise<void>(resolve => ssoSrv.close(() => resolve())))

  it('通过 @xpeach/ts-xpeach 完成 PKCE 一键登录、RFC8628 设备流、自动 refresh_token 轮换与 RFC7009 吊销', async () => {
    const api = new XPeachApi({ baseURL: 'http://127.0.0.1:13000', timeoutMs: 5000 })
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
})
