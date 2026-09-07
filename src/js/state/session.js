// Live mutable runtime state — behind accessors so every write is greppable.
//
// These are the ~10 genuinely runtime values that were on js_globals:
// the Andruav client/unit-list/facade/WebSocket, the user's GPS position,
// the guided-waypoint marker, map shape array, current tab status, and
// connect retry counter.  v_andruavWS, v_andruavFacade, and v_connectState
// were added at runtime (never initialised in the GLOBALS constructor);
// they default to null here.

let m_myposition = null;
let m_v_andruavClient = null;
let m_m_andruavUnitList = null;
let m_v_connectRetries = 5;
let m_v_map_shapes = [];
let m_m_markGuided = null;
let m_m_current_tab_status = 'unknown';
let m_v_andruavWS = null;
let m_v_andruavFacade = null;
let m_v_connectState = null;

export const fn_getMyposition = () => m_myposition;
export const fn_setMyposition = (v) => { m_myposition = v; };

export const fn_getAndruavClient = () => m_v_andruavClient;
export const fn_setAndruavClient = (v) => { m_v_andruavClient = v; };

export const fn_getAndruavUnitList = () => m_m_andruavUnitList;
export const fn_setAndruavUnitList = (v) => { m_m_andruavUnitList = v; };

export const fn_getConnectRetries = () => m_v_connectRetries;
export const fn_setConnectRetries = (v) => { m_v_connectRetries = v; };

export const fn_getMapShapes = () => m_v_map_shapes;
export const fn_setMapShapes = (v) => { m_v_map_shapes = v; };

export const fn_getMarkGuided = () => m_m_markGuided;
export const fn_setMarkGuided = (v) => { m_m_markGuided = v; };

export const fn_getCurrentTabStatus = () => m_m_current_tab_status;
export const fn_setCurrentTabStatus = (v) => { m_m_current_tab_status = v; };

export const fn_getAndruavWS = () => m_v_andruavWS;
export const fn_setAndruavWS = (v) => { m_v_andruavWS = v; };

export const fn_getAndruavFacade = () => m_v_andruavFacade;
export const fn_setAndruavFacade = (v) => { m_v_andruavFacade = v; };

export const fn_getConnectState = () => m_v_connectState;
export const fn_setConnectState = (v) => { m_v_connectState = v; };
