## What this task is about

Camera list and sound list messages carry reply callbacks that are stored inside the parser. This task extracts those callbacks into a registry and moves the messages to the new pipeline.

## Why this is useful

The parser no longer holds one-shot callback state. Camera and sound list handling becomes cleaner and easier to test.