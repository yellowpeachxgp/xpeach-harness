---
kind: upgrade-guide
description: "XPeach profile seeding requires the CLI resource, and macOS installer helpers no longer generate a reduced fallback profile."
---

# One shipped XPeach profile resource

English | [中文](guide.zh.md)

## Change

CLI and Desktop seed new or empty product profiles from the CLI package's `resources/xpeach.profile.yml`. The initial `swe-2-max` output limit is 32768. Existing nonempty user patches are preserved. The macOS installer rejects invalid existing patches before installation effects with `XPH_PROFILE_PATCH_INVALID`; empty YAML documents and arrays receive the canonical seed. Each pkg component validates the target patch before its payload is installed, and profile postinstall validates again before seeding without evaluating `!!js` expressions.

Missing product resources stop seeding instead of selecting embedded fallback configuration. macOS installer helpers also require the canonical resource or its packaged Desktop copy; they no longer generate a reduced profile when neither is available.

## Migration

1. Install the complete CLI or Desktop distribution. Custom packaging must include the CLI resource and copy that same file into Desktop resources; copying only `lib/` is insufficient.
2. Normal Node installations resolve the CLI package from the launching entry through Node package exports. Custom launchers without that package must set `MacosInstallerOptions.productProfilePath` to the canonical resource or its packaged Desktop copy. Source tooling uses `apps/cli/resources/xpeach.profile.yml` in place of the removed Desktop source path.
3. Confirm that first-run seeding succeeds and retains the expected product plugins. To change an existing custom profile, edit its own `cordis.patch.yml` explicitly; upgrading does not replace it.
