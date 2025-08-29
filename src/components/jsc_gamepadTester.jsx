import React from 'react';
import * as js_helpers from '../js/js_helpers';
import { js_globals } from '../js/js_globals';
import * as js_siteConfig from '../js/js_siteConfig.js'
import { js_eventEmitter } from '../js/js_eventEmitter';
import { js_localStorage } from '../js/js_localStorage';
import { js_speak } from '../js/js_speak';
import { fn_helpPage } from '../js/js_main.js';

const css_to_save = 'ms-3 p-1 px-2 btn btn-sm btn-danger ctrlbtn';
const css_normal = 'ms-3 p-1 px-2 btn btn-sm border-danger ctrlbtn';

export default class ClssGamepadTester extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gamepads: [],
      axes: [],
      buttons: [],
      axisFunctions: [],
      selectedConfig: '1',
      m_update: 1,
      configPreferences: {
        "1": { functionMappings: {}, axisReversed: [1,1,1,1,1,1,1,1], buttonsFunction: [], mode: 1 },
        "2": { functionMappings: {}, axisReversed: [1,1,1,1,1,1,1,1], buttonsFunction: [], mode: 1 },
        "3": { functionMappings: {}, axisReversed: [1,1,1,1,1,1,1,1], buttonsFunction: [], mode: 1 },
        "4": { functionMappings: {}, axisReversed: [1,1,1,1,1,1,1,1], buttonsFunction: [], mode: 1 },
        "5": { functionMappings: {}, axisReversed: [1,1,1,1,1,1,1,1], buttonsFunction: [], mode: 1 },
      },
    };

    this.txtSaveRef = React.createRef();
  }

  componentDidMount() {
    this.loadSavedConfigurations();
    this.checkGamepads();
    this.gameLoop = requestAnimationFrame(this.updateGamepadState);
  }

  componentWillUnmount() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
  }

  loadSavedConfigurations = () => {
    const updatedConfigs = { ...this.state.configPreferences };

    js_globals.v_gamepad_configuration.forEach(config => {
      const savedConfig = js_localStorage.fn_getGamePadConfig(config);
      if (savedConfig) {
        updatedConfigs[config] = JSON.parse(savedConfig);
        // Ensure buttonsFunction exists in loaded config
        if (!updatedConfigs[config].buttonsFunction) {
          updatedConfigs[config].buttonsFunction = [];
        }
      }
    });

    this.setState({ configPreferences: updatedConfigs }, () => {
      this.checkGamepads();
    });
  };

  isItemExist = (array, required = [js_globals.STICK_MODE_RUD, js_globals.STICK_MODE_ELE, js_globals.STICK_MODE_ALE, js_globals.STICK_MODE_THR]) => {
    return required.every(val => array.includes(val));
  };

  onDataChanged = () => {
    const valid_axis = this.isItemExist(this.state.axisFunctions, [js_globals.STICK_MODE_RUD, js_globals.STICK_MODE_ELE, js_globals.STICK_MODE_ALE, js_globals.STICK_MODE_THR]);
    if (valid_axis) {
      this.txtSaveRef.current.className = css_to_save;
      this.m_invalid_settings = false;
    } else {
      this.txtSaveRef.current.className = css_normal;
      this.m_invalid_settings = true;
    }
  };

  saveConfiguration2 = () => {
    const { selectedConfig, configPreferences } = this.state;
    js_localStorage.fn_setGamePadConfig(selectedConfig, JSON.stringify(configPreferences[selectedConfig]));

    const currentClass = this.txtSaveRef.current.className;
    if (currentClass.includes('btn-danger')) {
      this.txtSaveRef.current.className = css_normal;
    } else {
      this.txtSaveRef.current.className = css_to_save;
    }
  };

  fn_importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const configs = JSON.parse(e.target.result);
        const configPrefix = js_globals.LS_GAME_PAD_CONFIG_PREFIX;

        for (let i = js_localStorage.length - 1; i >= 0; i--) {
          const key = js_localStorage.key(i);
          if (key.startsWith(configPrefix)) {
            js_localStorage.removeItem(key);
          }
        }

        Object.entries(configs).forEach(([index, value]) => {
          js_localStorage.fn_setGamePadConfig(index, value);
        });

        this.loadSavedConfigurations();
        this.checkGamepads();

        console.log('Game pad configurations imported successfully');
      } catch (error) {
        console.error('Error importing configurations:', error);
        alert('Failed to import configurations. Invalid JSON file.');
      }
    }.bind(this);

    reader.readAsText(file);
  };

  fn_triggerGamePadConfigImport() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', this.fn_importData);
    document.body.appendChild(fileInput);
    fileInput.click();

    fileInput.addEventListener('change', () => {
      document.body.removeChild(fileInput);
    });
  }

  fn_exportData = () => {
    js_localStorage.fn_exportGamePadConfigs();
  };

  checkGamepads = () => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const connectedGamepads = Array.from(gamepads).filter(gamepad => gamepad);
    if (connectedGamepads.length > 0) {
      const firstGamepad = connectedGamepads[0];
      const newAxisFunctions = new Array(firstGamepad.axes.length).fill('undefined');
      const newButtonFunctions = new Array(firstGamepad.buttons.length).fill('undefined');
      const { selectedConfig, configPreferences } = this.state;
      const currentConfig = configPreferences[selectedConfig].functionMappings;
      const axisReversed = configPreferences[selectedConfig].axisReversed || [];

      Object.entries(currentConfig).forEach(([functionName, mapping]) => {
        const isAxisFunction = js_globals.v_gamepad_function_array.includes(functionName);
        const isButtonFunction = js_globals.v_gamepad_button_function_array.includes(functionName);
        if (isAxisFunction && mapping.type === 'axis') {
          newAxisFunctions[mapping.index] = functionName;
        } else if (isButtonFunction && mapping.type === 'button') {
          newButtonFunctions[mapping.index] = functionName;
        }
      });

      configPreferences[selectedConfig].buttonsFunction = newButtonFunctions;

      const transformedAxes = firstGamepad.axes.map((value, i) => 
        (value * (axisReversed[i] !== undefined ? axisReversed[i] : 1)).toFixed(4)
      );

      const newState = {
        gamepads: connectedGamepads,
        axes: transformedAxes,
        buttons: firstGamepad.buttons.map(button => button.value.toFixed(2)),
        axisFunctions: newAxisFunctions,
      };

      firstGamepad.axes.forEach((value, i) => {
        const prevValue = this.state.axes[i];
        const transformedValue = (value * (axisReversed[i] !== undefined ? axisReversed[i] : 1)).toFixed(4);
        if (prevValue !== transformedValue) {
          this.setState({ [`axisLastUpdate_${i}`]: new Date().getTime() });
        }
      });
      firstGamepad.buttons.forEach((button, i) => {
        const prevValue = this.state.buttons[i];
        if (prevValue !== button.value.toFixed(2)) {
          this.setState({ [`buttonLastUpdate_${i}`]: new Date().getTime() });
        }
      });

      this.setState(newState);
    } else {
      this.setState({ gamepads: [], axes: [], buttons: [], axisFunctions: [] });
    }
  };

  updateGamepadState = () => {
    this.checkGamepads();
    this.gameLoop = requestAnimationFrame(this.updateGamepadState);
  };

  handleConfigChange = (event) => {
    const newConfig = event.target.value;
    this.setState({ selectedConfig: newConfig }, () => {
      this.checkGamepads();
    });
  };

  handleReset = () => {
    const { selectedConfig } = this.state;
    this.setState(prevState => ({
      configPreferences: {
        ...prevState.configPreferences,
        [selectedConfig]: { functionMappings: {}, axisReversed: [], buttonsFunction: [], mode: 1 },
      },
      axisFunctions: prevState.axisFunctions.map(() => 'undefined'),
    }), () => {
      js_localStorage._removeValue(`${js_globals.LS_GAME_PAD_CONFIG_PREFIX}${selectedConfig}`);
      this.checkGamepads();
    });
  };

  toggleAxisReverse = (axisIndex) => {
    this.setState(prevState => {
      const newConfigPreferences = { ...prevState.configPreferences };
      const currentConfig = { ...newConfigPreferences[prevState.selectedConfig] };
      const axisReversed = [...(currentConfig.axisReversed || [])];
      
      axisReversed[axisIndex] = axisReversed[axisIndex] === -1 ? 1 : -1;
      const maxAxisIndex = prevState.gamepads[0]?.axes.length || axisReversed.length;
      for (let i = 0; i < maxAxisIndex; i++) {
        if (axisReversed[i] === null || axisReversed[i] === undefined) {
          axisReversed[i] = 1;
        }
      }
      currentConfig.axisReversed = axisReversed;
      newConfigPreferences[prevState.selectedConfig] = currentConfig;

      return { configPreferences: newConfigPreferences };
    }, () => {
      this.onDataChanged();
      this.checkGamepads();
      console.log(`Toggled reverse for axis ${axisIndex} to ${this.state.configPreferences[this.state.selectedConfig].axisReversed[axisIndex]} in ${this.state.selectedConfig}`);
    });
  };

  fn_assignFunctionToAxis = (axisIndex, functionName) => {
    const functionIndex = js_globals.v_gamepad_function_array.indexOf(functionName);
    if (functionIndex === -1 && functionName !== 'undefined') return;

    this.setState(prevState => {
      const newAxisFunctions = [...prevState.axisFunctions];
      newAxisFunctions[axisIndex] = functionName;
      const newConfigPreferences = { ...prevState.configPreferences };
      const currentMappings = { ...newConfigPreferences[prevState.selectedConfig].functionMappings };

      Object.keys(currentMappings).forEach(key => {
        if (key === functionName) {
          delete currentMappings[key];
        }
      });

      Object.keys(currentMappings).forEach(key => {
        if (currentMappings[key].type === 'axis' && currentMappings[key].index === axisIndex) {
          delete currentMappings[key];
        }
      });

      if (functionName !== 'undefined') {
        currentMappings[functionName] = { type: 'axis', index: axisIndex };
      }

      newConfigPreferences[prevState.selectedConfig].functionMappings = currentMappings;

      return { axisFunctions: newAxisFunctions, configPreferences: newConfigPreferences };
    }, () => {
      this.onDataChanged();
      console.log(`Assigning function ${functionName} to axis ${axisIndex} in ${this.state.selectedConfig}`);
    });
  };

  fn_assignFunctionToButton = (buttonIndex, functionName) => {
    const functionIndex = js_globals.v_gamepad_button_function_array.indexOf(functionName);
    if (functionIndex === -1 && functionName !== 'undefined') return;

    this.setState(prevState => {
      const newConfigPreferences = { ...prevState.configPreferences };
      const currentConfig = { ...newConfigPreferences[prevState.selectedConfig] };
      const newButtonFunctions = [...(currentConfig.buttonsFunction || [])];
      newButtonFunctions[buttonIndex] = functionName;
      const currentMappings = { ...currentConfig.functionMappings };

      Object.keys(currentMappings).forEach(key => {
        if (key === functionName) {
          delete currentMappings[key];
        }
      });

      Object.keys(currentMappings).forEach(key => {
        if (currentMappings[key].type === 'button' && currentMappings[key].index === buttonIndex) {
          delete currentMappings[key];
        }
      });

      if (functionName !== 'undefined') {
        currentMappings[functionName] = { type: 'button', index: buttonIndex };
      }

      currentConfig.functionMappings = currentMappings;
      currentConfig.buttonsFunction = newButtonFunctions;
      newConfigPreferences[prevState.selectedConfig] = currentConfig;

      return { configPreferences: newConfigPreferences };
    }, () => {
      this.onDataChanged();
      console.log(`Assigning function ${functionName} to button ${buttonIndex} in ${this.state.selectedConfig}`);
    });
  };

  handleModeChange = (p_mode) => {
    if (this.m_flag_mounted === false)return;
    if (isNaN(p_mode)) return;

    this.setState(prevState => {
      const newConfigPreferences = { ...prevState.configPreferences };
      newConfigPreferences[prevState.selectedConfig] = {
        ...newConfigPreferences[prevState.selectedConfig],
        mode: p_mode
      };
      return {
        configPreferences: newConfigPreferences,
        m_update: prevState.m_update + 1
      };
    }, () => {
      this.onDataChanged();
      js_speak.fn_speak('Game pad mode is set to ' + p_mode.toString());
      console.log(`Game pad mode set to ${p_mode} for config ${this.state.selectedConfig}`);
    });
  };

  formatNumberWithSign = (number, totalWidth, decimalPlaces) => {
    const formattedNumber = Math.abs(number).toFixed(decimalPlaces);
    const sign = number >= 0 ? '+' : '-';
    return (sign + formattedNumber).padStart(totalWidth, ' ');
  };

  render() {
    const { gamepads, axes, buttons, axisFunctions, selectedConfig, configPreferences } = this.state;
    const fadeDuration = 1000;
    const currentTime = new Date().getTime();
    const currentMode = configPreferences[selectedConfig].mode || 1;
    const buttonFunctions = configPreferences[selectedConfig].buttonsFunction || [];

    return (
      <div className="container">
        <h2 className='pt-5'>Gamepad Tester</h2>
        <div className="row mb-3">
          <div className="col-3" role="group" aria-label="Button group with nested dropdown">
            <label>Settings Template: </label>
            <select
              value={selectedConfig}
              onChange={this.handleConfigChange}
              className="ms-3 form-control-sm"
            >
              {js_globals.v_gamepad_configuration.map((config, idx) => (
                <option key={idx} value={config}>
                  {config}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <div className="btn-group" role="group">
              <button
                id="btnRXModeDrop"
                type="button"
                className="btn btn-sm btn-warning dropdown-toggle font-monospace"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Mode {currentMode}
              </button>
              <div className="dropdown-menu" aria-labelledby="btnRXModeDrop">
                <a className="dropdown-item" href="#" onClick={(e) => this.handleModeChange(1)}>Mode 1</a>
                <a className="dropdown-item" href="#" onClick={(e) => this.handleModeChange(2)}>Mode 2</a>
                <a className="dropdown-item" href="#" onClick={(e) => this.handleModeChange(3)}>Mode 3</a>
                <a className="dropdown-item" href="#" onClick={(e) => this.handleModeChange(4)}>Mode 4</a>
              </div>
            </div>
            <button
              onClick={this.handleReset}
              className="ms-3 p-1 px-2 btn btn-sm btn-danger ctrlbtn font-monospace"
            >
              Reset
            </button>
            <button
              onClick={this.saveConfiguration2}
              className="ms-3 p-1 px-2 btn btn-sm border-danger ctrlbtn font-monospace"
              ref={this.txtSaveRef}
            >
              Save
            </button>
            <button
              onClick={(e) => this.fn_triggerGamePadConfigImport(e)}
              className="ms-3 p-1 px-2 btn btn-sm btn-danger ctrlbtn font-monospace"
            >
              Import
            </button>
            <button
              onClick={(e) => this.fn_exportData()}
              className="ms-3 p-1 px-2 btn btn-sm btn-success ctrlbtn font-monospace"
            >
              Export
            </button>
            <button
              onClick={(e) => fn_helpPage(js_siteConfig.CONST_MANUAL_URL)}
              className="ms-3 p-1 px-2 btn btn-sm btn-primary ctrlbtn font-monospace"
            >
              Help
            </button>
          </div>
        </div>
        {gamepads.length > 0 ? (
          gamepads.map((gamepad, index) => (
            <div key={index} className="gamepad-section">
              <h3>{index + 1}: {gamepad.id} (Vendor: {gamepad.id.split(' ').pop().split(':')[0]} Product: {gamepad.id.split(' ').pop().split(':')[1]})</h3>
              <p>Connected: Yes | Mapping: {gamepad.mapping} | Timestamp: {gamepad.timestamp.toFixed(0)}</p>
              <div className="axes-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {axes.map((value, i) => {
                  const lastUpdate = this.state[`axisLastUpdate_${i}`] || 0;
                  const opacity = lastUpdate ? Math.max(0, 1 - (currentTime - lastUpdate) / fadeDuration) : 0;
                  const colorStyle = {
                    color: opacity > 0 ? `rgba(255, 0, 0, ${opacity})` : 'inherit',
                    transition: 'color 0.5s ease-out',
                  };
                  const isReversed = (configPreferences[selectedConfig].axisReversed?.[i] || 1) === -1;

                  return (
                    <div key={i} className="axis-row d-flex align-items-center mb-3">
                      <span className={`me-2 font-monospace`} style={{ color: colorStyle.color, transition: colorStyle.transition }}>
                        Axis {i}: {this.formatNumberWithSign(value, 8, 3)}
                      </span>
                      <select
                        value={axisFunctions[i] || 'undefined'}
                        onChange={(e) => this.fn_assignFunctionToAxis(i, e.target.value)}
                        className={`form-control ${axisFunctions[i] === 'undefined' ? '' : !this.m_invalid_settings ? 'bg-success' : 'bg-warning text-dark'}`}
                        style={{ marginRight: '10px', width: '150px' }}
                      >
                        {js_globals.v_gamepad_function_array.map((func, idx) => (
                          <option key={idx} value={func}>
                            {func}
                          </option>
                        ))}
                      </select>
                      <label style={{ marginRight: '10px', fontFamily: 'Courier New, monospace' }}>
                        <input
                          type="checkbox"
                          checked={isReversed}
                          onChange={() => this.toggleAxisReverse(i)}
                        />
                        Reverse
                      </label>
                    </div>
                  );
                })}
              </div>
              <hr />
              <div className="buttons-container d-flex flex-wrap gap-3">
                {buttons.map((value, i) => {
                  const lastUpdate = this.state[`buttonLastUpdate_${i}`] || 0;
                  const opacity = lastUpdate ? Math.max(0, 1 - (currentTime - lastUpdate) / fadeDuration) : 0;
                  const colorStyle = {
                    color: opacity > 0 ? `rgba(0, 255, 0, ${opacity})` : 'inherit',
                    transition: 'color 0.5s ease-out',
                  };

                  return (
                    <div key={i} className="button-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ ...colorStyle, marginRight: '10px' }}>Button {i} : {value}</span>
                      <select
                        value={buttonFunctions[i] || 'undefined'}
                        onChange={(e) => this.fn_assignFunctionToButton(i, e.target.value)}
                        className={`form-control ${buttonFunctions[i] === 'undefined' ? '' : 'bg-success text-dark'}`}
                        style={{ marginRight: '10px' }}
                      >
                        {js_globals.v_gamepad_button_function_array.map((func, idx) => (
                          <option key={idx} value={func}>
                            {func}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p>No gamepads detected</p>
        )}
        <div className="image-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <img
            src={`/images/mode${currentMode}.png`}
            alt={`Mode ${currentMode}`}
            className='rounded-5 img-fluid max-height-300'
          />
        </div>
      </div>
    );
  }
}