## What this task is about

js_globals is a large mutable object imported by many modules. This task splits it into focused modules for constants, map styles, assets, gamepad mappings, storage keys, session state, and user preferences.

## Why this is useful

Each module only sees the values it really needs. Mutable state is behind clear accessors, so every write can be found and reasoned about.