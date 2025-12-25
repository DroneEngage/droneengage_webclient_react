import React from 'react';
import { js_globals } from '../../js/js_globals.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js'
import {EVENTS as js_event} from '../../js/js_eventList.js'

export default class ClssCVideoTrackerLayer extends React.Component {

    constructor(props) {
        super(props);
        
        this.m_canvasRef = React.createRef();
        this.m_resizeObserver = null;
        this.m_raf_id = null;
        this.m_timerID = null;
        
        this.fnl_handleResize = this.fnl_handleResize.bind(this);
        this.fn_targetDetected = this.fn_targetDetected.bind(this);
    }

    componentDidMount() {
        this.fn_syncCanvasSize();
        
        window.addEventListener('resize', this.fnl_handleResize);
        js_eventEmitter.fn_subscribe(js_event.EE_DetectedTarget, this, this.fn_targetDetected);

        const c_video = this.props.p_videoRef && this.props.p_videoRef.current;
        if (c_video && window.ResizeObserver) {
            this.m_resizeObserver = new ResizeObserver(() => {
                this.fnl_handleResize();
            });
            this.m_resizeObserver.observe(c_video);
        }
    }

    componentDidUpdate() {
        this.fn_syncCanvasSize();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.fnl_handleResize);
        js_eventEmitter.fn_unsubscribe(js_event.EE_DetectedTarget, this);
        
        if (this.m_resizeObserver) {
            this.m_resizeObserver.disconnect();
            this.m_resizeObserver = null;
        }

        if (this.m_raf_id) {
            cancelAnimationFrame(this.m_raf_id);
            this.m_raf_id = null;
        }

        if (this.m_timerID) {
            cancelAnimationFrame(this.m_timerID);
            this.m_timerID = null;
        }
    }

    fn_targetDetected(p_me, p_unit) {
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) {
            return;
        }

        // We expect p_obj to contain v_unit (unit partyID)
        if (!p_me.props.p_obj || p_me.props.p_obj.v_unit !== p_unit.getPartyID()) {
            return;
        }

        p_me.fnl_drawTargets(p_unit.m_DetectedTargets.m_targets);
    }

    fnl_drawTargets(p_targets) {
        if (this.m_timerID) cancelAnimationFrame(this.m_timerID);

        const c_canvas = this.m_canvasRef.current;
        if (!c_canvas) return;

        const c_ctx = c_canvas.getContext('2d');
        if (!c_ctx) return;

        // Note: The context is already scaled by DPR and reset in fn_syncCanvasSize
        // We need to clear based on logical size (or simpler, just clear huge rect or use reset)
        // Since we are using transforms, we should clear 0,0 to width,height in LOGICAL coordinates.
        // However, fn_syncCanvasSize sets the scale. 
        // Let's rely on the width/height attributes of the canvas which are physical pixels.
        // But we are drawing in "logical" 0..width coords if we didn't scale?
        // Wait, in fn_syncCanvasSize I did: ctx.scale(dpr, dpr).
        // So drawing operations should use logical pixels (CSS pixels).
        // But the previous implementation used `p_target.x1 * c_canvas.width`.
        // c_canvas.width is the PHYSICAL width (CSS width * DPR).
        // If the context is scaled by DPR, we should multiply by CSS width, not physical width.
        // Let's get CSS width.
        const cssWidth = c_canvas.width / (window.devicePixelRatio || 1);
        const cssHeight = c_canvas.height / (window.devicePixelRatio || 1);

        // Clear everything
        c_ctx.clearRect(0, 0, cssWidth, cssHeight);

        c_ctx.font = "bold 12px Arial";
        c_ctx.textAlign = "center";
        
        // Style: Green dashed border with semi-transparent green background
        c_ctx.strokeStyle = '#00FF00';
        c_ctx.lineWidth = 2;
        c_ctx.setLineDash([6, 3]); 

        // Debug log to confirm new code is running
        console.log("ClssCVideoTrackerLayer: drawing targets (Green)", p_targets);

        const c_list = p_targets.m_list;
        const c_len = c_list.length;
        for (let i = 0; i < c_len; ++i) {
            const p_target = c_list[i];
            const c_x1 = p_target.x1 * cssWidth;
            const c_y1 = p_target.y1 * cssHeight;
            const c_x2 = p_target.x2 * cssWidth;
            const c_y2 = p_target.y2 * cssHeight;
            
            // Draw background
            c_ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            c_ctx.fillRect(c_x1, c_y1, c_x2, c_y2);

            // Draw border
            c_ctx.strokeRect(c_x1, c_y1, c_x2, c_y2);
            
            // Draw text
            c_ctx.fillStyle = "yellow";
            c_ctx.fillText(p_target.m_name, c_x1 + c_x2 / 2, c_y1 + c_y2 / 2);
        }

        this.m_timerID = requestAnimationFrame(() => {
            c_ctx.clearRect(0, 0, cssWidth, cssHeight);
        });
    }

    fnl_handleResize() {
        if (this.m_raf_id) cancelAnimationFrame(this.m_raf_id);
        this.m_raf_id = requestAnimationFrame(() => {
            this.m_raf_id = null;
            this.fn_syncCanvasSize();
        });
    }

    fn_syncCanvasSize() {
        const c_canvas = this.m_canvasRef.current;
        const c_video = this.props.p_videoRef && this.props.p_videoRef.current;
        // We need container to calculate relative position if video is centered
        // Actually, if we are absolute 0,0 inside container, we need to match video's offsetLeft/Top
        // But the video might be transformed. 
        // Simplest: match video's bounding rect relative to container's bounding rect.
        // We assume this component is rendered inside the same container as the video.
        
        if (!c_canvas || !c_video) return;
        
        // Find the common offset parent (container)
        const c_container = c_video.offsetParent;
        if (!c_container) return;

        const vr = c_video.getBoundingClientRect();
        const cr = c_container.getBoundingClientRect();

        if (vr.width <= 0 || vr.height <= 0) return;

        const dpr = window.devicePixelRatio || 1;
        const px_width = Math.max(1, Math.round(vr.width * dpr));
        const px_height = Math.max(1, Math.round(vr.height * dpr));

        // Sync logical size
        if ((c_canvas.width !== px_width) || (c_canvas.height !== px_height)) {
            c_canvas.width = px_width;
            c_canvas.height = px_height;
        }

        // Sync visual size and position
        c_canvas.style.width = vr.width + 'px';
        c_canvas.style.height = vr.height + 'px';
        c_canvas.style.left = (vr.left - cr.left) + 'px';
        c_canvas.style.top = (vr.top - cr.top) + 'px';

        // Reset transform and apply DPR scale
        // Note: The parent video component applies rotation/mirror to the video element via style.transform.
        // We need to match that? 
        // The previous simple <canvas> inherited style={video_style}, so it got the same transform.
        // But if we are positioning by rect, we are "post-transform" in a way?
        // No, getBoundingClientRect gives the transformed box.
        // If we overlay a box on the transformed video, we don't need to apply transform again 
        // UNLESS the content needs to be rotated.
        // The tracker logic draws rectangles (x1, y1, x2, y2). 
        // If the video is rotated 90deg, the "top-left" of the visual video is different.
        // However, the original code used a canvas with the same transform class/style.
        // If we use this absolute positioning approach, we are creating an axis-aligned box over the visual video.
        // This is usually what we want for overlaying UI on the *result* of the video.
        // So we probably don't need to apply this.props.p_videoStyle here if we match rects.
        // BUT, we need to scale context for DPR.
        
        const ctx = c_canvas.getContext('2d');
        if (ctx) {
             ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
             ctx.scale(dpr, dpr);
        }
    }

    render() {
        const { zIndex, pointerEvents } = this.props;
        return (
            <canvas
                id={this.props.id}
                ref={this.m_canvasRef}
                className={this.props.className}
                style={{
                    position: 'absolute',
                    pointerEvents: pointerEvents || 'none',
                    zIndex: zIndex || 'auto'
                }}
            />
        );
    }
}
