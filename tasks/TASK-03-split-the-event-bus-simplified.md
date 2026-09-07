## What this task is about

The event bus carries state changes, domain events, and dialog open or close commands all mixed together. This task separates them into a state store, typed domain events, and a dialog service.

## Why this is useful

Components only re-render when the fields they actually use change. Dialog commands become greppable function calls instead of hidden broadcast events.