import React    from 'react';

import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'

import * as js_helpers from '../../js/js_helpers.js'

export class ClssCtrlDirections extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            'm_update': 0 // Used to trigger component updates for drawing
        };

        this.key = Math.random().toString();
        this.m_dirRef = React.createRef(); // Ref for the canvas element

        // Instance variables to store current bearing values
        this.c_target_bearing = 0;
        this.c_nav_bearing = 0;

        // Canvas context and dimensions, initialized once
        this.m_canvasContext = null;
        this.m_canvasDimensions = { width: 0, height: 0, centerX: 0, centerY: 0, radius: 0 };

        // Bind event handler to 'this'
        this.fn_update = this.fn_update.bind(this);

        // Subscribe to navigation updates
        js_eventEmitter.fn_subscribe(js_event.EE_unitNavUpdated, this, this.fn_update);

        // Interval for mock data updates
        this.mockDataInterval = null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Only re-render if m_update state has changed
        const update = (this.state.m_update !== nextState.m_update);
        return update;
    }

    componentDidMount() {
        const c_canvas = this.m_dirRef.current;
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
            this.draw(0, 0); // target_deg, bearing_deg
        }

        // Set initial update state to 1 to indicate component is mounted and ready
        this.setState({ 'm_update': 1 });
    }

    componentDidUpdate() {
        // Redraw the canvas whenever the component updates (due to m_update state change)
        this.draw(this.c_target_bearing, this.c_nav_bearing);
    }

    componentWillUnmount() {
        // Unsubscribe from event emitter to prevent memory leaks
        // Corrected: unsubscribe from EE_unitNavUpdated, not EE_onProxyInfoUpdated
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitNavUpdated, this);
        // Clear the mock data interval
        if (this.mockDataInterval) {
            clearInterval(this.mockDataInterval);
        }
    }

    fn_update(p_me, p_andruavUnit) {
        try {
            // Check if the update is for the correct unit
            if (p_me.props.p_unit && p_me.props.p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return;

            // Update instance variables with new bearing data
            p_me.c_target_bearing = p_andruavUnit.m_Nav_Info._Target.target_bearing;
            p_me.c_nav_bearing = p_andruavUnit.m_Nav_Info.p_Desired.nav_bearing;

            // Trigger a re-render by updating the m_update state
            p_me.setState({ 'm_update': p_me.state.m_update + 1 });
        } catch (ex) {
            console.error("Error in fn_update:", ex);
        }
    }

    draw(target_deg, bearing_deg) {
        const c_ctx = this.m_canvasContext;
        if (!c_ctx) return; // Ensure context is available

        const { centerX, centerY, radius, width, height } = this.m_canvasDimensions;

        c_ctx.clearRect(0, 0, width, height); // Clear the entire canvas

        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, 0, js_helpers.CONST_PTx2); // Draw full circle
        c_ctx.lineWidth = 3;
        c_ctx.strokeStyle = '#2cb1e1';
        c_ctx.stroke();

        // Convert degrees to radians for drawing, applying the -90 degree offset
        // This offset aligns 0 degrees (North) with the top of the circle.
        let v_target_start = (target_deg - 4 - 90) * js_helpers.CONST_DEGREE_TO_RADIUS;
        let v_target_end = (target_deg + 4 - 90) * js_helpers.CONST_DEGREE_TO_RADIUS;

        let v_bearing_start = (bearing_deg - 3 - 90) * js_helpers.CONST_DEGREE_TO_RADIUS;
        let v_bearing_end = (bearing_deg + 3 - 90) * js_helpers.CONST_DEGREE_TO_RADIUS;

        // 1- Bearing (Green Arc)
        c_ctx.beginPath();
        c_ctx.moveTo(centerX, centerY);
        c_ctx.arc(centerX, centerY, radius, v_bearing_start, v_bearing_end, false);
        c_ctx.fillStyle = '#36AB36';
        c_ctx.fill();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = '#36AB36';
        c_ctx.closePath();
        c_ctx.stroke();

        // 2- Target (White Arc - to override tip of bearing)
        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, v_target_start, v_target_end, false);
        c_ctx.lineWidth = 3;
        c_ctx.fillStyle = '#FFFFFF'; // Fill for a solid white segment
        c_ctx.strokeStyle = '#FFFFFF'; // Stroke for the outline
        c_ctx.closePath(); // Close path to fill the segment
        c_ctx.fill(); // Fill the segment
        c_ctx.stroke(); // Stroke the outline
    }

    render() {
        return (
            <div key={this.key + 'dir'} className='css_hud_div'>
                <div className='row al_l css_margin_zero'>
                    <canvas
                        key={this.key + 'cdir'}
                        id='ctrl_target_bearing'
                        ref={this.m_dirRef}
                        className='css_target_bearing'
                    ></canvas>
                </div>
            </div>
        );
    }
}
