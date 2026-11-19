# Action cards

English | [中文](action-cards.zh.md)

[Action Cards](../../packages/experimental/action-cards/README.md) owns model-proposed actions, their Session-backed decisions, and the `ctx.actionCards` service. Its package README documents card kinds, result delivery, and recovery; the API reference below comes from the current service declarations.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxactioncards--actioncards"></a>

### `ctx.actionCards` — `ActionCards`

Card tool, kind registry, Session projection, user actions and status notices.

```ts cordis-catalog
/**
 * Register one action kind for the caller's lifetime.
 * @param kind - the kind's skill, details schema, verbs and handler.
 * @returns disposer removing the kind; actions on its cards are then unavailable.
 * @throws when another kind already registered the same action.
 */
register<Details>(kind: ActionCardKind<Details>): () => void

/**
 * Record a card decision in the Session log; the next model request reports it.
 * @param agent - agent whose Session owns the card.
 * @param decision - the card's new state.
 * @throws when no kind ever registered the decision's action with this service, or its phase is one the projection derives.
 */
record(agent: Agent, decision: ActionCardDecision): void

/**
 * Read the cards of one Session.
 * @param session - a Session whose projections are prepared.
 * @returns proposals and decisions by call id.
 */
view(session: Session): ActionCardView

/**
 * Apply a user action to a logged card. Shared checks run first, then the kind reconciles the card; `dismiss` is
 * recorded here and every other verb goes to the card's kind. `dismiss` also works on an unstarted card whose kind
 * is no longer registered. Concurrent actions on one card share one operation.
 * @param agent - live root resolved from the displayed Session.
 * @param callId - the card's `propose_action` call id.
 * @param verb - `dismiss` or one of the kind's verbs.
 * @param payload - kind-defined fields such as a chosen location.
 * @returns acceptance of background work, the decision in effect, or a refusal.
 */
@Remote act(agent: Agent, callId: ToolCallId, verb: string, payload?: Record<string, JsonValue>): Promise<ActionCardResult>
```

Types: [Agent](core.md) · [Session](session.md) · [ToolCallId](core.md)

Source: [`packages/experimental/action-cards/src/index.ts`](../../packages/experimental/action-cards/src/index.ts)
<!-- END GENERATED cordis-surface -->
