import '../css/bootstrap.min.css';  // my theme
import 'leaflet/dist/leaflet.css';
import 'leaflet.pm/dist/leaflet.pm.css';
import '../css/bootstrap-icons/font/bootstrap-icons.css'
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_planning.css';
import '../css/css_gamepad.css';

import 'leaflet.pm';
import 'jquery-ui-dist/jquery-ui.min.js';

import React , { useEffect } from 'react';
import {js_globals} from '../js/js_globals.js'
import ClssHeaderControl from '../components/jsc_header'
import ClssFooterControl from '../components/jsc_footer'
import ClssGlobalSettings from '../components/jsc_globalSettings'
import ClssFenceClssShapeControl from '../components/planning/fence/jsc_fenceControl.jsx'
import CMissionsContainer from '../components/planning/mission/jsc_missionItemsControl.jsx'
import ClssFenceGlobalSettingsControl from '../components/planning/fence/jsc_fenceGlobalSettings.jsx'
import ClssAndruavUnitList from '../components/unit_controls/jsc_unitControlMainList.jsx'

import {fn_on_ready} from '../js/js_main'



const Planning = () => {

  
  useEffect(() => {
    js_globals.CONST_MAP_EDITOR = true;  
    fn_on_ready();
  }
  );

  return (
    	<div>
			<div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">
			<ClssHeaderControl />
			</div>

			<div id='mainBody' className='row css_mainbody' >
				<div id="row_1" className="col-8">
					<div id="row_1_1" className="row margin_zero">
					<div id="displays" className="container-fluid localcontainer">
						<div className="monitorview " id="div_map_view">
										<div id='mapid' className="org_border fullscreen">
						</div>
									</div>
								</div>
		
					<div id="modal_saveConfirmation" className="modal fade" role="dialog">
								<div className="modal-dialog">
										<div className="modal-content">
											<div className="modal-header">
													<h4 id="title" className="modal-title bg-success p-1 text-white"><strong>Attention:</strong> Delete Operation.</h4>
													<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
											</div>
											<div className="modal-body  text-white">
												<p>Are you sure you want to delete current active Geo-Fence and replace it with new ones ?</p>
											</div>
											<div className="modal-footer">
												<button type="button" className="btn btn-muted" data-bs-dismiss="modal">Cancel</button>
												<button id="modal_btn_confirm" type="button" className="btn btn-danger" data-bs-dismiss="modal" >Submit</button>
											</div>
										</div>
						</div>
							</div> 
						
						
							<div id="modal_AlertConfirmation" className="modal fade" role="dialog">
								<div className="modal-dialog">
						<div className="modal-content">
										<div className="modal-header">
												<h4 id="title" className="modal-title bg-success p-1 text-white"><strong>Attention:</strong> Delete Operation.</h4>
												<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
										</div>
										<div className="modal-body  text-white">
												<p>Mota2aked wala la2</p>
										</div>
										<div className="modal-footer">
												<button type="button" className="btn btn-muted" data-bs-dismiss="modal">Cancel</button>
										</div>
									</div>
					</div>
							</div> 
					</div>

				</div>
						
				<div id="row_2" className="col col-sm-6 col-md-4">
				<div id='andruavUnitList' className='row'>
							<ClssAndruavUnitList gcs_list={false} tab_planning={true} tab_main={false} tab_log={false} tab_details={false} tab_module={false}/>
				</div>
				<div className="row">	
						<div id="main_btn_group" className="btn-group" role="group" ><button
							type="button" id="btn_missions" className="btn btn-success btn-sm button_large">Mission Plans</button><button
							type="button" id="btn_geofences" className="btn btn-success btn-sm button_large">Geo Fences</button>
						</div>
					</div>
					
					<div id="fenceControl_section" className="row">	
						<div id="fenceControl" className='col  col-sm-12 m-1 p-1'>
						<ClssFenceClssShapeControl  />
						</div>
					</div>
					<div id="c_missioncontrol_section" className="row">	
						<div id="c_missioncontrol" className='col  col-sm-12 container-fluid localcontainer'>
						<CMissionsContainer/>
						</div>
					</div>
					<div id="fence_global_section" className="row">	
						<div id="fence_global" className='col  col-sm-12 container-fluid localcontainer'>
						<ClssFenceGlobalSettingsControl />
						</div>
					</div>
				</div>
		</div>
		<div id="modal_changeUnitInfo"  className="modal fade"  role="dialog">
				<div className="modal-dialog">
					<div className="modal-content">
						<div className="modal-header">
							<h4 id='title' className="modal-title bg-warning rounded_10px p-1 text-white">Change Speed</h4>
							<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div className="modal-body">
						<div className="container"></div>
							<div className="input-group align-items-center">
								<span id="txtNamelbl" className="input-group-addon  me-2">Name</span>
								<input id="txtUnitName" type="text" className="form-control rounded-3 me-3" placeholder=""
									aria-describedby="basic-addon2"/>
									
							</div>
							<div className="input-group mt-2 align-items-center">
								<span id="txtDescriptionlbl" className="input-group-addon me-2">Description</span>
								<input id="txtDescription" type="text" className="form-control rounded-3 me-3" placeholder=""
									aria-describedby="basic-addon2"/>
							</div>
						</div>
						<div className="modal-footer">
							<button id="btnCancel" type="button" data-bs-dismiss="modal" className="btn btn-muted">Cancel</button>
							<button id="btnOK" type="button" data-bs-dismiss="modal" className="btn btn-warning">GO</button>
						</div>
					</div>
				</div>
			</div>
		<div id="footer_div" className="row mt-0 me-0 mw-0 mb-5">
			<ClssFooterControl />
			</div>
	</div>
  );
};
  
export default Planning;
  