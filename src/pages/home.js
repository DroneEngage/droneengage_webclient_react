import '../css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import '../css/bootstrap-icons/font/bootstrap-icons.css';
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_gamepad.css';

import 'jquery-ui-dist/jquery-ui.min.js';
import 'jquery-knob/dist/jquery.knob.min.js';

import React, { useEffect, useState } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';


import { js_globals } from '../js/js_globals.js';
import { js_localStorage } from '../js/js_localStorage.js';
import { CONST_METER_TO_FEET } from '../js/js_helpers.js';
import { js_eventEmitter } from '../js/js_eventEmitter';
import ClssHeaderControl from '../components/jsc_header';
import ClssFooterControl from '../components/jsc_footer';
import ClssGlobalSettings from '../components/jsc_globalSettings';
import ClssAndruavUnitList from '../components/unit_controls/jsc_unitControlMainList.jsx';
import ClssYawDialog from '../components/dialogs/jsc_yawDialogControl.jsx';
import ClssLidarInfoDialog from '../components/dialogs/jsc_lidarInfoDialogControl.jsx';
import ClssCameraDialog from '../components/dialogs/jsc_cameraDialogControl.jsx';
import ClssStreamDialog from '../components/dialogs/jsc_streamDialogControl.jsx';
import ClssViewLinkGimbal from '../components/dialogs/jsc_viewLinkGimbalControl.jsx';
import ClssModuleDetails from '../components/gadgets/jsc_ctrl_unit_module_details.jsx';
import ClssGamePadControl from '../components/gamepad/jsc_gamepadControl.jsx';
import ClssServoControl from '../components/dialogs/jsc_servoDialogControl.jsx';
import ClssAndruavUnitListArray from '../components/unit_controls/jsc_unitControlArrayView.jsx';
import ClssUnitParametersList from '../components/dialogs/jsc_unitParametersList.jsx';
import ClssConfigGenerator from '../components/jsc_config_generator.jsx'
import { ClssCVideoControl } from '../components/video/jsc_videoDisplayComponent.jsx';
import ClssGCSChat from '../components/jsc_gcs_chat.jsx';
import ClssAltitudeDialog from '../components/dialogs/jsc_altitudeDialog.jsx';
import ClssSpeedDialog from '../components/dialogs/jsc_speedDialog.jsx';
import ClssUnitInfoDialog from '../components/dialogs/jsc_unitInfoDialog.jsx';
import ClssFpvDialog from '../components/dialogs/jsc_fpvDialog.jsx';
import ClssConfirmationDialog from '../components/dialogs/jsc_confirmationDialog.jsx';
import { fn_on_ready } from '../js/js_main';

const Home = () => {
  const { t } = useTranslation('home'); // Use home namespace
  const [isRow2Collapsed, setIsRow2Collapsed] = useState(false);
  const [isMetricSystem, setIsMetricSystem] = useState(js_globals.v_useMetricSystem);

  useEffect(() => {
    js_globals.CONST_MAP_EDITOR = false;
    fn_on_ready();
  }, []);

  useEffect(() => {
    // Listen for unit system change events
    const handleUnitSystemChange = (listener, data) => {
      setIsMetricSystem(data.isMetric);
    };
    
    // Subscribe to the custom event
    js_eventEmitter.fn_subscribe('EE_UnitSystemChanged', this, handleUnitSystemChange);
    
    // Set initial state
    setIsMetricSystem(js_globals.v_useMetricSystem);
    
    // Cleanup on unmount
    return () => {
      js_eventEmitter.fn_unsubscribe('EE_UnitSystemChanged', this);
    };
  }, []);

  const toggleRow2 = () => {
    setIsRow2Collapsed(!isRow2Collapsed);
  };

  const handleSpeedPresetClick = (value) => {
    const speedInput = document.getElementById('txtSpeed');
    if (speedInput) {
      speedInput.value = value;
    }
  };

  const getSpeedPresets = () => {
    if (isMetricSystem === true) {
      return [
        { value: '5', label: '5m' },
        { value: '10', label: '10m' },
        { value: '20', label: '20m' },
        { value: '50', label: '50m' }
      ];
    } else {
      return [
        { value: '16', label: '16ft' },
        { value: '50', label: '50ft' },
        { value: '90', label: '90ft' },
        { value: '160', label: '160ft' }
      ];
    }
  };

  return (
    <div>
      <ClssHeaderControl />

      <div id="mainBody" className="row css_mainbody">
        <div id="row_1" className="col-lg-8 col-xl-8 col-xxl-8 col-12">
          <div id="row_1_1" className="row margin_zero">
            <div id="displays" className="container-fluid text-center">
              <div className="monitorview" id="message_notification" style={{ display: 'none' }}>
                &nbsp;
              </div>
              <div id="div_cmp_hud"></div>
              <div className="monitorview" id="div_map_view">
                <div id="mapid" className="org_border fullscreen"></div>
              </div>
              <div className="monitorview" id="div_map3d_view" style={{ display: 'none' }}>
                <div id="mapid3d" className="org_border fullscreen"></div>
              </div>
              <div className="cameraview" id="div_video_control">
                <ClssCVideoControl />
              </div>
              <div id="andruav_unit_list_array_fixed" className="css_ontop andruav_unit_list_array">
                <ClssAndruavUnitListArray
                  prop_speed={true}
                  prop_battery={true}
                  prob_ekf={true}
                  prob_alt={true}
                  prob_ws={false}
                  prob_wp={false}
                />
              </div>
            </div>

            <div id="andruav_unit_list_array_float" className="css_ontop andruav_unit_list_array_float">
              <ClssAndruavUnitListArray
                prop_speed={true}
                prop_battery={true}
                prob_ekf={true}
                prob_alt={true}
                prob_ws={true}
                prob_wp={true}
              />
            </div>

            <div id="gcs_chat_container" className="gcs-chat-container">
              <ClssGCSChat />
            </div>
          </div>

          <ClssModuleDetails />
          <ClssLidarInfoDialog />
          <ClssYawDialog />
          <ClssCameraDialog />
          <ClssServoControl />
          <ClssUnitParametersList />
          <ClssConfigGenerator />
          <ClssGamePadControl p_index={js_globals.active_gamepad_index} />
          <ClssStreamDialog />
          <ClssViewLinkGimbal />
          <ClssAltitudeDialog />
          <ClssSpeedDialog />
          <ClssUnitInfoDialog />
          <ClssFpvDialog />
          <ClssConfirmationDialog />
        </div>

        <div id="row_2" className={`col-lg-4 col-xl-4 col-xxl-4 col-12 ${isRow2Collapsed ? 'collapsed-right' : ''}`}> 
          <div id="andruavUnits" className="col-sm-12 padding_zero" style={{ display: isRow2Collapsed ? 'none' : 'block' }}>
            <div id="andruavUnits_in" className="">
              <ClssGlobalSettings />
              <div id="andruavUnitGlobals"></div>
              <p className="bg-warning text-center css_margin_top_small">
                <strong>{t('home:onlineUnits')}</strong>
              </p>
            </div>
            <div id="guiMessageCtrl" className="row"></div>
            <div id="andruavUnitList" className="row">
              <ClssAndruavUnitList
                tab_planning={false}
                tab_main={true}
                tab_log={true}
                tab_details={true}
                tab_module={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div id="footer_div" className="row mt-0 me-0 mw-0  mb-0">
        <ClssFooterControl />
      </div>
    </div>
  );
};

export default withTranslation('home')(Home);