import * as js_andruavMessages from '../protocol/js_andruavMessages.js';

export const fn_buildHttpBaseUrl = (secure, host, port) => {
    const protocol = secure === true ? 'https' : 'http';
    return `${protocol}://${host}:${port}`;
};

export const fn_buildAuthUrl = (secure, host, port, path) => {
    return `${fn_buildHttpBaseUrl(secure, host, port)}${js_andruavMessages.CONST_WEB_FUNCTION}${path}`;
};

export const fn_buildHealthBaseUrl = (secure, host, port) => {
    return `${fn_buildHttpBaseUrl(secure, host, port)}${js_andruavMessages.CONST_HEALTH_FUNCTION}`;
};

export const fn_buildLoginPayload = (email, accessCode, ver, group = '1') => {
    return {
        [js_andruavMessages.CONST_ACCOUNT_NAME_PARAMETER]: email,
        [js_andruavMessages.CONST_ACCESS_CODE_PARAMETER]: accessCode,
        [js_andruavMessages.CONST_APP_GROUP_PARAMETER]: group,
        [js_andruavMessages.CONST_APP_NAME_PARAMETER]: 'de',
        [js_andruavMessages.CONST_APP_VER_PARAMETER]: ver,
        [js_andruavMessages.CONST_EXTRA_PARAMETER]: 'DRONE ENGAGE Web Client',
        [js_andruavMessages.CONST_ACTOR_TYPE]: 'g',
    };
};

export const fn_buildPluginSessionPayload = (ver, group = '1') => {
    return {
        [js_andruavMessages.CONST_APP_GROUP_PARAMETER]: group,
        [js_andruavMessages.CONST_APP_NAME_PARAMETER]: 'de',
        [js_andruavMessages.CONST_APP_VER_PARAMETER]: ver,
        [js_andruavMessages.CONST_EXTRA_PARAMETER]: 'DRONE ENGAGE Web Client',
        [js_andruavMessages.CONST_ACTOR_TYPE]: 'g',
    };
};

export const fn_buildPluginSessionPayloadEx = (ver, group = '1', unitId = null) => {
    const p = fn_buildPluginSessionPayload(ver, group);
    if (unitId !== null && unitId !== undefined && unitId.length > 0) {
        p.uid = unitId;
    }
    return p;
};

export const fn_parseLoginResponse = (response) => {
    const ok = response && response.e === js_andruavMessages.CONST_ERROR_NON;
    const comm = response ? response[js_andruavMessages.CONST_COMM_SERVER] : null;

    return {
        ok: ok,
        error: response ? response.e : null,
        errorMessage: response ? response.em : null,
        sessionId: response ? response[js_andruavMessages.CONST_SESSION_ID] : null,
        commServerHost: comm ? comm.g : null,
        commServerPort: comm ? comm.h : null,
        commServerAuthKey: comm ? comm.f : null,
        permission: response ? response[js_andruavMessages.CONST_PERMISSION] : null,
        permission2: response ? response[js_andruavMessages.CONST_PERMISSION2] : null,
        // partyId is NOT part of the cloud auth response.
        // It is only provided by the local WebPlugin login endpoint (/w/wl/).
        // New name: `plugin_party_id` (preferred). Legacy name: `pid`.
        // The WebClient uses it ONLY when connecting to the plugin's WSS.
        partyId: response ? (response.plugin_party_id || response.pid) : null,
        raw: response,
    };
};
