// Gamepad stick/button mapping tables and GP_* tuning constants.
// Frozen — pure data tables, never mutated at runtime.
// (active_gamepad_index is a preference, not a mapping — it lives in preferences.js.)

// GamePad Functions Assignment
export const v_gamepad_function_array = ["undefined", "THR", "ALE", "RUD", "ELE", "SRV9", "SRV10", "SRV11", "SRV12", "SRV13", "SRV14", "SRV15", "SRV16"];
export const v_gamepad_button_function_array = ["undefined", "ARM", "RTL", "Land", "Auto", "Brake", "Loiter", "Guided", "TGT", "SRV9", "SRV10", "SRV11", "SRV12", "SRV13", "SRV14", "SRV15", "SRV16"];
export const v_gamepad_configuration = ["1", "2", "3", "4", "5"];
export const v_gamepad_button_types = ['on/off', 'press', 'long on/off'];
export const v_total_gampad_buttons = 12;

export const STICK_LEFT_HORIZONTAL = 0;
export const STICK_LEFT_VERTICAL = 1;
export const STICK_RIGHT_HORIZONTAL = 2;
export const STICK_RIGHT_VERTICAL = 3;

export const STICK_MODE_RUD = "RUD";
export const STICK_MODE_ELE = "ELE";
export const STICK_MODE_ALE = "ALE";
export const STICK_MODE_THR = "THR";
export const STICK_MODE_AX1 = "AX1";
export const STICK_MODE_AX2 = "AX2";

export const STICK_MODE_MAPPING = [
	{ "RUD": 0, "ELE": 1, "ALE": 2, "THR": 3, "AX1": 4, "AX2": 5 },		// MODE 1
	{ "RUD": 0, "THR": 1, "ALE": 2, "ELE": 3, "AX1": 4, "AX2": 5 },    	// MODE 2
	{ "ALE": 0, "ELE": 1, "RUD": 2, "THR": 3, "AX1": 4, "AX2": 5 },		// MODE 3
	{ "ALE": 0, "THR": 1, "RUD": 2, "ELE": 3, "AX1": 4, "AX2": 5 },		// MODE 4
];

export const STICK_MODE_MAPPING_NAMES = [
	["RUD", "ELE", "ALE", "THR", "AX1", "AX2"],    	// MODE 1
	["RUD", "THR", "ALE", "ELE", "AX1", "AX2"],		// MODE 2
	["ALE", "ELE", "RUD", "THR", "AX1", "AX2"],		// MODE 3
	["ALE", "THR", "RUD", "ELE", "AX1", "AX2"],		// MODE 4
];

export const BUTTON_FUNTION_UNUSED = 0;
export const BUTTON_FUNTION_ARM = 1;
export const BUTTON_FUNTION_RTL = 2;
export const BUTTON_FUNTION_LAND = 3;
export const GP_EPSILON_CHANGE = 0.02;
export const GP_SUDDEN_CHANGE = 0.20;
export const GP_MIN_GAP_FAST_MS = 80;
export const GP_HEARTBEAT_MS = 2500;

Object.freeze({
	v_gamepad_function_array, v_gamepad_button_function_array,
	v_gamepad_configuration, v_gamepad_button_types, v_total_gampad_buttons,
	STICK_LEFT_HORIZONTAL, STICK_LEFT_VERTICAL, STICK_RIGHT_HORIZONTAL, STICK_RIGHT_VERTICAL,
	STICK_MODE_RUD, STICK_MODE_ELE, STICK_MODE_ALE, STICK_MODE_THR, STICK_MODE_AX1, STICK_MODE_AX2,
	STICK_MODE_MAPPING, STICK_MODE_MAPPING_NAMES,
	BUTTON_FUNTION_UNUSED, BUTTON_FUNTION_ARM, BUTTON_FUNTION_RTL, BUTTON_FUNTION_LAND,
	GP_EPSILON_CHANGE, GP_SUDDEN_CHANGE, GP_MIN_GAP_FAST_MS, GP_HEARTBEAT_MS,
});
