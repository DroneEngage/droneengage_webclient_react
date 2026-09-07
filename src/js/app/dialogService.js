/**
 * TASK-03 — Dialog service: replaces the 19 EE_display and EE_hide broadcast
 * events with explicit, greppable function calls.
 *
 * The old pattern dispatched imperative UI commands ("open this dialog now")
 * through a broadcast channel, making control flow impossible to follow.
 * This module is a tiny subscribable store holding
 * `{ activeDialog, props }`. A single <DialogHost> component reads it and
 * renders ONLY the active dialog — fixing the unconditional-mount problem
 * (home.js used to mount all 17 dialogs at once).
 *
 * Usage from any call site:
 *   import { js_dialogs } from '../js/app/dialogService.js';
 *   js_dialogs.fn_showAlertDialog({ p_title, p_message, p_callback });
 *   js_dialogs.fn_hideCamera();
 *
 * Usage from a dialog component (to close itself):
 *   import { fn_closeDialog } from '../js/app/dialogService.js';
 *   fn_closeDialog();  // unmounts this dialog via DialogHost
 */

// ---------------------------------------------------------------------------
// Subscribable store — { activeDialog: string|null, props: object }
// ---------------------------------------------------------------------------

let _state = { activeDialog: null, props: {} };
const _listeners = new Set();

function _emit() {
    _listeners.forEach((l) => l());
}

/**
 * Open a dialog by name, carrying props that the dialog component will
 * receive via <DialogHost>.
 * @param {string} name - dialog name (matches the key in DialogHost's map)
 * @param {object} [props={}] - dialog-specific props
 */
export function fn_openDialog(name, props = {}) {
    _state = { activeDialog: name, props };
    _emit();
}

/**
 * Close whatever dialog is currently active. Called by dialog components
 * when the user clicks Close/OK/backdrop, and by fn_hide* helpers.
 */
export function fn_closeDialog() {
    if (_state.activeDialog === null) return;
    _state = { activeDialog: null, props: {} };
    _emit();
}

/**
 * Close only if the named dialog is the active one. Used by fn_hide*
 * helpers that should be no-ops if a different dialog is showing.
 * @param {string} name
 */
export function fn_closeDialogIfActive(name) {
    if (_state.activeDialog === name) fn_closeDialog();
}

/**
 * Read the current store state. Used by <DialogHost> via useSyncExternalStore.
 * @returns {{ activeDialog: string|null, props: object }}
 */
export function fn_getDialogState() {
    return _state;
}

/**
 * Subscribe to store changes. Returns an unsubscribe function.
 * @param {() => void} onChange
 * @returns {() => void}
 */
export function subscribeDialog(onChange) {
    _listeners.add(onChange);
    return () => _listeners.delete(onChange);
}

// ---------------------------------------------------------------------------
// js_dialogs — one fn_show*/fn_hide* per retired EE_display*/EE_hide* event.
// Explicit, greppable, followable in an editor.
// ---------------------------------------------------------------------------

export const js_dialogs = {
    // --- Simple modal dialogs (props passed straight through) ---
    fn_showAlertDialog(props) { fn_openDialog('alertDialog', props); },
    fn_showConfirmationDialog(props) { fn_openDialog('confirmationDialog', props); },
    fn_showApplyAllDialog(props) { fn_openDialog('applyAllDialog', props); },
    fn_showMissionLoadDialog(props) { fn_openDialog('missionLoadDialog', props); },

    // --- Unit-targeted dialogs ---
    fn_showYaw(unit, onApply) { fn_openDialog('yawDialog', { unit, onApply }); },
    fn_showUnitInfo(unit) { fn_openDialog('unitInfoDialog', { unit }); },
    fn_showAltitude(props) { fn_openDialog('altitudeDialog', props); },
    fn_showSpeed(props) { fn_openDialog('speedDialog', props); },
    fn_showServo(partyID) { fn_openDialog('servoControl', { partyID }); },
    fn_showParameters(unit) { fn_openDialog('unitParametersList', { unit }); },

    // --- Video / camera dialogs ---
    fn_showStream(session) { fn_openDialog('streamDialog', { session }); },
    fn_hideStream() { fn_closeDialogIfActive('streamDialog'); },
    fn_showCamera(session) { fn_openDialog('cameraDialog', { session }); },
    fn_hideCamera() { fn_closeDialogIfActive('cameraDialog'); },
    fn_showFpv(props) { fn_openDialog('fpvDialog', props); },

    // --- ViewLink gimbal ---
    fn_showViewLinkGimbal(props) { fn_openDialog('viewLinkGimbal', props); },
    fn_hideViewLinkGimbal() { fn_closeDialogIfActive('viewLinkGimbal'); },

    // --- Config generator ---
    fn_showConfigGenerator(props) { fn_openDialog('configGenerator', props); },

    // --- Geo form (was a dead event — kept for completeness) ---
    fn_showGeoForm(props) { fn_openDialog('geoForm', props); },

    // --- Lidar info (bridged from EE_andruavUnitLidarShow, not an EE_display* event) ---
    fn_showLidarInfo(unit) { fn_openDialog('lidarInfoDialog', { unit }); },
};
