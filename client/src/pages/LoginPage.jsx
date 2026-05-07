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
// Register Modal
// ─────────────────────────────────────────────
function RegisterModal({ onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    className: '',
    gender: '',
    studentId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { name, email, password, confirm, className, gender, studentId } = form;

    if (!name || !email || !password || !confirm || !className || !gender || !studentId)
      return setError('Please fill in all fields.');
    if (password !== confirm)
      return setError('Passwords do not match.');
    if (password.length < 6)
      return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/students/register`, {
        name,
        email,
        password,
        className,
        gender,
        studentId,
      });
      setSuccess('Account created! You can now sign in.');
      setTimeout(onClose, 2000);
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
    <div className="lp-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Student Registration">
      <div className="lp-modal">
        <div className="lp-card__stripe" aria-hidden="true" />

        <div className="lp-modal__header">
          <h2 className="lp-modal__title">Student Registration</h2>
          <button
            className="lp-modal__close"
            onClick={onClose}
            aria-label="Close registration"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lp-modal__body" noValidate>
          {error && (
            <div className="lp-error" role="alert">
              <span className="lp-error__icon">⚠</span>
              {error}
            </div>
          )}
          {success && (
            <div className="lp-success" role="status">
              <span className="lp-success__icon">✔</span>
              {success}
            </div>
          )}

          {/* Name + Student ID */}
          <div className="lp-field-row">
            <div className="lp-field">
              <label className="lp-field__label" htmlFor="reg-name">Full Name</label>
              <div className="lp-field__wrap">
                <span className="lp-field__icon" aria-hidden="true">👤</span>
                <input
                  id="reg-name"
                  type="text"
                  className="lp-field__input"
                  placeholder="e.g. Amara Obi"
                  value={form.name}
                  onChange={set('name')}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-field__label" htmlFor="reg-studentId">Student ID</label>
              <div className="lp-field__wrap">
                <span className="lp-field__icon" aria-hidden="true">#</span>
                <input
                  id="reg-studentId"
                  type="text"
                  className="lp-field__input"
                  placeholder="e.g. STU-001"
                  value={form.studentId}
                  onChange={set('studentId')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="lp-field">
            <label className="lp-field__label" htmlFor="reg-email">Email Address</label>
            <div className="lp-field__wrap">
              <span className="lp-field__icon" aria-hidden="true">✉</span>
              <input
                id="reg-email"
                type="email"
                className="lp-field__input"
                placeholder="Enter your school email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Class + Gender */}
          <div className="lp-field-row">
            <div className="lp-field">
              <label className="lp-field__label" htmlFor="reg-className">Class Name</label>
              <div className="lp-field__wrap">
                <span className="lp-field__icon" aria-hidden="true">🏫</span>
                <select
                  id="reg-className"
                  className="lp-field__input lp-field__select"
                  value={form.className}
                  onChange={set('className')}
                  required
                >
                  <option value="">Select class…</option>
                  <optgroup label="Junior Secondary">
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 2">JSS 2</option>
                    <option value="JSS 3">JSS 3</option>
                  </optgroup>
                  <optgroup label="Senior Secondary">
                    <option value="SS 1">SS 1</option>
                    <option value="SS 2">SS 2</option>
                    <option value="SS 3">SS 3</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-field__label" htmlFor="reg-gender">Gender</label>
              <div className="lp-field__wrap">
                <span className="lp-field__icon" aria-hidden="true">⚥</span>
                <select
                  id="reg-gender"
                  className="lp-field__input lp-field__select"
                  value={form.gender}
                  onChange={set('gender')}
                  required
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="lp-field">
            <label className="lp-field__label" htmlFor="reg-password">Password</label>
            <div className="lp-field__wrap">
              <span className="lp-field__icon" aria-hidden="true">🔒</span>
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                className="lp-field__input"
                placeholder="Create a password"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="lp-field__toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="lp-field">
            <label className="lp-field__label" htmlFor="reg-confirm">Confirm Password</label>
            <div className="lp-field__wrap">
              <span className="lp-field__icon" aria-hidden="true">🔒</span>
              <input
                id="reg-confirm"
                type="password"
                className="lp-field__input"
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={set('confirm')}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`lp-submit${loading ? ' lp-submit--loading' : ''}`}
            disabled={loading}
            style={{ marginTop: '4px' }}
          >
            {loading ? (
              <>
                <span className="lp-submit__spinner" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              <>
                <span>Create Account</span>
                <span className="lp-submit__arrow" aria-hidden="true">→</span>
              </>
            )}
          </button>

          <p className="lp-register-link" style={{ marginTop: '14px' }}>
            Already have an account?{' '}
            <span onClick={onClose} role="button" tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onClose()}>
              Sign in instead
            </span>
          </p>
        </form>

        <div className="lp-footer" aria-hidden="true">
          <span />
          <span className="lp-footer__diamond">◆</span>
          <span />
        </div>
      </div>
    </div>
  );
}

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

  // Register modal state
  const [showRegister, setShowRegister] = useState(false);

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

          {/* Register link — only shown for students */}
          {role === 'student' && (
            <p className="lp-register-link">
              New student?{' '}
              <span
                onClick={() => setShowRegister(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowRegister(true)}
              >
                Create an account
              </span>
            </p>
          )}
        </form>

        {/* Footer ornament */}
        <div className="lp-footer" aria-hidden="true">
          <span />
          <span className="lp-footer__diamond">◆</span>
          <span />
        </div>
      </div>

      {/* Register Modal */}
      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} />
      )}
    </div>
  );
}