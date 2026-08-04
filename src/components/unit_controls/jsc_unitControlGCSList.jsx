import React    from 'react';
import { withTranslation } from 'react-i18next';

import {js_globals} from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'
import {js_localStorage} from '../../js/js_localStorage.js'
import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'

import {ClssCtrlUnitIcon} from '../gadgets/jsc_ctrl_unit_icon.jsx'
import {fn_gotoUnit_byPartyID} from '../../js/js_main.js'


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

        js_eventEmitter.fn_subscribe(js_event.EE_requestGamePadonSocketStatus, this, this.fn_onSocketStatus);
        js_eventEmitter.fn_subscribe(js_event.EE_unitAdded,this,this.fn_unitAdded);
        js_eventEmitter.fn_subscribe(js_event.EE_unitOnlineChanged,this,this.fn_unitOnlineChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitArmedUpdated,this,this.fn_unitOnlineChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitFCBUpdated,this,this.fn_unitOnlineChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged,this,this.fn_unitOnlineChanged);
    }

    fn_unitOnlineChanged(me,p_andruavUnit)
    {
        if (me.m_flag_mounted === false) return ;
        me.setState({ 'm_update': me.state.m_update+1});
    }

    fn_unitAdded (me,p_andruavUnit)
    {
        if (me.m_flag_mounted === false) return ;
        if (p_andruavUnit.m_IsGCS !== true) return ;

        if (me.state.andruavUnitPartyIDs.includes(p_andruavUnit.getPartyID())) return ;
        me.setState({
            andruavUnitPartyIDs: me.state.andruavUnitPartyIDs.concat([p_andruavUnit.getPartyID()])
        });
    }

    fn_onSocketStatus (me,params) {
        if (me.m_flag_mounted === false) return ;

        if (params.status !== js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED)
        {
            // reset on disconnect
            me.state.andruavUnitPartyIDs = [];
            me.setState({'m_update': me.state.m_update +1});
        }
    }

    componentDidMount() {
        this.m_flag_mounted = true;
    }

    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe(js_event.EE_requestGamePadonSocketStatus,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitAdded,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_unitOnlineChanged,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_andruavUnitArmedUpdated,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_andruavUnitFCBUpdated,this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onPreferenceChanged,this);
    }

    fn_toggleMinimize() {
        this.setState(prevState => ({ isMinimized: !prevState.isMinimized }));
    }

    fn_gotoIfLocationExists(p_andruavUnit)
    {
        if (p_andruavUnit === null || p_andruavUnit === undefined) return;
        // only navigate if the unit has a marker (i.e. a known location)
        const marker = p_andruavUnit.m_gui && p_andruavUnit.m_gui.m_marker;
        if (marker === null || marker === undefined) return;
        fn_gotoUnit_byPartyID(p_andruavUnit.getPartyID());
    }

    render() {
        const { t } = this.props;

        // Respect GCS display preference
        if (js_localStorage.fn_getGCSDisplayEnabled() === false) return null;

        if (this.state.andruavUnitPartyIDs.length === 0) return null;

        let sortedPartyIDs;
        if (js_localStorage.fn_getUnitSortEnabled() === true)
        {
            sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSortedBy_APID();
        }
        else
        {
            sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSorted();
        }

        const units_gcs = [];
        const me = this;
        sortedPartyIDs.map(function (object)
        {
            if (object === null || object === undefined) return ;
            if (object.m_defined !== true) return ;
            if (object.m_IsGCS !== true) return ;

            const partyID = object.getPartyID();
            const v_andruavUnit = object;

            const v_shutdown = v_andruavUnit.m_IsShutdown || v_andruavUnit.m_IsDisconnectedFromGCS;
            units_gcs.push(
                <span
                    key={'gcs_badge_' + partyID}
                    className={`d-inline-flex align-items-center badge bg-secondary text-warning css_margin_zero margin_right_4px margin_left_4px cursor_hand IsGCS_true IsShutdown_${v_shutdown}`}
                    onClick={ () => me.fn_gotoIfLocationExists(v_andruavUnit) }
                >
                    <ClssCtrlUnitIcon p_unit={v_andruavUnit} className="small_icon" />
                    <strong className="ms-1">{v_andruavUnit.m_unitName}</strong>
                </span>
            );
        });

        if (units_gcs.length === 0) return null;

        return (
            <div key='gcs_list_main' className='padding_zero margin_zero mb-1'>
                <div className="card-header user-select-none py-1 border-bottom border-light rounded-top txt-theme-aware">
                    <strong>{t('home:onlineGCS')}</strong>
                    <button type="button" className="btn btn-sm btn-link txt-theme-aware float-end p-0 ms-2" onClick={() => this.fn_toggleMinimize()}>
                        {this.state.isMinimized ? js_globals.DIALOG_ICONS.MAXIMIZE : js_globals.DIALOG_ICONS.MINIMIZE}
                    </button>
                </div>
                <div className="py-1" style={{ display: this.state.isMinimized ? 'none' : 'block' }}>
                    <div className='padding_zero d-flex flex-wrap align-items-center'>
                        {units_gcs}
                    </div>
                </div>
            </div>
        );
    }
};

export default withTranslation(['', 'home'])(ClssAndruavUnitGCSList);
