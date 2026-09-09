import React, { useState, useRef, useEffect } from 'react';

import { useUnitField } from '../../js/hooks/useUnitField.js'

import * as js_helpers from '../../js/js_helpers.js'

/**
 * Parse any CSS color string into {r, g, b} by letting the browser normalize
 * it via a temporary element's computed style.
 */
function fn_parseColor(p_color) {
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
function fn_isDarkTheme() {
    try {
        const v_root = getComputedStyle(document.documentElement);
        const v_bg = v_root.getPropertyValue('--bs-body-bg').trim();
        const v_rgb = fn_parseColor(v_bg || '#222222');
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
 * The result is cached (in themeColorsRef) and only recomputed when the theme changes.
 */
function fn_resolveThemeColors(themeColorsRef) {
    if (themeColorsRef.current) return themeColorsRef.current;

    const v_dark = fn_isDarkTheme();
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

    themeColorsRef.current = {
        sky: v_sky,
        skyBorder: v_skyBorder,
        ground: v_ground,
        yaw: v_yaw,
        horizon: v_horizon,
        center: v_center,
    };
    return themeColorsRef.current;
}

function draw(c_ctx, dims, themeColorsRef, p_pitch_rad, p_roll_rad, p_yaw_rad) {
    if (!c_ctx) return; // Ensure context is available

    const { centerX, centerY, radius, width, height } = dims;
    const v_fullCircle = js_helpers.CONST_PTx2;
    const v_colors = fn_resolveThemeColors(themeColorsRef);

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

export function ClssCtrlHUD({ id, p_unit }) {
    const key = useState(() => Math.random().toString())[0];
    const [, setTick] = useState(0);

    const hudRef = useRef(null);
    const canvasCtxRef = useRef(null);
    const canvasDimsRef = useRef({ width: 0, height: 0, centerX: 0, centerY: 0, radius: 0 });
    const themeColorsRef = useRef(null);

    // Field-granular re-render: only re-render when the displayed orientation
    // fields change, not on every coarse EE_unitNavUpdated for the whole unit.
    // setTick is retained for the theme-change observer below.
    const _partyId = p_unit?.getPartyID();
    useUnitField(_partyId, 'm_Nav_Info.p_Orientation.yaw');
    useUnitField(_partyId, 'm_Nav_Info.p_Orientation.pitch');
    useUnitField(_partyId, 'm_Nav_Info.p_Orientation.roll');

    // One-time canvas setup + initial draw + theme observer, mirroring the
    // original's componentDidMount/componentWillUnmount pair.
    useEffect(() => {
        const c_canvas = hudRef.current;
        if (c_canvas) {
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

            draw(canvasCtxRef.current, canvasDimsRef.current, themeColorsRef, 0, 0, 0);
        }

        // Watch for theme switches: applyThemeClass() adds a `theme-<name>` class
        // to document.body. When that changes, invalidate the cached palette and
        // trigger a redraw so the HUD adapts to the active Bootswatch theme.
        let themeObserver = null;
        if (typeof MutationObserver !== 'undefined' && document.body) {
            themeObserver = new MutationObserver((p_mutations) => {
                for (const m of p_mutations) {
                    if (m.attributeName === 'class') {
                        themeColorsRef.current = null;
                        setTick((t) => t + 1);
                        return;
                    }
                }
            });
            themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }

        return () => {
            if (themeObserver) themeObserver.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const v_andruavUnit = p_unit;
    const c_yaw = (js_helpers.CONST_RADIUS_TO_DEGREE * ((v_andruavUnit.m_Nav_Info.p_Orientation.yaw + js_helpers.CONST_PTx2) % js_helpers.CONST_PTx2)).toFixed(1);
    const c_pitch = ((js_helpers.CONST_RADIUS_TO_DEGREE * v_andruavUnit.m_Nav_Info.p_Orientation.pitch)).toFixed(1);
    const c_roll = ((js_helpers.CONST_RADIUS_TO_DEGREE * v_andruavUnit.m_Nav_Info.p_Orientation.roll)).toFixed(1);

    // Redraw whenever the rendered orientation changes (triggered either by
    // a matching EE_unitNavUpdated tick or a theme-change tick), mirroring
    // the original's componentDidUpdate.
    useEffect(() => {
        draw(
            canvasCtxRef.current,
            canvasDimsRef.current,
            themeColorsRef,
            c_pitch * js_helpers.CONST_DEGREE_TO_RADIUS, // Convert pitch to radians
            -c_roll * js_helpers.CONST_DEGREE_TO_RADIUS,  // Convert roll to radians and negate
            c_yaw * js_helpers.CONST_DEGREE_TO_RADIUS     // Convert yaw to radians
        );
    }, [c_pitch, c_roll, c_yaw]);

    return (
        <div key={key + 'hud'} id={id} className='css_hud_div'>
            <div className='col-6  css_margin_zero d-flex '>
                <ul className='css_hud_bullets'>
                    <li><span className='txt-theme-aware'>R:</span><span className='css_hud_value text-info'>{c_roll}º</span></li>
                    <li><span className='txt-theme-aware'>P:</span><span className='css_hud_value text-info'>{c_pitch}º</span></li>
                    <li><span className='txt-theme-aware'>Y:</span><span className='css_hud_value text-info'>{c_yaw}º</span></li>
                </ul>
                <canvas
                    key={key + 'chud'}
                    id='ctrl_hud'
                    ref={hudRef}
                    className='col-6  css_margin_zero css_padding_zero'
                ></canvas>
            </div>
        </div>
    );
}
