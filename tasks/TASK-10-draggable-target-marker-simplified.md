## What this task is about

Double-clicking the 3D map already drops a ground crosshair pin and opens a "Goto Here" /
"Set Home" popup, but the pin can't be dragged and the popup's actions use the coordinates
from the original click even if it could be. This task makes the pin draggable (via a
native, draggable Mapbox marker) and makes the popup track the dragged position live.

## Why this is useful

Lets the user fine-tune exactly where a guided-goto/home/geofence point lands after
double-clicking, instead of having to re-click precisely on the first try.
