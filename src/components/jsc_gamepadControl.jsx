import $ from 'jquery'; 
import React    from 'react';


import {js_globals} from '../js/js_globals.js';
import {js_localStorage} from '../js/js_localStorage'
import {js_eventEmitter} from '../js/js_eventEmitter'
import * as js_common from '../js/js_common.js'

import {js_localGamePad} from '../js/js_localGamePad.js'
import {js_speak} from '../js/js_speak'

import {fn_gotoUnit_byPartyID} from '../js/js_main'


class ClssGamePadAxisControl extends React.Component {

    render()
    {
        return (
            <div >
            <svg viewBox="-2.2 -2.2 4.4 4.4" width="128" height="128">
                <circle cx="0" cy="0" r="2" fill="none" stroke="#888" strokeWidth="0.04"></circle>
                <path d="M0,-2L0,2M-2,0L2,0" stroke="#888" strokeWidth="0.04"></path>
                <circle cx={this.props.x*2} cy={this.props.y*2} r="0.22" fill="red" className="axis"></circle>
                <text textAnchor="middle" fill="#CCC" x="0" y="2">{this.props.x + "," + this.props.y}</text>
            </svg>
            </div>
        );
    }
}


class ClssGamePadButton extends React.Component {
    render()
    {
        const c_color = this.props.pressed === true?this.props.color_active:this.props.color_inactive;
        js_common.fn_console_log ("buttion " + this.props.color_active);
        return (
            <div>
                <svg viewBox="-2.2 -2.2 4.4 4.4" width="48" height="48">
                    <circle cx="0" cy="0" r="1.5" fill={c_color} stroke={this.props.color_active} strokeWidth="0.2"></circle>
                    <circle cx="0" cy="0" r="1.0" fill="none"  className="button"></circle>
                    <text className="gp_index" dominantBaseline="central" textAnchor="middle" fill={this.props.color_active} x="0" y="0">{this.props.t}</text>
                </svg>
            </div>
        );
    }
}


class ClssGamePadAxesControl extends React.Component {

    constructor(props)
	{
		super (props);
        
        js_eventEmitter.fn_subscribe(js_globals.EE_GamePad_Axes_Updated,this, this.fn_gamePadAxesUpdated);
    }
    
    fn_gamePadAxesUpdated(p_me,p_obj)
    {
        p_me.forceUpdate();
    }

    
    componentWillUnmount () 
    {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_GamePad_Axes_Updated,this);
    }

    render()
    {
        const c_padStatus = js_localGamePad.fn_getGamePad(this.props.p_index);
        if (c_padStatus== null)
        {
            return (
            <div className='gp_axes'>
                <p className="text-danger">No Input</p>
            </div>
                
            );
        }
        var v_axis = [0,1,2,3];
        
        // KEEP GUI as Sticks ... dont change it that is why we comment below code
        // switch(js_localStorage.fn_getGamePadMode())
        // {
        //     case 1:
        //         v_axis = [0,3,2,1];
        //         break;
        //     case 2:
        //         v_axis = [0,1,2,3];
        //         break;
        //     case 3:
        //         v_axis = [2,3,0,1];
        //         break;
        //     case 4:
        //         v_axis = [2,1,0,3];
        //         break;
                            
        // }

        return (
            <div className='gp_axes'>
                <ClssGamePadAxisControl id='axes1' x={c_padStatus.p_axes[v_axis[0]]} y={c_padStatus.p_axes[v_axis[1]]}></ClssGamePadAxisControl>
                <ClssGamePadAxisControl id='axes2' x={c_padStatus.p_axes[v_axis[2]]} y={c_padStatus.p_axes[v_axis[3]]}></ClssGamePadAxisControl>
            </div>
                
        );
    }
}

class ClssGamePadButtonControl extends React.Component {
    
    
    constructor()
	{
		super ();
        
        js_eventEmitter.fn_subscribe(js_globals.EE_GamePad_Button_Updated,this, this.fn_gamePadButtonUpdated);
    }
    
    fn_gamePadButtonUpdated(p_me,p_obj)
    {
        p_me.forceUpdate();
    }

    
    componentWillUnmount () 
    {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_GamePad_Button_Updated,this);
    }


    render()
    {
        const c_padStatus = js_localGamePad.fn_getGamePad(this.props.p_index);
        if (c_padStatus== null)
        {
            return (<div className='gp_buttons'></div>);
            
        }

        return (
            <div className='gp_buttons'>
                <ClssGamePadButton id='btn4' t='L' color_active='white'     color_inactive='none' pressed={c_padStatus.p_buttons[4].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn0' t='A' color_active='green'     color_inactive='none' pressed={c_padStatus.p_buttons[0].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn1' t='B' color_active='red'       color_inactive='none' pressed={c_padStatus.p_buttons[1].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn2' t='X' color_active='blue'      color_inactive='none' pressed={c_padStatus.p_buttons[2].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn3' t='Y' color_active='yellow'    color_inactive='none' pressed={c_padStatus.p_buttons[3].m_pressed}></ClssGamePadButton>
                <ClssGamePadButton id='btn5' t='R' color_active='white'     color_inactive='none' pressed={c_padStatus.p_buttons[5].m_pressed}></ClssGamePadButton>
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
            m_mode: js_localStorage.fn_getGamePadMode(),
            'm_update': 0
        };
        js_eventEmitter.fn_subscribe(js_globals.EE_GamePad_Connected,this, this.fn_gamePadConnected);
        js_eventEmitter.fn_subscribe(js_globals.EE_GamePad_Disconnected,this, this.fn_gamePadDisconnected);
        js_eventEmitter.fn_subscribe(js_globals.EE_requestGamePad,this, this.fn_requestGamePad);
        js_eventEmitter.fn_subscribe(js_globals.EE_releaseGamePad,this, this.fn_releaseGamePad);
    }
    
    fn_renderMainOutput(p_connected)
    {
        if (p_connected === true)
        {
            this.m_output = (
                <div className='gp_input'>
                    <div className="row  margin_2px css_padding_zero">
                        <div className='col-12'>
                            <ClssGamePadAxesControl p_index={js_globals.active_gamepad_index}></ClssGamePadAxesControl>
                        </div>
                        <div className='col-12'>
                            <ClssGamePadButtonControl p_index={js_globals.active_gamepad_index}></ClssGamePadButtonControl>
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

    fn_gamePadConnected(p_me,p_obj)
    {
        p_me.forceUpdate();
    }

    fn_gamePadDisconnected(p_me,p_obj)
    {
        p_me.forceUpdate();
    }

    fn_changeMode (p_mode)
    {
        if (isNaN(p_mode)) return ;

        js_localStorage.fn_setGamePadMode(p_mode);
        js_speak.fn_speak ('Game pad mode is set to ' + p_mode.toString());
        this.forceUpdate();
    }

    fn_changeGamePad(p_index)
    {
        if ((p_index==null || p_index === undefined) || ((p_index<0) || (p_index>=4))) return ;
        
        js_globals.active_gamepad_index = p_index;
        
        if (this.state.m_update === 0) return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    /***
     * called when WebClient needs to assign gamePad readings to a given drone.
     */
    fn_requestGamePad(p_me,p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;
        p_me.state.m_andruavUnit = p_andruavUnit;
        $('#modal_ctrl_gamepad').find('#btnGoto').unbind("click");
        $('#modal_ctrl_gamepad').find('#btnGoto').on('click', function () {
            fn_gotoUnit_byPartyID($('#modal_ctrl_gamepad').attr(p_andruavUnit.partyID));
        });
        $('#modal_ctrl_gamepad').show();
        p_me.forceUpdate();
    }
    
    fn_releaseGamePad(p_me,p_andruavUnit)
    {
        p_me.state.m_andruavUnit = null;
        $('#modal_ctrl_gamepad').hide();  
        p_me.forceUpdate();
    }

        
    componentWillUnmount ()
    {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_GamePad_Connected,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_GamePad_Disconnected,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_requestGamePad,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_releaseGamePad,this);
    }   


    

    componentDidMount () {
        $('#modal_ctrl_gamepad').hide();
        $('#modal_ctrl_gamepad').draggable();
        $('#modal_ctrl_gamepad').on("mouseover", function () {
            $('#modal_ctrl_gamepad').css('opacity', '1.0');
        });
        $('#modal_ctrl_gamepad').on("mouseout", function () {
            const opacity = $('#modal_ctrl_gamepad').attr('opacity') ;
            if ( opacity === null || opacity  === undefined) {
                $('#modal_ctrl_gamepad').css('opacity', '0.4');
            }
        });
        $('#modal_ctrl_gamepad').find('#opaque_btn').on('click', function () {
            const opacity = $('#modal_ctrl_gamepad').attr('opacity') ;
            if (opacity === null || opacity === undefined) {
                $('#modal_ctrl_gamepad').attr('opacity', '1.0');
                $('#modal_ctrl_gamepad').css('opacity', '1.0');
            }
            else {
                $('#modal_ctrl_gamepad').attr('opacity', null);
            }
        });
        $('#modal_ctrl_gamepad').find('#btnGoto').on('click', function () {
            fn_gotoUnit_byPartyID($('#modal_ctrl_gamepad').attr('partyID'));
        });
        this.state.m_update = 1;
    }

    
    render()
    {
        const c_mode = js_localStorage.fn_getGamePadMode();
    
        this.fn_renderMainOutput (js_localGamePad.fn_isGamePadDefined() === true);
        
        js_common.fn_console_log (this.m_output);
        var v_title = (this.state.m_andruavUnit !== null && this.state.m_andruavUnit !== undefined )?this.state.m_andruavUnit.m_unitName:'NA';
        var gamepads = [];
        
        
        for (var i=0; i<4;++i)
        { // 4 gamepads can be connected to computer.
            const gamepad = js_localGamePad.v_controllers[i];
            if (gamepad !== null && gamepad !== undefined)
            {
                function add (Me,p_index)
                {
                    /*
                    As per AI
                    I should use 
                    gamepads.push(
                    <button key={'gppu'+gamepad.id} className="dropdown-item" onClick={(e) => Me.fn_changeGamePad(p_index)}>{gamepad.id}</button>
                    );
                    */
                    gamepads.push(
                        <a key={'gppu'+gamepad.id} className="dropdown-item" href="#" onClick={ (e) => Me.fn_changeGamePad(p_index)}>{gamepad.id}</a>
                    );
                };
                add (this,i);
            }
        }
        var gamepad_title = "Select an active Game Pad"; 
        const v_controller = js_localGamePad.v_controllers[js_globals.active_gamepad_index];
        if (v_controller !== null && v_controller !== undefined)
        {
            gamepad_title = v_controller.id.toString();
        }

        return (<div id="modal_ctrl_gamepad" title="GamePad Control" className="localcontainer css_ontop">
                    <h4 id="title" className="modal-title text-warning">GamePad of {v_title} </h4>
                    {this.m_output}
					<div id="modal_gamepad_footer" className="form-group text-center localcontainer bg-dark">
                        <div className = "row">
                            <div className = "col-2">
                                <button id="opaque_btn" type="button" className="btn  btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off">opaque</button>
                            </div>    
                            <div className = "col-2">
                                <button id="btnGoto" type="button" className="btn  btn-sm btn-success">Goto</button>
                            </div>
                            
                            <div className="col-4 " role="group" aria-label="Button group with nested dropdown">
                                {/* <button type="button" className="btn btn-sm btn-danger dropdown-btn text-nowrap">Mode {c_mode} </button> */}
                                <div className="" role="group">
                                    <button id="btnRXModeDrop" type="button" className="btn btn-sm btn-danger dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Mode {c_mode}</button>
                                    <div className="dropdown-menu" aria-labelledby="btnRXModeDrop">
                                    <a className="dropdown-item" href="#" onClick={ (e) => this.fn_changeMode(1)}>Mode 1</a>
                                    <a className="dropdown-item" href="#" onClick={ (e) => this.fn_changeMode(2)}>Mode 2</a>
                                    <a className="dropdown-item" href="#" onClick={ (e) => this.fn_changeMode(3)}>Mode 3</a>
                                    <a className="dropdown-item" href="#" onClick={ (e) => this.fn_changeMode(4)}>Mode 4</a>
                                    </div>
                                </div>
                            </div>

                            <div className="col-4 " role="group" aria-label="Button group with nested dropdown">
                                {/* <button type="button" className="btn-sm btn-danger text-nowrap" title={gamepad_title}>GamePad {js_globals.active_gamepad_index} </button> */}
                                <div className="" role="group">
                                    <button id="btnGamePadDrop" key={js_globals.active_gamepad_index} type="button" className="btn btn-sm btn-danger dropdown-toggle" title={gamepad_title} data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">GamePad {js_globals.active_gamepad_index}</button>
                                    <div className="dropdown-menu" aria-labelledby="btnGamePadDrop">
                                        {gamepads}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>);
    }
}





