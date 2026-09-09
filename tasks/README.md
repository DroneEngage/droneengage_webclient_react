# Refactor Tasks — droneengage_webclient_react

Twelve self-contained implementation tasks derived from the architecture review.
Each `TASK-NN-*.md` is written to be handed to a coding model **on its own**, with
no other context. Read this file first — it holds the rules that apply to all of them.

## Order and dependencies

```
TASK-07  dead + duplicated logic        no deps — start here, warm-up
TASK-05  one React root, portals        no deps — independent, parallelisable
TASK-01  view objects out of the model  no deps — the foundation seam
   └── TASK-02  parser -> decode/reduce/effects      needs 01
          ├── TASK-02.1  geofence messages           needs 02 (steps 1-3)
          ├── TASK-02.2  waypoints message           needs 02.1
          ├── TASK-02.3  tracking messages           needs 02.2
          ├── TASK-02.4  camera/sound messages       needs 02.3
          ├── TASK-02.5  config + signaling          needs 02.4
          └── TASK-02.6  delete parser switch         needs 02.1-02.5 (closes 02)
          └── TASK-03  split the event bus           needs 02
                 └── TASK-04  dissolve js_globals    needs 01, 03
TASK-06  types on core/                 needs 02 (do incrementally after)
TASK-08  layout state out of jQuery     no deps — independent
TASK-09  mapbox vendor isolation        no deps — independent, touches js_map3d.js only
TASK-10  draggable target marker (3D)   soft dep on 09 (marker-construction style only)
TASK-11  smooth position interpolation  soft dep on 09 (landed); independent of 10
TASK-12  EventBridge migration           no deps — independent, mechanical
TASK-13  event bus state retirement      needs 03 (parts b/c) + 12 — finishes 03
TASK-14  fix core typecheck gate         needs 06 — fixes a currently-broken acceptance check
TASK-15  reduce jQuery in heavy components  needs 08 (steps 1-4) — finishes 08 step 5
```

TASK-13, TASK-14, and TASK-15 are follow-ups written after an audit found TASK-03, TASK-06,
and TASK-08 respectively landed only partially against their own Acceptance sections:

- **TASK-03** shipped the dialog service and typed domain events, but the ~29 coarse
  `EE_unit*` state events were never retired, and the component migration target changed
  underneath it — TASK-12 moved class components to `EventBridge` instead of the
  `useUnitField` the original spec assumed. TASK-13 reconciles that and finishes the
  retirement.
- **TASK-06** added TypeScript to `core/`, but `npm run typecheck` currently fails on a
  transitive `@types/node` version pulling in syntax the pinned TypeScript can't parse — a
  broken acceptance gate, not unfinished scope. TASK-14 is a small, isolated config fix.
- **TASK-08** converted the layout-switching mechanism to a React store (steps 1-4), but
  step 5 — reducing jQuery inside the three heaviest components — was deferred as "the long
  tail" and has zero progress. TASK-15 picks it up.

TASK-02 is partially implemented (28 of ~38 JSON-switch cases migrated, the
core/protocol modules exist, the parser↔facade cycle is broken). The six
`TASK-02.x` sub-tasks finish it in the order shown — geofence → waypoints →
tracking → camera/sound → config+signaling → delete the switch. Each is
self-contained and commit-per-step. Do them in order; the switch shrinks one
group at a time and TASK-02.6 cannot run until all five are done.

Do **not** start TASK-04 early. It is the widest diff in the set and it must run
after the other seams have stopped moving, or it will conflict with all of them.

TASK-12 completes the event-subscription leak-guard migration started in
"Plan1: Event-subscription hook + leak guard". Every React class component
still using the manual `fn_subscribe`/`componentWillUnmount fn_unsubscribe`
pairing is migrated to `EventBridge` (class components) or `useEventSubscription`
(function components that used manual `fn_subscribe` inside `useEffect`).
Non-React JS modules (`js_main.js`, `js_map3d.js`, etc.) are out of scope.
`jsc_user_list.jsx` is also excluded — it uses a different emitter
(`window.StreamSensLibs.EventEmitter`). The migration is mechanical and
behaviour-preserving; two pre-existing bugs were fixed along the way
(orphaned unsubscribe in `jsc_videoScreenComponent.jsx`, `this`-in-function-component
in `pages/home.js`).

## Rules that apply to every task

1. **Behaviour must not change.** These are structural refactors. If you find a bug
   while working, do not fix it inline — note it in a `FINDINGS.md` next to the task
   file and keep going. TASK-07 is the only task that changes behaviour, and only
   where its spec says so.

2. **Keep the naming convention.** This codebase uses `fn_` for functions, `m_` for
   member fields, `p_` for parameters, `v_` for locals, `C`/`Clss` prefixes for
   classes. New code follows it. Do not "modernise" names.

3. **Never edit `src/js/js_mavlink_v2.js`.** It is generated, 15,882 lines, and
   eslint-ignored. Import from it; never touch it.

4. **Do not touch the build.** `webpack.config.js`, `package.json` scripts,
   `server.js` and CI are out of scope for all eight tasks.

5. **Do not rename fields that are rendering contracts.** Specifically the `m_*`
   fields on `CADSBObject` (see `AGENTS.md`) and every field name that appears in a
   `.jsx` render method. Renames are allowed only where a task explicitly lists them.

6. **Safety-critical events stay immediate.** `src/js/events/js_eventEmitterConfig.js`
   maintains a `FORBIDDEN_BATCHED` list (geofence hit, arming, flight mode, unit
   online/offline, auth, chat, alerts) and throws at startup if one is batched. That
   guard must keep passing. Never add a one-frame delay to any of them.

7. **Every task must leave the tree green:**
   ```bash
   npm run lint          # warnings are pre-existing and OK; zero NEW errors
   npm test              # the two emitter tests must still pass
   npm run build         # must succeed
   ```

8. **Commit per step, not per task.** Each task has numbered steps. One commit each,
   message prefixed `refactor(TASK-NN):`. A reviewer must be able to bisect.

## What "done" means

Each task ends with an **Acceptance** section containing checks that are mechanically
verifiable — a grep that must return zero, a test that must pass, a file that must
exist. A task is not done until every check in that section passes. Do not report
completion on the basis of "the code looks right".

## Repo facts you will need

- 264 modules under `src/`, ~73k lines. React 19, Bootstrap 5, Leaflet, jQuery.
- Entry: `src/index.js` -> lazy-loaded pages in `src/pages/`.
- The event emitter is `src/js/events/js_eventEmitter.js`; event names are in
  `src/js/events/js_eventList.js` (132 of them).
- There are exactly two test files, both under `src/js/events/`. You are adding the
  first tests for anything else.
- `madge` is available for dependency checks: `npx madge --circular --extensions js,jsx src/`
  currently reports **13 cycles**. Several tasks reduce that number; none may increase it.
