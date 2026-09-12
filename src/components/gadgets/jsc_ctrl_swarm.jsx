import React, { useCallback } from 'react';
import * as js_session from '../../js/state/session.js';
import * as js_preferences from '../../js/state/preferences.js';
import { withTranslation } from 'react-i18next';
import * as js_siteConfig from '../../js/config/js_siteConfig.js';
import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages';
import { EVENTS as js_event } from '../../js/events/js_eventList.js';
import { js_localStorage } from '../../js/state/js_localStorage.js';
import { useEventSubscription } from '../../js/hooks/useEventSubscription.js';
import { useUnitField } from '../../js/hooks/useUnitField.js';
import ClssCtrlSWARMFormation from './jsc_mctrl_swarm_formation.jsx';

/**
 * props:
 * p_unit
 *
 * events:
 * onMakeSwarm
 * onRequestToFollow
 *
 * m_following/m_isLeader/m_formation_as_leader/m_formation_as_follower are
 * genuine per-unit fields (unlike most of the other migrated gadgets, which
 * read many nested nav fields per render and so use a coarse re-render
 * tick instead) - EE_onAndruavUnitSwarmUpdated is bridged into
 * per-field notifications in js_main.js, and useUnitField's built-in
 * change detection replaces the original's getDerivedStateFromProps +
 * shouldComponentUpdate field-diffing (including its m_waiting bookkeeping,
 * which existed only to suppress re-renders from the old coarse
 * "any unit's swarm changed" ping - unneeded now that the ping is
 * per-field and per-unit).
 */
function ClssCtrlSWARM({ p_unit, className, i18n, t, onMakeSwarm, onRequestToFollow }) {
    const partyId = p_unit.getPartyID();
    const following = useUnitField(partyId, 'm_Swarm.m_following');
    const isLeader = useUnitField(partyId, 'm_Swarm.m_isLeader');
    const formationAsLeader = useUnitField(partyId, 'm_Swarm.m_formation_as_leader');
    const formationAsFollower = useUnitField(partyId, 'm_Swarm.m_formation_as_follower');

    // EE_Language_Changed doesn't correspond to any unit field - it just
    // needs to force a re-render since t()-translated strings are read
    // directly at render time (react-i18next's withTranslation already
    // re-renders on language change via its own subscription, so this
    // mirrors the original's belt-and-suspenders re-render on top of that).
    const [, forceUpdateOnLanguageChange] = React.useReducer((c) => c + 1, 0);
    useEventSubscription(js_event.EE_Language_Changed, useCallback(() => forceUpdateOnLanguageChange(), []));

    const fn_toggleMakeSwarm = (p_formationID) => {
        if (p_unit === null || p_unit === undefined) return;
        if (onRequestToFollow !== undefined) {
            onMakeSwarm(p_formationID);
        }
        if (isLeader === true) {
            js_session.fn_getAndruavFacade().API_makeSwarm(
                p_unit,
                js_andruavMessages.CONST_TASHKEEL_SERB_NO_SWARM,
                js_preferences.fn_getDefaultSwarmHorizontalDistance(),
                js_preferences.fn_getDefaultSwarmVerticalDistance()
            );
        } else {
            js_session.fn_getAndruavFacade().API_makeSwarm(
                p_unit,
                p_formationID,
                js_preferences.fn_getDefaultSwarmHorizontalDistance(),
                js_preferences.fn_getDefaultSwarmVerticalDistance()
            );
        }
    };

    const fn_requestToFollow = (p_followUnit) => {
        if (p_unit === null || p_unit === undefined) return;
        if (onRequestToFollow !== undefined) {
            onRequestToFollow(p_followUnit);
        }
        let v_partyID = null;
        let v_do_follow = js_andruavMessages.CONST_TYPE_SWARM_UNFOLLOW;
        if (p_followUnit !== null && p_followUnit !== undefined) {
            v_partyID = p_followUnit.getPartyID();
            v_do_follow = js_andruavMessages.CONST_TYPE_SWARM_FOLLOW;
        }
        js_session.fn_getAndruavFacade().API_requestFromDroneToFollowAnother(p_unit, -1, v_partyID, v_do_follow);
    };

    const fn_handleFormationChange = (newFormation) => {
        if (p_unit === null || p_unit === undefined) return;
        if (isLeader === true) {
            js_session.fn_getAndruavFacade().API_makeSwarm(
                p_unit,
                newFormation,
                js_localStorage.fn_getDefaultSwarmHorizontalDistance(),
                js_localStorage.fn_getDefaultSwarmVerticalDistance()
            );
        }
    };

    if (js_siteConfig.CONST_FEATURE.DISABLE_SWARM === true || js_localStorage.fn_getAdvancedOptionsEnabled() !== true) {
        return <div></div>;
    }

    const key = partyId;
    // fn_getUnitValues() returns undefined once v_andruavClient is cleared
    // (e.g. on logout); guard so the dropdown render does not crash.
    const v_units = (js_session.fn_getAndruavUnitList() && js_session.fn_getAndruavUnitList().fn_getUnitValues()) || [];
    const len = v_units.length;
    const c_items = [];

    let v_leader_class = "btn-secondary";
    let v_follower_class = "btn-secondary";
    let v_leader_title_leader = t('swarmCtrl:notLeader');
    let v_leader_title_follower = t('swarmCtrl:none');
    let v_leader_dropdown_class = "bg-secondary";
    let v_swarm_class = 'txt-theme-aware';
    let v_class_follower = 'hidden';
    let v_class_formation_as_follower = 'hidden';

    if (following != null) {
        v_follower_class = "btn-danger";
        v_leader_dropdown_class = "bg-success txt-theme-aware";
        const v_leaderUnit = js_session.fn_getAndruavUnitList().fn_getUnit(following);
        if (v_leaderUnit != null) {
            v_leader_title_follower = v_leaderUnit.m_unitName;
        } else {
            v_leader_title_follower = following;
        }
        v_class_formation_as_follower = '';
        v_class_follower = '';
    } else {
        v_follower_class = "btn-secondary";
    }

    if (isLeader === true) {
        v_leader_class = "btn-danger bg-danger";
        v_leader_dropdown_class = "bg-danger txt-theme-aware";
        v_follower_class = "btn-danger";
        v_leader_title_leader = t('swarmCtrl:leader');
    }

    for (let i = 0; i < len; ++i) {
        const v_unit = v_units[i];
        if (
            partyId !== v_unit.getPartyID() &&
            v_unit.m_Swarm.m_isLeader === true &&
            following !== v_unit.getPartyID()
        ) {
            c_items.push(
                <a
                    key={v_unit.m_unitName + "s"}
                    className="dropdown-item"
                    href="#"
                    onClick={(unit => {
                        return () => fn_requestToFollow(unit);
                    })(v_unit)}
                >
                    {v_unit.m_unitName}
                </a>
            );
        }
    }

    return (
        <div key={'swr_' + key} className={className} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <div key={'swr_1' + key} className="btn-group" role="group" aria-label={t('swarmCtrl:buttonGroupLabel')}>
                <button
                    key={'swr_11' + key}
                    id={partyId + "_ldr"}
                    type="button"
                    className={"btn btn-sm " + v_leader_class}
                    title={t('swarmCtrl:leaderTitle', { leader: v_leader_title_leader, follower: v_leader_title_follower })}
                    onClick={() => fn_toggleMakeSwarm(js_andruavMessages.CONST_TASHKEEL_SERB_THREAD)}
                >
                    {t('swarmCtrl:leader')}
                </button>
                <button
                    key={'swr_12' + key}
                    id={"btnGroupDrop2" + key}
                    type="button"
                    className={"btn btn-sm dropdown-toggle dropdown-toggle-split " + v_follower_class}
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                ></button>
                <div key={'swr_121' + key} className="dropdown-menu" aria-labelledby={"btnGroupDrop2" + key}>
                    {c_items}
                    <a className="dropdown-item" href="#" onClick={() => fn_requestToFollow()}>
                        {t('swarmCtrl:unfollow')}
                    </a>
                </div>
            </div>
            <div key={'swr_2' + key} className="row al_l css_margin_zero">
                <div key={'swr_21' + key} className={'col-12 padding_zero text-warning ' + v_swarm_class}>
                    <p
                        key={'swr_211' + key}
                        className={'si-07x css_margin_zero user-select-none text-success ' + v_class_follower}
                        title={t('swarmCtrl:followingTitle')}
                    >
                        <i className="bi bi-chevron-double-right text-success"></i> {' ' + v_leader_title_follower}
                    </p>
                    <ClssCtrlSWARMFormation
                        key={'swr_212' + key}
                        p_editable={false}
                        p_formation_as_leader={formationAsFollower}
                    />
                    <ClssCtrlSWARMFormation
                        key={'swr_213' + key}
                        p_editable={true}
                        p_hidden={!isLeader}
                        p_formation_as_leader={formationAsLeader}
                        OnFormationChanged={fn_handleFormationChange}
                    />
                </div>
            </div>
        </div>
    );
}

export default withTranslation('swarmCtrl')(ClssCtrlSWARM);
