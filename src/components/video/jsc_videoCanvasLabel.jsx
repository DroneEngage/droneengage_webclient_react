import React from 'react';
import { js_eventEmitter } from '../../js/js_eventEmitter'
import { EVENTS as js_event } from '../../js/js_eventList.js'

export default class ClssCVideoCanvasLabel extends React.Component {

    constructor(props) {
        super(props);

        this.m_canvasRef = React.createRef();
        this.m_containerRef = React.createRef();
        
        this.state = {
            m_opacity: this.props.opacity !== undefined ? this.props.opacity : 0.8
        };

        this.m_resizeObserver = null;
        this.m_raf_id = null;

        this.fnl_handleResize = this.fnl_handleResize.bind(this);
        js_eventEmitter.fn_subscribe(js_event.EE_Opacity_Control, this, this.fn_EE_changeOpacity);
                
    }

    fn_EE_changeOpacity(me, params) {
        if (params && params.opacity !== undefined) {
            me.setState({ m_opacity: params.opacity }, () => {
                me.fn_draw();
            });
        }
    }

    componentDidMount() {
        this.fn_syncCanvasSize();
        
        window.addEventListener('resize', this.fnl_handleResize);

        const c_container = this.m_containerRef.current;
        if (c_container && window.ResizeObserver) {
            this.m_resizeObserver = new ResizeObserver(() => {
                this.fnl_handleResize();
            });
            this.m_resizeObserver.observe(c_container);
        }

        this.fn_draw();
    }

    componentDidUpdate() {
        this.fn_syncCanvasSize();
        this.fn_draw();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.fnl_handleResize);
        js_eventEmitter.fn_unsubscribe(js_event.EE_Opacity_Control, this);
        
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
        if (this.m_raf_id) cancelAnimationFrame(this.m_raf_id);
        this.m_raf_id = requestAnimationFrame(() => {
            this.m_raf_id = null;
            this.fn_syncCanvasSize();
            this.fn_draw();
        });
    }

    fn_syncCanvasSize() {
        const c_canvas = this.m_canvasRef.current;
        const c_container = this.m_containerRef.current;
        
        if (!c_canvas || !c_container) return;
        
        const cr = c_container.getBoundingClientRect();

        if (cr.width <= 0 || cr.height <= 0) return;

        const dpr = window.devicePixelRatio || 1;
        
        // CSS size
        const css_width = cr.width;
        const css_height = cr.height;

        // Physical size
        const px_width = Math.max(1, Math.round(css_width * dpr));
        const px_height = Math.max(1, Math.round(css_height * dpr));

        if ((c_canvas.width !== px_width) || (c_canvas.height !== px_height)) {
            c_canvas.width = px_width;
            c_canvas.height = px_height;
        }
    }

    /**
     * Helper to measure and draw text segment
     * @param {CanvasRenderingContext2D} ctx 
     * @param {String} text 
     * @param {String} color 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Boolean} draw - if false, only measures
     * @returns {Number} width of text
     */
    fn_drawSegment(ctx, text, color, x, y, draw = true) {
        if (!text) return 0;
        
        ctx.fillStyle = color || 'white';
        if (draw) {
            ctx.fillText(text, x, y);
        }
        return ctx.measureText(text).width;
    }

    fn_draw() {
        const c_canvas = this.m_canvasRef.current;
        if (!c_canvas) return;

        const ctx = c_canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = c_canvas.width;   // physical pixels
        const height = c_canvas.height; // physical pixels

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Setup common font settings
        // Scale font by DPR
        // Using a base font size of 14px (approx) - allow override?
        const fontSize = (this.props.fontSize || 14) * dpr;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textBaseline = 'middle';

        // Extract props
        const p_title = this.props.p_title || {};
        const p_value = this.props.p_value || {};
        const p_unit = this.props.p_unit || {};

        const s_title = p_title.text || '';
        const s_value = p_value.text || '';
        const s_unit = p_unit.text || '';
        
        const c_title = p_title.color || '#AAAAAA'; // Default gray for title
        const c_value = p_value.color || '#FFFFFF'; // Default white for value
        const c_unit = p_unit.color || '#AAAAAA';   // Default gray for unit

        // Calculate total width to center the text block
        // We need to measure first
        let totalWidth = 0;
        const gap = 4 * dpr; // Gap between segments

        totalWidth += this.fn_drawSegment(ctx, s_title, c_title, 0, 0, false);
        if (s_title && (s_value || s_unit)) totalWidth += gap;
        
        totalWidth += this.fn_drawSegment(ctx, s_value, c_value, 0, 0, false);
        if (s_value && s_unit) totalWidth += gap;
        
        totalWidth += this.fn_drawSegment(ctx, s_unit, c_unit, 0, 0, false);

        // Center position
        let currentX = (width - totalWidth) / 2;
        const currentY = height / 2;

        // Draw Title
        if (s_title) {
            const w = this.fn_drawSegment(ctx, s_title, c_title, currentX, currentY, true);
            currentX += w + gap;
        }

        // Draw Value
        if (s_value) {
            const w = this.fn_drawSegment(ctx, s_value, c_value, currentX, currentY, true);
            currentX += w + gap;
        }

        // Draw Unit
        if (s_unit) {
            this.fn_drawSegment(ctx, s_unit, c_unit, currentX, currentY, true);
        }
    }

    render() {
        const css_class = this.props.css_class || '';
        
        // Default style
        const style = {
            position: 'relative',
            width: '100%',
            height: '100%',
            ...this.props.style 
        };

        // If x or y are provided, switch to absolute positioning
        if (this.props.x !== undefined || this.props.y !== undefined) {
            style.position = 'absolute';
            if (this.props.x !== undefined) style.left = this.props.x;
            if (this.props.y !== undefined) style.top = this.props.y;
            // Ensure zIndex is high enough if not specified
            if (style.zIndex === undefined) style.zIndex = 10;
        }

        // Apply width/height if provided directly
        if (this.props.width !== undefined) style.width = this.props.width;
        if (this.props.height !== undefined) style.height = this.props.height;

        // Apply visual properties
        if (this.props.backgroundColor !== undefined) style.backgroundColor = this.props.backgroundColor;
        
        // Use state for opacity to support dynamic updates
        style.opacity = this.state.m_opacity;

        if (this.props.borderRadius !== undefined) style.borderRadius = this.props.borderRadius;
        if (this.props.padding !== undefined) style.padding = this.props.padding;
        if (this.props.pointerEvents !== undefined) style.pointerEvents = this.props.pointerEvents;

        return (
            <div 
                ref={this.m_containerRef}
                className={css_class}
                style={style}
            >
                <canvas
                    ref={this.m_canvasRef}
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '100%'
                    }}
                />
            </div>
        );
    }
}
