import React , { useEffect } from 'react';

import '../css/bootstrap.min.css';  // my theme
import 'leaflet/dist/leaflet.css';
import '../css/bootstrap-icons/font/bootstrap-icons.css'
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_gamepad.css';


import 'jquery-ui-dist/jquery-ui.min.js';

import  'bootstrap/dist/js/bootstrap.bundle.min.js';

import {fn_on_account_ready} from '../js/js_main_accounts'

import {js_globals} from '../js/js_globals.js'

import ClssHeaderControl from '../components/jsc_header'
import ClssFooterControl from '../components/jsc_footer'
import ClssLoginControl from '../components/jsc_cmp_login.jsx'
const Accounts = () => {

    useEffect(() => {
		js_globals.CONST_MAP_EDITOR = false;
		fn_on_account_ready();
	}
	);
  
  	
    return (
        <div>
			<div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">
                
			<ClssHeaderControl no_login no_layout_ctrl/>
            </div>

			
        <div id='mainBody' className='row css_mainbody justify-content-center' > 
            
            <div className="container">
                <div className="row margin_zero container justify-content-center">
                <div id="loginCtrl" className='col-12 col-md-8 col-lg-6'> 
                    <ClssLoginControl />
                </div>
                </div>
                <br/>
            <div className="row margin_zero container justify-content-center"> 
                <div id="help" className='col-12 col-md-8 col-lg-6'> 
                    <h3 className="text-primary" >Quick Help</h3>
                    <ol>
                        <li> You can generate access code easily from this webpage. You can also regenerate your access code i.e. change it.</li>
                        <li> Make sure you use a valid email as access code is sent to your email.</li>
                        <li> If this is your first time to use the system then please select press "AccessCode".</li>
                        <li> "Regenerate" will create a new access code -password- or a secondary account with different permissions.</li>
                        <li> Secondary account will have the same email but different access code -password-.</li>
                        <li> Check this <a href="https://cloud.ardupilot.org/de-account-create.html" target="_blank">page</a> for simple installation instructions.</li>
                        <li> For Support please contribute to <a href="https://discuss.ardupilot.org/" target="_blank">https://discuss.ardupilot.org/</a></li>
                    </ol>
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
  
  export default Accounts;
