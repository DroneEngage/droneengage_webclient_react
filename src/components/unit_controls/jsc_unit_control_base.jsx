import React    from 'react';

import * as js_helpers from '../../js/js_helpers.js'
import * as js_siteConfig from '../../js/js_siteConfig.js'

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import {js_speak} from '../../js/js_speak.js'

import * as js_andruavMessages from '../../js/js_andruavMessages.js'



/**
 * This is a base class for GCS & Drone Units
 */
export class ClssAndruavUnitBase extends React.Component {
    constructor(props)
	{
		super (props);
		this.state = {
		    'm_update': 0,
            'm_IsGCS':this.props.m_unit.m_IsGCS,
		};

        this._isMounted = false;
        
        js_eventEmitter.fn_subscribe(js_globals.EE_unitUpdated,this,this.fn_unitUpdated);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitNavUpdated,this,this.fn_unitUpdated);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitTelemetryOn,this,this.fn_unitTelemetryOn);
        js_eventEmitter.fn_subscribe(js_globals.EE_unitTelemetryOff,this,this.fn_unitTelemetryOFF);
        
    }

    


    fn_unitUpdated (me,p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.partyID !== me.props.m_unit.partyID) 
        {
            return ; // not me
        }

      

        if (p_andruavUnit.m_IsGCS !== me.props.m_unit.m_IsGCS)
        {
            // Drone converted to GCS or other type... class is not valid now and an add new should be created.
            
            js_eventEmitter.fn_dispatch(js_globals.EE_unitAdded,p_andruavUnit);
	    }

        var v_date = p_andruavUnit.date;
        if (v_date === null || v_date === undefined)
        {
            p_andruavUnit.date = new Date();
        }
        else
        {
            var n = new Date();
            if ((n - p_andruavUnit.date) < 300)
            {
                return ;
            }
            p_andruavUnit.date = new Date();
        }

       if (me.state.m_update  === 0) return ;
        
       me.setState({'m_update': me.state.m_update +1});
       
    }

    fn_unitTelemetryOn (me,p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.partyID !== me.props.m_unit.partyID) 
        {
            return ; // not me
        }
        
        me.setState({'m_update': me.state.m_update +1});
    }

    fn_unitTelemetryOFF(me,p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.partyID !== me.props.m_unit.partyID) 
        {
          //  js_common.fn_console_log ('err: This is not me ' + p_andruavUnit.partyID);
            return ; // not me
        }
        
        me.setState({'m_update': me.state.m_update +1});
    }

   
    childcomponentWillMount() {};
    childcomponentWillUnmount() {};

    
    componentDidMount() 
    {
        
        this.childcomponentWillMount();
    }

    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitUpdated,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitNavUpdated,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitTelemetryOn,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_unitTelemetryOff,this);
        this.childcomponentWillUnmount();
    }

    

    

    fn_takeTXCtrl (e,p_andruavUnit)
    {
        p_andruavUnit.m_Telemetry.m_rxEngaged = true;
        js_globals.v_andruavClient.API_TXCtrl (p_andruavUnit, js_andruavMessages.CONST_TX_SIGNAL_FREEZE_ALL);
        js_eventEmitter.fn_dispatch (js_globals.EE_requestGamePad, p_andruavUnit);
            
    }

    fn_releaseTXCtrl (p_andruavUnit)
    {
        p_andruavUnit.m_Telemetry.m_rxEngaged = false;
        js_globals.v_andruavClient.API_TXCtrl (p_andruavUnit, js_andruavMessages.CONST_RC_SUB_ACTION_RELEASED);
        js_eventEmitter.fn_dispatch (js_globals.EE_requestGamePadreleaseGamePad, p_andruavUnit);
            
    }


    fn_displayParamsDialog(p_andruavUnit)
    {
        if (js_globals.v_andruavClient === null || js_globals.v_andruavClient === undefined) return;
        
        js_eventEmitter.fn_dispatch(js_globals.EE_displayParameters, p_andruavUnit);
    }


    

    fn_toggleCamera(p_andruavUnit)
    {
        function fn_callback (p_session)
        {
            if ((p_session !== null && p_session !== undefined) && (p_session.status === 'connected')) 
            {
                js_eventEmitter.fn_dispatch(js_globals.EE_displayCameraDlgForm, p_session);
            }
        }
        
        js_globals.v_andruavClient.API_requestCameraList(p_andruavUnit, fn_callback);

    }

}
