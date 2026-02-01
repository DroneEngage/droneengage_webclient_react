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
import * as js_andruavMessages from '../js/protocol/js_andruavMessages'
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

import { fn_do_modal_confirmation } from '../js/js_main.js';
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
      output: { objectOutput: {}, fieldNameOutput: {} },
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
    this.fn_shutdownModule = this.fn_shutdownModule.bind(this);

    // Subscribe to event
    js_eventEmitter.fn_subscribe(js_event.EE_displayConfigGenerator, this, this.fn_displayForm);
  }

  componentDidMount () {
        this.m_flag_mounted = true;
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
      me.loadConfig(module);
    });
  }

  /**
   * Loads the configuration JSON file based on module class.
   * @param {object} module - The class from module.c
   */
  async loadConfig(module) {
    let file = 'default.json';

    switch (module.c) {
      case 'fcb':
        file = 'fcb.json';
        break;

      case 'camera':
        file = 'camera.json';
        break;

      case 'gpio':
        file = 'gpio.json';
        break;
      case 'trk':
        file = 'tracking.json';
        break;
      // Add more conditions for other module classes as needed
    }

    let configData = module.template; // Use module.template as the initial fallback

    try {
      const res = await fetch(`/template/settings/${file}`); // Adjust path as needed

      // Check if the response is successful (status code 200-299)
      if (res.ok) {
        configData = await res.json(); // If successful, use the fetched data
      } else {
        // If fetch succeeds but status is not 'ok' (e.g., 404),
        // we log it and continue to use the initial fallback (module.template).
        console.warn(`Configuration file not found or failed for ${file}. Status: ${res.status}`);
      }

    } catch (e) {
      // If fetch fails (e.g., network error, JSON parsing error),
      // we log the error and continue to use the initial fallback (module.template).
      console.error(`Failed to fetch or parse config file ${file}:`, e);
      // configData remains module.template from the initialization above
    }

    // Use configData (which is either the fetched data or module.template)
    this.setState({ jsonData: configData }, () => {
      // Ensure configData is an array for safety when accessing the first element
      const firstConfig = Array.isArray(configData) && configData.length > 0 ? configData[0] : { template: {} };

      this.setState({
        selectedConfig: firstConfig.name || '',
        values: buildInitialValues(firstConfig.template || {}),
        enabled: buildInitialEnabled(firstConfig.template || {}),
        output: buildOutput(firstConfig.template || {}, this.state.values, this.state.enabled),
      });
      this.currentTemplate = firstConfig.template || {};
    });
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
      output: buildOutput(this.currentTemplate, this.state.values, this.state.enabled)
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

      const newOutput = buildOutput(this.currentTemplate, newValues, newEnabled);
      return { values: newValues, enabled: newEnabled, output: newOutput };
    }, () => this.initBootstrap());
  }

  handleRemoveArrayItem(fullPath, index) {
    this.setState(prev => {
      const newValues = JSON.parse(JSON.stringify(prev.values));
      const array = getNested(newValues, fullPath) || [];
      array.splice(index, 1);
      setNested(newValues, fullPath, array);

      const newOutput = buildOutput(this.currentTemplate, newValues, prev.enabled)
      return { values: newValues, output: newOutput };
    }, () => this.initBootstrap());
  }

  handleEnableChange(fullPath, checked) {
    this.setState(prev => ({
      enabled: updateEnable(prev.enabled, fullPath, checked),
      output: buildOutput(this.currentTemplate, prev.values, updateEnable(prev.enabled, fullPath, checked)),
    }));
  }

  // Renders fields for a given template, sorting by 'order' property
  renderFields(template, path = '') {
    const fields = [];
    // Sort field names based on the 'order' property
    const fieldNames = Object.keys(template).sort((a, b) => {
      const orderA = template[a]?.order || 999;
      const orderB = template[b]?.order || 999;
      return orderA - orderB;
    });

    for (const fieldName of fieldNames) {
      let fieldConfig = template[fieldName];
      if (fieldConfig == null) continue;
      if (typeof fieldConfig === 'object' && fieldConfig.type === undefined) {
        fieldConfig = { type: 'object', fields: fieldConfig };
      }
      const fullPath = path ? `${path}.${fieldName}` : fieldName;
      const effectiveConfig = {
        ...fieldConfig,
        cssClass: fieldConfig.css || fieldConfig.cssClass || '', // Map 'css' to 'cssClass'
        options: fieldConfig.type === 'combo' && fieldConfig.list_values
          ? fieldConfig.list_values.map(value => ({ value, label: value }))
          : fieldConfig.options || []
      };

      if (effectiveConfig.type === 'object') {
        fields.push(this.renderObjectField(effectiveConfig, fieldName, fullPath));
      } else if (effectiveConfig.type === 'array') {
        fields.push(this.renderArrayField(effectiveConfig, fieldName, fullPath));
      } else {
        fields.push(this.renderScalarField(effectiveConfig, fieldName, fullPath));
      }
    }
    return fields;
  }

  // Renders an object field with nested fields
  renderObjectField(config, fieldName, fullPath) {
    const v_fieldName = fieldName || config.fieldName;
    return (
      <div key={fullPath} className="mb-2">
        <h6>{v_fieldName}
          {config.desc && (
            <i
              className="bi bi-info-circle ms-1 text-info"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title={config.desc}
            ></i>
          )}
        </h6>
        <div className="ms-3">
          {this.renderFields(config.fields, fullPath)}
        </div>
      </div>
    );
  }

  // Renders an array field with nested items and add/remove buttons
  renderArrayField(config, fieldName, fullPath) {
    const v_fieldName = fieldName || config.fieldName;
    const arrayValues = getNested(this.state.values, fullPath) || [];
    return (
      <div key={fullPath} className="mb-2">
        <h6>{v_fieldName}
          {config.desc && (
            <i
              className="bi bi-info-circle ms-1 text-info"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title={config.desc}
            ></i>
          )}
        </h6>
        {arrayValues.map((item, index) => (
          <div key={`${fullPath}.${index}`} className="border p-2 mb-2">
            {this.renderFields(config.array_template, `${fullPath}.${index}`)}
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => this.handleRemoveArrayItem(fullPath, index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-sm btn-success"
          onClick={() => this.handleAddArrayItem(fullPath, config.array_template)}
        >
          Add Item
        </button>
      </div>
    );
  }

  // Renders scalar fields by delegating to specific field type renderers
  renderScalarField(config, fieldName, fullPath) {
    if (config.type === 'checkbox') {
      return this.renderCheckboxField(config, fieldName, fullPath);
    } else if (config.type === 'combo') {
      return this.renderComboField(config, fieldName, fullPath);
    } else {
      return this.renderInputField(config, fieldName, fullPath);
    }
  }

  // Renders a checkbox field
  renderCheckboxField(config, fieldName, fullPath) {
    const v_fieldName = fieldName || config.fieldName;
    const cssClass = config.cssClass;
    const disabled = config.optional && !(this.state.enabled[fullPath] ?? true) ? 'disabled' : '';
    const isChecked = this.state.enabled[fullPath] ?? true;

    return (
      <div key={fullPath} className="mb-2">
        {config.optional && (
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${fullPath}_enable`}
              checked={isChecked}
              onChange={(e) => {
                this.setState(prevState => ({
                  enabled: updateEnable(prevState.enabled, fullPath, e.target.checked)
                }), () => {
                  this.setState({
                    output: buildOutput(this.currentTemplate, this.state.values, this.state.enabled)
                  }, () => this.initBootstrap());
                });
              }}
            />
            <label className="form-check-label" htmlFor={`${fullPath}_enable`}>
              {v_fieldName}{config.desc && (
              <i
                className="bi bi-info-circle ms-1 text-info"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={config.desc}
              ></i>
            )}
            </label>
          </div>
        )}
        {!config.optional && (
          <h6>{v_fieldName}
            {config.desc && (
              <i
                className="bi bi-info-circle ms-1 text-info"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={config.desc}
              ></i>
            )}
          </h6>
        )}
        <select
          className={`form-select ${cssClass} ${disabled}`}
          value={(getNested(this.state.values, fullPath) ?? false) ? 'true' : 'false'}
          onChange={(e) => {
            const newVal = e.target.value === 'true';
            this.setState(prevState => ({
              values: updateValue(prevState.values, fullPath, newVal)
            }), () => {
              this.setState({
                output: buildOutput(this.currentTemplate, this.state.values, this.state.enabled)
              }, () => this.initBootstrap());
            });
          }}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </div>
    );
  }

  // Renders a combo (select) field
  renderComboField(config, fieldName, fullPath) {
    const v_fieldName = fieldName || config.fieldName;
    const cssClass = config.cssClass;
    const disabled = config.optional && !(this.state.enabled[fullPath] ?? true) ? 'disabled' : '';
    const isChecked = this.state.enabled[fullPath] ?? true;

    return (
      <div key={fullPath} className="mb-2">
        {config.optional && (
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${fullPath}_enable`}
              checked={isChecked}
              onChange={(e) => {
                this.setState(prevState => ({
                  enabled: updateEnable(prevState.enabled, fullPath, e.target.checked)
                }), () => {
                  this.setState({
                    output: buildOutput(this.currentTemplate, this.state.values, this.state.enabled),
                  }, () => this.initBootstrap());
                });
              }}
            />
            <label className="form-check-label" htmlFor={`${fullPath}_enable`}>
              {v_fieldName}{config.desc && (
              <i
                className="bi bi-info-circle ms-1 text-info"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={config.desc}
              ></i>
            )}
            </label>
          </div>
        )}
        {!config.optional && (
          <h6>{v_fieldName}
            {config.desc && (
              <i
                className="bi bi-info-circle ms-1 text-info"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={config.desc}
              ></i>
            )}
          </h6>
        )}
        <select
          className={`form-select ${cssClass} ${disabled}`}
          value={getNested(this.state.values, fullPath) || config.defaultvalue}
          onChange={(e) => {
            this.setState(prevState => ({
              values: updateValue(prevState.values, fullPath, e.target.value)
            }), () => {
              this.setState({
                output: buildOutput(this.currentTemplate, this.state.values, this.state.enabled)
              }, () => this.initBootstrap());
            });
          }}
        >
          {config.options.map((option, idx) => (
            <option key={idx} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    );
  }

  // Renders a number or text input field
  renderInputField(config, fieldName, fullPath) {
    const v_fieldName = fieldName || config.fieldName;
    const cssClass = config.cssClass;
    const disabled = config.optional && !(this.state.enabled[fullPath] ?? true) ? 'disabled' : '';
    const isChecked = this.state.enabled[fullPath] ?? true;

    return (
      <div key={fullPath} className="mb-2">
        {config.optional && (
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${fullPath}_enable`}
              checked={isChecked}
              onChange={(e) => {
                this.setState(prevState => ({
                  enabled: updateEnable(prevState.enabled, fullPath, e.target.checked)
                }), () => {
                  this.setState({
                    output: buildOutput(this.currentTemplate, this.state.values, this.state.enabled)
                  }, () => this.initBootstrap());
                });
              }}
            />
            <label className="form-check-label" htmlFor={`${fullPath}_enable`}>
              {v_fieldName}{config.desc && (
              <i
                className="bi bi-info-circle ms-1 text-info"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={config.desc}
              ></i>
            )}
            </label>
          </div>
        )}
        {!config.optional && (
          <h6>{v_fieldName}
            {config.desc && (
              <i
                className="bi bi-info-circle ms-1 text-info"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={config.desc}
              ></i>
            )}
          </h6>
        )}
        <input
          type={config.type === 'number' ? 'number' : 'text'}
          className={`form-control ${cssClass} ${disabled}`}
          value={getNested(this.state.values, fullPath) ?? config.defaultvalue ?? ''}
          onChange={(e) => {
            const value = e.target.value; // Allow raw input, including empty string
            this.setState(prevState => ({
              values: updateValue(prevState.values, fullPath, value)
            }), () => {
              this.setState({
                output: buildOutput(this.currentTemplate, this.state.values, this.state.enabled)
              }, () => this.initBootstrap());
            });
          }}
          onBlur={(e) => {
            if (config.type === 'number') {
              let value = e.target.value;
              if (value === '' || isNaN(value)) {
                value = config.defaultvalue ?? config.min ?? 0;
              } else {
                value = Number(value);
                if (config.min !== undefined && value < config.min) value = config.min;
                if (config.max !== undefined && value > config.max) value = config.max;
              }
              this.setState(prevState => ({
                values: updateValue(prevState.values, fullPath, value)
              }), () => {
                this.setState({
                  output: buildOutput(this.currentTemplate, this.state.values, this.state.enabled)
                }, () => this.initBootstrap());
              });
            }
          }}
        />
      </div>
    );
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
    const me  = this;
    fn_do_modal_confirmation("WARNING! - Config Change " + this.state.p_unit.m_unitName,
      "Are you sure you want to apply settings", function (p_approved) {
        if (p_approved === false) return;

        js_globals.v_andruavFacade.API_updateConfigJSON(me.state.p_unit, me.state.module, me.state.output.fieldNameOutput);

        console.log('Submitted:', me.state.output);
        alert("data submitted. you need to restart the module.");

      }, "YES", "bg-danger txt-theme-aware");

    
  }

  fn_shutdownModule() {
    const me  = this;
    fn_do_modal_confirmation("WARNING! - Config Change " + this.state.p_unit.m_unitName,
      "Are you sure you want to apply settings", function (p_approved) {
        if (p_approved === false) return;

        js_globals.v_andruavFacade.API_doModuleConfigAction(me.state.p_unit, me.state.module.k, js_andruavMessages.CONST_TYPE_CONFIG_ACTION_Restart);
    
        console.log('Submitted:', me.state.output);
        alert("data submitted. you need to restart the module.");
        
      }, "YES", "bg-danger txt-theme-aware");
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
          className="modal bg-dark txt-theme-aware position-fixed"
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
                className="form-control bg-dark txt-theme-aware w-100"
                value={JSON.stringify(this.state.output.fieldNameOutput, null, 4)}
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
                  className="btn btn-danger btn-sm m-1 textunit_nowidth"
                  onClick={this.fn_handleSubmit}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm m-1 textunit_nowidth"
                  onClick={(e) => this.fn_shutdownModule()}
                >
                  Restart
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