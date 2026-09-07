## What this task is about

The tracking message cases in the parser are half-migrated and still use the current time. This task completes their move into the new reducer and uses the message timestamp instead.

## Why this is useful

Target tracking becomes deterministic and testable. It no longer depends on the current wall-clock time or a global feature flag inside the reducer.