/**
 * @auth: Mohammad S. Hefny
 * 
 * Date: Feb - 2025
 */

import React    from 'react';
import {js_globals} from '../../../js/js_globals.js';
import {EVENTS as js_event} from '../../../js/js_eventList.js'
import {js_eventEmitter} from '../../../js/js_eventEmitter.js'
import * as js_andruavMessages from '../../../js/protocol/js_andruavMessages'

import {ClssCtrlGPIO_Port} from './jsc_ctrl_gpio_port.jsx'

export class ClssCtrlGPIO extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update : 0,
		};

        js_eventEmitter.fn_subscribe (js_event.EE_unitGPIOUpdated,this,this.fn_unitUpdated);
    }

    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_event.EE_unitGPIOUpdated,this);
    }

    componentDidMount() {
        this.m_flag_mounted = true;
        this.setState({ m_update: 1 });
        js_globals.v_andruavFacade.API_requestGPIOStatus(this.props.p_unit); // retrieve the GPIO status.
    }

    
    fn_unitUpdated (p_me, p_unit)
    {
        if (p_me.m_flag_mounted === false)return ;
        
        p_me.setState(prevState => ({ m_update: prevState.m_update + 1 }));
    }

    fn_refreshGPIO (p_andruavUnit)
    {
        js_globals.v_andruavFacade.API_requestGPIOStatus(p_andruavUnit); // retrieve the GPIO status.
    }

    

    getActiveButtonStyle(v_andruavUnit)
    {
        switch (v_andruavUnit.m_SDR.m_status)
        {
            case js_andruavMessages.CONST_SDR_STATUS_NOT_CONNECTED:
                
                if (Object.keys(v_andruavUnit.m_SDR.m_available_drivers).length === 0)
                {
                    return {r:"bg-success", u:"hidden", s:"hidden", p:"hidden"};
                }
                else
                {
                    return {r:"bg-success", u:"bg-danger", s:"hidden", p:"hidden"};
                }

                
            case js_andruavMessages.CONST_SDR_STATUS_CONNECTED:
                return {r:"bg-success", u:"bg-danger", s:"bg-success", p:"bg-light"};

            case js_andruavMessages.CONST_SDR_STATUS_STREAMING_ONCE:
            case js_andruavMessages.CONST_SDR_STATUS_STREAMING_INTERVALS:
                    return {r:"bg-success", u:"bg-warning", s:"bg-danger", p:"bg-warning"};

            case js_andruavMessages.CONST_SDR_STATUS_ERROR:
            default:
                return {r:"bg-danger", u:"bg-light", s:"bg-light", p:"bg-light"};
                        
        }
    }

    getDriverNameByIndex (v_andruavUnit, index)
    {
        let driver = v_andruavUnit.m_SDR.m_available_drivers[index]; 
        if (driver === null || driver === undefined)
        {
            return "No Device";
        }
        
        return driver.driver;
    }

    getDriverNames(v_andruavUnit)
    {
        let driver_names = [];
        const c_list = v_andruavUnit.m_SDR.m_available_drivers;
        const c_keys = Object.keys(c_list);
        const c_len = c_keys.length;
       
        for (let i =0; i<c_len; ++i) 
        { 
            const driver = c_list[c_keys[i]];
            driver_names.push(
                <option key={"op" + v_andruavUnit.getPartyID() + driver.index + driver.driver} value={driver.index}>{driver.driver}</option>
            );
        }

        return driver_names;
    }
    
    render () 
    {
        const  v_andruavUnit = this.props.p_unit;
        const v_date = (new Date(v_andruavUnit.m_Messages.m_lastActiveTime));
        

        const gpios = v_andruavUnit.m_GPIOs.m_gpios;
        const gpios_buttons = [];

        Object.entries(gpios).forEach(([key, gpio]) => {
            const { pin_module_key, pin_number, pin_mode, gpio_type, pin_value, pin_name } = gpio;

            gpios_buttons.push(
                <ClssCtrlGPIO_Port key={v_andruavUnit.getPartyID() + pin_module_key + pin_number + key} p_unit={v_andruavUnit} gpio_obj={gpio} />
            );
        });

        let cmd_btns = [];
        
        cmd_btns.push(<div key={v_andruavUnit.getPartyID() + 'gpio_'}  className='row css_margin_zero padding_zero  border-top border-secondary'>
                
                <div key={v_andruavUnit.getPartyID() + 'gpio_1'} className="col-12 mt-1">
                <div key={v_andruavUnit.getPartyID() + 'gpio_2'} className = 'row al_l css_margin_zero d-flex '>
                    <div key={v_andruavUnit.getPartyID() + 'gpio_21'} className= 'col-4 col-sm-3 user-select-none '>
                    <p key={v_andruavUnit.getPartyID() + 'gpio_211'} className=' rounded-3 text-white bg-primary cursor_hand textunit_nowidth al_c' title ='Refresh GPIO' onClick={() => this.fn_refreshGPIO(v_andruavUnit)}>Refresh</p>
                    </div>
                </div>
                </div>
            </div>);

        return (
            <div key={v_andruavUnit.getPartyID() + "_ctl_gpio"} className={this.props.className}>
                
                
                {gpios_buttons}

                <div key={v_andruavUnit.getPartyID() + 'gpio_3'} className='row css_margin_zero padding_zero '>
                        <div key={v_andruavUnit.getPartyID() + 'gpio_31'} className="col-12">
                            <p key={v_andruavUnit.getPartyID() + 'gpio_311'} className="textunit user-select-all m-0"><span><small><b>Last Active <span className='text-warning' ><small><b>{v_date.toUTCString()}</b></small></span> </b></small></span></p>
                        </div>
                </div>

                    {cmd_btns}
                
            </div>
        );
    }

}