import React    from 'react';

import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'

import * as js_helpers from '../../js/js_helpers.js'

export default class ClssCVideoHUDOverlay extends React.Component {

    constructor(props)
    {
        super(props);

        this.state = {
            'm_update': 0,
            'm_opacity': 0.8 // Default opacity
        };

        this.key = Math.random().toString();

        this.m_canvasRef = React.createRef();

        this.c_yaw = 0;
        this.c_pitch = 0;
        this.c_roll = 0;

        this.m_canvasContext = null;
        this.m_canvasDimensions = null;
        this.m_hudSize = 160;

        this.fnl_handleResize = this.fnl_handleResize.bind(this);

        js_eventEmitter.fn_subscribe (js_event.EE_unitNavUpdated,this,this.fn_update);
        js_eventEmitter.fn_subscribe(js_event.EE_Opacity_Control, this, this.fn_EE_changeOpacity);

        this.m_resizeObserver = null;
        this.m_raf_id = null;
    }

    fn_EE_changeOpacity(me, params) {
        if (params && params.opacity !== undefined) {
            me.setState({ 'm_opacity': params.opacity });
        }
    }


    shouldComponentUpdate(nextProps, nextState) {
        const update = (this.state.m_update != nextState.m_update) || (this.state.m_opacity !== nextState.m_opacity);

        return update;
    }


    componentDidMount() {
        const c_canvas = this.m_canvasRef.current;
        if (c_canvas) {
            this.m_canvasContext = c_canvas.getContext('2d');
        }

        this.fn_syncCanvasSize();

        window.addEventListener('resize', this.fnl_handleResize);

        const c_container = this.props.p_containerRef && this.props.p_containerRef.current;
        if (c_container && window.ResizeObserver) {
            this.m_resizeObserver = new ResizeObserver(() => {
                this.fn_syncCanvasSize();
                if (this.m_raf_id) cancelAnimationFrame(this.m_raf_id);
                this.m_raf_id = requestAnimationFrame(() => {
                    if (this.m_raf_id) this.m_raf_id = null;
                    this.setState({ 'm_update': this.state.m_update + 1 });
                });
            });
            this.m_resizeObserver.observe(c_container);
        }

        this.setState({ 'm_update': 1 });
    }


    componentDidUpdate() {
        this.fn_syncCanvasSize();

        this.draw(
            this.c_pitch * js_helpers.CONST_DEGREE_TO_RADIUS,
            -this.c_roll * js_helpers.CONST_DEGREE_TO_RADIUS,
            this.c_yaw * js_helpers.CONST_DEGREE_TO_RADIUS
        );
    }


    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_event.EE_unitNavUpdated,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_Opacity_Control, this);

        window.removeEventListener('resize', this.fnl_handleResize);

        if (this.m_resizeObserver) {
            this.m_resizeObserver.disconnect();
            this.m_resizeObserver = null;
        }

        if (this.m_raf_id) {
            cancelAnimationFrame(this.m_raf_id);
            this.m_raf_id = null;
        }
    }


    fnl_handleResize() {
        this.fn_syncCanvasSize();
        if (this.m_raf_id) cancelAnimationFrame(this.m_raf_id);
        this.m_raf_id = requestAnimationFrame(() => {
            if (this.m_raf_id) this.m_raf_id = null;
            this.setState({ 'm_update': this.state.m_update + 1 });
        });
    }


    fn_syncCanvasSize() {
        const c_canvas = this.m_canvasRef.current;
        const c_container = this.props.p_containerRef && this.props.p_containerRef.current;

        if (!c_canvas || !c_container) return;

        const cr = c_container.getBoundingClientRect();

        if (cr.width <= 0 || cr.height <= 0) return;

        const dpr = window.devicePixelRatio || 1;

        const v_min = Math.min(cr.width, cr.height);

        let hudSize = Math.floor(v_min * 0.22);
        hudSize = Math.max(110, Math.min(200, hudSize));
        hudSize = Math.min(hudSize, Math.floor(cr.width - 16));
        hudSize = Math.min(hudSize, Math.floor(cr.height - 16));
        hudSize = Math.max(80, hudSize);

        this.m_hudSize = hudSize;

        const px_width = Math.max(1, Math.round(hudSize * dpr));
        const px_height = Math.max(1, Math.round(hudSize * dpr));

        if ((c_canvas.width !== px_width) || (c_canvas.height !== px_height)) {
            c_canvas.width = px_width;
            c_canvas.height = px_height;
        }

        c_canvas.style.width = '100%';
        c_canvas.style.height = '100%';

        this.m_canvasDimensions = {
            width: hudSize,
            height: hudSize
        };

        if (this.m_canvasContext) {
            this.m_canvasContext.setTransform(1, 0, 0, 1, 0, 0);
            this.m_canvasContext.scale(dpr, dpr);
        }
    }


    fn_update (p_me,p_andruavUnit)
    {
        try {
            if (p_me.props.p_unit && p_me.props.p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return;

            p_me.c_yaw = (js_helpers.CONST_RADIUS_TO_DEGREE * ((p_andruavUnit.m_Nav_Info.p_Orientation.yaw + js_helpers.CONST_PTx2) % js_helpers.CONST_PTx2)).toFixed(1);
            p_me.c_pitch = (js_helpers.CONST_RADIUS_TO_DEGREE * p_andruavUnit.m_Nav_Info.p_Orientation.pitch).toFixed(1);
            p_me.c_roll = (js_helpers.CONST_RADIUS_TO_DEGREE * p_andruavUnit.m_Nav_Info.p_Orientation.roll).toFixed(1);

            p_me.setState({ 'm_update': p_me.state.m_update + 1 });
        } catch (ex) {
            console.error("Error in fn_update:", ex);
        }
    }


    draw(p_pitch_rad, p_roll_rad, p_yaw_rad) {
        const c_ctx = this.m_canvasContext;
        if (!c_ctx) return;
        if (!this.m_canvasDimensions) return;

        const width = this.m_canvasDimensions.width;
        const height = this.m_canvasDimensions.height;

        c_ctx.clearRect(0, 0, width, height);

        c_ctx.save();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        c_ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
        c_ctx.restore();

        const radius = Math.max(22, Math.min(width, height) * 0.35);
        const centerX = width * 0.5;
        const centerY = height * 0.6;

        const v_fullCircle = js_helpers.CONST_PTx2;

        c_ctx.save();
        c_ctx.translate(centerX, centerY);
        c_ctx.rotate(p_roll_rad);

        const v_pitchNormalized = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, p_pitch_rad));
        const v_pitchOffset = (v_pitchNormalized / (Math.PI / 2)) * radius;

        c_ctx.beginPath();
        c_ctx.arc(0, 0, radius, 0, v_fullCircle);
        c_ctx.fillStyle = 'rgba(117, 164, 211, 0.75)';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = 'rgba(44, 177, 225, 1.0)';
        c_ctx.stroke();

        c_ctx.save();
        c_ctx.beginPath();
        c_ctx.arc(0, 0, radius, 0, v_fullCircle);
        c_ctx.clip();

        const v_groundTop = Math.min(v_pitchOffset, radius);
        const v_groundHeight = Math.max(0, radius - v_groundTop);
        if (v_groundHeight > 0) {
            c_ctx.fillStyle = 'rgba(117, 211, 117, 0.75)';
            c_ctx.fillRect(-radius, v_groundTop, radius * 2, v_groundHeight);
        }
        c_ctx.restore();

        c_ctx.restore();

        const v_yawOffset = 90 * js_helpers.CONST_DEGREE_TO_RADIUS;
        const v_yawSweep = 3 * js_helpers.CONST_DEGREE_TO_RADIUS;
        const v_yaw_start = p_yaw_rad - v_yawSweep - v_yawOffset;
        const v_yaw_end = p_yaw_rad + v_yawSweep - v_yawOffset;

        c_ctx.beginPath();
        c_ctx.moveTo(centerX, centerY);
        c_ctx.arc(centerX, centerY, radius, v_yaw_start, v_yaw_end, false);
        c_ctx.fillStyle = 'rgba(243, 219, 227, 0.75)';
        c_ctx.fill();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = 'rgba(243, 219, 227, 1.0)';
        c_ctx.closePath();
        c_ctx.stroke();

        c_ctx.beginPath();
        c_ctx.moveTo(centerX - radius, centerY);
        c_ctx.lineTo(centerX + radius, centerY);
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = 'rgba(240, 173, 78, 1.0)';
        c_ctx.stroke();

        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, 2, 0, v_fullCircle, false);
        c_ctx.fillStyle = 'rgba(218, 126, 183, 1.0)';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = 'rgba(218, 126, 183, 1.0)';
        c_ctx.stroke();

        c_ctx.font = '13px Arial';
        c_ctx.textAlign = 'left';
        c_ctx.fillStyle = 'rgba(255,255,255,1.0)';

        const tx = 6;
        const ty = 16;

        c_ctx.shadowColor = "black";
        c_ctx.shadowBlur = 4;
        c_ctx.lineWidth = 3;

        c_ctx.fillText('R: ' + this.c_roll + 'º', tx, ty);
        c_ctx.fillText('P: ' + this.c_pitch + 'º', tx, ty + 16);
        c_ctx.fillText('Y: ' + this.c_yaw + 'º', tx, ty + 32);

        c_ctx.shadowBlur = 0;
    }


    render ()
    {
        const hudSize = this.m_hudSize || 160;

        return (
            <div
                key={this.key + 'video_hud_overlay'}
                style={{
                    position: 'absolute',
                    right: '8px',
                    bottom: '118px',
                    width: hudSize + 'px',
                    height: hudSize + 'px',
                    backgroundColor: 'rgba(60, 60, 60, 0.35)',
                    borderRadius: '6px',
                    pointerEvents: 'none',
                    zIndex: 200,
                    opacity: this.state.m_opacity
                }}
            >
                <canvas
                    ref={this.m_canvasRef}
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                ></canvas>
            </div>
        );
    }

}
