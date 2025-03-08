/*jshint esversion: 6 */
import { js_globals } from './js_globals.js';

class CLocalStorage {
    constructor() {
        if (this.isSupported()) {
            // Initialize global settings with saved values if they exist
            js_globals.v_useMetricSystem = this.fn_getMetricSystem();
            js_globals.v_gamePadMode = this.fn_getGamePadMode();
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
        this._setValue('_vAccessCode', value);
    }

    fn_getAccessCode() {
        return this._getValue('_vAccessCode', '');
    }

    // Unit ID
    fn_setUnitID(value) {
        this._setValue('_vUnitID', value);
    }

    fn_getUnitID() {
        return this._getValue('_vUnitID', 'WebGCS1');
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
        this._setValue('_vDisplayMode', value);
    }

    fn_getDisplayMode() {
        return parseInt(this._getValue('_vDisplayMode', 0));
    }

    // Metric System
    fn_setMetricSystem(value) {
        this._setValue('_vv_useMetricSystem', value.toString());
    }

    fn_getMetricSystem() {
        return this._getValue('_vv_useMetricSystem', js_globals.v_useMetricSystem.toString()) === 'true';
    }

    // Game Pad Mode
    fn_setGamePadMode(value) {
        this._setValue('_vv_gamePadMode', value.toString());
    }

    fn_getGamePadMode() {
        return parseInt(this._getValue('_vv_gamePadMode', '2'));
    }

    // Default Altitude
    fn_setDefaultAltitude(value) {
        this._setValue('_vDefaultAltitude', value.toString());
    }

    fn_getDefaultAltitude() {
        return parseInt(this._getValue('_vDefaultAltitude', js_globals.CONST_DEFAULT_ALTITUDE.toString()));
    }

    // Default Radius
    fn_setDefaultRadius(value) {
        this._setValue('_vDefaultRadius', value.toString());
    }

    fn_getDefaultRadius() {
        return parseInt(this._getValue('_vDefaultRadius', js_globals.CONST_DEFAULT_RADIUS.toString()));
    }

    // Speech Enabled
    fn_setSpeechEnabled(value) {
        this._setValue('_vv_speechEnabled', value.toString());
    }

    fn_getSpeechEnabled() {
        return this._getValue('_vv_speechEnabled', 'true') === 'true';
    }

    // Volume
    fn_setVolume(value) {
        this._setValue('_vDefaultVolume', value.toString());
    }

    fn_getVolume() {
        return parseInt(this._getValue('_vDefaultVolume', js_globals.CONST_DEFAULT_VOLUME.toString()));
    }

    // Tabs Display Enabled
    fn_setTabsDisplayEnabled(value) {
        this._setValue('_vTabsDisplayEnabled', value.toString());
    }

    fn_getTabsDisplayEnabled() {
        return this._getValue('_vTabsDisplayEnabled', 'true') === 'true';
    }

    fn_setGCSShowMe(value)
    {
        this._setValue('_vGCSShowMe', value.toString());
    }

    fn_getGCSShowMe()
    {
        return this._getValue('_vGCSShowMe', 'true') === 'true';
    }

    // Unit Sort Enabled
    fn_setUnitSortEnabled(value) {
        this._setValue('_vUnitSortEnabled', value.toString());
    }

    fn_getUnitSortEnabled() {
        return this._getValue('_vUnitSortEnabled', 'true') === 'true';
    }

    // Google Map Key
    fn_setGoogleMapKey(value) {
        this._setValue('_vGoogleMapKey', value);
    }

    fn_getGoogleMapKey() {
        return this._getValue('_vGoogleMapKey', '');
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