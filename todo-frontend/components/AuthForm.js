'use client';

import { useState } from 'react';
import { getOAuthUrl, login, register } from '../lib/api';

function PasswordIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.8 4 10 8-.4 1.4-1.2 2.7-2.2 3.8M6.2 6.2C4.5 7.5 3.3 9.4 2 12c1.2 4 4.8 8 10 8 1.2 0 2.4-.2 3.4-.6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12c1.2-4 4.8-8 10-8s8.8 4 10 8c-1.2 4-4.8 8-10 8S3.2 16 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AuthForm({ onAuthenticated, initialError = '' }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password, form.confirmPassword);
      window.localStorage.setItem('todo_token', result.token);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
  }

  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <p className="eyebrow">TODO LIST APPLICATION</p>
        <h1>Stay organized, one task at a time.</h1>
        <p>Keep track of your daily tasks, focus on what matters, and get things done with less stress.</p>
      </section>
      <section className="auth-card">
        <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</p>
        <h2>{mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}</h2>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Pick up where you left off.' : 'Your daily planning space is one minute away.'}
        </p>
        {error && <div className="error-banner">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>Full name
              <input required autoComplete="name" placeholder="Alex Morgan" value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
          )}
          <label>Email address
            <input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <div className="password-field">
            <label>Password
              <input aria-label="Password" required type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} placeholder="At least 8 characters"
                value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <button type="button" className="password-toggle password-toggle-inside" aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
                <PasswordIcon visible={showPassword} />
              </button>
            </label>
          </div>
          {mode === 'register' && (
            <div className="password-field">
              <label>Confirm password
                <input aria-label="Confirm password" required type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8}
                  placeholder="Repeat your password" value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
                <button type="button" className="password-toggle password-toggle-inside" aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  title={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <PasswordIcon visible={showConfirmPassword} />
                </button>
              </label>
            </div>
          )}
          <button className="primary-action" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Register'}
          </button>
        </form>
        <div className="oauth-divider"><span>or continue with</span></div>
        <div className="oauth-actions">
          <a className="oauth-button" href={getOAuthUrl('google')}>Google</a>
          <a className="oauth-button" href={getOAuthUrl('github')}>GitHub</a>
        </div>
        <button className="link-button" type="button" onClick={switchMode}>
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
        </button>
      </section>
    </main>
  );
}
