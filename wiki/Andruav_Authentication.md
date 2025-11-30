`CAndruavAuth` is a singleton class handling authentication with the Andruav/Ardupilot-Cloud backend.  
It manages login, logout, access code generation, and permission validation for a web-based drone control client.

---

### Definition

`CAndruavAuth` is a JavaScript class responsible for authenticating users in the Andruav web client, a system used to interact with drones via the Ardupilot-Cloud platform. It uses HTTP requests to communicate with a backend authentication server and maintains session state, permissions, and retry logic.

The class follows the **singleton pattern** via the static `getInstance()` method, ensuring only one instance exists across the application. This is crucial for maintaining consistent authentication state.

```javascript
23:489:/home/mhefny/TDisk/public_versions/andruav/andruav_webclient_react/src/js/js_andruav_auth.js
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
        this._m_auth_ports = this._m_auth_port; // Legacy
        this._m_perm = 0;
        this._m_permissions_ = '';
        this._m_session_ID = null;
        this._m_logined = false;
        this.C_ERR_SUCCESS_DISPLAY_MESSAGE = 1001; // Legacy
    }

    static getInstance() {
        if (!CAndruavAuth.instance) {
            CAndruavAuth.instance = new CAndruavAuth();
        }
        return CAndruavAuth.instance;
    }

    // Core methods:
    // fn_do_loginAccount() – authenticate user
    // fn_do_logoutAccount() – terminate session
    // fn_generateAccessCode() – create access tokens
    // fn_regenerateAccessCode() – refresh tokens
    // Permission checks: fn_do_canGCS(), fn_do_canControl(), etc.
}
```

- **Type**: Class (singleton)
- **Purpose**: Centralized authentication and session management
- **Key fields**:
  - `_m_session_ID`: Stores active session token
  - `_m_logined`: Boolean indicating login state
  - `_m_perm`: Bitmask of user permissions
  - `_m_permissions_`: Hex string representation of permissions
- **Key methods**:
  - `fn_do_loginAccount()`: Logs in using email and access code
  - `fn_do_logoutAccount()`: Ends session
  - `fn_generateAccessCode()` / `fn_regenerateAccessCode()`: Manage access tokens
  - `fn_do_can*()`: Permission checks using bitmasks
- **Side effects**: Dispatches events via `js_eventEmitter`, makes HTTP requests, sets timeouts for retry
- **Dependencies**:
  - `js_siteConfig`: Determines auth server IP/port based on test/prod mode
  - `js_andruavMessages`: Contains constants for API endpoints and permission flags
  - `js_eventEmitter`: Used to notify other parts of the app about auth state changes

---

### Example Usages

The most common usage is logging in a user via email and access code (password), then checking their permissions.

```javascript
183:277:/home/mhefny/TDisk/public_versions/andruav/andruav_webclient_react/src/js/js_andruav_auth.js
async fn_do_loginAccount(p_userName, p_accessCode) {
    js_eventEmitter.fn_dispatch(js_event.EE_Auth_Login_In_Progress, null);

    if (!this.#validateEmail(p_userName) || !p_accessCode) {
        this._m_logined = false;
        js_eventEmitter.fn_dispatch(js_event.EE_Auth_BAD_Logined, { /* error */ });
        return false;
    }

    const url = this.#getBaseUrl(js_andruavMessages.CONST_WEB_LOGIN_COMMAND);
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
        // Handle server unreachable or SSL error
        return false;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(keyValues)
        }).then(res => res.json());

        if (response.e === js_andruavMessages.CONST_ERROR_NON) {
            this._m_session_ID = response.session_id;
            this._m_permissions_ = response.permissions || DEFAULT_PERMISSIONS;
            this._m_perm = parseInt(this._m_permissions_, 16);
            this._m_logined = true;
            js_eventEmitter.fn_dispatch(js_event.EE_Auth_Logined, { /* success */ });
            return true;
        } else {
            // Handle login failure
        }
    } catch (error) {
        // Handle network/SSL errors
    }

    // Schedule retry if enabled
    if (this.m_retry_login) {
        this.m_retry_handle = setTimeout(() => {
            this.fn_do_loginAccount(this.m_username, this.m_accesscode);
        }, AUTH_REQUEST_TIMEOUT);
    }

    return false;
}
```

Another key usage is checking user permissions after login:

```javascript
87:89:/home/mhefny/TDisk/public_versions/andruav/andruav_webclient_react/src/js/js_andruav_auth.js
fn_do_canGCS() {
    return (this._m_perm & js_andruavMessages.CONST_ALLOW_GCS) === js_andruavMessages.CONST_ALLOW_GCS;
}
```

This uses bitwise AND to check if the `CONST_ALLOW_GCS` flag is set in the user’s permission bitmask.

The exported instance `js_andruavAuth` is used throughout the codebase:

```javascript
491:/home/mhefny/TDisk/public_versions/andruav/andruav_webclient_react/src/js/js_andruav_auth.js
export const js_andruavAuth = CAndruavAuth.getInstance();
```

This allows any module to import and use the same auth instance:

```javascript
import { js_andruavAuth } from './js_andruav_auth.js';

if (js_andruavAuth.fn_logined()) {
    console.log("User is logged in");
}
```

**Usage Summary**:  
`CAndruavAuth` is central to the web client’s security model. It is used in login forms, permission gates for drone control features, and automated token management. Its singleton nature ensures consistent state, and its event dispatching allows UI components to react to login/logout events.

---

### Notes

- **Automatic retry on login failure**: If `m_retry_login` is enabled (default), failed login attempts trigger a retry after `AUTH_REQUEST_TIMEOUT` (10 seconds). This helps recover from transient network issues.
- **Health check before login**: The class probes the server’s `/health` endpoint before attempting login, improving error diagnosis (e.g., distinguishing between network issues and bad credentials).
- **SSL error detection**: It attempts to detect SSL/TLS issues by inspecting error messages like `ERR_CERT`, providing more specific feedback than generic network errors.
- **Legacy support**: Fields like `_m_auth_ports` and `C_ERR_SUCCESS_DISPLAY_MESSAGE` suggest backward compatibility with older versions of the system.

---

### See Also

- `js_andruavAuth`: The exported singleton instance of `CAndruavAuth`, used globally across the app.
- `js_siteConfig`: Provides configuration for test vs production environments, determining which auth server to connect to.
- `js_andruavMessages`: Contains constants like `CONST_WEB_LOGIN_COMMAND`, `CONST_ALLOW_GCS`, and other protocol-level definitions used by `CAndruavAuth`.
- `js_eventEmitter`: Event system used to broadcast authentication state changes (e.g., `EE_Auth_Logined`, `EE_Auth_BAD_Logined`).
- `AUTH_GCS_TYPE`: Constant `'g'` indicating the client is a Ground Control Station, sent during login to identify the actor type.