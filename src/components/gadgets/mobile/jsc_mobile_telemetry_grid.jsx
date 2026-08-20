import React from 'react';
import { withTranslation } from 'react-i18next';

import { CONST_METER_TO_FEET } from '../../../js/js_helpers.js';
import { fn_changeAltitude, fn_changeSpeed } from '../../../js/js_main.js';
import ClssCtrlDistanceToMeControl from '../jsc_ctrl_distance_to_me_control.jsx';

/**
 * Mobile telemetry grid - compact 3-column strip showing Battery, GPS, DFM,
 * Altitude, Speed and Waypoint status for the selected unit.
 *
 * Follows the same approach as ClssCtrlDroneIMU (jsc_unit_control_imu.jsx):
 *  - Class component wrapped in withTranslation.
 *  - Self-contained helper methods that derive display data from the andruavUnit.
 *  - Bootstrap contextual classes (bg-danger/bg-warning/bg-success) for status,
 *    adapted to the mobile grid via the .mobile-telemetry-item layout classes.
 *
 * DFM is rendered by the shared ClssCtrlDistanceToMeControl in p_compact mode,
 * which also handles tap-to-enable-browser-location.
 */
class ClssMobileTelemetryGrid extends React.Component {
    constructor(props) {
        super(props);
        this.state = { m_update: 0 };
    }

    // -- Battery -----------------------------------------------------------
    hlp_getBattery(p_andruavUnit) {
        if (!p_andruavUnit) return { pct: null, cls: '' };
        const batt = p_andruavUnit.m_Power._FCB.p_Battery;
        if (batt.p_hasPowerInfo) {
            return { pct: batt.FCB_BatteryRemaining, cls: '' };
        }
        const mobileBatt = p_andruavUnit.m_Power._Mobile.p_Battery;
        if (mobileBatt.p_hasPowerInfo && mobileBatt.BatteryLevel != null) {
            return { pct: mobileBatt.BatteryLevel, cls: '' };
        }
        return { pct: null, cls: '' };
    }

    // -- GPS ---------------------------------------------------------------
    hlp_getGPS(p_andruavUnit) {
        if (!p_andruavUnit) return { fix: 'No GPS', sats: 0, valid: false, cls: 'danger' };
        const gps = p_andruavUnit.m_GPS_Info1;
        if (!gps.m_isValid) return { fix: 'No GPS', sats: 0, valid: false, cls: 'danger' };
        const fixTexts = { 0: 'No Fix', 1: 'No Fix', 2: '2D', 3: '3D', 4: 'DGPS', 5: 'RTK-F', 6: 'RTK-F', 7: 'Static', 8: 'PPP' };
        const fix = fixTexts[gps.GPS3DFix] || 'No Fix';
        let cls = 'success';
        if (fix === 'No Fix' || fix === 'No GPS') cls = 'danger';
        else if (fix === '2D') cls = 'warn';
        return { fix, sats: gps.m_satCount || 0, valid: true, cls };
    }

    // -- Altitude ----------------------------------------------------------
    hlp_getAltitude(p_andruavUnit) {
        if (!p_andruavUnit || p_andruavUnit.m_Nav_Info.p_Location.alt_relative == null) return null;
        const alt = p_andruavUnit.m_Nav_Info.p_Location.alt_relative;
        if (this.props.p_isMetricSystem) return { value: alt.toFixed(0), unit: 'm' };
        return { value: (alt * CONST_METER_TO_FEET).toFixed(0), unit: 'ft' };
    }

    // -- Speed -------------------------------------------------------------
    hlp_getSpeed(p_andruavUnit) {
        if (!p_andruavUnit || p_andruavUnit.m_Nav_Info.p_Location.ground_speed == null) return null;
        const spd = p_andruavUnit.m_Nav_Info.p_Location.ground_speed;
        if (this.props.p_isMetricSystem) return { value: spd.toFixed(0), unit: 'm/s' };
        return { value: (spd * CONST_METER_TO_FEET).toFixed(0), unit: 'ft/s' };
    }

    // -- Waypoint ----------------------------------------------------------
    hlp_getWaypoint(p_andruavUnit) {
        if (!p_andruavUnit) return { current: 0, count: 0 };
        const target = p_andruavUnit.m_Nav_Info._Target;
        return { current: target.wp_num || 0, count: target.wp_count || 0 };
    }

    render() {
        const { p_unit, p_visible } = this.props;
        if (!p_visible) return null;

        const v_battery = this.hlp_getBattery(p_unit);
        const v_gps     = this.hlp_getGPS(p_unit);
        const v_alt     = this.hlp_getAltitude(p_unit);
        const v_speed   = this.hlp_getSpeed(p_unit);
        const v_wp      = this.hlp_getWaypoint(p_unit);

        return (
            <div className="mobile-telemetry" id="mobile-telemetry-grid">
                <div id="mobile-tel-battery" className={`mobile-telemetry-item ${v_battery.cls}`}>
                    <span className="mobile-tel-label">Battery</span>
                    <span className="mobile-tel-value">
                        {v_battery.pct != null ? `${v_battery.pct}%` : 'N/A'}
                    </span>
                </div>
                <div id="mobile-tel-gps" className={`mobile-telemetry-item ${v_gps.cls}`}>
                    <span className="mobile-tel-label">GPS</span>
                    <span className="mobile-tel-value">{v_gps.fix}</span>
                    <span className="mobile-tel-unit">{v_gps.sats > 0 ? `${v_gps.sats} sats` : ''}</span>
                </div>
                <ClssCtrlDistanceToMeControl p_unit={p_unit} p_compact={true} />
                <div id="mobile-tel-altitude" className="mobile-telemetry-item mobile-tel-clickable" onClick={() => p_unit && fn_changeAltitude(p_unit)}>
                    <span className="mobile-tel-label">Altitude</span>
                    <span className="mobile-tel-value">
                        {v_alt ? v_alt.value : 'N/A'}
                    </span>
                    {v_alt && <span className="mobile-tel-unit">{v_alt.unit}</span>}
                </div>
                <div id="mobile-tel-speed" className="mobile-telemetry-item mobile-tel-clickable" onClick={() => p_unit && fn_changeSpeed(p_unit)}>
                    <span className="mobile-tel-label">Speed</span>
                    <span className="mobile-tel-value">
                        {v_speed ? v_speed.value : 'N/A'}
                    </span>
                    {v_speed && <span className="mobile-tel-unit">{v_speed.unit}</span>}
                </div>
                <div id="mobile-tel-waypoint" className="mobile-telemetry-item">
                    <span className="mobile-tel-label">Waypoint</span>
                    <span className="mobile-tel-value">
                        {v_wp.current > 0 ? `#${v_wp.current}` : '--'}
                    </span>
                    {v_wp.count > 0 && <span className="mobile-tel-unit">/ {v_wp.count}</span>}
                </div>
            </div>
        );
    }
}

export default withTranslation('home')(ClssMobileTelemetryGrid);
