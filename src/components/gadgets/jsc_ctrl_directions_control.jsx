import React, { useState, useRef, useCallback, useEffect } from 'react';

import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import { useEventSubscription } from '../../js/hooks/useEventSubscription.js'

import * as js_helpers from '../../js/js_helpers.js'

/**
 * Canvas-drawn bearing indicator. target_bearing/nav_bearing only drive an
 * imperative canvas draw (they are never rendered as JSX text), so they
 * stay in a ref rather than state - only a tick bump (on EE_unitNavUpdated
 * for this unit) triggers the redraw effect, matching the original
 * fn_update -> setState({m_update}) -> componentDidUpdate -> draw() chain.
 */
function draw(c_ctx, dims, target_deg, bearing_deg) {
    if (!c_ctx) return; // Ensure context is available

    const { centerX, centerY, radius, width, height } = dims;

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

export function ClssCtrlDirections({ p_unit }) {
    const key = useState(() => Math.random().toString())[0];
    const [tick, setTick] = useState(0);

    const dirRef = useRef(null);
    const bearingsRef = useRef({ target: 0, nav: 0 });
    const canvasCtxRef = useRef(null);
    const canvasDimsRef = useRef({ width: 0, height: 0, centerX: 0, centerY: 0, radius: 0 });

    const fn_update = useCallback((p_andruavUnit) => {
        try {
            if (p_unit && p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return;
            bearingsRef.current = {
                target: p_andruavUnit.m_Nav_Info._Target.target_bearing,
                nav: p_andruavUnit.m_Nav_Info.p_Desired.nav_bearing,
            };
            setTick((t) => t + 1);
        } catch (ex) {
            console.error("Error in fn_update:", ex);
        }
    }, [p_unit]);

    useEventSubscription(js_event.EE_unitNavUpdated, fn_update);

    // One-time canvas setup + initial draw, mirroring the original's
    // componentDidMount.
    useEffect(() => {
        const c_canvas = dirRef.current;
        if (!c_canvas) return;

        c_canvas.width = 50;
        c_canvas.height = 50;
        c_canvas.style.width = '50px';
        c_canvas.style.height = '50px';

        canvasCtxRef.current = c_canvas.getContext('2d');
        canvasDimsRef.current = {
            width: c_canvas.width,
            height: c_canvas.height,
            centerX: c_canvas.width / 2,
            centerY: c_canvas.height / 2,
            radius: 22,
        };

        draw(canvasCtxRef.current, canvasDimsRef.current, 0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Redraw whenever a matching EE_unitNavUpdated ticks, mirroring the
    // original's componentDidUpdate.
    useEffect(() => {
        if (tick === 0) return; // initial draw already done above
        draw(canvasCtxRef.current, canvasDimsRef.current, bearingsRef.current.target, bearingsRef.current.nav);
    }, [tick]);

    return (
        <div key={key + 'dir'} className='css_hud_div'>
            <div className='row al_l css_margin_zero'>
                <canvas
                    key={key + 'cdir'}
                    id='ctrl_target_bearing'
                    ref={dirRef}
                    className='css_target_bearing'
                ></canvas>
            </div>
        </div>
    );
}
