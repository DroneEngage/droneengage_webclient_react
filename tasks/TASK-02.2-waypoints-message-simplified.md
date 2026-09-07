## What this task is about

Waypoint downloads can arrive in chunks and are assembled in a global variable. This task moves waypoint decoding into a pure reducer and the chunk cache into its own module.

## Why this is useful

The waypoint flow can be tested chunk by chunk without relying on global state. A new download can start from a clean cache.