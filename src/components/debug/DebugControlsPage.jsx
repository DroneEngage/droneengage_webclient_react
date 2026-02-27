import React, { useState } from 'react';
import { CFieldChecked } from '../micro_gadgets/jsc_mctrl_field_check';
import { ClssFireEvent } from '../micro_gadgets/jsc_mctrl_fire_event';
import { Class_Radar_Screen } from '../micro_gadgets/jsc_mctrl_radar_screen';
import { CTriStateChecked } from '../micro_gadgets/jsc_mctrl_tri_state_check';
import { Class_2D_Joystick } from '../micro_gadgets/jsc_mctrl_2d_joystick';
import { CONST_DEBUG_CONTROL_PAGE } from '../../js/js_siteConfig';

const DebugControlsPage = () => {
    const [fieldCheckValue, setFieldCheckValue] = useState('');
    const [fieldCheckboxChecked, setFieldCheckboxChecked] = useState(true);
    
    const [triStateDisabled, setTriStateDisabled] = useState(false);
    const [triStateChecked, setTriStateChecked] = useState(false);
    
    const [radarRotation, setRadarRotation] = useState(0);
    const [radarRotationSteps, setRadarRotationSteps] = useState(0);
    const [highlightedPoints, setHighlightedPoints] = useState([
        [3, 2, '#ff0000'], 
        [5, 4, '#00ff00'],
        [1, 3, '#0000ff']
    ]);

    // 2D Joystick state
    const [joystickValues, setJoystickValues] = useState({ x: 0, y: 0 });
    const [joystickEvents, setJoystickEvents] = useState([]);
    const [joystickResetKey, setJoystickResetKey] = useState(0);

    const handleFieldCheck = (checkboxChecked) => {
        setFieldCheckboxChecked(checkboxChecked);
        console.log('Field checkbox checked:', checkboxChecked);
    };

    const handleFieldChange = (value) => {
        setFieldCheckValue(value);
        console.log('Field value:', value);
    };

    const handleTriStateChange = (disabled, checked) => {
        setTriStateDisabled(disabled);
        setTriStateChecked(checked);
        console.log('Tri-state - Disabled:', disabled, 'Checked:', checked);
    };

    const handleFireEvent = (value) => {
        console.log('Fire event value:', value);
        alert(`Event fired with value: ${value}`);
    };

    const handleRadarRotationChange = () => {
        setRadarRotation(prev => prev + 0.1);
    };

    const handleRadarStepsChange = () => {
        setRadarRotationSteps(prev => (prev + 1) % 8);
    };

    const handleRandomHighlight = () => {
        const newPoints = [];
        for (let i = 0; i < 3; i++) {
            const section = Math.floor(Math.random() * 8) + 1;
            const depth = Math.floor(Math.random() * 5) + 1;
            const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;
            newPoints.push([section, depth, color]);
        }
        setHighlightedPoints(newPoints);
    };

    // 2D Joystick event handlers
    const addJoystickEvent = (eventType, x, y) => {
        const timestamp = new Date().toLocaleTimeString();
        const newEvent = `[${timestamp}] ${eventType}: X=${Math.round(x)}, Y=${Math.round(y)}`;
        setJoystickEvents(prev => [...prev.slice(-4), newEvent]); // Keep last 5 events
        console.log(newEvent);
    };

    const handleJoystickClick = (x, y) => {
        addJoystickEvent('CLICK', x, y);
    };

    const handleJoystickDoubleClick = (x, y) => {
        addJoystickEvent('DOUBLE-CLICK', x, y);
    };

    const handleJoystickRightClick = (x, y) => {
        addJoystickEvent('RIGHT-CLICK', x, y);
    };

    const handleJoystickDrag = (x, y) => {
        setJoystickValues({ x, y });
        addJoystickEvent('DRAG', x, y);
    };

    const handleJoystickRelease = (x, y) => {
        addJoystickEvent('RELEASE', x, y);
    };

    const resetJoystick = () => {
        setJoystickValues({ x: 0, y: 0 });
        setJoystickEvents([]);
        setJoystickResetKey(prev => prev + 1); // Force re-render with new key
    };

    if (!CONST_DEBUG_CONTROL_PAGE) {
        return (
            <div className="container-fluid mt-4">
                <div className="alert alert-warning">
                    <h4>Debug Mode Disabled</h4>
                    <p>Set CONST_DEBUG_CONTROL_PAGE = true in js_siteConfig.js to enable this debug page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                <div className="col-12">
                    <h2 className="txt-theme-aware mb-4">Micro Gadgets Debug Page</h2>
                    <p className="text-muted">Test page for all micro gadget components</p>
                </div>
            </div>

            <div className="row">
                {/* Field Check Component */}
                <div className="col-md-6 mb-4">
                    <div className="card bg-secondary txt-theme-aware">
                        <div className="card-header">
                            <h5>CFieldChecked Component</h5>
                        </div>
                        <div className="card-body">
                            <CFieldChecked 
                                txtLabel="Test Field"
                                required={fieldCheckboxChecked}
                                txtValue={fieldCheckValue}
                                onChecked={handleFieldCheck}
                                onValueChange={handleFieldChange}
                            />
                            <div className="mt-3">
                                <small className="text-muted">
                                    Current State: Checkbox={fieldCheckboxChecked.toString()}, FieldEnabled={fieldCheckboxChecked.toString()}, Value="{fieldCheckValue}"
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tri State Component */}
                <div className="col-md-6 mb-4">
                    <div className="card bg-secondary txt-theme-aware">
                        <div className="card-header">
                            <h5>CTriStateChecked Component</h5>
                        </div>
                        <div className="card-body">
                            <CTriStateChecked 
                                txtLabel="Tri State Test"
                                disabled={triStateDisabled}
                                checked={triStateChecked}
                                onChange={handleTriStateChange}
                            />
                            <div className="mt-3">
                                <small className="text-muted">
                                    Current State: Disabled={triStateDisabled.toString()}, Checked={triStateChecked.toString()}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fire Event Component */}
                <div className="col-md-6 mb-4">
                    <div className="card bg-secondary txt-theme-aware">
                        <div className="card-header">
                            <h5>ClssFireEvent Component</h5>
                        </div>
                        <div className="card-body">
                            <ClssFireEvent 
                                label="Test Event"
                                onClick={handleFireEvent}
                            />
                            <div className="mt-3">
                                <small className="text-muted">
                                    Click "Fire" button to test event functionality
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Radar Screen Component */}
                <div className="col-md-6 mb-4">
                    <div className="card bg-secondary txt-theme-aware">
                        <div className="card-header">
                            <h5>Class_Radar_Screen Component</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-center mb-3">
                                <div style={{ width: '300px' }}>
                                    <Class_Radar_Screen 
                                        sections={8}
                                        depth={5}
                                        rotation={radarRotation}
                                        rotation_steps={radarRotationSteps}
                                        highlighted_points={highlightedPoints}
                                        draw_pointer={true}
                                    />
                                </div>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                                <button className="btn btn-sm btn-primary" onClick={handleRadarRotationChange}>
                                    Rotate Radar
                                </button>
                                <button className="btn btn-sm btn-info" onClick={handleRadarStepsChange}>
                                    Change Steps ({radarRotationSteps})
                                </button>
                                <button className="btn btn-sm btn-warning" onClick={handleRandomHighlight}>
                                    Random Highlight
                                </button>
                            </div>
                            <div className="mt-3">
                                <small className="text-muted">
                                    Rotation: {radarRotation.toFixed(2)}, Steps: {radarRotationSteps}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2D Joystick Component */}
                <div className="col-md-6 mb-4">
                    <div className="card bg-secondary txt-theme-aware">
                        <div className="card-header">
                            <h5>Class_2D_Joystick Component</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-center mb-3">
                                <Class_2D_Joystick
                                    key={joystickResetKey} // Force re-render when reset
                                    width={250}
                                    height={250}
                                    minValue={-500}
                                    maxValue={500}
                                    circleRadius={20}
                                    initialX={joystickValues.x}
                                    initialY={joystickValues.y}
                                    onClick={handleJoystickClick}
                                    onDoubleClick={handleJoystickDoubleClick}
                                    onRightClick={handleJoystickRightClick}
                                    onDrag={handleJoystickDrag}
                                    onRelease={handleJoystickRelease}
                                />
                            </div>
                            <div className="d-flex gap-2 flex-wrap mb-3">
                                <button className="btn btn-sm btn-warning" onClick={resetJoystick}>
                                    Reset Joystick
                                </button>
                            </div>
                            <div className="mb-3">
                                <strong>Current Values:</strong> X={Math.round(joystickValues.x)}, Y={Math.round(joystickValues.y)}
                            </div>
                            <div className="mb-3">
                                <strong>Event Log:</strong>
                                <div className="bg-dark text-light p-2 rounded" style={{ fontSize: '12px', fontFamily: 'monospace', maxHeight: '120px', overflowY: 'auto' }}>
                                    {joystickEvents.length > 0 ? (
                                        joystickEvents.map((event, index) => (
                                            <div key={index} className="mb-1">{event}</div>
                                        ))
                                    ) : (
                                        <div className="text-muted">No events yet. Double-click to activate control mode, then drag the circle.</div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3">
                                <small className="text-muted">
                                    <strong>Instructions:</strong><br/>
                                    • Double-click to toggle control mode<br/>
                                    • Click on circle to drag when in control mode<br/>
                                    • Right-click for context menu<br/>
                                    • Circle position persists across mode changes
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Component Status */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card bg-dark txt-theme-aware">
                        <div className="card-header">
                            <h5>Component Status</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-3">
                                    <strong>CFieldChecked:</strong> 
                                    <span className="text-success"> Active</span>
                                </div>
                                <div className="col-md-3">
                                    <strong>CTriStateChecked:</strong> 
                                    <span className="text-success"> Active</span>
                                </div>
                                <div className="col-md-3">
                                    <strong>ClssFireEvent:</strong> 
                                    <span className="text-success"> Active</span>
                                </div>
                                <div className="col-md-3">
                                    <strong>Class_Radar_Screen:</strong> 
                                    <span className="text-success"> Active</span>
                                </div>
                            </div>
                            <div className="row mt-2">
                                <div className="col-md-3">
                                    <strong>Class_2D_Joystick:</strong> 
                                    <span className="text-success"> Active</span>
                                </div>
                                <div className="col-md-9">
                                    <strong>Test Instructions:</strong> 
                                    <span className="text-info"> Navigate to /debug to test all components</span>
                                </div>
                            </div>
                            <div className="mt-3">
                                <small className="text-muted">
                                    Check browser console for component event logs.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebugControlsPage;
