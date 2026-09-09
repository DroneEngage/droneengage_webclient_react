# TASK-14 — Fix the broken `npm run typecheck` gate (finish TASK-06)

**Depends on:** TASK-06 (tsconfig.json and `core/` types already exist).
**Blocks:** nothing, but this should land before any CI step starts calling
`npm run typecheck`, since it currently fails unconditionally.
**Size:** small (~30 minutes). **Risk:** low.

## Goal

`npm run typecheck` currently exits non-zero on a clean checkout, on `core/` code that is
otherwise correctly typed. Make it pass, without touching TypeScript or dependency
versions.

---

## Current state (verified)

```bash
npm run typecheck
```

fails with dozens of parse errors, all inside `node_modules/@types/node/ffi.d.ts`, e.g.:

```
node_modules/@types/node/ffi.d.ts(94,21): error TS1139: Type parameter declaration expected.
node_modules/@types/node/ffi.d.ts(94,29): error TS1005: ',' expected.
```

**Root cause:** `@types/node` is not a direct dependency of this project — it is not in
`package.json` at all. It is pulled in transitively at version `"*"` (see
`package-lock.json:2594` and others), which currently resolves to `26.1.1` in
`node_modules`. That version's `ffi.d.ts` uses TypeScript syntax newer than what
`typescript@^4.9.5` (the version actually pinned in this repo's `devDependencies`) can
parse.

`tsconfig.json` has no `"types"` array, so `tsc` falls back to its default behaviour:
automatically include every package under `node_modules/@types/*` as ambient global types,
for every file in the program — including `core/`, which is browser-only code and does not
use any Node.js globals. `skipLibCheck: true` does not help here: it suppresses
type-*checking* of declaration files, not parsing, and this is a parse error.

```bash
grep -rn "process\.\|Buffer\b\|require(" src/js/core/    # -> zero matches
```

Confirms `core/` has no actual dependency on Node typings — the inclusion is purely an
artifact of `tsc`'s default global-types behaviour.

---

## Fix

Add `"types": []` to `tsconfig.json`'s `compilerOptions`. This tells `tsc` not to
auto-include any `@types/*` package as ambient globals — only types explicitly imported by
the included files are used. Since `core/` imports nothing from Node or DOM globals beyond
what's already in `"lib": ["ES2020", "DOM"]`, this has no effect on real type-checking, only
on the erroneous auto-inclusion of `ffi.d.ts`.

This is the minimal fix: no dependency version bumps (which would risk breaking other parts
of the toolchain that rely on the current `typescript`/`@types/node` combination), no
build-pipeline changes, consistent with TASK-06's "do not touch the build" rule.

## Steps

1. Add `"types": []` inside `compilerOptions` in `tsconfig.json`.
2. Run `npm run typecheck` — confirm exit code 0.
3. Run `npm run build` — confirm it is unaffected (CRA's babel-based build does not consult
   this `tsconfig.json` for compilation, only `tsc --noEmit` does).
4. If step 2 now surfaces a **genuine** type error in `core/` that was previously masked by
   the parse failure aborting early, fix it inline if trivial; otherwise note it in
   `FINDINGS.md` rather than widening this task's scope.

## Do not change

- `typescript` or `@types/node` versions. This task is a config fix, not a dependency
  upgrade.
- Anything outside `tsconfig.json` unless step 4 applies.
- `checkJs`, `include`, or any other existing `tsconfig.json` option.

## Acceptance

```bash
npm run typecheck    # -> exit 0
git diff -- tsconfig.json    # -> only the "types": [] addition (plus any genuine fix noted in step 4)
npm run build         # -> succeeds, unaffected
npm run lint && npm test
```
