## What this task is about

The core layer has a lot of hand-written type checks on every message. This task adds TypeScript only to the core folder for wire messages, the unit model, protocol contracts, and event payloads.

## Why this is useful

Type errors are caught before runtime. Field presence checks can be reduced, and the boundary between the protocol layer and the rest of the app becomes safer.