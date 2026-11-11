import { useState, useEffect, useRef } from "react";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Sections.module.css";
import { postAnnouncement, deleteAnnouncement, getAnnouncements } from "../api/teacherApi";

const EMPTY = {
  title:        "",
  message:      "",
  type:         "notice",
  studentName:  "",
  studentPhoto: "",
};

const TYPE_META = {
  notice:       { label: "Notice",       color: "blue",  icon: "📋" },
  best_student: { label: "Best Student", color: "gold",  icon: "🌟" },
  result:       { label: "Result",       color: "green", icon: "📊" },
  event:        { label: "Event",        color: "amber", icon: "📅" },
};

const MAX_PHOTO_MB = 2;

export default function AnnouncementsSection({ loading: externalLoading }) {
  const [list, setList]            = useState([]);
  const [fetching, setFetching]    = useState(true);   // ← new: loading state for GET
  const [form, setForm]            = useState(EMPTY);
  const [submitting, setSub]       = useState(false);
  const [toast, setToast]          = useState(null);
  const [photoPreview, setPreview] = useState("");
  const fileInputRef               = useRef(null);

  /* ── Fetch announcements on mount ── */
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await getAnnouncements();
        // Handle both shapes: res.data.announcements or res.announcements
        const data = res?.data?.announcements ?? res?.announcements ?? [];
        setList(data);
      } catch (err) {
        setToast({ msg: "Could not load announcements.", type: "error" });
      } finally {
        setFetching(false);
      }
    }
    fetchAnnouncements();
  }, []);

  function setF(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  /* ── Photo: validate → preview → base64 ── */
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setToast({ msg: `Photo must be under ${MAX_PHOTO_MB}MB.`, type: "error" });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setF("studentPhoto", ev.target.result);   // base64 stored for API
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPreview("");
    setF("studentPhoto", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ── Submit ── */
  async function handleSubmit() {
    if (!form.title.trim() || !form.message.trim()) {
      setToast({ msg: "Title and message are required.", type: "error" });
      return;
    }
    if (form.type === "best_student" && !form.studentName.trim()) {
      setToast({ msg: "Please enter the student's name.", type: "error" });
      return;
    }

    setSub(true);
    try {
      const payload = {
        title:        form.title,
        message:      form.message,
        type:         form.type,
        studentName:  form.studentName  || undefined,
        studentPhoto: form.studentPhoto || undefined,
      };

      const res = await postAnnouncement(payload);
      const created = res?.data?.announcement;
      if (!created) throw new Error("The server did not return the saved announcement.");

      setList((p) => [created, ...p]);
      setForm(EMPTY);
      clearPhoto();
      setToast({ msg: "Announcement posted!", type: "success" });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Failed to post.", type: "error" });
    } finally {
      setSub(false);
    }
  }

  /* ── Delete ── */
  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      setList((p) => p.filter((a) => a._id !== id));
      setToast({ msg: "Announcement removed.", type: "info" });
    } catch (err) {
      setToast({
        msg: err.response?.data?.message || "Could not delete the announcement.",
        type: "error",
      });
    }
  }

  const isBestStudent = form.type === "best_student";
  const isLoading     = fetching || externalLoading;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Announcements</h2>
          <p className={styles.sectionSub}>
            {isLoading ? "Loading…" : `${list.length} posted`}
          </p>
        </div>
      </div>

      {/* ── Post form ── */}
      <div className={styles.announceForm}>
        <h3 className={styles.announceFormTitle}>Post New Announcement</h3>

        <div className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: 2 }}>
              <label>Title</label>
              <input
                value={form.title}
                onChange={(e) => setF("title", e.target.value)}
                placeholder="e.g. 🌟 Best Student – Week 11"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Type</label>
              <select
                value={form.type}
                onChange={(e) => { setF("type", e.target.value); clearPhoto(); }}
              >
                {Object.entries(TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Message</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setF("message", e.target.value)}
              placeholder="Write your announcement here…"
            />
          </div>

          {/* ── Best Student extras ── */}
          {isBestStudent && (
            <div style={{
              background: "#fffbeb", border: "1.5px solid #fde68a",
              borderRadius: 10, padding: 14, marginTop: 4,
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 12 }}>
                🌟 Best Student Details
              </p>

              <div className={styles.formGroup}>
                <label>Student Name</label>
                <input
                  placeholder="e.g. Unaysah Ibrahim"
                  value={form.studentName}
                  onChange={(e) => setF("studentName", e.target.value)}
                />
              </div>

              {/* Photo upload */}
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label>
                  Student Photo{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional · max 2MB)</span>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
                  {/* Preview circle */}
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "#e2e8f0", overflow: "hidden",
                    flexShrink: 0, border: "2px solid #fde68a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 24 }}>👤</span>
                    }
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 16px", borderRadius: 8, cursor: "pointer",
                      background: "#1a6ef5", color: "#fff",
                      fontSize: 12, fontWeight: 600,
                    }}>
                      📷 Choose Photo
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: "none" }}
                        onChange={handlePhotoChange}
                      />
                    </label>

                    {photoPreview && (
                      <button
                        type="button"
                        onClick={clearPhoto}
                        style={{
                          marginLeft: 8, background: "none", border: "none",
                          color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600,
                        }}
                      >
                        ✕ Remove
                      </button>
                    )}
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                      JPG, PNG or WEBP · Max 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button
              className={styles.primaryBtn}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Posting…" : "📢 Post Announcement"}
            </button>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className={styles.skeletonList}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className={styles.skeletonRow} style={{ height: 80 }} />
          ))}
        </div>
      ) : (
        <div className={styles.announceList}>
          {list.length === 0 && (
            <div className={styles.emptyState}>
              <span>📢</span><p>No announcements yet.</p>
            </div>
          )}

          {list.map((a) => {
            const meta = TYPE_META[a.type] || TYPE_META.notice;
            return (
              <div
                key={a._id}
                className={`${styles.announceCard} ${styles["announce_" + meta.color]}`}
              >
                <div className={styles.announceCardHead}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={styles.announceTypeIcon}>{meta.icon}</span>
                    <div>
                      <p className={styles.announceTitle}>{a.title}</p>
                      <p className={styles.announceTime}>
                        {new Date(a.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                        &nbsp;·&nbsp;
                        <span className={`${styles.typePill} ${styles["pill" + meta.color.charAt(0).toUpperCase() + meta.color.slice(1)]}`}>
                          {meta.label}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    className={styles.delAnnounce}
                    onClick={() => handleDelete(a._id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>

                <p className={styles.announceBody}>{a.message}</p>

                {/* Best student card */}
                {a.type === "best_student" && (a.studentName || a.studentPhoto) && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    marginTop: 12, padding: "10px 14px",
                    background: "rgba(255,255,255,0.6)", borderRadius: 10,
                    border: "1px solid #fde68a",
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "#e2e8f0", overflow: "hidden", flexShrink: 0,
                      border: "2px solid #f59e0b",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {a.studentPhoto
                        ? <img src={a.studentPhoto} alt={a.studentName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 20 }}>👤</span>
                      }
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>
                        🏆 {a.studentName}
                      </p>
                      <p style={{ fontSize: 12, color: "#b45309" }}>Best Student</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}