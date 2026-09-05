import React from 'react';
import { useEventSubscription } from './useEventSubscription.js';

/**
 * Tiny function-component sibling that owns an event subscription for the
 * lifetime of its mount. Rendered (as null) inside a class component's
 * render() to replace the manual constructor fn_subscribe /
 * componentWillUnmount fn_unsubscribe pairing — making a leak
 * structurally impossible without a full class→function rewrite.
 *
 * `onEvent` receives only the event payload (the legacy `(listener, data)`
 * first arg is dropped). Callers do not need to memoize `onEvent`; the
 * underlying hook keeps a ref to the latest callback and only
 * re-subscribes when `eventName` changes.
 *
 * @param {string} eventName - one of js_eventList.js EVENTS values
 * @param {(payload: any) => void} onEvent
 */
export function EventBridge({ eventName, onEvent }) {
    useEventSubscription(eventName, onEvent);
    return null;
}

export default EventBridge;
