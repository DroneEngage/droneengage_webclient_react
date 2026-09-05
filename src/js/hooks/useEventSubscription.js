import { useEffect, useRef } from 'react';
import { js_eventEmitter } from '../events/js_eventEmitter.js';

/**
 * Subscribes `callback` to `eventName` for the lifetime of the calling
 * component. Unsubscribes automatically on unmount or when `eventName`
 * changes. `callback` is always invoked with the latest closure (via a
 * ref) so callers do not need to memoize it themselves.
 *
 * This hook replaces the manual
 *   constructor: fn_subscribe / componentWillUnmount: fn_unsubscribe
 * pairing that was easy to get wrong and caused listener leaks.
 *
 * @param {string} eventName - one of js_eventList.js EVENTS values
 * @param {(payload: any) => void} callback - receives the event payload
 *   (the second arg of the legacy `(listener, data)` callback). The
 *   listener object is not exposed to callers.
 * @param {object} [listenerKey] - stable identity object to pass to
 *   fn_subscribe/fn_unsubscribe. Defaults to a per-hook-instance object,
 *   which is fine unless legacy code needs to unsubscribe this exact
 *   listener from outside the hook (it shouldn't).
 */
export function useEventSubscription(eventName, callback, listenerKey) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const keyRef = useRef(listenerKey || {});

    useEffect(() => {
        const key = listenerKey || keyRef.current;
        const trampoline = (_listener, data) => callbackRef.current(data);
        js_eventEmitter.fn_subscribe(eventName, key, trampoline);
        return () => js_eventEmitter.fn_unsubscribe(eventName, key);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventName, listenerKey]);
}
