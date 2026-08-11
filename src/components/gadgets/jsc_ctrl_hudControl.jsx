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
        if (this.m_themeObserver) {
            this.m_themeObserver.disconnect();
            this.m_themeObserver = null;
        }
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

        // Watch for theme switches: applyThemeClass() adds a `theme-<name>` class
        // to document.body. When that changes, invalidate the cached palette and
        // trigger a redraw so the HUD adapts to the active Bootswatch theme.
        this.m_themeColors = null;
        if (typeof MutationObserver !== 'undefined' && document.body) {
            this.m_themeObserver = new MutationObserver((p_mutations) => {
                for (const m of p_mutations) {
                    if (m.attributeName === 'class') {
                        this.m_themeColors = null;
                        this.setState({ 'm_update': this.state.m_update + 1 });
                        return;
                    }
                }
            });
            this.m_themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
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

    /**
     * Parse any CSS color string into {r, g, b} by letting the browser normalize
     * it via a temporary element's computed style.
     */
    fn_parseColor(p_color) {
        try {
            if (!p_color) return null;
            const v_el = document.createElement('div');
            v_el.style.color = p_color;
            v_el.style.display = 'none';
            document.body.appendChild(v_el);
            const v_computed = getComputedStyle(v_el).color; // normalized to rgb(r, g, b)
            document.body.removeChild(v_el);
            const m = v_computed.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
            if (!m) return null;
            return { r: +m[1], g: +m[2], b: +m[3] };
        } catch (ex) {
            return null;
        }
    }

    /**
     * Determine whether the active theme is dark by measuring the luminance of
     * the theme's body background (`--bs-body-bg`).
     */
    fn_isDarkTheme() {
        try {
            const v_root = getComputedStyle(document.documentElement);
            const v_bg = v_root.getPropertyValue('--bs-body-bg').trim();
            const v_rgb = this.fn_parseColor(v_bg || '#222222');
            if (!v_rgb) return true;
            // Relative luminance (Rec. 601 weighting)
            const v_lum = (0.299 * v_rgb.r + 0.587 * v_rgb.g + 0.114 * v_rgb.b) / 255;
            return v_lum < 0.5;
        } catch (ex) {
            return true;
        }
    }

    /**
     * Resolve a theme-aware, high-contrast palette for the HUD.
     * Sky/ground keep the classic aviation attitude-indicator look (blue/brown)
     * with intensity adjusted for dark vs light themes; overlay elements use the
     * active theme's CSS variables so they stay legible across all Bootswatch themes.
     * The result is cached and only recomputed when the theme changes.
     */
    fn_resolveThemeColors() {
        if (this.m_themeColors) return this.m_themeColors;

        const v_dark = this.fn_isDarkTheme();
        const v_root = getComputedStyle(document.documentElement);
        const fn_var = (p_name, p_fallback) => {
            const v = v_root.getPropertyValue(p_name).trim();
            return v || p_fallback;
        };

        // Aviation-standard sky/ground, intensity tuned per theme for contrast.
        // Values are pushed to high saturation so the attitude ball stays readable
        // against any Bootswatch body background.
        const v_sky       = v_dark ? '#0d3b6b' : '#2f6fb8';
        const v_skyBorder = v_dark ? '#7fc4ff' : '#0d3b6b';
        const v_ground    = v_dark ? '#5a3a1a' : '#7a4a1a';

        // Overlay elements derive from theme variables for cross-theme legibility.
        // Fallbacks are intentionally saturated to pop against the sky/ground fills.
        const v_yaw     = fn_var('--bs-warning', v_dark ? '#ffb700' : '#d96900');
        const v_horizon = fn_var('--bs-body-color', v_dark ? '#ffffff' : '#0a0a0a');
        const v_center  = fn_var('--bs-danger',  v_dark ? '#ff3b30' : '#b30000');

        this.m_themeColors = {
            sky: v_sky,
            skyBorder: v_skyBorder,
            ground: v_ground,
            yaw: v_yaw,
            horizon: v_horizon,
            center: v_center,
        };
        return this.m_themeColors;
    }

    draw(p_pitch_rad, p_roll_rad, p_yaw_rad) {
        const c_ctx = this.m_canvasContext;
        if (!c_ctx) return; // Ensure context is available

        const { centerX, centerY, radius, width, height } = this.m_canvasDimensions;
        const v_fullCircle = js_helpers.CONST_PTx2;
        const v_colors = this.fn_resolveThemeColors();

        c_ctx.clearRect(0, 0, width, height); // Clear the entire canvas

        c_ctx.save();
        c_ctx.translate(centerX, centerY);
        c_ctx.rotate(p_roll_rad);

        const v_pitchNormalized = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, p_pitch_rad));
        const v_pitchOffset = (v_pitchNormalized / (Math.PI / 2)) * radius;

        // SKY
        c_ctx.beginPath();
        c_ctx.arc(0, 0, radius, 0, v_fullCircle);
        c_ctx.fillStyle = v_colors.sky;
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = v_colors.skyBorder;
        c_ctx.stroke();

        // Ground fill clipped to the HUD circle and shifted by pitch
        c_ctx.save();
        c_ctx.beginPath();
        c_ctx.arc(0, 0, radius, 0, v_fullCircle);
        c_ctx.clip();

        const v_groundTop = Math.min(v_pitchOffset, radius);
        const v_groundHeight = Math.max(0, radius - v_groundTop);
        if (v_groundHeight > 0) {
            c_ctx.fillStyle = v_colors.ground;
            c_ctx.fillRect(-radius, v_groundTop, radius * 2, v_groundHeight);
        }
        c_ctx.restore();

        c_ctx.restore();

        // Yaw Indicator (offset by -90 degrees to align 0 degrees with top)
        const v_yawOffset = 90 * js_helpers.CONST_DEGREE_TO_RADIUS;
        const v_yawSweep = 3 * js_helpers.CONST_DEGREE_TO_RADIUS;
        const v_yaw_start = p_yaw_rad - v_yawSweep - v_yawOffset;
        const v_yaw_end = p_yaw_rad + v_yawSweep - v_yawOffset;

        c_ctx.beginPath();
        c_ctx.moveTo(centerX, centerY);
        c_ctx.arc(centerX, centerY, radius, v_yaw_start, v_yaw_end, false);
        c_ctx.closePath();
        c_ctx.fillStyle = v_colors.yaw;
        c_ctx.fill();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = v_colors.yaw;
        c_ctx.stroke();

        // Static aircraft reference horizon (diameter, unaffected by pitch/roll)
        c_ctx.beginPath();
        c_ctx.moveTo(centerX - radius, centerY);
        c_ctx.lineTo(centerX + radius, centerY);
        c_ctx.lineWidth = 1.5;
        c_ctx.strokeStyle = v_colors.horizon;
        c_ctx.stroke();

        // Center Dot remains fixed on screen center.
        // Drawn with a contrasting outline so it pops against both sky and ground.
        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, 2.5, 0, v_fullCircle, false);
        c_ctx.fillStyle = v_colors.center;
        c_ctx.fill();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = v_colors.horizon;
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
                        <li><span className='txt-theme-aware'>R:</span><span className='css_hud_value text-info'>{this.c_roll}º</span></li>
                        <li><span className='txt-theme-aware'>P:</span><span className='css_hud_value text-info'>{this.c_pitch}º</span></li>
                        <li><span className='txt-theme-aware'>Y:</span><span className='css_hud_value text-info'>{this.c_yaw}º</span></li>
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