## What this task is about

Map popups are rendered in separate React roots and then converted to HTML. This task switches them to a single React root and uses portals to put popup content directly into the map popup.

## Why this is useful

Buttons and links inside popups become interactive. Popups pick up the selected language and theme. Race conditions and the extra roots disappear.