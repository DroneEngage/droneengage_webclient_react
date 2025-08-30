import React    from 'react';

import {EVENTS as js_event} from '../../js/js_eventList.js'
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

        js_eventEmitter.fn_subscribe (js_event.EE_unitNavUpdated,this,this.fn_update);
        
    }

    shouldComponentUpdate(nextProps, nextState) {
        const update = (this.state.m_update != nextState.m_update) ;

        return update;
    }


    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_event.EE_unitNavUpdated,this);
    }

    
    componentDidMount() {
        const c_canvas = this.m_hudRef.current;
        if (c_canvas) {
            // Set canvas dimensions once during mount
            c_canvas.width = 50;
            c_canvas.height = 50;
            c_canvas.style.width = '50px';
            c_canvas.style.height = '50px';

            this.m_canvasContext = c_canvas.getContext('2d');
            this.m_canvasDimensions = {
                width: c_canvas.width,
                height: c_canvas.height,
                centerX: c_canvas.width / 2,
                centerY: c_canvas.height / 2,
                radius: 22,
            };

            // Initial draw with default values
            this.draw(0, 0, 0); // pitch, roll, yaw in radians
        }

        // Set initial update state to 1 to indicate component is mounted and ready
        this.setState({ 'm_update': 1 });
    }

    
    componentDidUpdate() {
                    
        // Redraw the canvas whenever the component updates (due to m_update state change)
        // Note: roll is negated here for correct visual rotation
        this.draw(
            this.c_pitch * js_helpers.CONST_DEGREE_TO_RADIUS, // Convert pitch to radians
            -this.c_roll * js_helpers.CONST_DEGREE_TO_RADIUS,  // Convert roll to radians and negate
            this.c_yaw * js_helpers.CONST_DEGREE_TO_RADIUS     // Convert yaw to radians
        );
    }

    fn_update (p_me,p_andruavUnit)
    {
        try {
            // Check if the update is for the correct unit
            if (p_me.props.p_unit && p_me.props.p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return;

            // Update instance variables with new orientation data
            p_me.c_yaw = (js_helpers.CONST_RADIUS_TO_DEGREE * ((p_andruavUnit.m_Nav_Info.p_Orientation.yaw + js_helpers.CONST_PTx2) % js_helpers.CONST_PTx2)).toFixed(1);
            p_me.c_pitch = (js_helpers.CONST_RADIUS_TO_DEGREE * p_andruavUnit.m_Nav_Info.p_Orientation.pitch).toFixed(1);
            p_me.c_roll = (js_helpers.CONST_RADIUS_TO_DEGREE * p_andruavUnit.m_Nav_Info.p_Orientation.roll).toFixed(1);

            // Trigger a re-render by updating the m_update state
            p_me.setState({ 'm_update': p_me.state.m_update + 1 });
        } catch (ex) {
            console.error("Error in fn_update:", ex);
        }
    }

    draw(p_pitch_rad, p_roll_rad, p_yaw_rad) {
        const c_ctx = this.m_canvasContext;
        if (!c_ctx) return; // Ensure context is available

        const { centerX, centerY, radius, width, height } = this.m_canvasDimensions;

        c_ctx.clearRect(0, 0, width, height); // Clear the entire canvas
        c_ctx.save(); // Save the current canvas state

        // Apply roll rotation
        c_ctx.translate(centerX, centerY);
        c_ctx.rotate(p_roll_rad);
        c_ctx.translate(-centerX, -centerY);

        // SKY
        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, 0, js_helpers.CONST_PTx2);
        c_ctx.fillStyle = '#75a4d3';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = '#2cb1e1';
        c_ctx.stroke();

        // Ground
        // Pitch is exaggerated by 2x as per original logic
        const v_pitch_start = (2 * p_pitch_rad);
        const v_pitch_end = Math.PI - v_pitch_start;

        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, v_pitch_start, v_pitch_end, false);
        c_ctx.fillStyle = '#75D375';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = '#36AB36';
        c_ctx.stroke();

        // Yaw Indicator
        // Yaw arc is offset by -90 degrees to align 0 degrees with the top of the circle
        const v_yaw_start = (p_yaw_rad - (3 * js_helpers.CONST_DEGREE_TO_RADIUS) - (90 * js_helpers.CONST_DEGREE_TO_RADIUS));
        const v_yaw_end = (p_yaw_rad + (3 * js_helpers.CONST_DEGREE_TO_RADIUS) - (90 * js_helpers.CONST_DEGREE_TO_RADIUS));

        c_ctx.beginPath();
        c_ctx.moveTo(centerX, centerY);
        c_ctx.arc(centerX, centerY, radius, v_yaw_start, v_yaw_end, false);
        c_ctx.fillStyle = '#F3DBE3';
        c_ctx.fill();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = '#F3DBE3';
        c_ctx.closePath();
        c_ctx.stroke();

        c_ctx.restore(); // Restore the canvas state (undoes roll rotation)

        // Horizon Line
        c_ctx.beginPath();
        c_ctx.moveTo(5, centerY);
        c_ctx.lineTo(width - 5, centerY);
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = '#F0AD4E';
        c_ctx.stroke();

        // Center Dot
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
                <div className='col-6  css_margin_zero d-flex '>
                    <ul className='css_hud_bullets'>
                        <li><span className='text-white'>R:</span><span className='text-warning ml-1'>{this.c_roll}º</span></li>
                        <li><span className='text-white'>P:</span><span className='text-warning ml-1'>{this.c_pitch}º</span></li>
                        <li><span className='text-white'>Y:</span><span className='text-warning ml-1'>{this.c_yaw}º</span></li>
                    </ul>
                    <canvas
                        key={this.key + 'chud'}
                        id='ctrl_hud'
                        ref={this.m_hudRef}
                        className='col-6  css_margin_zero css_padding_zero'
                    ></canvas>
                </div>
            </div>
        );
    }

}