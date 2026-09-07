import { useEffect, useState } from 'react';
import { EE_MAP_POPUP_CHANGED, fn_getState } from '../services/map/mapPopupService.js';
import { useEventSubscription } from './useEventSubscription.js';

/**
 * Subscribes a React component to the map popup service. Returns the
 * current popup state (or null) and re-renders whenever the service
 * changes (via `EE_MapPopupChanged`). This is the React-side counterpart
 * of `mapPopupService`; `<MapPopupHost />` uses it to decide what to
 * portal into the active popup's content node.
 *
 * @returns {ReturnType<fn_getState>} the current popup state or null.
 */
export function useMapPopup() {
	const [state, setState] = useState(() => fn_getState());

	useEventSubscription(EE_MAP_POPUP_CHANGED, (p_state) => {
		setState(p_state);
	});

	// Keep state in sync if the service changed before this component
	// mounted (the event would have been missed).
	useEffect(() => {
		setState(fn_getState());
	}, []);

	return state;
}
