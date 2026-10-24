'use client';

import { useState, useRef, useEffect } from 'react';

export default function ProfileMenu({ user, onOpenSettings, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
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
        className={`profile-button ${open ? 'active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Profile &amp; Account"
      >
        <div className="profile-avatar-circle" aria-hidden="true">
          {initial}
        </div>
        <span className="profile-button-name">{displayName}</span>
        <svg
          className={`profile-chevron ${open ? 'open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="profile-dropdown-menu" role="menu">
          <div className="profile-dropdown-header">
            <div className="profile-avatar-large" aria-hidden="true">
              {initial}
            </div>
            <div className="profile-dropdown-user-info">
              <strong className="profile-dropdown-name">{displayName}</strong>
              <span className="profile-dropdown-email">{user.email}</span>
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          <button
            type="button"
            className="profile-dropdown-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
          >
            <span className="profile-dropdown-item-icon">⚙️</span>
            <span>Account Settings</span>
          </button>

          <button
            type="button"
            className="profile-dropdown-item danger"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <span className="profile-dropdown-item-icon">🚪</span>
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
