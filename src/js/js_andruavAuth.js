/* ********************************************************************************
*   Mohammad Hefny
*
*   2 Aug 2016
*
*********************************************************************************** */
import $ from 'jquery'; 
import * as  js_siteConfig from './js_siteConfig.js'
import * as js_andruavMessages from './js_andruavMessages'
import {js_eventEmitter} from './js_eventEmitter'


const EE_Auth_Logined      		 	 = "_EA_96A4ED6B1E1_";
const EE_Auth_BAD_Logined      		 = "_EA_96A4ED6B1E2_";
const EE_Auth_Account_Created		 = "_EA_96A4ED6B1E3_";
const EE_Auth_Account_Regenerated	 = "_EA_96A4ED6B1E4_";
const EE_Auth_Account_BAD_Operation	 = "_EA_96A4ED6B1E5_";


const CONST_WEB_FUNCTION					= '/w';
const CONST_WEB_LOGIN_COMMAND				= '/wl/';
const CONST_ACCOUNT_MANAGMENT       		= '/am/';
const CONST_CMD_CREATE_ACCESSCODE   		= 'c';
const CONST_CMD_REGENERATE_ACCESSCODE       = 'r';

const CONST_ACCOUNT_NAME_PARAMETER          = 'acc';
const CONST_ACCESS_CODE_PARAMETER           = 'pwd';
const CONST_SUB_COMMAND               		= 'scm';  
const CONST_ERROR_MSG						= 'em';
const CONST_ACTOR_TYPE						= 'at'; 
const CONST_SESSION_ID                      = 'sid';
const CONST_PERMISSION_PARAMETER            = 'prm';


class CAndruavAuth {
    constructor() {
        
        this.m_username = '';
        
        window._localserverIP = "127.0.0.1";
        window._localserverPort = 9211;

        this._m_ver = '5.0.0';
        if (js_siteConfig.CONST_TEST_MODE === true)
        {
            this.m_auth_ip = js_siteConfig.CONST_TEST_MODE_IP; 
        }
        else
        {
            this.m_auth_ip = js_siteConfig.CONST_PROD_MODE_IP;
        }
        this._m_auth_port = '19408';
        this._m_auth_ports = '19408'; 
        this._m_perm = 0;
        this._m_permissions_ = '';
        this._m_session_ID = null;
        this._m_logined = false;
        this.C_ERR_SUCCESS_DISPLAY_MESSAGE = 1001;

    }

    static getInstance() {
        // Check if the instance is null, and create a new one if it is
        if (!CAndruavAuth.instance) {
            CAndruavAuth.instance = new CAndruavAuth();
        }
        return CAndruavAuth.instance;
    
    }

    fn_getSessionID()
    {
        return this._m_session_ID;
    }

    fn_logined()
    {
        return this._m_logined;
    }

    fn_getPermission() {
        return this._m_permissions_;
    }

    fn_do_canGCS() {
        return ((this._m_perm & js_andruavMessages.CONST_ALLOW_GCS) === js_andruavMessages.CONST_ALLOW_GCS);
    }

    fn_do_canControl() {
        return ((this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_FULL_CONTROL) === js_andruavMessages.CONST_ALLOW_GCS_FULL_CONTROL);
    }

    fn_do_canControlWP() {
        return ((this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_WP_CONTROL) === js_andruavMessages.CONST_ALLOW_GCS_WP_CONTROL);
    }
    
    
    fn_do_canControlModes() {
        return ((this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_MODES_CONTROL) === js_andruavMessages.CONST_ALLOW_GCS_MODES_CONTROL);
    }
    
    fn_do_canVideo() {
        return ((this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_VIDEO) === js_andruavMessages.CONST_ALLOW_GCS_VIDEO);
    }



	fn_do_loginAccount (p_userName, p_accessCode) {
    if ((p_userName == null) || (p_userName.length == 0) || (p_accessCode == null) || (p_userName.accessCode == 0)) {
        this._m_logined = false;
        return;
    }

    var _url;
    if (window.location.protocol == 'https:') {
	    _url = 'https://' + this.m_auth_ip  + ':' + this._m_auth_ports + CONST_WEB_FUNCTION + CONST_WEB_LOGIN_COMMAND; //   + '?cmd=v&acc=' + userName + '&pwd=' + accessCode + '&app=andruav&ver=' + ver + '&ex=' + fn_eval ("349032c439313b1937512b112f442710302137510844310024c132c427d92f443490084427103021264935792e6927d92f443490084434902b1134902d9027d90d99040000513d09264924c1349026492a400400064027d9069104003b1905f110812f44271032c4357924c1366405f10d993d09"._fn_hexDecode());
		
	}
	else {
	    _url = 'http://' + this.m_auth_ip  + ':' + this._m_auth_port + CONST_WEB_FUNCTION + CONST_WEB_LOGIN_COMMAND; //  + '?cmd=v&acc=' + userName + '&pwd=' + accessCode + '&app=andruav&ver=' + ver + '&ex=' + fn_eval ("349032c439313b1937512b112f442710302137510844310024c132c427d92f443490084427103021264935792e6927d92f443490084434902b1134902d9027d90d99040000513d09264924c1349026492a400400064027d9069104003b1905f110812f44271032c4357924c1366405f10d993d09"._fn_hexDecode());
	}


    var p_keyValues = {
        'acc': p_userName,
        'pwd': p_accessCode,
        'gr': "1",
        'app': 'andruav',
        'ver': this._m_ver,
        'ex': 'Andruav',
        'at': 'g' // GCS
    };

    var v_res = null;
	var Me = this;
    $.ajax({
        url: _url,
        type: 'POST',
        data: p_keyValues,
        dataType: 'text',

        success: function (v__res) {
            v_res = JSON.parse(v__res);

            if (v_res.e == 0) {
                Me._m_logined = true;
                Me._m_session_ID = v_res.sid;
                Me.m_server_port = v_res.cs.h;
                Me.m_server_ip = v_res.cs.g;
                Me.server_AuthKey = v_res.cs.f; // authentication key of WS
                Me.m_username = p_userName;
                Me._m_permissions_ = v_res.per;
                if (v_res.prm==null) v_res.prm = 0xffffffff;  // auth server does not support permission (backward compatibility)
                Me._m_perm = v_res.prm;
                js_eventEmitter.fn_dispatch(EE_Auth_Logined, v_res);
            } else {
                Me._m_logined = false;
                Me.m_error = v_res.e;
                Me.m_errorMessage = 'Cannot Login .. ' + v_res.em;
                js_eventEmitter.fn_dispatch(EE_Auth_BAD_Logined, v_res);

            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            Me._m_logined = false;
            Me.m_error = Me.C_ERR_SUCCESS_DISPLAY_MESSAGE;
            Me.m_errorMessage = 'Cannot Login .. Bad Connection';
            js_eventEmitter.fn_dispatch(EE_Auth_BAD_Logined, v_res);

        },
        async: false // remove it later when you SYNC with 2eN
    });
	};


	fn_generateAccessCode (p_accountName, p_permission) 
	{
		if ((p_accountName == null) || (p_accountName.length == 0)) {
			return;
		}

        if ((p_permission == null) || (typeof(p_permission) != 'string'))
        {
            return ;
        }


		var _url;
		if (window.location.protocol ==  'https:') {
			_url = 'https://'+ this.m_auth_ip + ':' + this._m_auth_ports + CONST_WEB_FUNCTION + CONST_ACCOUNT_MANAGMENT; // + '?cmd=v&acc=' + userName + '&pwd=' + accessCode + '&app=andruav&ver=' + ver + '&ex=' + fn_eval ("349032c439313b1937512b112f442710302137510844310024c132c427d92f443490084427103021264935792e6927d92f443490084434902b1134902d9027d90d99040000513d09264924c1349026492a400400064027d9069104003b1905f110812f44271032c4357924c1366405f10d993d09"._fn_hexDecode());
		} else {
			_url = 'http://'  + this.m_auth_ip + ':' + this._m_auth_port + CONST_WEB_FUNCTION + CONST_ACCOUNT_MANAGMENT; // + '?cmd=v&acc=' + userName + '&pwd=' + accessCode + '&app=andruav&ver=' + ver + '&ex=' + fn_eval ("349032c439313b1937512b112f442710302137510844310024c132c427d92f443490084427103021264935792e6927d92f443490084434902b1134902d9027d90d99040000513d09264924c1349026492a400400064027d9069104003b1905f110812f44271032c4357924c1366405f10d993d09"._fn_hexDecode());
		}


		var p_keyValues = {};
		p_keyValues[CONST_SUB_COMMAND.toString()] = CONST_CMD_CREATE_ACCESSCODE;
		p_keyValues[CONST_ACCOUNT_NAME_PARAMETER.toString()] = p_accountName;
        p_keyValues[CONST_SESSION_ID.toString()] = this._m_session_ID;
        p_keyValues[CONST_PERMISSION_PARAMETER.toString()] = p_permission;

		var v_res = null;
		var Me = this;
    	$.ajax({
			url: _url,
			type: 'POST',
			data: p_keyValues,
			dataType: "text",

			success: function (v__res) {
				v_res = JSON.parse(v__res);

				if (v_res.e == 0) {
					js_eventEmitter.fn_dispatch(EE_Auth_Account_Created, v_res);
				} else {
					js_eventEmitter.fn_dispatch(EE_Auth_Account_BAD_Operation, v_res);
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				Me._m_logined = false;
				Me.m_error = Me.C_ERR_SUCCESS_DISPLAY_MESSAGE;
				js_eventEmitter.fn_dispatch(EE_Auth_Account_BAD_Operation, v_res);
			},
			async: false // remove it later when you SYNC with 2eN
		});


		return;
	}

	fn_regenerateAccessCode = function (p_accountName, p_permission)  
	{
        if ((p_accountName == null) || (p_accountName.length == 0)) {
            return;
        }


        if ((p_permission == null) || (typeof(p_permission) != 'string'))
            {
                return ;
            }


        var _url;
        if (window.location.protocol == 'https:') {
            _url = 'https://' + this.m_auth_ip + ':' + this._m_auth_ports + CONST_WEB_FUNCTION + CONST_ACCOUNT_MANAGMENT; // + '?cmd=v&acc=' + userName + '&pwd=' + accessCode + '&app=andruav&ver=' + ver + '&ex=' + fn_eval ("349032c439313b1937512b112f442710302137510844310024c132c427d92f443490084427103021264935792e6927d92f443490084434902b1134902d9027d90d99040000513d09264924c1349026492a400400064027d9069104003b1905f110812f44271032c4357924c1366405f10d993d09"._fn_hexDecode());
        } else {
            _url = 'http://' + this.m_auth_ip + ':' + this._m_auth_port + CONST_WEB_FUNCTION + CONST_ACCOUNT_MANAGMENT; // + '?cmd=v&acc=' + userName + '&pwd=' + accessCode + '&app=andruav&ver=' + ver + '&ex=' + fn_eval ("349032c439313b1937512b112f442710302137510844310024c132c427d92f443490084427103021264935792e6927d92f443490084434902b1134902d9027d90d99040000513d09264924c1349026492a400400064027d9069104003b1905f110812f44271032c4357924c1366405f10d993d09"._fn_hexDecode());
        }


        var p_keyValues = {};
        p_keyValues[CONST_SUB_COMMAND.toString()] = CONST_CMD_REGENERATE_ACCESSCODE;
        p_keyValues[CONST_ACCOUNT_NAME_PARAMETER.toString()] = p_accountName;
        p_keyValues[CONST_PERMISSION_PARAMETER.toString()] = p_permission;


        var v_res = null;
        var Me = this;
        $.ajax({
            url: _url,
            type: 'POST',
            data: p_keyValues,
            dataType: "text",

            success: function (v__res) {
                v_res = JSON.parse(v__res);

                if (v_res.e == 0) {
                    js_eventEmitter.fn_dispatch(EE_Auth_Account_Regenerated, v_res);
                } else {
                    js_eventEmitter.fn_dispatch(EE_Auth_Account_BAD_Operation, v_res);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                Me._m_logined = false;
                Me.m_error = Me.C_ERR_SUCCESS_DISPLAY_MESSAGE;
                js_eventEmitter.fn_dispatch(EE_Auth_Account_BAD_Operation, v_res);
            },
            async: false // remove it later when you SYNC with 2eN
        });


        return;
    }


    fn_do_logoutAccount(p_userName, p_accessCode) {
        this._m_logined = false;
    }
}


/*jshint esversion: 6 */
// window.AndruavLibs = window.AndruavLibs || {REVISION: 'BETA' };

// (function(lib) {
// 	"use strict";
// 	if (typeof module === "undefined" || typeof module.exports === "undefined") {
// 	  window.AndruavLibs.AndruavAuth = lib; // in ordinary browser attach library to window
// 	} else {
// 	  module.exports = lib; // in nodejs
// 	}
//   })(new CAndruavAuth());
  
  
export default CAndruavAuth.getInstance();

