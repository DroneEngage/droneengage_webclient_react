import React from 'react';
import * as js_session from '../../js/state/session.js';

import { EVENTS as js_event } from '../../js/events/js_eventList.js'
import { js_eventEmitter } from '../../js/events/js_eventEmitter.js'
import { js_dialogs } from '../../js/app/dialogService.js'
import {EventBridge} from '../../js/hooks/EventBridge.jsx'

import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'

/**
 * This is a base class for GCS & Drone Units
 */
export class ClssAndruavUnitBase extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'm_update': 0,
            'm_IsGCS': this.props.p_unit.m_IsGCS,
        };

        this.m_flag_mounted = false;
    }

    // Real side effect, not a render trigger: when a unit flips between
    // Drone and GCS type it needs a whole different component class, so we
    // ask the list to re-add it. This must run on every EE_unitUpdated
    // (unthrottled) so the flip is never missed. Per TASK-16 this is why it
    // stays on EventBridge instead of being replaced with a field-store
    // subscription — it is not "re-render this component so a field
    // repaints", it is "this component is no longer valid, replace it".
    fn_unitUpdated(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.getPartyID() !== this.props.p_unit.getPartyID()) {
            return; // not me
        }

        if (p_andruavUnit.m_IsGCS !== this.props.p_unit.m_IsGCS) {
            // Drone converted to GCS or other type... class is not valid now and an add new should be created.
            js_eventEmitter.fn_dispatch(js_event.EE_unitAdded, p_andruavUnit);
        }
    }

    // m_Telemetry._isActive (set to false at the one dispatch site in
    // js_andruav_facade.js API_stopTelemetry) has no render consumer
    // anywhere in the codebase (grep-verified) — nothing reads it, so a
    // field-store subscription on it would be a no-op. Kept as a genuine
    // one-shot signal on EventBridge per TASK-16 rather than migrated;
    // revisit if a consumer is ever added, or remove alongside it as dead
    // weight.
    fn_unitTelemetryOFF(p_andruavUnit) {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        if (p_andruavUnit.getPartyID() !== this.props.p_unit.getPartyID()) {
            return; // not me
        }

        if (!this.m_flag_mounted) return;

        this.setState({ 'm_update': this.state.m_update + 1 });
    }

    childcomponentWillMount() { };
    childcomponentWillUnmount() { };

    componentDidMount() {
        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
        this.childcomponentWillMount();
    }

    componentWillUnmount() {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
        this.childcomponentWillUnmount();
    }

    fn_takeTXCtrl(e, p_andruavUnit) {
        p_andruavUnit.m_Telemetry.m_rxEngaged = true;
        js_session.fn_getAndruavFacade().API_TXCtrl(p_andruavUnit, js_andruavMessages.CONST_TX_SIGNAL_FREEZE_ALL);
        js_eventEmitter.fn_dispatch(js_event.EE_requestGamePad, p_andruavUnit);
    }

    fn_releaseTXCtrl(p_andruavUnit) {
        p_andruavUnit.m_Telemetry.m_rxEngaged = false;
        js_session.fn_getAndruavFacade().API_TXCtrl(p_andruavUnit, js_andruavMessages.CONST_RC_SUB_ACTION_RELEASED);
        js_eventEmitter.fn_dispatch(js_event.EE_requestGamePadRelease, p_andruavUnit);  // Fixed event name for clarity
    }

    fn_displayParamsDialog(p_andruavUnit) {
        if (js_session.fn_getAndruavClient() === null || js_session.fn_getAndruavClient() === undefined) return;

        js_dialogs.fn_showParameters(p_andruavUnit);
    }

    fn_displayLidarDialog(p_andruavUnit) {
        if (js_session.fn_getAndruavClient() === null || js_session.fn_getAndruavClient() === undefined) return;

        js_dialogs.fn_showLidarInfo(p_andruavUnit);
    }

    render() {
        return (
            <>
                <EventBridge eventName={js_event.EE_unitUpdated} onEvent={(p_andruavUnit) => this.fn_unitUpdated(p_andruavUnit)} />
                <EventBridge eventName={js_event.EE_unitTelemetryOff} onEvent={(p_andruavUnit) => this.fn_unitTelemetryOFF(p_andruavUnit)} />
            </>
        );
    }
}