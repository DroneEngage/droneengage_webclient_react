import $ from 'jquery'; 
import React    from 'react';

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter.js'

export class ClssCtrlDirections extends React.Component {

    constructor(props)
	{
		super (props);
		
        this.state = {
            'm_update': 0
		};

        this.key = Math.random().toString();
        this.m_dirRef = React.createRef();
                
        js_eventEmitter.fn_subscribe(js_globals.EE_unitNavUpdated, this, this.fn_update);
    
    }

    

   shouldComponentUpdate(nextProps, nextState) {
        const update = (this.state.m_update != nextState.m_update) ;

        return update;
    }


    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_globals.EE_onProxyInfoUpdated,this);
    }

    

    componentDidMount() {
        this.state.m_update = 1;
    }


    componentDidUpdate() {
        const v_nav_info = this.props.p_unit.m_Nav_Info;
        const c_target = v_nav_info._Target.target_bearing ; 
        const c_bearing = v_nav_info.p_Desired.nav_bearing ;
        this.draw(c_target,c_bearing);
    }

    
    fn_update (p_me,p_andruavUnit)
    {
        try
        {
            if (p_me.props.p_unit.partyID !== p_andruavUnit.partyID) return ;

            if (p_me.state.m_update === 0) return ;
            p_me.setState({'m_update': p_me.state.m_update +1});
        }
        catch (ex)
        {

        }
    }

    
    draw (target_deg, bearing_deg) 
    {
        //fn_console_log ("target_deg:"+ target_deg + " bearing_deg:" + bearing_deg);
        const c_canvas=this.m_dirRef.current; //$('#' + this.props.id +' #ctrl_target_bearing')[0];
        const c_ctx = c_canvas.getContext('2d');
        
        c_canvas.width  = 50;
        c_canvas.height = 50; 
        c_canvas.style.width  = '50px';
        c_canvas.style.height = '50px';

        let centerX = c_canvas.width / 2;
        let centerY = c_canvas.height / 2;
        let radius = 22;
        
        let v_target_start = (target_deg-4-90)* Math.PI / 180;
        let v_target_end = (target_deg+4-90)* Math.PI / 180;
        

        let v_bearing_start = (bearing_deg-3-90)* Math.PI / 180;
        let v_bearing_end = (bearing_deg+3-90)* Math.PI / 180;
        

        c_ctx.clearRect(0, 0, c_canvas.width, c_canvas.height);
        

        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        c_ctx.lineWidth = 3;
        c_ctx.strokeStyle = '#2cb1e1';
        c_ctx.stroke();
        
        
        

        // 1- Bearing
        c_ctx.beginPath();
        c_ctx.moveTo(centerX,centerY);
        c_ctx.arc(centerX, centerY, radius, v_bearing_start, v_bearing_end, false);
        c_ctx.fillStyle = '#36AB36';
        c_ctx.fill();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = '#36AB36';
        c_ctx.closePath();
        c_ctx.stroke();


        // 2- Target to override tip of bearing
        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, v_target_start, v_target_end, false);
        c_ctx.lineWidth = 3;
        c_ctx.fillStyle = '#FFFFFF';
        c_ctx.strokeStyle = '#FFFFFF';
        c_ctx.closePath();
        c_ctx.stroke();


    }


    render ()
    {
        return (
            <div key={this.key + 'dir'}  className='css_hud_div'>
                <div className = 'row al_l css_margin_zero'>
                    <canvas key={this.key + 'cdir'} id='ctrl_target_bearing' ref={this.m_dirRef} className='css_target_bearing'></canvas>
                </div>
            </div>
        )
    }
}