import $ from 'jquery';

import React from 'react';

import { fn_do_modal_confirmation } from '../js/js_main_accounts.js'
import { js_andruavAuth } from '../js/js_andruavAuth'
import { js_localStorage } from '../js/js_localStorage'
import { gui_alert } from '../js/js_main_accounts'
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';

// Registration and Regeneration Control
export default class ClssLoginControl extends React.Component {
	constructor() {
		super();
		this.state = {
			is_connected: false,
			btnConnectText: 'Login',
			initialized: false,
		};

		this.m_emailRef = React.createRef();
		this.m_accessRef = React.createRef();
				
	}


	fn_EE_permissionReceived(me, params) {


		js_localStorage.fn_setEmail(this.m_emailRef.current.value);
		js_localStorage.fn_setAccessCode($('#txtAccessCode').val());

		me.setState({ 'is_connected': true });

	}

	fn_EE_permissionBadLogin(me, params) {

		me.setState({ 'is_connected': false });

		gui_alert('Bad Login', params.msg, 'danger');
	}

	fn_EE_permissionDeleted(me, params) {
		js_andruavAuth.fn_retrieveLogin(this.m_emailRef.current.value, $('#txtAccessCode').val());
	}


	fn_validateCaptcha(callback) {
		let user_captcha = document.getElementById('user_captcha_input').value;

		if (validateCaptcha(user_captcha) === true) {
			alert('Captcha Matched');
			
			document.getElementById('user_captcha_input').value = "";

			if (callback !== null) callback();
		}

		else {
			alert('Captcha Does Not Match');
			document.getElementById('user_captcha_input').value = "";
		}
	}

	fn_clickConnect(e) {

		this.fn_validateCaptcha(() => {
			const v_permission = '0xffffffff';
			js_andruavAuth.fn_generateAccessCode(this.m_emailRef.current.value, v_permission);
		});
	}

	fn_clickRegenerate(e) {


		this.fn_validateCaptcha(() => {
			// Get references to the radio buttons
			const chk_fullctrl = document.getElementById("input_fullctrl");
			const chk_readonlyctrl = document.getElementById("input_readonlyctrl");

			// Check which radio button is selected
			let v_permission = 0x0;
			if (chk_fullctrl.checked) {
				v_permission = '0xffffffff';
			} else if (chk_readonlyctrl.checked) {
				v_permission = '0xffff00ff';
			} else {
				v_permission = '0xffffffff';
			}

			js_andruavAuth.fn_regenerateAccessCode(this.m_emailRef.current.value, v_permission);
		});
	}



	componentWillUnmount() {
		//js_eventEmitter.fn_unsubscribe ( EE_permissionReceived,this);
		//js_eventEmitter.fn_unsubscribe ( EE_permissionBadLogin,this);
		//js_eventEmitter.fn_unsubscribe ( EE_permissionDeleted,this);
	}

	componentDidMount() {

		if (this.state.initialized === true) {
			return;
		}

		this.state.initialized = true;

		$('#txtEmail').val(js_localStorage.fn_getEmail());
		loadCaptchaEnginge(6);
	}





	render() {

		let login = "Access Code Generator";
		if (this.state.is_connected === true) {
			login += "ed - As " + this.m_emailRef.current.value;
		}
		return (
			<div>
				<p className="bg-success  text-center"><strong>{login}</strong></p>
				<div id='login_form' >
					<div className="form-group al_l">
						<label htmlFor="txtEmail" id="email">Email</label>
						<input type="email" id="txtEmail" ref={this.m_emailRef} name="txtEmail" className="form-control" defaultValue={js_localStorage.fn_getEmail()} />
					</div>
					<br />
				</div>

				<div className="form-check">
					<input className="form-check-input" type="radio" value="" id="input_fullctrl" name='grp_permission' />
					<label className="form-check-label" htmlFor="myCheckbox">
						Full Control
					</label>
				</div>
				<div className="form-check">
					<input className="form-check-input" type="radio" value="" id="input_readonlyctrl" name='grp_permission' />
					<label className="form-check-label" htmlFor="myCheckbox">
						Read Only
					</label>
				</div>

				<div className="container">
					<div className="form-group">

						<div className="col mt-3">
							<LoadCanvasTemplate />
						</div>

						<div className="col mt-3">
							<div><input placeholder="Enter Captcha Value" id="user_captcha_input" name="user_captcha_input" type="text"></input></div>
						</div>

						<div className="col mt-3">
							<div className="row">
								<div className="col-6 al_l">
									<a href="#" id='login_btn' className="btn btn-primary" onClick={(e) => this.fn_clickConnect(e)}><span className="glyphicon glyphicon-download-alt"  ></span> AccessCode</a>
								</div>
								<div className="col-6 al_l">
									<a className="btn btn-danger" data-bs-toggle="modal" href="#regeneratemodal" onClick={(e) => this.fn_clickRegenerate(e)}><span className="glyphicon glyphicon-retweet"></span> Regenerate</a>
								</div>
							</div>
						</div>

					</div>
				</div>

			</div>
		);
	}
}







