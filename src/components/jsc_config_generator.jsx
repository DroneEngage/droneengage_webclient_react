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
  setNested,
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
    this.key = Math.random().toString();

    // Bind methods
    this.handleCopy = this.handleCopy.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.fn_handleSubmit = this.fn_handleSubmit.bind(this);
    this.fn_close = this.fn_close.bind(this);
    this.initBootstrap = this.initBootstrap.bind(this);
    this.handleAddArrayItem = this.handleAddArrayItem.bind(this);
    this.handleRemoveArrayItem = this.handleRemoveArrayItem.bind(this);

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

  handleAddArrayItem(fullPath, arrayTemplate) {
    this.setState(prev => {
      const newValues = JSON.parse(JSON.stringify(prev.values));
      const array = getNested(newValues, fullPath) || [];
      array.push(buildInitialValues(arrayTemplate));
      setNested(newValues, fullPath, array);

      const newEnabled = { ...prev.enabled };
      const newIndex = array.length - 1;
      buildInitialEnabled(arrayTemplate, `${fullPath}.${newIndex}`, newEnabled);

      const newOutput = JSON.stringify(buildOutput(this.currentTemplate, newValues, newEnabled), null, 4);
      return { values: newValues, enabled: newEnabled, output: newOutput };
    }, () => this.initBootstrap());
  }

  handleRemoveArrayItem(fullPath, index) {
    this.setState(prev => {
      const newValues = JSON.parse(JSON.stringify(prev.values));
      const array = getNested(newValues, fullPath) || [];
      array.splice(index, 1);
      setNested(newValues, fullPath, array);

      const newOutput = JSON.stringify(buildOutput(this.currentTemplate, newValues, prev.enabled), null, 4);
      return { values: newValues, output: newOutput };
    }, () => this.initBootstrap());
  }

  handleEnableChange(fullPath, checked) {
    this.setState(prev => ({
      enabled: updateEnable(prev.enabled, fullPath, checked),
      output: JSON.stringify(buildOutput(this.currentTemplate, prev.values, updateEnable(prev.enabled, fullPath, checked)), null, 4),
    }));
  }

  renderFields(template, parentPath = '') {
    const fields = [];
    for (const fieldName in template) {
      let fieldConfig = template[fieldName];
      if (typeof fieldConfig === 'object' && fieldConfig.type === undefined) {
        fieldConfig = { type: 'object', fields: fieldConfig };
      }
      const fullPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;
      const effectiveConfig = fieldConfig;
      const isEnabled = effectiveConfig.optional ? (this.state.enabled[fullPath] ?? false) : true;
      const cssClass = effectiveConfig.css || '';

      if (effectiveConfig.type === 'object') {
        fields.push(
          <div key={fullPath} className="mb-2">
            <h6>{fieldName}
              {effectiveConfig.desc && (
                <i
                  className="bi bi-info-circle ms-1 text-info"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title={effectiveConfig.desc}
                ></i>
              )}
            </h6>
            {effectiveConfig.optional && (
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={isEnabled}
                  onChange={(e) => {
                    this.setState({
                      enabled: updateEnable(this.state.enabled, fullPath, e.target.checked),
                      output: JSON.stringify(buildOutput(this.currentTemplate, this.state.values, {
                        ...this.state.enabled,
                        [fullPath]: e.target.checked
                      }), null, 4)
                    });
                  }}
                />
                <label className="form-check-label">Enable {fieldName}
                  {effectiveConfig.desc && (
                    <i
                      className="bi bi-info-circle ms-1 text-info"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title={effectiveConfig.desc}
                    ></i>
                  )}
                </label>
              </div>
            )}
            {isEnabled && (
              <div className="ms-3">{this.renderFields(effectiveConfig.fields, fullPath)}</div>
            )}
          </div>
        );
      } else if (effectiveConfig.type === 'array') {
        const arrayValues = getNested(this.state.values, fullPath) || [];
        fields.push(
          <div key={fullPath} className="mb-2">
            <h6>{fieldName}
              {effectiveConfig.desc && (
                <i
                  className="bi bi-info-circle ms-1 text-info"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title={effectiveConfig.desc}
                ></i>
              )}
            </h6>
            {arrayValues.map((item, index) => (
              <div key={`${fullPath}.${index}`} className="border p-1 mb-1 position-relative">
                <button
                  type="button"
                  className="btn-close btn-close-white position-relative float-end"
                  onClick={() => this.handleRemoveArrayItem(fullPath, index)}
                >
                  
                </button>
                {this.renderFields(effectiveConfig.array_template, `${fullPath}.${index}`)}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => this.handleAddArrayItem(fullPath, effectiveConfig.array_template)}
            >
              Add {fieldName}
            </button>
          </div>
        );
      } else {
        fields.push(
          <div key={fullPath} className="mb-2">
            {effectiveConfig.optional && (
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={isEnabled}
                  onChange={(e) => {
                    this.setState({
                      enabled: updateEnable(this.state.enabled, fullPath, e.target.checked),
                      output: JSON.stringify(buildOutput(this.currentTemplate, this.state.values, {
                        ...this.state.enabled,
                        [fullPath]: e.target.checked
                      }), null, 4)
                    });
                  }}
                />
                <label className="form-check-label">Enable {fieldName}
                  {effectiveConfig.desc && (
                    <i
                      className="bi bi-info-circle ms-1 text-info"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title={effectiveConfig.desc}
                    ></i>
                  )}
                </label>
              </div>
            )}
            {isEnabled && (
              <div className="mb-2">
                <span className="mb-2">{fieldName}
                  {effectiveConfig.desc && (
                    <i
                      className="bi bi-info-circle ms-1 text-info"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title={effectiveConfig.desc}
                    ></i>
                  )}
                </span>
                {effectiveConfig.type === 'combo' ? (
                  <select
                    className={`form-select ${cssClass}`}
                    value={getNested(this.state.values, fullPath) || effectiveConfig.defaultvalue}
                    onChange={(e) => {
                  this.setState(prevState => ({
                    values: updateValue(prevState.values, fullPath, e.target.value)
                  }), () => {
                    this.setState({
                      output: JSON.stringify(buildOutput(this.currentTemplate, this.state.values, this.state.enabled), null, 4)
                    }, () => this.initBootstrap());
                  });
                }}
                  >
                    {effectiveConfig.list_values.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : effectiveConfig.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={getNested(this.state.values, fullPath) || effectiveConfig.defaultvalue}
                    onChange={(e) => {
                  this.setState(prevState => ({
                    values: updateValue(prevState.values, fullPath, e.target.checked)
                  }), () => {
                    this.setState({
                      output: JSON.stringify(buildOutput(this.currentTemplate, this.state.values, this.state.enabled), null, 4)
                    }, () => this.initBootstrap());
                  });
                }}
                  />

                ) : (
                  <input
                    type={effectiveConfig.type === 'number' ? 'number' : 'text'}
                    className={`form-control ${cssClass}`}
                    value={getNested(this.state.values, fullPath) || effectiveConfig.defaultvalue}
                    onChange={(e) => {
                  const value = fieldConfig.type === 'number' ? Number(e.target.value) : e.target.value;
                  this.setState(prevState => ({
                    values: updateValue(prevState.values, fullPath, value)
                  }), () => {
                    this.setState({
                      output: JSON.stringify(buildOutput(this.currentTemplate, this.state.values, this.state.enabled), null, 4)
                    }, () => this.initBootstrap());
                  });
                }}
                  />
                )}

              </div>
            )}
          </div>
        );
      }
    }
    return fields;
  }

  initBootstrap() {
    // Initialize Bootstrap components if needed
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  }

  handleCopy() {
    handleCopy(this.state.output);
  }

  handleSave() {
    handleSave(this.state.output, this.state.fileName);
  }

  fn_handleSubmit() {
    // Implement apply logic, e.g., send to server
    js_globals.v_andruavFacade.API_updateConfigJSON(this.state.p_unit, this.state.module, JSON.parse(this.state.output));
    console.log('Submitted:', this.state.output);
    this.fn_close();
  }

  fn_close() {
    this.setState({ visible: false });
  }

  render() {
    if (!this.state.visible) return null;

    const title = this.state.module ? `Config for ${this.state.module.i || 'Module'}` : 'Configuration Generator';

    return (
      <Draggable nodeRef={this.popupRef}>
        <div
          id="modal_ctrl_config_generator"
          key={this.key + "m0"}
          ref={this.popupRef}
          className="modal bg-dark text-light position-fixed"
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
          <div className="modal-header p-3 border-bottom" style={{ flexShrink: 0 }}>
            <h5 className="modal-title mb-0">{title}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={this.fn_close}></button>
          </div>

          {Array.isArray(this.state.jsonData) && this.state.jsonData.length > 1 && (
            <div className="p-3 border-bottom">
              <h6 className="mb-2">Select Configuration:</h6>
              <select
                id="configSelect"
                className="form-select mb-2"
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

          {/* Scrollable Content with increased height */}
          <div
            id="form-container"
            className="modal-body p-3 small"
            style={{
              flex: '1 1 60%',
              overflowY: 'auto',
              maxHeight: 'calc(80vh - 150px)'
            }}
          >
            {this.renderFields(this.currentTemplate)}
          </div>

          {/* Fixed Bottom Section with reduced spacing */}
          <div className="p-2 border-top" style={{ flexShrink: 0 }}>
            <div className="mb-2">
              <h6 className="mb-2">Generated JSON:</h6>
            </div>
            <div className="mb-2">
              <textarea
                id="output"
                className="form-control bg-dark text-light w-100"
                value={this.state.output}
                readOnly
                rows={4}
              />
              <div className="d-flex justify-content-end mt-1">
                <button
                  type="button"
                  className="btn btn-warning btn-sm m-1 textunit_nowidth"
                  onClick={this.handleCopy}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="btn btn-warning btn-sm m-1 textunit_nowidth"
                  onClick={this.fn_handleSubmit}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
          <div className='modal-footer '>
            <div className="input-group mb-0">
              <input
                type="text"
                id="filename"
                className="form-control p-1"
                value={this.state.fileName}
                onChange={(e) => this.setState({ fileName: e.target.value })}
                placeholder="config.json"
              />
              <button
                type="button"
                className="btn btn-primary textunit_nowidth"
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