## What this task is about

Once every JSON message type has been moved to the new pipeline, the old parser switch is empty. This task deletes it.

## Why this is useful

It finishes the message handling refactor and proves the new code handles all incoming messages. The parser becomes much smaller and easier to maintain.