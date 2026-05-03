import { useState, useEffect, useRef } from "react";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Studentdashboard.module.css";
import { getAssignments, submitAssignment, getMySubmissions } from "../api/studentApi";

const STATUS_META = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "#fffbeb" },
  submitted: { label: "Submitted", color: "#10b981", bg: "#f0fdf4" },
  late:      { label: "Late",      color: "#ef4444", bg: "#fef2f2" },
  graded:    { label: "Graded",    color: "#1a6ef5", bg: "#eff6ff" },
};

export default function StudentAssignments() {
  const [assignments, setAssignments]   = useState([]);
  const [submissions, setSubmissions]   = useState({});   // map assignmentId → submission
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState("pending");  // "pending" | "submitted"
  const [submitTarget, setSubmitTarget] = useState(null);
  const [form, setForm]                 = useState({ note: "", fileUrl: "", fileName: "" });
  const [submitting, setSubmitting]     = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const [toast, setToast]               = useState(null);
  const fileRef                         = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [aRes, sRes] = await Promise.all([getAssignments(), getMySubmissions()]);
        const aList = aRes?.data?.assignments ?? [];
        const sList = sRes?.data?.submissions ?? [];

        setAssignments(aList);

        // index submissions by assignment id for O(1) lookup
        const map = {};
        sList.forEach((s) => {
          map[String(s.assignment?._id ?? s.assignment)] = s;
        });
        setSubmissions(map);
      } catch {
        setToast({ msg: "Could not load assignments.", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── File pick / drag ── */
  function handleFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToast({ msg: "File must be under 10MB.", type: "error" });
      return;
    }
    // In production: upload to Cloudinary/S3 and get back a URL.
    // Here we store the filename and a fake object URL for demo.
    setForm((p) => ({ ...p, fileName: file.name, fileUrl: URL.createObjectURL(file) }));
  }

  /* ── Submit ── */
  async function handleSubmit() {
    if (!form.fileUrl && !form.note.trim()) {
      setToast({ msg: "Please attach a file or add a note.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitAssignment(submitTarget._id, {
        fileUrl:  form.fileUrl,
        fileName: form.fileName,
        note:     form.note,
      });
      const sub = res?.data?.submission ?? {
        _id: `s${Date.now()}`,
        assignment: submitTarget._id,
        ...form,
        status: isLate(submitTarget) ? "late" : "submitted",
        submittedAt: new Date().toISOString(),
      };
      setSubmissions((p) => ({ ...p, [String(submitTarget._id)]: sub }));
      setToast({ msg: res?.data?.message ?? "Submitted!", type: "success" });
      setSubmitTarget(null);
      setForm({ note: "", fileUrl: "", fileName: "" });
    } catch (err) {
      setToast({ msg: err?.response?.data?.message || "Submission failed.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Helpers ── */
  function isLate(a) {
    return a.dueDate && new Date() > new Date(a.dueDate);
  }

  function getStatus(a) {
    const sub = submissions[String(a._id)];
    if (sub) return sub.status || "submitted";
    return "pending";
  }

  function daysLeft(dueDate) {
    if (!dueDate) return null;
    const diff = new Date(dueDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: "#ef4444" };
    if (days === 0) return { label: "Due today", color: "#f59e0b" };
    return { label: `${days}d left`, color: days <= 2 ? "#f97316" : "#10b981" };
  }

  const pending   = assignments.filter((a) => !submissions[String(a._id)]);
  const submitted = assignments.filter((a) =>  submissions[String(a._id)]);
  const displayed = tab === "pending" ? pending : submitted;

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Assignments</h2>
          <p className={styles.sectionSub}>
            {pending.length} pending · {submitted.length} submitted
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "pending" ? styles.active : ""}`}
          onClick={() => setTab("pending")}
        >
          📋 Pending ({pending.length})
        </button>
        <button
          className={`${styles.tab} ${tab === "submitted" ? styles.active : ""}`}
          onClick={() => setTab("submitted")}
        >
          ✅ Submitted ({submitted.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.skeletonList}>
          {Array(3).fill(0).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : (
        <div className={styles.cardList}>
          {displayed.length === 0 && (
            <div className={styles.emptyState}>
              <span>{tab === "pending" ? "🎉" : "📭"}</span>
              <p>{tab === "pending" ? "No pending assignments!" : "Nothing submitted yet."}</p>
            </div>
          )}

          {displayed.map((a) => {
            const status = getStatus(a);
            const meta   = STATUS_META[status] ?? STATUS_META.pending;
            const due    = daysLeft(a.dueDate);
            const sub    = submissions[String(a._id)];

            return (
              <div key={a._id} className={styles.itemCard}>
                <div className={styles.itemCardHead}>
                  <div style={{ flex: 1 }}>
                    <p className={styles.itemTitle}>{a.title}</p>
                    <p className={styles.itemMeta}>
                      {a.subject}&nbsp;·&nbsp;{a.className}
                      {a.postedBy?.name && <>&nbsp;·&nbsp;{a.postedBy.name}</>}
                    </p>
                    {a.dueDate && (
                      <p className={styles.itemMeta}>
                        Due&nbsp;
                        {new Date(a.dueDate).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric",
                        })}
                        {due && (
                          <span style={{ color: due.color, fontWeight: 700, marginLeft: 6 }}>
                            · {due.label}
                          </span>
                        )}
                      </p>
                    )}
                    {a.description && (
                      <p className={styles.itemMeta} style={{ marginTop: 6, color: "#475569" }}>
                        {a.description}
                      </p>
                    )}
                  </div>

                  {/* Status pill */}
                  <span className={styles.pill} style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                </div>

                {/* Submission detail */}
                {sub && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px",
                    background: "#f8fafc", borderRadius: 8,
                    border: "1.5px solid #e2e8f0", fontSize: 12,
                  }}>
                    <p style={{ fontWeight: 600, color: "#475569", margin: "0 0 4px" }}>Your submission</p>
                    {sub.fileName && (
                      <p style={{ color: "#1a6ef5", margin: "0 0 2px" }}>📎 {sub.fileName}</p>
                    )}
                    {sub.note && (
                      <p style={{ color: "#475569", margin: 0 }}>💬 {sub.note}</p>
                    )}
                    {sub.grade != null && (
                      <p style={{ color: "#10b981", fontWeight: 700, marginTop: 4 }}>
                        Grade: {sub.grade}
                        {sub.feedback && <span style={{ fontWeight: 400, color: "#475569" }}> — {sub.feedback}</span>}
                      </p>
                    )}
                  </div>
                )}

                <div className={styles.itemActions}>
                  {!sub && (
                    <button
                      className={styles.primaryBtn}
                      style={{ fontSize: 12, padding: "7px 16px" }}
                      onClick={() => { setSubmitTarget(a); setForm({ note: "", fileUrl: "", fileName: "" }); }}
                    >
                      📤 Submit
                    </button>
                  )}
                  {sub && (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      Submitted {sub.submittedAt
                        ? new Date(sub.submittedAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {submitTarget && (
        <Modal
          title={`Submit — ${submitTarget.title}`}
          onClose={() => setSubmitTarget(null)}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={styles.cancelBtn} onClick={() => setSubmitTarget(null)}>Cancel</button>
              <button className={styles.primaryBtn} disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Submitting…" : "📤 Submit Assignment"}
              </button>
            </div>
          }
        >
          <div className={styles.form}>
            {/* Deadline warning */}
            {isLate(submitTarget) && (
              <div style={{
                background: "#fef2f2", border: "1.5px solid #fca5a5",
                borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b",
              }}>
                ⚠️ The deadline has passed — this will be marked as <strong>late</strong>.
              </div>
            )}

            {/* File drop zone */}
            <div
              className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                handleFile(e.dataTransfer.files[0]);
              }}
            >
              <div className={styles.uploadIcon}>
                {form.fileName ? "📎" : "☁️"}
              </div>
              {form.fileName ? (
                <>
                  <p className={styles.uploadText} style={{ color: "#1a6ef5", fontWeight: 600 }}>
                    {form.fileName}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, fileUrl: "", fileName: "" })); }}
                    style={{
                      marginTop: 6, background: "none", border: "none",
                      color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}
                  >
                    ✕ Remove
                  </button>
                </>
              ) : (
                <>
                  <p className={styles.uploadText}>Drop your file here or click to browse</p>
                  <p className={styles.uploadHint}>PDF, DOC, DOCX, images — max 10MB</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Note to Teacher <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span></label>
              <textarea
                rows={3}
                placeholder="Any notes or comments about your submission…"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}