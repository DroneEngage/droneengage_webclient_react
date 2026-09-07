// Genuinely immutable runtime constants — never written at runtime.
// Frozen. Each member was verified against the write-site grep before
// being placed here; if a field needs to become writable it belongs in
// state/preferences.js instead.
export const CONST_DFM_FAR = 3000; // more than 10 Km is far.
export const CONST_DFM_SAFE = 1000; // less than 1 Km is safe.
export const CONST_MAX_MESSAGE_LOG = 100;

export const CONST_DEFAULT_ALTITUDE_STEP = 3;    //  m
export const CONST_DEFAULT_SPEED_MIN = 5;    //  m/s
export const CONST_DEFAULT_SPEED_STEP = 1;    //  m/s
export const CONST_DEFAULT_VOLUME = 50;

// GUI
export const CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT = 40;

// Mission File Extension
export const v_mission_file_extension = '.de';

export const CONST_MAX_SDR_SPECTRUM_LENGTH = 100;
export const CONST_MAX_SDR_DETECTED_SIGNAL_LENGTH = 100;

export const CONST_EXPERIMENTAL_FEATURES_ENABLED = true; // KEEP it above code block and keep it unchanged

export const CONST_MAP_GOOLE = false;

// Debug: Show white dot at anchor point of icons
export const CONST_DEBUG_SHOW_ANCHOR_DOTS = false;

export const CONST_DISABLE_ADSG = true;

// VIEW LINK Gimbal Zoom range constants
export const CONST_OPTICAL_ZOOM_MIN = 1.0;
export const CONST_OPTICAL_ZOOM_MAX = 40.0; // A40TR-Pro
export const CONST_IR_DIGITAL_ZOOM_MIN = 1.0;
export const CONST_IR_DIGITAL_ZOOM_MAX = 32.0; // A40TR-Pro

Object.freeze({
	CONST_DFM_FAR, CONST_DFM_SAFE, CONST_MAX_MESSAGE_LOG,
	CONST_DEFAULT_ALTITUDE_STEP, CONST_DEFAULT_SPEED_MIN, CONST_DEFAULT_SPEED_STEP,
	CONST_DEFAULT_VOLUME, CONST_DEFAULT_FLIGHTPATH_STEPS_COUNT,
	v_mission_file_extension,
	CONST_MAX_SDR_SPECTRUM_LENGTH, CONST_MAX_SDR_DETECTED_SIGNAL_LENGTH,
	CONST_EXPERIMENTAL_FEATURES_ENABLED, CONST_MAP_GOOLE, CONST_DEBUG_SHOW_ANCHOR_DOTS,
	CONST_DISABLE_ADSG,
	CONST_OPTICAL_ZOOM_MIN, CONST_OPTICAL_ZOOM_MAX, CONST_IR_DIGITAL_ZOOM_MIN, CONST_IR_DIGITAL_ZOOM_MAX,
});
