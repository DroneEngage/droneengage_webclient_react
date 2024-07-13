// just extend this object to have access to this.subscribe and this.fn_dispatch

/*jshint esversion: 6 */

class CEventEmitter {

    constructor() {
        this.m_v_events = {};
    }

    static getInstance() {
        if (!CEventEmitter.instance) {
            CEventEmitter.instance = new CEventEmitter();
        }
        return CEventEmitter.instance;
    }

    
    fn_dispatch(p_event, p_data) {
        if (!this.m_v_events[p_event]) 
            return;
        // no one is listening to this event
        const len = this.m_v_events[p_event].length;
        const subscribers = this.m_v_events[p_event];
        for (var i = 0; i < len; i++) {
            var v_subscriber = subscribers[i];
            v_subscriber.callback(v_subscriber.listner, p_data);
        }
    };


    fn_getIndex(p_event, p_listner)
    {
        if (!this.m_v_events[p_event]) 
            return -1;
        
        for (var i = 0; i < this.m_v_events[p_event].length; i++) {
            var v_subscriber = this.m_v_events[p_event][i];
            if (v_subscriber.listner === p_listner) {
                return i;
            }
        }

        return -1;
    }

    fn_subscribe(p_event, p_listner, callback) {
        if (!this.m_v_events[p_event]) 
            this.m_v_events[p_event] = [];
         // new event
        
        if (this.fn_getIndex(p_event, p_listner)===-1)
        {
            if (callback!=null)
            {
                this.m_v_events[p_event].push({listner: p_listner, callback: callback});
            }
            else
            {
                console.log ("unknown");
            }
        }
    };

    fn_removeEvent(p_event) {
        this.m_v_events[p_event] = []; // all away :)
    };

    fn_unsubscribe(p_event, p_listner) {
        if (!this.m_v_events[p_event]) 
            return;
         // no one is listening to this event

        while (true)
        {
            let index = this.fn_getIndex(p_event, p_listner);
            if (index ==-1) return ;
            this.m_v_events[p_event].splice(index, 1);
        }
    }
};

// window.AndruavLibs = window.AndruavLibs || {REVISION: 'BETA' };


// (function(lib) {
// 	"use strict";
// 	if (typeof module === "undefined" || typeof module.exports === "undefined") {
// 	  window.AndruavLibs.EventEmitter = lib; // in ordinary browser attach library to window
// 	} else {
// 	  module.exports = lib; // in nodejs
// 	}
//   })(new CEventEmitter());
  
  export default CEventEmitter.getInstance();