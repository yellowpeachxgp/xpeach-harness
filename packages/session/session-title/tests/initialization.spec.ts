/** Live title input remains owned while activation is pending. */
import { Context, FiberState, type Fiber } from '@xpeach/xph-cordis'
import LlmRuntime, { createUserMessage, markAgentLoopRequest } from '@xpeach/xph-llm'
import SessionStore, { type Session } from '@xpeach/xph-session'
import SessionProjectionRegistry from '@xpeach/xph-session-projection'
import { turnBoundaryProjectionDefinition } from '@xpeach/xph-agent-loop'
import SessionTitleService, { SessionTitleProviderId, type SessionTitleProviderRequest } from '@xpeach/xph-session-title'
import { deepFreeze } from '@xpeach/xph-util-values'
import { describe, expect, it, onTestFinished, vi } from 'vitest'

const CONFIG = { fallbackMaxWords: 8, fallbackMaxBytes: 64, maxTitleBytes: 256 }

async function setup() {
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose() })
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  ctx.sessionProjections.register(turnBoundaryProjectionDefinition)
  await ctx.plugin(LlmRuntime)
  return ctx
}

/**
 * Hold a live service fiber in LOADING behind a test-controlled release.
 * Registration is synchronous here, so activation's only LOADING window is
 * plugin startup itself; the returned release replays the window's end and
 * settles the fiber back to ACTIVE.
 */
function holdActivation(fiber: Fiber) {
  const gate = Promise.withResolvers<undefined>()
  fiber.state = FiberState.LOADING
  const spy = vi.spyOn(fiber, 'await').mockImplementation(() => gate.promise.then(() => fiber))
  onTestFinished(() => {
    spy.mockRestore()
    if (fiber.state === FiberState.LOADING) fiber.state = FiberState.ACTIVE
    gate.resolve(undefined)
  })
  return {
    release: () => {
      fiber.state = FiberState.ACTIVE
      gate.resolve(undefined)
    },
  }
}

function message(session: Session, text: string) {
  return session.append('user/message', createUserMessage({
    content: [{ type: 'text', text }], source: { kind: 'user' },
  }), { surfaceOp: 'append' })
}

function titleWritten(ctx: Context, session: Session, kind: 'fallback' | 'provider') {
  const written = Promise.withResolvers<undefined>()
  ctx.on('session/event', (target, event) => {
    if (target === session && event.type === 'session/title' && event.data.source.kind === kind) written.resolve(undefined)
  })
  return written.promise
}

async function settle(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('SessionTitleService activation', () => {
  it('retains messages received while activation is pending', async () => {
    const ctx = await setup()
    const fiber = await ctx.plugin(SessionTitleService, CONFIG)
    const pending = holdActivation(fiber)
    const session = ctx.sessions.create()
    const written = titleWritten(ctx, session, 'fallback')
    const first = message(session, 'First message during activation')
    message(session, 'Second message during activation')
    await settle()
    expect(session.snapshotEvents().some(event => event.type === 'session/title')).toBe(false)

    pending.release()
    await written

    expect(ctx.sessionTitle.get(session)).toMatchObject({
      title: 'First message during activation', messageSeqs: [first.seq], source: { kind: 'fallback' },
    })
    expect(session.snapshotEvents().filter(event => event.type === 'session/title')).toHaveLength(1)
  })

  it('requests only the fallback for input received before a provider registers', async () => {
    const ctx = await setup()
    const requests: SessionTitleProviderRequest[] = []
    const provider = ctx.inject(['sessionTitle'], (owner) => {
      owner.sessionTitle.register({
        id: SessionTitleProviderId('activation'), automatic: 'all-prompts',
        async generate(request) {
          requests.push(request)
          return { title: 'Generated after activation', messageSeqs: request.messages.map(item => item.seq) }
        },
      })
    })
    const fiber = await ctx.plugin(SessionTitleService, CONFIG)
    const pending = holdActivation(fiber)
    const session = ctx.sessions.create()
    session.append('turn/start', { turn: 1 })
    session.append('step/start', { turn: 1, step: 1 })
    const fallbackWritten = titleWritten(ctx, session, 'fallback')
    const first = message(session, 'Prompt before provider registration')
    const route = { provider: 'main-provider', model: 'main-model' }
    session.append('request/header', { header: { config: route }, reason: 'initial' })
    void ctx.llm.stream(markAgentLoopRequest(deepFreeze({ ...route, sessionId: session.id, messages: session.deriveMessages() })))

    pending.release()
    await provider
    await fallbackWritten

    expect(requests).toEqual([])
    expect(ctx.sessionTitle.get(session)).toMatchObject({ messageSeqs: [first.seq], source: { kind: 'fallback' } })

    const providerWritten = titleWritten(ctx, session, 'provider')
    const later = message(session, 'Prompt after provider registration')
    void ctx.llm.stream(markAgentLoopRequest(deepFreeze({ ...route, sessionId: session.id, messages: session.deriveMessages() })))
    await providerWritten

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({ route, messages: [
      { seq: first.seq, text: 'Prompt before provider registration' },
      { seq: later.seq, text: 'Prompt after provider registration' },
    ] })
  })

  it('does not title a Session that leaves the store before activation settles', async () => {
    const ctx = await setup()
    const fiber = await ctx.plugin(SessionTitleService, CONFIG)
    const pending = holdActivation(fiber)
    const removed = ctx.sessions.prepare()
    const detach = ctx.sessions.enter(removed)
    ctx.sessions.announce(removed)
    message(removed, 'Removed during activation')
    detach()
    const live = ctx.sessions.create()
    const written = titleWritten(ctx, live, 'fallback')
    message(live, 'Still live')

    pending.release()
    await written

    expect(ctx.sessionTitle.get(removed)).toBeUndefined()
    expect(ctx.sessionTitle.get(live)?.title).toBe('Still live')
  })

  it('does not write a title after disposal during the pending window', async () => {
    const ctx = await setup()
    const fiber = await ctx.plugin(SessionTitleService, CONFIG)
    const pending = holdActivation(fiber)
    const session = ctx.sessions.create()
    message(session, 'Never commit this title')
    await settle()

    const disposal = fiber.dispose()
    pending.release()
    await disposal
    await settle()

    expect(session.snapshotEvents().filter(event => event.type === 'session/title')).toEqual([])
    expect(ctx.get('sessionTitle')).toBeUndefined()
  })

  it('reports one deferred fallback failure and still titles another Session', async () => {
    const ctx = await setup()
    const warn = vi.spyOn(ctx.logger, 'warn')
    onTestFinished(() => { warn.mockRestore() })
    const fiber = await ctx.plugin(SessionTitleService, CONFIG)
    const pending = holdActivation(fiber)
    const failing = ctx.sessions.create()
    const read = ctx.sessionTitle.get.bind(ctx.sessionTitle)
    const get = vi.spyOn(ctx.sessionTitle, 'get').mockImplementation((session) => {
      if (session === failing) throw new Error('title read failed')
      return read(session)
    })
    onTestFinished(() => { get.mockRestore() })
    message(failing, 'Failed title read')
    const live = ctx.sessions.create()
    const written = titleWritten(ctx, live, 'fallback')
    message(live, 'Unaffected title')

    pending.release()
    await written
    await settle()

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('session/event listener rejected: Error: title read failed'))
    expect(ctx.sessionTitle.get(live)?.title).toBe('Unaffected title')
  })
})
