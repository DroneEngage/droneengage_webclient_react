import $ from 'jquery'; 
import * as js_preferences from '../../js/state/preferences.js';
import React    from 'react';


import { STICK_MODE_MAPPING, STICK_MODE_MAPPING_NAMES } from '../../js/config/gamepadMap.js';
import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import {js_localStorage} from '../../js/state/js_localStorage.js'
import {js_eventEmitter} from '../../js/events/js_eventEmitter.js'
import * as js_common from '../../js/helpers/js_common.js'

import {js_andruav_gamepad} from '../../js/gamepad/js_andruav_gamepad.js'

import {fn_gotoUnit_byPartyID} from '../../js/js_main.js'

import { ClssGamePadAxisControl } from './jsc_gamepad_axis.jsx';
import { ClssGamePadButton } from './jsc_gamepad_button.jsx';
import {ClssSingleAxisProgressControl} from './jsc_gamepad_single_axis.jsx';
import {EventBridge} from '../../js/hooks/EventBridge.jsx'


class ClssGamePadAxesControl extends React.Component {

    constructor(props)
	{
		super (props);

        this.state = {
            m_update: 0
        };

        this.key = Math.random().toString();
        this.m_flag_mounted = false;

        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
    }
    
    componentDidMount () {
        this.m_flag_mounted = true;
    }

    fn_gamePadAxesUpdated(p_obj)
    {
        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    
    componentWillUnmount ()
    {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
    }

    render()
    {
        const c_padStatus = js_andruav_gamepad.fn_getGamePad(this.props.p_index);
        if (!c_padStatus)
        {
            return (
            <div className='gp_axes'>
                <EventBridge eventName={js_event.EE_GamePad_Axes_Updated} onEvent={(p_obj) => this.fn_gamePadAxesUpdated(p_obj)} />
                <p className="text-danger">No Input</p>
            </div>

            );
        }

        const other_channel_routing = c_padStatus.p_other_channel_routing;
        const c_mode = c_padStatus.p_gamepad_mode_index;
        const v_axis = [STICK_MODE_MAPPING[c_mode].RUD,
                        STICK_MODE_MAPPING[c_mode].THR,
                        STICK_MODE_MAPPING[c_mode].ALE,
                        STICK_MODE_MAPPING[c_mode].ELE];  // Stick Left Horiz, Stick Left Vert, Stick Right Horiz, Stick Right Vert
        const labels = STICK_MODE_MAPPING_NAMES[c_mode]
        const c_unified_virtual_axis = c_padStatus.p_unified_virtual_axis;

        const me = this;
        const axis_ctrl = [];
        other_channel_routing.forEach(({key, index, val}) => {
            axis_ctrl.push(
                <ClssSingleAxisProgressControl 
                    id={key} key={key + me.key} label={key} value={val} p_axis='vertical' color={"#FF4444"} min={-1.0} max={1.0}/>
            )
        });
        
        return (
            <div className='gp_axes'>
                <EventBridge eventName={js_event.EE_GamePad_Axes_Updated} onEvent={(p_obj) => this.fn_gamePadAxesUpdated(p_obj)} />
                <ClssGamePadAxisControl id='axes1' key={'axes1' + this.key} x={c_unified_virtual_axis[v_axis[0]]} y={c_unified_virtual_axis[v_axis[1]]} x_label={labels[0]} y_label={labels[1]}></ClssGamePadAxisControl>
                <ClssGamePadAxisControl id='axes2' key={'axes2' + this.key} x={c_unified_virtual_axis[v_axis[2]]} y={c_unified_virtual_axis[v_axis[3]]} x_label={labels[2]} y_label={labels[3]}></ClssGamePadAxisControl>
                {axis_ctrl}
                
            </div>
                
        );
    }
}

class ClssGamePadButtonControl extends React.Component {
    
    
    constructor()
	{
		super ();
        
        this.state =
        {
            'm_update': 0
        };

        this.m_flag_mounted = false;

        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
    }
    
    componentDidMount() {
        this.m_flag_mounted = true;
    }

    fn_gamePadButtonUpdated(p_obj)
    {
        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    
    componentWillUnmount ()
    {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
    }


    render()
    {
        const c_padStatus = js_andruav_gamepad.fn_getGamePad(this.props.p_index);
        const button_routing = c_padStatus.p_button_routing;

        if (c_padStatus== null)
        {
            return (<div className='gp_buttons'><EventBridge eventName={js_event.EE_GamePad_Button_Updated} onEvent={(p_obj) => this.fn_gamePadButtonUpdated(p_obj)} /></div>);

        }

        return (
            <div className='gp_buttons bg-dark opacity-75'>
                <EventBridge eventName={js_event.EE_GamePad_Button_Updated} onEvent={(p_obj) => this.fn_gamePadButtonUpdated(p_obj)} />
                <ClssGamePadButton id='btn0'  btn={c_padStatus.p_buttons[0]}  t='A' function={button_routing[0]}     color_active={"#FF4444"}        color_inactive='none' p_pressed={c_padStatus.p_buttons[0].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn1'  btn={c_padStatus.p_buttons[1]}  t='R' function={button_routing[1]}     color_active={"#375a7f"}        color_inactive='none' p_pressed={c_padStatus.p_buttons[1].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn2'  btn={c_padStatus.p_buttons[2]}  t='L' function={button_routing[2]}     color_active='yellow'             color_inactive='none' p_pressed={c_padStatus.p_buttons[2].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn3'  btn={c_padStatus.p_buttons[3]}  t='X' function={button_routing[3]}     color_active={"#375a7f"}        color_inactive='none' p_pressed={c_padStatus.p_buttons[3].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn4'  btn={c_padStatus.p_buttons[4]}  t='Y' function={button_routing[4]}     color_active='yellow'             color_inactive='none' p_pressed={c_padStatus.p_buttons[4].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn5'  btn={c_padStatus.p_buttons[5]}  t='R' function={button_routing[5]}     color_active='white'              color_inactive='none' p_pressed={c_padStatus.p_buttons[5].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn6'  btn={c_padStatus.p_buttons[6]}  t='Y' function={button_routing[6]}     color_active='yellow'             color_inactive='none' p_pressed={c_padStatus.p_buttons[6].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn7'  btn={c_padStatus.p_buttons[7]}  t='R' function={button_routing[7]}     color_active='white'              color_inactive='none' p_pressed={c_padStatus.p_buttons[7].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn8'  btn={c_padStatus.p_buttons[8]}  t='R' function={button_routing[8]}     color_active='white'              color_inactive='none' p_pressed={c_padStatus.p_buttons[8].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn9'  btn={c_padStatus.p_buttons[9]}  t='R' function={button_routing[9]}     color_active='white'              color_inactive='none' p_pressed={c_padStatus.p_buttons[9].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn10' btn={c_padStatus.p_buttons[10]} t='R' function={button_routing[10]}    color_active='white'              color_inactive='none' p_pressed={c_padStatus.p_buttons[10].m_pressed}></ClssGamePadButton>
            </div>
        );
    }
}


export default class ClssGamePadControl extends React.Component {

    constructor(props)
	{
		super (props);

        this.state =
        {
            m_gamepad_index: this.props.p_index,
            m_andruavUnit: null,
            'm_update': 0
        };

        this.m_flag_mounted = false;

        this.key = Math.random().toString();

        // rootRef points at the #modal_ctrl_gamepad root div rendered below,
        // replacing the legacy jQuery id selectors on it. m_opaque
        // mirrors the legacy `attr('opacity')` pin flag on that div: true
        // when pinned opaque, false when it fades to 0.4 on mouseout. It is
        // an instance field (not state) because it is not read in render —
        // opacity is applied directly to the DOM node, exactly as the
        // jQuery .css('opacity', ...) calls did, avoiding re-renders.
        this.rootRef = React.createRef();
        this.m_opaque = false;

        this.m_gamepad_config_index = js_localStorage.fn_getGamePadConfigIndex();

        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
    }


    
    fn_renderMainOutput(p_connected)
    {
        if (p_connected === true)
        {
            this.m_output = (
                <div key={this.key} className='gp_input'>
                    <div className="row  margin_2px css_padding_zero">
                        <div className='col-12'>
                            <ClssGamePadAxesControl p_index={js_preferences.fn_getActiveGamepadIndex()}></ClssGamePadAxesControl>
                        </div>
                        <div className='col-12'>
                            <ClssGamePadButtonControl p_index={js_preferences.fn_getActiveGamepadIndex()}></ClssGamePadButtonControl>
                        </div>
                    </div>
                </div>
            );
        }
        else
        {
            this.m_output = (<div>NO Gamepad Detected</div>);
        }
    }

    fn_gamePadConnected(p_obj)
    {
        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    fn_gamePadDisconnected(p_obj)
    {
        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    fn_onChangeConfig ()
    {
        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    fn_changeConfig (p_config_index)
    {
        if (this.m_flag_mounted === false)return ;
        if (isNaN(p_config_index)) return ;

        js_localStorage.fn_setGamePadConfigIndex(p_config_index);
        
        this.m_config_index = p_config_index;

        js_eventEmitter.fn_dispatch(js_event.EE_GamePad_Config_Index_Changed);

        this.setState({'m_update': this.state.m_update +1});

    }

    fn_changeGamePad(p_index)
    {
        if ((p_index==null || p_index === undefined) || ((p_index<0) || (p_index>=4))) return ;
        
        js_preferences.fn_setActiveGamepadIndex(p_index);
        
        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    /***
     * called when WebClient needs to assign gamePad readings to a given drone.
     */
    fn_requestGamePad(p_andruavUnit)
    {
        if (this.m_flag_mounted === false)return ;
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;
        this.state.m_andruavUnit = p_andruavUnit;
        // The #btnGoto button is rendered below with its own React onClick
        // (fn_gotoUnitPressed), so the legacy jQuery .off('click')/.on('click')
        // binding here was redundant — and its handler read a non-existent
        // attr(partyID) (see FINDINGS.md). Show the modal via the ref instead
        // of the legacy jQuery .show() on the id selector.
        if (this.rootRef.current) this.rootRef.current.style.display = 'block';

       this.setState({'m_update': this.state.m_update +1});

    }

    fn_releaseGamePad(p_andruavUnit)
    {
        if (this.m_flag_mounted === false)return ;

        this.state.m_andruavUnit = null;
        if (this.rootRef.current) this.rootRef.current.style.display = 'none';

        this.setState({'m_update': this.state.m_update +1});

    }

        
    componentWillUnmount ()
    {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
    }


    

    componentDidMount () {

        if (this.rootRef.current) this.rootRef.current.style.display = 'none';
        // .draggable() is jQuery UI — out of scope for TASK-15 (same as
        // js_main.js enableDragging()). It stays a jQuery call, but on the
        // ref DOM node instead of an id selector.
        if (this.rootRef.current) {
            $(this.rootRef.current).draggable({
                handle: '.js-draggable-handle',
                cancel: 'button, input, textarea, select, option, a'
            });
        }
        // mouseover / mouseout / opaque_btn click are now React handlers on
        // the root div and the button (see render), so they no longer need
        // jQuery .on() registration here.

        this.m_flag_mounted = true;
    }

    fn_onMouseOver ()
    {
        if (this.rootRef.current) this.rootRef.current.style.opacity = '1.0';
    }

    fn_onMouseOut ()
    {
        // Match the legacy mouseout: only fade to 0.4 when not pinned
        // opaque (m_opaque mirrors the old attr('opacity') flag).
        if (this.m_opaque) return;
        if (this.rootRef.current) this.rootRef.current.style.opacity = '0.4';
    }

    fn_onOpaqueClick ()
    {
        // Toggle the opaque pin. When pinning, force opacity to 1.0; when
        // unpinning, leave the current opacity in place (it drops to 0.4
        // on the next mouseout), exactly as the legacy handler did.
        this.m_opaque = !this.m_opaque;
        if (this.m_opaque && this.rootRef.current) {
            this.rootRef.current.style.opacity = '1.0';
        }
    }

    fn_gotoUnitPressed()
    {
        if (this.m_flag_mounted === false)return ;
        fn_gotoUnit_byPartyID(this.state.m_andruavUnit.getPartyID());
    
    }
    
    fn_callConfigGamePad()
    {
        window.open('/gamepad','_blank');
    }

    render()
    {
        const c_config_index = js_localStorage.fn_getGamePadConfigIndex();
    
        this.fn_renderMainOutput (js_andruav_gamepad.fn_isGamePadDefined() === true);
        
        js_common.fn_console_log (this.m_output);
        const v_title = (this.state.m_andruavUnit !== null && this.state.m_andruavUnit !== undefined )?this.state.m_andruavUnit.m_unitName:'NA';
        const gamepads = [];
        
        
        for (let i=0; i<4;++i)
        { // 4 gamepads can be connected to computer.
            const gamepad = js_andruav_gamepad.v_controllers[i];
            if (gamepad !== null && gamepad !== undefined)
            {
                function add (Me,p_index)
                {
                   gamepads.push(
                        <a key={'gppu'+gamepad.id} className="dropdown-item" href="#" onClick={ (e) => Me.fn_changeGamePad(p_index)}>{gamepad.id}</a>
                    );
                };
                add (this,i);
            }
        }
        let gamepad_title = "Select an active Game Pad"; 
        const v_controller = js_andruav_gamepad.v_controllers[js_preferences.fn_getActiveGamepadIndex()];
        if (v_controller !== null && v_controller !== undefined)
        {
            gamepad_title = v_controller.id.toString();
        }

        return (<div id="modal_ctrl_gamepad" key={"m1_" + this.key} ref={this.rootRef} title="GamePad Control" className="css_ontop" onMouseOver={(e) => this.fn_onMouseOver(e)} onMouseOut={(e) => this.fn_onMouseOut(e)}>
  <EventBridge eventName={js_event.EE_GamePad_Connected} onEvent={(p_obj) => this.fn_gamePadConnected(p_obj)} />
  <EventBridge eventName={js_event.EE_GamePad_Disconnected} onEvent={(p_obj) => this.fn_gamePadDisconnected(p_obj)} />
  <EventBridge eventName={js_event.EE_requestGamePad} onEvent={(p_andruavUnit) => this.fn_requestGamePad(p_andruavUnit)} />
  <EventBridge eventName={js_event.EE_releaseGamePad} onEvent={(p_andruavUnit) => this.fn_releaseGamePad(p_andruavUnit)} />
  <EventBridge eventName={js_event.EE_GamePad_Control_Update} onEvent={() => this.fn_onChangeConfig()} />
  <h4 id="title" className="modal-title text-warning js-draggable-handle">GamePad of {v_title}</h4>
  {this.m_output}
  <div id="modal_gamepad_footer" className="form-group bg-dark">
    <div>
      <button
        id="opaque_btn"
        type="button"
        className="btn btn-sm btn-primary"
        data-bs-toggle="button"
        aria-pressed="false"
        autoComplete="off"
        onClick={(e) => this.fn_onOpaqueClick(e)}
      >
        opaque
      </button>
    </div>
    <div role="group" aria-label="Button group with nested dropdown">
      <div role="group">
        <button
          id="btnRXIndexDrop"
          type="button"
          className="btn btn-sm btn-danger dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Settings {c_config_index}
        </button>
        <div className="dropdown-menu" aria-labelledby="btnRXIndexDrop">
          <a className="dropdown-item" href="#" onClick={(e) => this.fn_changeConfig(1)}>
            Settings 1
          </a>
          <a className="dropdown-item" href="#" onClick={(e) => this.fn_changeConfig(2)}>
            Settings 2
          </a>
          <a className="dropdown-item" href="#" onClick={(e) => this.fn_changeConfig(3)}>
            Settings 3
          </a>
          <a className="dropdown-item" href="#" onClick={(e) => this.fn_changeConfig(4)}>
            Settings 4
          </a>
        </div>
      </div>
    </div>
    <div role="group" aria-label="Button group with nested dropdown">
      <div role="group">
        <button
          id="btnGamePadDrop"
          key={js_preferences.fn_getActiveGamepadIndex()}
          type="button"
          className="btn btn-sm btn-danger dropdown-toggle"
          title={gamepad_title}
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          G-Pad {js_preferences.fn_getActiveGamepadIndex()}
        </button>
        <div className="dropdown-menu" aria-labelledby="btnGamePadDrop">{gamepads}</div>
      </div>
    </div>
    <div>
      <button
        id="btnConfig"
        type="button"
        className="btn btn-sm btn-success"
        onClick={(e) => this.fn_callConfigGamePad()}
      >
        Configure
      </button>
    </div>
    <div>
      <button
        id="btnGoto"
        type="button"
        className="btn btn-sm btn-success"
        onClick={(e) => this.fn_gotoUnitPressed()}
      >
        Goto
      </button>
    </div>
  </div>
</div>);
    }
}





