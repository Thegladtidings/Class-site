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
  const selectedFileRef = useRef(null);   // holds the actual File object

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

    /* Show a local preview immediately — the real URL comes back from Cloudinary */
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
      /*
        Send as FormData so multer can read the file.
        axiosInstance will auto-remove Content-Type so the
        browser sets the correct multipart boundary.
      */
      const fd = new FormData();

      if (emailChanged)  fd.append('email',        form.email);
      if (imageChanged)  fd.append('profileImage',  selectedFileRef.current);

      const { data } = await axiosInstance.put('/api/students/profile', fd);

      /* Update local state with what the server saved */
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

  /* ── Loading state ── */
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

        {/* ── Avatar / Hero ── */}
        <div className="sp-hero">
          <div
            className={`sp-avatar ${editing ? 'sp-avatar--editable' : ''}`}
            onClick={() => editing && fileInputRef.current?.click()}
            title={editing ? 'Click to change photo' : ''}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="sp-avatar__img" />
            ) : (
              <span className="sp-avatar__initials">
                {getInitials(student.name)}
              </span>
            )}

            {/* Camera overlay hint when editing */}
            {editing && (
              <div className="sp-avatar__overlay">
                <span style={{ fontSize: 22 }}>📷</span>
                <span style={{ fontSize: 11, marginTop: 2 }}>Change</span>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sp-avatar__file-input"
            onChange={handleImageChange}
          />

          <div className="sp-hero__info">
            <h1 className="sp-hero__name">{student.name}</h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              {student.className}
            </p>
          </div>
        </div>

        {/* ── Alerts ── */}
        {saveSuccess && (
          <div className="sp-alert sp-alert--success">✔ {saveSuccess}</div>
        )}
        {saveError && (
          <div className="sp-alert sp-alert--error">⚠ {saveError}</div>
        )}

        {/* ── Fields ── */}

        {/* Name — always read-only */}
        <div className="sp-field">
          <label className="sp-field__label">Full Name</label>
          <div className="sp-field__wrap">
            <span className="sp-field__value">{student.name}</span>
            <span style={{
              fontSize: 10, color: '#94a3b8', marginLeft: 8,
              background: '#f1f5f9', padding: '2px 8px', borderRadius: 99,
            }}>
              Cannot be changed
            </span>
          </div>
        </div>

        {/* Email */}
        <div className="sp-field">
          <label className="sp-field__label">Email</label>
          <div className="sp-field__wrap">
            {editing ? (
              <input
                className="sp-field__input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            ) : (
              <span className="sp-field__value">{student.email}</span>
            )}
          </div>
        </div>

        {/* Class — read-only */}
        {student.className && (
          <div className="sp-field">
            <label className="sp-field__label">Class</label>
            <div className="sp-field__wrap">
              <span className="sp-field__value">{student.className}</span>
            </div>
          </div>
        )}

        {/* Student ID — read-only */}
        {student.studentId && (
          <div className="sp-field">
            <label className="sp-field__label">Student ID</label>
            <div className="sp-field__wrap">
              <span className="sp-field__value">{student.studentId}</span>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="sp-actions">
          {editing ? (
            <>
              <button
                className="sp-btn sp-btn--save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Uploading…' : 'Save Changes'}
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