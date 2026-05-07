import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/login.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

if (!API_BASE) {
  throw new Error('VITE_API_URL is not defined');
}

const LOGIN_URLS = {
  student: `${API_BASE}/api/students/login`,
  teacher: `${API_BASE}/api/teachers/login`,
};

// ─────────────────────────────────────────────
// Login Page
// ─────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();

  // Login state
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post(LOGIN_URLS[role], { email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(data.student || data.teacher));

      navigate(role === 'student' ? '/student/dashboard' : '/teacher/dashboard');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request ? 'Cannot reach server. Is it running?' : 'An unexpected error occurred.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      {/* Geometric SVG background pattern */}
      <div className="lp-pattern" aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <polygon
                points="40,4 46,30 70,24 54,40 70,56 46,50 40,76 34,50 10,56 26,40 10,24 34,30"
                fill="none" stroke="rgba(212,175,55,0.13)" strokeWidth="0.8"
              />
              <rect x="20" y="20" width="40" height="40" fill="none"
                stroke="rgba(212,175,55,0.07)" strokeWidth="0.5"
                transform="rotate(45 40 40)" />
              <circle cx="40" cy="40" r="6" fill="none"
                stroke="rgba(212,175,55,0.10)" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geo)" />
        </svg>
      </div>

      {/* Ambient blobs */}
      <div className="lp-blob lp-blob--tl" aria-hidden="true" />
      <div className="lp-blob lp-blob--br" aria-hidden="true" />

      {/* Login Card */}
      <div className="lp-card">
        <div className="lp-card__stripe" aria-hidden="true" />

        {/* Header */}
        <header className="lp-header">
          <div className="lp-header__emblem" aria-hidden="true">
          </div>
          <h1 className="lp-header__title">Class Site</h1>
          <p className="lp-header__sub">Assessment Management System</p>
          <div className="lp-header__rule" aria-hidden="true" />
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="lp-form" noValidate>
          {/* Role selector */}
          <div className="lp-role">
            {['student', 'teacher'].map((r) => (
              <label
                key={r}
                className={`lp-role__option${role === r ? ' lp-role__option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="lp-role__radio"
                />
                <span className="lp-role__icon">{r === 'student' ? '🎓' : '📖'}</span>
                <span className="lp-role__label">
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </span>
              </label>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="lp-error" role="alert">
              <span className="lp-error__icon">⚠</span>
              {error}
            </div>
          )}

          {/* Email */}
          <div className="lp-field">
            <label className="lp-field__label" htmlFor="email">Email Address</label>
            <div className="lp-field__wrap">
              <span className="lp-field__icon" aria-hidden="true">✉</span>
              <input
                id="email"
                type="email"
                className="lp-field__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your school email"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="lp-field">
            <label className="lp-field__label" htmlFor="password">Password</label>
            <div className="lp-field__wrap">
              <span className="lp-field__icon" aria-hidden="true">🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="lp-field__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lp-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`lp-submit${loading ? ' lp-submit--loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="lp-submit__spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="lp-submit__arrow" aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer ornament */}
        <div className="lp-footer" aria-hidden="true">
          <span />
          <span className="lp-footer__diamond">◆</span>
          <span />
        </div>
      </div>
    </div>
  );
}