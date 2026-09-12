import React , { useEffect } from 'react';
import * as js_preferences from '../js/state/preferences.js';
import * as js_siteConfig from '../js/config/js_siteConfig.js';

import '../css/bootstrap-icons/font/bootstrap-icons.css'
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_header_responsive.css';
import '../css/css_gamepad.css';

import { fn_ensureVendorCSS, VENDOR_CSS } from '../js/config/js_vendor_css.js';

import 'jquery-ui-dist/jquery-ui.min.js';

import  'bootstrap/dist/js/bootstrap.bundle.min.js';

import {fn_on_account_ready} from '../js/js_main_accounts'


import ClssHeaderControl from '../components/jsc_header'
import ClssFooterControl from '../components/jsc_footer'
import ClssLoginControl from '../components/gadgets/jsc_cmp_login.jsx'

fn_ensureVendorCSS(VENDOR_CSS.leaflet.id, VENDOR_CSS.leaflet.href);

const Accounts = () => {

    useEffect(() => {
		js_preferences.fn_setMapEditor(false);
		fn_on_account_ready();
	}
	);

    // The public account-creation page is only available on the public
    // free deployment. CONST_ACCOUNT_URL_ENABLE (overridable via
    // config.json / config.local.json) gates both the header link and
    // this page itself, so direct navigation to /accounts is also blocked.
    if (!js_siteConfig.CONST_ACCOUNT_URL_ENABLE) {
        return (
            <div className="d-flex flex-column min-vh-100">
                <div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">
                    <ClssHeaderControl no_login no_layout_ctrl/>
                </div>
                <div id="mainBody" className="row css_mainbody justify-content-center flex-grow-1 mb-4">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-12 col-md-8 col-lg-6">
                                <div className="card shadow-sm border-0 rounded_10px h-100">
                                    <div className="card-body p-4 text-center">
                                        <i className="bi bi-lock text-warning" style={{ fontSize: '3rem' }}></i>
                                        <h4 className="mt-3 text-warning">Account Creation Unavailable</h4>
                                        <p className="text-muted">
                                            Public account registration is not enabled on this deployment.
                                            Please contact your administrator.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="footer_div" className="row mt-0 me-0 mw-0 mb-0">
                    <ClssFooterControl />
                </div>
            </div>
        );
    }

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
                                <h5 className="card-title text-light mb-3">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Quick Help
                                </h5>
                                <ol className="ps-3 mb-0">
                                    <li className="mb-2"> Enter your email and press "AccessCode" to create a new TeamID with a single Admin account.</li>
                                    <li className="mb-2"> The system will generate your account credentials. Please save them.</li>
                                    <li className="mb-2"> Make sure you use a valid email.</li>
                                    <li className="mb-2"> "Regenerate" will create a new AccessCode under the same account.</li>
                                    <li className="mb-2"> Use the <a href="teamadmin" target="_blank" rel="noreferrer">Team Admin</a> to manage your team members after login.</li>
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
