import React from 'react';
import { withTranslation } from 'react-i18next';


import * as js_helpers from '../../js/js_helpers.js'
import * as js_common from '../../js/js_common.js'

import { ClssCtrlUnitIcon } from '../gadgets/jsc_ctrl_unit_icon.jsx'




import {
    fn_changeUnitInfo,
    fn_gotoUnit_byPartyID,
} from '../../js/js_main.js'



/**
 * This is the bar control that contains Drone Icon, Camera, Video, Battery and Name 
 */
class ClssCtrlUnitPlanningBar extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
        };

    }


    /**
     * deceide image and temprature text
     * 
     * @param {*} p_andruavUnit 
     * @returns   { m_battery_src: v_battery_src, css:v_bat,level:batteryLevel, charging: charging_res, temp: temp_res}
     */
    hlp_getBatteryCSSClass(p_andruavUnit) {
        const p_Power = p_andruavUnit.m_Power;

        if ((p_andruavUnit.m_IsDisconnectedFromGCS === true) || (p_andruavUnit.m_IsShutdown === true) || (p_Power._Mobile.p_Battery.p_hasPowerInfo === false))
            return { v_battery_src: "/public/images/battery_gy_32x32.png", css: "battery_inactive", level: 0, charging: ' ', temp: ' ' };

        let v_bat = p_Power._Mobile.p_Battery.PlugStatus + " ";
        const batteryLevel = p_Power._Mobile.p_Battery.BatteryLevel;
        let v_battery_src = "/public/images/battery_gy_32x32.png";

        if (parseInt(batteryLevel, 0) > 80) {
            v_bat += ' battery_4 ';
            v_battery_src = "/public/images/battery_g_32x32.png";
        }
        else if (parseInt(batteryLevel, 0) > 50) {
            v_bat += ' battery_3 ';
            v_battery_src = "/public/images/battery_rg_32x32.png";

        }
        else if (parseInt(batteryLevel, 0) > 25) {
            v_bat += ' battery_2 ';
            v_battery_src = "/public/images/battery_rg_3_32x32.png";

        }
        else {
            v_bat += ' battery_1 ';
            v_battery_src = "/public/images/battery_r_32x32.png";

        }

        let temp_res = ' ? °C';
        if (p_Power._Mobile.p_Battery.BatteryTemperature !== null && p_Power._Mobile.p_Battery.BatteryTemperature !== undefined) {
            temp_res = ' ' + p_Power._Mobile.p_Battery.BatteryTemperature + '°C';
        }

        let charging_res = ' ';
        if (p_Power._Mobile.p_Battery.PlugStatus !== null && p_Power._Mobile.p_Battery.PlugStatus !== undefined) {
            charging_res = p_Power._Mobile.p_Battery.PlugStatus
        }
        return { m_battery_src: v_battery_src, css: v_bat, level: batteryLevel, charging: charging_res, temp: temp_res };
    }


    hlp_getFCBBatteryCSSClass(p_andruavUnit) {
        let v_battery_display_fcb_div = "";
        let v_battery_src = "/public/images/battery_gy_32x32.png";
        const p_Power = p_andruavUnit.m_Power;

        let v_remainingBat = p_Power._FCB.p_Battery.FCB_BatteryRemaining;
        let v_bat = " ";

        if ((p_andruavUnit.m_IsDisconnectedFromGCS === true) || (p_andruavUnit.m_IsShutdown === true) || (p_andruavUnit.m_Power._FCB.p_Battery.p_hasPowerInfo === false)) {
            v_battery_display_fcb_div = " hidden ";
            return { v_battery_src: "/public/images/battery_gy_32x32.png", css: v_bat, level: v_remainingBat, charging: 'unknown', v_battery_display_fcb_div: v_battery_display_fcb_div };
        }

        if (p_Power._FCB.p_Battery.p_hasPowerInfo === false) return null;

        if (parseInt(v_remainingBat, 0) > 80) {
            v_bat += ' battery_4 ';
            v_battery_src = "/public/images/battery_g_32x32.png";
        }
        else if (parseInt(v_remainingBat, 0) > 50) {
            v_bat += ' battery_3 ';
            v_battery_src = "/public/images/battery_rg_32x32.png";
        }
        else if (parseInt(v_remainingBat, 0) > 25) {
            v_bat += ' battery_2 ';
            v_battery_src = "/public/images/battery_rg_3_32x32.png";
        }
        else {
            v_bat += ' battery_1 ';
            v_battery_src = "/public/images/battery_r_32x32.png";
        }

        return { m_battery_src: v_battery_src, css: v_bat, level: v_remainingBat, charging: 'unknown', v_battery_display_fcb_div: v_battery_display_fcb_div };
    }


    render() {
        const { t } = this.props; // Access t function
        let v_andruavUnit = this.props.p_unit;

        if (v_andruavUnit === null || v_andruavUnit === undefined) return;

        let online_comment = "no signal info";
        let online_class;
        let online_class2;
        let online_text;
        let v_battery_display_fcb = this.hlp_getFCBBatteryCSSClass(v_andruavUnit);
        let v_battery_display = this.hlp_getBatteryCSSClass(v_andruavUnit);
        const id = v_andruavUnit.getPartyID() + "_c_u_p_b";

        const module_version = v_andruavUnit.module_version();

        if ((v_andruavUnit.m_IsDisconnectedFromGCS === true) || (v_andruavUnit.m_IsShutdown === true)) {
            online_class2 = " blink_offline ";
            online_class = " blink_offline ";
            online_text = "offline";
        }
        else {
            if (v_andruavUnit.m_isArmed === true) {
                online_class2 = " text-info ";
                online_class = " bg-none blink_alert";
                online_text = t('armed');
            }
            else {
                online_class2 = " text-info ";
                online_class = " blink_success ";
                online_text = "online";
            }



            if ((v_andruavUnit.m_IsDisconnectedFromGCS !== true) || (v_andruavUnit.m_IsShutdown !== true)) {
                if ((v_andruavUnit.m_SignalStatus.mobile === true)) {
                    //mobileNetworkType
                    //NETWORK_TYPE_LTE
                    let level = v_andruavUnit.m_SignalStatus.mobileSignalLevel;
                    if (v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank < js_helpers.CONST_TELEPHONE_400G) {
                        if (level < -100) {
                            online_class = " badge badge-default ";
                        } else if ((level < -95) || (v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank <= js_helpers.CONST_TELEPHONE_200G)) {
                            online_class = " badge badge-danger ";
                        } else if ((level < -80) || (v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank <= js_helpers.CONST_TELEPHONE_250G)) {  // or condition
                            online_class = " badge badge-warning ";
                        } else if ((level < -70) || (v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank <= js_helpers.CONST_TELEPHONE_300G)) {
                            online_class = " badge badge-info ";
                        } else if (level < -60) {
                            online_class = " badge badge-primary ";
                        } else {
                            online_class = " badge badge-success ";
                        }
                    }
                    else {
                        if (level < -140) {
                            online_class = " badge badge-default ";
                        } else if (level < -124) {
                            online_class = " badge badge-danger ";
                        } else if (level < -108) {
                            online_class = " badge badge-warning ";
                        } else if (level < -92) {
                            online_class = " badge badge-info ";
                        } else if (level < -80) {
                            online_class = " badge badge-primary ";
                        } else {
                            online_class = " badge badge-success ";
                        }
                    }

                    online_comment = js_helpers.v_NETWORK_G_TYPE[v_andruavUnit.m_SignalStatus.mobileNetworkTypeRank] + " [" + js_helpers.v_NETWORK_G_TYPE[v_andruavUnit.m_SignalStatus.mobileNetworkType] + "] " + level + " dbm";

                }
                else {
                    online_comment = "no signal info";
                }
            }
        }
        js_common.fn_console_log("online_comment:" + online_comment);

        let rows = [];
        let sys_id = "";

        if (v_andruavUnit.m_FCBParameters.m_systemID !== 0) {
            sys_id = ':' + v_andruavUnit.m_FCBParameters.m_systemID + ' ';
        }
        if ((v_andruavUnit.m_IsDisconnectedFromGCS === false) && (v_andruavUnit.m_IsShutdown === false) && (v_andruavUnit.m_Power._FCB.p_Battery.p_hasPowerInfo === true)) {
            if (v_andruavUnit.m_isDE !== true) {
                rows.push(<div key={id + "__5"} className='col-1  padding_zero'><img className={v_battery_display.css} src={v_battery_display.m_battery_src} title={'Andruav batt: ' + v_battery_display.level + '% ' + v_battery_display.charging + v_battery_display.temp} /></div>);
            }
            // add FCB battery
            rows.push(<div key={id + "fc1"} className="col-1 padding_zero"><img className={v_battery_display_fcb.css} src={v_battery_display_fcb.m_battery_src} title={"fcb batt: " + parseFloat(v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryRemaining).toFixed(1) + '% ' + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryVoltage / 1000).toFixed(2).toString() + "v " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryCurrent / 1000).toFixed(1).toString() + "A " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_TotalCurrentConsumed).toFixed(1).toString() + " mAh " + (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryTemprature / 1000).toFixed(1).toString() + '°C'} /></div>);
            rows.push(<div key={id + "fc2"} className="col-1 padding_zero" onClick={(e) => fn_gotoUnit_byPartyID(v_andruavUnit)} ></div>);
            rows.push(<div key={id + "fc3"} className="col-4 padding_zero text-end" onClick={(e) => fn_gotoUnit_byPartyID(v_andruavUnit)} ><p id='id' className={'cursor_hand text-right ' + online_class2} title={module_version} onClick={(e) => fn_changeUnitInfo(v_andruavUnit)} ><strong>{v_andruavUnit.m_unitName} </strong> {sys_id}<span className={' ' + online_class}>{online_text}</span></p></div>);
        }
        else {
            if (v_andruavUnit.m_isDE !== true) {
                rows.push(<div key={id + "__5"} className='col-1  padding_zero'><img className={v_battery_display.css} src={v_battery_display.m_battery_src} title={'Andruav batt: ' + v_battery_display.level + '% ' + v_battery_display.charging + v_battery_display.temp} /></div>);
            }
            // add FCB battery
            rows.push(<div key={id + "fc4"} className="col-2 padding_zero" onClick={(e) => fn_gotoUnit_byPartyID(v_andruavUnit)} ></div>);
            rows.push(<div key={id + "fc5"} className="col-4 padding_zero text-end" onClick={(e) => fn_gotoUnit_byPartyID(v_andruavUnit)} ><p id='id' className={'cursor_hand text-right ' + online_class2} title={module_version} onClick={(e) => fn_changeUnitInfo(v_andruavUnit)}><strong>{v_andruavUnit.m_unitName + " "}</strong><span className={' ' + online_class}>{online_text}</span></p></div>);
        }

        return (
            <div key={id + "_1"} id={id + "_1"} className='row margin_2px padding_zero user-select-none '>
                <div key={id + "__1"} className='col-1  padding_zero d-flex '><ClssCtrlUnitIcon p_unit={v_andruavUnit} /></div>
                <div key={id + "__2"} className='col-1  padding_zero d-none d-sm-flex'></div>
                <div key={id + "__3"} className='col-1  padding_zero d-none d-sm-flex'></div>
                <div key={id + "__4"} className='col-1  padding_zero d-none d-sm-flex'></div>

                {rows}
            </div>
        );
    }
}


export default withTranslation()(ClssCtrlUnitPlanningBar);