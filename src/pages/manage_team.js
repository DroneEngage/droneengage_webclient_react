import React, { useState } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';

import '../css/bootstrap-icons/font/bootstrap-icons.css';
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_header_responsive.css';

import { js_andruavAuth } from '../js/protocol/auth/js_andruav_auth.js';
import { js_localStorage } from '../js/state/js_localStorage.js';
import { EVENTS as js_event } from '../js/events/js_eventList.js';
import { useEventSubscription } from '../js/hooks/useEventSubscription.js';

import ClssHeaderControl from '../components/jsc_header';
import ClssFooterControl from '../components/jsc_footer';
import ClssTeamAdmin from '../components/admin/jsc_team_admin.jsx';

/**
 * Account Admin page.
 *
 * Flow:
 *  1. If not logged in → show a login form (email + access code).
 *  2. If logged in but not admin → show "no permission" message.
 *  3. If logged in as admin → show <ClssTeamAdmin />.
 *
 * Login uses js_andruavAuth.fn_do_loginAccount (the same /w/wl endpoint the
 * main webclient uses), but does NOT connect to the comm server websocket —
 * team admin only needs a valid auth session.
 */
const AccountAdmin = () => {
    useTranslation('home');
    const [authState, setAuthState] = useState({
        loggedIn: js_andruavAuth.fn_logined(),
        isAdmin: js_andruavAuth.fn_isTeamAdmin(),
    });
    const [loginName, setLoginName] = useState(js_localStorage.fn_getLoginName() || '');
    const [accessCode, setAccessCode] = useState(js_localStorage.fn_getAccessCode() || '');
    const [loginMessage, setLoginMessage] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    // Listen for auth events to update the page state.
    useEventSubscription(js_event.EE_Auth_Logined, () => {
        setIsConnecting(false);
        setAuthState({
            loggedIn: true,
            isAdmin: js_andruavAuth.fn_isTeamAdmin(),
        });
        setLoginMessage('');
    });

    useEventSubscription(js_event.EE_Auth_BAD_Logined, (data) => {
        setIsConnecting(false);
        const msg = data && data.em ? data.em : 'Login failed';
        setLoginMessage('Login Error: ' + msg);
    });

    useEventSubscription(js_event.EE_Auth_Login_In_Progress, () => {
        setIsConnecting(true);
        setLoginMessage('Connecting...');
    });

    useEventSubscription(js_event.EE_Auth_Logout_Completed, () => {
        setAuthState({ loggedIn: false, isAdmin: false });
        setLoginMessage('');
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginName.trim() || !accessCode.trim()) {
            setLoginMessage('Please enter both email and access code.');
            return;
        }
        js_localStorage.fn_setLoginName(loginName.trim());
        js_localStorage.fn_setAccessCode(accessCode.trim());
        // fn_do_loginAccount dispatches EE_Auth_Logined / EE_Auth_BAD_Logined
        // which our event subscriptions above will catch.
        js_andruavAuth.fn_do_loginAccount(loginName.trim(), accessCode.trim());
    };

    const handleLogout = async () => {
        await js_andruavAuth.fn_do_logoutAccount();
        setAuthState({ loggedIn: false, isAdmin: false });
    };

    // ── Login form ──────────────────────────────────────────────────────
    if (!authState.loggedIn) {
        return (
            <div className="d-flex flex-column min-vh-100">
                <div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">
                    <ClssHeaderControl no_login no_layout_ctrl />
                </div>
                <div id="mainBody" className="row css_mainbody justify-content-center flex-grow-1 mb-4">
                    <div className="container">
                        <div className="row margin_zero container justify-content-center g-4">
                            <div className="col-12 col-md-8 col-lg-5">
                                <div className="card shadow-sm border-0 rounded_10px h-100 txt-theme-aware-bg">
                                    <div className="card-body p-4">
                                        <h5 className="card-title text-primary mb-3">
                                            <i className="bi bi-shield-lock me-2"></i>
                                            Team Admin Login
                                        </h5>
                                        {loginMessage && (
                                            <div className={`alert ${loginMessage.startsWith('Connecting') ? 'alert-info' : 'alert-danger'} text-center`} role="alert">
                                                {loginMessage}
                                            </div>
                                        )}
                                        <form onSubmit={handleLogin}>
                                            <div className="mb-3 al_l">
                                                <label htmlFor="adminLoginName" className="form-label txt-theme-aware">Email (LoginID)</label>
                                                <input
                                                    type="text"
                                                    id="adminLoginName"
                                                    className="form-control"
                                                    style={{ backgroundColor: 'var(--bs-body-bg, #222)', color: 'var(--bs-body-color, #fff)', borderColor: 'var(--bs-border-color, #495057)' }}
                                                    value={loginName}
                                                    onChange={(e) => setLoginName(e.target.value)}
                                                    disabled={isConnecting}
                                                    placeholder="Enter your email"
                                                />
                                            </div>
                                            <div className="mb-3 al_l">
                                                <label htmlFor="adminAccessCode" className="form-label txt-theme-aware">Access Code</label>
                                                <input
                                                    type="password"
                                                    id="adminAccessCode"
                                                    className="form-control"
                                                    style={{ backgroundColor: 'var(--bs-body-bg, #222)', color: 'var(--bs-body-color, #fff)', borderColor: 'var(--bs-border-color, #495057)' }}
                                                    value={accessCode}
                                                    onChange={(e) => setAccessCode(e.target.value)}
                                                    disabled={isConnecting}
                                                    placeholder="Enter your access code"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="btn btn-primary w-100"
                                                disabled={isConnecting}
                                            >
                                                {isConnecting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                        Connecting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-box-arrow-in-right me-1"></i> Login
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                        <p className="text-muted mt-3 mb-0 small">
                                            Login with your team admin account to manage users in your team.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="footer_div" className="row mt-0 me-0 mw-0 mb-0">
                    <ClssFooterControl />
                </div>
            </div>
        );
    }

    // ── Not an admin ────────────────────────────────────────────────────
    if (!authState.isAdmin) {
        return (
            <div className="d-flex flex-column min-vh-100">
                <div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">
                    <ClssHeaderControl no_login no_layout_ctrl />
                </div>
                <div id="mainBody" className="row css_mainbody justify-content-center flex-grow-1 mb-4">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-12 col-md-8 col-lg-6">
                                <div className="card shadow-sm border-0 rounded_10px txt-theme-aware-bg">
                                    <div className="card-body p-4 text-center">
                                        <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
                                        <h4 className="mt-3 text-warning">Admin Permission Required</h4>
                                        <p className="text-muted">
                                            You are logged in, but your account does not have admin privileges.
                                            Only team admins can manage users.
                                        </p>
                                        <button className="btn btn-outline-danger mt-3" onClick={handleLogout}>
                                            <i className="bi bi-box-arrow-right me-1"></i> Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="footer_div" className="row mt-0 me-0 mw-0 mb-0">
                    <ClssFooterControl />
                </div>
            </div>
        );
    }

    // ── Team admin UI ──────────────────────────────────────────────────
    return (
        <div className="d-flex flex-column min-vh-100">
            <div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">
                <ClssHeaderControl no_login no_layout_ctrl />
            </div>
            <div id="mainBody" className="row css_mainbody flex-grow-1 mb-4">
                <div className="container-fluid">
                    <ClssTeamAdmin onLogout={handleLogout} />
                </div>
            </div>
            <div id="footer_div" className="row mt-0 me-0 mw-0 mb-0">
                <ClssFooterControl />
            </div>
        </div>
    );
};

export default withTranslation('home')(AccountAdmin);
