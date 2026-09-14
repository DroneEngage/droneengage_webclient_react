import React, { useState, useCallback, useEffect } from 'react';
import * as js_session from '../../js/state/session.js';

import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages.js'
import { js_andruavAuth } from '../../js/protocol/auth/js_andruav_auth.js'
import { useUnitField } from '../../js/hooks/useUnitField.js'


/**
 * Precision-landing status panel — the reactive content embedded inside
 * the floating <ClssPreclandDialog>. Renders the de_precland state badge
 * (DISABLED / SEARCHING / LOCKED / DEGRADED / ERROR) plus the
 * landing-safety details: slant range, fused tag count, reprojection
 * RMSE, fps (with a heartbeat dot like ClssCtrlVideoFPS), and the gate
 * reason text. The enable/disable + self-test controls are gated by
 * js_andruavAuth.fn_do_canTracking() (view mode and missing
 * CONST_ALLOW_TRACKING hide the controls).
 *
 * T7: Camera calibration requires fn_do_canConfig() (CONFIG permission),
 *     is disabled while armed or flying, shows a confirmation dialog,
 *     requires an explicitly entered square size, labels cols/rows as
 *     "inner corners", and has a Cancel button during capture.
 *
 * All fields are unit fields read through useUnitField, so this panel
 * re-renders on every PRECLAND_STATUS update without manual event
 * subscriptions.
 */
function ClssPreclandStatusPanel({ p_unit }) {
    const partyId = p_unit && p_unit.getPartyID ? p_unit.getPartyID() : undefined;
    const hasFeedback = useUnitField(partyId, 'm_precland.m_valid_unit_feedback');
    const state = useUnitField(partyId, 'm_precland.m_state');
    const enabled = useUnitField(partyId, 'm_precland.m_enabled');
    const fps = useUnitField(partyId, 'm_precland.m_fps');
    const rmsePx = useUnitField(partyId, 'm_precland.m_rmse_px');
    const rangeM = useUnitField(partyId, 'm_precland.m_range_m');
    const tagIds = useUnitField(partyId, 'm_precland.m_tag_ids');
    const reason = useUnitField(partyId, 'm_precland.m_reason');
    const calibStatus = useUnitField(partyId, 'm_precland.m_calib_status');
    const calibViewsCap = useUnitField(partyId, 'm_precland.m_calib_views_cap');
    const calibViewsTotal = useUnitField(partyId, 'm_precland.m_calib_views_total');
    const calibRms = useUnitField(partyId, 'm_precland.m_calib_rms');

    // T7: armed/flying guard — calibration is blocked while armed or flying.
    const isArmed = p_unit && p_unit.m_isArmed === true;
    const isFlying = p_unit && p_unit.m_isFlying === true;
    const isArmedOrFlying = isArmed || isFlying;

    // Heartbeat tick: toggles on every fps update so the dot blinks like
    // ClssCtrlVideoFPS, showing the precland status stream is live.
    const [tick, setTick] = useState(0);
    useEffect(() => {
        if (fps == null) return;
        setTick((t) => t + 1);
    }, [fps]);

    // T7: Calibration form state — square size is empty by default and required.
    const [calibCols, setCalibCols] = useState(9);
    const [calibRows, setCalibRows] = useState(6);
    const [calibSquare, setCalibSquare] = useState('');
    const [calibViews, setCalibViews] = useState(20);
    const [showConfirm, setShowConfirm] = useState(false);
    const [calibExpanded, setCalibExpanded] = useState(false);

    const canControl = js_andruavAuth.fn_do_canTracking();
    const canConfig = js_andruavAuth.fn_do_canConfig();

    // T7: calibration requires CONFIG permission in addition to the
    // armed/flying guard and a valid square size.
    const calibSquareNum = parseFloat(calibSquare);
    const calibSquareValid = !isNaN(calibSquareNum) && calibSquareNum > 0;
    const canCalibrate = canControl === true && canConfig === true
                        && !isArmedOrFlying && calibSquareValid
                        && !(enabled === true);

    const fnl_preclandOnOff = useCallback(() => {
        if (canControl !== true) return;
        js_session.fn_getAndruavFacade().API_PrecisionLanding(p_unit, !(enabled === true));
    }, [p_unit, enabled, canControl]);

    const fnl_preclandSelfTest = useCallback(() => {
        if (canControl !== true) return;
        js_session.fn_getAndruavFacade().API_PrecisionLandingSelfTest(p_unit);
    }, [p_unit, canControl]);

    const fnl_preclandCalibrateConfirm = useCallback(() => {
        if (!canCalibrate) return;
        setShowConfirm(true);
    }, [canCalibrate]);

    const fnl_preclandCalibrate = useCallback(() => {
        setShowConfirm(false);
        if (!canCalibrate) return;
        js_session.fn_getAndruavFacade().API_PrecisionLandingCalibrate(p_unit, {
            cols: parseInt(calibCols) || 9,
            rows: parseInt(calibRows) || 6,
            square_size_m: calibSquareNum,
            views: parseInt(calibViews) || 20,
        });
    }, [p_unit, canCalibrate, calibCols, calibRows, calibSquareNum, calibViews]);

    const fnl_preclandCalibrateCancel = useCallback(() => {
        js_session.fn_getAndruavFacade().API_PrecisionLandingCalibrateCancel(p_unit);
    }, [p_unit]);

    if (p_unit === null || p_unit === undefined) return null;
    if (!p_unit.m_modules.has_precision_landing) return null;

    let css_state = ' txt-theme-aware ';
    let state_text = 'DISABLED';
    switch (state)
    {
        case js_andruavMessages.CONST_PRECLAND_STATUS_SEARCHING:
            css_state = ' text-info ';
            state_text = 'SEARCHING';
            break;
        case js_andruavMessages.CONST_PRECLAND_STATUS_LOCKED:
            css_state = ' bg-success text-white fw-bold ';
            state_text = 'LOCKED';
            break;
        case js_andruavMessages.CONST_PRECLAND_STATUS_DEGRADED:
            css_state = ' bg-warning text-dark fw-bold ';
            state_text = 'DEGRADED';
            break;
        case js_andruavMessages.CONST_PRECLAND_STATUS_ERROR:
            css_state = ' bg-danger text-white fw-bold ';
            state_text = 'ERROR';
            break;
        default:
            state_text = (hasFeedback === true) ? 'DISABLED' : 'N/A';
            break;
    }

    const tag_count = (tagIds != null) ? tagIds.length : 0;
    const range_text = (rangeM != null) ? rangeM.toFixed(1) + ' m' : '--';
    const rmse_text = (rmsePx != null) ? rmsePx.toFixed(2) + ' px' : '--';
    const fps_text = (fps != null) ? Math.max(0, parseInt(fps) || 0) : null;
    const reason_text = (reason != null)
        ? (js_andruavMessages.CONST_PRECLAND_REASON_NAMES[reason] || ('code ' + reason))
        : null;

    const isCalibrating = (calibStatus === js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_CAPTURING ||
                          calibStatus === js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_COMPUTING);

    return (
        <div className="precland-status-panel">
            <div className="d-flex align-items-center mb-2">
                <span className={"badge fs-6 bi bi-bullseye " + css_state}>{state_text}</span>
            </div>
            <div className="small">
                <div className="d-flex justify-content-between">
                    <span>Range:</span>
                    <span style={{ fontFamily: 'monospace' }}>{range_text}</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span>Tags:</span>
                    <span style={{ fontFamily: 'monospace' }}>{tag_count}{(tag_count > 0) ? ' [' + tagIds.join(', ') + ']' : ''}</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span>RMSE:</span>
                    <span style={{ fontFamily: 'monospace' }}>{rmse_text}</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span>FPS:</span>
                    <span style={{ fontFamily: 'monospace' }}>
                        {(fps_text != null)
                            ? <span style={{ display: 'inline-block', width: '3ch', textAlign: 'right' }}>{fps_text}</span>
                            : '--'}
                        {(fps_text != null) && (tick % 2 === 0
                            ? <span className="text-success">.</span>
                            : <span className="text-secondary">.</span>
                        )}{(fps_text != null) ? ' fps' : ''}
                    </span>
                </div>
                <div className="text-danger mt-1" style={{ visibility: ((reason_text != null) && (reason !== js_andruavMessages.CONST_PRECLAND_REASON_NOMINAL)) ? 'visible' : 'hidden' }}>
                    Reason: {(reason_text != null) ? reason_text : ' '}
                </div>
            </div>
            {(canControl === true) &&
                <div className="d-flex gap-2 mt-3">
                    <button type="button" className={"btn btn-sm flex-fill " + ((enabled === true) ? "btn-warning" : "btn-success")} onClick={(e) => fnl_preclandOnOff(e)}>
                        {(enabled === true) ? 'Disable' : 'Enable'}
                    </button>
                    <button type="button" className="btn btn-sm flex-fill btn-secondary" onClick={(e) => fnl_preclandSelfTest(e)}>Self-Test</button>
                </div>
            }

            {/* Camera calibration section — T7: requires CONFIG permission */}
            {(canControl === true && canConfig === true) &&
                <div className="mt-3 border-top pt-2">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="text-warning small fw-bold">Camera Calibration</span>
                        <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-warning"
                            onClick={() => setCalibExpanded(!calibExpanded)}
                            title={calibExpanded ? 'Hide camera calibration' : 'Show camera calibration'}
                        >
                            <i className={'bi ' + (calibExpanded ? 'bi-chevron-up' : 'bi-chevron-down')} />
                        </button>
                    </div>

                    {calibExpanded && <div>
                    {/* T7: armed/flying guard warning */}
                    {isArmedOrFlying &&
                        <div className="text-danger small mb-1">
                            <i className="bi bi-exclamation-triangle me-1" />
                            Disable precision landing and disarm first.
                        </div>
                    }

                    {/* T7: enabled guard warning */}
                    {(enabled === true && !isArmedOrFlying) &&
                        <div className="text-warning small mb-1">
                            <i className="bi bi-exclamation-triangle me-1" />
                            Disable precision landing before calibrating.
                        </div>
                    }

                    {/* Calibration progress / result */}
                    {(calibStatus != null && calibStatus !== js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_IDLE) &&
                        <div className="small mb-2">
                            <div className="d-flex justify-content-between">
                                <span>Status:</span>
                                <span className={
                                    (calibStatus === js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_DONE) ? 'text-success fw-bold' :
                                    (calibStatus === js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_FAILED) ? 'text-danger fw-bold' :
                                    'text-info'
                                }>
                                    {js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_NAMES[calibStatus] || ('code ' + calibStatus)}
                                </span>
                            </div>
                            {isCalibrating &&
                                <div className="d-flex justify-content-between">
                                    <span>Views:</span>
                                    <span style={{ fontFamily: 'monospace' }}>
                                        {calibViewsCap != null ? calibViewsCap : 0} / {calibViewsTotal != null ? calibViewsTotal : 0}
                                    </span>
                                </div>
                            }
                            {(calibStatus === js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_DONE && calibRms != null) &&
                                <div className="d-flex justify-content-between">
                                    <span>RMS:</span>
                                    <span style={{ fontFamily: 'monospace' }} className="text-success">{calibRms.toFixed(3)} px</span>
                                </div>
                            }
                        </div>
                    }

                    {/* T7: Cancel button during capture */}
                    {isCalibrating &&
                        <div className="d-flex mt-1">
                            <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={(e) => fnl_preclandCalibrateCancel(e)}>
                                <i className="bi bi-x-circle me-1" />Cancel Calibration
                            </button>
                        </div>
                    }

                    {/* T7: Confirmation dialog */}
                    {showConfirm &&
                        <div className="alert alert-warning small mt-2 mb-1">
                            <div className="fw-bold mb-1">Confirm Calibration</div>
                            <div className="mb-2">
                                This overwrites this aircraft camera calibration.
                                Ensure the correct chessboard is in view and the
                                camera is not moving.
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-sm btn-danger flex-fill" onClick={(e) => fnl_preclandCalibrate(e)}>
                                    Calibrate
                                </button>
                                <button type="button" className="btn btn-sm btn-secondary flex-fill" onClick={(e) => setShowConfirm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    }

                    {/* Calibration form — hidden while calibration is running or confirming */}
                    {!isCalibrating && !showConfirm &&
                        (calibStatus == null || calibStatus === js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_IDLE ||
                          calibStatus === js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_DONE ||
                          calibStatus === js_andruavMessages.CONST_PRECLAND_CALIB_STATUS_FAILED) &&
                        <div className="small">
                            <div className="row g-1 mb-1">
                                <div className="col-6">
                                    {/* T7: labels say "inner corners" */}
                                    <label className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Inner Cols</label>
                                    <input type="number" className="form-control form-control-sm" value={calibCols} onChange={(e) => setCalibCols(e.target.value)} min={2} max={20} />
                                </div>
                                <div className="col-6">
                                    <label className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Inner Rows</label>
                                    <input type="number" className="form-control form-control-sm" value={calibRows} onChange={(e) => setCalibRows(e.target.value)} min={2} max={20} />
                                </div>
                            </div>
                            <div className="row g-1 mb-1">
                                <div className="col-6">
                                    {/* T7: square size is empty by default and required */}
                                    <label className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                                        Square size (m) <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number" step="0.001" className="form-control form-control-sm"
                                        value={calibSquare} onChange={(e) => setCalibSquare(e.target.value)}
                                        placeholder="measure it" min={0.001}
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Views</label>
                                    <input type="number" className="form-control form-control-sm" value={calibViews} onChange={(e) => setCalibViews(e.target.value)} min={3} max={100} />
                                </div>
                            </div>
                            <div className="d-flex mt-1">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger w-100"
                                    onClick={(e) => fnl_preclandCalibrateConfirm(e)}
                                    disabled={!canCalibrate}
                                >
                                    <i className="bi bi-camera me-1" />Calibrate
                                </button>
                            </div>
                            <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                                Measure the printed chessboard square. Move the board between captures.
                            </div>
                        </div>
                    }
                    </div>}
                </div>
            }

            {/* T7: show a note if the user has tracking but not config permission */}
            {(canControl === true && canConfig !== true) &&
                <div className="mt-3 border-top pt-2">
                    <div className="text-warning small fw-bold mb-1">Camera Calibration</div>
                    <div className="text-muted small" style={{ fontSize: '0.65rem' }}>
                        Calibration requires CONFIG permission.
                    </div>
                </div>
            }
        </div>
    );
}

export default ClssPreclandStatusPanel;
