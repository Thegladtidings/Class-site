import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/login.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const LOGIN_URLS = {
  student: `${API_BASE}/api/students/login`,
  teacher: `${API_BASE}/api/teachers/login`,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post(LOGIN_URLS[role], { email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(data.student || data.teacher));

      navigate(role === 'student' ? '/student/dashboard' : '/teacher/dashboard');
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        (requestError.request ? 'Cannot reach server. Is it running?' : 'An unexpected error occurred.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="loginPage">
      <section className="loginStory" aria-label="About ClassSite">
        <Link className="loginBrand" to="/" aria-label="ClassSite home">
          <span className="loginBrand__mark" aria-hidden="true">C</span>
          <span>class<span>site</span></span>
        </Link>

        <div className="loginStory__content">
          <p className="loginStory__eyebrow"><span /> YOUR CLASSROOM, CONNECTED</p>
          <h1>A clearer way<br />to <em>move learning</em><br />forward.</h1>
          <p className="loginStory__intro">
            Your classes, student progress, and day-to-day teaching tools—together in one thoughtful space.
          </p>

          <div className="loginPreview" aria-label="ClassSite dashboard preview">
            <div className="loginPreview__top">
              <div>
                <span>YOUR LEARNING SPACE</span>
                <strong>Everything in its place.</strong>
              </div>
              <span className="loginPreview__spark" aria-hidden="true">✦</span>
            </div>
            <div className="loginPreview__items">
              <div className="loginPreview__item">
                <span className="loginPreview__icon loginPreview__icon--mint" aria-hidden="true">◷</span>
                <span><strong>Class schedule</strong><small>Plan lessons and stay in sync</small></span>
                <span className="loginPreview__arrow" aria-hidden="true">↗</span>
              </div>
              <div className="loginPreview__item">
                <span className="loginPreview__icon loginPreview__icon--sand" aria-hidden="true">↗</span>
                <span><strong>Learning progress</strong><small>See the steps students make</small></span>
                <span className="loginPreview__arrow" aria-hidden="true">↗</span>
              </div>
              <div className="loginPreview__item">
                <span className="loginPreview__icon loginPreview__icon--blue" aria-hidden="true">✳</span>
                <span><strong>Class updates</strong><small>Keep everyone in the loop</small></span>
                <span className="loginPreview__arrow" aria-hidden="true">↗</span>
              </div>
            </div>
            <div className="loginPreview__footer"><span>✓</span> A little more clarity, every school day.</div>
          </div>
        </div>

        <p className="loginStory__footer">A better rhythm for teaching and learning.</p>
      </section>

      <section className="loginPanel" aria-labelledby="login-title">
        <Link className="loginMobileBrand" to="/" aria-label="ClassSite home">
          <span className="loginBrand__mark" aria-hidden="true">C</span>
          <span>class<span>site</span></span>
        </Link>
        <div className="loginPanel__top">
          <span>Already part of a class?</span>
          <span className="loginPanel__secure"><span aria-hidden="true">●</span> Secure sign in</span>
        </div>

        <div className="loginFormWrap">
          <p className="loginForm__eyebrow">WELCOME TO CLASSSITE</p>
          <h2 id="login-title">Welcome back<span>.</span></h2>
          <p className="loginForm__intro">Sign in to pick up where your learning left off.</p>

          <form onSubmit={handleSubmit} className="loginForm">
            <fieldset className="loginRole">
              <legend>I’m signing in as</legend>
              <div className="loginRole__options">
                {['student', 'teacher'].map((option) => (
                  <label
                    key={option}
                    className={`loginRole__option${role === option ? ' loginRole__option--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option}
                      checked={role === option}
                      onChange={() => setRole(option)}
                    />
                    <span className="loginRole__icon" aria-hidden="true">
                      {option === 'student' ? '⌂' : '✎'}
                    </span>
                    <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                    <span className="loginRole__check" aria-hidden="true">{role === option ? '✓' : ''}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <div className="loginError" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            <div className="loginField">
              <label htmlFor="email">Email address</label>
              <div className="loginField__control">
                <span className="loginField__icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none">
                    <rect x="2.5" y="4" width="15" height="12" rx="2" />
                    <path d="m3.5 5.5 6.5 5 6.5-5" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@school.edu"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="loginField">
              <label htmlFor="password">Password</label>
              <div className="loginField__control">
                <span className="loginField__icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none">
                    <rect x="3.5" y="8.5" width="13" height="9" rx="2" />
                    <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5M10 12v2" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="loginField__toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="loginSubmit" disabled={loading}>
              {loading ? (
                <>
                  <span className="loginSubmit__spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <p className="loginHelp">
            Need help signing in? <span>Contact your school administrator.</span>
          </p>
        </div>

        <div className="loginPanel__bottom">
          <Link to="/">← Back to ClassSite</Link>
          <span>© {new Date().getFullYear()} ClassSite</span>
        </div>
      </section>
    </main>
  );
}
