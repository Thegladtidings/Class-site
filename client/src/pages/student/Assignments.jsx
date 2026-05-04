import { useState, useEffect, useRef } from "react";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import styles from "../../css/Studentdashboard.module.css";
import { getAssignments, getMySubmissions } from "../api/studentApi";
import axiosInstance from "../api/Axiosinstance.js";

/* ─────────────────────────────────────────────────────────────
   submitAssignment — sends FormData so multer can read req.file
   We define it here (not in studentApi) so we can strip the
   Content-Type header that the shared axios instance likely sets.
   Without this, the multipart boundary is missing and multer
   sees no file → "No file uploaded".
───────────────────────────────────────────────────────────── */
async function submitAssignment(assignmentId, formData) {
  return axiosInstance.post(
    `/api/assignments/submit/${assignmentId}`,
    formData,
    {
      headers: {
        /* Let the browser set Content-Type automatically.
           If axios has a default "application/json" header it
           will overwrite the multipart boundary — deleting it
           forces the browser to build the correct header.      */
        "Content-Type": undefined,
      },
    }
  );
}

/* ─────────────────────────────────────────── */

const STATUS_META = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "#fffbeb" },
  submitted: { label: "Submitted", color: "#10b981", bg: "#f0fdf4" },
  late:      { label: "Late",      color: "#ef4444", bg: "#fef2f2" },
  graded:    { label: "Graded",    color: "#1a6ef5", bg: "#eff6ff" },
};

export default function StudentAssignments() {
  const [assignments, setAssignments]   = useState([]);
  const [submissions, setSubmissions]   = useState({});
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState("pending");
  const [submitTarget, setSubmitTarget] = useState(null);
  const [form, setForm]                 = useState({ note: "", fileName: "" });
  const [submitting, setSubmitting]     = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const [toast, setToast]               = useState(null);

  const fileRef         = useRef(null);
  const selectedFileRef = useRef(null); // holds the actual File object

  /* ── Load assignments + my submissions ── */
  useEffect(() => {
    async function load() {
      try {
        const [aRes, sRes] = await Promise.all([getAssignments(), getMySubmissions()]);
        const aList = aRes?.data?.assignments ?? [];
        const sList = sRes?.data?.submissions ?? [];

        setAssignments(aList);

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

  /* ── File selection (click or drag) ── */
  function handleFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToast({ msg: "File must be under 10 MB.", type: "error" });
      return;
    }
    selectedFileRef.current = file;
    setForm((p) => ({ ...p, fileName: file.name }));
  }

  /* ── Clear selected file ── */
  function clearFile() {
    selectedFileRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
    setForm((p) => ({ ...p, fileName: "" }));
  }

  /* ── Open submit modal ── */
  function openSubmitModal(assignment) {
    clearFile();
    setForm({ note: "", fileName: "" });
    setSubmitTarget(assignment);
  }

  /* ── Close submit modal ── */
  function closeSubmitModal() {
    clearFile();
    setSubmitTarget(null);
  }

  /* ── Submit to backend ── */
  async function handleSubmit() {
    if (!selectedFileRef.current && !form.note.trim()) {
      setToast({ msg: "Please attach a file or add a note.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      /*
        Build FormData exactly as multer expects:
          field "file"  → the File object  (matches upload.single("file"))
          field "note"  → plain text
      */
      const fd = new FormData();
      if (selectedFileRef.current) {
        fd.append("file", selectedFileRef.current);
      }
      if (form.note.trim()) {
        fd.append("note", form.note.trim());
      }

      const res = await submitAssignment(submitTarget._id, fd);

      /* Update local submissions map with what the server returned */
      const saved = res?.data?.submission ?? {
        _id:         `s${Date.now()}`,
        assignment:  submitTarget._id,
        fileName:    selectedFileRef.current?.name ?? "",
        note:        form.note,
        status:      isLate(submitTarget) ? "late" : "submitted",
        submittedAt: new Date().toISOString(),
      };

      setSubmissions((prev) => ({ ...prev, [String(submitTarget._id)]: saved }));
      setToast({ msg: res?.data?.message ?? "Submitted successfully!", type: "success" });
      closeSubmitModal();
    } catch (err) {
      setToast({
        msg: err?.response?.data?.message || "Submission failed. Please try again.",
        type: "error",
      });
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
    if (sub) return sub.status ?? "submitted";
    return "pending";
  }

  function daysLeft(dueDate) {
    if (!dueDate) return null;
    const diff = new Date(dueDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0)  return { label: `${Math.abs(days)}d overdue`, color: "#ef4444" };
    if (days === 0) return { label: "Due today",                  color: "#f59e0b" };
    return           { label: `${days}d left`,                    color: days <= 2 ? "#f97316" : "#10b981" };
  }

  const pending   = assignments.filter((a) => !submissions[String(a._id)]);
  const submitted = assignments.filter((a) =>  submissions[String(a._id)]);
  const displayed = tab === "pending" ? pending : submitted;

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
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

      {/* Assignment list */}
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
                    {/* Teacher attachment */}
                    {a.attachmentName && (
                      <a
                        href={a.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          marginTop: 6, fontSize: 12, color: "#1a6ef5", fontWeight: 500,
                        }}
                      >
                        📎 {a.attachmentName}
                      </a>
                    )}
                  </div>

                  <span className={styles.pill} style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                </div>

                {/* Submitted work detail */}
                {sub && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px",
                    background: "#f8fafc", borderRadius: 8,
                    border: "1.5px solid #e2e8f0", fontSize: 12,
                  }}>
                    <p style={{ fontWeight: 600, color: "#475569", margin: "0 0 6px" }}>
                      Your submission
                    </p>
                    {sub.fileUrl ? (
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          color: "#1a6ef5", fontWeight: 600, textDecoration: "none",
                          marginBottom: sub.note ? 4 : 0,
                        }}
                      >
                        📎 {sub.fileName ?? "View file"}
                      </a>
                    ) : sub.fileName ? (
                      <p style={{ color: "#1a6ef5", margin: "0 0 4px" }}>📎 {sub.fileName}</p>
                    ) : null}
                    {sub.note && (
                      <p style={{ color: "#475569", margin: 0 }}>💬 {sub.note}</p>
                    )}
                    {sub.grade != null && (
                      <div style={{
                        marginTop: 8, padding: "6px 10px",
                        background: "#f0fdf4", borderRadius: 6,
                        border: "1px solid #86efac",
                      }}>
                        <p style={{ color: "#15803d", fontWeight: 700, margin: "0 0 2px" }}>
                          ✔ Grade: {sub.grade}
                        </p>
                        {sub.teacherRemark && (
                          <p style={{ color: "#166534", margin: 0 }}>
                            💬 {sub.teacherRemark}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.itemActions}>
                  {!sub ? (
                    <button
                      className={styles.primaryBtn}
                      style={{ fontSize: 12, padding: "7px 16px" }}
                      onClick={() => openSubmitModal(a)}
                    >
                      📤 Submit
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      Submitted&nbsp;
                      {sub.submittedAt || sub.createdAt
                        ? new Date(sub.submittedAt ?? sub.createdAt).toLocaleDateString("en-US", {
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

      {/* ════════════════════════════════════════════
          SUBMIT MODAL
      ════════════════════════════════════════════ */}
      {submitTarget && (
        <Modal
          title={`Submit — ${submitTarget.title}`}
          onClose={closeSubmitModal}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={styles.cancelBtn} onClick={closeSubmitModal}>
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Uploading…" : "📤 Submit Assignment"}
              </button>
            </div>
          }
        >
          <div className={styles.form}>

            {/* Late warning */}
            {isLate(submitTarget) && (
              <div style={{
                background: "#fef2f2", border: "1.5px solid #fca5a5",
                borderRadius: 8, padding: "10px 14px",
                fontSize: 13, color: "#991b1b",
              }}>
                ⚠️ The deadline has passed — this will be marked as <strong>late</strong>.
              </div>
            )}

            {/* File drop zone */}
            <div
              className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""}`}
              onClick={() => !form.fileName && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              style={{ cursor: form.fileName ? "default" : "pointer" }}
            >
              <div className={styles.uploadIcon}>
                {form.fileName ? "📎" : "☁️"}
              </div>

              {form.fileName ? (
                /* ── File selected state ── */
                <div style={{ textAlign: "center" }}>
                  <p className={styles.uploadText} style={{ color: "#1a6ef5", fontWeight: 600 }}>
                    {form.fileName}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 8px" }}>
                    {selectedFileRef.current
                      ? `${(selectedFileRef.current.size / 1024).toFixed(0)} KB`
                      : ""}
                  </p>
                  {/* Remove button — stopPropagation so the zone's onClick doesn't fire */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    style={{
                      background: "#fef2f2", border: "1.5px solid #fca5a5",
                      color: "#ef4444", borderRadius: 6,
                      fontSize: 12, fontWeight: 700,
                      padding: "4px 12px", cursor: "pointer",
                    }}
                  >
                    ✕ Remove file
                  </button>
                </div>
              ) : (
                /* ── Empty state ── */
                <>
                  <p className={styles.uploadText}>Drop your file here or click to browse</p>
                  <p className={styles.uploadHint}>PDF, DOC, DOCX, images — max 10 MB</p>
                </>
              )}

              {/* Hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            {/* Note */}
            <div className={styles.formGroup}>
              <label>
                Note to Teacher&nbsp;
                <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
              </label>
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