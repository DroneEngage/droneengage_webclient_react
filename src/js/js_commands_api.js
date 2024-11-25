/* ********************************************************************************
*   Mohammad Hefny
*
*   01 Sep 2024
*
* This class gather APIs in one class away from WS class.
* This class creates the JSON command itself.
*********************************************************************************** */


import * as js_andruavMessages from './js_andruavMessages.js';
import * as js_common from './js_common.js'


export class CCommandAPI
{

    constructor() {

    }

    static API_requestID(p_partyID) {
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                    C: js_andruavMessages.CONST_TYPE_AndruavMessage_ID
                }
        };

        return msg;
    };

    static API_requestP2P(p_andruavUnit) {
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                    C: js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_INFO
                }   
        };
            
        return msg;
    };

    static API_requestSDR(p_andruavUnit) {
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                    C: js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION,
                    a: js_andruavMessages.CONST_SDR_ACTION_SDR_INFO
                }   
        };
            
        return msg;
    };


    static API_scanSDRDrivers(p_andruavUnit) {
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms': {
                    C: js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION,
                    a: js_andruavMessages.CONST_SDR_ACTION_LIST_SDR_DEVICES
                }   
        };
            
        return msg;
    };


    static API_scanSDRFreq(p_andruavUnit, p_on_off) {
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION,
            'ms': {
                    a: p_on_off===true?js_andruavMessages.CONST_SDR_ACTION_READ_DATA:js_andruavMessages.CONST_SDR_ACTION_PAUSE_DATA
                }   
        };
            
        return msg;
    };


    API_soundTextToSpeech(p_andruavUnit, p_text, p_language, p_pitch, p_volume) {
        if (p_andruavUnit.partyID === null || p_andruavUnit.partyID === undefined) return ;
        
        let p_msg = {
            t: p_text
        };
        
        if (p_language !== '' && p_language != null && p_language !== undefined)
        {
            p_msg.l = p_language;
        }

        if (p_pitch !== '' && p_pitch != null && p_pitch !== undefined)
        {
            p_msg.p = p_pitch;
        }

        if (p_volume !== '' && p_volume != null && p_volume !== undefined)
        {
            p_msg.v = p_volume;
        }
    
        this.API_sendCMD(p_andruavUnit.partyID, js_andruavMessages.CONST_TYPE_AndruavMessage_SOUND_TEXT_TO_SPEECH, p_msg);

        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_SOUND_TEXT_TO_SPEECH,
            'ms': p_msg 
        };
            
        return msg;
    }

    static API_scanP2P(p_andruavUnit) {
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_ACTION,
            'ms': {
                    a: js_andruavMessages.CONST_P2P_ACTION_SCAN_NETWORK
                }   
        };
            
        return msg;
    };


    static API_resetP2P(p_andruavUnit) {
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_P2P_ACTION,
            'ms': {
                    a: js_andruavMessages.CONST_P2P_ACTION_RESTART_TO_MAC
                }   
        };
            
        return msg;
    };


    static API_makeSwarm (p_andruavUnit, p_formationID) {
        if (p_andruavUnit.partyID === null || p_andruavUnit.partyID === undefined) return ;
        
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_MakeSwarm,
            'ms':  {
                a: p_formationID, // m_formation_as_leader
                b: p_andruavUnit.partyID // Leader
            }
        };

        return msg;
    }

    static API_requestFromDroneToFollowAnother (p_andruavUnit, slaveIndex, leaderPartyID, do_follow) {
        if (p_andruavUnit.partyID === null || p_andruavUnit.partyID === undefined) return ;

        if ((do_follow === null || do_follow === undefined)
        && (leaderPartyID === null || leaderPartyID === undefined))
        {
            do_follow = js_andruavMessages.CONST_TYPE_SWARM_UNFOLLOW;
        }
        
        const partyID = p_andruavUnit.partyID;
        let p_msg = {
            a: slaveIndex, // index ... could be -1 to take available location.
            c: partyID, // slave
            f: do_follow
        };

        if (leaderPartyID !== null && leaderPartyID !== undefined) {
            p_msg.b = leaderPartyID;
        }
        

        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_FollowHim_Request,
            'ms':  p_msg
        };

        return msg;
    }
    
    static API_setSDRConfig (p_andruavUnit, p_fequency_center, 
        p_gain, p_sample_rate,
        p_decode_mode, p_driver_index, p_interval,
        p_display_bars, p_trigger_level
    )
    {
        if (p_andruavUnit.partyID === null || p_andruavUnit.partyID === undefined) return ;
        
        let p_msg = {
            'a': js_andruavMessages.CONST_SDR_ACTION_SET_CONFIG
        };
        
        if (p_fequency_center !== null)  p_msg.fc = p_fequency_center;
        if (p_gain !== null)             p_msg.g  = p_gain;
        if (p_sample_rate !== null)      p_msg.s  = p_sample_rate;
        if (p_decode_mode !== null)      p_msg.m  = p_decode_mode;
        if (p_driver_index !== null)     p_msg.i  = p_driver_index;
        if (p_interval !== null)         p_msg.t  = p_interval; // in milli-seconds - 0 means ignore
        if (p_display_bars !== null)     p_msg.r  = p_display_bars;
        if (p_trigger_level !== null)    p_msg.l  = p_trigger_level;
        
        js_common.fn_console_log (p_msg);
        
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_SDR_ACTION,
            'ms':  p_msg
        };

        return msg;
        
    }


    static API_SetCommunicationChannel(p_andruavUnit, comm_on_off, p2p_on_off, comm_on_off_duration, p2p_on_off_duration) 
    {
        let p_msg = {
        };

        if (comm_on_off!=null)
        {
            p_msg.ws = comm_on_off;
            if (comm_on_off_duration!=null)
            {
                p_msg.wsd = comm_on_off_duration;
            }
        }

        

        if (p2p_on_off!=null)
        {
            p_msg.p2p = p2p_on_off;
            if (p2p_on_off_duration!=null)
            {
                p_msg.p2pd = p2p_on_off_duration;
            }
        }


        const msg = 
            {
                'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_Set_Communication_Line,
                'ms':  p_msg
            };

        return msg;
    }



    static API_resumeTelemetry() {
        
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms':  {
                C: js_andruavMessages.CONST_RemoteCommand_TELEMETRYCTRL,
                Act: js_andruavMessages.CONST_TELEMETRY_REQUEST_RESUME
            }
        };

        return msg;
    };


    static API_pauseTelemetry() {
        
        const msg = 
        {
            'mt': js_andruavMessages.CONST_TYPE_AndruavMessage_RemoteExecute,
            'ms':  {
                C: js_andruavMessages.CONST_RemoteCommand_TELEMETRYCTRL,
                Act: js_andruavMessages.CONST_TELEMETRY_REQUEST_PAUSE
            }
        };

        return msg;
    };

    

}

