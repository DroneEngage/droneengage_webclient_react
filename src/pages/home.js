import '../css/bootstrap-icons/font/bootstrap-icons.css';
import * as js_preferences from '../js/state/preferences.js';
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_header_responsive.css';
import '../css/css_gamepad.css';

import 'jquery-ui-dist/jquery-ui.min.js';
import 'jquery-knob/dist/jquery.knob.min.js';

import { fn_ensureVendorCSS, VENDOR_CSS } from '../js/js_vendor_css.js';

import React, { useEffect, useState } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';


import { js_localStorage } from '../js/js_localStorage.js';
import { CONST_METER_TO_FEET } from '../js/js_helpers.js';
import { js_eventEmitter } from '../js/events/js_eventEmitter';
import ClssHeaderControl from '../components/jsc_header';
import ClssFooterControl from '../components/jsc_footer';
import ClssGlobalSettings from '../components/Settings';
import ClssAndruavUnitList from '../components/unit_controls/jsc_unitControlMainList.jsx';
import ClssAndruavUnitGCSList from '../components/unit_controls/jsc_unitControlGCSList.jsx';
import ClssModuleDetails from '../components/gadgets/jsc_ctrl_unit_module_details.jsx';
import ClssGamePadControl from '../components/gamepad/jsc_gamepadControl.jsx';
import ClssAndruavUnitListArray from '../components/unit_controls/jsc_unitControlArrayView.jsx';
import { ClssCVideoControl } from '../components/video/jsc_videoDisplayComponent.jsx';
import ClssGCSChat from '../components/jsc_gcs_chat.jsx';
import ClssNewsDisplay from '../components/jsc_news_display.jsx';
import ClssNewsWrite from '../components/jsc_news_write.jsx';
import DialogHost from '../components/DialogHost.jsx';
import { fn_on_ready } from '../js/js_main';
import { js_layout } from '../js/state/layoutStore.js';
import { useLayout } from '../js/hooks/useLayout.js';

fn_ensureVendorCSS(VENDOR_CSS.leaflet.id, VENDOR_CSS.leaflet.href);

const Home = () => {
  useTranslation('home'); // Use home namespace
  const layout = useLayout();
  const [isRow2Collapsed, setIsRow2Collapsed] = useState(false);
  const [isMetricSystem, setIsMetricSystem] = useState(js_preferences.fn_getUseMetricSystem());

  // Layout profile derived from the store's displayMode + smallMode.
  // This replaces the seven fn_activate* jQuery functions: the same
  // row visibility, column classes, and list visibility they imposed
  // are now expressed as React-driven CSS.
  const profile = js_layout.fn_getProfile();

  // Scroll to row_2 for display modes that had scroll behaviour
  // (classical and allViews in the old fn_activate* functions).
  useEffect(() => {
    if (profile.scroll === true) {
      const row2 = document.getElementById('row_2');
      if (row2) {
        window.scrollTo({ top: row2.offsetTop, behavior: 'smooth' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.displayMode]);

  useEffect(() => {
    js_preferences.fn_setMapEditor(false);
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
    setIsMetricSystem(js_preferences.fn_getUseMetricSystem());
    
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
        <div id="row_1" className={profile.row1.visible ? profile.row1.col : 'd-none'}>
          <div id="row_1_1" className="row margin_zero">
            <div id="displays" className="container-fluid text-center">
              <div className="monitorview" id="message_notification" style={{ display: 'none' }}>
                &nbsp;
              </div>
              <div id="div_cmp_hud"></div>
              <div className="monitorview" id="div_map_view" style={{ display: layout.showMap2d ? 'block' : 'none' }}>
                <div id="mapid" className="org_border fullscreen"></div>
              </div>
              <div className="monitorview" id="div_map3d_view" style={{ display: layout.showMap3d ? 'block' : 'none' }}>
                <div id="mapid3d" className="org_border fullscreen"></div>
              </div>
              <div className="cameraview" id="div_video_control" style={{ display: layout.showVideo ? 'block' : 'none' }}>
                <ClssCVideoControl />
              </div>
              <div id="andruav_unit_list_array_fixed" className="css_ontop andruav_unit_list_array" style={{ display: profile.fixed ? 'block' : 'none' }}>
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

            <div id="andruav_unit_list_array_float" className="css_ontop andruav_unit_list_array_float" style={{ display: profile.float ? 'block' : 'none', ...(profile.float ? { top: 400, left: 10, position: 'absolute' } : {}) }}>
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

            <div id="news_display_container" className="news-display-container">
              <ClssNewsDisplay />
            </div>
            <ClssNewsWrite />
          </div>

          <ClssModuleDetails />
          <ClssGamePadControl p_index={js_preferences.fn_getActiveGamepadIndex()} />
          <DialogHost />
        </div>

        <div id="row_2" className={profile.row2.visible ? `${profile.row2.col} ${isRow2Collapsed ? 'collapsed-right' : ''}` : 'd-none'}>
          <div id="andruavUnits" className="col-sm-12 padding_zero" style={{ display: isRow2Collapsed ? 'none' : 'block' }}>
            <div id="andruavUnits_in" className="">
              <ClssGlobalSettings />
              <div id="andruavUnitGlobals"></div>
              <ClssAndruavUnitGCSList />
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