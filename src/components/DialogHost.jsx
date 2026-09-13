/**
 * TASK-03 — <DialogHost>: the single mount point for all modal dialogs.
 *
 * Replaces the 17 unconditional dialog mounts in home.js. Reads the
 * dialogService store and renders ONLY the active dialog, so unopened
 * dialogs do not participate in reconciliation or subscribe to events.
 *
 * Each dialog component receives `dialogProps` and calls its
 * `fn_displayDialog(this, dialogProps)` in componentDidMount. To close,
 * it calls `fn_closeDialog()` from dialogService, which sets
 * `activeDialog: null` and unmounts the dialog.
 */

import React, { useSyncExternalStore } from 'react';
import { subscribeDialog, fn_getDialogState, js_dialogs } from '../js/app/dialogService.js';
import { useEventSubscription } from '../js/hooks/useEventSubscription.js';
import { EVENTS as js_event } from '../js/events/js_eventList.js';

import ClssAlertDialog from './dialogs/jsc_alertDialog.jsx';
import ClssConfirmationDialog from './dialogs/jsc_confirmationDialog.jsx';
import ClssApplyAllDialog from './dialogs/jsc_applyAllDialog.jsx';
import ClssMissionLoadDialog from './dialogs/jsc_missionLoadDialog.jsx';
import ClssYawDialog from './dialogs/jsc_yawDialogControl.jsx';
import ClssUnitInfoDialog from './dialogs/jsc_unitInfoDialog.jsx';
import ClssAltitudeDialog from './dialogs/jsc_altitudeDialog.jsx';
import ClssSpeedDialog from './dialogs/jsc_speedDialog.jsx';
import ClssFpvDialog from './dialogs/jsc_fpvDialog.jsx';
import ClssStreamDialog from './dialogs/jsc_streamDialogControl.jsx';
import ClssCameraDialog from './dialogs/jsc_cameraDialogControl.jsx';
import ClssViewLinkGimbal from './dialogs/jsc_viewLinkGimbalControl.jsx';
import ClssServoControl from './dialogs/jsc_servoDialogControl.jsx';
import ClssUnitParametersList from './dialogs/jsc_unitParametersList.jsx';
import ClssConfigGenerator from './jsc_config_generator.jsx';
import ClssLidarInfoDialog from './dialogs/jsc_lidarInfoDialogControl.jsx';
import ClssPreclandDialog from './dialogs/jsc_preclandDialogControl.jsx';
import ClssHelpDialog from './dialogs/jsc_helpDialog.jsx';

// Map: dialog name -> component. DialogHost renders only the active entry.
const DIALOG_COMPONENTS = {
    alertDialog:         ClssAlertDialog,
    confirmationDialog:  ClssConfirmationDialog,
    applyAllDialog:      ClssApplyAllDialog,
    missionLoadDialog:   ClssMissionLoadDialog,
    yawDialog:           ClssYawDialog,
    unitInfoDialog:      ClssUnitInfoDialog,
    altitudeDialog:      ClssAltitudeDialog,
    speedDialog:         ClssSpeedDialog,
    fpvDialog:           ClssFpvDialog,
    streamDialog:        ClssStreamDialog,
    cameraDialog:        ClssCameraDialog,
    viewLinkGimbal:      ClssViewLinkGimbal,
    servoControl:        ClssServoControl,
    unitParametersList:  ClssUnitParametersList,
    configGenerator:     ClssConfigGenerator,
    lidarInfoDialog:     ClssLidarInfoDialog,
    preclandDialog:      ClssPreclandDialog,
    helpDialog:          ClssHelpDialog,
};

const DialogHost = () => {
    const state = useSyncExternalStore(subscribeDialog, fn_getDialogState);
    const { activeDialog, props } = state;

    // Bridge EE_andruavUnitLidarShow (not an EE_display* event, but the lidar
    // dialog lives in DialogHost now). This subscription is app-lifetime.
    useEventSubscription(js_event.EE_andruavUnitLidarShow, (p_unit) => js_dialogs.fn_showLidarInfo(p_unit));

    if (!activeDialog) return null;

    const Component = DIALOG_COMPONENTS[activeDialog];
    if (!Component) return null;

    return <Component dialogProps={props} />;
};

export default DialogHost;
