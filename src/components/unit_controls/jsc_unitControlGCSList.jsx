import React    from 'react';
import * as js_session from '../../js/state/session.js';
import { withTranslation } from 'react-i18next';

import { DIALOG_ICONS } from '../../js/config/assets.js';
import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import {js_localStorage} from '../../js/js_localStorage.js'
import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'

import {fn_gotoUnit_byPartyID} from '../../js/js_main.js'
import { js_unitLayerRegistry } from '../../js/services/map/unitLayerRegistry.js'
import {EventBridge} from '../../js/hooks/EventBridge.jsx'


/**
 * Compact list of GCS units displayed as small inline badges
 * stacked next to each other in one or two rows.
 */
class ClssAndruavUnitGCSList extends React.Component {

    constructor()
    {
        super ();
        this.state = {
            andruavUnitPartyIDs : [],
            'm_update': 0,
            isMinimized: false,
        };

        this.m_flag_mounted = false;

        // Event subscriptions are owned by EventBridge siblings rendered
        // below (see render()), which auto-unsubscribe on unmount via
        // useEventSubscription.
    }

    fn_unitOnlineChanged()
    {
        if (this.m_flag_mounted === false) return ;
        this.setState({ 'm_update': this.state.m_update+1});
    }

    fn_unitAdded (p_andruavUnit)
    {
        if (this.m_flag_mounted === false) return ;
        if (p_andruavUnit.m_IsGCS !== true) return ;

        if (this.state.andruavUnitPartyIDs.includes(p_andruavUnit.getPartyID())) return ;
        this.setState({
            andruavUnitPartyIDs: this.state.andruavUnitPartyIDs.concat([p_andruavUnit.getPartyID()])
        });
    }

    fn_onSocketStatus (params) {
        if (this.m_flag_mounted === false) return ;

        if (params.status !== js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED)
        {
            // reset on disconnect
            this.setState({ andruavUnitPartyIDs: [], 'm_update': this.state.m_update +1 });
        }
    }

    componentDidMount() {
        this.m_flag_mounted = true;
    }

    componentWillUnmount () {
        // Unsubscription is handled automatically by the EventBridge
        // siblings (useEventSubscription) on unmount.
    }

    fn_toggleMinimize() {
        this.setState(prevState => ({ isMinimized: !prevState.isMinimized }));
    }

    fn_gotoIfLocationExists(p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        // only navigate if the unit has a marker (i.e. a known location)
        const marker = js_unitLayerRegistry.fn_get(p_andruavUnit.getPartyID())?.m_marker;
        if (marker === null || marker === undefined) return;
        fn_gotoUnit_byPartyID(p_andruavUnit.getPartyID());
    }

    render() {
        const { t } = this.props;

        // EventBridge siblings must stay mounted even while the list is empty
        // or GCS display is disabled: EE_unitAdded / EE_onPreferenceChanged /
        // EE_requestGamePadonSocketStatus are what populate the list and
        // re-enable display. They render null, so they don't affect layout.
        const gcsDisplayEnabled = js_localStorage.fn_getGCSDisplayEnabled() !== false;

        let units_gcs = [];
        if (gcsDisplayEnabled && this.state.andruavUnitPartyIDs.length > 0) {
            let sortedPartyIDs;
            if (js_localStorage.fn_getUnitSortEnabled() === true)
            {
                sortedPartyIDs = js_session.fn_getAndruavUnitList().fn_getUnitsSortedBy_APID();
            }
            else
            {
                sortedPartyIDs = js_session.fn_getAndruavUnitList().fn_getUnitsSorted();
            }

            const me = this;
            sortedPartyIDs.forEach(function (object)
            {
                if (object === null || object === undefined) return ;
                if (object.m_defined !== true) return ;
                if (object.m_IsGCS !== true) return ;

                const partyID = object.getPartyID();
                const v_andruavUnit = object;

                // hide offline GCS units
                const v_shutdown = v_andruavUnit.m_IsShutdown || v_andruavUnit.m_IsDisconnectedFromGCS;
                if (v_shutdown) return;

                units_gcs.push(
                    <span
                        key={'gcs_badge_' + partyID}
                        className={`d-inline-flex align-items-center badge bg-secondary text-warning css_margin_zero margin_right_4px margin_left_4px cursor_hand IsGCS_true IsShutdown_${v_shutdown}`}
                        onClick={ () => me.fn_gotoIfLocationExists(v_andruavUnit) }
                    >
                        <strong className="ms-1">{v_andruavUnit.m_unitName}</strong>
                    </span>
                );
            });
        }

        return (
            <>
            <EventBridge eventName={js_event.EE_requestGamePadonSocketStatus} onEvent={(params) => this.fn_onSocketStatus(params)} />
            <EventBridge eventName={js_event.EE_unitAdded} onEvent={(p_andruavUnit) => this.fn_unitAdded(p_andruavUnit)} />
            <EventBridge eventName={js_event.EE_unitOnlineChanged} onEvent={() => this.fn_unitOnlineChanged()} />
            <EventBridge eventName={js_event.EE_andruavUnitArmedUpdated} onEvent={() => this.fn_unitOnlineChanged()} />
            <EventBridge eventName={js_event.EE_andruavUnitFCBUpdated} onEvent={() => this.fn_unitOnlineChanged()} />
            <EventBridge eventName={js_event.EE_onPreferenceChanged} onEvent={() => this.fn_unitOnlineChanged()} />
            {gcsDisplayEnabled === true && units_gcs.length > 0 && (
            <div key='gcs_list_main' className='padding_zero margin_zero mb-1'>
                <div className="card-header user-select-none py-1 border-bottom border-light rounded-top txt-theme-aware">
                    <strong>{t('home:onlineGCS')}</strong>
                    <button type="button" className="btn btn-sm btn-link txt-theme-aware float-end p-0 ms-2" onClick={() => this.fn_toggleMinimize()}>
                        {this.state.isMinimized ? DIALOG_ICONS.MAXIMIZE : DIALOG_ICONS.MINIMIZE}
                    </button>
                </div>
                <div className="py-1" style={{ display: this.state.isMinimized ? 'none' : 'block' }}>
                    <div className='padding_zero d-flex flex-wrap align-items-center'>
                        {units_gcs}
                    </div>
                </div>
            </div>
            )}
            </>
        );
    }
};

export default withTranslation(['', 'home'])(ClssAndruavUnitGCSList);
