import { js_globals } from '../js_globals.js';
import { EVENTS as js_event } from '../js_eventList.js'
import * as js_helpers from '../js_helpers.js';
import * as js_andruavUnit from '../js_andruavUnit.js';
import * as js_andruavMessages from '../protocol/js_andruavMessages.js';

import * as js_common from '../js_common.js'
import { js_eventEmitter } from '../js_eventEmitter.js'



class CChannelCommunicator {
    constructor() {
        this.m_channel = new BroadcastChannel('cross-page-channel');
        this.m_timer = null;

        Object.seal(this);

        window.addEventListener('beforeunload', () => {
            this.m_channel.close();
        });
    }

    fn_init()
    {
        this.receiveMessage();

        // this.m_timer = setInterval(() => {
        //     if (js_globals.m_current_tab_status === 'duplicate')
        //     {
        //         this.sendMessage();
        //     }
        // }, 1000);
    }

    sendMessage(p_msg)
    {   
        this.m_channel.postMessage(p_msg);
    }

    receiveMessage()
    {   
        this.m_channel.addEventListener('message', (event) => {
            console.log('Received message:', event.data);
        });
    }

    
}


export const js_channel = new CChannelCommunicator();