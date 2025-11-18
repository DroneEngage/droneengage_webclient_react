import * as js_siteConfig from './js_siteConfig.js';
import { EVENTS as js_event } from './js_eventList.js';
import * as js_andruavMessages from './protocol/js_andruavMessages.js';
import { js_eventEmitter } from './js_eventEmitter';

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
        this._m_logined = false;
        this.C_ERR_SUCCESS_DISPLAY_MESSAGE = 1001; // Legacy error code
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
        const keyValues = {
            [js_andruavMessages.CONST_ACCOUNT_NAME_PARAMETER]: p_userName,
            [js_andruavMessages.CONST_ACCESS_CODE_PARAMETER]: p_accessCode,
            [js_andruavMessages.CONST_APP_GROUP_PARAMETER]: '1',
            [js_andruavMessages.CONST_APP_NAME_PARAMETER]: 'andruav',
            [js_andruavMessages.CONST_APP_VER_PARAMETER]: this._m_ver,
            [js_andruavMessages.CONST_EXTRA_PARAMETER]: 'DRONE ENGAGE Web Client',
            [js_andruavMessages.CONST_ACTOR_TYPE]: AUTH_GCS_TYPE,
        };

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

            if (response.e === js_andruavMessages.CONST_ERROR_NON) {
                this._m_logined = true;
                this._m_session_ID = response[js_andruavMessages.CONST_SESSION_ID];
                this.m_server_port = response[js_andruavMessages.CONST_COMM_SERVER].h;
                this.m_server_ip = response[js_andruavMessages.CONST_COMM_SERVER].g;
                this.server_AuthKey = response[js_andruavMessages.CONST_COMM_SERVER].f;
                this.m_username = p_userName;
                this._m_permissions_ = response[js_andruavMessages.CONST_PERMISSION];
                this._m_perm = response[js_andruavMessages.CONST_PERMISSION2] ?? DEFAULT_PERMISSIONS;
                js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logined, response);
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

    async fn_probeServer(baseUrl) {
        try {
            console.log('Probing URL:', `${baseUrl}/health`);
            const response = await fetch(`${baseUrl}/health`, {
                method: 'GET', // Use GET for simplicity; HEAD is also viable
                headers: { 'Content-Type': 'application/json' },
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
}

export const js_andruavAuth = CAndruavAuth.getInstance();