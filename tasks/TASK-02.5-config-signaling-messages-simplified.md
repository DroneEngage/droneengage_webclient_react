## What this task is about

CONFIG_STATUS and WebRTC signaling messages still live in the old parser. This task moves them to the new pipeline and turns WebRTC signaling into a normal event instead of an injected function.

## Why this is useful

Module config and video call setup become predictable event-driven flows. The parser loses another special-case callback.