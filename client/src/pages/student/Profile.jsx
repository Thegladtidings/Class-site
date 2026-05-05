import React, { useState, useEffect, useRef } from 'react';
import '../../css/profile.css';
import axiosInstance from '../api/Axiosinstance.js';

function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function StudentProfile({ profile, onUpdate }) {
  const fileInputRef    = useRef(null);
  const selectedFileRef = useRef(null);

  const [student,      setStudent]      = useState(profile || null);
  const [editing,      setEditing]      = useState(false);
  const [form,         setForm]         = useState({ email: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [saveSuccess,  setSaveSuccess]  = useState('');

  /* ── Sync when profile prop changes ── */
  useEffect(() => {
    if (!profile) return;
    setStudent(profile);
    setForm({ email: profile.email || '' });
    setImagePreview(profile.profileImage || '');
  }, [profile]);

  /* ── File selected ── */
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Image must be under 5 MB.');
      return;
    }

    selectedFileRef.current = file;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  /* ── Save ── */
  async function handleSave() {
    setSaveError('');
    setSaveSuccess('');

    const emailChanged = form.email !== student?.email;
    const imageChanged = !!selectedFileRef.current;

    if (!emailChanged && !imageChanged) {
      setSaveSuccess('No changes to save.');
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (emailChanged) fd.append('email',        form.email);
      if (imageChanged) fd.append('profileImage',  selectedFileRef.current);

      const { data } = await axiosInstance.patch('/api/students/profile-update', fd);

      setStudent(data.student);
      setImagePreview(data.student.profileImage || imagePreview);
      localStorage.setItem('user', JSON.stringify(data.student));

      selectedFileRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';

      setSaveSuccess('Profile updated successfully.');
      setEditing(false);
      if (onUpdate) onUpdate(data.student);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.request ? 'Cannot reach server.' : 'An unexpected error occurred.');
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  /* ── Cancel ── */
  function handleCancel() {
    setForm({ email: student?.email || '' });
    setImagePreview(student?.profileImage || '');
    selectedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSaveError('');
    setSaveSuccess('');
    setEditing(false);
  }

  /* ── Loading ── */
  if (!student) {
    return (
      <div className="sp-root">
        <div className="sp-loading"><p>Loading profile…</p></div>
      </div>
    );
  }

  return (
    <div className="sp-root">
      <div className="sp-page">

        {/* ── Hero Card ── */}
        <div className="sp-hero-card">
          <div className="sp-hero-dots" />

          {/* Avatar */}
          <div className="sp-avatar-wrap">
            <div
              className={`sp-avatar ${editing ? 'sp-avatar--editable' : ''}`}
              onClick={() => editing && fileInputRef.current?.click()}
              title={editing ? 'Click to change photo' : ''}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" />
              ) : (
                <span className="sp-avatar__initials">
                  {getInitials(student.name)}
                </span>
              )}

              {editing && (
                <div className="sp-avatar__overlay">
                  <span style={{ fontSize: 22 }}>📷</span>
                  <span>Change</span>
                </div>
              )}
            </div>

            {/* Camera badge shown when not in edit mode */}
            {!editing && (
              <div
                className="sp-camera-badge"
                onClick={() => {
                  setSaveError('');
                  setSaveSuccess('');
                  setEditing(true);
                }}
                title="Edit profile"
                style={{ cursor: 'pointer' }}
              >
                ✏️
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sp-avatar__file-input"
            onChange={handleImageChange}
          />

          <h1 className="sp-hero-name">{student.name}</h1>
          <p className="sp-hero-class">{student.className}</p>

          <div className="sp-role-chip">
            <span className="sp-role-chip-dot" />
            Student
          </div>
        </div>

        {/* ── Alerts ── */}
        {saveSuccess && (
          <div className="sp-alert sp-alert--success">✔ {saveSuccess}</div>
        )}
        {saveError && (
          <div className="sp-alert sp-alert--error">⚠ {saveError}</div>
        )}

        {/* ── Fields Card ── */}
        <div className="sp-fields-card">

          {/* Full Name — read-only */}
          <div className="sp-field">
            <label className="sp-field__label">Full Name</label>
            <div className="sp-field__row">
              <span className="sp-field__value">{student.name}</span>
              <span className="sp-field__badge">Cannot be changed</span>
            </div>
          </div>

          {/* Email */}
          <div className="sp-field">
            <label className="sp-field__label">Email Address</label>
            {editing ? (
              <input
                className="sp-field__input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Enter your email"
              />
            ) : (
              <span className="sp-field__value">{student.email}</span>
            )}
          </div>

          {/* Class — read-only */}
          {student.className && (
            <div className="sp-field">
              <label className="sp-field__label">Class</label>
              <span className="sp-field__value">{student.className}</span>
            </div>
          )}

          {/* Student ID — read-only */}
          {student.studentId && (
            <div className="sp-field">
              <label className="sp-field__label">Student ID</label>
              <div className="sp-field__row">
                <span className="sp-field__value">{student.studentId}</span>
                <span className="sp-field__badge">Read only</span>
              </div>
            </div>
          )}

        </div>

        {/* ── Actions ── */}
        <div className="sp-actions">
          {editing ? (
            <>
              <button
                className="sp-btn sp-btn--save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '⏳ Uploading…' : '✔ Save Changes'}
              </button>
              <button
                className="sp-btn sp-btn--cancel"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="sp-btn sp-btn--edit"
              onClick={() => {
                setSaveError('');
                setSaveSuccess('');
                setEditing(true);
              }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

      </div>
    </div>
  );
}