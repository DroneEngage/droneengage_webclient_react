

import React from 'react';

import $ from 'jquery';

import { js_globals } from '../js/js_globals.js';
import { QueryString, fn_connect } from '../js/js_main';
import * as js_andruavMessages from '../js/js_andruavMessages';
import { js_localStorage } from '../js/js_localStorage'
import { js_speak } from '../js/js_speak'
import { js_eventEmitter } from '../js/js_eventEmitter'
import * as js_common from '../js/js_common.js'

export class ClssLoginControl extends React.Component {
	constructor() {
		super();
		this.state = {
			is_connected: false,
			btnConnectText: 'Login',
		};
		this._isMounted = false;
		js_eventEmitter.fn_subscribe(js_globals.EE_onSocketStatus, this, this.fn_onSocketStatus);
	}


	fn_onSocketStatus(me, params) {
		js_common.fn_console_log('REACT:' + JSON.stringify(params));

		if (me._isMounted !== true) return;
		if (params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
			me.state.is_connected = true;
			me.setState({ btnConnectText: 'Logout' });
			me.state.username = $('#txtUnitID').val();
			js_speak.fn_speak('Connected');


		}
		else {

			me.state.is_connected = false;
			me.setState({ btnConnectText: 'Login' });

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
		fn_connect();
	}

	componentWillUnmount() {
		this._isMounted = false;
		js_eventEmitter.fn_unsubscribe(js_globals.EE_onSocketStatus, this);
	}

	componentDidMount() {
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


		var control = [];
		var title = "Login";
		var css = "bg-success";
		if (this.state.is_connected === true) {
			title = "Logout";
			css = "bg-danger";
		}
		control.push(
			<div key={'ClssLoginControl_complex'} className="dropdown">
				<button className={'btn btn-secondary dropdown-toggle btn-sm mt-1 ' + css} type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
					{title}
				</button>
				<div className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
					<div id='login_form' className="card-body">
						<div className={this.state.is_connected === true ? "hidden" : " "} >
							<div className="form-group al_l"><label key='txtEmail1' htmlFor="txtEmail" id="email" className="text-white">Email</label><input type="email" id="txtEmail" name="txtEmail" className="form-control" defaultValue={QueryString.email != null ? QueryString.email : js_localStorage.fn_getEmail()} /></div>
							<div className="form-group al_l"><label htmlFor="txtAccessCode" id="account" className="text-white" title="Access Code" >Password</label><input type="password" id="txtAccessCode" title="Access Code" name="txtAccessCode" className="form-control" defaultValue={QueryString.accesscode != null ? QueryString.accesscode : js_localStorage.fn_getAccessCode()} /></div>
							<div className="form-group al_l hidden">
								<label htmlFor="txtGroupName" id="group" className="text-white">Group Name</label>
								<input type="text" id="txtGroupName" name="txtGroupName" className="form-control" defaultValue={QueryString.groupName != null ? QueryString.groupName : js_localStorage.fn_getGroupName()} />
							</div>
							<div className="form-group al_l">
								<label htmlFor="txtUnitID" id="unitID" className="text-muted">GCS ID</label>
								<input type="text" id="txtUnitID" name="txtUnitID" className="form-control" defaultValue={QueryString.unitName != null ? QueryString.unitName : js_localStorage.fn_getUnitID()} />
								<input type="hidden" id="txtUnitID_ext" name="txtUnitID_ext" value={"_" + js_common.fn_generateRandomString(2)} />
							</div>
							<br />
						</div>
						<div id='login_btn mb-2 ' className='text-center'>
							<div className={this.state.is_connected === false ? "hidden" : " "} >
								<div className="form-group al_l"><label key='txtEmail2' htmlFor="txtEmail" id="email" className="text-muted">Email</label>
									<p>  {js_localStorage.fn_getEmail()} </p>
								</div>
								<div className="form-group al_l">
									<p className="text-muted">GCS ID</p>
									<p > {js_localStorage.fn_getUnitID()} </p>
								</div>
							</div>
							<button className={"btn button_large  rounded-3 m-2 user-select-none " + (this.state.is_connected === false ? 'btn-success' : 'btn-danger') + " p-0"} id="btnConnect" title={this.state.username} onClick={(e) => this.clickConnect(e)}>{this.state.btnConnectText}</button>
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


