import React    from 'react';

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter.js'

import * as js_helpers from '../../js/js_helpers.js'

export class ClssCtrlHUD extends React.Component {

    constructor(props)
	{
		super (props);
		
        this.state = {
            'm_update': 0
		};

        this.key = Math.random().toString();
        this.m_hudRef = React.createRef();
        
        this.c_yaw = 0;
        this.c_pitch = 0;
        this.c_roll = 0;

        js_eventEmitter.fn_subscribe (js_globals.EE_unitNavUpdated,this,this.fn_update);
        
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
                    
        this.draw(this.c_pitch,this.c_roll ,this.c_yaw);
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

    draw (p_pitch_deg, p_roll_deg, p_yaw_deg) 
    {
        const c_canvas=this.m_hudRef.current; 
        const c_ctx = c_canvas.getContext('2d');
        c_canvas.width  = 50;
        c_canvas.height = 50; 
        c_canvas.style.width  = '50px';
        c_canvas.style.height = '50px';

        let centerX = c_canvas.width / 2;
        let centerY = c_canvas.height / 2;
        let radius = 22;
        p_pitch_deg = 2 * p_pitch_deg;
        let v_pitch = p_pitch_deg * js_helpers.CONST_DEGREE_TO_RADIUS;
        let v_roll = -p_roll_deg * js_helpers.CONST_DEGREE_TO_RADIUS;

        let v_pitch_start = v_pitch;
        let v_pitch_end = 3.14 - v_pitch_start;
        
        let v_yaw_start = (p_yaw_deg-3-90)* js_helpers.CONST_DEGREE_TO_RADIUS;
        let v_yaw_end = (p_yaw_deg+3-90)* js_helpers.CONST_DEGREE_TO_RADIUS;
        
        

        c_ctx.clearRect(0, 0, c_canvas.width, c_canvas.height);
        c_ctx.beginPath();
        c_ctx.lineWidth = 1;
        c_ctx.save();

        // rotate apply roll
        c_ctx.translate(centerX, centerY);
        c_ctx.rotate(v_roll);
        c_ctx.translate(-centerX, -centerY);
        
        // SKY
        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, 0 , 6.28);
        c_ctx.fillStyle = '#75a4d3';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = '#2cb1e1';
        c_ctx.stroke();

        // Ground
        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, v_pitch_start, v_pitch_end, false);
        c_ctx.fillStyle = '#75D375';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = '#36AB36';
        c_ctx.stroke();

        

        // Yaw
        c_ctx.beginPath();
        c_ctx.moveTo(centerX,centerY);
        c_ctx.arc(centerX, centerY, radius, v_yaw_start, v_yaw_end, false);
        c_ctx.fillStyle = '#F3DBE3';
        c_ctx.fill();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = '#F3DBE3';
        c_ctx.closePath();
        c_ctx.stroke();


        c_ctx.restore();

        c_ctx.beginPath();
        c_ctx.moveTo(5,centerY);
        c_ctx.lineTo(c_canvas.width-5, centerY);
        c_ctx.lineWidth = 1;
        c_ctx.fillStyle = '#F0AD4E';
        c_ctx.stroke();

        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, 2, 0, js_helpers.CONST_PTx2, false);
        c_ctx.fillStyle = '#DA7EB7';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = '#DA7EB7';
        c_ctx.stroke();
        
    }

    

    render ()
    {

        const v_andruavUnit = this.props.p_unit;
        this.c_yaw = (js_helpers.CONST_RADIUS_TO_DEGREE * ((v_andruavUnit.m_Nav_Info.p_Orientation.yaw + js_helpers.CONST_PTx2) % js_helpers.CONST_PTx2)).toFixed(1);
        this.c_pitch = ((js_helpers.CONST_RADIUS_TO_DEGREE * v_andruavUnit.m_Nav_Info.p_Orientation.pitch) ).toFixed(1);
        this.c_roll = ((js_helpers.CONST_RADIUS_TO_DEGREE * v_andruavUnit.m_Nav_Info.p_Orientation.roll) ).toFixed(1);

        return (
            <div key={this.key + 'hud'} id={this.props.id} className='css_hud_div'>
                <div className = 'row al_l css_margin_zero'>
                    <div className= 'col-6  css_margin_zero d-flex '>
                        <ul className ='css_hud_bullets'>
                            <li><span className='text-white'>R:</span><span className='text-warning'>{this.c_roll}º</span></li>
                            <li><span className='text-white'>P:</span><span className='text-warning'>{this.c_pitch}º</span></li>
                            <li><span className='text-white'>Y:</span><span className='text-warning'>{this.c_yaw}º</span></li>
                        </ul>
                    </div>

                    <div className= 'col-6  css_margin_zero css_padding_zero'>
                    <canvas key={this.key + 'chud'} id='ctrl_hud' ref={this.m_hudRef} className='css_hud'></canvas>
                    </div>
                   
                </div>
            </div>
        )
    }

}