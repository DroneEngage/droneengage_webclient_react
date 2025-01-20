

import React from 'react';

import $ from 'jquery';

import { js_globals } from '../js/js_globals.js';
import { QueryString, fn_connect } from '../js/js_main';
import * as js_andruavMessages from '../js/js_andruavMessages';
import { js_localStorage } from '../js/js_localStorage'
import { js_speak } from '../js/js_speak'
import { js_eventEmitter } from '../js/js_eventEmitter'
import * as js_common from '../js/js_common.js'

const CONST_NOT_CONNECTION_OFFLINE 		= 0;
const CONST_NOT_CONNECTION_IN_PROGRESS 	= 1;
const CONST_NOT_CONNECTION_ONLINE 		= 2;

export class ClssLoginControl extends React.Component {
	constructor() {
		super();
		this.state = {
			is_connected: CONST_NOT_CONNECTION_OFFLINE,
			btnConnectText: 'Login',
		    'm_update': 0
		};
		
		this.key = Math.random().toString();
        
		this.txtEmailRef = React.createRef();
		this.txtAccessCodeRef = React.createRef();
		this.txtUnitIDRef = React.createRef();
		this.btnConnectRef = React.createRef();
		this.txtGroupNameRef = React.createRef();
		
		js_eventEmitter.fn_subscribe(js_globals.EE_onSocketStatus, this, this.fn_onSocketStatus);
		js_eventEmitter.fn_subscribe (js_globals.EE_Auth_Login_In_Progress, this, this.fn_onAuthInProgress);
	}


	fn_onSocketStatus(me, params) {
		js_common.fn_console_log('REACT:' + JSON.stringify(params));

		if (me.state.m_update === 0) return ;
        
		if (params.status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
			me.state.is_connected = CONST_NOT_CONNECTION_ONLINE;
			me.setState({ btnConnectText: 'Logout' });
			me.state.username = $('#txtUnitID').val();
			js_speak.fn_speak('Connected');


		}
		else {

			me.state.is_connected = CONST_NOT_CONNECTION_OFFLINE;
			me.setState({ btnConnectText: 'Login' });

			js_localStorage.fn_setEmail($('#txtEmail').val());
			js_localStorage.fn_setAccessCode($('#txtAccessCode').val());
			let s = $('#txtUnitID').val();
			if (s !== null) {
				js_localStorage.fn_setUnitID(s);
			}
			js_localStorage.fn_setGroupName($('#txtGroupName').val());

		}
	}

	fn_onAuthInProgress(me) {
		if (me.state.m_update === 0) return ;
		me.state.is_connected = CONST_NOT_CONNECTION_IN_PROGRESS;
		me.setState({'m_update': me.state.m_update +1});
	}

	clickConnect(e) {
		// Getting an array of DOM elements
		// Then finding which element was clicked
		fn_connect();
	}

	componentWillUnmount() {
		js_eventEmitter.fn_unsubscribe(js_globals.EE_onSocketStatus, this);
		js_eventEmitter.fn_unsubscribe (js_globals.EE_Auth_Login_In_Progress, this);
    }

	componentDidMount() {
		this.state.m_update = 1;

		if (QueryString.accesscode !== null) {
			if (this.txtAccessCodeRef.current !=  undefined)
			{
			this.txtAccessCodeRef.current.value = QueryString.accesscode;
			this.txtEmailRef.current.value = QueryString.email;
			this.txtGroupNameRef.current.value = QueryString.groupName; // Assuming txtGroupNameRef is also created
			this.txtUnitIDRef.current.value = QueryString.unitName;
			}
		  } else {
			this.txtEmailRef.current.value = js_localStorage.fn_getEmail();
			this.txtAccessCodeRef.current.value = js_localStorage.fn_getAccessCode();
			this.txtGroupNameRef.current.value = js_localStorage.fn_getGroupName();
			this.txtUnitIDRef.current.value =  js_localStorage.fn_getUnitID();
		}

		if (QueryString.connect !== undefined) {

			this.clickConnect(null);
		}
	}




	render() {


		let control = [];
		let title = "Login";
		let css = "bg-success";
		
		let ctrls = [];
		let ctrls2 = [];
		switch (this.state.is_connected) {
		  case CONST_NOT_CONNECTION_OFFLINE:
			ctrls.push(
			  <div key={"div_login" + this.key} className="">
				<div className="form-group al_l">
				  <label key={'txtEmail1' + this.key} htmlFor="txtEmail" id="email" className="text-white">
					Email
				  </label>
				  <input
					type="email"
					id="txtEmail"
					name="txtEmail"
					ref={this.txtEmailRef}
					className="form-control"
					defaultValue={
					  QueryString.email != null ? QueryString.email : js_localStorage.fn_getEmail()
					}
				  />
				</div>
				<div className="form-group al_l">
				  <label htmlFor="txtAccessCode" id="account" className="text-white" title="Access Code">
					Password
				  </label>
				  <input
					type="password"
					id="txtAccessCode"
					title="Access Code"
					name="txtAccessCode"
					ref={this.txtAccessCodeRef}
					className="form-control"
					defaultValue={
					  QueryString.accesscode != null ? QueryString.accesscode : js_localStorage.fn_getAccessCode()
					}
				  />
				</div>
				<div className="form-group al_l hidden">
				  <label htmlFor="txtGroupName" id="group" className="text-white">
					Group Name
				  </label>
				  <input
					type="text"
					id="txtGroupName"
					name="txtGroupName"
					ref={this.txtGroupNameRef} // Assuming txtGroupNameRef is created
					className="form-control"
					defaultValue={
					  QueryString.groupName != null ? QueryString.groupName : js_localStorage.fn_getGroupName()
					}
				  />
				</div>
				<div className="form-group al_l">
				  <label htmlFor="txtUnitID" id="unitID" className="text-muted">
					GCS ID
				  </label>
				  <input
					type="text"
					id="txtUnitID"
					name="txtUnitID"
					ref={this.txtUnitIDRef}
					className="form-control"
					defaultValue={
					  QueryString.unitName != null ? QueryString.unitName : js_localStorage.fn_getUnitID()
					}
				  />
				  <input type="hidden" id="txtUnitID_ext" name="txtUnitID_ext" value={"_" + js_common.fn_generateRandomString(2)} />
				</div>
				<br />
			  </div>
			);
			break;
			case CONST_NOT_CONNECTION_ONLINE:
				title = 'Logout';
				css = 'bg-danger';
				ctrls2.push(
				  <div key={"div_logout" + this.key} className=" "> {/* Key added here */}
					<div className="form-group al_l">
					  <label key={'txtEmail2' + this.key} htmlFor="txtEmail" id="email" className="text-muted">
						Email
					  </label>
					  <p>{js_localStorage.fn_getEmail()}</p>
					</div>
					<div className="form-group al_l">
					  <p className="text-muted">GCS ID</p>
					  <p>{js_localStorage.fn_getUnitID()}</p>
					</div>
				  </div>
				);
				break;
			  case CONST_NOT_CONNECTION_IN_PROGRESS:
				title = 'Connecting..';
				css = 'bg-warning';
				ctrls.push(
				  <div key={"div_connecting" + this.key} className=""> {/* Key added here */}
					<div className="form-group al_l">
					  <label key={'txtEmail1' + this.key} htmlFor="txtEmail" id="email" className="text-white">
						Email
					  </label>
					  <input
						type="email"
						id="txtEmail"
						name="txtEmail"
						ref={this.txtEmailRef}
						className="form-control"
						defaultValue={
						  QueryString.email != null ? QueryString.email : js_localStorage.fn_getEmail()
						}
						disabled // Disable input during connection
					  />
					</div>
					<div className="form-group al_l">
					  <label htmlFor="txtAccessCode" id="account" className="text-white" title="Access Code">
						Password
					  </label>
					  <input
						type="password"
						id="txtAccessCode"
						title="Access Code"
						name="txtAccessCode"
						ref={this.txtAccessCodeRef}
						className="form-control"
						defaultValue={
						  QueryString.accesscode != null ? QueryString.accesscode : js_localStorage.fn_getAccessCode()
						}
						disabled // Disable input during connection
					  />
					</div>
					<div className="form-group al_l hidden">
					  <label htmlFor="txtGroupName" id="group" className="text-white">
						Group Name
					  </label>
					  <input
						type="text"
						id="txtGroupName"
						name="txtGroupName"
						ref={this.txtGroupNameRef}
						className="form-control"
						defaultValue={
						  QueryString.groupName != null ? QueryString.groupName : js_localStorage.fn_getGroupName()
						}
						disabled // Disable input during connection
					  />
					</div>
					<div className="form-group al_l">
					  <label htmlFor="txtUnitID" id="unitID" className="text-muted">
						GCS ID
					  </label>
					  <input
						type="text"
						id="txtUnitID"
						name="txtUnitID"
						ref={this.txtUnitIDRef}
						className="form-control"
						defaultValue={
						  QueryString.unitName != null ? QueryString.unitName : js_localStorage.fn_getUnitID()
						}
						disabled // Disable input during connection
					  />
					  <input type="hidden" id="txtUnitID_ext" name="txtUnitID_ext" value={"_" + js_common.fn_generateRandomString(2)} />
					</div>
					<br />
				  </div>
				);
				break;
			}
		
			control.push(
			  <div key={'ClssLoginControl_complex' + this.key} className="dropdown">
				<button
				  className={'btn btn-secondary dropdown-toggle btn-sm mt-1 ' + css}
				  type="button"
				  id="dropdownMenuButton1"
				  data-bs-toggle="dropdown"
				  aria-expanded="false"
				>
				  {title}
				</button>
				<div className="dropdown-menu" aria-labelledby="dropdownMenuButton1"> {/* Removed unnecessary key */}
				  <div id="login_form" className="card-body"> {/* Removed unnecessary key */}
					{ctrls}
					<button
					  id="btnConnect"
					  className={
						"btn button_large rounded-3 m-2 user-select-none " +
						(this.state.is_connected === CONST_NOT_CONNECTION_OFFLINE
						  ? 'btn-success'
						  : 'btn-danger') +
						" p-0"
					  }
					  title={this.state.username}
					  onClick={this.clickConnect} // Removed (e) =>
					  ref={this.btnConnectRef}
					>
					  {this.state.btnConnectText}
					</button>
					{ctrls2}
				  </div>
				</div>
			  </div>
			);
		
			return control;
		  }
}


