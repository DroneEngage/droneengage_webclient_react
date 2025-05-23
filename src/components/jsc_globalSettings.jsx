import React    from 'react';

import * as js_siteConfig from '../js/js_siteConfig.js'
import * as js_andruavclient2 from '../js/js_andruavclient2'

import {js_globals} from '../js/js_globals.js';
import {js_eventEmitter} from '../js/js_eventEmitter';

import {js_speak} from '../js/js_speak';
import {gui_toggleUnits} from '../js/js_main';
import {js_localStorage} from '../js/js_localStorage';
import {js_andruavAuth} from '../js/js_andruavAuth';
import {ClssFireEvent} from  './micro_gadgets/jsc_mctrl_fire_event.jsx';
import {setSelectedMissionFilePathToWrite} from '../js/js_main.js'

class ClssPreferences extends React.Component {
  constructor()
	{
      super ();

      this.key = Math.random().toString();
      
      js_globals.v_enable_tabs_display = js_localStorage.fn_getTabsDisplayEnabled();

      this.m_volumeRangeRef = React.createRef();
      this.m_enableSpeechRef = React.createRef();
      this.m_tabsDisplayeRef = React.createRef();
      this.m_unitSortRef = React.createRef();
      this.m_advancedRef = React.createRef();
      this.m_gcsDisplayRef = React.createRef();
      this.m_gcsShowMeRef = React.createRef();
  }

  componentDidMount()
  {
    this.m_enableSpeechRef.current.checked = js_localStorage.fn_getSpeechEnabled();
    this.m_volumeRangeRef.current.value = js_localStorage.fn_getVolume();
    this.m_tabsDisplayeRef.current.checked = js_localStorage.fn_getTabsDisplayEnabled();
    this.m_unitSortRef.current.checked = js_localStorage.fn_getUnitSortEnabled();
    this.m_advancedRef.current.checked = js_localStorage.fn_getUnitSortEnabled();
    this.m_gcsDisplayRef.current.checked = js_localStorage.fn_getGCSDisplayEnabled();
    this.m_gcsShowMeRef.current.checked = js_localStorage.fn_getGCSShowMe();
  }


  componentWillUnmount () {
    
  }


  fn_changeVolume (e)
  {
      js_localStorage.fn_setVolume(e.currentTarget.value);
      js_speak.fn_updateSettings();
  }

  fn_handleMouseUp (e) 
  {
    js_localStorage.fn_setVolume(e.currentTarget.value);
    js_speak.fn_updateSettings();
    js_speak.fn_speakFirst("test volume");
  }

  fn_enableSpeech (e)
  {
    const enabled = e.currentTarget.checked;
    js_localStorage.fn_setSpeechEnabled(enabled);
    js_speak.fn_updateSettings();

    if (enabled === true) {
      js_speak.fn_speak("enabled");
      this.m_volumeRangeRef.current.removeAttribute('disabled'); // Updated this line
    } 
    else 
    {
      js_speak.stopSpeaking();
      this.m_volumeRangeRef.current.setAttribute('disabled', 'disabled'); // Updated this line
    }
  }

  fn_enableAdvanced (e)
  {
    const enabled = e.currentTarget.checked;
    js_localStorage.fn_setAdvancedOptionsEnabled(enabled);
    js_eventEmitter.fn_dispatch (js_globals.EE_onAdvancedMode);
  }

  fn_enableTabsDisplay (e)
  {
    const enabled = e.currentTarget.checked;
    js_globals.v_enable_tabs_display = enabled;
    js_localStorage.fn_setTabsDisplayEnabled(enabled);
    js_eventEmitter.fn_dispatch (js_globals.EE_onPreferenceChanged);
  }

  fn_GCSShowMe (e)
  {
    const enabled = e.currentTarget.checked;
    js_globals.v_enable_tabs_display = enabled;
    js_localStorage.fn_setGCSShowMe(enabled);
    js_eventEmitter.fn_dispatch (js_globals.EE_onPreferenceChanged);
  }

  fn_sortUnits (e)
  {
    const enabled = e.currentTarget.checked;
    js_globals.v_enable_tabs_display = enabled;
    js_localStorage.fn_setUnitSortEnabled(enabled);
    js_eventEmitter.fn_dispatch (js_globals.EE_onPreferenceChanged);
  }

  fn_enableGCS (e)
  {
    const enabled = e.currentTarget.checked;
    js_globals.v_enable_gcs_display = enabled;
    js_localStorage.fn_setGCSDisplayEnabled(enabled);
    js_eventEmitter.fn_dispatch (js_globals.EE_onPreferenceChanged);
  }


  render () {
    let v_speech_disabled = 'false';
    if (js_localStorage.fn_getSpeechEnabled()===false)
    {
      v_speech_disabled = 'true';
    }

    return (
          <fieldset>
            <div className="row mb-12 align-items-center">
              <label htmlFor="check_enable_speech" className="col-sm-4 col-form-label al_l" >Enable Speech</label>
              <input className="form-check-input col-sm-4 " ref={this.m_enableSpeechRef} type="checkbox" id="check_enable_speech" onClick={ (e) => this.fn_enableSpeech(e)} />
              <label htmlFor="volume_range" className="col-sm-4 col-form-label al_r" >Volume</label>
              <input type="range" className="form-range col-sm-4 width_fit ps-5 " id="volume_range" ref={this.m_volumeRangeRef} disabled={v_speech_disabled==='true'}  
              onChange={ (e) => this.fn_changeVolume(e)}
              onMouseUp= {(e) => this.fn_handleMouseUp(e)}
              />
            </div>
            <div className="row mb-12 align-items-center">
              <label htmlFor="check_tabs_display" className="col-sm-4 col-form-label al_l " >Units in Tabs</label>
              <input className="form-check-input col-sm-4 " type="checkbox" id="check_tabs_display" ref={this.m_tabsDisplayeRef} onClick={ (e) => this.fn_enableTabsDisplay(e)} />
              <label htmlFor="check_unit_sort" className="col-sm-4 col-form-label al_r" title='sort by unit name of mavlink id'>Sort Units (mav_id)</label>
              <input className="form-check-input col-sm-4 " type="checkbox" id="check_unit_sort" ref={this.m_unitSortRef} onClick={ (e) => this.fn_sortUnits(e)} />
            </div>
            <div className="row mb-12 align-items-center">
              <label htmlFor="check_gcs_display" className="col-sm-4 col-form-label al_l " >Show Connected GCS</label>
              <input className="form-check-input col-sm-8 " type="checkbox" id="check_gcs_display" ref={this.m_gcsDisplayRef} onClick={ (e) => this.fn_enableGCS(e)} />
              <label htmlFor="check_gcs_show_me" className="col-sm-4 col-form-label al_r" title='show me in GCS list'>Show Me</label>
              <input className="form-check-input col-sm-4 " type="checkbox" id="check_gcs_show_me" ref={this.m_gcsShowMeRef} onClick={ (e) => this.fn_GCSShowMe(e)} />
            </div>
            <div className="row mb-12 align-items-center">
              <label htmlFor="check_advanced" className="col-sm-4 col-form-label al_l " >Advanced Options</label>
              <input className="form-check-input col-sm-8 " type="checkbox" id="check_advanced" ref={this.m_advancedRef} onClick={ (e) => this.fn_enableAdvanced(e)} />
            </div>
          </fieldset>
          
      );
    }

}
export default class ClssGlobalSettings extends React.Component {
  constructor() {
    super();
    this.state = {
      m_unitText: 'm',
      CONST_DEFAULT_ALTITUDE: js_globals.CONST_DEFAULT_ALTITUDE,
      CONST_DEFAULT_RADIUS: js_globals.CONST_DEFAULT_RADIUS,
      'm_update': 0,
    };

    this.key = Math.random().toString();
    this.mission_file_ref = React.createRef();
    this.altitudeInputRef = React.createRef(); 
    this.radiusInputRef = React.createRef(); 

    this.horizontal_distance = React.createRef(); 
    this.vertical_distance = React.createRef(); 


    if (js_localStorage.fn_getMetricSystem() === true) {
      this.state.m_unitText = 'm';
    } else {
      this.state.m_unitText = 'ft';
    }

    this.state.CONST_DEFAULT_ALTITUDE = js_localStorage.fn_getDefaultAltitude();
    this.state.CONST_DEFAULT_RADIUS = js_localStorage.fn_getDefaultRadius();

    this.state.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = js_localStorage.fn_getDefaultSwarmHorizontalDistance();
    this.state.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = js_localStorage.fn_getDefaultSwarmVerticalDistance();

    js_eventEmitter.fn_subscribe(js_globals.EE_Auth_Logined, this, this.fn_onAuthStatus);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.CONST_DEFAULT_ALTITUDE !== nextState.CONST_DEFAULT_ALTITUDE) {
      return true;
    }
    if (this.state.CONST_DEFAULT_RADIUS !== nextState.CONST_DEFAULT_RADIUS) {
      return true;
    }
    if (this.state.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE !== nextState.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE) {
      return true;
    }
    if (this.state.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE !== nextState.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE) {
      return true;
    }
    if (this.state.m_unitText !== nextState.m_unitText) {
      return true;
    }

    return false;
  }

  fn_handleFileChange(e) {
    setSelectedMissionFilePathToWrite(this.mission_file_ref.current.files);
  }

  clickToggleUnit(e) {
    gui_toggleUnits();

    if (js_localStorage.fn_getMetricSystem() === true) {
      this.setState({ m_unitText: 'm' });
    } else {
      this.setState({ m_unitText: 'ft' });
    }

    this.setState({ CONST_DEFAULT_ALTITUDE: js_globals.CONST_DEFAULT_ALTITUDE });
    this.setState({ CONST_DEFAULT_RADIUS: js_globals.CONST_DEFAULT_RADIUS });
    
    this.setState({ CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE: js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE });
    this.setState({ CONST_DEFAULT_SWARM_VERTICAL_DISTANCE: js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE });
  }

  fn_onAuthStatus(me, res) {
    if (me.state.m_update === 0) return;
    me.setState({ 'm_update': me.state.m_update + 1 });
  }

  componentDidMount() {
    this.setState({ 'm_update': this.state.m_update + 1 });
  }

  componentWillUnmount() {
    this.state.m_update = 0;
    js_eventEmitter.fn_unsubscribe(js_globals.EE_Auth_Logined, this);
  }

  onChange(e) {
    const altitudeValue = parseInt(this.altitudeInputRef.current.value);
    const radiusValue = parseInt(this.radiusInputRef.current.value);

    js_globals.CONST_DEFAULT_ALTITUDE = altitudeValue;
    js_globals.CONST_DEFAULT_RADIUS = radiusValue;

    if (js_globals.CONST_DEFAULT_ALTITUDE < js_globals.CONST_DEFAULT_ALTITUDE_min)
      js_globals.CONST_DEFAULT_ALTITUDE = parseInt(js_globals.CONST_DEFAULT_ALTITUDE_min);
    if (js_globals.CONST_DEFAULT_RADIUS < js_globals.CONST_DEFAULT_RADIUS_min)
      js_globals.CONST_DEFAULT_RADIUS = parseInt(js_globals.CONST_DEFAULT_RADIUS_min);

    js_localStorage.fn_setDefaultAltitude(js_globals.CONST_DEFAULT_ALTITUDE);
    js_localStorage.fn_setDefaultRadius(js_globals.CONST_DEFAULT_RADIUS);
  
    this.setState({ CONST_DEFAULT_ALTITUDE: js_globals.CONST_DEFAULT_ALTITUDE });
    this.setState({ CONST_DEFAULT_RADIUS: js_globals.CONST_DEFAULT_RADIUS });
  }


  onChangeSwarm(e) {
    const swarm_horizontal_value = parseInt(this.horizontal_distance.current.value);
    const swarm_virtual_value = parseInt(this.vertical_distance.current.value);

    js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = swarm_horizontal_value;
    js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = swarm_virtual_value;

    if (js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE < js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN)
      js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE = parseInt(js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN);
    
    if (js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE < js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN)
      js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE = parseInt(js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN);

    js_localStorage.fn_setDefaultSwarmHorizontalDistance(js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE);
    js_localStorage.fn_setDefaultSwarmVerticalDistance(js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE);
  
    this.setState({ CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE: js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE });
    this.setState({ CONST_DEFAULT_SWARM_VERTICAL_DISTANCE: js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE });
  }

  fn_fireDeEvent(value) {
    js_andruavclient2.AndruavClient.API_FireDeEvent(null, value);
  }

  render() {
    let v_gadgets = [];
    let v_uploadFile = [];
    let v_telemetryModes = [];

    v_gadgets.push(
      <div key={this.key + '1'} className="row ">
        <div className="col-xs-6 col-sm-6 col-lg-6">
          <div className="form-inline">
            <div className="form-group">
              <div title='Default altitude for climb command.'>
                <label htmlFor="txt_defaultAltitude" className="user-select-none text-white txt_label_width">
                  <small>Alt&nbsp;Step&nbsp;&nbsp;</small>
                </label>
                <input
                  id="txt_defaultAltitude"
                  type="number"
                  min={parseInt(js_globals.CONST_DEFAULT_ALTITUDE_min)}
                  className="form-control input-xs input-sm"
                  onChange={(e) => this.onChange(e)}
                  value={this.state.CONST_DEFAULT_ALTITUDE}
                  ref={this.altitudeInputRef} // Add ref here
                />
                <button
                  id="btn_defaultAltitude"
                  className="btn btn-secondary btn-sm mb-1 pt-0 pb-1"
                  type="button"
                  onClick={(e) => this.clickToggleUnit(e)}
                >
                  {this.state.m_unitText}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xs-6 col-sm-6 col-lg-6">
          <div className="form-inline">
            <div className="form-group">
              <div title='Default radius for circle'>
                <label htmlFor="txt_defaultCircle" className="user-select-none text-white txt_label_width">
                  <small>Radius &nbsp;&nbsp;&nbsp;</small>
                </label>
                <input
                  id="txt_defaultCircle"
                  type="number"
                  min={parseInt(js_globals.CONST_DEFAULT_RADIUS_min)}
                  className="form-control input-xs input-sm"
                  onChange={(e) => this.onChange(e)}
                  value={this.state.CONST_DEFAULT_RADIUS}
                  ref={this.radiusInputRef} // Add ref here
                />
                <button
                  id="btn_defaultCircle"
                  className="btn btn-secondary btn-sm mb-1 pt-0 pb-1"
                  type="button"
                  onClick={(e) => this.clickToggleUnit(e)}
                >
                  {this.state.m_unitText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    if (js_siteConfig.CONST_FEATURE.DISABLE_SWARM === false) {
      v_gadgets.push(
        <div key={this.key + 's1'} className="row ">
          <div className="col-xs-6 col-sm-6 col-lg-6">
            <div className="form-inline">
              <div className="form-group">
                <div title='Inter-Drone Distance (SWARM)'>
                  <label htmlFor="txt_defaultAltitude" className="user-select-none text-white txt_label_width">
                    <small>H-Offset</small>
                  </label>
                  <input
                    id="txt_defaultAltitude"
                    type="number"
                    min={parseInt(js_globals.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE_MIN)}
                    className="form-control input-xs input-sm"
                    onChange={(e) => this.onChangeSwarm(e)}
                    value={this.state.CONST_DEFAULT_SWARM_HORIZONTAL_DISTANCE}
                    ref={this.horizontal_distance} // Add ref here
                  />
                  <button
                    id="btn_defaultAltitude"
                    className="btn btn-secondary btn-sm mb-1 pt-0 pb-1"
                    type="button"
                    onClick={(e) => this.clickToggleUnit(e)}
                  >
                    {this.state.m_unitText}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xs-6 col-sm-6 col-lg-6">
            <div className="form-inline">
              <div className="form-group">
                <div title='Altitude Delta (SWARM)'>
                  <label  htmlFor="txt_defaultCircle" className="user-select-none text-white txt_label_width">
                    <small>V-Offset</small>
                  </label>
                  <input
                    id="txt_defaultCircle"
                    type="number"
                    min={parseInt(js_globals.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE_MIN)}
                    className="form-control input-xs input-sm"
                    onChange={(e) => this.onChangeSwarm(e)}
                    value={this.state.CONST_DEFAULT_SWARM_VERTICAL_DISTANCE}
                    ref={this.vertical_distance} // Add ref here
                  />
                  <button
                    id="btn_defaultCircle"
                    className="btn btn-secondary btn-sm mb-1 pt-0 pb-1"
                    type="button"
                    onClick={(e) => this.clickToggleUnit(e)}
                  >
                    {this.state.m_unitText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    v_uploadFile.push (
      <div key={this.key + 'v_uploadFile0'} className="row width_100 margin_zero css_margin_top_small ">
        <div  key={this.key + 'v_uploadFile1'} className={"col-12 "}>
          <div key={this.key + 'v_uploadFile2'} className="form-inline">
            <div key={this.key + 'v_uploadFile3'} className="form-group">
                <label htmlFor="btn_filesWP" className="user-select-none text-white mt-2"><small>Global&nbsp;Mission&nbsp;File</small></label>
                <input type="file" id="btn_filesWP" name="file" className="form-control input-xs input-sm css_margin_left_5 line-height-normal" ref={this.mission_file_ref} onChange={(e)=>this.fn_handleFileChange(e)}/>
            </div>
          </div>
        </div>
      </div>
);




v_uploadFile.push ();
let cls_ctrl_wp = '  ';
if (!js_andruavAuth.fn_do_canControlWP()) 
{ // no permission
cls_ctrl_wp = ' hidden disabled ';
}


return (
<div key={this.key + 'g1'} className="row margin_zero">
    <div className="card text-white  border-light mb-3 padding_zero" >
      <div className="card-header  text-center user-select-none"> <strong>Settings</strong></div>
          <div className="card-body">
              <ul className="nav nav-tabs">
                  <li className="nav-item">
                      <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#settings_home"}>Defaults</a>
                  </li>
                  <li className="nav-item">
                      <a className={"nav-link user-select-none " + cls_ctrl_wp} data-bs-toggle="tab" href={"#settings_profile"}>Mission</a>
                  </li>
                  <li className="nav-item">
                      <a className="nav-link user-select-none " data-bs-toggle="tab" href={"#settings_preference"}>Preferences</a>
                  </li>
              </ul>
              <div id="main_settings_tab" className="tab-content">
                  <div className="tab-pane fade  active show pt-2" id={"settings_home"}>
                  {v_gadgets}
                  {v_telemetryModes}      
                  
                  </div>
                  <div className={"tab-pane fade pt-2" + cls_ctrl_wp} id={"settings_profile"}>
                  {v_uploadFile} 
                  <ClssFireEvent label={"Event DroneEngage No."} onClick={ (value) => this.fn_fireDeEvent(value)}/>
                  </div>
                  <div className="tab-pane fade" id={"settings_preference"}>
                    <ClssPreferences/>
                  </div>
              </div>
          
          </div>
    </div>
</div>
);
}
}
