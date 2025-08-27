/*jshint esversion: 6 */

class CEventEmitter {
    constructor() {
        // m_v_events will store event names as keys,
        // and Maps of (listener -> callback) as values.
        // Map<string, Map<object, Function>>
        this.m_v_events = new Map();
    }

    static getInstance() {
        if (!CEventEmitter.instance) {
            CEventEmitter.instance = new CEventEmitter();
        }
        return CEventEmitter.instance;
    }

    /**
     * Dispatches an event to all subscribed listeners.
     * @param {string} p_event - The name of the event to dispatch.
     * @param {*} p_data - The data to pass to the event listeners.
     */
    fn_dispatch(p_event, p_data) {
        const subscribers = this.m_v_events.get(p_event); // Get the Map of listeners for this event
        
        if (!subscribers) { // Check if the Map exists (i.e., any subscribers for this event)
            return; // No listeners for this event
        }

        // subscribers is a Map: (listener -> callback)
        // Iterating over map entries [listener, callback]
        for (const [listner, callback] of subscribers.entries()) { 
            try {
                callback(listner, p_data); // Pass listener and data to the callback
            } catch (e) {
                console.error(`Error in event handler for ${p_event}:`, e);
            }
        }
    }

    /**
     * Gets the index of a listener for a specific event.
     * Note: This method remains O(N) as it needs to iterate to find an index.
     * However, its internal use for checking subscription status is replaced
     * by a faster O(1) Map.has() check in fn_subscribe.
     * @param {string} p_event - The name of the event.
     * @param {object} p_listner - The listener object.
     * @returns {number} The index of the listener, or -1 if not found.
     */
    fn_getIndex(p_event, p_listner) {
        const subscribers = this.m_v_events.get(p_event);
        if (!subscribers) {
            return -1;
        }

        // Use Array.from to convert keys to an array and find index
        // More concise than manual iteration, though still O(n)
        return Array.from(subscribers.keys()).indexOf(p_listner);
    }

    /**
     * Subscribes a listener to an event.
     * @param {string} p_event - The name of the event to subscribe to.
     * @param {object} p_listner - The listener object.
     * @param {Function} callback - The callback function to execute when the event is dispatched.
     */
    fn_subscribe(p_event, p_listner, callback) {
        if (callback == null) {
            console.log("Cannot subscribe with a null callback."); // Or throw an error
            return;
        }

        if (!this.m_v_events.has(p_event)) {
            // *If this is the first subscriber for this event, create a new Map for it.
            this.m_v_events.set(p_event, new Map());
        }

        const subscribers = this.m_v_events.get(p_event); // This is a Map (listener -> callback)

        // Check if the listener is already subscribed using Map.has() (O(1) average time complexity).
        if (!subscribers.has(p_listner)) {
            subscribers.set(p_listner, callback); // Add the listener and callback (O(1) average)
        } else {
            // Optionally, notify that the listener is already subscribed, or update the callback.
            // console.warn(`Listener already subscribed to event "${p_event}".`);
        }
    }

    /**
     * Removes all listeners for a specific event.
     * @param {string} p_event - The name of the event to remove.
     */
    fn_removeEvent(p_event) {
        this.m_v_events.delete(p_event); // Efficiently removes the event and all its listeners.
    }

    /**
     * Unsubscribes a listener from an event.
     * @param {string} p_event - The name of the event.
     * @param {object} p_listner - The listener object to unsubscribe.
     */
    fn_unsubscribe(p_event, p_listner) {
        const subscribers = this.m_v_events.get(p_event);

        if (!subscribers) {
            return; // Event doesn't exist or has no listeners
        }

        // Remove the listener using Map.delete() (O(1) average time complexity).
        subscribers.delete(p_listner);

        // If this was the last listener for this event, remove the event entry itself to free memory.
        if (subscribers.size === 0) {
            this.m_v_events.delete(p_event);
        }
    }

    /**
     * Clears all events and subscribers.
     * Useful for cleanup to prevent memory leaks.
     */
    fn_clear() {
        this.m_v_events.clear(); // Removes all events and their subscribers
    }
}

export const js_eventEmitter = CEventEmitter.getInstance();