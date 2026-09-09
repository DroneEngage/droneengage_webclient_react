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
