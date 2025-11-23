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

import React, { useEffect } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';

import { js_globals } from '../js/js_globals.js'
import ClssHeaderControl from '../components/jsc_header'
import ClssFooterControl from '../components/jsc_footer'
import ClssAndruavUnitList from '../components/unit_controls/jsc_unitControlMainList.jsx'
import ClssMain_Control_Buttons from '../components/planning/jsc_ctrl_main_control_buttons.jsx'
import { fn_on_ready } from '../js/js_main'



const Planning = () => {
	const { t } = useTranslation('home'); // Use home namespace


	js_globals.CONST_MAP_EDITOR = true;

	useEffect(() => {

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
					</div>

				</div>

				<div id="row_2" className="col col-sm-6 col-md-4">
					<div id='andruavUnitList' className='row'>
						<ClssAndruavUnitList gcs_list={false} tab_planning={true} tab_main={false} tab_log={false} tab_details={false} tab_module={false} />
					</div>
					<div className="row">
						<ClssMain_Control_Buttons />
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

			<div id="footer_div" className="row mt-0 me-0 mw-0 mb-5">
				<ClssFooterControl />
			</div>
		</div>
	);
};


export default withTranslation('home')(Planning);