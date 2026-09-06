import { useEffect, useState } from 'react';
import { js_layout, EE_LAYOUT_CHANGED } from '../state/layoutStore.js';
import { useEventSubscription } from './useEventSubscription.js';

/**
 * Subscribes a React component to the layout store. Returns the current
 * layout state and re-renders the component whenever the store changes
 * (via the `EE_LayoutChanged` event). This is the React-side counterpart
 * of `js_layout`; layout is no longer read back out of the DOM.
 *
 * @returns {ReturnType<js_layout.fn_getState>} the current layout state.
 */
export function useLayout() {
	const [state, setState] = useState(() => js_layout.fn_getState());

	useEventSubscription(EE_LAYOUT_CHANGED, (p_state) => {
		setState(p_state);
	});

	// Keep state in sync if the store changed before this component mounted
	// (the event would have been missed).
	useEffect(() => {
		setState(js_layout.fn_getState());
	}, []);

	return state;
}
