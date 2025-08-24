import React from 'react';
import * as js_helpers from '../js/js_helpers';
import { js_globals } from '../js/js_globals';
import { js_eventEmitter } from '../js/js_eventEmitter';
import { js_localStorage } from '../js/js_localStorage';

export default class ClssGamepadTester extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gamepads: [],
      axes: [],
      buttons: [],
      axisFunctions: [],
      buttonFunctions: [],
      selectedConfig: '1',
      configPreferences: {
        "1": { functionMappings: {} },
        "2": { functionMappings: {} },
        "3": { functionMappings: {} },
        "4": { functionMappings: {} },
        "5": { functionMappings: {} },
      },
    };
  }

  componentDidMount() {
    window.addEventListener('gamepadconnected', this.handleGamepadConnect);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnect);
    this.loadSavedConfigurations();
    this.checkGamepads();
    this.gameLoop = requestAnimationFrame(this.updateGamepadState);
  }

  componentWillUnmount() {
    window.removeEventListener('gamepadconnected', this.handleGamepadConnect);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnect);
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
      }
    });

    this.setState({ configPreferences: updatedConfigs }, () => {
      this.checkGamepads();
    });
  };

  saveConfiguration = () => {
    const { selectedConfig, configPreferences } = this.state;
    js_localStorage.fn_setGamePadConfig(selectedConfig, JSON.stringify(configPreferences[selectedConfig]));
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

      // Map saved function indices to axes/buttons
      Object.entries(currentConfig).forEach(([functionName, mapping]) => {
        const funcIndex = js_globals.v_gamepad_function_array.indexOf(functionName);
        if (funcIndex !== -1) {
          if (mapping.type === 'axis') {
            newAxisFunctions[mapping.index] = functionName;
          } else if (mapping.type === 'button') {
            newButtonFunctions[mapping.index] = functionName;
          }
        }
      });

      const newState = {
        gamepads: connectedGamepads,
        axes: firstGamepad.axes.map(value => value.toFixed(4)),
        buttons: firstGamepad.buttons.map(button => button.value.toFixed(2)),
        axisFunctions: newAxisFunctions,
        buttonFunctions: newButtonFunctions,
      };

      // Check for changes and update last update times
      firstGamepad.axes.forEach((value, i) => {
        const prevValue = this.state.axes[i];
        if (prevValue !== value.toFixed(4)) {
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
      this.setState({ gamepads: [], axes: [], buttons: [], axisFunctions: [], buttonFunctions: [] });
    }
  };

  updateGamepadState = () => {
    this.checkGamepads();
    this.gameLoop = requestAnimationFrame(this.updateGamepadState);
  };

  handleConfigChange = (event) => {
    const newConfig = event.target.value;
    this.setState({ selectedConfig: newConfig }, () => {
 inscrutable:
      this.checkGamepads();
    });
  };

  handleReset = () => {
    const { selectedConfig } = this.state;
    this.setState(prevState => ({
      configPreferences: {
        ...prevState.configPreferences,
        [selectedConfig]: { functionMappings: {} },
      },
      axisFunctions: prevState.axisFunctions.map(() => 'undefined'),
      buttonFunctions: prevState.buttonFunctions.map(() => 'undefined'),
    }), () => {
      js_localStorage._removeValue(`${js_globals.LS_GAME_PAD_CONFIG_PREFIX}${selectedConfig}`);
      this.checkGamepads();
    });
  };

  fn_assignFunctionToAxis = (axisIndex, functionName) => {
    const functionIndex = js_globals.v_gamepad_function_array.indexOf(functionName);
    if (functionIndex === -1) return;

    this.setState(prevState => {
      const newAxisFunctions = [...prevState.axisFunctions];
      const prevFunction = prevState.axisFunctions[axisIndex];
      newAxisFunctions[axisIndex] = functionName;
      const newConfigPreferences = { ...prevState.configPreferences };
      const currentMappings = { ...newConfigPreferences[prevState.selectedConfig].functionMappings };

      // Remove any existing mapping for this function
      Object.keys(currentMappings).forEach(key => {
        if (key === functionName) {
          delete currentMappings[key];
        }
      });

      // Remove any existing mapping for this axis
      Object.keys(currentMappings).forEach(key => {
        if (currentMappings[key].type === 'axis' && currentMappings[key].index === axisIndex) {
          delete currentMappings[key];
        }
      });

      // Add new mapping if not undefined
      if (functionName !== 'undefined') {
        currentMappings[functionName] = { type: 'axis', index: axisIndex };
      }

      newConfigPreferences[prevState.selectedConfig].functionMappings = currentMappings;

      return { axisFunctions: newAxisFunctions, configPreferences: newConfigPreferences };
    }, () => {
      this.saveConfiguration();
      console.log(`Assigning function ${functionName} to axis ${axisIndex} in ${this.state.selectedConfig}`);
    });
  };

  fn_assignFunctionToButton = (buttonIndex, functionName) => {
    const functionIndex = js_globals.v_gamepad_function_array.indexOf(functionName);
    if (functionIndex === -1) return;

    this.setState(prevState => {
      const newButtonFunctions = [...prevState.buttonFunctions];
      const prevFunction = prevState.buttonFunctions[buttonIndex];
      newButtonFunctions[buttonIndex] = functionName;
      const newConfigPreferences = { ...prevState.configPreferences };
      const currentMappings = { ...newConfigPreferences[prevState.selectedConfig].functionMappings };

      // Remove any existing mapping for this function
      Object.keys(currentMappings).forEach(key => {
        if (key === functionName) {
          delete currentMappings[key];
        }
      });

      // Remove any existing mapping for this button
      Object.keys(currentMappings).forEach(key => {
        if (currentMappings[key].type === 'button' && currentMappings[key].index === buttonIndex) {
          delete currentMappings[key];
        }
      });

      // Add new mapping if not undefined
      if (functionName !== 'undefined') {
        currentMappings[functionName] = { type: 'button', index: buttonIndex };
      }

      newConfigPreferences[prevState.selectedConfig].functionMappings = currentMappings;

      return { buttonFunctions: newButtonFunctions, configPreferences: newConfigPreferences };
    }, () => {
      this.saveConfiguration();
      console.log(`Assigning function ${functionName} to button ${buttonIndex} in ${this.state.selectedConfig}`);
    });
  };

  render() {
    const { gamepads, axes, buttons, axisFunctions, buttonFunctions, selectedConfig } = this.state;
    const fadeDuration = 1000;
    const currentTime = new Date().getTime();
    
    return (
      <div className="container">
        <h2>Gamepad Tester</h2>
        <div>
          <div style={{ marginBottom: '10px' }}>
            <label>Select Configuration: </label>
            <select
              value={selectedConfig}
              onChange={this.handleConfigChange}
              className="function-select"
              style={{ marginLeft: '10px' }}
            >
              {js_globals.v_gamepad_configuration.map((config, idx) => (
                <option key={idx} value={config}>
                  {config}
                </option>
              ))}
            </select>
            <button
              onClick={this.handleReset}
              style={{ marginLeft: '10px', padding: '5px 10px' }}
            >
              Reset
            </button>
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

                    return (
                      <div key={i} className="axis-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ ...colorStyle, marginRight: '10px' }}>Axis {i}: {value}</span>
                        <select
                          value={axisFunctions[i] || 'undefined'}
                          onChange={(e) => this.fn_assignFunctionToAxis(i, e.target.value)}
                          className={`form-control ${axisFunctions[i] === 'undefined' ? '' : 'bg-warning text-dark'}`}
                          style={{ marginRight: '10px', width: '150px' }}
                        >
                          {js_globals.v_gamepad_function_array.map((func, idx) => (
                            <option key={idx} value={func}>
                              {func}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                <hr />
                <div className="buttons-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {buttons.map((value, i) => {
                    const lastUpdate = this.state[`buttonLastUpdate_${i}`] || 0;
                    const opacity = lastUpdate ? Math.max(0, 1 - (currentTime - lastUpdate) / fadeDuration) : 0;
                    const colorStyle = {
                      color: opacity > 0 ? `rgba(0, 255, 0, ${opacity})` : 'inherit',
                      transition: 'color 0.5s ease-out',
                    };

                    return (
                      <div key={i} className="button-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ ...colorStyle, marginRight: '10px' }}>Button {i}: {value}</span>
                        <select
                          value={buttonFunctions[i] || 'undefined'}
                          onChange={(e) => this.fn_assignFunctionToButton(i, e.target.value)}
                          className={`form-control ${buttonFunctions[i] === 'undefined' ? '' : 'bg-warning text-dark'}`}
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
        </div>
      </div>
    );
  }
}