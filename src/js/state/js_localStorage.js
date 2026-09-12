/*jshint esversion: 6 */
import * as js_preferences from './preferences.js';
import { CONST_DEFAULT_VOLUME } from '../config/constants.js';
import * as js_common from '../helpers/js_common.js'
import * as js_siteConfig from '../config/js_siteConfig.js';
import {
	LS_LANG, LS_EMAIL, LS_LOGIN_NAME, LS_ACCESS_CODE, LS_UNIT_ID,
	LS_UNIT_ID_SHARED, LS_WEB_GCS, LS_GROUP_NAME, LS_DISPLAY_MODE,
	LS_METRIC_SYS, LS_GAME_PAD_CONFIG_PREFIX, LS_GAME_PAD_CONFIG_INDEX,
	LS_DEFAULT_ALT, LS_ENABLE_SPEECH, LS_ENABLE_ADSB, LS_ENABLE_AISSTREAM,
	LS_ENABLE_WIND, LS_ENABLE_SMOOTH_MOVEMENT, LS_ADSB_RADIUS_KM, LS_ADSB_PROVIDER, LS_ADSB_REFRESH_RATE_MS,
	LS_ADSB_OPENSKY_CLIENT_ID, LS_ADSB_OPENSKY_CLIENT_SECRET, LS_DEFAULT_VOLUME,
	LS_TAB_DISPLAY_ENABLED, LS_SHOW_ME_GCS, LS_UNIT_SORTED_ENABLED,
	LS_SELECTED_THEME, LS_WEBCONNECTOR_ENABLED, LS_SMS_PHONE_NUMBER,
	LS_MAP3D_ICONS_ONLY,
} from '../storage/localstorage_keys.js';

class CLocalStorage {
    constructor() {
        if (this.isSupported()) {
            // Initialize global settings with saved values if they exist
            js_preferences.fn_setUseMetricSystem(this.fn_getMetricSystem());
            js_preferences.fn_setDefaultAltitude(this.fn_getDefaultAltitude());
            js_preferences.fn_setDefaultRadius(this.fn_getDefaultRadius());
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
        this._setValue(LS_LANG, value);
    }

    fn_getLanguage() {
        return this._getValue(LS_LANG, 'en');
    }

    // Email
    fn_setEmail(value) {
        this._setValue(LS_EMAIL, value);
    }

    fn_getEmail() {
        return this._getValue(LS_EMAIL, '');
    }

    // LoginName
    fn_setLoginName(value) {
        this._setValue(LS_LOGIN_NAME, value);
    }

    fn_getLoginName() {
        return this._getValue(LS_LOGIN_NAME, '');
    }

    // Access Code
    fn_setAccessCode(value) {
        this._setValue(LS_ACCESS_CODE, value);
    }

    fn_getAccessCode() {
        return this._getValue(LS_ACCESS_CODE, '');
    }

    // Unit ID
    fn_setUnitID(value) {
        this._setSessionValue(LS_UNIT_ID, value);
    }

    fn_setUnitIDShared(value) {
        this._setValue(LS_UNIT_ID_SHARED, value);
    }

    fn_resetUnitID() {
        this.fn_setUnitID(LS_WEB_GCS + js_common.fn_generateRandomString(3));
    }

    fn_resetUnitIDShared() {
        const v = LS_WEB_GCS + js_common.fn_generateRandomString(3);
        this.fn_setUnitIDShared(v);
        return v;
    }
    fn_getUnitID() {
        return this._getSessionValue(LS_UNIT_ID, LS_WEB_GCS + js_common.fn_generateRandomString(3));
    }

    fn_getUnitIDShared() {
        const v = this._getValue(LS_UNIT_ID_SHARED, null);
        if (v !== null && v !== undefined && v.length > 0) return v;
        return this.fn_resetUnitIDShared();
    }

    // Group Name
    fn_setGroupName(value) {
        this._setValue(LS_GROUP_NAME, value);
    }

    fn_getGroupName() {
        return this._getValue(LS_GROUP_NAME, '1');
    }

    // Display Mode
    fn_setDisplayMode(value) {
        this._setValue(LS_DISPLAY_MODE, value);
    }

    fn_getDisplayMode() {
        return parseInt(this._getValue(LS_DISPLAY_MODE, 0));
    }

    // Metric System
    fn_setMetricSystem(value) {
        this._setValue(LS_METRIC_SYS, value.toString());
    }

    fn_getMetricSystem() {
        return this._getValue(LS_METRIC_SYS, js_preferences.fn_getUseMetricSystem().toString()) === 'true';
    }

    fn_setGamePadConfig(config_index, value) {
        this._setValue(`${LS_GAME_PAD_CONFIG_PREFIX}${config_index}`, value);
    }


    fn_getGamePadConfig(config_index) {
        const value = js_localStorage._getValue(`${LS_GAME_PAD_CONFIG_PREFIX}${config_index}`, `{"functionMappings":{"THR":{"type":"axis","index":1},"ALE":{"type":"axis","index":3},"ELE":{"type":"axis","index":4},"RUD":{"type":"axis","index":0},"ARM":{"type":"button","index":2},"RTL":{"type":"button","index":0},"Land":{"type":"button","index":3},"Auto":{"type":"button","index":1}},"axisReversed":[1,1,1,1,1,1,1,1],"buttonsFunction":["RTL","Auto","ARM","Land","undefined","undefined","undefined","undefined","undefined","undefined","undefined"],"buttonTypes":["on/off","on/off","on/off","on/off", "on/off", "on/off", "on/off","on/off", "on/off","on/off", "on/off"], "mode":1}`);
        return value;
    }


    fn_setGamePadConfigIndex(value) {
        this._setValue(LS_GAME_PAD_CONFIG_INDEX, value.toString());
    }

    fn_getGamePadConfigIndex() {
        return parseInt(this._getValue(LS_GAME_PAD_CONFIG_INDEX, '0'));
    }

    fn_exportGamePadConfigs() {
        const configPrefix = LS_GAME_PAD_CONFIG_PREFIX;
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
        this._setValue(LS_DEFAULT_ALT, value.toString());
    }

    fn_getDefaultAltitude() {
        return parseInt(this._getValue(LS_DEFAULT_ALT, js_preferences.fn_getDefaultAltitude().toString()));
    }

    // Default Radius
    fn_setDefaultRadius(value) {
        this._setValue('_vDefaultRadius', value.toString());
    }

    fn_getDefaultRadius() {
        return parseInt(this._getValue('_vDefaultRadius', js_preferences.fn_getDefaultRadius().toString()));
    }

    fn_setDefaultSwarmHorizontalDistance(value) {
        this._setValue('_vDefaultSHD', value.toString());
    }

    fn_getDefaultSwarmHorizontalDistance() {
        return parseInt(this._getValue('_vDefaultSHD', js_preferences.fn_getDefaultAltitude().toString()));
    }

    fn_setDefaultSwarmVerticalDistance(value) {
        this._setValue('_vDefaultSVD', value.toString());
    }

    fn_getDefaultSwarmVerticalDistance() {
        return parseInt(this._getValue('_vDefaultSVD', js_preferences.fn_getDefaultRadius().toString()));
    }

    // Speech Enabled
    fn_setSpeechEnabled(value) {
        this._setValue(LS_ENABLE_SPEECH, value.toString());
    }

    fn_getSpeechEnabled() {
        return this._getValue(LS_ENABLE_SPEECH, 'true') === 'true';
    }

    // ADSB Enabled (runtime preference). Always returns false when the
    // site feature flag CONST_FEATURE.DISABLE_ADSB is true — the feature
    // does not exist in that case, regardless of the stored preference.
    fn_setADSBEnabled(value) {
        this._setValue(LS_ENABLE_ADSB, value.toString());
    }

    fn_getADSBEnabled() {
        if (js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_ADSB === true) {
            return false;
        }
        return this._getValue(LS_ENABLE_ADSB, 'true') === 'true';
    }

    // AISStream Enabled (runtime preference). Always returns false when the
    // site feature flag CONST_FEATURE.DISABLE_AISStream is true — the feature
    // does not exist in that case, regardless of the stored preference.
    fn_setAISStreamEnabled(value) {
        this._setValue(LS_ENABLE_AISSTREAM, value.toString());
    }

    fn_getAISStreamEnabled() {
        if (js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_AISStream === true) {
            return false;
        }
        return this._getValue(LS_ENABLE_AISSTREAM, 'true') === 'true';
    }

    // Wind arrow Enabled (runtime preference). Always returns false when the
    // site feature flag CONST_FEATURE.DISABLE_WIND is true — the feature
    // does not exist in that case, regardless of the stored preference.
    fn_setWindEnabled(value) {
        this._setValue(LS_ENABLE_WIND, value.toString());
    }

    fn_getWindEnabled() {
        if (js_siteConfig.CONST_FEATURE && js_siteConfig.CONST_FEATURE.DISABLE_WIND === true) {
            return false;
        }
        return this._getValue(LS_ENABLE_WIND, 'false') === 'true';
    }

    // Smooth (interpolated) unit & ADS-B movement Enabled (runtime
    // preference). Quality-of-life feature, default ON. Unlike Wind/AIS,
    // this is not behind a CONST_FEATURE.DISABLE_* site flag — always shown.
    fn_setSmoothMovementEnabled(value) {
        this._setValue(LS_ENABLE_SMOOTH_MOVEMENT, value.toString());
    }

    fn_getSmoothMovementEnabled() {
        return this._getValue(LS_ENABLE_SMOOTH_MOVEMENT, 'true') === 'true';
    }

    // ADSB geolocation fallback radius in kilometers (used when no drones
    // are online). Stored in km as the canonical unit.
    fn_setAdsbRadiusKm(value) {
        this._setValue(LS_ADSB_RADIUS_KM, value.toString());
    }

    fn_getAdsbRadiusKm() {
        const v = parseInt(this._getValue(LS_ADSB_RADIUS_KM, ''));
        const max = (js_siteConfig.CONST_ADSB_CONFIG && js_siteConfig.CONST_ADSB_CONFIG.RADIUS_KM) || 850;
        if (isNaN(v) || v < 2 || v > max) return null;
        return v;
    }

    // ADSB provider config overrides. localStorage has highest priority
    // (then config.local/config.json, then js_siteConfig defaults). These
    // back the editable fields in the ADSB settings tab.
    fn_setAdsbProvider(value) {
        this._setValue(LS_ADSB_PROVIDER, value);
    }

    fn_getAdsbProvider() {
        return this._getValue(LS_ADSB_PROVIDER, '');
    }

    fn_removeAdsbProvider() {
        this._removeValue(LS_ADSB_PROVIDER);
    }

    fn_setAdsbRefreshRateMs(value) {
        this._setValue(LS_ADSB_REFRESH_RATE_MS, value);
    }

    fn_getAdsbRefreshRateMs() {
        const v = parseInt(this._getValue(LS_ADSB_REFRESH_RATE_MS, ''));
        return isNaN(v) || v < 1000 ? null : v;
    }

    fn_removeAdsbRefreshRateMs() {
        this._removeValue(LS_ADSB_REFRESH_RATE_MS);
    }

    fn_setAdsbOpenSkyClientId(value) {
        this._setValue(LS_ADSB_OPENSKY_CLIENT_ID, value);
    }

    fn_getAdsbOpenSkyClientId() {
        return this._getValue(LS_ADSB_OPENSKY_CLIENT_ID, '');
    }

    fn_removeAdsbOpenSkyClientId() {
        this._removeValue(LS_ADSB_OPENSKY_CLIENT_ID);
    }

    fn_setAdsbOpenSkyClientSecret(value) {
        this._setValue(LS_ADSB_OPENSKY_CLIENT_SECRET, value);
    }

    fn_getAdsbOpenSkyClientSecret() {
        return this._getValue(LS_ADSB_OPENSKY_CLIENT_SECRET, '');
    }

    fn_removeAdsbOpenSkyClientSecret() {
        this._removeValue(LS_ADSB_OPENSKY_CLIENT_SECRET);
    }

    // Volume
    fn_setVolume(value) {
        this._setValue(LS_DEFAULT_VOLUME, value.toString());
    }

    fn_getVolume() {
        return parseInt(this._getValue(LS_DEFAULT_VOLUME, CONST_DEFAULT_VOLUME.toString()));
    }

    // Tabs Display Enabled
    fn_setTabsDisplayEnabled(value) {
        this._setValue(LS_TAB_DISPLAY_ENABLED, value.toString());
    }

    fn_getTabsDisplayEnabled() {
        return this._getValue(LS_TAB_DISPLAY_ENABLED, 'true') === 'true';
    }

    fn_setGCSShowMe(value) {
        this._setValue(LS_SHOW_ME_GCS, value.toString());
    }

    fn_getGCSShowMe() {
        return this._getValue(LS_SHOW_ME_GCS, 'true') === 'true';
    }

    // Unit Sort Enabled
    fn_setUnitSortEnabled(value) {
        this._setValue(LS_UNIT_SORTED_ENABLED, value.toString());
    }

    fn_getUnitSortEnabled() {
        return this._getValue(LS_UNIT_SORTED_ENABLED, 'true') === 'true';
    }

    // Advanced Options Enabled
    fn_setAdvancedOptionsEnabled(value) {
        this._setValue('_vAdvancedOptionsEnabled', value.toString());
    }

    fn_getAdvancedOptionsEnabled() {
        return this._getValue('_vAdvancedOptionsEnabled', 'true') === 'true';
    }

    // 3D Map Icons-Only mode (runtime preference). When true, the 3D map
    // always renders flat DOM icons and never swaps to glTF models,
    // regardless of zoom. Defaults to false (current GLB LOD logic).
    fn_setMap3dIconsOnly(value) {
        this._setValue(LS_MAP3D_ICONS_ONLY, value.toString());
    }

    fn_getMap3dIconsOnly() {
        return this._getValue(LS_MAP3D_ICONS_ONLY, 'false') === 'true';
    }

    // GCS Display Enabled
    fn_setGCSDisplayEnabled(value) {
        this._setValue('_vGCSDisplay', value.toString());
    }

    fn_getGCSDisplayEnabled() {
        return this._getValue('_vGCSDisplay', 'true') === 'true';
    }

    // Selected Theme
    fn_setSelectedTheme(value) {
        this._setValue(LS_SELECTED_THEME, value);
    }

    fn_getSelectedTheme() {
        return this._getValue(LS_SELECTED_THEME, 'default');
    }

    fn_setWebConnectorEnabled(value) {
        this._setValue(LS_WEBCONNECTOR_ENABLED, value === true ? 'true' : 'false');
    }

    fn_getWebConnectorEnabled() {
        return this._getValue(LS_WEBCONNECTOR_ENABLED, 'true') === 'true';
    }

    // WS2WS/Mavlink3D Enabled
    fn_setWS2WSEnabled(value) {
        this._setValue('_vWS2WSEnabled', value.toString());
    }

    fn_getWS2WSEnabled() {
        return this._getValue('_vWS2WSEnabled', 'false') === 'true';
    }

    // Map Settings
    fn_setMapLeafletAccessToken(value) {
        this._setValue('_vMapLeafletAccessToken', value);
    }

    fn_getMapLeafletAccessToken() {
        return this._getValue('_vMapLeafletAccessToken', '');
    }

    fn_removeMapLeafletAccessToken() {
        this._removeValue('_vMapLeafletAccessToken');
    }

    fn_setMapLeafletUrlMap(value) {
        this._setValue('_vMapLeafletUrlMap', value);
    }

    fn_getMapLeafletUrlMap() {
        return this._getValue('_vMapLeafletUrlMap', '');
    }

    fn_removeMapLeafletUrlMap() {
        this._removeValue('_vMapLeafletUrlMap');
    }

    fn_setMapbox3DAccessToken(value) {
        this._setValue('_vMapbox3DAccessToken', value);
    }

    fn_getMapbox3DAccessToken() {
        return this._getValue('_vMapbox3DAccessToken', '');
    }

    fn_removeMapbox3DAccessToken() {
        this._removeValue('_vMapbox3DAccessToken');
    }

    fn_setMapboxStyle(value) {
        this._setValue('_vMapboxStyle', value);
    }

    fn_getMapboxStyle() {
        return this._getValue('_vMapboxStyle', '');
    }

    fn_removeMapboxStyle() {
        this._removeValue('_vMapboxStyle');
    }

    // Map Tile Cache Enabled (IndexedDB tile cache for Leaflet raster
    // tiles). Default true matches CONST_MAP_TILE_CACHE.ENABLED in
    // js_siteConfig. localStorage has highest priority, then
    // config.local/config.json, then the js_siteConfig default.
    fn_setMapTileCacheEnabled(value) {
        this._setValue('_vMapTileCacheEnabled', value ? 'true' : 'false');
    }

    fn_getMapTileCacheEnabled() {
        return this._getValue('_vMapTileCacheEnabled', 'true') === 'true';
    }

    fn_removeMapTileCacheEnabled() {
        this._removeValue('_vMapTileCacheEnabled');
    }

    // SMS Phone Number (used by Andruav SMS-with-location control)
    fn_setSMSPhoneNumber(value) {
        this._setValue(LS_SMS_PHONE_NUMBER, value);
    }

    fn_getSMSPhoneNumber() {
        return this._getValue(LS_SMS_PHONE_NUMBER, '');
    }
}

export const js_localStorage = CLocalStorage.getInstance();