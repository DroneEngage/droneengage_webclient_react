/**
 *  Author: Mohammad S.Hefny
 *  Date: 2 Oct 2025
 * 
 *  Function: The ClssConfigGenerator is a React class component designed to dynamically generate 
 *  a form based on a JSON configuration input (provided via the configs prop) 
 *  and produce a JSON output based on user interactions.
 * 
 */
import React from 'react';
import {handleSave, handleCopy, updateEnable, updateValue, getNested, buildOutput, buildInitialEnabled, buildInitialValues} from '../js/helpers/js_form_utils.js'

/**
 * ClssConfigGenerator is a React class component that dynamically generates a form
 * based on a JSON configuration input and produces a JSON output based on user input.
 * It supports text, number, checkbox, combo, array, and object field types, with optional fields
 * toggled via checkboxes. The generated JSON can be copied to the clipboard or saved as a file.
 */
export class ClssConfigGenerator extends React.Component {
  /**
   * Constructor initializes the component's state and binds methods.
   * @param {Object} props - Component props, including configs array
   */
  constructor(props) {
    super(props);
    this.state = {
      selected: props.configs[0]?.name || '', // Selected configuration name
      values: {}, // Form field values
      enabled: {}, // Enabled state for optional fields
      output: '', // Generated JSON string
      fileName: 'config.json', // Default filename for saving
    };

    // Set initial template and initialize state
    this.currentTemplate = props.configs.find(c => c.name === this.state.selected)?.template || {};
    // Initialize values, enabled, and output in a single state update
    this.state = {
      ...this.state,
      values: buildInitialValues(this.currentTemplate),
      enabled: buildInitialEnabled(this.currentTemplate),
      output: JSON.stringify(buildOutput(this.currentTemplate, this.state.values, this.state.enabled), null, 4),
    };

    // Bind methods to ensure correct 'this' context
    this.handleCopy = this.handleCopy.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
  }

  /**
   * Updates the values, enabled states, and output based on the current template.
   * Combines all updates into a single state update to ensure consistency.
   */
  updateValuesAndEnabled() {
    const values = buildInitialValues(this.currentTemplate);
    const enabled = buildInitialEnabled(this.currentTemplate);
    const output = JSON.stringify(buildOutput(this.currentTemplate, values, enabled), null, 4);
    this.setState({ values, enabled, output });
  }

  /**
   * Generates the JSON output string and updates the state.
   * @param {Object} values - Current form values
   * @param {Object} enabled - Current enabled states
   */
  updateOutput(values, enabled) {
    const output = JSON.stringify(buildOutput(this.currentTemplate, values, enabled), null, 4);
    this.setState({ output });
  }

  /**
   * Handles changes to the configuration dropdown, updating the selected template and state.
   * @param {Event} e - The change event from the select element
   */
  handleSelectChange(e) {
    this.setState({ selected: e.target.value }, () => {
      this.currentTemplate = this.props.configs.find(c => c.name === this.state.selected)?.template || {};
      this.updateValuesAndEnabled();
    });
  }

  /**
   * Renders form fields based on the template, including optional checkboxes.
   * @param {Object} template - The configuration template
   * @param {string} path - The current path for nested fields
   * @returns {JSX.Element[]} Array of JSX elements for form fields
   */
  renderFields(template, path = '') {
    return Object.entries(template).map(([fieldName, fieldConfig]) => {
      const fullPath = path ? `${path}.${fieldName}` : fieldName;
      const isOptional = !!fieldConfig.optional;
      const isEnabled = !isOptional || this.state.enabled[fullPath];
      let optionalPart = null;
      if (isOptional) {
        optionalPart = (
          <div className="optional-container">
            <label htmlFor={`${fullPath}_optional`} className="form-label me-2">Include?</label>
            <input
              type="checkbox"
              id={`${fullPath}_optional`}
              className="form-check-input"
              checked={this.state.enabled[fullPath] || false}
              onChange={(e) => this.setState(
                (prev) => {
                  const newEnabled = updateEnable(prev.enabled, fullPath, e.target.checked);
                  return { enabled: newEnabled };
                },
                () => this.updateOutput(this.state.values, this.state.enabled)
              )}
            />
          </div>
        );
      }
      return (
        <div key={fullPath} className="mb-3">
          <label htmlFor={fullPath} className="form-label" title={fieldConfig.desc}>
            {fieldName}
          </label>
          {optionalPart}
          {this.renderInput(fieldName, fieldConfig, path, isEnabled)}
        </div>
      );
    });
  }

  /**
   * Renders an individual input control based on the field type.
   * @param {string} fieldName - The name of the field
   * @param {Object} fieldConfig - The configuration for the field
   * @param {string} path - The current path for nested fields
   * @param {boolean} enabled - Whether the field is enabled
   * @returns {JSX.Element} The input control
   */
  renderInput(fieldName, fieldConfig, path, enabled) {
    const fullPath = path ? `${path}.${fieldName}` : fieldName;
    const disabled = !enabled ? 'disabled' : '';
    switch (fieldConfig.type) {
      case 'text':
        return (
          <input
            type="text"
            id={fullPath}
            className={`form-control ${disabled}`}
            value={getNested(this.state.values, fullPath) ?? ''}
            onChange={(e) => this.setState(
              (prev) => {
                const newValues = updateValue(prev.values, fullPath, e.target.value);
                return { values: newValues };
              },
              () => this.updateOutput(this.state.values, this.state.enabled)
            )}
            disabled={!enabled}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            id={fullPath}
            className={`form-control ${disabled}`}
            value={getNested(this.state.values, fullPath) ?? ''}
            onChange={(e) => this.setState(
              (prev) => {
                const newValues = updateValue(prev.values, fullPath, Number(e.target.value));
                return { values: newValues };
              },
              () => this.updateOutput(this.state.values, this.state.enabled)
            )}
            disabled={!enabled}
          />
        );
      case 'checkbox':
        return (
          <div className="form-check">
            <input
              type="checkbox"
              id={fullPath}
              className={`form-check-input ${disabled}`}
              checked={getNested(this.state.values, fullPath) ?? false}
              onChange={(e) => this.setState(
                (prev) => {
                  const newValues = updateValue(prev.values, fullPath, e.target.checked);
                  return { values: newValues };
                },
                () => this.updateOutput(this.state.values, this.state.enabled)
              )}
              disabled={!enabled}
            />
          </div>
        );
      case 'combo':
        return (
          <select
            id={fullPath}
            className={`form-select ${disabled}`}
            value={getNested(this.state.values, fullPath) ?? ''}
            onChange={(e) => this.setState(
              (prev) => {
                const newValues = updateValue(prev.values, fullPath, e.target.value);
                return { values: newValues };
              },
              () => this.updateOutput(this.state.values, this.state.enabled)
            )}
            disabled={!enabled}
          >
            {fieldConfig.list_values.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        );
      case 'array':
        const arr = getNested(this.state.values, fullPath) ?? [];
        return (
          <div className="array-input">
            {arr.map((val, index) => (
              <input
                key={index}
                type="number"
                className={`form-control ${disabled}`}
                value={val}
                onChange={(e) => this.setState(
                  (prev) => {
                    const newValues = updateValue(prev.values, `${fullPath}.${index}`, Number(e.target.value));
                    return { values: newValues };
                  },
                  () => this.updateOutput(this.state.values, this.state.enabled)
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
            className={`form-control ${disabled}`}
            value={getNested(this.state.values, fullPath) ?? ''}
            onChange={(e) => this.setState(
              (prev) => {
                const newValues = updateValue(prev.values, fullPath, e.target.value);
                return { values: newValues };
              },
              () => this.updateOutput(this.state.values, this.state.enabled)
            )}
            disabled={!enabled}
          />
        );
    }
  }

  /**
   * Copies the generated JSON to the clipboard.
   */
  handleCopy() {
    handleCopy(this.state.output);
  }

  /**
   * Saves the generated JSON as a downloadable file.
   */
  handleSave() {
    handleSave(this.state.output, this.state.fileName);
  }

  /**
   * Renders the component, including configuration selector, form fields, JSON output, and buttons.
   * @returns {JSX.Element} The rendered component
   */
  render() {
    return (
      <div className="container-fluid bg-dark text-light p-4">
        <h5 className="mb-3">Select Configuration:</h5>
        <select
          id="configSelect"
          className="form-select mb-4"
          value={this.state.selected}
          onChange={this.handleSelectChange}
        >
          <option value="">Select a configuration</option>
          {this.props.configs.map((config) => (
            <option key={config.name} value={config.name}>
              {config.name}
            </option>
          ))}
        </select>

        <div id="form-container" className="mb-4">
          {this.renderFields(this.currentTemplate)}
        </div>

        <h5 className="mb-3">Generated JSON:</h5>
        <div className="position-relative mb-4">
          <textarea
            id="output"
            className="form-control bg-dark text-light"
            value={this.state.output}
            readOnly
            rows={10}
          />
          <button
            id="copyButton"
            className="btn btn-warning btn-sm"
            onClick={this.handleCopy}
          >
            Copy
          </button>
        </div>

        <div className="input-group mb-3">
          <input
            type="text"
            id="filename"
            className="form-control"
            value={this.state.fileName}
            onChange={(e) => this.setState({ fileName: e.target.value })}
            placeholder="config.json"
          />
          <button
            id="saveButton"
            className="btn btn-primary"
            onClick={this.handleSave}
          >
            Save Config
          </button>
        </div>
      </div>
    );
  }
}

