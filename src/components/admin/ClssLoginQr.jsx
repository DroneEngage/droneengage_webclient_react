import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { js_andruavAuth } from '../../js/protocol/auth/js_andruav_auth.js';
import { js_localStorage } from '../../js/state/js_localStorage.js';

/**
 * Renders a login QR code for the DroneEngage Android app.
 *
 * The QR encodes a versioned JSON payload consumed by the app's scanner:
 *   {v:1, t:"de_login", acc, pwd, ah, ap, gr}
 *   acc/pwd — login credentials (agent login /agent/al)
 *   ah/ap   — auth server host/port (supports private servers)
 *   gr      — group name (optional)
 *
 * The comm server is deliberately absent: it is assigned by the auth
 * server in the login reply.
 */
const ClssLoginQr = ({ loginName, accessCode }) => {
    const [dataUrl, setDataUrl] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loginName || !accessCode) {
            setDataUrl('');
            return;
        }

        const v_port = parseInt(js_andruavAuth._m_auth_port, 10);
        const payload = {
            v: 1,
            t: 'de_login',
            acc: loginName,
            pwd: accessCode,
            ah: js_andruavAuth.m_auth_ip,
            ap: Number.isFinite(v_port) ? v_port : js_andruavAuth._m_auth_port,
            gr: js_localStorage.fn_getGroupName() || undefined,
        };

        QRCode.toDataURL(JSON.stringify(payload), { errorCorrectionLevel: 'M', margin: 2, width: 256 })
            .then(setDataUrl)
            .catch(() => setError('Failed to generate QR code.'));
    }, [loginName, accessCode]);

    if (!loginName || !accessCode) return null;
    if (error) return <div className="text-danger small">{error}</div>;

    return (
        <div className="d-flex flex-column align-items-start gap-2 mt-2">
            <div className="p-2 rounded" style={{ backgroundColor: '#fff' }}>
                {dataUrl
                    ? <img src={dataUrl} alt={`Login QR for ${loginName}`} width={256} height={256} />
                    : <div className="spinner-border spinner-border-sm" role="status"></div>}
            </div>
            <small className="text-muted">
                Scan with the DroneEngage Android app to log in as <strong>{loginName}</strong>.
            </small>
        </div>
    );
};

export default ClssLoginQr;
