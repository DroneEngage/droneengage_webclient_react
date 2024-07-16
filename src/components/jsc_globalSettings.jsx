import $ from 'jquery'; 
import React    from 'react';

import {js_globals} from '../js/js_globals.js';
import {js_eventEmitter} from '../js/js_eventEmitter'

import {js_localStorage} from '../js/js_localStorage'
import {js_speak} from '../js/js_speak'
import {gui_toggleUnits} from '../js/js_main'
import * as js_andruavclient2 from '../js/js_andruavclient2'
import {js_andruavAuth} from '../js/js_andruavAuth'

class CLSS_FireEvent extends React.Component {


  constructor()
	{
		super ();
		this.state = {
		    
		};
    
    js_eventEmitter.fn_subscribe(js_globals.EE_onAdvancedMode,this,this.fn_advancedMode);
  }

  fn_advancedMode (me)
  {
    me.forceUpdate();
  }

  fn_fireEvent()
  {
    js_andruavclient2.AndruavClient.API_FireEvent (null,$('#txt_ev').val());
   
  }

  componentWillUnmount () 
  {
    js_eventEmitter.fn_unsubscribe(js_globals.EE_onAdvancedMode,this);
  }

  render() {
    if (js_localStorage.fn_getAdvancedOptionsEnabled()!==true)
    {
      return (
                <div></div>
            )
    }
    else
    {
      return (
        <div className="form-group">
          <label htmlFor="txt_ev" className="user-select-none  form-label text-white "><small>Event&nbsp;No.</small></label>
          <div className="input-group mb-3">
            <input id="txt_ev"  type="number" min={0} max={2000} step="1.0" className="form-control input-sm input-sm txt_margin" placeholder="0" aria-label="0" />
            <button id="btn_ev"  type="button" className="btn btn-success" onClick={ (e) => this.fn_fireEvent()} >Fire</button>
          </div>
        </div>
      );
    }
  }
}


class CLSS_DisplayItems extends React.Component {

  constructor()
	{
		super ();
		this.state = {
		    
		};
  }
  
  componentDidMount()
  {
    $('#toggle_GCS').prop("checked", js_localStorage.fn_getGCSDisplayEnabled());      
    $('#toggle_DRONE').prop("checked", js_globals.v_en_Drone);      
    $('#toggle_ADSB').prop("checked", js_globals.v_EnableADSB);      
    $('#check_tabs_display').prop("checked", js_globals.v_enable_tabs_display);      
    $('#check_tabs_display').change(function (e)
        {
          var state = $(this).prop('checked');
          js_globals.v_enable_tabs_display = state;
          js_localStorage.fn_setTabsDisplayEnabled(state);
          js_eventEmitter.fn_dispatch(js_globals.EE_onPreferenceChanged);
        });
          
          
    $('#check_unit_sort').prop("checked", js_globals.v_enable_unit_sort);
    $('#check_unit_sort').change(function (e)
        {
          var state = $(this).prop('checked');
          js_globals.v_enable_unit_sort = state;
          js_localStorage.fn_setUnitSortEnabled(state);
          js_eventEmitter.fn_dispatch(js_globals.EE_onPreferenceChanged);
        });
     
    $('#toggle_GCS').change(function (e)
        {
          var state = $(this).prop('checked');
          js_globals.v_en_GCS = state;
          js_localStorage.fn_setGCSDisplayEnabled(state);
          js_eventEmitter.fn_dispatch(js_globals.EE_onPreferenceChanged);
        });
          
    $('#toggle_DRONE').change(function (e)
        {
          var state = $(this).prop('checked');
          js_globals.v_en_Drone = state;
          js_eventEmitter.fn_dispatch(js_globals.EE_onPreferenceChanged);
        });
          
          
    $('#toggle_ADSB').change(function (e)
        {
          var state = $(this).prop('checked');
          js_globals.v_EnableADSB = state;
          js_eventEmitter.fn_dispatch(js_globals.EE_onPreferenceChanged);
        });
  }

  render () 
  {
    var v_check_btns = [];
    if (js_globals.CONST_DISABLE_ADSG === false)
    {
      v_check_btns.push (
        <div key="check_btns" className="btn-group css_margin_top_small" role="group" >
          <label className="checkbox-inline text-white">
          <input id="toggle_GCS"    type="checkbox"  data-toggle="toggle"  data-size="mini" data-height="20" data-width="47" data-onstyle="success" data-offstyle="danger"/> GCS
          </label>
          <label className="checkbox-inline text-white">
          <input id="toggle_DRONE"  type="checkbox"  data-toggle="toggle"  data-size="mini" data-height="20" data-width="47" data-onstyle="success" data-offstyle="danger"/> Drone
          </label>
          <label className="checkbox-inline text-white">
          <input id="toggle_ADSB"   type="checkbox" data-toggle="toggle"  data-size="mini" data-height="20" data-width="47" data-onstyle="success" data-offstyle="danger"/> ADSB
          </label> 
        </div>
        );
    }
    
    v_check_btns.push (
        <div key="check_btns" className="btn-group css_margin_top_small" role="group" >
          <label className="checkbox-inline text-white me-3">
          <input id="toggle_GCS"    type="checkbox"  data-toggle="toggle"  data-size="mini" data-height="20" data-width="47" data-onstyle="success" data-offstyle="danger"/> GCS
          </label>
          <label className="checkbox-inline text-white me-3">
          <input id="toggle_DRONE"  type="checkbox"  data-toggle="toggle"  data-size="mini" data-height="20" data-width="47" data-onstyle="success" data-offstyle="danger"/> Drone
          </label>
        </div>
      );
  
      return (
        <div>{v_check_btns}</div>
        );
  }

  
}
class CLSS_Preferences extends React.Component {
  constructor()
	{
      super ();

      js_globals.v_enable_tabs_display = js_localStorage.fn_getTabsDisplayEnabled();
  }

  componentDidMount()
  {
      $('#check_enable_speech')[0].checked = js_localStorage.fn_getSpeechEnabled();
      $('#volume_range')[0].value = js_localStorage.fn_getVolume();
      $('#check_tabs_display')[0].checked = js_localStorage.fn_getTabsDisplayEnabled();
      $('#check_unit_sort')[0].checked = js_localStorage.fn_getUnitSortEnabled();
      $('#check_advanced')[0].checked = js_localStorage.fn_getAdvancedOptionsEnabled();
  }


    

  fn_changeVolume ()
  {
      js_localStorage.fn_setVolume($('#volume_range')[0].value);
      js_speak.fn_updateSettings();
  }

  

  fn_enableSpeech ()
  {
      const enabled = $('#check_enable_speech')[0].checked;
      js_localStorage.fn_setSpeechEnabled(enabled);
      js_speak.fn_updateSettings();

      if (enabled===true)
      {
        js_speak.fn_speak("enabled");
        $('#volume_range').removeAttr('disabled');
      }
      else
      {
        $('#volume_range').attr('disabled', 'disabled');
      }
  }

  fn_enableAdvanced ()
  {
    const enabled = $('#check_advanced')[0].checked;
    js_localStorage.fn_setAdvancedOptionsEnabled(enabled);
    js_eventEmitter.fn_dispatch (js_globals.EE_onAdvancedMode);
  }

  fn_enableTabsDisplay ()
  {
    const enabled = $('#check_tabs_display')[0].checked;
    js_globals.v_enable_tabs_display = enabled;
    js_localStorage.fn_setTabsDisplayEnabled(enabled);
    js_eventEmitter.fn_dispatch (js_globals.EE_onPreferenceChanged);
  }

  fn_sortUnits ()
  {
    const enabled = $('#check_unit_sort')[0].checked;
    js_globals.v_enable_tabs_display = enabled;
    js_localStorage.fn_setUnitSortEnabled(enabled);
    js_eventEmitter.fn_dispatch (js_globals.EE_onPreferenceChanged);
  }

  fn_enableGCS ()
  {
    const enabled = $('#check_gcs_display')[0].checked;
    js_globals.v_enable_gcs_display = enabled;
    js_localStorage.fn_setGCSDisplayEnabled(enabled);
    js_eventEmitter.fn_dispatch (js_globals.EE_onPreferenceChanged);
  }

  fn_keydown()
  {
    js_localStorage.fn_setGoogleMapKey($('#txt_google_key').val());
  }

  render () {
    var v_speech_disabled = 'false';
    if (js_localStorage.fn_getSpeechEnabled()===false)
    {
      v_speech_disabled = 'true';
    }

    return (
          <fieldset>
            <div className="row mb-12 align-items-center">
              <label htmlFor="check_enable_speech" className="col-sm-4 col-form-label al_l" >Enable Speech</label>
              <input className="form-check-input col-sm-4 " type="checkbox" id="check_enable_speech" onClick={ () => this.fn_enableSpeech()} />
              <label htmlFor="volume_range" className="col-sm-4 col-form-label al_r" >Volume</label>
              <input type="range" className="form-range col-sm-4 width_fit ps-5 " id="volume_range" disabled={v_speech_disabled==='true'}  onChange={ () => this.fn_changeVolume()}/>
            </div>
            <div className="row mb-12 align-items-center">
              <label htmlFor="check_tabs_display" className="col-sm-4 col-form-label al_l " >Units in Tabs</label>
              <input className="form-check-input col-sm-4 " type="checkbox" id="check_tabs_display" onClick={ () => this.fn_enableTabsDisplay()} />
              <label htmlFor="check_unit_sort" className="col-sm-4 col-form-label al_r" title='sort by unit name of mavlink id'>Sort Units (mav_id)</label>
              <input className="form-check-input col-sm-4 " type="checkbox" id="check_unit_sort" onClick={ () => this.fn_sortUnits()} />
            </div>
            <div className="row mb-12 align-items-center">
              <label htmlFor="check_advanced" className="col-sm-4 col-form-label al_l " >Advanced Options</label>
              <input className="form-check-input col-sm-8 " type="checkbox" id="check_advanced" onClick={ () => this.fn_enableAdvanced()} />
            </div>
            <div className="row mb-12 align-items-center">
              <label htmlFor="check_gcs_display" className="col-sm-4 col-form-label al_l " >Show Connected GCS</label>
              <input className="form-check-input col-sm-8 " type="checkbox" id="check_gcs_display" onClick={ () => this.fn_enableGCS()} />
            </div>
          </fieldset>
          
      );
    }

}
export default class CLSS_GlobalSettings extends React.Component {
  
  constructor()
	{
		super ();
		this.state = {
		    m_unitText: 'm',
        CONST_DEFAULT_ALTITUDE:js_globals.CONST_DEFAULT_ALTITUDE,
        CONST_DEFAULT_RADIUS:js_globals.CONST_DEFAULT_RADIUS,
		    'm_update': 0
		};

    this._isMounted = false;
    //gui_toggleUnits();

    if (js_localStorage.fn_getMetricSystem()===true)
    {
      this.state.m_unitText = 'm';
    }
      else
      {
        this.state.m_unitText = 'ft';
      }

      this.state.CONST_DEFAULT_ALTITUDE=js_localStorage.fn_getDefaultAltitude();
      this.state.CONST_DEFAULT_RADIUS=js_localStorage.fn_getDefaultRadius();
     
      js_eventEmitter.fn_subscribe (js_globals.EE_Auth_Logined, this, this.fn_onAuthStatus);
	 
	}

 shouldComponentUpdate(nextProps, nextState) {
    
    if (this.props.CONST_DEFAULT_ALTITUDE !== nextState.CONST_DEFAULT_ALTITUDE) {
     return true;
    }
    if (this.state.CONST_DEFAULT_RADIUS !== nextState.CONST_DEFAULT_RADIUS) {
      return true;
    }
    if (this.state.m_unitText !== nextState.m_unitText) {
      return true;
    }
     
    return false;
  }
  

  clickToggleUnit (e) {
    
      gui_toggleUnits();

      if (js_localStorage.fn_getMetricSystem()===true)
      {
        this.setState({m_unitText:'m'});
      }
      else
      {
        this.setState({m_unitText:'ft'});
      }

   
      this.setState ({CONST_DEFAULT_ALTITUDE:js_globals.CONST_DEFAULT_ALTITUDE});
      this.setState ({CONST_DEFAULT_RADIUS:js_globals.CONST_DEFAULT_RADIUS});
      
			  
  }


  fn_onAuthStatus (me,res) {
    if (me._isMounted!==true) return ;
    me.setState({'m_update': me.state.m_update +1});
    //me.state.m_update += 1;
    //me.forceUpdate();
  }

  componentDidMount() {
    this._isMounted = true;

  }

 
  componentWillUnmount () {
    this._isMounted = false;
		js_eventEmitter.fn_unsubscribe (js_globals.EE_Auth_Logined,this);
  }
  
  


  onChange (e) {

      js_globals.CONST_DEFAULT_ALTITUDE = parseInt($("#txt_defaultAltitude").val());
      js_globals.CONST_DEFAULT_RADIUS = parseInt($("#txt_defaultCircle").val());
      
 
      if (js_globals.CONST_DEFAULT_ALTITUDE < js_globals.CONST_DEFAULT_ALTITUDE_min) js_globals.CONST_DEFAULT_ALTITUDE = parseInt(js_globals.CONST_DEFAULT_ALTITUDE_min);
      if (js_globals.CONST_DEFAULT_RADIUS < js_globals.CONST_DEFAULT_RADIUS_min)     js_globals.CONST_DEFAULT_RADIUS   = parseInt(js_globals.CONST_DEFAULT_RADIUS_min);


      this.setState ({CONST_DEFAULT_ALTITUDE:js_globals.CONST_DEFAULT_ALTITUDE});
      this.setState ({CONST_DEFAULT_RADIUS:js_globals.CONST_DEFAULT_RADIUS});

  }


  render() {

     var m_unitText= "";

     if (js_localStorage.fn_getMetricSystem()===true)
      {
        m_unitText = 'm';
      }
      else
      {
        m_unitText = 'ft';
      }

  //  js_globals.fn_console_log ("REACT:RENDER CLSS_GlobalSettings" + this.state.js_globals.CONST_DEFAULT_ALTITUDE );
  var v_gadgets = [];
  var v_uploadFile = [];
  var v_telemetryModes = [];
  
  v_gadgets.push (
      <div key="1" className="row ">
                <div className="col-xs-6 col-sm-6 col-lg-6">
                  <div className="form-inline">
                    <div className="form-group">
                      <div>
                        <label htmlFor="txt_defaultAltitude" className="user-select-none text-white txt_label_width"><small>Alt&nbsp;Step</small></label>
                        <input id="txt_defaultAltitude" type="number" min={parseInt(js_globals.CONST_DEFAULT_ALTITUDE_min)} className="form-control input-xs input-sm"  onChange={(e) => this.onChange(e)}  value={this.state.CONST_DEFAULT_ALTITUDE} />
                        <button id="btn_defaultAltitude" className="btn btn-secondary btn-sm" type="button" onClick={ (e) => this.clickToggleUnit(e) }>{this.state.m_unitText}</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xs-6 col-sm-6 col-lg-6">
                  <div className="form-inline">
                    <div className="form-group">
                        <div>
                          <label htmlFor="txt_defaultCircle" className="user-select-none text-white txt_label_width"><small>Radius</small></label>
                          <input id="txt_defaultCircle" type="number" min={parseInt(js_globals.CONST_DEFAULT_RADIUS_min)} className="form-control input-xs input-sm"  onChange={(e) => this.onChange(e)}  value={this.state.CONST_DEFAULT_RADIUS}/>
                          <button id="btn_defaultCircle" className="btn btn-secondary btn-sm" type="button"  onClick={ (e) => this.clickToggleUnit(e) }>{this.state.m_unitText}</button>
                        </div>
                    </div>
                  </div>
                </div>
            </div>
            
    );


    v_uploadFile.push (
              <div key='v_uploadFile0' className="row width_100 margin_zero css_margin_top_small ">
                <div  key='v_uploadFile1' className={"col-12 "}>
                  <div key='v_uploadFile2' className="form-inline">
                    <div key='v_uploadFile3' className="form-group">
                        <label htmlFor="btn_filesWP" className="user-select-none text-white mt-2"><small>Global&nbsp;Mission&nbsp;File</small></label>
                        <input type="file" id="btn_filesWP" name="file" className="form-control input-xs input-sm css_margin_left_5"/>
                    </div>
                  </div>
                </div>
              </div>
      );

    


    v_uploadFile.push ();
    var cls_ctrl_wp = '  ';
    if (!js_andruavAuth.fn_do_canControlWP()) 
    { // no permission
      cls_ctrl_wp = ' hidden disabled ';
    }
        
  
  return (
     <div key='g1' className="row margin_zero">
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
                    <CLSS_FireEvent/>
                    </div>
                    <div className="tab-pane fade" id={"settings_preference"}>
                      <CLSS_Preferences/>
                    </div>
                </div>
            
            

            

           
            
            </div></div></div>
    );
  }
};


