// just extend this object to have access to this.subscribe and this.fn_dispatch

/*jshint esversion: 6 */

class CEventEmitter {

    constructor() {
        this.m_v_events = new Map();
    }

    static getInstance() {
        if (!CEventEmitter.instance) {
            CEventEmitter.instance = new CEventEmitter();
        }
        return CEventEmitter.instance;
    }

    
    fn_dispatch(p_event, p_data) {
        
        if (!this.m_v_events.has(p_event)) {
            return; // No listeners for this event
        }

        const subscribers = this.m_v_events.get(p_event);

        for (const { listner, callback } of subscribers) { // Use for...of loop
            try {
                callback(listner, p_data); // Correct this context handling
            } catch (e) {
                console.error(`Error in event handler for ${p_event}:`, e);
            }
        }
        
    };


    fn_getIndex(p_event, p_listner) {
        if (!this.m_v_events.has(p_event)) {
            return -1;
        }

        const subscribers = this.m_v_events.get(p_event);
        let index = 0;
        for (const item of subscribers) {
            if (item.listner === p_listner) {
                return index;
            }
            index++;
        }
        return -1;
    }


    fn_subscribe(p_event, p_listner, callback) {
        if (!this.m_v_events.has(p_event)) {
            this.m_v_events.set(p_event, new Set());
        }

        const subscribers = this.m_v_events.get(p_event);

        if (this.fn_getIndex(p_event, p_listner) === -1) {
            if (callback != null) {
                subscribers.add({ listner: p_listner, callback: callback });
            } else {
                console.log("unknown");
            }
        }
    }

    fn_removeEvent(p_event) {
        this.m_v_events.delete(p_event); // Clear the event's listeners
    }

    fn_unsubscribe(p_event, p_listner) {
        if (!this.m_v_events.has(p_event)) {
            return;
        }

        const subscribers = this.m_v_events.get(p_event);

        for (const item of subscribers) {
            if (item.listner === p_listner) {
                subscribers.delete(item);
                break; // Exit after finding and deleting
            }
        }
        if (subscribers.size === 0) {
            this.m_v_events.delete(p_event);
        }
    }
};


  
  export var js_eventEmitter =  CEventEmitter.getInstance();