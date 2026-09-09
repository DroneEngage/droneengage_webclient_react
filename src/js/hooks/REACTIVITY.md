# Reactivity Hooks — When to Use What

This directory holds three reactivity primitives plus the legacy event
subscription. Pick the one that matches what the component actually does
with the event — a re-render trigger, a side effect, or a discrete UI
signal.

## The primitives

| Primitive | File | Use in | What it does |
|-----------|------|--------|--------------|
| `useUnitField` | `useUnitField.js` | function components | Re-renders the component only when a specific unit field changes |
| `UnitFieldValue` | `UnitFieldValue.jsx` | class components (render-prop) | Same, via a `children(value)` render-prop so a class component can consume one field |
| `subscribeUnitField` | `../store/unitStore.js` | class components (lifecycle) | Imperative subscribe in `componentDidMount` / unsubscribe in `componentWillUnmount`; use when the component needs local-state sync or imperative side effects on field change |
| `EventBridge` | `EventBridge.jsx` | class components | Declarative event subscription rendered as a sibling in `render()` |
| `useEventSubscription` | `useEventSubscription.js` | function components | Same as `EventBridge`, called directly |

## Decision rule

```
What does the handler do?
│
├─ Bumps m_update / calls setState only to re-read unit fields in render
│  → useUnitField (function) / UnitFieldValue (class, render-prop) /
│    subscribeUnitField (class, lifecycle)
│  → NEVER use EventBridge for this
│
├─ Performs a real side effect (map mutation, speech, recompute, API call,
│  toggles a global flag, mutates a non-unit store)
│  → EventBridge / useEventSubscription
│
└─ Listens to a discrete UI / cross-cutting signal not tied to one unit's
   fields (toggle, theme, auth, socket, video stream start/stop, preference)
   → EventBridge / useEventSubscription
```

## Use field-store (useUnitField / UnitFieldValue / subscribeUnitField) when

- The component reads `p_unit.m_<field>` in render and the handler only
  re-renders so the new field value is shown.
- The data source is a unit field that is (or will be) notified through
  `notifyUnitFieldChanged(partyId, fieldPath)`.
- You want two sibling gadgets reading different fields of the SAME unit
  to NOT re-render each other — this is the whole point of field-store.

### Function component

```jsx
import { useUnitField } from '../../js/hooks/useUnitField.js';

function AltGadget({ p_unit }) {
    const alt = useUnitField(p_unit.getPartyID(), 'm_Nav_Info.p_Location.alt_relative');
    return <div>{alt}</div>;
}
```

### Class component — render-prop (single field, no local-state sync)

```jsx
import { UnitFieldValue } from '../../js/hooks/UnitFieldValue.jsx';

class AltGadget extends React.Component {
    render() {
        return (
            <UnitFieldValue partyId={this.props.p_unit.getPartyID()} fieldPath="m_Nav_Info.p_Location.alt_relative">
                {(alt) => <div>{alt}</div>}
            </UnitFieldValue>
        );
    }
}
```

### Class component — lifecycle (multiple fields, or local-state sync)

```jsx
import { subscribeUnitField } from '../../js/store/unitStore.js';

class AltGadget extends React.Component {
    constructor(props) {
        super(props);
        this.m_unsubs = [];
    }
    componentDidMount() {
        const partyId = this.props.p_unit.getPartyID();
        const fields = ['m_Nav_Info.p_Location.alt_relative', 'm_Nav_Info.p_Location.ground_speed'];
        for (const fp of fields) {
            this.m_unsubs.push(subscribeUnitField(partyId, fp, () => this.setState({ m_update: this.state.m_update + 1 })));
        }
    }
    componentWillUnmount() {
        for (const fn of this.m_unsubs) fn();
        this.m_unsubs = [];
    }
}
```

## Use EventBridge / useEventSubscription when

- The handler performs a **genuine side effect** — work beyond rendering:
  - `adsbManager` recomputes swarm areas on `EE_unitNavUpdated` / `EE_unitUpdated`
  - `js_main.js` updates map markers / flight paths on `EE_msgFromUnit_GPS`
  - `js_main.js` speaks FCB connect/disconnect on `EE_andruavUnitFCBUpdated`
- The event is a **discrete UI / cross-cutting signal**, not high-frequency
  telemetry:
  - `EE_BattViewToggle`, `EE_EKFViewToggle`, `EE_Opacity_Control` (UI toggles)
  - `EE_videoStreamStarted` / `EE_videoStreamStopped`
  - `EE_unitAdded`, `EE_unitOnlineChanged`, `EE_andruavUnitArmedUpdated`
  - `EE_onSocketStatus`, `EE_OldModule`, `EE_onPreferenceChanged`
  - `EE_Auth_Logined`, `EE_MapPopupChanged`, `EE_UnitSystemChanged`
- The event is **not tied to a single unit's fields** (theme, auth, layout).

```jsx
// Class component
<EventBridge eventName={js_event.EE_EKFViewToggle} onEvent={(p_compact) => this.fn_toggle_global(p_compact)} />

// Function component
useEventSubscription(js_event.EE_onSocketStatus, (status) => setOnline(status));
```

## Do NOT use EventBridge when

- The handler just calls `setState({ m_update: m_update + 1 })` so render
  re-reads `p_unit.m_<field>`. That is a re-render trigger, not a side
  effect — use the field-store primitives instead.
- The event is a coarse unit-state event (`EE_unitUpdated`,
  `EE_unitNavUpdated`, `EE_unitPowUpdated`, …) and the component only
  reads unit fields. The coarse event fires on every unrelated field
  change and re-renders components that read a different field — exactly
  what field-store subscriptions prevent.

## Adding a missing field notification

If a unit field is mutated outside the reducer pipeline (e.g. in the
legacy MAVLink parser `js_andruav_parser.js` or in `js_main.js`), the
field-store subscribers will NOT fire unless you notify:

```js
import { notifyUnitFieldChanged } from '../store/unitStore.js';

p_unit.m_EKF.m_velocity_variance = c_mavlinkMessage.velocity_variance;
// ... other field mutations ...
notifyUnitFieldChanged(p_unit.getPartyID(), 'm_EKF.m_velocity_variance');
notifyUnitFieldChanged(p_unit.getPartyID(), 'm_EKF.m_pos_horiz_variance');
```

The reducer pipeline (`reduce.ts` → `runtime.js`) notifies automatically
for patches it applies; only legacy direct-mutation sites need manual
`notifyUnitFieldChanged`.

## Common pitfalls

- **Forgetting to unsubscribe.** `useUnitField` and `UnitFieldValue`
  handle this automatically. If you use `subscribeUnitField` directly,
  always store the returned unsubscribe fn and call it in
  `componentWillUnmount`.
- **Subscribing to a field that is never notified.** The component will
  render once on mount and never update. Check the mutation site — if it
  is outside the reducer, add `notifyUnitFieldChanged`.
- **Using EventBridge to force a re-render of a field-reading component.**
  This defeats the purpose of field-store: the coarse event fires on
  every unrelated field change and re-renders components that read a
  different field. Use `useUnitField` / `UnitFieldValue` /
  `subscribeUnitField` instead.
- **Mixing the two in one component.** A component can use BOTH — e.g.
  `subscribeUnitField` for telemetry fields AND `EventBridge` for a UI
  toggle event. Keep the field-store subscriptions for re-render and the
  EventBridge for the genuine side effect / UI signal.
