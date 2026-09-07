import React from 'react';
import { createPortal } from 'react-dom';
import { useMapPopup } from '../../js/hooks/useMapPopup.js';
import { ClssMainContextMenu } from './jsc_main_context_menu.jsx';
import { ClssWaypointStepContextMenu } from './jsc_waypoint_step_content_menu.jsx';
import ClssMainUnitPopup from './jsc_main_unit_popup.jsx';

/**
 * Renders the active map popup through `createPortal` into the DOM node
 * the map adapter gave back (stored in `mapPopupService`).  Because this
 * component is mounted inside the i18n/theme provider tree, the popup
 * content has access to translations, theme, and React event handlers —
 * none of which worked under the old detached-root + innerHTML
 * `innerHTML` approach.
 *
 * The host renders nothing when no popup is open.  When a popup is open
 * it portals the appropriate component (selected by `kind`) into the
 * popup's content element.
 */
function MapPopupContent({ kind, ...props }) {
    switch (kind) {
        case 'context-menu':
            return <ClssMainContextMenu {...props} />;
        case 'mission-item':
            return <ClssWaypointStepContextMenu {...props} />;
        case 'unit-popup':
            return <ClssMainUnitPopup {...props} />;
        default:
            return null;
    }
}

export default function MapPopupHost() {
    const popup = useMapPopup();
    if (!popup || !popup.containerEl) return null;
    return createPortal(
        <MapPopupContent kind={popup.kind} {...popup.props} />,
        popup.containerEl
    );
}
