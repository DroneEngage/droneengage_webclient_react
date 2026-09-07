# TASK-07 — Remove dead and duplicated logic

**Depends on:** nothing. Start here.
**Size:** small (~1 day). **Risk:** low.
**This is the only task in the set that is allowed to change behaviour**, and only in
the two places named below.

## Goal

Delete a broken duplicate that can never have run, and collapse one block of unit-creation
logic that exists in two layers. Both are symptoms of the missing layer boundary; removing
them makes TASK-01 and TASK-02 smaller.

---

## Part A — `CAndruavUnitList.attachGamePadToUnit` is dead and broken

**File:** `src/js/js_andruavUnit.js:1586`

Current code:

```js
attachGamePadToUnit(p_andruavUnit) {
    if ((!this.m_currentEngagedUnitRX) && (this.m_currentEngagedUnitRX.getPartyID() !== p_andruavUnit.getPartyID())) {
      this.API_disengageRX(this.m_currentEngagedUnitRX);
    }
    this.API_engageGamePad(p_andruavUnit);
}
```

Three defects:

1. The guard is inverted — if `m_currentEngagedUnitRX` is falsy the first clause passes,
   then the second clause calls `.getPartyID()` on that falsy value and throws.
2. `this.API_disengageRX` and `this.API_engageGamePad` are **not methods of
   `CAndruavUnitList`**. They live on `CAndruavClientFacade`
   (`src/js/protocol/server_comm/js_andruav_facade.js:1179` and `:1189`).
3. `CAndruavUnitList.prototype` is sealed (`js_andruavUnit.js:1625`), so they can never
   be patched on at runtime either.

The working version is `AndruavClientFacade.fn_attachGamePadToUnit`
(`js_andruav_facade.js:1169`), which has the correct guard and calls real methods.

### Steps

1. Confirm there are no call sites:
   ```bash
   grep -rn "attachGamePadToUnit" src/
   ```
   Expect only the definition and the facade's own correctly-named
   `fn_attachGamePadToUnit`. If a call site to the `CAndruavUnitList` version exists,
   **stop and report it** — the analysis is wrong and this part must be re-planned.
2. Delete the `attachGamePadToUnit` method from `CAndruavUnitList` entirely.
3. Leave `engageUnitRX`, `disengageUnitRX` and `getEngagedUnitRX` on `CAndruavUnitList`
   alone — those are real and in use.

---

## Part B — unit creation is duplicated across two layers

The same "look up unit, create if missing, register, request its ID" block exists twice:

- `src/js/protocol/server_comm/js_andruav_ws.js`, in `#handleBinaryData` (~line 400)
- `src/js/protocol/server_comm/js_andruav_parser.js`, in `parseCommunicationMessage` (line 232)

Both do:

```js
let v_unit = js_globals.m_andruavUnitList.fn_getUnit(<name>);
if (!v_unit) {
    v_unit = new js_andruavUnit.CAndruavUnitObject();
    v_unit.m_IsMe = false;
    v_unit.m_defined = false;
    v_unit.setPartyID(<senderName>);
    v_unit.m_index = js_globals.m_andruavUnitList.count;
    js_globals.m_andruavUnitList.Add(v_unit.getPartyID(), v_unit);
    if (v_unit.m_Messages.fn_sendMessageAllowed(CONST_TYPE_AndruavMessage_ID)) {
        AndruavClientFacade.API_requestID(<senderName>);
        v_unit.m_Messages.fn_doNotRepeatMessageBefore(CONST_TYPE_AndruavMessage_ID, 1000, new Date());
    }
}
```

They differ in one detail: the WS copy always requests the ID; the parser copy skips the
request when the incoming message **is** `CONST_TYPE_AndruavMessage_ID`. **Preserve that
difference** — it is a real optimisation, not an accident.

### Steps

1. Create `src/js/model/unitRegistry.js`:

   ```js
   /**
    * Single place where a CAndruavUnitObject is looked up or created.
    * Replaces the duplicated block in js_andruav_ws.js and js_andruav_parser.js.
    *
    * @param {string} p_partyID
    * @param {boolean} p_requestIdIfNew - false when the triggering message is itself
    *        an ID message (the parser case), true otherwise (the binary/WS case).
    * @returns {{unit: CAndruavUnitObject, isNew: boolean}}
    */
   export function fn_getOrCreateUnit(p_partyID, p_requestIdIfNew) { ... }
   ```

   It must return `isNew` so callers can still branch on first-sight behaviour.

2. `fn_getOrCreateUnit` **must not import the facade.** Requesting the ID is an *effect*.
   Return the intent instead — add a third field to the return value:
   ```js
   { unit, isNew, shouldRequestID }
   ```
   and let each caller fire `AndruavClientFacade.API_requestID(...)` itself. This keeps
   `unitRegistry.js` free of the protocol layer and is a deliberate down payment on TASK-02.

3. Replace both duplicated blocks with calls to it.

4. Also fold in the statistics lines that follow both blocks
   (`m_Messages.fn_addMsg`, `m_received_msg++`, `m_received_bytes +=`, `m_lastActiveTime`)
   **only if** they are byte-identical in both places. Check first: the WS copy uses
   `data.length`, the parser copy uses `evt.data.length`. They are **not** identical —
   so leave the statistics at the call sites and move only the lookup/create block.

---

## Do not change

- The behaviour of `AndruavClientFacade.fn_attachGamePadToUnit`.
- The ID-request-skipping difference between the two call sites.
- Any `m_*` field names.
- The `Object.seal` calls in `js_andruavUnit.js`.

## Acceptance

```bash
# A: the broken duplicate is gone, no call sites remain
grep -rn "attachGamePadToUnit" src/ | grep -v "fn_attachGamePadToUnit"   # -> zero lines

# B: the new module exists and does not import the protocol layer
test -f src/js/model/unitRegistry.js
grep -n "js_andruav_facade\|js_andruav_ws" src/js/model/unitRegistry.js  # -> zero lines

# B: the duplicated creation block is gone from both files
grep -c "new js_andruavUnit.CAndruavUnitObject()" src/js/protocol/server_comm/js_andruav_ws.js      # -> 0
grep -c "new js_andruavUnit.CAndruavUnitObject()" src/js/protocol/server_comm/js_andruav_parser.js  # -> 0

# global gates
npm run lint && npm test && npm run build
npx madge --circular --extensions js,jsx src/   # -> must not exceed 13 cycles
```

Manual check: connect to a server with at least two units and confirm both still appear in
the unit list, and that a unit first seen via a **binary** message still gets an ID request.
