# TASK-06 — Put types on `core/`, and only on `core/`

**Depends on:** TASK-02 (there must be a `core/` to type).
**Size:** medium, incremental and open-ended. **Risk:** low.

## Goal

Replace hand-written runtime type checking on the hot path with compile-time checking, and
give the layer boundary something that enforces itself. Scope is deliberately narrow:
**`src/js/core/` only.** Everything above it stays plain JavaScript indefinitely.

---

## Why here specifically

`typescript@^4.9.5` is already in `devDependencies` and completely unused — there is not one
`.ts` file in the repo. Meanwhile the codebase hand-writes the checks a type system would give
for free:

| Hand-written check | Count | Where |
|---|---|---|
| `hasOwnProperty` guards | 79 across `src/`, **35 in the parser alone** | field-presence checks |
| `typeof x === 'string' \|\| x instanceof String` | 22 in the parser | payload shape checks |
| Payload shape sniffing | 4 branches | `_fn_extractUnitKey` in the emitter |

All of it runs per packet, on the main thread, forever.

---

## Target state

Types on exactly four things:

1. **Wire messages** — one type per `CONST_TYPE_AndruavMessage_*`, describing the abbreviated
   payload keys (`la`, `ln`, `a`, `r`, `3D`, `SC`, `c`, `p`, `t`, `s`, `b`, ...).
   Source of truth: `src/js/protocol/messages/js_andruavMessages.js` plus the real frames you
   captured for TASK-02's tests.
2. **The unit model** — `CAndruavUnitObject` and its ~30 sub-objects
   (`C_NavInfo`, `C_Power`, `C_GPS`, `C_Telemetry`, `C_Gimbal`, ...). After TASK-01 this is
   plain data, so it types cleanly.
3. **`FieldPatch` / `Command` / `Message`** — the TASK-02 contracts, which are currently
   JSDoc typedefs. Promote them to real types.
4. **Event payloads** — the factories from TASK-03's `eventPayloads.js`.

---

## Approach: allowJs, not a rewrite

Do **not** convert the codebase. Enable TypeScript in checking-only mode over `core/`:

```jsonc
// tsconfig.json (new, at repo root)
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "allowJs": true,
    "checkJs": false,          // do NOT type-check plain .js yet
    "noEmit": true,
    "strict": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "skipLibCheck": true
  },
  "include": ["src/js/core/**/*"]
}
```

`checkJs: false` and an `include` limited to `core/` is what keeps this from becoming a
six-month project. Files migrate to `.ts` one at a time; everything else is untouched and
CRA keeps building it exactly as before.

Add to `package.json` scripts (this is the **one** build-adjacent change permitted in the
task set, because it adds a check rather than altering the build):

```json
"typecheck": "tsc --noEmit"
```

---

## Steps

1. Add `tsconfig.json` and the `typecheck` script. Confirm `npx tsc --noEmit` passes on an
   empty `core/`. Confirm `npm run build` is unaffected. Commit.
2. Add `src/js/core/protocol/types.ts` with `Message`, `FieldPatch`, `Command` and the
   `COMMANDS` union. Convert `decode.ts`, `reduce.ts`, `effects.ts` from `.js`. Commit.
3. Type the wire messages incrementally — one message type per commit, matching the order in
   which TASK-02 migrated them. Each one should let you delete `hasOwnProperty` guards from
   the corresponding `reduce` branch, because optionality is now expressed in the type.
   **Do not delete a runtime check for a field that genuinely may be absent on the wire** —
   model it as optional (`la?: number`) and keep a real guard where the value is used.
4. Type the unit model: `src/js/core/model/unit.ts`. This is the biggest single file;
   consider one commit per sub-object group.
5. Type the event payload factories.
6. Add `npm run typecheck` to whatever CI runs `npm run lint`.

---

## Do not change

- **`src/js/js_mavlink_v2.js`.** Generated, 15,882 lines, eslint-ignored. Never convert it,
  never type it. If you need types for MAVLink, write a small hand-maintained `.d.ts` covering
  only the symbols this app actually uses.
- Anything in `src/components/`, `src/pages/`, `src/js/js_main.js`. Out of scope. React
  components stay `.jsx` for the foreseeable future.
- The build pipeline. `react-scripts` already handles `.ts` via babel; `tsc` here is a checker,
  not a compiler. Do not add a TypeScript build step.
- `checkJs`. Turning it on flips the whole repo into a type error avalanche. Leave it false.

## Acceptance

```bash
# the checker runs and passes
npm run typecheck            # -> exit 0

# scope is respected: no .ts outside core/
find src -name "*.ts" -o -name "*.tsx" | grep -v "^src/js/core/"    # -> zero lines

# the build is unaffected
npm run build                # -> succeeds

# runtime checks are actually coming down in migrated files
grep -c "hasOwnProperty" src/js/core/protocol/reduce.ts   # -> materially lower than the
                                                          #    35 in the original parser
npm run lint && npm test
```

Track progress with a single number, measured as
`grep -rho 'hasOwnProperty' src/ --include=*.js --include=*.jsx | wc -l`, currently **79**. Each typed message type should reduce it. It will not reach zero — some fields are
genuinely optional on the wire — but a floor around 20-30 is realistic.
