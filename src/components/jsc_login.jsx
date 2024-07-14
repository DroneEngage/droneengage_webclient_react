//import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/bootstrap.min.css';


import React from 'react';
import ReactDOM from "react-dom/client";

import $ from 'jquery'; 

import {js_globals} from '../js/js_globals.js';
import * as js_helpers from '../js/js_helpers';
import * as  js_siteConfig from '../js/js_siteConfig'
import {QueryString, fn_connect} from '../js/js_main';
import * as js_andruavMessages from '../js/js_andruavMessages';
import {js_localStorage} from '../js/js_localStorage'
import {js_speak} from '../js/js_speak'


const res_CLSS_LoginControl =
{
	'en':
	{
		'1': 'Login',
		'2': 'Logout',
		'3': 'Login',
		'4': 'Password:',
		'5': 'Connection URL'
	},
	'ar':
	{
		'1': 'دخول',
		'2': 'خروج',
		'3': ' بيانات الاتصال ',
		'4': 'كود الاتصال:',
		'5': 'رابط الاتصال'
	}

}

export class CLSS_LoginControl extends React.Component {
	constructor() {
		super();
		this.state = {
			is_connected: false,
			btnConnectText: res_CLSS_LoginControl[js_localStorage.fn_getLanguage()]['1'],
		};
		this._isMounted = false;
    	// js_eventEmitter.fn_subscribe(js_globals.EE_onSocketStatus, this, this.fn_onSocketStatus);
	}

	
	fn_onSocketStatus(me, params) {
		js_globals.fn_console_log('REACT:' + JSON.stringify(params));

		if (me._isMounted!==true) return ;
    	if (params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
			me.state.is_connected = true;
			me.setState({ btnConnectText: res_CLSS_LoginControl[js_localStorage.fn_getLanguage()]['2'] });
			me.state.username = $('#txtUnitID').val();
			js_speak.fn_speak('Connected');


		}
		else {

			me.state.is_connected = false;
			me.setState({ btnConnectText: res_CLSS_LoginControl[js_localStorage.fn_getLanguage()]['1'] });

			js_localStorage.fn_setEmail($('#txtEmail').val());
			js_localStorage.fn_setAccessCode($('#txtAccessCode').val());
			var s = $('#txtUnitID').val();
			if (s !== null) {
				js_localStorage.fn_setUnitID(s);
			}
			js_localStorage.fn_setGroupName($('#txtGroupName').val());

		}
	}

	clickConnect(e) {
		// Getting an array of DOM elements
		// Then finding which element was clicked
		if (js_globals.v_connectState === true) {
			js_globals.v_connectState = false;
			js_globals.v_connectRetries = 0;
		}

		fn_connect();
		// EventEmitter.fn_unsubscribe ('Oppa',this.state.Me);
	}

	componentWillUnmount() {
		this._isMounted = false;
		// js_eventEmitter.fn_unsubscribe(EE_onSocketStatus, this);
	}

	componentDidMount() {
		//EventEmitter.fn_dispatch(EE_updateLogin,{});
		this._isMounted = true;

		if (QueryString.accesscode !== null) {

			$('#account').val(QueryString.accesscode);
			$('#email').val(QueryString.email);
			$('#group').val(QueryString.groupName);
			$('#unitID').val(QueryString.unitName);

		}
		else {

			$('#txtEmail').val(js_localStorage.fn_getEmail());
			$('#txtAccessCode').val(js_localStorage.fn_getAccessCode());
			$('#txtGroupName').val(js_localStorage.fn_getGroupName());
			$('#txtUnitID').val(js_localStorage.fn_getUnitID());

		}

		if (QueryString.connect !== undefined) {

			this.clickConnect(null);
		}


	}

	


	render() {


		var login = "Login";
		if (this.state.is_connected === true) {
			login += " - " + $('#txtUnitID').val();
		}
		if (this.props.simple === null) {
			return (
				<div key={'CLSS_LoginControl_simple'}  className="card text-white border-light mb-3" >
					<div className="card-header  text-center"> <strong>{login}</strong></div>
					<div id='login_form' className="card-body">
						<div className={this.state.is_connected === true ? "hidden" : " "} >
							<div className="form-group al_l"><label htmlFor="txtEmail" id="email" className="text-white">Email</label><input type="email" id="txtEmail" name="txtEmail" className="form-control" defaultValue={QueryString.email != null ? QueryString.email : js_localStorage.fn_getEmail()} /></div>
							<div className="form-group al_l"><label htmlFor="txtAccessCode" id="account" className="text-white">Access Code</label><input type="password" id="txtAccessCode" name="txtAccessCode" className="form-control" defaultValue={QueryString.accesscode != null ? QueryString.accesscode : js_localStorage.fn_getAccessCode()} /></div>
							<div className="form-group al_l hidden">
								<label htmlFor="txtGroupName" id="group" className="text-white">Group Name</label>
								<input type="text" id="txtGroupName" name="txtGroupName" className="form-control" defaultValue={QueryString.groupName != null ? QueryString.groupName : js_localStorage.fn_getGroupName()} />
							</div>
							<div className="form-group al_l">
								<label htmlFor="txtUnitID" id="unitID" className="text-muted">GCS ID</label>
								<input type="text" id="txtUnitID" name="txtUnitID" className="form-control" defaultValue={QueryString.unitName != null ? QueryString.unitName : js_localStorage.fn_getUnitID()} />
								<input type="hidden" id="txtUnitID_ext" name="txtUnitID_ext" value={"_" + js_helpers.fn_generateRandomString(2)}/></div>
							<br />
						</div>
						<div id='login_btn mb-2 ' className='text-center'>
							<button className={"btn  button_large  rounded-3 m-2 user-select-none " + (this.state.is_connected === false ? 'btn-success' : 'btn-danger')} id="btnConnect" title={this.state.username} onClick={(e) => this.clickConnect(e)}>{this.state.btnConnectText}</button>

						</div>
					</div>
				</div>
			);
		}
		else {
			var control = [];
			var title = "Login";
			var css = "bg-success";
			if (this.state.is_connected === true) {
				title = "Logout";
				css = "bg-danger";
			}
			control.push(
				<div key={'CLSS_LoginControl_complex'} className="dropdown">
					<button className={'btn btn-secondary dropdown-toggle ' + css} type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
						{title}
					</button>
					<div className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
						<div id='login_form' className="card-body">
							<div className={this.state.is_connected === true ? "hidden" : " "} >
								<div className="form-group al_l"><label htmlFor="txtEmail" id="email" className="text-white">Email</label><input type="email" id="txtEmail" name="txtEmail" className="form-control" defaultValue={QueryString.email != null ? QueryString.email : js_localStorage.fn_getEmail()} /></div>
								<div className="form-group al_l"><label htmlFor="txtAccessCode" id="account" className="text-white" title="Access Code" >Password</label><input type="password" id="txtAccessCode" title="Access Code" name="txtAccessCode" className="form-control" defaultValue={QueryString.accesscode != null ? QueryString.accesscode : js_localStorage.fn_getAccessCode()} /></div>
								<div className="form-group al_l hidden">
									<label htmlFor="txtGroupName" id="group" className="text-white">Group Name</label>
									<input type="text" id="txtGroupName" name="txtGroupName" className="form-control" defaultValue={QueryString.groupName != null ? QueryString.groupName : js_localStorage.fn_getGroupName()} />
								</div>
								<div className="form-group al_l">
									<label htmlFor="txtUnitID"  id="unitID" className="text-muted">GCS ID</label>
									<input type="text" id="txtUnitID" name="txtUnitID" className="form-control" defaultValue={QueryString.unitName != null ? QueryString.unitName : js_localStorage.fn_getUnitID()} />
									<input type="hidden" id="txtUnitID_ext" name="txtUnitID_ext" value={"_" + js_helpers.fn_generateRandomString(2)}/>
								</div>
								<br />
							</div>
							<div id='login_btn mb-2 ' className='text-center'>
							<div className={this.state.is_connected === false ? "hidden" : " "} >
								<div className="form-group al_l"><label htmlFor="txtEmail" id="email" className="text-muted">Email</label>
									<p>  {js_localStorage.fn_getEmail()} </p>
								</div>
								<div className="form-group al_l">
									<label  id="unitID" className="text-muted">GCS ID</label>
									<p > {js_localStorage.fn_getUnitID()} </p>
								</div>
							</div>
							<button className={"button  button_large  rounded-3 m-2 user-select-none " + (this.state.is_connected === false ? 'btn-success' : 'btn-danger')} id="btnConnect" title={this.state.username} onClick={(e) => this.clickConnect(e)}>{this.state.btnConnectText}</button>
							</div>
						</div>
					</div>
				</div>
			);

			return (
				control
			);
		}
	}

}


