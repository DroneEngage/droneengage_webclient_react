import * as js_siteConfig from './js_siteConfig.js';
import { EVENTS as js_event } from './js_eventList.js';
import * as js_andruavMessages from './protocol/js_andruavMessages.js';
import { js_eventEmitter } from './js_eventEmitter';
import { js_localStorage } from './js_localStorage.js';
import {
    fn_buildAuthUrl,
    fn_buildAuthUrlEx,
    fn_buildHealthBaseUrl,
    fn_buildHealthBaseUrlEx,
    fn_buildLoginPayload,
    fn_buildPluginSessionPayload,
    fn_parseLoginResponse,
} from './shared/andruav_auth_shared.js';

// Constants
const AUTH_REQUEST_TIMEOUT = 10000; // Timeout for requests (ms)
const AUTH_GCS_TYPE = 'g';
const AUTH_ERROR_BAD_CONNECTION = 'Cannot Login .. Bad Connection or Timeout';
const DEFAULT_PERMISSIONS = '0xffffffff'; // Default permission as string (hex)
const ERROR_CODES = {
    INVALID_INPUT: -1,
    INVALID_PERMISSION: -2,
    NETWORK_ERROR: -3,
    UNKNOWN_ERROR: -4,
    NO_SESSION: -5,
    SSL_ERROR: -6,
};

/**
 * Singleton class for handling authentication operations with the Andruav/Ardupilot-Cloud backend.
 */
class CAndruavAuth {
    constructor() {
        this.m_username = '';
        this.m_accesscode = '';
        this.m_retry_login = true;
        this.m_retry_handle = null;

        window._localserverIP = '127.0.0.1';
        window._localserverPort = 9211;

        this._m_ver = '5.0.0';
        this.m_auth_ip = js_siteConfig.CONST_TEST_MODE
            ? js_siteConfig.CONST_TEST_MODE_IP
            : js_siteConfig.CONST_PROD_MODE_IP;
        this._m_auth_port = js_siteConfig.CONST_TEST_MODE
            ? js_siteConfig.CONST_TEST_MODE_PORT
            : js_siteConfig.CONST_PROD_MODE_PORT;
        this._m_auth_ports = this._m_auth_port; // Legacy support
        this._m_perm = 0;
        this._m_permissions_ = '';
        this._m_session_ID = null;
        this._m_party_ID = null;
        this._m_logined = false;
        this.C_ERR_SUCCESS_DISPLAY_MESSAGE = 1001; // Legacy error code
    }

    fn_isPluginEnabled() {
        const v = js_localStorage.fn_getWSPluginEnabled();
        if (v !== null) return v;
        return js_siteConfig.CONST_WS_PLUGIN_ENABLED === true;
    }

    fn_getPluginAuthHost() {
        return js_siteConfig.CONST_WS_PLUGIN_AUTH_HOST;
    }

    fn_getPluginAuthPort() {
        return js_siteConfig.CONST_WS_PLUGIN_AUTH_PORT;
    }

    fn_getPluginWSHost() {
        return js_siteConfig.CONST_WS_PLUGIN_AUTH_HOST;
    }

    fn_getPluginWSPort() {
        return js_siteConfig.CONST_WS_PLUGIN_WS_PORT;
    }

    fn_getPluginApiKey() {
        return js_siteConfig.CONST_WS_PLUGIN_APIKEY;
    }

    /**
     * Gets the singleton instance of CAndruavAuth.
     * @returns {CAndruavAuth} The singleton instance.
     */
    static getInstance() {
        if (!CAndruavAuth.instance) {
            CAndruavAuth.instance = new CAndruavAuth();
        }
        return CAndruavAuth.instance;
    }

    /**
     * Gets the current session ID.
     * @returns {string|null} The session ID or null if not logged in.
     */
    fn_getSessionID() {
        return this._m_session_ID;
    }

    /**
     * Gets the party ID (used in plugin mode).
     * @returns {string|null} The party ID or null if not set.
     */
    fn_getPartyID() {
        return this._m_party_ID;
    }

    /**
     * Checks if the user is logged in.
     * @returns {boolean} True if logged in, false otherwise.
     */
    fn_logined() {
        return this._m_logined;
    }

    /**
     * Gets the permission string.
     * @returns {string} The permission string.
     */
    fn_getPermission() {
        return this._m_permissions_;
    }

    /**
     * Checks if the user has GCS (Ground Control Station) permission.
     * @returns {boolean} True if GCS permission is granted.
     */
    fn_do_canGCS() {
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS) === js_andruavMessages.CONST_ALLOW_GCS;
    }

    /**
     * Checks if the user has full GCS control permission.
     * @returns {boolean} True if full control is granted.
     */
    fn_do_canControl() {
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_FULL_CONTROL) === js_andruavMessages.CONST_ALLOW_GCS_FULL_CONTROL;
    }

    /**
     * Checks if the user can control waypoints.
     * @returns {boolean} True if waypoint control is granted.
     */
    fn_do_canControlWP() {
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_WP_CONTROL) === js_andruavMessages.CONST_ALLOW_GCS_WP_CONTROL;
    }

    /**
     * Checks if the user can control modes.
     * @returns {boolean} True if mode control is granted.
     */
    fn_do_canControlModes() {
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_MODES_CONTROL) === js_andruavMessages.CONST_ALLOW_GCS_MODES_CONTROL;
    }

    /**
     * Checks if the user can access video.
     * @returns {boolean} True if video access is granted.
     */
    fn_do_canVideo() {
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_VIDEO) === js_andruavMessages.CONST_ALLOW_GCS_VIDEO;
    }

    /**
     * Enables or disables automatic retry for login attempts.
     * @param {boolean} p_enable - Whether to enable retry.
     */
    fn_retryLogin(p_enable) {
        if (this.m_retry_handle !== null) {
            clearTimeout(this.m_retry_handle);
            this.m_retry_handle = null;
        }
        this.m_retry_login = p_enable;
    }

    /**
     * Validates an email address.
     * @param {string} email - The email to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    #validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email && emailRegex.test(email);
    }

    /**
     * Validates a permission string (hex format).
     * @param {string} permission - The permission to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    #validatePermission(permission) {
        return typeof permission === 'string' &&
            /^0x[0-9a-fA-F]{8}$/.test(permission);
    }

    /**
     * Builds the base URL for API requests.
     * @returns {string} The constructed URL.
     */
    #getBaseUrl(path) {
        const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
        if (protocol === 'http' && window.location.hostname !== 'localhost') {
            console.warn('Using HTTP in production—switch to HTTPS for security');
        }
        return `${protocol}://${this.m_auth_ip}:${this._m_auth_port}${js_andruavMessages.CONST_WEB_FUNCTION}${path}`;
    }


    #getHealthURL()
    {
        const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
        if (protocol === 'http' && window.location.hostname !== 'localhost') {
            console.warn('Using HTTP in production—switch to HTTPS for security');
        }
        return `${protocol}://${this.m_auth_ip}:${this._m_auth_port}${js_andruavMessages.CONST_HEALTH_FUNCTION}`;
    }

    /**
     * Logs in a user with the provided credentials.
     * @param {string} p_userName - The username (email).
     * @param {string} p_accessCode - The access code (password).
     * @returns {Promise<boolean>} True if login succeeds, false otherwise.
     */
    async fn_do_loginAccount(p_userName, p_accessCode) {
        js_eventEmitter.fn_dispatch(js_event.EE_Auth_Login_In_Progress, null);

        try {
            const lsPluginEnabled = js_localStorage.fn_getWSPluginEnabled();
            const pluginEnabled = this.fn_isPluginEnabled() === true;
            if (pluginEnabled === true) {
                console.info('[WebPlugin] enabled=true', {
                    ls: lsPluginEnabled,
                    cfgEnabled: js_siteConfig.CONST_WS_PLUGIN_ENABLED === true,
                    autoFallback: js_siteConfig.CONST_WS_PLUGIN_AUTO_FALLBACK === true,
                    authHost: this.fn_getPluginAuthHost(),
                    authPort: this.fn_getPluginAuthPort(),
                    wsPort: this.fn_getPluginWSPort(),
                    hasApiKey: (this.fn_getPluginApiKey() || '').length > 0,
                });
            } else {
                console.info('[WebPlugin] enabled=false', {
                    ls: lsPluginEnabled,
                    cfgEnabled: js_siteConfig.CONST_WS_PLUGIN_ENABLED === true,
                });
            }
        } catch {
        }

        if (this.fn_isPluginEnabled() === true) {
            this.m_username = p_userName;
            this.m_accesscode = p_accessCode;

            const ok = await this.#loginViaPlugin(p_userName, p_accessCode);
            if (ok === true) return true;

            if (js_siteConfig.CONST_WS_PLUGIN_AUTO_FALLBACK !== true) {
                return false;
            }
        }

        if (!this.#validateEmail(p_userName) || !p_accessCode) {
            this._m_logined = false;
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_BAD_Logined, {
                e: ERROR_CODES.INVALID_INPUT,
                em: 'Invalid username or password',
            });
            return false;
        }

        const url = this.#getBaseUrl(js_andruavMessages.CONST_WEB_LOGIN_COMMAND);
        this.m_accesscode = p_accessCode;

        const keyValues = fn_buildLoginPayload(p_userName, p_accessCode, this._m_ver, js_localStorage.fn_getGroupName());

        const probeResult = await this.fn_probeServer(this.#getHealthURL());
        if (!probeResult.success) {
            this._m_logined = false;
            const isSslError = probeResult.isSslError;
            const errorCode = isSslError ? ERROR_CODES.SSL_ERROR : ERROR_CODES.NETWORK_ERROR;
            const errorMessage = isSslError
                ? 'SSL Error: Server certificate may be invalid. Please verify the server\'s HTTPS setup.'
                : 'Network error: Unable to reach the server.';

            js_eventEmitter.fn_dispatch(js_event.EE_Auth_BAD_Logined, {
                e: errorCode,
                em: errorMessage,
                error: 'Probe failed',
                ssl: isSslError,
            });
            return false;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keyValues),
                signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT),
            }).then(res => res.json());

            const parsed = fn_parseLoginResponse(response);
            if (parsed.ok === true) {
                this._m_logined = true;
                this._m_session_ID = parsed.sessionId;
                // `partyId` is only returned by WebPlugin login (/w/wl/) as `plugin_party_id` (preferred) / `pid` (legacy).
                // Cloud login does not return it.
                // It is used later ONLY when connecting to plugin WSS.
                this._m_party_ID = parsed.partyId;
                this.m_server_port = parsed.commServerPort;
                this.m_server_ip = parsed.commServerHost;
                this.server_AuthKey = parsed.commServerAuthKey;
                this.m_username = p_userName;

                this._m_permissions_ = parsed.permission;
                this._m_perm = parsed.permission2 ?? DEFAULT_PERMISSIONS;
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logined, parsed.raw);
                return true;
            } else {
                this._m_logined = false;
                const errorMessages = {
                    [js_andruavMessages.CONST_ERROR_ACCOUNT_NOT_FOUND]: 'Account not found',
                    [js_andruavMessages.CONST_ERROR_NO_PERMISSION]: 'Insufficient permissions',
                    [js_andruavMessages.CONST_ERROR_OLD_APP_VERSION]: 'Please upgrade your app',
                };
                const errorMessage = errorMessages[response.e] || response.em || 'Login failed';
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_BAD_Logined, {
                    e: response.e ?? ERROR_CODES.UNKNOWN_ERROR,
                    em: errorMessage,
                });
            }
        } catch (error) {
            this._m_logined = false;
            const isSslError = error.name === 'AbortError' || error.message?.includes('ERR_CERT') || error.message?.includes('SSL');
            const errorCode = isSslError ? ERROR_CODES.SSL_ERROR : ERROR_CODES.NETWORK_ERROR;
            const errorMessage = isSslError ? 'SSL Error: Unable to establish a secure connection' : AUTH_ERROR_BAD_CONNECTION;
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_BAD_Logined, {
                e: errorCode,
                em: errorMessage,
                error: error.message || 'Unknown error',
                ssl: isSslError,
            });
            console.error('Login error:', error);
        }

        if (this.m_retry_login) {
            this.m_retry_handle = setTimeout(
                () => this.fn_do_loginAccount(p_userName, p_accessCode),
                4000
            );
        }
        return false;
    }

    async #loginViaPlugin(p_userName, p_accessCode) {
        const pluginAuthHost = this.fn_getPluginAuthHost();
        const pluginAuthPort = this.fn_getPluginAuthPort();
        const pluginWsHost = this.fn_getPluginWSHost();
        const pluginWsPort = this.fn_getPluginWSPort();

        const pluginSecure = js_siteConfig.CONST_WS_PLUGIN_SECURE === true;
        const pluginBasePath = js_siteConfig.CONST_WS_PLUGIN_BASE_PATH;
        const pluginLoginUrl = fn_buildAuthUrlEx(pluginSecure, pluginAuthHost, pluginAuthPort, pluginBasePath, js_andruavMessages.CONST_WEB_LOGIN_COMMAND);
        const pluginHealthBaseUrl = fn_buildHealthBaseUrlEx(pluginSecure, pluginAuthHost, pluginAuthPort, pluginBasePath);

        const headers = { 'Content-Type': 'application/json' };
        const apiKey = this.fn_getPluginApiKey();
        if (apiKey && apiKey.length > 0) {
            headers['x-de-api-key'] = apiKey;
        }

        const probeResult = await this.fn_probeServer(pluginHealthBaseUrl, headers);
        if (!probeResult.success) {
            console.warn('[WebPlugin] probe failed', {
                baseUrl: pluginHealthBaseUrl,
                ssl: probeResult.isSslError === true,
            });
            return false;
        }

        console.info('[WebPlugin] probe OK', { baseUrl: pluginHealthBaseUrl });

        try {
            this.m_username = p_userName;
            this.m_accesscode = p_accessCode;

            // Plugin mode: don't send uid, plugin will provide its own partyId
            const payload = fn_buildPluginSessionPayload(
                this._m_ver,
                js_localStorage.fn_getGroupName()
            );

            const fetchRes = await fetch(pluginLoginUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT),
            });

            const response = await fetchRes.json();

            const parsed = fn_parseLoginResponse(response);
            if (parsed.ok !== true) {
                this._m_logined = false;
                console.warn('[WebPlugin] plugin login reply not OK', {
                    httpOk: fetchRes.ok === true,
                    status: fetchRes.status,
                    e: parsed.error,
                    em: parsed.errorMessage,
                });
                if (js_siteConfig.CONST_WS_PLUGIN_AUTO_FALLBACK !== true) {
                    js_eventEmitter.fn_dispatch(js_event.EE_Auth_BAD_Logined, {
                        e: parsed.error ?? ERROR_CODES.UNKNOWN_ERROR,
                        em: parsed.errorMessage || 'Plugin login failed',
                    });
                }
                return false;
            }

            this._m_logined = true;
            this._m_session_ID = parsed.sessionId;
            // In plugin mode, partyId (plugin_party_id/pid) is generated by the plugin, not by the cloud.
            // WebClient must use it as its WS partyID when connecting to plugin WSS.
            this._m_party_ID = parsed.partyId;
            this.m_server_ip = parsed.commServerHost || pluginWsHost;
            this.m_server_port = parsed.commServerPort || pluginWsPort;
            this.server_AuthKey = parsed.commServerAuthKey;
            this._m_permissions_ = parsed.permission;
            this._m_perm = parsed.permission2 ?? DEFAULT_PERMISSIONS;

            // Store plugin's partyId in localStorage so it persists across page reloads
            if (parsed.partyId) {
                js_localStorage.fn_setUnitIDShared(parsed.partyId);
            }

            console.info('[WebPlugin] login response', {
                receivedPartyId: parsed.partyId,
                storedPartyId: this._m_party_ID,
                savedToLocalStorage: !!parsed.partyId,
                host: this.m_server_ip,
                port: this.m_server_port,
                isPluginTarget: String(this.m_server_port) === String(pluginWsPort),
            });
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logined, parsed.raw);
            return true;
        } catch (error) {
            this._m_logined = false;
            console.error('[WebPlugin] plugin login exception', error);
            if (js_siteConfig.CONST_WS_PLUGIN_AUTO_FALLBACK !== true) {
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_BAD_Logined, {
                    e: ERROR_CODES.NETWORK_ERROR,
                    em: 'Plugin connection failed',
                    error: error.message || 'Unknown error',
                });
            }
            return false;
        }
    }

    async fn_probeServer(baseUrl, p_headers) {
        try {
            console.log('Probing URL:', `${baseUrl}/health`);
            const response = await fetch(`${baseUrl}/health`, {
                method: 'GET', // Use GET for simplicity; HEAD is also viable
                headers: p_headers || { 'Content-Type': 'application/json' },
                mode: 'cors', // Use cors mode to access response status
                signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT),
            });
            return { success: response.ok, isSslError: false };
        } catch (error) {
            console.error('Probe error:', error);
            const isSslError = error.message?.includes('ERR_CERT') || error.message?.includes('SSL');
            return { success: false, isSslError };
        }
    }

    /**
     * Generates a new access code for an account.
     * @param {string} p_accountName - The account email.
     * @param {string} p_permission - The permission string (hex).
     * @returns {Promise<void>}
     */
    async fn_generateAccessCode(p_accountName, p_permission) {

        if (!this.#validateEmail(p_accountName)) {
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: ERROR_CODES.INVALID_INPUT,
                em: 'Invalid or missing email',
            });
            return;
        }
        if (!this.#validatePermission(p_permission)) {
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: ERROR_CODES.INVALID_PERMISSION,
                em: 'Invalid or missing permission',
            });
            return;
        }

        const url = this.#getBaseUrl(js_andruavMessages.CONST_ACCOUNT_MANAGMENT);
        const keyValues = {
            [js_andruavMessages.CONST_SUB_COMMAND]: js_andruavMessages.CONST_CMD_CREATE_ACCESSCODE,
            [js_andruavMessages.CONST_ACCOUNT_NAME_PARAMETER]: p_accountName,
            [js_andruavMessages.CONST_SESSION_ID]: this._m_session_ID,
            [js_andruavMessages.CONST_PERMISSION_PARAMETER]: p_permission,
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keyValues),
                signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT),
            }).then(res => res.json());

            if (response.e === js_andruavMessages.CONST_ERROR_NON) {
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_Created, {
                    ...response,
                    message: `Access code sent to ${p_accountName}`,
                });
            } else {
                const errorMessages = {
                    [js_andruavMessages.CONST_ERROR_ACCOUNT_NOT_FOUND]: 'Account not found',
                    [js_andruavMessages.CONST_ERROR_NO_PERMISSION]: 'Insufficient permissions',
                };
                const errorMessage = errorMessages[response.e] || response.em || 'Generate Access Code failed';
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                    e: response.e ?? ERROR_CODES.UNKNOWN_ERROR,
                    em: errorMessage,
                });
            }
        } catch (error) {
            const errorCode = error.name === 'AbortError' ? ERROR_CODES.NETWORK_ERROR : ERROR_CODES.UNKNOWN_ERROR;
            const errorMessage = error.name === 'AbortError' ? 'Request timed out' : AUTH_ERROR_BAD_CONNECTION;
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: errorCode,
                em: errorMessage,
                error: error.message || 'Unknown error',
            });
            console.error('Generate Access Code error:', error);
        }
    }

    /**
     * Regenerates an access code for an account.
     * @param {string} p_accountName - The account email.
     * @param {string} p_permission - The permission string (hex).
     * @returns {Promise<void>}
     */
    async fn_regenerateAccessCode(p_accountName, p_permission) {
        if (!this.#validateEmail(p_accountName)) {
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: ERROR_CODES.INVALID_INPUT,
                em: 'Invalid or missing email',
            });
            return;
        }
        if (!this.#validatePermission(p_permission)) {
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: ERROR_CODES.INVALID_PERMISSION,
                em: 'Invalid or missing permission',
            });
            return;
        }

        const url = this.#getBaseUrl(js_andruavMessages.CONST_ACCOUNT_MANAGMENT);
        const keyValues = {
            [js_andruavMessages.CONST_SUB_COMMAND]: js_andruavMessages.CONST_CMD_REGENERATE_ACCESSCODE,
            [js_andruavMessages.CONST_ACCOUNT_NAME_PARAMETER]: p_accountName,
            [js_andruavMessages.CONST_PERMISSION_PARAMETER]: p_permission,
            [js_andruavMessages.CONST_SESSION_ID]: this._m_session_ID
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keyValues),
                signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT),
            }).then(res => res.json());

            if (response.e === js_andruavMessages.CONST_ERROR_NON) {
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_Regenerated, {
                    ...response,
                    message: `New access code sent to ${p_accountName}`,
                });
            } else {
                const errorMessages = {
                    [js_andruavMessages.CONST_ERROR_ACCOUNT_NOT_FOUND]: 'Account not found',
                    [js_andruavMessages.CONST_ERROR_NO_PERMISSION]: 'Insufficient permissions',
                };
                const errorMessage = errorMessages[response.e] || response.em || 'Regenerate Access Code failed';
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                    e: response.e ?? ERROR_CODES.UNKNOWN_ERROR,
                    em: errorMessage,
                });
            }
        } catch (error) {
            const errorCode = error.name === 'AbortError' ? ERROR_CODES.NETWORK_ERROR : ERROR_CODES.UNKNOWN_ERROR;
            const errorMessage = error.name === 'AbortError' ? 'Request timed out' : AUTH_ERROR_BAD_CONNECTION;
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: errorCode,
                em: errorMessage,
                error: error.message || 'Unknown error',
            });
            console.error('Regenerate Access Code error:', error);
        }
    }

    /**
     * Logs out the current user and invalidates the session.
     * @returns {Promise<void>}
     */
    async fn_do_logoutAccount() {
        if (!this._m_session_ID) {
            this._m_logined = false;
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logout_Completed, {
                e: ERROR_CODES.NO_SESSION,
                em: 'No active session to logout',
            });
            return;
        }

        if (this.fn_isPluginEnabled() === true) {
            return this.#logoutViaPlugin();
        }

        const url = this.#getBaseUrl(js_andruavMessages.CONST_WEB_LOGOUT_COMMAND || '/logout'); // Assume endpoint exists
        const keyValues = {
            [js_andruavMessages.CONST_SESSION_ID]: this._m_session_ID,
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keyValues),
                signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT),
            }).then(res => res.json());

            if (response.e === js_andruavMessages.CONST_ERROR_NON) {
                this._m_logined = false;
                this._m_session_ID = null;
                this.m_username = '';
                this.m_accesscode = '';
                this._m_permissions_ = '';
                this._m_perm = 0;
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logout_Completed, {
                    e: js_andruavMessages.CONST_ERROR_NON,
                    em: 'Logout successful',
                });
            } else {
                const errorMessage = response.em || 'Logout failed';
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logout_Failed, {
                    e: response.e ?? ERROR_CODES.UNKNOWN_ERROR,
                    em: errorMessage,
                });
            }
        } catch (error) {
            const errorCode = error.name === 'AbortError' ? ERROR_CODES.NETWORK_ERROR : ERROR_CODES.UNKNOWN_ERROR;
            const errorMessage = error.name === 'AbortError' ? 'Request timed out' : 'Logout failed due to connection error';
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logout_Failed, {
                e: errorCode,
                em: errorMessage,
                error: error.message || 'Unknown error',
            });
            console.error('Logout error:', error);
        } finally {
            this._m_logined = false;
            this._m_session_ID = null;
        }
    }

    async #logoutViaPlugin() {
        const pluginAuthHost = this.fn_getPluginAuthHost();
        const pluginAuthPort = this.fn_getPluginAuthPort();
        const pluginLogoutUrl = fn_buildAuthUrl(true, pluginAuthHost, pluginAuthPort, js_andruavMessages.CONST_WEB_LOGOUT_COMMAND);

        const headers = { 'Content-Type': 'application/json' };
        const apiKey = this.fn_getPluginApiKey();
        if (apiKey && apiKey.length > 0) {
            headers['x-de-api-key'] = apiKey;
        }

        const keyValues = {
            [js_andruavMessages.CONST_SESSION_ID]: this._m_session_ID,
        };

        try {
            const response = await fetch(pluginLogoutUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(keyValues),
                signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT),
            }).then(res => res.json());

            if (response.e === js_andruavMessages.CONST_ERROR_NON) {
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logout_Completed, {
                    e: js_andruavMessages.CONST_ERROR_NON,
                    em: 'Logout successful',
                });
            } else {
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logout_Failed, {
                    e: response.e ?? ERROR_CODES.UNKNOWN_ERROR,
                    em: response.em || 'Logout failed',
                });
            }
        } catch (error) {
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logout_Failed, {
                e: ERROR_CODES.NETWORK_ERROR,
                em: 'Logout failed due to connection error',
                error: error.message || 'Unknown error',
            });
        } finally {
            this._m_logined = false;
            this._m_session_ID = null;
        }
    }
}

export const js_andruavAuth = CAndruavAuth.getInstance();