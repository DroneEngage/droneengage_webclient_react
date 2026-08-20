import React from 'react';
import { withTranslation } from 'react-i18next';
import { js_globals } from '../../js/js_globals.js';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import * as js_helpers from '../../js/js_helpers.js';
import { fn_do_modal_alert } from '../../js/js_main.js';
import ClssCVideoCanvasLabel from '../video/jsc_videoCanvasLabel.jsx';

class ClssCtrlDistanceToMeControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update: 0,
            m_opacity: ClssCVideoCanvasLabel.defaultProps.opacity
        };
        this.key = Math.random().toString();
    }

    componentDidMount() {
        js_eventEmitter.fn_subscribe(js_event.EE_unitNavUpdated, this, this.fn_update);
        js_eventEmitter.fn_subscribe(js_event.EE_Opacity_Control, this, this.fn_EE_changeOpacity);
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitNavUpdated, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_Opacity_Control, this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.m_update !== nextState.m_update) return true;
        if (this.state.m_opacity !== nextState.m_opacity) return true;

        if (this.props.p_unit !== nextProps.p_unit) return true;
        if (this.props.isHUD !== nextProps.isHUD) return true;
        if (this.props.p_compact !== nextProps.p_compact) return true;

        return false;
    }

    fn_update(p_me, p_andruavUnit) {
        if (p_me.props.p_unit && p_andruavUnit.getPartyID() === p_me.props.p_unit.getPartyID()) {
            p_me.setState({ m_update: p_me.state.m_update + 1 });
        }
    }

    fn_EE_changeOpacity(me, params) {
        if (params && params.opacity !== undefined) {
            me.setState({ 'm_opacity': params.opacity });
        }
    }

    // Compact (mobile): tap to request browser location if not known.
    // Uses the standard navigator.geolocation API which triggers the
    // browser's native "allow location access" permission prompt.
    // When permission is denied (or previously refused) the browser will
    // not show the prompt again, so we inform the user via the standard
    // webclient alert dialog instead of failing silently.
    fn_requestMyLocation() {
        if (js_globals.myposition != null) return;
        if (!navigator.geolocation) {
            fn_do_modal_alert(
                this.props.t('unit_control_imu:distance.locationDeniedTitle'),
                this.props.t('unit_control_imu:distance.locationUnsupported')
            );
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                js_globals.myposition = position;
                this.setState({ m_update: this.state.m_update + 1 });
            },
            () => {
                js_globals.myposition = null;
                this.setState({ m_update: this.state.m_update + 1 });
                // PERMISSION_DENIED (also returned when the user previously
                // selected "Block", in which case the browser no longer
                // prompts). Inform the user how to re-enable it.
                fn_do_modal_alert(
                    this.props.t('unit_control_imu:distance.locationDeniedTitle'),
                    this.props.t('unit_control_imu:distance.locationDeniedMessage'),
                    null,
                    this.props.t('unit_control_imu:distance.locationDeniedOk'),
                    'bg-warning'
                );
            }
        );
    }

    render() {
        const { t, p_unit } = this.props;

        // Compact (mobile) mode: always render a grid cell, even with no unit,
        // so the mobile telemetry grid layout stays consistent.
        if (this.props.p_compact === true && !p_unit) {
            return (
                <div className="mobile-telemetry-item">
                    <span className="mobile-tel-label">{t('unit_control_imu:distance.label')}</span>
                    <span className="mobile-tel-value">N/A</span>
                </div>
            );
        }

        if (!p_unit) return null;

        let v_distanceToMe_text;
        let v_distanceToMe_class;
        let v_distance_val = "NA"; // For HUD
        let v_distance_unit = ""; // For HUD

        if (p_unit.m_Nav_Info.p_Location.lat === null || p_unit.m_Nav_Info.p_Location.lat === undefined) {
            v_distanceToMe_class = "bg-danger text-white cursor_hand";
            v_distanceToMe_text = t('unit_control_imu:distance.noUnitGPS');
            v_distance_val = "No GPS";
        } else if (js_globals.myposition === null || js_globals.myposition === undefined) {
            v_distanceToMe_text = t('unit_control_imu:distance.noGCSGPS');
            v_distanceToMe_class = "bg-danger text-white cursor_hand";
            v_distance_val = "No GCS";
        } else {
            const v_lat2 = p_unit.m_Nav_Info.p_Location.lat;
            const v_lng2 = p_unit.m_Nav_Info.p_Location.lng;
            const distance = js_helpers.fn_calcDistance(js_globals.myposition.coords.latitude, js_globals.myposition.coords.longitude, v_lat2, v_lng2);
            
            if (js_globals.v_useMetricSystem === true) {
                const KM_1 = 1000;
                if (distance >= KM_1) {
                    const val = (distance / 1000).toFixed(1);
                    v_distanceToMe_text = Number(val).toLocaleString() + t('unit_control_imu:distance.km');
                    v_distance_val = val;
                    v_distance_unit = "km";
                } else {
                    const val = distance.toFixed(0);
                    v_distanceToMe_text = Number(val).toLocaleString() + t('unit_control_imu:distance.m');
                    v_distance_val = val;
                    v_distance_unit = "m";
                }
            } else {
                const MILE_1 = 5280;
                if (distance * js_helpers.CONST_METER_TO_FEET >= MILE_1) {
                    const val = (distance * js_helpers.CONST_METER_TO_FEET / MILE_1).toFixed(1);
                    v_distanceToMe_text = Number(val).toLocaleString() + t('unit_control_imu:distance.mi');
                    v_distance_val = val;
                    v_distance_unit = "mi";
                } else {
                    const val = (distance * js_helpers.CONST_METER_TO_FEET).toFixed(0);
                    v_distanceToMe_text = Number(val).toLocaleString() + t('unit_control_imu:distance.ft');
                    v_distance_val = val;
                    v_distance_unit = "ft";
                }
            }

            if (distance > js_globals.CONST_DFM_FAR) {
                v_distanceToMe_class = "bg-danger text-white cursor_hand";
            } else if (distance > js_globals.CONST_DFM_SAFE) {
                v_distanceToMe_class = "bg-info text-white";
            } else {
                v_distanceToMe_class = "bg-success text-white";
            }
        }

        // HUD MODE
        if (this.props.isHUD === true) {
             return (
                <ClssCVideoCanvasLabel
                    x={this.props.x}
                    y={this.props.y}
                    originX={this.props.originX}
                    originY={this.props.originY}
                    width={this.props.width}
                    height={this.props.height}
                    style={this.props.style}
                    css_class={this.props.css_class}

                    backgroundColor={this.props.backgroundColor || ClssCVideoCanvasLabel.defaultProps.background_color}
                    opacity={this.state.m_opacity}
                    borderRadius={this.props.borderRadius || '6px'}
                    padding={this.props.padding}
                    pointerEvents={this.props.pointerEvents || 'none'}

                    p_title={{ text: 'Dist:', color: ClssCVideoCanvasLabel.defaultProps.title_color }}
                    p_value={{ text: v_distance_val, color: ClssCVideoCanvasLabel.defaultProps.value_color }}
                    p_unit={{ text: v_distance_unit, color: ClssCVideoCanvasLabel.defaultProps.unit_color }}
                />
             );
        }

        // COMPACT (mobile) MODE: renders as a mobile-telemetry-item cell.
        // Tapping it requests browser location if not known (standard
        // navigator.geolocation API -> native permission prompt).
        if (this.props.p_compact === true) {
            let v_mobile_cls = 'success';
            if (v_distanceToMe_class.indexOf('bg-danger') >= 0) v_mobile_cls = 'danger';
            else if (v_distanceToMe_class.indexOf('bg-info') >= 0) v_mobile_cls = 'warn';

            return (
                <div
                    className={`mobile-telemetry-item mobile-tel-clickable ${v_mobile_cls}`}
                    onClick={() => this.fn_requestMyLocation()}
                    title={t('unit_control_imu:distance.title')}
                >
                    <span className="mobile-tel-label">{t('unit_control_imu:distance.label')}</span>
                    <span className="mobile-tel-value">{v_distanceToMe_text}</span>
                </div>
            );
        }

        return (
            <p
                id={this.props.id || "DFM"}
                className={this.props.className || ('rounded-3 text-center textunit_att_btn p-1 ' + v_distanceToMe_class)}
                title={t('unit_control_imu:distance.title')}
            >
                {t('unit_control_imu:distance.label') + ': ' + v_distanceToMe_text}
            </p>
        );
    }
}

export default withTranslation('unit_control_imu')(ClssCtrlDistanceToMeControl);
