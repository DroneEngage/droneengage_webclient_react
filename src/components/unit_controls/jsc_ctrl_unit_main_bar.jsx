import React from 'react';
import * as js_session from '../../js/state/session.js';
import { withTranslation } from 'react-i18next';

import * as js_helpers from '../../js/helpers/js_helpers.js'
import * as js_andruavUnit from '../../js/model/js_andruavUnit.js';
import * as js_common from '../../js/helpers/js_common.js'

import { subscribeUnitField } from '../../js/store/unitStore.js';
import { js_dialogs } from '../../js/app/dialogService.js'
import { ClssCtrlUnitIcon } from '../gadgets/jsc_ctrl_unit_icon.jsx'
import { js_stillImageStore } from '../../js/storage/js_stillImageStore.js';
import { EventBridge } from '../../js/hooks/EventBridge.jsx';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';




import {
  fn_changeUnitInfo,
  fn_gotoUnit_byPartyID,
  toggleVideo,
  toggleRecrodingVideo,
  fn_changeUnitPathColor
} from '../../js/app/js_main.js'

import { flightPath_colors } from '../../js/config/assets.js'



/**
 * This is the bar control that contains Drone Icon, Camera, Video, Battery and Name 
 */
class ClssCtrlUnitMainBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      m_update: 0,
      m_storedImageCount: 0,
    };
    this.m_flag_mounted = false;
    this.m_unsubs = [];
  }

  componentDidMount() {
    this.m_flag_mounted = true;
    // Field-granular: re-render only when a field this row actually reads
    // changes, replacing the coarse EE_unitUpdated/EE_unitPowUpdated
    // triggers entirely (see TASK-16).
    const partyId = this.props.p_unit?.getPartyID();
    if (partyId) {
      const fields = [
        'm_Power._Mobile.p_Battery.BatteryLevel',
        'm_Power._Mobile.p_Battery.PlugStatus',
        'm_Power._Mobile.p_Battery.p_hasPowerInfo',
        'm_Power._Mobile.p_Battery.Voltage',
        'm_Power._Mobile.p_Battery.Health',
        'm_isArmed',
        'm_IsDisconnectedFromGCS',
        'm_IsShutdown',
        'm_SignalStatus.m_mobile',
        'm_SignalStatus.m_mobileSignalLevel',
        'm_SignalStatus.m_mobileNetworkType',
        'm_SignalStatus.m_mobileNetworkTypeRank',
        'm_unitName',
        'm_FCBParameters.m_systemID',
        'm_Video.m_videoactiveTracks',
        'm_Video.VideoRecording',
        'm_modules.m_list',
        'm_Permissions',
        'm_pathColor',
      ];
      for (const fp of fields) {
        this.m_unsubs.push(subscribeUnitField(partyId, fp, () => this.fn_onUpdate(this.props.p_unit)));
      }
    }

    // Stored still images live in IndexedDB, outside the unit store, so the
    // badge has its own EE_stillImagesChanged subscription via the
    // EventBridge sibling in render().
    this.fn_refreshStoredImageCount();
  }

  fn_onStillImagesChanged(p_data) {
    const partyId = this.props.p_unit?.getPartyID();
    if (p_data != null && p_data.partyId && partyId && p_data.partyId !== partyId) return; // not me
    this.fn_refreshStoredImageCount();
  }

  /**
   * Read the number of still images stored for this unit and refresh the
   * badge shown next to the camera icon.
   */
  fn_refreshStoredImageCount() {
    const partyId = this.props.p_unit?.getPartyID();
    if (!partyId) return;

    js_stillImageStore.fn_getImageCount(partyId).then((p_count) => {
      if (this.m_flag_mounted === false) return;
      if (p_count === this.state.m_storedImageCount) return;
      this.setState({ m_storedImageCount: p_count });
    }).catch((e) => {
      js_common.fn_console_log('Stored image count error: ' + e);
    });
  }

  fn_getPathColor() {
    const v_andruavUnit = this.props.p_unit;
    if (!v_andruavUnit) return flightPath_colors[0];
    return v_andruavUnit.m_pathColor || flightPath_colors[v_andruavUnit.m_index % 4];
  }

  fn_changePathColor(p_andruavUnit, p_color) {
    fn_changeUnitPathColor(p_andruavUnit, p_color);
  }

  componentWillUnmount() {
    this.m_flag_mounted = false;
    for (const fn of this.m_unsubs) fn();
    this.m_unsubs = [];
  }

  fn_toggleCamera(p_andruavUnit) {
    function fn_callback(p_session) {
      if (p_session?.status === 'connected') {
        js_dialogs.fn_showCamera(p_session);
      }
    }
    js_session.fn_getAndruavFacade().API_requestCameraList(p_andruavUnit, fn_callback);
  }

  fn_onUpdate(p_andruavUnit) {
    if (p_andruavUnit === null || p_andruavUnit === undefined) return;
    if (p_andruavUnit.getPartyID() !== this.props.p_unit.getPartyID()) return; // not me
    if (this.m_flag_mounted === false) return;
    this.setState({ m_update: this.state.m_update + 1 });
  }

  hlp_getBatteryCSSClass(p_andruavUnit) {
    const { t } = this.props; // Access t function
    const p_Power = p_andruavUnit.m_Power;

    if (
      p_andruavUnit.m_IsDisconnectedFromGCS === true ||
      p_andruavUnit.m_IsShutdown === true ||
      p_Power._Mobile.p_Battery.p_hasPowerInfo === false
    ) {
      return {
        v_battery_src: '/public/images/battery_gy_32x32.png',
        css: 'battery_inactive',
        level: 0,
        charging: ' ',
        temp: ' ',
      };
    }

    let v_bat = p_Power._Mobile.p_Battery.PlugStatus + ' ';
    const batteryLevel = p_Power._Mobile.p_Battery.BatteryLevel;
    let v_battery_src = '/public/images/battery_gy_32x32.png';

    if (parseInt(batteryLevel, 0) > 80) {
      v_bat += ' battery_4 ';
      v_battery_src = '/public/images/battery_g_32x32.png';
    } else if (parseInt(batteryLevel, 0) > 50) {
      v_bat += ' battery_3 ';
      v_battery_src = '/public/images/battery_rg_32x32.png';
    } else if (parseInt(batteryLevel, 0) > 25) {
      v_bat += ' battery_2 ';
      v_battery_src = '/public/images/battery_rg_3_32x32.png';
    } else {
      v_bat += ' battery_1 ';
      v_battery_src = '/public/images/battery_r_32x32.png';
    }

    let temp_res = t('unitBar:noTemperature', { defaultValue: ' ? °C' });
    if (p_Power._Mobile.p_Battery.BatteryTemperature != null) {
      temp_res = ` ${p_Power._Mobile.p_Battery.BatteryTemperature}°C`;
    }

    let charging_res = ' ';
    if (p_Power._Mobile.p_Battery.PlugStatus != null) {
      charging_res = p_Power._Mobile.p_Battery.PlugStatus;
    }

    return {
      m_battery_src: v_battery_src,
      css: v_bat,
      level: batteryLevel,
      charging: charging_res,
      temp: temp_res,
    };
  }

  hlp_getFCBBatteryCSSClass(p_andruavUnit) {
    let v_battery_display_fcb_div = '';
    let v_battery_src = '/public/images/battery_gy_32x32.png';
    const p_Power = p_andruavUnit.m_Power;
    let v_remainingBat = p_Power._FCB.p_Battery.FCB_BatteryRemaining;
    let v_bat = ' ';

    if (
      p_andruavUnit.m_IsDisconnectedFromGCS === true ||
      p_andruavUnit.m_IsShutdown === true ||
      p_andruavUnit.m_Power._FCB.p_Battery.p_hasPowerInfo === false
    ) {
      v_battery_display_fcb_div = ' hidden ';
      return {
        v_battery_src: '/public/images/battery_gy_32x32.png',
        css: v_bat,
        level: v_remainingBat,
        charging: 'unknown',
        v_battery_display_fcb_div: v_battery_display_fcb_div,
      };
    }

    if (p_Power._FCB.p_Battery.p_hasPowerInfo === false) return null;

    if (parseInt(v_remainingBat, 0) > 80) {
      v_bat += ' battery_4 ';
      v_battery_src = '/public/images/battery_g_32x32.png';
    } else if (parseInt(v_remainingBat, 0) > 50) {
      v_bat += ' battery_3 ';
      v_battery_src = '/public/images/battery_rg_32x32.png';
    } else if (parseInt(v_remainingBat, 0) > 25) {
      v_bat += ' battery_2 ';
      v_battery_src = '/public/images/battery_rg_3_32x32.png';
    } else {
      v_bat += ' battery_1 ';
      v_battery_src = '/public/images/battery_r_32x32.png';
    }

    return {
      m_battery_src: v_battery_src,
      css: v_bat,
      level: v_remainingBat,
      charging: 'unknown',
      v_battery_display_fcb_div: v_battery_display_fcb_div,
    };
  }

  render() {
    const { t } = this.props; // Access t function
    let v_andruavUnit = this.props.p_unit;

    if (!v_andruavUnit) return null;

    let online_comment = t('unitBar:noSignalInfo'); // "no signal info"
    let online_class;
    let online_class2;
    let online_text;
    let camera_class = ' bi bi-camera css_large_icon txt-theme-aware ';
    let video_class = ' bi bi-camera-video css_large_icon txt-theme-aware ';
    let recvideo_class = ' bi bi-record-circle css_large_icon txt-theme-aware ';
    let v_battery_display_fcb = this.hlp_getFCBBatteryCSSClass(v_andruavUnit);
    let v_battery_display = this.hlp_getBatteryCSSClass(v_andruavUnit);
    const id = v_andruavUnit.getPartyID() + '_c_u_m_b';
    const module_version = v_andruavUnit.module_version();

    if (v_andruavUnit.m_IsDisconnectedFromGCS === true || v_andruavUnit.m_IsShutdown === true) {
      online_class2 = ' blink_offline ';
      online_class = ' blink_offline ';
      online_text = t('unitBar:offline'); // "offline"
    } else {
      if (v_andruavUnit.m_isArmed === true) {
        online_class2 = ' text-info ';
        online_class = ' bg-none blink_alert';
        online_text = t('armed'); // "Armed"
      } else {
        online_class2 = ' text-info ';
        online_class = ' blink_success ';
        online_text = t('unitBar:online'); // "online"
      }
      if (v_andruavUnit.fn_canCamera() === true) {
        camera_class = 'bi bi-camera-fill css_large_icon cursor_hand text-success';
      } else {
        camera_class = 'bi bi-camera css_large_icon txt-theme-aware';
      }
      if (v_andruavUnit.m_Video.fn_getVideoStreaming() === js_andruavUnit.CONST_VIDEOSTREAMING_ON) {
        if (v_andruavUnit.fn_canVideo() === true) {
          video_class = 'bi bi-camera-video-fill css_large_icon cursor_hand text-danger';
        } else {
          video_class = 'bi bi-camera-video-fill css_large_icon cursor_hand text-white';
        }
      } else {
        if (v_andruavUnit.fn_canVideo() === true) {
          video_class = 'bi bi-camera-video-fill css_large_icon cursor_hand text-primary';
          if (v_andruavUnit.m_Video.VideoRecording === js_andruavUnit.CONST_VIDEORECORDING_ON) {
            recvideo_class = 'bi bi-record-circle-fill css_large_icon cursor_hand text-danger';
          } else {
            recvideo_class = 'bi bi-record-circle-fill css_large_icon cursor_hand text-primary';
          }
        } else {
          video_class = 'bi bi-camera-video css_large_icon txt-theme-aware';
        }
      }

      if (!v_andruavUnit.m_IsDisconnectedFromGCS && !v_andruavUnit.m_IsShutdown) {
        if (v_andruavUnit.m_SignalStatus.m_mobile === true) {
          let level = v_andruavUnit.m_SignalStatus.m_mobileSignalLevel;
          if (v_andruavUnit.m_SignalStatus.m_mobileNetworkTypeRank < js_helpers.CONST_TELEPHONE_400G) {
            if (level < -100) {
              online_class = ' badge badge-default ';
            } else if (level < -95 || v_andruavUnit.m_SignalStatus.m_mobileNetworkTypeRank <= js_helpers.CONST_TELEPHONE_200G) {
              online_class = ' badge badge-danger ';
            } else if (level < -80 || v_andruavUnit.m_SignalStatus.m_mobileNetworkTypeRank <= js_helpers.CONST_TELEPHONE_250G) {
              online_class = ' badge badge-warning ';
            } else if (level < -70 || v_andruavUnit.m_SignalStatus.m_mobileNetworkTypeRank <= js_helpers.CONST_TELEPHONE_300G) {
              online_class = ' badge badge-info ';
            } else if (level < -60) {
              online_class = ' badge badge-primary ';
            } else {
              online_class = ' badge badge-success ';
            }
          } else {
            if (level < -140) {
              online_class = ' badge badge-default ';
            } else if (level < -124) {
              online_class = ' badge badge-danger ';
            } else if (level < -108) {
              online_class = ' badge badge-warning ';
            } else if (level < -92) {
              online_class = ' badge badge-info ';
            } else if (level < -80) {
              online_class = ' badge badge-primary ';
            } else {
              online_class = ' badge badge-success ';
            }
          }
          online_comment = t('unitBar:networkSignal', {
            networkType: js_helpers.v_NETWORK_G_TYPE[v_andruavUnit.m_SignalStatus.m_mobileNetworkTypeRank],
            networkName: js_helpers.v_NETWORK_G_TYPE[v_andruavUnit.m_SignalStatus.m_mobileNetworkType],
            level: level,
          }); // e.g., "4G [LTE] -90 dBm"
        }
      }
    }
    js_common.fn_console_log('online_comment:' + online_comment);

    let rows = [];
    let sys_id = '';

    if (v_andruavUnit.m_FCBParameters.m_systemID !== 0) {
      sys_id = ':' + v_andruavUnit.m_FCBParameters.m_systemID + ' ';
    }
    if (
      v_andruavUnit.m_IsDisconnectedFromGCS === false &&
      v_andruavUnit.m_IsShutdown === false &&
      v_andruavUnit.m_Power._FCB.p_Battery.p_hasPowerInfo === true
    ) {
      if (v_andruavUnit.fn_getIsDE() !== true) {
        rows.push(
          <div key={id + '__5'} className="col-1 padding_zero d-flex justify-content-center align-items-center">
            <img
              className={v_battery_display.css}
              src={v_battery_display.m_battery_src}
              title={t('unitBar:andruavBatteryTooltip', {
                level: v_battery_display.level,
                charging: v_battery_display.charging,
                temp: v_battery_display.temp,
              })}
            />
          </div>
        );
      }
      rows.push(
        <div key={id + 'fc1'} className="col-1 padding_zero d-flex justify-content-center align-items-center">
          <img
            className={v_battery_display_fcb.css}
            src={v_battery_display_fcb.m_battery_src}
            title={t('unitBar:fcbBatteryTooltip', {
              remaining: parseFloat(v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryRemaining).toFixed(1),
              voltage: (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryVoltage / 1000).toFixed(2),
              current: (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryCurrent / 1000).toFixed(1),
              consumed: (v_andruavUnit.m_Power._FCB.p_Battery.FCB_TotalCurrentConsumed).toFixed(1),
              temp: (v_andruavUnit.m_Power._FCB.p_Battery.FCB_BatteryTemprature / 1000).toFixed(1),
            })}
          />
        </div>
      );
      rows.push(
        <div key={id + 'fc2'} className="col-1 padding_zero d-flex align-items-center" onClick={() => fn_gotoUnit_byPartyID(v_andruavUnit)}></div>
      );
      rows.push(
        <div
          key={id + 'fc3'}
          className="col col-sm-4 padding_zero d-flex align-items-center justify-content-end text-end"
          style={{ minWidth: 0 }}
          onClick={() => fn_gotoUnit_byPartyID(v_andruavUnit)}
        >
          <p
            id="id"
            className={'cursor_hand text-right text-truncate w-100 mb-0 ' + online_class2}
            title={module_version}
            onClick={() => fn_changeUnitInfo(v_andruavUnit)}
          >
            <strong>{v_andruavUnit.m_unitName} </strong>
            {sys_id}
            <span className={' ' + online_class}>{online_text}</span>
          </p>
        </div>
      );
    } else {
      if (v_andruavUnit.fn_getIsDE() !== true) {
        rows.push(
          <div key={id + '__5'} className="col-1 padding_zero d-flex justify-content-center align-items-center">
            <img
              className={v_battery_display.css}
              src={v_battery_display.m_battery_src}
              title={t('unitBar:andruavBatteryTooltip', {
                level: v_battery_display.level,
                charging: v_battery_display.charging,
                temp: v_battery_display.temp,
              })}
            />
          </div>
        );
      }
      rows.push(
        <div key={id + 'fc4'} className="col-2 padding_zero d-flex align-items-center" onClick={() => fn_gotoUnit_byPartyID(v_andruavUnit)}></div>
      );
      rows.push(
        <div
          key={id + 'fc5'}
          className="col col-sm-4 padding_zero d-flex align-items-center justify-content-end text-end"
          style={{ minWidth: 0 }}
          onClick={() => fn_gotoUnit_byPartyID(v_andruavUnit)}
        >
          <p
            id="id"
            className={'cursor_hand text-right text-truncate w-100 mb-0 ' + online_class2}
            title={module_version}
            onClick={() => fn_changeUnitInfo(v_andruavUnit)}
          >
            <strong>{v_andruavUnit.m_unitName + ' '}</strong>
            <span className={' ' + online_class}>{online_text}</span>
          </p>
        </div>
      );
    }

    return (
      <div key={id} className="row ms-1 padding_zero user-select-none">
        <EventBridge eventName={js_event.EE_stillImagesChanged} onEvent={(p_data) => this.fn_onStillImagesChanged(p_data)} />
        <div key={id + '__1'} className="col-1 padding_zero d-flex justify-content-center align-items-center">
          <ClssCtrlUnitIcon p_unit={v_andruavUnit} />
        </div>
        <div key={id + '__2'} className="col-1 padding_zero d-none d-sm-flex justify-content-center align-items-center">
          <span className="position-relative d-inline-flex">
            <i className={camera_class} title={t('unitBar:takePhoto')} onClick={() => this.fn_toggleCamera(v_andruavUnit)}></i>
            {this.state.m_storedImageCount > 0 && (
              <span
                className="badge rounded-pill bg-info position-absolute top-50 translate-middle"
                style={{ fontSize: '0.55rem', padding: '0.15em 0.35em' }}
                title={t('unitBar:storedImages', { count: this.state.m_storedImageCount })}
              >
                {this.state.m_storedImageCount}
              </span>
            )}
          </span>
        </div>
        <div key={id + '__3'} className="col-1 padding_zero d-none d-sm-flex justify-content-center align-items-center">
          <i className={video_class} title={t('unitBar:startLiveStream')} onClick={() => toggleVideo(v_andruavUnit)}></i>
        </div>
        <div key={id + '__4'} className="col-1 padding_zero d-none d-sm-flex justify-content-center align-items-center">
          <i className={recvideo_class} title={t('unitBar:startRecordingOnDrone')} onClick={() => toggleRecrodingVideo(v_andruavUnit)}></i>
        </div>
        {rows}
        <div key={id + '__6'} className="col-auto padding_zero d-none d-sm-flex justify-content-end align-items-center">
          <label
            className="px-1 py-0 txt-theme-aware border border-primary rounded text-center cursor_hand css_unitbar_pathcolor"
            title={t('unitBar:changePathColor')}
            style={{ backgroundColor: this.fn_getPathColor() }}
          >
            <i className="bi bi-palette-fill"></i>
            <input
              type='color'
              className="d-none"
              value={this.fn_getPathColor()}
              onChange={(e) => this.fn_changePathColor(v_andruavUnit, e.currentTarget.value)}
            />
          </label>
        </div>
      </div>
    );
  }
}


export default withTranslation('unitBar')(ClssCtrlUnitMainBar);