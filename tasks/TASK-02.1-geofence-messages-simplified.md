## What this task is about

Geofence messages are still handled inside the old big parser. This task moves them into the new reduce and runtime pipeline, and puts geofence data into its own registry.

## Why this is useful

Geofence logic becomes testable and no longer depends on hidden parser state. Other parts of the app can read and update fences from one well-defined place.