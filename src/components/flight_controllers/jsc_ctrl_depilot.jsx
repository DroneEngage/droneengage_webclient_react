import React    from 'react';
import {js_globals} from '../../js/js_globals';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter'
import * as js_andruavMessages from '../../js/protocol/js_andruavMessages'

export class ClssCtrlDEPilot extends React.Component {
    constructor(props)
	{
		super (props);
		const p_andruavUnit = this.props.v_andruavUnit;
		
		this.state = {
			m_dePilotEnabled: p_andruavUnit.m_de_pilot_enabled || false,
			m_dePilotOperation: p_andruavUnit.m_de_pilot_operation || 0,
			m_dePilotPending: false
		};
		
		// Subscribe to DroneEngage Pilot changes
		js_eventEmitter.fn_subscribe(js_event.EE_onDroneEngagePilotChanged, this, this.fn_handleDroneEngagePilotChanged);
    }

    componentDidMount() {
        // No need to subscribe here since it's done in constructor
    }

    componentWillUnmount() {
        // Unsubscribe from DroneEngage Pilot changes
        js_eventEmitter.fn_unsubscribe(js_event.EE_onDroneEngagePilotChanged, this);
    }

    fn_handleDroneEngagePilotChanged(me, p_unit) {
        // Only update if this event is for the current unit
       	if (p_unit && p_unit.getPartyID() === me.props.v_andruavUnit.getPartyID()) {
            me.setState({
                m_dePilotEnabled: p_unit.m_de_pilot_enabled,
                m_dePilotOperation: p_unit.m_de_pilot_operation,
                m_dePilotPending: false  // Clear pending state when we receive confirmation
            });
        }
    }

    fn_switchDEPilotMode(v_andruavUnit, p_de_mode) {
        // Call the DEPILOT mode control API
        js_globals.v_andruavFacade.API_engageDEPilotControl(v_andruavUnit, null, p_de_mode);
    }

    fn_ToggleDEPilot(v_andruavUnit) {
        const newEnabledState = !this.state.m_dePilotEnabled;
        this.setState({ 
            m_dePilotEnabled: newEnabledState,
            m_dePilotPending: true  // Set pending state when user toggles
        });
        
        // Call the DEPILOT control API
        js_globals.v_andruavFacade.API_engageDEPilotControl(v_andruavUnit, newEnabledState, null);
    }

    hlp_adjustFlightModeButtonClass (p_className, p_isActive)
    {
        if (p_className === null || p_className === undefined) return p_className;
        if (typeof p_className !== 'string') return p_className;

        if (p_className.includes('disabled') || p_className.includes('hidden')) return p_className;

        if (p_isActive === true)
        {
            return "btn-danger";
        }
        else
        {
            return p_className;
        }
    }

    hlp_getDEPilotButtonStyles () {
        let res = {};
        
        // Default classes for all buttons
        res.btn_depilot_disabled_class = "btn-outline-theme-aware";
        res.btn_depilot_altitude_class = "btn-outline-theme-aware";
        res.btn_depilot_stabilization_class = "btn-outline-theme-aware";
        res.btn_depilot_tracking_class = "btn-outline-theme-aware";

        // Apply active highlighting based on current operation
        res.btn_depilot_disabled_class = this.hlp_adjustFlightModeButtonClass(
            res.btn_depilot_disabled_class, 
            this.state.m_dePilotOperation === js_andruavMessages.CONST_DEPILOT_OP_DISABLED
        );
        res.btn_depilot_altitude_class = this.hlp_adjustFlightModeButtonClass(
            res.btn_depilot_altitude_class, 
            this.state.m_dePilotOperation === js_andruavMessages.CONST_DEPILOT_OP_CHANGE_ALTITUDE
        );
        res.btn_depilot_stabilization_class = this.hlp_adjustFlightModeButtonClass(
            res.btn_depilot_stabilization_class, 
            this.state.m_dePilotOperation === js_andruavMessages.CONST_DEPILOT_OP_STABILIZATION
        );
        res.btn_depilot_tracking_class = this.hlp_adjustFlightModeButtonClass(
            res.btn_depilot_tracking_class, 
            this.state.m_dePilotOperation === js_andruavMessages.CONST_DEPILOT_OP_TRACKING
        );

        return res;
    }

    render() {
        const { v_andruavUnit, id } = this.props;
        const buttonStyles = this.hlp_getDEPilotButtonStyles();
        
        return (
            <div>
                <div key={id+"depilot"} id={id+"depilot"} className='col-12 al_l ctrldiv'>
                    <div className='btn-group w-100 d-flex flex-wrap'>
                        <div className='form-check form-switch me-3'>
                            <input 
                                className='form-check-input'
                                style={this.state.m_dePilotPending ? 
                                    {backgroundColor: 'var(--bs-warning)', borderColor: 'var(--bs-warning)'} : 
                                    (!v_andruavUnit.m_is_ready_to_arm ? 
                                        {backgroundColor: 'white', borderColor: 'white'} : {})}
                                type='checkbox' 
                                id={'depilot_switch_' + id} 
                                checked={v_andruavUnit.m_is_ready_to_arm ? this.state.m_dePilotEnabled : false}
                                disabled={!v_andruavUnit.m_is_ready_to_arm}
                                onChange={() => this.fn_ToggleDEPilot(v_andruavUnit)} 
                            />
                            <label className='form-check-label' htmlFor={'depilot_switch_' + id}>
                                DE-PILOT
                            </label>
                        </div>
                    </div>
                </div>
                
                <div key={id+"depilot_modes"} id={id+"depilot_modes"} className='col-12 al_l ctrldiv'>
                    <div className='btn-group w-100 d-flex flex-wrap'>
                        <button 
                            id='btn_depilot_disabled' 
                            type='button' 
                            className={'btn btn-sm flgtctrlbtn btn-with-icon-margin me-1 ' + buttonStyles.btn_depilot_disabled_class}
                            title='Disabled' 
                            onClick={() => this.fn_switchDEPilotMode(v_andruavUnit, js_andruavMessages.CONST_DEPILOT_OP_DISABLED)}
                            disabled={!this.state.m_dePilotEnabled}
                        >Disabled</button>
                        <button 
                            id='btn_depilot_altitude' 
                            type='button' 
                            className={'btn btn-sm flgtctrlbtn btn-with-icon-margin hidden me-1 ' + buttonStyles.btn_depilot_altitude_class}
                            title='Change Altitude' 
                            onClick={() => this.fn_switchDEPilotMode(v_andruavUnit, js_andruavMessages.CONST_DEPILOT_OP_CHANGE_ALTITUDE)}
                            disabled={!this.state.m_dePilotEnabled}
                        >Altitude</button>
                        <button 
                            id='btn_depilot_stabilization' 
                            type='button' 
                            className={'btn btn-sm flgtctrlbtn btn-with-icon-margin me-1 ' + buttonStyles.btn_depilot_stabilization_class}
                            title='Stabilization' 
                            onClick={() => this.fn_switchDEPilotMode(v_andruavUnit, js_andruavMessages.CONST_DEPILOT_OP_STABILIZATION)}
                            disabled={!this.state.m_dePilotEnabled}
                        >Stabilization</button>
                        <button 
                            id='btn_depilot_tracking' 
                            type='button' 
                            className={'btn btn-sm flgtctrlbtn btn-with-icon-margin ' + buttonStyles.btn_depilot_tracking_class}
                            title='Tracking' 
                            onClick={() => this.fn_switchDEPilotMode(v_andruavUnit, js_andruavMessages.CONST_DEPILOT_OP_TRACKING)}
                            disabled={!this.state.m_dePilotEnabled}
                        >Tracking</button>
                    </div>
                </div>
            </div>
        );
    }
}
