import { js_globals } from './js_globals.js';
import { EVENTS as js_event } from './js_eventList.js'
import * as js_helpers from './js_helpers.js';
import * as js_siteConfig from './js_siteConfig.js';
//import {CADSBObject, CADSBObjectList} from 'js_adsbUnit.js';
import { js_localGamePad } from './js_localGamePad.js'
import * as js_andruavUnit from './js_andruavUnit.js';
import * as js_andruavMessages from './js_andruavMessages.js';

import * as js_common from './js_common.js'
import { js_localStorage } from './js_localStorage.js'
import { js_eventEmitter } from './js_eventEmitter.js'

import * as js_andruav_facade from './js_andruav_facade.js'
import * as js_andruav_parser from './js_andruav_parser.js'


export const CMD_SYS_TASKS = 'tsk'; //'tsk'; // group broadcast

export const CONST_TARGETS_GCS = '_GCS_';
export const CONST_TARGETS_DRONES = '_AGN_';

// Command Types either System or Communication
const CMDTYPE_SYS = 's'; // system command
const CMDTYPE_COMM = 'c';// 'c';

// Communication Commands
const CMD_COMM_GROUP = 'g'; // group broadcast
const CMD_COMM_INDIVIDUAL = 'i';

// System Commands:
const CMD_SYS_PING = 'ping'; //'ping'; // group broadcast

const c_SOCKET_STATUS = [
    'Fresh',
    'Connecting',
    'Disconnecting',
    'Disconnected',
    'Connected',
    'Registered',
    'UnRegistered',
    'Error'
];

class CAndruavClientWS {


    constructor() {

        this.fn_init();

        Object.seal(this);
    }

    static getInstance() {
        if (!CAndruavClientWS.instance) {
            CAndruavClientWS.instance = new CAndruavClientWS();
        }
        return CAndruavClientWS.instance;
    }


    fn_init() {
        this.ws = null;
        this.partyID = null;
        this.unitID = null;
        this.m_groupName = null;

        this.m_server_ip = null;
        this.m_server_port = null;
        this.m_server_port_ss = null;
        this.server_AuthKey = null;
        this._permissions_ = null;
        this.server_accessCode = null;

        this.socketStatus = js_andruavMessages.CONST_SOCKET_STATUS_FREASH;
        this.socketConnectionDone = false;
        this.m_andruavUnit = null;

        this.m_timer_id = null;

        js_andruav_parser.AndruavClient.fn_init();
        js_andruav_facade.AndruavClientFacade.fn_init();
    }

    fn_destroy() {
        // Close WebSocket if open
        if (this.ws) {
            try {
                this.ws.close();
            } catch (error) {
                js_common.fn_console_log(`Error closing WebSocket: ${error.message}`);
            }
            this.ws = null;
        }

        // Clear timer if active
        this._clearTimer();


    }


    _clearTimer() {
        if (this.m_timer_id) {
            clearInterval(this.m_timer_id);
            this.m_timer_id = null;
        }
    }

    // please move it out side
    fn_generateJSONMessage(p_senderID, p_targetID, p_msgRouting, p_msgID, p_msg) { // prepare json data
        const p_jmsg = {
            ty: p_msgRouting,
            // MSGRrouting,
            // cm: cm, //cmd, DEPRECATED
            sd: p_senderID, // p_senderID,
            st: 'w', // senderType Web,
            tg: p_targetID,
            mt: p_msgID, // msgID,
            ms: p_msg

        };


        // js_common.fn_console_log("out:" + JSON.stringify(p_jmsg)); // Disable in production for perf

        return JSON.stringify(p_jmsg);
    };

    API_sendCMD(p_target, msgType, msg) {
        try {
            let v_rountingMsg;
            if (p_target !== null && p_target !== undefined) {
                v_rountingMsg = CMD_COMM_INDIVIDUAL;
            } else { // if you want to prevent GCS to GCS.
                if ((p_target === null || p_target === undefined)
                    && (js_siteConfig.CONST_DONT_BROADCAST_TO_GCSs === true
                        || js_localStorage.fn_getGCSShowMe() === false)) {
                    p_target = CONST_TARGETS_DRONES;
                    v_rountingMsg = CMD_COMM_INDIVIDUAL;
                } else {
                    v_rountingMsg = CMD_COMM_GROUP;
                }
            }


            const msgx_txt = this.fn_generateJSONMessage(this.partyID, p_target, v_rountingMsg, msgType, msg);
            this.sendex(msgx_txt, false);

        } catch (e) {
            // js_common.fn_console_log("Exception API_sendCMD", e); // Disable in production for perf
        }
    };


    API_sendBinCMD(targetName, msgType, data) {
        let v_msgRouting;
        if (targetName !== null && targetName !== undefined) {
            v_msgRouting = CMD_COMM_INDIVIDUAL;
        } else {
            v_msgRouting = CMD_COMM_GROUP;
        }

        let h = js_helpers.fn_str2ByteArray(this.fn_generateJSONMessage(this.partyID, targetName, v_msgRouting, msgType));
        let ws = this.ws;

        const msgx_bin = js_helpers.fn_concatBuffers(h, data, true);
        this.sendex(msgx_bin, true);
    };


    API_addMe2() {
        if ((this.partyID === null || this.partyID === undefined) || (this.m_groupName === null || this.m_groupName === undefined))
            return;


        const v_unit = new js_andruavUnit.CAndruavUnitObject();
        v_unit.m_IsMe = true;
        v_unit.m_IsGCS = true;
        v_unit.m_unitName = this.unitID;
        v_unit.partyID = this.partyID;
        v_unit.m_groupName = this.m_groupName;
        v_unit.m_telemetry_protocol = js_andruavMessages.CONST_Unknown_Telemetry;
        v_unit.m_VehicleType = js_andruavUnit.CONST_VEHICLE_GCS;

        this.m_andruavUnit = v_unit;
    };

    API_delMe() {
        const c_msg = {};
        this.socketConnectionDone = false;

        this._API_sendSYSCMD(js_andruavMessages.CONST_TYPE_AndruavSystem_LogoutCommServer, c_msg);
    };

    _API_sendSYSCMD(p_msgID, p_msg) {
        this.sendex(this.fn_generateJSONMessage(this.partyID, null, CMDTYPE_SYS, p_msgID, p_msg));
    };


    sendex(msg, is_binary) {
        try {
            if (!!this.ws) {
                this.ws.sendex(msg, is_binary);
            }
        } catch (e) {
            // js_common.fn_console_log("Exception API_sendCMD", e); // Disable in production for perf
        }
    }

    fn_disconnect(p_accesscode) {

        this.ws.close();
        this.ws = null;

    };

    prv_parseSystemMessage(Me, msg) {
        if (msg.messageType === js_andruavMessages.CONST_TYPE_AndruavSystem_ConnectedCommServer) {
            if (msg.msgPayload.s.indexOf('OK:connected') !== -1) {
                Me.setSocketStatus(js_andruavMessages.CONST_SOCKET_STATUS_CONNECTED);
                Me.setSocketStatus(js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED);

            } else { /*Me.onLog ("connection refused");*/
            }

            return;
        }

        if (msg.messageType === js_andruavMessages.CONST_TYPE_AndruavSystem_LogoutCommServer) {
            if (msg.msgPayload.s.indexOf('OK:del') !== -1) {
                Me.setSocketStatus(js_andruavMessages.CONST_SOCKET_STATUS_FREASH);
                //Me.EVT_onDeleted();
                js_eventEmitter.fn_dispatch(js_event.EE_onDeleted);

            } else { /*Me.onLog ("refused to delete, maybe not existed. pls use dell instead of del to enforce addition.");*/
            }
            return;
        }
    };

    setSocketStatus(status) {
        // MOVE LOGIC TO js_main 
        this.socketStatus = status;

        if (status === js_andruavMessages.CONST_SOCKET_STATUS_CONNECTED) {
            this.API_addMe2();
        }

        if (status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
            js_eventEmitter.fn_dispatch(js_event.EE_WS_OPEN, null);
            this.socketConnectionDone = true;
            js_andruav_facade.AndruavClientFacade.API_sendID(); // send now important
            const Me = this;
            this.m_timer_id = setInterval(function () {
                js_andruav_facade.AndruavClientFacade.API_sendID();
                js_eventEmitter.fn_dispatch(js_event.EE_adsbExpiredUpdate, null);
            }, js_andruavMessages.CONST_sendID_Interverl);

            // request IDfrom all units
            js_andruav_facade.AndruavClientFacade.API_requestID();

        } else {
            clearInterval(this.m_timer_id);
        }
        js_eventEmitter.fn_dispatch(js_event.EE_onSocketStatus2, { status: status, name: c_SOCKET_STATUS[status - 1] });
    };

    getSocketStatus() {
        return this.socketStatus;
    }

    isSocketConnectionDone() {
        return this.socketConnectionDone;
    }

    prv_parseJSONMessage(JsonMessage) {

        const p_jmsg = JSON.parse(JsonMessage); // PHP sends Json data

        const message = {
            _ty: p_jmsg.ty,
            // command type
            // _cd 		: p_jmsg.cm,                 //main-command DEPRECATED
            groupID: p_jmsg.gr, // group name
            senderName: p_jmsg.sd, // sender name
            msgPayload: p_jmsg.ms
        };

        if (p_jmsg.hasOwnProperty('mt')) {
            message.messageType = p_jmsg.mt;
        }

        return message;
    };

    prv_extractBinaryPacket(evt) {
        const Me = this;

        // Directly handle ArrayBuffer
        if (!(evt.data instanceof ArrayBuffer)) {
            console.warn("Invalid data received, expected ArrayBuffer");
            return;
        }

        Me.handleBinaryData(evt.data);
    }

    handleBinaryData(contents) {
        const Me = this;

        try {
            // Convert binary data to Uint8Array
            const data = new Uint8Array(contents);
            const byteLength = contents.byteLength;

            // Extract JSON command from binary data
            const out = js_helpers.prv_extractString(data, 0, byteLength);
            if (!out.text) {
                throw new Error("No JSON command found in binary data");
            }

            // Parse JSON command
            const andruavCMD = JSON.parse(out.text);
            const p_jmsg = Me.prv_parseJSONMessage(out.text);

            // Find or create the unit
            const unitName = js_andruavUnit.fn_getFullName(p_jmsg.groupID, p_jmsg.senderName);
            let v_unit = js_globals.m_andruavUnitList.fn_getUnit(unitName);

            if (!v_unit) {
                v_unit = new js_andruavUnit.CAndruavUnitObject();
                v_unit.m_IsMe = false;
                v_unit.m_defined = false;
                v_unit.partyID = p_jmsg.senderName;
                v_unit.m_index = js_globals.m_andruavUnitList.count;
                js_globals.m_andruavUnitList.Add(v_unit.partyID, v_unit);

                // Request unit ID if allowed
                if (v_unit.m_Messages.fn_sendMessageAllowed(js_andruavMessages.CONST_TYPE_AndruavMessage_ID)) {
                    js_andruav_facade.AndruavClientFacade.API_requestID(p_jmsg.senderName);
                    v_unit.m_Messages.fn_doNotRepeatMessageBefore(
                        js_andruavMessages.CONST_TYPE_AndruavMessage_ID,
                        1000,
                        new Date()
                    );
                } else {
                    // console.log("Skipping ID request (rate-limited)"); // Disable in production for perf
                }
            }

            // Update message statistics
            v_unit.m_Messages.fn_addMsg(p_jmsg.messageType);
            v_unit.m_Messages.m_received_msg++;
            v_unit.m_Messages.m_received_bytes += data.length;
            v_unit.m_Messages.m_lastActiveTime = Date.now();

            // Process the binary message
            js_globals.v_andruavClient.prv_parseBinaryAndruavMessage(v_unit, andruavCMD, data, out.nextIndex, byteLength);
        } catch (error) {
            console.error("Error processing binary message:", error.message);
        }
    }


    fn_connect(p_accesscode) {
        try {

            if (p_accesscode === null || p_accesscode === undefined) {
                alert("Password cannot be empty");
                return;
            }

            this.server_accessCode = p_accesscode;

            let url = null;
            if (window.location.protocol === 'https:') {
                // f: CONST_CS_LOGIN_TEMP_KEY
                // g: CONST_CS_SERVER_PUBLIC_HOST
                // s: SID
                url = 'wss://' + this.m_server_ip + ':' + this.m_server_port_ss + '?f=' + this.server_AuthKey + '&s=' + this.partyID + '&at=g';;

            } else {
                url = 'ws://' + this.m_server_ip + ':' + this.m_server_port + '?f=' + this.server_AuthKey + '&s=' + this.partyID + '&at=g';

            } url = url;

            if ("WebSocket" in window) {
                //TODO: HANDLE if WS is not responding.
                this.ws = new WebSocket(url);
                this.ws.binaryType = 'arraybuffer'; // Set to receive binary as ArrayBuffer for efficiency
                this.ws.parent = this;
                this.ws.sendex = function (msg, isbinary) {
                    if (this.readyState === WebSocket.OPEN) {

                        if (isbinary === null || isbinary === undefined || isbinary === false) {
                            isbinary = false;
                            this.send(msg);
                        }
                        else {
                            this.send(msg); // Send ArrayBuffer directly (fn_concatBuffers should return ArrayBuffer)
                        }
                    } else {
                        console.error("WebSocket is not yet open, cannot send message.");
                    }
                };
                // OnOpen callback of Websocket
                const Me = this;
                this.ws.onopen = function () {
                    // js_eventEmitter.fn_dispatch(js_event.EE_WS_OPEN, null);

                };

                // OnMessage callback of websocket
                this.ws.onmessage = function (evt) {
                    if (typeof evt.data === "string") { // This is a text message
                        const p_jmsg = Me.prv_parseJSONMessage(evt.data);
                        switch (p_jmsg._ty) {
                            case CMDTYPE_SYS: Me.prv_parseSystemMessage(Me, p_jmsg);
                                break;

                            case CMD_COMM_GROUP:
                            case CMD_COMM_INDIVIDUAL:
                                js_andruav_parser.AndruavClient.prv_parseCommunicationMessage(Me, p_jmsg, evt);
                                break;
                        }
                        // js_common.fn_console_log('msg:' + JSON.stringify(p_jmsg)); // Disable in production for perf
                    } else {

                        Me.prv_extractBinaryPacket(evt);
                    } // else-if
                };

                // OnClose callback of websocket
                this.ws.onclose = function () {
                    Me.setSocketStatus(js_andruavMessages.CONST_SOCKET_STATUS_DISCONNECTED);
                    js_eventEmitter.fn_dispatch(js_event.EE_WS_CLOSE, null);
                };

                this.ws.onerror = function (err) {
                    Me.setSocketStatus(js_andruavMessages.CONST_SOCKET_STATUS_ERROR);
                };
            } else { // The browser doesn't support WebSocket
                alert("WebSocket NOT supported by your Browser!");
            }
        }
        catch (e) {
            console.error("WebSocket initialization error:", e);
            if (e.message.includes("SSL") || e.message.includes("TLS")) {
                alert("SSL/TLS error detected. Please check your certificate configuration.");
            }
            console.log("Web Socket Failed");
            console.log(e);
            this.setSocketStatus(js_andruavMessages.CONST_SOCKET_STATUS_ERROR);
        }
    };


    fn_isRegistered() {
        return (this.socketStatus === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED);

    }

};
export const AndruavClientWS = CAndruavClientWS.getInstance();