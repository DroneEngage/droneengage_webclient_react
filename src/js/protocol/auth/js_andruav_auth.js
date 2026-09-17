import * as js_siteConfig from '../../config/js_siteConfig.js';
import { EVENTS as js_event } from '../../events/js_eventList.js';
import * as js_andruavMessages from '../messages/js_andruavMessages.js';
import { js_eventEmitter } from '../../events/js_eventEmitter.js';
import { js_localStorage } from '../../state/js_localStorage.js';
import {
    fn_buildAuthUrlEx,
    fn_buildHealthBaseUrl,
    fn_buildHealthBaseUrlEx,
    fn_buildLoginPayload,
    fn_buildPluginSessionPayload,
    fn_parseLoginResponse,
} from '../../shared/andruav_auth_shared.js';

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
    RATE_LIMITED: -7,
    REQUEST_IN_PROGRESS: -8,
};

/**
 * Singleton class for handling authentication operations with the Andruav/Ardupilot-Cloud backend.
 */
class CAndruavAuth {
    #m_accessCodeInProgress;
    #m_lastAccessCodeRequestTime;
    #m_accessCodeMinInterval;

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
        this._m_team_id = null;   // TeamID (aid) from login reply — for team admin
        this._m_is_admin = false;  // isadmin flag from login reply — for team admin
        this.C_ERR_SUCCESS_DISPLAY_MESSAGE = 1001; // Legacy error code

        this.#m_accessCodeInProgress = false;
        this.#m_lastAccessCodeRequestTime = 0;
        this.#m_accessCodeMinInterval = 3000; // ms
    }

    fn_isPluginEnabled() {
        const v = js_localStorage.fn_getWebConnectorEnabled();
        if (v !== null) return v;
        return js_siteConfig.CONST_WEBCONNECTOR_CONFIG.ENABLED === true;
    }

    fn_getPluginAuthHost() {
        return '127.0.0.1';
    }

    fn_getPluginAuthPort() {
        return js_siteConfig.CONST_WEBCONNECTOR_CONFIG.AUTH_PORT;
    }

    fn_getPluginWSHost() {
        return '127.0.0.1';
    }

    fn_getPluginWSPort() {
        return js_siteConfig.CONST_WEBCONNECTOR_CONFIG.WS_PORT;
    }

    fn_getPluginApiKey() {
        return js_siteConfig.CONST_WEBCONNECTOR_CONFIG.APIKEY;
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
     * Gets the team ID (TeamID/aid) returned by the login reply.
     * Used by the team-admin page to scope operations.
     * @returns {string|number|null} The team ID or null if not logged in.
     */
    fn_getTeamID() {
        return this._m_team_id;
    }

    /**
     * Checks if the logged-in user is a team admin.
     * @returns {boolean} True if the user has isadmin flag set.
     */
    fn_isTeamAdmin() {
        return this._m_is_admin === true && this._m_logined === true;
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
     * Checks if the account is allowed to login as a GCS (bit 31).
     * @returns {boolean} True if GCS login is granted.
     */
    fn_do_canGCSLogin() {
        return ((this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_LOGIN) >>> 0) === (js_andruavMessages.CONST_ALLOW_GCS_LOGIN >>> 0);
    }

    /**
     * Checks if the account is allowed to login as a Unit (bit 30).
     * @returns {boolean} True if unit login is granted.
     */
    fn_do_canUnitLogin() {
        return ((this._m_perm & js_andruavMessages.CONST_ALLOW_UNIT_LOGIN) >>> 0) === (js_andruavMessages.CONST_ALLOW_UNIT_LOGIN >>> 0);
    }

    /**
     * Checks if the account is in view-only mode (bit 29 AND no category/action bits).
     * A view-mode account can observe telemetry/video/map/geofence status
     * and chat, but cannot issue any control/planning/mutation commands.
     * A full-control account (0xffffffff) has bit 29 set but also has category
     * bits, so it is NOT view-mode.
     * @returns {boolean} True if view-mode is active.
     */
    fn_do_isViewMode() {
        const perm = this._m_perm >>> 0;
        const viewBit = js_andruavMessages.CONST_ALLOW_VIEW_MODE >>> 0;
        const catMask = js_andruavMessages.CONST_CATEGORY_ACTION_MASK >>> 0;
        return ((perm & viewBit) === viewBit) && ((perm & catMask) === 0);
    }

    /**
     * Checks if the user has full GCS control permission.
     * @returns {boolean} True if full control is granted.
     */
    fn_do_canControl() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_FULL_CONTROL) === js_andruavMessages.CONST_ALLOW_GCS_FULL_CONTROL;
    }

    /**
     * Checks if the user can control waypoints.
     * @returns {boolean} True if waypoint control is granted.
     */
    fn_do_canControlWP() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_WP_CONTROL) === js_andruavMessages.CONST_ALLOW_GCS_WP_CONTROL;
    }

    /**
     * Checks if the user can control modes.
     * @returns {boolean} True if mode control is granted.
     */
    fn_do_canControlModes() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_MODES_CONTROL) === js_andruavMessages.CONST_ALLOW_GCS_MODES_CONTROL;
    }

    /**
     * Checks if the user can access video (control commands, not display).
     * @returns {boolean} True if video access is granted.
     */
    fn_do_canVideo() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS_VIDEO) === js_andruavMessages.CONST_ALLOW_GCS_VIDEO;
    }

    /**
     * Checks if the user can manage swarm.
     * @returns {boolean} True if swarm permission is granted.
     */
    fn_do_canSwarm() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_SWARM) === js_andruavMessages.CONST_ALLOW_SWARM;
    }

    /**
     * Checks if the user can manage tracking/AI.
     * @returns {boolean} True if tracking permission is granted.
     */
    fn_do_canTracking() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_TRACKING) === js_andruavMessages.CONST_ALLOW_TRACKING;
    }

    /**
     * Checks if the user can manage geofence.
     * @returns {boolean} True if geofence permission is granted.
     */
    fn_do_canGeofence() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GEOFENCE) === js_andruavMessages.CONST_ALLOW_GEOFENCE;
    }

    /**
     * Checks if the user can play sounds.
     * @returns {boolean} True if sound permission is granted.
     */
    fn_do_canSound() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_SOUND) === js_andruavMessages.CONST_ALLOW_SOUND;
    }

    /**
     * Checks if the user can control SDR.
     * @returns {boolean} True if SDR permission is granted.
     */
    fn_do_canSDR() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_SDR) === js_andruavMessages.CONST_ALLOW_SDR;
    }

    /**
     * Checks if the user can control GPIO.
     * @returns {boolean} True if GPIO permission is granted.
     */
    fn_do_canGPIO() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_GPIO) === js_andruavMessages.CONST_ALLOW_GPIO;
    }

    /**
     * Checks if the user can use telnet.
     * @returns {boolean} True if telnet permission is granted.
     */
    fn_do_canTelnet() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_TELNET) === js_andruavMessages.CONST_ALLOW_TELNET;
    }

    /**
     * Checks if the user can manage P2P.
     * @returns {boolean} True if P2P permission is granted.
     */
    fn_do_canP2P() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_P2P) === js_andruavMessages.CONST_ALLOW_P2P;
    }

    /**
     * Checks if the user can send chat messages.
     * View-mode accounts can always chat (chat is the one allowed action);
     * other accounts need the chat bit.
     * @returns {boolean} True if chat permission is granted.
     */
    fn_do_canChat() {
        if (this.fn_do_isViewMode()) return true;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_CHAT) === js_andruavMessages.CONST_ALLOW_CHAT;
    }

    /**
     * Checks if the user can change unit config.
     * @returns {boolean} True if config permission is granted.
     */
    fn_do_canConfig() {
        if (this.fn_do_isViewMode()) return false;
        return (this._m_perm & js_andruavMessages.CONST_ALLOW_CONFIG) === js_andruavMessages.CONST_ALLOW_CONFIG;
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
     * Validates a login name (alphanumeric or email).
     * @param {string} loginName - The login name to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    #validateLoginName(loginName) {
        const loginNameRegex = /^[a-zA-Z0-9]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return loginName && (loginNameRegex.test(loginName) || emailRegex.test(loginName));
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
            const lsPluginEnabled = js_localStorage.fn_getWebConnectorEnabled();
            const pluginEnabled = this.fn_isPluginEnabled() === true;
            if (pluginEnabled === true) {
                console.info('[WebConnector] enabled=true', {
                    ls: lsPluginEnabled,
                    cfgEnabled: js_siteConfig.CONST_WEBCONNECTOR_CONFIG.ENABLED === true,
                    autoFallback: js_siteConfig.CONST_WEBCONNECTOR_CONFIG.AUTO_FALLBACK === true,
                    authHost: this.fn_getPluginAuthHost(),
                    authPort: this.fn_getPluginAuthPort(),
                    wsPort: this.fn_getPluginWSPort(),
                    hasApiKey: (this.fn_getPluginApiKey() || '').length > 0,
                });
            } else {
                console.info('[WebConnector] enabled=false', {
                    ls: lsPluginEnabled,
                    cfgEnabled: js_siteConfig.CONST_WEBCONNECTOR_CONFIG.ENABLED === true,
                });
            }
        } catch {
        }

        if (this.fn_isPluginEnabled() === true) {
            this.m_username = p_userName;
            this.m_accesscode = p_accessCode;

            const ok = await this.#loginViaPlugin(p_userName, p_accessCode);
            if (ok === true) return true;

            if (js_siteConfig.CONST_WEBCONNECTOR_CONFIG.AUTO_FALLBACK !== true) {
                return false;
            }
        }

        if (!this.#validateLoginName(p_userName) || !p_accessCode) {
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
                probedUrl: this.#getHealthURL(), // Add the actual URL that was probed
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
                // `partyId` is only returned by WebConnector login (/w/wl/) as `plugin_party_id` (preferred) / `pid` (legacy).
                // Cloud login does not return it.
                // It is used later ONLY when connecting to plugin WSS.
                this._m_party_ID = parsed.partyId;
                this.m_server_port = parsed.commServerPort;
                this.m_server_ip = parsed.commServerHost;
                this.server_AuthKey = parsed.commServerAuthKey;
                this.m_username = p_userName;

                this._m_permissions_ = parsed.permission;
                this._m_perm = parsed.permission2 ?? DEFAULT_PERMISSIONS;
                this._m_team_id = parsed.teamId;
                this._m_is_admin = parsed.isAdmin;
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logined, parsed.raw);
                return true;
            } else {
                this._m_logined = false;
                const errorMessages = {
                    [js_andruavMessages.CONST_ERROR_ACCOUNT_NOT_FOUND]: 'Account not found',
                    [js_andruavMessages.CONST_ERROR_NO_PERMISSION]: 'Insufficient permissions',
                    [js_andruavMessages.CONST_ERROR_OLD_APP_VERSION]: 'Please upgrade your app',
                    [js_andruavMessages.CONST_ERROR_DATA_DATABASE_ERROR]: 'Database error',
                    [js_andruavMessages.CONST_ERROR_SERVER_NOT_AVAILABLE]: 'Server not available',
                    [js_andruavMessages.CONST_ERROR_ACCOUNT_DISABLED]: 'Account is disabled',
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

        const pluginBasePath = js_siteConfig.CONST_WEBCONNECTOR_CONFIG.BASE_PATH;
        const pluginLoginUrl = fn_buildAuthUrlEx(false, pluginAuthHost, pluginAuthPort, pluginBasePath, js_andruavMessages.CONST_WEB_LOGIN_COMMAND);
        const pluginHealthBaseUrl = fn_buildHealthBaseUrlEx(false, pluginAuthHost, pluginAuthPort, pluginBasePath);

        const headers = { 'Content-Type': 'application/json' };
        const apiKey = this.fn_getPluginApiKey();
        if (apiKey && apiKey.length > 0) {
            headers['x-de-api-key'] = apiKey;
        }

        const probeResult = await this.fn_probeServer(pluginHealthBaseUrl, headers);
        if (!probeResult.success) {
            const isSslError = probeResult.isSslError === true;
            const errorCode = isSslError ? ERROR_CODES.SSL_ERROR : ERROR_CODES.NETWORK_ERROR;
            const errorMessage = isSslError ? 'SSL Error: Unable to establish a secure connection' : AUTH_ERROR_BAD_CONNECTION;
            
            // Dispatch WebConnector not running event
            js_eventEmitter.fn_dispatch(js_event.EE_WebConnector_Not_Running, {
                autoFallback: js_siteConfig.CONST_WEBCONNECTOR_CONFIG.AUTO_FALLBACK === true,
                ssl: isSslError,
            });
            
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_BAD_Logined, {
                e: errorCode,
                em: errorMessage,
                error: probeResult.error || 'Probe failed',
                ssl: isSslError,
            });
            console.warn('[WebConnector] probe failed', {
                baseUrl: pluginHealthBaseUrl,
                ssl: isSslError,
            });
            return false;
        }

        console.info('[WebConnector] probe OK', { baseUrl: pluginHealthBaseUrl });

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
                console.warn('[WebConnector] login reply not OK', {
                    httpOk: fetchRes.ok === true,
                    status: fetchRes.status,
                    e: parsed.error,
                    em: parsed.errorMessage,
                });
                if (js_siteConfig.CONST_WEBCONNECTOR_CONFIG.AUTO_FALLBACK !== true) {
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
            this._m_team_id = parsed.teamId;
            this._m_is_admin = parsed.isAdmin;

            // Store plugin's partyId in localStorage so it persists across page reloads
            if (parsed.partyId) {
                js_localStorage.fn_setUnitIDShared(parsed.partyId);
            }

            console.info('[WebConnector] login response', {
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
            console.error('[WebConnector] login exception', error);
            if (js_siteConfig.CONST_WEBCONNECTOR_CONFIG.AUTO_FALLBACK !== true) {
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
            // Check if this is likely an SSL certificate error
            let isSslError = error.message?.includes('ERR_CERT') || 
                              error.message?.includes('SSL') || 
                              error.message?.includes('CERT_AUTHORITY_INVALID');
            
            // For localhost connections with "Failed to fetch", assume it's SSL certificate issue
            // since browsers don't provide detailed SSL error info in fetch API
            if (!isSslError && error.name === 'TypeError' && error.message === 'Failed to fetch') {
                try {
                    const url = new URL(baseUrl);
                    const isLocalhost = url.hostname === '127.0.0.1' || 
                                       url.hostname === 'localhost' ||
                                       url.hostname === '::1';
                    if (isLocalhost && url.protocol === 'https:') {
                        isSslError = true;
                    }
                } catch (e) {
                    // If URL parsing fails, don't mark as SSL error
                }
            }
            
            return { success: false, isSslError };
        }
    }

    #fn_canRequestAccessCode() {
        if (this.#m_accessCodeInProgress) {
            return { ok: false, code: ERROR_CODES.REQUEST_IN_PROGRESS, message: 'Access code request already in progress' };
        }
        const now = Date.now();
        if (this.#m_lastAccessCodeRequestTime && (now - this.#m_lastAccessCodeRequestTime) < this.#m_accessCodeMinInterval) {
            return { ok: false, code: ERROR_CODES.RATE_LIMITED, message: 'Please wait before requesting another access code' };
        }
        this.#m_accessCodeInProgress = true;
        this.#m_lastAccessCodeRequestTime = now;
        return { ok: true };
    }

    async fn_generateAccessCode(p_accountName, p_permission) {
        const rateCheck = this.#fn_canRequestAccessCode();
        if (!rateCheck.ok) {
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: rateCheck.code,
                em: rateCheck.message,
            });
            return;
        }

        if (!this.#validateLoginName(p_accountName)) {
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: ERROR_CODES.INVALID_INPUT,
                em: 'Invalid or missing login name',
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
                    accountId: response[js_andruavMessages.CONST_ACCOUNT_ID_PARAMETER],
                    loginId: response[js_andruavMessages.CONST_LOGIN_ID_PARAMETER],
                    accessCode: response[js_andruavMessages.CONST_ACCESS_CODE_PARAMETER],
                    message: `Access code generated for ${p_accountName}`,
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
        } finally {
            this.#m_accessCodeInProgress = false;
        }
    }

    /**
     * Regenerates an access code for an account.
     * @param {string} p_accountName - The account email.
     * @param {string} p_permission - The permission string (hex).
     * @returns {Promise<void>}
     */
    async fn_regenerateAccessCode(p_accountName, p_permission) {
        const rateCheck = this.#fn_canRequestAccessCode();
        if (!rateCheck.ok) {
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: rateCheck.code,
                em: rateCheck.message,
            });
            return;
        }

        if (!this.#validateLoginName(p_accountName)) {
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Account_BAD_Operation, {
                e: ERROR_CODES.INVALID_INPUT,
                em: 'Invalid or missing login name',
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
                    accountId: response[js_andruavMessages.CONST_ACCOUNT_ID_PARAMETER],
                    loginId: response[js_andruavMessages.CONST_LOGIN_ID_PARAMETER],
                    accessCode: response[js_andruavMessages.CONST_ACCESS_CODE_PARAMETER],
                    message: `New access code generated for ${p_accountName}`,
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
        } finally {
            this.#m_accessCodeInProgress = false;
        }
    }

    // ─── Team user administration API ──────────────────────────────────────
    // These methods call the /w/am endpoint with team-admin sub-commands.
    // The server scopes every operation to the caller's TeamID (derived from
    // the session) and gates on the isadmin flag.

    /**
     * Fetch read-only info for the caller's team.
     * @returns {Promise<{ok:boolean,error:*,errorMessage:*,data:*}>}
     */
    async fn_getTeamInfo() {
        return this.#teamAdminRequest(js_andruavMessages.CONST_CMD_GET_TEAM_INFO, {});
    }

    /**
     * List all logins belonging to the caller's team.
     * @returns {Promise<{ok:boolean,error:*,errorMessage:*,data:*}>}
     */
    async fn_listTeamUsers() {
        return this.#teamAdminRequest(js_andruavMessages.CONST_CMD_LIST_TEAM_USERS, {});
    }

    /**
     * Add a new login to the caller's team.
     * @param {string} loginName - Email/login name of the new user.
     * @param {string} permission - Permission hex string (e.g. '0xffffffff').
     * @param {boolean} isAdmin - Whether the new user is an admin.
     * @param {string|null} accessCode - Optional access code; auto-generated if null/empty.
     * @returns {Promise<{ok:boolean,error:*,errorMessage:*,accessCode:*}>}
     */
    async fn_addTeamUser(loginName, permission, isAdmin, accessCode = null) {
        return this.#teamAdminRequest(js_andruavMessages.CONST_CMD_ADD_TEAM_USER, {
            [js_andruavMessages.CONST_TARGET_LOGIN_PARAMETER]: loginName,
            [js_andruavMessages.CONST_PERMISSION_PARAMETER]: permission,
            [js_andruavMessages.CONST_IS_ADMIN_PARAMETER]: isAdmin,
            [js_andruavMessages.CONST_ACCESS_CODE_PARAMETER]: accessCode,
        });
    }

    /**
     * Update an existing login in the caller's team.
     * @param {string} targetLoginName - Email/login name of the user to edit.
     * @param {string} permission - New permission hex string.
     * @param {boolean} isAdmin - New admin flag.
     * @param {string|null} accessCode - New access code; if null/empty the current one is kept.
     * @returns {Promise<{ok:boolean,error:*,errorMessage:*,accessCode:*}>}
     */
    async fn_updateTeamUser(targetLoginName, permission, isAdmin, accessCode = null) {
        return this.#teamAdminRequest(js_andruavMessages.CONST_CMD_UPDATE_TEAM_USER, {
            [js_andruavMessages.CONST_TARGET_LOGIN_PARAMETER]: targetLoginName,
            [js_andruavMessages.CONST_PERMISSION_PARAMETER]: permission,
            [js_andruavMessages.CONST_IS_ADMIN_PARAMETER]: isAdmin,
            [js_andruavMessages.CONST_ACCESS_CODE_PARAMETER]: accessCode,
        });
    }

    /**
     * Delete a login from the caller's team.
     * @param {string} targetLoginName - Email/login name of the user to delete.
     * @returns {Promise<{ok:boolean,error:*,errorMessage:*}>}
     */
    async fn_deleteTeamUser(targetLoginName) {
        return this.#teamAdminRequest(js_andruavMessages.CONST_CMD_DELETE_TEAM_USER, {
            [js_andruavMessages.CONST_TARGET_LOGIN_PARAMETER]: targetLoginName,
        });
    }

    /**
     * Verify a login's plaintext access code against the stored hash
     * (team-scoped, admin-gated).  Used by the QR-code flow — the server
     * replies ok/fail only and never echoes the code.
     * @param {string} targetLoginName - Email/login name of the user.
     * @param {string} accessCode - Plaintext access code to verify.
     * @returns {Promise<{ok:boolean,error:*,errorMessage:*}>}
     */
    async fn_verifyTeamUserPassword(targetLoginName, accessCode) {
        return this.#teamAdminRequest(js_andruavMessages.CONST_CMD_VERIFY_TEAM_USER, {
            [js_andruavMessages.CONST_TARGET_LOGIN_PARAMETER]: targetLoginName,
            [js_andruavMessages.CONST_ACCESS_CODE_PARAMETER]: accessCode,
        });
    }

    /**
     * Internal helper: POST a team-admin request to /w/am.
     * @param {string} subCommand - The CONST_CMD_* team-admin sub-command.
     * @param {object} extraParams - Additional body parameters.
     * @returns {Promise<{ok:boolean,error:*,errorMessage:*,data:*,accessCode:*}>}
     */
    async #teamAdminRequest(subCommand, extraParams) {
        if (!this._m_session_ID) {
            return { ok: false, error: ERROR_CODES.NO_SESSION, errorMessage: 'Not logged in', data: null };
        }

        const url = this.#getBaseUrl(js_andruavMessages.CONST_ACCOUNT_MANAGMENT);
        const keyValues = {
            [js_andruavMessages.CONST_SUB_COMMAND]: subCommand,
            [js_andruavMessages.CONST_SESSION_ID]: this._m_session_ID,
            ...extraParams,
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keyValues),
                signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT),
            }).then(res => res.json());

            const ok = response.e === js_andruavMessages.CONST_ERROR_NON;
            return {
                ok: ok,
                error: response.e ?? null,
                errorMessage: response.em || null,
                data: response.m_data || null,
                accessCode: response[js_andruavMessages.CONST_ACCESS_CODE_PARAMETER] || null,
                raw: response,
            };
        } catch (error) {
            const errorCode = error.name === 'AbortError' ? ERROR_CODES.NETWORK_ERROR : ERROR_CODES.UNKNOWN_ERROR;
            const errorMessage = error.name === 'AbortError' ? 'Request timed out' : AUTH_ERROR_BAD_CONNECTION;
            console.error('Team admin request error:', error);
            return { ok: false, error: errorCode, errorMessage: errorMessage, data: null };
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
                this._m_team_id = null;
                this._m_is_admin = false;
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
            this._m_team_id = null;
            this._m_is_admin = false;
        }
    }

    async #logoutViaPlugin() {
        const pluginAuthHost = this.fn_getPluginAuthHost();
        const pluginAuthPort = this.fn_getPluginAuthPort();
        // The connector serves plain HTTP on localhost (no TLS) — match the
        // login path, which also honours CONST_WEBCONNECTOR_CONFIG.BASE_PATH.
        const pluginBasePath = js_siteConfig.CONST_WEBCONNECTOR_CONFIG.BASE_PATH;
        const pluginLogoutUrl = fn_buildAuthUrlEx(false, pluginAuthHost, pluginAuthPort, pluginBasePath, js_andruavMessages.CONST_WEB_LOGOUT_COMMAND);

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
            this._m_team_id = null;
            this._m_is_admin = false;
        }
    }
}

export const js_andruavAuth = CAndruavAuth.getInstance();