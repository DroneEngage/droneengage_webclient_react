import React from 'react';
import '../js/js_main.js'
const Home = () => {
    return (
    <div>
          <div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">
            <div id="header_div"></div>
          </div>

          <div id='mainBody' className='row css_mainbody' >
		        <div id="row_1" className="col-8">
              <div id="row_1_1" className="row margin_zero">
                
                <div id="displays" className="container-fluid text-center">
                  <div className="monitorview " id="message_notification" style='display:none;'>&nbsp;</div>
                  <div id="div_cmp_hud"></div>
                  <div className="monitorview " id="div_map_view">
                    <div id='mapid' className="org_border fullscreen"></div>
                  </div>
                  <div className="cameraview" id="div_video_control"></div>
                  <div id="andruav_unit_list_array_fixed" className="css_ontop  andruav_unit_list_array"></div>
					      </div>
                
                <div id="andruav_unit_list_array_float" className="css_ontop  andruav_unit_list_array_float">

                </div>
              </div>

              <div id="modal_fpv"  title="image" className="localcontainer css_ontop">
                  <div className="card-header text-center">
                    <div className="row">
                    <div className="col-10">
                      <h3 className="text-success text-start">Image</h3>
                    </div>
                    <div className="col-2 float-right">
                    <button id="btnclose" type="button" className="btn-close"></button>
                    </div>
                    </div>
                  </div>
                  <div id="modal_fpv_img" className="form-group text-center">
                    <img id='unitImg' className="img-rounded" src='images/camera_img.png' />
                  </div>
                  
                  <div id="modal_fpv_footer" className="form-group text-center localcontainer">
                    <button id="unitImg_save" type="button" className="btn btn-danger">Save</button>
                    <button id="btnGoto" type="button" className="btn btn-success">Goto</button>
                  </div>
              </div>
                
              <div id="modal_ctrl_yaw" title="YAW Control" className="card css_ontop border-light p-2">
                  <div className="card-header text-center">
                    <div className="row">
                    <div className="col-10">
                      <h3 className="text-success text-start">YAW</h3>
                    </div>
                    <div className="col-2 float-right">
                    <button id="btnclose" type="button" className="btn-close"></button>
                    </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div id="yaw_knob_out" className="form-group text-centermodal_dialog_style">
                      <input id="yaw_knob" className=" input-sm dial" data-width="180" data-height="180" data-min="0"
                        data-max="360" value="0" />
                    </div>
                  </div>
                  <div id="modal_yaw_knob_footer" className="form-group text-center ">
                    <div className= "row">
                      <div className="btn-group">
                        <button id="opaque_btn" type="button" className="btn btn-sm btn-primary" data-toggle="button" aria-pressed="false" autoComplete="off">opaque</button>
                        <button id="btnGoto" type="button" className="btn btn-sm btn-success">Goto</button>
                        <button id="btnYaw" type="button" className="btn btn-sm btn-danger">YAW</button>
                        <button id="btnResetYaw" type="button" className="btn btn-sm btn-warning">reset YAW</button>
                      </div>
                    </div>
                  </div>
              </div>


              <div id='CTRL_cameraCtrl'></div>
              <div id='servoCtrl'></div>
              <div id='modal_uplCtrl'></div>
              <div id='gamepadCtrl'></div>
              <div id='CTRL_streamCtrl' > </div>
            </div>

            <div id="row_2" className="col-4 ">
				      <div id='andruavUnits' className='col-sm-12 padding_zero'>
						    <div id="andruavUnits_in" className=''>
							    <p className="bg-warning  text-center"><strong>Global Settings</strong></p>
							  
                  <div id='andruavUnitGlobals'></div>
							
                  <p className="bg-warning  text-center css_margin_top_small"><strong>Online Units</strong></p>
							
						    </div>
						    
                <div id="guiMessageCtrl" className='row'></div>
						
						    <div id='andruavUnitList' className='row'></div>
						
					    </div>
				
			      </div>
          </div>
    </div>
    
    );
  };
  
  export default Home;
  