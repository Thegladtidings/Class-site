import { useEffect, useState } from "react";
import { updateProfile } from "../api/teacherApi.js";
import styles from "../../css/TeacherProfile.module.css";

function formFromProfile(profile) {
  return {
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    subject: profile?.subject ?? "",
    classNames: Array.isArray(profile?.classNames) ? profile.classNames.join(", ") : "",
  };
}

export default function TeacherProfile({ profile, onUpdate, error }) {
  const [form, setForm] = useState(() => formFromProfile(profile));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setForm(formFromProfile(profile));
  }, [profile]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setNotice("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      classNames: form.classNames.split(",").map((name) => name.trim()).filter(Boolean),
    };

    try {
      const { data } = await updateProfile(payload);
      if (!data?.teacher) throw new Error("The server did not return the updated profile.");
      onUpdate?.(data.teacher);
      localStorage.setItem("user", JSON.stringify(data.teacher));
      setNotice("Your profile has been updated.");
    } catch (requestError) {
      setSaveError(requestError.response?.data?.message || requestError.message || "Could not update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <section className={styles.profile}>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>ACCOUNT</p>
          <h2>Teacher profile</h2>
        </header>
        <div className={styles.message} role={error ? "alert" : "status"}>
          {error
            ? error.response?.data?.message || "Could not load your profile. Please try again later."
            : "Loading your profile…"}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.profile}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>ACCOUNT</p>
          <h2>Teacher profile</h2>
          <p className={styles.description}>Keep your contact and teaching details up to date.</p>
        </div>
        <div className={styles.avatar} aria-hidden="true">
          {profile.name?.trim()?.[0]?.toUpperCase() || "T"}
        </div>
      </header>

      <form className={styles.card} onSubmit={handleSubmit}>
        {saveError && <p className={styles.error} role="alert">{saveError}</p>}
        {notice && <p className={styles.success} role="status">{notice}</p>}

        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Full name</span>
            <input name="name" value={form.name} onChange={updateField} autoComplete="name" required maxLength={100} />
          </label>
          <label className={styles.field}>
            <span>Email address</span>
            <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required maxLength={254} />
          </label>
          <label className={styles.field}>
            <span>Primary subject</span>
            <input name="subject" value={form.subject} onChange={updateField} maxLength={100} placeholder="e.g. Mathematics" />
          </label>
          <label className={styles.field}>
            <span>Classes</span>
            <input
              name="classNames"
              value={form.classNames}
              onChange={updateField}
              maxLength={300}
              placeholder="Separate classes with commas"
            />
            <small>Use commas between class names.</small>
          </label>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}