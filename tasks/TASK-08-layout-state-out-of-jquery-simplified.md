## What this task is about

The UI layout is switched by jQuery show and hide on DOM elements that React also manages. This task moves display mode and map mode into a single React store.

## Why this is useful

Switching views no longer fights React re-renders. The active layout persists when state changes, and the code reads layout from one source instead of from the DOM.