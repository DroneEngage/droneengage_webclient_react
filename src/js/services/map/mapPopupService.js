/*jshint esversion: 11 */
/**
 * mapPopupService — single source of truth for map popups rendered via
 * React portals.
 *
 * Replaces the old detached-root + `innerHTML` round-trip
 * that `js_main.js` used for the three map popups (context menu, mission
 * item, unit popup).  Instead of rendering a React component to a
 * detached div, serialising it to HTML, handing the string to Leaflet,
 * and then *also* binding the live div (a race guarded by
 * the old busy-flag guard), the service asks the active map adapter for an
 * empty popup, obtains the popup's content DOM node via
 * `fn_getPopupContentElement`, and notifies the `<MapPopupHost />`
 * component (mounted inside the i18n/theme provider tree) to portal the
 * real React component into that node.
 *
 * Because the component tree stays connected, context (i18n, theme),
 * event handlers, and interactive elements all work normally inside
 * popups — the three problems the old mechanism had.
 *
 * The service is a subscribable singleton (notifications go through
 * `js_eventEmitter` as `EE_MapPopupChanged`).  React components read it
 * via the `useMapPopup()` hook; `js_main.js` writes to it via
 * `fn_openPopup` / `fn_closePopup`.
 *
 * State shape:
 *   {
 *     kind:         'context-menu' | 'mission-item' | 'unit-popup',
 *     props:        object,   // passed straight through to the component
 *     containerEl:  HTMLElement | null,  // portal target
 *     ignoreMouseOut: boolean,  // true for click-opened popups (stay on mouseout)
 *   }
 *   or `null` when no popup is open.
 */

import { js_eventEmitter } from '../../events/js_eventEmitter.js';
import { EVENTS as js_event } from '../../events/js_eventList.js';
import { js_layout } from '../../state/layoutStore.js';
import { js_leafletmap } from '../../maps/js_leafletmap.js';
import { js_map3d } from '../../maps/js_map3d.js';

export const EE_MAP_POPUP_CHANGED = js_event.EE_MapPopupChanged;

let m_state = null;
let m_infoWindow = null;  // the Leaflet/Mapbox popup object (for hide)


function fn_getAdapter() {
	return (js_layout.fn_getMapMode() === '3d') ? js_map3d : js_leafletmap;
}

function fn_setState(p_state) {
	m_state = p_state;
	js_eventEmitter.fn_dispatch(EE_MAP_POPUP_CHANGED, m_state);
}

/**
 * Opens a map popup of the given kind, portaling React into the popup's
 * content node.  Closes any popup that is already open first.
 *
 * @param {string} p_kind   - 'context-menu' | 'mission-item' | 'unit-popup'
 * @param {object} p_props  - props passed to the popup component
 * @param {number} p_lat
 * @param {number} p_lng
 * @param {object} [p_opts] - { ignoreMouseOut: boolean }
 */
export function fn_openPopup(p_kind, p_props, p_lat, p_lng, p_opts) {
	// Close any existing popup first — replaces the old busy-flag guard.
	fn_closePopup();

	const adapter = fn_getAdapter();
	if (adapter == null || (adapter.m_Map == null && adapter.m_map == null)) return;

	// Ask the adapter for an empty popup at the given coordinates.
	// Passing '' as content creates the popup shell; the real content
	// is rendered by <MapPopupHost> via createPortal into the node
	// returned by fn_getPopupContentElement.
	m_infoWindow = adapter.fn_showInfoWindow(null, '', p_lat, p_lng);
	if (m_infoWindow == null) return;

	const containerEl = adapter.fn_getPopupContentElement(m_infoWindow);
	if (containerEl == null) {
		// Could not resolve the content node — clean up and bail.
		adapter.fn_hideInfoWindow(m_infoWindow);
		m_infoWindow = null;
		return;
	}

	// When the popup is closed by the map itself (X button, click
	// outside, etc.), clear the service state so the portal unmounts.
	const onClose = function () {
		if (m_infoWindow != null) {
			m_infoWindow = null;
			fn_setState(null);
		}
	};
	// Leaflet fires 'remove'; Mapbox fires 'close'.  The Mapbox adapter
	// normalises 'remove' -> 'close' (see js_map3d.fn_showInfoWindow),
	// so listening on 'remove' works for both.
	if (typeof m_infoWindow.on === 'function') {
		m_infoWindow.on('remove', onClose);
	}

	const ignoreMouseOut = !!(p_opts && p_opts.ignoreMouseOut);

	fn_setState({
		kind: p_kind,
		props: p_props,
		containerEl: containerEl,
		ignoreMouseOut: ignoreMouseOut,
	});
}

/**
 * Closes the current popup (if any) and clears the service state.
 */
export function fn_closePopup() {
	if (m_infoWindow != null) {
		const adapter = fn_getAdapter();
		adapter.fn_hideInfoWindow(m_infoWindow);
		m_infoWindow = null;
	}
	if (m_state != null) {
		fn_setState(null);
	}
}

/**
 * Closes the current popup only if it is not pinned (i.e. was opened
 * from a click, not a hover).  Mirrors the old
 * `m_ignoreMouseOut !== true` check in the mouse-out handler.
 */
export function fn_closeIfNotPinned() {
	if (m_state == null) return;
	if (m_state.ignoreMouseOut === true) return;
	fn_closePopup();
}

/**
 * @returns {boolean} true if a popup is currently open.
 */
export function fn_isOpen() {
	return m_state != null;
}

/**
 * @returns {boolean} true if the current popup should ignore mouse-out
 *   (opened from a click).  Returns false when no popup is open.
 */
export function fn_isIgnoreMouseOut() {
	return m_state != null && m_state.ignoreMouseOut === true;
}

/**
 * @returns the current state (or null).  Used by the useMapPopup hook.
 */
export function fn_getState() {
	return m_state;
}

/**
 * Repositions the currently-open popup and merges new props into it,
 * without closing/reopening (avoids remounting the portaled React
 * component). Used when a map feature backing the popup — e.g. the
 * draggable 3D target marker — moves after the popup was opened.
 * No-op if no popup is open.
 *
 * @param {number} p_lat
 * @param {number} p_lng
 * @param {object} [p_extraProps] - props to shallow-merge into the
 *   current state's `props` (e.g. { p_lat, p_lng } so the context-menu
 *   component re-renders with the dragged coordinates).
 */
export function fn_updatePopupPosition(p_lat, p_lng, p_extraProps) {
	if (m_state == null || m_infoWindow == null) return;
	const adapter = fn_getAdapter();
	adapter.fn_bindPopup(m_infoWindow, null, p_lat, p_lng);
	fn_setState({
		...m_state,
		props: { ...m_state.props, ...(p_extraProps || {}) },
	});
}

export const mapPopupService = {
	fn_openPopup,
	fn_closePopup,
	fn_closeIfNotPinned,
	fn_isOpen,
	fn_isIgnoreMouseOut,
	fn_getState,
	fn_updatePopupPosition,
};
