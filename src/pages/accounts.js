import React , { useEffect } from 'react';

import '../css/bootstrap.min.css';  // my theme
import 'leaflet/dist/leaflet.css';
import '../css/bootstrap-icons/font/bootstrap-icons.css'
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_header_responsive.css';
import '../css/css_gamepad.css';


import 'jquery-ui-dist/jquery-ui.min.js';

import  'bootstrap/dist/js/bootstrap.bundle.min.js';

import {fn_on_account_ready} from '../js/js_main_accounts'

import {js_globals} from '../js/js_globals.js'

import ClssHeaderControl from '../components/jsc_header'
import ClssFooterControl from '../components/jsc_footer'
import ClssLoginControl from '../components/gadgets/jsc_cmp_login.jsx'
const Accounts = () => {

    useEffect(() => {
		js_globals.CONST_MAP_EDITOR = false;
		fn_on_account_ready();
	}
	);


    return (
        <div className="d-flex flex-column min-vh-100">
			<div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">

			<ClssHeaderControl no_login no_layout_ctrl/>
            </div>


        <div id='mainBody' className='row css_mainbody justify-content-center flex-grow-1 mb-4' >

            <div className="container">
                <div className="row margin_zero container justify-content-center g-4">

                    <div id="loginCtrl" className='col-12 col-md-8 col-lg-5'>
                        <div className="card shadow-sm border-0 rounded_10px h-100">
                            <div className="card-body p-4">
                                <ClssLoginControl />
                            </div>
                        </div>
                    </div>

                    <div id="help" className='col-12 col-md-8 col-lg-5'>
                        <div className="card shadow-sm border-0 rounded_10px h-100">
                            <div className="card-body p-4">
                                <h5 className="card-title text-primary mb-3">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Quick Help
                                </h5>
                                <ol className="ps-3 mb-0">
                                    <li className="mb-2"> Enter your email and press "AccessCode" to create a new account.</li>
                                    <li className="mb-2"> The system will generate your account credentials. Please save them.</li>
                                    <li className="mb-2"> Make sure you use a valid email.</li>
                                    <li className="mb-2"> "Regenerate" will create a new AccessCode under the same account.</li>
                                    <li className="mb-2"> Check this <a href="https://cloud.ardupilot.org/de-account-create.html" target="_blank" rel="noreferrer">page</a> for simple installation instructions.</li>
                                    <li className="mb-0"> For Support please contribute to <a href="https://discuss.ardupilot.org/" target="_blank" rel="noreferrer">https://discuss.ardupilot.org/</a></li>
                                </ol>
                            </div>
                        </div>
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

  export default Accounts;
