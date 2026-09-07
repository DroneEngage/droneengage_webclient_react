## What this task is about

Right now each drone data object carries its own map markers and UI settings inside it. This task removes those view objects from the drone model and moves them into a dedicated map layer registry and a separate UI preferences store.

## Why this is useful

The drone model becomes clean data that can be created and tested without a browser or a map. It also fixes the problem of having two copies of the same map state that can drift apart.