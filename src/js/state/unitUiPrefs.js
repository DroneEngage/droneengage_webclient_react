/*jshint esversion: 11 */
/**
 * unitUiPrefs — per-unit UI preferences.
 *
 * NOT domain data, NOT map objects. These are UI toggles/defaults that
 * React components and js_main dialogs read and write. Previously these
 * lived as ad-hoc fields on CAndruavUnitObject.m_gui (C_GUIHelper).
 *
 * Defaults come from js_globals.CONST_DEFAULT_RADIUS /
 * CONST_DEFAULT_ALTITUDE. Note: despite the CONST_ prefix, those two
 * js_globals fields are written at runtime by several call sites — they
 * are preferences, not constants. Do not try to freeze them here.
 */
import { js_globals } from '../js_globals.js';

/**
 * @typedef {Object} UnitUiPrefs
 * @property {boolean} speed_link          - UI toggle (8 sites)
 * @property {number} defaultCircleRadius  - UI default radius
 * @property {number} defaultHeight        - UI default altitude (note: existing typo kept)
 */

class CUnitUiPrefs {
    constructor() {
        /** @type {Object<string, UnitUiPrefs>} keyed by partyID */
        this.m_prefs = {};
    }

    /**
     * Get the UI preferences for a unit, creating defaults if none exist.
     * @param {string} p_partyID
     * @returns {UnitUiPrefs}
     */
    fn_getUnitPrefs(p_partyID) {
        let prefs = this.m_prefs[p_partyID];
        if (prefs === undefined || prefs === null) {
            prefs = {
                speed_link: false,
                defaultCircleRadius: js_globals.CONST_DEFAULT_RADIUS,
                defaultHeight: js_globals.CONST_DEFAULT_ALTITUDE,
            };
            this.m_prefs[p_partyID] = prefs;
        }
        return prefs;
    }

    /**
     * Set a single UI preference for a unit.
     * @param {string} p_partyID
     * @param {string} p_key   - 'speed_link' | 'defaultCircleRadius' | 'defaultHeight'
     * @param {*} p_value
     */
    fn_setUnitPref(p_partyID, p_key, p_value) {
        const prefs = this.fn_getUnitPrefs(p_partyID);
        prefs[p_key] = p_value;
    }
}

export const js_unitUiPrefs = new CUnitUiPrefs();
