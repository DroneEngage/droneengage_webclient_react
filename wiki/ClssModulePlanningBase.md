`ClssModulePlanningBase` is a base React class for dynamic mission planning modules.

It provides a reusable UI and state management framework for configuring modular drone mission commands via JSON templates, enabling consistent form rendering and data handling across different module types.

---

### Definition
`ClssModulePlanningBase` is an abstract base component that dynamically renders configuration forms for mission modules (e.g., P2P, SDR, GPIO) in a drone control web interface. It fetches its layout and fields from external JSON templates and manages form state, enabling, and output generation.

```typescript
16:228:/home/mhefny/TDisk/public_versions/andruav/andruav_webclient_react/src/components/planning/modules/jsc_ctrl_dynamic_base.jsx
class ClssModulePlanningBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      template: null,      // UI schema loaded from JSON
      values: {},          // Current field values
      enabled: {},         // Enabled/disabled state per field
      loaded: false,       // Template loaded flag
    };
    this.moduleName = '';  // Must be set by subclasses
    this.m_output = { 'objectOutput': {}, 'fieldNameOutput': {} };
  }

  componentDidMount() {
    // Fetch template JSON based on moduleName
    fetch(`/template/modules/${this.moduleName}.json`)
      .then(res => res.json())
      .then(data => {
        const template = data.template;
        const defaultValues = buildInitialValues(template);
        const initialValues = this.props.p_shape.m_missionItem.modules[this.moduleName]?.cmds.objectOutput || {};
        const values = deepMerge(defaultValues, initialValues, template);
        let enabled = buildInitialEnabled(template);
        enabled = inferEnabled(template, initialValues, '', enabled);
        this.setState({ template, values, enabled, loaded: true });
      });
  }

  fn_editShape() {
    if (!this.state.loaded) return;
    // Generate output object from current form state
    this.m_output = buildOutput(this.state.template, this.state.values, this.state.enabled);
  }

  handleChange = (path, value) => {
    this.setState(prevState => ({
      values: updateValue(prevState.values, path, value)
    }));
  };

  handleEnable = (path, checked) => {
    this.setState(prevState => ({
      enabled: updateEnable(prevState.enabled, path, checked)
    }));
  };

  renderFields(fields, path = '') { ... }  // Recursively render nested fields
  renderField(config, path, key) { ... }   // Render individual field with label, tooltip
  renderInput(config, path, value) { ... } // Render input based on type (number, text, etc.)

  render() {
    const { className } = this.props;
    const { loaded, template } = this.state;

    if (!loaded) return <div className={className}>Loading...</div>;

    return <div className={className}>{this.renderFields(template)}</div>;
  }
}
```

- **Extends**: `React.Component`
- **State**:
  - `template`: Parsed JSON schema defining form structure
  - `values`: Current user input values (path → value)
  - `enabled`: Toggle state for optional fields (path → boolean)
  - `loaded`: Boolean indicating template load status
- **Props**:
  - `p_shape`: Mission item data object (contains current module config)
  - `className`: CSS class for root element
- **Methods**:
  - `fn_editShape()`: Builds output object from current form state
  - `handleChange(path, value)`: Updates a form value
  - `handleEnable(path, checked)`: Toggles field enabled state
- **Side effects**: Fetches template JSON on mount, updates state on user input
- **Dependencies**:
  - `buildInitialValues`, `buildInitialEnabled`, `deepMerge`, `inferEnabled`, `updateValue`, `setNested`, `getNested` from `js_form_utils.js`
  - `js_globals.m_andruavUnitList` for unit dropdown population

---

### Example Usages
`ClssModulePlanningBase` is extended by several concrete module classes that set `this.moduleName` to define their behavior. These modules are rendered inside mission item cards when specific features are enabled.

For example, `ClssSDR_Planning` enables SDR (Software Defined Radio) configuration in the mission planner:

```typescript
4:8:/home/mhefny/TDisk/public_versions/andruav/andruav_webclient_react/src/components/planning/modules/jsc_ctrl_sdr_planning.jsx
export class ClssSDR_Planning extends ClssModulePlanningBase {
  constructor(props) {
    super(props);
    this.moduleName = 'sdr';  // Loads /template/modules/sdr.json
  }
}
```

These modules are conditionally rendered in `jsc_ctrl_single_mission_item_card.jsx` based on feature flags:

```typescript
120:122:/home/mhefny/TDisk/public_versions/andruav/andruav_webclient_react/src/components/planning/mission/jsc_ctrl_single_mission_item_card.jsx
ctrl.push(<div key={'tab_sdr' + this.key} className="tab-pane fade" id={"tab_sdr"+this.key}>
          <ClssSDR_Planning p_shape={this.props.p_shape} p_unit={this.props.p_unit} ref={instance => {this.sdr = instance}}/>
          </div>);
```

Other subclasses include:
- `ClssP2P_Planning` — for peer-to-peer communication settings
- `ClssGPIO_Planning` — for GPIO pin control

All are conditionally included based on `js_siteConfig.CONST_FEATURE.DISABLE_*` flags.

---

### Notes
- **Dynamic Form Rendering**: The component uses a JSON template system to define UI layout and field types, allowing UI changes without code modifications.
- **Path-Based State Management**: Nested form fields are managed using dot-separated paths (e.g., `network.port`), enabling deep updates via utility functions like `updateValue`.
- **Optional Field Handling**: Supports `optional: true` fields that render with an enable checkbox or a tri-state dropdown (for checkboxes), controlling both visibility and inclusion in output.
- **Template-Driven Inputs**: Input types like `ctrl_unit_dropdown` and `ctrl_formation` are special custom controls rendered conditionally.

---

### See Also
- `ClssSDR_Planning`: Concrete subclass for SDR module configuration; sets `moduleName = 'sdr'`.
- `ClssP2P_Planning`: Subclass for P2P communication settings; uses base form logic with `moduleName = 'p2p'`.
- `ClssGPIO_Planning`: GPIO configuration module; follows same inheritance pattern.
- `/template/modules/*.json`: External JSON files defining form structure (e.g., field labels, types, defaults).
- `js_form_utils.js`: Utility functions for form state manipulation (`buildInitialValues`, `updateValue`, etc.).
- `ClssCtrlSWARMFormation`: Embedded custom component used for swarm formation input within module forms.