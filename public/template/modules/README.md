# Template Modules

This folder contains **per-module planning/mission command templates** used by
the mission planning UI to build dynamic command forms for waypoints and
mission actions.

> **Not to be confused with `template/settings/`** — that folder holds
> **runtime config templates** consumed by `jsc_config_generator.jsx` to edit a
> module's config file (e.g. `de_camera.config.module.json`). See
> [../settings/](../settings/) for that.

## How it works

Each mission-planning module component subclasses `ClssModulePlanningBase`
(`src/components/planning/modules/jsc_ctrl_dynamic_base.jsx`) and sets
`this.moduleName` to match a JSON file in this folder. On mount, the base
class fetches `/template/modules/<moduleName>.json`, reads its `template`
object, and renders a dynamic form.

| component                          | `moduleName` | file loaded     |
| ---------------------------------- | ------------ | --------------- |
| `jsc_ctrl_gpio_planning.jsx`       | `gpio`       | `gpio.json`     |
| `jsc_ctrl_p2p_planning.jsx`        | `p2p`        | `p2p.json`      |
| `jsc_ctrl_sdr_planning.jsx`        | `sdr`        | `sdr.json`      |

The subclass overrides `fn_editShape()` to translate the form output
(`fieldNameOutput`) into actual DroneEngage command messages via
`CCommandAPI.API_*` calls, stored in `cmd_msgs` on the mission item.

## File format

Each file is a **single JSON object** (not an array):

```json
{
  "name": "p2p",
  "template": {
    "field label": {
      "type": "checkbox|number|text|ctrl_unit_dropdown|ctrl_formation|object",
      "defaultvalue": null,
      "fieldName": "cmd_key",
      "desc": "tooltip text",
      "optional": true
    }
  }
}
```

- `name` — module identifier (matches `moduleName` in the component).
- `template` — flat object of labeled fields. Each field's `fieldName` maps
  to the key used in `fieldNameOutput` that the subclass reads in
  `fn_editShape()`.

## Field types

| type                  | renders as          | notes                                                    |
| --------------------- | ------------------- | -------------------------------------------------------- |
| `text`                | text input          |                                                          |
| `number`              | number input        | supports `min` / `max` / `step`                          |
| `checkbox`            | tri-state select    | optional: `no action` / `enable` / `disable`             |
| `ctrl_unit_dropdown`  | unit dropdown       | requires `fixed_list: [[value, label, className], ...]`; dynamically appends available units from `m_andruavUnitList` |
| `ctrl_formation`      | swarm formation UI  | renders `ClssCtrlSWARMFormation` gadget                  |
| `object`              | nested field set    | requires `fields: { ... }`; supports `layout: "row"`     |

## Optional fields

Optional fields render with an enable checkbox. When unchecked, the field is
excluded from `fieldNameOutput`, and the subclass checks
`req_cmd.hasOwnProperty(key)` before issuing the corresponding command. This
lets a single form control multiple independent commands without sending
no-ops for untouched fields.

## Current files

| file        | description                                                              |
| ----------- | ------------------------------------------------------------------------ |
| `gpio.json` | GPIO/SDR commands: enable SDR, fire event, frequency range               |
| `p2p.json`  | P2P/swarm commands: enable P2P, telemetry, server comm, follow, leader, formation |
| `sdr.json`  | SDR commands: enable SDR, fire event, frequency range                    |

> **Note:** `gpio.json` and `sdr.json` currently share the same SDR field
> definitions. If GPIO-specific commands are added later, `gpio.json` should
> diverge from `sdr.json`.

## Adding a new planning module

1. Create `<modulename>.json` in this folder with a `name` and `template`.
2. Create a component in `src/components/planning/modules/` that extends
   `ClssModulePlanningBase` and sets `this.moduleName` to match the filename.
3. Override `fn_editShape()` to translate `fieldNameOutput` keys into
   `CCommandAPI` command messages and store them in
   `p_shape.m_missionItem.modules[moduleName]`.
