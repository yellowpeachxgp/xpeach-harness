# Agent Note: Declaration-only shared projects

Status: implemented

English | [中文](2026-11-17-declaration-only-shared-projects.zh.md)

## Problem

Generated Remote declarations can import a split package's source-mapped DTOs without importing its browser implementation. Without a referenced declaration owner, a fresh Client compilation can emit those imported sources beside their originals. Incremental builds can retain enough output to conceal this missing ownership. Referencing the browser implementation instead can create a cycle through the application Remote facade.

## Decision

A split package may expose a `tsconfig.shared.json` for pure shared types. It is composite and declaration-only, declares explicit source and output directories, and emits outside `src`. Its nonempty file set stays within that package's source directory. Top-level source contains only interfaces, type aliases, type-only imports and exports, or an empty module export. Runtime values and side-effect imports are refused.

Both faces and generated-declaration consumers reference this shared leaf. Each source file has one declaration owner; Host and Client leaves reference it rather than listing the source again. Shared projects may reference neutral dependencies or other validated shared projects. They may not enter a split package's Host, Client, or solution root. The workspace constraints check validates these requirements and preserves the existing matching-face rule for other references.

## Alternatives considered

**Reference the Host leaf from Client.** This resolves the DTO output, but admits the opposite compiler face. The existing isolation rule remains applicable.

**Reference the complete Client leaf.** The application Remote facade and Trajectory browser implementation already depend on each other, so this introduces a compilation cycle.

**Keep an emitted declaration in `src`.** This gives a generated artifact source ownership and hides the missing project reference. Formatting or excluding that file does not fix its producer.

## Consequences

DTO source aliases and package exports remain unchanged. Pure shared declarations compile once into `lib/types`; runtime bundling continues through the existing Host and Client entries. Forced Client compilation and its emitted-file list verify that no declaration or JavaScript is written beside these sources. Fresh CI builds remain required evidence for project-reference changes.
