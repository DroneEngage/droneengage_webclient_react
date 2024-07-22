import React , { useEffect } from 'react';

import '../css/bootstrap.min.css';  // my theme
import 'leaflet/dist/leaflet.css';
import '../css/bootstrap-icons/font/bootstrap-icons.css'
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_gamepad.css';


import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.min.js';

import  'bootstrap/dist/js/bootstrap.bundle.min.js';
import Modal from 'bootstrap/js/dist/modal';

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
                
			<ClssHeaderControl />
            </div>

			
        <div id="modal_saveConfirmation" className="modal fade" role="dialog">
            <div className="modal-dialog">

                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="margin_zero btn-close" data-bs-dismiss="modal" aria-hidden="true">&times;</button>
                        <h4 id="title" className="modal-title bg-success text-white"><strong>Attention:</strong> Delete Operation.</h4>
                    </div>
                    <div className="modal-body">
                        <p id="conf">XAre you?</p>
                        <div className='row'>
                        <div className='col-sm-6'>
                            <div className="capbox">
                            <div id="CaptchaDiv"></div>
                
                            <div className="capbox-inner">
                            Type the above number:<br/>
                
                            <input type="hidden" id="txtCaptcha"/>
                            <input type="text" name="CaptchaInput" id="CaptchaInput" size="15"/><br/>
                            <br/><br/>
                            </div>
                            </div>
                        </div>
                        <div className='col-sm-6'>
                        <p id="res">XAre you?</p>
                        </div>  
                        </div>
                        
                        <div className="modal-footer">
                            <button type="button" className="btn btn-muted" data-bs-dismiss="modal">Cancel</button>
                            <button id="geo_btn_confirm" type="button" className="btn btn-danger" >Submit</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>  


        <div id='mainBody' className='row css_mainbody' >
			
            <div className="container">
                <div className="row margin_zero container ">
                <div id="loginCtrl">
                    <ClssLoginControl />
                </div>
                </div>
                <br/>
            <div className="row margin_zero container">
                <div id="help" className="">
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
  