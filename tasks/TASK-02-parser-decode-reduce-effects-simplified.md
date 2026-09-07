## What this task is about

The code that receives messages from drones uses one giant switch that decodes the message, updates data, sends network requests, and fires events all at once. This task splits that work into four small modules: decode, reduce, effects, and runtime.

## Why this is useful

Each part can be tested on its own with captured messages. The circular dependency between the parser and the sender disappears, and UI updates happen exactly when the matching field changes.