# Template Settings

This folder contains **per-class default configuration templates** used by the
GCS configuration UI (`src/components/jsc_config_generator.jsx`) to edit a
module's runtime config JSON (the `de_camera.config.module.json`-style file
that lives next to each module binary).

> **Not to be confused with `template/modules/`** — that folder holds
> **planning/mission command templates** consumed by
> `jsc_ctrl_dynamic_base.jsx` to build dynamic command forms for mission
> planning (e.g. "enable SDR", "fire event", "follow unit"). See
> [../modules/](../modules/) for that.

## How it works

When the user opens the config generator for a module, `jsc_config_generator.jsx`
picks a JSON file from this folder based on the module's class (`module.c`):

| `module.c` | file loaded              |
| ----------- | ------------------------ |
| `fcb`       | `fcb.json`               |
| `camera`    | `camera.json`            |
| `gpio`      | `gpio.json`              |
| `trk`       | `tracking.json`          |
| *(other)*   | `default.json`           |

The file is fetched from `/template/settings/<file>.json` at runtime. If the
fetch fails (404, network error, parse error), the generator falls back to
`module.template` — the template embedded in the module object received from
the server.

## File format

Each file is a **JSON array of named groups**:

```json
[
  {
    "name": "Group Name",
    "template": {
      "field label": {
        "fieldName": "actual_config_key",
        "type": "text|number|boolean|checkbox|combo|object|array",
        "defaultvalue": "...",
        "optional": false,
        "desc": "tooltip text"
      }
    }
  }
]
```

- The UI shows a dropdown to pick **one group at a time** (only if the array
  has more than one entry).
- Only the selected group's output is sent to the module via
  `API_updateConfigJSON` on Apply.
- The module-side `updateJSON()` shallow-merges top-level keys, so each group
  should write to a **distinct top-level key** to avoid overwriting unrelated
  fields. For example, the camera template uses separate `camera` and
  `streaming` top-level objects so editing one group does not clobber the
  other.

## Field types

| type       | renders as        | notes                                              |
| ---------- | ----------------- | -------------------------------------------------- |
| `text`     | text input        |                                                    |
| `number`   | number input      | supports `min` / `max` clamping on blur            |
| `boolean`  | true/false select |                                                    |
| `checkbox` | true/false select | same as boolean (legacy alias)                     |
| `combo`    | dropdown          | requires `list_values: [...]`                      |
| `object`   | nested field set  | requires `fields: { ... }`                         |
| `array`    | repeatable list   | requires `array_template: { ... }`                 |

## Current files

| file           | status       | description                                              |
| -------------- | ------------ | -------------------------------------------------------- |
| `default.json` | active       | empty "no settings" fallback for unknown module classes  |
| `camera.json`  | active       | camera module config: Communication, Camera, Streaming, Media Settings, ICE Servers |
| `gpio.json`    | active       | empty "no settings" placeholder for GPIO modules         |
| `fcb.json.org` | **disabled** | FCB serial config (renamed to `.org`; `fcb` class falls back to `module.template`) |
| `tracking.json`| **missing**  | referenced in code for `trk` class but not present; falls back to `module.template` |

## Adding a new class template

1. Create `<classname>.json` in this folder.
2. Add a `case` in `loadConfig()` in `jsc_config_generator.jsx` mapping the
   class to the filename (if the name doesn't match `<classname>.json`).
3. Use distinct top-level keys per group to stay compatible with the
   module-side shallow merge.
