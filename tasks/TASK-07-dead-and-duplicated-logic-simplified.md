## What this task is about

The codebase has a broken method that would crash if called and two places that create units using the same logic. This task removes the broken method and centralizes unit creation.

## Why this is useful

It removes a landmine method and makes sure every new unit is created the same way. It also avoids duplicating the request-ID logic.