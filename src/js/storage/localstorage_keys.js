// localStorage key strings used across the WebClient.
// Frozen — these are pure string constants, never mutated at runtime.
export const LS_UNIT_ID = '_vUnitID';
export const LS_UNIT_ID_SHARED = '_vUnitIDShared';
export const LS_EMAIL = '_vEmail;';
export const LS_LOGIN_NAME = '_vLoginName;';
export const LS_GROUP_NAME = '_vGroupName;';
export const LS_LANG = '_vLang';
export const LS_WEB_GCS = 'WEB_GCS_';
export const LS_ACCESS_CODE = '_vAccessCode';
export const LS_DISPLAY_MODE = '_vDisplayMode';
export const LS_GAME_PAD_MODE = 'gamepad_mode_';
export const LS_GAME_PAD_CONFIG_PREFIX = 'gamepad_config_';
export const LS_GAME_PAD_CONFIG_INDEX = '_vv_gamePadConfigIndex';
export const LS_DEFAULT_ALT = '_vDefaultAltitude';
export const LS_ENABLE_SPEECH = '_vv_speechEnabled';
export const LS_DEFAULT_VOLUME = '_vDefaultVolume';
export const LS_TAB_DISPLAY_ENABLED = '_vTabsDisplayEnabled';
export const LS_METRIC_SYS = '_vv_useMetricSystem';
export const LS_SHOW_ME_GCS = '_vGCSShowMe';
export const LS_UNIT_SORTED_ENABLED = '_vUnitSortEnabled';
export const LS_SELECTED_THEME = '_vSelectedTheme';
export const LS_WEBCONNECTOR_ENABLED = '_vWSPluginEnabled';
export const LS_SMS_PHONE_NUMBER = '_vSMSPhoneNumber';
export const LS_ENABLE_ADSB = '_vADSBEnabled';
export const LS_ENABLE_AISSTREAM = '_vAISStreamEnabled';
export const LS_ENABLE_WIND = '_vWindEnabled';
export const LS_ADSB_RADIUS_KM = '_vADSBRadiusKm';
// ADSB provider config overrides (editable from the ADSB settings tab).
// localStorage has highest priority, then config.local/config.json,
// then the defaults in js_siteConfig.CONST_ADSB_CONFIG.
export const LS_ADSB_PROVIDER = '_vADSBProvider';
export const LS_ADSB_REFRESH_RATE_MS = '_vADSBRefreshRateMs';
export const LS_ADSB_OPENSKY_CLIENT_ID = '_vADSBOpenSkyClientId';
export const LS_ADSB_OPENSKY_CLIENT_SECRET = '_vADSBOpenSkyClientSecret';

Object.freeze({
	LS_UNIT_ID, LS_UNIT_ID_SHARED, LS_EMAIL, LS_LOGIN_NAME, LS_GROUP_NAME,
	LS_LANG, LS_WEB_GCS, LS_ACCESS_CODE, LS_DISPLAY_MODE, LS_GAME_PAD_MODE,
	LS_GAME_PAD_CONFIG_PREFIX, LS_GAME_PAD_CONFIG_INDEX, LS_DEFAULT_ALT,
	LS_ENABLE_SPEECH, LS_DEFAULT_VOLUME, LS_TAB_DISPLAY_ENABLED, LS_METRIC_SYS,
	LS_SHOW_ME_GCS, LS_UNIT_SORTED_ENABLED, LS_SELECTED_THEME,
	LS_WEBCONNECTOR_ENABLED, LS_SMS_PHONE_NUMBER, LS_ENABLE_ADSB,
	LS_ENABLE_AISSTREAM, LS_ENABLE_WIND, LS_ADSB_RADIUS_KM, LS_ADSB_PROVIDER,
	LS_ADSB_REFRESH_RATE_MS, LS_ADSB_OPENSKY_CLIENT_ID, LS_ADSB_OPENSKY_CLIENT_SECRET,
});
