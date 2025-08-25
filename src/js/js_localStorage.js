/*jshint esversion: 6 */
import { js_globals } from './js_globals.js';
import * as js_common from './js_common.js'

class CLocalStorage {
    constructor() {
        if (this.isSupported()) {
            // Initialize global settings with saved values if they exist
            js_globals.v_useMetricSystem = this.fn_getMetricSystem();
            js_globals.CONST_DEFAULT_ALTITUDE = this.fn_getDefaultAltitude();
            js_globals.CONST_DEFAULT_RADIUS = this.fn_getDefaultRadius();
        }
    }

    static getInstance() {
        if (!CLocalStorage.instance) {
            CLocalStorage.instance = new CLocalStorage();
        }
        return CLocalStorage.instance;
    }

    isSupported() {
        return typeof Storage !== 'undefined';
    }

    // Generic method to get a value from local storage
    _getValue(key, defaultValue) {
        if (!this.isSupported()) return defaultValue;

        const value = localStorage.getItem(key);
        return value !== null && value !== undefined ? value : defaultValue;
    }

    // Generic method to set a value in local storage
    _setValue(key, value) {
        if (this.isSupported()) {
            localStorage.setItem(key, value);
        }
    }

    // Generic method to remove a value from local storage
    _removeValue(key) {
        if (this.isSupported()) {
            localStorage.removeItem(key);
        }
    }

    // Generic method to get a value from session storage
    _getSessionValue(key, defaultValue) {
        if (!this.isSupported()) return defaultValue;

        const value = sessionStorage.getItem(key);
        return value !== null && value !== undefined ? value : defaultValue;
    }

    // Generic method to set a value in session storage
    _setSessionValue(key, value) {
        if (this.isSupported()) {
            sessionStorage.setItem(key, value);
        }
    }


    // Language
    fn_setLanguage(value) {
        this._setValue('_vLang', value);
    }

    fn_getLanguage() {
        return this._getValue('_vLang', 'en');
    }

    // Email
    fn_setEmail(value) {
        this._setValue('_vEmail', value);
    }

    fn_getEmail() {
        return this._getValue('_vEmail', '');
    }

    // Access Code
    fn_setAccessCode(value) {
        this._setValue(js_globals.LS_ACCESS_CODE, value);
    }

    fn_getAccessCode() {
        return this._getValue(js_globals.LS_ACCESS_CODE, '');
    }

    // Unit ID
    fn_setUnitID(value) {
        this._setSessionValue(js_globals.LS_UNIT_ID, value);
    }

    fn_resetUnitID() {
        this.fn_setUnitID ('WEB_GCS_' + js_common.fn_generateRandomString(3));
    }
    fn_getUnitID() {
        return this._getSessionValue(js_globals.LS_UNIT_ID, 'WEB_GCS_' + js_common.fn_generateRandomString(3));
    }

    // Group Name
    fn_setGroupName(value) {
        this._setValue('_vGroupName', value);
    }

    fn_getGroupName() {
        return this._getValue('_vGroupName', '1');
    }

    // Display Mode
    fn_setDisplayMode(value) {
        this._setValue(js_globals.LS_DISPLAY_MODE, value);
    }

    fn_getDisplayMode() {
        return parseInt(this._getValue(js_globals.LS_DISPLAY_MODE, 0));
    }

    // Metric System
    fn_setMetricSystem(value) {
        this._setValue('_vv_useMetricSystem', value.toString());
    }

    fn_getMetricSystem() {
        return this._getValue('_vv_useMetricSystem', js_globals.v_useMetricSystem.toString()) === 'true';
    }

    fn_setGamePadConfig(config_index, value) {
        this._setValue(`${js_globals.LS_GAME_PAD_CONFIG_PREFIX}${config_index}`, value);
    }


    fn_getGamePadConfig(config_index) {
        const value = js_localStorage._getValue(`${js_globals.LS_GAME_PAD_CONFIG_PREFIX}${config_index}`, null);
        return value;
    }


    fn_setGamePadConfigIndex(value) {
        this._setValue(js_globals.LS_GAME_PAD_CONFIG_INDEX, value.toString());
    }

    fn_getGamePadConfigIndex() {
        return parseInt(this._getValue(js_globals.LS_GAME_PAD_CONFIG_INDEX, '0'));
    }

    fn_exportGamePadConfigs() {
        const configPrefix = js_globals.LS_GAME_PAD_CONFIG_PREFIX;
        const configs = {};
        
        // Iterate through localStorage to find all game pad configs
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(configPrefix)) {
                const configIndex = key.substring(configPrefix.length);
                configs[configIndex] = localStorage.getItem(key);
            }
        }
        
        // Create JSON string and trigger download
        const jsonString = JSON.stringify(configs, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gamepad_configs_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }


    // Default Altitude
    fn_setDefaultAltitude(value) {
        this._setValue(js_globals.LS_DEFAULT_ALT, value.toString());
    }

    fn_getDefaultAltitude() {
        return parseInt(this._getValue(js_globals.LS_DEFAULT_ALT, js_globals.CONST_DEFAULT_ALTITUDE.toString()));
    }

    // Default Radius
    fn_setDefaultRadius(value) {
        this._setValue('_vDefaultRadius', value.toString());
    }

    fn_getDefaultRadius() {
        return parseInt(this._getValue('_vDefaultRadius', js_globals.CONST_DEFAULT_RADIUS.toString()));
    }

    fn_setDefaultSwarmHorizontalDistance(value) {
        this._setValue('_vDefaultSHD', value.toString());
    }

    fn_getDefaultSwarmHorizontalDistance() {
        return parseInt(this._getValue('_vDefaultSHD', js_globals.CONST_DEFAULT_ALTITUDE.toString()));
    }

     fn_setDefaultSwarmVerticalDistance(value) {
        this._setValue('_vDefaultSVD', value.toString());
    }

    fn_getDefaultSwarmVerticalDistance() {
        return parseInt(this._getValue('_vDefaultSVD', js_globals.CONST_DEFAULT_RADIUS.toString()));
    }

    // Speech Enabled
    fn_setSpeechEnabled(value) {
        this._setValue(js_globals.LS_ENABLE_SPEECH, value.toString());
    }

    fn_getSpeechEnabled() {
        return this._getValue(js_globals.LS_ENABLE_SPEECH, 'true') === 'true';
    }

    // Volume
    fn_setVolume(value) {
        this._setValue(js_globals.LS_DEFAULT_VOLUME, value.toString());
    }

    fn_getVolume() {
        return parseInt(this._getValue(js_globals.LS_DEFAULT_VOLUME, js_globals.CONST_DEFAULT_VOLUME.toString()));
    }

    // Tabs Display Enabled
    fn_setTabsDisplayEnabled(value) {
        this._setValue(js_globals.LS_TAB_DISPLAY_ENABLED, value.toString());
    }

    fn_getTabsDisplayEnabled() {
        return this._getValue(js_globals.LS_TAB_DISPLAY_ENABLED, 'true') === 'true';
    }

    fn_setGCSShowMe(value) {
        this._setValue(js_globals.LS_SHOW_ME_GCS, value.toString());
    }

    fn_getGCSShowMe() {
        return this._getValue(js_globals.LS_SHOW_ME_GCS, 'true') === 'true';
    }

    // Unit Sort Enabled
    fn_setUnitSortEnabled(value) {
        this._setValue(js_globals.LS_UNIT_SORTED_ENABLED, value.toString());
    }

    fn_getUnitSortEnabled() {
        return this._getValue(js_globals.LS_UNIT_SORTED_ENABLED, 'true') === 'true';
    }

    // Advanced Options Enabled
    fn_setAdvancedOptionsEnabled(value) {
        this._setValue('_vAdvancedOptionsEnabled', value.toString());
    }

    fn_getAdvancedOptionsEnabled() {
        return this._getValue('_vAdvancedOptionsEnabled', 'true') === 'true';
    }

    // GCS Display Enabled
    fn_setGCSDisplayEnabled(value) {
        this._setValue('_vGCSDisplay', value.toString());
    }

    fn_getGCSDisplayEnabled() {
        return this._getValue('_vGCSDisplay', 'true') === 'true';
    }
}

export const js_localStorage = CLocalStorage.getInstance();