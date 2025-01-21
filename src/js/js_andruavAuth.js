/* ********************************************************************************
*   Mohammad Hefny
*
*   2 Aug 2016
*
*********************************************************************************** */
import $ from 'jquery'; 
import * as  js_siteConfig from './js_siteConfig.js'
import {js_globals} from './js_globals.js';
import * as js_andruavMessages from './js_andruavMessages'
import {js_eventEmitter} from './js_eventEmitter'



const AUTH_REQUEST_TIMEOUT = 10000; // Timeout for AJAX requests
const AUTH_GCS_TYPE = 'g';
const AUTH_ERROR_BAD_CONNECTION = 'Cannot Login .. Bad Connection or Timeout';
const DEFAULT_PERMISSIONS = 0xffffffff; // Default permission value





class CAndruavAuth {
    constructor() {
        
        this.m_username = '';
        this.m_accesscode = '';
        this.m_retry_login = true;
        this.m_retry_handle = null;

        window._localserverIP = "127.0.0.1";
        window._localserverPort = 9211;

        this._m_ver = '5.0.0';
        if (js_siteConfig.CONST_TEST_MODE === true)
        {
            this.m_auth_ip = js_siteConfig.CONST_TEST_MODE_IP; 
            this._m_auth_port = js_siteConfig.CONST_TEST_MODE_PORT;
            this._m_auth_ports = js_siteConfig.CONST_TEST_MODE_PORT; 
        }
        else
        {
            this.m_auth_ip = js_siteConfig.CONST_PROD_MODE_IP;
            this._m_auth_port = js_siteConfig.CONST_PROD_MODE_PORT;
            this._m_auth_ports = js_siteConfig.CONST_PROD_MODE_PORT; 
        }
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


    fn_retryLogin(p_enable) {
        if (this.m_retry_handle !== null)
        {
            clearTimeout (this.m_retry_handle);
            this.m_retry_handle = null;
        }
        this.m_retry_login = p_enable;
    }

	async fn_do_loginAccount(p_userName, p_accessCode) {
        
        js_eventEmitter.fn_dispatch(js_globals.EE_Auth_Login_In_Progress, null);
                
        if (!p_userName || !p_userName.length || !p_accessCode) {
            this._m_logined = false;
            js_eventEmitter.fn_dispatch(js_globals.EE_Auth_BAD_Logined, { e: -1, em: "Invalid username or password" }); // Dispatch an error event
            return false;
        }

        const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
        const url = `${protocol}://${this.m_auth_ip}:${this._m_auth_port}${js_andruavMessages.CONST_WEB_FUNCTION}${js_andruavMessages.CONST_WEB_LOGIN_COMMAND}`;
        this.m_accesscode = p_accessCode;
        const keyValues = {
            acc: p_userName,
            pwd: p_accessCode,
            gr: "1",
            app: 'andruav',
            ver: this._m_ver,
            ex: 'Andruav',
            at: AUTH_GCS_TYPE
        };

        try {
            const response = await $.ajax({
                url,
                type: 'POST',
                data: keyValues,
                dataType: 'json',
                timeout: AUTH_REQUEST_TIMEOUT,
            });

            if (response && response.e === 0) { // Check if response exists
                this._m_logined = true;
                this._m_session_ID = response.sid;
                this.m_server_port = response.cs.h;
                this.m_server_ip = response.cs.g;
                this.server_AuthKey = response.cs.f;
                this.m_username = p_userName;
                this._m_permissions_ = response.per;
                this._m_perm = response.prm ?? DEFAULT_PERMISSIONS; // Provide default if prm is missing
                js_eventEmitter.fn_dispatch(js_globals.EE_Auth_Logined, response);
                return true;
            } else {
                this._m_logined = false;
                const errorMessage = response?.em || "Login failed"; // Extract error message or provide a default
                js_eventEmitter.fn_dispatch(js_globals.EE_Auth_BAD_Logined, { e: response?.e || -2, em: errorMessage }); // Dispatch error event with details
            }
        } catch (error) {
            this._m_logined = false;
            js_eventEmitter.fn_dispatch(js_globals.EE_Auth_BAD_Logined, { e: this.C_ERR_SUCCESS_DISPLAY_MESSAGE, em: AUTH_ERROR_BAD_CONNECTION, error: error.message }); // Dispatch error event with error message
            console.error("Login error:", error);
        }

        if (js_andruavAuth.m_retry_login === true)
        {
            this.m_retry_handle = setTimeout(
                this.fn_do_loginAccount.bind(this, p_userName, p_accessCode),
                4000);
        }
        return false;
    }


    async fn_generateAccessCode(p_accountName, p_permission) {
        if (!p_accountName || !p_accountName.length || typeof p_permission !== 'string') {
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
        const url = `${protocol}://${this.authIP}:${this.authPort}${js_andruavMessages.CONST_WEB_FUNCTION}${js_andruavMessages.CONST_ACCOUNT_MANAGMENT}`;

        const keyValues = {
            [js_andruavMessages.CONST_SUB_COMMAND]: js_andruavMessages.CONST_CMD_CREATE_ACCESSCODE,
            [js_andruavMessages.CONST_ACCOUNT_NAME_PARAMETER]: p_accountName,
            [js_andruavMessages.CONST_SESSION_ID]: this._m_session_ID,
            [js_andruavMessages.CONST_PERMISSION_PARAMETER]: p_permission
        };

        try {
            const response = await $.ajax({
                url,
                type: 'POST',
                data: keyValues,
                dataType: 'json',
                timeout: AUTH_REQUEST_TIMEOUT
            });

            if (response && response.e === 0) {
                js_eventEmitter.fn_dispatch(js_globals.EE_Auth_Account_Created, response);
            } else {
                const errorMessage = response?.em || "Generate Access Code failed"; // Get the error message from response or set default
                js_eventEmitter.fn_dispatch(js_globals.EE_Auth_Account_BAD_Operation, { e: response?.e || -4, em: errorMessage }); // Dispatch error event with details
            }
        } catch (error) {
            js_eventEmitter.fn_dispatch(js_globals.EE_Auth_Account_BAD_Operation, { e: this.C_ERR_SUCCESS_DISPLAY_MESSAGE, em: AUTH_ERROR_BAD_CONNECTION, error: error.message}); // Dispatch error event with error message
            console.error("Generate Access Code error:", error);
        }
    }

	async fn_regenerateAccessCode(p_accountName, p_permission) {
        if (!p_accountName || !p_accountName.length || typeof p_permission !== 'string') {
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
        const url = `${protocol}://${this.authIP}:${this.authPort}${js_andruavMessages.CONST_WEB_FUNCTION}${js_andruavMessages.CONST_ACCOUNT_MANAGMENT}`;

        const keyValues = {
            [js_andruavMessages.CONST_SUB_COMMAND]: js_andruavMessages.CONST_CMD_REGENERATE_ACCESSCODE,
            [js_andruavMessages.CONST_ACCOUNT_NAME_PARAMETER]: p_accountName,
            [js_andruavMessages.CONST_PERMISSION_PARAMETER]: p_permission,
            [js_andruavMessages.CONST_SESSION_ID]: this._m_session_ID
        };

        try {
            const response = await $.ajax({
                url,
                type: 'POST',
                data: keyValues,
                dataType: 'json',
                timeout: AUTH_REQUEST_TIMEOUT
            });

            if (response && response.e === 0) {
                js_eventEmitter.fn_dispatch(js_globals.EE_Auth_Account_Regenerated, response);
            } else {
                const errorMessage = response?.em || "Regenerate Access Code failed";
                js_eventEmitter.fn_dispatch(js_globals.EE_Auth_Account_BAD_Operation, { e: response?.e || -3, em: errorMessage });
            }
        } catch (error) {
            js_eventEmitter.fn_dispatch(js_globals.EE_Auth_Account_BAD_Operation, { e: this.C_ERR_SUCCESS_DISPLAY_MESSAGE, em: AUTH_ERROR_BAD_CONNECTION, error: error.message });
            console.error("Regenerate Access Code error:", error);
        }
    }


    fn_do_logoutAccount() {
        this._m_logined = false;
            
    }
}

  
export var js_andruavAuth =  CAndruavAuth.getInstance();
