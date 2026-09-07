/*jshint esversion: 11 */
/**
 * layoutStore — single source of truth for the GCS layout.
 *
 * Previously the layout (which rows are visible, their Bootstrap column
 * widths, which of the 2D/3D/video panes is shown, and which toolbar
 * buttons are visible) was expressed as jQuery `.show()`/`.hide()` calls
 * against DOM that React owns, and "which map is active" was read back
 * out of the DOM by checking whether the 3D map pane was displayed. That meant a
 * React re-render of a layout subtree silently reverted the layout, and
 * the active-map answer depended on CSS / execution order.
 *
 * This store replaces that. It is a subscribable singleton (notifications
 * go through `js_eventEmitter` as `EE_LayoutChanged`). React components
 * read it via the `useLayout()` hook; the legacy `fn_activate*` /
 * `fn_showMap` / `fn_showMap3D` / `fn_showVideoMainTab` action functions
 * write to it. No UI state is read back out of the DOM.
 *
 * The state shape intentionally mirrors the exact DOM visibility the old
 * jQuery produced, so the visual result is pixel-identical:
 *
 *   {
 *     displayMode: number,            // raw persisted value (localStorage)
 *     smallMode:   boolean,           // small-screen 4-mode cycle vs desktop 6-mode
 *     showMap2d:   boolean,           // #div_map_view visible
 *     showMap3d:   boolean,           // #div_map3d_view shown
 *     showVideo:   boolean,           // #div_video_control visible
 *     btn:         { settings, map, map3d, video }, // toolbar button visibility
 *     activeTab:   string,
 *   }
 *
 * `displayMode` is the raw persisted integer (the same value
 * `js_localStorage.fn_getDisplayMode()` returned). The *effective* mode
 * index is `displayMode % (smallMode ? 4 : 6)` — exactly matching the old
 * `fn_applyControl` switch arithmetic.
 */

import { js_eventEmitter } from '../events/js_eventEmitter.js';
import * as js_session from './session.js';
import { EVENTS as js_event } from '../events/js_eventList.js';
import { js_localStorage } from '../js_localStorage.js';

export const EE_LAYOUT_CHANGED = js_event.EE_LayoutChanged;

const DESKTOP_MODE_COUNT = 6;
const SMALL_MODE_COUNT = 4;

const COL_8_4 = 'col-lg-8 col-xl-8 col-xxl-8 col-12';
const COL_4 = 'col-lg-4 col-xl-4 col-xxl-4 col-12';
const COL_12 = 'col-12';

/**
 * Per-mode layout profile. This is a direct transcription of what the seven
 * `fn_activate*` functions did with jQuery — same visibility, same column
 * classes, same button visibility, same scroll behaviour. `mapSection` is
 * whether the map area is shown at all (drives #div_map_view / #div_map3d_view);
 * `fn_activate*` always reset the 3D map to hidden and left #div_video_control
 * untouched, so those two are handled by the caller, not here.
 *
 * @typedef {Object} LayoutProfile
 * @property {{visible:boolean,col:string}} row1
 * @property {{visible:boolean,col:string}} row2
 * @property {boolean} mapSection
 * @property {boolean} fixed
 * @property {boolean} float
 * @property {boolean} scroll
 * @property {{settings:boolean,map:boolean,map3d:boolean,video:boolean}} btn
 */
const PROFILES = {
	classical: {
		row1: { visible: true, col: COL_8_4 },
		row2: { visible: true, col: COL_4 },
		mapSection: true,
		fixed: false,
		float: false,
		scroll: true,
		btn: { settings: true, map: true, map3d: true, video: true },
	},
	mapCamera: {
		row1: { visible: true, col: COL_12 },
		row2: { visible: false, col: '' },
		mapSection: true,
		fixed: false,
		float: false,
		scroll: false,
		btn: { settings: false, map: false, map3d: true, video: true },
	},
	mapCameraFloat: {
		row1: { visible: true, col: COL_12 },
		row2: { visible: false, col: '' },
		mapSection: true,
		fixed: false,
		float: true,
		scroll: false,
		btn: { settings: false, map: false, map3d: true, video: true },
	},
	fixedList: {
		row1: { visible: true, col: COL_12 },
		row2: { visible: false, col: '' },
		mapSection: false,
		fixed: true,
		float: false,
		scroll: false,
		btn: { settings: false, map: false, map3d: false, video: false },
	},
	vehicleCard: {
		row1: { visible: false, col: '' },
		row2: { visible: true, col: COL_12 },
		mapSection: false,
		fixed: false,
		float: false,
		scroll: false,
		btn: { settings: true, map: false, map3d: false, video: false },
	},
	allViews: {
		row1: { visible: true, col: COL_8_4 },
		row2: { visible: true, col: COL_4 },
		mapSection: true,
		fixed: false,
		float: true,
		scroll: true,
		btn: { settings: true, map: true, map3d: true, video: true },
	},
};

/**
 * Maps an effective mode index (0-based, after the `% 4` / `% 6` arithmetic)
 * to its profile name. Desktop cycles 6 modes (classical, mapCamera,
 * mapCameraFloat, fixedList, vehicleCard, allViews); small cycles 4
 * (classical, mapCamera, fixedList, vehicleCard) — i.e. no float / allViews.
 */
function fn_profileName(p_effectiveMode, p_smallMode) {
	if (p_smallMode === true) {
		switch (p_effectiveMode) {
			case 0: return 'classical';
			case 1: return 'mapCamera';
			case 2: return 'fixedList';
			case 3: return 'vehicleCard';
			default: return 'classical';
		}
	}
	switch (p_effectiveMode) {
		case 0: return 'classical';
		case 1: return 'mapCamera';
		case 2: return 'mapCameraFloat';
		case 3: return 'fixedList';
		case 4: return 'vehicleCard';
		case 5: return 'allViews';
		default: return 'classical';
	}
}

class CLayoutStore {
	constructor() {
		const v_display_mode = this._fn_readPersistedDisplayMode();
		this.m_state = {
			displayMode: v_display_mode,
			smallMode: false,
			showMap2d: true,
			showMap3d: false,
			showVideo: true,
			btn: { settings: true, map: true, map3d: true, video: true },
			activeTab: js_session.fn_getCurrentTabStatus() || 'unknown',
		};
	}

	_fn_readPersistedDisplayMode() {
		const v = js_localStorage.fn_getDisplayMode();
		const n = parseInt(v);
		return isNaN(n) ? 0 : n;
	}

	_fn_effectiveMode() {
		const count = this.m_state.smallMode ? SMALL_MODE_COUNT : DESKTOP_MODE_COUNT;
		const m = this.m_state.displayMode % count;
		return m < 0 ? m + count : m;
	}

	_fn_profile() {
		return PROFILES[fn_profileName(this._fn_effectiveMode(), this.m_state.smallMode)];
	}

	/** Returns a shallow copy of the full state. */
	fn_getState() {
		return {
			displayMode: this.m_state.displayMode,
			smallMode: this.m_state.smallMode,
			showMap2d: this.m_state.showMap2d,
			showMap3d: this.m_state.showMap3d,
			showVideo: this.m_state.showVideo,
			btn: { ...this.m_state.btn },
			activeTab: this.m_state.activeTab,
		};
	}

	fn_getDisplayMode() { return this.m_state.displayMode; }
	fn_getSmallMode() { return this.m_state.smallMode; }
	fn_getActiveTab() { return this.m_state.activeTab; }

	/** '3d' iff the 3D map pane is visible, else '2d'. Replaces the DOM visibility query. */
	fn_getMapMode() { return this.m_state.showMap3d === true ? '3d' : '2d'; }

	/** The resolved layout profile for the current mode (read-only). */
	fn_getProfile() { return this._fn_profile(); }

	/**
	 * Replaces the seven `fn_activate*` functions. Sets the display mode
	 * (raw persisted integer) and small-screen flag, then applies the
	 * corresponding layout profile: row visibility/columns, fixed/float
	 * list visibility, toolbar buttons, and resets the 2D map pane to
	 * visible / 3D map pane to hidden — exactly as every `fn_activate*`
	 * did. `#div_video_control` is intentionally left untouched (the old
	 * functions never touched it either). Persists the mode so reloads
	 * keep the preference.
	 */
	fn_setDisplayMode(p_rawMode, p_smallMode) {
		if (p_rawMode != null && !isNaN(parseInt(p_rawMode))) {
			this.m_state.displayMode = parseInt(p_rawMode);
		}
		if (p_smallMode != null) {
			this.m_state.smallMode = (p_smallMode === true);
		}
		const profile = this._fn_profile();
		this.m_state.showMap2d = profile.mapSection;
		this.m_state.showMap3d = false;
		// showVideo is deliberately preserved — fn_activate* never hid it.
		this.m_state.btn = { ...profile.btn };
		js_localStorage.fn_setDisplayMode(this.m_state.displayMode);
		this._fn_emit();
	}

	fn_setSmallMode(p_small) {
		this.m_state.smallMode = (p_small === true);
		this._fn_emit();
	}

	fn_setActiveTab(p_tab) {
		this.m_state.activeTab = p_tab;
		this._fn_emit();
	}

	/** Show the 2D map pane (replaces `fn_showMap`'s DOM writes). */
	fn_showMap() {
		this.m_state.showMap2d = true;
		this.m_state.showMap3d = false;
		this.m_state.showVideo = false;
		this.m_state.btn = {
			...this.m_state.btn,
			map: false,
			map3d: true,
			video: true,
		};
		this._fn_emit();
	}

	/** Show the 3D map pane (replaces `fn_showMap3D`'s DOM writes). */
	fn_showMap3D() {
		this.m_state.showMap2d = false;
		this.m_state.showMap3d = true;
		this.m_state.showVideo = false;
		this.m_state.btn = {
			...this.m_state.btn,
			map: true,
			map3d: false,
			video: true,
		};
		this._fn_emit();
	}

	/** Show the video pane (replaces `fn_showVideoMainTab`'s DOM writes). */
	fn_showVideo() {
		this.m_state.showMap2d = false;
		this.m_state.showMap3d = false;
		this.m_state.showVideo = true;
		this.m_state.btn = {
			...this.m_state.btn,
			map: true,
			map3d: true,
			video: false,
		};
		this._fn_emit();
	}

	_fn_emit() {
		js_eventEmitter.fn_dispatch(EE_LAYOUT_CHANGED, this.fn_getState());
	}
}

export const js_layout = new CLayoutStore();
