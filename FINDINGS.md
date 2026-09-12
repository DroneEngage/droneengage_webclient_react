# TASK-13 Findings

## Retired events (fully removed)

These three coarse events had **no remaining subscribers** after migration
and were fully retired (removed from `BATCHED_EVENTS`, dispatch sites, and
`js_eventList.js`):

| Event | Replaced by |
|-------|-------------|
| `EE_unitPowUpdated` | `useUnitField`/`subscribeUnitField` on `m_Power._FCB.p_Battery.*` and `m_Power._Mobile.p_Battery.*` |
| `EE_unitSDRUpdated` | `subscribeUnitField` on `m_SDR.*` config fields |
| `EE_unitSDRSpectrum` | `subscribeUnitField` on `m_SDR.m_spectrum_data` (+ `notifyUnitFieldChanged` added in the legacy parser SDR-spectrum path) |

## Non-retired events (kept, with reasons)

These four events from the TASK-03 retirement list **remain** because they
have genuine side-effect subscribers that cannot be replaced by field-store
subscriptions. They stay in `BATCHED_EVENTS` and `js_eventList.js`.

| Event | Remaining side-effect subscriber | Side effect |
|-------|----------------------------------|-------------|
| `EE_unitNavUpdated` | `src/js/adsb/js_adsbManager.js` (`_onUnitNavUpdated`) | Throttled swarm-area recompute (non-React) |
| `EE_unitUpdated` | `src/js/adsb/js_adsbManager.js` (`_onUnitsChanged`) | Swarm-area recompute on unit add/remove (non-React) |
| `EE_andruavUnitFCBUpdated` | `src/js/js_main.js` (`mavlinkFcbKey` bridge + `EVT_andruavUnitFCBUpdated`) | Speaks FCB connect/disconnect; bridges `m_FCBParameters.m_systemID` |
| `EE_msgFromUnit_GPS` | `src/js/js_main.js` (`EVT_msgFromUnit_GPS`) | Creates/updates the unit's map marker, flushes flight path, fetches ADS-B data for the unit |

These are **not** pure re-render triggers — deleting them would break map
markers, ADS-B swarm tracking, and FCB speech announcements. Per TASK-13
step 3, side-effect subscriptions are retained.

## Migrated pure-render subscribers

The following components were migrated from coarse-event re-render triggers
to field-granular `useUnitField`/`subscribeUnitField` subscriptions:

- `jsc_ctrl_altitude_control` — `m_Nav_Info.p_Location.alt_relative` / `alt_abs`
- `jsc_ctrl_speed_control` — `m_Nav_Info.p_Location.ground_speed` / `p_UserDesired.m_NavSpeed`
- `jsc_ctrl_distance_to_me_control` — `m_Nav_Info.p_Location.lat` / `lng`
- `jsc_ctrl_flight_mode_control` — `m_flightMode` / `m_telemetry_protocol`
- `jsc_ctrl_directions_control` — `m_Nav_Info._Target.target_bearing` / `p_Desired.nav_bearing`
- `jsc_ctrl_hudControl` — `m_Nav_Info.p_Orientation.yaw` / `pitch` / `roll`
- `jsc_ctrl_battery` — `m_Power._FCB.p_Battery.*` / `p_Battery2.*` (via `m_batteryFieldPath` prop)
- `jsc_ctrl_rx_message_control` — `m_Messages.m_messages_in` / `m_received_msg`
- `jsc_mobile_module_details_panel` — `m_modules.m_list` + per-key `m_moduleHealth.*`
- `jsc_ctrl_sdr` — `m_SDR.*` config fields
- `jsc_ctrl_sdr_spectrum` — `m_SDR.m_spectrum_data`
- `jsc_videoHUDOverlayComponent` — `m_Nav_Info.p_Orientation.*`
- `jsc_mobile_telemetry_grid` — nav/power/GPS/waypoint fields
- `jsc_ctrl_unit_main_bar` — `m_Power._Mobile.p_Battery.*` (EE_unitPowUpdated part; EE_unitUpdated retained)
- `jsc_yawDialogControl` — `m_Nav_Info.p_Orientation.yaw`
- `jsc_ctrl_andruav_extra_data` — `m_SignalStatus.*`
- `src/pages/mobile.js` — removed the throttled high-frequency re-render (grid self-renders now)

## Broad container re-renderers (coarse subscription retained)

These class components re-render a broad subtree on `EE_unitUpdated` /
`EE_unitNavUpdated` and read fields that are **not all notified** through
the field-store pipeline (e.g. `m_Video.m_total_transfer_bytes`,
`m_Video.m_videoactiveTracks` are mutated directly in `js_webrtcthin2.js`
and `js_main.js` without `notifyUnitFieldChanged`). Migrating them would
require either adding high-frequency notifications for WebRTC video byte
counters (noisy) or converting them to function components (out of scope per
TASK-13). Their coarse subscriptions are retained because the events
remain anyway (side-effect subscribers above):

- `jsc_unitControlArrayView` — `EE_unitUpdated` + `EE_unitNavUpdated`
- `jsc_unit_control_base` — `EE_unitUpdated` + `EE_unitNavUpdated`
- `jsc_ctrl_details_tab` — `EE_unitUpdated` (reads `m_Messages`, `m_Video.m_total_transfer_bytes`, `m_modules.m_list`)
- `jsc_streamDialogControl` — `EE_unitUpdated` (reads `m_Video.m_videoTracks` / `m_videoactiveTracks`)
- `jsc_unitControlGCSList` — `EE_andruavUnitFCBUpdated` (re-renders GCS rows; also listens to `EE_unitOnlineChanged`, `EE_andruavUnitArmedUpdated`, `EE_onPreferenceChanged`)

The child gadgets rendered by these containers (battery, altitude, speed,
HUD, etc.) self-render via their own field-store subscriptions, so the
container's coarse re-render no longer cascades into redundant child
re-renders — only the container's own direct field reads re-render.

## Genuinely-missing notifications added

Per TASK-13 step 4, the following `notifyUnitFieldChanged` calls were added
at the field patch point (not new coarse events):

- `runtime.js` + `js_andruav_ws.js`: `m_Messages.m_messages_in` / `m_received_msg` after `fn_addMsg`
- `reduce.ts`: `m_modules.m_list` added to `addModules` `notifyFields`
- `js_andruav_parser.js`: `m_SDR.m_spectrum_data` (SDR spectrum path), `m_Nav_Info._Target.wp_num` / `wp_count` (MISSION_CURRENT / MISSION_COUNT cases)

## MAVLink binary-path bridge

The legacy MAVLink parser (`js_andruav_parser.js`) mutates unit fields
directly, outside the migrated JSON `runtime.js` pipeline. It was bridged
to call `notifyUnitFieldChanged` for the relevant fields (FCB system,
attitude, navigation, battery, GPS, location, speed, high-latency, VFR,
SDR spectrum, waypoint) so field-level subscribers fire on MAVLink-only
telemetry.

## Acceptance test

`src/js/hooks/useUnitField.sibling.test.js` renders two sibling gadgets for
the same unit, each reading a different field via `useUnitField`, patches
only one field, and asserts the other sibling did not re-render.

# TASK-16 Findings

Steps 1-3 of TASK-16 (`jsc_ctrl_unit_main_bar.jsx`, `jsc_unit_control_base.jsx`,
`jsc_unit_control_drone.jsx`) are complete; step 4
(`jsc_unitControlArrayView.jsx`) needs live-browser profiling and was
deferred to `Tasks/webclient/TASK-17-array-view-row-profiling.md`.

## Pre-existing bug found — fixed post-TASK-16

`jsc_ctrl_unit_main_bar.jsx` (and sibling `jsc_ctrl_unit_planning_bar.jsx`)
read `v_andruavUnit.m_SignalStatus.mobile` / `.mobileSignalLevel`
/ `.mobileNetworkType` — **without** the `m_` prefix. The real fields on
`C_SignalStatus` (`js_andruavUnit.js`) are `m_mobile`, `m_mobileSignalLevel`,
`m_mobileNetworkType`, `m_mobileNetworkTypeRank`. `C_SignalStatus` is not
sealed, so the mismatched reads silently returned `undefined` instead of
throwing — the mobile-signal-strength display branch in both files was
dead code (`v_andruavUnit.m_SignalStatus.mobile === true` was never true).
Left unfixed during TASK-16 per the "don't fix bugs beyond documented
scope" rule; the read side has since been fixed to the `m_`-prefixed
field names in both files, matching `jsc_ctrl_unit_main_bar.jsx`'s
field-store subscriptions (`m_SignalStatus.m_mobile` etc.).

## Missing field-store notifiers found and added

- `js_andruav_parser.js` `_fn_checkStatus()`: `unit.m_IsDisconnectedFromGCS
  = true` dispatched `EE_unitOnlineChanged` but never called
  `notifyUnitFieldChanged` — added.
- `js_main.js` `onWEBRTCSessionStarted` / `onWEBRTCSessionEnded` /
  `onWEBRTCSessionOrphanEnded`: mutate
  `m_Video.m_videoactiveTracks[...].VideoStreaming` directly (this is what
  `fn_getVideoStreaming()` derives from) with no notifier — added
  `notifyUnitFieldChanged(partyId, 'm_Video.m_videoactiveTracks')` at all
  three sites.
- `reduce.ts`'s `fn_setVersion` `method` op (DE/Andruav version detection,
  phase 5) had no `notifyFields` at all, so version changes were never
  field-store notified. Added `notifyFields: ['m_version']` — this backs
  `jsc_unit_control_drone.jsx`'s `createTabs()` main-module-version-warning
  check (`v_andruavUnit.fn_getVersion()` vs `m_module_version_info`).

## Fields intentionally left uncovered (same call already made in TASK-13)

`m_modules.has_camera_alive` / `has_gpio` / `has_sound` / `has_telnet` /
`has_tracking` / `m_old_version` are not individually listed in
`addModules`'s `notifyFields` (only `has_fcb`/`has_viewlink`/
`has_ai_recognition`/`has_p2p`/`has_sdr`/`m_list` are), but all are set
inside the same `addModules()` call that unconditionally notifies
`m_modules.m_list` every time it runs — so a single subscription on
`m_modules.m_list` catches changes to all of them too. Used for
`jsc_ctrl_unit_main_bar.jsx`'s `fn_canCamera()`/`fn_canVideo()` bump and
`jsc_unit_control_drone.jsx`'s tab-visibility/module-list bump, matching
the reasoning already used for `jsc_mobile_module_details_panel.jsx` in
TASK-13.

## `m_Telemetry._isActive` — kept on EventBridge, not migrated

`m_Telemetry._isActive` (behind `EE_unitTelemetryOff`, dispatched from
`js_andruav_facade.js` `API_stopTelemetry`, the only mutation site) is
write-only: grep-verified zero reads anywhere in `src/`. A field-store
subscription on it would be a no-op since no render depends on it. Left as
a genuine one-shot `EventBridge` signal on
`jsc_unit_control_base.jsx`; revisit if a consumer is ever added, or
remove alongside it as dead weight in a future cleanup.

## `EE_unitTelemetryOn` — removed (dead code)

Zero dispatchers repo-wide (grep-verified before and after removal). The
`fn_unitTelemetryOn` handler, its `EventBridge` subscription in
`jsc_unit_control_base.jsx`, and the `"EE_unitTelemetryOn"` entry in
`js_eventList.js` were deleted.

## `jsc_unit_control_base.jsx`'s `fn_unitUpdated` split

The mixed handler (m_IsGCS-flip side effect + 300ms-throttled re-render
bump) was split: the base now only keeps the IsGCS-flip side-effect check,
unthrottled, on `EE_unitUpdated` (a real cross-cutting signal: the unit's
component class itself becomes invalid, not "a field to repaint"). The
render-bump half and the `EE_unitNavUpdated` subscription were removed
from the base per TASK-16 ("this base class itself renders nothing").

`jsc_unit_control_drone.jsx` (the subclass with the largest field surface —
`createTabs()`/`renderControl()`/`hlp_getflightButtonStyles()` read ~15
fields including `m_isArmed`, `m_useFCBIMU`, `m_autoPilot`,
`m_Telemetry.*`, `m_lidar_info`, GCS/shutdown/disconnected flags — full
enumeration of all of them is out of TASK-16's stated scope, which only
targeted the `EE_OldModule` handler for this file) now carries its own
coarse `EE_unitUpdated`/`EE_unitNavUpdated` → `fn_update()` fallback,
partyID-filtered, so none of those still-unmigrated fields silently went
stale. This mirrors the "kept as an unfiltered/filtered fallback for
fields not yet migrated" pattern already used elsewhere in TASK-13/16.

`jsc_unit_control_gcs.jsx` (the other subclass of `ClssAndruavUnitBase`,
not in TASK-16's file list) was checked and needs **no** change: its
`render()` never calls `super.render()`, so it never actually rendered the
base class's `EventBridge` subscriptions in the first place — removing the
base's coarse bump does not regress it further than it already was.
