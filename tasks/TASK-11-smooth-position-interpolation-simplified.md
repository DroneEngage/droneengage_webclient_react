## What this task is about

Units and ADS-B aircraft currently jump to each new telemetry position on both the 2D and
3D maps. This task adds a shared, engine-agnostic interpolation service that both maps
render through, so motion glides between ticks instead of snapping — plus a Settings toggle
to turn it off when raw, undelayed positions matter more than smoothness.

## Why this is useful

Removes the "teleporting drone" look that makes the map feel low-fidelity next to other GCS
tools, without adding the latency or correction-snap risk that velocity-based extrapolation
would. The toggle keeps an escape hatch for operators who specifically want to see exact,
unsmoothed telemetry.
