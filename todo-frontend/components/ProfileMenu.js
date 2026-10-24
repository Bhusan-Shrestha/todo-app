'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/* ─── Icon Components ────────────────────────────────────────── */
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconMonitor() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function IconChevron({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`profile-chevron ${open ? 'open' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ─── Theme Switcher inline ──────────────────────────────────── */
const THEME_OPTIONS = [
  { value: 'light', label: 'Light', Icon: IconSun },
  { value: 'dark',  label: 'Dark',  Icon: IconMoon },
  { value: 'system',label: 'System',Icon: IconMonitor },
];

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-switcher-row" role="group" aria-label="Select theme">
      {THEME_OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          className={`theme-option-btn ${theme === value ? 'active' : ''}`}
          onClick={() => setTheme(value)}
          title={`${label} theme`}
          aria-pressed={theme === value}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Profile Menu ───────────────────────────────────────────── */
export default function ProfileMenu({ user, onOpenSettings, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const displayName = user.username || user.name || 'User';
  const initial = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <button
        type="button"
        id="profile-menu-trigger"
        className={`profile-button ${open ? 'active' : ''}`}
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="profile-dropdown"
        title="Profile & Account"
      >
        <div className="profile-avatar-circle" aria-hidden="true">{initial}</div>
        <span className="profile-button-name">{displayName}</span>
        <IconChevron open={open} />
      </button>

      {open && (
        <div
          id="profile-dropdown"
          className="profile-dropdown-menu"
          role="menu"
          aria-labelledby="profile-menu-trigger"
        >
          {/* User info header */}
          <div className="profile-dropdown-header">
            <div className="profile-avatar-large" aria-hidden="true">{initial}</div>
            <div className="profile-dropdown-user-info">
              <strong className="profile-dropdown-name">{displayName}</strong>
              <span className="profile-dropdown-email">{user.email}</span>
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Theme switcher */}
          <div className="profile-dropdown-section-label">Appearance</div>
          <ThemeSwitcher />

          <div className="profile-dropdown-divider" />

          {/* Settings */}
          <button
            type="button"
            className="profile-dropdown-item"
            role="menuitem"
            onClick={() => { setOpen(false); onOpenSettings(); }}
          >
            <span className="profile-dropdown-item-icon"><IconSettings /></span>
            <span>Account Settings</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            className="profile-dropdown-item danger"
            role="menuitem"
            onClick={() => { setOpen(false); onLogout(); }}
          >
            <span className="profile-dropdown-item-icon"><IconLogout /></span>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
