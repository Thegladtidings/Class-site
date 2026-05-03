import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function RegisterModal({ onClose }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    className: '', gender: '', studentId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (form.password !== form.confirm)
      return setError('Passwords do not match.');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const { name, email, password, className, gender, studentId } = form;
      await axios.post(`${API_BASE}/api/students/register`, {
        name, email, password, className, gender, studentId,
      });
      setSuccess('Account created! You can now sign in.');
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lp-modal">
        <div className="lp-card__stripe" />
        <div className="lp-modal__header">
          <h2 className="lp-modal__title">Student Registration</h2>
          <button className="lp-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="lp-modal__body" noValidate>
          {error   && <div className="lp-error" role="alert"><span>⚠</span>{error}</div>}
          {success && <div className="lp-success" role="status"><span>✔</span>{success}</div>}

          <div className="lp-field-row">
            <div className="lp-field">
              <label className="lp-field__label">Full Name</label>
              <div className="lp-field__wrap">
                <span className="lp-field__icon">👤</span>
                <input className="lp-field__input" type="text" placeholder="e.g. Amara Obi"
                  value={form.name} onChange={set('name')} required />
              </div>
            </div>
            <div className="lp-field">
              <label className="lp-field__label">Student ID</label>
              <div className="lp-field__wrap">
                <span className="lp-field__icon">#</span>
                <input className="lp-field__input" type="text" placeholder="e.g. STU-001"
                  value={form.studentId} onChange={set('studentId')} required />
              </div>
            </div>
          </div>

          <div className="lp-field">
            <label className="lp-field__label">Email Address</label>
            <div className="lp-field__wrap">
              <span className="lp-field__icon">✉</span>
              <input className="lp-field__input" type="email" placeholder="School email"
                value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>
          </div>

          <div className="lp-field-row">
            <div className="lp-field">
              <label className="lp-field__label">Class Name</label>
              <div className="lp-field__wrap">
                <span className="lp-field__icon">🏫</span>
                <input className="lp-field__input" type="text" placeholder="e.g. JSS 2A"
                  value={form.className} onChange={set('className')} required />
              </div>
            </div>
            <div className="lp-field">
              <label className="lp-field__label">Gender</label>
              <div className="lp-field__wrap">
                <span className="lp-field__icon">⚥</span>
                <select className="lp-field__input" value={form.gender} onChange={set('gender')} required>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lp-field">
            <label className="lp-field__label">Password</label>
            <div className="lp-field__wrap">
              <span className="lp-field__icon">🔒</span>
              <input className="lp-field__input" type={showPw ? 'text' : 'password'}
                placeholder="Create a password" value={form.password} onChange={set('password')}
                required autoComplete="new-password" />
              <button type="button" className="lp-field__toggle"
                onClick={() => setShowPw(v => !v)}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="lp-field">
            <label className="lp-field__label">Confirm Password</label>
            <div className="lp-field__wrap">
              <span className="lp-field__icon">🔒</span>
              <input className="lp-field__input" type="password"
                placeholder="Re-enter your password" value={form.confirm} onChange={set('confirm')}
                required autoComplete="new-password" />
            </div>
          </div>

          <button type="submit" className={`lp-submit${loading ? ' lp-submit--loading' : ''}`} disabled={loading}>
            {loading
              ? <><span className="lp-submit__spinner" /><span>Creating account…</span></>
              : <><span>Create Account</span><span className="lp-submit__arrow">→</span></>}
          </button>

          <p className="lp-register-link" style={{ marginTop: '14px' }}>
            Already have an account?{' '}
            <span onClick={onClose} style={{ cursor: 'pointer' }}>Sign in instead</span>
          </p>
        </form>

        <div className="lp-footer" aria-hidden="true">
          <span /><span className="lp-footer__diamond">◆</span><span />
        </div>
      </div>
    </div>
  );
}