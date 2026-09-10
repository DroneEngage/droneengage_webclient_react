import React, { useState, useEffect, useCallback } from 'react';
import { js_andruavAuth } from '../../js/protocol/auth/js_andruav_auth.js';

// Dark-theme-aware input style: ensures text is visible on dark background.
// Bootstrap form-control defaults to white background which makes
// txt-theme-aware (white) text invisible.
const inputStyle = {
    backgroundColor: 'var(--bs-body-bg, #222)',
    color: 'var(--bs-body-color, #fff)',
    borderColor: 'var(--bs-border-color, #495057)',
};

// Modal wrapper style: the fixed-top header has a high z-index, so the
// modal must sit above it.
const modalStyle = { zIndex: 3000 };
const backdropStyle = { zIndex: 2999 };

/**
 * Team Admin component — manage users (logins) within the caller's own team.
 *
 * Shows:
 *   - Read-only team info card (TeamID, TeamName, Email, InstanceLimit, Enabled)
 *   - Users table (LoginName, Permissions, IsAdmin, Actions: Edit/Delete)
 *   - Add/Edit modal (LoginID, AccessCode, Permissions, IsAdmin)
 *
 * All operations are scoped to the caller's TeamID by the server; the
 * webclient never sends a TeamID — it is derived from the session.
 */
const ClssTeamAdmin = ({ onLogout }) => {
    const [teamInfo, setTeamInfo] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false); // false = add, true = edit
    const [formData, setFormData] = useState({
        loginName: '',
        accessCode: '',
        permissions: '0xffffffff',
        isAdmin: false,
    });
    const [saving, setSaving] = useState(false);

    // Delete confirm state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // ── Data loading ──────────────────────────────────────────────────
    const loadTeamInfo = useCallback(async () => {
        const res = await js_andruavAuth.fn_getTeamInfo();
        if (res.ok) {
            setTeamInfo(res.data);
        } else {
            setError(res.errorMessage || 'Failed to load team info');
        }
    }, []);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        const res = await js_andruavAuth.fn_listTeamUsers();
        if (res.ok) {
            setUsers(res.data || []);
        } else {
            setError(res.errorMessage || 'Failed to load users');
        }
        setLoading(false);
    }, []);

    const loadAll = useCallback(() => {
        loadTeamInfo();
        loadUsers();
    }, [loadTeamInfo, loadUsers]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // ── Helpers ───────────────────────────────────────────────────────
    const regenerateAccessCode = () => {
        const chars = '0123456789abcdef';
        let code = '';
        for (let i = 0; i < 12; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        setFormData((prev) => ({ ...prev, accessCode: code }));
    };

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    // ── Add/Edit modal ────────────────────────────────────────────────
    const openAddModal = () => {
        setEditMode(false);
        setFormData({
            loginName: '',
            accessCode: '',
            permissions: '0xffffffff',
            isAdmin: false,
        });
        setModalOpen(true);
        clearMessages();
    };

    const openEditModal = (user) => {
        setEditMode(true);
        setFormData({
            loginName: user.LoginName,
            accessCode: '',
            permissions: user.Permissions || '0xffffffff',
            isAdmin: user.IsAdmin === true,
        });
        setModalOpen(true);
        clearMessages();
    };

    const closeModal = () => {
        setModalOpen(false);
        setSaving(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        clearMessages();
        setSaving(true);

        if (!formData.loginName.trim()) {
            setError('Login name is required.');
            setSaving(false);
            return;
        }

        // Validate permission hex
        if (!/^0x[0-9a-fA-F]{8}$/.test(formData.permissions)) {
            setError('Permissions must be a hex string like 0xffffffff.');
            setSaving(false);
            return;
        }

        const accessCode = formData.accessCode.trim() || null;

        try {
            if (editMode) {
                const res = await js_andruavAuth.fn_updateTeamUser(
                    formData.loginName,
                    formData.permissions,
                    formData.isAdmin,
                    accessCode
                );
                if (res.ok) {
                    setSuccess(res.accessCode
                        ? 'User updated. New access code: ' + res.accessCode
                        : 'User updated successfully.');
                    closeModal();
                } else {
                    setError(res.errorMessage || 'Failed to update user');
                }
            } else {
                const res = await js_andruavAuth.fn_addTeamUser(
                    formData.loginName,
                    formData.permissions,
                    formData.isAdmin,
                    accessCode
                );
                if (res.ok) {
                    setSuccess(res.accessCode
                        ? 'User created. Access code: ' + res.accessCode
                        : 'User created successfully.');
                    closeModal();
                } else {
                    setError(res.errorMessage || 'Failed to create user');
                }
            }
            loadUsers();
        } catch (err) {
            setError('Error: ' + (err.message || 'Unknown error'));
        }
        setSaving(false);
    };

    // ── Delete ────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        clearMessages();
        const res = await js_andruavAuth.fn_deleteTeamUser(deleteTarget.LoginName);
        if (res.ok) {
            setSuccess('User deleted successfully.');
            setDeleteTarget(null);
            loadUsers();
        } else {
            setError(res.errorMessage || 'Failed to delete user');
        }
        setDeleting(false);
    };

    // ── Filter ───────────────────────────────────────────────────────
    const filteredUsers = users.filter((u) =>
        (u.LoginName || '').toLowerCase().includes(filter.toLowerCase())
    );

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div>
            {/* Header bar */}
            <div className="d-flex justify-content-between align-items-center mb-4 ms-4">
                <div>
                    <h2 className="mb-1 txt-theme-aware">
                        <i className="bi bi-people-fill me-2 text-primary"></i>
                        Team Administration
                    </h2>
                    {teamInfo && (
                        <p className="text-muted mb-0">
                            Managing users for team: <strong>{teamInfo.TeamName || 'N/A'}</strong>
                        </p>
                    )}
                </div>
                <div>
                    <button className="btn btn-outline-danger btn-sm me-2" onClick={onLogout}>
                        <i className="bi bi-box-arrow-right me-1"></i> Logout
                    </button>
                    <button className="btn btn-outline-primary btn-sm" onClick={loadAll}>
                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-circle me-1"></i> {error}
                </div>
            )}
            {success && (
                <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle me-1"></i> {success}
                </div>
            )}

            {/* Team info card (read-only) */}
            {teamInfo && (
                <div className="card mb-4 txt-theme-aware-bg" style={{ border: '1px solid var(--bs-border-color, #495057)' }}>
                    <div className="card-header txt-theme-aware-bg" style={{ borderBottom: '1px solid var(--bs-border-color, #495057)' }}>
                        <h5 className="mb-0 txt-theme-aware">
                            <i className="bi bi-info-circle me-2"></i>Team Information
                        </h5>
                    </div>
                    <div className="card-body txt-theme-aware-bg">
                        <div className="row">
                            <div className="col-md-3 mb-2">
                                <small className="text-muted d-block">Team ID</small>
                                <strong className="txt-theme-aware">{teamInfo.TeamID}</strong>
                            </div>
                            <div className="col-md-4 mb-2">
                                <small className="text-muted d-block">Email</small>
                                <strong className="txt-theme-aware">{teamInfo.Email || 'N/A'}</strong>
                            </div>
                            <div className="col-md-3 mb-2">
                                <small className="text-muted d-block">Instance Limit</small>
                                <strong className="txt-theme-aware">{teamInfo.InstanceLimit ?? 'N/A'}</strong>
                            </div>
                            <div className="col-md-2 mb-2">
                                <small className="text-muted d-block">Enabled</small>
                                {teamInfo.Enabled ? (
                                    <span className="badge bg-success">Yes</span>
                                ) : (
                                    <span className="badge bg-secondary">No</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users card */}
            <div className="card txt-theme-aware-bg" style={{ border: '1px solid var(--bs-border-color, #495057)' }}>
                <div className="card-header d-flex justify-content-between align-items-center txt-theme-aware-bg" style={{ borderBottom: '1px solid var(--bs-border-color, #495057)' }}>
                    <h5 className="mb-0 txt-theme-aware">
                        Users <span className="badge bg-secondary">{users.length}</span>
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            style={{ width: '200px', ...inputStyle }}
                            placeholder="Filter by login name..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                        <button className="btn btn-sm btn-primary" onClick={openAddModal}>
                            <i className="bi bi-plus-circle me-1"></i> Add New User
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="alert alert-info text-center">
                            No users found. Click "Add New User" to create one.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover txt-theme-aware">
                                <thead>
                                    <tr>
                                        <th className="txt-theme-aware">Login Name</th>
                                        <th className="txt-theme-aware">Permissions</th>
                                        <th className="txt-theme-aware">Role</th>
                                        <th className="txt-theme-aware" style={{ width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => {
                                        const isSelf = user.LoginName === js_andruavAuth.m_username;
                                        return (
                                        <tr key={user.LoginID || user.LoginName}>
                                            <td className="txt-theme-aware">
                                                {user.LoginName}
                                                {isSelf && (
                                                    <span className="badge bg-info ms-2">You</span>
                                                )}
                                            </td>
                                            <td className="txt-theme-aware">{user.Permissions || 'N/A'}</td>
                                            <td>
                                                <span className="badge" style={{ minWidth: '60px', backgroundColor: user.IsAdmin ? 'var(--bs-warning, #ffc107)' : 'var(--bs-primary, #0d6efd)', color: user.IsAdmin ? '#000' : '#fff' }}>
                                                    {user.IsAdmin ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-1"
                                                    onClick={() => openEditModal(user)}
                                                    title="Edit user"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                {!isSelf && (
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => setDeleteTarget(user)}
                                                        title="Delete user"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <>
                    <div className="modal-backdrop fade show" style={backdropStyle} onClick={closeModal}></div>
                    <div className="modal d-block" tabIndex="-1" style={modalStyle}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content txt-theme-aware-bg" style={{ border: '1px solid var(--bs-border-color, #495057)' }}>
                                <div className="modal-header txt-theme-aware-bg" style={{ borderBottom: '1px solid var(--bs-border-color, #495057)' }}>
                                    <h5 className="modal-title txt-theme-aware">
                                        {editMode ? 'Edit User' : 'Add New User'}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={closeModal}></button>
                                </div>
                                <form onSubmit={handleSave}>
                                    <div className="modal-body txt-theme-aware-bg">
                                        <div className="mb-3">
                                            <label className="form-label text-muted">Login Name (Email)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                style={inputStyle}
                                                value={formData.loginName}
                                                onChange={(e) => setFormData({ ...formData, loginName: e.target.value })}
                                                disabled={editMode}
                                                required
                                                placeholder="user@example.com"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label text-muted">
                                                Access Code {editMode ? '(leave empty to keep current)' : '(leave empty to auto-generate)'}
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    style={inputStyle}
                                                    value={formData.accessCode}
                                                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                                                    placeholder={editMode ? 'Enter new code to change' : 'Auto-generated if empty'}
                                                />
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={regenerateAccessCode}
                                                >
                                                    <i className="bi bi-arrow-repeat"></i> Generate
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label text-muted">Permissions (hex)</label>
                                            {/* TODO: Replace raw hex input with checkboxes for account-type bits:
                                                bit 31 (0x80000000) = GCS login, bit 30 (0x40000000) = unit login.
                                                See CONST_ALLOW_GCS_LOGIN / CONST_ALLOW_UNIT_LOGIN in js_andruavMessages.js. */}
                                            <input
                                                type="text"
                                                className="form-control"
                                                style={inputStyle}
                                                value={formData.permissions}
                                                onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                                                required
                                                placeholder="0xffffffff"
                                            />
                                            <small className="text-muted">e.g., 0xffffffff for full permissions</small>
                                        </div>
                                        <div className="mb-3 form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="isAdminCheckbox"
                                                checked={formData.isAdmin}
                                                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                            />
                                            <label className="form-check-label text-muted" htmlFor="isAdminCheckbox">
                                                Is Admin
                                            </label>
                                        </div>
                                    </div>
                                    <div className="modal-footer txt-theme-aware-bg" style={{ borderTop: '1px solid var(--bs-border-color, #495057)' }}>
                                        <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={saving}>
                                            {saving ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-1"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-lg me-1"></i> Save
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <>
                    <div className="modal-backdrop fade show" style={backdropStyle} onClick={() => setDeleteTarget(null)}></div>
                    <div className="modal d-block" tabIndex="-1" style={modalStyle}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content txt-theme-aware-bg" style={{ border: '1px solid var(--bs-border-color, #495057)' }}>
                                <div className="modal-header txt-theme-aware-bg" style={{ borderBottom: '1px solid var(--bs-border-color, #495057)' }}>
                                    <h5 className="modal-title txt-theme-aware">Confirm Delete</h5>
                                    <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)}></button>
                                </div>
                                <div className="modal-body txt-theme-aware-bg">
                                    <p className="txt-theme-aware">
                                        Are you sure you want to delete user <strong>{deleteTarget.LoginName}</strong>?
                                    </p>
                                    <p className="text-muted">
                                        This action cannot be undone.
                                    </p>
                                </div>
                                <div className="modal-footer txt-theme-aware-bg" style={{ borderTop: '1px solid var(--bs-border-color, #495057)' }}>
                                    <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                                        {deleting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1"></span>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-trash me-1"></i> Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ClssTeamAdmin;
