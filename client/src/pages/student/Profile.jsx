import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../css/profile.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function StudentProfile({ profile, onUpdate }) {
  const fileInputRef = useRef(null);

  const [student, setStudent] = useState(profile || null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    email: '',
    className: '',
    gender: '',
    profileImage: '',
  });

  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  /* ✅ Sync with dashboard data */
  useEffect(() => {
    if (!profile) return;

    setStudent(profile);

    setForm({
      email: profile.email || '',
      className: profile.className || '',
      gender: profile.gender || '',
      profileImage: profile.profileImage || '',
    });

    setImagePreview(profile.profileImage || '');
  }, [profile]);

  /* 🖼 Image upload */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSaveError('Image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setForm((f) => ({ ...f, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  /* 💾 Save */
  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess('');
    setSaving(true);

    const token = localStorage.getItem('token');
    const payload = {};

    if (form.email !== student.email) payload.email = form.email;
    if (form.profileImage !== student.profileImage)
      payload.profileImage = form.profileImage;

    if (Object.keys(payload).length === 0) {
      setSaveSuccess('No changes to save.');
      setSaving(false);
      setEditing(false);
      return;
    }

    try {
      const { data } = await axios.put(
        `${API_BASE}/api/students/profile`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStudent(data.student);
      localStorage.setItem('user', JSON.stringify(data.student));

      setSaveSuccess('Profile updated successfully.');
      setEditing(false);

      /* 🔁 Notify dashboard */
      if (onUpdate) onUpdate(data.student);

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.request ? 'Cannot reach server.' : 'An unexpected error occurred.');
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      email: student.email || '',
      className: student.className || '',
      gender: student.gender || '',
      profileImage: student.profileImage || '',
    });

    setImagePreview(student.profileImage || '');
    setSaveError('');
    setSaveSuccess('');
    setEditing(false);
  };

  /* ✅ Safe fallback */
  if (!student) {
    return (
      <div className="sp-root">
        <div className="sp-loading">
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-root">
      <div className="sp-page">

        {/* Avatar / Hero */}
        <div className="sp-hero">
          <div
            className={`sp-avatar ${editing ? 'sp-avatar--editable' : ''}`}
            onClick={() => editing && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="sp-avatar__img" />
            ) : (
              <span className="sp-avatar__initials">
                {getInitials(student.name)}
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sp-avatar__file-input"
            onChange={handleImageChange}
          />

          <div className="sp-hero__info">
            <h1 className="sp-hero__name">{student.name}</h1>
            <p>{student.className}</p>
          </div>
        </div>

        {/* Alerts */}
        {saveSuccess && (
          <div className="sp-alert sp-alert--success">
            ✔ {saveSuccess}
          </div>
        )}

        {saveError && (
          <div className="sp-alert sp-alert--error">
            ⚠ {saveError}
          </div>
        )}

        {/* Email */}
        <div className="sp-field">
          <label className="sp-field__label">Email</label>
          <div className="sp-field__wrap">
            {editing ? (
              <input
                className="sp-field__input"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            ) : (
              <span className="sp-field__value">{student.email}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="sp-actions">
          {editing ? (
            <>
              <button
                className="sp-btn sp-btn--save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
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
              Edit Profile
            </button>
          )}
        </div>

      </div>
    </div>
  );
}