/*jshint esversion: 6 */
import * as js_globals from './js_globals'


class CLocalStorage {

    constructor() {
        if (this.isSupported()) { // reset defaults with saved values if exist
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
        return(typeof(Storage) !== "undefined")
    }

    getDefaultAttribute(name, defaultValue) {
        if (!this.isSupported()) 
            return defaultValue;
        

        if (localStorage[name] != null) {
            return localStorage[name];
        } else {
            return defaultValue;
        }
    }


    fn_setLanguage = function (value) {
        localStorage._vLang = value;
    }

    fn_getLanguage = function () {
        return this.getDefaultAttribute('_vLang', "en");
    }


    fn_setEmail = function (value) {
        localStorage._vEmail = value;
    }

    fn_getEmail = function () {
        return this.getDefaultAttribute('_vEmail', "");
    }

    fn_setAccessCode = function (value) {
        localStorage._vAccessCode = value;
    }

    fn_getAccessCode = function () {
        return this.getDefaultAttribute('_vAccessCode', "");
    }


    fn_setUnitID = function (bool) {
        localStorage._vUnitID = bool;
    }

    fn_getUnitID = function () {
        return this.getDefaultAttribute('_vUnitID', "WebGCS1");
    }

    fn_setGroupName = function (value) {
        localStorage._vGroupName = value;
    }

    fn_getGroupName = function () {
        return this.getDefaultAttribute('_vGroupName', "1");
    }

    fn_setDisplayMode = function (value) {
        localStorage._vDisplayMode = value;
    }

    fn_getDisplayMode = function () {
        return this.getDefaultAttribute('_vDisplayMode', 0);
    }


    fn_setMetricSystem = function (p_bool) {
        localStorage._vv_useMetricSystem = p_bool;
    }

    fn_getMetricSystem = function () {
        return(this.getDefaultAttribute('_vv_useMetricSystem', js_globals.v_useMetricSystem) == 'true');
    }

    fn_getGamePadMode = function () {
        return parseInt(this.getDefaultAttribute('_vv_gamePadMode', 2));
    }

    fn_setGamePadMode = function (p_mode) {
        localStorage._vv_gamePadMode = p_mode;
    }

    fn_setDefaultAltitude = function (value) {
        if (!this.isSupported) {
            js_globals.CONST_DEFAULT_ALTITUDE = value;
        }
        localStorage._vDefaultAltitude = value;
    }

    fn_getDefaultAltitude = function (value) {
        return parseInt(this.getDefaultAttribute('_vDefaultAltitude', js_globals.CONST_DEFAULT_ALTITUDE));
    }

    fn_setDefaultRadius = function (value) {
        localStorage._vDefaultRadius = value;
    }

    fn_getDefaultRadius = function (value) {
        return parseInt(this.getDefaultAttribute('_vDefaultRadius', js_globals.CONST_DEFAULT_RADIUS));
    }


    fn_setSpeechEnabled = function (p_enabled) {
        localStorage._vv_speechEnabled = p_enabled;
    }

    fn_getSpeechEnabled = function () {
        return  this.getDefaultAttribute('_vv_speechEnabled', 'true') === 'true';
    }

    fn_setVolume = function (value) {
        localStorage._vDefaultVolume = value;
    }

    fn_getVolume = function () {
        return parseInt(this.getDefaultAttribute('_vDefaultVolume', js_globals.CONST_DEFAULT_VOLUME));
    }

    fn_setTabsDisplayEnabled = function (value) {
        localStorage._vTabsDisplayEnabled = value;
    }

    fn_getTabsDisplayEnabled = function () {
        return this.getDefaultAttribute('_vTabsDisplayEnabled', 'true') === 'true';
    }

    fn_setUnitSortEnabled = function (value) {
        localStorage._vUnitSortEnabled = value;
    }

    fn_getUnitSortEnabled = function (value) {
        return this.getDefaultAttribute('_vUnitSortEnabled', 'true') === 'true';
    }
    
    
    fn_setGoogleMapKey = function (value) {
        localStorage._vGoogleMapKey = value;
    }

    fn_getGoogleMapKey = function () {
        return this.getDefaultAttribute('_vGoogleMapKey', '');
    }
    
    fn_setAdvancedOptionsEnabled = function (value) {
        localStorage._vAdvancedOptionsEnabled = value;
    }

    fn_getAdvancedOptionsEnabled = function () {
        return this.getDefaultAttribute('_vAdvancedOptionsEnabled', true) === 'true';
    }

    fn_setGCSDisplayEnabled = function (value) {
    localStorage._vGCSDisplay = value;
    }

    fn_getGCSDisplayEnabled = function () {
        return this.getDefaultAttribute('_vGCSDisplay', true) === 'true';
    }
          
    
}


export default CLocalStorage.getInstance();
