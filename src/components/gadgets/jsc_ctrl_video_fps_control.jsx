import React, { useState, useCallback } from 'react';
import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import { useEventSubscription } from '../../js/hooks/useEventSubscription.js'

/**
 * fps is ephemeral event-payload data (EE_onWebRTC_Video_Statistics carries
 * {unit, fps, track_id}), not a field stored on the unit object, so it is
 * not a useUnitField candidate - it stays as local state fed directly by
 * the (leak-proof) event subscription.
 */
function ClssCtrlVideoFPS({ id, className, title, p_unit, track_id }) {
    const [actualFps, setActualFps] = useState(0);
    const [tick, setTick] = useState(0);

    const key = useState(() => Math.random().toString())[0];

    const onVideoStatistics = useCallback((p_obj) => {
        // {'unit':,'fps':, 'rx':bytesReceived}
        if ((p_unit.getPartyID() !== p_obj.unit.getPartyID()) || (track_id !== p_obj.track_id)) return;
        setActualFps(p_obj.fps);
        setTick((t) => t + 1);
    }, [p_unit, track_id]);

    useEventSubscription(js_event.EE_onWebRTC_Video_Statistics, onVideoStatistics);

    let css_Track = ' txt-theme-aware ';
    let css_Track_title = title ? title : 'video fps';

    if (isNaN(actualFps))
    {
        css_Track = ' d-none ';
    }

    return (
            <i
            id={id ? id : key}
            key={key}
            className={css_Track + " css_large_icon " + className}
            title={css_Track_title}
                >
                <span style={{ fontFamily: 'monospace', display: 'inline-block', width: '3ch', textAlign: 'right' }}>{Math.max(0, parseInt(actualFps) || 0)}</span>
                {tick % 2 === 0 ? (
                    <span className="text-success">.</span>
                ) : (
                    <span className="text-secondary">.</span>
                )}
                {` fps`}
                </i>
        );
}

export default ClssCtrlVideoFPS;
