import 'leaflet.pm/dist/leaflet.pm.css';
import * as js_preferences from '../js/state/preferences.js';
import '../css/bootstrap-icons/font/bootstrap-icons.css'
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_header_responsive.css';
import '../css/css_planning.css';
import '../css/css_gamepad.css';

import { fn_ensureVendorCSS, VENDOR_CSS } from '../js/config/js_vendor_css.js';

import 'leaflet';              // side-effect: sets window.L. Must load before
                               // leaflet.pm — the plugin extends leaflet's
                               // global L, and with code splitting leaflet.pm
                               // can otherwise evaluate before L exists
                               // ("L is not defined").
import 'leaflet.pm';
import 'jquery-ui-dist/jquery-ui.min.js';

import React, { useEffect } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import ClssHeaderControl from '../components/jsc_header'
import ClssFooterControl from '../components/jsc_footer'
import ClssAndruavUnitList from '../components/unit_controls/jsc_unitControlMainList.jsx'
import ClssMain_Control_Buttons from '../components/planning/jsc_ctrl_main_control_buttons.jsx'
import DialogHost from '../components/DialogHost.jsx'
import MapPopupHost from '../components/popups/MapPopupHost.jsx'
import { fn_on_ready } from '../js/js_main'
import { js_andruavAuth } from '../js/protocol/auth/js_andruav_auth.js'

fn_ensureVendorCSS(VENDOR_CSS.leaflet.id, VENDOR_CSS.leaflet.href);



const Planning = () => {
	const { t } = useTranslation('home'); // Use home namespace
	const navigate = useNavigate();

	// Defense-in-depth: the route guard in index.js already redirects
	// view-mode accounts away from the planning routes. This in-page guard
	// covers any future alias or direct mount that bypasses the router.
	useEffect(() => {
		if (js_andruavAuth.fn_do_isViewMode()) {
			navigate('/home', { replace: true });
		}
	}, [navigate]);


	js_preferences.fn_setMapEditor(true);

	useEffect(() => {
		fn_on_ready();
	}, []);

	return (
		<div>
			<div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">
				<ClssHeaderControl no_3dmap/>
			</div>

			<div id='mainBody' className='css_mainbody' >
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
				<div id="row_2" className="col-lg-4 col-xl-4 col-xxl-4 col-12">
					<div id='andruavUnitList' className='col-12 padding_zero'>
						<ClssAndruavUnitList show_card={false} tab_planning={true} tab_main={false} tab_log={false} tab_details={false} tab_module={false} />
					</div>
					<div className="col-12 padding_zero">
						<ClssMain_Control_Buttons />
					</div>

					<DialogHost />
				<MapPopupHost />
				</div>
			</div>

			<div id="footer_div" className="row mt-0 me-0 mw-0 mb-0">
				<ClssFooterControl />
			</div>
		</div>
	);
};


export default withTranslation('home')(Planning);