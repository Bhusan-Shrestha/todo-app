'use client';

import { useState, useEffect } from 'react';
import { updateProfile, changePassword } from '../lib/api';

export default function SettingsModal({ user, isOpen, onClose, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [username, setUsername] = useState(user?.username || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setUsername(user.username || user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setSavingProfile(true);

    try {
      const res = await updateProfile({ username, email });
      setProfileMessage({ type: 'success', text: res.message || 'Profile updated successfully!' });
      if (onUserUpdated && res.user) {
        onUserUpdated(res.user);
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await changePassword({ currentPassword, newPassword, confirmNewPassword });
      setPasswordMessage({ type: 'success', text: res.message || 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">Account Settings</h2>
            <span className="modal-subtitle">Manage your profile, email, and security</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </div>

        <div className="settings-tabs">
          <button
            type="button"
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile &amp; Email
          </button>
          <button
            type="button"
            className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Password &amp; Security
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="settings-form">
              {profileMessage.text && (
                <div className={`settings-alert ${profileMessage.type}`}>
                  {profileMessage.text}
                </div>
              )}

              <div className="settings-field">
                <label htmlFor="settings-username">Username</label>
                <input
                  id="settings-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose your username"
                />
                <span className="field-hint">
                  This username identifies your personal workspace.
                </span>
              </div>

              <div className="settings-field">
                <label htmlFor="settings-email">Email Address</label>
                <input
                  id="settings-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
                <span className="field-hint">
                  Changing your email will update your login credentials immediately.
                </span>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="settings-form">
              {passwordMessage.text && (
                <div className={`settings-alert ${passwordMessage.type}`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="settings-field">
                <label htmlFor="settings-current-password">Current Password</label>
                <input
                  id="settings-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Leave blank if using social OAuth only"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="settings-new-password">New Password</label>
                <input
                  id="settings-new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="settings-confirm-password">Confirm New Password</label>
                <input
                  id="settings-confirm-password"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-type new password"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={savingPassword}>
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
