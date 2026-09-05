/*jshint esversion: 6 */

class CEventEmitter {
    constructor() {
        // m_v_events will store event names as keys,
        // and Maps of (listener -> callback) as values.
        // Map<string, Map<object, Function>>
        this.m_v_events = new Map();

        // Events marked as batched via fn_setBatched. Dispatches for these
        // are coalesced to at most once per animation frame so a burst of
        // telemetry packets for several units in the same tick produces a
        // single dispatch+render cycle instead of N synchronous ones.
        // Set<string>
        this.m_batchedEventNames = new Set();

        // Pending batched payloads keyed by event name. Each value is a
        // Map<unitKey, payload> so multiple units emitting the same event
        // in one frame each keep their latest payload (no unit is dropped).
        // Map<string, Map<string, *>>. Flushed on the next animation frame.
        this.m_pendingBatch = new Map();

        // True while a requestAnimationFrame flush is scheduled. Prevents
        // scheduling more than one rAF per frame regardless of how many
        // batched events fire in that frame.
        this.m_rafScheduled = false;
    }

    static getInstance() {
        if (!CEventEmitter.instance) {
            CEventEmitter.instance = new CEventEmitter();
        }
        return CEventEmitter.instance;
    }

    /**
     * Marks an event as batched: dispatches for this event are coalesced
     * to at most once per animation frame. Call once at module init time
     * (see js_eventEmitterConfig.js), not per-component. Events not marked
     * batched keep the current synchronous/immediate dispatch behavior.
     * @param {string} p_event - The name of the event to mark as batched.
     */
    fn_setBatched(p_event) {
        this.m_batchedEventNames.add(p_event);
    }

    /**
     * Dispatches an event to all subscribed listeners.
     *
     * Batched events (see fn_setBatched) are enqueued and flushed on the
     * next animation frame, coalesced per-unit so multiple units emitting
     * the same event in one tick each survive. All other events dispatch
     * synchronously exactly as before. The public signature is unchanged.
     * @param {string} p_event - The name of the event to dispatch.
     * @param {*} p_data - The data to pass to the event listeners.
     */
    fn_dispatch(p_event, p_data) {
        if (this.m_batchedEventNames.has(p_event)) {
            this._fn_enqueueBatched(p_event, p_data);
            return;
        }
        this._fn_dispatchNow(p_event, p_data);
    }

    /**
     * Synchronous fan-out to every subscriber of an event. Used for both
     * immediate events and the final flush of a batched frame, so the
     * per-listener try/catch isolation behavior is identical for both.
     * @param {string} p_event - The name of the event to dispatch.
     * @param {*} p_data - The data to pass to the event listeners.
     */
    _fn_dispatchNow(p_event, p_data) {
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
     * Extracts a stable per-unit key from a batched event payload so that
     * multiple units emitting the same event in one animation frame each
     * keep their latest payload instead of one overwriting the other.
     *
     * Observed payload shapes (verified across js_main.js /
     * js_andruav_parser.js / js_webrtcthin2.js / js_andruav_gamepad.js):
     *   - a unit object with getPartyID()           -> partyID
     *   - a plain { unit, fps, rx, track_id } stats -> per-track key
     *   - a plain object with a partyID field        -> partyID
     *   - no payload (e.g. EE_GamePad_Axes_Updated)  -> '__default__'
     * @param {*} p_data - The payload passed to fn_dispatch.
     * @returns {string} A stable key identifying the emitting unit/track.
     */
    _fn_extractUnitKey(p_data) {
        if (p_data == null) {
            return '__default__';
        }
        if (typeof p_data.getPartyID === 'function') {
            return p_data.getPartyID();
        }
        if (typeof p_data === 'object') {
            // WebRTC video statistics: { unit, fps, rx, track_id }. A single
            // unit can have several video tracks, so key by track_id to keep
            // each track's latest stats in the same frame.
            if (p_data.track_id != null) {
                return `track:${p_data.track_id}`;
            }
            if (p_data.unit && typeof p_data.unit.getPartyID === 'function') {
                return p_data.unit.getPartyID();
            }
            if (p_data.partyID != null) {
                return String(p_data.partyID);
            }
        }
        return '__default__';
    }

    /**
     * Enqueues a batched event payload for flush on the next animation
     * frame. Per-unit coalescing: only the latest payload per
     * (event, unit) survives within a single frame, which is the desired
     * behavior for telemetry — stale intermediate values are dropped.
     * @param {string} p_event - The name of the event to enqueue.
     * @param {*} p_data - The payload to coalesce.
     */
    _fn_enqueueBatched(p_event, p_data) {
        const unitKey = this._fn_extractUnitKey(p_data);
        let byUnit = this.m_pendingBatch.get(p_event);
        if (!byUnit) {
            byUnit = new Map();
            this.m_pendingBatch.set(p_event, byUnit);
        }
        byUnit.set(unitKey, p_data);

        if (!this.m_rafScheduled) {
            this.m_rafScheduled = true;
            requestAnimationFrame(() => {
                this.m_rafScheduled = false;
                const toFlush = this.m_pendingBatch;
                this.m_pendingBatch = new Map();
                for (const [evt, byUnit2] of toFlush.entries()) {
                    for (const data of byUnit2.values()) {
                        this._fn_dispatchNow(evt, data);
                    }
                }
            });
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

        // Dev-mode leak guard: warn when an event accumulates an unusually
        // high number of listeners. This usually means a component is
        // subscribing without unsubscribing on unmount (missing
        // componentWillUnmount or misuse of useEventSubscription). Kept
        // dev-only so the console.warn string building never ships to
        // production bundles. O(1) per subscribe.
        if (process.env.NODE_ENV !== 'production') {
            const WARN_THRESHOLD = 30; // tune after checking real listener counts per event in a live session
            if (subscribers.size === WARN_THRESHOLD) {
                console.warn(
                    `[js_eventEmitter] event "${p_event}" has ${WARN_THRESHOLD}+ listeners. ` +
                    `This usually means a component is subscribing without unsubscribing on unmount ` +
                    `(check componentWillUnmount / useEventSubscription usage).`
                );
            }
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
        // Drop any pending batched payloads so a post-clear rAF flush does
        // not resurrect stale telemetry into listeners that re-subscribe.
        this.m_pendingBatch = new Map();
        this.m_rafScheduled = false;
    }
}

export const js_eventEmitter = CEventEmitter.getInstance();