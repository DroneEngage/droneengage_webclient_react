import React from 'react';
import {
    buildInitialValues,
    buildInitialEnabled,
    buildOutput,
    getNested,
    updateValue,
    updateEnable,
    setNested,
} from '../../../js/helpers/js_form_utils.js'; // Use without modification
import { js_globals } from '../../../js/js_globals.js'; // For unit list in dropdown
import ClssCtrlSWARMFormation from '../../gadgets/jsc_mctrl_swarm_formation.jsx'; // For formation type

class ClssModulePlanningBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      template: null,
      values: {},
      enabled: {},
      loaded: false,
    };
    this.moduleName = ''; // To be set by child classes
    this.key = Math.random().toString();
  }

  componentDidMount() {
    fetch(`/template/modules/${this.moduleName}.json`)
      .then(res => res.json())
      .then(data => {
        const template = data.template;
        const defaultValues = buildInitialValues(template);
        const initialValues = this.props.p_shape.m_missionItem.modules[this.moduleName]?.cmds || {};
        const values = {};
        for (const key in template) {
          const config = template[key];
          const storedKey = config.fieldName || key;
          values[storedKey] = initialValues.hasOwnProperty(storedKey) ? initialValues[storedKey] : defaultValues[key];
        }
        const enabled = buildInitialEnabled(template);
        this.setState({ template, values, enabled, loaded: true });
      })
      .catch(error => console.error(`Error loading ${this.moduleName} template:`, error));
  }

  fn_editShape() {
    if (!this.state.loaded) return;
    const output = buildOutput(this.state.template, this.state.values, this.state.enabled);
    const mappedOutput = {};
    for (const key in this.state.template) {
      const config = this.state.template[key];
      const storedKey = config.fieldName || key;
      if (output.hasOwnProperty(storedKey)) {
        mappedOutput[storedKey] = output[storedKey];
      }
    }
    if (Object.keys(mappedOutput).length === 0) {
      this.props.p_shape.m_missionItem.modules[this.moduleName] = { cmds: {} };
    } else {
      this.props.p_shape.m_missionItem.modules[this.moduleName] = { cmds: mappedOutput };
    }
  }

  handleChange = (path, value) => {
    this.setState({ values: updateValue(this.state.values, path, value) });
  };

  handleEnable = (path, checked) => {
    this.setState({ enabled: updateEnable(this.state.enabled, path, checked) });
  };

  renderFields(fields, path = '') {
    return Object.entries(fields).map(([key, config]) => {
      const fullPath = path ? `${path}.${key}` : key;
      if (config.type === 'object') {
        const layout = config.layout === 'row' ? 'row css_margin_zero padding_zero' : '';
        return (
          <div key={fullPath} className={layout}>
            {config.layout === 'row' ? (
              Object.entries(config.fields).map(([subKey, subConfig]) => (
                <div key={`${fullPath}.${subKey}`} className="col-6 pt-2">
                  {this.renderField(subConfig, `${fullPath}.${subKey}`)}
                </div>
              ))
            ) : (
              this.renderFields(config.fields, fullPath)
            )}
          </div>
        );
      }
      return this.renderField(config, fullPath);
    });
  }

  renderField(config, path) {
    const value = getNested(this.state.values, path) ?? config.defaultvalue;
    const label = config.fieldName ? path.split('.').pop() : config.desc || path.split('.').pop();
    if (config.optional) {
      return (
        <div key={path} className="form-check mb-2 pt-2">
          <input
            type="checkbox"
            className="form-check-input"
            checked={this.state.enabled[path] ?? false}
            onChange={(e) => this.handleEnable(path, e.target.checked)}
          />
          <label className="form-check-label">{label}</label>
          {this.state.enabled[path] && this.renderInput(config, path, value)}
        </div>
      );
    }
    return (
      <div key={path} className="mb-2 pt-2">
        <label>{label}</label>
        {this.renderInput(config, path, value)}
      </div>
    );
  }

  renderInput(config, path, value) {
    switch (config.type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            className="form-check-input"
            checked={value === true}
            onChange={(e) => this.handleChange(path, e.target.checked)}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className="form-control"
            value={value ?? ''}
            onChange={(e) => this.handleChange(path, Number(e.target.value) || 0)}
            min={config.min}
            max={config.max}
            step={config.step}
          />
        );
      case 'text':
        return (
          <input
            type="text"
            className="form-control"
            value={value ?? ''}
            onChange={(e) => this.handleChange(path, e.target.value)}
          />
        );
      case 'unit_dropdown':
        const units = js_globals.m_andruavUnitList.fn_getUnitValues() || [];
        const options = [
          ...config.fixed_list.map(([val, label, className]) => ({ value: val, label, className })),
          ...units.map(unit => ({ value: unit.getPartyID(), label: unit.m_unitName }))
        ];
        return (
          <select
            className="form-control"
            value={value ?? config.defaultvalue}
            onChange={(e) => this.handleChange(path, Number(e.target.value))}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value} className={opt.className || ''}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'formation':
        return (
          <ClssCtrlSWARMFormation
            p_editable={true}
            p_hidden={false}
            p_formation_as_leader={value}
            OnFormationChanged={(newFormation) => this.handleChange(path, newFormation)}
          />
        );
      default:
        return null;
    }
  }

  render() {
    const { className } = this.props;
    const { loaded, template } = this.state;

    if (!loaded) {
      return <div className={className}>Loading...</div>;
    }

    return <div className={className}>{this.renderFields(template)}</div>;
  }
}

export default ClssModulePlanningBase;
