

import React from 'react';

import $ from 'jquery';

import { js_globals } from '../js/js_globals.js';
import { QueryString, fn_connect, fn_logout } from '../js/js_main';
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
			me.state.username = me.txtUnitIDRef.current.value;
			js_speak.fn_speak('Connected');


		}
		else {

			me.state.is_connected = CONST_NOT_CONNECTION_OFFLINE;
			me.setState({'m_update': me.state.m_update +1});

		}
	}

	fn_onAuthInProgress(me) {
		if (me.state.m_update === 0) return ;
		me.state.is_connected = CONST_NOT_CONNECTION_IN_PROGRESS;
		me.setState({'m_update': me.state.m_update +1});
	}

	clickConnect(e) {
		
		if (this.state.is_connected !== CONST_NOT_CONNECTION_OFFLINE)
		{
			// online or connecting
			fn_logout();
			this.setState({ is_connected: CONST_NOT_CONNECTION_OFFLINE });
			
		}
		else
		{
			// offline 
			this.setState({'m_update': this.state.m_update +1});
			
			js_localStorage.fn_setEmail(this.txtEmailRef.current.value);
			js_localStorage.fn_setAccessCode(this.txtAccessCodeRef.current.value);
			let s = this.txtUnitIDRef.current.value;
			if (s !== null) {
				js_localStorage.fn_setUnitID(s);
			}
			js_localStorage.fn_setGroupName(this.txtGroupNameRef.current.value);

			fn_connect(this.txtEmailRef.current.value, this.txtAccessCodeRef.current.value);
		}
	}

	componentWillUnmount() {
		js_eventEmitter.fn_unsubscribe(js_globals.EE_onSocketStatus, this);
		js_eventEmitter.fn_unsubscribe (js_globals.EE_Auth_Login_In_Progress, this);
    }

	componentDidMount() {
		// Use setState to update m_update
		this.setState({ m_update: 1 });
	  
		// Use the QueryString function to get query parameters
		const queryParams = QueryString;
		
		// Check if specific parameters are present in the query string
		const hasRequiredParams = 
		queryParams.accesscode !== undefined ||
		queryParams.email !== undefined ||
		queryParams.groupName !== undefined ||
		queryParams.unitName !== undefined;
		
		// Only execute the code block if the required parameters are present
		if (hasRequiredParams && this.txtAccessCodeRef.current) {
			this.txtAccessCodeRef.current.value = queryParams.accesscode || '';
			this.txtEmailRef.current.value = queryParams.email || '';
			this.txtGroupNameRef.current.value = queryParams.groupName || '';
			this.txtUnitIDRef.current.value = queryParams.unitName || '';
		  } else {
			// Fallback to localStorage values if required parameters are not present
			this.txtEmailRef.current.value = js_localStorage.fn_getEmail();
			this.txtAccessCodeRef.current.value = js_localStorage.fn_getAccessCode();
			this.txtGroupNameRef.current.value = js_localStorage.fn_getGroupName();
			this.txtUnitIDRef.current.value = js_localStorage.fn_getUnitID();
		  }
	  
		// Check if the connect parameter is present in the query string
		if (queryParams.connect !== undefined) {
		  this.clickConnect(null); // Remove redundant 'this' argument
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
						css +
						" p-0"
					  }
					  title={this.state.username}
					  onClick={(e) => this.clickConnect(e)} // Removed (e) =>
					  ref={this.btnConnectRef}
					>
					  {title}
					</button>
					{ctrls2}
				  </div>
				</div>
			  </div>
			);
		
			return control;
		  }
}


