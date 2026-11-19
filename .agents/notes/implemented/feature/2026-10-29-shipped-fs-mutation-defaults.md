# Agent Note: Shipped filesystem mutation defaults

Status: implemented

English | [中文](2026-10-29-shipped-fs-mutation-defaults.zh.md)

## Problem

Upstream shipped `dsh-fs-observation-policy` mounted, so every base-backed profile refused `write` and `edit` on a file the model had not read or that had changed since the read. Upstream compared benchmark runs of the shipped compositions with and without the policy and decided the defaults from those results; the same upstream change also enabled its new `apply_patch` tool, which this port does not carry.

## Decision

- The `dsh-base` `fs-observation-policy` row ships `disabled: true`. Every mutating tool in a base-backed profile runs against the bare provider: `write` overwrites and `edit` replaces the unique literal match. A deployment restores the guard for every mutating tool with `disabled: false` on that row. `sdk-minimal` stacks no `dsh-base` and is unaffected.
- The `write` and `edit` guidance keeps asking for a prior read without naming the policy.
- The policy package is classified as an optional product package, since no default composition mounts it. The recording that captures a policy refusal, `fs-policy-reject`, re-enables the row through a per-scenario `runtime.cordis.yml`.

## Alternatives considered

**Keep the policy mounted beside the new tool defaults.** A mounted policy leaves `write` and `edit` under a guard the shipped compositions no longer want; disabling the row decides every mutating tool in one place and keeps the policy package intact for deployments that want it.

## Consequences

A model can overwrite or edit a file it never read; the [upgrade guide](../../../../docs/upgrade-guide/v0.2.2-alpha.2/fs-observation-policy-default-off/guide.md) names the one-line patch that restores the guard. Sandbox confinement, Review capture, and `fs/observed` events are unchanged.

## Testing

`tool-fs` unit tests cover the unguarded paths. The keyless SDK smoke edits an existing file the model never read through the shipped `sdk` profile and checks the bytes on disk. `fs-policy-reject` replays with the policy re-enabled.
