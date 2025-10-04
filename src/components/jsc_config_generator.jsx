/**
 * Author: Mohammad S.Hefny
 * Date: 2 Oct 2025
 * 
 * Function: The ClssConfigGenerator dynamically generates a form based on a JSON configuration
 * loaded from a file determined by the module class, producing JSON output based on user input.
 */
import React from 'react';
import Draggable from "react-draggable";

import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { js_globals } from '../js/js_globals.js';
import { EVENTS as js_event } from '../js/js_eventList.js'
import { js_eventEmitter } from '../js/js_eventEmitter.js';
import {
  buildInitialValues,
  buildInitialEnabled,
  buildOutput,
  getNested,
  updateValue,
  updateEnable,
  handleCopy,
  handleSave,
} from '../js/helpers/js_form_utils.js';

/**
 * ClssConfigGenerator generates a form based on a JSON configuration loaded from a file.
 * It is triggered by the EE_displayConfigGenerator event with {p_unit, module}.
 */
export default class ClssConfigGenerator extends React.Component {
  /**
   * Constructor initializes the component's state and binds methods.
   */
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      p_unit: null,
      module: null,
      jsonData: null,
      selectedConfig: '', // Name of the selected configuration
      values: {},
      enabled: {},
      output: '',
      fileName: 'config.json',
    };

    this.m_flag_mounted = false;
    this.popupRef = React.createRef();
    this.currentTemplate = {};

    // Bind methods
    this.handleCopy = this.handleCopy.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.fn_handleSubmit = this.fn_handleSubmit.bind(this);
    this.fn_close = this.fn_close.bind(this);
    this.initBootstrap = this.initBootstrap.bind(this);

    // Subscribe to event
    js_eventEmitter.fn_subscribe(js_event.EE_displayConfigGenerator, this, this.fn_displayForm);
  }

  componentWillUnmount() {
    js_eventEmitter.fn_unsubscribe(js_event.EE_displayConfigGenerator, this);
  }

  /**
   * Handles the display event, sets state, and loads configuration.
   * @param {Object} me - Reference to this component
   * @param {Object} data - {p_unit, module}
   */
  fn_displayForm(me, data) {
    const { p_unit, module } = data;
    me.setState({
      p_unit,
      module,
      visible: true,
      fileName: `${module.k || 'config'}.json`,
      selectedConfig: '',
    }, () => {
      me.loadConfig(module.c);
    });
  }

  /**
   * Loads the configuration JSON file based on module class.
   * @param {string} module_class - The class from module.c
   */
  async loadConfig(module_class) {
    let file = 'default.json';

    switch (module_class) {
      case 'fcb':
        file = 'fcb.json';
        break;

      case 'camera':
        file = 'camera.json';
        break;

      case 'gpio':
        file = 'gpio.json';
        break;
    }
    // Add more conditions for other module classes as needed

    try {
      const res = await fetch(`/configuration_files/${file}`); // Adjust path as needed
      const jsonData = await res.json();
      this.setState({ jsonData }, () => {
        // Select the first configuration by default
        const firstConfig = Array.isArray(jsonData) && jsonData.length > 0 ? jsonData[0] : { template: {} };
        this.setState({
          selectedConfig: firstConfig.name || '',
          values: buildInitialValues(firstConfig.template || {}),
          enabled: buildInitialEnabled(firstConfig.template || {}),
          output: JSON.stringify(buildOutput(firstConfig.template || {}, this.state.values, this.state.enabled), null, 4),
        });
        this.currentTemplate = firstConfig.template || {};
      });
    } catch (e) {
      console.error('Failed to load config:', e);
      this.setState({ jsonData: [], selectedConfig: '', values: {}, enabled: {}, output: '' });
    }
  }

  /**
   * Handles configuration selection from dropdown.
   * @param {Object} e - Event object
   */
  handleSelectChange(e) {
    const selectedConfig = e.target.value;
    const config = this.state.jsonData.find(c => c.name === selectedConfig) || { template: {} };
    this.currentTemplate = config.template || {};
    this.setState({
      selectedConfig,
      values: buildInitialValues(this.currentTemplate),
      enabled: buildInitialEnabled(this.currentTemplate),
      output: JSON.stringify(buildOutput(this.currentTemplate, this.state.values, this.state.enabled), null, 4),
    }, () => this.initBootstrap());
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!this.m_flag_mounted) return false;

    if (
      this.state.visible !== nextState.visible ||
      this.state.p_unit !== nextState.p_unit ||
      this.state.module !== nextState.module ||
      JSON.stringify(this.state.jsonData) !== JSON.stringify(nextState.jsonData) ||
      this.state.selectedConfig !== nextState.selectedConfig ||
      JSON.stringify(this.state.values) !== JSON.stringify(nextState.values) ||
      JSON.stringify(this.state.enabled) !== JSON.stringify(nextState.enabled) ||
      this.state.fileName !== nextState.fileName
    ) {
      return true;
    }
    // Skip re-render if only output changes
    return false;
  }

  /**
   * Initializes Bootstrap tooltips and dropdowns.
   */
  initBootstrap() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
  }

  /**
   * Lifecycle method to initialize Bootstrap after mount.
   */
  componentDidMount() {
    this.m_flag_mounted = true;
    this.initBootstrap();
  }

  /**
   * Lifecycle method to re-initialize Bootstrap after updates.
   * @param {Object} prevProps - Previous props
   * @param {Object} prevState - Previous state
   */
  componentDidUpdate(prevProps, prevState) {
    if (
      JSON.stringify(this.state.enabled) !== JSON.stringify(prevState.enabled) ||
      this.state.visible !== prevState.visible ||
      this.state.selectedConfig !== prevState.selectedConfig
    ) {
      this.initBootstrap();
    }
  }

  /**
   * Closes the config generator dialog.
   */
  fn_close() {
    this.setState({ visible: false, jsonData: null, selectedConfig: '', values: {}, enabled: {}, output: '' });
  }

  /**
   * Handles form submission by sending config to the API and closing.
   */
  fn_handleSubmit() {
    if (this.state.p_unit && this.state.module) {
      js_globals.v_andruavFacade.API_updateConfig(
        this.state.p_unit,
        this.state.module.k,
        this.state.output
      );
    }
    this.fn_close();
  }

  handleCopy() {
    handleCopy(this.state.output);
  }

  handleSave() {
    handleSave(this.state.output, this.state.fileName);
  }

  renderFields(fields, path = '') {
    if (!fields) return null;

    return Object.entries(fields).map(([key, fieldConfig]) => {
      const fullPath = path ? `${path}.${key}` : key;
      const enabled = getNested(this.state.enabled, fullPath) ?? true;
      const disabled = enabled ? '' : 'disabled';

      const input = this.renderInput(fieldConfig, fullPath, enabled, disabled);

      return (
        <div key={fullPath} className="form-group mb-2 small">
          {fieldConfig.optional && (
            <div className="form-check mb-1">
              <input
                type="checkbox"
                className="form-check-input"
                checked={enabled}
                onChange={(e) => this.setState(
                  (prev) => {
                    const newEnabled = updateEnable(prev.enabled, fullPath, e.target.checked);
                    const newOutput = JSON.stringify(buildOutput(this.currentTemplate, prev.values, newEnabled), null, 4);
                    return { enabled: newEnabled, output: newOutput };
                  },
                  () => this.initBootstrap()
                )}
              />
              <label className="form-check-label">{key}</label>
            </div>
          )}
          {!fieldConfig.optional && <label>{key}</label>}
          {fieldConfig.desc && (
            <small className="text-muted d-block mb-1">{fieldConfig.desc}</small>
          )}
          {input}
        </div>
      );
    });
  }

  renderInput(fieldConfig, fullPath, enabled, disabled) {
    switch (fieldConfig.type) {
      case 'text':
      case 'number':
        return (
          <input
            type={fieldConfig.type}
            className={`form-control input-sm ${disabled} ${fieldConfig.css || ''}`}
            value={getNested(this.state.values, fullPath) ?? fieldConfig.defaultvalue ?? ''}
            onChange={(e) => this.setState(
              (prev) => {
                const newValues = updateValue(prev.values, fullPath, fieldConfig.type === 'number' ? Number(e.target.value) : e.target.value);
                const newOutput = JSON.stringify(buildOutput(this.currentTemplate, newValues, prev.enabled), null, 4);
                return { values: newValues, output: newOutput };
              },
              () => this.initBootstrap()
            )}
            disabled={!enabled}
          />
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            className={`form-check-input ${disabled}`}
            checked={getNested(this.state.values, fullPath) ?? fieldConfig.defaultvalue ?? false}
            onChange={(e) => this.setState(
              (prev) => {
                const newValues = updateValue(prev.values, fullPath, e.target.checked);
                const newOutput = JSON.stringify(buildOutput(this.currentTemplate, newValues, prev.enabled), null, 4);
                return { values: newValues, output: newOutput };
              },
              () => this.initBootstrap()
            )}
            disabled={!enabled}
          />
        );
      case 'combo':
        return (
          <select
            className={`form-select input-sm ${disabled}`}
            value={getNested(this.state.values, fullPath) ?? fieldConfig.defaultvalue ?? ''}
            onChange={(e) => this.setState(
              (prev) => {
                const newValues = updateValue(prev.values, fullPath, e.target.value);
                const newOutput = JSON.stringify(buildOutput(this.currentTemplate, newValues, prev.enabled), null, 4);
                return { values: newValues, output: newOutput };
              },
              () => this.initBootstrap()
            )}
            disabled={!enabled}
          >
            {fieldConfig.list_values?.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            )) || null}
          </select>
        );
      case 'array':
        const arr = getNested(this.state.values, fullPath) ?? fieldConfig.defaultvalue ?? [];
        return (
          <div className="array-input">
            {arr.map((val, index) => (
              <input
                key={index}
                type="number"
                className={`form-control input-sm ${disabled}`}
                value={val}
                onChange={(e) => this.setState(
                  (prev) => {
                    const newValues = updateValue(prev.values, `${fullPath}.${index}`, Number(e.target.value));
                    const newOutput = JSON.stringify(buildOutput(this.currentTemplate, newValues, prev.enabled), null, 4);
                    return { values: newValues, output: newOutput };
                  },
                  () => this.initBootstrap()
                )}
                disabled={!enabled}
              />
            ))}
          </div>
        );
      case 'object':
        return <div className="object-input">{this.renderFields(fieldConfig.fields, fullPath)}</div>;
      default:
        return (
          <input
            type="text"
            id={fullPath}
            className={`form-control input-sm ${disabled}`}
            value={getNested(this.state.values, fullPath) ?? fieldConfig.defaultvalue ?? ''}
            onChange={(e) => this.setState(
              (prev) => {
                const newValues = updateValue(prev.values, fullPath, e.target.value);
                const newOutput = JSON.stringify(buildOutput(this.currentTemplate, newValues, prev.enabled), null, 4);
                return { values: newValues, output: newOutput };
              },
              () => this.initBootstrap()
            )}
            disabled={!enabled}
          />
        );
    }
  }

  render() {
    if (!this.state.visible) return null;

    const title = this.state.module ? `Config for ${this.state.module.i || 'Module'}` : 'Configuration Generator';

    return (
      <Draggable nodeRef={this.popupRef}>
        <div 
          ref={this.popupRef} 
          className="container-fluid bg-dark text-light position-fixed" 
          style={{ 
            zIndex: 1000, 
            width: '500px', 
            maxHeight: '80vh', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Fixed Header */}
          <div className="p-3 border-bottom" style={{ flexShrink: 0 }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{title}</h5>
              <button className="btn-close btn-close-white" onClick={this.fn_close}></button>
            </div>
            {Array.isArray(this.state.jsonData) && this.state.jsonData.length > 1 && (
              <div className="mt-3">
                <h6 className="mb-2">Select Configuration:</h6>
                <select
                  id="configSelect"
                  className="form-select mb-2 small"
                  value={this.state.selectedConfig}
                  onChange={this.handleSelectChange}
                >
                  <option value="">Select a configuration</option>
                  {this.state.jsonData.map((config) => (
                    <option key={config.name} value={config.name}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Scrollable Content with increased height */}
          <div 
            id="form-container" 
            className="p-3 small" 
            style={{ 
              flex: '1 1 60%', // Increased height allocation
              overflowY: 'auto',
              maxHeight: 'calc(80vh - 150px)' // Adjusted to give more space to middle
            }}
          >
            {this.renderFields(this.currentTemplate)}
          </div>

          {/* Fixed Bottom Section with reduced spacing */}
          <div className="p-2 border-top" style={{ flexShrink: 0 }}>
            <h6 className="mb-2">Generated JSON:</h6>
            <div className="position-relative mb-2 small">
              <textarea
                id="output"
                className="form-control bg-dark text-light"
                value={this.state.output}
                readOnly
                rows={4} // Reduced height
              />
              <button
                className="btn btn-warning btn-sm position-absolute top-0 end-0 m-1"
                onClick={this.handleCopy}
              >
                Copy
              </button>
              <button
                className="btn btn-warning btn-sm position-absolute top-0 end-0 m-1 me-5"
                onClick={this.fn_handleSubmit}
              >
                Apply
              </button>
            </div>

            <div className="input-group mb-0 small">
              <input
                type="text"
                id="filename"
                className="form-control input-sm"
                value={this.state.fileName}
                onChange={(e) => this.setState({ fileName: e.target.value })}
                placeholder="config.json"
              />
              <button
                className="btn btn-primary"
                onClick={this.handleSave}
              >
                Save Config
              </button>
            </div>
          </div>
        </div>
      </Draggable>
    );
}
}