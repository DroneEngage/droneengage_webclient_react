import '../css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import '../css/bootstrap-icons/font/bootstrap-icons.css';
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_gamepad.css';

import 'jquery-ui-dist/jquery-ui.min.js';
import 'jquery-knob/dist/jquery.knob.min.js';

import React, { useEffect } from 'react';
import { useTranslation , withTranslation} from 'react-i18next';


import { js_globals } from '../js/js_globals.js';
import ClssHeaderControl from '../components/jsc_header';
import ClssFooterControl from '../components/jsc_footer';
import ClssGlobalSettings from '../components/jsc_globalSettings';
import ClssAndruavUnitList from '../components/unit_controls/jsc_unitControlMainList.jsx';
import ClssYawDialog from '../components/dialogs/jsc_yawDialogControl.jsx';
import ClssLidarInfoDialog from '../components/dialogs/jsc_lidarInfoDialogControl.jsx';
import ClssCameraDialog from '../components/dialogs/jsc_cameraDialogControl.jsx';
import ClssStreamDialog from '../components/dialogs/jsc_streamDialogControl.jsx';
import ClssModuleDetails from '../components/gadgets/jsc_ctrl_unit_module_details.jsx';
import ClssGamePadControl from '../components/gamepad/jsc_gamepadControl.jsx';
import ClssServoControl from '../components/dialogs/jsc_servoDialogControl.jsx';
import ClssAndruavUnitListArray from '../components/unit_controls/jsc_unitControlArrayView.jsx';
import ClssUnitParametersList from '../components/dialogs/jsc_unitParametersList.jsx';
import ClssConfigGenerator from '../components/jsc_config_generator.jsx'
import { ClssCVideoControl } from '../components/video/jsc_videoDisplayComponent.jsx';
import { fn_on_ready } from '../js/js_main';

const Home = () => {
  const { t } = useTranslation('home'); // Use home namespace

  useEffect(() => {
    js_globals.CONST_MAP_EDITOR = false;
    fn_on_ready();
  }, []);

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
          </div>

          <div id="modal_fpv" title={t('home:modal.image.title')} className="card css_ontop">
            <div className="card-header text-center">
              <div className="row">
                <div className="col-10">
                  <h3 className="text-success text-start">{t('home:modal.image.title')}</h3>
                </div>
                <div className="col-2 float-right">
                  <button id="btnclose" type="button" className="btn-close"></button>
                </div>
              </div>
            </div>
            <div id="modal_fpv_img" className="form-group text-center">
              <img id="unitImg" className="img-rounded" alt="camera" src="/public/images/camera_img.png" />
            </div>
            <div id="modal_fpv_footer" className="form-group text-center localcontainer">
              <button id="unitImg_save" type="button" className="btn btn-danger">
                {t('home:modal.image.save')}
              </button>
              <button id="btnGoto" type="button" className="btn btn-success">
                {t('home:modal.image.goto')}
              </button>
            </div>
          </div>

          <ClssModuleDetails/>
          <ClssLidarInfoDialog />
          <ClssYawDialog />
          <ClssCameraDialog />
          <ClssServoControl />
          <ClssUnitParametersList />
          <ClssConfigGenerator />
          <ClssGamePadControl p_index={js_globals.active_gamepad_index} />
          <ClssStreamDialog />
        </div>

        <div id="row_2" className="col-lg-4 col-xl-4 col-xxl-4 col-12">
          <div id="andruavUnits" className="col-sm-12 padding_zero">
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

      <div className="modal fade" id="altitude_modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-bs-dismiss="modal" aria-hidden="true">
                ×
              </button>
              <h4 className="modal-title text-primary">{t('home:modal.altitude.title')}</h4>
            </div>
            <div className="container"></div>
            <div className="modal-body">
              <div className="input-group">
                <input
                  id="txtAltitude"
                  type="text"
                  className="form-control"
                  placeholder={t('home:modal.altitude.placeholder')}
                  aria-describedby="basic-addon2"
                />
                <span className="input-group-addon">{t('home:modal.altitude.unit')}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button id="btnCancel" type="button" data-bs-dismiss="modal" className="btn btn-muted">
                {t('home:modal.altitude.cancel')}
              </button>
              <button id="btnOK" type="button" data-bs-dismiss="modal" className="btn btn-success">
                {t('home:modal.altitude.go')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="changespeed_modal" className="modal fade" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 id="title" className="modal-title bg-warning rounded_10px p-1 text-white">
                {t('home:modal.speed.title')}
              </h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="container"></div>
              <div className="input-group">
                <input
                  id="txtSpeed"
                  type="text"
                  className="form-control rounded-3 me-3"
                  placeholder=""
                  aria-describedby="basic-addon2"
                />
                <span id="txtSpeedUnit" className="input-group-addon">
                  {t('home:modal.speed.unit')}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button id="btnCancel" type="button" data-bs-dismiss="modal" className="btn btn-muted">
                {t('home:modal.speed.cancel')}
              </button>
              <button id="btnOK" type="button" data-bs-dismiss="modal" className="btn btn-warning">
                {t('home:modal.speed.go')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="modal_changeUnitInfo" className="modal fade" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 id="title" className="modal-title bg-warning rounded_10px p-1 text-white">
                {t('home:modal.unitInfo.title')}
              </h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="container"></div>
              <div className="input-group align-items-center">
                <span id="txtNamelbl" className="input-group-addon me-2">
                  {t('home:modal.unitInfo.name')}
                </span>
                <input
                  id="txtUnitName"
                  type="text"
                  className="form-control rounded-3 me-3"
                  placeholder=""
                  aria-describedby="basic-addon2"
                />
              </div>
              <div className="input-group mt-2 align-items-center">
                <span id="txtDescriptionlbl" className="input-group-addon me-2">
                  {t('home:modal.unitInfo.description')}
                </span>
                <input
                  id="txtDescription"
                  type="text"
                  className="form-control rounded-3 me-3"
                  placeholder=""
                  aria-describedby="basic-addon2"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button id="btnCancel" type="button" data-bs-dismiss="modal" className="btn btn-muted">
                {t('home:modal.unitInfo.cancel')}
              </button>
              <button id="btnOK" type="button" data-bs-dismiss="modal" className="btn btn-warning">
                {t('home:modal.unitInfo.go')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="modal_saveConfirmation" className="modal fade" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 id="title" className="modal-title bg-success p-1 text-white">
                <strong>{t('home:modal.saveConfirmation.title')}</strong>
              </h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body text-white">
              <p>{t('home:modal.saveConfirmation.message')}</p>
            </div>
            <div className="modal-footer">
              <button id="btnCancel" type="button" data-bs-dismiss="modal" className="btn btn-secondary">
                {t('home:modal.saveConfirmation.cancel')}
              </button>
              <button id="modal_btn_confirm" type="button" data-bs-dismiss="modal" className="btn btn-danger">
                {t('home:modal.saveConfirmation.submit')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="footer_div" className="row mt-0 me-0 mw-0">
        <ClssFooterControl />
      </div>
    </div>
  );
};

export default withTranslation('home')(Home);