import React from 'react';
import * as js_session from '../../js/state/session.js';
import { withTranslation } from 'react-i18next';

import { js_dialogs } from '../../js/app/dialogService.js'


/**
 * Gimbal/viewlink control icon. Purely prop-driven (has_viewlink comes
 * straight off p_unit.m_modules on every parent render) - the original
 * class subscribed to no events and its m_update/m_flag_mounted state was
 * dead weight, so this is a plain function component with no hooks.
 */
function ClssCtrlViewlinkControl({ id, className, p_unit, t }) {
    const gimbalModeLabels = [t('gimbal_control_disabled'), t('gimbal_control_enabled')];
    const gimbalModeIcons = [
        "bi bi-binoculars cursor_hand css_large_icon text-muted",
        "bi bi-binoculars-fill cursor_hand css_large_icon text-success"
    ];

    const hasViewlink = p_unit && p_unit.m_modules && (p_unit.m_modules.has_viewlink === true);
    const gimbalModeIndex = hasViewlink ? 1 : 0;

    const fnl_showLaserControl = (e) => {
        const andruavUnit = js_session.fn_getAndruavUnitList().fn_getUnit(p_unit.getPartyID());
        if (andruavUnit == null) {
            return;
        }

        e.preventDefault();

        js_dialogs.fn_showViewLinkGimbal({
            m_unit: andruavUnit
        });
    };

    return (
        <i
            id={id ? id : "btn_viewlink_control"}
            className={gimbalModeIcons[gimbalModeIndex] + " css_large_icon " + (className ? className : "") + (hasViewlink ? "" : " disabled text-muted")}
            alt={gimbalModeLabels[gimbalModeIndex]}
            title={gimbalModeLabels[gimbalModeIndex]}
            onClick={hasViewlink ? fnl_showLaserControl : undefined}
        ></i>
    );
}

export default withTranslation()(ClssCtrlViewlinkControl);
